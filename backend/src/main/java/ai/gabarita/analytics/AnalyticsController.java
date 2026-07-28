package ai.gabarita.analytics;

import ai.gabarita.auth.CurrentUser;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
  private final JdbcClient jdbc;
  private final CurrentUser currentUser;
  AnalyticsController(JdbcClient jdbc,CurrentUser currentUser) { this.jdbc = jdbc;this.currentUser=currentUser; }

  private static final String ATTEMPTS = """
    WITH attempts AS (
      SELECT qp.answered_at,qp.is_correct correct,
        COALESCE(event_topic.title,NULLIF(qp.topic_title,''),q.metadata->>'topic',q.metadata->>'category','Geral') topic,'QUESTIONS' source,0 time_seconds
      FROM quiz_answer_events qp
      JOIN study_plans sp ON sp.id=qp.study_plan_id
      LEFT JOIN roadmap_topics event_topic ON event_topic.id=qp.roadmap_topic_id
      LEFT JOIN questions q ON q.id=CASE WHEN qp.question_id ~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN qp.question_id::uuid ELSE NULL END
      WHERE sp.user_id=:user AND (CAST(:planId AS uuid) IS NULL OR sp.id=CAST(:planId AS uuid))
        AND qp.roadmap_topic_id IS NULL AND qp.answered_at>=CURRENT_DATE-:days
      UNION ALL
      SELECT a.answered_at,COALESCE(a.correct,false),
        COALESCE(q.metadata->>'topic',q.metadata->>'category','Geral'),'SIMULATION',a.time_spent_seconds
      FROM answers a JOIN simulations s ON s.id=a.simulation_id LEFT JOIN questions q ON q.id=a.question_id
      WHERE a.user_id=:user AND (CAST(:planId AS uuid) IS NULL OR s.plan_id=CAST(:planId AS uuid))
        AND a.answered_at>=CURRENT_DATE-:days
    ), session_attempts AS (
      SELECT ss.ended_at answered_at,ss.questions_answered answered,ss.correct_answers correct,
        GREATEST(0,ss.questions_answered-ss.correct_answers) wrong,rt.title topic,ss.effective_seconds time_seconds
      FROM study_sessions ss JOIN roadmap_topics rt ON rt.id=ss.roadmap_topic_id
      WHERE ss.user_id=:user AND ss.session_kind='STUDY' AND ss.status='COMPLETED'
        AND (CAST(:planId AS uuid) IS NULL OR ss.plan_id=CAST(:planId AS uuid))
        AND ss.ended_at>=CURRENT_DATE-:days
    )
    """;

  @GetMapping("/dashboard")
  public Map<String,Object> dashboard(@RequestParam(defaultValue="30") int days,
                                      @RequestParam(required=false) UUID planId) {
    int range=Math.max(7,Math.min(days,365));
    var params=new HashMap<String,Object>();
    params.put("user",currentUser.id());params.put("planId",planId);params.put("days",range);
    var summary=jdbc.sql(ATTEMPTS+"""
      , answer_totals AS (
        SELECT COUNT(*) answered,COUNT(*) FILTER(WHERE correct) correct,
          COUNT(*) FILTER(WHERE NOT correct) wrong,
          COUNT(*) FILTER(WHERE source='QUESTIONS') question_bank_answered,
          COUNT(*) FILTER(WHERE source='SIMULATION') simulation_answered,
          COUNT(*) FILTER(WHERE source='SIMULATION' AND correct) simulation_correct,
          COALESCE(SUM(time_seconds) FILTER(WHERE source='SIMULATION'),0) simulation_seconds
        FROM attempts
      ), session_totals AS (
        SELECT COALESCE(SUM(questions_answered) FILTER(WHERE session_kind='STUDY'),0) answered,
          COALESCE(SUM(correct_answers) FILTER(WHERE session_kind='STUDY'),0) correct,
          COALESCE(SUM(GREATEST(0,questions_answered-correct_answers)) FILTER(WHERE session_kind='STUDY'),0) wrong,
          COALESCE(SUM(effective_seconds) FILTER(WHERE session_kind='STUDY'),0) study_seconds,
          COALESCE(SUM(effective_seconds) FILTER(WHERE session_kind='QUESTIONS'),0) question_practice_seconds,
          COUNT(*) FILTER(WHERE session_kind='STUDY') study_sessions,
          COUNT(*) FILTER(WHERE session_kind='QUESTIONS') question_sessions
        FROM study_sessions WHERE user_id=:user AND status='COMPLETED'
          AND (CAST(:planId AS uuid) IS NULL OR plan_id=CAST(:planId AS uuid)) AND ended_at>=CURRENT_DATE-:days
      ), simulation_totals AS (
        SELECT COUNT(DISTINCT s.id) simulation_sessions FROM simulations s
        WHERE s.user_id=:user AND (CAST(:planId AS uuid) IS NULL OR s.plan_id=CAST(:planId AS uuid))
          AND s.created_at>=CURRENT_DATE-:days
      )
      SELECT a.answered+s.answered answered,a.correct+s.correct correct,a.wrong+s.wrong wrong,
        CASE WHEN a.answered+s.answered=0 THEN 0 ELSE ROUND(100.0*(a.correct+s.correct)/(a.answered+s.answered),1) END accuracy,
        s.study_seconds,s.question_practice_seconds,a.simulation_seconds,
        s.study_seconds+s.question_practice_seconds+a.simulation_seconds total_time_seconds,
        s.study_sessions,s.question_sessions,m.simulation_sessions,
        a.question_bank_answered,a.simulation_answered,a.simulation_correct,s.answered session_questions
      FROM answer_totals a CROSS JOIN session_totals s CROSS JOIN simulation_totals m
      """).params(params).query().singleRow();

    var evolution=jdbc.sql(ATTEMPTS+"""
      , daily AS (
        SELECT answered_at::date day,COUNT(*) answered,COUNT(*) FILTER(WHERE correct) correct,
          COUNT(*) FILTER(WHERE NOT correct) wrong FROM attempts GROUP BY 1
        UNION ALL
        SELECT answered_at::date,SUM(answered),SUM(correct),SUM(wrong) FROM session_attempts GROUP BY 1
      )
      SELECT day,SUM(answered) answered,SUM(correct) correct,SUM(wrong) wrong,
        CASE WHEN SUM(answered)=0 THEN 0 ELSE ROUND(100.0*SUM(correct)/SUM(answered),1) END accuracy
      FROM daily GROUP BY day ORDER BY day
      """).params(params).query().listOfRows();

    var byTopic=jdbc.sql(ATTEMPTS+"""
      , topic_totals AS (
        SELECT topic,COUNT(*) answered,COUNT(*) FILTER(WHERE correct) correct,
          COUNT(*) FILTER(WHERE NOT correct) wrong,0::bigint studied_seconds FROM attempts GROUP BY topic
        UNION ALL
        SELECT topic,SUM(answered),SUM(correct),SUM(wrong),SUM(time_seconds) FROM session_attempts GROUP BY topic
      )
      SELECT topic,SUM(answered) answered,SUM(correct) correct,SUM(wrong) wrong,SUM(studied_seconds) studied_seconds,
        CASE WHEN SUM(answered)=0 THEN 0 ELSE ROUND(100.0*SUM(correct)/SUM(answered),1) END accuracy
      FROM topic_totals GROUP BY topic ORDER BY accuracy DESC,answered DESC,studied_seconds DESC
      """).params(params).query().listOfRows();

    var strong=byTopic.stream().filter(row->number(row,"answered")>=1&&number(row,"accuracy")>=70).limit(5).toList();
    var weak=byTopic.stream().filter(row->number(row,"answered")>=1&&number(row,"accuracy")<70)
      .sorted(Comparator.comparingDouble(row->number(row,"accuracy"))).limit(5).toList();
    Object recommendation=weak.isEmpty()?null:weak.getFirst();

    var result=new LinkedHashMap<String,Object>();
    result.put("periodDays",range);result.put("summary",summary);result.put("evolution",evolution);result.put("byTopic",byTopic);
    result.put("strongTopics",strong);result.put("weakTopics",weak);result.put("recommendation",recommendation);
    return result;
  }

  private double number(Map<String,Object> row,String key) {
    Object value=row.get(key); return value instanceof Number number?number.doubleValue():0;
  }
}

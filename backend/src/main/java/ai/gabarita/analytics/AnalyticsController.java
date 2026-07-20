package ai.gabarita.analytics;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import static ai.gabarita.plan.StudyPlanController.DEMO_USER;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
  private final JdbcClient jdbc;
  AnalyticsController(JdbcClient jdbc) { this.jdbc = jdbc; }

  private static final String ANSWERS = """
    FROM (
      SELECT DISTINCT ON (study_plan_id, question_id) *
      FROM quiz_answer_events
      ORDER BY study_plan_id, question_id, answered_at DESC
    ) qp
    JOIN study_plans sp ON sp.id=qp.study_plan_id
    LEFT JOIN questions q ON q.id=CASE
      WHEN qp.question_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN qp.question_id::uuid ELSE NULL END
    WHERE sp.user_id=:user AND (CAST(:planId AS uuid) IS NULL OR sp.id=CAST(:planId AS uuid))
    """;

  @GetMapping("/dashboard")
  public Map<String,Object> dashboard(@RequestParam(defaultValue="30") int days,
                                      @RequestParam(required=false) UUID planId) {
    int range=Math.max(7,Math.min(days,365));
    var summary=jdbc.sql("""
      SELECT COUNT(*) answered,COUNT(*) FILTER(WHERE qp.is_correct) correct,
      COUNT(*) FILTER(WHERE NOT qp.is_correct) wrong,
      COALESCE(ROUND(100.0*AVG(CASE WHEN qp.is_correct THEN 1 ELSE 0 END),1),0) accuracy
      """+ANSWERS).param("user",DEMO_USER).param("planId",planId).query().singleRow();

    var evolution=jdbc.sql("""
      SELECT qp.answered_at::date day,COUNT(*) answered,COUNT(*) FILTER(WHERE qp.is_correct) correct,
      COUNT(*) FILTER(WHERE NOT qp.is_correct) wrong,
      ROUND(100.0*AVG(CASE WHEN qp.is_correct THEN 1 ELSE 0 END),1) accuracy
      """+ANSWERS+" AND qp.answered_at>=CURRENT_DATE-:days GROUP BY qp.answered_at::date ORDER BY day")
      .param("user",DEMO_USER).param("planId",planId).param("days",range).query().listOfRows();

    var byTopic=jdbc.sql("""
      SELECT COALESCE(q.metadata->>'topic',q.metadata->>'category','Geral') topic,COUNT(*) answered,
      COUNT(*) FILTER(WHERE qp.is_correct) correct,COUNT(*) FILTER(WHERE NOT qp.is_correct) wrong,
      ROUND(100.0*AVG(CASE WHEN qp.is_correct THEN 1 ELSE 0 END),1) accuracy
      """+ANSWERS+" GROUP BY 1 ORDER BY accuracy DESC,answered DESC")
      .param("user",DEMO_USER).param("planId",planId).query().listOfRows();

    var strong=byTopic.stream().filter(row->number(row,"answered")>=1&&number(row,"accuracy")>=70).limit(5).toList();
    var weak=byTopic.stream().filter(row->number(row,"answered")>=1&&number(row,"accuracy")<70)
      .sorted(Comparator.comparingDouble(row->number(row,"accuracy"))).limit(5).toList();
    Object recommendation=weak.isEmpty()?null:weak.getFirst();

    return new LinkedHashMap<>() {{
      put("periodDays",range); put("summary",summary); put("evolution",evolution); put("byTopic",byTopic);
      put("strongTopics",strong); put("weakTopics",weak); put("recommendation",recommendation);
    }};
  }

  private double number(Map<String,Object> row,String key) {
    Object value=row.get(key); return value instanceof Number number?number.doubleValue():0;
  }
}

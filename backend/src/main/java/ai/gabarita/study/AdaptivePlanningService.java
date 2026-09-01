package ai.gabarita.study;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deterministic support for the fixed, verticalized schedule. The schedule is
 * generated from the edital weights and availability, then remains stable;
 * progress is recorded without moving future blocks after a missed session.
 */
@Service
public class AdaptivePlanningService {
    static final int WINDOW_DAYS = 14;
    static final int STUDY_BLOCK_MINUTES = 60;
    static final int EXTRA_QUESTION_MINUTES = 0;

    private final JdbcClient jdbc;
    private final ObjectMapper json;

    public AdaptivePlanningService(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @Transactional
    public Map<String,Object> regenerate(UUID planId, UUID userId) {
        PlanProfile profile = profile(planId, userId);
        LocalDate today = userToday(userId);
        return Map.of(
                "planId", planId,
                "blocksCreated", 0,
                "windowStart", today,
                "windowEnd", profile.examDate().minusDays(1),
                "warning", "O cronograma verticalizado é fixo. Nenhum dia futuro foi alterado."
        );
    }

    @Transactional
    public void initialize(UUID planId, UUID userId) {
        profile(planId,userId);
    }

    @Transactional
    public int archiveMissed(UUID planId, UUID userId, LocalDate today) {
        int optional=jdbc.sql("""
            UPDATE daily_tasks SET status='SKIPPED',updated_at=now()
            WHERE user_id=:u AND plan_id=:p AND task_date<:today
              AND activity_type='QUESTIONS' AND is_optional AND status NOT IN('COMPLETED','SKIPPED')
            """).param("u",userId).param("p",planId).param("today",today).update();
        int missed=jdbc.sql("""
            UPDATE daily_tasks SET status='SKIPPED',updated_at=now()
            WHERE user_id=:u AND plan_id=:p AND task_date<:today AND NOT outside_planned_hours
              AND status NOT IN('COMPLETED','SKIPPED','CANCELLED')
            """).param("u",userId).param("p",planId).param("today",today).update();
        return optional+missed;
    }

    @Transactional
    public void ensureWindow(UUID planId, UUID userId) {
        profile(planId,userId);
    }

    public boolean isStudyDay(UUID planId, UUID userId, LocalDate date) {
        return profile(planId, userId).minutesFor(date) > 0;
    }

    /**
     * Removes unstarted tasks that may have been created by an older schedule on
     * weekdays the student did not select, then fills the valid study days again.
     */
    @Transactional
    public boolean enforceAvailability(UUID planId, UUID userId, LocalDate from) {
        PlanProfile profile = profile(planId, userId);
        LocalDate today = userToday(userId);
        LocalDate start = from.isBefore(today) ? today : from;
        LocalDate end = windowEnd(profile, today);
        if (start.isAfter(end)) return false;
        int removed = 0;
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (profile.minutesFor(date) > 0) continue;
            removed += jdbc.sql("""
                DELETE FROM daily_tasks dt
                WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date
                  AND dt.status IN('PENDING','AVAILABLE','BLOCKED','MOVED')
                  AND NOT EXISTS (SELECT 1 FROM study_sessions ss WHERE ss.daily_task_id=dt.id)
                """).param("u",userId).param("p",planId).param("date",date).update();
        }
        return removed > 0;
    }

    public LocalDate nextStudyDate(UUID planId, UUID userId, LocalDate after) {
        PlanProfile profile = profile(planId, userId);
        LocalDate date = after.plusDays(1);
        while (!date.isAfter(profile.examDate()) && profile.minutesFor(date) == 0) date = date.plusDays(1);
        if (date.isAfter(profile.examDate())) throw new IllegalStateException("Não há outro dia de estudo antes da prova.");
        return date;
    }

    public Map<String,Object> summary(UUID planId, UUID userId, LocalDate date) {
        PlanProfile profile = profile(planId, userId);
        int declared = profile.minutesFor(date);
        Capacity capacity = capacityFor(declared);
        LocalDate nextStudyDate = nextStudyDateOnOrAfter(profile, date);
        var result = new LinkedHashMap<String,Object>();
        result.put("declared_minutes", declared);
        result.put("planned_capacity_minutes", capacity.plannedMinutes());
        result.put("reserve_minutes", capacity.reserveMinutes());
        result.put("practice_minutes", capacity.practiceMinutes());
        result.put("window_days", Math.max(0,ChronoUnit.DAYS.between(date,profile.examDate())));
        result.put("window_end", profile.examDate().minusDays(1));
        result.put("is_study_day", declared > 0);
        result.put("next_study_date", nextStudyDate);
        result.put("strategy", "Cronograma verticalizado fixo, com sessões de 50+10 distribuídas pelo peso do edital. Conteúdos perdidos ficam como não estudados e não alteram os dias seguintes.");
        return result;
    }

    private LocalDate nextStudyDateOnOrAfter(PlanProfile profile, LocalDate date) {
        LocalDate last = profile.examDate().minusDays(1);
        for (LocalDate candidate = date; !candidate.isAfter(last); candidate = candidate.plusDays(1))
            if (profile.minutesFor(candidate) > 0) return candidate;
        return null;
    }

    private int rebuild(UUID planId, UUID userId, PlanProfile profile, LocalDate requestedStart) {
        LocalDate today = userToday(userId);
        LocalDate start = requestedStart.isBefore(today) ? today : requestedStart;
        LocalDate end = windowEnd(profile, today);
        if (start.isAfter(end)) return 0;

        jdbc.sql("""
            DELETE FROM daily_tasks dt
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date BETWEEN :start AND :end
              AND dt.status IN('PENDING','AVAILABLE','BLOCKED')
              AND NOT EXISTS (SELECT 1 FROM study_sessions ss WHERE ss.daily_task_id=dt.id)
            """).param("u",userId).param("p",planId).param("start",start).param("end",end).update();

        List<Map<String,Object>> topics = candidates(planId, userId, profile.examDate(), today);
        if (topics.isEmpty()) return 0;
        Map<UUID,Integer> scheduled = historicalScheduling(planId,userId);
        topics.forEach(topic->{
            int missed=number(topic,"missed_count");
            if(missed>0)scheduled.put((UUID)topic.get("id"),-missed);
        });
        Set<UUID> plannedReviews = new HashSet<>();
        int created = 0;
        for (LocalDate date : studyDates(profile, start, end)) {
            int occupied = jdbc.sql("""
                SELECT COALESCE(SUM(planned_minutes),0) FROM daily_tasks
                WHERE user_id=:u AND plan_id=:p AND task_date=:date
                  AND status<>'SKIPPED' AND NOT outside_planned_hours
                """).param("u",userId).param("p",planId).param("date",date).query(Integer.class).single();
            Capacity capacity = capacityFor(profile.minutesFor(date));
            int remaining = Math.max(0, capacity.plannedMinutes() - occupied);
            if (remaining < STUDY_BLOCK_MINUTES) continue;

            int contentMinutes = remaining;
            int position = jdbc.sql("SELECT COALESCE(MAX(position),-1)+1 FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date")
                    .param("u",userId).param("p",planId).param("date",date).query(Integer.class).single();
            Map<String,Object> lastTopic = null;

            while (contentMinutes >= STUDY_BLOCK_MINUTES) {
                Map<String,Object> topic = choose(topics,scheduled,date,plannedReviews);
                if (topic == null) break;
                UUID topicId = (UUID) topic.get("id");
                int minutes = STUDY_BLOCK_MINUTES;
                boolean review = reviewDue(topic,date)&&!plannedReviews.contains(topicId);
                String activity = review ? "REVIEW" : "THEORY";
                int cycle = nextCycle(userId, planId, date, topicId, activity);
                double score = score(topic, scheduled.getOrDefault(topicId, 0),date,plannedReviews.contains(topicId));
                insertTask(userId, planId, date, position++, topic, activity, minutes,
                        review ? Math.max(5, number(topic,"review_question_goal")) : number(topic,"recommended_questions"),
                        score, false, false, cycle);
                created++;
                contentMinutes -= minutes;
                scheduled.merge(topicId, 1, Integer::sum);
                if(review)plannedReviews.add(topicId);
                lastTopic = topic;
            }

            if (lastTopic != null) {
                Map<String,Object> topic = lastTopic;
                UUID topicId = (UUID) topic.get("id");
                int cycle = nextCycle(userId, planId, date, topicId, "QUESTIONS");
                insertTask(userId, planId, date, position, topic, "QUESTIONS", EXTRA_QUESTION_MINUTES,
                        10, score(topic, scheduled.getOrDefault(topicId,0),date), true, true, cycle);
                created++;
            }
            releaseFirst(userId, planId, date);
        }
        jdbc.sql("UPDATE study_plans SET updated_at=now(),version=version+1 WHERE id=:p").param("p",planId).update();
        return created;
    }

    private void insertTask(UUID userId, UUID planId, LocalDate date, int position, Map<String,Object> topic,
            String activity, int minutes, int questions, double priority, boolean optional, boolean outside, int cycle) {
        jdbc.sql("""
            INSERT INTO daily_tasks(id,user_id,plan_id,roadmap_topic_id,task_date,position,activity_type,
              planned_minutes,question_goal,minimum_accuracy,priority,status,is_optional,outside_planned_hours,cycle_index)
            VALUES(gen_random_uuid(),:u,:p,:t,:date,:position,:activity,:minutes,:questions,:accuracy,:priority,
              'PENDING',:optional,:outside,:cycle)
            ON CONFLICT(user_id,plan_id,task_date,roadmap_topic_id,activity_type,cycle_index) DO NOTHING
            """).param("u",userId).param("p",planId).param("t",topic.get("id")).param("date",date)
                .param("position",position).param("activity",activity).param("minutes",minutes)
                .param("questions",Math.max(0,questions)).param("accuracy",topic.get("minimum_accuracy"))
                .param("priority",priority).param("optional",optional).param("outside",outside).param("cycle",cycle).update();
    }

    private void releaseFirst(UUID userId, UUID planId, LocalDate date) {
        int active = jdbc.sql("""
            SELECT COUNT(*) FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date
              AND status IN('AVAILABLE','IN_PROGRESS')
            """).param("u",userId).param("p",planId).param("date",date).query(Integer.class).single();
        if (active > 0) return;
        jdbc.sql("""
            UPDATE daily_tasks SET status='AVAILABLE',updated_at=now() WHERE id=(
              SELECT id FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date
                AND status='PENDING' ORDER BY position LIMIT 1)
            """).param("u",userId).param("p",planId).param("date",date).update();
    }

    private List<Map<String,Object>> candidates(UUID planId, UUID userId, LocalDate examDate, LocalDate today) {
        return jdbc.sql("""
            SELECT rt.id,rt.title,rt.subject_name,rt.planned_minutes,rt.recommended_questions,
              rt.minimum_accuracy,rt.priority,rt.difficulty,rt.position,tp.status,tp.mastery,tp.attempts,
              rt.priority/COUNT(*) OVER(PARTITION BY rt.subject_name) edital_share,
              (SELECT COUNT(*) FROM daily_tasks missed WHERE missed.user_id=:u AND missed.plan_id=:p
                AND missed.roadmap_topic_id=rt.id AND missed.task_date<:today AND missed.status='MOVED') missed_count,
              COALESCE(due.question_goal,0) review_question_goal,due.scheduled_date review_scheduled_date,
              (due.roadmap_topic_id IS NOT NULL) review_due,
              COALESCE(GREATEST(0,:today-due.scheduled_date),0) overdue_days,
              :exam-:today days_to_exam
            FROM roadmap_topics rt
            JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            LEFT JOIN LATERAL (
              SELECT r.roadmap_topic_id,r.question_goal,r.scheduled_date
              FROM reviews r WHERE r.user_id=:u AND r.roadmap_topic_id=rt.id
                AND r.status IN('SCHEDULED','AVAILABLE','OVERDUE') AND r.scheduled_date<=:window
              ORDER BY r.scheduled_date LIMIT 1
            ) due ON true
            WHERE rt.plan_id=:p AND rt.active
            ORDER BY rt.position
            """).param("u",userId).param("p",planId).param("today",today)
                .param("window",today.plusDays(WINDOW_DAYS)).param("exam",examDate).query().listOfRows();
    }

    private Map<String,Object> choose(List<Map<String,Object>> topics,Map<UUID,Integer> scheduled,
            LocalDate date,Set<UUID> plannedReviews) {
        return topics.stream().max(Comparator.comparingDouble(topic -> score(topic,
                        scheduled.getOrDefault((UUID)topic.get("id"),0),date,
                        plannedReviews.contains((UUID)topic.get("id")))))
                .orElse(null);
    }

    static double score(Map<String,Object> topic, int scheduledCount,LocalDate date) {
        return score(topic,scheduledCount,date,false);
    }

    private static double score(Map<String,Object> topic, int scheduledCount,LocalDate date,boolean reviewPlanned) {
        double weight = Math.max(.01,decimal(topic,"edital_share") > 0
                ? decimal(topic,"edital_share") : decimal(topic,"priority"));
        double mastery = decimal(topic,"mastery");
        int overdue = number(topic,"overdue_days");
        double review = reviewDue(topic,date)&&!reviewPlanned ? 200 + Math.min(100, overdue * 5) : 0;
        double missed = scheduledCount < 0 ? 20_000d : 0;
        double firstCoverage = scheduledCount == 0 && number(topic,"missed_count")==0 ? 10_000d : 0;
        return firstCoverage + missed + review + weight * 100d / (Math.max(0,scheduledCount) + 1d)
                - mastery * .02 - number(topic,"position") * .001;
    }

    private static boolean reviewDue(Map<String,Object> topic,LocalDate date){
        Object raw=topic.get("review_scheduled_date");
        if(raw==null)return false;
        LocalDate scheduled=localDate(raw);
        return !scheduled.isAfter(date);
    }

    static Capacity capacityFor(int declaredMinutes) {
        if (declaredMinutes <= 0) return new Capacity(0,0,0);
        int planned = declaredMinutes / STUDY_BLOCK_MINUTES * STUDY_BLOCK_MINUTES;
        return new Capacity(planned,declaredMinutes-planned,EXTRA_QUESTION_MINUTES);
    }

    private Map<UUID,Integer> historicalScheduling(UUID planId,UUID userId) {
        var counts=jdbc.sql("""
            SELECT roadmap_topic_id,COUNT(*) blocks FROM daily_tasks
            WHERE user_id=:u AND plan_id=:p AND activity_type<>'QUESTIONS' AND status='COMPLETED'
            GROUP BY roadmap_topic_id
            """).param("u",userId).param("p",planId).query().listOfRows();
        var result=new HashMap<UUID,Integer>();
        counts.forEach(row->result.put((UUID)row.get("roadmap_topic_id"),number(row,"blocks")));
        return result;
    }

    private PlanProfile profile(UUID planId, UUID userId) {
        Map<String,Object> row = jdbc.sql("""
            SELECT exam_date,block_minutes,settings::text settings_json
            FROM study_plans WHERE id=:p AND user_id=:u
            """).param("p",planId).param("u",userId).query().listOfRows().stream().findFirst()
                .orElseThrow(() -> new NoSuchElementException("Plano não encontrado"));
        try {
            JsonNode settings = json.readTree(String.valueOf(row.get("settings_json")));
            JsonNode preferences = settings.path("preferences");
            Set<Integer> weekdays = new LinkedHashSet<>();
            preferences.path("selectedWeekdays").forEach(day -> weekdays.add(day.asInt()));
            Map<Integer,Integer> minutes = new HashMap<>();
            preferences.path("hoursByWeekday").fields().forEachRemaining(entry ->
                    minutes.put(Integer.parseInt(entry.getKey()), Math.max(0, (int)Math.round(entry.getValue().asDouble() * 60))));
            int fallbackHours = settings.path("hoursPerDay").asInt(2);
            if (weekdays.isEmpty()) weekdays.addAll(List.of(1,2,3,4,5));
            for (int weekday : weekdays) minutes.putIfAbsent(weekday, Math.max(1,fallbackHours) * 60);
            return new PlanProfile(localDate(row.get("exam_date")), STUDY_BLOCK_MINUTES, weekdays, minutes);
        } catch (Exception error) {
            throw new IllegalStateException("Não foi possível ler a disponibilidade deste plano.", error);
        }
    }

    private List<LocalDate> studyDates(PlanProfile profile, LocalDate start, LocalDate end) {
        if (start.isAfter(end)) return List.of();
        return start.datesUntil(end.plusDays(1)).filter(date -> profile.minutesFor(date) > 0).toList();
    }

    private LocalDate windowEnd(PlanProfile profile, LocalDate today) {
        return today.plusDays(WINDOW_DAYS - 1L).isBefore(profile.examDate())
                ? today.plusDays(WINDOW_DAYS - 1L) : profile.examDate().minusDays(1);
    }

    private boolean hasStartedTasks(UUID userId, UUID planId, LocalDate date) {
        return jdbc.sql("""
            SELECT COUNT(*) FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date
              AND status IN('IN_PROGRESS','COMPLETED')
            """).param("u",userId).param("p",planId).param("date",date).query(Integer.class).single() > 0;
    }

    private int nextCycle(UUID userId, UUID planId, LocalDate date, UUID topicId, String activity) {
        return jdbc.sql("""
            SELECT COALESCE(MAX(cycle_index),-1)+1 FROM daily_tasks
            WHERE user_id=:u AND plan_id=:p AND task_date=:date AND roadmap_topic_id=:topic AND activity_type=:activity
            """).param("u",userId).param("p",planId).param("date",date).param("topic",topicId)
                .param("activity",activity).query(Integer.class).single();
    }

    private LocalDate userToday(UUID userId) {
        String zone = jdbc.sql("SELECT timezone FROM users WHERE id=:u").param("u",userId)
                .query(String.class).optional().orElse("America/Maceio");
        return LocalDate.now(ZoneId.of(zone));
    }

    private static LocalDate localDate(Object value) {
        if (value instanceof LocalDate date) return date;
        if (value instanceof java.sql.Date date) return date.toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }
    private static int number(Map<String,Object> row,String key) { Object value=row.get(key);return value instanceof Number n?n.intValue():0; }
    private static double decimal(Map<String,Object> row,String key) { Object value=row.get(key);return value instanceof Number n?n.doubleValue():0; }

    record Capacity(int plannedMinutes,int reserveMinutes,int practiceMinutes) {}
    private record PlanProfile(LocalDate examDate,int blockMinutes,Set<Integer> weekdays,Map<Integer,Integer> minutesByWeekday) {
        int minutesFor(LocalDate date) {
            int javascriptDay = date.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : date.getDayOfWeek().getValue();
            return weekdays.contains(javascriptDay) ? minutesByWeekday.getOrDefault(javascriptDay,0) : 0;
        }
    }
}

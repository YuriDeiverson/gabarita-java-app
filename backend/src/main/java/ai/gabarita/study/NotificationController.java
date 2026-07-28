package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import jakarta.validation.Valid;
import java.time.LocalTime;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    public NotificationController(JdbcClient jdbc,CurrentUser currentUser){this.jdbc=jdbc;this.currentUser=currentUser;}
    public record Preferences(Boolean enabled, LocalTime preferredTime,Integer sessionReminderMinutes,
      Boolean streakReminder,Boolean reviewReminder,Boolean dailySummary,Boolean weeklySummary,Boolean pushEnabled){}
    @GetMapping public List<Map<String,Object>> all(@RequestParam(defaultValue="false") boolean unreadOnly){
        return jdbc.sql("SELECT * FROM notifications WHERE user_id=:u AND scheduled_for<=now() AND (:all OR read_at IS NULL) ORDER BY read_at NULLS FIRST,scheduled_for DESC LIMIT 100")
          .param("u",currentUser.id()).param("all",!unreadOnly).query().listOfRows();
    }
    @PatchMapping("/{id}/read") public Map<String,Object> read(@PathVariable UUID id){
        var rows=jdbc.sql("UPDATE notifications SET read_at=COALESCE(read_at,now()),status='READ' WHERE id=:id AND user_id=:u RETURNING *")
          .param("id",id).param("u",currentUser.id()).query().listOfRows();
        if(rows.isEmpty())throw new NoSuchElementException("Notificação não encontrada");return rows.getFirst();
    }
    @PatchMapping("/read-all") public Map<String,Object> readAll(){int changed=jdbc.sql("UPDATE notifications SET read_at=COALESCE(read_at,now()),status='READ' WHERE user_id=:u AND read_at IS NULL AND scheduled_for<=now()").param("u",currentUser.id()).update();return Map.of("updated",changed);}
    @GetMapping("/preferences") public Map<String,Object> preferences(){
        jdbc.sql("INSERT INTO user_notification_preferences(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING").param("u",currentUser.id()).update();
        return jdbc.sql("SELECT * FROM user_notification_preferences WHERE user_id=:u").param("u",currentUser.id()).query().singleRow();
    }
    @PutMapping("/preferences") public Map<String,Object> preferences(@Valid @RequestBody Preferences p){
        jdbc.sql("""
          INSERT INTO user_notification_preferences(user_id,enabled,preferred_time,session_reminder_minutes,streak_reminder,review_reminder,daily_summary,weekly_summary,push_enabled)
          VALUES(:u,COALESCE(:enabled,true),COALESCE(:time,'19:00'),COALESCE(:minutes,10),COALESCE(:streak,true),COALESCE(:review,true),COALESCE(:daily,true),COALESCE(:weekly,true),COALESCE(:push,false))
          ON CONFLICT(user_id) DO UPDATE SET enabled=COALESCE(:enabled,user_notification_preferences.enabled),preferred_time=COALESCE(:time,user_notification_preferences.preferred_time),
            session_reminder_minutes=COALESCE(:minutes,user_notification_preferences.session_reminder_minutes),streak_reminder=COALESCE(:streak,user_notification_preferences.streak_reminder),
            review_reminder=COALESCE(:review,user_notification_preferences.review_reminder),daily_summary=COALESCE(:daily,user_notification_preferences.daily_summary),
            weekly_summary=COALESCE(:weekly,user_notification_preferences.weekly_summary),push_enabled=COALESCE(:push,user_notification_preferences.push_enabled),updated_at=now()
          """).param("u",currentUser.id()).param("enabled",p.enabled()).param("time",p.preferredTime()).param("minutes",p.sessionReminderMinutes())
          .param("streak",p.streakReminder()).param("review",p.reviewReminder()).param("daily",p.dailySummary()).param("weekly",p.weeklySummary()).param("push",p.pushEnabled()).update();
        return preferences();
    }
}

package ai.gabarita.study;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class StudyAutomationScheduler {
    private final JdbcClient jdbc; private final EngagementService engagement;
    public StudyAutomationScheduler(JdbcClient jdbc,EngagementService engagement){this.jdbc=jdbc;this.engagement=engagement;}

    @Scheduled(cron="0 5 0 * * *",zone="America/Maceio")
    public void rollover(){
        jdbc.sql("UPDATE study_plans SET status='ARCHIVED',is_primary=false,updated_at=now() WHERE status='ACTIVE' AND exam_date<(now() AT TIME ZONE 'America/Maceio')::date").update();
        jdbc.sql("UPDATE reviews SET status='OVERDUE' WHERE status IN('SCHEDULED','AVAILABLE') AND scheduled_date<CURRENT_DATE").update();
        jdbc.sql("UPDATE reviews SET status='AVAILABLE' WHERE status='SCHEDULED' AND scheduled_date=CURRENT_DATE").update();
        var plans=jdbc.sql("SELECT user_id,id FROM study_plans WHERE is_primary AND status='ACTIVE'").query().listOfRows();
        plans.forEach(p->engagement.protectPreviousStudyDay((UUID)p.get("user_id"),(UUID)p.get("id")));
    }
}

package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.simple.JdbcClient;

@RestController
@RequestMapping("/api/roadmaps")
public class RoadmapController {
    private final DailyStudyService daily; private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    public RoadmapController(DailyStudyService daily,JdbcClient jdbc,CurrentUser currentUser){this.daily=daily;this.jdbc=jdbc;this.currentUser=currentUser;}
    @GetMapping public List<Map<String,Object>> all(){return jdbc.sql("SELECT id,title,exam_date,status,is_primary FROM study_plans WHERE user_id=:u AND status='ACTIVE' ORDER BY is_primary DESC,updated_at DESC").param("u",currentUser.id()).query().listOfRows();}
    @GetMapping("/{planId}") public List<Map<String,Object>> roadmap(@PathVariable UUID planId){return daily.roadmap(planId);}
    @GetMapping("/{planId}/progress") public List<Map<String,Object>> progress(@PathVariable UUID planId){return daily.roadmap(planId);}
}

package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class EngagementController {
    private final EngagementService engagement; private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    public EngagementController(EngagementService engagement,JdbcClient jdbc,CurrentUser currentUser){this.engagement=engagement;this.jdbc=jdbc;this.currentUser=currentUser;}
    @GetMapping("/streak") public Map<String,Object> streak(){return engagement.streak(currentUser.id());}
    @GetMapping("/streak/history") public List<Map<String,Object>> history(){return jdbc.sql("SELECT * FROM streak_days WHERE user_id=:u ORDER BY study_date DESC LIMIT 90").param("u",currentUser.id()).query().listOfRows();}
    @GetMapping("/streak/protections") public List<Map<String,Object>> protections(){return engagement.protections(currentUser.id());}
    @GetMapping("/experience") public Map<String,Object> experience(){return engagement.experience(currentUser.id());}
    @GetMapping("/experience/history") public List<Map<String,Object>> xp(){return jdbc.sql("SELECT * FROM xp_transactions WHERE user_id=:u ORDER BY created_at DESC LIMIT 100").param("u",currentUser.id()).query().listOfRows();}
}

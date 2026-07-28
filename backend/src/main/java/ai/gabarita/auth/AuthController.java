package ai.gabarita.auth;

import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final CurrentUser currentUser;
    public AuthController(CurrentUser currentUser) { this.currentUser=currentUser; }
    @GetMapping("/me") public Map<String,Object> me() { return currentUser.profile(); }
}

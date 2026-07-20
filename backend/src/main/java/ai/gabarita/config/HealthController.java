package ai.gabarita.config;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class HealthController {
    @GetMapping("/api/health") public Map<String,Object> health() {
        return Map.of("status","ok","service","gabarita-java-api","timestamp", Instant.now());
    }
}

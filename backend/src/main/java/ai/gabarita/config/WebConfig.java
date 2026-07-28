package ai.gabarita.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${app.cors-origins}") private String origins;

    @Override public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = Arrays.stream(origins.split(","))
                .map(WebConfig::normalizeOrigin)
                .filter(origin -> !origin.isBlank())
                .distinct()
                .toArray(String[]::new);

        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    private static String normalizeOrigin(String origin) {
        String normalized = origin.trim().replaceAll("^[\\\"']|[\\\"']$", "");
        return normalized.replaceAll("/+$", "");
    }
}

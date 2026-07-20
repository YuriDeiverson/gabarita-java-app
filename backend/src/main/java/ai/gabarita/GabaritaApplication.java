package ai.gabarita;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GabaritaApplication {
    public static void main(String[] args) {
        configureRailwayDatabaseUrl();
        SpringApplication.run(GabaritaApplication.class, args);
    }

    private static void configureRailwayDatabaseUrl() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.startsWith("jdbc:")) {
            return;
        }

        URI uri = URI.create(databaseUrl);
        String userInfo = uri.getUserInfo();
        String username = "";
        String password = "";

        if (userInfo != null) {
            String[] credentials = userInfo.split(":", 2);
            username = URLDecoder.decode(credentials[0], StandardCharsets.UTF_8);
            if (credentials.length > 1) {
                password = URLDecoder.decode(credentials[1], StandardCharsets.UTF_8);
            }
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();
        if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
            jdbcUrl += "?" + uri.getQuery();
        }

        System.setProperty("spring.datasource.url", jdbcUrl);
        if (!username.isBlank()) {
            System.setProperty("spring.datasource.username", username);
        }
        System.setProperty("spring.datasource.password", password);
    }
}

package ai.gabarita;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;
import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GabaritaApplication {
    public static void main(String[] args) {
        loadDotEnv();
        configureDatabaseUrl();
        SpringApplication.run(GabaritaApplication.class, args);
    }

    private static void loadDotEnv() {
        Path envFile = Path.of(".env");
        if (!Files.isRegularFile(envFile)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(envFile, StandardCharsets.UTF_8);
            for (String line : lines) {
                String entry = line.trim();
                if (entry.isBlank() || entry.startsWith("#")) {
                    continue;
                }
                if (entry.startsWith("export ")) {
                    entry = entry.substring("export ".length()).trim();
                }

                int separator = entry.indexOf('=');
                if (separator <= 0) {
                    continue;
                }

                String key = entry.substring(0, separator).trim();
                String value = stripMatchingQuotes(entry.substring(separator + 1).trim());
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível ler o arquivo .env do backend", exception);
        }
    }

    private static String stripMatchingQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '\'' && last == '\'') || (first == '"' && last == '"')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private static void configureDatabaseUrl() {
        String databaseUrl = configurationValue("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.startsWith("jdbc:")) {
            return;
        }

        if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
            throw new IllegalArgumentException(
                    "DATABASE_URL deve começar com jdbc:postgresql://, postgresql:// ou postgres://");
        }

        URI uri = URI.create(databaseUrl);
        String userInfo = uri.getRawUserInfo();
        String username = "";
        String password = "";
        boolean passwordInUrl = false;

        if (userInfo != null) {
            String[] credentials = userInfo.split(":", 2);
            username = decodeUriCredential(credentials[0]);
            if (credentials.length > 1) {
                password = decodeUriCredential(credentials[1]);
                passwordInUrl = true;
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
        if (passwordInUrl) {
            System.setProperty("spring.datasource.password", password);
        }
    }

    private static String decodeUriCredential(String value) {
        return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
    }

    private static String configurationValue(String name) {
        String environmentValue = System.getenv(name);
        return environmentValue != null ? environmentValue : System.getProperty(name);
    }
}

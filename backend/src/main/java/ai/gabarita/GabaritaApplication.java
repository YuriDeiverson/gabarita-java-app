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
        
        System.err.println("DEBUG: DATABASE_URL value: [" + databaseUrl + "]");
        
        if (databaseUrl == null) {
            System.err.println("WARNING: DATABASE_URL não está configurada. Usando valores padrão do application.yml.");
            return;
        }

        // Remove espaços extras
        databaseUrl = databaseUrl.trim();
        System.err.println("DEBUG: DATABASE_URL after trim: [" + databaseUrl + "]");

        // Se já começa com jdbc:, não precisa processar
        if (databaseUrl.startsWith("jdbc:")) {
            System.err.println("DATABASE_URL já está no formato JDBC, usando diretamente.");
            return;
        }

        // Se está no formato postgresql:// ou postgres://, converte para JDBC
        if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
            System.err.println("Convertendo DATABASE_URL de postgresql:// para jdbc:postgresql://");
            convertPostgresUrlToJdbc(databaseUrl);
            return;
        }

        System.err.println("WARNING: DATABASE_URL tem formato desconhecido: " + databaseUrl);
    }

    private static void convertPostgresUrlToJdbc(String postgresUrl) {
        try {
            URI uri = URI.create(postgresUrl);
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
            
            System.err.println("URL JDBC gerada: " + jdbcUrl);
        } catch (Exception e) {
            System.err.println("Erro ao converter URL PostgreSQL: " + e.getMessage());
            throw new RuntimeException("Falha ao converter DATABASE_URL para JDBC", e);
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

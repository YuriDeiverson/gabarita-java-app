package ai.gabarita.auth;

import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Value("${app.auth.supabase-url:}") private String supabaseUrl;
    @Value("${app.auth.jwks-url:}") private String configuredJwksUrl;
    @Value("${app.auth.jwt-secret:}") private String legacySecret;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/health", "/actuator/health", "/actuator/info").permitAll()
                .anyRequest().authenticated());
        http.oauth2ResourceServer(resource -> resource.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder() {
        String issuer = normalizedSupabaseUrl() + "/auth/v1";
        NimbusJwtDecoder decoder;
        if (legacySecret != null && !legacySecret.isBlank()) {
            var key = new SecretKeySpec(legacySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        } else {
            String jwks = configuredJwksUrl == null || configuredJwksUrl.isBlank()
                ? issuer + "/.well-known/jwks.json" : configuredJwksUrl.trim();
            decoder = NimbusJwtDecoder.withJwkSetUri(jwks)
                .jwsAlgorithms(algorithms -> {
                    algorithms.add(SignatureAlgorithm.ES256);
                    algorithms.add(SignatureAlgorithm.RS256);
                })
                .build();
        }
        OAuth2TokenValidator<Jwt> issuerValidator = JwtValidators.createDefaultWithIssuer(issuer);
        OAuth2TokenValidator<Jwt> authenticatedRole = jwt -> "authenticated".equals(jwt.getClaimAsString("role"))
            ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token sem papel authenticated", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator, authenticatedRole));
        return decoder;
    }

    private String normalizedSupabaseUrl() {
        if (supabaseUrl == null || supabaseUrl.isBlank())
            throw new IllegalStateException("SUPABASE_URL é obrigatório para validar a autenticação.");
        return supabaseUrl.trim().replaceAll("/+$", "");
    }
}

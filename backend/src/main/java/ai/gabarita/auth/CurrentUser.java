package ai.gabarita.auth;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class CurrentUser {
    private final JdbcClient jdbc;
    private UUID id;
    private Jwt jwt;

    public CurrentUser(JdbcClient jdbc) { this.jdbc = jdbc; }

    public UUID id() {
        if (id != null) return id;
        Jwt token = token();
        try { id = UUID.fromString(token.getSubject()); }
        catch (Exception error) { throw new AccessDeniedException("Identificador do usuário inválido"); }
        String email = token.getClaimAsString("email");
        String name = displayName(token, email);
        jdbc.sql("""
            INSERT INTO users(id,name,email) VALUES(:id,:name,:email)
            ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=COALESCE(EXCLUDED.email,users.email)
            """).param("id",id).param("name",name).param("email",email).update();
        return id;
    }

    public String email() { return token().getClaimAsString("email"); }
    public String name() { return displayName(token(), email()); }
    public boolean isAdmin() {
        Object metadata = token().getClaim("app_metadata");
        if (metadata instanceof Map<?,?> map) return Boolean.TRUE.equals(map.get("admin")) || "admin".equals(map.get("role"));
        return false;
    }
    public void requireAdmin() {
        if (!isAdmin()) throw new AccessDeniedException("Esta operação exige permissão administrativa");
    }
    public Map<String,Object> profile() {
        return Map.of("id",id().toString(),"email",Objects.toString(email(),""),"name",name(),"admin",isAdmin());
    }

    private Jwt token() {
        if (jwt != null) return jwt;
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication) || !authentication.isAuthenticated())
            throw new AccessDeniedException("Usuário não autenticado");
        jwt = jwtAuthentication.getToken();
        return jwt;
    }

    private String displayName(Jwt token,String email) {
        Object metadata = token.getClaim("user_metadata");
        if (metadata instanceof Map<?,?> map) {
            for (String key : List.of("full_name","name","display_name")) {
                Object value=map.get(key); if(value!=null&&!value.toString().isBlank())return value.toString().trim();
            }
        }
        return email == null || email.isBlank() ? "Estudante" : email.substring(0,email.indexOf('@')>0?email.indexOf('@'):email.length());
    }
}

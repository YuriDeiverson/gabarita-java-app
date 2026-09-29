package ai.gabarita.auth;

import java.util.*;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class CurrentUser {
    private final JdbcClient jdbc;
    private final String firebaseProjectId;
    private UUID id;
    private Jwt jwt;

    public CurrentUser(JdbcClient jdbc, @Value("${app.auth.firebase-project-id:}") String firebaseProjectId) { 
        this.jdbc = jdbc; 
        this.firebaseProjectId = firebaseProjectId;
    }

    public UUID id() {
        if (id != null) return id;
        Jwt token = token();
        
        // Check if this is a Firebase token
        if (isFirebaseToken(token)) {
            id = handleFirebaseUser(token);
        } else {
            // Legacy Supabase token handling
            try { id = UUID.fromString(token.getSubject()); }
            catch (Exception error) { throw new AccessDeniedException("Identificador do usuário inválido"); }
            String email = token.getClaimAsString("email");
            String name = displayName(token, email);
            jdbc.sql("""
                INSERT INTO users(id,name,email,auth_provider,auth_id) 
                VALUES(:id,:name,:email,'supabase',:auth_id)
                ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=COALESCE(EXCLUDED.email,users.email)
                """).param("id",id).param("name",name).param("email",email).param("auth_id",id.toString()).update();
        }
        return id;
    }

    private UUID handleFirebaseUser(Jwt token) {
        String firebaseUid = token.getSubject();
        String email = token.getClaimAsString("email");
        String name = displayName(token, email);
        
        // Try to find existing user by auth_id (Firebase UID)
        UUID existingId = jdbc.sql("SELECT id FROM users WHERE auth_id = :auth_id")
            .param("auth_id", firebaseUid)
            .query(UUID.class)
            .optional()
            .orElse(null);
        
        if (existingId != null) {
            // Update existing user
            jdbc.sql("""
                UPDATE users SET name = :name, email = COALESCE(:email, email) 
                WHERE id = :id
                """).param("id", existingId).param("name", name).param("email", email).update();
            return existingId;
        }
        
        // Create new user with generated UUID
        UUID newId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO users(id,name,email,auth_provider,auth_id) 
            VALUES(:id,:name,:email,'firebase',:auth_id)
            """).param("id", newId).param("name", name).param("email", email).param("auth_id", firebaseUid).update();
        return newId;
    }

    private boolean isFirebaseToken(Jwt token) {
        String issuer = token.getIssuer() != null ? token.getIssuer().toString() : null;
        // Firebase issuer format: https://securetoken.google.com/{project-id}
        String expectedIssuer = "https://securetoken.google.com/" + firebaseProjectId;
        return expectedIssuer.equals(issuer) && 
               firebaseProjectId != null && !firebaseProjectId.isBlank();
    }

    public String email() { return token().getClaimAsString("email"); }
    public String name() { return displayName(token(), email()); }
    public boolean isAdmin() {
        // Check database admin status first
        Boolean dbAdmin = jdbc.sql("SELECT is_admin FROM users WHERE id = :id")
            .param("id", id())
            .query(Boolean.class)
            .optional()
            .orElse(false);
        
        if (dbAdmin) return true;
        
        // Firebase admin check through custom claims (legacy support)
        Object adminClaim = token().getClaim("admin");
        if (adminClaim instanceof Boolean) return (Boolean) adminClaim;
        
        // Legacy Supabase admin check
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
        
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication))
            throw new AccessDeniedException("Usuário não autenticado - requer token Firebase válido");
        jwt = jwtAuthentication.getToken();
        return jwt;
    }

    private String displayName(Jwt token,String email) {
        // Firebase token structure
        Object nameClaim = token.getClaim("name");
        if (nameClaim != null && !nameClaim.toString().isBlank()) return nameClaim.toString().trim();
        
        // Legacy Supabase token structure
        Object metadata = token.getClaim("user_metadata");
        if (metadata instanceof Map<?,?> map) {
            for (String key : List.of("full_name","name","display_name")) {
                Object value=map.get(key); if(value!=null&&!value.toString().isBlank())return value.toString().trim();
            }
        }
        return email == null || email.isBlank() ? "Estudante" : email.substring(0,email.indexOf('@')>0?email.indexOf('@'):email.length());
    }
}

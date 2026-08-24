package ai.gabarita.shared;

import ai.gabarita.admin.QuestionImportException;
import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Pattern CONSTRAINT_PATTERN = Pattern.compile("constraint \\\"([a-zA-Z0-9_]+)\\\"");
    @ExceptionHandler(QuestionImportException.class)
    ResponseEntity<?> questionImportInvalid(QuestionImportException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "error", ex.getMessage(), "code", "QUESTION_IMPORT_INVALID",
                "item", ex.item(), "timestamp", Instant.now()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> notFound(NoSuchElementException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<?> conflict(IllegalStateException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> duplicate(DataIntegrityViolationException ex) {
        String detail = NestedExceptionUtils.getMostSpecificCause(ex).getMessage();
        String message = "Não foi possível salvar este registro por causa de um vínculo de dados existente.";
        if (detail != null && detail.contains("users_email_key")) {
            message = "Há um perfil anterior associado a este e-mail. Exclua o perfil antigo antes de criar uma nova conta.";
        } else if (detail != null && detail.contains("one_primary_plan_per_user")) {
            message = "Já existe uma preparação principal para esta conta. Atualize a página e tente novamente.";
        } else if (detail != null && detail.contains("study_plans")) {
            message = "Não foi possível criar a preparação porque há um plano ou dado vinculado inconsistente nesta conta.";
        } else {
            Matcher matcher = CONSTRAINT_PATTERN.matcher(detail == null ? "" : detail);
            if (matcher.find()) {
                message = "Não foi possível salvar este registro. Restrição do banco: " + matcher.group(1) + ".";
            }
        }
        return error(HttpStatus.CONFLICT, message);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> forbidden(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        var fields = ex.getBindingResult().getFieldErrors().stream()
                .collect(java.util.stream.Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a));
        return ResponseEntity.badRequest().body(Map.of("error", "Dados inválidos", "fields", fields, "timestamp", Instant.now()));
    }

    private ResponseEntity<?> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message, "status", status.value(), "timestamp", Instant.now()));
    }
}

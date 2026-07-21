package ai.gabarita.question;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private final JdbcClient jdbc; private final ObjectMapper json;
    QuestionController(JdbcClient jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}
    public record LegacyQuestion(@NotNull Object id,@NotBlank String category,@NotBlank String text,
      @NotBlank String correct,String explanation,String reference,String passageId){}
    @GetMapping("/course/{courseId}") public List<Map<String,Object>> byCourse(@PathVariable String courseId) {
      return jdbc.sql("""
        SELECT q.id::text id,COALESCE(q.metadata->>'category',s.name,'Geral') category,q.statement text,
        CASE WHEN q.status='ANNULLED' THEN 'Anulada' ELSE q.correct_answer #>> '{}' END correct,
        COALESCE(q.explanation,'') explanation,COALESCE(q.metadata->>'reference',q.board,'') reference,
        COALESCE(q.passage_id::text,NULLIF(q.metadata->>'passageId','')) passage_id,
        p.title passage_title,p.content passage_content
        FROM questions q LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN passages p ON p.id=q.passage_id
        WHERE q.metadata->>'courseId'=:course AND q.status IN('ACTIVE','ANNULLED') ORDER BY q.created_at,q.id
        """).param("course",courseId).query().listOfRows();
    }
    @PostMapping("/import/legacy") public Map<String,Object> importLegacy(@RequestParam String courseId,@RequestBody List<LegacyQuestion> questions){
      int imported=0,updated=0;
      for(var q:questions){
        String legacyId=String.valueOf(q.id());
        var existing=jdbc.sql("SELECT id FROM questions WHERE metadata->>'courseId'=:course AND metadata->>'legacyId'=:legacy LIMIT 1")
          .param("course",courseId).param("legacy",legacyId).query(UUID.class).list();
        String answer;try{answer=json.writeValueAsString(q.correct());}catch(Exception e){throw new IllegalArgumentException("Gabarito inválido");}
        String metadata;try{metadata=json.writeValueAsString(Map.of("courseId",courseId,"legacyId",legacyId,"category",q.category(),"topic",q.category(),"reference",q.reference()==null?"":q.reference(),"passageId",q.passageId()==null?"":q.passageId()));}catch(Exception e){throw new IllegalArgumentException("Metadados inválidos");}
        String status="Anulada".equalsIgnoreCase(q.correct())?"ANNULLED":"ACTIVE";
        if(existing.isEmpty()){
          jdbc.sql("INSERT INTO questions(id,board,type,statement,explanation,status,correct_answer,metadata) VALUES(gen_random_uuid(),'CEBRASPE','TRUE_FALSE',:text,:explanation,:status,CAST(:answer AS jsonb),CAST(:metadata AS jsonb))")
            .param("text",q.text()).param("explanation",q.explanation()).param("status",status).param("answer",answer).param("metadata",metadata).update();imported++;
        }else{
          jdbc.sql("UPDATE questions SET statement=:text,explanation=:explanation,status=:status,correct_answer=CAST(:answer AS jsonb),metadata=CAST(:metadata AS jsonb),updated_at=now() WHERE id=:id")
            .param("text",q.text()).param("explanation",q.explanation()).param("status",status).param("answer",answer).param("metadata",metadata).param("id",existing.getFirst()).update();updated++;
        }
      }
      return Map.of("imported",imported,"updated",updated,"total",questions.size());
    }
}

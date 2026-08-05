package ai.gabarita.question;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.sql.Types;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private final JdbcClient jdbc; private final ObjectMapper json;
    private final CurrentUser currentUser;
    QuestionController(JdbcClient jdbc,ObjectMapper json,CurrentUser currentUser){this.jdbc=jdbc;this.json=json;this.currentUser=currentUser;}
    public record LegacyQuestion(@NotNull Object id,@NotBlank String category,String topic,@NotBlank String text,
      @NotBlank String correct,String explanation,String reference,String passageId){}
    public record ReportRequest(@NotBlank String questionId,String courseId,@NotBlank String text,String category,
      String reference,@NotBlank String reason,String details){}
    public record QuestionNoteRequest(@NotBlank @Size(max=180) String questionId,@Size(max=120) String courseId,
      @NotBlank String text,@Size(max=180) String category,@Size(max=220) String topic,@Size(max=300) String reference,
      @NotBlank @Size(max=4000) String note){}
    @GetMapping("/course/{courseId}") public List<Map<String,Object>> byCourse(@PathVariable String courseId) {
      return jdbc.sql("""
        SELECT q.id::text id,COALESCE(q.metadata->>'category',s.name,'Geral') category,
        COALESCE(NULLIF(q.metadata->>'topic',''),q.metadata->>'category',s.name,'Geral') topic,q.statement text,
        q.board,q.type,
        CASE WHEN q.status='ANNULLED' THEN 'Anulada' ELSE q.correct_answer #>> '{}' END correct,
        COALESCE(q.explanation,'') explanation,COALESCE(q.metadata->>'reference',q.board,'') reference,
        COALESCE(q.passage_id::text,NULLIF(q.metadata->>'passageId','')) passage_id,
        p.title passage_title,p.content passage_content,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
          FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options
        FROM questions q LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN passages p ON p.id=q.passage_id
        WHERE q.metadata->>'courseId'=:course AND q.status IN('ACTIVE','ANNULLED') ORDER BY q.created_at,q.id
        """).param("course",courseId).query().listOfRows();
    }
    @PostMapping("/import/legacy") public Map<String,Object> importLegacy(@RequestParam String courseId,@RequestBody List<LegacyQuestion> questions){
      currentUser.requireAdmin();
      int imported=0,updated=0;
      for(var q:questions){
        String legacyId=String.valueOf(q.id());
        var existing=jdbc.sql("SELECT id FROM questions WHERE metadata->>'courseId'=:course AND metadata->>'legacyId'=:legacy LIMIT 1")
          .param("course",courseId).param("legacy",legacyId).query(UUID.class).list();
        String answer;try{answer=json.writeValueAsString(q.correct());}catch(Exception e){throw new IllegalArgumentException("Gabarito inválido");}
        String metadata;try{metadata=json.writeValueAsString(Map.of("courseId",courseId,"legacyId",legacyId,"category",q.category(),"topic",q.topic()==null||q.topic().isBlank()?q.category():q.topic(),"reference",q.reference()==null?"":q.reference(),"passageId",q.passageId()==null?"":q.passageId()));}catch(Exception e){throw new IllegalArgumentException("Metadados inválidos");}
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

    @PostMapping("/reports")
    public Map<String,Object> report(@Valid @RequestBody ReportRequest r){
      UUID user=currentUser.id();UUID questionId=null;
      try{UUID candidate=UUID.fromString(r.questionId());
        if(jdbc.sql("SELECT COUNT(*) FROM questions WHERE id=:id").param("id",candidate).query(Integer.class).single()>0)questionId=candidate;
      }catch(IllegalArgumentException ignored){}
      String reason=reportReason(r.reason());String course=text(r.courseId());String questionKey=course+":"+r.questionId().trim();
      String snapshot;
      try{snapshot=json.writeValueAsString(Map.of("id",r.questionId().trim(),"courseId",course,"text",r.text().trim(),
        "category",text(r.category()),"reference",text(r.reference())));}catch(Exception error){throw new IllegalArgumentException("Sinalização inválida");}
      return jdbc.sql("""
        INSERT INTO question_reports(question_id,question_key,reporter_user_id,reason,details,question_snapshot)
        VALUES(:question,:key,:user,:reason,:details,CAST(:snapshot AS jsonb))
        ON CONFLICT(reporter_user_id,question_key) WHERE status='PENDING'
        DO UPDATE SET reason=EXCLUDED.reason,details=EXCLUDED.details,question_snapshot=EXCLUDED.question_snapshot,updated_at=now()
        RETURNING id::text id,status,reason,created_at
        """).param("question",questionId,Types.OTHER).param("key",questionKey).param("user",user).param("reason",reason)
        .param("details",text(r.details())).param("snapshot",snapshot).query().singleRow();
    }

    @GetMapping("/notes")
    public List<Map<String,Object>> notes(){UUID user=currentUser.id();return jdbc.sql("""
      SELECT id::text id,question_id,course_id,question_text,category,topic,reference,note,created_at,updated_at
      FROM user_question_notes WHERE user_id=:user ORDER BY updated_at DESC
      """).param("user",user).query().listOfRows();}

    @PutMapping("/notes")
    public Map<String,Object> saveNote(@Valid @RequestBody QuestionNoteRequest r){UUID user=currentUser.id();
      String course=text(r.courseId());String questionId=r.questionId().trim();String key=course+":"+questionId;
      return jdbc.sql("""
        INSERT INTO user_question_notes(user_id,question_key,question_id,course_id,question_text,category,topic,reference,note)
        VALUES(:user,:key,:question,:course,:text,:category,:topic,:reference,:note)
        ON CONFLICT(user_id,question_key) DO UPDATE SET question_text=EXCLUDED.question_text,category=EXCLUDED.category,
          topic=EXCLUDED.topic,reference=EXCLUDED.reference,note=EXCLUDED.note,updated_at=now()
        RETURNING id::text id,question_id,course_id,question_text,category,topic,reference,note,created_at,updated_at
        """).param("user",user).param("key",key).param("question",questionId).param("course",course)
        .param("text",r.text().trim()).param("category",text(r.category())).param("topic",text(r.topic()))
        .param("reference",text(r.reference())).param("note",r.note().trim()).query().singleRow();}

    @DeleteMapping("/notes") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteNote(@RequestParam @Size(max=180) String questionId,@RequestParam(required=false) @Size(max=120) String courseId){
      UUID user=currentUser.id();String key=text(courseId)+":"+questionId.trim();
      jdbc.sql("DELETE FROM user_question_notes WHERE user_id=:user AND question_key=:key")
        .param("user",user).param("key",key).update();}

    private String reportReason(String value){String reason=value.trim().toUpperCase(Locale.ROOT);
      if(!Set.of("ANSWER","STATEMENT","EXPLANATION","OUTDATED","OTHER").contains(reason))throw new IllegalArgumentException("Motivo de sinalização inválido");return reason;}
    private String text(String value){return value==null?"":value.trim();}
}

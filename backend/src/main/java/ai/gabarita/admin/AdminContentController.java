package ai.gabarita.admin;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Types;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/content")
public class AdminContentController {
    private final JdbcClient jdbc;private final CurrentUser currentUser;private final ObjectMapper json;
    public AdminContentController(JdbcClient jdbc,CurrentUser currentUser,ObjectMapper json){this.jdbc=jdbc;this.currentUser=currentUser;this.json=json;}

    public record PassageRequest(@NotBlank String title,@NotBlank String content,String source){}
    public record OptionRequest(@NotBlank String label,@NotBlank String text){}
    public record QuestionRequest(@NotBlank String courseId,@NotBlank String category,String topic,@NotBlank String board,
      @NotBlank String type,@NotBlank String text,@NotBlank String correct,String explanation,String reference,
      UUID passageId,List<@Valid OptionRequest> options,String status){}
    public record QuestionBatchRequest(@NotEmpty @Size(max=500) List<@Valid QuestionRequest> questions){}
    public record ReportReviewRequest(@Pattern(regexp="RESOLVED|DISMISSED") String status,String adminNote){}

    @GetMapping("/passages") public List<Map<String,Object>> passages(){currentUser.requireAdmin();
        return jdbc.sql("SELECT id::text id,title,content,COALESCE(source,'') source FROM passages ORDER BY title,id").query().listOfRows();}

    @PostMapping("/passages") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createPassage(@Valid @RequestBody PassageRequest r){currentUser.requireAdmin();
        return jdbc.sql("INSERT INTO passages(id,title,content,source) VALUES(gen_random_uuid(),:title,:content,:source) RETURNING id::text id,title,content,source")
                .param("title",r.title().trim()).param("content",r.content().trim()).param("source",text(r.source())).query().singleRow();}

    @PutMapping("/passages/{id}") public Map<String,Object> updatePassage(@PathVariable UUID id,@Valid @RequestBody PassageRequest r){currentUser.requireAdmin();
        return jdbc.sql("UPDATE passages SET title=:title,content=:content,source=:source WHERE id=:id RETURNING id::text id,title,content,source")
                .param("title",r.title().trim()).param("content",r.content().trim()).param("source",text(r.source())).param("id",id).query().singleRow();}

    @DeleteMapping("/passages/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deletePassage(@PathVariable UUID id){currentUser.requireAdmin();
        jdbc.sql("UPDATE questions SET passage_id=NULL WHERE passage_id=:id").param("id",id).update();
        jdbc.sql("DELETE FROM passages WHERE id=:id").param("id",id).update();}

    @GetMapping("/questions") public Map<String,Object> questions(@RequestParam(required=false) String query,
      @RequestParam(required=false) String courseId,@RequestParam(required=false) String area,
      @RequestParam(defaultValue="1") @Min(1) int page,
      @RequestParam(defaultValue="10") @Min(1) @Max(50) int pageSize){currentUser.requireAdmin();
        String search=text(query);String course=text(courseId);String normalizedArea=text(area);int offset=(page-1)*pageSize;
        String sql="""
          SELECT q.id,q.board,q.type,q.statement,q.explanation,q.status,q.correct_answer #>> '{}' correct,
            q.passage_id,q.metadata::text metadata_json,p.title passage_title,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
              FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options_json,
            (SELECT COUNT(*) FROM question_reports qr WHERE qr.question_id=q.id AND qr.status='PENDING') pending_reports
          FROM questions q LEFT JOIN passages p ON p.id=q.passage_id
          WHERE (:course='' OR q.metadata->>'courseId'=:course)
            AND (:area='' OR q.metadata->>'category'=:area)
            AND (:search='' OR q.statement ILIKE :pattern OR q.id::text ILIKE :pattern OR q.board ILIKE :pattern
              OR q.metadata->>'category' ILIKE :pattern OR q.metadata->>'topic' ILIKE :pattern
              OR q.metadata->>'reference' ILIKE :pattern)
          ORDER BY pending_reports DESC,q.updated_at DESC,q.created_at DESC LIMIT :pageSize OFFSET :offset
          """;
        var rows=jdbc.sql(sql).param("course",course).param("area",normalizedArea).param("search",search).param("pattern","%"+search+"%")
          .param("pageSize",pageSize).param("offset",offset)
          .query().listOfRows();var result=new ArrayList<Map<String,Object>>();
        for(var row:rows)result.add(question(row));
        int total=jdbc.sql("""
          SELECT COUNT(*) FROM questions q
          WHERE (:course='' OR q.metadata->>'courseId'=:course)
            AND (:area='' OR q.metadata->>'category'=:area)
            AND (:search='' OR q.statement ILIKE :pattern OR q.id::text ILIKE :pattern OR q.board ILIKE :pattern
              OR q.metadata->>'category' ILIKE :pattern OR q.metadata->>'topic' ILIKE :pattern
              OR q.metadata->>'reference' ILIKE :pattern)
          """).param("course",course).param("area",normalizedArea).param("search",search).param("pattern","%"+search+"%")
          .query(Integer.class).single();
        var areaRows=jdbc.sql("""
          SELECT DISTINCT BTRIM(metadata->>'category') area FROM questions
          WHERE (:course='' OR metadata->>'courseId'=:course)
            AND COALESCE(BTRIM(metadata->>'category'),'')<>'' ORDER BY area
          """).param("course",course).query().listOfRows();
        var areas=areaRows.stream().map(row->String.valueOf(row.get("area"))).toList();
        int totalPages=total==0?0:(int)Math.ceil(total/(double)pageSize);
        return Map.of("items",result,"page",page,"pageSize",pageSize,"total",total,"totalPages",totalPages,"areas",areas);}

    @GetMapping("/question-reports") public List<Map<String,Object>> reports(@RequestParam(defaultValue="PENDING") String status){currentUser.requireAdmin();
        String normalized=status.trim().toUpperCase(Locale.ROOT);
        if(!Set.of("PENDING","RESOLVED","DISMISSED","ALL").contains(normalized))throw new IllegalArgumentException("Situação de sinalização inválida");
        var rows=jdbc.sql("""
          SELECT r.id::text id,r.question_id::text question_id,r.question_key,r.reason,r.details,r.status,r.admin_note,
            r.created_at,r.updated_at,u.name reporter_name,u.email reporter_email,
            COALESCE(q.statement,r.question_snapshot->>'text','Questão indisponível') question_text,
            COALESCE(q.metadata->>'courseId',r.question_snapshot->>'courseId','') course_id,
            COALESCE(q.metadata->>'category',r.question_snapshot->>'category','') category,
            COALESCE(q.metadata->>'reference',r.question_snapshot->>'reference','') reference
          FROM question_reports r JOIN users u ON u.id=r.reporter_user_id LEFT JOIN questions q ON q.id=r.question_id
          WHERE (:status='ALL' OR r.status=:status) ORDER BY CASE WHEN r.status='PENDING' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 500
          """).param("status",normalized).query().listOfRows();
        var result=new ArrayList<Map<String,Object>>();for(var row:rows){var item=new LinkedHashMap<String,Object>();
          item.put("id",row.get("id"));item.put("questionId",row.get("question_id"));item.put("questionKey",row.get("question_key"));
          item.put("questionText",row.get("question_text"));item.put("courseId",row.get("course_id"));item.put("category",row.get("category"));
          item.put("reference",row.get("reference"));item.put("reason",row.get("reason"));item.put("details",row.get("details"));
          item.put("status",row.get("status"));item.put("adminNote",row.get("admin_note"));item.put("reporterName",row.get("reporter_name"));
          item.put("reporterEmail",row.get("reporter_email"));item.put("createdAt",row.get("created_at"));item.put("updatedAt",row.get("updated_at"));result.add(item);}
        return result;}

    @PatchMapping("/question-reports/{id}") public Map<String,Object> reviewReport(@PathVariable UUID id,@Valid @RequestBody ReportReviewRequest r){currentUser.requireAdmin();
        int changed=jdbc.sql("""
          UPDATE question_reports SET status=:status,admin_note=:note,reviewed_by=:admin,updated_at=now() WHERE id=:id
          """).param("status",r.status()).param("note",text(r.adminNote())).param("admin",currentUser.id()).param("id",id).update();
        if(changed==0)throw new NoSuchElementException("Sinalização não encontrada");return Map.of("id",id.toString(),"status",r.status());}

    @PostMapping("/questions") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createQuestion(@Valid @RequestBody QuestionRequest r){currentUser.requireAdmin();UUID id=UUID.randomUUID();
        saveQuestion(id,r,false);return questionById(id);}

    @PostMapping("/questions/batch") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createQuestions(@Valid @RequestBody QuestionBatchRequest request){currentUser.requireAdmin();
        var ids=new ArrayList<String>();int index=0;
        for(var question:request.questions()){
            UUID id=UUID.randomUUID();
            try{saveQuestion(id,question,false);}
            catch(RuntimeException error){throw new IllegalArgumentException("Questão "+(index+1)+": "+fallback(error.getMessage(),"dados inválidos"),error);}
            ids.add(id.toString());index++;
        }
        return Map.of("imported",ids.size(),"ids",ids);
    }

    @PutMapping("/questions/{id}") @Transactional
    public Map<String,Object> updateQuestion(@PathVariable UUID id,@Valid @RequestBody QuestionRequest r){currentUser.requireAdmin();
        saveQuestion(id,r,true);return questionById(id);}

    @DeleteMapping("/questions/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteQuestion(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM questions WHERE id=:id").param("id",id).update();}

    private void saveQuestion(UUID id,QuestionRequest r,boolean update){
        validateQuestion(r);
        String answer;String metadata;
        try{answer=json.writeValueAsString(r.correct().trim());metadata=json.writeValueAsString(Map.of(
                "courseId",r.courseId().trim(),"category",r.category().trim(),"topic",fallback(r.topic(),r.category()),"reference",text(r.reference())));}
        catch(Exception error){throw new IllegalArgumentException("Questão inválida");}
        String status="Anulada".equalsIgnoreCase(r.correct())?"ANNULLED":fallback(r.status(),"ACTIVE").toUpperCase(Locale.ROOT);
        if(update){
            int changed=jdbc.sql("""
              UPDATE questions SET board=:board,type=:type,statement=:statement,explanation=:explanation,status=:status,
                correct_answer=CAST(:answer AS jsonb),metadata=CAST(:metadata AS jsonb),passage_id=:passage,updated_at=now() WHERE id=:id
              """).param("board",r.board().trim()).param("type",questionType(r)).param("statement",r.text().trim())
              .param("explanation",text(r.explanation())).param("status",status).param("answer",answer).param("metadata",metadata)
              .param("passage",r.passageId(),Types.OTHER).param("id",id).update();
            if(changed==0)throw new NoSuchElementException("Questão não encontrada");
            jdbc.sql("DELETE FROM question_options WHERE question_id=:id").param("id",id).update();
        }else jdbc.sql("""
              INSERT INTO questions(id,board,type,statement,explanation,status,correct_answer,metadata,passage_id)
              VALUES(:id,:board,:type,:statement,:explanation,:status,CAST(:answer AS jsonb),CAST(:metadata AS jsonb),:passage)
              """).param("id",id).param("board",r.board().trim()).param("type",questionType(r)).param("statement",r.text().trim())
              .param("explanation",text(r.explanation())).param("status",status).param("answer",answer).param("metadata",metadata)
              .param("passage",r.passageId(),Types.OTHER).update();
        int position=0;if(r.options()!=null)for(var option:r.options())jdbc.sql("""
          INSERT INTO question_options(id,question_id,label,content,position) VALUES(gen_random_uuid(),:question,:label,:content,:position)
          """).param("question",id).param("label",option.label().trim().toUpperCase(Locale.ROOT)).param("content",option.text().trim()).param("position",position++).update();
    }

    private String questionType(QuestionRequest r){return r.options()!=null&&!r.options().isEmpty()?"MULTIPLE_CHOICE":r.type().trim().toUpperCase(Locale.ROOT);}
    private void validateQuestion(QuestionRequest r){String type=r.type().trim().toUpperCase(Locale.ROOT);String correct=r.correct().trim();
        if("Anulada".equalsIgnoreCase(correct))return;
        if("TRUE_FALSE".equals(type)){if(!Set.of("Certo","Errado").contains(correct))throw new IllegalArgumentException("Questões de certo ou errado devem usar o gabarito Certo ou Errado");return;}
        if(!"MULTIPLE_CHOICE".equals(type))throw new IllegalArgumentException("Tipo de questão inválido");
        if(r.options()==null||r.options().size()<2)throw new IllegalArgumentException("Informe pelo menos duas alternativas");
        if(r.options().stream().noneMatch(option->option.label().equalsIgnoreCase(correct)))throw new IllegalArgumentException("O gabarito deve corresponder à letra de uma alternativa");}
    private Map<String,Object> questionById(UUID id){var row=jdbc.sql("""
      SELECT q.id,q.board,q.type,q.statement,q.explanation,q.status,q.correct_answer #>> '{}' correct,
        q.passage_id,q.metadata::text metadata_json,p.title passage_title,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
          FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options_json
      FROM questions q LEFT JOIN passages p ON p.id=q.passage_id WHERE q.id=:id
      """).param("id",id).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Questão não encontrada"));return question(row);}
    @SuppressWarnings("unchecked") private Map<String,Object> question(Map<String,Object> row){
        Map<String,Object> metadata=Map.of();try{metadata=json.readValue(String.valueOf(row.get("metadata_json")),Map.class);}catch(Exception ignored){}
        UUID id=(UUID)row.get("id");List<Map<String,Object>> options=List.of();
        try{options=json.readValue(String.valueOf(row.get("options_json")),List.class);}catch(Exception ignored){}
        var item=new LinkedHashMap<String,Object>();item.put("id",id.toString());item.put("courseId",metadata.getOrDefault("courseId",""));
        item.put("category",metadata.getOrDefault("category","Geral"));item.put("topic",metadata.getOrDefault("topic",metadata.getOrDefault("category","Geral")));
        item.put("board",row.get("board"));item.put("type",row.get("type"));item.put("text",row.get("statement"));item.put("correct",row.get("correct"));
        item.put("explanation",row.get("explanation"));item.put("reference",metadata.getOrDefault("reference",""));item.put("status",row.get("status"));
        item.put("pendingReports",row.getOrDefault("pending_reports",0));
        item.put("passageId",row.get("passage_id")==null?null:String.valueOf(row.get("passage_id")));item.put("passageTitle",row.get("passage_title"));item.put("options",options);return item;
    }
    private String text(String value){return value==null?"":value.trim();}private String fallback(String value,String fallback){String text=text(value);return text.isBlank()?fallback:text;}
}

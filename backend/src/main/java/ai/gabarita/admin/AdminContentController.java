package ai.gabarita.admin;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Types;
import java.text.Normalizer;
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
    public record ComparisonRowRequest(@NotBlank String criterion,@NotBlank String left,@NotBlank String right){}
    public record ComparisonHeadersRequest(@NotBlank String criterion,@NotBlank String left,@NotBlank String right){}
    public record QuestionRequest(String courseId,@NotBlank String category,@NotBlank String topic,@NotBlank String board,
      @NotBlank String type,@NotBlank String text,@NotBlank String correct,@NotBlank @Size(max=4000) String explanation,String reference,
      String passageId,String passageTitle,String passageContent,String passageSource,
      @Size(max=240) String detailedTopic,@Size(max=8000) String conceptExplanation,@Size(max=5000) String decisiveEvidence,
      @Size(max=8000) String answerAnalysis,@Size(max=5000) String examTrap,
      @Size(max=3000) String similarQuestionStrategy,
      @Size(max=12) List<@Size(max=600) String> fixationTips,@Valid ComparisonHeadersRequest comparisonHeaders,
      @Size(max=12) List<@Valid ComparisonRowRequest> comparisonRows,
      List<@Valid OptionRequest> options,String status){}
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
            q.detailed_topic,q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,
            q.fixation_tips::text fixation_tips_json,q.comparison_headers::text comparison_headers_json,
            q.comparison_rows::text comparison_rows_json,
            q.passage_id,q.metadata::text metadata_json,p.title passage_title,
            s.id::text subject_id,s.name category,t.id::text topic_id,t.name topic,
            COALESCE(NULLIF(:course,''),(SELECT MIN(qc.course_id) FROM question_courses qc WHERE qc.question_id=q.id),'') course_id,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
              FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options_json,
            (SELECT COUNT(*) FROM question_reports qr WHERE qr.question_id=q.id AND qr.status='PENDING') pending_reports
          FROM questions q LEFT JOIN passages p ON p.id=q.passage_id
          LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=q.topic_id
          WHERE (:course='' OR EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=:course))
            AND (:area='' OR s.name=:area)
            AND (:search='' OR q.statement ILIKE :pattern OR q.id::text ILIKE :pattern OR q.board ILIKE :pattern
              OR s.name ILIKE :pattern OR t.name ILIKE :pattern
              OR q.metadata->>'reference' ILIKE :pattern)
          ORDER BY pending_reports DESC,q.updated_at DESC,q.created_at DESC LIMIT :pageSize OFFSET :offset
          """;
        var rows=jdbc.sql(sql).param("course",course).param("area",normalizedArea).param("search",search).param("pattern","%"+search+"%")
          .param("pageSize",pageSize).param("offset",offset)
          .query().listOfRows();var result=new ArrayList<Map<String,Object>>();
        for(var row:rows)result.add(question(row));
        int total=jdbc.sql("""
          SELECT COUNT(*) FROM questions q
          WHERE (:course='' OR EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=:course))
            AND (:area='' OR EXISTS(SELECT 1 FROM subjects filter_subject WHERE filter_subject.id=q.subject_id AND filter_subject.name=:area))
            AND (:search='' OR q.statement ILIKE :pattern OR q.id::text ILIKE :pattern OR q.board ILIKE :pattern
              OR EXISTS(SELECT 1 FROM subjects search_subject WHERE search_subject.id=q.subject_id AND search_subject.name ILIKE :pattern)
              OR EXISTS(SELECT 1 FROM topics search_topic WHERE search_topic.id=q.topic_id AND search_topic.name ILIKE :pattern)
              OR q.metadata->>'reference' ILIKE :pattern)
          """).param("course",course).param("area",normalizedArea).param("search",search).param("pattern","%"+search+"%")
          .query(Integer.class).single();
        var areaRows=jdbc.sql("""
          SELECT DISTINCT s.name area FROM questions q JOIN subjects s ON s.id=q.subject_id
          WHERE (:course='' OR EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=:course))
            AND s.active ORDER BY area
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
            COALESCE(r.question_snapshot->>'courseId',(SELECT MIN(qc.course_id) FROM question_courses qc WHERE qc.question_id=q.id),'') course_id,
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
        return questionById(saveQuestion(id,r,false));}

    @PostMapping("/questions/batch") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createQuestions(@Valid @RequestBody QuestionBatchRequest request){currentUser.requireAdmin();
        var ids=new ArrayList<String>();int index=0;
        for(var question:request.questions()){
            UUID id=UUID.randomUUID();
            try{id=saveQuestion(id,question,false);}
            catch(IllegalArgumentException error){throw new QuestionImportException(index+1,fallback(error.getMessage(),"dados inválidos"));}
            catch(RuntimeException error){throw new QuestionImportException(index+1,"não foi possível validar os dados informados");}
            ids.add(id.toString());index++;
        }
        return Map.of("imported",ids.size(),"ids",ids);
    }

    @PutMapping("/questions/{id}") @Transactional
    public Map<String,Object> updateQuestion(@PathVariable UUID id,@Valid @RequestBody QuestionRequest r){currentUser.requireAdmin();
        saveQuestion(id,r,true);return questionById(id);}

    @DeleteMapping("/questions/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteQuestion(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM questions WHERE id=:id").param("id",id).update();}

    private UUID saveQuestion(UUID id,QuestionRequest r,boolean update){
        validateQuestion(r);
        validateDetailedGuide(r);
        TaxonomySelection taxonomy=resolveTaxonomy(r);
        String statement=canonicalStatement(r.text());
        String detailedTopic=canonicalDetailedTopic(r.detailedTopic(),r.category(),r.topic(),taxonomy.subjectName(),taxonomy.topicName());
        String answer;String metadata;String fixationTips;String comparisonHeaders;String comparisonRows;
        try{answer=json.writeValueAsString(r.correct().trim());var metadataValues=new LinkedHashMap<String,Object>();
            metadataValues.put("category",taxonomy.subjectName());metadataValues.put("topic",taxonomy.topicName());
            metadataValues.put("reference",cleanReference(r.reference()));metadata=json.writeValueAsString(metadataValues);
            fixationTips=json.writeValueAsString(cleanPoints(r.fixationTips()));
            comparisonHeaders=json.writeValueAsString(cleanComparisonHeaders(r.comparisonHeaders()));
            comparisonRows=json.writeValueAsString(cleanComparisonRows(r.comparisonRows()));}
        catch(Exception error){throw new IllegalArgumentException("Questão inválida");}
        String status="Anulada".equalsIgnoreCase(r.correct())?"ANNULLED":fallback(r.status(),"ACTIVE").toUpperCase(Locale.ROOT);
        var existing=jdbc.sql("""
          SELECT id FROM questions
          WHERE id<>:id AND status IN('ACTIVE','ANNULLED')
            AND md5(regexp_replace(lower(regexp_replace(statement,
              '[[:space:]]*[(]?[[:space:]]*ref[[:space:]]*:[^)]*[)]?[.[:space:]]*$','','i')),'[^[:alnum:]]','','g'))
              =md5(regexp_replace(lower(:statement),'[^[:alnum:]]','','g'))
          LIMIT 1
        """).param("id",id).param("statement",statement).query(UUID.class).list();
        if(!existing.isEmpty()){
            if(update)throw new IllegalArgumentException("Já existe uma questão com o mesmo enunciado; a referência não cria uma questão nova");
            attachCourse(existing.getFirst(),r.courseId());return existing.getFirst();
        }
        validateGuideSpecificity(id,r,detailedTopic,taxonomy);
        UUID passageId=resolvePassage(r);
        if(update){
            int changed=jdbc.sql("""
              UPDATE questions SET board=:board,type=:type,statement=:statement,explanation=:explanation,status=:status,
                correct_answer=CAST(:answer AS jsonb),metadata=CAST(:metadata AS jsonb),passage_id=:passage,
                subject_id=:subjectId,topic_id=:topicId,
                detailed_topic=:detailedTopic,concept_explanation=:concept,decisive_evidence=:evidence,
                answer_analysis=:analysis,exam_trap=:trap,similar_question_strategy=:strategy,fixation_tips=CAST(:fixationTips AS jsonb),
                comparison_headers=CAST(:comparisonHeaders AS jsonb),comparison_rows=CAST(:comparisonRows AS jsonb),updated_at=now() WHERE id=:id
              """).param("board",r.board().trim()).param("type",questionType(r)).param("statement",statement)
              .param("explanation",text(r.explanation())).param("status",status).param("answer",answer).param("metadata",metadata)
              .param("subjectId",taxonomy.subjectId()).param("topicId",taxonomy.topicId())
              .param("passage",passageId,Types.OTHER).param("detailedTopic",detailedTopic).param("concept",text(r.conceptExplanation()))
              .param("evidence",text(r.decisiveEvidence())).param("analysis",text(r.answerAnalysis())).param("trap",text(r.examTrap()))
              .param("strategy",text(r.similarQuestionStrategy()))
              .param("fixationTips",fixationTips).param("comparisonHeaders",comparisonHeaders).param("comparisonRows",comparisonRows).param("id",id).update();
            if(changed==0)throw new NoSuchElementException("Questão não encontrada");
            jdbc.sql("DELETE FROM question_options WHERE question_id=:id").param("id",id).update();
        }else jdbc.sql("""
              INSERT INTO questions(id,board,type,statement,explanation,status,correct_answer,metadata,passage_id,subject_id,topic_id,
                detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,similar_question_strategy,fixation_tips,comparison_headers,comparison_rows)
              VALUES(:id,:board,:type,:statement,:explanation,:status,CAST(:answer AS jsonb),CAST(:metadata AS jsonb),:passage,:subjectId,:topicId,
                :detailedTopic,:concept,:evidence,:analysis,:trap,:strategy,CAST(:fixationTips AS jsonb),CAST(:comparisonHeaders AS jsonb),CAST(:comparisonRows AS jsonb))
              """).param("id",id).param("board",r.board().trim()).param("type",questionType(r)).param("statement",statement)
              .param("explanation",text(r.explanation())).param("status",status).param("answer",answer).param("metadata",metadata)
              .param("subjectId",taxonomy.subjectId()).param("topicId",taxonomy.topicId())
              .param("passage",passageId,Types.OTHER).param("detailedTopic",detailedTopic).param("concept",text(r.conceptExplanation()))
              .param("evidence",text(r.decisiveEvidence())).param("analysis",text(r.answerAnalysis())).param("trap",text(r.examTrap()))
              .param("strategy",text(r.similarQuestionStrategy()))
              .param("fixationTips",fixationTips).param("comparisonHeaders",comparisonHeaders).param("comparisonRows",comparisonRows).update();
        int position=0;if(r.options()!=null)for(var option:r.options())jdbc.sql("""
          INSERT INTO question_options(id,question_id,label,content,position) VALUES(gen_random_uuid(),:question,:label,:content,:position)
          """).param("question",id).param("label",option.label().trim().toUpperCase(Locale.ROOT)).param("content",option.text().trim()).param("position",position++).update();
        attachCourse(id,r.courseId());return id;
    }

    private void attachCourse(UUID questionId,String courseId){
      String normalized=text(courseId);
      if(normalized.isBlank()) return;
      jdbc.sql("""
        INSERT INTO question_courses(question_id,course_id) VALUES(:question,:course) ON CONFLICT DO NOTHING
        """).param("question",questionId).param("course",normalized).update();
    }

    private record TaxonomySelection(UUID subjectId,UUID topicId,String subjectName,String topicName){}
    private TaxonomySelection resolveTaxonomy(QuestionRequest request){
      String category=request.category().trim();String topic=request.topic().trim();
      var rows=jdbc.sql("""
        SELECT s.id subject_id,t.id topic_id,s.name subject_name,t.name topic_name
        FROM subjects s JOIN topics t ON t.subject_id=s.id
        WHERE s.exam_id IS NULL AND s.active AND t.active
          AND lower(btrim(s.name))=lower(btrim(:category)) AND lower(btrim(t.name))=lower(btrim(:topic))
        LIMIT 1
        """).param("category",category).param("topic",topic).query().listOfRows();
      if(!rows.isEmpty())return taxonomy(rows.getFirst());
      var byTopic=taxonomyByUniqueTopic(topic);if(byTopic!=null)return byTopic;
      for(String segment:text(request.detailedTopic()).split("\\s*→\\s*")){
        if(segment.isBlank()||segment.equalsIgnoreCase(category)||segment.equalsIgnoreCase(topic))continue;
        byTopic=taxonomyByUniqueTopic(segment);if(byTopic!=null)return byTopic;
      }
      return createTaxonomy(category,topic);
    }

    private TaxonomySelection taxonomyByUniqueTopic(String topic){
      var rows=jdbc.sql("""
        SELECT s.id subject_id,t.id topic_id,s.name subject_name,t.name topic_name
        FROM subjects s JOIN topics t ON t.subject_id=s.id
        WHERE s.exam_id IS NULL AND s.active AND t.active AND lower(btrim(t.name))=lower(btrim(:topic))
        ORDER BY s.position,t.position LIMIT 2
        """).param("topic",topic).query().listOfRows();
      return rows.size()==1?taxonomy(rows.getFirst()):null;
    }

    private TaxonomySelection createTaxonomy(String category,String topic){
      String subjectSlug=slug(category);String topicSlug=slug(topic);
      jdbc.sql("""
        INSERT INTO subjects(id,name,slug,area,position,active)
        SELECT gen_random_uuid(),:name,:slug,:area,COALESCE(MAX(position),990)+10,true
        FROM subjects WHERE exam_id IS NULL ON CONFLICT DO NOTHING
        """).param("name",category).param("slug",subjectSlug).param("area",taxonomyArea(category)).update();
      var subject=jdbc.sql("SELECT id,name FROM subjects WHERE exam_id IS NULL AND slug=:slug LIMIT 1")
        .param("slug",subjectSlug).query().singleRow();
      UUID subjectId=(UUID)subject.get("id");
      jdbc.sql("UPDATE subjects SET active=true WHERE id=:id AND NOT active").param("id",subjectId).update();
      jdbc.sql("""
        INSERT INTO topics(id,subject_id,name,slug,position,active)
        SELECT gen_random_uuid(),:subject,:name,:slug,COALESCE(MAX(position),990)+10,true
        FROM topics WHERE subject_id=:subject ON CONFLICT DO NOTHING
        """).param("subject",subjectId).param("name",topic).param("slug",topicSlug).update();
      jdbc.sql("UPDATE topics SET active=true WHERE subject_id=:subject AND slug=:slug AND NOT active")
        .param("subject",subjectId).param("slug",topicSlug).update();
      var row=jdbc.sql("""
        SELECT s.id subject_id,t.id topic_id,s.name subject_name,t.name topic_name
        FROM subjects s JOIN topics t ON t.subject_id=s.id WHERE s.id=:subject AND t.slug=:topicSlug
        """).param("subject",subjectId).param("topicSlug",topicSlug).query().singleRow();
      return taxonomy(row);
    }

    private TaxonomySelection taxonomy(Map<String,Object> row){
      return new TaxonomySelection((UUID)row.get("subject_id"),(UUID)row.get("topic_id"),
        String.valueOf(row.get("subject_name")),String.valueOf(row.get("topic_name")));
    }

    static String canonicalDetailedTopic(String supplied,String suppliedCategory,String suppliedTopic,String subject,String topic){
      String detailed=trimmed(supplied);if(GuideContentQuality.followsHierarchy(detailed,subject,topic))return detailed;
      var segments=new ArrayList<>(Arrays.asList(detailed.split("\\s*→\\s*")));
      if(segments.isEmpty()||(!sameNormalized(segments.getFirst(),suppliedCategory)&&!sameNormalized(segments.getFirst(),subject)))return detailed;
      segments.removeFirst();
      while(!segments.isEmpty()&&List.of(suppliedCategory,suppliedTopic,subject,topic).stream()
        .anyMatch(value->sameNormalized(segments.getFirst(),value)))segments.removeFirst();
      String prefix=subject+" → "+topic;return segments.isEmpty()?prefix:prefix+" → "+String.join(" → ",segments);
    }

    static String slug(String value){
      String normalized=Normalizer.normalize(trimmed(value),Normalizer.Form.NFD).replaceAll("\\p{M}","")
        .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("(^-+|-+$)","");
      if(normalized.isBlank())throw new IllegalArgumentException("Disciplina e assunto devem conter letras ou números");
      return normalized.length()<=140?normalized:normalized.substring(0,140).replaceAll("-+$","");
    }

    private static boolean sameNormalized(String first,String second){return normalized(first).equals(normalized(second));}
    private static String normalized(String value){return Normalizer.normalize(trimmed(value),Normalizer.Form.NFD)
      .replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private static String trimmed(String value){return value==null?"":value.trim();}

    private String taxonomyArea(String category){
      String value=slug(category);return value.matches(".*(informat|comput|sistema|software|dados|tecnolog).*" )
        ?"Tecnologia da Informação":"Outros";
    }

    private UUID resolvePassage(QuestionRequest r){
        String suppliedId=text(r.passageId());String content=text(r.passageContent());
        if(content.isBlank()&&!suppliedId.isBlank()){
            try{return UUID.fromString(suppliedId);}
            catch(IllegalArgumentException ignored){content=suppliedId;}
        }
        if(content.isBlank())return null;
        var existing=jdbc.sql("SELECT id FROM passages WHERE content=:content LIMIT 1")
          .param("content",content).query(UUID.class).list();
        if(!existing.isEmpty())return existing.getFirst();
        return jdbc.sql("""
          INSERT INTO passages(id,title,content,source) VALUES(gen_random_uuid(),:title,:content,:source) RETURNING id
          """).param("title",fallback(r.passageTitle(),"Texto de apoio"))
          .param("content",content).param("source",fallback(r.passageSource(),text(r.reference()))).query(UUID.class).single();
    }

    private String questionType(QuestionRequest r){return r.options()!=null&&!r.options().isEmpty()?"MULTIPLE_CHOICE":r.type().trim().toUpperCase(Locale.ROOT);}
    private void validateDetailedGuide(QuestionRequest r){
        String status="Anulada".equalsIgnoreCase(r.correct())?"ANNULLED":fallback(r.status(),"ACTIVE").toUpperCase(Locale.ROOT);
        if(!Set.of("ACTIVE","ANNULLED").contains(status))return;
        if(text(r.explanation()).length()<40)throw new IllegalArgumentException("O gabarito resumido deve explicar o motivo da resposta (mínimo de 40 caracteres)");
        if(text(r.detailedTopic()).length()<8)throw new IllegalArgumentException("Informe o assunto exato do gabarito completo");
        if(text(r.decisiveEvidence()).length()<40)throw new IllegalArgumentException("Informe o trecho ou a regra decisiva da questão");
        if(text(r.conceptExplanation()).length()<100)throw new IllegalArgumentException("Ensine a base conceitual necessária para resolver a questão (mínimo de 100 caracteres)");
        if(text(r.answerAnalysis()).length()<160)throw new IllegalArgumentException("Apresente uma resolução comentada e específica, ligando o conceito ao item (mínimo de 160 caracteres)");
        if(!text(r.examTrap()).isBlank()&&text(r.examTrap()).length()<40)throw new IllegalArgumentException("Quando informada, a pegadinha deve explicar concretamente o risco de erro (mínimo de 40 caracteres)");
        if(text(r.similarQuestionStrategy()).length()<40)throw new IllegalArgumentException("Ensine um método reutilizável para resolver questões parecidas (mínimo de 40 caracteres)");
        int fixationCount=cleanPoints(r.fixationTips()).size();
        if(fixationCount<2||fixationCount>4)throw new IllegalArgumentException("Informe de duas a quatro conclusões úteis em Síntese para revisão");
        int comparisonCount=cleanComparisonRows(r.comparisonRows()).size();
        if(comparisonCount>0&&comparisonCount<2)throw new IllegalArgumentException("Quando útil, a tabela comparativa deve ter ao menos duas linhas");
        if(comparisonCount>0&&r.comparisonHeaders()==null)throw new IllegalArgumentException("Informe os cabeçalhos da tabela comparativa");
        if(comparisonCount==0&&r.comparisonHeaders()!=null)throw new IllegalArgumentException("Remova os cabeçalhos ou informe as linhas da tabela comparativa");
    }
    private void validateGuideSpecificity(UUID questionId,QuestionRequest r,String detailedTopic,TaxonomySelection taxonomy){
        String status="Anulada".equalsIgnoreCase(r.correct())?"ANNULLED":fallback(r.status(),"ACTIVE").toUpperCase(Locale.ROOT);
        if(!Set.of("ACTIVE","ANNULLED").contains(status))return;
        String analysis=text(r.answerAnalysis()).toLowerCase(Locale.ROOT);
        String strategy=text(r.similarQuestionStrategy()).toLowerCase(Locale.ROOT);
        var tips=cleanPoints(r.fixationTips());
        String completeGuide=String.join(" ",detailedTopic,text(r.conceptExplanation()),
          text(r.decisiveEvidence()),text(r.answerAnalysis()),text(r.examTrap()),
          text(r.similarQuestionStrategy()),String.join(" ",tips));
        if(!GuideContentQuality.followsHierarchy(detailedTopic,taxonomy.subjectName(),taxonomy.topicName()))
          throw new IllegalArgumentException("O assunto detalhado deve começar por Disciplina → Assunto catalogado");
        if(GuideContentQuality.anticipatesAnswer(r.decisiveEvidence()))
          throw new IllegalArgumentException("O ponto decisivo deve apresentar a regra ou evidência sem antecipar o gabarito");
        if(GuideContentQuality.usesAutomaticTemplate(analysis)||analysis.startsWith("1. o item afirma")||analysis.startsWith("1. delimite a afirmação"))
          throw new IllegalArgumentException("Substitua a análise automática por uma explicação específica desta questão");
        if(GuideContentQuality.containsEditorialArtifact(completeGuide))
          throw new IllegalArgumentException("Remova resíduos de geração, emojis, marcação interna ou caracteres alheios ao conteúdo didático");
        if(GuideContentQuality.admitsSourceOrAnswerConflict(completeGuide))
          throw new IllegalArgumentException("A fonte ou o gabarito apresenta conflito; mantenha a questão como rascunho para revisão editorial");
        if(List.of("isole a afirmação central","identifique o mecanismo técnico afirmado","localize o trecho cobrado",
          "separe sujeito, competência, requisito","compare a relação lógica afirmada","traduza os dados para relações").stream().anyMatch(strategy::startsWith))
          throw new IllegalArgumentException("A estratégia para questões parecidas está genérica; relacione-a ao conceito ou erro deste item");
        if(GuideContentQuality.repeatsWhole(r.text(),r.decisiveEvidence())||GuideContentQuality.repeatsWhole(r.text(),r.answerAnalysis()))
          throw new IllegalArgumentException("A correção completa não pode transcrever o enunciado inteiro; destaque apenas o ponto decisivo e desenvolva o ensinamento");
        if(GuideContentQuality.repeatsWhole(r.explanation(),r.conceptExplanation())||GuideContentQuality.repeatsWhole(r.explanation(),r.answerAnalysis()))
          throw new IllegalArgumentException("A correção completa deve acrescentar conteúdo novo, não repetir o comentário resumido do card");
        if(tips.stream().anyMatch(tip->GuideContentQuality.sameText(tip,r.similarQuestionStrategy())))
          throw new IllegalArgumentException("A síntese para revisão não pode repetir a estratégia para questões parecidas");
        ensureUniqueGuideField(questionId,"concept_explanation","base conceitual",r.conceptExplanation());
        ensureUniqueGuideField(questionId,"answer_analysis","análise da resposta",r.answerAnalysis());
        ensureUniqueGuideField(questionId,"exam_trap","pegadinha da banca",r.examTrap());
        ensureUniqueGuideField(questionId,"similar_question_strategy","estratégia para questões parecidas",r.similarQuestionStrategy());
    }
    private void ensureUniqueGuideField(UUID questionId,String column,String label,String suppliedValue){
        String value=text(suppliedValue);if(value.isBlank())return;
        String safeColumn=switch(column){
          case "concept_explanation","answer_analysis","exam_trap","similar_question_strategy"->column;
          default->throw new IllegalArgumentException("Campo de gabarito inválido");
        };
        int duplicates=jdbc.sql("SELECT COUNT(*) FROM questions WHERE id<>:id AND status IN ('ACTIVE','ANNULLED') AND btrim("+safeColumn+")=:value")
          .param("id",questionId).param("value",value).query(Integer.class).single();
        if(duplicates>0)throw new IllegalArgumentException("A "+label+" repete literalmente o conteúdo de outra questão; escreva uma explicação específica");
    }
    private void validateQuestion(QuestionRequest r){String type=r.type().trim().toUpperCase(Locale.ROOT);String correct=r.correct().trim();
        if("Anulada".equalsIgnoreCase(correct))return;
        if("TRUE_FALSE".equals(type)){if(!Set.of("Certo","Errado").contains(correct))throw new IllegalArgumentException("Questões de certo ou errado devem usar o gabarito Certo ou Errado");return;}
        if(!"MULTIPLE_CHOICE".equals(type))throw new IllegalArgumentException("Tipo de questão inválido");
        if(r.options()==null||r.options().size()<2)throw new IllegalArgumentException("Informe pelo menos duas alternativas");
        if(r.options().stream().noneMatch(option->option.label().equalsIgnoreCase(correct)))throw new IllegalArgumentException("O gabarito deve corresponder à letra de uma alternativa");}
    private Map<String,Object> questionById(UUID id){var row=jdbc.sql("""
      SELECT q.id,q.board,q.type,q.statement,q.explanation,q.status,q.correct_answer #>> '{}' correct,
        q.detailed_topic,q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,
        q.fixation_tips::text fixation_tips_json,q.comparison_headers::text comparison_headers_json,
        q.comparison_rows::text comparison_rows_json,
        q.passage_id,q.metadata::text metadata_json,p.title passage_title,
        s.id::text subject_id,s.name category,t.id::text topic_id,t.name topic,
        COALESCE((SELECT MIN(qc.course_id) FROM question_courses qc WHERE qc.question_id=q.id),'') course_id,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
          FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options_json
      FROM questions q LEFT JOIN passages p ON p.id=q.passage_id
      LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=q.topic_id WHERE q.id=:id
      """).param("id",id).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Questão não encontrada"));return question(row);}
    @SuppressWarnings("unchecked") private Map<String,Object> question(Map<String,Object> row){
        Map<String,Object> metadata=Map.of();try{metadata=json.readValue(String.valueOf(row.get("metadata_json")),Map.class);}catch(Exception ignored){}
        UUID id=(UUID)row.get("id");List<Map<String,Object>> options=List.of();
        try{options=json.readValue(String.valueOf(row.get("options_json")),List.class);}catch(Exception ignored){}
        var item=new LinkedHashMap<String,Object>();item.put("id",id.toString());item.put("courseId",row.getOrDefault("course_id",""));
        item.put("subjectId",row.getOrDefault("subject_id",""));item.put("topicId",row.getOrDefault("topic_id",""));
        item.put("category",row.get("category")!=null?row.get("category"):metadata.getOrDefault("category","Geral"));
        item.put("topic",row.get("topic")!=null?row.get("topic"):metadata.getOrDefault("topic",metadata.getOrDefault("category","Geral")));
        item.put("board",row.get("board"));item.put("type",row.get("type"));item.put("text",row.get("statement"));item.put("correct",row.get("correct"));
        item.put("explanation",row.get("explanation"));item.put("reference",metadata.getOrDefault("reference",""));item.put("status",row.get("status"));
        item.put("detailedTopic",row.getOrDefault("detailed_topic",""));item.put("conceptExplanation",row.getOrDefault("concept_explanation",""));
        item.put("decisiveEvidence",row.getOrDefault("decisive_evidence",""));item.put("answerAnalysis",row.getOrDefault("answer_analysis",""));
        item.put("examTrap",row.getOrDefault("exam_trap",""));
        item.put("similarQuestionStrategy",row.getOrDefault("similar_question_strategy",""));
        try{item.put("fixationTips",json.readTree(String.valueOf(row.getOrDefault("fixation_tips_json","[]"))));}catch(Exception ignored){item.put("fixationTips",List.of());}
        try{item.put("comparisonHeaders",json.readTree(String.valueOf(row.getOrDefault("comparison_headers_json","{}"))));}catch(Exception ignored){item.put("comparisonHeaders",Map.of());}
        try{item.put("comparisonRows",json.readTree(String.valueOf(row.getOrDefault("comparison_rows_json","[]"))));}catch(Exception ignored){item.put("comparisonRows",List.of());}
        item.put("pendingReports",row.getOrDefault("pending_reports",0));
        item.put("passageId",row.get("passage_id")==null?null:String.valueOf(row.get("passage_id")));item.put("passageTitle",row.get("passage_title"));item.put("options",options);return item;
    }
    private List<String> cleanPoints(List<String> values){return values==null?List.of():values.stream().map(this::text).filter(value->!value.isBlank()).toList();}
    private Map<String,String> cleanComparisonHeaders(ComparisonHeadersRequest headers){
      if(headers==null)return Map.of();return Map.of("criterion",headers.criterion().trim(),"left",headers.left().trim(),"right",headers.right().trim());
    }
    private List<Map<String,String>> cleanComparisonRows(List<ComparisonRowRequest> rows){
      if(rows==null)return List.of();return rows.stream().map(row->Map.of("criterion",row.criterion().trim(),"left",row.left().trim(),"right",row.right().trim())).toList();
    }
    static String cleanReference(String value){
      String cleaned=trimmed(value).replaceFirst("(?iu)\\s*[—-]\\s*(undefined|null)\\s*$","").trim();
      return cleaned.matches("(?iu)undefined|null")?"":cleaned;
    }
    static String canonicalStatement(String value){
      return trimmed(value).replaceFirst("(?iu)\\s*\\(?\\s*ref\\s*:\\s*[^)]*\\)?[.\\s]*$","").trim();
    }
    private String text(String value){return value==null?"":value.trim();}private String fallback(String value,String fallback){String text=text(value);return text.isBlank()?fallback:text;}
}

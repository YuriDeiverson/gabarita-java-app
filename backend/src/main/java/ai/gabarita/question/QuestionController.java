package ai.gabarita.question;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import java.text.Normalizer;
import java.sql.Types;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {
    private static final Logger log=LoggerFactory.getLogger(QuestionController.class);
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
    // Mantém a rota raiz por compatibilidade e expõe uma rota explícita para o banco global.
    // A ausência de courseId deliberadamente lista as questões de todos os
    // cursos, cargos e concursos vinculados ao banco.
    @GetMapping public List<Map<String,Object>> all(){return questions("");}

    @GetMapping("/all") public List<Map<String,Object>> allQuestions(){return questions("");}

    @GetMapping("/course/{courseId}") public List<Map<String,Object>> byCourse(@PathVariable String courseId) {
      return questions(courseId);
    }

    @GetMapping("/taxonomy")
    public List<Map<String,Object>> taxonomy(@RequestParam(defaultValue="") String courseId,
      @RequestParam(defaultValue="false") boolean includeEmpty){
      var rows=jdbc.sql("""
        SELECT s.id::text subject_id,s.slug subject_slug,s.name subject_name,s.area,
          t.id::text topic_id,t.slug topic_slug,t.name topic_name,
          COUNT(q.id) FILTER (WHERE q.status IN('ACTIVE','ANNULLED')) question_count
        FROM subjects s JOIN topics t ON t.subject_id=s.id AND t.active
        LEFT JOIN questions q ON q.subject_id=s.id AND q.topic_id=t.id
          AND (:course='' OR EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=:course))
        WHERE s.exam_id IS NULL AND s.active
        GROUP BY s.id,s.slug,s.name,s.area,s.position,t.id,t.slug,t.name,t.position
        HAVING :includeEmpty OR COUNT(q.id) FILTER (WHERE q.status IN('ACTIVE','ANNULLED'))>0
        ORDER BY s.area,s.position,s.name,t.position,t.name
        """).param("course",courseId.trim()).param("includeEmpty",includeEmpty).query().listOfRows();
      var disciplines=new LinkedHashMap<String,Map<String,Object>>();
      for(var row:rows){String id=String.valueOf(row.get("subject_id"));
        var discipline=disciplines.computeIfAbsent(id,key->{var item=new LinkedHashMap<String,Object>();
          item.put("id",key);item.put("slug",row.get("subject_slug"));item.put("name",row.get("subject_name"));
          item.put("area",row.get("area"));item.put("count",0L);item.put("topics",new ArrayList<Map<String,Object>>());return item;});
        long count=((Number)row.get("question_count")).longValue();
        discipline.put("count",((Number)discipline.get("count")).longValue()+count);
        @SuppressWarnings("unchecked") var topics=(List<Map<String,Object>>)discipline.get("topics");
        topics.add(Map.of("id",String.valueOf(row.get("topic_id")),"slug",String.valueOf(row.get("topic_slug")),
          "name",String.valueOf(row.get("topic_name")),"count",count));
      }
      return new ArrayList<>(disciplines.values());
    }

    private List<Map<String,Object>> questions(String courseId) {
      try {
      var questions=jdbc.sql("""
        SELECT q.id::text id,COALESCE(s.name,q.metadata->>'category','Geral') category,
        COALESCE(s.area,NULLIF(q.metadata->>'area',''),'Outros') area,
        COALESCE(t.name,NULLIF(q.metadata->>'topic',''),s.name,'Geral') topic,
        s.id::text subject_id,t.id::text topic_id,q.statement text,
        q.board,q.type,q.difficulty,
        COALESCE(q.exam_year,NULLIF(substring(COALESCE(q.metadata->>'reference','') FROM '19[0-9]{2}|20[0-9]{2}'),'')::integer) AS "year",
        CASE WHEN q.status='ANNULLED' THEN 'Anulada' ELSE q.correct_answer #>> '{}' END correct,
        COALESCE(q.explanation,'') explanation,COALESCE(q.metadata->>'reference',q.board,'') reference,
        q.detailed_topic,
        COALESCE(q.passage_id::text,NULLIF(q.metadata->>'passageId','')) passage_id,
        p.title passage_title,p.content passage_content,
        EXISTS(SELECT 1 FROM question_reports report WHERE report.question_id=q.id AND report.reason='OUTDATED'
          AND report.status IN('PENDING','RESOLVED')) outdated,
        COALESCE((SELECT jsonb_agg(item.value ORDER BY item.value) FROM (
          SELECT DISTINCT linked.course_id value FROM question_courses linked WHERE linked.question_id=q.id
        ) item),'[]'::jsonb)::text course_ids,
        COALESCE((SELECT jsonb_agg(item.value ORDER BY item.value) FROM (
          SELECT DISTINCT role.label value FROM question_courses linked JOIN catalog_roles role ON role.course_id=linked.course_id
          WHERE linked.question_id=q.id
        ) item),'[]'::jsonb)::text roles,
        COALESCE((SELECT jsonb_agg(item.value ORDER BY item.value) FROM (
          SELECT DISTINCT contest.education value FROM question_courses linked
          JOIN catalog_roles role ON role.course_id=linked.course_id JOIN catalog_contests contest ON contest.id=role.contest_id
          WHERE linked.question_id=q.id AND BTRIM(contest.education)<>''
        ) item),'[]'::jsonb)::text education_levels,
        COALESCE((SELECT jsonb_agg(item.value ORDER BY item.value) FROM (
          SELECT DISTINCT role.requirement value FROM question_courses linked JOIN catalog_roles role ON role.course_id=linked.course_id
          WHERE linked.question_id=q.id AND BTRIM(role.requirement)<>''
        ) item),'[]'::jsonb)::text formation_areas,
        COALESCE((SELECT jsonb_agg(item.value ORDER BY item.value) FROM (
          SELECT DISTINCT contest.area value FROM question_courses linked
          JOIN catalog_roles role ON role.course_id=linked.course_id JOIN catalog_contests contest ON contest.id=role.contest_id
          WHERE linked.question_id=q.id AND BTRIM(contest.area)<>''
        ) item),'[]'::jsonb)::text activity_areas,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
          FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options
        FROM questions q
        LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=q.topic_id LEFT JOIN passages p ON p.id=q.passage_id
        WHERE (:course='' OR EXISTS(SELECT 1 FROM question_courses course WHERE course.question_id=q.id AND course.course_id=:course))
          AND q.status IN('ACTIVE','ANNULLED') ORDER BY q.created_at,q.id
        """).param("course",courseId).query().listOfRows();
      // Older imported questions were stored only with the discipline. Infer the
      // main subject while they are read, so the new filter works immediately
      // without changing manually curated topic metadata.
      questions.forEach(this::inferLegacyTopic);
      attachSubjectGuidance(questions);
      return questions;
      } catch (RuntimeException error) {
        // A listagem global não pode ficar indisponível se algum dado opcional
        // de catálogo estiver inconsistente. Os filtros básicos continuam
        // funcionando com a consulta compatível abaixo.
        log.warn("Falha ao carregar metadados avançados das questões; usando consulta compatível.",error);
        return basicQuestions(courseId);
      }
    }

    private List<Map<String,Object>> basicQuestions(String courseId) {
      String scope=courseId.isBlank()?"":" JOIN question_courses course ON course.question_id=q.id ";
      String condition=courseId.isBlank()?"":" AND course.course_id=:course ";
      String sql="""
        SELECT q.id::text id,COALESCE(s.name,q.metadata->>'category','Geral') category,
        COALESCE(s.area,NULLIF(q.metadata->>'area',''),'Outros') area,
        COALESCE(t.name,NULLIF(q.metadata->>'topic',''),s.name,'Geral') topic,
        s.id::text subject_id,t.id::text topic_id,q.statement text,
        q.board,q.type,q.difficulty,q.exam_year AS "year",
        CASE WHEN q.status='ANNULLED' THEN 'Anulada' ELSE q.correct_answer #>> '{}' END correct,
        COALESCE(q.explanation,'') explanation,COALESCE(q.metadata->>'reference',q.board,'') reference,
        q.detailed_topic,
        COALESCE(q.passage_id::text,NULLIF(q.metadata->>'passageId','')) passage_id,
        p.title passage_title,p.content passage_content,
        '[]'::text course_ids,'[]'::text roles,'[]'::text education_levels,
        '[]'::text formation_areas,'[]'::text activity_areas,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
          FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb)::text options
        FROM questions q
        """+scope+"""
        LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN topics t ON t.id=q.topic_id LEFT JOIN passages p ON p.id=q.passage_id
        WHERE q.status IN('ACTIVE','ANNULLED')
        """+condition+" ORDER BY q.created_at,q.id";
      var query=jdbc.sql(sql);
      if(!courseId.isBlank())query=query.param("course",courseId);
      var questions=query.query().listOfRows();
      questions.forEach(this::inferLegacyTopic);
      attachSubjectGuidance(questions);
      return questions;
    }

    @GetMapping("/{questionId}/guide")
    public Map<String,Object> detailedGuide(@PathVariable UUID questionId){
      var rows=jdbc.sql("""
        SELECT detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
          fixation_tips::text fixation_tips_json,comparison_headers::text comparison_headers_json,
          comparison_rows::text comparison_rows_json
        FROM questions WHERE id=:id AND status IN('ACTIVE','ANNULLED')
        """).param("id",questionId).query().listOfRows();
      if(rows.isEmpty())throw new NoSuchElementException("Questão não encontrada");
      var row=rows.getFirst();var guide=new LinkedHashMap<String,Object>();
      guide.put("detailedTopic",row.get("detailed_topic"));guide.put("conceptExplanation",row.get("concept_explanation"));
      guide.put("decisiveEvidence",row.get("decisive_evidence"));guide.put("answerAnalysis",row.get("answer_analysis"));
      guide.put("examTrap",row.get("exam_trap"));
      try{guide.put("fixationTips",json.readTree(String.valueOf(row.get("fixation_tips_json"))));}catch(Exception ignored){guide.put("fixationTips",List.of());}
      try{guide.put("comparisonHeaders",json.readTree(String.valueOf(row.get("comparison_headers_json"))));}catch(Exception ignored){guide.put("comparisonHeaders",Map.of());}
      try{guide.put("comparisonRows",json.readTree(String.valueOf(row.get("comparison_rows_json"))));}catch(Exception ignored){guide.put("comparisonRows",List.of());}
      return guide;
    }
    @PostMapping("/import/legacy") @Transactional public Map<String,Object> importLegacy(@RequestParam String courseId,@RequestBody List<LegacyQuestion> questions){
      currentUser.requireAdmin();
      int imported=0,updated=0,linked=0;
      for(var q:questions){
        String legacyId=String.valueOf(q.id());
        var existing=jdbc.sql("SELECT question_id FROM question_course_legacy_ids WHERE course_id=:course AND legacy_id=:legacy LIMIT 1")
          .param("course",courseId).param("legacy",legacyId).query(UUID.class).list();
        String answer;try{answer=json.writeValueAsString(q.correct());}catch(Exception e){throw new IllegalArgumentException("Gabarito inválido");}
        String metadata;try{metadata=json.writeValueAsString(Map.of("category",q.category(),"topic",q.topic()==null||q.topic().isBlank()?q.category():q.topic(),"reference",q.reference()==null?"":q.reference(),"passageId",q.passageId()==null?"":q.passageId()));}catch(Exception e){throw new IllegalArgumentException("Metadados inválidos");}
        // O formato legado não contém o guia aprofundado obrigatório. Novas
        // importações entram como rascunho até a revisão editorial.
        String status="DRAFT";
        if(existing.isEmpty()){
          var sameStatement=jdbc.sql("""
            SELECT id FROM questions WHERE md5(regexp_replace(lower(statement),'[^[:alnum:]]','','g'))
              =md5(regexp_replace(lower(:statement),'[^[:alnum:]]','','g')) LIMIT 1
            """).param("statement",q.text()).query(UUID.class).list();
          UUID questionId;
          if(sameStatement.isEmpty()){
            questionId=jdbc.sql("INSERT INTO questions(id,board,type,statement,explanation,status,correct_answer,metadata) VALUES(gen_random_uuid(),'CEBRASPE','TRUE_FALSE',:text,:explanation,:status,CAST(:answer AS jsonb),CAST(:metadata AS jsonb)) RETURNING id")
              .param("text",q.text()).param("explanation",q.explanation()).param("status",status).param("answer",answer).param("metadata",metadata).query(UUID.class).single();imported++;
          }else{questionId=sameStatement.getFirst();linked++;}
          attachCourse(questionId,courseId,legacyId);
        }else{
          jdbc.sql("UPDATE questions SET statement=:text,explanation=:explanation,correct_answer=CAST(:answer AS jsonb),metadata=CAST(:metadata AS jsonb),updated_at=now() WHERE id=:id")
            .param("text",q.text()).param("explanation",q.explanation()).param("answer",answer).param("metadata",metadata).param("id",existing.getFirst()).update();updated++;
        }
      }
      return Map.of("imported",imported,"linked",linked,"updated",updated,"total",questions.size());
    }

    private void attachCourse(UUID questionId,String courseId,String legacyId){
      jdbc.sql("INSERT INTO question_courses(question_id,course_id) VALUES(:question,:course) ON CONFLICT DO NOTHING")
        .param("question",questionId).param("course",courseId.trim()).update();
      jdbc.sql("""
        INSERT INTO question_course_legacy_ids(question_id,course_id,legacy_id) VALUES(:question,:course,:legacy)
        ON CONFLICT(course_id,legacy_id) DO UPDATE SET question_id=EXCLUDED.question_id
        """).param("question",questionId).param("course",courseId.trim()).param("legacy",legacyId).update();
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

    private record SubjectGuidance(String id,String titleKey,String disciplineKey){}

    private void attachSubjectGuidance(List<Map<String,Object>> questions){
      try{
        var subjectRows=jdbc.sql("""
          SELECT id::text id,title,discipline FROM shared_study_subjects
          """).query().listOfRows();
        var subjects=new ArrayList<SubjectGuidance>(subjectRows.size());
        for(var subject:subjectRows){
          String titleKey=subjectKey(String.valueOf(subject.getOrDefault("title","")));
          if(!titleKey.isBlank())subjects.add(new SubjectGuidance(String.valueOf(subject.get("id")),titleKey,
            subjectKey(String.valueOf(subject.getOrDefault("discipline","")))));
        }
        // Muitas questões compartilham a mesma disciplina e o mesmo assunto.
        // Resolva cada combinação uma única vez em vez de repetir a normalização
        // de centenas de materiais para cada questão do banco.
        var resolvedSubjects=new HashMap<String,Optional<String>>();
        for(var question:questions){
          String topicKey=subjectKey(String.valueOf(question.getOrDefault("topic","")));
          String categoryKey=subjectKey(String.valueOf(question.getOrDefault("category","")));
          if(topicKey.isBlank())continue;
          String resolutionKey=categoryKey+'\u0000'+topicKey;
          Optional<String> cached=resolvedSubjects.get(resolutionKey);
          if(cached!=null){cached.ifPresent(id->question.put("study_subject_id",id));continue;}
          SubjectGuidance best=null;int bestScore=0;
          for(var subject:subjects){
            int score=subject.titleKey().equals(topicKey)?100:
              subject.titleKey().length()>8&&(subject.titleKey().contains(topicKey)||topicKey.contains(subject.titleKey()))?60:0;
            if(score==0)continue;
            String disciplineKey=subject.disciplineKey();
            if(!categoryKey.isBlank()&&(disciplineKey.equals(categoryKey)||disciplineKey.contains(categoryKey)||categoryKey.contains(disciplineKey)))score+=15;
            if(score>bestScore){best=subject;bestScore=score;}
          }
          Optional<String> resolved=best==null?Optional.empty():Optional.of(best.id());
          resolvedSubjects.put(resolutionKey,resolved);
          resolved.ifPresent(id->question.put("study_subject_id",id));
        }
      }catch(RuntimeException error){
        log.warn("Orientações dos assuntos indisponíveis; mantendo os gabaritos específicos.",error);
      }
    }

    private String subjectKey(String value){return normalized(value).replaceFirst("^(?:\\d+\\s+)+","");}

    private void inferLegacyTopic(Map<String,Object> question){
      String category=text(String.valueOf(question.getOrDefault("category","")));
      String currentTopic=text(String.valueOf(question.getOrDefault("topic","")));
      if(!currentTopic.isBlank()&&!sameTopic(category,currentTopic))return;
      String searchable=normalized(String.valueOf(question.getOrDefault("text",""))+" "+String.valueOf(question.getOrDefault("reference","")));
      String inferred=switch(normalized(category)){
        case "portugues", "lingua portuguesa" -> portugueseTopic(searchable);
        case "ti basica", "nocoes de informatica" -> technologyTopic(searchable);
        default -> "";
      };
      if(!inferred.isBlank())question.put("topic",inferred);
    }

    private String portugueseTopic(String text){
      if(matches(text,"reescrit","substitui","substituicao","supress","insercao","retirada","reorganizacao","preserva.{0,30}sentido","mantid.{0,30}(sentido|correcao)"))
        return "6. Reescrita de frases e parágrafos do texto";
      if(matches(text,"ortograf","acentu","hifen","grafia"))
        return "3. Domínio da ortografia oficial";
      if(matches(text,"coes[a-z]* textual","conector","referenciacao","sequenciacao textual","retomada"))
        return "4. Domínio dos mecanismos de coesão textual";
      if(matches(text,"morfossint","sintax","sujeito","predicado","oracao","classe gramatical","forma verbal","concordancia","regencia","crase","pontuacao","pronome atono"))
        return "5. Domínio da estrutura morfossintática do período";
      if(matches(text,"genero textual","tipo textual","tipologia","narrativ","dissertativ","injuntiv","descritiv"))
        return "2. Reconhecimento de tipos e gêneros textuais";
      return "1. Compreensão e interpretação de textos de gêneros variados";
    }

    private String technologyTopic(String text){
      if(matches(text,"microsoft office","microsoft word","microsoft excel","powerpoint","planilha","apresentacao"))
        return "2. Edição de textos, planilhas e apresentações (ambiente Microsoft Office)";
      if(matches(text,"sistema operacional","\\bwindows\\b","\\blinux\\b"))
        return "1. Noções de sistema operacional (ambiente Windows)";
      if(matches(text,"rede de computador","internet","intranet","navegador","microsoft edge","firefox","google chrome","outlook","correio eletronico","cloud computing"))
        return "3. Redes de computadores";
      if(matches(text,"organizacao de informacao","gerenciamento de arquivo","gerenciamento de pasta","\\barquivo\\b","\\bpasta\\b"))
        return "4. Organização e gerenciamento de informações, arquivos, pastas e programas";
      if(matches(text,"seguranca da informacao","malware","virus","worm","antivirus","firewall","anti spyware","backup","cloud storage"))
        return "5. Segurança da informação";
      return "";
    }

    private boolean sameTopic(String first,String second){return normalized(first).equals(normalized(second));}
    private boolean matches(String value,String... patterns){for(String pattern:patterns)if(value.matches(".*(?:"+pattern+").*"))return true;return false;}
    private String normalized(String value){return Normalizer.normalize(value==null?"":value,Normalizer.Form.NFD)
      .replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
}

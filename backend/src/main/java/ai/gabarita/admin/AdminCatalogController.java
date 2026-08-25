package ai.gabarita.admin;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {
    private static final long MAX_NOTICE_PDF_BYTES=15L*1024*1024;
    private final JdbcClient jdbc;private final CurrentUser currentUser;private final CatalogController catalog;
    public AdminCatalogController(JdbcClient jdbc,CurrentUser currentUser,CatalogController catalog){this.jdbc=jdbc;this.currentUser=currentUser;this.catalog=catalog;}

    public record ContestRequest(@NotBlank String code,@NotBlank String label,@NotBlank String acronym,@NotBlank String organization,
      String description,@NotBlank String board,@NotNull LocalDate examDate,String status,String state,String area,String education,
      String vacancies,String remuneration,String location,String stages,String noticeReference,Boolean active){}
    public record RoleRequest(@NotNull UUID contestId,@NotBlank String code,@NotBlank String label,@NotBlank String courseId,
      @NotBlank String board,Boolean includeDiscursive,String requirement,String remuneration,String vacancies,
      @NotNull @Positive Integer estimatedHours,@NotNull JsonNode curriculum,Boolean active){}
    public record StudyMaterialRequest(@NotBlank String sectionId,@NotBlank String cardId,@NotBlank String title,
      @NotBlank String content,List<String> keyTakeaways){}
    public record BaseStudyMaterialRequest(@NotBlank String sectionId,@NotBlank String cardId,@NotNull String content,
      List<String> keyTakeaways){}
    public record SharedSubjectCreateRequest(@NotBlank @Size(max=240) String title,@NotBlank @Size(max=240) String discipline,
      @NotBlank String studyGroup,@NotBlank String studyObjective,List<String> reviewSummary){}
    public record SharedSubjectUpdateRequest(@NotBlank String discipline,@NotBlank String studyGroup,@NotBlank String studyObjective,
      List<String> reviewSummary){}
    public record SharedSubjectBatchItem(@NotBlank @Size(max=240) String title,@NotBlank @Size(max=240) String discipline,
      @NotBlank String studyGroup,@NotBlank String studyObjective,List<String> reviewSummary){}
    public record SharedSubjectBatchRequest(@NotEmpty @Size(max=500) List<@Valid SharedSubjectBatchItem> subjects){}
    public record StudyDisciplineRequest(@NotBlank String title){}
    public record StudySubjectRequest(@NotBlank String sectionId,@NotBlank String title){}

    @GetMapping public List<Map<String,Object>> all(){currentUser.requireAdmin();return catalog.catalog(true,true);}

    @PostMapping("/contests") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createContest(@Valid @RequestBody ContestRequest r){currentUser.requireAdmin();
        return jdbc.sql("""
          INSERT INTO catalog_contests(code,label,acronym,organization,description,board,exam_date,status,state,area,education,
            vacancies,remuneration,location,stages,notice_reference,active)
          VALUES(:code,:label,:acronym,:organization,:description,:board,:date,:status,:state,:area,:education,
            :vacancies,:remuneration,:location,:stages,:notice,:active) RETURNING id
          """).params(contestParams(r)).query().singleRow();}

    @PutMapping("/contests/{id}")
    public Map<String,Object> updateContest(@PathVariable UUID id,@Valid @RequestBody ContestRequest r){currentUser.requireAdmin();
        return jdbc.sql("""
          UPDATE catalog_contests SET code=:code,label=:label,acronym=:acronym,organization=:organization,description=:description,
            board=:board,exam_date=:date,status=:status,state=:state,area=:area,education=:education,vacancies=:vacancies,
            remuneration=:remuneration,location=:location,stages=:stages,notice_reference=:notice,active=:active,updated_at=now()
          WHERE id=:id RETURNING id
          """).params(contestParams(r)).param("id",id).query().singleRow();}

    @DeleteMapping("/contests/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContest(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM catalog_contests WHERE id=:id").param("id",id).update();}

    @PutMapping(value="/contests/{id}/notice-pdf",consumes="multipart/form-data")
    public Map<String,Object> uploadNoticePdf(@PathVariable UUID id,@RequestPart("file") MultipartFile file){currentUser.requireAdmin();
        byte[] content=validatedPdf(file);String filename=safePdfFilename(file.getOriginalFilename());
        int updated=jdbc.sql("""
          UPDATE catalog_contests SET notice_pdf=:content,notice_pdf_name=:name,notice_pdf_size=:size,
            notice_pdf_updated_at=now(),updated_at=now() WHERE id=:id
          """).param("content",content).param("name",filename).param("size",content.length).param("id",id).update();
        if(updated==0)throw new NoSuchElementException("Concurso não encontrado");
        return Map.of("noticePdfAvailable",true,"noticePdfName",filename,"noticePdfSize",content.length);
    }

    @DeleteMapping("/contests/{id}/notice-pdf") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNoticePdf(@PathVariable UUID id){currentUser.requireAdmin();
        int updated=jdbc.sql("""
          UPDATE catalog_contests SET notice_pdf=NULL,notice_pdf_name=NULL,notice_pdf_size=NULL,
            notice_pdf_updated_at=NULL,updated_at=now() WHERE id=:id
          """).param("id",id).update();
        if(updated==0)throw new NoSuchElementException("Concurso não encontrado");
    }

    @PostMapping("/roles") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createRole(@Valid @RequestBody RoleRequest r){currentUser.requireAdmin();
        hydrateFromLibrary(r.curriculum());validateCurriculum(r.curriculum());
        return jdbc.sql("""
          INSERT INTO catalog_roles(contest_id,code,label,course_id,board,include_discursive,requirement,remuneration,
            vacancies,estimated_hours,curriculum,active)
          VALUES(:contest,:code,:label,:course,:board,:discursive,:requirement,:remuneration,:vacancies,:hours,CAST(:curriculum AS jsonb),:active)
          RETURNING *
          """).params(roleParams(r)).query().singleRow();}

    @PutMapping("/roles/{id}")
    public Map<String,Object> updateRole(@PathVariable UUID id,@Valid @RequestBody RoleRequest r){currentUser.requireAdmin();
        hydrateFromLibrary(r.curriculum());validateCurriculum(r.curriculum());
        return jdbc.sql("""
          UPDATE catalog_roles SET contest_id=:contest,code=:code,label=:label,course_id=:course,board=:board,
            include_discursive=:discursive,requirement=:requirement,remuneration=:remuneration,vacancies=:vacancies,
            estimated_hours=:hours,curriculum=CAST(:curriculum AS jsonb),active=:active,updated_at=now()
          WHERE id=:id RETURNING *
          """).params(roleParams(r)).param("id",id).query().singleRow();}

    @DeleteMapping("/roles/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM catalog_roles WHERE id=:id").param("id",id).update();}

    @PostMapping("/subjects") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createSharedSubject(@Valid @RequestBody SharedSubjectCreateRequest r){currentUser.requireAdmin();
        String title=r.title().trim();String discipline=r.discipline().trim();String group=validStudyGroup(r.studyGroup());
        if(findShared(title,discipline)!=null)throw new IllegalArgumentException("Este assunto já existe nesta disciplina");
        String id=insertSharedSubject(title,discipline,group,r.studyObjective(),r.reviewSummary());
        SharedSnapshot shared=sharedSnapshot(UUID.fromString(id));int synchronizedPlans=synchronizeShared(shared);
        return Map.of("id",id,"title",title,"discipline",discipline,"studyGroup",group,"synchronizedPlans",synchronizedPlans);
    }

    @PostMapping("/subjects/batch") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createSharedSubjects(@Valid @RequestBody SharedSubjectBatchRequest request){currentUser.requireAdmin();
        var existingRows=jdbc.sql("SELECT title,discipline,canonical_key FROM shared_study_subjects").query().listOfRows();
        var existingPairs=new HashSet<String>();var usedKeys=new HashSet<String>();
        for(var row:existingRows){existingPairs.add(subjectCanonical(String.valueOf(row.get("title")))+"::"+canonical(String.valueOf(row.get("discipline"))));
          usedKeys.add(String.valueOf(row.get("canonical_key")));}
        var seen=new HashSet<String>();var pending=new ArrayList<PendingSharedSubject>();int skippedExisting=0;int skippedRepeated=0;
        for(var item:request.subjects()){
            String title=item.title().trim();String discipline=item.discipline().trim();String group=validStudyGroup(item.studyGroup());
            String pair=subjectCanonical(title)+"::"+canonical(discipline);
            if(!seen.add(pair)){skippedRepeated++;continue;}
            if(existingPairs.contains(pair)){skippedExisting++;continue;}
            String key=availableSharedKey(title,discipline,usedKeys);usedKeys.add(key);
            pending.add(new PendingSharedSubject(key,title,discipline,group,item.studyObjective().trim(),item.reviewSummary()));
        }
        var created=insertSharedSubjects(pending);
        int synchronizedPlans=synchronizeShared(created);
        return Map.of("imported",created.size(),"skippedExisting",skippedExisting,"skippedRepeated",skippedRepeated,
          "synchronizedPlans",synchronizedPlans,"ids",created.stream().map(SharedSnapshot::id).toList());
    }

    @PutMapping("/subjects/{id}") @Transactional
    public Map<String,Object> updateSharedSubject(@PathVariable UUID id,@Valid @RequestBody SharedSubjectUpdateRequest r){currentUser.requireAdmin();
        String group=validStudyGroup(r.studyGroup());int updated=jdbc.sql("""
          UPDATE shared_study_subjects SET discipline=:discipline,study_group=:group,study_objective=:objective,
            review_summary=CAST(:summary AS jsonb),updated_at=now() WHERE id=:id
          """).param("discipline",r.discipline().trim()).param("group",group).param("objective",r.studyObjective().trim())
          .param("summary",pointsJson(r.reviewSummary())).param("id",id).update();
        if(updated==0)throw new NoSuchElementException("Assunto não encontrado");
        SharedSnapshot shared=sharedSnapshot(id);int synchronizedPlans=synchronizeShared(shared);
        return Map.of("id",id.toString(),"title",shared.title(),"synchronizedPlans",synchronizedPlans);
    }

    @DeleteMapping("/subjects/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSharedSubject(@PathVariable UUID id){currentUser.requireAdmin();
        int deleted=jdbc.sql("DELETE FROM shared_study_subjects WHERE id=:id").param("id",id).update();
        if(deleted==0)throw new NoSuchElementException("Assunto não encontrado");
    }

    private byte[] validatedPdf(MultipartFile file){
        if(file==null||file.isEmpty())throw new IllegalArgumentException("Selecione um arquivo PDF");
        if(file.getSize()>MAX_NOTICE_PDF_BYTES)throw new IllegalArgumentException("O edital deve ter no máximo 15 MB");
        try{
            byte[] content=file.getBytes();
            if(content.length<5||content[0]!='%'||content[1]!='P'||content[2]!='D'||content[3]!='F'||content[4]!='-')
                throw new IllegalArgumentException("O arquivo enviado não é um PDF válido");
            return content;
        }catch(java.io.IOException exception){throw new IllegalArgumentException("Não foi possível ler o arquivo PDF",exception);}
    }

    private String safePdfFilename(String original){
        String name=original==null?"edital.pdf":original.replace('\\','/');
        name=name.substring(name.lastIndexOf('/')+1).replaceAll("[\\r\\n\\t]","_").trim();
        if(name.isBlank())name="edital.pdf";
        if(!name.toLowerCase(Locale.ROOT).endsWith(".pdf"))name=name+".pdf";
        return name.length()>255?name.substring(0,251)+".pdf":name;
    }

    @PostMapping("/roles/{id}/materials") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> addStudyMaterial(@PathVariable UUID id,@Valid @RequestBody StudyMaterialRequest r){currentUser.requireAdmin();
        String materialId=UUID.randomUUID().toString();int synchronizedPlans=mutateRoleAndPlans(id,r.sectionId(),r.cardId(),root->appendMaterial(root,r,materialId));
        return Map.of("id",materialId,"title",r.title().trim(),"synchronizedPlans",synchronizedPlans);
    }

    @PutMapping("/roles/{id}/materials/{materialId}") @Transactional
    public Map<String,Object> updateStudyMaterial(@PathVariable UUID id,@PathVariable String materialId,@Valid @RequestBody StudyMaterialRequest r){currentUser.requireAdmin();
        int synchronizedPlans=mutateRoleAndPlans(id,r.sectionId(),r.cardId(),root->updateMaterial(root,r,materialId));
        return Map.of("id",materialId,"title",r.title().trim(),"synchronizedPlans",synchronizedPlans);
    }

    @DeleteMapping("/roles/{id}/materials/{materialId}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteStudyMaterial(@PathVariable UUID id,@PathVariable String materialId,@RequestParam String sectionId,@RequestParam String cardId){currentUser.requireAdmin();
        mutateRoleAndPlans(id,sectionId,cardId,root->deleteMaterial(root,sectionId,cardId,materialId));
    }

    @PutMapping("/roles/{id}/materials/base") @Transactional
    public Map<String,Object> updateBaseStudyMaterial(@PathVariable UUID id,@Valid @RequestBody BaseStudyMaterialRequest r){currentUser.requireAdmin();
        int synchronizedPlans=mutateRoleAndPlans(id,r.sectionId(),r.cardId(),root->updateBaseMaterial(root,r,false));
        return Map.of("cardId",r.cardId(),"synchronizedPlans",synchronizedPlans);
    }

    @DeleteMapping("/roles/{id}/materials/base") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void deleteBaseStudyMaterial(@PathVariable UUID id,@RequestParam String sectionId,@RequestParam String cardId){currentUser.requireAdmin();
        var request=new BaseStudyMaterialRequest(sectionId,cardId,"",List.of());mutateRoleAndPlans(id,sectionId,cardId,root->updateBaseMaterial(root,request,true));
    }

    @PostMapping("/roles/{id}/disciplines") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createStudyDiscipline(@PathVariable UUID id,@Valid @RequestBody StudyDisciplineRequest r){currentUser.requireAdmin();
        RoleCurriculum role=roleCurriculum(id);JsonNode root=role.curriculum();String title=r.title().trim();
        for(var section:root.path("studySections"))if(canonical(title).equals(canonical(section.path("title").asText())))
            throw new IllegalArgumentException("Esta disciplina já existe neste cargo");
        String sectionId=uniqueId(root.path("studySections"),canonical(title).replace('-','_'),"disciplina");
        var topic=((com.fasterxml.jackson.databind.node.ObjectNode)root).withArray("topics").addObject();
        topic.put("id",sectionId);topic.put("title",title);topic.put("category","Conhecimentos Específicos");topic.putArray("subtopics");
        var section=((com.fasterxml.jackson.databind.node.ObjectNode)root).withArray("studySections").addObject();
        section.put("id",sectionId);section.put("title",title);section.put("icon","BookOpen");section.put("color","blue");
        section.put("difficulty","Médio");section.put("weight","10%");section.put("paretoJustification","Disciplina cadastrada na biblioteca de estudos.");section.putArray("cards");
        persistCurriculum(id,root);return Map.of("id",sectionId,"title",title);
    }

    @PostMapping("/roles/{id}/subjects") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,Object> createStudySubject(@PathVariable UUID id,@Valid @RequestBody StudySubjectRequest r){currentUser.requireAdmin();
        RoleCurriculum role=roleCurriculum(id);JsonNode root=role.curriculum();JsonNode section=findSection(root,r.sectionId());
        if(section==null)throw new NoSuchElementException("Disciplina não encontrada");String title=r.title().trim();
        for(var card:section.path("cards"))if(subjectCanonical(title).equals(subjectCanonical(card.path("title").asText())))
            throw new IllegalArgumentException("Este assunto já existe nesta disciplina");
        String cardId=uniqueId(section.path("cards"),r.sectionId()+"_"+canonical(title).replace('-','_'),"assunto");
        var card=((com.fasterxml.jackson.databind.node.ObjectNode)section).withArray("cards").addObject();
        card.put("id",cardId);card.put("title",title);card.put("paretoRatio","Relevância do edital");card.put("isQuente",false);
        card.put("content","");card.putArray("keyTakeaways");card.putArray("contentBlocks");
        JsonNode topic=findTopic(root,r.sectionId());if(topic!=null)((com.fasterxml.jackson.databind.node.ObjectNode)topic).withArray("subtopics").add(title);
        String discipline=section.path("title").asText("");
        SharedSnapshot shared=findShared(title,discipline);if(shared==null)shared=upsertShared(discipline,studyGroup(root,r.sectionId()),card);else applyShared(root,shared);
        persistCurriculum(id,root);int synchronizedPlans=synchronizeShared(shared);
        return Map.of("id",cardId,"title",title,"sharedSubjectId",shared.id(),"synchronizedPlans",synchronizedPlans);
    }

    @DeleteMapping("/roles/{id}/subjects/{cardId}") @Transactional
    public Map<String,Object> deleteStudySubject(@PathVariable UUID id,@PathVariable String cardId,@RequestParam String sectionId){currentUser.requireAdmin();
        RoleCurriculum role=roleCurriculum(id);JsonNode root=role.curriculum();JsonNode section=findSection(root,sectionId);
        if(section==null)throw new NoSuchElementException("Disciplina não encontrada");JsonNode card=findCard(root,sectionId,cardId);
        if(card==null)throw new NoSuchElementException("Assunto não encontrado");String title=card.path("title").asText();String sectionTitle=section.path("title").asText();
        removeCard((com.fasterxml.jackson.databind.node.ArrayNode)section.path("cards"),cardId,title);
        JsonNode topic=findTopic(root,sectionId);if(topic!=null&&topic.path("subtopics").isArray())removeText((com.fasterxml.jackson.databind.node.ArrayNode)topic.path("subtopics"),title);
        persistCurriculum(id,root);int synchronizedPlans=removeSubjectFromPlans(role.courseId(),sectionId,sectionTitle,cardId,title);
        return Map.of("cardId",cardId,"title",title,"synchronizedPlans",synchronizedPlans);
    }

    @DeleteMapping("/roles/{id}/disciplines/{sectionId}") @Transactional
    public Map<String,Object> deleteStudyDiscipline(@PathVariable UUID id,@PathVariable String sectionId){currentUser.requireAdmin();
        RoleCurriculum role=roleCurriculum(id);JsonNode root=role.curriculum();JsonNode section=findSection(root,sectionId);
        if(section==null)throw new NoSuchElementException("Disciplina não encontrada");String title=section.path("title").asText();
        removeNode((com.fasterxml.jackson.databind.node.ArrayNode)root.path("studySections"),sectionId,title);
        if(root.path("topics").isArray())removeNode((com.fasterxml.jackson.databind.node.ArrayNode)root.path("topics"),sectionId,title);
        persistCurriculum(id,root);int synchronizedPlans=removeDisciplineFromPlans(role.courseId(),sectionId,title);
        return Map.of("sectionId",sectionId,"title",title,"synchronizedPlans",synchronizedPlans);
    }

    private Map<String,Object> contestParams(ContestRequest r){var p=new HashMap<String,Object>();p.put("code",r.code().trim());p.put("label",r.label().trim());
        p.put("acronym",r.acronym().trim());p.put("organization",r.organization().trim());p.put("description",text(r.description()));p.put("board",r.board().trim());p.put("date",r.examDate());
        p.put("status",fallback(r.status(),"Edital cadastrado"));p.put("state",text(r.state()));p.put("area",text(r.area()));p.put("education",text(r.education()));
        p.put("vacancies",fallback(r.vacancies(),"Conforme edital"));p.put("remuneration",fallback(r.remuneration(),"Conforme edital"));p.put("location",text(r.location()));
        p.put("stages",text(r.stages()));p.put("notice",text(r.noticeReference()));p.put("active",!Boolean.FALSE.equals(r.active()));return p;}
    private Map<String,Object> roleParams(RoleRequest r){var p=new HashMap<String,Object>();p.put("contest",r.contestId());p.put("code",r.code().trim());p.put("label",r.label().trim());
        p.put("course",r.courseId().trim());p.put("board",r.board().trim());p.put("discursive",Boolean.TRUE.equals(r.includeDiscursive()));p.put("requirement",text(r.requirement()));
        p.put("remuneration",text(r.remuneration()));p.put("vacancies",text(r.vacancies()));p.put("hours",r.estimatedHours());p.put("curriculum",r.curriculum().toString());
        p.put("active",!Boolean.FALSE.equals(r.active()));return p;}
    private String validStudyGroup(String value){String group=text(value);
        if("Conhecimentos Básicos".equals(group)||"Legislação".equals(group))return "Conhecimentos Gerais";
        if("Conhecimentos Gerais".equals(group)||"Conhecimentos Específicos".equals(group))return group;
        throw new IllegalArgumentException("Selecione Conhecimentos Gerais ou Conhecimentos Específicos");}
    private String pointsJson(List<String> points){try{return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(
        points==null?List.of():points.stream().map(this::text).filter(value->!value.isBlank()).toList());}
        catch(Exception error){throw new IllegalArgumentException("Pontos-chave inválidos");}}
    private String insertSharedSubject(String title,String discipline,String group,String objective,List<String> summary){
        return jdbc.sql("""
          INSERT INTO shared_study_subjects(canonical_key,title,discipline,study_group,study_objective,review_summary,base_content,key_takeaways,content_blocks)
          VALUES(:key,:title,:discipline,:group,:objective,CAST(:summary AS jsonb),'','[]'::jsonb,'[]'::jsonb) RETURNING id::text
          """).param("key",availableSharedKey(title,discipline)).param("title",title).param("discipline",discipline)
          .param("group",group).param("objective",text(objective)).param("summary",pointsJson(summary)).query(String.class).single();
    }
    private String availableSharedKey(String title,String discipline){
        return availableSharedKey(title,discipline,null);
    }
    private String availableSharedKey(String title,String discipline,Set<String> knownKeys){
        String base=subjectCanonical(title);if(base.isBlank())base="assunto";
        if(!sharedKeyExists(base,knownKeys))return base;
        String suffix="-"+String.format("%08x",canonical(discipline).hashCode());
        String candidate=base.substring(0,Math.min(base.length(),180-suffix.length()))+suffix;
        if(!sharedKeyExists(candidate,knownKeys))return candidate;
        int sequence=2;
        while(true){
            String numberedSuffix=suffix+"-"+sequence++;
            candidate=base.substring(0,Math.min(base.length(),180-numberedSuffix.length()))+numberedSuffix;
            if(!sharedKeyExists(candidate,knownKeys))return candidate;
        }
    }
    private boolean sharedKeyExists(String key,Set<String> knownKeys){return knownKeys==null
      ?jdbc.sql("SELECT COUNT(*) FROM shared_study_subjects WHERE canonical_key=:key").param("key",key).query(Long.class).single()>0
      :knownKeys.contains(key);}
    private List<SharedSnapshot> insertSharedSubjects(List<PendingSharedSubject> pending){
        if(pending.isEmpty())return List.of();
        var sql=new StringBuilder("""
          INSERT INTO shared_study_subjects(canonical_key,title,discipline,study_group,study_objective,review_summary,base_content,key_takeaways,content_blocks) VALUES
          """);
        var params=new HashMap<String,Object>();
        for(int index=0;index<pending.size();index++){
            if(index>0)sql.append(',');
            sql.append("(:key").append(index).append(",:title").append(index).append(",:discipline").append(index)
              .append(",:group").append(index).append(",:objective").append(index).append(",CAST(:summary").append(index)
              .append(" AS jsonb),'','[]'::jsonb,'[]'::jsonb)");
            var item=pending.get(index);params.put("key"+index,item.key());params.put("title"+index,item.title());
            params.put("discipline"+index,item.discipline());params.put("group"+index,item.studyGroup());
            params.put("objective"+index,item.studyObjective());params.put("summary"+index,pointsJson(item.reviewSummary()));
        }
        sql.append(" RETURNING id::text id,canonical_key,title,discipline,study_group,study_objective,review_summary::text summary,base_content,key_takeaways::text points,content_blocks::text blocks");
        return jdbc.sql(sql.toString()).params(params).query().listOfRows().stream().map(this::sharedSnapshot).toList();
    }
    private void validateCurriculum(JsonNode curriculum){
        var topics=curriculum.path("topics");var sections=curriculum.path("studySections");
        if(!topics.isArray()||topics.isEmpty()||!sections.isArray()||sections.isEmpty())
            throw new IllegalArgumentException("Informe ao menos um assunto e uma seção de estudo no conteúdo programático");
        for(var topic:topics)if(topic.path("id").asText().isBlank()||topic.path("title").asText().isBlank()||!topic.path("subtopics").isArray()||topic.path("subtopics").isEmpty())
            throw new IllegalArgumentException("Cada assunto deve ter id, título e uma lista de subtópicos");
        for(var section:sections)if(section.path("id").asText().isBlank()||section.path("title").asText().isBlank()||!section.path("cards").isArray()||section.path("cards").isEmpty())
            throw new IllegalArgumentException("Cada seção de estudo deve ter id, título e uma lista de materiais");
    }
    @FunctionalInterface private interface CurriculumMutation{boolean apply(JsonNode root);}
    private record SharedSnapshot(String id,String canonicalKey,String title,String discipline,String studyGroup,String studyObjective,JsonNode reviewSummary,String content,JsonNode keyTakeaways,JsonNode contentBlocks){}
    private record PendingSharedSubject(String key,String title,String discipline,String studyGroup,String studyObjective,List<String> reviewSummary){}
    private record RoleCurriculum(String courseId,JsonNode curriculum){}
    private RoleCurriculum roleCurriculum(UUID roleId){var row=jdbc.sql("SELECT course_id,curriculum::text curriculum_json FROM catalog_roles WHERE id=:id")
      .param("id",roleId).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Cargo não encontrado"));
      return new RoleCurriculum(String.valueOf(row.get("course_id")),parse(String.valueOf(row.get("curriculum_json"))));}
    private SharedSnapshot sharedSnapshot(UUID id){var row=jdbc.sql("""
      SELECT id::text id,canonical_key,title,discipline,study_group,study_objective,review_summary::text summary,base_content,key_takeaways::text points,content_blocks::text blocks
      FROM shared_study_subjects WHERE id=:id
      """).param("id",id).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Assunto não encontrado"));
      return sharedSnapshot(row);}
    private SharedSnapshot sharedSnapshot(Map<String,Object> row){return new SharedSnapshot(String.valueOf(row.get("id")),String.valueOf(row.get("canonical_key")),String.valueOf(row.get("title")),
        String.valueOf(row.get("discipline")),String.valueOf(row.get("study_group")),String.valueOf(row.get("study_objective")),parse(String.valueOf(row.get("summary"))),String.valueOf(row.get("base_content")),
        parse(String.valueOf(row.get("points"))),parse(String.valueOf(row.get("blocks"))));}
    private void persistCurriculum(UUID roleId,JsonNode curriculum){jdbc.sql("UPDATE catalog_roles SET curriculum=CAST(:curriculum AS jsonb),updated_at=now() WHERE id=:id")
      .param("curriculum",curriculum.toString()).param("id",roleId).update();}
    private JsonNode findSection(JsonNode root,String sectionId){for(var section:root.path("studySections"))if(sectionId.trim().equals(section.path("id").asText()))return section;return null;}
    private JsonNode findTopic(JsonNode root,String sectionId){for(var topic:root.path("topics"))if(sectionId.trim().equals(topic.path("id").asText()))return topic;return null;}
    private String studyGroup(JsonNode root,String sectionId){JsonNode topic=findTopic(root,sectionId);String value=topic==null?"":topic.path("category").asText();
        return ("Conhecimentos Básicos".equals(value)||"Legislação".equals(value))?"Conhecimentos Gerais":value.isBlank()?"Conhecimentos Específicos":value;}
    private String uniqueId(JsonNode items,String preferred,String fallback){String base=preferred.isBlank()?fallback:preferred;String candidate=base;int suffix=2;
      while(hasId(items,candidate))candidate=base+"_"+suffix++;return candidate;}
    private boolean hasId(JsonNode items,String id){if(items.isArray())for(var item:items)if(id.equals(item.path("id").asText()))return true;return false;}
    private void removeCard(com.fasterxml.jackson.databind.node.ArrayNode cards,String cardId,String title){for(int index=cards.size()-1;index>=0;index--){var card=cards.get(index);
      if(cardId.equals(card.path("id").asText())||canonical(title).equals(canonical(card.path("title").asText())))cards.remove(index);}}
    private void removeText(com.fasterxml.jackson.databind.node.ArrayNode values,String title){for(int index=values.size()-1;index>=0;index--)
      if(canonical(title).equals(canonical(values.get(index).asText())))values.remove(index);}
    private void removeNode(com.fasterxml.jackson.databind.node.ArrayNode items,String id,String title){for(int index=items.size()-1;index>=0;index--){var item=items.get(index);
      if(id.equals(item.path("id").asText())||canonical(title).equals(canonical(item.path("title").asText())))items.remove(index);}}
    private int removeSubjectFromPlans(String courseId,String sectionId,String sectionTitle,String cardId,String cardTitle){int changed=0;
      var plans=jdbc.sql("SELECT id,settings::text settings_json FROM study_plans WHERE course_id=:course").param("course",courseId).query().listOfRows();
      for(var plan:plans){JsonNode settings=parse(String.valueOf(plan.get("settings_json")));JsonNode sections=settings.path("studySections");if(!sections.isArray())continue;
        JsonNode section=null;for(var candidate:sections)if(sectionId.equals(candidate.path("id").asText())||canonical(sectionTitle).equals(canonical(candidate.path("title").asText()))){section=candidate;break;}
        if(section==null||!section.path("cards").isArray())continue;var cards=(com.fasterxml.jackson.databind.node.ArrayNode)section.path("cards");int before=cards.size();removeCard(cards,cardId,cardTitle);
        if(cards.size()!=before){persistPlanSettings(plan.get("id"),settings);changed++;}}return changed;}
    private int removeDisciplineFromPlans(String courseId,String sectionId,String title){int changed=0;
      var plans=jdbc.sql("SELECT id,settings::text settings_json FROM study_plans WHERE course_id=:course").param("course",courseId).query().listOfRows();
      for(var plan:plans){JsonNode settings=parse(String.valueOf(plan.get("settings_json")));JsonNode sections=settings.path("studySections");if(!sections.isArray())continue;
        var values=(com.fasterxml.jackson.databind.node.ArrayNode)sections;int before=values.size();removeNode(values,sectionId,title);
        if(values.size()!=before){persistPlanSettings(plan.get("id"),settings);changed++;}}return changed;}
    private void persistPlanSettings(Object planId,JsonNode settings){jdbc.sql("UPDATE study_plans SET settings=CAST(:settings AS jsonb),updated_at=now() WHERE id=:id")
      .param("settings",settings.toString()).param("id",planId).update();}
    private int mutateRoleAndPlans(UUID roleId,String sectionId,String cardId,CurriculumMutation mutation){
        var role=jdbc.sql("SELECT course_id,curriculum::text curriculum_json FROM catalog_roles WHERE id=:id")
          .param("id",roleId).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Cargo não encontrado"));
        JsonNode curriculum=parse(String.valueOf(role.get("curriculum_json")));
        JsonNode selected=findCard(curriculum,sectionId,cardId);if(selected==null)throw new NoSuchElementException("Assunto não encontrado");
        String discipline=findSectionTitle(curriculum,sectionId);
        SharedSnapshot existing=findSharedById(selected.path("sharedSubjectId").asText());
        if(existing==null)existing=findShared(selected.path("title").asText(),discipline);
        if(existing!=null)applyShared(curriculum,existing);
        if(!mutation.apply(curriculum))throw new NoSuchElementException("Material não encontrado neste assunto");
        JsonNode card=findCard(curriculum,sectionId,cardId);if(card==null)throw new NoSuchElementException("Assunto não encontrado");
        SharedSnapshot shared=upsertShared(discipline,studyGroup(curriculum,sectionId),card);return synchronizeShared(shared);
    }
    private JsonNode parse(String value){try{return new com.fasterxml.jackson.databind.ObjectMapper().readTree(value);}catch(Exception error){throw new IllegalArgumentException("Conteúdo programático inválido");}}
    private JsonNode findCard(JsonNode root,String sectionId,String cardId){JsonNode sections=root.isArray()?root:root.path("studySections");
        if(!sections.isArray())return null;for(var section:sections){if(!sectionId.trim().equals(section.path("id").asText()))continue;
            for(var card:section.path("cards"))if(cardId.trim().equals(card.path("id").asText()))return card;}return null;}
    private String findSectionTitle(JsonNode root,String sectionId){JsonNode sections=root.isArray()?root:root.path("studySections");
        if(sections.isArray())for(var section:sections)if(sectionId.trim().equals(section.path("id").asText()))return section.path("title").asText("");return "";}
    private SharedSnapshot upsertShared(String discipline,String studyGroup,JsonNode card){String title=card.path("title").asText();
        SharedSnapshot equivalent=findShared(title,discipline);String key=equivalent==null?subjectCanonical(title):equivalent.canonicalKey();
        if(equivalent==null&&jdbc.sql("SELECT COUNT(*) FROM shared_study_subjects WHERE canonical_key=:key").param("key",key).query(Long.class).single()>0){
            String suffix=String.format("%08x",canonical(discipline).hashCode());key=key.substring(0,Math.min(171,key.length()))+"-"+suffix;
        }
        String sharedId=jdbc.sql("""
          INSERT INTO shared_study_subjects(canonical_key,title,discipline,study_group,study_objective,review_summary,base_content,key_takeaways,content_blocks)
          VALUES(:key,:title,:discipline,:studyGroup,'', '[]'::jsonb,:content,CAST(:points AS jsonb),CAST(:blocks AS jsonb))
          ON CONFLICT(canonical_key) DO UPDATE SET title=EXCLUDED.title,discipline=EXCLUDED.discipline,
            base_content=EXCLUDED.base_content,key_takeaways=EXCLUDED.key_takeaways,content_blocks=EXCLUDED.content_blocks,updated_at=now()
          RETURNING id::text
          """).param("key",key).param("title",title).param("discipline",discipline).param("studyGroup",studyGroup).param("content",card.path("content").asText(""))
          .param("points",card.path("keyTakeaways").isArray()?card.path("keyTakeaways").toString():"[]")
          .param("blocks",card.path("contentBlocks").isArray()?card.path("contentBlocks").toString():"[]").query(String.class).single();
        return sharedSnapshot(UUID.fromString(sharedId));}
    private SharedSnapshot findShared(String title,String discipline){var rows=jdbc.sql("""
          SELECT id::text id,canonical_key,title,discipline,study_group,study_objective,review_summary::text summary,base_content,key_takeaways::text points,content_blocks::text blocks
          FROM shared_study_subjects
          WHERE gabarita_subject_normalized(title)=gabarita_subject_normalized(:title)
            AND gabarita_subject_normalized(discipline)=gabarita_subject_normalized(:discipline)
          ORDER BY CASE WHEN lower(btrim(title))=lower(gabarita_subject_display_title(:title)) THEN 0 ELSE 1 END,created_at,id
          LIMIT 1
          """).param("title",title).param("discipline",discipline).query().listOfRows();if(rows.isEmpty())return null;var row=rows.getFirst();
        return new SharedSnapshot(String.valueOf(row.get("id")),String.valueOf(row.get("canonical_key")),String.valueOf(row.get("title")),
          String.valueOf(row.get("discipline")),String.valueOf(row.get("study_group")),String.valueOf(row.get("study_objective")),parse(String.valueOf(row.get("summary"))),String.valueOf(row.get("base_content")),parse(String.valueOf(row.get("points"))),parse(String.valueOf(row.get("blocks"))));}
    private SharedSnapshot findSharedById(String value){if(value==null||value.isBlank())return null;try{return sharedSnapshot(UUID.fromString(value));}catch(IllegalArgumentException|NoSuchElementException ignored){return null;}}
    private void hydrateFromLibrary(JsonNode curriculum){var rows=jdbc.sql("""
          SELECT id::text id,canonical_key,title,discipline,study_group,study_objective,review_summary::text summary,base_content,key_takeaways::text points,content_blocks::text blocks
          FROM shared_study_subjects
          """).query().listOfRows();for(var row:rows)applyShared(curriculum,new SharedSnapshot(String.valueOf(row.get("id")),
          String.valueOf(row.get("canonical_key")),String.valueOf(row.get("title")),String.valueOf(row.get("discipline")),String.valueOf(row.get("study_group")),String.valueOf(row.get("study_objective")),parse(String.valueOf(row.get("summary"))),
          String.valueOf(row.get("base_content")),parse(String.valueOf(row.get("points"))),parse(String.valueOf(row.get("blocks")))));}
    private int synchronizeShared(SharedSnapshot shared){return synchronizeShared(List.of(shared));}
    private int synchronizeShared(List<SharedSnapshot> sharedSubjects){
        if(sharedSubjects.isEmpty())return 0;
        var roles=jdbc.sql("SELECT id,curriculum::text curriculum_json FROM catalog_roles").query().listOfRows();
        for(var role:roles){JsonNode curriculum=parse(String.valueOf(role.get("curriculum_json")));if(applyShared(curriculum,sharedSubjects))
            jdbc.sql("UPDATE catalog_roles SET curriculum=CAST(:curriculum AS jsonb),updated_at=now() WHERE id=:id")
              .param("curriculum",curriculum.toString()).param("id",role.get("id")).update();}
        int synchronizedPlans=0;var plans=jdbc.sql("SELECT id,settings::text settings_json FROM study_plans").query().listOfRows();
        for(var plan:plans){JsonNode settings=parse(String.valueOf(plan.get("settings_json")));JsonNode sections=settings.path("studySections");if(applyShared(sections,sharedSubjects)){
            jdbc.sql("UPDATE study_plans SET settings=jsonb_set(settings,'{studySections}',CAST(:sections AS jsonb),true),updated_at=now() WHERE id=:id")
              .param("sections",sections.toString()).param("id",plan.get("id")).update();synchronizedPlans++;}}return synchronizedPlans;}
    private boolean applyShared(JsonNode root,List<SharedSnapshot> sharedSubjects){boolean changed=false;
        for(var shared:sharedSubjects)changed=applyShared(root,shared)||changed;return changed;}
    private boolean applyShared(JsonNode root,SharedSnapshot shared){JsonNode sections=root.isArray()?root:root.path("studySections");if(!sections.isArray())return false;boolean changed=false;
        for(var section:sections)for(var card:section.path("cards"))if(subjectCanonical(shared.title()).equals(subjectCanonical(card.path("title").asText()))
          &&canonical(shared.discipline()).equals(canonical(section.path("title").asText()))){
            var object=(com.fasterxml.jackson.databind.node.ObjectNode)card;object.put("sharedSubjectId",shared.id());object.put("studyObjective",shared.studyObjective());object.set("reviewSummary",shared.reviewSummary().deepCopy());object.put("content",shared.content());
            object.set("keyTakeaways",shared.keyTakeaways().deepCopy());object.set("contentBlocks",shared.contentBlocks().deepCopy());changed=true;}return changed;}
    private String canonical(String value){String normalized=java.text.Normalizer.normalize(text(value),java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","")
      .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("(^-|-$)","");
      if(normalized.length()<=180)return normalized;String hash=String.format("%08x",normalized.hashCode());return normalized.substring(0,171)+"-"+hash;}
    private String subjectCanonical(String value){return canonical(text(value).replaceFirst("^\\s*\\d+(?:\\.\\d+)*[.)-]?\\s*",""));}
    private boolean appendMaterial(JsonNode root,StudyMaterialRequest r,String materialId){JsonNode sections=root.isArray()?root:root.path("studySections");
        JsonNode card=findCard(root,r.sectionId(),r.cardId());if(card==null)return false;
        var block=((com.fasterxml.jackson.databind.node.ObjectNode)card).withArray("contentBlocks").addObject();
        block.put("id",materialId);writeMaterial(block,r);block.put("createdAt",Instant.now().toString());return true;
    }
    private boolean updateMaterial(JsonNode root,StudyMaterialRequest r,String materialId){JsonNode card=findCard(root,r.sectionId(),r.cardId());if(card==null)return false;
        for(var block:card.path("contentBlocks"))if(materialId.equals(block.path("id").asText())){writeMaterial((com.fasterxml.jackson.databind.node.ObjectNode)block,r);return true;}return false;}
    private boolean deleteMaterial(JsonNode root,String sectionId,String cardId,String materialId){JsonNode card=findCard(root,sectionId,cardId);if(card==null||!card.path("contentBlocks").isArray())return false;
        var blocks=(com.fasterxml.jackson.databind.node.ArrayNode)card.path("contentBlocks");for(int index=0;index<blocks.size();index++)if(materialId.equals(blocks.get(index).path("id").asText())){blocks.remove(index);return true;}return false;}
    private boolean updateBaseMaterial(JsonNode root,BaseStudyMaterialRequest r,boolean deleting){JsonNode card=findCard(root,r.sectionId(),r.cardId());if(card==null)return false;
        var object=(com.fasterxml.jackson.databind.node.ObjectNode)card;object.put("content",deleting?"":r.content().trim());var points=object.putArray("keyTakeaways");
        if(!deleting&&r.keyTakeaways()!=null)r.keyTakeaways().stream().map(this::text).filter(value->!value.isBlank()).forEach(points::add);return true;}
    private void writeMaterial(com.fasterxml.jackson.databind.node.ObjectNode block,StudyMaterialRequest r){block.put("title",r.title().trim());block.put("content",r.content().trim());
        var points=block.putArray("keyTakeaways");if(r.keyTakeaways()!=null)r.keyTakeaways().stream().map(this::text).filter(value->!value.isBlank()).forEach(points::add);}
    private String text(String value){return value==null?"":value.trim();}private String fallback(String value,String fallback){String text=text(value);return text.isBlank()?fallback:text;}
}

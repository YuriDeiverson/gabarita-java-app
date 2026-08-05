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

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {
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
    public record StudyDisciplineRequest(@NotBlank String title){}
    public record StudySubjectRequest(@NotBlank String sectionId,@NotBlank String title){}

    @GetMapping public List<Map<String,Object>> all(){currentUser.requireAdmin();return catalog.catalog(true);}

    @PostMapping("/contests") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> createContest(@Valid @RequestBody ContestRequest r){currentUser.requireAdmin();
        return jdbc.sql("""
          INSERT INTO catalog_contests(code,label,acronym,organization,description,board,exam_date,status,state,area,education,
            vacancies,remuneration,location,stages,notice_reference,active)
          VALUES(:code,:label,:acronym,:organization,:description,:board,:date,:status,:state,:area,:education,
            :vacancies,:remuneration,:location,:stages,:notice,:active) RETURNING *
          """).params(contestParams(r)).query().singleRow();}

    @PutMapping("/contests/{id}")
    public Map<String,Object> updateContest(@PathVariable UUID id,@Valid @RequestBody ContestRequest r){currentUser.requireAdmin();
        return jdbc.sql("""
          UPDATE catalog_contests SET code=:code,label=:label,acronym=:acronym,organization=:organization,description=:description,
            board=:board,exam_date=:date,status=:status,state=:state,area=:area,education=:education,vacancies=:vacancies,
            remuneration=:remuneration,location=:location,stages=:stages,notice_reference=:notice,active=:active,updated_at=now()
          WHERE id=:id RETURNING *
          """).params(contestParams(r)).param("id",id).query().singleRow();}

    @DeleteMapping("/contests/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContest(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM catalog_contests WHERE id=:id").param("id",id).update();}

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
        for(var card:section.path("cards"))if(canonical(title).equals(canonical(card.path("title").asText())))
            throw new IllegalArgumentException("Este assunto já existe nesta disciplina");
        String cardId=uniqueId(section.path("cards"),r.sectionId()+"_"+canonical(title).replace('-','_'),"assunto");
        var card=((com.fasterxml.jackson.databind.node.ObjectNode)section).withArray("cards").addObject();
        card.put("id",cardId);card.put("title",title);card.put("paretoRatio","Relevância do edital");card.put("isQuente",false);
        card.put("content","");card.putArray("keyTakeaways");card.putArray("contentBlocks");
        JsonNode topic=findTopic(root,r.sectionId());if(topic!=null)((com.fasterxml.jackson.databind.node.ObjectNode)topic).withArray("subtopics").add(title);
        SharedSnapshot shared=findShared(title);if(shared==null)shared=upsertShared(section.path("title").asText(""),card);else applyShared(root,shared);
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
    private record SharedSnapshot(String id,String canonicalKey,String title,String discipline,String content,JsonNode keyTakeaways,JsonNode contentBlocks){}
    private record RoleCurriculum(String courseId,JsonNode curriculum){}
    private RoleCurriculum roleCurriculum(UUID roleId){var row=jdbc.sql("SELECT course_id,curriculum::text curriculum_json FROM catalog_roles WHERE id=:id")
      .param("id",roleId).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Cargo não encontrado"));
      return new RoleCurriculum(String.valueOf(row.get("course_id")),parse(String.valueOf(row.get("curriculum_json"))));}
    private void persistCurriculum(UUID roleId,JsonNode curriculum){jdbc.sql("UPDATE catalog_roles SET curriculum=CAST(:curriculum AS jsonb),updated_at=now() WHERE id=:id")
      .param("curriculum",curriculum.toString()).param("id",roleId).update();}
    private JsonNode findSection(JsonNode root,String sectionId){for(var section:root.path("studySections"))if(sectionId.trim().equals(section.path("id").asText()))return section;return null;}
    private JsonNode findTopic(JsonNode root,String sectionId){for(var topic:root.path("topics"))if(sectionId.trim().equals(topic.path("id").asText()))return topic;return null;}
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
        SharedSnapshot existing=findShared(selected.path("title").asText());if(existing!=null)applyShared(curriculum,existing);
        if(!mutation.apply(curriculum))throw new NoSuchElementException("Material não encontrado neste assunto");
        JsonNode card=findCard(curriculum,sectionId,cardId);if(card==null)throw new NoSuchElementException("Assunto não encontrado");
        SharedSnapshot shared=upsertShared(findSectionTitle(curriculum,sectionId),card);return synchronizeShared(shared);
    }
    private JsonNode parse(String value){try{return new com.fasterxml.jackson.databind.ObjectMapper().readTree(value);}catch(Exception error){throw new IllegalArgumentException("Conteúdo programático inválido");}}
    private JsonNode findCard(JsonNode root,String sectionId,String cardId){JsonNode sections=root.isArray()?root:root.path("studySections");
        if(!sections.isArray())return null;for(var section:sections){if(!sectionId.trim().equals(section.path("id").asText()))continue;
            for(var card:section.path("cards"))if(cardId.trim().equals(card.path("id").asText()))return card;}return null;}
    private String findSectionTitle(JsonNode root,String sectionId){JsonNode sections=root.isArray()?root:root.path("studySections");
        if(sections.isArray())for(var section:sections)if(sectionId.trim().equals(section.path("id").asText()))return section.path("title").asText("");return "";}
    private SharedSnapshot upsertShared(String discipline,JsonNode card){String title=card.path("title").asText();String key=canonical(title);
        String sharedId=jdbc.sql("""
          INSERT INTO shared_study_subjects(canonical_key,title,discipline,base_content,key_takeaways,content_blocks)
          VALUES(:key,:title,:discipline,:content,CAST(:points AS jsonb),CAST(:blocks AS jsonb))
          ON CONFLICT(canonical_key) DO UPDATE SET title=EXCLUDED.title,discipline=EXCLUDED.discipline,
            base_content=EXCLUDED.base_content,key_takeaways=EXCLUDED.key_takeaways,content_blocks=EXCLUDED.content_blocks,updated_at=now()
          RETURNING id::text
          """).param("key",key).param("title",title).param("discipline",discipline).param("content",card.path("content").asText(""))
          .param("points",card.path("keyTakeaways").isArray()?card.path("keyTakeaways").toString():"[]")
          .param("blocks",card.path("contentBlocks").isArray()?card.path("contentBlocks").toString():"[]").query(String.class).single();
        return new SharedSnapshot(sharedId,key,title,discipline,card.path("content").asText(""),
          card.path("keyTakeaways").isArray()?card.path("keyTakeaways"):parse("[]"),card.path("contentBlocks").isArray()?card.path("contentBlocks"):parse("[]"));}
    private SharedSnapshot findShared(String title){var rows=jdbc.sql("""
          SELECT id::text id,canonical_key,title,discipline,base_content,key_takeaways::text points,content_blocks::text blocks
          FROM shared_study_subjects WHERE canonical_key=:key
          """).param("key",canonical(title)).query().listOfRows();if(rows.isEmpty())return null;var row=rows.getFirst();
        return new SharedSnapshot(String.valueOf(row.get("id")),String.valueOf(row.get("canonical_key")),String.valueOf(row.get("title")),
          String.valueOf(row.get("discipline")),String.valueOf(row.get("base_content")),parse(String.valueOf(row.get("points"))),parse(String.valueOf(row.get("blocks"))));}
    private void hydrateFromLibrary(JsonNode curriculum){var rows=jdbc.sql("""
          SELECT id::text id,canonical_key,title,discipline,base_content,key_takeaways::text points,content_blocks::text blocks
          FROM shared_study_subjects
          """).query().listOfRows();for(var row:rows)applyShared(curriculum,new SharedSnapshot(String.valueOf(row.get("id")),
          String.valueOf(row.get("canonical_key")),String.valueOf(row.get("title")),String.valueOf(row.get("discipline")),
          String.valueOf(row.get("base_content")),parse(String.valueOf(row.get("points"))),parse(String.valueOf(row.get("blocks")))));}
    private int synchronizeShared(SharedSnapshot shared){
        var roles=jdbc.sql("SELECT id,curriculum::text curriculum_json FROM catalog_roles").query().listOfRows();
        for(var role:roles){JsonNode curriculum=parse(String.valueOf(role.get("curriculum_json")));if(applyShared(curriculum,shared))
            jdbc.sql("UPDATE catalog_roles SET curriculum=CAST(:curriculum AS jsonb),updated_at=now() WHERE id=:id")
              .param("curriculum",curriculum.toString()).param("id",role.get("id")).update();}
        int synchronizedPlans=0;var plans=jdbc.sql("SELECT id,settings::text settings_json FROM study_plans").query().listOfRows();
        for(var plan:plans){JsonNode settings=parse(String.valueOf(plan.get("settings_json")));JsonNode sections=settings.path("studySections");if(applyShared(sections,shared)){
            jdbc.sql("UPDATE study_plans SET settings=jsonb_set(settings,'{studySections}',CAST(:sections AS jsonb),true),updated_at=now() WHERE id=:id")
              .param("sections",sections.toString()).param("id",plan.get("id")).update();synchronizedPlans++;}}return synchronizedPlans;}
    private boolean applyShared(JsonNode root,SharedSnapshot shared){JsonNode sections=root.isArray()?root:root.path("studySections");if(!sections.isArray())return false;boolean changed=false;
        for(var section:sections)for(var card:section.path("cards"))if(shared.canonicalKey().equals(canonical(card.path("title").asText()))){
            var object=(com.fasterxml.jackson.databind.node.ObjectNode)card;object.put("sharedSubjectId",shared.id());object.put("content",shared.content());
            object.set("keyTakeaways",shared.keyTakeaways().deepCopy());object.set("contentBlocks",shared.contentBlocks().deepCopy());changed=true;}return changed;}
    private String canonical(String value){return java.text.Normalizer.normalize(text(value),java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","")
      .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("(^-|-$)","");}
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

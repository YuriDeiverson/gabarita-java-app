package ai.gabarita.admin;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
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
        validateCurriculum(r.curriculum());
        return jdbc.sql("""
          INSERT INTO catalog_roles(contest_id,code,label,course_id,board,include_discursive,requirement,remuneration,
            vacancies,estimated_hours,curriculum,active)
          VALUES(:contest,:code,:label,:course,:board,:discursive,:requirement,:remuneration,:vacancies,:hours,CAST(:curriculum AS jsonb),:active)
          RETURNING *
          """).params(roleParams(r)).query().singleRow();}

    @PutMapping("/roles/{id}")
    public Map<String,Object> updateRole(@PathVariable UUID id,@Valid @RequestBody RoleRequest r){currentUser.requireAdmin();
        validateCurriculum(r.curriculum());
        return jdbc.sql("""
          UPDATE catalog_roles SET contest_id=:contest,code=:code,label=:label,course_id=:course,board=:board,
            include_discursive=:discursive,requirement=:requirement,remuneration=:remuneration,vacancies=:vacancies,
            estimated_hours=:hours,curriculum=CAST(:curriculum AS jsonb),active=:active,updated_at=now()
          WHERE id=:id RETURNING *
          """).params(roleParams(r)).param("id",id).query().singleRow();}

    @DeleteMapping("/roles/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable UUID id){currentUser.requireAdmin();jdbc.sql("DELETE FROM catalog_roles WHERE id=:id").param("id",id).update();}

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
    private String text(String value){return value==null?"":value.trim();}private String fallback(String value,String fallback){String text=text(value);return text.isBlank()?fallback:text;}
}

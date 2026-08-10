package ai.gabarita.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final JdbcClient jdbc;private final ObjectMapper json;
    public CatalogController(JdbcClient jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}

    @GetMapping("/contests")
    public List<Map<String,Object>> contests(
      @RequestParam(defaultValue="false") boolean includeCurriculum
    ){return catalog(false,includeCurriculum);}

    @GetMapping("/contests/{id}")
    public Map<String,Object> contestDetails(@PathVariable UUID id){
        var rows=jdbc.sql("""
          SELECT id,code,label,acronym,organization,description,board,exam_date,status,state,area,education,
            vacancies,remuneration,location,stages,notice_reference,active,
            notice_pdf IS NOT NULL notice_pdf_available,notice_pdf_name,notice_pdf_size,notice_pdf_updated_at
          FROM catalog_contests WHERE id=:id AND active
          """).param("id",id).query().listOfRows();
        if(rows.isEmpty())throw new NoSuchElementException("Concurso não encontrado");
        var item=contest(rows.getFirst());
        var roles=roles(id,false,true);
        if(roles.isEmpty())throw new NoSuchElementException("Nenhum cargo disponível para este concurso");
        item.put("roles",roles);
        return item;
    }

    @GetMapping("/contests/{id}/notice-pdf")
    public ResponseEntity<byte[]> noticePdf(@PathVariable UUID id){
        var rows=jdbc.sql("SELECT notice_pdf,notice_pdf_name FROM catalog_contests WHERE id=:id AND notice_pdf IS NOT NULL")
          .param("id",id).query().listOfRows();
        if(rows.isEmpty())throw new NoSuchElementException("Edital em PDF não encontrado");
        var row=rows.getFirst();
        byte[] content=(byte[])row.get("notice_pdf");String filename=String.valueOf(row.get("notice_pdf_name"));
        var disposition=ContentDisposition.inline().filename(filename,StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).contentLength(content.length)
          .header(HttpHeaders.CONTENT_DISPOSITION,disposition.toString()).body(content);
    }

    @GetMapping("/study-library")
    public List<Map<String,Object>> studyLibrary(){
        var rows=jdbc.sql("""
          SELECT id::text id,canonical_key,title,discipline,study_group,study_objective,review_summary::text review_summary_json,
            base_content,key_takeaways::text key_takeaways_json,content_blocks::text content_blocks_json,updated_at
          FROM shared_study_subjects ORDER BY study_group,discipline,title
          """).query().listOfRows();var result=new ArrayList<Map<String,Object>>();
        for(var row:rows){var item=new LinkedHashMap<String,Object>();item.put("id",row.get("id"));item.put("canonicalKey",row.get("canonical_key"));
            item.put("title",row.get("title"));item.put("discipline",row.get("discipline"));item.put("studyGroup",row.get("study_group"));item.put("studyObjective",row.get("study_objective"));item.put("content",row.get("base_content"));
            try{item.put("keyTakeaways",json.readTree(String.valueOf(row.get("key_takeaways_json"))));}catch(Exception ignored){item.put("keyTakeaways",List.of());}
            try{item.put("reviewSummary",json.readTree(String.valueOf(row.get("review_summary_json"))));}catch(Exception ignored){item.put("reviewSummary",List.of());}
            try{item.put("contentBlocks",json.readTree(String.valueOf(row.get("content_blocks_json"))));}catch(Exception ignored){item.put("contentBlocks",List.of());}
            item.put("updatedAt",row.get("updated_at"));result.add(item);}return result;
    }

    List<Map<String,Object>> catalog(boolean includeInactive,boolean includeCurriculum){
        var contests=jdbc.sql("""
          SELECT id,code,label,acronym,organization,description,board,exam_date,status,state,area,education,
            vacancies,remuneration,location,stages,notice_reference,active,
            notice_pdf IS NOT NULL notice_pdf_available,notice_pdf_name,notice_pdf_size,notice_pdf_updated_at
          FROM catalog_contests
          WHERE (:all OR active AND exam_date>=(now() AT TIME ZONE 'America/Maceio')::date)
          ORDER BY exam_date,label
          """).param("all",includeInactive).query().listOfRows();
        var result=new ArrayList<Map<String,Object>>();
        for(var row:contests){
            UUID contestId=(UUID)row.get("id");
            var roleItems=roles(contestId,includeInactive,includeCurriculum);
            var item=contest(row);
            if(!includeInactive&&roleItems.isEmpty())continue;
            item.put("roles",roleItems);result.add(item);
        }
        return result;
    }

    private List<Map<String,Object>> roles(UUID contestId,boolean includeInactive,boolean includeCurriculum){
        String curriculumColumn=includeCurriculum ? ",curriculum::text curriculum_json" : "";
        var rows=jdbc.sql("""
          SELECT id,code,label,course_id,board,include_discursive,requirement,remuneration,vacancies,
            estimated_hours,active%s
          FROM catalog_roles WHERE contest_id=:contest AND (:all OR active) ORDER BY label
          """.formatted(curriculumColumn)).param("contest",contestId).param("all",includeInactive).query().listOfRows();
        var result=new ArrayList<Map<String,Object>>();
        for(var row:rows)result.add(role(row,contestId,includeCurriculum));
        return result;
    }

    Map<String,Object> contest(Map<String,Object> row){
        var item=new LinkedHashMap<String,Object>();
        item.put("databaseId",String.valueOf(row.get("id")));item.put("id",row.get("code"));item.put("label",row.get("label"));
        item.put("acronym",row.get("acronym"));item.put("organization",row.get("organization"));item.put("description",row.get("description"));
        item.put("board",row.get("board"));item.put("examDate",date(row.get("exam_date")).toString());item.put("status",row.get("status"));
        item.put("state",row.get("state"));item.put("area",row.get("area"));item.put("education",row.get("education"));
        item.put("vacancies",row.get("vacancies"));item.put("remuneration",row.get("remuneration"));item.put("location",row.get("location"));
        item.put("stages",row.get("stages"));item.put("noticeReference",row.get("notice_reference"));item.put("active",row.get("active"));
        item.put("noticePdfAvailable",row.get("notice_pdf_available"));item.put("noticePdfName",row.get("notice_pdf_name"));
        item.put("noticePdfSize",row.get("notice_pdf_size"));item.put("noticePdfUpdatedAt",row.get("notice_pdf_updated_at"));return item;
    }
    Map<String,Object> role(Map<String,Object> row,UUID contestId,boolean includeCurriculum){
        var item=new LinkedHashMap<String,Object>();item.put("databaseId",String.valueOf(row.get("id")));item.put("contestDatabaseId",contestId.toString());
        item.put("id",row.get("code"));item.put("label",row.get("label"));item.put("courseId",row.get("course_id"));item.put("board",row.get("board"));
        item.put("includeDiscursive",row.get("include_discursive"));item.put("requirement",row.get("requirement"));item.put("remuneration",row.get("remuneration"));
        item.put("vacancies",row.get("vacancies"));item.put("estimatedHours",row.get("estimated_hours"));item.put("active",row.get("active"));
        if(includeCurriculum){
            try{item.put("curriculum",json.readTree(String.valueOf(row.get("curriculum_json"))));}catch(Exception ignored){item.put("curriculum",json.createObjectNode());}
        }
        return item;
    }
    private LocalDate date(Object value){if(value instanceof LocalDate date)return date;if(value instanceof java.sql.Date date)return date.toLocalDate();return LocalDate.parse(String.valueOf(value));}
}

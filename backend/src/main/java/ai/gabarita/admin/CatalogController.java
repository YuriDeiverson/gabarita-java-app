package ai.gabarita.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final JdbcClient jdbc;private final ObjectMapper json;
    public CatalogController(JdbcClient jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}

    @GetMapping("/contests")
    public List<Map<String,Object>> contests(){return catalog(false);}

    List<Map<String,Object>> catalog(boolean includeInactive){
        var contests=jdbc.sql("""
          SELECT id,code,label,acronym,organization,description,board,exam_date,status,state,area,education,
            vacancies,remuneration,location,stages,notice_reference,active
          FROM catalog_contests
          WHERE (:all OR active AND exam_date>=(now() AT TIME ZONE 'America/Maceio')::date)
          ORDER BY exam_date,label
          """).param("all",includeInactive).query().listOfRows();
        var result=new ArrayList<Map<String,Object>>();
        for(var row:contests){
            UUID contestId=(UUID)row.get("id");
            var roles=jdbc.sql("""
              SELECT id,code,label,course_id,board,include_discursive,requirement,remuneration,vacancies,
                estimated_hours,curriculum::text curriculum_json,active
              FROM catalog_roles WHERE contest_id=:contest AND (:all OR active) ORDER BY label
              """).param("contest",contestId).param("all",includeInactive).query().listOfRows();
            var item=contest(row);var roleItems=new ArrayList<Map<String,Object>>();
            for(var role:roles)roleItems.add(role(role,contestId));
            if(!includeInactive&&roleItems.isEmpty())continue;
            item.put("roles",roleItems);result.add(item);
        }
        return result;
    }

    Map<String,Object> contest(Map<String,Object> row){
        var item=new LinkedHashMap<String,Object>();
        item.put("databaseId",String.valueOf(row.get("id")));item.put("id",row.get("code"));item.put("label",row.get("label"));
        item.put("acronym",row.get("acronym"));item.put("organization",row.get("organization"));item.put("description",row.get("description"));
        item.put("board",row.get("board"));item.put("examDate",date(row.get("exam_date")).toString());item.put("status",row.get("status"));
        item.put("state",row.get("state"));item.put("area",row.get("area"));item.put("education",row.get("education"));
        item.put("vacancies",row.get("vacancies"));item.put("remuneration",row.get("remuneration"));item.put("location",row.get("location"));
        item.put("stages",row.get("stages"));item.put("noticeReference",row.get("notice_reference"));item.put("active",row.get("active"));return item;
    }
    Map<String,Object> role(Map<String,Object> row,UUID contestId){
        var item=new LinkedHashMap<String,Object>();item.put("databaseId",String.valueOf(row.get("id")));item.put("contestDatabaseId",contestId.toString());
        item.put("id",row.get("code"));item.put("label",row.get("label"));item.put("courseId",row.get("course_id"));item.put("board",row.get("board"));
        item.put("includeDiscursive",row.get("include_discursive"));item.put("requirement",row.get("requirement"));item.put("remuneration",row.get("remuneration"));
        item.put("vacancies",row.get("vacancies"));item.put("estimatedHours",row.get("estimated_hours"));item.put("active",row.get("active"));
        try{item.put("curriculum",json.readTree(String.valueOf(row.get("curriculum_json"))));}catch(Exception ignored){item.put("curriculum",json.createObjectNode());}
        return item;
    }
    private LocalDate date(Object value){if(value instanceof LocalDate date)return date;if(value instanceof java.sql.Date date)return date.toLocalDate();return LocalDate.parse(String.valueOf(value));}
}

package ai.gabarita.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScheduleEngineTest {
    private final ObjectMapper json = new ObjectMapper();
    private final ScheduleEngine engine = new ScheduleEngine(null,json);

    @Test
    void usesFixedPomodoroBlocksAndKeepsQuestionsOutsideDeclaredTime() {
        var sections=json.createArrayNode().add(section("specific","Conhecimentos Específicos","50%","Redes"));
        var blocks=blocks(engine.generateLegacy(request(sections,2,20)));
        var content=blocks.stream().filter(block->"THEORY".equals(block.get("activityType"))).toList();
        var questions=blocks.stream().filter(block->"QUESTIONS".equals(block.get("activityType"))).toList();

        assertTrue(content.stream().allMatch(block->Integer.valueOf(60).equals(block.get("durationMinutes"))));
        assertTrue(questions.stream().allMatch(block->Integer.valueOf(30).equals(block.get("durationMinutes"))));
        assertTrue(questions.stream().allMatch(block->Boolean.TRUE.equals(block.get("isOptional"))));
        assertTrue(questions.stream().allMatch(block->Boolean.TRUE.equals(block.get("outsidePlannedHours"))));
        assertEquals(120,content.stream().filter(block->LocalDate.now().equals(block.get("isoDate")))
                .mapToInt(block->(Integer)block.get("durationMinutes")).sum());
    }

    @Test
    void distributesSessionsProportionallyToExamWeight() {
        var sections=json.createArrayNode()
                .add(section("specific","Conhecimentos Específicos","50%","Redes"))
                .add(section("general","Conhecimentos Gerais","30%","Português"));
        var content=blocks(engine.generateLegacy(request(sections,4,30))).stream()
                .filter(block->"THEORY".equals(block.get("activityType"))).toList();
        long specific=countSubject(content,"Conhecimentos Específicos");
        long general=countSubject(content,"Conhecimentos Gerais");

        assertTrue(specific>general);
        assertTrue(Math.abs((double)specific/general-(50d/30d))<.25);
    }

    @Test
    void lowWeightSubjectsStillAppearButReceiveFewerSessions() {
        var sections=json.createArrayNode()
                .add(section("high","Peso alto","50%","Assunto principal"))
                .add(section("low","Peso baixo","5%","Assunto de apoio"));
        var content=blocks(engine.generateLegacy(request(sections,4,30))).stream()
                .filter(block->"THEORY".equals(block.get("activityType"))).toList();
        long high=countSubject(content,"Peso alto");
        long low=countSubject(content,"Peso baixo");

        assertTrue(low>0,"Assuntos de baixo peso não podem desaparecer do cronograma");
        assertTrue(high>=low*7,"O assunto de 5% deve receber muito menos sessões que o de 50%");
    }

    @Test
    void excludesWeekdaysNotSelectedByTheStudent() {
        var settings=json.createObjectNode();
        var preferences=settings.putObject("preferences");
        preferences.putArray("selectedWeekdays").add(1).add(2).add(3).add(4).add(5);
        var hours=preferences.putObject("hoursByWeekday");
        for(int day=1;day<=5;day++)hours.put(String.valueOf(day),2);

        assertTrue(ScheduleEngine.availableOn(settings,LocalDate.of(2026,8,31)));
        assertTrue(!ScheduleEngine.availableOn(settings,LocalDate.of(2026,9,5)));
    }

    private ScheduleController.GenerateRequest request(JsonNode sections,double hours,int days){
        return new ScheduleController.GenerateRequest("curso",LocalDate.now().plusDays(days),
                List.of(day("segunda-feira",hours),day("terça-feira",hours),day("quarta-feira",hours),
                        day("quinta-feira",hours),day("sexta-feira",hours),day("sábado",hours),day("domingo",hours)),
                sections,60);
    }

    private long countSubject(List<Map<String,Object>> blocks,String subject){
        return blocks.stream().filter(block->subject.equals(block.get("subjectTitle"))).count();
    }

    private List<Map<String,Object>> blocks(List<Map<String,Object>> weeks){
        return weeks.stream().flatMap(week->{
            @SuppressWarnings("unchecked") var values=(List<Map<String,Object>>)week.get("blocks");
            return values.stream();
        }).toList();
    }

    private ScheduleController.StudyDay day(String name,double hours){return new ScheduleController.StudyDay(name,hours);}

    private com.fasterxml.jackson.databind.node.ObjectNode section(String id,String title,String weight,String topic){
        var section=json.createObjectNode();section.put("id",id);section.put("title",title);section.put("weight",weight);
        section.put("difficulty","Médio");section.put("learningTrack","specific");section.put("learningOrder",0);
        section.putArray("cards").add(json.createObjectNode().put("title",topic));return section;
    }
}

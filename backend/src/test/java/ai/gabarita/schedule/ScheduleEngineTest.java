package ai.gabarita.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScheduleEngineTest {
    private final ObjectMapper json = new ObjectMapper();
    private final ScheduleEngine engine = new ScheduleEngine(null, json);
    private final List<ScheduleController.StudyDay> everyDay = List.of(
            day("segunda-feira",3),day("terça-feira",3),day("quarta-feira",3),day("quinta-feira",3),
            day("sexta-feira",3),day("sábado",3),day("domingo",3));

    @Test
    void buildsFifteenDaySprintWithMappingParetoAndFourDayClosing() {
        var sections=json.createArrayNode()
                .add(section("portugues","Língua Portuguesa","25%","Fácil","Interpretação de textos"))
                .add(section("direito","Direito","10%","Difícil","Atos administrativos"));

        var blocks=blocks(engine.generateLegacy(new ScheduleController.GenerateRequest(
                "seplag_informatica",LocalDate.now().plusDays(15),everyDay,sections,60)));
        var byDate=blocks.stream().collect(java.util.stream.Collectors.groupingBy(
                block->(LocalDate)block.get("isoDate"),java.util.LinkedHashMap::new,java.util.stream.Collectors.toList()));
        var dates=byDate.keySet().stream().toList();

        assertEquals("READING",byDate.get(dates.get(0)).getFirst().get("activityType"));
        assertEquals("READING",byDate.get(dates.get(1)).getFirst().get("activityType"));
        var paretoDay=byDate.get(dates.get(2));
        assertEquals(54,paretoDay.stream().filter(block->"THEORY".equals(block.get("activityType")))
                .mapToInt(block->(Integer)block.get("durationMinutes")).sum());
        assertEquals(126,paretoDay.stream().filter(block->"QUESTIONS".equals(block.get("activityType")))
                .mapToInt(block->(Integer)block.get("durationMinutes")).sum());
        assertTrue(paretoDay.stream().allMatch(block->Boolean.FALSE.equals(block.get("outsidePlannedHours"))));

        assertEquals(List.of("FLASHCARDS","SIMULATION","REVIEW","FLASHCARDS"),dates.stream().skip(dates.size()-4L)
                .map(date->String.valueOf(byDate.get(date).getFirst().get("activityType"))).toList());
        assertTrue(String.valueOf(byDate.get(dates.get(dates.size()-2)).getFirst().get("title")).contains("colchão"));
    }

    @Test
    void oneMonthPlanMapsFirstThenUsesWholeLastWeekForReviewAndSimulations() {
        var sections=json.createArrayNode()
                .add(section("sus","SUS","25%","Médio","Leis 8.080 e 8.142"))
                .add(section("portugues","Português","15%","Fácil","Interpretação"));

        var blocks=blocks(engine.generateLegacy(new ScheduleController.GenerateRequest(
                "tecnico_enfermagem",LocalDate.now().plusDays(30),everyDay,sections,60)));
        var dates=blocks.stream().map(block->(LocalDate)block.get("isoDate")).distinct().toList();
        assertEquals("READING",blocks.stream().filter(block->dates.getFirst().equals(block.get("isoDate"))).findFirst().orElseThrow().get("activityType"));

        var finalWeek=blocks.stream().filter(block->!((LocalDate)block.get("isoDate")).isBefore(LocalDate.now().plusDays(23))).toList();
        assertFalse(finalWeek.isEmpty());
        assertTrue(finalWeek.stream().noneMatch(block->"THEORY".equals(block.get("activityType"))||"READING".equals(block.get("activityType"))));
        assertTrue(finalWeek.stream().anyMatch(block->"SIMULATION".equals(block.get("activityType"))));
        assertTrue(finalWeek.stream().anyMatch(block->String.valueOf(block.get("title")).contains("colchão")));
    }

    @Test
    void shortPlanCutsToHighestReturnTwentyPercentOfSubtopics() {
        var sections=json.createArrayNode()
                .add(section("high","Peso alto","40%","Fácil","Prioridade máxima"))
                .add(section("low1","Peso baixo 1","5%","Difícil","Baixo 1"))
                .add(section("low2","Peso baixo 2","5%","Difícil","Baixo 2"))
                .add(section("low3","Peso baixo 3","5%","Difícil","Baixo 3"))
                .add(section("low4","Peso baixo 4","5%","Difícil","Baixo 4"));

        var blocks=blocks(engine.generateLegacy(new ScheduleController.GenerateRequest(
                "jornalismo",LocalDate.now().plusDays(15),everyDay,sections,60)));
        var pareto=blocks.stream().filter(block->"THEORY".equals(block.get("activityType"))||"QUESTIONS".equals(block.get("activityType"))).toList();
        assertFalse(pareto.isEmpty());
        assertTrue(pareto.stream().allMatch(block->"Prioridade máxima".equals(block.get("topicTitle"))));
    }

    @Test
    void longPlanStartsWithDiagnosticAddsSpacedReviewsAndConvergesToFinalSprint() {
        var sections=json.createArrayNode()
                .add(section("portugues","Língua Portuguesa","25%","Fácil","Interpretação","Sintaxe"))
                .add(section("ti","Tecnologia da Informação","20%","Médio","Segurança","Banco de dados"));

        var blocks=blocks(engine.generateLegacy(new ScheduleController.GenerateRequest(
                "seplag_informatica",LocalDate.now().plusDays(60),everyDay,sections,60)));
        var firstDate=blocks.stream().map(block->(LocalDate)block.get("isoDate")).min(LocalDate::compareTo).orElseThrow();
        assertEquals("SIMULATION",blocks.stream().filter(block->firstDate.equals(block.get("isoDate"))).findFirst().orElseThrow().get("activityType"));
        for(int offset:List.of(1,7,30))assertTrue(blocks.stream().anyMatch(block->
                !((LocalDate)block.get("isoDate")).isBefore(firstDate.plusDays(offset))&&"REVIEW".equals(block.get("activityType"))));
        var closing=blocks.stream().filter(block->!((LocalDate)block.get("isoDate")).isBefore(LocalDate.now().plusDays(56))).toList();
        assertTrue(closing.stream().allMatch(block->!"THEORY".equals(block.get("activityType"))));
    }

    @Test
    void keepsThePoliceThirtyHourWorkweekOutsideTheDeadlineSprint() {
        var sections=json.createArrayNode()
                .add(section("portugues","Língua Portuguesa","10%","Médio","Interpretação"))
                .add(section("pc_ti_seguranca_cibernetica","Tecnologia da Informação e Segurança Cibernética","10%","Médio","Segurança"))
                .add(section("pc_direito_penal","Noções de Direito Penal","10%","Difícil","Lei penal"));
        var weekdays=List.of(day("segunda-feira",6),day("terça-feira",6),day("quarta-feira",6),
                day("quinta-feira",6),day("sexta-feira",6));

        var blocks=blocks(engine.generateLegacy(new ScheduleController.GenerateRequest(
                "policial_civil",LocalDate.now().plusDays(60),weekdays,sections,60)));
        LocalDate monday=LocalDate.now().plusWeeks(1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        var workweek=blocks.stream().filter(block->{LocalDate date=(LocalDate)block.get("isoDate");
            return !date.isBefore(monday)&&!date.isAfter(monday.plusDays(4));}).toList();

        assertEquals(1_980,workweek.stream().mapToInt(block->(Integer)block.get("durationMinutes")).sum());
        assertEquals(180,workweek.stream().filter(block->"QUESTIONS".equals(block.get("activityType")))
                .mapToInt(block->(Integer)block.get("durationMinutes")).sum());
        assertTrue(workweek.stream().filter(block->!"QUESTIONS".equals(block.get("activityType")))
                .allMatch(block->(Integer)block.get("durationMinutes")==60));
    }

    private List<Map<String,Object>> blocks(List<Map<String,Object>> weeks){
        return weeks.stream().flatMap(week->{
            @SuppressWarnings("unchecked") var values=(List<Map<String,Object>>)week.get("blocks");return values.stream();
        }).toList();
    }

    private ScheduleController.StudyDay day(String name,double hours){return new ScheduleController.StudyDay(name,hours);}

    private com.fasterxml.jackson.databind.node.ObjectNode section(
            String id,String title,String weight,String difficulty,String... topics){
        var section=json.createObjectNode();section.put("id",id);section.put("title",title);section.put("weight",weight);
        section.put("difficulty",difficulty);section.put("learningTrack","specific");section.put("learningOrder",0);
        var cards=section.putArray("cards");for(String topic:topics)cards.add(json.createObjectNode().put("title",topic));return section;
    }
}

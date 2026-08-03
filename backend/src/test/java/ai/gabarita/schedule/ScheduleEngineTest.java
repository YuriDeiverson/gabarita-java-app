package ai.gabarita.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScheduleEngineTest {
    private final ObjectMapper json = new ObjectMapper();
    private final ScheduleEngine engine = new ScheduleEngine(null, json);

    @Test
    void keepsPlannedHoursForContentAndAddsQuestionsOutsideTheGoal() {
        var sections = json.createArrayNode()
                .add(section("portugues", "Língua Portuguesa", "basic", 0, "Interpretação de textos"))
                .add(section("ti_basica", "Tecnologia da Informação", "specific", 1, "Segurança da informação"));
        var days = List.of(
                new ScheduleController.StudyDay("segunda-feira", 3),
                new ScheduleController.StudyDay("terça-feira", 3),
                new ScheduleController.StudyDay("quarta-feira", 3),
                new ScheduleController.StudyDay("quinta-feira", 3),
                new ScheduleController.StudyDay("sexta-feira", 3),
                new ScheduleController.StudyDay("sábado", 3),
                new ScheduleController.StudyDay("domingo", 3));

        var weeks = engine.generateLegacy(new ScheduleController.GenerateRequest(
                "seplag_informatica", LocalDate.now().plusDays(1), days, sections, 30));
        @SuppressWarnings("unchecked")
        var blocks = (List<Map<String,Object>>) weeks.getFirst().get("blocks");

        assertEquals(4, blocks.size());
        assertTrue(blocks.stream().allMatch(block -> (Integer) block.get("durationMinutes") == 60));
        assertEquals(3, blocks.stream().filter(block -> "THEORY".equals(block.get("activityType"))).count());
        assertEquals("QUESTIONS", blocks.getLast().get("activityType"));
        assertEquals(Boolean.TRUE,blocks.getLast().get("outsidePlannedHours"));
        assertEquals(Boolean.FALSE,blocks.getLast().get("isOptional"));
    }

    @Test
    void generatesOneHourPomodoroCyclesUsingTheWholePoliceDailyWorkload() {
        var card = json.createObjectNode();
        card.put("title", "Aplicação da lei penal");
        card.putArray("keyTakeaways").add("Lei penal no tempo").add("Lei penal no espaço");

        var section = json.createObjectNode();
        section.put("id", "pc_direito_penal");
        section.put("title", "Noções de Direito Penal");
        section.put("weight", "10%");
        section.put("difficulty", "Médio");
        section.putArray("cards").add(card);

        var days = List.of(
                new ScheduleController.StudyDay("segunda-feira", 6),
                new ScheduleController.StudyDay("terça-feira", 6),
                new ScheduleController.StudyDay("quarta-feira", 6),
                new ScheduleController.StudyDay("quinta-feira", 6),
                new ScheduleController.StudyDay("sexta-feira", 6),
                new ScheduleController.StudyDay("sábado", 6),
                new ScheduleController.StudyDay("domingo", 6));
        var sections = json.createArrayNode().add(section);
        var request = new ScheduleController.GenerateRequest(
                "policial_civil", LocalDate.now().plusDays(2), days, sections, 60);

        var weeks = engine.generateLegacy(request);
        assertFalse(weeks.isEmpty());

        @SuppressWarnings("unchecked")
        var blocks = (List<Map<String, Object>>) weeks.getFirst().get("blocks");
        assertFalse(blocks.isEmpty());

        var theory = blocks.stream()
                .filter(block -> "THEORY".equals(block.get("activityType")))
                .toList();
        assertFalse(theory.isEmpty());
        assertTrue(theory.stream().allMatch(block -> "Noções de Direito Penal".equals(block.get("title"))));
        assertTrue(theory.stream().allMatch(block -> "Aplicação da lei penal".equals(block.get("topicTitle"))));
        assertTrue(theory.stream().allMatch(block -> (Integer) block.get("durationMinutes") == 60));

        var blocksByDate = blocks.stream().collect(java.util.stream.Collectors.groupingBy(block -> block.get("isoDate")));
        blocksByDate.values().forEach(dayBlocks -> {
            int totalMinutes = dayBlocks.stream().mapToInt(block -> (Integer) block.get("durationMinutes")).sum();
            var questions=dayBlocks.stream().filter(block -> "QUESTIONS".equals(block.get("activityType"))).findFirst().orElseThrow();
            assertEquals(360+(Integer)questions.get("durationMinutes"), totalMinutes);
            assertEquals(6, dayBlocks.stream().filter(block -> "THEORY".equals(block.get("activityType"))).count());
            assertEquals(1, dayBlocks.stream().filter(block -> "QUESTIONS".equals(block.get("activityType"))).count());
            assertTrue(dayBlocks.stream().filter(block -> "THEORY".equals(block.get("activityType"))).allMatch(block -> (Integer) block.get("durationMinutes") == 60));
            assertEquals("QUESTIONS", dayBlocks.getLast().get("activityType"));
            assertEquals(Boolean.TRUE,questions.get("outsidePlannedHours"));
        });
    }

    @Test
    void keepsPoliceSpecificSubjectsInPedagogicalOrderWhileBasicsRunInParallel() {
        var constitutional = section("pc_direito_constitucional", "Noções de Direito Constitucional", "specific", 1,
                "Direitos e garantias fundamentais", "Segurança pública");
        var administrative = section("pc_direito_administrativo", "Noções de Direito Administrativo", "specific", 2,
                "Organização administrativa");
        var portuguese = section("portugues", "Língua Portuguesa", "basic", 0,
                "Compreensão e interpretação de textos");
        var sections = json.createArrayNode().add(administrative).add(portuguese).add(constitutional);
        var days = List.of(
                new ScheduleController.StudyDay("segunda-feira", 4),
                new ScheduleController.StudyDay("terça-feira", 4),
                new ScheduleController.StudyDay("quarta-feira", 4),
                new ScheduleController.StudyDay("quinta-feira", 4),
                new ScheduleController.StudyDay("sexta-feira", 4),
                new ScheduleController.StudyDay("sábado", 4),
                new ScheduleController.StudyDay("domingo", 4));

        var weeks = engine.generateLegacy(new ScheduleController.GenerateRequest(
                "policial_civil", LocalDate.now().plusDays(2), days, sections, 30));
        @SuppressWarnings("unchecked")
        var blocks = (List<Map<String, Object>>) weeks.getFirst().get("blocks");
        var dates = blocks.stream().map(block -> block.get("isoDate")).distinct().toList();
        var mondayTitles = blocks.stream()
                .filter(block -> dates.getFirst().equals(block.get("isoDate")))
                .filter(block -> "THEORY".equals(block.get("activityType")))
                .map(block -> String.valueOf(block.get("title")))
                .filter(title -> !"Língua Portuguesa".equals(title))
                .toList();
        var tuesdayTitles = blocks.stream()
                .filter(block -> dates.getLast().equals(block.get("isoDate")))
                .filter(block -> "THEORY".equals(block.get("activityType")))
                .map(block -> String.valueOf(block.get("title")))
                .filter(title -> !"Língua Portuguesa".equals(title))
                .toList();

        assertTrue(mondayTitles.stream().allMatch("Noções de Direito Constitucional"::equals));
        assertTrue(tuesdayTitles.stream().allMatch("Noções de Direito Administrativo"::equals));
    }

    @Test
    void distributesTheThirtyHourPoliceWeekInOneHourCyclesWithDailyQuestions() {
        var sections = json.createArrayNode()
                .add(section("portugues", "Língua Portuguesa", "basic", 0, "Português"))
                .add(section("pc_ti_seguranca_cibernetica", "Tecnologia da Informação e Segurança Cibernética", "basic", 1, "TI"))
                .add(section("pc_raciocinio_logico_matematico", "Raciocínio Lógico-Matemático", "basic", 2, "Lógica"))
                .add(section("pc_direitos_humanos", "Noções de Direitos Humanos", "basic", 3, "Direitos Humanos"))
                .add(section("pc_atualidades", "Atualidades", "basic", 4, "Atualidades"))
                .add(section("etica_servico_publico", "Ética no Serviço Público", "basic", 5, "Ética"))
                .add(section("pc_direito_constitucional", "Noções de Direito Constitucional", "specific", 1, "Constitucional"))
                .add(section("pc_direito_administrativo", "Noções de Direito Administrativo", "specific", 2, "Administrativo"))
                .add(section("pc_direito_penal", "Noções de Direito Penal", "specific", 3, "Penal"))
                .add(section("pc_direito_processual_penal", "Noções de Direito Processual Penal", "specific", 4, "Processual"))
                .add(section("pc_legislacao_institucional_alagoas", "Legislação Institucional de Alagoas", "specific", 5, "Institucional"))
                .add(section("pc_legislacao_penal_especial", "Legislação Penal Especial", "specific", 6, "Especial"))
                .add(section("pc_contabilidade", "Noções de Contabilidade", "specific", 7, "Contabilidade"))
                .add(section("pc_analise_financeira_crimes_tributarios", "Análise Financeira e Crimes Tributários", "specific", 8, "Financeira"))
                .add(section("pc_estatistica", "Estatística", "specific", 9, "Estatística"))
                .add(section("pc_analise_dados", "Análise de Dados", "specific", 10, "Dados"))
                .add(section("pc_crimes_ciberneticos_seguranca_digital", "Crimes Cibernéticos e Segurança Digital", "specific", 11, "Cibernéticos"));
        var studyDays = List.of(
                new ScheduleController.StudyDay("segunda-feira", 6),
                new ScheduleController.StudyDay("terça-feira", 6),
                new ScheduleController.StudyDay("quarta-feira", 6),
                new ScheduleController.StudyDay("quinta-feira", 6),
                new ScheduleController.StudyDay("sexta-feira", 6));
        var weeks = engine.generateLegacy(new ScheduleController.GenerateRequest(
                "policial_civil", LocalDate.now().plusDays(14), studyDays, sections, 30));
        var allBlocks = weeks.stream().flatMap(week -> {
            @SuppressWarnings("unchecked")
            var blocks = (List<Map<String,Object>>) week.get("blocks");
            return blocks.stream();
        }).toList();
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        var weekBlocks = allBlocks.stream().filter(block -> {
            LocalDate date = (LocalDate) block.get("isoDate");
            return !date.isBefore(monday) && !date.isAfter(monday.plusDays(4));
        }).toList();

        assertEquals(1_980, minutes(weekBlocks));
        assertTrue(weekBlocks.stream().filter(block -> "THEORY".equals(block.get("activityType"))).allMatch(block -> (Integer) block.get("durationMinutes") == 60));
        assertEquals(180, weekBlocks.stream().filter(block -> "QUESTIONS".equals(block.get("activityType")))
                .mapToInt(block -> (Integer) block.get("durationMinutes")).sum());
        assertEquals(1_800, weekBlocks.stream().filter(block -> "THEORY".equals(block.get("activityType")))
                .mapToInt(block -> (Integer) block.get("durationMinutes")).sum());
        var byDate = weekBlocks.stream().collect(java.util.stream.Collectors.groupingBy(block -> block.get("isoDate")));
        assertEquals(5, byDate.size());
        byDate.values().forEach(dayBlocks -> {
            assertEquals(7, dayBlocks.size());
            assertEquals("QUESTIONS", dayBlocks.getLast().get("activityType"));
        });
        var fridayQuestions=weekBlocks.stream().filter(block -> monday.plusDays(4).equals(block.get("isoDate")))
                .filter(block -> "QUESTIONS".equals(block.get("activityType"))).findFirst().orElseThrow();
        assertEquals(60,fridayQuestions.get("durationMinutes"));
        assertEquals(Boolean.FALSE,fridayQuestions.get("isOptional"));
    }

    private int minutes(List<Map<String,Object>> blocks) {
        return blocks.stream().mapToInt(block -> (Integer) block.get("durationMinutes")).sum();
    }

    private int minutes(List<Map<String,Object>> blocks, String title) {
        return blocks.stream().filter(block -> title.equals(block.get("title")))
                .mapToInt(block -> (Integer) block.get("durationMinutes")).sum();
    }

    private com.fasterxml.jackson.databind.node.ObjectNode section(
            String id, String title, String track, int order, String... topics) {
        var section = json.createObjectNode();
        section.put("id", id);
        section.put("title", title);
        section.put("weight", "10%");
        section.put("difficulty", "Difícil");
        section.put("learningTrack", track);
        section.put("learningOrder", order);
        var cards = section.putArray("cards");
        for (String topic : topics) cards.add(json.createObjectNode().put("title", topic));
        return section;
    }
}

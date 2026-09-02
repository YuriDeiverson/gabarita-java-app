package ai.gabarita.admin;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class StructuredStudyMaterialTest {
    private final AdminCatalogController controller = new AdminCatalogController(null, null, null);

    @Test
    void createsTheMandatorySectionsAndExactlyFiveQuestions() {
        var prepared = controller.prepareStructuredMaterial(validItem(), "Material 1");

        assertEquals("Conhecimentos Específicos", prepared.studyGroup());
        assertTrue(prepared.content().contains("<h2>Introdução</h2>"));
        assertTrue(prepared.content().contains("<h2>Resumo para revisão</h2>"));
        assertTrue(prepared.content().contains("&lt;regra decisiva&gt;"));
        assertFalse(prepared.content().contains("<regra decisiva>"));
        var questions = prepared.contentBlocks().get(0).path("miniQuestions");
        assertEquals(5, questions.size());
        assertEquals("Questão específica 1", questions.get(0).path("prompt").asText());
        assertEquals("Resposta 1 — Comentário técnico 1", questions.get(0).path("answer").asText());
    }

    @Test
    void rejectsRepeatedAnswerNumbers() {
        var item = validItem();
        var repeated = List.of(
          answer(1), answer(1), answer(3), answer(4), answer(5)
        );
        var invalid = copyWith(item, item.title(), repeated);

        var error = assertThrows(IllegalArgumentException.class,
          () -> controller.prepareStructuredMaterial(invalid, "Material 1"));
        assertTrue(error.getMessage().contains("repete a questão 1"));
    }

    @Test
    void rejectsUnfilledTemplateMarkers() {
        var item = validItem();
        var invalid = copyWith(item, "[PREENCHA: título]", item.commentedAnswerKey());

        var error = assertThrows(IllegalArgumentException.class,
          () -> controller.prepareStructuredMaterial(invalid, "Material 1"));
        assertTrue(error.getMessage().contains("marcadores [PREENCHA"));
    }

    private AdminCatalogController.StructuredStudyMaterialItem validItem() {
        String explanation = "Explicação factual do conceito, de suas condições, consequências, limites e aplicação concreta. ".repeat(2);
        return new AdminCatalogController.StructuredStudyMaterialItem(
          "CREATE", null, "Assunto específico", "Disciplina específica", "Conhecimentos Específicos",
          "Compreender o conceito e aplicá-lo corretamente em situações de prova.",
          "A introdução apresenta a finalidade e o contexto do assunto. " + explanation,
          "Os conceitos fundamentais definem elementos e regras, inclusive a <regra decisiva>. " + explanation,
          "O desenvolvimento relaciona funcionamento, condições, consequências, exceções e limites. " + explanation,
          "Os exemplos mostram situações concretas e resolvem cada aplicação passo a passo. " + explanation,
          "A comparação separa conceitos próximos por finalidade, requisito, efeito e exceção. " + explanation,
          "As pegadinhas demonstram inversões conceituais e detalhes que podem induzir ao erro. " + explanation,
          "A cobrança aparece em casos concretos que exigem identificar a regra aplicável. " + explanation,
          List.of(
            "O primeiro ponto resume uma regra específica e sua consequência.",
            "O segundo ponto diferencia dois conceitos pela finalidade jurídica.",
            "O terceiro ponto registra a exceção aplicável ao caso concreto."
          ),
          List.of("Questão específica 1", "Questão específica 2", "Questão específica 3", "Questão específica 4", "Questão específica 5"),
          List.of(answer(1), answer(2), answer(3), answer(4), answer(5))
        );
    }

    private AdminCatalogController.CommentedAnswer answer(int number) {
        return new AdminCatalogController.CommentedAnswer(number, "Resposta " + number, "Comentário técnico " + number);
    }

    private AdminCatalogController.StructuredStudyMaterialItem copyWith(
      AdminCatalogController.StructuredStudyMaterialItem item,
      String title,
      List<AdminCatalogController.CommentedAnswer> answers
    ) {
        return new AdminCatalogController.StructuredStudyMaterialItem(
          item.operation(), item.id(), title, item.discipline(), item.studyGroup(), item.learningObjective(),
          item.introduction(), item.fundamentalConcepts(), item.completeDevelopment(), item.practicalExamples(),
          item.importantComparisons(), item.examTraps(), item.howUsuallyTested(), item.reviewSummary(),
          item.fixationQuestions(), answers
        );
    }
}

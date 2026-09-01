package ai.gabarita.admin;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class StudyMaterialQualityTest {
    private static final List<String> POINTS = List.of(
      "O conceito possui uma finalidade definida.",
      "Seus componentes precisam ser relacionados.",
      "A aplicação deve respeitar os limites do conceito."
    );

    @Test
    void acceptsSpecificStructuredLesson() {
        String content = "<p>" + "Conceito factual e específico. ".repeat(9) + "</p>"
          + "<p>" + "O funcionamento relaciona componentes, condições e consequências. ".repeat(7) + "</p>"
          + "<p>" + "O exemplo mostra a aplicação concreta e também esclarece o limite. ".repeat(7) + "</p>";
        assertDoesNotThrow(() -> StudyMaterialQuality.validate(content, POINTS, POINTS));
        assertTrue(StudyMaterialQuality.isComplete(content, POINTS, POINTS));
    }

    @Test
    void rejectsLegacyGenericLessonEvenWhenLong() {
        String content = "<p>O assunto integra a disciplina e deve ser memorizado.</p>"
          + "<p>" + "Explicação sem conteúdo. ".repeat(25) + "</p>"
          + "<p>" + "Outro trecho genérico. ".repeat(20) + "</p>";
        var error = assertThrows(IllegalArgumentException.class,
          () -> StudyMaterialQuality.validate(content, POINTS, POINTS));
        assertTrue(error.getMessage().contains("texto-modelo"));
        assertFalse(StudyMaterialQuality.isComplete(content, POINTS, POINTS));
    }

    @Test
    void rejectsTheGenericTechnologyTemplateShownToStudents() {
        String content = "<p>Conecte o problema resolvido aos componentes, ao funcionamento, aos benefícios e às limitações da solução.</p>"
          + "<p>" + "Desenhe uma cadeia de entrada, processamento, saída e controle. ".repeat(12) + "</p>"
          + "<p>" + "Imagine uma questão cobrando o assunto e identifique o que o enunciado pede. ".repeat(10) + "</p>";
        assertTrue(StudyMaterialQuality.isGeneric(content));
        assertThrows(IllegalArgumentException.class,
          () -> StudyMaterialQuality.validate(content, POINTS, POINTS));
    }

    @Test
    void rejectsGenericReviewPointsEvenWithAValidBody() {
        String content = "<p>" + "Conceito factual e específico. ".repeat(12) + "</p>"
          + "<p>" + "Funcionamento explicado com causa e efeito. ".repeat(10) + "</p>"
          + "<p>" + "Aplicação concreta com limites técnicos. ".repeat(10) + "</p>";
        var genericPoints = List.of(
          "Qual é a ideia central do assunto?",
          "Como aplicar este assunto?",
          "Qual erro deve ser evitado?"
        );
        assertThrows(IllegalArgumentException.class,
          () -> StudyMaterialQuality.validate(content, genericPoints, POINTS));
    }

    @Test
    void rejectsShortLessonAndRepeatedReview() {
        assertThrows(IllegalArgumentException.class,
          () -> StudyMaterialQuality.validate("<p>Curto.</p>", POINTS, POINTS));
        var repeated = List.of("Mesmo ponto", "Mesmo ponto", "Mesmo ponto");
        String content = "<p>" + "Conceito específico. ".repeat(12) + "</p>"
          + "<p>" + "Desenvolvimento do funcionamento. ".repeat(10) + "</p>"
          + "<p>" + "Exemplo concreto e limite. ".repeat(10) + "</p>";
        assertThrows(IllegalArgumentException.class,
          () -> StudyMaterialQuality.validate(content, repeated, POINTS));
    }
}

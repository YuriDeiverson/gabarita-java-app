package ai.gabarita.admin;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class GuideContentQualityTest {
    @Test void recognizesTheMassGeneratedAnalysis() {
        assertTrue(GuideContentQuality.usesAutomaticTemplate(
          "No item, a proposição examinada é: uma longa cópia. Essa formulação entra em conflito com a definição."));
    }

    @Test void recognizesACompleteStatementInsideTheCorrection() {
        String statement="A administração pública deve observar uma condição extensa e específica antes de praticar o ato descrito.";
        assertTrue(GuideContentQuality.repeatsWhole(statement,"Introdução. "+statement+" Conclusão genérica."));
    }

    @Test void allowsAQuotedDecisiveExcerpt() {
        String statement="A administração pública deve observar uma condição extensa e específica antes de praticar o ato descrito.";
        assertFalse(GuideContentQuality.repeatsWhole(statement,"O termo decisivo é “antes”, pois estabelece a ordem do procedimento."));
    }

    @Test void comparesTextWithoutDependingOnAccentsOrPunctuation() {
        assertTrue(GuideContentQuality.sameText("Paráfrase válida.","parafrase valida"));
    }

    @Test void preventsTheDecisivePointFromGivingAwayTheAnswer() {
        assertTrue(GuideContentQuality.anticipatesAnswer("Portanto, o item está errado."));
        assertFalse(GuideContentQuality.anticipatesAnswer("A conjunção introduz uma relação de oposição entre as orações."));
    }

    @Test void requiresDisciplineAndCataloguedTopicAtTheBeginning() {
        assertTrue(GuideContentQuality.followsHierarchy(
          "Língua Portuguesa → Interpretação de Texto → Inferência",
          "Língua Portuguesa","Interpretação de Texto"));
        assertFalse(GuideContentQuality.followsHierarchy(
          "Interpretação → Inferência","Língua Portuguesa","Interpretação de Texto"));
    }

    @Test void rejectsGenerationResidueAndDecorativeVerdicts() {
        assertTrue(GuideContentQuality.containsEditorialArtifact("Conclusão. ✅ (Certo)"));
        assertTrue(GuideContentQuality.containsEditorialArtifact("texto answerAnalysis: fragmento interno"));
        assertTrue(GuideContentQuality.containsEditorialArtifact("texto com caractere invisível\u200B"));
        assertFalse(GuideContentQuality.containsEditorialArtifact("A relação entre α e β preserva a proporcionalidade."));
    }

    @Test void acceptsAnOfficialAnswerOrANaturalConcludingVerdict() {
        assertTrue(GuideContentQuality.hasConcludingAnswerConfirmation("Após a análise, o gabarito oficial é Certo."));
        assertTrue(GuideContentQuality.hasConcludingAnswerConfirmation("A permissão necessária está presente. Portanto, a afirmação está correta."));
        assertTrue(GuideContentQuality.hasConcludingAnswerConfirmation("As limitações descritas tornam a assertiva errada."));
        assertFalse(GuideContentQuality.hasConcludingAnswerConfirmation("A análise termina sem confirmar a resposta."));
        assertFalse(GuideContentQuality.hasConcludingAnswerConfirmation(
          "O gabarito oficial é Certo. Portanto, confirma-se novamente o gabarito."));
    }

    @Test void detectsWhenTheGuideAdmitsAConflictWithTheSource() {
        assertTrue(GuideContentQuality.admitsSourceOrAnswerConflict(
          "A denominação não é tecnicamente adequada, preservando o gabarito informado."));
        assertFalse(GuideContentQuality.admitsSourceOrAnswerConflict(
          "A regra técnica e os dados do item conduzem à mesma conclusão."));
    }
}

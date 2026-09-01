package ai.gabarita.admin;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

final class StudyMaterialQuality {
    private static final int MIN_CONTENT_LENGTH = 500;
    private static final List<String> GENERIC_MARKERS = List.of(
      "integra a disciplina",
      "deve ser estudado como uma ferramenta",
      "comece pelo conceito central",
      "identifique o que o enunciado pede"
    );

    private StudyMaterialQuality() {}

    static void validate(String content, List<String> keyTakeaways, List<String> reviewSummary) {
        String plain = plainText(content);
        if (plain.length() < MIN_CONTENT_LENGTH) {
            throw new IllegalArgumentException(
              "A aula deve explicar o assunto com pelo menos 500 caracteres, incluindo conceito, funcionamento e exemplo"
            );
        }
        String normalized = normalize(plain);
        if (GENERIC_MARKERS.stream().map(StudyMaterialQuality::normalize).anyMatch(normalized::contains)) {
            throw new IllegalArgumentException(
              "Substitua o texto-modelo por uma explicação factual e específica deste assunto"
            );
        }
        long paragraphs = content == null ? 0 : content.split("(?i)</p>|(?:\\r?\\n){2,}").length;
        if (paragraphs < 3) {
            throw new IllegalArgumentException(
              "Organize a aula em pelo menos três partes: conceito, desenvolvimento e exemplo ou aplicação"
            );
        }
        validatePoints(keyTakeaways, "pontos-chave");
        validatePoints(reviewSummary, "itens de revisão");
    }

    static boolean isComplete(String content, List<String> keyTakeaways, List<String> reviewSummary) {
        try {
            validate(content, keyTakeaways, reviewSummary);
            return true;
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    private static void validatePoints(List<String> values, String label) {
        List<String> useful = values == null ? List.of() : values.stream()
          .filter(value -> value != null && !value.isBlank())
          .toList();
        if (useful.size() < 3) {
            throw new IllegalArgumentException("Informe ao menos três " + label + " específicos do assunto");
        }
        Set<String> unique = new HashSet<>();
        for (String value : useful) unique.add(normalize(value));
        if (unique.size() != useful.size()) {
            throw new IllegalArgumentException("Os " + label + " não podem repetir a mesma informação");
        }
    }

    private static String plainText(String value) {
        return value == null ? "" : value
          .replaceAll("(?is)<script[^>]*>.*?</script>", " ")
          .replaceAll("(?s)<[^>]+>", " ")
          .replace("&nbsp;", " ")
          .replace("&amp;", "&")
          .replaceAll("\\s+", " ")
          .trim();
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
          .replaceAll("\\p{M}", "")
          .toLowerCase(Locale.ROOT)
          .replaceAll("[^a-z0-9]+", " ")
          .trim();
    }
}

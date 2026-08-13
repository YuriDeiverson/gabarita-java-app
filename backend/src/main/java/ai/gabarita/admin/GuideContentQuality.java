package ai.gabarita.admin;

import java.text.Normalizer;
import java.util.Locale;

/** Regras editoriais que impedem um texto longo de se passar por aula completa. */
final class GuideContentQuality {
    private GuideContentQuality() {}

    static boolean usesAutomaticTemplate(String value) {
        String text=normalized(value);
        return text.contains("a proposicao examinada e")
          || text.contains("a proposicao anulada e")
          || text.contains("conforme o conceito")
          || text.contains("essa formulacao atribui ao assunto o mesmo funcionamento")
          || text.contains("essa formulacao entra em conflito com a definicao");
    }

    static boolean anticipatesAnswer(String value) {
        String text=normalized(value);
        return text.contains("gabarito")
          || text.matches(".*\\b(item|afirmacao) (esta|e) (certo|correto|errado|incorreto)\\b.*")
          || text.matches(".*\\bportanto.{0,30}\\b(certo|correto|errado|incorreto)\\b.*");
    }

    static boolean followsHierarchy(String detailedTopic,String subject,String topic) {
        return normalized(detailedTopic).startsWith(normalized(subject+" "+topic));
    }

    static boolean repeatsWhole(String source,String candidate) {
        String expected=normalized(source);String supplied=normalized(candidate);
        return expected.length()>=80&&supplied.contains(expected);
    }

    static boolean sameText(String first,String second) {
        String left=normalized(first);String right=normalized(second);
        return !left.isBlank()&&left.equals(right);
    }

    private static String normalized(String value) {
        return Normalizer.normalize(value==null?"":value,Normalizer.Form.NFD)
          .replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();
    }
}

package ai.gabarita.admin;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Regras editoriais que impedem um texto longo de se passar por aula completa. */
final class GuideContentQuality {
    private static final Pattern FORBIDDEN_CHARACTERS=Pattern.compile("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\uFEFF\\uFFFC]");
    private static final Pattern DECORATED_VERDICT=Pattern.compile("(?iu)\\(\\s*(certo|errado)\\s*\\)|\\[\\s*confirmado\\s*:\\s*(certo|errado)\\s*]|\\\\n|\\*\\*\\s*gabarito");
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

    static boolean containsEditorialArtifact(String value) {
        String raw=value==null?"":value;String text=normalized(raw);
        if(FORBIDDEN_CHARACTERS.matcher(raw).find()||DECORATED_VERDICT.matcher(raw).find())return true;
        if(raw.codePoints().anyMatch(codePoint->Character.getType(codePoint)==Character.OTHER_SYMBOL
          &&"©®™ℹ".indexOf(codePoint)<0))return true;
        if(raw.codePoints().anyMatch(codePoint->{
            if(!Character.isLetter(codePoint))return false;
            var script=Character.UnicodeScript.of(codePoint);
            return script!=Character.UnicodeScript.LATIN&&script!=Character.UnicodeScript.GREEK;
        }))return true;
        return text.contains("answeranalysis")||text.contains("examtrap")||text.contains("similarquestionstrategy")
          || text.contains("fixationtips")||text.contains("comparisonheaders")||text.contains("comparisonrows")
          || text.contains("assistant to")||text.contains("functions exec")||text.contains("target blank")
          || text.contains("noopener")||text.contains("esta questao poderia ser enriquecida com mais exemplos");
    }

    static boolean hasOneOfficialAnswerConfirmation(String value) {
        String text=normalized(value);int occurrences=0;int index=0;
        while((index=text.indexOf("gabarito",index))>=0){occurrences++;index+="gabarito".length();}
        return occurrences==1&&text.contains("gabarito oficial");
    }

    static boolean admitsSourceOrAnswerConflict(String value) {
        String text=normalized(value);
        return text.matches(".*(preserva|preservando|preservado).{0,100}gabarito.*")
          || text.contains("mantendo se o gabarito")
          || text.matches(".*gabarito (fornecido|disponibilizado) exige.*")
          || text.contains("nao e tecnicamente adequado")
          || text.contains("inconsistencia entre o rotulo")||text.contains("inconsistencia entre a denominacao")
          || text.contains("tensao cronologica evidente");
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

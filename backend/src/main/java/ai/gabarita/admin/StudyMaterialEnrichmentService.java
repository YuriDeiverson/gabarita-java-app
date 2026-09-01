package ai.gabarita.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** Monta aulas factuais usando exclusivamente guias editoriais já existentes no banco. */
@Service
class StudyMaterialEnrichmentService {
    private static final Pattern LEADING_NUMBER = Pattern.compile("^\\s*[ivxlcdm]+(?:\\.\\d+)*[.)-]?\\s*|^\\s*\\d+(?:\\.\\d+)*[.)-]?\\s*", Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOP_WORDS = Set.of(
      "a","ao","aos","as","com","como","da","das","de","do","dos","e","em","na","nas","no","nos",
      "o","os","ou","para","por","se","sem","sobre","um","uma","uns","umas","sua","seu","suas","seus",
      "conceito","conceitos","introducao","geral","gerais","nocoes","aspectos",
      "informacao","seguranca","tecnologia","sistema","sistemas","computador","computadores","rede","redes",
      "direito","gestao","administracao","lingua","portuguesa"
    );

    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private volatile List<Guide> cachedGuides = List.of();
    private volatile long cacheExpiresAt;

    StudyMaterialEnrichmentService(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    List<Map<String,Object>> enrichAll(List<Map<String,Object>> subjects) {
        if (subjects.stream().noneMatch(this::needsEnrichment)) return subjects;
        List<Guide> guides = guides();
        return subjects.stream().map(subject -> enrich(subject, guides)).toList();
    }

    Map<String,Object> enrichOne(Map<String,Object> subject) {
        if (!needsEnrichment(subject)) return subject;
        return enrich(subject, guides());
    }

    private boolean needsEnrichment(Map<String,Object> subject) {
        String content = text(subject.get("base_content"));
        return content.isBlank() || StudyMaterialQuality.isGeneric(content);
    }

    private Map<String,Object> enrich(Map<String,Object> original, List<Guide> guides) {
        String current = text(original.get("base_content"));
        if (!current.isBlank() && !StudyMaterialQuality.isGeneric(current)) return original;

        String title = text(original.get("title"));
        String discipline = text(original.get("discipline"));
        List<Guide> selected = guides.stream()
          .map(guide -> new ScoredGuide(guide, score(title, discipline, guide)))
          .filter(item -> item.score() >= 60)
          .sorted(Comparator.comparingInt(ScoredGuide::score).reversed()
            .thenComparing(Comparator.comparingInt((ScoredGuide item) -> item.guide().concept().length()).reversed()))
          .map(ScoredGuide::guide)
          .distinct()
          .limit(3)
          .toList();
        if (selected.isEmpty()) return original;

        Guide main = selected.getFirst();
        var enriched = new LinkedHashMap<String,Object>(original);
        enriched.put("study_objective", "Explicar " + title + ", reconhecer como o assunto funciona e resolver cobranças concretas de prova.");
        enriched.put("base_content", baseContent(selected));

        List<String> points = distinctUseful(selected.stream()
          .flatMap(guide -> List.of(guide.evidence(), guide.trap(), guide.strategy()).stream())
          .toList());
        if (points.size() < 3) points = distinctUseful(List.of(main.concept(), main.analysis(), main.strategy()));
        points = points.stream().limit(4).toList();
        enriched.put("key_takeaways_json", array(points).toString());
        enriched.put("review_summary_json", array(points.stream().limit(3).toList()).toString());
        enriched.put("content_blocks_json", blocks(title, selected).toString());
        return enriched;
    }

    private synchronized List<Guide> guides() {
        long now = System.currentTimeMillis();
        if (!cachedGuides.isEmpty() && now < cacheExpiresAt) return cachedGuides;
        cachedGuides = jdbc.sql("""
          SELECT q.id::text id,COALESCE(t.name,'') topic_name,COALESCE(q.detailed_topic,'') detailed_topic,
            q.statement,q.concept_explanation,COALESCE(q.decisive_evidence,'') decisive_evidence,
            q.answer_analysis,COALESCE(q.exam_trap,'') exam_trap,
            COALESCE(q.similar_question_strategy,'') similar_question_strategy
          FROM questions q LEFT JOIN topics t ON t.id=q.topic_id
          WHERE q.status IN ('ACTIVE','ANNULLED')
            AND length(btrim(COALESCE(q.concept_explanation,'')))>=120
            AND length(btrim(COALESCE(q.answer_analysis,'')))>=120
          ORDER BY q.id
          """).query().listOfRows().stream().map(row -> new Guide(
            text(row.get("id")), text(row.get("topic_name")), text(row.get("detailed_topic")),
            cleanStatement(text(row.get("statement"))), text(row.get("concept_explanation")), text(row.get("decisive_evidence")),
            text(row.get("answer_analysis")), text(row.get("exam_trap")), text(row.get("similar_question_strategy"))
          )).toList();
        cacheExpiresAt = now + 10 * 60_000L;
        return cachedGuides;
    }

    private int score(String title, String discipline, Guide guide) {
        String cleanedTitle = LEADING_NUMBER.matcher(title).replaceFirst("");
        String titleKey = normalize(cleanedTitle);
        if (titleKey.length() < 3) return 0;
        List<String> guideParts = Arrays.stream((guide.topicName() + "→" + guide.detailedTopic()).split("[→>:;,]"))
          .map(StudyMaterialEnrichmentService::normalize).filter(value -> !value.isBlank()).toList();
        if (guideParts.contains(titleKey)) return 1000;

        Set<String> titleTokens = tokens(titleKey);
        Set<String> guideTokens = tokens(normalize(guide.topicName() + " " + guide.detailedTopic() + " " + guide.concept()));
        if (titleTokens.isEmpty()) return 0;
        long overlap = titleTokens.stream().filter(guideTokens::contains).count();
        double coverage = overlap / (double) titleTokens.size();
        int score = (int)Math.round(coverage * 100);
        if (titleTokens.size() == 1 && overlap == 1) score = 90;
        Set<String> disciplineTokens = tokens(normalize(discipline));
        if (!disciplineTokens.isEmpty() && disciplineTokens.stream().anyMatch(guideTokens::contains)) score += 10;
        return score;
    }

    private String baseContent(List<Guide> selected) {
        Guide main = selected.getFirst();
        StringBuilder content = new StringBuilder("<h3>Conceito e fundamentos</h3><p>")
          .append(escape(main.concept())).append("</p>");
        if (selected.size() > 1) content.append("<p>").append(escape(selected.get(1).concept())).append("</p>");
        if (!main.evidence().isBlank()) content.append("<h3>O que decide a questão</h3><p>").append(escape(main.evidence())).append("</p>");
        if (!main.trap().isBlank()) content.append("<h3>Armadilha recorrente</h3><p>").append(escape(main.trap())).append("</p>");
        if (!main.strategy().isBlank()) content.append("<h3>Como resolver variações</h3><p>").append(escape(main.strategy())).append("</p>");
        return content.toString();
    }

    private ArrayNode blocks(String title, List<Guide> selected) {
        ArrayNode result = json.createArrayNode();
        ObjectNode application = result.addObject();
        application.put("id", "exemplo-aplicado");
        application.put("title", "Prática comentada de " + title);
        application.put("content", "<p>Resolva as questões abaixo sem consultar a explicação. Depois compare seu raciocínio com o comentário editorial.</p>");
        ArrayNode questions = application.putArray("miniQuestions");
        for (Guide guide : selected) {
            ObjectNode question = questions.addObject();
            question.put("prompt", guide.statement());
            question.put("answer", guide.analysis());
        }
        return result;
    }

    private ArrayNode array(List<String> values) {
        ArrayNode result = json.createArrayNode();
        values.forEach(result::add);
        return result;
    }

    private static List<String> distinctUseful(List<String> values) {
        var seen = new LinkedHashMap<String,String>();
        for (String value : values) {
            String clean = value == null ? "" : value.trim();
            if (clean.length() >= 20) seen.putIfAbsent(normalize(clean), clean);
        }
        return new ArrayList<>(seen.values());
    }

    private static Set<String> tokens(String value) {
        var result = new LinkedHashSet<String>();
        for (String token : value.split(" ")) if (token.length() >= 3 && !STOP_WORDS.contains(token)) result.add(token);
        return result;
    }

    private static String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
          .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
          .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String cleanStatement(String value) {
        return value.replaceFirst("(?i)\\s*\\(?ref\\s*:[^)]*\\)?\\.?\\s*$", "").trim();
    }

    private static String text(Object value) { return value == null ? "" : String.valueOf(value).trim(); }

    private record Guide(String id,String topicName,String detailedTopic,String statement,String concept,
                         String evidence,String analysis,String trap,String strategy) {}
    private record ScoredGuide(Guide guide,int score) {}
}

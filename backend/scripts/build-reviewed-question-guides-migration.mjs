#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertValidSnapshot,recordsDigest } from './question-guide-snapshot-quality.mjs';

const root=import.meta.dirname;
const snapshotPath=resolve(root,'reviewed-question-guides.snapshot.json');
const outputPath=resolve(root,'../src/main/resources/db/migration/V60__restore_individually_reviewed_complete_question_lessons.sql');
const shouldWrite=process.argv.includes('--write');

if(!existsSync(snapshotPath))throw new Error(`Snapshot canônico ausente: ${snapshotPath}\nExecute export-reviewed-question-guides-snapshot.mjs primeiro.`);
const originalSnapshotText=readFileSync(snapshotPath,'utf8');
let snapshot;
try{snapshot=JSON.parse(originalSnapshotText);}catch(error){throw new Error(`Snapshot não é JSON válido: ${error.message}`);}
assertValidSnapshot(snapshot);
if(snapshot.expected.recordsSha256!==recordsDigest(snapshot.records))throw new Error('Digest do snapshot diverge antes da geração');
if(snapshot.databaseState?.v60Applied&&shouldWrite)
  throw new Error('A versão 60 já consta como aplicada no banco exportado. Preserve seu checksum e gere uma V61.');

const records=snapshot.records;
const chunks=[];
for(let index=0;index<records.length;index+=200)chunks.push(records.slice(index,index+200));
const encodePayload=value=>JSON.stringify(value).replaceAll('$','\\u0024');
const payloadFor=(chunk,offset)=>chunk.map((record,index)=>({
  ordinal:offset+index+1,
  sourceId:record.currentId,
  previousStatus:record.previousStatus,
  legacyKeys:record.identity.legacyKeys,
  sourceFingerprint:record.identity.fingerprint,
  sourceStatement:record.source.statement,
  sourceCorrectAnswer:record.source.correctAnswer,
  subjectName:record.taxonomy.subject,
  topicName:record.taxonomy.topic,
  detailedTopic:record.guide.detailedTopic,
  conceptExplanation:record.guide.conceptExplanation,
  decisiveEvidence:record.guide.decisiveEvidence,
  answerAnalysis:record.guide.answerAnalysis,
  examTrap:record.guide.examTrap,
  similarQuestionStrategy:record.guide.similarQuestionStrategy,
  fixationTips:record.guide.fixationTips,
}));

const expectedCount=snapshot.expected.recordCount;
const expectedActive=snapshot.expected.statusCounts.ACTIVE;
const expectedAnnulled=snapshot.expected.statusCounts.ANNULLED;
const snapshotDigest=snapshot.expected.recordsSha256;
const sql=[`-- Conteúdo editorial exportado do banco canônico e validado questão por questão.
-- Snapshot: backend/scripts/reviewed-question-guides.snapshot.json
-- SHA-256 dos registros: ${snapshotDigest}
-- Registros esperados: ${expectedCount} (${expectedActive} ACTIVE, ${expectedAnnulled} ANNULLED)

CREATE TEMP TABLE v60_reviewed_question_guides (
  ordinal integer PRIMARY KEY,
  source_id uuid NOT NULL,
  previous_status text NOT NULL CHECK (previous_status IN ('ACTIVE','ANNULLED')),
  legacy_keys jsonb NOT NULL CHECK (jsonb_typeof(legacy_keys)='array'),
  source_fingerprint char(64) NOT NULL,
  source_statement text NOT NULL,
  source_correct_answer text NOT NULL,
  subject_name text NOT NULL,
  topic_name text NOT NULL,
  detailed_topic text NOT NULL,
  concept_explanation text NOT NULL,
  decisive_evidence text NOT NULL,
  answer_analysis text NOT NULL,
  exam_trap text NOT NULL,
  similar_question_strategy text NOT NULL,
  fixation_tips jsonb NOT NULL CHECK (jsonb_typeof(fixation_tips)='array')
);
`];

for(const [index,chunk] of chunks.entries()){
  const payload=encodePayload(payloadFor(chunk,index*200));
  const tag=`v60_guides_${index}`;
  sql.push(`
INSERT INTO v60_reviewed_question_guides(
  ordinal,source_id,previous_status,legacy_keys,source_fingerprint,source_statement,source_correct_answer,
  subject_name,topic_name,detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
  similar_question_strategy,fixation_tips
)
SELECT guide.ordinal,guide."sourceId",guide."previousStatus",guide."legacyKeys",guide."sourceFingerprint",
  guide."sourceStatement",guide."sourceCorrectAnswer",guide."subjectName",guide."topicName",guide."detailedTopic",
  guide."conceptExplanation",guide."decisiveEvidence",guide."answerAnalysis",guide."examTrap",
  guide."similarQuestionStrategy",guide."fixationTips"
FROM jsonb_to_recordset($${tag}$${payload}$${tag}$::jsonb) AS guide(
  ordinal integer,
  "sourceId" uuid,
  "previousStatus" text,
  "legacyKeys" jsonb,
  "sourceFingerprint" text,
  "sourceStatement" text,
  "sourceCorrectAnswer" text,
  "subjectName" text,
  "topicName" text,
  "detailedTopic" text,
  "conceptExplanation" text,
  "decisiveEvidence" text,
  "answerAnalysis" text,
  "examTrap" text,
  "similarQuestionStrategy" text,
  "fixationTips" jsonb
);
`);
}

sql.push(`
DO $v60_payload_assertions$
BEGIN
  IF (SELECT count(*) FROM v60_reviewed_question_guides) <> ${expectedCount} THEN
    RAISE EXCEPTION 'V60 recusada: quantidade do payload diverge de ${expectedCount}';
  END IF;
  IF (SELECT count(*) FROM v60_reviewed_question_guides WHERE previous_status='ACTIVE') <> ${expectedActive}
     OR (SELECT count(*) FROM v60_reviewed_question_guides WHERE previous_status='ANNULLED') <> ${expectedAnnulled} THEN
    RAISE EXCEPTION 'V60 recusada: distribuição de status diverge do snapshot';
  END IF;
  IF (SELECT count(DISTINCT source_id) FROM v60_reviewed_question_guides) <> ${expectedCount}
     OR (SELECT count(DISTINCT source_fingerprint) FROM v60_reviewed_question_guides) <> ${expectedCount}
     OR EXISTS (
       SELECT 1 FROM v60_reviewed_question_guides
       WHERE source_fingerprint<>encode(digest(source_statement || chr(31) || source_correct_answer,'sha256'),'hex')
         OR btrim(source_statement)='' OR btrim(source_correct_answer)=''
         OR btrim(subject_name)='' OR btrim(topic_name)=''
     ) THEN
    RAISE EXCEPTION 'V60 recusada: identidade ou taxonomia do payload foi adulterada';
  END IF;
  IF EXISTS (
    SELECT 1 FROM v60_reviewed_question_guides
    WHERE length(btrim(detailed_topic))<8 OR length(btrim(concept_explanation))<300
      OR length(btrim(decisive_evidence))<40 OR length(btrim(answer_analysis))<400
      OR length(btrim(exam_trap))<120 OR length(btrim(similar_question_strategy))<160
      OR jsonb_array_length(fixation_tips) NOT BETWEEN 3 AND 4
      OR (length(lower(answer_analysis))-length(replace(lower(answer_analysis),'gabarito oficial','')))/16<>1
      OR (length(lower(answer_analysis))-length(replace(lower(answer_analysis),'gabarito','')))/8<>1
  ) THEN
    RAISE EXCEPTION 'V60 recusada: payload não atende ao mínimo estrutural do guia completo';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
        similar_question_strategy,fixation_tips::text) lesson,answer_analysis analysis
      FROM v60_reviewed_question_guides
    ) payload
    WHERE payload.lesson ~* 'esta questão foi retirada|recebe uma aula autoral|comentário curto não será repetido|correção completa enquanto|answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows|assistant[[:space:]]+to=|functions\\.(exec|wait)|jsiitext|numerusform|instagram|target[ =]|noopener|texto para reflexão|deus está presente|estude,?[[:space:]]+ore|aprovação de amanhã'
      OR payload.lesson ~* '<[[:space:]]*/?[[:alpha:]][^>]*>|href[[:space:]]*='
      OR payload.lesson ~* '["''][[:space:]]*,[[:space:]]*["'']?(answeranalysis|examtrap|similarquestionstrategy|fixationtips|id)["'']?[[:space:]]*:|\\][[:space:]]*\\}[[:space:]]*,[[:space:]]*\\{'
      OR payload.lesson ~ '[Ѐ-ӿԱ-֏֐-׿؀-ۿ܀-࿿က-ᗿក-᣿Ⰰ-⳿぀-ヿ一-鿿ꀀ-꿿가-힯]'
      OR payload.lesson ~ '[☀-➿🀀-🫿]'
      OR payload.lesson ~ U&'[\\202A-\\202E\\2060-\\206F]'
      OR position(U&'\\200B' in payload.lesson)>0 OR position(U&'\\200C' in payload.lesson)>0
      OR position(U&'\\200D' in payload.lesson)>0 OR position(U&'\\200E' in payload.lesson)>0
      OR position(U&'\\200F' in payload.lesson)>0 OR position(U&'\\FEFF' in payload.lesson)>0
      OR position(U&'\\FFFC' in payload.lesson)>0 OR position(U&'\\FFFD' in payload.lesson)>0
      OR (length(lower(payload.lesson))-length(replace(lower(payload.lesson),'gabarito','')))/8>1
      OR payload.analysis ~* '\\((certo|errado)\\)|\\[[[:space:]]*confirmado[[:space:]]*:|\\\\n|\\*\\*[[:space:]]*gabarito'
      OR payload.analysis ~* '(certo|errado)[.!]?[[:space:]]+[0-9]+(\\.[0-9]+)+[[:space:]]*$|[【】]'
      OR (length(lower(payload.analysis))-length(replace(lower(payload.analysis),'certo','')))/5>4
      OR (length(lower(payload.analysis))-length(replace(lower(payload.analysis),'errado','')))/6>4
      OR (length(payload.analysis)-length(replace(payload.analysis,'—','')))>8
      OR (length(payload.analysis)-length(replace(payload.analysis,'–','')))>8
      OR lower(payload.lesson) ~* 'preserv(a|ando|ado).{0,100}gabarito|mantendo[- ]+se o gabarito|gabarito (fornecido|disponibilizado) exige|n(ã|a)o (é|e) tecnicamente adequad|inconsist(ê|e)ncia entre (o r(ó|o)tulo|a denomina(ç|c)(ã|a)o)|tens(ã|a)o cronol(ó|o)gica evidente|(enunciado|trecho|fragmento|recorte).{0,120}n(ã|a)o (cont(é|e)m|exibe|figura|reproduz|permite).{0,160}(termo referido|pergunta|their|software platforms|comprova(ç|c)(ã|a)o textual|contexto original)|terminologia .{0,80} usual.{0,180}(contudo|apesar|preserv)'
      OR lower(payload.lesson) LIKE '%esta questão poderia ser enriquecida com mais exemplos mas o dado decisivo já é suficiente%'
  ) THEN
    RAISE EXCEPTION 'V60 recusada: payload contém marcador, artefato ou repetição editorial proibida';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM v60_reviewed_question_guides reviewed
    CROSS JOIN LATERAL (VALUES
      ('answer_analysis',reviewed.answer_analysis),('concept_explanation',reviewed.concept_explanation)
    ) block(field_name,content)
    CROSS JOIN LATERAL regexp_split_to_table(block.content,'[.!?]+') sentence
    GROUP BY reviewed.ordinal,block.field_name,lower(regexp_replace(sentence,'[^[:alnum:]]+',' ','g'))
    HAVING length(lower(regexp_replace(sentence,'[^[:alnum:]]+',' ','g')))>40 AND count(*)>1
  ) THEN
    RAISE EXCEPTION 'V60 recusada: payload contém frase longa repetida';
  END IF;
END
$v60_payload_assertions$;

CREATE TEMP TABLE v60_question_matches AS
SELECT DISTINCT reviewed.ordinal,question.id question_id
FROM v60_reviewed_question_guides reviewed
JOIN questions question ON
  question.statement=reviewed.source_statement
  AND COALESCE(question.correct_answer #>> '{}','')=reviewed.source_correct_answer
  AND (
    EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(reviewed.legacy_keys) AS identity_key("courseId" text,"legacyId" text)
      JOIN question_course_legacy_ids legacy
        ON legacy.course_id=identity_key."courseId" AND legacy.legacy_id=identity_key."legacyId"
      WHERE legacy.question_id=question.id
    )
    OR (
      encode(digest(question.statement || chr(31) || COALESCE(question.correct_answer #>> '{}',''),'sha256'),'hex')
        =reviewed.source_fingerprint
    )
  );

CREATE TEMP TABLE v60_taxonomy_matches AS
SELECT reviewed.ordinal,subject.id subject_id,topic.id topic_id
FROM v60_reviewed_question_guides reviewed
JOIN subjects subject
  ON subject.exam_id IS NULL AND subject.active AND subject.name=reviewed.subject_name
JOIN topics topic
  ON topic.subject_id=subject.id AND topic.active AND topic.name=reviewed.topic_name;

DO $v60_match_assertions$
BEGIN
  -- O banco canônico contém questões importadas fora das migrations históricas.
  -- Em um replay limpo, os registros realmente ausentes são ignorados; toda a
  -- interseção, porém, precisa continuar estritamente 1:1 e nunca pode ser vazia.
  IF (SELECT count(*) FROM v60_question_matches)=0 THEN
    RAISE EXCEPTION 'V60 recusada: nenhuma questão do snapshot existe neste banco';
  END IF;
  IF (SELECT count(*) FROM v60_question_matches)
       <> (SELECT count(DISTINCT ordinal) FROM v60_question_matches)
     OR (SELECT count(*) FROM v60_question_matches)
       <> (SELECT count(DISTINCT question_id) FROM v60_question_matches) THEN
    RAISE EXCEPTION 'V60 recusada: a interseção não possui correspondência estável 1:1 (% correspondências, % ordinais, % questões)',
      (SELECT count(*) FROM v60_question_matches),
      (SELECT count(DISTINCT ordinal) FROM v60_question_matches),(SELECT count(DISTINCT question_id) FROM v60_question_matches);
  END IF;
  -- No banco de origem, cada UUID exportado deve continuar sendo exatamente a
  -- questão resolvida. Isso impede que uma alteração de texto/gabarito no clone
  -- canônico seja mascarada por outra questão parecida. Em replay limpo os UUIDs
  -- são diferentes, então prevalecem legacy key/fingerprint somente para as
  -- questões que de fato existem.
  IF EXISTS (
    SELECT 1
    FROM v60_reviewed_question_guides reviewed
    JOIN questions source_question ON source_question.id=reviewed.source_id
    LEFT JOIN v60_question_matches matched
      ON matched.ordinal=reviewed.ordinal AND matched.question_id=source_question.id
    WHERE matched.ordinal IS NULL
  ) THEN
    RAISE EXCEPTION 'V60 recusada: UUID canônico existe, mas não corresponde exatamente à identidade exportada';
  END IF;
  IF (SELECT count(*) FROM v60_taxonomy_matches) <> ${expectedCount}
     OR (SELECT count(DISTINCT ordinal) FROM v60_taxonomy_matches) <> ${expectedCount} THEN
    RAISE EXCEPTION 'V60 recusada: subject/topic não possuem resolução única para todos os registros';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM v60_question_matches matched
    JOIN v60_reviewed_question_guides reviewed USING(ordinal)
    JOIN questions question ON question.id=matched.question_id
    WHERE question.status<>reviewed.previous_status
      AND NOT (question.status='DRAFT' AND question.metadata->>'guidePreviousStatus'=reviewed.previous_status)
  ) THEN
    RAISE EXCEPTION 'V60 recusada: ao menos uma questão possui status atual incompatível com a restauração segura';
  END IF;
END
$v60_match_assertions$;

CREATE TEMP TABLE v60_updated_questions AS
WITH updated AS (
  UPDATE questions question
  SET subject_id=taxonomy.subject_id,
    topic_id=taxonomy.topic_id,
    detailed_topic=reviewed.detailed_topic,
    concept_explanation=reviewed.concept_explanation,
    decisive_evidence=reviewed.decisive_evidence,
    answer_analysis=reviewed.answer_analysis,
    exam_trap=reviewed.exam_trap,
    similar_question_strategy=reviewed.similar_question_strategy,
    fixation_tips=reviewed.fixation_tips,
    comparison_headers='{}'::jsonb,
    comparison_rows='[]'::jsonb,
    status=reviewed.previous_status,
    metadata=(COALESCE(question.metadata,'{}'::jsonb)-'guideReviewReason'-'guidePreviousStatus')
      || jsonb_build_object(
        'category',reviewed.subject_name,
        'topic',reviewed.topic_name,
        'guideEditorialReview','individual-v1',
        'guideEditorialSnapshot','${snapshotDigest}'
      ),
    updated_at=now()
  FROM v60_question_matches matched
  JOIN v60_reviewed_question_guides reviewed USING(ordinal)
  JOIN v60_taxonomy_matches taxonomy USING(ordinal)
  WHERE question.id=matched.question_id
  RETURNING question.id
)
SELECT id FROM updated;

DO $v60_result_assertions$
BEGIN
  IF (SELECT count(*) FROM v60_updated_questions)
       <> (SELECT count(*) FROM v60_question_matches) THEN
    RAISE EXCEPTION 'V60 recusada: % questões da interseção eram esperadas, mas % foram atualizadas',
      (SELECT count(*) FROM v60_question_matches),(SELECT count(*) FROM v60_updated_questions);
  END IF;
  IF EXISTS (
    SELECT 1
    FROM v60_question_matches matched
    JOIN v60_reviewed_question_guides reviewed USING(ordinal)
    JOIN v60_taxonomy_matches taxonomy USING(ordinal)
    JOIN questions question ON question.id=matched.question_id
    WHERE question.status IS DISTINCT FROM reviewed.previous_status
      OR question.subject_id IS DISTINCT FROM taxonomy.subject_id
      OR question.topic_id IS DISTINCT FROM taxonomy.topic_id
      OR question.detailed_topic IS DISTINCT FROM reviewed.detailed_topic
      OR question.concept_explanation IS DISTINCT FROM reviewed.concept_explanation
      OR question.decisive_evidence IS DISTINCT FROM reviewed.decisive_evidence
      OR question.answer_analysis IS DISTINCT FROM reviewed.answer_analysis
      OR question.exam_trap IS DISTINCT FROM reviewed.exam_trap
      OR question.similar_question_strategy IS DISTINCT FROM reviewed.similar_question_strategy
      OR question.fixation_tips IS DISTINCT FROM reviewed.fixation_tips
      OR question.comparison_headers IS DISTINCT FROM '{}'::jsonb
      OR question.comparison_rows IS DISTINCT FROM '[]'::jsonb
      OR question.metadata->>'category' IS DISTINCT FROM reviewed.subject_name
      OR question.metadata->>'topic' IS DISTINCT FROM reviewed.topic_name
      OR question.metadata->>'guideEditorialReview' IS DISTINCT FROM 'individual-v1'
      OR question.metadata->>'guideEditorialSnapshot' IS DISTINCT FROM '${snapshotDigest}'
  ) THEN
    RAISE EXCEPTION 'V60 recusada: validação pós-atualização encontrou divergência';
  END IF;
END
$v60_result_assertions$;

ALTER TABLE questions DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;
ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE','ANNULLED') OR (
    length(btrim(detailed_topic))>=8
    AND length(btrim(concept_explanation))>=300
    AND length(btrim(decisive_evidence))>=40
    AND length(btrim(answer_analysis))>=400
    AND length(btrim(exam_trap))>=120
    AND length(btrim(similar_question_strategy))>=160
    AND jsonb_array_length(fixation_tips) BETWEEN 3 AND 4
    AND btrim(answer_analysis)<>btrim(explanation)
    AND (
      (jsonb_array_length(comparison_rows)=0 AND comparison_headers='{}'::jsonb)
      OR (jsonb_array_length(comparison_rows)>=2 AND comparison_headers<>'{}'::jsonb)
    )
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text)
      !~* 'esta questão foi retirada|recebe uma aula autoral|comentário curto não será repetido|correção completa enquanto|proposição examinada é|a proposição anulada é|essa formulação (atribui ao assunto|entra em conflito)|conforme o conceito|answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows|assistant[[:space:]]+to=|functions\\.(exec|wait)|jsiitext|numerusform|instagram|target[ =]|noopener|texto para reflexão|deus está presente|estude,?[[:space:]]+ore|aprovação de amanhã'
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text)
      !~* '<[[:space:]]*/?[[:alpha:]][^>]*>|href[[:space:]]*='
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text)
      !~* '["''][[:space:]]*,[[:space:]]*["'']?(answeranalysis|examtrap|similarquestionstrategy|fixationtips|id)["'']?[[:space:]]*:|\\][[:space:]]*\\}[[:space:]]*,[[:space:]]*\\{'
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text)
      !~ '[Ѐ-ӿԱ-֏֐-׿؀-ۿ܀-࿿က-ᗿក-᣿Ⰰ-⳿぀-ヿ一-鿿ꀀ-꿿가-힯]'
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text) !~ '[☀-➿🀀-🫿]'
    AND concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text) !~ U&'[\\202A-\\202E\\2060-\\206F]'
    AND position(U&'\\200B' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\200C' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\200D' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\200E' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\200F' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\FEFF' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\FFFC' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND position(U&'\\FFFD' in concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
      exam_trap,similar_question_strategy,fixation_tips::text))=0
    AND (
      length(lower(concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
        similar_question_strategy,fixation_tips::text)))
      -length(replace(lower(concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,
        exam_trap,similar_question_strategy,fixation_tips::text)),'gabarito',''))
    )/8<=1
    AND answer_analysis !~* '\\((certo|errado)\\)|\\[[[:space:]]*confirmado[[:space:]]*:|\\\\n|\\*\\*[[:space:]]*gabarito'
    AND answer_analysis !~* '(certo|errado)[.!]?[[:space:]]+[0-9]+(\\.[0-9]+)+[[:space:]]*$|[【】]'
    AND (length(lower(answer_analysis))-length(replace(lower(answer_analysis),'certo','')))/5<=4
    AND (length(lower(answer_analysis))-length(replace(lower(answer_analysis),'errado','')))/6<=4
    AND (length(answer_analysis)-length(replace(answer_analysis,'—','')))<=8
    AND (length(answer_analysis)-length(replace(answer_analysis,'–','')))<=8
    AND lower(concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text))
      !~* 'preserv(a|ando|ado).{0,100}gabarito|mantendo[- ]+se o gabarito|gabarito (fornecido|disponibilizado) exige|n(ã|a)o (é|e) tecnicamente adequad|inconsist(ê|e)ncia entre (o r(ó|o)tulo|a denomina(ç|c)(ã|a)o)|tens(ã|a)o cronol(ó|o)gica evidente|(enunciado|trecho|fragmento|recorte).{0,120}n(ã|a)o (cont(é|e)m|exibe|figura|reproduz|permite).{0,160}(termo referido|pergunta|their|software platforms|comprova(ç|c)(ã|a)o textual|contexto original)|terminologia .{0,80} usual.{0,180}(contudo|apesar|preserv)'
    AND lower(concat_ws(' ',detailed_topic,concept_explanation,decisive_evidence,answer_analysis,exam_trap,
      similar_question_strategy,fixation_tips::text))
      NOT LIKE '%esta questão poderia ser enriquecida com mais exemplos mas o dado decisivo já é suficiente%'
  )
);

COMMENT ON CONSTRAINT published_questions_require_complete_guide ON questions IS
  'Questão publicada exige aula completa e rejeita placeholders, artefatos internos, HTML, caracteres invisíveis, pictogramas editoriais e repetição de gabarito.';

DROP TABLE v60_updated_questions;
DROP TABLE v60_taxonomy_matches;
DROP TABLE v60_question_matches;
DROP TABLE v60_reviewed_question_guides;
`);

const migrationText=sql.join('');
if(!shouldWrite){
  console.log(JSON.stringify({
    valid:true,write:false,snapshot:snapshotPath,records:expectedCount,statusCounts:snapshot.expected.statusCounts,
    sha256:snapshotDigest,sqlBytes:Buffer.byteLength(migrationText),message:'Validação concluída. Use --write para substituir a V60 atomicamente.',
  },null,2));
  process.exit(0);
}
if(readFileSync(snapshotPath,'utf8')!==originalSnapshotText)throw new Error('O snapshot mudou durante a geração; execute novamente');
const temporaryPath=`${outputPath}.${process.pid}.tmp`;
try{
  writeFileSync(temporaryPath,migrationText,{encoding:'utf8',flag:'wx'});
  const reread=readFileSync(temporaryPath,'utf8');
  if(reread!==migrationText||!reread.includes(`SHA-256 dos registros: ${snapshotDigest}`))
    throw new Error('Falha na verificação do arquivo temporário da migração');
  renameSync(temporaryPath,outputPath);
}catch(error){
  if(existsSync(temporaryPath))unlinkSync(temporaryPath);
  throw error;
}
console.log(JSON.stringify({
  migration:outputPath,records:expectedCount,statusCounts:snapshot.expected.statusCounts,
  sha256:snapshotDigest,sqlBytes:Buffer.byteLength(migrationText),
},null,2));

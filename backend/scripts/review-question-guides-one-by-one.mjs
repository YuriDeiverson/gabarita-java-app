#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const backendRoot=resolve(import.meta.dirname,'..');
const projectRoot=resolve(backendRoot,'..');
const schemaPath=resolve(import.meta.dirname,'question-guide.schema.json');
const batchSchemaPath=resolve(import.meta.dirname,'question-guides-batch.schema.json');
const args=new Map(process.argv.slice(2).map(value=>{const [key,...rest]=value.split('=');return[key,rest.join('=')||'true'];}));
const limit=Number(args.get('--limit')||0);
const applyToDatabase=args.get('--apply')==='true';
const subjectFilter=args.get('--subject')||'';
const questionFilter=args.get('--question')||'';
const forceIdsFile=args.get('--force-ids-file')||'';
const auditOnly=args.get('--audit')==='true';
const ignoreCheckpoint=args.get('--ignore-checkpoint')==='true';
const model=args.get('--model')||'gpt-5.6-terra';
const batchSize=Math.max(1,Math.min(12,Number(args.get('--batch-size')||1)));
const maxAttempts=Math.max(1,Math.min(3,Number(args.get('--attempts')||1)));
const shardCount=Math.max(1,Math.min(8,Number(args.get('--shards')||1)));
const shardIndex=Math.max(0,Math.min(shardCount-1,Number(args.get('--shard')||0)));
const checkpointPath=resolve(import.meta.dirname,shardCount===1?'generated-question-guides.ndjson':`generated-question-guides-${shardIndex}-of-${shardCount}.ndjson`);
const tempRoot=mkdtempSync(join(tmpdir(),'gabarita-guide-review-'));
let forcedQuestionIds=[];
if(forceIdsFile){
  const raw=readFileSync(resolve(projectRoot,forceIdsFile),'utf8');
  try{
    const parsed=JSON.parse(raw);
    forcedQuestionIds=(Array.isArray(parsed)?parsed:parsed.records||parsed.corrections||parsed.quarantines||[])
      .map(value=>typeof value==='string'?value:value.id);
  }catch{forcedQuestionIds=raw.split(/\s+/).filter(Boolean);}
  if(forcedQuestionIds.some(id=>!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))
    throw new Error(`Arquivo de IDs contém UUID inválido: ${forceIdsFile}`);
  forcedQuestionIds=[...new Set(forcedQuestionIds)];
}

const envFile=readFileSync(resolve(backendRoot,'.env'),'utf8');
const settings=Object.fromEntries(envFile.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')&&line.includes('='))
  .map(line=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1)];}));
const jdbcUrl=new URL(settings.DATABASE_URL.replace(/^jdbc:/,''));
const databaseArgs=['-h',jdbcUrl.hostname,'-p',jdbcUrl.port||'5432','-d',jdbcUrl.pathname.slice(1),'-U',settings.DATABASE_USER,
  '-v','ON_ERROR_STOP=1','-P','pager=off','-At'];
const databaseEnv={...process.env,PGPASSWORD:settings.DATABASE_PASSWORD};

const runPsql=(sql)=>{
  const result=spawnSync('psql',[...databaseArgs,'-c',sql],{cwd:backendRoot,env:databaseEnv,encoding:'utf8',maxBuffer:64*1024*1024});
  if(result.status!==0)throw new Error(result.stderr||`psql terminou com código ${result.status}`);
  return result.stdout.trim();
};

const sqlLiteral=value=>`'${String(value??'').replaceAll("'","''")}'`;
const normalized=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9]+/g,' ').trim();
const sha=value=>createHash('sha256').update(value).digest('hex');
const hasForbiddenCharacters=value=>/[\u200B-\u200F\uFEFF\uFFFC\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(String(value??''));
const hasForeignScript=value=>Array.from(String(value??'')).some(character=>
  /\p{Letter}/u.test(character)&&!/[\p{Script=Latin}\p{Script=Greek}]/u.test(character));
const hasRepeatedSentence=value=>{
  const sentences=String(value??'').split(/[.!?]+/).map(normalized).filter(sentence=>sentence.length>=40);
  return new Set(sentences).size!==sentences.length;
};
const countOccurrences=(value,needle)=>normalized(value).split(normalized(needle)).length-1;
const hasPictogram=value=>Array.from(String(value??'')).some(character=>
  /\p{Extended_Pictographic}/u.test(character)&&!['©','®','™','ℹ'].includes(character));
const hasRepeatedVerdictDecoration=value=>/\(\s*(certo|errado)\s*\)|\[\s*confirmado\s*:\s*(certo|errado)\s*\]|\\n|\*\*\s*gabarito/iu.test(String(value??''));
const hasSuspiciousTrailingJunk=value=>/(?:certo|errado)[.!]?\s+\d+(?:\.\d+)+\s*$|[【】]/iu.test(String(value??''));
const hasEpistemicConflict=value=>{
  const text=normalized(value);
  return /preserv(a|ando|ado).{0,100}gabarito|mantendo se o gabarito|gabarito (fornecido|disponibilizado) exige/.test(text)
    ||/(enunciado|trecho|fragmento|recorte).{0,120}nao (contem|exibe|figura|reproduz|permite).{0,160}(termo referido|pergunta|their|software platforms|comprovacao textual|contexto original)/.test(text)
    ||/nao e tecnicamente adequad|inconsistencia entre (o rotulo|a denominacao)|tensao cronologica evidente|terminologia .{0,80} usual.{0,180}(contudo|apesar|preserv)/.test(text);
};
const hasExcessiveAnswerMarkers=value=>{
  const raw=String(value??'');
  const verdicts=normalized(raw).match(/\b(certo|errado)\b/g)?.length||0;
  const longDashes=raw.match(/[—–]/g)?.length||0;
  return verdicts>4||longDashes>8;
};

if(auditOnly){
  const rows=JSON.parse(runPsql(`
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',q.id::text,'status',q.status,'subject',s.name,'topic',t.name,
      'statement',q.statement,'explanation',q.explanation,
      'detailedTopic',q.detailed_topic,'conceptExplanation',q.concept_explanation,
      'decisiveEvidence',q.decisive_evidence,'answerAnalysis',q.answer_analysis,
      'examTrap',q.exam_trap,'similarQuestionStrategy',q.similar_question_strategy,
      'fixationTips',q.fixation_tips,'review',q.metadata->>'guideEditorialReview',
      'hasGuidePreviousStatus',q.metadata ? 'guidePreviousStatus'
    )),'[]'::jsonb)
    FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN topics t ON t.id=q.topic_id
  `)||'[]');
  const published=rows.filter(row=>['ACTIVE','ANNULLED'].includes(row.status));
  const failures=[];const duplicateFields=[];
  const hashes=new Map();
  for(const row of published){
    const guideValues=['detailedTopic','conceptExplanation','decisiveEvidence','answerAnalysis','examTrap','similarQuestionStrategy','fixationTips']
      .flatMap(field=>Array.isArray(row[field])?row[field]:[row[field]]);
    const rawJoined=guideValues.join(' ');
    const normalizedJoined=normalized(rawJoined);
    const lengths={conceptExplanation:300,decisiveEvidence:40,answerAnalysis:400,examTrap:120,similarQuestionStrategy:160};
    for(const [field,min] of Object.entries(lengths))if(String(row[field]||'').trim().length<min)failures.push([row.id,`${field} < ${min}`]);
    if(!normalized(row.detailedTopic).startsWith(normalized(`${row.subject} ${row.topic}`)))failures.push([row.id,'detailedTopic fora da hierarquia']);
    if(!Array.isArray(row.fixationTips)||row.fixationTips.length<3||row.fixationTips.length>4)failures.push([row.id,'fixationTips fora de 3-4']);
    if(/esta questao foi retirada|recebe uma aula autoral|comentario curto nao sera repetido|correcao completa enquanto/.test(normalizedJoined))failures.push([row.id,'placeholder editorial']);
    if(/proposicao examinada e|essa formulacao (atribui ao assunto|entra em conflito)|conforme o conceito/.test(normalizedJoined))failures.push([row.id,'frase-modelo proibida']);
    if(/answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows/.test(normalizedJoined))
      failures.push([row.id,'nome interno de campo incorporado ao texto']);
    if(/instagram|target blank|noopener|texto para reflexao|deus esta presente|estude ore|aprovacao de amanha/.test(normalizedJoined))
      failures.push([row.id,'conteúdo promocional ou alheio ao ensino']);
    if(/["']\s*,\s*["']?(answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|id)["']?\s*:|\]\s*\}\s*,\s*\{/.test(rawJoined))
      failures.push([row.id,'fragmento de JSON incorporado ao texto']);
    if(hasForbiddenCharacters(rawJoined))failures.push([row.id,'caractere invisível, de controle ou de substituição']);
    if(hasForeignScript(rawJoined))failures.push([row.id,'caractere de alfabeto alheio incorporado ao texto']);
    if(/<br\b|<a\b|href\s*=|assistant to=|functions\.exec|jsiitext|numerusform|[\u10A0-\u10FF]/iu.test(rawJoined))
      failures.push([row.id,'marcação ou saída interna incorporada ao texto']);
    if(hasRepeatedSentence(row.answerAnalysis)||hasRepeatedSentence(row.conceptExplanation))
      failures.push([row.id,'frase longa repetida no mesmo bloco']);
    if(countOccurrences(row.answerAnalysis,'gabarito oficial')>1)
      failures.push([row.id,'answerAnalysis repete a confirmação do gabarito']);
    if(countOccurrences(row.answerAnalysis,'gabarito')>1)
      failures.push([row.id,'answerAnalysis contém mais de um marcador de gabarito']);
    if(hasPictogram(rawJoined))failures.push([row.id,'emoji ou pictograma decorativo incorporado ao ensino']);
    if(hasRepeatedVerdictDecoration(row.answerAnalysis))
      failures.push([row.id,'answerAnalysis contém veredito decorativo ou marcação repetida']);
    if(hasSuspiciousTrailingJunk(row.answerAnalysis))
      failures.push([row.id,'answerAnalysis contém resíduo estranho após a conclusão']);
    if(hasExcessiveAnswerMarkers(row.answerAnalysis))
      failures.push([row.id,'answerAnalysis repete excessivamente vereditos, símbolos ou marcadores']);
    if(normalizedJoined.includes('esta questao poderia ser enriquecida com mais exemplos mas o dado decisivo ja e suficiente'))
      failures.push([row.id,'comentário metalinguístico incorporado ao ensino']);
    if(hasEpistemicConflict(rawJoined))
      failures.push([row.id,'guia admite conflito entre a fonte e o gabarito']);
    if(/gabarito|item (esta|e) (certo|errado)|portanto.*(certo|errado)/.test(normalized(row.decisiveEvidence)))
      failures.push([row.id,'decisiveEvidence antecipa o gabarito']);
    const statement=normalized(String(row.statement||'').replace(/^\[[^\]]+\]\s*/,''));
    const explanation=normalized(String(row.explanation||'').replace(/^(item\s+)?(certo|errado|correto|incorreto)[.:]?\s*/i,''));
    for(const field of ['conceptExplanation','decisiveEvidence','answerAnalysis','examTrap','similarQuestionStrategy']){
      const content=normalized(row[field]);
      if(statement.length>=60&&content.includes(statement))failures.push([row.id,`${field} copia o enunciado`]);
      if(['conceptExplanation','answerAnalysis'].includes(field)&&explanation.length>=60&&content.includes(explanation))failures.push([row.id,`${field} copia a justificativa`]);
    }
    for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy']){
      const digest=sha(normalized(row[field]));const key=`${field}:${digest}`;
      if(hashes.has(key))duplicateFields.push([field,hashes.get(key),row.id]);else hashes.set(key,row.id);
    }
  }
  const statusCounts=Object.fromEntries(rows.map(row=>row.status).filter(Boolean).reduce((map,status)=>map.set(status,(map.get(status)||0)+1),new Map()));
  const result={
    total:rows.length,statusCounts,published:published.length,
    individuallyReviewed:rows.filter(row=>row.review==='individual-v1').length,
    drafts:rows.filter(row=>row.status==='DRAFT').length,
    pendingEditorial:rows.filter(row=>row.status==='DRAFT'&&row.hasGuidePreviousStatus).length,
    quarantinedDrafts:rows.filter(row=>row.status==='DRAFT'&&!row.hasGuidePreviousStatus).length,
    failures:failures.length,failedQuestions:new Set(failures.map(([id])=>id)).size,duplicateFields:duplicateFields.length,
    failureSamples:failures.slice(0,20),duplicateSamples:duplicateFields.slice(0,20),
  };
  writeFileSync(resolve(import.meta.dirname,'question-guide-audit-report.json'),JSON.stringify({...result,allFailures:failures,allDuplicates:duplicateFields},null,2));
  console.log(JSON.stringify(result,null,2));
  process.exit(failures.length||duplicateFields.length?2:0);
}

const completed=new Map();
if(!ignoreCheckpoint&&existsSync(checkpointPath))for(const line of readFileSync(checkpointPath,'utf8').split(/\r?\n/).filter(Boolean)){
  try{const record=JSON.parse(line);completed.set(record.id,record);}catch{}
}

const filters=[];
if(subjectFilter)filters.push(`s.name=${sqlLiteral(subjectFilter)}`);
if(questionFilter)filters.push(`q.id=${sqlLiteral(questionFilter)}::uuid`);
const query=`
  SELECT COALESCE(jsonb_agg(to_jsonb(source) ORDER BY source.subject,source.topic,source.reference,source.id),'[]'::jsonb)
  FROM (
    SELECT q.id::text id,s.name subject,t.name topic,q.board,q.type,
      COALESCE(q.metadata->>'reference',q.board,'') reference,
      q.statement,q.correct_answer #>> '{}' correct,q.explanation,
      COALESCE(p.title,'') passage_title,COALESCE(p.content,'') passage_content,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('label',qo.label,'text',qo.content) ORDER BY qo.position)
        FROM question_options qo WHERE qo.question_id=q.id),'[]'::jsonb) options,
      CASE WHEN q.status='DRAFT' THEN COALESCE(q.metadata->>'guidePreviousStatus','ACTIVE') ELSE q.status END previous_status
    FROM questions q
    JOIN subjects s ON s.id=q.subject_id JOIN topics t ON t.id=q.topic_id
    LEFT JOIN passages p ON p.id=q.passage_id
    WHERE (q.status IN ('ACTIVE','ANNULLED') OR (q.status='DRAFT' AND q.metadata ? 'guidePreviousStatus'))
      AND (
        NOT (length(btrim(q.concept_explanation))>=300
        AND length(btrim(q.decisive_evidence))>=40
        AND length(btrim(q.answer_analysis))>=400
        AND length(btrim(q.exam_trap))>=120
        AND length(btrim(q.similar_question_strategy))>=160
        AND jsonb_array_length(q.fixation_tips) BETWEEN 3 AND 4
        AND q.answer_analysis !~* 'proposição examinada é:|a proposição anulada é:|essa formulação (atribui ao assunto|entra em conflito)')
        OR concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text)
          ~* 'answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|comparisonHeaders|comparisonRows|instagram|target[ =]|noopener|texto para reflexão|deus está presente|estude,? ore|aprovação de amanhã|\\]\\s*\\}\\s*,\\s*\\{'
        OR position(chr(8203) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(8204) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(8205) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(8206) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(8207) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(65279) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR position(chr(65532) in concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text))>0
        OR concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text)
          ~ '[Ѐ-ӿ֐-׿؀-ۿऀ-ॿঀ-৿਀-੿઀-૿଀-୿஀-௿ఀ-౿ಀ-೿ഀ-ൿก-๿຀-໿က-႟ᄀ-ᇿ぀-ヿ一-鿿가-힯]'
        OR concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text)
          ~* '<br|<a|href[[:space:]]*=|assistant to=|functions\\.exec|jsiitext|numerusform|esta questão poderia ser enriquecida com mais exemplos'
        OR (length(lower(q.answer_analysis))-length(replace(lower(q.answer_analysis),'gabarito oficial','')))/length('gabarito oficial')>1
        OR (length(lower(q.answer_analysis))-length(replace(lower(q.answer_analysis),'gabarito','')))/length('gabarito')>1
        OR (length(lower(q.answer_analysis))-length(replace(lower(q.answer_analysis),'certo','')))/length('certo')>4
        OR (length(lower(q.answer_analysis))-length(replace(lower(q.answer_analysis),'errado','')))/length('errado')>4
        OR (length(q.answer_analysis)-length(replace(q.answer_analysis,'—','')))>8
        OR (length(q.answer_analysis)-length(replace(q.answer_analysis,'✅','')))>2
        OR (length(q.answer_analysis)-length(replace(q.answer_analysis,'❌','')))>2
        OR q.answer_analysis ~* '\\((certo|errado)\\)|\\[[[:space:]]*confirmado[[:space:]]*:|\\\\n|\\*\\*[[:space:]]*gabarito'
        OR q.answer_analysis ~* '(certo|errado)[.!]?[[:space:]]+[0-9]+(\\.[0-9]+)+[[:space:]]*$|[【】]'
        OR concat_ws(' ',q.concept_explanation,q.decisive_evidence,q.answer_analysis,q.exam_trap,q.similar_question_strategy,q.fixation_tips::text)
          ~ '[☀-➿🌀-🫿]'
        ${forcedQuestionIds.length?`OR q.id IN (${forcedQuestionIds.map(id=>sqlLiteral(id)+'::uuid').join(',')})`:''}
      )
      ${filters.length?`AND ${filters.join(' AND ')}`:''}
  ) source`;
let questions=JSON.parse(runPsql(query)||'[]');
if(shardCount>1)questions=questions.filter(question=>
  Number.parseInt(sha(question.id).slice(0,8),16)%shardCount===shardIndex);
if(limit>0)questions=questions.slice(0,limit);

const applyGuide=(question,guide)=>{
  const tips=JSON.stringify(guide.fixationTips).replaceAll("'","''");
  runPsql(`UPDATE questions SET detailed_topic=${sqlLiteral(guide.detailedTopic)},concept_explanation=${sqlLiteral(guide.conceptExplanation)},decisive_evidence=${sqlLiteral(guide.decisiveEvidence)},answer_analysis=${sqlLiteral(guide.answerAnalysis)},exam_trap=${sqlLiteral(guide.examTrap)},similar_question_strategy=${sqlLiteral(guide.similarQuestionStrategy)},fixation_tips='${tips}'::jsonb,comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,status=${sqlLiteral(question.previous_status)},metadata=(metadata-'guideReviewReason'-'guidePreviousStatus')||jsonb_build_object('guideEditorialReview','individual-v1'),updated_at=now() WHERE id='${question.id}'::uuid;`);
};

let restoredFromCheckpoint=0;
if(applyToDatabase)for(const question of questions){
  const record=completed.get(question.id);
  if(record?.sourceHash===sha(JSON.stringify(question))){applyGuide(question,record.guide);restoredFromCheckpoint++;}
}
questions=questions.filter(question=>completed.get(question.id)?.sourceHash!==sha(JSON.stringify(question)));

const baseInstruction=`Você é professor especialista em concursos públicos e revisor editorial. Produza a correção completa e autoral de UMA questão. O aluno estuda principalmente por questões.

Regras obrigatórias:
1. detailedTopic: use exatamente “Disciplina → Assunto catalogado → Recorte específico”.
2. conceptExplanation: ensine antes de julgar. Explique definição, funcionamento, distinções, condições, limites e, quando útil, um exemplo próprio. Deve ser uma pequena aula autossuficiente.
3. decisiveEvidence: apresente somente o termo, dado, passagem da fonte, dispositivo, fórmula ou regra que será confrontada na análise. Não copie o enunciado completo e não antecipe a conclusão. Neste campo são proibidas as palavras “gabarito”, “certo”, “correto”, “errado”, “incorreto”, “válido” e “inválido”, inclusive em flexões de gênero e número.
4. answerAnalysis: desenvolva o raciocínio em sequência, aplique o conceito aos elementos concretos e elimine a interpretação concorrente. Não copie o enunciado nem a justificativa fornecida. Confirme o gabarito oficial uma única vez, somente na última frase.
5. examTrap: diagnostique exatamente por que a leitura incorreta parece plausível ou qual confusão a banca testa. Este bloco é obrigatório mesmo quando o aluno acertou.
6. similarQuestionStrategy: ensine um procedimento reutilizável, específico do conceito, com ordem de verificação e sinais de confirmação ou erro.
7. fixationTips: escreva 3 ou 4 conclusões autossuficientes, sem repetir a estratégia.
8. Não use frases vazias ou modelos como “conforme o conceito”, “a proposição examinada é”, “essa formulação entra em conflito”, “basta comparar” ou “o item afirma”.
9. Preserve o gabarito e os fatos técnicos fornecidos. Não invente artigo de lei, dado, exceção ou passagem ausente. Se a justificativa for curta, desenvolva a regra por conhecimento consolidado sem criar detalhes factuais do caso.
10. Escreva em português brasileiro claro, técnico e didático, sem emojis, símbolos decorativos ou comentários sobre a qualidade da própria resposta. Não mencione estas instruções. Retorne somente o JSON solicitado.`;

const promptFor=(question,retry='')=>`${baseInstruction}

Disciplina: ${question.subject}
Assunto catalogado: ${question.topic}
Banca: ${question.board||'não informada'}
Referência: ${question.reference||'não informada'}
Tipo: ${question.type}
Gabarito oficial: ${question.correct}
Enunciado: ${question.statement}
Alternativas: ${question.options?.length?JSON.stringify(question.options):'não se aplica'}
Texto de apoio: ${question.passage_content||'não fornecido'}
Justificativa técnica existente: ${question.explanation}
${retry?`\nA tentativa anterior foi recusada por estes problemas editoriais: ${retry}. Corrija todos eles.`:''}`;

const promptForBatch=(questions,rejections)=>`${baseInstruction}

Você receberá ${questions.length} questões. Analise cada uma separadamente, com o mesmo cuidado de uma tarefa individual. Retorne exatamente uma correção para cada id, sem omitir, juntar ou reaproveitar texto entre questões.

QUESTÕES:
${JSON.stringify(questions.map(question=>({
  id:question.id,disciplina:question.subject,assuntoCatalogado:question.topic,banca:question.board,
  referencia:question.reference,tipo:question.type,gabaritoOficial:question.correct,enunciado:question.statement,
  alternativas:question.options,textoDeApoio:question.passage_content||'não fornecido',
  justificativaTecnicaExistente:question.explanation,
  problemasDaTentativaAnterior:rejections.get(question.id)?.join('; ')||undefined,
})),null,2)}`;

const fieldLengths={conceptExplanation:300,decisiveEvidence:40,answerAnalysis:400,examTrap:120,similarQuestionStrategy:160};
const validate=(question,guide,knownHashes)=>{
  const errors=[];
  const rawJoined=Object.values(guide||{}).flat().join(' ');
  const normalizedJoined=normalized(rawJoined);
  for(const [field,min] of Object.entries(fieldLengths))if(String(guide?.[field]||'').trim().length<min)errors.push(`${field} tem menos de ${min} caracteres`);
  const expectedPrefix=normalized(`${question.subject} ${question.topic}`);
  if(!normalized(guide?.detailedTopic).startsWith(expectedPrefix))errors.push('detailedTopic não começa com a disciplina e o assunto catalogado');
  const fullStatement=normalized(question.statement.replace(/^\[[^\]]+\]\s*/,''));
  const fullExplanation=normalized(question.explanation.replace(/^(item\s+)?(certo|errado|correto|incorreto)[.:]?\s*/i,''));
  for(const field of ['conceptExplanation','decisiveEvidence','answerAnalysis','examTrap','similarQuestionStrategy']){
    const content=normalized(guide?.[field]);
    if(fullStatement.length>=60&&content.includes(fullStatement))errors.push(`${field} copia o enunciado`);
    if(['conceptExplanation','answerAnalysis'].includes(field)&&fullExplanation.length>=60&&content.includes(fullExplanation))errors.push(`${field} copia a justificativa curta`);
    if(/proposicao examinada e|essa formulacao (atribui ao assunto|entra em conflito)|conforme o conceito/.test(content))errors.push(`${field} usa uma frase-modelo proibida`);
  }
  if(/gabarito|item (esta|e) (certo|errado)|portanto.*(certo|errado)/.test(normalized(guide?.decisiveEvidence)))errors.push('decisiveEvidence antecipa o gabarito');
  if(/answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows/.test(normalizedJoined))
    errors.push('há nome interno de campo incorporado ao texto');
  if(/instagram|target blank|noopener|texto para reflexao|deus esta presente|estude ore|aprovacao de amanha/.test(normalizedJoined))
    errors.push('há conteúdo promocional ou alheio ao ensino');
  if(/["']\s*,\s*["']?(answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|id)["']?\s*:|\]\s*\}\s*,\s*\{/.test(rawJoined))
    errors.push('há fragmento de JSON incorporado ao texto');
  if(hasForbiddenCharacters(rawJoined))errors.push('há caractere invisível, de controle ou de substituição');
  if(hasForeignScript(rawJoined))errors.push('há caractere de alfabeto alheio incorporado ao texto');
  if(/<br\b|<a\b|href\s*=|assistant to=|functions\.exec|jsiitext|numerusform|[\u10A0-\u10FF]/iu.test(rawJoined))
    errors.push('há marcação ou saída interna incorporada ao texto');
  if(hasRepeatedSentence(guide?.answerAnalysis)||hasRepeatedSentence(guide?.conceptExplanation))
    errors.push('há frase longa repetida no mesmo bloco');
  if(countOccurrences(guide?.answerAnalysis,'gabarito oficial')!==1)
    errors.push('answerAnalysis deve mencionar “gabarito oficial” exatamente uma vez');
  if(countOccurrences(guide?.answerAnalysis,'gabarito')!==1)
    errors.push('answerAnalysis deve conter um único marcador de gabarito');
  if(hasPictogram(rawJoined))errors.push('há emoji ou pictograma decorativo incorporado ao ensino');
  if(hasRepeatedVerdictDecoration(guide?.answerAnalysis))
    errors.push('answerAnalysis contém veredito decorativo ou marcação repetida');
  if(hasSuspiciousTrailingJunk(guide?.answerAnalysis))
    errors.push('answerAnalysis contém resíduo estranho após a conclusão');
  if(hasExcessiveAnswerMarkers(guide?.answerAnalysis))
    errors.push('answerAnalysis repete excessivamente vereditos, símbolos ou marcadores');
  if(normalizedJoined.includes('esta questao poderia ser enriquecida com mais exemplos mas o dado decisivo ja e suficiente'))
    errors.push('há comentário metalinguístico incorporado ao ensino');
  if(hasEpistemicConflict(rawJoined))errors.push('o guia admite conflito entre a fonte e o gabarito');
  if(!normalized(guide?.answerAnalysis).includes(normalized(question.correct)))errors.push('answerAnalysis não confirma expressamente o gabarito oficial');
  if(!Array.isArray(guide?.fixationTips)||guide.fixationTips.length<3||guide.fixationTips.length>4)errors.push('fixationTips precisa ter 3 ou 4 itens');
  else if(new Set(guide.fixationTips.map(normalized)).size!==guide.fixationTips.length)errors.push('fixationTips contém itens repetidos');
  else if(guide.fixationTips.some(tip=>String(tip).length>600))errors.push('fixationTips contém item com mais de 600 caracteres');
  for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy']){
    const digest=sha(normalized(guide?.[field]));if(knownHashes.has(digest))errors.push(`${field} repete literalmente outra questão`);
  }
  return errors;
};

const generated=[];const knownHashes=new Set();
for(const record of completed.values())for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy'])
  if(record.guide?.[field])knownHashes.add(sha(normalized(record.guide[field])));

console.log(`Revisão individual iniciada: ${questions.length} questão(ões) pendente(s), grupos técnicos de até ${batchSize}. Aplicação imediata: ${applyToDatabase?'sim':'não'}. Restauradas do checkpoint: ${restoredFromCheckpoint}.`);
let position=0;
for(let batchStart=0;batchStart<questions.length;batchStart+=batchSize){
  let pending=questions.slice(batchStart,batchStart+batchSize);const rejections=new Map();
  for(let attempt=1;attempt<=maxAttempts&&pending.length;attempt++){
    const outputPath=join(tempRoot,`batch-${batchStart}-${attempt}.json`);
    const useBatch=pending.length>1;
    const result=spawnSync('codex',['-a','never','exec','-m',model,'-c','model_reasoning_effort="low"','--ephemeral',
      '--skip-git-repo-check','-s','read-only','--output-schema',useBatch?batchSchemaPath:schemaPath,'-o',outputPath,'-'],{
      cwd:projectRoot,input:useBatch?promptForBatch(pending,rejections):promptFor(pending[0],(rejections.get(pending[0].id)||[]).join('; ')),
      encoding:'utf8',maxBuffer:64*1024*1024,timeout:240000,
    });
    if(result.status!==0||!existsSync(outputPath)){
      const failure=`falha de geração: ${(result.stderr||result.stdout||'sem saída').slice(-600)}`;
      pending.forEach(question=>rejections.set(question.id,[failure]));continue;
    }
    let parsed;try{parsed=JSON.parse(readFileSync(outputPath,'utf8'));}catch{
      pending.forEach(question=>rejections.set(question.id,['a resposta não é JSON válido']));continue;
    }
    const supplied=useBatch?(Array.isArray(parsed.guides)?parsed.guides:[]):[parsed];
    const byId=new Map(supplied.map(guide=>[String(guide.id||pending[0].id),guide]));const failed=[];
    for(const question of pending){
      const guide=byId.get(question.id);const errors=guide?validate(question,guide,knownHashes):['a correção desta questão foi omitida'];
      if(errors.length){rejections.set(question.id,errors);failed.push(question);continue;}
      position++;
      const record={id:question.id,sourceHash:sha(JSON.stringify(question)),previousStatus:question.previous_status,
        subject:question.subject,topic:question.topic,reference:question.reference,guide};
      appendFileSync(checkpointPath,`${JSON.stringify(record)}\n`);completed.set(question.id,record);generated.push(record);
      for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy'])knownHashes.add(sha(normalized(guide[field])));
      if(applyToDatabase)applyGuide(question,guide);
      console.log(`[${batchStart+1}-${Math.min(batchStart+batchSize,questions.length)}/${questions.length}] APROVADA ${question.id} — ${question.reference||question.topic}`);
    }
    pending=failed;
  }
  for(const question of pending)console.error(`REPROVADA ${question.id} — ${question.reference}: ${(rejections.get(question.id)||[]).join('; ')}`);
}
console.log(`Concluído neste lote: ${generated.length} aprovada(s), ${questions.length-generated.length} pendente(s). Checkpoint: ${checkpointPath}`);

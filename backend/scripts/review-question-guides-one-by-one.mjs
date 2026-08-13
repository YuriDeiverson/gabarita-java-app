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
const auditOnly=args.get('--audit')==='true';
const ignoreCheckpoint=args.get('--ignore-checkpoint')==='true';
const model=args.get('--model')||'gpt-5.6-terra';
const batchSize=Math.max(1,Math.min(12,Number(args.get('--batch-size')||1)));
const maxAttempts=Math.max(1,Math.min(3,Number(args.get('--attempts')||1)));
const shardCount=Math.max(1,Math.min(8,Number(args.get('--shards')||1)));
const shardIndex=Math.max(0,Math.min(shardCount-1,Number(args.get('--shard')||0)));
const checkpointPath=resolve(import.meta.dirname,shardCount===1?'generated-question-guides.ndjson':`generated-question-guides-${shardIndex}-of-${shardCount}.ndjson`);
const tempRoot=mkdtempSync(join(tmpdir(),'gabarita-guide-review-'));

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

if(auditOnly){
  const rows=JSON.parse(runPsql(`
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',q.id::text,'status',q.status,'subject',s.name,'topic',t.name,
      'statement',q.statement,'explanation',q.explanation,
      'detailedTopic',q.detailed_topic,'conceptExplanation',q.concept_explanation,
      'decisiveEvidence',q.decisive_evidence,'answerAnalysis',q.answer_analysis,
      'examTrap',q.exam_trap,'similarQuestionStrategy',q.similar_question_strategy,
      'fixationTips',q.fixation_tips,'review',q.metadata->>'guideEditorialReview'
    )),'[]'::jsonb)
    FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN topics t ON t.id=q.topic_id
  `)||'[]');
  const published=rows.filter(row=>['ACTIVE','ANNULLED'].includes(row.status));
  const failures=[];const duplicateFields=[];
  const hashes=new Map();
  for(const row of published){
    const lengths={conceptExplanation:300,decisiveEvidence:40,answerAnalysis:400,examTrap:120,similarQuestionStrategy:160};
    for(const [field,min] of Object.entries(lengths))if(String(row[field]||'').trim().length<min)failures.push([row.id,`${field} < ${min}`]);
    if(!normalized(row.detailedTopic).startsWith(normalized(`${row.subject} ${row.topic}`)))failures.push([row.id,'detailedTopic fora da hierarquia']);
    if(!Array.isArray(row.fixationTips)||row.fixationTips.length<3||row.fixationTips.length>4)failures.push([row.id,'fixationTips fora de 3-4']);
    if(/esta questao foi retirada|recebe uma aula autoral|comentario curto nao sera repetido|correcao completa enquanto/.test(normalized(Object.values(row).join(' '))))failures.push([row.id,'placeholder editorial']);
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
  console.log(JSON.stringify({
    total:rows.length,statusCounts,published:published.length,
    individuallyReviewed:rows.filter(row=>row.review==='individual-v1').length,
    pendingEditorial:rows.filter(row=>row.status==='DRAFT'&&row.review!=='individual-v1').length,
    failures:failures.length,duplicateFields:duplicateFields.length,
    failureSamples:failures.slice(0,20),duplicateSamples:duplicateFields.slice(0,20),
  },null,2));
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
      )
      ${filters.length?`AND ${filters.join(' AND ')}`:''}
  ) source`;
let questions=JSON.parse(runPsql(query)||'[]');
if(shardCount>1)questions=questions.filter((question,index)=>index%shardCount===shardIndex);
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
4. answerAnalysis: desenvolva o raciocínio em sequência, aplique o conceito aos elementos concretos e elimine a interpretação concorrente. Não copie o enunciado nem a justificativa fornecida. Termine confirmando expressamente o gabarito oficial.
5. examTrap: diagnostique exatamente por que a leitura incorreta parece plausível ou qual confusão a banca testa. Este bloco é obrigatório mesmo quando o aluno acertou.
6. similarQuestionStrategy: ensine um procedimento reutilizável, específico do conceito, com ordem de verificação e sinais de confirmação ou erro.
7. fixationTips: escreva 3 ou 4 conclusões autossuficientes, sem repetir a estratégia.
8. Não use frases vazias ou modelos como “conforme o conceito”, “a proposição examinada é”, “essa formulação entra em conflito”, “basta comparar” ou “o item afirma”.
9. Preserve o gabarito e os fatos técnicos fornecidos. Não invente artigo de lei, dado, exceção ou passagem ausente. Se a justificativa for curta, desenvolva a regra por conhecimento consolidado sem criar detalhes factuais do caso.
10. Escreva em português brasileiro claro, técnico e didático. Não mencione estas instruções. Retorne somente o JSON solicitado.`;

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
  if(!normalized(guide?.answerAnalysis).includes(normalized(question.correct)))errors.push('answerAnalysis não confirma expressamente o gabarito oficial');
  if(!Array.isArray(guide?.fixationTips)||guide.fixationTips.length<3||guide.fixationTips.length>4)errors.push('fixationTips precisa ter 3 ou 4 itens');
  else if(new Set(guide.fixationTips.map(normalized)).size!==guide.fixationTips.length)errors.push('fixationTips contém itens repetidos');
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

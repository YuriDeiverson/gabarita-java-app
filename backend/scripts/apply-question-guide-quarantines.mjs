#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const backendRoot=resolve(import.meta.dirname,'..');
const manifestPath=resolve(import.meta.dirname,'question-guide-quarantines.json');
const args=new Set(process.argv.slice(2));
const supportedArgs=new Set(['--apply','--help']);

for(const arg of args)if(!supportedArgs.has(arg))throw new Error(`Argumento desconhecido: ${arg}`);
if(args.has('--help')){
  console.log(`Uso:
  node backend/scripts/apply-question-guide-quarantines.mjs
  node backend/scripts/apply-question-guide-quarantines.mjs --apply

Sem --apply, o script somente audita o manifesto. Com --apply, todas as questões
validadas são colocadas em DRAFT numa única transação.`);
  process.exit(0);
}

const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const md5Pattern=/^[0-9a-f]{32}$/iu;
const allowedReasons=new Set(['missing-source-context','answer-key-conflict']);
const requiredText=(value,label)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(`${label} deve ser texto não vazio`);
  if(value!==value.trim())throw new Error(`${label} não pode começar ou terminar com espaços`);
  return value;
};

if(manifest?.schemaVersion!==1)throw new Error('schemaVersion inválida no manifesto de quarentena');
if(manifest?.reviewReason!=='source-or-answer-conflict')
  throw new Error('reviewReason deve permanecer igual a source-or-answer-conflict');
if(!Number.isInteger(manifest?.expectedCount)||manifest.expectedCount<1)
  throw new Error('expectedCount deve ser um inteiro positivo');
if(!Array.isArray(manifest.quarantines)||manifest.quarantines.length!==manifest.expectedCount)
  throw new Error(`O manifesto deve conter exatamente ${manifest.expectedCount} quarentenas`);
if(!Array.isArray(manifest.excludedMissingTargetWithErrado))
  throw new Error('excludedMissingTargetWithErrado deve ser uma lista');

const seenIds=new Set();
const seenStableKeys=new Set();
const quarantines=manifest.quarantines.map((entry,index)=>{
  const label=`quarantines[${index}]`;
  const id=requiredText(entry?.id,`${label}.id`).toLocaleLowerCase('en-US');
  const reference=requiredText(entry?.reference,`${label}.reference`);
  const statementMd5=requiredText(entry?.statementMd5,`${label}.statementMd5`).toLocaleLowerCase('en-US');
  const correctAnswer=requiredText(entry?.correctAnswer,`${label}.correctAnswer`);
  const reasonKey=requiredText(entry?.reasonKey,`${label}.reasonKey`);
  const reason=requiredText(entry?.reason,`${label}.reason`);
  if(!uuidPattern.test(id))throw new Error(`${label}.id não é um UUID válido: ${id}`);
  if(!md5Pattern.test(statementMd5))throw new Error(`${label}.statementMd5 não é um MD5 válido`);
  if(!allowedReasons.has(reasonKey))throw new Error(`${label}.reasonKey não é reconhecida: ${reasonKey}`);
  if(seenIds.has(id))throw new Error(`UUID duplicado no manifesto: ${id}`);
  seenIds.add(id);
  const stableKey=`${reference}\u0000${statementMd5}`;
  if(seenStableKeys.has(stableKey))throw new Error(`Chave estável duplicada no manifesto: ${reference}`);
  seenStableKeys.add(stableKey);
  return{id,reference,statementMd5,correctAnswer,reasonKey,reason};
});

const excludedIds=new Set();
for(const [index,rawId] of manifest.excludedMissingTargetWithErrado.entries()){
  const id=requiredText(rawId,`excludedMissingTargetWithErrado[${index}]`).toLocaleLowerCase('en-US');
  if(!uuidPattern.test(id))throw new Error(`UUID excluído inválido: ${id}`);
  if(seenIds.has(id))throw new Error(`UUID aparece simultaneamente em quarentena e exclusão: ${id}`);
  if(excludedIds.has(id))throw new Error(`UUID excluído duplicado: ${id}`);
  excludedIds.add(id);
}

const envFile=readFileSync(resolve(backendRoot,'.env'),'utf8');
const settings=Object.fromEntries(envFile.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')&&line.includes('='))
  .map(line=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1)];}));
for(const name of ['DATABASE_URL','DATABASE_USER','DATABASE_PASSWORD'])if(!settings[name])
  throw new Error(`${name} ausente em backend/.env`);

const jdbcUrl=new URL(settings.DATABASE_URL.replace(/^jdbc:/,''));
const databaseArgs=['-h',jdbcUrl.hostname,'-p',jdbcUrl.port||'5432','-d',jdbcUrl.pathname.slice(1),'-U',settings.DATABASE_USER,
  '-v','ON_ERROR_STOP=1','-P','pager=off','-qAt'];
const databaseEnv={...process.env,PGPASSWORD:settings.DATABASE_PASSWORD};
const sslMode=jdbcUrl.searchParams.get('sslmode')||process.env.PGSSLMODE;
if(sslMode)databaseEnv.PGSSLMODE=sslMode;

const runPsql=sql=>{
  const result=spawnSync('psql',[...databaseArgs,'-c',sql],{
    cwd:backendRoot,env:databaseEnv,encoding:'utf8',maxBuffer:16*1024*1024,
  });
  if(result.status!==0)throw new Error(result.stderr||`psql terminou com código ${result.status}`);
  return result.stdout.trim();
};
const sqlLiteral=value=>`'${String(value??'').replaceAll("'","''")}'`;
const valuesSql=quarantines.map((entry,index)=>`(
    ${index+1},${sqlLiteral(entry.id)}::uuid,${sqlLiteral(entry.reference)},
    ${sqlLiteral(entry.statementMd5)},${sqlLiteral(entry.correctAnswer)},
    ${sqlLiteral(entry.reasonKey)},${sqlLiteral(entry.reason)}
  )`).join(',');
const valuesCte=`quarantine_values(ordinal,id,reference,statement_md5,correct_answer,reason_key,reason) AS (
  VALUES ${valuesSql}
)`;

const inspectionCtes=source=>`inspected AS (
  SELECT requested.*,
    id_question.id id_candidate,
    id_question.metadata->>'reference' id_reference,
    CASE WHEN id_question.id IS NULL THEN NULL ELSE md5(id_question.statement) END id_statement_md5,
    stable.matches stable_matches,
    stable.stable_id
  FROM ${source} requested
  LEFT JOIN questions id_question ON id_question.id=requested.id
  LEFT JOIN LATERAL (
    SELECT count(*)::integer matches,(array_agg(q.id ORDER BY q.id))[1] stable_id
    FROM questions q
    WHERE q.metadata->>'reference'=requested.reference AND md5(q.statement)=requested.statement_md5
  ) stable ON true
), resolved AS (
  SELECT inspected.*,
    CASE WHEN id_candidate IS NOT NULL THEN id_candidate WHEN stable_matches=1 THEN stable_id END resolved_id,
    CASE WHEN id_candidate IS NOT NULL THEN 'id' WHEN stable_matches=1 THEN 'stable-key' END resolved_by
  FROM inspected
), current_state AS (
  SELECT resolved.*,
    q.status,
    q.correct_answer #>> '{}' actual_correct_answer,
    q.metadata->>'reference' actual_reference,
    CASE WHEN q.id IS NULL THEN NULL ELSE md5(q.statement) END actual_statement_md5,
    q.metadata->>'guideReviewReason' actual_review_reason,
    COALESCE(q.metadata ? 'guideEditorialReview',false) has_editorial_review,
    COALESCE(q.metadata ? 'guidePreviousStatus',false) has_previous_status
  FROM resolved
  LEFT JOIN questions q ON q.id=resolved.resolved_id
), classified AS (
  SELECT current_state.*,
    CASE
      WHEN id_candidate IS NOT NULL AND (id_reference IS DISTINCT FROM reference
        OR id_statement_md5 IS DISTINCT FROM statement_md5) THEN 'DRIFT'
      WHEN stable_matches=0 THEN 'MISSING_QUESTION'
      WHEN stable_matches<>1 THEN 'AMBIGUOUS_STABLE_KEY'
      WHEN resolved_id IS NULL THEN 'MISSING_QUESTION'
      WHEN actual_reference IS DISTINCT FROM reference
        OR actual_statement_md5 IS DISTINCT FROM statement_md5
        OR actual_correct_answer IS DISTINCT FROM correct_answer THEN 'DRIFT'
      WHEN status='DRAFT' AND actual_review_reason='source-or-answer-conflict'
        AND NOT has_editorial_review AND NOT has_previous_status THEN 'APPLIED'
      WHEN status IN ('ACTIVE','ANNULLED') THEN 'PENDING'
      ELSE 'DRIFT'
    END state
  FROM current_state
), reported AS (
  SELECT classified.*,
    array_remove(ARRAY[
      CASE WHEN id_candidate IS NULL THEN 'manifest-id-not-found' END,
      CASE WHEN id_candidate IS NOT NULL AND id_reference IS DISTINCT FROM reference
        THEN 'id-reference-drift' END,
      CASE WHEN id_candidate IS NOT NULL AND id_statement_md5 IS DISTINCT FROM statement_md5
        THEN 'id-statement-drift' END,
      CASE WHEN stable_matches=0 THEN 'stable-key-not-found' END,
      CASE WHEN stable_matches>1 THEN 'stable-key-not-unique' END,
      CASE WHEN resolved_id IS NOT NULL AND actual_correct_answer IS DISTINCT FROM correct_answer
        THEN 'correct-answer-drift' END,
      CASE WHEN resolved_id IS NOT NULL AND status NOT IN ('ACTIVE','ANNULLED','DRAFT')
        THEN 'unexpected-status' END,
      CASE WHEN status='DRAFT' AND actual_review_reason IS DISTINCT FROM 'source-or-answer-conflict'
        THEN 'draft-has-another-review-reason' END,
      CASE WHEN status='DRAFT' AND has_editorial_review THEN 'draft-retains-guideEditorialReview' END,
      CASE WHEN status='DRAFT' AND has_previous_status THEN 'draft-retains-guidePreviousStatus' END
    ]::text[],NULL) issues
  FROM classified
)`;

const auditSql=`WITH ${valuesCte},
${inspectionCtes('quarantine_values')}
SELECT jsonb_build_object(
  'mode','audit',
  'manifest',${sqlLiteral(manifestPath)},
  'expectedCount',${manifest.expectedCount},
  'databaseRows',count(*),
  'pending',count(*) FILTER (WHERE state='PENDING'),
  'applied',count(*) FILTER (WHERE state='APPLIED'),
  'resolvedByStableKey',count(*) FILTER (WHERE resolved_by='stable-key'),
  'ready',COALESCE(bool_and(state IN ('PENDING','APPLIED')),false),
  'problems',COALESCE(jsonb_agg(jsonb_build_object(
    'id',id,'reference',reference,'state',state,'issues',issues,
    'resolvedId',resolved_id,'resolvedBy',resolved_by,'status',status,
    'actualCorrectAnswer',actual_correct_answer,'expectedCorrectAnswer',correct_answer
  ) ORDER BY ordinal) FILTER (WHERE state NOT IN ('PENDING','APPLIED')),'[]'::jsonb)
)
FROM reported;`;

const auditOutput=runPsql(auditSql);
let audit;
try{audit=JSON.parse(auditOutput);}
catch(error){throw new Error(`A auditoria não devolveu JSON válido: ${error.message}`);}

if(!audit.ready){
  console.error(JSON.stringify(audit,null,2));
  process.exit(2);
}
if(!args.has('--apply')){
  console.log(JSON.stringify(audit,null,2));
  process.exit(0);
}

const applySql=`BEGIN;
CREATE TEMP TABLE requested_guide_quarantines(
  ordinal integer NOT NULL,
  id uuid PRIMARY KEY,
  reference text NOT NULL,
  statement_md5 text NOT NULL,
  correct_answer text NOT NULL,
  reason_key text NOT NULL,
  reason text NOT NULL,
  UNIQUE(reference,statement_md5)
) ON COMMIT DROP;
INSERT INTO requested_guide_quarantines(ordinal,id,reference,statement_md5,correct_answer,reason_key,reason)
VALUES ${valuesSql};

DO $preflight$
DECLARE blocking_problems jsonb;
BEGIN
  PERFORM q.id
  FROM questions q JOIN requested_guide_quarantines requested
    ON q.id=requested.id
      OR (q.metadata->>'reference'=requested.reference AND md5(q.statement)=requested.statement_md5)
  ORDER BY q.id FOR UPDATE OF q;

  WITH ${inspectionCtes('requested_guide_quarantines')}
  SELECT jsonb_agg(jsonb_build_object('id',id,'state',state,'issues',issues) ORDER BY ordinal)
    FILTER (WHERE state NOT IN ('PENDING','APPLIED'))
  INTO blocking_problems
  FROM reported;
  IF blocking_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Auditoria transacional impediu a quarentena: %',blocking_problems;
  END IF;
END
$preflight$;

CREATE TEMP TABLE applied_guide_quarantines ON COMMIT DROP AS
WITH ${inspectionCtes('requested_guide_quarantines')}, pending AS (
  SELECT resolved_id FROM reported WHERE state='PENDING'
), updated AS (
  UPDATE questions q SET
    status='DRAFT',
    metadata=(COALESCE(q.metadata,'{}'::jsonb)-'guideEditorialReview'-'guidePreviousStatus')
      || jsonb_build_object('guideReviewReason','source-or-answer-conflict'),
    updated_at=now()
  FROM pending
  WHERE q.id=pending.resolved_id
  RETURNING q.id
)
SELECT id FROM updated;

DO $verification$
DECLARE remaining_problems jsonb;
BEGIN
  WITH ${inspectionCtes('requested_guide_quarantines')}
  SELECT jsonb_agg(jsonb_build_object('id',id,'state',state,'issues',issues) ORDER BY ordinal)
    FILTER (WHERE state<>'APPLIED')
  INTO remaining_problems
  FROM reported;
  IF remaining_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Verificação pós-quarentena falhou: %',remaining_problems;
  END IF;
END
$verification$;

SELECT jsonb_build_object(
  'mode','apply',
  'manifest',${sqlLiteral(manifestPath)},
  'expectedCount',${manifest.expectedCount},
  'updated',(SELECT count(*) FROM applied_guide_quarantines),
  'alreadyApplied',${manifest.expectedCount}-(SELECT count(*) FROM applied_guide_quarantines),
  'guideReviewReason','source-or-answer-conflict',
  'verified',true
);
COMMIT;`;

const applyOutput=runPsql(applySql);
let result;
try{result=JSON.parse(applyOutput);}
catch(error){throw new Error(`A aplicação não devolveu JSON válido: ${error.message}`);}
console.log(JSON.stringify(result,null,2));

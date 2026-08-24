#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const backendRoot=resolve(import.meta.dirname,'..');
const correctionsPath=resolve(import.meta.dirname,'question-taxonomy-corrections.json');
const args=new Set(process.argv.slice(2));
const supportedArgs=new Set(['--apply','--help']);

for(const arg of args)if(!supportedArgs.has(arg))throw new Error(`Argumento desconhecido: ${arg}`);
if(args.has('--help')){
  console.log(`Uso:
  node backend/scripts/apply-question-taxonomy-corrections.mjs
  node backend/scripts/apply-question-taxonomy-corrections.mjs --apply

Sem --apply, o script apenas audita as 42 correções. Com --apply, valida novamente
o estado e aplica todas as correções pendentes em uma única transação.`);
  process.exit(0);
}

const manifest=JSON.parse(readFileSync(correctionsPath,'utf8'));
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const requiredText=(value,label)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(`${label} deve ser texto não vazio`);
  if(value!==value.trim())throw new Error(`${label} não pode começar ou terminar com espaços`);
  return value;
};

if(manifest?.schemaVersion!==1)throw new Error('schemaVersion inválida no manifesto de correções');
if(manifest?.expectedCount!==42)throw new Error('expectedCount deve permanecer igual a 42');
if(!Array.isArray(manifest.corrections)||manifest.corrections.length!==manifest.expectedCount)
  throw new Error(`O manifesto deve conter exatamente ${manifest.expectedCount} correções`);

const seenIds=new Set();
const corrections=manifest.corrections.map((correction,index)=>{
  const label=`corrections[${index}]`;
  const id=requiredText(correction?.id,`${label}.id`).toLocaleLowerCase('en-US');
  if(!uuidPattern.test(id))throw new Error(`${label}.id não é um UUID válido: ${id}`);
  if(seenIds.has(id))throw new Error(`UUID duplicado no manifesto: ${id}`);
  seenIds.add(id);
  const expected={
    subject:requiredText(correction?.expected?.subject,`${label}.expected.subject`),
    topic:requiredText(correction?.expected?.topic,`${label}.expected.topic`),
  };
  const target={
    subject:requiredText(correction?.target?.subject,`${label}.target.subject`),
    topic:requiredText(correction?.target?.topic,`${label}.target.topic`),
  };
  const reason=requiredText(correction?.reason,`${label}.reason`);
  if(expected.subject===target.subject&&expected.topic===target.topic)
    throw new Error(`${label} não altera a taxonomia`);
  return{id,expected,target,reason};
});

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
const valuesSql=corrections.map((correction,index)=>`(
    ${index+1},${sqlLiteral(correction.id)}::uuid,
    ${sqlLiteral(correction.expected.subject)},${sqlLiteral(correction.expected.topic)},
    ${sqlLiteral(correction.target.subject)},${sqlLiteral(correction.target.topic)},
    ${sqlLiteral(correction.reason)}
  )`).join(',');
const valuesCte=`correction_values(ordinal,id,expected_subject,expected_topic,target_subject,target_topic,reason) AS (
  VALUES ${valuesSql}
)`;

const inspectionCtes=source=>`inspected AS (
  SELECT c.*,
    q.id IS NOT NULL question_exists,
    actual_subject.name actual_subject,
    actual_topic.name actual_topic,
    actual_subject.exam_id IS NULL actual_subject_is_global,
    actual_topic.subject_id=q.subject_id topic_belongs_to_subject,
    COALESCE(q.metadata->>'category','') metadata_subject,
    COALESCE(q.metadata->>'topic','') metadata_topic,
    btrim(split_part(COALESCE(q.detailed_topic,''),'→',1)) detailed_subject,
    btrim(split_part(COALESCE(q.detailed_topic,''),'→',2)) detailed_topic,
    (SELECT count(*)::integer FROM subjects s
      WHERE s.exam_id IS NULL AND s.name=c.expected_subject) expected_subject_matches,
    (SELECT count(*)::integer FROM subjects s JOIN topics t ON t.subject_id=s.id
      WHERE s.exam_id IS NULL AND s.name=c.expected_subject AND t.name=c.expected_topic) expected_topic_matches,
    (SELECT count(*)::integer FROM subjects s
      WHERE s.exam_id IS NULL AND s.name=c.target_subject) target_subject_matches,
    (SELECT count(*)::integer FROM subjects s JOIN topics t ON t.subject_id=s.id
      WHERE s.exam_id IS NULL AND s.name=c.target_subject AND t.name=c.target_topic) target_topic_matches
  FROM ${source} c
  LEFT JOIN questions q ON q.id=c.id
  LEFT JOIN subjects actual_subject ON actual_subject.id=q.subject_id
  LEFT JOIN topics actual_topic ON actual_topic.id=q.topic_id
), classified AS (
  SELECT inspected.*,
    CASE
      WHEN expected_subject_matches<>1 OR expected_topic_matches<>1
        OR target_subject_matches<>1 OR target_topic_matches<>1 THEN 'INVALID_CATALOG'
      WHEN NOT question_exists THEN 'MISSING_QUESTION'
      WHEN actual_subject=expected_subject AND actual_topic=expected_topic
        AND actual_subject_is_global AND topic_belongs_to_subject
        AND metadata_subject=expected_subject AND metadata_topic=expected_topic
        AND detailed_subject=expected_subject AND detailed_topic=expected_topic THEN 'PENDING'
      WHEN actual_subject=target_subject AND actual_topic=target_topic
        AND actual_subject_is_global AND topic_belongs_to_subject
        AND metadata_subject=target_subject AND metadata_topic=target_topic
        AND detailed_subject=target_subject AND detailed_topic=target_topic THEN 'APPLIED'
      ELSE 'DRIFT'
    END state
  FROM inspected
), reported AS (
  SELECT classified.*,
    array_remove(ARRAY[
      CASE WHEN expected_subject_matches<>1 THEN 'expected-global-subject-not-1:1' END,
      CASE WHEN expected_topic_matches<>1 THEN 'expected-global-subject-topic-not-1:1' END,
      CASE WHEN target_subject_matches<>1 THEN 'target-global-subject-not-1:1' END,
      CASE WHEN target_topic_matches<>1 THEN 'target-global-subject-topic-not-1:1' END,
      CASE WHEN NOT question_exists THEN 'question-not-found' END,
      CASE WHEN question_exists AND NOT (
        (actual_subject=expected_subject AND actual_topic=expected_topic
          AND actual_subject_is_global AND topic_belongs_to_subject)
        OR (actual_subject=target_subject AND actual_topic=target_topic
          AND actual_subject_is_global AND topic_belongs_to_subject)
      ) THEN 'question-taxonomy-drift' END,
      CASE WHEN question_exists AND actual_subject=expected_subject AND actual_topic=expected_topic
        AND NOT (metadata_subject=expected_subject AND metadata_topic=expected_topic)
        THEN 'metadata-does-not-match-expected-taxonomy' END,
      CASE WHEN question_exists AND actual_subject=target_subject AND actual_topic=target_topic
        AND NOT (metadata_subject=target_subject AND metadata_topic=target_topic)
        THEN 'metadata-does-not-match-target-taxonomy' END,
      CASE WHEN question_exists AND actual_subject=expected_subject AND actual_topic=expected_topic
        AND NOT (detailed_subject=expected_subject AND detailed_topic=expected_topic)
        THEN 'detailed-topic-prefix-does-not-match-expected-taxonomy' END,
      CASE WHEN question_exists AND actual_subject=target_subject AND actual_topic=target_topic
        AND NOT (detailed_subject=target_subject AND detailed_topic=target_topic)
        THEN 'detailed-topic-prefix-does-not-match-target-taxonomy' END
    ]::text[],NULL) issues
  FROM classified
)`;

const auditSql=`WITH ${valuesCte},
${inspectionCtes('correction_values')}
SELECT jsonb_build_object(
  'mode','audit',
  'manifest',${sqlLiteral(correctionsPath)},
  'expectedCount',${manifest.expectedCount},
  'databaseRows',count(*),
  'pending',count(*) FILTER (WHERE state='PENDING'),
  'applied',count(*) FILTER (WHERE state='APPLIED'),
  'ready',COALESCE(bool_and(state IN ('PENDING','APPLIED')),false),
  'problems',COALESCE(jsonb_agg(jsonb_build_object(
    'id',id,
    'state',state,
    'issues',issues,
    'actual',jsonb_build_object(
      'subject',actual_subject,'topic',actual_topic,
      'globalSubject',actual_subject_is_global,'topicBelongsToSubject',topic_belongs_to_subject,
      'metadataCategory',metadata_subject,'metadataTopic',metadata_topic,
      'detailedSubject',detailed_subject,'detailedTopic',detailed_topic
    ),
    'expected',jsonb_build_object('subject',expected_subject,'topic',expected_topic),
    'target',jsonb_build_object('subject',target_subject,'topic',target_topic)
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
CREATE TEMP TABLE taxonomy_corrections(
  ordinal integer NOT NULL,
  id uuid PRIMARY KEY,
  expected_subject text NOT NULL,
  expected_topic text NOT NULL,
  target_subject text NOT NULL,
  target_topic text NOT NULL,
  reason text NOT NULL
) ON COMMIT DROP;
INSERT INTO taxonomy_corrections(ordinal,id,expected_subject,expected_topic,target_subject,target_topic,reason)
VALUES ${valuesSql};

DO $preflight$
DECLARE blocking_problems jsonb;
BEGIN
  PERFORM q.id FROM questions q JOIN taxonomy_corrections c ON c.id=q.id ORDER BY q.id FOR UPDATE OF q;
  WITH ${inspectionCtes('taxonomy_corrections')}
  SELECT jsonb_agg(jsonb_build_object('id',id,'state',state,'issues',issues) ORDER BY ordinal)
    FILTER (WHERE state NOT IN ('PENDING','APPLIED'))
  INTO blocking_problems
  FROM reported;
  IF blocking_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Auditoria transacional impediu a aplicação: %',blocking_problems;
  END IF;
END
$preflight$;

CREATE TEMP TABLE applied_taxonomy_corrections ON COMMIT DROP AS
WITH pending AS (
  SELECT c.id,c.target_subject,c.target_topic,
    target_subject.id target_subject_id,target_topic.id target_topic_id,
    regexp_split_to_array(q.detailed_topic,'[[:space:]]*→[[:space:]]*') detailed_parts
  FROM taxonomy_corrections c
  JOIN questions q ON q.id=c.id
  JOIN subjects current_subject ON current_subject.id=q.subject_id AND current_subject.exam_id IS NULL
  JOIN topics current_topic ON current_topic.id=q.topic_id AND current_topic.subject_id=current_subject.id
  JOIN subjects target_subject ON target_subject.exam_id IS NULL AND target_subject.name=c.target_subject
  JOIN topics target_topic ON target_topic.subject_id=target_subject.id AND target_topic.name=c.target_topic
  WHERE current_subject.name=c.expected_subject AND current_topic.name=c.expected_topic
    AND q.metadata->>'category'=c.expected_subject AND q.metadata->>'topic'=c.expected_topic
    AND btrim(split_part(q.detailed_topic,'→',1))=c.expected_subject
    AND btrim(split_part(q.detailed_topic,'→',2))=c.expected_topic
), updated AS (
  UPDATE questions q SET
    subject_id=pending.target_subject_id,
    topic_id=pending.target_topic_id,
    metadata=jsonb_set(
      jsonb_set(COALESCE(q.metadata,'{}'::jsonb),'{category}',to_jsonb(pending.target_subject),true),
      '{topic}',to_jsonb(pending.target_topic),true
    ),
    detailed_topic=pending.target_subject || ' → ' || pending.target_topic ||
      CASE
        WHEN cardinality(pending.detailed_parts)>2
          AND btrim(array_to_string(pending.detailed_parts[3:],' → '))<>''
        THEN ' → ' || btrim(array_to_string(pending.detailed_parts[3:],' → '))
        ELSE ''
      END,
    updated_at=now()
  FROM pending
  WHERE q.id=pending.id
  RETURNING q.id
)
SELECT id FROM updated;

DO $verification$
DECLARE remaining_problems jsonb;
BEGIN
  WITH ${inspectionCtes('taxonomy_corrections')}
  SELECT jsonb_agg(jsonb_build_object('id',id,'state',state,'issues',issues) ORDER BY ordinal)
    FILTER (WHERE state<>'APPLIED')
  INTO remaining_problems
  FROM reported;
  IF remaining_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Verificação pós-atualização falhou: %',remaining_problems;
  END IF;
END
$verification$;

SELECT jsonb_build_object(
  'mode','apply',
  'manifest',${sqlLiteral(correctionsPath)},
  'expectedCount',${manifest.expectedCount},
  'updated',(SELECT count(*) FROM applied_taxonomy_corrections),
  'alreadyApplied',${manifest.expectedCount}-(SELECT count(*) FROM applied_taxonomy_corrections),
  'verified',true
);
COMMIT;`;

const applyOutput=runPsql(applySql);
let result;
try{result=JSON.parse(applyOutput);}
catch(error){throw new Error(`A aplicação não devolveu JSON válido: ${error.message}`);}
console.log(JSON.stringify(result,null,2));

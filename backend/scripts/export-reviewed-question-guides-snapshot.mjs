#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  SNAPSHOT_IDENTITY_VERSION,SNAPSHOT_SCHEMA_VERSION,assertValidSnapshot,recordsDigest,sourceFingerprint,
} from './question-guide-snapshot-quality.mjs';

const backendRoot=resolve(import.meta.dirname,'..');
const outputPath=resolve(import.meta.dirname,'reviewed-question-guides.snapshot.json');
const temporaryPath=`${outputPath}.${process.pid}.tmp`;

const envFile=readFileSync(resolve(backendRoot,'.env'),'utf8');
const settings=Object.fromEntries(envFile.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')&&line.includes('='))
  .map(line=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1)];}));
for(const name of ['DATABASE_URL','DATABASE_USER','DATABASE_PASSWORD'])if(!settings[name])throw new Error(`${name} ausente em backend/.env`);

const jdbcUrl=new URL(settings.DATABASE_URL.replace(/^jdbc:/,''));
const databaseArgs=['-h',jdbcUrl.hostname,'-p',jdbcUrl.port||'5432','-d',jdbcUrl.pathname.slice(1),'-U',settings.DATABASE_USER,
  '-v','ON_ERROR_STOP=1','-P','pager=off','-At'];
const databaseEnv={...process.env,PGPASSWORD:settings.DATABASE_PASSWORD};
const sslMode=jdbcUrl.searchParams.get('sslmode')||process.env.PGSSLMODE;
if(sslMode)databaseEnv.PGSSLMODE=sslMode;
const result=spawnSync('psql',[...databaseArgs,'-c',String.raw`
  WITH identified AS (
    SELECT q.*,
      encode(digest(q.statement || chr(31) || COALESCE(q.correct_answer #>> '{}',''),'sha256'),'hex') source_fingerprint,
      count(*) OVER(PARTITION BY q.statement,COALESCE(q.correct_answer #>> '{}','')) fingerprint_match_count
    FROM questions q
  ), reviewed AS (
    SELECT q.id,
      jsonb_build_object(
        'currentId',q.id::text,
        'previousStatus',q.status,
        'identity',jsonb_build_object(
          'fingerprint',q.source_fingerprint,
          'fingerprintMatchCount',q.fingerprint_match_count,
          'legacyKeys',COALESCE((
            SELECT jsonb_agg(jsonb_build_object('courseId',keys.course_id,'legacyId',keys.legacy_id)
              ORDER BY keys.course_id,keys.legacy_id)
            FROM (
              SELECT legacy.course_id,legacy.legacy_id
              FROM question_course_legacy_ids legacy WHERE legacy.question_id=q.id
              UNION
              SELECT q.metadata->>'courseId',q.metadata->>'legacyId'
              WHERE COALESCE(q.metadata->>'courseId','')<>'' AND COALESCE(q.metadata->>'legacyId','')<>''
            ) keys
          ),'[]'::jsonb)
        ),
        'taxonomy',jsonb_build_object(
          'subject',subject.name,
          'topic',topic.name,
          'targetMatchCount',(
            SELECT count(*)
            FROM subjects target_subject
            JOIN topics target_topic ON target_topic.subject_id=target_subject.id
            WHERE target_subject.exam_id IS NULL AND target_subject.active
              AND target_topic.active AND target_subject.name=subject.name AND target_topic.name=topic.name
          )
        ),
        'source',jsonb_build_object(
          'statement',q.statement,
          'correctAnswer',COALESCE(q.correct_answer #>> '{}',''),
          'explanation',COALESCE(q.explanation,''),
          'reference',COALESCE(q.metadata->>'reference','')
        ),
        'guide',jsonb_build_object(
          'detailedTopic',q.detailed_topic,
          'conceptExplanation',q.concept_explanation,
          'decisiveEvidence',q.decisive_evidence,
          'answerAnalysis',q.answer_analysis,
          'examTrap',q.exam_trap,
          'similarQuestionStrategy',q.similar_question_strategy,
          'fixationTips',q.fixation_tips
        )
      ) record
    FROM identified q
    JOIN subjects subject ON subject.id=q.subject_id
    JOIN topics topic ON topic.id=q.topic_id
    WHERE q.status IN ('ACTIVE','ANNULLED') AND q.metadata->>'guideEditorialReview'='individual-v1'
  )
  SELECT jsonb_build_object(
    'databaseTotal',(SELECT count(*) FROM questions),
    'publishedTotal',(SELECT count(*) FROM questions WHERE status IN ('ACTIVE','ANNULLED')),
    'draftTotal',(SELECT count(*) FROM questions WHERE status='DRAFT'),
    'reviewedTotal',(SELECT count(*) FROM reviewed),
    'publishedWithoutSnapshot',(SELECT count(*) FROM questions
      WHERE status IN ('ACTIVE','ANNULLED') AND COALESCE(metadata->>'guideEditorialReview','')<>'individual-v1'),
    'v60Applied',(SELECT EXISTS(
      SELECT 1 FROM flyway_schema_history WHERE version='60' AND success
    )),
    'records',COALESCE((SELECT jsonb_agg(record ORDER BY id) FROM reviewed),'[]'::jsonb)
  );
`],{cwd:backendRoot,env:databaseEnv,encoding:'utf8',maxBuffer:128*1024*1024});
if(result.status!==0)throw new Error(result.stderr||`psql terminou com código ${result.status}`);

let exported;
try{exported=JSON.parse(result.stdout.trim());}
catch(error){throw new Error(`O banco não devolveu JSON válido: ${error.message}`);}
const records=(exported.records??[]).map(record=>({
  currentId:String(record.currentId??''),
  previousStatus:String(record.previousStatus??''),
  identity:{
    legacyKeys:(record.identity?.legacyKeys??[]).map(key=>({courseId:String(key.courseId??''),legacyId:String(key.legacyId??'')}))
      .sort((left,right)=>left.courseId.localeCompare(right.courseId)||left.legacyId.localeCompare(right.legacyId)),
    fingerprint:String(record.identity?.fingerprint??''),
    fingerprintMatchCount:Number(record.identity?.fingerprintMatchCount??0),
  },
  taxonomy:{
    subject:String(record.taxonomy?.subject??''),topic:String(record.taxonomy?.topic??''),
    targetMatchCount:Number(record.taxonomy?.targetMatchCount??0),
  },
  source:{
    statement:String(record.source?.statement??''),correctAnswer:String(record.source?.correctAnswer??''),
    explanation:String(record.source?.explanation??''),reference:String(record.source?.reference??''),
  },
  guide:{
    detailedTopic:String(record.guide?.detailedTopic??''),conceptExplanation:String(record.guide?.conceptExplanation??''),
    decisiveEvidence:String(record.guide?.decisiveEvidence??''),answerAnalysis:String(record.guide?.answerAnalysis??''),
    examTrap:String(record.guide?.examTrap??''),similarQuestionStrategy:String(record.guide?.similarQuestionStrategy??''),
    fixationTips:Array.isArray(record.guide?.fixationTips)?record.guide.fixationTips.map(String):[],
  },
})).sort((left,right)=>left.currentId.localeCompare(right.currentId));

for(const record of records)if(record.identity.fingerprint!==sourceFingerprint(record.source.statement,record.source.correctAnswer))
  throw new Error(`Fingerprint devolvido pelo PostgreSQL diverge do cálculo canônico em ${record.currentId}`);
if(!records.length)throw new Error('Nenhuma questão individualmente revisada foi encontrada; snapshot não será substituído');

const statusCounts={
  ACTIVE:records.filter(record=>record.previousStatus==='ACTIVE').length,
  ANNULLED:records.filter(record=>record.previousStatus==='ANNULLED').length,
};
const snapshot={
  schemaVersion:SNAPSHOT_SCHEMA_VERSION,
  identityVersion:SNAPSHOT_IDENTITY_VERSION,
  exportedAt:new Date().toISOString(),
  databaseState:{
    total:Number(exported.databaseTotal),published:Number(exported.publishedTotal),draft:Number(exported.draftTotal),
    individuallyReviewed:Number(exported.reviewedTotal),publishedWithoutSnapshot:Number(exported.publishedWithoutSnapshot),
    v60Applied:Boolean(exported.v60Applied),
  },
  expected:{recordCount:records.length,statusCounts,recordsSha256:recordsDigest(records)},
  records,
};
assertValidSnapshot(snapshot);
if(snapshot.databaseState.individuallyReviewed!==records.length)
  throw new Error(`Contagem do banco diverge do snapshot: ${snapshot.databaseState.individuallyReviewed} != ${records.length}`);

try{
  writeFileSync(temporaryPath,`${JSON.stringify(snapshot,null,2)}\n`,{encoding:'utf8',flag:'wx'});
  const reread=JSON.parse(readFileSync(temporaryPath,'utf8'));assertValidSnapshot(reread);
  renameSync(temporaryPath,outputPath);
}catch(error){
  if(existsSync(temporaryPath))unlinkSync(temporaryPath);
  throw error;
}
console.log(JSON.stringify({
  snapshot:outputPath,records:records.length,statusCounts,sha256:snapshot.expected.recordsSha256,
  databaseState:snapshot.databaseState,
},null,2));

#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=import.meta.dirname;
const inputNames=[
  'generated-question-guides.ndjson',
  'generated-question-guides-0-of-3.ndjson',
  'generated-question-guides-1-of-3.ndjson',
  'generated-question-guides-2-of-3.ndjson',
];
const latest=new Map();
for(const name of inputNames){
  const path=resolve(root,name);if(!existsSync(path))continue;
  for(const line of readFileSync(path,'utf8').split(/\r?\n/).filter(Boolean)){
    const record=JSON.parse(line);latest.set(record.id,record);
  }
}

const records=[...latest.values()].sort((a,b)=>a.id.localeCompare(b.id));
const chunks=[];
for(let index=0;index<records.length;index+=200)chunks.push(records.slice(index,index+200));

const sql=[`-- Conteúdo editorial produzido e validado questão por questão.
-- Fonte auditável: backend/scripts/generated-question-guides*.ndjson
`];
for(const [index,chunk] of chunks.entries()){
  const payload=chunk.map(({id,previousStatus,guide})=>({
    id,previousStatus,detailedTopic:guide.detailedTopic,conceptExplanation:guide.conceptExplanation,
    decisiveEvidence:guide.decisiveEvidence,answerAnalysis:guide.answerAnalysis,examTrap:guide.examTrap,
    similarQuestionStrategy:guide.similarQuestionStrategy,fixationTips:guide.fixationTips,
  }));
  const tag=`guides_${index}`;
  sql.push(`
WITH reviewed AS (
  SELECT *
  FROM jsonb_to_recordset($${tag}$${JSON.stringify(payload)}$${tag}$::jsonb) AS guide(
    id uuid,
    "previousStatus" text,
    "detailedTopic" text,
    "conceptExplanation" text,
    "decisiveEvidence" text,
    "answerAnalysis" text,
    "examTrap" text,
    "similarQuestionStrategy" text,
    "fixationTips" jsonb
  )
)
UPDATE questions q
SET detailed_topic=guide."detailedTopic",
  concept_explanation=guide."conceptExplanation",
  decisive_evidence=guide."decisiveEvidence",
  answer_analysis=guide."answerAnalysis",
  exam_trap=guide."examTrap",
  similar_question_strategy=guide."similarQuestionStrategy",
  fixation_tips=guide."fixationTips",
  comparison_headers='{}'::jsonb,
  comparison_rows='[]'::jsonb,
  status=guide."previousStatus",
  metadata=(q.metadata-'guideReviewReason'-'guidePreviousStatus')
    || jsonb_build_object('guideEditorialReview','individual-v1'),
  updated_at=now()
FROM reviewed guide
WHERE q.id=guide.id;
`);
}

const output=resolve(root,'../src/main/resources/db/migration/V60__restore_individually_reviewed_complete_question_lessons.sql');
writeFileSync(output,sql.join(''),'utf8');
console.log(`Migração gerada com ${records.length} correções em ${chunks.length} blocos: ${output}`);

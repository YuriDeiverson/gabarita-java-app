#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const names=[
  'generated-question-guides.ndjson',
  'generated-question-guides-0-of-3.ndjson',
  'generated-question-guides-1-of-3.ndjson',
  'generated-question-guides-2-of-3.ndjson',
];
const latest=new Map();
for(const name of names){
  const path=resolve(import.meta.dirname,name);if(!existsSync(path))continue;
  for(const line of readFileSync(path,'utf8').split(/\r?\n/).filter(Boolean)){
    const record=JSON.parse(line);latest.set(record.id,record);
  }
}
const fields=['detailedTopic','conceptExplanation','decisiveEvidence','answerAnalysis','examTrap','similarQuestionStrategy','fixationTips'];
const marker=/answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|comparisonHeaders|comparisonRows|instagram|target[ =]|noopener|texto para reflexão|deus está presente|estude,? ore|aprovação de amanhã|["']\s*,\s*["']?(answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|id)["']?\s*:|\]\s*\}\s*,\s*\{/i;
let count=0;
for(const record of latest.values()){
  const hits=[];
  for(const field of fields){
    const value=Array.isArray(record.guide?.[field])?record.guide[field].join(' | '):String(record.guide?.[field]||'');
    if(marker.test(value))hits.push({field,length:value.length,value});
  }
  if(!hits.length)continue;
  count++;
  console.log(JSON.stringify({id:record.id,subject:record.subject,topic:record.topic,reference:record.reference,hits}));
}
console.error(`TOTAL=${count}`);

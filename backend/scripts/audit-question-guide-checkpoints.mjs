#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=import.meta.dirname;
const paths=[
  'generated-question-guides.ndjson',
  'generated-question-guides-0-of-3.ndjson',
  'generated-question-guides-1-of-3.ndjson',
  'generated-question-guides-2-of-3.ndjson',
].map(name=>resolve(root,name)).filter(existsSync);

const normalized=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
const sha=value=>createHash('sha256').update(value).digest('hex');
const hasForbiddenCharacters=value=>/[\u200B-\u200F\uFEFF\uFFFC\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(String(value??''));
const hasRepeatedSentence=value=>{
  const sentences=String(value??'').split(/[.!?]+/).map(normalized).filter(sentence=>sentence.length>=40);
  return new Set(sentences).size!==sentences.length;
};
const latest=new Map();
let records=0;

for(const path of paths)for(const line of readFileSync(path,'utf8').split(/\r?\n/).filter(Boolean)){
  const record=JSON.parse(line);latest.set(record.id,record);records++;
}

const failures=[];const duplicateFields=[];const hashes=new Map();
for(const record of latest.values()){
  const {guide}=record;
  const lengths={conceptExplanation:300,decisiveEvidence:40,answerAnalysis:400,examTrap:120,similarQuestionStrategy:160};
  for(const [field,min] of Object.entries(lengths))if(String(guide?.[field]||'').trim().length<min)failures.push([record.id,`${field} < ${min}`]);
  if(!normalized(guide?.detailedTopic).startsWith(normalized(`${record.subject} ${record.topic}`)))failures.push([record.id,'detailedTopic fora da hierarquia']);
  if(!Array.isArray(guide?.fixationTips)||guide.fixationTips.length<3||guide.fixationTips.length>4)failures.push([record.id,'fixationTips fora de 3-4']);
  if(Array.isArray(guide?.fixationTips)&&new Set(guide.fixationTips.map(normalized)).size!==guide.fixationTips.length)failures.push([record.id,'fixationTips repetidas']);
  const joined=normalized(Object.values(guide||{}).flat().join(' '));
  if(/esta questao foi retirada|recebe uma aula autoral|comentario curto nao sera repetido|correcao completa enquanto/.test(joined))failures.push([record.id,'placeholder editorial']);
  if(/proposicao examinada e|essa formulacao (atribui ao assunto|entra em conflito)|conforme o conceito/.test(joined))failures.push([record.id,'frase-modelo proibida']);
  if(/answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows/.test(joined))
    failures.push([record.id,'nome interno de campo incorporado ao texto']);
  if(/instagram|target blank|noopener|texto para reflexao|deus esta presente|estude ore|aprovacao de amanha/.test(joined))
    failures.push([record.id,'conteúdo promocional ou alheio ao ensino']);
  if(/["']\s*,\s*["']?(answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|id)["']?\s*:|\]\s*\}\s*,\s*\{/.test(Object.values(guide||{}).flat().join(' ')))
    failures.push([record.id,'fragmento de JSON incorporado ao texto']);
  const rawJoined=Object.values(guide||{}).flat().join(' ');
  if(hasForbiddenCharacters(rawJoined))failures.push([record.id,'caractere invisível, de controle ou de substituição']);
  if(/<br\b|<a\b|href\s*=|assistant to=|functions\.exec|jsiitext|numerusform|[\u10A0-\u10FF]/iu.test(rawJoined))
    failures.push([record.id,'marcação ou saída interna incorporada ao texto']);
  if(hasRepeatedSentence(guide?.answerAnalysis)||hasRepeatedSentence(guide?.conceptExplanation))
    failures.push([record.id,'frase longa repetida no mesmo bloco']);
  if(Array.isArray(guide?.fixationTips)&&guide.fixationTips.some(tip=>String(tip).length>600))
    failures.push([record.id,'fixationTips contém item com mais de 600 caracteres']);
  for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy']){
    const digest=sha(normalized(guide?.[field]));const key=`${field}:${digest}`;
    if(hashes.has(key))duplicateFields.push([field,hashes.get(key),record.id]);else hashes.set(key,record.id);
  }
}

console.log(JSON.stringify({
  checkpointFiles:paths.length,records,uniqueQuestions:latest.size,
  failures:failures.length,failedQuestions:new Set(failures.map(([id])=>id)).size,duplicateFields:duplicateFields.length,
  failureSamples:failures.slice(0,20),duplicateSamples:duplicateFields.slice(0,20),
},null,2));
process.exit(failures.length||duplicateFields.length?2:0);

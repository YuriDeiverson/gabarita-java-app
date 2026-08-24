import { createHash } from 'node:crypto';

export const SNAPSHOT_SCHEMA_VERSION=1;
export const SNAPSHOT_IDENTITY_VERSION='exact-statement-correct-answer-v1';

const requiredTextLengths={
  conceptExplanation:[300,12000],
  decisiveEvidence:[40,3000],
  answerAnalysis:[400,12000],
  examTrap:[120,5000],
  similarQuestionStrategy:[160,5000],
};

export const normalized=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();

export const sha256=value=>createHash('sha256').update(String(value??''),'utf8').digest('hex');

export const sourceFingerprint=(statement,correctAnswer)=>sha256(`${String(statement??'')}\u001f${String(correctAnswer??'')}`);

export const recordsDigest=records=>sha256(JSON.stringify(records));

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hexDigestPattern=/^[0-9a-f]{64}$/;
const forbiddenCharacters=/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFFFC\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const hasForeignScript=value=>Array.from(String(value??'')).some(character=>
  /\p{Letter}/u.test(character)&&!/[\p{Script=Latin}\p{Script=Greek}]/u.test(character)&&character!=='ℹ');
const hasPictogram=value=>Array.from(String(value??'')).some(character=>
  /\p{Extended_Pictographic}/u.test(character)&&!['©','®','™','ℹ'].includes(character));
const repeatedVerdictDecoration=value=>/\(\s*(certo|errado)\s*\)|\[\s*confirmado\s*:\s*(certo|errado)\s*\]|\\n|\*\*\s*gabarito/iu.test(String(value??''));
const suspiciousTrailingJunk=value=>/(?:certo|errado)[.!]?\s+\d+(?:\.\d+)+\s*$|[【】]/iu.test(String(value??''));
const epistemicConflict=value=>{
  const text=normalized(value);
  return /preserv(a|ando|ado).{0,100}gabarito|mantendo se o gabarito|gabarito (fornecido|disponibilizado) exige/.test(text)
    ||/(enunciado|trecho|fragmento|recorte).{0,120}nao (contem|exibe|figura|reproduz|permite).{0,160}(termo referido|pergunta|their|software platforms|comprovacao textual|contexto original)/.test(text)
    ||/nao e tecnicamente adequad|inconsistencia entre (o rotulo|a denominacao)|tensao cronologica evidente|terminologia .{0,80} usual.{0,180}(contudo|apesar|preserv)/.test(text);
};
const excessiveAnswerMarkers=value=>{
  const raw=String(value??'');
  const verdicts=normalized(raw).match(/\b(certo|errado)\b/g)?.length??0;
  return verdicts>4||(raw.match(/[—–]/g)?.length??0)>8;
};

const repeatedLongSentence=value=>{
  const sentences=String(value??'').split(/[.!?]+/).map(normalized).filter(sentence=>sentence.length>=40);
  return new Set(sentences).size!==sentences.length;
};

const textValues=guide=>[
  guide?.detailedTopic,guide?.conceptExplanation,guide?.decisiveEvidence,guide?.answerAnalysis,
  guide?.examTrap,guide?.similarQuestionStrategy,...(Array.isArray(guide?.fixationTips)?guide.fixationTips:[]),
];

const guideErrors=record=>{
  const errors=[];
  const guide=record?.guide;
  const source=record?.source;
  const taxonomy=record?.taxonomy;
  if(!guide||typeof guide!=='object'||Array.isArray(guide))return['guide ausente ou inválido'];
  if(typeof guide.detailedTopic!=='string'||guide.detailedTopic.trim().length<8)errors.push('detailedTopic inválido');
  for(const [field,[minimum,maximum]] of Object.entries(requiredTextLengths)){
    const value=guide[field];
    if(typeof value!=='string')errors.push(`${field} não é texto`);
    else if(value.trim().length<minimum||value.trim().length>maximum)errors.push(`${field} fora de ${minimum}-${maximum} caracteres`);
  }
  if(typeof taxonomy?.subject==='string'&&typeof taxonomy?.topic==='string'
    &&!normalized(guide.detailedTopic).startsWith(normalized(`${taxonomy.subject} ${taxonomy.topic}`)))
    errors.push('detailedTopic fora da hierarquia subject/topic');
  if(!Array.isArray(guide.fixationTips)||guide.fixationTips.length<3||guide.fixationTips.length>4)
    errors.push('fixationTips precisa ter 3 ou 4 itens');
  else{
    if(guide.fixationTips.some(tip=>typeof tip!=='string'||!tip.trim()||tip.length>600))
      errors.push('fixationTips contém item vazio, inválido ou maior que 600 caracteres');
    if(new Set(guide.fixationTips.map(normalized)).size!==guide.fixationTips.length)
      errors.push('fixationTips contém itens repetidos');
  }

  const rawJoined=textValues(guide).join(' ');
  const joined=normalized(rawJoined);
  if(/esta questao foi retirada|recebe uma aula autoral|comentario curto nao sera repetido|correcao completa enquanto/.test(joined))
    errors.push('placeholder editorial');
  if(/proposicao examinada e|essa formulacao (atribui ao assunto|entra em conflito)|conforme o conceito/.test(joined))
    errors.push('frase-modelo proibida');
  if(/answeranalysis|examtrap|similarquestionstrategy|fixationtips|comparisonheaders|comparisonrows/.test(joined))
    errors.push('nome interno de campo incorporado ao texto');
  if(/instagram|target blank|noopener|texto para reflexao|deus esta presente|estude ore|aprovacao de amanha/.test(joined))
    errors.push('conteúdo promocional ou alheio ao ensino');
  if(/["']\s*,\s*["']?(answerAnalysis|examTrap|similarQuestionStrategy|fixationTips|id)["']?\s*:|\]\s*\}\s*,\s*\{/.test(rawJoined))
    errors.push('fragmento de JSON incorporado ao texto');
  if(/<\/?[a-z][^>]*>|href\s*=|assistant\s+to=|functions\.(exec|wait)|jsiitext|numerusform/iu.test(rawJoined))
    errors.push('HTML ou saída interna incorporada ao texto');
  if(hasPictogram(rawJoined))errors.push('emoji ou pictograma decorativo incorporado ao texto');
  if(forbiddenCharacters.test(rawJoined))errors.push('caractere invisível, de controle ou de substituição');
  if(hasForeignScript(rawJoined))errors.push('caractere de alfabeto alheio incorporado ao texto');
  if(repeatedLongSentence(guide.answerAnalysis)||repeatedLongSentence(guide.conceptExplanation))
    errors.push('frase longa repetida no mesmo bloco');
  if(repeatedVerdictDecoration(guide.answerAnalysis))errors.push('answerAnalysis contém veredito decorativo ou marcação repetida');
  if(suspiciousTrailingJunk(guide.answerAnalysis))errors.push('answerAnalysis contém resíduo estranho após a conclusão');
  if(excessiveAnswerMarkers(guide.answerAnalysis))errors.push('answerAnalysis repete excessivamente vereditos ou travessões');
  if(joined.includes('esta questao poderia ser enriquecida com mais exemplos mas o dado decisivo ja e suficiente'))
    errors.push('comentário metalinguístico incorporado ao ensino');
  if(epistemicConflict(rawJoined))errors.push('guia admite conflito entre a fonte e o gabarito');

  const evidence=normalized(guide.decisiveEvidence);
  if(/gabarito|\b(item|afirmacao) (esta|e) (certo|correto|errado|incorreto)\b|portanto.{0,30}\b(certo|correto|errado|incorreto)\b/.test(evidence))
    errors.push('decisiveEvidence antecipa o gabarito');

  const analysis=normalized(guide.answerAnalysis);
  const allVerdictOccurrences=joined.match(/gabarito/g)?.length??0;
  if(allVerdictOccurrences>1)errors.push(`guia contém ${allVerdictOccurrences} ocorrências de “gabarito”; máximo: 1`);
  const verdictOccurrences=analysis.match(/gabarito oficial/g)?.length??0;
  if(verdictOccurrences!==1)errors.push(`answerAnalysis contém ${verdictOccurrences} ocorrências de “gabarito oficial”; esperado: 1`);
  const expectedAnswer=record.previousStatus==='ANNULLED'?'anulada':normalized(source?.correctAnswer);
  const verdictIndex=analysis.indexOf('gabarito oficial');
  if(!expectedAnswer||verdictIndex<0||!analysis.slice(verdictIndex,verdictIndex+140).split(' ').includes(expectedAnswer))
    errors.push('answerAnalysis não confirma o gabarito esperado próximo à conclusão');

  const statement=normalized(String(source?.statement??'').replace(/^\[[^\]]+\]\s*/,''));
  const explanation=normalized(String(source?.explanation??'').replace(/^(item\s+)?(certo|errado|correto|incorreto)[.:]?\s*/i,''));
  for(const field of ['conceptExplanation','decisiveEvidence','answerAnalysis','examTrap','similarQuestionStrategy']){
    const content=normalized(guide[field]);
    if(statement.length>=60&&content.includes(statement))errors.push(`${field} copia o enunciado inteiro`);
    if(['conceptExplanation','answerAnalysis'].includes(field)&&explanation.length>=60&&content.includes(explanation))
      errors.push(`${field} copia a justificativa resumida`);
  }
  return errors;
};

export const validateSnapshot=snapshot=>{
  const failures=[];
  const fail=(id,reason)=>failures.push({id:id||'(snapshot)',reason});
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return[{id:'(snapshot)',reason:'snapshot inválido'}];
  if(snapshot.schemaVersion!==SNAPSHOT_SCHEMA_VERSION)fail('(snapshot)',`schemaVersion deve ser ${SNAPSHOT_SCHEMA_VERSION}`);
  if(snapshot.identityVersion!==SNAPSHOT_IDENTITY_VERSION)fail('(snapshot)',`identityVersion deve ser ${SNAPSHOT_IDENTITY_VERSION}`);
  if(!snapshot.exportedAt||Number.isNaN(Date.parse(snapshot.exportedAt)))fail('(snapshot)','exportedAt inválido');
  if(typeof snapshot.databaseState?.v60Applied!=='boolean')fail('(snapshot)','databaseState.v60Applied deve ser booleano');
  if(!Array.isArray(snapshot.records))return[...failures,{id:'(snapshot)',reason:'records não é uma lista'}];
  if(!snapshot.records.length)fail('(snapshot)','snapshot não contém registros');
  if(snapshot.expected?.recordCount!==snapshot.records.length)fail('(snapshot)','expected.recordCount diverge de records.length');
  if(snapshot.expected?.recordsSha256!==recordsDigest(snapshot.records))fail('(snapshot)','recordsSha256 diverge do conteúdo');

  const ids=new Set();const legacyKeys=new Map();const fingerprints=new Map();const fieldHashes=new Map();
  const statusCounts={ACTIVE:0,ANNULLED:0};
  for(const record of snapshot.records){
    const id=record?.currentId;
    if(!uuidPattern.test(String(id??'')))fail(id,'currentId não é UUID válido');
    if(ids.has(id))fail(id,'currentId duplicado');else ids.add(id);
    if(!['ACTIVE','ANNULLED'].includes(record?.previousStatus))fail(id,'previousStatus deve ser ACTIVE ou ANNULLED');
    else statusCounts[record.previousStatus]++;
    if(typeof record?.taxonomy?.subject!=='string'||!record.taxonomy.subject.trim())fail(id,'subject ausente');
    if(typeof record?.taxonomy?.topic!=='string'||!record.taxonomy.topic.trim())fail(id,'topic ausente');
    if(record?.taxonomy?.targetMatchCount!==1)fail(id,'subject/topic não possui resolução canônica única no banco exportado');
    if(typeof record?.source?.statement!=='string'||!record.source.statement.trim())fail(id,'enunciado ausente');
    if(typeof record?.source?.correctAnswer!=='string'||!record.source.correctAnswer.trim())fail(id,'gabarito-fonte ausente');
    if(!hexDigestPattern.test(String(record?.identity?.fingerprint??'')))fail(id,'fingerprint inválido');
    else if(record.identity.fingerprint!==sourceFingerprint(record.source.statement,record.source.correctAnswer))fail(id,'fingerprint diverge de enunciado+gabarito');
    if(record?.identity?.fingerprintMatchCount!==1)fail(id,'fingerprint não era único no banco exportado');
    if(fingerprints.has(record?.identity?.fingerprint))fail(id,`fingerprint repete ${fingerprints.get(record.identity.fingerprint)}`);
    else fingerprints.set(record?.identity?.fingerprint,id);
    if(!Array.isArray(record?.identity?.legacyKeys))fail(id,'legacyKeys não é uma lista');
    else for(const key of record.identity.legacyKeys){
      if(typeof key?.courseId!=='string'||!key.courseId.trim()||typeof key?.legacyId!=='string'||!key.legacyId.trim()){
        fail(id,'legacyKey inválida');continue;
      }
      const composite=`${key.courseId}\u001f${key.legacyId}`;
      if(legacyKeys.has(composite)&&legacyKeys.get(composite)!==id)fail(id,`legacyKey também pertence a ${legacyKeys.get(composite)}`);
      else legacyKeys.set(composite,id);
    }
    for(const reason of guideErrors(record))fail(id,reason);
    for(const field of ['conceptExplanation','answerAnalysis','examTrap','similarQuestionStrategy']){
      const digest=sha256(normalized(record?.guide?.[field]));const key=`${field}:${digest}`;
      if(fieldHashes.has(key))fail(id,`${field} repete literalmente ${fieldHashes.get(key)}`);else fieldHashes.set(key,id);
    }
  }
  for(const status of ['ACTIVE','ANNULLED'])if(snapshot.expected?.statusCounts?.[status]!==statusCounts[status])
    fail('(snapshot)',`expected.statusCounts.${status} diverge: ${snapshot.expected?.statusCounts?.[status]} != ${statusCounts[status]}`);
  return failures;
};

export const assertValidSnapshot=snapshot=>{
  const failures=validateSnapshot(snapshot);
  if(!failures.length)return;
  const sample=failures.slice(0,30).map(({id,reason})=>`- ${id}: ${reason}`).join('\n');
  throw new Error(`Snapshot editorial recusado: ${failures.length} falha(s).\n${sample}`);
};

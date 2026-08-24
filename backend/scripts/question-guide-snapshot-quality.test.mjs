import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SNAPSHOT_IDENTITY_VERSION,SNAPSHOT_SCHEMA_VERSION,recordsDigest,sourceFingerprint,validateSnapshot,
} from './question-guide-snapshot-quality.mjs';

const longText=(opening,word,count)=>`${opening} ${Array.from({length:count},(_,index)=>`${word}${index+1}`).join(' ')}.`;

const validSnapshot=()=>{
  const source={
    statement:'Uma afirmação técnica inédita apresenta determinada relação operacional para julgamento pelo candidato.',
    correctAnswer:'Errado',explanation:'A relação descrita contraria a dependência técnica aplicável.',reference:'Fixture editorial',
  };
  const record={
    currentId:'11111111-1111-4111-8111-111111111111',previousStatus:'ACTIVE',
    identity:{legacyKeys:[],fingerprint:sourceFingerprint(source.statement,source.correctAnswer),fingerprintMatchCount:1},
    taxonomy:{subject:'Disciplina Técnica',topic:'Assunto Específico',targetMatchCount:1},source,
    guide:{
      detailedTopic:'Disciplina Técnica → Assunto Específico → Relação operacional verificável',
      conceptExplanation:longText('A base conceitual define o mecanismo, suas condições, seus limites e a diferença para institutos próximos, permitindo que o estudante reconheça a regra sem depender do texto da questão', 'fundamento',28),
      decisiveEvidence:'A relação operacional indicada deve respeitar a condição técnica que conecta suas etapas sucessivas.',
      answerAnalysis:longText('A resolução começa pela identificação da regra, separa as condições necessárias, confronta cada elemento relevante e elimina a leitura concorrente antes da conclusão; ao final dessa sequência, o gabarito oficial é Errado', 'análise',34),
      examTrap:longText('A armadilha explora a semelhança superficial entre mecanismos que possuem dependências diferentes e leva à supressão de uma condição essencial', 'diagnóstico',12),
      similarQuestionStrategy:longText('Em questões semelhantes, classifique o instituto, liste seus requisitos, confronte cada requisito com a situação descrita e somente então formule a conclusão técnica', 'verificação',15),
      fixationTips:['A regra depende de todas as condições essenciais.','Semelhança vocabular não elimina diferenças operacionais.','A conclusão deve resultar do confronto ordenado dos requisitos.'],
    },
  };
  const records=[record];
  return{
    schemaVersion:SNAPSHOT_SCHEMA_VERSION,identityVersion:SNAPSHOT_IDENTITY_VERSION,
    exportedAt:'2026-08-14T12:00:00.000Z',databaseState:{v60Applied:false},
    expected:{recordCount:1,statusCounts:{ACTIVE:1,ANNULLED:0},recordsSha256:recordsDigest(records)},records,
  };
};

const mutate=(change)=>{
  const snapshot=validSnapshot();change(snapshot.records[0]);
  snapshot.expected.recordsSha256=recordsDigest(snapshot.records);return snapshot;
};

test('aceita um snapshot editorial completo e canônico',()=>{
  assert.deepEqual(validateSnapshot(validSnapshot()),[]);
});

for(const [name,field,value,reason] of [
  ['invisível','conceptExplanation','\u200B','caractere invisível'],
  ['alfabeto estrangeiro','conceptExplanation',' ქართული','alfabeto alheio'],
  ['pictograma','conceptExplanation',' ✅','pictograma decorativo'],
  ['HTML','conceptExplanation',' <br>','HTML ou saída interna'],
  ['JSON','conceptExplanation',' \",\"answerAnalysis\":','fragmento de JSON'],
  ['veredito decorativo','answerAnalysis',' (Errado)','veredito decorativo'],
  ['quebra Markdown literal','answerAnalysis',' \\n','veredito decorativo'],
  ['resíduo final','answerAnalysis',' Errado 1.2','resíduo estranho'],
])test(`recusa ${name}`,()=>{
  const snapshot=mutate(record=>{record.guide[field]+=value;});
  assert(validateSnapshot(snapshot).some(failure=>failure.reason.includes(reason)));
});

test('recusa repetição de frase longa',()=>{
  const sentence='Esta sentença suficientemente longa foi repetida de modo literal no mesmo bloco para simular corrupção editorial';
  const snapshot=mutate(record=>{
    record.guide.answerAnalysis=`${sentence}. ${sentence}. ${longText('A análise complementar preserva a conclusão e o gabarito oficial é Errado','passo',36)}`;
  });
  assert(validateSnapshot(snapshot).some(failure=>failure.reason.includes('frase longa repetida')));
});

test('recusa mais de uma ocorrência de gabarito',()=>{
  const snapshot=mutate(record=>{record.guide.conceptExplanation+=' Outro gabarito não pode aparecer neste bloco.';});
  assert(validateSnapshot(snapshot).some(failure=>failure.reason.includes('ocorrências de “gabarito”')));
});

test('recusa conflito admitido entre fonte e gabarito',()=>{
  const snapshot=mutate(record=>{record.guide.examTrap+=' O enunciado não contém o termo referido, mas preserva o resultado.';});
  assert(validateSnapshot(snapshot).some(failure=>failure.reason.includes('conflito entre a fonte e o gabarito')));
});

test('permite as exceções pictográficas e o alfabeto grego previstos',()=>{
  const snapshot=mutate(record=>{record.guide.conceptExplanation+=' Símbolos permitidos em contexto técnico: © ® ™ ℹ e Ω.';});
  assert.deepEqual(validateSnapshot(snapshot),[]);
});

test('recusa fingerprint ou taxonomia sem unicidade comprovada',()=>{
  const snapshot=mutate(record=>{record.identity.fingerprintMatchCount=2;record.taxonomy.targetMatchCount=0;});
  const reasons=validateSnapshot(snapshot).map(failure=>failure.reason);
  assert(reasons.some(reason=>reason.includes('fingerprint não era único')));
  assert(reasons.some(reason=>reason.includes('resolução canônica única')));
});

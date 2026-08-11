import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));

const anmQuestions = readJson('frontend/imports/anm-2024-jornalismo.json');
const codevasfReviews = readJson('backend/scripts/data/codevasf-2024-question-reviews.json');
const ebserhReviews = readJson('backend/scripts/data/ebserh-2025-tecnico-enfermagem-reviews.json');

const reviews = [
  ...anmQuestions.map((question) => ({
    reference: question.reference,
    correct: question.correct,
    status: question.status,
    explanation: question.explanation,
    statement: question.text,
  })),
  ...codevasfReviews.map((review) => ({
    reference: `CODEVASF 2024 - Item ${review.item}`,
    correct: review.correct,
    status: review.correct === 'Anulada' ? 'ANNULLED' : 'ACTIVE',
    explanation: review.explanation,
  })),
  ...ebserhReviews.map((review) => ({
    reference: `FGV — EBSERH — Técnico em Enfermagem — Questão ${review.question}`,
    correct: review.correct,
    status: 'ACTIVE',
    explanation: review.explanation,
  })),
];

const duplicated = reviews.filter((review, index) => reviews.findIndex((candidate) => candidate.reference === review.reference) !== index);
if (duplicated.length) throw new Error(`Referências duplicadas: ${duplicated.map((review) => review.reference).join(', ')}`);

const payload = Buffer.from(JSON.stringify(reviews), 'utf8').toString('base64');
const output = resolve(root, 'backend/src/main/resources/db/migration/V33__review_generic_journalism_and_nursing_answers.sql');
const sql = `-- Revisão editorial das questões legadas que exibiam somente o gabarito e o assunto.
-- O payload mantém a migração compacta e contém apenas referência, resposta, status,
-- comentário didático e, quando necessário, o enunciado já separado do texto de apoio.
WITH reviewed AS (
  SELECT value AS item
  FROM jsonb_array_elements(
    convert_from(decode($reviewed_questions$${payload}$reviewed_questions$, 'base64'), 'UTF8')::jsonb
  )
)
UPDATE questions AS question
SET
  statement = COALESCE(NULLIF(reviewed.item->>'statement', ''), question.statement),
  correct_answer = to_jsonb(reviewed.item->>'correct'),
  status = reviewed.item->>'status',
  explanation = reviewed.item->>'explanation',
  updated_at = now()
FROM reviewed
WHERE question.metadata->>'reference' = reviewed.item->>'reference';
`;

writeFileSync(output, sql);
console.log(`Migração gerada com ${reviews.length} revisões em ${output}.`);

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const [pdfPath, outputPath = 'frontend/imports/anm-2024-jornalismo.json'] = process.argv.slice(2);
if (!pdfPath) throw new Error('Uso: node backend/scripts/build-anm-2024-journalism-import.mjs <prova.pdf> [saida.json]');

let extracted;
try {
  extracted = execFileSync('pdftotext', ['-raw', pdfPath, '-'], { encoding: 'utf8' });
} catch (error) {
  // Some sandboxed environments report EPERM after pdftotext has already
  // returned the complete extraction on stdout.
  if (!error.stdout) throw error;
  extracted = error.stdout;
}
const raw = extracted
  .replace(/pcimarkpci[^\n]*\n?/g, '')
  .replace(/www\.pciconcursos\.com\.br\n?/g, '')
  .replace(/CEBRASPE\s+–\s+ANM\s+–\s+Edital:\s+2024\n?/g, '')
  .replace(/-- CONHECIMENTOS ESPECÍFICOS --\n?/g, '')
  .replace(/\f/g, '\n');

const answers = `E C C E C E C E E C C E E E X C E C E C
E C C E C C E X E C X E E E C E E E C C
X C E C C C E C E C
E E C C C C C X C E C E E C E E E C C C
E C C C E E E E C C E C E C C C C C C E
C C C C C E E C C C C E C E E E C E E C
C E C C X E E C C C`.match(/[ECX]/g);
if (!answers || answers.length !== 120) throw new Error('Gabarito incompleto.');

const explanations = JSON.parse(readFileSync(new URL('./data/anm-2024-jornalismo-explanations.json', import.meta.url), 'utf8'));
if (!Array.isArray(explanations) || explanations.length !== 120) {
  throw new Error('O arquivo de comentários revisados deve conter exatamente 120 explicações.');
}

const categoryFor = (item) => {
  if (item <= 10) return ['Língua Portuguesa', 'Compreensão e interpretação de textos'];
  if (item <= 15) return ['Língua Inglesa', 'Compreensão de textos'];
  if (item <= 25) return ['Conhecimentos Gerais', 'Direito administrativo e administração pública'];
  if (item <= 30) return ['TI Básica', 'Informática e segurança da informação'];
  if (item <= 35) return ['Ética e Compliance', 'Ética pública, LAI e LGPD'];
  if (item <= 45) return ['Conhecimentos Gerais', 'Regulação e agências reguladoras'];
  if (item <= 50) return ['Conhecimentos Gerais', 'Raciocínio lógico'];
  if (item <= 54) return ['Conhecimentos Específicos - Jornalismo', 'História, conceitos, ética e legislação da comunicação'];
  if (item <= 58) return ['Conhecimentos Específicos - Jornalismo', 'Comunicação organizacional e interna'];
  if (item <= 60) return ['Conhecimentos Específicos - Jornalismo', 'Comunicação pública'];
  if (item <= 64) return ['Conhecimentos Específicos - Jornalismo', 'Meios de comunicação e técnicas de pesquisa'];
  if (item <= 68) return ['Conhecimentos Específicos - Jornalismo', 'Gêneros e formatos jornalísticos'];
  if (item <= 70) return ['Conhecimentos Específicos - Jornalismo', 'Produção da notícia e redação jornalística'];
  if (item <= 73) return ['Conhecimentos Específicos - Jornalismo', 'Jornalismo para TV e Internet'];
  if (item <= 76) return ['Conhecimentos Específicos - Jornalismo', 'Nota, notícia e reportagem'];
  if (item <= 80) return ['Conhecimentos Específicos - Jornalismo', 'Rádio e televisão'];
  if (item <= 84) return ['Conhecimentos Específicos - Jornalismo', 'Design thinking'];
  if (item <= 88) return ['Conhecimentos Específicos - Jornalismo', 'Pirâmide invertida e lide'];
  if (item <= 97) return ['Conhecimentos Específicos - Jornalismo', 'Assessoria de imprensa e entrevistas'];
  if (item <= 102) return ['Conhecimentos Específicos - Jornalismo', 'Teoria da notícia'];
  if (item <= 105) return ['Conhecimentos Específicos - Jornalismo', 'Entrevista jornalística'];
  if (item <= 107) return ['Conhecimentos Específicos - Jornalismo', 'Webjornalismo'];
  if (item <= 111) return ['Conhecimentos Específicos - Jornalismo', 'Artigo jornalístico'];
  if (item <= 116) return ['Conhecimentos Específicos - Jornalismo', 'Gêneros jornalísticos'];
  return ['Conhecimentos Específicos - Jornalismo', 'Webjornalismo'];
};

const at = (pattern, from = 0) => {
  const found = raw.indexOf(pattern, from);
  if (found < 0) throw new Error(`Trecho não encontrado: ${pattern}`);
  return found;
};
const passage = (title, start, end, source) => ({ title, content: raw.slice(at(start) + start.length, at(end, at(start))).replace(/\s+/g, ' ').trim(), source });
const passages = {
  portuguese: passage('Texto CG1A1', 'Texto CG1A1', 'Em relação às ideias do texto CG1A1', 'George Orwell. O caminho para Wigan Pier. São Paulo: Companhia das Letras, 2010 (com adaptações).'),
  english: passage('Texto CG1A2', 'For the first time, 2025', 'Regarding the text, judge the following items.', 'thequantuminsider.com (adapted).'),
  news: passage('Texto CE4A1', 'Em 1967, eu era repórter iniciante', 'Considerando o texto apresentado, julgue os seguintes itens,', 'Luiz Gonzaga Motta. Jornal do Brasil, 19/3/1967 (com adaptações).'),
  article: passage('Texto CE4A2', 'Desde a Conferência do Clima de 1972', 'A partir do texto apresentado, julgue os itens que se seguem.', 'Joaquim Leite. O Globo, 3/1/2025 (com adaptações).'),
};

const itemText = (number) => {
  const marker = new RegExp(`(?:^|\\n)${number}\\s+`);
  const start = raw.search(marker);
  if (start < 0) throw new Error(`Item ${number} não encontrado.`);
  const after = start + raw.slice(start).match(marker)[0].length;
  const next = number === 120 ? raw.length : raw.slice(after).search(new RegExp(`(?:^|\\n)${number + 1}\\s+`));
  let value = raw.slice(after, next < 0 ? raw.length : after + next);
  if (number === 120) value = value.split('Espaço livre')[0];
  if (number === 10) value = value.split('For the first time, 2025')[0];
  if (number === 97) value = value.split('Em 1967, eu era repórter iniciante')[0];
  if (number === 107) value = value.split('Desde a Conferência do Clima de 1972')[0];
  value = value.replace(/\n(?:Julgue|A respeito|No que|De acordo|Em relação|Acerca|Considerando|Com base|A partir)\b[\s\S]*$/, '');
  return value.replace(/\s+/g, ' ').trim();
};

const normalizeQuestionKey = (value) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .trim()
  .toLowerCase();

const dedupeQuestions = (items) => {
  const seen = new Set();
  const unique = [];
  for (const question of items) {
    const key = [question.text, question.correct, question.reference]
      .map(normalizeQuestionKey)
      .join('::');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(question);
  }
  return unique;
};

const questions = dedupeQuestions(Array.from({ length: 120 }, (_, index) => {
  const item = index + 1;
  const [category, topic] = categoryFor(item);
  const answer = answers[index] === 'X' ? 'Anulada' : answers[index] === 'C' ? 'Certo' : 'Errado';
  const question = {
    courseId: 'jornalismo', category, topic, board: 'CEBRASPE', type: 'TRUE_FALSE',
    text: itemText(item), correct: answer,
    explanation: explanations[index],
    reference: `CEBRASPE — ANM — Edital 2024 — Item ${item}`,
    status: answer === 'Anulada' ? 'ANNULLED' : 'ACTIVE',
  };
  if (item <= 10) Object.assign(question, { passageTitle: passages.portuguese.title, passageContent: passages.portuguese.content, passageSource: passages.portuguese.source });
  else if (item <= 15) Object.assign(question, { passageTitle: passages.english.title, passageContent: passages.english.content, passageSource: passages.english.source });
  else if (item >= 98 && item <= 102) Object.assign(question, { passageTitle: passages.news.title, passageContent: passages.news.content, passageSource: passages.news.source });
  else if (item >= 108 && item <= 111) Object.assign(question, { passageTitle: passages.article.title, passageContent: passages.article.content, passageSource: passages.article.source });
  return question;
}));

mkdirSync(resolve(outputPath, '..'), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(questions, null, 2)}\n`);
console.log(`Geradas ${questions.length} questões de ${basename(pdfPath)} em ${outputPath}.`);

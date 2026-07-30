import { Question } from './types';

const BOARD_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:CEBRASPE|CESPE)\b/i, 'CEBRASPE'],
  [/\bFGV\b/i, 'FGV'],
  [/\bFCC\b/i, 'FCC'],
  [/\bVUNESP\b/i, 'VUNESP'],
  [/\b(?:INSTITUTO\s+)?AOCP\b/i, 'INSTITUTO AOCP'],
  [/\bIBFC\b/i, 'IBFC'],
  [/\bIDECAN\b/i, 'IDECAN'],
  [/\bQUADRIX\b/i, 'QUADRIX'],
];

export const normalizeExamBoard = (value: unknown) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const match = BOARD_PATTERNS.find(([pattern]) => pattern.test(normalized));
  return match?.[1] || normalized.toLocaleUpperCase('pt-BR');
};

export const questionExamBoard = (question: Question) => {
  const explicit = normalizeExamBoard(question.board);
  if (explicit) return explicit;
  const searchable = [question.reference, question.id].filter(Boolean).join(' ');
  const match = BOARD_PATTERNS.find(([pattern]) => pattern.test(searchable));
  // The legacy question catalog was authored for CEBRASPE and often omitted the board field.
  return match?.[1] || 'CEBRASPE';
};

export const filterQuestionsByBoards = (questions: Question[], boards: string[]) => {
  const allowed = new Set(boards.map(normalizeExamBoard).filter(Boolean));
  if (allowed.size === 0) return questions;
  return questions.filter(question => allowed.has(questionExamBoard(question)));
};

export const questionBoardsFromConfig = (config: Record<string, unknown> | null | undefined) => {
  if (!config) return [];
  const complementary = Array.isArray(config.complementaryBoards)
    ? config.complementaryBoards.map(String)
    : [];
  return Array.from(new Set(
    [String(config.examBoard || ''), ...complementary]
      .map(normalizeExamBoard)
      .filter(Boolean)
  ));
};

export interface StudyCard {
  id: string;
  title: string;
  paretoRatio: string; // e.g. "Alta Relevância (80/20)"
  isQuente: boolean;
  content: string; // Markdown or rich HTML-friendly text
  keyTakeaways: string[];
  materials?: string[];
  tools?: string[];
}

export interface StudySection {
  id: string;
  title: string;
  icon: string;
  color: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  weight: string; // Percentage of questions in exam
  paretoJustification: string;
  cards: StudyCard[];
}

export type QuestionCategory =
  | 'Português'
  | 'Língua Inglesa'
  | 'TI Básica'
  | 'Ética e Compliance'
  | 'Conhecimentos de Alagoas'
  | 'Conhecimentos Específicos'
  | 'Conhecimentos Específicos - Jornalismo'
  | 'Conhecimentos Específicos - Técnico em Enfermagem';

export type QuestionChoice = 'A' | 'B' | 'C' | 'D' | 'E';
export type QuestionAnswer = 'Certo' | 'Errado' | QuestionChoice;

export interface Question {
  id: number | string;
  category: QuestionCategory | string;
  board?: string;
  topic?: string;
  text: string;
  options?: { label: QuestionChoice; text: string }[];
  correct: QuestionAnswer | 'Anulada';
  explanation: string;
  reference?: string; // e.g., "CEBRASPE - TRT 8 - 2022"
  passageId?: string; // e.g., "capitalismo-vigilancia"
  passageTitle?: string;
  passageContent?: string;
}

export interface QuizState {
  answers: { [key: string]: QuestionAnswer };
  submitted: { [key: string]: boolean };
  scoreMode: 'tradicional' | 'simples'; // tradicional = Cebraspe (-1 for wrong), simples = +1 for right
}

export interface StudyBlock {
  id: string;
  day?: string;
  date?: string;
  title: string;
  duration: string; // e.g., "2h"
  methodology: string; // e.g., "30% Teoria, 50% Exercícios, 20% Revisão"
  subtopics: string[];
  done: boolean;
}

export interface ScheduleWeek {
  id: string;
  title: string;
  dateRange: string;
  focus: string;
  blocks: StudyBlock[];
}

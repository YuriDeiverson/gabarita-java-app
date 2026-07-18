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
  | 'Conhecimentos Específicos - Jornalismo';

export interface Question {
  id: number | string;
  category: QuestionCategory | string;
  topic?: string;
  text: string;
  correct: 'Certo' | 'Errado' | 'Anulada';
  explanation: string;
  reference?: string; // e.g., "CEBRASPE - TRT 8 - 2022"
  passageId?: string; // e.g., "capitalismo-vigilancia"
  passageTitle?: string;
  passageContent?: string;
}

export interface QuizState {
  answers: { [key: string]: 'Certo' | 'Errado' };
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

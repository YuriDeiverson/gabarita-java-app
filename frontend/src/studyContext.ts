import { Question } from './types';

export interface ActiveStudyContext {
  roadmapTopicId?: string;
  topicTitle: string;
  subjectName: string;
  source?: 'session' | 'recommendation' | 'daily-plan' | 'schedule';
}

export const normalizeStudyText = (value?: string) => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .trim()
  .toLowerCase();

// A numeração pertence à estrutura de cada edital, não à identidade do
// assunto compartilhado ("1. Interpretação" e "Interpretação" são o mesmo
// conteúdo; "Princípios" continua sendo separado pela disciplina).
export const normalizeStudySubjectTitle = (value?: string) =>
  normalizeStudyText(value).replace(/^\d+(?:\s+\d+)*\s+/, '');

const STOP_WORDS = new Set(['de','da','do','das','dos','e','em','para','a','o','lei','n','no','na']);
const tokens = (value?: string) => normalizeStudyText(value).split(' ').filter(token => token.length > 1 && !STOP_WORDS.has(token));

export const questionRelevance = (question: Question, context?: ActiveStudyContext | null) => {
  if (!context) return 0;
  const title = normalizeStudyText(context.topicTitle);
  const subject = normalizeStudyText(context.subjectName);
  const topic = normalizeStudyText(question.topic || '');
  const category = normalizeStudyText(question.category || '');
  const searchable = normalizeStudyText([question.topic, question.category, question.reference, question.text].filter(Boolean).join(' '));
  if (topic && (topic.includes(title) || title.includes(topic))) return 120;
  if (title && searchable.includes(title)) return 110;
  const titleTokens = tokens(context.topicTitle);
  const matched = titleTokens.filter(token => searchable.includes(token)).length;
  const required = Math.max(2, Math.ceil(titleTokens.length * .3));
  if (matched >= required) return 60 + matched;
  if (subject && (category.includes(subject) || subject.includes(category))) return 20;
  const subjectMatched = tokens(context.subjectName).filter(token => searchable.includes(token)).length;
  return subjectMatched >= 2 ? 10 + subjectMatched : 0;
};

export const findContextCard = <T extends {id:string;title:string;cards:Array<{id:string;title:string}>}>(
  sections:T[],context?:ActiveStudyContext|null
):{section:T;card:T['cards'][number]}|null => {
  if(!context)return null;
  const wanted=normalizeStudyText(context.topicTitle);
  for(const section of sections){
    const exact=section.cards.find(card=>normalizeStudyText(card.title)===wanted);
    if(exact)return {section,card:exact};
  }
  for(const section of sections){
    const close=section.cards.find(card=>normalizeStudyText(card.title).includes(wanted)||wanted.includes(normalizeStudyText(card.title)));
    if(close)return {section,card:close};
  }
  return null;
};

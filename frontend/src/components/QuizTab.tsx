import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QuestionAnswer, Question } from '../types';
import {
  DetailedQuestionGuide,
  QuestionNote,
  QuestionTaxonomyDiscipline,
  questionsApi,
  quizProgressApi,
} from '../services/api';
import {
  CheckCircle2,
  XCircle,
  Filter,
  Info,
  Bookmark,
  Flag,
  Target,
  ChevronDown,
  LoaderCircle,
  NotebookPen,
  Save,
  Trash2,
  X,
  BookOpenText,
} from 'lucide-react';
import { ActiveStudyContext, normalizeStudySubjectTitle, normalizeStudyText, questionRelevance } from '../studyContext';
import { filterQuestionsByBoards, questionBoardsFromConfig, questionExamBoard } from '../questionBanks';
import { readQuestionCache, writeQuestionCache } from '../questionCache';
import { secureError, secureWarn } from '../security/secureLogger';

interface QuizTabProps {
  mode?: 'session' | 'all';
  studyContext?: ActiveStudyContext | null;
  onQuestionAnswered?: (question: Question, correct: boolean) => void | Promise<void>;
  onReviewComplete?: (result: GuidedReviewResult) => void;
  initialQuestionId?: string;
}

export interface GuidedReviewResult {
  topicTitle: string;
  subjectName: string;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

type FilterOption = { value: string; label?: string; count?: number };
type MultiFilterProps = {
  id: string;
  label: string;
  options: Array<string | FilterOption>;
  selected: string[];
  onChange: (values: string[]) => void;
  openFilterId: string | null;
  onOpenFilterChange: (id: string | null) => void;
  emptyLabel?: string;
};
const MultiFilter = ({
  id,
  label,
  options,
  selected,
  onChange,
  openFilterId,
  onOpenFilterChange,
  emptyLabel = 'Todas',
}: MultiFilterProps) => {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  const open = openFilterId === id;
  return (
    <details
      open={open}
      className="relative min-w-40 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700"
    >
      <summary
        onClick={event => {
          event.preventDefault();
          const filter = event.currentTarget.closest('details');
          onOpenFilterChange(open ? null : id);
          if (!open)
            window.requestAnimationFrame(() => filter?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
        }}
        className="cursor-pointer list-none px-3 py-2 font-bold marker:content-none"
      >
        {label}
        <span className="ml-1 font-normal text-slate-400">
          {selected.length ? `(${selected.length})` : `(${emptyLabel})`}
        </span>
      </summary>
      <div className="absolute z-30 mt-1 max-h-64 min-w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-slate-400">Sem opções disponíveis</p>
        ) : (
          options.map(item => {
            const option = typeof item === 'string' ? { value: item, label: item } : item;
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-start justify-between gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="mt-0.5"
                  />
                  <span>{option.label || option.value}</span>
                </span>
                {option.count != null && (
                  <small className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-400">{option.count}</small>
                )}
              </label>
            );
          })
        )}
      </div>
    </details>
  );
};

const belongsToExactTopic = (question: Question, context: ActiveStudyContext) => {
  const searchable = normalizeStudyText([question.topic, question.reference, question.text].filter(Boolean).join(' '));
  const topic = normalizeStudyText(context.topicTitle);
  if (question.topic && normalizeStudyText(question.topic) === topic) return true;
  const legalAnchors: string[] = (context.topicTitle.match(/\d+/g) ?? ([] as string[])).filter(
    value => value.length >= 2
  );
  if (legalAnchors.length > 0) return legalAnchors.every(anchor => searchable.split(' ').includes(anchor));
  return questionRelevance(question, context) >= 60;
};

const guidedReviewQuestionIds = () => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem('guided_review_question_ids') || '[]'));
  } catch {
    return new Set<string>();
  }
};

interface GuidedReviewDraft {
  answers: Record<string, QuestionAnswer>;
  questionIds: string[];
  reviewGoal: number;
  visibleQuestions: number;
  updatedAt: string;
}

const guidedReviewDraftKey = (context: ActiveStudyContext) => {
  let planId = 'local';
  try {
    planId = String(JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || 'local');
  } catch {}
  const course = localStorage.getItem('active_course') || 'default';
  const topic = String(context.roadmapTopicId || normalizeStudyText(context.topicTitle)).replace(
    /[^a-zA-Z0-9_-]/g,
    '-'
  );
  return `guided_review_draft:${course}:${planId}:${topic}`;
};

const readGuidedReviewDraft = (key: string | null): GuidedReviewDraft | null => {
  if (!key) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null') as Partial<GuidedReviewDraft> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const validAnswers: QuestionAnswer[] = ['Certo', 'Errado', 'A', 'B', 'C', 'D', 'E'];
    const answers = Object.fromEntries(
      Object.entries(parsed.answers || {}).filter(([, answer]) => validAnswers.includes(answer as QuestionAnswer))
    ) as GuidedReviewDraft['answers'];
    return {
      answers,
      questionIds: Array.isArray(parsed.questionIds) ? parsed.questionIds.map(String) : [],
      reviewGoal: [10, 15, 20].includes(Number(parsed.reviewGoal)) ? Number(parsed.reviewGoal) : 10,
      visibleQuestions: Math.max(10, Number(parsed.visibleQuestions || 20)),
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
};

const writeGuidedReviewDraft = (key: string | null, draft: Omit<GuidedReviewDraft, 'updatedAt'>) => {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  } catch (error) {
    secureWarn('quiz.review-draft.save', error);
  }
};

const topicKey = (value: string) => normalizeStudySubjectTitle(value);

const questionMatchesTopic = (question: Question, selectedTopic: string) => {
  const selected = topicKey(selectedTopic);
  const questionTopic = topicKey(question.topic || '');
  return Boolean(
    selected &&
    questionTopic &&
    (questionTopic === selected || questionTopic.includes(selected) || selected.includes(questionTopic))
  );
};

const specificDisciplineSuffix = (category: string) =>
  String(category || '')
    .replace(/^conhecimentos\s+espec[ií]ficos\s*(?:[-–—:]\s*)?/i, '')
    .trim();
const categoryGroup = (category: string) => {
  const normalized = normalizeStudyText(category);
  if (normalized.startsWith('conhecimentos especificos')) return 'Conhecimentos Específicos';
  if (
    [
      'portugues',
      'lingua portuguesa',
      'lingua inglesa',
      'ti basica',
      'etica e compliance',
      'conhecimentos de alagoas',
      'conhecimentos gerais',
    ].includes(normalized) ||
    normalized.startsWith('conhecimentos gerais')
  )
    return 'Conhecimentos Gerais';
  return 'Outras disciplinas';
};
const categoryLabel = (category: string) => {
  if (categoryGroup(category) !== 'Conhecimentos Específicos') return category;
  const suffix = specificDisciplineSuffix(category);
  return suffix ? `Específicos · ${suffix}` : 'Específicos · Geral';
};
const questionCategoryGroup = (question: Question) => {
  const area = String(question.area || '').trim();
  if (area) return area;
  return categoryGroup(String(question.category));
};

const presentQuestionText = (value: string) => {
  let text = String(value || '').trim();
  // Referência de prova pertence ao cabeçalho do cartão, não ao enunciado.
  text = text.replace(/^\[[^\]]*(?:item|quest[aã]o|19\d{2}|20\d{2})[^\]]*\]\s*/i, '');
  text = text.replace(/[ \t]+([,.;:!?])/g, '$1').replace(/[ \t]{2,}/g, ' ');
  if (text && !/[.!?…:;](?:["'”’`)}\]])*$/u.test(text)) text += text.endsWith('—') ? '' : '.';
  return text;
};

const normalizedFeedbackText = (value: unknown) =>
  String(value ?? '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const addsFeedbackInformation = (candidate: string, previous: string[]) => {
  const normalized = normalizedFeedbackText(candidate);
  if (!normalized) return false;
  return !previous.some(value => {
    const known = normalizedFeedbackText(value);
    return known === normalized || (normalized.length > 50 && known.includes(normalized));
  });
};

const startsWithFeedbackText = (value: string, prefixes: string[]) => {
  const normalized = normalizedFeedbackText(value);
  return prefixes.some(prefix => normalized.startsWith(normalizedFeedbackText(prefix)));
};

const usesAutomaticFeedbackTemplate = (value: string) => {
  const normalized = normalizedFeedbackText(value);
  return [
    'a proposicao examinada e',
    'a proposicao anulada e',
    'essa formulacao atribui ao assunto o mesmo funcionamento',
    'essa formulacao entra em conflito com a definicao',
  ].some(marker => normalized.includes(marker));
};

const repeatsWholeQuestion = (questionText: string, candidate: string) => {
  const statement = normalizedFeedbackText(presentQuestionText(questionText));
  return statement.length >= 80 && normalizedFeedbackText(candidate).includes(statement);
};

const questionGuideCache = new Map<string, DetailedQuestionGuide>();
const questionGuideRequests = new Map<string, Promise<DetailedQuestionGuide>>();

const loadQuestionGuide = (questionId: string) => {
  const cached = questionGuideCache.get(questionId);
  if (cached) return Promise.resolve(cached);
  const pending = questionGuideRequests.get(questionId);
  if (pending) return pending;
  const request = questionsApi
    .guide(questionId)
    .then(guide => {
      questionGuideCache.set(questionId, guide);
      questionGuideRequests.delete(questionId);
      return guide;
    })
    .catch(error => {
      questionGuideRequests.delete(questionId);
      throw error;
    });
  questionGuideRequests.set(questionId, request);
  return request;
};

const DetailedFeedbackModal = ({ question, onClose }: { question: Question; onClose: () => void }) => {
  const questionId = String(question.id);
  const [guide, setGuide] = useState<DetailedQuestionGuide | undefined>(() => questionGuideCache.get(questionId));
  const [guideLoading, setGuideLoading] = useState(!guide);
  useEffect(() => {
    let cancelled = false;
    setGuideLoading(true);
    void loadQuestionGuide(questionId)
      .then(value => {
        if (!cancelled) setGuide(value);
      })
      .catch(error => secureWarn('quiz.guide.load', error))
      .finally(() => {
        if (!cancelled) setGuideLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [questionId]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const topic = String(guide?.detailedTopic || question.detailedTopic || question.topic || question.category).trim();
  const concept = String(guide?.conceptExplanation || question.conceptExplanation || '').trim();
  const rawEvidence = String(guide?.decisiveEvidence || question.decisiveEvidence || '')
    .replace(/^Critério técnico que decide o item:\s*/i, '')
    .trim();
  const evidence =
    normalizedFeedbackText(rawEvidence) ===
    normalizedFeedbackText(
      String(question.explanation || '').replace(/^(item\s+)?(certo|errado|correto|incorreto)[.:]?\s*/i, '')
    )
      ? ''
      : rawEvidence;
  const rawAnalysis = String(guide?.answerAnalysis || question.answerAnalysis || '').trim();
  const automaticGuide = usesAutomaticFeedbackTemplate(rawAnalysis);
  const analysis = automaticGuide || repeatsWholeQuestion(question.text, rawAnalysis) ? '' : rawAnalysis;
  const examTrap = String(guide?.examTrap || question.examTrap || '').trim();
  const similarQuestionStrategy = String(
    guide?.similarQuestionStrategy || question.similarQuestionStrategy || ''
  ).trim();
  const suppliedComparisonHeaders = guide?.comparisonHeaders || question.comparisonHeaders;
  const comparisonHeaders = {
    criterion: String(suppliedComparisonHeaders?.criterion || 'Ponto analisado'),
    left: String(suppliedComparisonHeaders?.left || 'Explicação ou evidência'),
    right: String(suppliedComparisonHeaders?.right || 'Conclusão'),
  };
  const comparisonRows = guide?.comparisonRows || question.comparisonRows || [];
  const generatedTable = ['etapa da analise', 'elemento da questao'].includes(
    normalizedFeedbackText(comparisonHeaders.criterion)
  );
  const generatedAnalysis = startsWithFeedbackText(analysis, ['1. Delimite a afirmação examinada', '1. O item afirma']);
  const completeConcept = !automaticGuide && addsFeedbackInformation(concept, [question.explanation]) ? concept : '';
  const completeEvidence =
    !automaticGuide &&
    !repeatsWholeQuestion(question.text, evidence) &&
    addsFeedbackInformation(evidence, [question.explanation, completeConcept])
      ? evidence
      : '';
  const completeAnalysis =
    !generatedAnalysis && addsFeedbackInformation(analysis, [question.explanation, completeConcept, completeEvidence])
      ? analysis
      : '';
  const learnedContent = [completeConcept, completeEvidence, completeAnalysis].filter(Boolean);
  const examInsight = !automaticGuide && addsFeedbackInformation(examTrap, learnedContent) ? examTrap : '';
  const strategyInsight =
    !automaticGuide && addsFeedbackInformation(similarQuestionStrategy, [...learnedContent, examInsight])
      ? similarQuestionStrategy
      : '';
  const keyPointCandidates = [...(guide?.fixationTips || []), ...(question.fixationTips || [])]
    .map(String)
    .map(point => point.trim())
    .filter(point => point && addsFeedbackInformation(point, [...learnedContent, examInsight, strategyInsight]));
  const keyPoints = automaticGuide ? [] : Array.from(new Set(keyPointCandidates)).slice(0, 4);
  const answerTone =
    question.correct === 'Certo' ? 'is-certo' : question.correct === 'Errado' ? 'is-errado' : 'is-annulled';
  const usefulComparisonRows = generatedTable || automaticGuide ? [] : comparisonRows;
  const answerDisplay = question.options?.length
    ? `Alternativa correta: ${question.correct}`
    : question.correct === 'Certo'
      ? 'Certo ✅'
      : question.correct === 'Errado'
        ? 'Errado ❌'
        : 'Anulada';
  return (
    <div
      className="detailed-feedback-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="detailed-feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`detailed-feedback-title-${question.id}`}
      >
        <header className="detailed-feedback-header">
          <div>
            <span>Correção completa</span>
            <h2 id={`detailed-feedback-title-${question.id}`}>Entenda e não erre novamente</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar correção completa">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="detailed-feedback-content">
          <section className={`detailed-feedback-answer ${answerTone}`}>
            <span>1. Gabarito</span>
            <strong>{answerDisplay}</strong>
          </section>
          <section className="detailed-feedback-section">
            <span className="detailed-feedback-number">2</span>
            <div>
              <small>Assunto cobrado</small>
              <h3>{topic}</h3>
            </div>
          </section>
          {completeConcept && (
            <section className="detailed-feedback-section">
              <span className="detailed-feedback-number">3</span>
              <div className="detailed-feedback-body">
                <small>O que você precisa dominar</small>
                <h3>Base conceitual</h3>
                {completeConcept.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}
          <section className="detailed-feedback-section">
            <span className="detailed-feedback-number">4</span>
            <div className="detailed-feedback-body">
              <small>Como pensar, passo a passo</small>
              <h3>Leitura técnica e resolução comentada</h3>
              {guideLoading && learnedContent.length === 0 && (
                <div className="question-subject-loading">
                  <LoaderCircle aria-hidden="true" /> Carregando a aula da questão…
                </div>
              )}
              {completeEvidence && (
                <blockquote className="detailed-feedback-evidence">
                  <strong>Ponto decisivo</strong>
                  <p>{completeEvidence}</p>
                </blockquote>
              )}
              {completeAnalysis && (
                <div className="detailed-feedback-reasoning">
                  <strong>Desenvolvimento da solução</strong>
                  {completeAnalysis.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
              {usefulComparisonRows.length > 0 && (
                <div className="detailed-feedback-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{comparisonHeaders.criterion}</th>
                        <th>{comparisonHeaders.left}</th>
                        <th>{comparisonHeaders.right}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usefulComparisonRows.map((row, index) => (
                        <tr key={`${row.criterion}-${index}`}>
                          <th>{row.criterion}</th>
                          <td>{row.left}</td>
                          <td>{row.right}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
          {examInsight && (
            <section className="detailed-feedback-section">
              <span className="detailed-feedback-number">5</span>
              <div className="detailed-feedback-body">
                <small>Diagnóstico do erro</small>
                <h3>Por que essa questão engana?</h3>
                <aside className="detailed-feedback-trap">
                  <p>{examInsight}</p>
                </aside>
              </div>
            </section>
          )}
          {strategyInsight && (
            <section className="detailed-feedback-section">
              <span className="detailed-feedback-number">6</span>
              <div className="detailed-feedback-body">
                <small>Transferência do aprendizado</small>
                <h3>Como resolver questões parecidas</h3>
                <p>{strategyInsight}</p>
              </div>
            </section>
          )}
          {keyPoints.length > 0 && (
            <section className="detailed-feedback-section detailed-feedback-fixation">
              <span className="detailed-feedback-number">7</span>
              <div className="detailed-feedback-body">
                <small>Revisão ativa</small>
                <h3>O que precisa ficar na memória</h3>
                {keyPoints.length > 0 && (
                  <ul>
                    {keyPoints.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            Entendi a questão
          </button>
        </footer>
      </article>
    </div>
  );
};

const passageReadingTime = (content: string) =>
  Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 210));

export default function QuizTab({
  mode = 'session',
  studyContext,
  onQuestionAnswered,
  onReviewComplete,
  initialQuestionId,
}: QuizTabProps) {
  const reviewDraftKey = useMemo(
    () => (mode === 'session' && studyContext ? guidedReviewDraftKey(studyContext) : null),
    [mode, studyContext?.roadmapTopicId, studyContext?.topicTitle]
  );
  const initialReviewDraft = useMemo(() => readGuidedReviewDraft(reviewDraftKey), [reviewDraftKey]);
  const selectedQuestionBoards = useMemo(() => {
    const course = localStorage.getItem('active_course') || 'seplag_informatica';
    for (const key of [`${course}_study_config`, 'study_config']) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        const boards = questionBoardsFromConfig(parsed);
        if (boards.length > 0) return boards;
      } catch {}
    }
    return [];
  }, []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsError, setQuestionsError] = useState('');
  const [detailedFeedback, setDetailedFeedback] = useState<{ question: Question; userAnswer?: QuestionAnswer } | null>(
    null
  );

  const [answers, setAnswers] = useState<{ [key: string]: QuestionAnswer }>(() => {
    const saved = localStorage.getItem('quiz_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [categoryGroupFilters, setCategoryGroupFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [topicFilters, setTopicFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [boardFilters, setBoardFilters] = useState<string[]>([]);
  const [yearFilters, setYearFilters] = useState<string[]>([]);
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [educationFilters, setEducationFilters] = useState<string[]>([]);
  const [formationFilters, setFormationFilters] = useState<string[]>([]);
  const [activityAreaFilters, setActivityAreaFilters] = useState<string[]>([]);
  const [modalityFilters, setModalityFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [excludeAnnulled, setExcludeAnnulled] = useState(false);
  const [excludeOutdated, setExcludeOutdated] = useState(false);
  const [excludeInedit, setExcludeInedit] = useState(false);
  const [questionTaxonomy, setQuestionTaxonomy] = useState<QuestionTaxonomyDiscipline[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [visibleQuestions, setVisibleQuestions] = useState(() => initialReviewDraft?.visibleQuestions || 10);
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('quiz_favorite_questions') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [questionNotes, setQuestionNotes] = useState<QuestionNote[]>([]);
  const [noteDraft, setNoteDraft] = useState<{ question: Question; note: string } | null>(null);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [cycleAnswers, setCycleAnswers] = useState<{ [key: string]: QuestionAnswer }>(
    () => initialReviewDraft?.answers || {}
  );
  const [draftQuestionIds, setDraftQuestionIds] = useState<string[]>(() => initialReviewDraft?.questionIds || []);
  const [usedBeforeCycle, setUsedBeforeCycle] = useState<Set<string>>(() => {
    const reviewed = guidedReviewQuestionIds();
    initialReviewDraft?.questionIds.forEach(id => reviewed.delete(id));
    return reviewed;
  });

  useEffect(() => {
    if (!openFilterId) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!filterPanelRef.current?.contains(event.target as Node)) setOpenFilterId(null);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [openFilterId]);

  const [reviewGoal, setReviewGoal] = useState(() => initialReviewDraft?.reviewGoal || 10);
  const activeAnswers = mode === 'session' ? cycleAnswers : answers;
  const [reportedQuestions, setReportedQuestions] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('quiz_reported_questions') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [reportDraft, setReportDraft] = useState<{ question: Question; reason: string; details: string } | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const openedQuestionRef = useRef('');

  const currentCourseId = localStorage.getItem('active_course') || '';

  useEffect(() => {
    questionsApi
      .notes()
      .then(items => {
        setQuestionNotes(items);
        setFavoriteQuestions(current => {
          const next = new Set(current);
          items.filter(item => item.course_id === currentCourseId).forEach(item => next.add(String(item.question_id)));
          localStorage.setItem('quiz_favorite_questions', JSON.stringify([...next]));
          return next;
        });
      })
      .catch(error => secureWarn('quiz.notes.load', error));
  }, [currentCourseId]);

  useEffect(() => {
    if (!noteDraft) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [noteDraft]);

  useEffect(() => {
    if (!detailedFeedback) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailedFeedback]);

  useEffect(() => {
    const courseId = localStorage.getItem('active_course');
    if (mode === 'session' && !courseId) {
      setQuestionsError('Nenhum curso ativo foi selecionado.');
      return;
    }
    let cancelled = false;
    // v5 invalida classificações anteriores à separação de História.
    const cacheKey = mode === 'all' ? 'questions:v5:all' : `questions:v5:course:${courseId}`;
    setQuestionsError('');
    const cachedRequest = readQuestionCache(cacheKey);
    void cachedRequest.then(cachedQuestions => {
      if (cancelled || cachedQuestions.length === 0) return;
      const visible =
        mode === 'all' ? cachedQuestions : filterQuestionsByBoards(cachedQuestions, selectedQuestionBoards);
      setQuestions(current => (current.length > 0 ? current : visible));
    });
    const request = mode === 'all' ? questionsApi.all() : questionsApi.forCourse(courseId!);
    request
      .then(remoteQuestions => {
        if (cancelled) return;
        const visible =
          mode === 'all' ? remoteQuestions : filterQuestionsByBoards(remoteQuestions, selectedQuestionBoards);
        setQuestions(visible);
        setQuestionsError(
          visible.length
            ? ''
            : mode === 'all'
              ? 'Ainda não há questões cadastradas.'
              : 'Ainda não há questões cadastradas para este curso.'
        );
        void writeQuestionCache(cacheKey, remoteQuestions);
      })
      .catch(async cause => {
        const cachedQuestions = await cachedRequest;
        if (cancelled) return;
        // Em retomadas no celular, mantenha a cópia local utilizável se a
        // atualização remota estiver temporariamente indisponível.
        if (cachedQuestions.length > 0) {
          const visible =
            mode === 'all' ? cachedQuestions : filterQuestionsByBoards(cachedQuestions, selectedQuestionBoards);
          setQuestions(current => (current.length > 0 ? current : visible));
          setQuestionsError('');
          return;
        }
        setQuestionsError(
          cause instanceof Error ? cause.message : 'Erro ao carregar as questões. Tente novamente mais tarde.'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [mode, selectedQuestionBoards, currentCourseId]);

  useEffect(() => {
    let cancelled = false;
    questionsApi
      .taxonomy(mode === 'session' ? currentCourseId : '')
      .then(taxonomy => {
        if (!cancelled) setQuestionTaxonomy(taxonomy);
      })
      .catch(error => secureWarn('quiz.taxonomy.load', error));
    return () => {
      cancelled = true;
    };
  }, [currentCourseId, mode]);

  useEffect(() => {
    if (mode !== 'session') return;
    const draft = readGuidedReviewDraft(reviewDraftKey);
    const reviewed = guidedReviewQuestionIds();
    draft?.questionIds.forEach(id => reviewed.delete(id));
    setCycleAnswers(draft?.answers || {});
    setDraftQuestionIds(draft?.questionIds || []);
    setUsedBeforeCycle(reviewed);
    setReviewGoal(draft?.reviewGoal || 10);
    setStatusFilters([]);
    setVisibleQuestions(draft?.visibleQuestions || 20);
  }, [mode, reviewDraftKey]);

  // Sync answers with localStorage
  useEffect(() => {
    localStorage.setItem('quiz_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const config = localStorage.getItem('study_config');
    if (!config) return;
    try {
      const { studyPlanId } = JSON.parse(config);
      if (!studyPlanId || String(studyPlanId).startsWith('local-')) return;
      quizProgressApi
        .getByStudyPlan(studyPlanId)
        .then(progress => {
          const remoteAnswers: { [key: string]: QuestionAnswer } = {};
          progress.forEach(item => {
            const questionId = String(item.question_id);
            if (['Certo', 'Errado', 'A', 'B', 'C', 'D', 'E'].includes(item.answer)) {
              remoteAnswers[questionId] = item.answer as QuestionAnswer;
            }
          });
          setAnswers(current => ({ ...current, ...remoteAnswers }));
        })
        .catch(error => secureWarn('quiz.remote-answers.load', error));
    } catch (error) {
      secureWarn('quiz.local-config.parse', error);
    }
  }, []);

  useEffect(() => {
    if (mode === 'all') setVisibleQuestions(10);
  }, [
    categoryGroupFilters,
    categoryFilters,
    topicFilters,
    statusFilters,
    boardFilters,
    yearFilters,
    roleFilters,
    educationFilters,
    formationFilters,
    activityAreaFilters,
    modalityFilters,
    difficultyFilters,
    excludeAnnulled,
    excludeOutdated,
    excludeInedit,
    mode,
  ]);

  const noteForQuestion = (questionId: number | string) =>
    questionNotes.find(item => item.course_id === currentCourseId && String(item.question_id) === String(questionId));

  const openNoteEditor = (question: Question) => {
    const existing = noteForQuestion(question.id);
    setNoteError('');
    setNoteDraft({ question, note: existing?.note || '' });
  };

  const saveQuestionNote = async () => {
    if (!noteDraft || noteBusy) return;
    if (!noteDraft.note.trim()) {
      setNoteError('Escreva o que você identificou ou precisa estudar.');
      return;
    }
    setNoteBusy(true);
    setNoteError('');
    try {
      const saved = await questionsApi.saveNote({
        questionId: String(noteDraft.question.id),
        courseId: currentCourseId,
        text: noteDraft.question.text,
        category: String(noteDraft.question.category || ''),
        topic: noteDraft.question.topic,
        reference: noteDraft.question.reference,
        note: noteDraft.note.trim(),
      });
      setQuestionNotes(current => [
        saved,
        ...current.filter(
          item =>
            item.id !== saved.id &&
            !(item.course_id === saved.course_id && String(item.question_id) === String(saved.question_id))
        ),
      ]);
      setFavoriteQuestions(current => {
        const next = new Set(current);
        next.add(String(noteDraft.question.id));
        localStorage.setItem('quiz_favorite_questions', JSON.stringify([...next]));
        return next;
      });
      setNoteDraft(null);
    } catch (cause) {
      setNoteError(cause instanceof Error ? cause.message : 'Não foi possível salvar a anotação.');
    } finally {
      setNoteBusy(false);
    }
  };

  const removeQuestionNote = async () => {
    if (!noteDraft || noteBusy) return;
    const existing = noteForQuestion(noteDraft.question.id);
    if (!existing) {
      setNoteDraft(null);
      return;
    }
    setNoteBusy(true);
    setNoteError('');
    try {
      await questionsApi.deleteNote(String(noteDraft.question.id), currentCourseId);
      setQuestionNotes(current => current.filter(item => item.id !== existing.id));
      setFavoriteQuestions(current => {
        const next = new Set(current);
        next.delete(String(noteDraft.question.id));
        localStorage.setItem('quiz_favorite_questions', JSON.stringify([...next]));
        return next;
      });
      setNoteDraft(null);
    } catch (cause) {
      setNoteError(cause instanceof Error ? cause.message : 'Não foi possível remover a anotação.');
    } finally {
      setNoteBusy(false);
    }
  };

  const submitReport = async () => {
    if (!reportDraft || reportBusy) return;
    setReportBusy(true);
    setReportError('');
    try {
      await questionsApi.report({
        questionId: String(reportDraft.question.id),
        courseId: localStorage.getItem('active_course') || '',
        text: reportDraft.question.text,
        category: String(reportDraft.question.category || ''),
        reference: reportDraft.question.reference,
        reason: reportDraft.reason,
        details: reportDraft.details,
      });
      const id = String(reportDraft.question.id);
      setReportedQuestions(current => {
        const next = new Set(current);
        next.add(id);
        localStorage.setItem('quiz_reported_questions', JSON.stringify([...next]));
        return next;
      });
      setReportDraft(null);
    } catch (cause) {
      setReportError(cause instanceof Error ? cause.message : 'Não foi possível enviar a sinalização.');
    } finally {
      setReportBusy(false);
    }
  };

  const handleAnswer = async (questionId: number | string, option: QuestionAnswer) => {
    const question = questions.find(q => String(q.id) === String(questionId));
    if (!question) return;
    if (question.correct === 'Anulada') return;

    if (mode === 'session') {
      setCycleAnswers(prev => {
        const next = { ...prev, [String(questionId)]: option };
        writeGuidedReviewDraft(reviewDraftKey, {
          answers: next,
          questionIds: draftQuestionIds,
          reviewGoal,
          visibleQuestions,
        });
        return next;
      });
      const reviewed = guidedReviewQuestionIds();
      reviewed.add(String(questionId));
      localStorage.setItem('guided_review_question_ids', JSON.stringify([...reviewed]));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: option }));
    }
    void onQuestionAnswered?.(question, option === question.correct);

    if (mode === 'all')
      try {
        const savedHistory = JSON.parse(localStorage.getItem('quiz_answer_history') || '{}');
        savedHistory[String(questionId)] = { answer: option, answeredAt: new Date().toISOString() };
        localStorage.setItem('quiz_answer_history', JSON.stringify(savedHistory));
      } catch (error) {
        secureWarn('quiz.answer-history.save', error);
      }

    // Save to API if study plan ID exists
    const config = localStorage.getItem('study_config');
    if (mode === 'all' && config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.studyPlanId && !String(parsed.studyPlanId).startsWith('local-')) {
          const isCorrect = option === question.correct;
          await quizProgressApi.create({
            studyPlanId: parsed.studyPlanId,
            questionId,
            answer: option,
            isCorrect,
          });
        }
      } catch (error) {
        secureError('quiz.progress.save', error);
      }
    }
  };

  const questionPool = useMemo(() => {
    if (mode === 'all') return questions;
    if (!studyContext) return [];
    const precise = questions
      .filter(question => question.correct !== 'Anulada' && belongsToExactTopic(question, studyContext))
      .map(question => ({ question, score: questionRelevance(question, studyContext) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.question);
    const byId = new Map(precise.map(question => [String(question.id), question]));
    const restored = draftQuestionIds
      .map(id => byId.get(id))
      .filter((question): question is Question => Boolean(question));
    const restoredIds = new Set(restored.map(question => String(question.id)));
    const fresh = precise.filter(
      question => !restoredIds.has(String(question.id)) && !usedBeforeCycle.has(String(question.id))
    );
    return [...restored, ...fresh].slice(0, 20);
  }, [mode, questions, studyContext, usedBeforeCycle, draftQuestionIds, selectedQuestionBoards]);

  useEffect(() => {
    if (mode !== 'session' || !reviewDraftKey || draftQuestionIds.length > 0 || questionPool.length === 0) return;
    setDraftQuestionIds(questionPool.map(question => String(question.id)));
  }, [mode, reviewDraftKey, draftQuestionIds.length, questionPool]);

  useEffect(() => {
    if (mode !== 'session' || !reviewDraftKey) return;
    writeGuidedReviewDraft(reviewDraftKey, {
      answers: cycleAnswers,
      questionIds: draftQuestionIds,
      reviewGoal,
      visibleQuestions,
    });
  }, [mode, reviewDraftKey, cycleAnswers, draftQuestionIds, reviewGoal, visibleQuestions]);

  const scopedQuestions = useMemo(
    () => (mode === 'session' ? questionPool.slice(0, reviewGoal) : questionPool),
    [mode, questionPool, reviewGoal]
  );

  const availableCategories = useMemo(() => {
    if (categoryGroupFilters.length === 0) return scopedQuestions.map(question => String(question.category));
    return scopedQuestions
      .filter(question => categoryGroupFilters.includes(questionCategoryGroup(question)))
      .map(question => String(question.category));
  }, [categoryGroupFilters, scopedQuestions]);

  useEffect(() => {
    setCategoryFilters(current => current.filter(category => availableCategories.includes(category)));
  }, [availableCategories]);

  const availableTopics = useMemo(() => {
    if (categoryFilters.length === 0) return [];
    const fromTaxonomy = questionTaxonomy
      .filter(discipline => categoryFilters.includes(discipline.name))
      .flatMap(discipline => discipline.topics)
      .filter(topic => topic.count > 0)
      .map(topic => ({ value: topic.name, label: topic.name, count: topic.count }));
    if (fromTaxonomy.length > 0) return fromTaxonomy;
    const counts = new Map<string, number>();
    scopedQuestions
      .filter(question => categoryFilters.includes(String(question.category)) && question.topic)
      .forEach(question => counts.set(question.topic!, 1 + (counts.get(question.topic!) || 0)));
    return [...counts.entries()].map(([value, count]) => ({ value, label: value, count }));
  }, [categoryFilters, questionTaxonomy, scopedQuestions]);

  useEffect(() => {
    setTopicFilters(current =>
      current.filter(selected => availableTopics.some(topic => topicKey(topic.value) === topicKey(selected)))
    );
  }, [availableTopics]);

  const filterOptions = useMemo(() => {
    const strings = (values: (string | undefined)[]) =>
      Array.from(
        new Set(values.filter((value): value is string => Boolean(value && value.trim())).map(value => value.trim()))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const flatten = (values: (string[] | undefined)[]) => strings(values.flatMap(value => value || []));
    const countedOptions = (values: string[], label: (value: string) => string = value => value) => {
      const counts = new Map<string, number>();
      values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
      return [...counts.entries()]
        .sort(([left], [right]) => label(left).localeCompare(label(right), 'pt-BR'))
        .map(([value, count]) => ({ value, label: label(value), count }));
    };
    return {
      categoryGroups: countedOptions(
        scopedQuestions.map(question => questionCategoryGroup(question)),
        value => value
      ),
      categories: countedOptions(availableCategories, categoryLabel),
      boards: strings(scopedQuestions.map(question => questionExamBoard(question))),
      years: strings(scopedQuestions.map(question => (question.year ? String(question.year) : undefined))).sort(
        (a, b) => Number(b) - Number(a)
      ),
      roles: flatten(scopedQuestions.map(question => question.roles)),
      education: flatten(scopedQuestions.map(question => question.educationLevels)),
      formation: flatten(scopedQuestions.map(question => question.formationAreas)),
      activityAreas: flatten(scopedQuestions.map(question => question.activityAreas)),
    };
  }, [scopedQuestions, availableCategories]);

  // Calculate statistics
  const stats = useMemo(() => {
    const validQuestions = scopedQuestions.filter(q => q.correct !== 'Anulada');
    const total = validQuestions.length;
    const answeredCount = Object.keys(activeAnswers).filter(id => {
      const question = scopedQuestions.find(q => String(q.id) === id);
      return question && question.correct !== 'Anulada';
    }).length;
    let correctCount = 0;
    let incorrectCount = 0;
    let bankAwareScore = 0;

    validQuestions.forEach(q => {
      const userAnswer = activeAnswers[q.id];
      if (userAnswer) {
        if (userAnswer === q.correct) {
          correctCount++;
          bankAwareScore++;
        } else {
          incorrectCount++;
          if (questionExamBoard(q) === 'CEBRASPE') bankAwareScore--;
        }
      }
    });

    // CEBRASPE Score Formula: Correct - Incorrect (minimum 0)
    const cebraspeScore = Math.max(0, correctCount - incorrectCount);
    const simpleScore = correctCount;

    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const cebraspePercentage = total > 0 ? Math.round((cebraspeScore / total) * 100) : 0;

    return {
      total,
      answeredCount,
      correctCount,
      incorrectCount,
      bankAwareScore: Math.max(0, bankAwareScore),
      cebraspeScore,
      simpleScore,
      percentage,
      cebraspePercentage,
      unansweredCount: total - answeredCount,
    };
  }, [activeAnswers, scopedQuestions]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return scopedQuestions.filter(q => {
      const categoryGroupMatch =
        categoryGroupFilters.length === 0 || categoryGroupFilters.includes(questionCategoryGroup(q));
      const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(String(q.category));
      const topicMatch = topicFilters.length === 0 || topicFilters.some(topic => questionMatchesTopic(q, topic));
      const boardMatch = boardFilters.length === 0 || boardFilters.includes(questionExamBoard(q));
      const yearMatch = yearFilters.length === 0 || (q.year != null && yearFilters.includes(String(q.year)));
      const roleMatch = roleFilters.length === 0 || roleFilters.some(value => q.roles?.includes(value));
      const educationMatch =
        educationFilters.length === 0 || educationFilters.some(value => q.educationLevels?.includes(value));
      const formationMatch =
        formationFilters.length === 0 || formationFilters.some(value => q.formationAreas?.includes(value));
      const activityAreaMatch =
        activityAreaFilters.length === 0 || activityAreaFilters.some(value => q.activityAreas?.includes(value));
      const modality = q.options?.length ? 'Múltipla escolha' : 'Certo ou errado';
      const modalityMatch = modalityFilters.length === 0 || modalityFilters.includes(modality);
      const difficulty = Math.max(1, Math.min(5, Number(q.difficulty || 3)));
      // A escala persistida vai de 1 a 5 e o valor histórico padrão é 3 (Média).
      const difficultyLabel =
        difficulty === 1 ? 'Fácil' : difficulty <= 3 ? 'Média' : difficulty === 4 ? 'Difícil' : 'Muito difícil';
      const difficultyMatch = difficultyFilters.length === 0 || difficultyFilters.includes(difficultyLabel);
      const userAnswer = activeAnswers[q.id];
      const isAnnulled = q.correct === 'Anulada';
      const isCorrect = !isAnnulled && userAnswer === q.correct;
      const statusMatch =
        statusFilters.length === 0 ||
        statusFilters.some(
          status =>
            (status === 'Resolvidas' && !isAnnulled && Boolean(userAnswer)) ||
            (status === 'Não resolvidas' && !isAnnulled && !userAnswer) ||
            (status === 'Acertei' && Boolean(userAnswer) && isCorrect) ||
            (status === 'Errei' && !isAnnulled && Boolean(userAnswer) && !isCorrect) ||
            (status === 'Anuladas' && isAnnulled)
        );
      const isInedit = /\bin[eé]dit|simulado\b/i.test(`${q.reference || ''} ${q.text}`);
      return (
        categoryGroupMatch &&
        categoryMatch &&
        topicMatch &&
        boardMatch &&
        yearMatch &&
        roleMatch &&
        educationMatch &&
        formationMatch &&
        activityAreaMatch &&
        modalityMatch &&
        difficultyMatch &&
        statusMatch &&
        (!excludeAnnulled || !isAnnulled) &&
        (!excludeOutdated || !q.isOutdated) &&
        (!excludeInedit || !isInedit)
      );
    });
  }, [
    categoryGroupFilters,
    categoryFilters,
    topicFilters,
    statusFilters,
    boardFilters,
    yearFilters,
    roleFilters,
    educationFilters,
    formationFilters,
    activityAreaFilters,
    modalityFilters,
    difficultyFilters,
    excludeAnnulled,
    excludeOutdated,
    excludeInedit,
    activeAnswers,
    scopedQuestions,
  ]);

  useEffect(() => {
    if (mode !== 'all' || !initialQuestionId || openedQuestionRef.current === initialQuestionId) return;
    const targetIndex = scopedQuestions.findIndex(question => String(question.id) === String(initialQuestionId));
    if (targetIndex < 0) return;
    openedQuestionRef.current = initialQuestionId;
    setCategoryGroupFilters([]);
    setCategoryFilters([]);
    setTopicFilters([]);
    setStatusFilters([]);
    setVisibleQuestions(current => Math.max(current, targetIndex + 1));
    window.setTimeout(
      () =>
        document.getElementById(`q-card-${initialQuestionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      120
    );
  }, [initialQuestionId, mode, scopedQuestions]);

  const completeReview = () => {
    if (mode !== 'session' || stats.answeredCount < reviewGoal || !studyContext) return;
    if (reviewDraftKey) localStorage.removeItem(reviewDraftKey);
    onReviewComplete?.({
      topicTitle: studyContext.topicTitle,
      subjectName: studyContext.subjectName,
      answered: stats.answeredCount,
      correct: stats.correctCount,
      wrong: stats.incorrectCount,
      accuracy: stats.answeredCount ? Math.round((stats.correctCount * 100) / stats.answeredCount) : 0,
    });
  };

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (mobileFiltersOpen || !sentinel || visibleQuestions >= filteredQuestions.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleQuestions(current => Math.min(current + 10, filteredQuestions.length));
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mobileFiltersOpen, visibleQuestions, filteredQuestions.length]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const body = document.body;
    const root = document.documentElement;
    const previous = {
      bodyOverflow: body.style.overflow,
      rootOverflow: root.style.overflow,
    };
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
    };
  }, [mobileFiltersOpen]);

  const selectedExamBoard = useMemo(() => {
    const course = localStorage.getItem('active_course') || 'seplag_informatica';
    for (const key of [`${course}_study_config`, 'study_config']) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || '{}').examBoard;
        if (value) return String(value);
      } catch {}
    }
    return 'CEBRASPE';
  }, []);
  const usesCebraspeScoring = /cebraspe|cespe/i.test(selectedExamBoard);
  const currentScore =
    selectedQuestionBoards.length > 1
      ? stats.bankAwareScore
      : usesCebraspeScoring
        ? stats.cebraspeScore
        : stats.simpleScore;
  const currentAccuracy = stats.answeredCount ? Math.round((stats.correctCount * 100) / stats.answeredCount) : 0;
  const activeFilterCount = [
    categoryGroupFilters.length,
    categoryFilters.length,
    topicFilters.length,
    statusFilters.length,
    boardFilters.length,
    yearFilters.length,
    roleFilters.length,
    educationFilters.length,
    formationFilters.length,
    activityAreaFilters.length,
    modalityFilters.length,
    difficultyFilters.length,
    excludeAnnulled ? 1 : 0,
    excludeOutdated ? 1 : 0,
    excludeInedit ? 1 : 0,
  ].reduce((total, count) => total + count, 0);
  const resetFilters = () => {
    setCategoryGroupFilters([]);
    setCategoryFilters([]);
    setTopicFilters([]);
    setStatusFilters([]);
    setBoardFilters([]);
    setYearFilters([]);
    setRoleFilters([]);
    setEducationFilters([]);
    setFormationFilters([]);
    setActivityAreaFilters([]);
    setModalityFilters([]);
    setDifficultyFilters([]);
    setExcludeAnnulled(false);
    setExcludeOutdated(false);
    setExcludeInedit(false);
  };
  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
    setOpenFilterId(null);
  };
  const toggleMobileFilters = () => {
    if (mobileFiltersOpen) closeMobileFilters();
    else {
      setAdvancedFiltersOpen(true);
      setMobileFiltersOpen(true);
    }
  };

  return (
    <div id="quiz-tab-container" className="quiz-layout space-y-7">
      {mode === 'session' && studyContext && (
        <div className="session-context-banner">
          <Target aria-hidden="true" />
          <div>
            <span>REVISÃO DO ASSUNTO ATUAL</span>
            <strong>{studyContext.topicTitle}</strong>
            <p>
              {studyContext.subjectName} · meta de {reviewGoal} questões
            </p>
          </div>
        </div>
      )}
      <div className="quiz-overview quiz-overview-compact">
        <div className="quiz-performance-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          <div className="quiz-heading">
            <div>
              <span>{mode === 'session' ? 'Revisão em andamento' : 'Seu desempenho'}</span>
              <h2>{mode === 'session' ? 'Revisão da sessão' : 'Visão geral da prática'}</h2>
            </div>
            <p>
              {stats.answeredCount
                ? `${stats.answeredCount} ${stats.answeredCount === 1 ? 'questão respondida' : 'questões respondidas'} neste banco`
                : 'Comece pela primeira questão e acompanhe sua evolução aqui.'}
            </p>
          </div>
          <div
            className="quiz-stats grid grid-cols-2 md:grid-cols-4 gap-3"
            aria-label={`Pontuação calculada para ${selectedQuestionBoards.join(' e ') || selectedExamBoard}`}
          >
            <article className="quiz-kpi is-score">
              <span>Pontuação</span>
              <strong>{currentScore}</strong>
              <small>saldo atual</small>
            </article>
            <article className="quiz-kpi is-correct">
              <span>Acertos</span>
              <strong>{stats.correctCount}</strong>
              <small>respostas certas</small>
            </article>
            <article className="quiz-kpi is-wrong">
              <span>Erros</span>
              <strong>{stats.incorrectCount}</strong>
              <small>pontos a revisar</small>
            </article>
            <article className="quiz-kpi is-accuracy">
              <span>Aproveitamento</span>
              <strong>{currentAccuracy}%</strong>
              <small>taxa de acerto</small>
            </article>
          </div>
        </div>
      </div>

      {mode === 'session' && (
        <section className="bg-white border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Meta da revisão</span>
            <h3 className="font-bold text-slate-900 mt-1">Responda entre 10 e 20 questões</h3>
            <p className="text-xs text-slate-500 mt-1">
              A conclusão será liberada quando todas as questões da meta forem respondidas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[10, 15, 20].map(goal => (
              <button
                type="button"
                key={goal}
                disabled={questionPool.length < goal}
                onClick={() => setReviewGoal(goal)}
                className={`min-h-10 px-4 rounded-xl text-sm font-extrabold border ${reviewGoal === goal ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'} disabled:opacity-35`}
              >
                {goal}
              </button>
            ))}
            <button
              type="button"
              disabled={stats.answeredCount < reviewGoal || questionPool.length < 10}
              onClick={completeReview}
              className="min-h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-extrabold disabled:opacity-40"
            >
              {stats.answeredCount < reviewGoal
                ? `Faltam ${Math.max(0, reviewGoal - stats.answeredCount)}`
                : 'Concluir revisão'}
            </button>
          </div>
          {questionPool.length < 10 && (
            <p className="text-xs text-rose-600 font-semibold">
              Este assunto possui apenas {questionPool.length} questões pertinentes. Cadastre pelo menos 10 para liberar
              a revisão.
            </p>
          )}
        </section>
      )}

      {/* Question Filters Row */}
      <button
        type="button"
        className="quiz-mobile-filter-trigger"
        onClick={toggleMobileFilters}
        aria-expanded={mobileFiltersOpen}
        aria-controls="question-bank-filters"
      >
        <span>
          <Filter />
          Filtrar questões
        </span>
        <span>
          {activeFilterCount ? `${activeFilterCount} ativos` : 'Ver todos'}
          <ChevronDown />
        </span>
      </button>
      {(() => {
        const filterPanel = (
          <div
            ref={filterPanelRef}
            id="question-bank-filters"
            className={`quiz-filters ${mobileFiltersOpen ? 'is-mobile-open' : ''} space-y-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100`}
          >
            <div className="quiz-filter-heading flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-700">
              <div>
                <span>
                  <Filter className="w-4 h-4" />
                  {mode === 'session' ? 'Questões da sessão' : 'Encontre a questão certa'}
                </span>
                <p>Refine o banco por conteúdo, prova ou desempenho.</p>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'all' && (
                  <span className="quiz-filter-result">
                    {filteredQuestions.length} {filteredQuestions.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                )}
                <button type="button" className="quiz-filter-sheet-close" onClick={closeMobileFilters}>
                  Fechar <X aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="quiz-filter-scroll-content grid grid-cols-1 gap-3">
              {mode === 'all' && (
                <>
                  <section className="quiz-filter-group is-content rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <p className="quiz-filter-group-label mb-2 text-[11px] font-extrabold uppercase tracking-wide text-indigo-700">
                      Conteúdo
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <MultiFilter
                        id="category-group"
                        label="Área"
                        options={filterOptions.categoryGroups}
                        selected={categoryGroupFilters}
                        onChange={values => {
                          setCategoryGroupFilters(values);
                          setCategoryFilters([]);
                          setTopicFilters([]);
                        }}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="category"
                        label="Disciplina"
                        options={filterOptions.categories}
                        selected={categoryFilters}
                        onChange={values => {
                          setCategoryFilters(values);
                          setTopicFilters([]);
                        }}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      {categoryFilters.length > 0 && (
                        <MultiFilter
                          id="topic"
                          label="Assunto"
                          options={availableTopics}
                          selected={topicFilters}
                          onChange={setTopicFilters}
                          openFilterId={openFilterId}
                          onOpenFilterChange={setOpenFilterId}
                          emptyLabel="Todos"
                        />
                      )}
                    </div>
                  </section>
                  <section className="quiz-filter-group is-performance rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="quiz-filter-group-label mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                      Prova e desempenho
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <MultiFilter
                        id="question-status"
                        label="Minhas questões"
                        options={['Resolvidas', 'Não resolvidas', 'Acertei', 'Errei', 'Anuladas']}
                        selected={statusFilters}
                        onChange={setStatusFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="board"
                        label="Banca"
                        options={filterOptions.boards}
                        selected={boardFilters}
                        onChange={setBoardFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="year"
                        label="Ano"
                        options={filterOptions.years}
                        selected={yearFilters}
                        onChange={setYearFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todos"
                      />
                    </div>
                  </section>
                  <details
                    open={advancedFiltersOpen}
                    onToggle={event => {
                      if (event.target === event.currentTarget) {
                        setAdvancedFiltersOpen(event.currentTarget.open);
                        setOpenFilterId(null);
                      }
                    }}
                    className="quiz-advanced-filters rounded-lg border border-indigo-100 bg-indigo-50/40 text-xs text-slate-700"
                  >
                    <summary className="cursor-pointer px-3 py-2.5 font-extrabold text-indigo-700">
                      Mais filtros
                    </summary>
                    <div className="grid gap-2 border-t border-indigo-100 bg-white p-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MultiFilter
                        id="role"
                        label="Cargo"
                        options={filterOptions.roles}
                        selected={roleFilters}
                        onChange={setRoleFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todos"
                      />
                      <MultiFilter
                        id="education"
                        label="Nível"
                        options={filterOptions.education}
                        selected={educationFilters}
                        onChange={setEducationFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todos"
                      />
                      <MultiFilter
                        id="formation"
                        label="Área de formação"
                        options={filterOptions.formation}
                        selected={formationFilters}
                        onChange={setFormationFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="activity-area"
                        label="Área de atuação"
                        options={filterOptions.activityAreas}
                        selected={activityAreaFilters}
                        onChange={setActivityAreaFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="modality"
                        label="Modalidade"
                        options={['Certo ou errado', 'Múltipla escolha']}
                        selected={modalityFilters}
                        onChange={setModalityFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <MultiFilter
                        id="difficulty"
                        label="Dificuldade"
                        options={['Fácil', 'Média', 'Difícil', 'Muito difícil']}
                        selected={difficultyFilters}
                        onChange={setDifficultyFilters}
                        openFilterId={openFilterId}
                        onOpenFilterChange={setOpenFilterId}
                        emptyLabel="Todas"
                      />
                      <fieldset className="quiz-filter-exclusions quiz-filter-exclusions-desktop col-span-full mt-1 border-t border-slate-100 pt-2 text-slate-600">
                        <legend>Excluir do resultado</legend>
                        <div className="quiz-filter-exclusion-options">
                          <label>
                            <input
                              type="checkbox"
                              checked={excludeOutdated}
                              onChange={event => setExcludeOutdated(event.target.checked)}
                            />
                            <span>Desatualizadas</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={excludeAnnulled}
                              onChange={event => setExcludeAnnulled(event.target.checked)}
                            />
                            <span>Anuladas</span>
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={excludeInedit}
                              onChange={event => setExcludeInedit(event.target.checked)}
                            />
                            <span>Inéditas e simulados</span>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                  </details>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="quiz-filter-reset rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Limpar todos os filtros
                  </button>
                </>
              )}
            </div>
            {mode === 'all' && (
              <footer className="quiz-filter-mobile-actions">
                <button type="button" onClick={resetFilters}>
                  Limpar
                </button>
                <button type="button" onClick={closeMobileFilters}>
                  Filtrar
                </button>
              </footer>
            )}
          </div>
        );
        return mobileFiltersOpen
          ? createPortal(
              <>
                <button
                  type="button"
                  className="quiz-filter-sheet-backdrop"
                  aria-label="Fechar filtros"
                  onClick={closeMobileFilters}
                />
                {filterPanel}
              </>,
              document.body
            )
          : filterPanel;
      })()}

      {/* Questions List */}
      <div className="questions-list space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">
              {questionsError || 'Nenhuma questão encontrada para os filtros selecionados.'}
            </p>
          </div>
        ) : (
          filteredQuestions.slice(0, visibleQuestions).map((q, index) => {
            const userAnswer = activeAnswers[q.id];
            const isAnswered = !!userAnswer;
            const isAnnulled = q.correct === 'Anulada';
            const isCorrect = !isAnnulled && userAnswer === q.correct;
            const savedNote = noteForQuestion(q.id);
            const displayedQuestion = presentQuestionText(q.text);

            return (
              <article
                key={q.id}
                id={`q-card-${q.id}`}
                className={`question-card ${isAnnulled ? 'is-annulled' : isAnswered ? (isCorrect ? 'is-correct' : 'is-wrong') : ''} bg-white rounded-xl shadow-xs border transition-all overflow-hidden ${
                  isAnnulled
                    ? 'border-amber-200 bg-amber-50/20'
                    : isAnswered
                      ? isCorrect
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-rose-200 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <header className="question-card-header px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div
                    className="question-card-index"
                    aria-label={`Questão ${index + 1} de ${filteredQuestions.length}`}
                  >
                    <span>Questão</span>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                    <small>de {filteredQuestions.length}</small>
                  </div>
                  <div className="question-card-identity">
                    <div className="question-card-tags">
                      <span className="question-discipline">
                        {mode === 'session' && studyContext ? studyContext.topicTitle : q.category}
                      </span>
                      <span className="question-board">
                        {questionExamBoard(q)}
                        {q.year ? ` · ${q.year}` : ''}
                      </span>
                    </div>
                    {q.reference && <span className="question-reference">{q.reference}</span>}
                  </div>
                  <div className="question-card-actions">
                    <button
                      type="button"
                      onClick={() => openNoteEditor(q)}
                      className={favoriteQuestions.has(String(q.id)) ? 'is-active' : ''}
                      aria-pressed={favoriteQuestions.has(String(q.id))}
                      aria-label={savedNote ? 'Editar anotação da questão' : 'Salvar questão e criar anotação'}
                      title={savedNote ? 'Editar sua anotação' : 'Salvar questão e anotar'}
                    >
                      <Bookmark aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportError('');
                        setReportDraft({ question: q, reason: 'ANSWER', details: '' });
                      }}
                      className={reportedQuestions.has(String(q.id)) ? 'is-reported' : ''}
                      aria-pressed={reportedQuestions.has(String(q.id))}
                      aria-label={
                        reportedQuestions.has(String(q.id)) ? 'Questão já sinalizada' : 'Sinalizar problema na questão'
                      }
                      title={
                        reportedQuestions.has(String(q.id))
                          ? 'Questão já sinalizada — clique para atualizar'
                          : 'Sinalizar problema na questão'
                      }
                    >
                      <Flag aria-hidden="true" />
                    </button>
                  </div>
                </header>

                <div className="question-card-content">
                  {/* The passage is part of the question and must remain visible while answering. */}
                  {q.passageContent && (
                    <section className="question-passage" aria-labelledby={`passage-title-${q.id}`}>
                      <header className="question-passage-header">
                        <span className="question-passage-icon" aria-hidden="true">
                          <BookOpenText />
                        </span>
                        <div>
                          <span>Texto de apoio</span>
                          <strong id={`passage-title-${q.id}`}>
                            {q.passageTitle || 'Leitura para responder ao item'}
                          </strong>
                        </div>
                        <small>{passageReadingTime(q.passageContent)} min de leitura</small>
                      </header>
                      <div id={`passage-content-${q.id}`} className="question-passage-reader">
                        <div className="question-passage-content whitespace-pre-wrap">{q.passageContent}</div>
                      </div>
                    </section>
                  )}

                  {/* Question Text */}
                  <div className="question-card-body p-5 space-y-4">
                    <section className="question-stem-panel" aria-labelledby={`question-stem-${q.id}`}>
                      <div className="question-stem-kicker">
                        <span>{q.options?.length ? 'Escolha a alternativa correta' : 'Julgue o item a seguir'}</span>
                      </div>
                      <p id={`question-stem-${q.id}`} className="question-stem">
                        {displayedQuestion}
                      </p>
                    </section>
                    {savedNote && (
                      <aside className="question-note-inline">
                        <span>
                          <NotebookPen aria-hidden="true" />
                          Sua anotação
                        </span>
                        <p className="whitespace-pre-wrap">{savedNote.note}</p>
                      </aside>
                    )}

                    {/* Actions (Buttons for answering) */}
                    {!isAnnulled && (
                      <div className="question-answer-zone space-y-3">
                        <div className="question-answer-heading">
                          <p className="question-answer-label">Sua resposta</p>
                          <span>Selecione uma opção</span>
                        </div>
                        {q.options?.length ? (
                          <div
                            className="question-options grid gap-2"
                            role="radiogroup"
                            aria-label={`Alternativas da questão ${index + 1}`}
                          >
                            {q.options.map(option => {
                              const selected = userAnswer === option.label;
                              const optionIsCorrect = q.correct === option.label;
                              return (
                                <button
                                  key={option.label}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => handleAnswer(q.id, option.label)}
                                  className={`question-option w-full p-3 rounded-xl border text-left text-sm transition flex items-start gap-3 ${
                                    selected
                                      ? optionIsCorrect
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                        : 'bg-rose-50 border-rose-400 text-rose-900'
                                      : isAnswered && optionIsCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <strong
                                    className={`w-7 h-7 shrink-0 rounded-lg grid place-items-center ${selected ? 'bg-current/10' : 'bg-slate-100'}`}
                                  >
                                    {option.label}
                                  </strong>
                                  <span className="leading-relaxed pt-0.5">{option.text}</span>
                                  {selected &&
                                    (optionIsCorrect ? (
                                      <CheckCircle2 className="w-5 h-5 shrink-0 ml-auto text-emerald-600" />
                                    ) : (
                                      <XCircle className="w-5 h-5 shrink-0 ml-auto text-rose-600" />
                                    ))}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            className="question-binary-options flex items-center gap-3"
                            role="group"
                            aria-label={`Resposta da questão ${index + 1}`}
                          >
                            <button
                              type="button"
                              id={`btn-certo-${q.id}`}
                              onClick={() => handleAnswer(q.id, 'Certo')}
                              className={`question-binary-button px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                                userAnswer === 'Certo'
                                  ? q.correct === 'Certo'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {userAnswer === 'Certo' &&
                                (q.correct === 'Certo' ? (
                                  <CheckCircle2 aria-hidden="true" />
                                ) : (
                                  <XCircle aria-hidden="true" />
                                ))}
                              Certo
                            </button>
                            <button
                              type="button"
                              id={`btn-errado-${q.id}`}
                              onClick={() => handleAnswer(q.id, 'Errado')}
                              className={`question-binary-button px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                                userAnswer === 'Errado'
                                  ? q.correct === 'Errado'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {userAnswer === 'Errado' &&
                                (q.correct === 'Errado' ? (
                                  <CheckCircle2 aria-hidden="true" />
                                ) : (
                                  <XCircle aria-hidden="true" />
                                ))}
                              Errado
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Educational Feedback Section */}
                    {(isAnswered || isAnnulled) && (
                      <section
                        className={`question-feedback ${isAnnulled ? 'is-annulled' : isCorrect ? 'is-correct' : 'is-wrong'}`}
                        aria-live="polite"
                      >
                        <div className="question-feedback-heading flex items-center gap-1.5 font-bold mb-1">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>
                            {isAnnulled ? 'Questão anulada' : isCorrect ? 'Resposta correta' : 'Resposta incorreta'}
                          </span>
                          <span className="question-answer-key">Gabarito · {q.correct}</span>
                        </div>
                        <p className="question-feedback-copy">
                          {q.explanation || 'A explicação desta questão ainda está em revisão.'}
                        </p>
                        <button
                          type="button"
                          className="question-detailed-feedback-button"
                          onClick={() => setDetailedFeedback({ question: q, userAnswer })}
                          aria-haspopup="dialog"
                        >
                          <BookOpenText aria-hidden="true" />
                          <span>
                            <small>Assunto cobrado</small>
                            {q.detailedTopic || q.topic || q.category}
                          </span>
                          <ChevronDown aria-hidden="true" />
                        </button>
                      </section>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {mode === 'session' && stats.answeredCount >= reviewGoal && (
        <div className="sticky bottom-20 md:bottom-4 z-20 flex justify-center">
          <button
            type="button"
            onClick={completeReview}
            className="min-h-12 px-7 rounded-full bg-emerald-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-900/20"
          >
            Concluir revisão e ver resultado
          </button>
        </div>
      )}

      {detailedFeedback &&
        createPortal(
          <DetailedFeedbackModal question={detailedFeedback.question} onClose={() => setDetailedFeedback(null)} />,
          document.body
        )}

      {noteDraft &&
        createPortal(
          <div
            className="question-note-modal-backdrop"
            role="presentation"
            onMouseDown={event => {
              if (event.target === event.currentTarget && !noteBusy) setNoteDraft(null);
            }}
          >
            <section
              className="question-note-modal w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="question-note-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600">
                    <Bookmark className="h-4 w-4" />
                    Questão salva
                  </span>
                  <h3 id="question-note-title" className="mt-1 text-xl font-black text-slate-950">
                    O que você quer lembrar?
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={noteBusy}
                  onClick={() => setNoteDraft(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                  aria-label="Fechar"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 line-clamp-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                {noteDraft.question.text}
              </p>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Sua anotação</span>
                <textarea
                  autoFocus
                  required
                  rows={6}
                  maxLength={4000}
                  className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  value={noteDraft.note}
                  onChange={event =>
                    setNoteDraft(current => (current ? { ...current, note: event.target.value } : current))
                  }
                  placeholder="Ex.: errei porque confundi correlação com causalidade. Revisar metodologia científica e tipos de estudo."
                />
                <span className="mt-1 block text-right text-[10px] font-bold text-slate-400">
                  {noteDraft.note.length}/4000
                </span>
              </label>
              {noteError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" role="alert">
                  {noteError}
                </p>
              )}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <div>
                  {noteForQuestion(noteDraft.question.id) && (
                    <button
                      type="button"
                      disabled={noteBusy}
                      onClick={() => void removeQuestionNote()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover dos salvos
                    </button>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={noteBusy}
                    onClick={() => setNoteDraft(null)}
                    className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={noteBusy || !noteDraft.note.trim()}
                    onClick={() => void saveQuestionNote()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-extrabold text-white disabled:opacity-60"
                  >
                    {noteBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {noteBusy ? 'Salvando…' : 'Salvar anotação'}
                  </button>
                </div>
              </div>
            </section>
          </div>,
          document.body
        )}

      {reportDraft && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !reportBusy) setReportDraft(null);
          }}
        >
          <section
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-report-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-rose-600">Revisão de conteúdo</span>
                <h3 id="question-report-title" className="mt-1 text-xl font-black text-slate-950">
                  Sinalizar problema na questão
                </h3>
              </div>
              <button
                type="button"
                disabled={reportBusy}
                onClick={() => setReportDraft(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 line-clamp-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              {reportDraft.question.text}
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Qual é o problema?</span>
              <select
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
                value={reportDraft.reason}
                onChange={event => setReportDraft(value => (value ? { ...value, reason: event.target.value } : value))}
              >
                <option value="ANSWER">Gabarito incorreto</option>
                <option value="STATEMENT">Erro no enunciado</option>
                <option value="EXPLANATION">Explicação incorreta</option>
                <option value="OUTDATED">Questão desatualizada</option>
                <option value="OTHER">Outro problema</option>
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Explique a sinalização</span>
              <textarea
                rows={4}
                maxLength={2000}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                value={reportDraft.details}
                onChange={event => setReportDraft(value => (value ? { ...value, details: event.target.value } : value))}
                placeholder="Ex.: o gabarito deveria ser Errado porque…"
              />
            </label>
            {reportError && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" role="alert">
                {reportError}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={reportBusy}
                onClick={() => setReportDraft(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={reportBusy}
                onClick={() => void submitReport()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-extrabold text-white disabled:opacity-60"
              >
                <Flag className="h-4 w-4" />
                {reportBusy ? 'Enviando…' : 'Enviar sinalização'}
              </button>
            </div>
          </section>
        </div>
      )}

      <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
    </div>
  );
}

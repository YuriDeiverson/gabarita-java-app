import { getValidSession } from '../auth/session';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const nativeFetch=globalThis.fetch.bind(globalThis);
const GENERIC_LOAD_ERROR = 'Erro ao carregar. Tente novamente mais tarde.';
const GENERIC_ACTION_ERROR = 'Não foi possível concluir a operação. Tente novamente mais tarde.';
const REQUEST_TIMEOUT_MS = 15_000;
const QUESTION_BANK_TIMEOUT_MS = 45_000;
const STUDY_PLAN_MUTATION_TIMEOUT_MS = 120_000;
const SCHEDULE_GENERATION_TIMEOUT_MS = 60_000;
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 502, 503, 504]);

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const isRetryableApiError = (error: unknown) =>
  error instanceof ApiRequestError && error.retryable;

const isRetryableResponseStatus = (status: number) =>
  status === 404 || status === 408 || status === 429 || status >= 500;
const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const requestOnce = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  else init.signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await nativeFetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
    init.signal?.removeEventListener('abort', onAbort);
  }
};

const isAbortError=(error:unknown)=>error instanceof Error&&error.name==='AbortError';

const fetch=async(input:RequestInfo|URL,init:RequestInit={},timeoutMs=REQUEST_TIMEOUT_MS):Promise<Response>=>{
  try {
    const session = await getValidSession();
    const headers=new Headers(init.headers);
    if(session?.access_token)headers.set('Authorization',`Bearer ${session.access_token}`);
    const requestInit = { ...init, headers };
    const method = String(init.method || 'GET').toUpperCase();
    const retrySafe = method === 'GET' || method === 'HEAD';
    let response: Response;
    try {
      response=await requestOnce(input,requestInit,timeoutMs);
    } catch (error) {
      // Um timeout já consumiu toda a janela da operação. Repeti-la imediatamente
      // duplica a carga no servidor e prolonga o erro percebido pelo usuário.
      if (!retrySafe || init.signal?.aborted || isAbortError(error)) throw error;
      await wait(400);
      response=await requestOnce(input,requestInit,timeoutMs);
    }
    if(retrySafe&&RETRYABLE_HTTP_STATUSES.has(response.status)){
      await wait(400);
      response=await requestOnce(input,requestInit,timeoutMs);
    }
    if(response.status===401&&session){
      const renewedSession=await getValidSession({
        forceRefresh:true,
        rejectedAccessToken:session.access_token,
      });
      if(renewedSession){
        headers.set('Authorization',`Bearer ${renewedSession.access_token}`);
        response=await requestOnce(input,{...init,headers},timeoutMs);
      }
    }
    return response;
  } catch {
    // Não exponha falhas de rede, timeout ou detalhes de serviços ao usuário.
    throw new ApiRequestError(GENERIC_LOAD_ERROR, 0, true);
  }
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  // A resposta detalhada pode conter nomes de serviços, SQL ou rastros internos.
  // A interface deve exibir somente uma orientação segura e compreensível.
  void response;
  return /^(failed|erro interno|internal server)/i.test(fallback.trim())
    ? GENERIC_LOAD_ERROR
    : fallback || GENERIC_ACTION_ERROR;
};

const apiResponseError = async (response: Response, fallback: string) =>
  new ApiRequestError(
    await getApiErrorMessage(response, fallback),
    response.status,
    isRetryableResponseStatus(response.status),
  );

export interface StudyPlan {
  id: string;
  course_id?: string;
  courseId?: string;
  title: string;
  exam_date?: string;
  examDate?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  is_primary?: boolean;
  is_active?: boolean | number;
  total_topics?: number;
  completed_topics?: number;
  block_minutes?: number;
  created_at?: string;
  updated_at?: string;
  settings?: Record<string, unknown> | string;
}

export interface QuizProgress {
  id: string;
  study_plan_id: string;
  question_id: number | string;
  answer: string;
  is_correct: number;
  answered_at: string;
}

export interface ScheduleProgress {
  id: string;
  study_plan_id: string;
  block_id: string;
  is_completed: number | boolean;
  completed_at: string | null;
}

export interface ScheduleAgendaItem {
  id: string;
  roadmap_topic_id?: string;
  title: string;
  subject_name: string;
  topic_title?: string;
  activity_type: string;
  planned_minutes: number;
  studied_minutes: number;
  question_goal: number;
  questions_answered: number;
  correct_answers: number;
  accuracy?: number | null;
  status: string;
  is_optional?: boolean;
  outside_planned_hours?: boolean;
  objective?: string;
  review_points: string[];
}

export interface ScheduleAgendaDay {
  date: string;
  status: string;
  planned_minutes: number;
  extra_question_minutes?: number;
  studied_minutes: number;
  questions_answered: number;
  correct_answers: number;
  items: ScheduleAgendaItem[];
}

export interface ScheduleAgenda {
  plan_id: string;
  start: string;
  end: string;
  days: ScheduleAgendaDay[];
}

export interface DailyTask {
  id: string; plan_id: string; roadmap_topic_id: string; task_date: string; position: number;
  activity_type: string; planned_minutes: number; completed_minutes: number; question_goal: number;
  questions_answered: number; correct_answers: number; minimum_accuracy: number; achieved_accuracy?: number;
  priority: number; status: string; topic_title: string; subject_name: string; objective?: string;
  topic_status: string; mastery: number; is_optional: boolean; outside_planned_hours: boolean;
  planning_reason?: string;
}

export interface StudySession {
  id: string; user_id: string; plan_id: string; daily_task_id?: string; roadmap_topic_id?: string; status: 'RUNNING'|'PAUSED'|'COMPLETED'|'CANCELLED';
  mode: 'FREE'|'POMODORO'; started_at: string; elapsed_seconds: number; effective_seconds: number;
  planned_minutes: number; topic_title: string; subject_name: string; paused_at?: string;
  pomodoro_cycle?: number; pomodoro_config?: string; pause_reason?: string;
  session_kind?: 'STUDY'|'QUESTIONS'; questions_answered?: number; correct_answers?: number; context_title?: string;
}

export interface StudyDashboardData {
  plan: StudyPlan & { daily_goal_minutes: number };
  today: { date: string; goal_minutes: number; planned_minutes: number; completed_minutes: number; remaining_minutes: number;
    progress_percentage: number; total_tasks: number; completed_tasks: number; question_goal: number; questions_answered: number };
  tasks: DailyTask[]; active_session: Partial<StudySession>; streak: Record<string, any>;
  planning: { declared_minutes:number; planned_capacity_minutes:number; reserve_minutes:number;
    practice_minutes:number; window_days:number; window_end:string; strategy:string;
    is_study_day:boolean; next_study_date:string|null };
  experience: { total_xp: number; level: number; level_name: string; current_level_xp: number; next_level_xp: number };
  reviews: Record<string, any>[]; next: Record<string, any>; roadmap: Record<string, any>[];
  notifications: Record<string, any>[]; unread_notifications: number;
}

// Study Plans API
export const studyPlansApi = {
  getSummaries: async (): Promise<StudyPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/summaries`);
    if (!response.ok) throw await apiResponseError(response, GENERIC_LOAD_ERROR);
    return response.json();
  },
  getAll: async (includeArchived = false): Promise<StudyPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans?includeArchived=${includeArchived}`);
    if (!response.ok) throw await apiResponseError(response, GENERIC_LOAD_ERROR);
    return response.json();
  },

  getById: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`);
    if (!response.ok) throw await apiResponseError(response, GENERIC_LOAD_ERROR);
    return response.json();
  },

  getActive: async (): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/active/current`);
    if (!response.ok) throw await apiResponseError(response, GENERIC_LOAD_ERROR);
    return response.json();
  },

  create: async (data: {
    courseId: string;
    title: string;
    examDate: string;
    hoursPerDay: number;
    daysPerWeek: number;
    totalWeeks: number;
    blockMinutes?: number;
    breakMinutes?: number;
    studySections: any[];
    scheduleWeeks: any[];
    settings?: Record<string, unknown>;
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, STUDY_PLAN_MUTATION_TIMEOUT_MS);
    if (!response.ok) throw await apiResponseError(response, 'Não foi possível salvar o plano');
    return response.json();
  },

  update: async (id: string, data: {
    courseId: string;
    title: string;
    examDate: string;
    hoursPerDay: number;
    daysPerWeek: number;
    totalWeeks: number;
    blockMinutes?: number;
    breakMinutes?: number;
    studySections: any[];
    scheduleWeeks: any[];
    settings?: Record<string, unknown>;
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, STUDY_PLAN_MUTATION_TIMEOUT_MS);
    if (!response.ok) throw await apiResponseError(response, 'Não foi possível atualizar o plano');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(GENERIC_ACTION_ERROR);
    }
  },

  activate: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw await apiResponseError(response, 'Não foi possível ativar o plano');
  },

  duplicate: async (id: string, title?: string): Promise<StudyPlan> => {
    const query = title ? `?title=${encodeURIComponent(title)}` : '';
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/duplicate${query}`, { method: 'POST' });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  archive: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/archive`, { method: 'PATCH' });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  restore: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/restore`, { method: 'PATCH' });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  history: async (id: string): Promise<Record<string, unknown>[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/history`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },
};

// Quiz Progress API
export const quizProgressApi = {
  getByStudyPlan: async (studyPlanId: string): Promise<QuizProgress[]> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },

  getById: async (id: string): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },

  create: async (data: {
    studyPlanId: string;
    questionId: number | string;
    answer: string;
    isCorrect: boolean;
    roadmapTopicId?: string;
    topicTitle?: string;
  }): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  update: async (id: string, data: {
    answer: string;
    isCorrect: boolean;
  }): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
  },

  deleteByStudyPlan: async (studyPlanId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
  },

  getStats: async (studyPlanId: string): Promise<{
    total_answered: number;
    correct_answers: number;
    wrong_answers: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/stats/${studyPlanId}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },
};

// Schedule API
export const scheduleApi = {
  getAgenda: async (studyPlanId: string, start: string, end: string): Promise<ScheduleAgenda> => {
    const params = new URLSearchParams({ start, end });
    const response = await fetch(`${API_BASE_URL}/schedule/agenda/${studyPlanId}?${params}`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Não foi possível carregar a agenda'));
    return response.json();
  },

  getProgress: async (studyPlanId: string): Promise<ScheduleProgress[]> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${studyPlanId}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },

  saveProgress: async (data: {
    studyPlanId: string;
    blockId: string;
    isCompleted: boolean;
  }): Promise<ScheduleProgress> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  updateProgress: async (id: string, data: {
    isCompleted: boolean;
  }): Promise<ScheduleProgress> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },

  deleteProgress: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
  },

  generate: async (data: {
  courseId: string;
  examDate: string;
  studyDays: { day: string; hours: number }[];
  studySections: any[];
  blockMinutes?: number;
}): Promise<{ scheduleWeeks: any[] }> => {
  const response = await fetch(`${API_BASE_URL}/schedule/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, SCHEDULE_GENERATION_TIMEOUT_MS);
  if (!response.ok) throw await apiResponseError(response, 'Não foi possível gerar o cronograma');
  return response.json();
},

  getStats: async (studyPlanId: string): Promise<{
    total_blocks: number;
    completed_blocks: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/stats/${studyPlanId}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },

  regenerate: async (studyPlanId: string): Promise<{ blocksCreated: number; warning: string }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/plans/${studyPlanId}/regenerate`, { method: 'POST' });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },
};

export interface QuestionNote {
  id: string;
  question_id: string;
  course_id: string;
  question_text: string;
  category: string;
  topic: string;
  reference: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface DetailedQuestionGuide {
  detailedTopic?:string;
  conceptExplanation?:string;
  decisiveEvidence?:string;
  answerAnalysis?:string;
  examTrap?:string;
  similarQuestionStrategy?:string;
  fixationTips?:string[];
  comparisonHeaders?:{criterion:string;left:string;right:string};
  comparisonRows?:Array<{criterion:string;left:string;right:string}>;
}

export interface QuestionTaxonomyTopic {
  id:string;
  slug:string;
  name:string;
  count:number;
}

export interface QuestionTaxonomyDiscipline {
  id:string;
  slug:string;
  name:string;
  area:string;
  count:number;
  topics:QuestionTaxonomyTopic[];
}

export const questionsApi = {
  taxonomy: (courseId='',includeEmpty=false) => {
    const params=new URLSearchParams();if(courseId)params.set('courseId',courseId);if(includeEmpty)params.set('includeEmpty','true');
    return jsonRequest<QuestionTaxonomyDiscipline[]>(`/questions/taxonomy${params.size?`?${params}`:''}`);
  },
  all: async (): Promise<import('../types').Question[]> => {
    const response = await fetch(`${API_BASE_URL}/questions/all`,{},QUESTION_BANK_TIMEOUT_MS);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    const rows = await response.json();
    return rows.map(questionFromApiRow);
  },
  forCourse: async (courseId: string): Promise<import('../types').Question[]> => {
    const response = await fetch(`${API_BASE_URL}/questions/course/${encodeURIComponent(courseId)}`,{},QUESTION_BANK_TIMEOUT_MS);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    const rows = await response.json();
    return rows.map(questionFromApiRow);
  },
  importLegacy: async (courseId: string, questions: unknown[]): Promise<{ imported: number; updated: number; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/questions/import/legacy?courseId=${encodeURIComponent(courseId)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questions),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },
  report: (data:{questionId:string;courseId?:string;text:string;category?:string;reference?:string;reason:string;details?:string}) =>
    jsonRequest<{id:string;status:string;reason:string}>('/questions/reports', { method:'POST',body:JSON.stringify(data) }),
  notes: () => jsonRequest<QuestionNote[]>('/questions/notes'),
  saveNote: (data:{questionId:string;courseId?:string;text:string;category?:string;topic?:string;reference?:string;note:string}) =>
    jsonRequest<QuestionNote>('/questions/notes', {method:'PUT',body:JSON.stringify(data)}),
  deleteNote: (questionId:string,courseId='') => {
    const params=new URLSearchParams({questionId,courseId});
    return jsonRequest<void>(`/questions/notes?${params}`, {method:'DELETE'});
  },
  guide: (questionId:string) => jsonRequest<DetailedQuestionGuide>(`/questions/${encodeURIComponent(questionId)}/guide`),
};

const arrayFromApi=(value:unknown):string[]=>{
  if(Array.isArray(value))return value.map(String);
  if(typeof value==='string')try{return Array.isArray(JSON.parse(value))?JSON.parse(value).map(String):[];}catch{return [];}
  return [];
};

const questionFromApiRow=(row:any):import('../types').Question=>{
  let options = row.options || row.alternatives;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { options = undefined; }
  }
  return { id: row.id, category: row.category, area: row.area, board: row.board || row.exam_board,
    topic: row.topic || row.category, text: row.text,
    options: Array.isArray(options) ? options : undefined,
    correct: row.correct_option || row.correct, explanation: row.explanation,
    detailedTopic: row.detailed_topic,
    subjectId: row.subject_id, studySubjectId: row.study_subject_id, topicId: row.topic_id,
    reference: row.reference,
    passageId: row.passage_id, passageTitle: row.passage_title, passageContent: row.passage_content,
    year: row.year == null ? undefined : Number(row.year), difficulty: row.difficulty == null ? undefined : Number(row.difficulty),
    courseIds: arrayFromApi(row.course_ids), roles: arrayFromApi(row.roles),
    educationLevels: arrayFromApi(row.education_levels), formationAreas: arrayFromApi(row.formation_areas),
    activityAreas: arrayFromApi(row.activity_areas), isOutdated: row.outdated===true||row.outdated==='true'||row.outdated===1 };
};

export const simulationsApi = {
  create: async (data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/simulations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },
  answer: async (id: string, data: { questionId: string; answer: unknown; timeSpentSeconds: number }) => {
    const response = await fetch(`${API_BASE_URL}/simulations/${id}/answers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(GENERIC_ACTION_ERROR);
    return response.json();
  },
  start: (id: string) => fetch(`${API_BASE_URL}/simulations/${id}/start`, { method: 'PATCH' }),
  pause: (id: string) => fetch(`${API_BASE_URL}/simulations/${id}/pause`, { method: 'PATCH' }),
  finish: (id: string) => fetch(`${API_BASE_URL}/simulations/${id}/finish`, { method: 'PATCH' }),
};

export const analyticsApi = {
  dashboard: async (days = 30, planId?: string | null): Promise<any> => {
    const params = new URLSearchParams({ days: String(days) });
    if (planId && !String(planId).startsWith('local-')) params.set('planId', planId);
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?${params}`);
    if (!response.ok) throw new Error(GENERIC_LOAD_ERROR);
    return response.json();
  },
};

const jsonRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, GENERIC_ACTION_ERROR));
    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError || (error instanceof Error && (error.message === GENERIC_LOAD_ERROR || error.message === GENERIC_ACTION_ERROR))) {
      throw error;
    }
    throw new Error(GENERIC_LOAD_ERROR);
  }
};

const fileRequest = async <T extends Blob | Record<string, unknown> | void>(
  path: string,
  options?: RequestInit,
  responseType: 'blob' | 'json' | 'none' = 'json',
): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, GENERIC_ACTION_ERROR));
    if (responseType === 'none' || response.status === 204) return undefined as T;
    if (responseType === 'blob') return response.blob() as Promise<T>;
    return response.json();
  } catch (error) {
    if (error instanceof Error && (error.message === GENERIC_LOAD_ERROR || error.message === GENERIC_ACTION_ERROR)) {
      throw error;
    }
    throw new Error(GENERIC_LOAD_ERROR);
  }
};

export interface CatalogRole {
  databaseId?: string;
  contestDatabaseId?: string;
  id: string;
  label: string;
  courseId: string;
  board: string;
  includeDiscursive?: boolean;
  requirement?: string;
  remuneration?: string;
  vacancies?: string;
  estimatedHours?: number;
  curriculum?: { topics?: unknown[]; studySections?: unknown[] };
  active?: boolean;
}

export interface CatalogContest {
  databaseId?: string;
  id: string;
  label: string;
  acronym: string;
  organization: string;
  description: string;
  board: string;
  examDate: string;
  status: string;
  state: string;
  area: string;
  education: string;
  vacancies: string;
  remuneration: string;
  location: string;
  stages: string;
  noticeReference: string;
  noticePdfAvailable?: boolean;
  noticePdfName?: string;
  noticePdfSize?: number;
  noticePdfUpdatedAt?: string;
  active?: boolean;
  roles: CatalogRole[];
}

export interface SharedStudySubject {
  id: string;
  canonicalKey: string;
  title: string;
  discipline: string;
  studyGroup: string;
  studyObjective: string;
  reviewSummary: string[];
  content: string;
  keyTakeaways: string[];
  contentBlocks: Array<{
    id:string;
    title:string;
    content:string;
    keyTakeaways?:string[];
    miniQuestions?:Array<{prompt:string;answer:string}>;
    createdAt?:string;
  }>;
  updatedAt?: string;
}

export interface AdminPassage { id: string; title: string; content: string; source?: string; }
export interface AdminQuestion {
  id: string; courseId: string; subjectId?:string; topicId?:string; category: string; topic: string; board: string; type: string; text: string;
  correct: string; explanation?: string; reference?: string; status?: string; passageId?: string | null;
  detailedTopic?: string; conceptExplanation?: string; decisiveEvidence?:string; answerAnalysis?: string; examTrap?:string; similarQuestionStrategy?:string; fixationTips?: string[];
  comparisonHeaders?: {criterion:string;left:string;right:string};
  comparisonRows?: Array<{criterion:string;left:string;right:string}>;
  passageTitle?: string; pendingReports?: number; options: Array<{ label: string; text: string }>;
}
export interface AdminQuestionPage {
  items: AdminQuestion[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  areas: string[];
}
export interface AdminQuestionReport {
  id:string; questionId?:string|null; questionKey:string; questionText:string; courseId:string; category:string; reference?:string;
  reason:string; details?:string; status:'PENDING'|'RESOLVED'|'DISMISSED'; adminNote?:string;
  reporterName?:string; reporterEmail?:string; createdAt:string; updatedAt:string;
}

export const catalogApi = {
  contests: (includeCurriculum = false) => jsonRequest<CatalogContest[]>(`/catalog/contests?includeCurriculum=${includeCurriculum}`),
  contest: (id:string) => jsonRequest<CatalogContest>(`/catalog/contests/${encodeURIComponent(id)}`),
  contestNoticePdf: (id:string) => fileRequest<Blob>(`/catalog/contests/${id}/notice-pdf`, undefined, 'blob'),
  studyLibrary: () => jsonRequest<SharedStudySubject[]>('/catalog/study-library'),
  studySubject: (id:string) => jsonRequest<SharedStudySubject>(`/catalog/study-library/${encodeURIComponent(id)}`),
};

export const adminApi = {
  catalog: () => jsonRequest<CatalogContest[]>('/admin/catalog'),
  createContest: (data: Record<string,unknown>) => jsonRequest<{id:string}>('/admin/catalog/contests', { method:'POST',body:JSON.stringify(data) }),
  updateContest: (id:string,data:Record<string,unknown>) => jsonRequest<{id:string}>(`/admin/catalog/contests/${id}`, { method:'PUT',body:JSON.stringify(data) }),
  deleteContest: (id:string) => jsonRequest<void>(`/admin/catalog/contests/${id}`, { method:'DELETE' }),
  uploadContestNoticePdf: (id:string,file:File) => {
    const data=new FormData();data.append('file',file);
    return fileRequest<{noticePdfAvailable:boolean;noticePdfName:string;noticePdfSize:number}>(`/admin/catalog/contests/${id}/notice-pdf`, {method:'PUT',body:data});
  },
  deleteContestNoticePdf: (id:string) => fileRequest<void>(`/admin/catalog/contests/${id}/notice-pdf`, {method:'DELETE'}, 'none'),
  createRole: (data:Record<string,unknown>) => jsonRequest('/admin/catalog/roles', { method:'POST',body:JSON.stringify(data) }),
  updateRole: (id:string,data:Record<string,unknown>) => jsonRequest(`/admin/catalog/roles/${id}`, { method:'PUT',body:JSON.stringify(data) }),
  deleteRole: (id:string) => jsonRequest<void>(`/admin/catalog/roles/${id}`, { method:'DELETE' }),
  addStudyMaterial: (roleId:string,data:{sectionId:string;cardId:string;title:string;content:string;keyTakeaways:string[]}) =>
    jsonRequest<{id:string;title:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/materials`, {method:'POST',body:JSON.stringify(data)}),
  updateStudyMaterial: (roleId:string,materialId:string,data:{sectionId:string;cardId:string;title:string;content:string;keyTakeaways:string[]}) =>
    jsonRequest<{id:string;title:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/materials/${materialId}`, {method:'PUT',body:JSON.stringify(data)}),
  deleteStudyMaterial: (roleId:string,materialId:string,sectionId:string,cardId:string) => {
    const params=new URLSearchParams({sectionId,cardId});return jsonRequest<void>(`/admin/catalog/roles/${roleId}/materials/${materialId}?${params}`, {method:'DELETE'});
  },
  updateBaseStudyMaterial: (roleId:string,data:{sectionId:string;cardId:string;content:string;keyTakeaways:string[]}) =>
    jsonRequest<{cardId:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/materials/base`, {method:'PUT',body:JSON.stringify(data)}),
  deleteBaseStudyMaterial: (roleId:string,sectionId:string,cardId:string) => {
    const params=new URLSearchParams({sectionId,cardId});return jsonRequest<void>(`/admin/catalog/roles/${roleId}/materials/base?${params}`, {method:'DELETE'});
  },
  createSharedSubject: (data:{title:string;discipline:string;studyGroup:string;studyObjective:string;reviewSummary:string[]}) =>
    jsonRequest<{id:string;title:string;discipline:string;studyGroup:string}>('/admin/catalog/subjects', {method:'POST',body:JSON.stringify(data)}),
  importSharedSubjects: (subjects:Array<{title:string;discipline:string;studyGroup:string;studyObjective:string;reviewSummary:string[]}>) =>
    jsonRequest<{imported:number;skippedExisting:number;skippedRepeated:number;synchronizedPlans:number;ids:string[]}>(
      '/admin/catalog/subjects/batch', {method:'POST',body:JSON.stringify({subjects})}
    ),
  updateSharedSubject: (id:string,data:{discipline:string;studyGroup:string;studyObjective:string;reviewSummary:string[]}) =>
    jsonRequest<{id:string;title:string;synchronizedPlans:number}>(`/admin/catalog/subjects/${id}`, {method:'PUT',body:JSON.stringify(data)}),
  deleteSharedSubject: (id:string) => jsonRequest<void>(`/admin/catalog/subjects/${id}`, {method:'DELETE'}),
  createStudyDiscipline: (roleId:string,title:string) =>
    jsonRequest<{id:string;title:string}>(`/admin/catalog/roles/${roleId}/disciplines`, {method:'POST',body:JSON.stringify({title})}),
  createStudySubject: (roleId:string,sectionId:string,title:string) =>
    jsonRequest<{id:string;title:string;sharedSubjectId:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/subjects`, {method:'POST',body:JSON.stringify({sectionId,title})}),
  deleteStudySubject: (roleId:string,sectionId:string,cardId:string) => {
    const params=new URLSearchParams({sectionId});
    return jsonRequest<{cardId:string;title:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/subjects/${encodeURIComponent(cardId)}?${params}`, {method:'DELETE'});
  },
  deleteStudyDiscipline: (roleId:string,sectionId:string) =>
    jsonRequest<{sectionId:string;title:string;synchronizedPlans:number}>(`/admin/catalog/roles/${roleId}/disciplines/${encodeURIComponent(sectionId)}`, {method:'DELETE'}),
  passages: () => jsonRequest<AdminPassage[]>('/admin/content/passages'),
  createPassage: (data:Record<string,unknown>) => jsonRequest('/admin/content/passages', { method:'POST',body:JSON.stringify(data) }),
  updatePassage: (id:string,data:Record<string,unknown>) => jsonRequest(`/admin/content/passages/${id}`, { method:'PUT',body:JSON.stringify(data) }),
  deletePassage: (id:string) => jsonRequest<void>(`/admin/content/passages/${id}`, { method:'DELETE' }),
  questions: (filters:{query?:string;courseId?:string;area?:string;page?:number;pageSize?:number}={}) => {
    const params=new URLSearchParams();if(filters.query)params.set('query',filters.query);if(filters.courseId)params.set('courseId',filters.courseId);
    if(filters.area)params.set('area',filters.area);params.set('page',String(filters.page||1));params.set('pageSize',String(filters.pageSize||10));
    return jsonRequest<AdminQuestionPage>(`/admin/content/questions?${params}`);
  },
  createQuestion: (data:Record<string,unknown>) => jsonRequest('/admin/content/questions', { method:'POST',body:JSON.stringify(data) }),
  importQuestions: async (questions:Record<string,unknown>[]) => {
    const response=await fetch(`${API_BASE_URL}/admin/content/questions/batch`, {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questions}),
    });
    if(!response.ok){
      let message=GENERIC_ACTION_ERROR;
      if(response.status===400){
        try{
          const body=await response.json() as {code?:unknown;error?:unknown;fields?:unknown};
          if(body.code==='QUESTION_IMPORT_INVALID'&&typeof body.error==='string'&&body.error.length<=500)
            message=body.error;
          else if(body.error==='Dados inválidos'&&body.fields&&typeof body.fields==='object'&&!Array.isArray(body.fields)){
            const first=Object.entries(body.fields as Record<string,unknown>)
              .find(([field,detail])=>/^questions\[\d+]\.[A-Za-z][A-Za-z0-9]*$/.test(field)&&typeof detail==='string');
            if(first){
              const match=/^questions\[(\d+)]\.([A-Za-z][A-Za-z0-9]*)$/.exec(first[0]);
              if(match)message=`Questão ${Number(match[1])+1}: o campo “${match[2]}” não atende ao formato ou limite permitido.`;
            }
          }
        }catch{/* A resposta inválida permanece oculta. */}
      }
      throw new ApiRequestError(message,response.status,isRetryableResponseStatus(response.status));
    }
    return response.json() as Promise<{imported:number;ids:string[]}>;
  },
  updateQuestion: (id:string,data:Record<string,unknown>) => jsonRequest(`/admin/content/questions/${id}`, { method:'PUT',body:JSON.stringify(data) }),
  deleteQuestion: (id:string) => jsonRequest<void>(`/admin/content/questions/${id}`, { method:'DELETE' }),
  questionReports: (status='PENDING') => jsonRequest<AdminQuestionReport[]>(`/admin/content/question-reports?status=${encodeURIComponent(status)}`),
  reviewQuestionReport: (id:string,status:'RESOLVED'|'DISMISSED',adminNote='') => jsonRequest(`/admin/content/question-reports/${id}`, {
    method:'PATCH',body:JSON.stringify({status,adminNote}),
  }),
};

export const dailyStudyApi = {
  today: () => jsonRequest<StudyDashboardData>('/study/today'),
  start: (taskId: string, data: { mode: 'FREE'|'POMODORO'; pomodoro?: Record<string, unknown>; device?: string }) =>
    jsonRequest<StudySession>(`/study/tasks/${taskId}/start`, { method: 'POST', body: JSON.stringify(data) }),
  startReview: (topicId: string, data: { mode: 'FREE'|'POMODORO'; pomodoro?: Record<string, unknown>; device?: string }) =>
    jsonRequest<StudySession>(`/study/topics/${topicId}/review/start`, { method: 'POST', body: JSON.stringify(data) }),
  pause: (id: string, reason?: string) => jsonRequest<StudySession>(`/study/sessions/${id}/pause`, { method: 'POST', body: JSON.stringify({ reason }) }),
  resume: (id: string) => jsonRequest<StudySession>(`/study/sessions/${id}/resume`, { method: 'POST' }),
  completeFocus: (id: string) => jsonRequest<{ session: StudySession; feedback: string[]; experience: StudyDashboardData['experience'] }>(`/study/sessions/${id}/complete-focus`, { method: 'POST' }),
  finish: (id: string, data: { questionsAnswered: number; correctAnswers: number; notes?: string }) =>
    jsonRequest<{ session: StudySession; feedback: string[]; experience: StudyDashboardData['experience'] }>(`/study/sessions/${id}/finish`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string, notes?: string) => jsonRequest<StudySession>(`/study/sessions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ notes }) }),
  active: () => jsonRequest<Partial<StudySession>>('/study/sessions/active'),
  startQuestionPractice: (planId:string,data:{mode:'FREE'|'POMODORO';focusMinutes:number;dailyTaskId?:string|null}) => jsonRequest<StudySession>('/study/sessions/questions', {
    method:'POST',body:JSON.stringify({planId,...data,device:navigator.userAgent.slice(0,150)})
  }),
  recordQuestion: (sessionId:string,questionId:string,correct:boolean) => jsonRequest<StudySession>(`/study/sessions/${sessionId}/questions`, {
    method:'POST',body:JSON.stringify({questionId,correct})
  }),
  finishQuestionPractice: (sessionId:string,notes?:string) => jsonRequest<{session:StudySession;feedback:string[]}>(`/study/sessions/${sessionId}/finish-questions`, {
    method:'POST',body:JSON.stringify({notes})
  }),
  skipOptionalQuestions: (taskId:string) => jsonRequest<StudyDashboardData>(`/study/tasks/${taskId}/skip-questions`, { method:'POST' }),
};

export const notificationsApi = {
  all: () => jsonRequest<Record<string, any>[]>('/notifications?unreadOnly=true'),
  read: (id: string) => jsonRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => jsonRequest<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),
};

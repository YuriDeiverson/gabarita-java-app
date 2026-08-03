import { supabase } from '../auth/supabase';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const nativeFetch=globalThis.fetch.bind(globalThis);
const fetch=async(input:RequestInfo|URL,init:RequestInit={}):Promise<Response>=>{
  const {data}=await supabase.auth.getSession();
  const headers=new Headers(init.headers);
  if(data.session?.access_token)headers.set('Authorization',`Bearer ${data.session.access_token}`);
  let response=await nativeFetch(input,{...init,headers});
  if(response.status===401&&data.session){
    const refreshed=await supabase.auth.refreshSession();
    const token=refreshed.data.session?.access_token;
    if(token&&token!==data.session.access_token){headers.set('Authorization',`Bearer ${token}`);response=await nativeFetch(input,{...init,headers});}
    if(response.status===401)window.dispatchEvent(new Event('gabarita:unauthorized'));
  }
  return response;
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
};

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
  created_at?: string;
  updated_at?: string;
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
  experience: { total_xp: number; level: number; level_name: string; current_level_xp: number; next_level_xp: number };
  reviews: Record<string, any>[]; next: Record<string, any>; roadmap: Record<string, any>[];
  notifications: Record<string, any>[]; unread_notifications: number;
}

// Study Plans API
export const studyPlansApi = {
  getAll: async (includeArchived = false): Promise<StudyPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans?includeArchived=${includeArchived}`);
    if (!response.ok) throw new Error('Failed to fetch study plans');
    return response.json();
  },

  getById: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`);
    if (!response.ok) throw new Error('Failed to fetch study plan');
    return response.json();
  },

  getActive: async (): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/active/current`);
    if (!response.ok) throw new Error('Failed to fetch active study plan');
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
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Não foi possível salvar o plano'));
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
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Não foi possível atualizar o plano'));
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'Failed to delete study plan'));
    }
  },

  activate: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/activate`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Não foi possível ativar o plano'));
  },

  duplicate: async (id: string, title?: string): Promise<StudyPlan> => {
    const query = title ? `?title=${encodeURIComponent(title)}` : '';
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/duplicate${query}`, { method: 'POST' });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to duplicate study plan'));
    return response.json();
  },

  archive: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/archive`, { method: 'PATCH' });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to archive study plan'));
    return response.json();
  },

  restore: async (id: string): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/restore`, { method: 'PATCH' });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to restore study plan'));
    return response.json();
  },

  history: async (id: string): Promise<Record<string, unknown>[]> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}/history`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch plan history'));
    return response.json();
  },
};

// Quiz Progress API
export const quizProgressApi = {
  getByStudyPlan: async (studyPlanId: string): Promise<QuizProgress[]> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch quiz progress');
    return response.json();
  },

  getById: async (id: string): Promise<QuizProgress> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`);
    if (!response.ok) throw new Error('Failed to fetch quiz progress');
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
    if (!response.ok) throw new Error('Failed to save quiz progress');
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
    if (!response.ok) throw new Error('Failed to update quiz progress');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete quiz progress');
  },

  deleteByStudyPlan: async (studyPlanId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/study-plan/${studyPlanId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete quiz progress');
  },

  getStats: async (studyPlanId: string): Promise<{
    total_answered: number;
    correct_answers: number;
    wrong_answers: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/quiz-progress/stats/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch quiz statistics');
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
    if (!response.ok) throw new Error('Failed to fetch schedule progress');
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
    if (!response.ok) throw new Error('Failed to save schedule progress');
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
    if (!response.ok) throw new Error('Failed to update schedule progress');
    return response.json();
  },

  deleteProgress: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/schedule/progress/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete schedule progress');
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
  });
  if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Não foi possível gerar o cronograma'));
  return response.json();
},

  getStats: async (studyPlanId: string): Promise<{
    total_blocks: number;
    completed_blocks: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/stats/${studyPlanId}`);
    if (!response.ok) throw new Error('Failed to fetch schedule statistics');
    return response.json();
  },

  regenerate: async (studyPlanId: string): Promise<{ blocksCreated: number; warning: string }> => {
    const response = await fetch(`${API_BASE_URL}/schedule/plans/${studyPlanId}/regenerate`, { method: 'POST' });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to regenerate schedule'));
    return response.json();
  },
};

export const questionsApi = {
  forCourse: async (courseId: string): Promise<import('../types').Question[]> => {
    const response = await fetch(`${API_BASE_URL}/questions/course/${encodeURIComponent(courseId)}`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch course questions'));
    const rows = await response.json();
    return rows.map((row: any) => {
      let options = row.options || row.alternatives;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch { options = undefined; }
      }
      return { id: row.id, category: row.category, board: row.board || row.exam_board,
        topic: row.topic || row.category, text: row.text,
        options: Array.isArray(options) ? options : undefined,
        correct: row.correct_option || row.correct, explanation: row.explanation, reference: row.reference,
        passageId: row.passage_id, passageTitle: row.passage_title, passageContent: row.passage_content };
    });
  },
  importLegacy: async (courseId: string, questions: unknown[]): Promise<{ imported: number; updated: number; total: number }> => {
    const response = await fetch(`${API_BASE_URL}/questions/import/legacy?courseId=${encodeURIComponent(courseId)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questions),
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to import legacy questions'));
    return response.json();
  },
};

export const simulationsApi = {
  create: async (data: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/simulations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to create simulation'));
    return response.json();
  },
  answer: async (id: string, data: { questionId: string; answer: unknown; timeSpentSeconds: number }) => {
    const response = await fetch(`${API_BASE_URL}/simulations/${id}/answers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to save answer'));
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
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch dashboard'));
    return response.json();
  },
};

const jsonRequest = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!response.ok) throw new Error(await getApiErrorMessage(response, 'A operação não foi concluída'));
  return response.json();
};

export const dailyStudyApi = {
  today: () => jsonRequest<StudyDashboardData>('/study/today'),
  start: (taskId: string, data: { mode: 'FREE'|'POMODORO'; pomodoro?: Record<string, unknown>; device?: string }) =>
    jsonRequest<StudySession>(`/study/tasks/${taskId}/start`, { method: 'POST', body: JSON.stringify(data) }),
  startReview: (topicId: string, data: { mode: 'FREE'|'POMODORO'; pomodoro?: Record<string, unknown>; device?: string }) =>
    jsonRequest<StudySession>(`/study/topics/${topicId}/review/start`, { method: 'POST', body: JSON.stringify(data) }),
  pause: (id: string, reason?: string) => jsonRequest<StudySession>(`/study/sessions/${id}/pause`, { method: 'POST', body: JSON.stringify({ reason }) }),
  resume: (id: string) => jsonRequest<StudySession>(`/study/sessions/${id}/resume`, { method: 'POST' }),
  finish: (id: string, data: { questionsAnswered: number; correctAnswers: number; notes?: string }) =>
    jsonRequest<{ session: StudySession; feedback: string[]; experience: StudyDashboardData['experience'] }>(`/study/sessions/${id}/finish`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string, notes?: string) => jsonRequest<StudySession>(`/study/sessions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ notes }) }),
  rebalance: (availableMinutes: number) => jsonRequest<StudyDashboardData>('/study/today/rebalance', { method: 'POST', body: JSON.stringify({ availableMinutes }) }),
  active: () => jsonRequest<Partial<StudySession>>('/study/sessions/active'),
  startQuestionPractice: (planId:string,focusMinutes:number,dailyTaskId?:string|null) => jsonRequest<StudySession>('/study/sessions/questions', {
    method:'POST',body:JSON.stringify({planId,focusMinutes,dailyTaskId,device:navigator.userAgent.slice(0,150)})
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

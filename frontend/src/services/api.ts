export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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
    studySections: any[];
    scheduleWeeks: any[];
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create study plan');
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
    studySections: any[];
    scheduleWeeks: any[];
  }): Promise<StudyPlan> => {
    const response = await fetch(`${API_BASE_URL}/study-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update study plan');
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
    if (!response.ok) throw new Error('Failed to activate study plan');
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
  if (!response.ok) throw new Error('Failed to generate schedule');
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
    return rows.map((row: any) => ({ id: row.id, category: row.category, topic: row.topic || row.category, text: row.text,
      correct: row.correct, explanation: row.explanation, reference: row.reference,
      passageId: row.passage_id, passageTitle: row.passage_title, passageContent: row.passage_content }));
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

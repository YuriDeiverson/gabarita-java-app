import { COURSES_CONFIG, DISCURSIVE_TOPIC_ID, generateCustomPlan } from './data/generator';
import { API_BASE_URL, questionsApi, scheduleApi, studyPlansApi } from './services/api';

export type CareerContestId = 'policia_civil' | 'fapeal' | 'sesau_al' | 'seplag';

export interface StudyPreferences {
  examDate: string;
  selectedWeekdays: number[];
  hoursByWeekday: Record<number, number>;
  hoursPerDay: number;
  blockMinutes: number;
}

export interface CareerRole {
  id: string;
  label: string;
  courseId: string;
  board: string;
  includeDiscursive?: boolean;
  requirement?: string;
  remuneration?: string;
  vacancies?: string;
  estimatedHours?: number;
  sharedTopics?: string[];
}

export interface CareerContest {
  id: CareerContestId;
  label: string;
  acronym: string;
  organization: string;
  description: string;
  board: string;
  examDate?: string;
  status: string;
  state: string;
  area: string;
  education: string;
  vacancies: string;
  remuneration: string;
  location: string;
  stages: string;
  noticeReference: string;
  roles: CareerRole[];
}

export const CAREER_CONTESTS: CareerContest[] = [
  {
    id: 'policia_civil',
    label: 'Polícia Civil de Alagoas',
    acronym: 'PC-AL',
    organization: 'Polícia Civil do Estado de Alagoas',
    description: 'Carreiras policiais do Estado de Alagoas.',
    board: 'CEBRASPE', examDate: '2026-12-06', status: 'Inscrições abertas', state: 'Alagoas',
    area: 'Segurança Pública', education: 'Nível superior', vacancies: 'Conforme edital',
    remuneration: 'Conforme o cargo e o edital', location: 'Estado de Alagoas',
    stages: 'Prova objetiva e demais etapas previstas para a carreira policial.',
    noticeReference: 'Edital da Polícia Civil de Alagoas cadastrado no sistema.',
    roles: [
      { id: 'pc-agente', label: 'Agente de Polícia Civil', courseId: 'policial_civil', board: 'CEBRASPE' },
      { id: 'pc-escrivao', label: 'Escrivão de Polícia Civil', courseId: 'policial_civil', board: 'CEBRASPE' },
    ],
  },
  {
    id: 'fapeal',
    label: 'FAPEAL',
    acronym: 'FAPEAL',
    organization: 'Fundação de Amparo à Pesquisa do Estado de Alagoas',
    description: 'Fundação de Amparo à Pesquisa do Estado de Alagoas.',
    board: 'CEBRASPE', examDate: '2026-08-16', status: 'Prova próxima', state: 'Alagoas',
    area: 'Ciência, Tecnologia e Gestão', education: 'Nível superior específico', vacancies: 'Conforme edital',
    remuneration: 'Conforme o cargo e o edital', location: 'Alagoas',
    stages: 'Prova objetiva e etapas previstas no edital da fundação.',
    noticeReference: 'Edital FAPEAL 2026 cadastrado no sistema.',
    roles: [
      { id: 'fapeal-jornalismo', label: 'Gestor Especializado em Ciência e Tecnologia — Jornalismo', courseId: 'jornalismo', board: 'CEBRASPE', includeDiscursive: true },
      { id: 'fapeal-ti', label: 'Gestor Especializado em Ciência e Tecnologia — Tecnologia da Informação', courseId: 'seplag_informatica', board: 'CEBRASPE', includeDiscursive: true },
    ],
  },
  {
    id: 'sesau_al',
    label: 'SESAU AL',
    acronym: 'SESAU-AL',
    organization: 'Secretaria de Estado da Saúde de Alagoas',
    description: 'Secretaria de Estado da Saúde de Alagoas.',
    board: 'CEBRASPE', status: 'Edital cadastrado', state: 'Alagoas', area: 'Saúde',
    education: 'Nível técnico', vacancies: 'Conforme edital', remuneration: 'Conforme o cargo e o edital',
    location: 'Estado de Alagoas', stages: 'Prova objetiva e demais etapas previstas no edital.',
    noticeReference: 'Conteúdo programático da SESAU AL cadastrado no sistema.',
    roles: [
      { id: 'sesau-tecnico', label: 'Técnico em Enfermagem', courseId: 'tecnico_enfermagem', board: 'CEBRASPE', includeDiscursive: true },
    ],
  },
  {
    id: 'seplag',
    label: 'SEPLAG',
    acronym: 'SEPLAG-AL',
    organization: 'Secretaria de Estado do Planejamento, Gestão e Patrimônio',
    description: 'Secretaria de Estado do Planejamento, Gestão e Patrimônio.',
    board: 'CEBRASPE', status: 'Edital cadastrado', state: 'Alagoas', area: 'Gestão e Tecnologia',
    education: 'Nível superior específico', vacancies: 'Conforme edital', remuneration: 'Conforme o cargo e o edital',
    location: 'Estado de Alagoas', stages: 'Prova objetiva e demais etapas previstas no edital.',
    noticeReference: 'Conteúdo programático da SEPLAG cadastrado no sistema.',
    roles: [
      { id: 'seplag-especialista-ti', label: 'Especialista em Gestão Pública — Tecnologia da Informação', courseId: 'seplag_informatica', board: 'CEBRASPE', includeDiscursive: true },
    ],
  },
];

export const preferencesStorageKey = (userId?: string) => `career_study_preferences:${userId || 'local'}`;

export const loadStudyPreferences = (userId?: string): StudyPreferences | null => {
  try {
    const stored = localStorage.getItem(preferencesStorageKey(userId));
    const legacy = localStorage.getItem('study_config');
    const parsed = JSON.parse(stored || legacy || 'null');
    if (!parsed?.examDate || !Array.isArray(parsed.selectedWeekdays) || parsed.selectedWeekdays.length === 0) return null;
    return {
      examDate: parsed.examDate,
      selectedWeekdays: parsed.selectedWeekdays,
      hoursByWeekday: Object.fromEntries(Object.entries(parsed.hoursByWeekday || {}).map(([day, hours]) => [day, Math.max(1, Math.round(Number(hours || 1)))])),
      hoursPerDay: Math.max(1, Math.round(Number(parsed.hoursPerDay || 4))),
      blockMinutes: 60,
    };
  } catch {
    return null;
  }
};

export const saveStudyPreferences = (preferences: StudyPreferences, userId?: string) => {
  localStorage.setItem(preferencesStorageKey(userId), JSON.stringify({ ...preferences, blockMinutes: 60 }));
};

const shouldUseRemoteApi = () => {
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return !(isLocalhost && /^https?:\/\//.test(API_BASE_URL));
};

const calculateStudyDays = (examDate: string, weekdays: number[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${examDate}T00:00:00`);
  let count = 0;
  for (const date = new Date(today); date <= exam; date.setDate(date.getDate() + 1)) {
    if (weekdays.includes(date.getDay())) count++;
  }
  return count;
};

export const topicIdsForCareer = (contestId: CareerContestId, role: CareerRole) => {
  const topics = COURSES_CONFIG[role.courseId].topics;
  return topics
    .filter(topic => topic.id !== 'legislacao_especifica_fapeal' || contestId === 'fapeal')
    .filter(topic => topic.id !== DISCURSIVE_TOPIC_ID || role.includeDiscursive)
    .map(topic => topic.id);
};

const weekdayName: Record<number, string> = {
  0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado',
};

export async function createAutomaticCareerPlan(
  contest: CareerContest,
  role: CareerRole,
  preferences: StudyPreferences,
) {
  const blockMinutes = 60;
  const examDate = contest.examDate || preferences.examDate;
  const selectedTopicIds = topicIdsForCareer(contest.id, role);
  const selectedSubtopicIds = COURSES_CONFIG[role.courseId].topics
    .filter(topic => selectedTopicIds.includes(topic.id))
    .flatMap(topic => topic.subtopics.map(subtopic => `${topic.id}::${subtopic}`));
  const totalDays = calculateStudyDays(examDate, preferences.selectedWeekdays);
  const generated = generateCustomPlan(
    role.courseId,
    examDate,
    totalDays,
    preferences.hoursPerDay,
    selectedTopicIds,
    preferences.selectedWeekdays,
    selectedSubtopicIds,
    [],
  );
  if (!generated.success || generated.sections.length === 0) throw new Error('Não foi possível montar o conteúdo deste cargo.');

  let scheduleWeeks = generated.weeks;
  let studyPlanId: string | null = null;
  if (shouldUseRemoteApi()) {
    const schedule = await scheduleApi.generate({
      courseId: role.courseId,
      examDate,
      studyDays: preferences.selectedWeekdays.map(day => ({
        day: weekdayName[day],
        hours: preferences.hoursByWeekday[day] || preferences.hoursPerDay,
      })),
      studySections: generated.sections,
      blockMinutes,
    });
    scheduleWeeks = schedule.scheduleWeeks;

    const payload = {
      courseId: role.courseId,
      title: role.label,
      examDate,
      hoursPerDay: preferences.hoursPerDay,
      daysPerWeek: preferences.selectedWeekdays.length,
      totalWeeks: scheduleWeeks.length,
      blockMinutes,
      breakMinutes: 10,
      studySections: generated.sections,
      scheduleWeeks,
      settings: {
        contest: contest.id,
        examBoard: role.board,
        targetRole: role.label,
        selectedWeekdays: preferences.selectedWeekdays,
        hoursByWeekday: preferences.hoursByWeekday,
        hasDiscursiveExam: Boolean(role.includeDiscursive),
        automaticCurriculum: true,
      },
    };
    let existingPlanId: string | null = null;
    try {
      existingPlanId = JSON.parse(localStorage.getItem(`${role.courseId}_study_config`) || '{}').studyPlanId || null;
    } catch {}
    const plan = existingPlanId && !String(existingPlanId).startsWith('local-')
      ? await studyPlansApi.update(existingPlanId, payload)
      : await studyPlansApi.create(payload);
    await studyPlansApi.activate(plan.id);
    studyPlanId = plan.id;
    try {
      await questionsApi.importLegacy(role.courseId, generated.questions);
    } catch (error) {
      console.warn('Plano criado, mas algumas questões serão importadas novamente depois.', error);
    }
  }

  const config = {
    examDate,
    examBoard: role.board,
    complementaryBoards: [],
    contest: contest.id,
    targetRole: role.label,
    hasDiscursiveExam: Boolean(role.includeDiscursive),
    totalDays,
    hoursPerDay: preferences.hoursPerDay,
    selectedWeekdays: preferences.selectedWeekdays,
    hoursByWeekday: preferences.hoursByWeekday,
    blockMinutes,
    selectedTopics: selectedTopicIds,
    selectedSubtopics: selectedSubtopicIds,
    automaticCurriculum: true,
    studyPlanId,
  };

  localStorage.removeItem('study_plan_deleted');
  localStorage.setItem(`${role.courseId}_study_sections`, JSON.stringify(generated.sections));
  localStorage.setItem(`${role.courseId}_quiz_questions`, JSON.stringify(generated.questions));
  localStorage.setItem(`${role.courseId}_schedule_weeks`, JSON.stringify(scheduleWeeks));
  localStorage.setItem(`${role.courseId}_study_config`, JSON.stringify(config));
  localStorage.removeItem(`${role.courseId}_study_schedule_progress`);
  localStorage.removeItem(`${role.courseId}_quiz_answers`);
  localStorage.setItem('active_course', role.courseId);
  localStorage.setItem('custom_study_sections', JSON.stringify(generated.sections));
  localStorage.setItem('custom_quiz_questions', JSON.stringify(generated.questions));
  localStorage.setItem('custom_schedule_weeks', JSON.stringify(scheduleWeeks));
  localStorage.setItem('study_config', JSON.stringify(config));
  localStorage.removeItem('study_schedule_progress');
  localStorage.removeItem('quiz_answers');
  localStorage.removeItem('quiz_answer_history');
  localStorage.removeItem('quiz_answer_events');
  localStorage.removeItem('active_quiz_questions_cache');
  return { courseId: role.courseId, selectedTopicIds, selectedSubtopicIds };
}

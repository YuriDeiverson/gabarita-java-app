import { scheduleApi, studyPlansApi } from './services/api';
import { StudySection } from './types';

export type CareerContestId = string;

export interface CourseTopic {
  id: string;
  title: string;
  category: string;
  subtopics: string[];
}

export interface StudyPreferences {
  selectedWeekdays: number[];
  hoursByWeekday: Record<number, number>;
  hoursPerDay: number;
  blockMinutes: number;
}

export interface CareerRole {
  databaseId?: string;
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
  curriculum?: { topics?: CourseTopic[]; studySections?: StudySection[] };
}

export interface CareerContest {
  databaseId?: string;
  id: CareerContestId;
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
  roles: CareerRole[];
}

export const localTodayIso = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

export const isContestAvailable = (contest: CareerContest, today = localTodayIso()) =>
  contest.examDate >= today;

export const preferencesStorageKey = (userId?: string) => `career_study_preferences:${userId || 'local'}`;

export const loadStudyPreferences = (userId?: string): StudyPreferences | null => {
  try {
    const stored = localStorage.getItem(preferencesStorageKey(userId));
    const legacy = localStorage.getItem('study_config');
    const parsed = JSON.parse(stored || legacy || 'null');
    if (!Array.isArray(parsed?.selectedWeekdays) || parsed.selectedWeekdays.length === 0) return null;
    return {
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

const calculateStudyDays = (examDate: string, weekdays: number[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${examDate}T00:00:00`);
  let count = 0;
  for (const date = new Date(today); date <= exam; date.setDate(date.getDate() + 1)) {
    if (weekdays.includes(date.getDay())) count += 1;
  }
  return count;
};

export const topicsForCareerRole = (role: CareerRole) => role.curriculum?.topics || [];

export const topicIdsForCareer = (_contestId: CareerContestId, role: CareerRole) =>
  topicsForCareerRole(role)
    .filter(topic => topic.id !== 'atualidades_discursiva' || role.includeDiscursive)
    .map(topic => topic.id);

const weekdayName: Record<number, string> = {
  0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sabado',
};

export async function createAutomaticCareerPlan(
  contest: CareerContest,
  role: CareerRole,
  preferences: StudyPreferences,
) {
  if (!isContestAvailable(contest)) throw new Error('A prova deste concurso já foi realizada e a preparação não está mais disponível.');
  const topics = topicsForCareerRole(role);
  const allSections = role.curriculum?.studySections || [];
  if (topics.length === 0 || allSections.length === 0) {
    throw new Error('O conteúdo programático deste cargo ainda não foi cadastrado no PostgreSQL.');
  }

  const selectedTopicIds = topicIdsForCareer(contest.id, role);
  const selectedSubtopicIds = topics
    .filter(topic => selectedTopicIds.includes(topic.id))
    .flatMap(topic => topic.subtopics.map(subtopic => `${topic.id}::${subtopic}`));
  const selectedSections = allSections.filter(section =>
    selectedTopicIds.includes(section.id) ||
    topics.some(topic => selectedTopicIds.includes(topic.id) && topic.title === section.title),
  );
  const studySections = selectedSections.length > 0 ? selectedSections : allSections;
  const examDate = contest.examDate;
  const totalDays = calculateStudyDays(examDate, preferences.selectedWeekdays);
  const blockMinutes = 60;

  const schedule = await scheduleApi.generate({
    courseId: role.courseId,
    examDate,
    studyDays: preferences.selectedWeekdays.map(day => ({
      day: weekdayName[day],
      hours: preferences.hoursByWeekday[day] || preferences.hoursPerDay,
    })),
    studySections,
    blockMinutes,
  });
  const scheduleWeeks = schedule.scheduleWeeks;
  const payload = {
    courseId: role.courseId,
    title: role.label,
    examDate,
    hoursPerDay: preferences.hoursPerDay,
    daysPerWeek: preferences.selectedWeekdays.length,
    totalWeeks: scheduleWeeks.length,
    blockMinutes,
    breakMinutes: 10,
    studySections,
    scheduleWeeks,
    settings: {
      contest: contest.id,
      catalogRoleId: role.databaseId,
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
    const existing = JSON.parse(localStorage.getItem(`${role.courseId}_study_config`) || '{}');
    if (existing.examDate >= localTodayIso() && existing.contest === contest.id) existingPlanId = existing.studyPlanId || null;
  } catch {}
  if (!existingPlanId) {
    const reusable = (await studyPlansApi.getAll(false)).find(plan =>
      (plan.course_id || plan.courseId) === role.courseId &&
      (plan.exam_date || plan.examDate) === examDate && plan.title === role.label,
    );
    existingPlanId = reusable?.id || null;
  }
  const plan = existingPlanId && !String(existingPlanId).startsWith('local-')
    ? await studyPlansApi.update(existingPlanId, payload)
    : await studyPlansApi.create(payload);
  await studyPlansApi.activate(plan.id);

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
    studyPlanId: plan.id,
  };

  localStorage.removeItem('study_plan_deleted');
  localStorage.setItem(`${role.courseId}_study_config`, JSON.stringify(config));
  localStorage.removeItem(`${role.courseId}_study_sections`);
  localStorage.removeItem(`${role.courseId}_schedule_weeks`);
  localStorage.removeItem(`${role.courseId}_quiz_questions`);
  localStorage.removeItem(`${role.courseId}_study_schedule_progress`);
  localStorage.removeItem(`${role.courseId}_quiz_answers`);
  localStorage.setItem('active_course', role.courseId);
  localStorage.setItem('study_config', JSON.stringify(config));
  localStorage.removeItem('custom_study_sections');
  localStorage.removeItem('custom_schedule_weeks');
  localStorage.removeItem('custom_quiz_questions');
  localStorage.removeItem('study_schedule_progress');
  localStorage.removeItem('quiz_answers');
  localStorage.removeItem('quiz_answer_history');
  localStorage.removeItem('quiz_answer_events');
  localStorage.removeItem('active_quiz_questions_cache');
  return { courseId: role.courseId, selectedTopicIds, selectedSubtopicIds };
}

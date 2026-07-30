import { useState, useEffect, useMemo, MouseEvent } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { COURSES_CONFIG, DISCURSIVE_TOPIC_ID, generateCustomPlan } from '../data/generator';
import { API_BASE_URL, studyPlansApi, scheduleApi, questionsApi, StudyPlan } from '../services/api';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  Settings2, 
  Award, 
  Info, 
  HeartPulse, 
  GraduationCap, 
  ArrowLeft, 
  ArrowRight,
  Trash2, 
  Play, 
  Check,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const getTodayIso = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const EXAM_BOARDS = ['CEBRASPE', 'FGV', 'FCC', 'VUNESP', 'Instituto AOCP', 'IBFC', 'IDECAN', 'Quadrix'];

const CONTEST_OPTIONS = [
  { value: 'seplag', label: 'SEPLAG' },
  { value: 'fapeal', label: 'FAPEAL' },
  { value: 'al_previdencia', label: 'AL PREVIDÊNCIA' },
  { value: 'sesau_al', label: 'SESAU AL' },
] as const;

type ContestId = typeof CONTEST_OPTIONS[number]['value'];
const contestLabel = (contest: ContestId) => CONTEST_OPTIONS.find(option => option.value === contest)?.label || contest;

const CONTEST_TOPIC_IDS: Record<ContestId, string[]> = {
  seplag: [],
  fapeal: ['legislacao_especifica_fapeal'],
  al_previdencia: [],
  sesau_al: [],
};

const ALL_CONTEST_TOPIC_IDS = new Set(Object.values(CONTEST_TOPIC_IDS).flat());
const topicsForContest = <T extends { id: string }>(topics: T[], contest: ContestId) => topics.filter(topic =>
  !ALL_CONTEST_TOPIC_IDS.has(topic.id) || CONTEST_TOPIC_IDS[contest].includes(topic.id)
);

const topicsForPlan = <T extends { id: string }>(
  topics: T[],
  contest: ContestId,
  role: string,
  hasDiscursiveExam: boolean,
) => topicsForContest(topics, contest).filter(topic =>
  (topic.id !== 'sus_saude_publica' || role === 'Técnico em Enfermagem') &&
  (topic.id !== DISCURSIVE_TOPIC_ID || hasDiscursiveExam)
);

const inferLegacyContest = (courseId: string, selectedTopicIds: string[] = []): ContestId => {
  if (selectedTopicIds.includes('legislacao_especifica_fapeal')) return 'fapeal';
  if (courseId === 'tecnico_enfermagem') return 'sesau_al';
  return 'seplag';
};

const ROLE_OPTIONS = [
  { value: 'seplag_informatica', label: 'Especialista em Gestão Pública - Tecnologia da Informação' },
  { value: 'seplag_informatica', label: 'Analista de Tecnologia da Informação' },
  { value: 'seplag_informatica', label: 'Desenvolvedor de Sistemas' },
  { value: 'tecnico_enfermagem', label: 'Técnico em Enfermagem' },
  { value: 'tecnico_enfermagem', label: 'Enfermeiro' },
  { value: 'jornalismo', label: 'Jornalista / Analista de Comunicação' },
  { value: 'jornalismo', label: 'Assessor de Comunicação' },
  { value: 'jornalismo', label: 'Gestor Especializado em Ciência e Tecnologia - Jornalismo' },
];

const SORTED_ROLE_OPTIONS = [...ROLE_OPTIONS].sort((first, second) =>
  first.label.localeCompare(second.label, 'pt-BR', { sensitivity: 'base' })
);

const normalizeSearchText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

const formatIsoDateToBr = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

const formatDateToIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const maskBrDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const parseBrDateToIso = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const subtopicKey = (topicId: string, subtopic: string) => `${topicId}::${subtopic}`;

const reconcileSavedSubtopics = (
  topics: Array<{ id: string; subtopics: string[] }>,
  selectedTopicIds: string[],
  savedSubtopicIds: string[],
) => topics.flatMap(topic => {
  if (!selectedTopicIds.includes(topic.id)) return [];
  const currentKeys = topic.subtopics.map(subtopic => subtopicKey(topic.id, subtopic));
  const validSavedKeys = savedSubtopicIds.filter(key => currentKeys.includes(key));
  if (validSavedKeys.length > 0) return validSavedKeys;

  const hadPreviousCurriculumSelection = savedSubtopicIds.some(key => key.startsWith(`${topic.id}::`));
  return hadPreviousCurriculumSelection ? currentKeys : [];
});

interface HomeTabProps {
  onPlanGenerated: (courseId: string) => void;
  onPlansChanged?: () => void;
  onBeforeCreatePlan?: () => Promise<boolean>;
}

export default function HomeTab({ onPlanGenerated, onPlansChanged, onBeforeCreatePlan }: HomeTabProps) {
  const [screen, setScreen] = useState<'selection' | 'configure'>('selection');
  const [configurationMode, setConfigurationMode] = useState<'create' | 'edit'>('create');
  const [startingNewPlan, setStartingNewPlan] = useState(false);
  const [configStep, setConfigStep] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<string>('jornalismo');

  // Configuration States (loaded dynamically per course when configuring)
  const [examDate, setExamDate] = useState<string>(getTodayIso);
  const [examDateDisplay, setExamDateDisplay] = useState<string>(() => formatIsoDateToBr(getTodayIso()));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [examBoard, setExamBoard] = useState<string>('CEBRASPE');
  const [complementaryBoards, setComplementaryBoards] = useState<string[]>([]);
  const [selectedContest, setSelectedContest] = useState<ContestId>('seplag');
  const [targetRole, setTargetRole] = useState<string>('Jornalista / Analista de Comunicação');
  const [hasDiscursiveExam, setHasDiscursiveExam] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday
  const [hoursPerDayInput, setHoursPerDayInput] = useState<string>('4');
  const [hoursByWeekday, setHoursByWeekday] = useState<Record<number, number>>({});
  const [blockMinutes, setBlockMinutes] = useState<number>(60);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<string[]>([]);
  const [expandedTopicIds, setExpandedTopicIds] = useState<string[]>([]);

  // List of active plans stats
  const [savedPlans, setSavedPlans] = useState<{ [key: string]: any }>({});
  const hasSavedPlans = Object.keys(savedPlans).length > 0;

  const weekdayOptions = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
];

const WEEKDAY_NUMBER_TO_NAME: { [key: number]: string } = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

  const shouldUseRemoteApi = () => {
    if (typeof window === 'undefined') return true;
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return !(isLocalhost && /^https?:\/\//.test(API_BASE_URL));
  };

  // Calculate the available study days from the user's current date.
  const calculateStudyDays = (examDateStr: string, weekdays: number[]): number => {
    const today = new Date(`${getTodayIso()}T00:00:00`);
    const exam = new Date(examDateStr);
    if (exam < today || weekdays.length === 0) return 0;
    
    let count = 0;
    let tempDate = new Date(today);
    while (tempDate <= exam) {
      if (weekdays.includes(tempDate.getDay())) {
        count++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return count;
  };

  const getCoursePlanStats = (courseId: string, remotePlan?: StudyPlan) => {
    const configSaved = localStorage.getItem(`${courseId}_study_config`);
    const sectionsSaved = localStorage.getItem(`${courseId}_study_sections`);
    const questionsSaved = localStorage.getItem(`${courseId}_quiz_questions`);
    const weeksSaved = localStorage.getItem(`${courseId}_schedule_weeks`);
    if (!configSaved || !sectionsSaved || !questionsSaved || !weeksSaved) return null;

    let examDateStr = '';
    let hoursPerDayNum = 0;
    let totalDaysNum = 0;
    let weekdaysArr: number[] = [];
    let examBoardStr = '';
    let contestStr: ContestId = 'seplag';
    let targetRoleStr = '';

    try {
      const parsed = JSON.parse(configSaved);
      examDateStr = parsed.examDate;
      hoursPerDayNum = parsed.hoursPerDay;
      totalDaysNum = parsed.totalDays;
      weekdaysArr = parsed.selectedWeekdays || [1, 2, 3, 4, 5];
      examBoardStr = parsed.examBoard || 'CEBRASPE';
      contestStr = parsed.contest || inferLegacyContest(courseId, parsed.selectedTopics);
      targetRoleStr = parsed.targetRole || '';
    } catch (e) {}

    let totalBlocks = 0;
    let completedBlocks = 0;

    try {
      const weeks = JSON.parse(weeksSaved);
      weeks.forEach((w: any) => {
        totalBlocks += (w.blocks || []).length;
      });
    } catch (e) {}

    const progressSaved = localStorage.getItem(`${courseId}_study_schedule_progress`);
    if (progressSaved) {
      try {
        const progress = JSON.parse(progressSaved);
        completedBlocks = Object.keys(progress).filter(key => progress[key]).length;
      } catch (e) {}
    }

    const remoteTotal = Number(remotePlan?.total_topics || 0);
    if (remoteTotal > 0) {
      totalBlocks = remoteTotal;
      completedBlocks = Math.min(remoteTotal, Math.max(0, Number(remotePlan?.completed_topics || 0)));
    }

    return {
      examDate: examDateStr,
      hoursPerDay: hoursPerDayNum,
      totalDays: totalDaysNum,
      selectedWeekdays: weekdaysArr,
      examBoard: examBoardStr,
      contest: contestStr,
      targetRole: targetRoleStr,
      totalBlocks,
      completedBlocks,
      percentage: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
    };
  };

  const loadSavedPlans = (remotePlans: StudyPlan[] = []) => {
    if (localStorage.getItem('study_plan_deleted') === 'true') {
      setSavedPlans({});
      return;
    }
    const plans: { [key: string]: any } = {};
    ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo'].forEach(courseId => {
      let studyPlanId = '';
      try {
        const config = JSON.parse(localStorage.getItem(`${courseId}_study_config`) || '{}');
        studyPlanId = String(config.studyPlanId || '');
      } catch {}
      const remotePlan = remotePlans.find(plan => String(plan.id) === studyPlanId);
      const stats = getCoursePlanStats(courseId, remotePlan);
      if (stats) {
        plans[courseId] = stats;
      }
    });
    setSavedPlans(plans);
  };

  useEffect(() => {
    loadSavedPlans();
  }, []);

  useEffect(() => {
    let cancelled = false;

    studyPlansApi.getAll(false).then(remotePlans => {
      if (cancelled || localStorage.getItem('study_plan_deleted') === 'true') return;

      const remoteIds = new Set(remotePlans.map(plan => String(plan.id)));
      const staleCourses = ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo'].filter(courseId => {
        const rawConfig = localStorage.getItem(`${courseId}_study_config`);
        if (!rawConfig) return false;
        try {
          const planId = JSON.parse(rawConfig).studyPlanId;
          return Boolean(planId && !String(planId).startsWith('local-') && !remoteIds.has(String(planId)));
        } catch {
          return false;
        }
      });

      loadSavedPlans(remotePlans);
      if (staleCourses.length === 0) return;

      staleCourses.forEach(courseId => {
        [
          'study_sections', 'quiz_questions', 'schedule_weeks', 'study_config',
          'study_schedule_progress', 'quiz_answers'
        ].forEach(key => localStorage.removeItem(`${courseId}_${key}`));
      });

      if (staleCourses.includes(localStorage.getItem('active_course') || '')) {
        [
          'active_course', 'custom_study_sections', 'custom_quiz_questions',
          'custom_schedule_weeks', 'study_config', 'study_schedule_progress',
          'quiz_answers', 'quiz_answer_history', 'quiz_answer_events',
          'active_quiz_questions_cache'
        ].forEach(key => localStorage.removeItem(key));
      }

      const stillHasLocalPlan = ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo']
        .some(courseId => localStorage.getItem(`${courseId}_study_config`));
      if (!stillHasLocalPlan) localStorage.setItem('study_plan_deleted', 'true');

      loadSavedPlans();
      onPlansChanged?.();
    }).catch(() => {
      // Keep offline/local plans intact when the API cannot be reached.
    });

    return () => { cancelled = true; };
  }, []);

  // Compute live study days on configuration screen
  const calculatedDays = useMemo(() => {
    return calculateStudyDays(examDate, selectedWeekdays);
  }, [examDate, selectedWeekdays]);

  const filteredRoleOptions = useMemo(() => {
    const query = normalizeSearchText(roleSearch.trim());
    if (!query) return SORTED_ROLE_OPTIONS;
    return SORTED_ROLE_OPTIONS.filter(role => normalizeSearchText(role.label).includes(query));
  }, [roleSearch]);

  const applyExamDate = (isoDate: string) => {
    setExamDate(isoDate);
    setExamDateDisplay(formatIsoDateToBr(isoDate));
  };

  const handleExamDateChange = (value: string) => {
    const maskedValue = maskBrDate(value);
    setExamDateDisplay(maskedValue);
    setExamDate(parseBrDateToIso(maskedValue));
  };

  const normalizedHoursPerDay = useMemo(() => {
    const parsed = Number(hoursPerDayInput);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(24, Math.max(1, parsed));
  }, [hoursPerDayInput]);

  const weeklyHours = useMemo(() => {
    return selectedWeekdays.reduce((total, day) => total + (hoursByWeekday[day] || normalizedHoursPerDay), 0);
  }, [hoursByWeekday, normalizedHoursPerDay, selectedWeekdays]);

  const totalAvailableHours = useMemo(() => {
    if (selectedWeekdays.length === 0) return 0;
    const averageDayHours = weeklyHours / selectedWeekdays.length;
    return Math.round(calculatedDays * averageDayHours);
  }, [calculatedDays, selectedWeekdays.length, weeklyHours]);

  const handleHoursPerDayChange = (value: string) => {
    if (value === '') {
      setHoursPerDayInput('');
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const normalized = Math.min(24, Math.max(0, parsed));
    setHoursPerDayInput(String(normalized));
    if (normalized > 0) {
      setHoursByWeekday(current => {
        const updated = { ...current };
        selectedWeekdays.forEach(day => { updated[day] = normalized; });
        return updated;
      });
    }
  };

  const commitHoursPerDay = () => {
    setHoursPerDayInput(String(normalizedHoursPerDay));
  };

  // Load configuration for a specific course to edit
  const handleOpenConfigure = (courseId: string, mode: 'create' | 'edit') => {
    setConfigurationMode(mode);
    setSelectedCourse(courseId);
    const config = COURSES_CONFIG[courseId];
    const defaultRole = ROLE_OPTIONS.find(role => role.value === courseId)?.label || config.name;
    
    // Attempt to load existing config
    const savedConfigStr = mode === 'edit' ? localStorage.getItem(`${courseId}_study_config`) : null;
    if (savedConfigStr) {
      try {
        const parsed = JSON.parse(savedConfigStr);
        const savedTopicIds: string[] = parsed.selectedTopics || config.topics.map(topic => topic.id);
        const restoredContest = CONTEST_OPTIONS.find(option => option.value === parsed.contest)?.value
          || inferLegacyContest(courseId, savedTopicIds);
        const restoredRole = parsed.targetRole || defaultRole;
        const restoredDiscursive = parsed.hasDiscursiveExam ?? savedTopicIds.includes(DISCURSIVE_TOPIC_ID);
        const contestTopics = topicsForPlan(config.topics, restoredContest, restoredRole, restoredDiscursive);
        const validTopicIds = new Set(contestTopics.map(topic => topic.id));
        const restoredTopicIds = savedTopicIds.filter(topicId => validTopicIds.has(topicId));
        const restoredSubtopicIds = parsed.selectedSubtopics || contestTopics.flatMap(topic => topic.subtopics.map(subtopic => subtopicKey(topic.id, subtopic)));
        applyExamDate(parsed.examDate || getTodayIso());
        const restoredExamBoard = parsed.examBoard || 'CEBRASPE';
        setExamBoard(restoredExamBoard);
        setComplementaryBoards(Array.isArray(parsed.complementaryBoards)
          ? parsed.complementaryBoards.filter((board: unknown) => typeof board === 'string' && board !== restoredExamBoard)
          : []);
        setSelectedContest(restoredContest);
        setTargetRole(restoredRole);
        setHasDiscursiveExam(restoredDiscursive);
        setSelectedWeekdays(parsed.selectedWeekdays || [1, 2, 3, 4, 5]);
        setHoursPerDayInput(String(Math.max(1, parsed.hoursPerDay || 4)));
        setHoursByWeekday(parsed.hoursByWeekday || {});
        setBlockMinutes(parsed.blockMinutes || 60);
        setSelectedTopicIds(restoredTopicIds);
        setSelectedSubtopicIds(reconcileSavedSubtopics(contestTopics, restoredTopicIds, restoredSubtopicIds));
      } catch (e) {
        // Fallbacks
        const contest: ContestId = 'seplag';
        applyExamDate(getTodayIso());
        setExamBoard('CEBRASPE');
        setComplementaryBoards([]);
        setSelectedContest(contest);
        setTargetRole(defaultRole);
        setHasDiscursiveExam(false);
        setSelectedWeekdays([1, 2, 3, 4, 5]);
        setHoursPerDayInput('4');
        setHoursByWeekday({});
        setBlockMinutes(60);
        setSelectedTopicIds([]);
        setSelectedSubtopicIds([]);
      }
    } else {
      // Defaults
      const contest: ContestId = 'seplag';
      applyExamDate(getTodayIso());
      setExamBoard('CEBRASPE');
      setComplementaryBoards([]);
      setSelectedContest(contest);
      setTargetRole(defaultRole);
      setHasDiscursiveExam(false);
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setHoursPerDayInput('4');
      setHoursByWeekday({});
      setBlockMinutes(60);
      setSelectedTopicIds([]);
      setSelectedSubtopicIds([]);
    }
    setExpandedTopicIds([]);
    setConfigStep(1);
    setScreen('configure');
  };

  const handleStartNewPlan = async (courseId: string) => {
    if (startingNewPlan) return;
    setStartingNewPlan(true);
    try {
      if (onBeforeCreatePlan && !(await onBeforeCreatePlan())) return;
      handleOpenConfigure(courseId, 'create');
    } finally {
      setStartingNewPlan(false);
    }
  };

  const handleWeekdayToggle = (value: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value].sort()
    );
    setHoursByWeekday(prev => ({ ...prev, [value]: prev[value] || normalizedHoursPerDay }));
  };

  const handleExamBoardChange = (board: string) => {
    setExamBoard(board);
    setComplementaryBoards(current => current.filter(item => item !== board));
  };

  const handleComplementaryBoardToggle = (board: string) => {
    if (board === examBoard) return;
    setComplementaryBoards(current => current.includes(board)
      ? current.filter(item => item !== board)
      : [...current, board]
    );
  };

  const handleContestChange = (contest: ContestId) => {
    const nextTopics = topicsForPlan(activeCourseConfig.topics, contest, targetRole, hasDiscursiveExam);
    const nextTopicIds = new Set(nextTopics.map(topic => topic.id));

    setSelectedContest(contest);
    setSelectedTopicIds(current => current.filter(topicId => nextTopicIds.has(topicId)));
    setSelectedSubtopicIds(current => current.filter(key =>
      nextTopics.some(topic => key.startsWith(`${topic.id}::`))
    ));
    setExpandedTopicIds(current => current.filter(topicId => nextTopicIds.has(topicId)));
  };

  const handleTopicToggle = (topicId: string) => {
    const topic = availableTopics.find(item => item.id === topicId);
    if (!topic) return;
    const keys = topic.subtopics.map(subtopic => subtopicKey(topic.id, subtopic));
    const shouldSelect = !keys.every(key => selectedSubtopicIds.includes(key));
    setSelectedSubtopicIds(current => shouldSelect
      ? Array.from(new Set([...current, ...keys]))
      : current.filter(key => !keys.includes(key))
    );
    setSelectedTopicIds(current => shouldSelect
      ? Array.from(new Set([...current, topicId]))
      : current.filter(id => id !== topicId)
    );
  };

  const handleSubtopicToggle = (topicId: string, subtopic: string) => {
    const key = subtopicKey(topicId, subtopic);
    setSelectedSubtopicIds(current => {
      const next = current.includes(key) ? current.filter(item => item !== key) : [...current, key];
      const topic = availableTopics.find(item => item.id === topicId);
      const topicHasSelection = topic?.subtopics.some(item => next.includes(subtopicKey(topicId, item)));
      setSelectedTopicIds(ids => topicHasSelection
        ? Array.from(new Set([...ids, topicId]))
        : ids.filter(id => id !== topicId)
      );
      return next;
    });
  };

  const handleRoleChange = (roleLabel: string) => {
    const option = ROLE_OPTIONS.find(role => role.label === roleLabel);
    if (!option) return;
    setTargetRole(option.label);
    setSelectedCourse(option.value);
    setSelectedTopicIds([]);
    setSelectedSubtopicIds([]);
    setExpandedTopicIds([]);
    setRoleSearch('');
    setRolePickerOpen(false);
  };

  const handleDiscursiveExamChange = (enabled: boolean) => {
    setHasDiscursiveExam(enabled);
    if (enabled) return;
    const topic = activeCourseConfig.topics.find(item => item.id === DISCURSIVE_TOPIC_ID);
    if (!topic) return;
    setSelectedTopicIds(current => current.filter(id => id !== topic.id));
    setSelectedSubtopicIds(current => current.filter(key => !key.startsWith(`${topic.id}::`)));
    setExpandedTopicIds(current => current.filter(id => id !== topic.id));
  };

  const handleCreatePlan = async () => {
    const isNewPlan = configurationMode === 'create';
    if (selectedTopicIds.length === 0) {
      alert("Por favor, selecione pelo menos um assunto para estudar!");
      return;
    }
    if (selectedWeekdays.length === 0) {
      alert("Por favor, selecione pelo menos um dia da semana para estudar!");
      return;
    }
    if (calculatedDays === 0) {
      alert("Escolha uma data futura que contenha pelo menos um dos dias disponíveis para estudo.");
      return;
    }
    const hoursPerDay = normalizedHoursPerDay;
    setHoursPerDayInput(String(hoursPerDay));

    const today = new Date(`${getTodayIso()}T00:00:00`);
    const exam = new Date(examDate);
    if (exam <= today) {
      alert("A data da prova precisa ser posterior ao dia atual.");
      return;
    }

    try {
      // Call generator to build custom study sections, questions, and calendar weeks
      const result = generateCustomPlan(
        selectedCourse,
        examDate,
        calculatedDays,
        hoursPerDay,
        selectedTopicIds,
        selectedWeekdays,
        selectedSubtopicIds,
        [examBoard, ...complementaryBoards]
      );

      if (result.success) {
        let scheduleWeeks = result.weeks;
        let studyPlanId: string | null = null;

        if (shouldUseRemoteApi()) {
          try {
            const studyDaysPayload = selectedWeekdays.map(dayNum => ({
              day: WEEKDAY_NUMBER_TO_NAME[dayNum],
              hours: hoursByWeekday[dayNum] || hoursPerDay,
            }));

            const scheduleResponse = await scheduleApi.generate({
              courseId: selectedCourse,
              examDate,
              studyDays: studyDaysPayload,
              studySections: result.sections,
              blockMinutes
            });

            scheduleWeeks = scheduleResponse.scheduleWeeks;

            const planPayload = {
              courseId: selectedCourse,
              title: targetRole.trim() || activeCourseConfig.name,
              examDate,
              hoursPerDay,
              daysPerWeek: selectedWeekdays.length,
              totalWeeks: scheduleWeeks.length,
              blockMinutes,
              studySections: result.sections,
              scheduleWeeks,
              settings: {
                contest: selectedContest,
                examBoard,
                complementaryBoards,
                targetRole,
                hasDiscursiveExam,
              },
            };

            let existingPlanId: string | null = null;
            const existingConfig = configurationMode === 'edit'
              ? localStorage.getItem(`${selectedCourse}_study_config`)
              : null;
            if (existingConfig) {
              try { existingPlanId = JSON.parse(existingConfig).studyPlanId || null; } catch (error) { console.warn(error); }
            }

            const studyPlan = existingPlanId && !String(existingPlanId).startsWith('local-')
              ? await studyPlansApi.update(existingPlanId, planPayload)
              : await studyPlansApi.create(planPayload);

            await studyPlansApi.activate(studyPlan.id);
            studyPlanId = studyPlan.id;
            try {
              await questionsApi.importLegacy(selectedCourse, result.questions);
            } catch (importError) {
              console.warn('Plano salvo, mas a importação das questões será tentada novamente depois.', importError);
            }
          } catch (apiError) {
            throw apiError;
          }
        }

        localStorage.removeItem('study_plan_deleted');
        // 1. Save to course-specific prefixed keys (safe storage)
        localStorage.setItem(`${selectedCourse}_study_sections`, JSON.stringify(result.sections));
        localStorage.setItem(`${selectedCourse}_quiz_questions`, JSON.stringify(result.questions));
        localStorage.setItem(`${selectedCourse}_schedule_weeks`, JSON.stringify(scheduleWeeks));
        localStorage.setItem(`${selectedCourse}_study_config`, JSON.stringify({
          examDate,
          examBoard,
          complementaryBoards,
          contest: selectedContest,
          targetRole,
          hasDiscursiveExam,
          totalDays: calculatedDays,
          hoursPerDay,
          selectedWeekdays,
          hoursByWeekday,
          blockMinutes,
          selectedTopics: selectedTopicIds,
          selectedSubtopics: selectedSubtopicIds,
          studyPlanId
        }));
        localStorage.removeItem(`${selectedCourse}_study_schedule_progress`);
        localStorage.removeItem(`${selectedCourse}_quiz_answers`);

        // 2. Load into active keys (so other tabs immediately work)
        localStorage.setItem('active_course', selectedCourse);
        localStorage.setItem('custom_study_sections', JSON.stringify(result.sections));
        localStorage.setItem('custom_quiz_questions', JSON.stringify(result.questions));
        localStorage.setItem('custom_schedule_weeks', JSON.stringify(scheduleWeeks));
        localStorage.setItem('study_config', JSON.stringify({
          examDate,
          examBoard,
          complementaryBoards,
          contest: selectedContest,
          targetRole,
          hasDiscursiveExam,
          totalDays: calculatedDays,
          hoursPerDay,
          selectedWeekdays,
          hoursByWeekday,
          blockMinutes,
          selectedTopics: selectedTopicIds,
          selectedSubtopics: selectedSubtopicIds,
          studyPlanId
        }));
        localStorage.removeItem('study_schedule_progress');
        localStorage.removeItem('quiz_answers');
        if (isNewPlan) {
          localStorage.removeItem('quiz_answer_history');
          localStorage.removeItem('quiz_answer_events');
          localStorage.removeItem('active_quiz_questions_cache');
        }

        // Reload saved plans list
        loadSavedPlans();
        onPlansChanged?.();

        // Trigger callback in parent component to switch to Study Summaries
        onPlanGenerated(selectedCourse);
      }
    } catch (error) {
      console.error('Error creating study plan:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar plano de estudo. Tente novamente.');
    }
  };

  const handleActivatePlan = (courseId: string) => {
    const sections = localStorage.getItem(`${courseId}_study_sections`);
    const questions = localStorage.getItem(`${courseId}_quiz_questions`);
    const weeks = localStorage.getItem(`${courseId}_schedule_weeks`);
    const config = localStorage.getItem(`${courseId}_study_config`);
    const progress = localStorage.getItem(`${courseId}_study_schedule_progress`);
    const quizAnswers = localStorage.getItem(`${courseId}_quiz_answers`);

    if (sections && questions && weeks && config) {
      localStorage.setItem('active_course', courseId);
      localStorage.setItem('custom_study_sections', sections);
      localStorage.setItem('custom_quiz_questions', questions);
      localStorage.setItem('custom_schedule_weeks', weeks);
      localStorage.setItem('study_config', config);
      
      if (progress) {
        localStorage.setItem('study_schedule_progress', progress);
      } else {
        localStorage.removeItem('study_schedule_progress');
      }

      if (quizAnswers) {
        localStorage.setItem('quiz_answers', quizAnswers);
      } else {
        localStorage.removeItem('quiz_answers');
      }

      onPlanGenerated(courseId);
    } else {
      // Plan data is incomplete, open configuration for it
      handleOpenConfigure(courseId, 'edit');
    }
  };

  const clearLocalPlan = (courseId: string) => {
    [
      'study_sections', 'quiz_questions', 'schedule_weeks', 'study_config',
      'study_schedule_progress', 'quiz_answers'
    ].forEach(key => localStorage.removeItem(`${courseId}_${key}`));

    if (localStorage.getItem('active_course') === courseId) {
      [
        'active_course', 'custom_study_sections', 'custom_quiz_questions',
        'custom_schedule_weeks', 'study_config', 'study_schedule_progress',
        'quiz_answers', 'quiz_answer_history', 'quiz_answer_events',
        'active_quiz_questions_cache'
      ].forEach(key => localStorage.removeItem(key));
    }

    const stillHasPlan = ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo']
      .some(id => localStorage.getItem(`${id}_study_config`));
    if (!stillHasPlan) localStorage.setItem('study_plan_deleted', 'true');
    loadSavedPlans();
    onPlansChanged?.();
  };

  const handleDeletePlan = async (courseId: string, e: MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    if (window.confirm("Deseja realmente excluir este plano de estudos? Seu progresso e histórico serão perdidos de forma irreversível.")) {
      try {
        // Get study plan ID from config
        const config = localStorage.getItem(`${courseId}_study_config`);
        let studyPlanId = null;
        if (config) {
          try {
            const parsed = JSON.parse(config);
            studyPlanId = parsed.studyPlanId;
          } catch (e) {}
        }

        // Delete from API if study plan ID exists. If production API is unavailable,
        // still remove the local plan so the user is not blocked by stale data.
        if (studyPlanId) {
          try {
            await studyPlansApi.delete(studyPlanId);
          } catch (apiError) {
            console.warn('Remote study plan deletion failed; clearing local plan only.', apiError);
          }
        }

        clearLocalPlan(courseId);
      } catch (error) {
        console.error('Error deleting study plan:', error);
        alert('Erro ao excluir plano de estudo. Tente novamente.');
      }
    }
  };

  const activeCourseConfig = COURSES_CONFIG[selectedCourse] || COURSES_CONFIG.jornalismo;
  const availableTopics = topicsForPlan(activeCourseConfig.topics, selectedContest, targetRole, hasDiscursiveExam);

  return (
    <div id="home-tab-container" className="space-y-8 animate-fade-in">
      
      {screen === 'selection' ? (
        <div className="home-selection-flow space-y-8">
          {!hasSavedPlans && (
            <div className="home-hero text-white p-8 rounded-3xl shadow-md border relative overflow-hidden">
              <div className="relative z-10 max-w-5xl space-y-4">
                <span className="px-3 py-1 text-xs font-bold bg-white/10 text-blue-50 rounded-full inline-flex items-center gap-1 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gabarita Concursos • plano mínimo
                </span>
                <h2 className="text-2xl lg:text-4xl font-black tracking-tight leading-tight text-white">
                  Estude com estratégia. Acerte com confiança.
                </h2>
                <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                  Escolha o concurso, defina disponibilidade e deixe o restante virar uma rotina visível: leitura, questões, calendário e desempenho.
                </p>
              </div>
            </div>
          )}

          {/* Seção 1: Escolha de Especialidade */}
          <div className="home-course-section space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              {hasSavedPlans ? 'Criar um novo plano' : 'Comece seu plano'}
            </h3>

            <div className="create-plan-entry bg-white border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="max-w-2xl">
                <h4 className="text-xl font-bold">Plano personalizado</h4>
                <p className="text-sm text-slate-500 mt-1">Escolha banca, cargo, disponibilidade e cada assunto do edital na próxima etapa.</p>
              </div>
              <button disabled={startingNewPlan} onClick={() => void handleStartNewPlan('seplag_informatica')} className="create-plan-button inline-flex items-center justify-center gap-2 px-6 font-bold shrink-0 disabled:opacity-60">
                <Settings2 className="w-4 h-4" /> {startingNewPlan ? 'Verificando sessão…' : 'Criar plano'}
              </button>
            </div>
          </div>

          {/* Seção 2: Seus Planos Salvos */}
          {hasSavedPlans && <div id="local-saved-plans" className="space-y-4 pt-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Seus Planos de Estudo Ativos e Salvos:
            </h3>

            {Object.keys(savedPlans).length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
                Nenhum plano de estudos foi gerado ainda. Escolha uma especialidade acima e clique em "Configurar Plano"!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.keys(savedPlans).map(courseId => {
                  const plan = savedPlans[courseId];
                  const config = COURSES_CONFIG[courseId];
                  const weekdaysFormatted = plan.selectedWeekdays.map((val: number) => {
                    const opt = weekdayOptions.find(o => o.value === val);
                    return opt ? opt.label : '';
                  }).filter(Boolean).join(', ');

                  return (
                    <div
                      key={courseId}
                      onClick={() => handleActivatePlan(courseId)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                            {courseId === 'seplag_informatica' ? 'Informática' : courseId === 'tecnico_enfermagem' ? 'Enfermagem' : 'Jornalismo'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Prova em {plan.examDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm lg:text-base">{plan.targetRole || config.name}</h4>
                        <p className="text-xs font-bold text-slate-500">{contestLabel(plan.contest || 'seplag')} · {plan.examBoard || 'CEBRASPE'}</p>
                        
                        <div className="text-[11px] text-slate-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Carga Horária: <strong>{plan.hoursPerDay}h/dia</strong> nos dias [<strong>{weekdaysFormatted}</strong>]</span>
                          </p>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Total de <strong>{plan.totalDays} dias de estudo</strong> planejados até a prova</span>
                          </p>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                          <span>Progresso do Cronograma</span>
                          <span className="text-indigo-600">{plan.percentage}% ({plan.completedBlocks}/{plan.totalBlocks} etapas)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${plan.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="plan-local-actions flex flex-wrap justify-between items-center pt-2 gap-2">
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleActivatePlan(courseId); }}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Estudar / Ativar
                        </button>
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleOpenConfigure(courseId, 'edit'); }}
                          className="flex items-center gap-1 border border-slate-200 text-slate-700 font-extrabold text-xs py-2 px-3.5 rounded-xl"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Reconfigurar
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => handleDeletePlan(courseId, e)}
                          className="text-slate-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Excluir Plano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>}

        </div>
      ) : (
        /* Tela de Configuração do Plano */
        <div className="space-y-6 animate-fade-in">
          
          {/* Botão Voltar */}
          <button
            onClick={() => setScreen('selection')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer transition hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </button>

          <div className="plan-stepper" aria-label="Etapas de configuração do estudo">
            {['Concurso', 'Disponibilidade', 'Assuntos', 'Revisão'].map((step, index) => (
              <button
                type="button"
                key={step}
                onClick={() => index + 1 < configStep && setConfigStep(index + 1)}
                className={`plan-step ${index + 1 === configStep ? 'is-active' : ''} ${index + 1 < configStep ? 'is-complete' : ''}`}
                aria-current={index + 1 === configStep ? 'step' : undefined}
              >
                <span className="plan-step-number">{index + 1}</span>
                <span className="plan-step-label">{step}</span>
              </button>
            ))}
          </div>

          {/* Grid do Formulário */}
          <div className={`plan-config-grid grid grid-cols-1 lg:grid-cols-12 gap-8 ${configStep === 4 ? 'is-review' : ''}`}>
            
            {/* Formulário de Configuração */}
            <div className="wizard-main lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                
                {/* Header do Form */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedCourse === 'seplag_informatica' ? 'bg-indigo-50 text-indigo-600' : selectedCourse === 'tecnico_enfermagem' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedCourse === 'seplag_informatica' ? <GraduationCap className="w-5 h-5" /> : selectedCourse === 'tecnico_enfermagem' ? <HeartPulse className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-base">{configurationMode === 'edit' ? 'Reconfigurar o estudo' : 'Configurar o estudo'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Etapa {configStep} de 4 · {contestLabel(selectedContest)}</p>
                  </div>
                </div>

                {configStep === 1 && (
                  <div className="wizard-step-panel contest-data-step space-y-5">
                    <div>
                      <h2 className="text-xl font-bold">Dados do concurso</h2>
                      <p className="text-sm text-slate-500 mt-1">Defina a prova que orientará todo o plano.</p>
                    </div>
                    <div className="contest-fields grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="wizard-field space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Data da prova</span>
                        <div
                          className={`date-input-with-picker ${datePickerOpen ? 'is-open' : ''}`}
                          onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDatePickerOpen(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') setDatePickerOpen(false);
                          }}
                        >
                          <input
                            id="exam-date"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            value={examDateDisplay}
                            onChange={(event) => handleExamDateChange(event.target.value)}
                            aria-invalid={examDateDisplay.length === 10 && !examDate}
                            className="w-full px-3 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            className="date-picker-trigger"
                            aria-label="Abrir calendário da data da prova"
                            aria-haspopup="dialog"
                            aria-expanded={datePickerOpen}
                            aria-controls="exam-date-calendar"
                            onClick={() => setDatePickerOpen(open => !open)}
                          >
                            <Calendar aria-hidden="true" />
                          </button>
                          {datePickerOpen && (
                            <div id="exam-date-calendar" className="date-calendar-popover" role="dialog" aria-label="Selecionar data da prova">
                              <ReactCalendar
                                locale="pt-BR"
                                minDate={new Date(`${getTodayIso()}T00:00:00`)}
                                value={examDate ? new Date(`${examDate}T00:00:00`) : null}
                                onChange={value => {
                                  if (!(value instanceof Date)) return;
                                  applyExamDate(formatDateToIso(value));
                                  setDatePickerOpen(false);
                                }}
                                prev2Label={null}
                                next2Label={null}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <label className="wizard-field space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Banca principal</span>
                        <select value={examBoard} onChange={(e) => handleExamBoardChange(e.target.value)} className="w-full px-3 text-sm font-semibold">
                          {!EXAM_BOARDS.includes(examBoard) && <option value={examBoard}>{examBoard}</option>}
                          {EXAM_BOARDS.map(board => <option key={board} value={board}>{board}</option>)}
                        </select>
                      </label>
                      <label className="wizard-field space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Concurso</span>
                        <select value={selectedContest} onChange={event => handleContestChange(event.target.value as ContestId)} className="w-full px-3 text-sm font-semibold">
                          {CONTEST_OPTIONS.map(contest => <option key={contest.value} value={contest.value}>{contest.label}</option>)}
                        </select>
                      </label>
                      <div className="wizard-field space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cargo</span>
                        <div
                          className={`role-picker ${rolePickerOpen ? 'is-open' : ''}`}
                          onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node)) setRolePickerOpen(false);
                          }}
                        >
                          <button
                            type="button"
                            className="role-picker-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={rolePickerOpen}
                            onClick={() => {
                              setRoleSearch('');
                              setRolePickerOpen(open => !open);
                            }}
                          >
                            <span>{targetRole}</span>
                            <ChevronDown aria-hidden="true" />
                          </button>
                          {rolePickerOpen && (
                            <div className="role-picker-popover">
                              <div className="role-picker-search">
                                <Search aria-hidden="true" />
                                <input
                                  autoFocus
                                  type="search"
                                  value={roleSearch}
                                  onChange={event => setRoleSearch(event.target.value)}
                                  onKeyDown={event => {
                                    if (event.key === 'Escape') setRolePickerOpen(false);
                                  }}
                                  placeholder="Pesquisar cargo..."
                                  aria-label="Pesquisar cargo"
                                />
                              </div>
                              <div className="role-picker-options" role="listbox" aria-label="Cargos disponíveis">
                                {filteredRoleOptions.map(role => (
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={role.label === targetRole}
                                    className={role.label === targetRole ? 'is-selected' : ''}
                                    key={`${role.value}-${role.label}`}
                                    onClick={() => handleRoleChange(role.label)}
                                  >
                                    <span>{role.label}</span>
                                    {role.label === targetRole && <Check aria-hidden="true" />}
                                  </button>
                                ))}
                                {filteredRoleOptions.length === 0 && <p>Nenhum cargo encontrado.</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="complementary-boards-title">
                      <div>
                        <strong id="complementary-boards-title" className="block text-sm text-slate-800">Bancas complementares <span className="font-medium text-slate-400">(opcional)</span></strong>
                        <p className="mt-1 text-xs text-slate-500">Adicione questões de outras bancas ao banco da sua banca principal. Se nenhuma for marcada, somente {examBoard} será utilizada.</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Selecionar bancas complementares">
                        {EXAM_BOARDS.filter(board => board !== examBoard).map(board => {
                          const selected = complementaryBoards.includes(board);
                          return <button
                            key={board}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => handleComplementaryBoardToggle(board)}
                            className={`min-h-9 rounded-lg border px-3 text-xs font-bold transition ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                          >
                            {selected && <Check className="mr-1.5 inline-block h-3.5 w-3.5" />}{board}
                          </button>;
                        })}
                      </div>
                    </section>
                    <label className={`mt-4 flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${hasDiscursiveExam ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={hasDiscursiveExam}
                        onChange={event => handleDiscursiveExamChange(event.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        <strong className="block text-sm text-slate-800">A prova tem etapa discursiva (redação)</strong>
                        <span className="block text-xs text-slate-600 mt-1">Inclui Atualidades e agenda treinos de redação com temas de segurança, política, economia, saúde, tecnologia, sustentabilidade e outras áreas do edital.</span>
                      </span>
                    </label>
                  </div>
                )}

                {configStep === 2 && <div className="wizard-step-panel space-y-5">
                  <div>
                    <h2 className="text-xl font-bold">Sua disponibilidade</h2>
                    <p className="text-sm text-slate-500 mt-1">Selecione os dias e informe quantas horas cabem em cada um.</p>
                  </div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dias da semana que posso estudar:</label>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map(day => {
                      const isSelected = selectedWeekdays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          <span>{day.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedWeekdays.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2">
                      {selectedWeekdays.map(dayValue => {
                        const day = weekdayOptions.find(option => option.value === dayValue);
                        return (
                          <label key={dayValue} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <span className="text-xs font-bold text-slate-600 block mb-1">{day?.label}</span>
                            <span className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={hoursByWeekday[dayValue] || normalizedHoursPerDay}
                                onChange={event => setHoursByWeekday(current => ({ ...current, [dayValue]: Math.max(0.5, Number(event.target.value) || 0.5) }))}
                                className="w-full min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold"
                              />
                              <span className="text-xs text-slate-500">h</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Horas padrão por dia</span>
                      <input id="hours-per-day" type="number" inputMode="numeric" min="1" max="24" step="1" value={hoursPerDayInput} onChange={(e) => handleHoursPerDayChange(e.target.value)} onBlur={commitHoursPerDay} className="w-full px-3 text-sm font-bold" />
                    </label>
                    <div className="space-y-1.5">
                  <label htmlFor="block-duration" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Duração de cada bloco:</label>
                  <select id="block-duration" value={blockMinutes} onChange={event => setBlockMinutes(Number(event.target.value))} className="w-full px-3 text-sm font-bold text-slate-700">
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1 hora e 30 minutos</option>
                    <option value="120">2 horas</option>
                  </select>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-700">Total semanal: {weeklyHours} horas em {selectedWeekdays.length} dias.</p>
                </div>}

                {/* 3. Assuntos do Edital (Filtro) */}
                {configStep === 3 && <div className="wizard-step-panel space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">Assuntos do edital</h2>
                    <p className="text-sm text-slate-500 mt-1">Escolha o que fará parte da sua rotina de estudos.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Selecione os Assuntos do Edital:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopicIds(availableTopics.map(topic => topic.id));
                          setSelectedSubtopicIds(availableTopics.flatMap(topic => topic.subtopics.map(subtopic => subtopicKey(topic.id, subtopic))));
                        }}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        Selecionar Todos
                      </button>
                      <span className="text-slate-300 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedTopicIds([]); setSelectedSubtopicIds([]); }}
                        className="text-[10px] text-slate-500 font-bold hover:underline"
                      >
                        Limpar Todos
                      </button>
                    </div>
                  </div>

                  <div className="subject-accordion space-y-2">
                    {availableTopics.map(topic => {
                      const topicKeys = topic.subtopics.map(subtopic => subtopicKey(topic.id, subtopic));
                      const selectedCount = topicKeys.filter(key => selectedSubtopicIds.includes(key)).length;
                      const isChecked = selectedCount === topicKeys.length && topicKeys.length > 0;
                      const isExpanded = expandedTopicIds.includes(topic.id);
                      return (
                        <div key={topic.id} className="subject-group border border-slate-200 bg-white">
                          <div className="subject-group-header flex items-center gap-3 p-4">
                            <button type="button" onClick={() => handleTopicToggle(topic.id)} aria-label={`${isChecked ? 'Desmarcar' : 'Selecionar'} todos os assuntos de ${topic.title}`} className={`subject-check flex items-center justify-center shrink-0 ${isChecked ? 'is-selected' : ''}`}>
                              {isChecked && <Check className="w-4 h-4" />}
                            </button>
                            <button type="button" onClick={() => setExpandedTopicIds(current => current.includes(topic.id) ? current.filter(id => id !== topic.id) : [...current, topic.id])} aria-expanded={isExpanded} className="subject-expand flex flex-1 min-w-0 items-center justify-between gap-3 text-left">
                              <span>
                                <strong className="block text-sm text-slate-800">{topic.title}</strong>
                                <span className="block text-xs text-slate-500 mt-0.5">{selectedCount} de {topic.subtopics.length} selecionados</span>
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                            </button>
                          </div>
                          {isExpanded && <div className="subject-options border-t border-slate-200 p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {topic.subtopics.map(subtopic => {
                              const key = subtopicKey(topic.id, subtopic);
                              const checked = selectedSubtopicIds.includes(key);
                              return <label key={key} className={`subject-option flex items-start gap-3 p-3 border cursor-pointer ${checked ? 'is-selected' : ''}`}>
                                <input type="checkbox" checked={checked} onChange={() => handleSubtopicToggle(topic.id, subtopic)} className="mt-0.5" />
                                <span className="text-sm font-semibold text-slate-700">{subtopic}</span>
                              </label>;
                            })}
                          </div>}
                        </div>
                      );
                    })}
                  </div>
                </div>}

                {configStep === 4 && (
                  <div className="wizard-step-panel space-y-5">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Revisão final</p>
                      <h2 className="text-2xl font-bold mt-1">Seu plano tático está pronto</h2>
                      <p className="text-sm text-slate-500 mt-1">Confira as decisões antes de gerar o cronograma.</p>
                    </div>
                    <dl className="wizard-review-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><dt>Prova</dt><dd>{new Date(`${examDate}T00:00:00`).toLocaleDateString('pt-BR')}</dd></div>
                      <div><dt>Concurso</dt><dd>{contestLabel(selectedContest)}</dd></div>
                      <div><dt>Banca principal e cargo</dt><dd>{examBoard} · {targetRole}</dd></div>
                      <div><dt>Bancas complementares</dt><dd>{complementaryBoards.length > 0 ? complementaryBoards.join(', ') : 'Nenhuma · somente a banca principal'}</dd></div>
                      <div><dt>Prova discursiva</dt><dd>{hasDiscursiveExam ? 'Sim · com treinos de redação' : 'Não'}</dd></div>
                      <div><dt>Disponibilidade</dt><dd>{selectedWeekdays.length} dias · {weeklyHours}h por semana</dd></div>
                      <div><dt>Conteúdo</dt><dd>{selectedSubtopicIds.length} subtópicos em {selectedTopicIds.length} matérias</dd></div>
                    </dl>
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-bold uppercase text-slate-500 mb-3">Prioridades selecionadas</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTopics.filter(topic => selectedTopicIds.includes(topic.id)).map(topic => (
                          <span key={topic.id} className="px-3 py-2 border border-slate-200 bg-slate-50 text-sm font-semibold">{topic.title}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de Geração */}
                {configStep === 4 && <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCreatePlan}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {configurationMode === 'edit' ? 'Salvar e ativar plano de estudos' : 'Criar e ativar plano de estudos'}
                  </button>
                </div>}

                <div className="wizard-navigation flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setConfigStep(step => Math.max(1, step - 1))} disabled={configStep === 1} className="wizard-back inline-flex items-center gap-2 px-4 font-bold disabled:opacity-30">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  {configStep < 4 && (
                    <button
                      type="button"
                      onClick={() => setConfigStep(step => Math.min(4, step + 1))}
                      disabled={(configStep === 1 && (!examDate || examDate <= getTodayIso() || !examBoard.trim() || !targetRole.trim())) || (configStep === 2 && selectedWeekdays.length === 0) || (configStep === 3 && selectedSubtopicIds.length === 0)}
                      className="wizard-next inline-flex items-center gap-2 px-5 font-bold disabled:opacity-40"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Painel Tático Resumo */}
            {configStep === 4 && <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-xs lg:text-sm uppercase tracking-wider text-amber-500">Painel Tático de Pareto</h3>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-slate-400 block font-bold">Especialidade:</span>
                    <span className="text-sm font-extrabold text-white">{activeCourseConfig.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Banca e cargo:</span>
                    <span className="text-sm font-extrabold text-white">{contestLabel(selectedContest)} · {examBoard} · {targetRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Banco de questões:</span>
                    <span className="text-sm font-extrabold text-white">{[examBoard, ...complementaryBoards].join(' + ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold font-mono">Dias de Estudo Ativo:</span>
                    <span className="text-sm font-extrabold text-indigo-400">{calculatedDays} dias de estudo efetivos</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Carga Total Disponível:</span>
                    <span className="text-sm font-extrabold text-emerald-400">{totalAvailableHours}h de estudo bruto</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Frequência Semanal:</span>
                    <span className="text-white font-extrabold">{selectedWeekdays.length} dias por semana ({weeklyHours}h/semana)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Assuntos Selecionados:</span>
                    <span className="text-white font-extrabold">{selectedSubtopicIds.length} subtópicos em {selectedTopicIds.length} matérias</span>
                    </div>
                </div>

                <div className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-slate-400">
                    Ao criar o cronograma, suas horas serão distribuídas de forma inteligente pelas semanas restantes até a prova. Os resumos e questões se ajustarão automaticamente aos assuntos selecionados!
                  </p>
                </div>
              </div>
            </div>}

          </div>

        </div>
      )}

    </div>
  );
}

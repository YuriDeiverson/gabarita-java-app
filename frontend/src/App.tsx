import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import StudyDashboard from "./components/StudyDashboard";
import QuestionBankTab from "./components/QuestionBankTab";
import type { AdminSection } from "./components/AdminPanel";
import {
  StudyPreferences,
  loadStudyPreferences,
  saveStudyPreferences,
} from "./careerPlan";
import {
  dailyStudyApi,
  notificationsApi,
  studyPlansApi,
  StudyDashboardData,
  StudySession,
  QuestionNote,
  StudyPlan,
} from "./services/api";
import { ActiveStudyContext } from "./studyContext";
import { useAuth } from "./auth/AuthContext";
import {
  Bell,
  BookOpen,
  BookOpenCheck,
  BriefcaseBusiness,
  Calendar,
  Target,
  Home as HomeIcon,
  ChartNoAxesCombined,
  PanelLeftClose,
  PanelLeftOpen,
  ListChecks,
  X,
  LogOut,
  UserRound,
  Settings2,
  Flame,
  Star,
  ShieldCheck,
  Clock3,
  ChevronRight,
  CheckCheck,
  RefreshCw,
  Pause,
  Play,
  Square,
  TimerReset,
  Menu,
  Building2,
  UsersRound,
  BookOpenText,
  FileQuestion,
  LibraryBig,
  ChevronDown,
  NotebookPen,
} from "lucide-react";

const StudyTab = lazy(() => import("./components/StudyTab"));
const ScheduleTab = lazy(() => import("./components/ScheduleTab"));
const PerformanceTab = lazy(() => import("./components/PerformanceTab"));
const QuestionNotesTab = lazy(() => import("./components/QuestionNotesTab"));
const CareerTab = lazy(() => import("./components/CareerTab"));
const PlanManager = lazy(() => import("./components/PlanManager"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const InitialStudySetup = lazy(() => import("./components/InitialStudySetup"));

type AppTab =
  | "home"
  | "career"
  | "study"
  | "questions"
  | "schedule"
  | "performance"
  | "notes"
  | "admin";

const hasActiveStudyPlan = () =>
  Boolean(
    (() => {
      if (localStorage.getItem("study_plan_deleted") === "true") return false;
      const courseId = localStorage.getItem("active_course");
      let examDate = "";
      try {
        examDate =
          JSON.parse(localStorage.getItem(`${courseId}_study_config`) || "{}")
            .examDate || "";
      } catch {}
      const now = new Date();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
      return Boolean(
        courseId &&
        examDate >= today &&
        localStorage.getItem(`${courseId}_study_config`),
      );
    })(),
  );

const settingsFromPlan = (plan: StudyPlan) => {
  try {
    const root = typeof plan.settings === "string" ? JSON.parse(plan.settings) : plan.settings || {};
    return typeof root.preferences === "object" && root.preferences ? root.preferences as Record<string, unknown> : root as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
};

const isPrimaryPlan = (plan: StudyPlan) =>
  plan.is_primary === true || plan.is_active === true || plan.is_active === 1;

export default function App() {
  const { user, signOut } = useAuth();
  const isAdmin = Boolean(
    user?.app_metadata?.admin === true || user?.app_metadata?.role === "admin",
  );
  const [hasPlan, setHasPlan] = useState(hasActiveStudyPlan);
  const [studyPreferences, setStudyPreferences] =
    useState<StudyPreferences | null>(() => loadStudyPreferences(user?.id));
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem("app_active_tab");
    const setupAvailable = Boolean(loadStudyPreferences(user?.id));
    if (saved === "quiz") return hasActiveStudyPlan() ? "study" : "home";
    return saved &&
      saved !== "home" &&
      !hasActiveStudyPlan() &&
      !(saved === "career" && setupAvailable) &&
      !(saved === "admin" && isAdmin)
      ? "home"
      : (saved as AppTab) || "home";
  });
  const [homeMode, setHomeMode] = useState<"dashboard" | "plans">(() =>
    hasActiveStudyPlan() ? "dashboard" : "plans",
  );
  const [serverPlans, setServerPlans] = useState<StudyPlan[]>([]);
  const [plansBootstrapping, setPlansBootstrapping] = useState(true);
  const [studyContext, setStudyContext] = useState<ActiveStudyContext | null>(
    () => {
      try {
        return JSON.parse(
          localStorage.getItem("active_study_context") || "null",
        );
      } catch {
        return null;
      }
    },
  );
  const [dashboardVersion, setDashboardVersion] = useState(0);
  const [questionDailyTask, setQuestionDailyTask] = useState<{
    id: string;
    minutes: number;
  } | null>(null);
  const [notedQuestionId, setNotedQuestionId] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [headerNotifications, setHeaderNotifications] = useState<
    Record<string, any>[]
  >([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);
  const [headerStudyData, setHeaderStudyData] =
    useState<StudyDashboardData | null>(null);
  const [headerTimerLoadedAt, setHeaderTimerLoadedAt] = useState(Date.now());
  const [headerTimerTick, setHeaderTimerTick] = useState(0);
  const [contextSessionBusy, setContextSessionBusy] = useState(false);
  const [contextSessionError, setContextSessionError] = useState("");
  const [newPlanSessionPrompt, setNewPlanSessionPrompt] =
    useState<Partial<StudySession> | null>(null);
  const [newPlanSessionBusy, setNewPlanSessionBusy] = useState(false);
  const [newPlanSessionError, setNewPlanSessionError] = useState("");
  const newPlanDecisionRef = useRef<((proceed: boolean) => void) | null>(null);
  const [breakNotice, setBreakNotice] = useState<{
    title: string;
    minutes: number;
  } | null>(null);
  const [completedBreakPrompt, setCompletedBreakPrompt] = useState<{
    sessionId: string;
    title: string;
  } | null>(null);
  const [completedBreakBusy, setCompletedBreakBusy] = useState(false);
  const [completedBreakError, setCompletedBreakError] = useState("");
  const breakAlertedRef = useRef("");
  const completedBreakAlertedRef = useRef("");
  const globalAutomaticCompletionRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(() => {
    try {
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      return context;
    } catch {
      return null;
    }
  }, []);

  const playGentleBreakChime = useCallback(() => {
    const context = ensureAudioContext();
    if (!context) return;
    const play = () => {
      const startAt = context.currentTime + 0.03;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const toneStart = startAt + index * 0.2;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, toneStart);
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.14, toneStart + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.38);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(toneStart);
        oscillator.stop(toneStart + 0.4);
      });
    };
    if (context.state === "suspended")
      void context
        .resume()
        .then(play)
        .catch(() => {});
    else play();
    if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
  }, [ensureAudioContext]);

  const playBreakCompletedChime = useCallback(() => {
    const context = ensureAudioContext();
    if (!context) return;
    const play = () => {
      const startAt = context.currentTime + 0.03;
      [783.99, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const toneStart = startAt + index * 0.18;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, toneStart);
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.16, toneStart + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.34);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(toneStart);
        oscillator.stop(toneStart + 0.36);
      });
    };
    if (context.state === "suspended")
      void context
        .resume()
        .then(play)
        .catch(() => {});
    else play();
    if ("vibrate" in navigator) navigator.vibrate([180, 90, 180, 90, 260]);
  }, [ensureAudioContext]);

  const [activeCourse, setActiveCourse] = useState<string>(() => {
    return localStorage.getItem("active_course") || "seplag_informatica";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("app_sidebar_collapsed") === "true";
  });
  const [adminMenuOpen, setAdminMenuOpen] = useState(
    () => activeTab === "admin",
  );
  const [adminSection, setAdminSection] = useState<AdminSection>(() =>
    (localStorage.getItem("admin_active_section") as AdminSection) ||
    "contests",
  );

  const hydrateActivePlan = useCallback((plan: StudyPlan) => {
    const courseId = String(plan.course_id || plan.courseId || "");
    const examDate = String(plan.exam_date || plan.examDate || "");
    if (!courseId || !examDate) return false;

    const settings = settingsFromPlan(plan);
    const config = {
      ...settings,
      studyPlanId: plan.id,
      examDate,
      targetRole: String(settings.targetRole || plan.title || "Preparação"),
    };
    localStorage.setItem("active_course", courseId);
    localStorage.setItem("study_config", JSON.stringify(config));
    localStorage.setItem(`${courseId}_study_config`, JSON.stringify(config));
    localStorage.removeItem("study_plan_deleted");

    const selectedWeekdays = Array.isArray(settings.selectedWeekdays)
      ? settings.selectedWeekdays.map(Number).filter(day => day >= 0 && day <= 6)
      : [];
    if (selectedWeekdays.length > 0) {
      const rawHours = typeof settings.hoursByWeekday === "object" && settings.hoursByWeekday
        ? settings.hoursByWeekday as Record<string, unknown>
        : {};
      const preferences: StudyPreferences = {
        selectedWeekdays,
        hoursByWeekday: Object.fromEntries(
          Object.entries(rawHours).map(([day, hours]) => [Number(day), Math.max(1, Number(hours || 1))]),
        ),
        hoursPerDay: Math.max(1, Number(settings.hoursPerDay || 4)),
        blockMinutes: 60,
      };
      saveStudyPreferences(preferences, user?.id);
      setStudyPreferences(preferences);
    }

    setActiveCourse(courseId);
    setHasPlan(true);
    return true;
  }, [user?.id]);

  const loadHeaderNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setNotificationLoading(true);
    try {
      setHeaderNotifications(await notificationsApi.all());
      setNotificationError("");
    } catch (error) {
      console.warn("Não foi possível carregar as notificações.", error);
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar suas notificações.",
      );
    } finally {
      if (showLoading) setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHeaderNotifications(true);
    const interval = window.setInterval(
      () => void loadHeaderNotifications(),
      30_000,
    );
    return () => window.clearInterval(interval);
  }, [loadHeaderNotifications]);

  const loadHeaderStudyData = useCallback(async () => {
    if (!hasPlan) {
      setHeaderStudyData(null);
      return;
    }
    try {
      const response = await dailyStudyApi.today();
      setHeaderStudyData(response);
      setHeaderTimerLoadedAt(Date.now());
      if (response.notifications?.length)
        setHeaderNotifications((items) =>
          items.length
            ? items
            : response.notifications.filter((item) => !item.read_at),
        );
    } catch {
      /* O dashboard continua responsável por exibir erros de carregamento ao usuário. */
    }
  }, [hasPlan]);

  const handleSessionChange = useCallback(
    (session?: Partial<StudySession> | null) => {
      if (session !== undefined && headerStudyData) {
        setHeaderStudyData((current) =>
          current ? { ...current, active_session: session || {} } : current,
        );
        setHeaderTimerLoadedAt(Date.now());
        return;
      }
      void loadHeaderStudyData();
    },
    [headerStudyData, loadHeaderStudyData],
  );

  useEffect(() => {
    void loadHeaderStudyData();
    const interval = window.setInterval(loadHeaderStudyData, 30_000);
    return () => window.clearInterval(interval);
  }, [dashboardVersion, loadHeaderStudyData]);

  useEffect(() => {
    if (activeTab !== "questions") setQuestionDailyTask(null);
  }, [activeTab]);

  useEffect(() => {
    const interval = window.setInterval(
      () => setHeaderTimerTick((value) => value + 1),
      1_000,
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      const context = ensureAudioContext();
      if (!context) return;
      const prime = () => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.02);
      };
      if (context.state === "suspended")
        void context
          .resume()
          .then(prime)
          .catch(() => {});
      else prime();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [ensureAudioContext]);

  useEffect(() => {
    if (!breakNotice) return;
    const timeout = window.setTimeout(() => setBreakNotice(null), 9_000);
    return () => window.clearTimeout(timeout);
  }, [breakNotice]);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-header-menu]")) {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setMobileProfileOpen(false);
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-profile-open", mobileProfileOpen);
    return () => document.body.classList.remove("mobile-profile-open");
  }, [mobileProfileOpen]);

  // Global KPIs extracted from localStorage
  const [globalProgress, setGlobalProgress] = useState({
    completedBlocks: 0,
    totalBlocks: 19,
    quizAnswered: 0,
  });

  const loadGlobalKPIs = () => {
    // Schedule progress
    const progressSaved = localStorage.getItem("study_schedule_progress");
    let completed = 0;
    if (progressSaved) {
      try {
        const parsed = JSON.parse(progressSaved);
        completed = Object.keys(parsed).filter((key) => parsed[key]).length;
      } catch (e) {
        console.error(e);
      }
    }

    // Quiz progress
    const quizSaved = localStorage.getItem("quiz_answers");
    let answered = 0;
    if (quizSaved) {
      try {
        const parsed = JSON.parse(quizSaved);
        answered = Object.keys(parsed).length;
      } catch (e) {
        console.error(e);
      }
    }

    // Dynamic total blocks from generated schedule
    let total = 19;
    const customSchedule = localStorage.getItem("custom_schedule_weeks");
    if (customSchedule) {
      try {
        const parsed = JSON.parse(customSchedule);
        let blockCount = 0;
        parsed.forEach((week: any) => {
          blockCount += (week.blocks || []).length;
        });
        total = blockCount > 0 ? blockCount : 19;
      } catch (e) {}
    }

    setGlobalProgress({
      completedBlocks: completed,
      totalBlocks: total,
      quizAnswered: answered,
    });
  };

  useEffect(() => {
    loadGlobalKPIs();
    // Listen for tab switches to reload KPIs
    localStorage.setItem("app_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    setPlansBootstrapping(true);
    studyPlansApi.getSummaries()
      .then((plans) => {
        if (cancelled) return;
        setServerPlans(plans);
        const activePlan = plans.find(isPrimaryPlan);
        if (activePlan) {
          hydrateActivePlan(activePlan);
          // The active plan is an authoritative server result, but restoring it
          // must not move the user away from the screen they were using.
          setHomeMode("dashboard");
        } else {
          localStorage.setItem("study_plan_deleted", "true");
          ["active_course", "study_config", "active_study_context"].forEach(key => localStorage.removeItem(key));
          setActiveCourse("seplag_informatica");
          setHasPlan(false);
          setStudyContext(null);
          setHomeMode(plans.length > 0 ? "plans" : "dashboard");
        }
      })
      .catch(() => {
        if (cancelled) return;
        const localPlanAvailable = hasActiveStudyPlan();
        setHasPlan(localPlanAvailable);
        setHomeMode(localPlanAvailable ? "dashboard" : "plans");
      })
      .finally(() => { if (!cancelled) setPlansBootstrapping(false); });
    return () => { cancelled = true; };
  }, [hydrateActivePlan, user?.id]);

  useEffect(() => {
    setStudyPreferences(loadStudyPreferences(user?.id));
    setEditingPreferences(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "admin" && !isAdmin) setActiveTab("home");
    else if (
      !studyPreferences &&
      activeTab !== "home" &&
      activeTab !== "notes" &&
      !(isAdmin && activeTab === "admin")
    )
      setActiveTab("home");
    else if (
      !hasPlan &&
      activeTab !== "home" &&
      activeTab !== "career" &&
      activeTab !== "notes" &&
      !(isAdmin && activeTab === "admin")
    )
      setActiveTab("home");
  }, [hasPlan, activeTab, isAdmin, studyPreferences]);

  useEffect(() => {
    localStorage.setItem("app_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (activeTab === "admin") setAdminMenuOpen(true);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("admin_active_section", adminSection);
  }, [adminSection]);

  // Keep KPIs in sync if the user performs actions in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      loadGlobalKPIs();
      setHasPlan(hasActiveStudyPlan());
      const currentCourse =
        localStorage.getItem("active_course") || "seplag_informatica";
      setActiveCourse(currentCourse);

      // Automatically back up progress for the current active course in real-time
      const scheduleProgress = localStorage.getItem("study_schedule_progress");
      if (scheduleProgress) {
        localStorage.setItem(
          `${currentCourse}_study_schedule_progress`,
          scheduleProgress,
        );
      }
      const quizAnswers = localStorage.getItem("quiz_answers");
      if (quizAnswers) {
        localStorage.setItem(`${currentCourse}_quiz_answers`, quizAnswers);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    // Poll progress periodically as simple event listener sometimes misses same-tab updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handlePlanGenerated = (courseId: string) => {
    setHasPlan(true);
    setActiveCourse(courseId);
    setStudyContext(null);
    localStorage.removeItem("active_study_context");
    loadGlobalKPIs();
    setHomeMode("dashboard");
    setActiveTab("home");
  };

  const handlePreferencesSave = (preferences: StudyPreferences) => {
    saveStudyPreferences(preferences, user?.id);
    setStudyPreferences(preferences);
    setEditingPreferences(false);
    setActiveTab("home");
  };

  const handlePlansChanged = () => {
    const planAvailable = hasActiveStudyPlan();
    setHasPlan(planAvailable);
    loadGlobalKPIs();
    if (!planAvailable) {
      setStudyContext(null);
      localStorage.removeItem("active_study_context");
      setHomeMode("plans");
      setActiveTab("home");
    }
  };

  const updateStudyContext = useCallback((context: ActiveStudyContext) => {
    setStudyContext(context);
    localStorage.setItem("active_study_context", JSON.stringify(context));
  }, []);
  const openStudyContext = useCallback(
    (context?: ActiveStudyContext) => {
      if (context) updateStudyContext(context);
      setActiveTab("study");
    },
    [updateStudyContext],
  );

  const completeCurrentActivity = useCallback(async () => {
    let session = await dailyStudyApi.active();
    if (!session.id) {
      const today = await dailyStudyApi.today();
      const task = today.tasks.find(
        (item) =>
          item.roadmap_topic_id === studyContext?.roadmapTopicId &&
          ["AVAILABLE", "IN_PROGRESS"].includes(item.status),
      );
      const alreadyCompleted = today.tasks.some(
        (item) =>
          item.roadmap_topic_id === studyContext?.roadmapTopicId &&
          item.status === "COMPLETED",
      );
      if (!task && !alreadyCompleted)
        throw new Error("Não foi possível localizar a sessão deste assunto.");
      if (task)
        session = await dailyStudyApi.start(task.id, {
          mode: "FREE",
          device: navigator.userAgent.slice(0, 150),
        });
    }
    if (session.id) {
      if (session.session_kind === "QUESTIONS")
        throw new Error(
          "Finalize o Pomodoro do banco de questões antes de concluir este assunto.",
        );
      if (
        session.roadmap_topic_id &&
        studyContext?.roadmapTopicId &&
        session.roadmap_topic_id !== studyContext.roadmapTopicId
      )
        throw new Error(
          "A sessão ativa pertence a outro assunto. Retorne ao início e confira a sessão atual.",
        );
      await dailyStudyApi.finish(String(session.id), {
        questionsAnswered: 0,
        correctAnswers: 0,
        notes: "CONTENT_COMPLETED",
      });
    }
    const updated = await dailyStudyApi.today();
    setHeaderStudyData(updated);
    setHeaderTimerLoadedAt(Date.now());
    const next = updated.tasks.find((item) =>
      ["AVAILABLE", "IN_PROGRESS"].includes(item.status),
    );
    if (next)
      updateStudyContext({
        roadmapTopicId: next.roadmap_topic_id,
        topicTitle: next.topic_title,
        subjectName: next.subject_name,
        source: "daily-plan",
      });
    setDashboardVersion((value) => value + 1);
  }, [studyContext, updateStudyContext]);

  useEffect(() => {
    if (
      !hasPlan ||
      studyContext ||
      activeTab !== "study"
    )
      return;
    dailyStudyApi
      .today()
      .then((response) => {
        const running = response.active_session?.daily_task_id
          ? response.tasks.find(
              (task) => task.id === response.active_session.daily_task_id,
            )
          : undefined;
        const task =
          running ||
          response.tasks.find((item) =>
            ["AVAILABLE", "IN_PROGRESS"].includes(item.status),
          );
        if (task)
          updateStudyContext({
            roadmapTopicId: task.roadmap_topic_id,
            topicTitle: task.topic_title,
            subjectName: task.subject_name,
            source: running ? "session" : "daily-plan",
          });
      })
      .catch(() => {});
  }, [activeTab, hasPlan, studyContext, updateStudyContext]);

  // Get current brand and subtitle based on selected course
  const getBranding = () => {
    switch (activeCourse) {
      case "tecnico_enfermagem":
        return {
          title: "Gabaritando Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Saúde",
        };
      case "jornalismo":
        return {
          title: "Gabaritando Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Jornalismo",
        };
      case "policial_civil":
        return {
          title: "Gabaritando Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Polícia Civil",
        };
      case "seplag_informatica":
      default:
        return {
          title: "Gabaritando Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Tecnologia",
        };
    }
  };

  const brand = getBranding();
  const isHome = activeTab === "home";
  const navigationItems = [
    {
      id: "home" as AppTab,
      label: "Início",
      mobileLabel: "Início",
      icon: HomeIcon,
    },
    ...(hasPlan
      ? [
          {
            id: "study" as AppTab,
            label: "Meu plano",
            mobileLabel: "Meu plano",
            icon: BookOpen,
          },
          {
            id: "schedule" as AppTab,
            label: "Cronograma",
            mobileLabel: "Cronograma",
            icon: Calendar,
          },
          {
            id: "questions" as AppTab,
            label: "Questões",
            mobileLabel: "Questões",
            icon: ListChecks,
          },
          {
            id: "performance" as AppTab,
            label: "Desempenho",
            mobileLabel: "Desempenho",
            icon: ChartNoAxesCombined,
          },
        ]
      : []),
    {
      id: "career" as AppTab,
      label: "Concursos",
      mobileLabel: "Concursos",
      icon: BriefcaseBusiness,
    },
    ...(isAdmin
      ? [
          {
            id: "admin" as AppTab,
            label: "Administração",
            mobileLabel: "Admin",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];
  const activeNavigationItem =
    navigationItems.find((item) => item.id === activeTab) ||
    (activeTab === "notes"
      ? {
          id: "notes" as AppTab,
          label: "Minhas anotações",
          mobileLabel: "Anotações",
          icon: NotebookPen,
        }
      : activeTab === "performance"
      ? {
          id: "performance" as AppTab,
          label: "Desempenho",
          mobileLabel: "Progresso",
          icon: ChartNoAxesCombined,
        }
        : navigationItems[0]);
  const adminNavigationItems: Array<{
    id: AdminSection;
    label: string;
    icon: typeof Building2;
  }> = [
    { id: "contests", label: "Concursos", icon: Building2 },
    { id: "roles", label: "Editais e cargos", icon: UsersRound },
    { id: "passages", label: "Textos de apoio", icon: BookOpenText },
    { id: "questions", label: "Questões", icon: FileQuestion },
    { id: "subjects", label: "Biblioteca de assuntos", icon: BookOpenText },
    { id: "materials", label: "Materiais de estudo", icon: LibraryBig },
  ];
  const userFirstName = String(
    user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Estudante",
  )
    .trim()
    .split(/\s+/)[0];
  const normalizedFirstName = userFirstName
    ? `${userFirstName.charAt(0).toLocaleUpperCase("pt-BR")}${userFirstName.slice(1)}`
    : "Estudante";
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";
  const mobileHeaderTitle =
    hasPlan && activeTab === "home"
      ? `${timeGreeting}, ${normalizedFirstName}`
      : activeNavigationItem.label;
  const unreadNotifications = headerNotifications.filter(
    (item) => !item.read_at,
  ).length;
  const formatMinutes = (minutes: unknown) => {
    const value = Math.max(0, Number(minutes || 0));
    const hours = Math.floor(value / 60),
      rest = value % 60;
    return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
  };
  const formatClock = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600),
      minutes = Math.floor((safe % 3600) / 60),
      rest = safe % 60;
    return hours
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  };

  const activeHeaderSession = headerStudyData?.active_session?.id
    ? (headerStudyData.active_session as Partial<StudySession>)
    : null;
  const headerElapsed = activeHeaderSession
    ? Number(activeHeaderSession.elapsed_seconds || 0) +
      (activeHeaderSession.status === "RUNNING"
        ? Math.max(0, Math.floor((Date.now() - headerTimerLoadedAt) / 1_000))
        : 0)
    : 0;
  void headerTimerTick;
  const headerPomodoro = (() => {
    if (!activeHeaderSession?.pomodoro_config) return null;
    try {
      return JSON.parse(activeHeaderSession.pomodoro_config) as {
        focusMinutes?: number;
        shortBreakMinutes?: number;
        longBreakMinutes?: number;
        cycles?: number;
      };
    } catch {
      return null;
    }
  })();
  const headerFocusSeconds =
    Math.max(1, Number(headerPomodoro?.focusMinutes || 50)) * 60;
  const headerCycle = Math.max(
    0,
    Number(activeHeaderSession?.pomodoro_cycle || 0),
  );
  const headerIsBreak =
    activeHeaderSession?.mode === "POMODORO" &&
    activeHeaderSession.status === "PAUSED" &&
    activeHeaderSession.pause_reason === "POMODORO_FOCUS_COMPLETE";
  const headerBreakMinutes =
    headerCycle > 0 &&
    headerCycle % Math.max(1, Number(headerPomodoro?.cycles || 4)) === 0
      ? Number(headerPomodoro?.longBreakMinutes || 10)
      : Number(headerPomodoro?.shortBreakMinutes || 10);
  const headerPauseSeconds =
    headerIsBreak && activeHeaderSession.paused_at
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(activeHeaderSession.paused_at).getTime()) /
              1_000,
          ),
        )
      : 0;
  const headerTimerSeconds = headerIsBreak
    ? Math.max(0, headerBreakMinutes * 60 - headerPauseSeconds)
    : activeHeaderSession?.mode === "POMODORO"
      ? Math.max(
          0,
          headerFocusSeconds -
            Math.max(0, headerElapsed - headerCycle * headerFocusSeconds),
        )
      : headerElapsed;

  useEffect(() => {
    if (
      !activeHeaderSession?.id ||
      activeHeaderSession.session_kind === "QUESTIONS" ||
      activeHeaderSession.mode !== "POMODORO" ||
      activeHeaderSession.status !== "RUNNING" ||
      headerTimerSeconds > 0
    )
      return;
    const key = `${activeHeaderSession.id}:${headerCycle}`;
    if (globalAutomaticCompletionRef.current === key) return;
    globalAutomaticCompletionRef.current = key;
    const completedTitle = String(
      activeHeaderSession.topic_title || "Sessão atual",
    );
    dailyStudyApi
      .completeFocus(String(activeHeaderSession.id))
      .then(() => dailyStudyApi.today())
      .then((updated) => {
        setHeaderStudyData(updated);
        setHeaderTimerLoadedAt(Date.now());
        const next = updated.tasks.find((item) =>
          ["AVAILABLE", "IN_PROGRESS"].includes(item.status),
        );
        if (next)
          updateStudyContext({
            roadmapTopicId: next.roadmap_topic_id,
            topicTitle: next.topic_title,
            subjectName: next.subject_name,
            source: "daily-plan",
          });
        setBreakNotice({ title: completedTitle, minutes: 10 });
        playGentleBreakChime();
        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("Pomodoro concluído", {
              body: next
                ? `Próximo assunto: ${next.topic_title}. Faça uma pausa antes de começar.`
                : "Todas as sessões planejadas para hoje foram concluídas.",
              tag: `focus-complete:${key}`,
            });
          } catch {}
        }
        setDashboardVersion((value) => value + 1);
      })
      .catch((error) => {
        globalAutomaticCompletionRef.current = "";
        console.warn("Não foi possível concluir o Pomodoro.", error);
      });
  }, [
    activeHeaderSession?.id,
    activeHeaderSession?.mode,
    activeHeaderSession?.session_kind,
    activeHeaderSession?.status,
    headerCycle,
    headerTimerSeconds,
    playGentleBreakChime,
    updateStudyContext,
  ]);

  useEffect(() => {
    if (!headerIsBreak || !activeHeaderSession?.id) return;
    const key = `${activeHeaderSession.id}:${headerCycle}`;
    if (breakAlertedRef.current === key) return;
    breakAlertedRef.current = key;
    const minutes = Math.max(1, Math.round(headerBreakMinutes));
    const title = String(
      activeHeaderSession.topic_title ||
        activeHeaderSession.context_title ||
        "Sessão atual",
    );
    setBreakNotice({ title, minutes });
    playGentleBreakChime();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Momento de descanso", {
          body: `Seu foco terminou. Faça uma pausa de ${minutes} minutos.`,
          tag: key,
        });
      } catch {}
    }
  }, [
    activeHeaderSession?.context_title,
    activeHeaderSession?.id,
    activeHeaderSession?.topic_title,
    headerBreakMinutes,
    headerCycle,
    headerIsBreak,
    playGentleBreakChime,
  ]);

  useEffect(() => {
    if (!headerIsBreak || headerTimerSeconds > 0 || !activeHeaderSession?.id)
      return;
    const key = `${activeHeaderSession.id}:${headerCycle}`;
    if (completedBreakAlertedRef.current === key) return;
    completedBreakAlertedRef.current = key;
    const title = String(
      activeHeaderSession.topic_title ||
        activeHeaderSession.context_title ||
        "Sessão atual",
    );
    setCompletedBreakError("");
    setCompletedBreakPrompt({
      sessionId: String(activeHeaderSession.id),
      title,
    });
    playBreakCompletedChime();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Descanso concluído", {
          body: "O intervalo terminou. Sua próxima sessão de foco está pronta.",
          tag: `break-complete:${key}`,
        });
      } catch {}
    }
  }, [
    activeHeaderSession?.context_title,
    activeHeaderSession?.id,
    activeHeaderSession?.topic_title,
    headerCycle,
    headerIsBreak,
    headerTimerSeconds,
    playBreakCompletedChime,
  ]);

  const resumeAfterCompletedBreak = async () => {
    if (!completedBreakPrompt || completedBreakBusy) return;
    setCompletedBreakBusy(true);
    setCompletedBreakError("");
    try {
      const updated = await dailyStudyApi.resume(
        completedBreakPrompt.sessionId,
      );
      setHeaderStudyData((current) =>
        current ? { ...current, active_session: updated } : current,
      );
      setHeaderTimerLoadedAt(Date.now());
      setCompletedBreakPrompt(null);
      setDashboardVersion((value) => value + 1);
    } catch (error) {
      setCompletedBreakError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a próxima sessão.",
      );
    } finally {
      setCompletedBreakBusy(false);
    }
  };

  const pauseContextQuestionSession = async () => {
    if (!activeHeaderSession?.id || contextSessionBusy) return;
    setContextSessionBusy(true);
    setContextSessionError("");
    try {
      const updated = await dailyStudyApi.pause(
        String(activeHeaderSession.id),
        "Pausa manual",
      );
      setHeaderStudyData((current) =>
        current ? { ...current, active_session: updated } : current,
      );
      setHeaderTimerLoadedAt(Date.now());
    } catch (error) {
      setContextSessionError(
        error instanceof Error ? error.message : "Não foi possível pausar.",
      );
    } finally {
      setContextSessionBusy(false);
    }
  };

  const resumeContextQuestionSession = async () => {
    if (!activeHeaderSession?.id || contextSessionBusy) return;
    setContextSessionBusy(true);
    setContextSessionError("");
    try {
      const updated = await dailyStudyApi.resume(
        String(activeHeaderSession.id),
      );
      setHeaderStudyData((current) =>
        current ? { ...current, active_session: updated } : current,
      );
      setHeaderTimerLoadedAt(Date.now());
    } catch (error) {
      setContextSessionError(
        error instanceof Error
          ? error.message
          : "Não foi possível continuar.",
      );
    } finally {
      setContextSessionBusy(false);
    }
  };

  const finishContextQuestionSession = async () => {
    if (!activeHeaderSession?.id || contextSessionBusy) return;
    setContextSessionBusy(true);
    setContextSessionError("");
    try {
      await dailyStudyApi.finishQuestionPractice(
        String(activeHeaderSession.id),
      );
      setHeaderStudyData((current) =>
        current ? { ...current, active_session: {} } : current,
      );
      setHeaderTimerLoadedAt(Date.now());
      setQuestionDailyTask(null);
      setBreakNotice(null);
      setCompletedBreakPrompt(null);
      setDashboardVersion((value) => value + 1);
    } catch (error) {
      setContextSessionError(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar.",
      );
    } finally {
      setContextSessionBusy(false);
    }
  };

  const requestNewPlanConfiguration = useCallback(async () => {
    let session = headerStudyData?.active_session?.id
      ? (headerStudyData.active_session as Partial<StudySession>)
      : null;
    try {
      const latestSession = await dailyStudyApi.active();
      session = latestSession.id ? latestSession : null;
    } catch (error) {
      console.warn(
        "Não foi possível atualizar a sessão antes de criar o plano.",
        error,
      );
    }
    if (!session?.id) return true;
    return new Promise<boolean>((resolve) => {
      newPlanDecisionRef.current = resolve;
      setNewPlanSessionError("");
      setNewPlanSessionPrompt(session);
    });
  }, [headerStudyData]);

  const keepCurrentSession = () => {
    if (newPlanSessionBusy) return;
    newPlanDecisionRef.current?.(false);
    newPlanDecisionRef.current = null;
    setNewPlanSessionPrompt(null);
    setNewPlanSessionError("");
  };

  const leaveSessionForNewPlan = async () => {
    if (!newPlanSessionPrompt?.id || newPlanSessionBusy) return;
    setNewPlanSessionBusy(true);
    setNewPlanSessionError("");
    try {
      await dailyStudyApi.cancel(
        String(newPlanSessionPrompt.id),
        "Sessão cancelada pelo usuário antes de configurar um novo plano.",
      );
      setHeaderStudyData((current) =>
        current ? { ...current, active_session: {} } : current,
      );
      setHeaderTimerLoadedAt(Date.now());
      setStudyContext(null);
      localStorage.removeItem("active_study_context");
      setDashboardVersion((value) => value + 1);
      newPlanDecisionRef.current?.(true);
      newPlanDecisionRef.current = null;
      setNewPlanSessionPrompt(null);
    } catch (error) {
      setNewPlanSessionError(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar a sessão atual.",
      );
    } finally {
      setNewPlanSessionBusy(false);
    }
  };

  const globalSessionTimer = (mobile = false) =>
    activeHeaderSession && (
      <div
        className={`${mobile ? "mobile-global-session-timer" : "global-session-timer"} ${activeHeaderSession.status === "PAUSED" ? "is-paused" : ""}`}
        aria-label={`${headerIsBreak ? "Descanso" : activeHeaderSession.mode === "POMODORO" ? "Pomodoro" : "Tempo de estudo"}: ${formatClock(headerTimerSeconds)}${activeHeaderSession.status === "PAUSED" ? ", pausado" : ""}`}
      >
        <span className="global-timer-icon">
          <Clock3 />
        </span>
        <div>
          <small>
            {headerIsBreak
              ? "Descanso"
              : activeHeaderSession.session_kind === "QUESTIONS"
                ? activeHeaderSession.mode === "POMODORO"
                  ? "Pomodoro de questões"
                  : "Questões em tempo livre"
                : activeHeaderSession.mode === "POMODORO"
                  ? "Pomodoro"
                  : "Tempo estudando"}
          </small>
          <strong>{formatClock(headerTimerSeconds)}</strong>
        </div>
        <span className="global-timer-state">
          {headerIsBreak
            ? "Intervalo"
            : activeHeaderSession.status === "PAUSED"
              ? "Pausado"
              : "Em andamento"}
        </span>
      </div>
    );

  const openPlanManager = () => {
    setProfileMenuOpen(false);
    setMobileProfileOpen(false);
    setNotificationMenuOpen(false);
    setHomeMode("plans");
    setActiveTab("home");
    setPlansBootstrapping(true);
    studyPlansApi.getSummaries()
      .then(setServerPlans)
      .catch(() => {})
      .finally(() => setPlansBootstrapping(false));
  };
  const openProfileDestination = (
    tab: "career" | "schedule" | "performance" | "notes" | "admin",
  ) => {
    setProfileMenuOpen(false);
    setMobileProfileOpen(false);
    setNotificationMenuOpen(false);
    setActiveTab(tab);
  };
  const openNotedQuestion = (note: QuestionNote) => {
    if (note.course_id && note.course_id !== activeCourse) {
      localStorage.setItem("active_course", note.course_id);
      setActiveCourse(note.course_id);
    }
    setQuestionDailyTask(null);
    setNotedQuestionId(String(note.question_id));
    setActiveTab("questions");
  };
  const toggleNotifications = () => {
    setNotificationMenuOpen((value) => !value);
    setProfileMenuOpen(false);
    setMobileProfileOpen(false);
    if (!notificationMenuOpen) void loadHeaderNotifications(true);
  };
  const readNotification = async (id: string) => {
    try {
      await notificationsApi.read(id);
      setHeaderNotifications((items) =>
        items.filter((item) => String(item.id) !== id),
      );
    } catch (error) {
      console.warn("Não foi possível marcar a notificação como lida.", error);
    }
  };
  const readAllNotifications = async () => {
    if (markingAllNotifications || unreadNotifications === 0) return;
    setMarkingAllNotifications(true);
    try {
      await notificationsApi.readAll();
      setHeaderNotifications([]);
    } catch (error) {
      console.warn(
        "Não foi possível marcar as notificações como lidas.",
        error,
      );
    } finally {
      setMarkingAllNotifications(false);
    }
  };
  const profileContent = () => (
    <>
      <div className="profile-summary">
        <span>
          <UserRound />
        </span>
        <div>
          <strong>
            {String(
              user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "Estudante",
            )}
          </strong>
          <small>{user?.email}</small>
        </div>
      </div>
      {hasPlan && headerStudyData && (
        <section
          className="profile-study-overview"
          aria-label="Progresso de estudos"
        >
          <div className="profile-progress-heading">
            <div>
              <small>Progresso de hoje</small>
              <strong>
                {Math.round(
                  Number(headerStudyData.today.progress_percentage || 0),
                )}
                %
              </strong>
            </div>
            <span>
              {formatMinutes(headerStudyData.today.completed_minutes)} estudados
            </span>
          </div>
          <div className="profile-progress-track" aria-hidden="true">
            <i
              style={{
                width: `${Math.min(100, Number(headerStudyData.today.progress_percentage || 0))}%`,
              }}
            />
          </div>
          <div className="profile-study-grid">
            <article className="profile-streak-card">
              <span>
                <Flame />
              </span>
              <div>
                <small>Ofensiva</small>
                <strong>
                  {Number(headerStudyData.streak.current_streak || 0)} dias
                </strong>
                <p>
                  Recorde: {Number(headerStudyData.streak.longest_streak || 0)}{" "}
                  dias
                </p>
                <p>
                  <ShieldCheck />
                  {Number(headerStudyData.streak.protection_balance || 0)}{" "}
                  proteções disponíveis
                </p>
              </div>
            </article>
            <article>
              <span>
                <Star />
              </span>
              <div>
                <small>Nível {headerStudyData.experience.level}</small>
                <strong>{headerStudyData.experience.level_name}</strong>
                <p>
                  {Number(headerStudyData.experience.total_xp || 0)} XP
                  acumulados
                </p>
              </div>
            </article>
            <article>
              <span>
                <Target />
              </span>
              <div>
                <small>Meta diária</small>
                <strong>
                  {formatMinutes(headerStudyData.today.completed_minutes)} /{" "}
                  {formatMinutes(headerStudyData.today.goal_minutes)}
                </strong>
                <p>
                  {formatMinutes(headerStudyData.today.remaining_minutes)}{" "}
                  restantes
                </p>
              </div>
            </article>
          </div>
        </section>
      )}
      <nav className="profile-destinations" aria-label="Áreas do perfil">
          <button
            type="button"
            onClick={() => openProfileDestination("notes")}
          >
            <span>
              <NotebookPen />
              <span>
                <strong>Minhas anotações</strong>
                <small>Questões salvas para revisar</small>
              </span>
            </span>
            <ChevronRight />
          </button>
        {hasPlan && (
          <>
          <button
            type="button"
            onClick={() => openProfileDestination("performance")}
          >
            <span>
              <ChartNoAxesCombined />
              <span>
                <strong>Progresso</strong>
                <small>Resultados e evolução</small>
              </span>
            </span>
            <ChevronRight />
          </button>
          <button
            type="button"
            onClick={() => openProfileDestination("career")}
          >
            <span>
              <BriefcaseBusiness />
              <span>
                <strong>Concursos</strong>
                <small>Preparações e cargos disponíveis</small>
              </span>
            </span>
            <ChevronRight />
          </button>
          </>
        )}
      </nav>
      {isAdmin && (
        <nav className="profile-destinations" aria-label="Administração">
          <button type="button" onClick={() => openProfileDestination("admin")}>
            <span>
              <ShieldCheck />
              <span>
                <strong>Administração</strong>
                <small>Catálogo e conteúdos</small>
              </span>
            </span>
            <ChevronRight />
          </button>
        </nav>
      )}
      <div className="profile-account-actions">
        <button type="button" onClick={openPlanManager}>
          <Settings2 />
          <span>Gerenciar preparações</span>
        </button>
        <button
          type="button"
          className="profile-logout"
          onClick={() => {
            setProfileMenuOpen(false);
            setMobileProfileOpen(false);
            void signOut();
          }}
        >
          <LogOut />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  const accountActions = (mobile = false) => (
    <div className={mobile ? "mobile-account-actions" : "app-account"}>
      {!mobile &&
        hasPlan &&
        activeHeaderSession?.session_kind !== "QUESTIONS" &&
        globalSessionTimer()}
      {hasPlan && (
        <div
          className="header-streak-trigger"
          role="img"
          aria-label={`Ofensiva atual: ${Number(headerStudyData?.streak?.current_streak || 0)} dias`}
          title={`Ofensiva atual: ${Number(headerStudyData?.streak?.current_streak || 0)} dias`}
        >
          <Flame aria-hidden="true" />
          <span>{Number(headerStudyData?.streak?.current_streak || 0)}</span>
        </div>
      )}
      <div className="header-menu" data-header-menu>
        <button
          type="button"
          className="header-action-button notification-trigger"
          onClick={toggleNotifications}
          aria-label="Abrir notificações"
          aria-expanded={notificationMenuOpen}
          aria-haspopup="dialog"
        >
          <Bell />
          {unreadNotifications > 0 && (
            <span className="notification-count">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>
        {notificationMenuOpen && (
          <aside
            className="notification-popover header-notification-popover"
            role="dialog"
            aria-labelledby="notification-panel-title"
          >
            <div className="notification-panel-header">
              <div>
                <strong id="notification-panel-title">Notificações</strong>
                <span>
                  {unreadNotifications > 0
                    ? `${unreadNotifications} ${unreadNotifications === 1 ? "pendente" : "pendentes"}`
                    : "Nenhuma pendente"}
                </span>
              </div>
              <button
                type="button"
                className="icon-only"
                onClick={() => setNotificationMenuOpen(false)}
                aria-label="Fechar notificações"
              >
                <X />
              </button>
            </div>
            <div className="notification-list">
              {notificationLoading && headerNotifications.length === 0 && (
                <div className="notification-loading" role="status">
                  <RefreshCw />
                  <span>Carregando notificações...</span>
                </div>
              )}
              {notificationError && (
                <div className="notification-load-error" role="alert">
                  <p>Não foi possível carregar as notificações.</p>
                  <button
                    type="button"
                    onClick={() => void loadHeaderNotifications(true)}
                  >
                    <RefreshCw /> Tentar novamente
                  </button>
                </div>
              )}
              {!notificationLoading &&
                !notificationError &&
                headerNotifications.length === 0 && (
                  <p className="empty-note">
                    Tudo em dia. Você não possui notificações pendentes.
                  </p>
                )}
              {headerNotifications.map((item) => (
                <button
                  type="button"
                  key={String(item.id)}
                  className={`notification-item ${item.read_at ? "" : "is-unread"}`}
                  onClick={() => void readNotification(String(item.id))}
                >
                  <strong>{String(item.title)}</strong>
                  <span>{String(item.message)}</span>
                </button>
              ))}
            </div>
            {headerNotifications.length > 0 && (
              <div className="notification-panel-footer">
                <button
                  type="button"
                  className="read-all"
                  disabled={
                    unreadNotifications === 0 || markingAllNotifications
                  }
                  onClick={() => void readAllNotifications()}
                >
                  <CheckCheck />
                  <span>
                    {markingAllNotifications
                      ? "Marcando..."
                      : unreadNotifications === 0
                        ? "Todas foram lidas"
                        : "Marcar todas como lidas"}
                  </span>
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
      {!mobile && (
        <div className="header-menu" data-header-menu>
          <button
            type="button"
            className="header-action-button profile-trigger"
            onClick={() => {
              setProfileMenuOpen((value) => !value);
              setNotificationMenuOpen(false);
            }}
            aria-label="Abrir perfil do usuário"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <UserRound />
          </button>
          {profileMenuOpen && (
            <aside className="profile-popover" role="menu">
              {profileContent()}
            </aside>
          )}
        </div>
      )}
    </div>
  );

  const showContextRail = Boolean(
    studyPreferences && !editingPreferences && activeTab !== "admin",
  );
  const contextualExamDate = String(
    headerStudyData?.plan?.exam_date || headerStudyData?.plan?.examDate || "",
  );
  const contextualExamDays = (() => {
    if (!contextualExamDate) return null;
    const target = new Date(`${contextualExamDate}T00:00:00`).getTime();
    if (!Number.isFinite(target)) return null;
    return Math.ceil((target - Date.now()) / 86_400_000);
  })();
  const contextualCurrentTask = activeHeaderSession?.daily_task_id
    ? headerStudyData?.tasks?.find(
        (task) => task.id === activeHeaderSession.daily_task_id,
      )
    : undefined;
  const contextualScheduledCurrentTask =
    contextualCurrentTask ||
    headerStudyData?.tasks?.find((task) =>
      ["AVAILABLE", "IN_PROGRESS"].includes(task.status),
    ) ||
    headerStudyData?.tasks?.find(
      (task) => !["COMPLETED", "SKIPPED"].includes(task.status),
    );
  const contextualNextTask = contextualScheduledCurrentTask;
  const contextualCurrentTaskIndex = contextualScheduledCurrentTask
    ? (headerStudyData?.tasks?.findIndex(
        (task) => task.id === contextualScheduledCurrentTask.id,
      ) ?? -1)
    : -1;
  const contextualHomeNextTask = headerStudyData?.tasks?.find(
    (task, index) =>
      index > contextualCurrentTaskIndex &&
      !["COMPLETED", "SKIPPED"].includes(task.status),
  );
  const contextualAlert = headerStudyData?.notifications?.find(
    (notification) =>
      notification.priority === "HIGH" && !notification.read_at,
  );
  const contextualStreak = Math.max(
    0,
    Number(headerStudyData?.streak?.current_streak || 0),
  );
  const contextualStudiedDays = Math.max(
    0,
    Number(headerStudyData?.streak?.studied_days_month || 0),
  );
  const contextualProgress = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(headerStudyData?.today?.progress_percentage || 0)),
    ),
  );
  const contextRail = showContextRail && (
    <aside
      className="app-context-rail"
      aria-label="Resumo e atalhos contextuais"
    >
      <header className="context-rail-heading">
        <div>
          <span>Visão rápida</span>
          <h2>{activeNavigationItem.label}</h2>
        </div>
        <span className="context-rail-live">
          <i />
          {hasPlan ? "Plano ativo" : "Configuração pronta"}
        </span>
      </header>

      {hasPlan ? (
        <>
          {activeTab === "home" && (
            <>
              <section className="context-next-card context-home-card" aria-label="Próxima atividade">
                <div className="context-card-heading">
                  <div>
                    <span>Próxima atividade</span>
                    <strong>Após a sessão atual</strong>
                  </div>
                  <BookOpen aria-hidden="true" />
                </div>
                <h3>{String(contextualHomeNextTask?.topic_title || "Nenhuma atividade depois desta")}</h3>
                <p>{String(contextualHomeNextTask?.subject_name || "Conclua a sessão atual para atualizar a próxima atividade.")}</p>
              </section>

              <section className="context-home-streak-card" aria-label="Sequência de estudos">
                <Flame aria-hidden="true" />
                <div>
                  <span>Sequência de estudos</span>
                  <strong>{contextualStreak} {contextualStreak === 1 ? "dia" : "dias"}</strong>
                  <p>{contextualStudiedDays} {contextualStudiedDays === 1 ? "dia estudado" : "dias estudados"} neste mês</p>
                </div>
              </section>

              <section className="context-home-alert-card" aria-label="Alertas do edital">
                <span className="context-card-label">Alertas do edital</span>
                <h3>{String(contextualAlert?.title || (contextualExamDays === null ? "Data da prova a definir" : contextualExamDays <= 0 ? "A prova é hoje" : `Faltam ${contextualExamDays} dias`))}</h3>
                <p>{String(contextualAlert?.message || (contextualExamDate ? `Prova em ${contextualExamDate.split("-").reverse().join("/")}.` : "Defina a data da prova para receber alertas de prazo."))}</p>
              </section>
            </>
          )}
          <section
            className="context-primary-card context-default-card"
            aria-label="Preparação ativa"
          >
            <span className="context-card-label">Preparação ativa</span>
            <h3>{String(headerStudyData?.plan?.title || brand.focus)}</h3>
            <div className="context-exam-row">
              <Calendar aria-hidden="true" />
              <div>
                <span>Data da prova</span>
                <strong>
                  {contextualExamDate
                    ? contextualExamDate.split("-").reverse().join("/")
                    : "A definir"}
                </strong>
              </div>
              {contextualExamDays !== null && (
                <b>
                  {contextualExamDays < 0
                    ? "Encerrada"
                    : contextualExamDays === 0
                      ? "Hoje"
                      : `${contextualExamDays} dias`}
                </b>
              )}
            </div>
          </section>

          <section
            className="context-progress-card context-default-card"
            aria-label="Progresso de hoje"
          >
            <div className="context-card-heading">
              <div>
                <span>Progresso de hoje</span>
                <strong>{contextualProgress}%</strong>
              </div>
              <Target aria-hidden="true" />
            </div>
            <div className="context-progress-track" aria-hidden="true">
              <i style={{ width: `${contextualProgress}%` }} />
            </div>
            <div className="context-progress-meta">
              <span>
                {formatMinutes(headerStudyData?.today?.completed_minutes)}{" "}
                estudados
              </span>
              <span>
                {formatMinutes(headerStudyData?.today?.remaining_minutes)}{" "}
                restantes
              </span>
            </div>
          </section>

          <section className="context-next-card context-default-card" aria-label="Próxima atividade">
            <div className="context-card-heading">
              <div>
                <span>Próxima atividade</span>
                <strong>
                  {contextualNextTask
                    ? "Pronta para começar"
                    : "Rotina concluída"}
                </strong>
              </div>
              <BookOpen aria-hidden="true" />
            </div>
            <h3>
              {String(
                contextualNextTask?.topic_title ||
                  headerStudyData?.next?.title ||
                  "Nenhuma atividade pendente",
              )}
            </h3>
            <p>
              {String(
                contextualNextTask?.subject_name ||
                  "Siga o cronograma para manter a preparação em dia.",
              )}
            </p>
            {contextualNextTask && (
              <button
                type="button"
                onClick={() => {
                  if (contextualNextTask.activity_type === "QUESTIONS") {
                    setQuestionDailyTask({
                      id: contextualNextTask.id,
                      minutes: contextualNextTask.planned_minutes,
                    });
                    setNotedQuestionId("");
                    setActiveTab("questions");
                  } else setActiveTab("study");
                }}
              >
                <Play aria-hidden="true" />{" "}
                {contextualNextTask.activity_type === "QUESTIONS"
                  ? "Fazer questões"
                  : "Continuar estudando"}
              </button>
            )}
          </section>

          {activeHeaderSession && (
            <section
              className="context-session-card context-default-card"
              aria-label="Sessão em andamento"
            >
              <span>
                <Clock3 aria-hidden="true" />
              </span>
              <div>
                <small>
                  {headerIsBreak ? "Intervalo atual" : "Sessão em andamento"}
                </small>
                <strong>{formatClock(headerTimerSeconds)}</strong>
                <p>
                  {String(
                    activeHeaderSession.topic_title ||
                      activeHeaderSession.context_title ||
                      "Atividade atual",
                  )}
                </p>
              </div>
              {activeHeaderSession.session_kind === "QUESTIONS" && (
                <div className="context-session-controls">
                  {activeHeaderSession.status === "RUNNING" ? (
                    <button
                      type="button"
                      disabled={contextSessionBusy}
                      onClick={() => void pauseContextQuestionSession()}
                    >
                      <Pause aria-hidden="true" /> Pausar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={contextSessionBusy}
                      onClick={() => void resumeContextQuestionSession()}
                    >
                      <Play aria-hidden="true" /> Continuar
                    </button>
                  )}
                  <button
                    type="button"
                    className="is-finish"
                    disabled={contextSessionBusy}
                    onClick={() => void finishContextQuestionSession()}
                  >
                    <Square aria-hidden="true" /> Finalizar
                  </button>
                </div>
              )}
              {contextSessionError && (
                <p className="context-session-error" role="alert">
                  {contextSessionError}
                </p>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <section
            className="context-primary-card context-availability-card"
            aria-label="Disponibilidade configurada"
          >
            <span className="context-card-label">
              Disponibilidade configurada
            </span>
            <h3>{studyPreferences?.hoursPerDay || 0} horas por dia</h3>
            <p>
              {studyPreferences?.selectedWeekdays.length || 0} dias de estudo
              por semana
            </p>
            <p>
              A data será definida automaticamente quando você escolher um
              concurso.
            </p>
          </section>
          <section className="context-guidance-card">
            <BriefcaseBusiness aria-hidden="true" />
            <h3>Escolha sua preparação</h3>
            <p>
              Selecione o concurso e o cargo. O edital será distribuído
              automaticamente no seu cronograma.
            </p>
            <button type="button" onClick={() => setActiveTab("career")}>
              Explorar concursos <ChevronRight aria-hidden="true" />
            </button>
          </section>
        </>
      )}
    </aside>
  );

  return (
    <div
      className={`app-shell min-h-screen bg-slate-50 text-slate-800 flex flex-col ${hasPlan ? "has-plan" : "no-plan"} ${hasPlan || studyPreferences || isAdmin ? "has-desktop-navigation" : ""} ${showContextRail ? "has-context-rail" : ""} ${activeTab === "home" ? "is-home-tab" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${activeHeaderSession && activeHeaderSession.session_kind !== "QUESTIONS" && activeTab !== "home" ? "has-active-timer" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo principal
      </a>
      {/* Upper Navigation & App Bar */}
      <header className="app-header bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="app-header-inner w-full px-4 sm:px-6 xl:px-8 2xl:px-10">
          <div className="desktop-header-content flex items-center justify-between min-h-16 py-2">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 flex items-center justify-center shrink-0">
                <div
                  className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm"
                  aria-hidden="true"
                >
                  <BookOpenCheck />
                </div>
              </div>
              <div className="space-y-0.5">
                {isHome ? (
                  <>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                      Gabaritando Concursos
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Planejamento enxuto para reta final
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                      <span className="app-course-title">{brand.title}</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {brand.focus}
                      </span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {brand.subtitle}
                    </p>
                  </>
                )}
              </div>
            </div>

            {accountActions()}
          </div>
          <div
            className="mobile-header-content"
            aria-label="Cabeçalho da tela atual"
          >
            <div className="mobile-brand-mark" aria-hidden="true">
              <BookOpenCheck />
            </div>
            <div className="min-w-0">
              <span className="mobile-header-context">
                {hasPlan ? brand.focus : "Gabarita Concursos"}
              </span>
              <h1>{mobileHeaderTitle}</h1>
            </div>
            {accountActions(true)}
          </div>
          {hasPlan &&
            activeTab !== "home" &&
            activeHeaderSession?.session_kind !== "QUESTIONS" &&
            globalSessionTimer(true)}
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="app-main" tabIndex={-1}>
        {/* Navigation */}
        {(hasPlan || studyPreferences || isAdmin) && (
          <nav
            className="app-navigation desktop-app-navigation flex space-x-1 lg:space-x-2 bg-slate-100 p-1.5 rounded-xl self-start w-full md:w-auto"
            aria-label="Navegação principal"
          >
            {hasPlan && (
              <div className="sidebar-control">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                    Painel
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Rotina de estudo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  className="sidebar-toggle"
                  aria-label={
                    sidebarCollapsed
                      ? "Expandir menu lateral"
                      : "Recolher menu lateral"
                  }
                  aria-expanded={!sidebarCollapsed}
                  title={
                    sidebarCollapsed
                      ? "Expandir menu lateral"
                      : "Recolher menu lateral"
                  }
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              if (item.id === "admin")
                return (
                  <div
                    key={item.id}
                    className={`sidebar-admin-group ${adminMenuOpen ? "is-open" : ""}`}
                  >
                    <button
                      type="button"
                      id="tab-admin-trigger"
                      onClick={() => {
                        setAdminMenuOpen((open) =>
                          sidebarCollapsed ? true : !open,
                        );
                        if (sidebarCollapsed) setSidebarCollapsed(false);
                      }}
                      className="sidebar-admin-trigger"
                      aria-current={activeTab === "admin" ? "page" : undefined}
                      aria-expanded={adminMenuOpen}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Administração</span>
                      <ChevronDown className="sidebar-admin-chevron" />
                    </button>
                    {adminMenuOpen && (
                      <div
                        className="sidebar-admin-submenu"
                        aria-label="Seções administrativas"
                      >
                        {adminNavigationItems.map((adminItem) => {
                          const AdminIcon = adminItem.icon;
                          return (
                            <button
                              type="button"
                              key={adminItem.id}
                              onClick={() => {
                                setActiveTab("admin");
                                setAdminSection(adminItem.id);
                              }}
                              aria-current={
                                activeTab === "admin" &&
                                adminSection === adminItem.id
                                  ? "page"
                                  : undefined
                              }
                            >
                              <AdminIcon />
                              <span>{adminItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}-trigger`}
                  onClick={() => {
                    if (item.id === "questions") setNotedQuestionId("");
                    setActiveTab(item.id);
                    if (item.id === "home") setHomeMode("dashboard");
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                    activeTab === item.id
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                  aria-current={activeTab === item.id ? "page" : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Tab Content Rendering */}
        <div className="app-content min-w-0 flex-grow transition-all duration-300">
          <Suspense fallback={(
            <section className="mx-auto flex min-h-64 max-w-4xl items-center justify-center gap-3 text-slate-500" role="status">
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Carregando esta tela…</span>
            </section>
          )}>
          {activeTab === "home" && plansBootstrapping && (
            <section className="mx-auto flex min-h-64 max-w-4xl items-center justify-center gap-3 text-slate-500" role="status">
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Carregando sua preparação…</span>
            </section>
          )}
          {activeTab === "home" && !plansBootstrapping && homeMode === "plans" && (
            <PlanManager
              initialPlans={serverPlans}
              onActivated={(_courseId, plan) => {
                hydrateActivePlan(plan);
                setServerPlans(current => current.map(item => ({
                  ...item,
                  is_primary: item.id === plan.id,
                  is_active: item.id === plan.id,
                })));
                setHomeMode("dashboard");
              }}
              onEdit={(courseId) => {
                if (courseId) {
                  localStorage.setItem("active_course", courseId);
                  setActiveCourse(courseId);
                }
                setActiveTab("career");
              }}
              onDeleted={(_courseId, plan) => {
                setServerPlans(current => {
                  const remaining = current.filter(item => item.id !== plan.id);
                  if (remaining.length === 0) setHomeMode("dashboard");
                  return remaining;
                });
                if (isPrimaryPlan(plan)) {
                  const deletedCourseId = String(plan.course_id || plan.courseId || "");
                  localStorage.setItem("study_plan_deleted", "true");
                  ["active_course", "study_config", "active_study_context"].forEach(key => localStorage.removeItem(key));
                  if (deletedCourseId) localStorage.removeItem(`${deletedCourseId}_study_config`);
                  setHasPlan(false);
                }
              }}
            />
          )}
          {activeTab === "home" &&
            !plansBootstrapping &&
            homeMode !== "plans" &&
            (!studyPreferences || editingPreferences) && (
              <InitialStudySetup
                initial={studyPreferences}
                onSave={handlePreferencesSave}
              />
            )}
          {activeTab === "home" &&
            !plansBootstrapping &&
            studyPreferences &&
            !editingPreferences &&
            hasPlan &&
            homeMode === "dashboard" && (
              <StudyDashboard
                key={dashboardVersion}
                initialData={headerStudyData}
                onManagePlans={openPlanManager}
                onOpenStudy={openStudyContext}
                onOpenQuestions={(id, minutes) => {
                  setQuestionDailyTask(
                    id ? { id, minutes: minutes || 30 } : null,
                  );
                  setNotedQuestionId("");
                  setActiveTab("questions");
                }}
                onStudyContextChange={updateStudyContext}
                onSessionChange={handleSessionChange}
              />
            )}
          {activeTab === "home" &&
            !plansBootstrapping &&
            homeMode !== "plans" &&
            studyPreferences &&
            !editingPreferences &&
            !hasPlan && (
              <section className="mx-auto max-w-4xl animate-fade-in rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <BriefcaseBusiness className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  Sua disponibilidade está pronta
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                  Agora acesse Concursos, escolha o edital e depois o cargo.
                  Todo o conteúdo será incluído automaticamente no cronograma.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("career")}
                  className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-indigo-700"
                >
                  Explorar concursos
                </button>
              </section>
            )}
          {activeTab === "career" && studyPreferences && (
            <CareerTab
              preferences={studyPreferences}
              onPlanGenerated={handlePlanGenerated}
              onBeforeCreatePlan={requestNewPlanConfiguration}
              onEditPreferences={() => {
                setEditingPreferences(true);
                setActiveTab("home");
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              onPlansChanged={handlePlansChanged}
            />
          )}
          {hasPlan && activeTab === "study" && (
            <StudyTab
              studyContext={studyContext}
              onCurrentActivityComplete={completeCurrentActivity}
            />
          )}
          {hasPlan && activeTab === "schedule" && (
            <ScheduleTab
              studyContext={studyContext}
              refreshVersion={dashboardVersion}
              onOpenStudy={openStudyContext}
              onOpenQuestions={() => {
                setQuestionDailyTask(null);
                setNotedQuestionId("");
                setActiveTab("questions");
              }}
            />
          )}
          {hasPlan && (
            <QuestionBankTab
              visible={activeTab === "questions"}
              externalSession={
                headerStudyData ? activeHeaderSession : undefined
              }
              dailyTask={questionDailyTask}
              initialQuestionId={notedQuestionId}
              onDailyTaskFinished={() => setQuestionDailyTask(null)}
              onSessionChange={handleSessionChange}
            />
          )}
          {hasPlan && activeTab === "performance" && <PerformanceTab />}
          {activeTab === "notes" && (
            <QuestionNotesTab onOpenQuestion={openNotedQuestion} />
          )}
          {isAdmin && activeTab === "admin" && (
            <AdminPanel
              activeSection={adminSection}
              onSectionChange={setAdminSection}
            />
          )}
          </Suspense>
        </div>
        {contextRail}
      </main>

      {newPlanSessionPrompt && (
        <div className="finish-modal-backdrop" role="presentation">
          <section
            className="finish-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="new-plan-session-title"
            aria-describedby="new-plan-session-description"
          >
            <span className="finish-icon !bg-amber-50 !text-amber-700">
              <Clock3 />
            </span>
            <h3 id="new-plan-session-title">Existe uma sessão em andamento</h3>
            <p id="new-plan-session-description">
              Você iniciou{" "}
              {newPlanSessionPrompt.session_kind === "QUESTIONS"
                ? "um Pomodoro de questões"
                : newPlanSessionPrompt.mode === "POMODORO"
                  ? "um Pomodoro"
                  : "uma sessão de estudo"}
              {newPlanSessionPrompt.topic_title
                ? ` em “${newPlanSessionPrompt.topic_title}”`
                : ""}
              . Para configurar um novo plano, essa sessão será cancelada e o
              cronômetro voltará a zero. Depois, será necessário iniciar
              novamente o assunto e a sessão.
            </p>
            {newPlanSessionError && (
              <p role="alert" className="!mb-0 !text-rose-700">
                {newPlanSessionError}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                disabled={newPlanSessionBusy}
                onClick={keepCurrentSession}
                className="min-h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold disabled:opacity-50"
              >
                Continuar estudando
              </button>
              <button
                type="button"
                disabled={newPlanSessionBusy}
                onClick={() => void leaveSessionForNewPlan()}
                className="min-h-11 px-4 rounded-xl bg-rose-600 text-white text-sm font-extrabold disabled:opacity-50"
              >
                {newPlanSessionBusy
                  ? "Encerrando sessão…"
                  : "Sair e zerar sessão"}
              </button>
            </div>
          </section>
        </div>
      )}

      {breakNotice && (
        <aside
          className="pomodoro-break-notice"
          role="alert"
          aria-live="assertive"
        >
          <span className="pomodoro-break-notice-icon" aria-hidden="true">
            <Clock3 />
          </span>
          <div>
            <strong>Momento de descanso</strong>
            <p>
              O foco em “{breakNotice.title}” terminou. Descanse por{" "}
              {breakNotice.minutes} minutos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBreakNotice(null)}
            aria-label="Fechar aviso de descanso"
          >
            <X />
          </button>
        </aside>
      )}

      {completedBreakPrompt && (
        <div className="pomodoro-rest-complete-backdrop" role="presentation">
          <section
            className="pomodoro-rest-complete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pomodoro-rest-complete-title"
            aria-describedby="pomodoro-rest-complete-description"
          >
            <span className="pomodoro-rest-complete-icon" aria-hidden="true">
              <TimerReset />
            </span>
            <p className="pomodoro-rest-complete-eyebrow">
              Pomodoro · próxima etapa
            </p>
            <h3 id="pomodoro-rest-complete-title">Descanso concluído</h3>
            <p id="pomodoro-rest-complete-description">
              Os 10 minutos de descanso terminaram. Deseja iniciar a próxima
              sessão de foco em “{completedBreakPrompt.title}” agora?
            </p>
            {completedBreakError && (
              <p className="pomodoro-rest-complete-error" role="alert">
                {completedBreakError}
              </p>
            )}
            <div className="pomodoro-rest-complete-actions">
              <button
                type="button"
                className="secondary-study-action"
                disabled={completedBreakBusy}
                onClick={() => setCompletedBreakPrompt(null)}
              >
                Agora não
              </button>
              <button
                type="button"
                className="primary-study-action"
                disabled={completedBreakBusy}
                onClick={() => void resumeAfterCompletedBreak()}
              >
                <Play />{" "}
                {completedBreakBusy ? "Iniciando…" : "Ir para a próxima sessão"}
              </button>
            </div>
          </section>
        </div>
      )}

      {mobileProfileOpen && (
        <div
          className="mobile-profile-layer"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setMobileProfileOpen(false)
          }
        >
          <aside
            className="mobile-profile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-profile-title"
          >
            <div className="mobile-profile-handle" aria-hidden="true" />
            <header>
              <div>
                <span>Navegação e conta</span>
                <h2 id="mobile-profile-title">Mais opções</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileProfileOpen(false)}
                aria-label="Fechar menu"
              >
                <X />
              </button>
            </header>
            {profileContent()}
          </aside>
        </div>
      )}

      <nav
        className={`mobile-bottom-nav ${hasPlan ? "" : "is-no-plan"}`}
        aria-label="Navegação principal mobile"
      >
        {(hasPlan
          ? navigationItems.filter(
              (item) => !["career", "performance", "admin"].includes(item.id),
            )
          : studyPreferences || isAdmin
            ? navigationItems.filter((item) => item.id !== "admin")
            : navigationItems.filter((item) => item.id === "home")
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMobileProfileOpen(false);
                if (item.id === "questions") setNotedQuestionId("");
                setActiveTab(item.id);
                if (item.id === "home") setHomeMode("dashboard");
              }}
              aria-current={activeTab === item.id ? "page" : undefined}
              aria-label={item.label}
            >
              <Icon aria-hidden="true" />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setMobileProfileOpen(true);
            setNotificationMenuOpen(false);
          }}
          aria-current={
            mobileProfileOpen ||
            activeTab === "career" ||
            activeTab === "performance" ||
            activeTab === "notes" ||
            activeTab === "admin"
              ? "page"
              : undefined
          }
          aria-label="Abrir mais opções"
        >
          <Menu aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            2026 Gabarita Concursos. Estudos inteligentes para uma preparação
            consistente.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Focado no modelo CEBRASPE. Dica: Erros anulam acertos no simulado
            padrão!
          </p>
        </div>
      </footer>
    </div>
  );
}

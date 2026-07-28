import { useState, useEffect, useCallback } from 'react';
import HomeTab from './components/HomeTab';
import StudyTab from './components/StudyTab';
import QuizTab, { GuidedReviewResult } from './components/QuizTab';
import ScheduleTab from './components/ScheduleTab';
import PerformanceTab from './components/PerformanceTab';
import StudyDashboard from './components/StudyDashboard';
import QuestionBankTab from './components/QuestionBankTab';
import { dailyStudyApi, notificationsApi, studyPlansApi, StudyDashboardData, StudySession } from './services/api';
import { ActiveStudyContext } from './studyContext';
import { useAuth } from './auth/AuthContext';
import { Bell, BookOpen, BookOpenCheck, Calendar, Sparkles, Target, Home as HomeIcon, ChartNoAxesCombined, PanelLeftClose, PanelLeftOpen, ListChecks, Award, X, LogOut, UserRound, Settings2, Flame, Star, ShieldCheck, Clock3, ChevronRight, CheckCheck, RefreshCw } from 'lucide-react';

type AppTab = 'home' | 'study' | 'quiz' | 'questions' | 'schedule' | 'performance';

const hasActiveStudyPlan = () => Boolean(
  (() => {
    if (localStorage.getItem('study_plan_deleted') === 'true') return false;
    const courseId = localStorage.getItem('active_course');
    return Boolean(
      courseId &&
      localStorage.getItem(`${courseId}_study_config`) &&
      localStorage.getItem(`${courseId}_study_sections`) &&
      localStorage.getItem(`${courseId}_quiz_questions`) &&
      localStorage.getItem(`${courseId}_schedule_weeks`)
    );
  })()
);

export default function App() {
  const {user,signOut}=useAuth();
  const [hasPlan, setHasPlan] = useState(hasActiveStudyPlan);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem('app_active_tab');
    return saved && saved !== 'home' && !hasActiveStudyPlan() ? 'home' : (saved as AppTab) || 'home';
  });
  const [homeMode, setHomeMode] = useState<'dashboard'|'plans'>(() => hasActiveStudyPlan() ? 'dashboard' : 'plans');
  const [studyContext,setStudyContext]=useState<ActiveStudyContext|null>(()=>{
    try{return JSON.parse(localStorage.getItem('active_study_context')||'null');}catch{return null;}
  });
  const [reviewResult,setReviewResult]=useState<GuidedReviewResult|null>(null);
  const [advancingCycle,setAdvancingCycle]=useState(false);
  const [cycleError,setCycleError]=useState('');
  const [dashboardVersion,setDashboardVersion]=useState(0);
  const [profileMenuOpen,setProfileMenuOpen]=useState(false);
  const [mobileProfileOpen,setMobileProfileOpen]=useState(false);
  const [notificationMenuOpen,setNotificationMenuOpen]=useState(false);
  const [headerNotifications,setHeaderNotifications]=useState<Record<string,any>[]>([]);
  const [notificationLoading,setNotificationLoading]=useState(false);
  const [notificationError,setNotificationError]=useState('');
  const [markingAllNotifications,setMarkingAllNotifications]=useState(false);
  const [headerStudyData,setHeaderStudyData]=useState<StudyDashboardData|null>(null);
  const [headerTimerLoadedAt,setHeaderTimerLoadedAt]=useState(Date.now());
  const [headerTimerTick,setHeaderTimerTick]=useState(0);

  const [activeCourse, setActiveCourse] = useState<string>(() => {
    return localStorage.getItem('active_course') || 'seplag_informatica';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('app_sidebar_collapsed') === 'true';
  });

  const loadHeaderNotifications=useCallback(async(showLoading=false)=>{
    if(showLoading)setNotificationLoading(true);
    try{
      setHeaderNotifications(await notificationsApi.all());
      setNotificationError('');
    }
    catch(error){
      console.warn('Não foi possível carregar as notificações.',error);
      setNotificationError(error instanceof Error?error.message:'Não foi possível carregar suas notificações.');
    }
    finally{if(showLoading)setNotificationLoading(false);}
  },[]);

  useEffect(()=>{
    void loadHeaderNotifications(true);
    const interval=window.setInterval(()=>void loadHeaderNotifications(),30_000);
    return()=>window.clearInterval(interval);
  },[loadHeaderNotifications]);

  const loadHeaderStudyData=useCallback(async()=>{
    if(!hasPlan){setHeaderStudyData(null);return;}
    try{
      const response=await dailyStudyApi.today();
      setHeaderStudyData(response);setHeaderTimerLoadedAt(Date.now());
      if(response.notifications?.length)setHeaderNotifications(items=>items.length?items:response.notifications.filter(item=>!item.read_at));
    }
    catch{/* O dashboard continua responsável por exibir erros de carregamento ao usuário. */}
  },[hasPlan]);

  useEffect(()=>{
    void loadHeaderStudyData();
    const interval=window.setInterval(loadHeaderStudyData,30_000);
    return()=>window.clearInterval(interval);
  },[dashboardVersion,loadHeaderStudyData]);

  useEffect(()=>{
    const interval=window.setInterval(()=>setHeaderTimerTick(value=>value+1),1_000);
    return()=>window.clearInterval(interval);
  },[]);

  useEffect(()=>{
    const closeMenus=(event:PointerEvent)=>{
      const target=event.target;
      if(target instanceof Element&&!target.closest('[data-header-menu]')){
        setProfileMenuOpen(false);setNotificationMenuOpen(false);
      }
    };
    const closeOnEscape=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setProfileMenuOpen(false);setMobileProfileOpen(false);setNotificationMenuOpen(false);}
    };
    document.addEventListener('pointerdown',closeMenus);
    document.addEventListener('keydown',closeOnEscape);
    return()=>{document.removeEventListener('pointerdown',closeMenus);document.removeEventListener('keydown',closeOnEscape);};
  },[]);

  useEffect(()=>{
    document.body.classList.toggle('mobile-profile-open',mobileProfileOpen);
    return()=>document.body.classList.remove('mobile-profile-open');
  },[mobileProfileOpen]);

  // Global KPIs extracted from localStorage
  const [globalProgress, setGlobalProgress] = useState({
    completedBlocks: 0,
    totalBlocks: 19,
    quizAnswered: 0
  });

  const loadGlobalKPIs = () => {
    // Schedule progress
    const progressSaved = localStorage.getItem('study_schedule_progress');
    let completed = 0;
    if (progressSaved) {
      try {
        const parsed = JSON.parse(progressSaved);
        completed = Object.keys(parsed).filter(key => parsed[key]).length;
      } catch (e) {
        console.error(e);
      }
    }

    // Quiz progress
    const quizSaved = localStorage.getItem('quiz_answers');
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
    const customSchedule = localStorage.getItem('custom_schedule_weeks');
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
      quizAnswered: answered
    });
  };

  useEffect(() => {
    loadGlobalKPIs();
    // Listen for tab switches to reload KPIs
    localStorage.setItem('app_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const courseId = localStorage.getItem('active_course');
    if (!courseId || localStorage.getItem('study_plan_deleted') === 'true') return;

    const rawConfig = localStorage.getItem(`${courseId}_study_config`);
    if (!rawConfig) return;

    let localPlanId: string | null = null;
    try { localPlanId = JSON.parse(rawConfig).studyPlanId || null; } catch { return; }
    if (!localPlanId || String(localPlanId).startsWith('local-')) return;

    studyPlansApi.getAll(false).then(remotePlans => {
      if (remotePlans.some(plan => String(plan.id) === String(localPlanId))) return;

      localStorage.setItem('study_plan_deleted', 'true');
      ['seplag_informatica', 'tecnico_enfermagem', 'jornalismo'].forEach(id => {
        [
          'study_sections', 'quiz_questions', 'schedule_weeks', 'study_config',
          'study_schedule_progress', 'quiz_answers'
        ].forEach(key => localStorage.removeItem(`${id}_${key}`));
      });
      [
        'active_course', 'custom_study_sections', 'custom_quiz_questions',
        'custom_schedule_weeks', 'study_config', 'study_schedule_progress',
        'quiz_answers', 'quiz_answer_history', 'quiz_answer_events',
        'active_quiz_questions_cache'
      ].forEach(key => localStorage.removeItem(key));

      setHasPlan(false);
      setActiveTab('home');
    }).catch(() => {
      // Preserve an offline plan when the API is unavailable.
    });
  }, []);

  useEffect(() => {
    if (!hasPlan && activeTab !== 'home') setActiveTab('home');
  }, [hasPlan, activeTab]);

  useEffect(() => {
    localStorage.setItem('app_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Keep KPIs in sync if the user performs actions in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      loadGlobalKPIs();
      setHasPlan(hasActiveStudyPlan());
      const currentCourse = localStorage.getItem('active_course') || 'seplag_informatica';
      setActiveCourse(currentCourse);

      // Automatically back up progress for the current active course in real-time
      const scheduleProgress = localStorage.getItem('study_schedule_progress');
      if (scheduleProgress) {
        localStorage.setItem(`${currentCourse}_study_schedule_progress`, scheduleProgress);
      }
      const quizAnswers = localStorage.getItem('quiz_answers');
      if (quizAnswers) {
        localStorage.setItem(`${currentCourse}_quiz_answers`, quizAnswers);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll progress periodically as simple event listener sometimes misses same-tab updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handlePlanGenerated = (courseId: string) => {
    setHasPlan(true);
    setActiveCourse(courseId);
    setStudyContext(null);
    localStorage.removeItem('active_study_context');
    loadGlobalKPIs();
    setHomeMode('dashboard');
    setActiveTab('home');
  };

  const handlePlansChanged = () => {
    const planAvailable = hasActiveStudyPlan();
    setHasPlan(planAvailable);
    loadGlobalKPIs();
    if (!planAvailable) { setStudyContext(null); localStorage.removeItem('active_study_context'); setHomeMode('plans'); setActiveTab('home'); }
  };

  const updateStudyContext=useCallback((context:ActiveStudyContext)=>{
    setStudyContext(context);localStorage.setItem('active_study_context',JSON.stringify(context));
  },[]);
  const openStudyContext=useCallback((context?:ActiveStudyContext)=>{
    if(context)updateStudyContext(context);setActiveTab('study');
  },[updateStudyContext]);

  const openCurrentReview=useCallback(()=>setActiveTab('quiz'),[]);
  const showReviewResult=useCallback((result:GuidedReviewResult)=>{
    setReviewResult(result);setCycleError('');setHomeMode('dashboard');setActiveTab('home');
  },[]);
  const advanceAfterReview=useCallback(async()=>{
    if(!reviewResult||advancingCycle)return;
    setAdvancingCycle(true);setCycleError('');
    try{
      let session=await dailyStudyApi.active();
      if(!session.id){
        const today=await dailyStudyApi.today();
        const task=today.tasks.find(item=>item.roadmap_topic_id===studyContext?.roadmapTopicId&&['AVAILABLE','IN_PROGRESS'].includes(item.status));
        if(!task)throw new Error('Não foi possível localizar a sessão deste assunto.');
        session=await dailyStudyApi.start(task.id,{mode:'FREE',device:navigator.userAgent.slice(0,150)});
      }
      if(session.session_kind==='QUESTIONS')throw new Error('Finalize o Pomodoro do banco de questões antes de avançar.');
      if(session.roadmap_topic_id&&studyContext?.roadmapTopicId&&session.roadmap_topic_id!==studyContext.roadmapTopicId)
        throw new Error('A sessão ativa pertence a outro assunto. Retorne ao início e confira a sessão atual.');
      await dailyStudyApi.finish(String(session.id),{questionsAnswered:reviewResult.answered,
        correctAnswers:reviewResult.correct,notes:'GUIDED_REVIEW'});
      const updated=await dailyStudyApi.today();
      const next=updated.tasks.find(item=>['AVAILABLE','IN_PROGRESS'].includes(item.status));
      if(next)updateStudyContext({roadmapTopicId:next.roadmap_topic_id,topicTitle:next.topic_title,
        subjectName:next.subject_name,source:'daily-plan'});
      setReviewResult(null);setDashboardVersion(value=>value+1);
    }catch(error){setCycleError(error instanceof Error?error.message:'Não foi possível iniciar o próximo assunto.');}
    finally{setAdvancingCycle(false);}
  },[advancingCycle,reviewResult,studyContext,updateStudyContext]);

  useEffect(()=>{
    if(!hasPlan||studyContext||(activeTab!=='study'&&activeTab!=='quiz'))return;
    dailyStudyApi.today().then(response=>{
      const running=response.active_session?.daily_task_id
        ? response.tasks.find(task=>task.id===response.active_session.daily_task_id)
        : undefined;
      const task=running||response.tasks.find(item=>['AVAILABLE','IN_PROGRESS'].includes(item.status));
      if(task)updateStudyContext({roadmapTopicId:task.roadmap_topic_id,topicTitle:task.topic_title,
        subjectName:task.subject_name,source:running?'session':'daily-plan'});
    }).catch(()=>{});
  },[activeTab,hasPlan,studyContext,updateStudyContext]);

  // Get current brand and subtitle based on selected course
  const getBranding = () => {
    switch (activeCourse) {
      case 'tecnico_enfermagem':
        return {
          title: "Gabarita Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Saúde"
        };
      case 'jornalismo':
        return {
          title: "Gabarita Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Jornalismo"
        };
      case 'seplag_informatica':
      default:
        return {
          title: "Gabarita Concursos",
          subtitle: "Preparação inteligente e desempenho orientado por dados",
          focus: "Tecnologia"
        };
    }
  };

  const brand = getBranding();
  const isHome = activeTab === 'home';
  const navigationItems = [
    { id: 'home' as AppTab, label: 'Início', mobileLabel: 'Início', icon: HomeIcon },
    { id: 'study' as AppTab, label: 'Estudar', mobileLabel: 'Estudar', icon: BookOpen },
    { id: 'quiz' as AppTab, label: 'Revisão', mobileLabel: 'Revisão', icon: Sparkles },
    { id: 'schedule' as AppTab, label: 'Cronograma', mobileLabel: 'Cronograma', icon: Calendar },
    { id: 'questions' as AppTab, label: 'Questões', mobileLabel: 'Questões', icon: ListChecks },
    { id: 'performance' as AppTab, label: 'Desempenho', mobileLabel: 'Progresso', icon: ChartNoAxesCombined },
  ];
  const activeNavigationItem = navigationItems.find(item => item.id === activeTab) || navigationItems[0];
  const userFirstName=String(user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email?.split('@')[0]||'Estudante').trim().split(/\s+/)[0];
  const normalizedFirstName=userFirstName?`${userFirstName.charAt(0).toLocaleUpperCase('pt-BR')}${userFirstName.slice(1)}`:'Estudante';
  const currentHour=new Date().getHours();
  const timeGreeting=currentHour<12?'Bom dia':currentHour<18?'Boa tarde':'Boa noite';
  const mobileHeaderTitle=hasPlan&&activeTab==='home'?`${timeGreeting}, ${normalizedFirstName}`:activeNavigationItem.label;
  const unreadNotifications=headerNotifications.filter(item=>!item.read_at).length;
  const formatMinutes=(minutes:unknown)=>{
    const value=Math.max(0,Number(minutes||0));
    const hours=Math.floor(value/60),rest=value%60;
    return hours?`${hours}h${rest?` ${rest}min`:''}`:`${rest}min`;
  };
  const formatClock=(seconds:number)=>{
    const safe=Math.max(0,Math.floor(seconds));
    const hours=Math.floor(safe/3600),minutes=Math.floor(safe%3600/60),rest=safe%60;
    return hours
      ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`
      : `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
  };

  const activeHeaderSession=headerStudyData?.active_session?.id?headerStudyData.active_session as Partial<StudySession>:null;
  const headerElapsed=activeHeaderSession
    ? Number(activeHeaderSession.elapsed_seconds||0)+(activeHeaderSession.status==='RUNNING'?Math.max(0,Math.floor((Date.now()-headerTimerLoadedAt)/1_000)):0)
    : 0;
  void headerTimerTick;
  const headerPomodoro=(()=>{
    if(!activeHeaderSession?.pomodoro_config)return null;
    try{return JSON.parse(activeHeaderSession.pomodoro_config) as {focusMinutes?:number};}catch{return null;}
  })();
  const headerFocusSeconds=Math.max(1,Number(headerPomodoro?.focusMinutes||25))*60;
  const headerCycle=Math.max(0,Number(activeHeaderSession?.pomodoro_cycle||0));
  const headerTimerSeconds=activeHeaderSession?.mode==='POMODORO'
    ? Math.max(0,headerFocusSeconds-Math.max(0,headerElapsed-headerCycle*headerFocusSeconds))
    : headerElapsed;

  const globalSessionTimer=(mobile=false)=>activeHeaderSession&&<div
    className={`${mobile?'mobile-global-session-timer':'global-session-timer'} ${activeHeaderSession.status==='PAUSED'?'is-paused':''}`}
    aria-label={`${activeHeaderSession.mode==='POMODORO'?'Pomodoro':'Tempo de estudo'}: ${formatClock(headerTimerSeconds)}${activeHeaderSession.status==='PAUSED'?', pausado':''}`}
  >
    <span className="global-timer-icon"><Clock3/></span>
    <div>
      <small>{activeHeaderSession.session_kind==='QUESTIONS'?'Pomodoro de questões':activeHeaderSession.mode==='POMODORO'?'Pomodoro':'Tempo estudando'}</small>
      <strong>{formatClock(headerTimerSeconds)}</strong>
    </div>
    <span className="global-timer-state">{activeHeaderSession.status==='PAUSED'?'Pausado':'Em andamento'}</span>
  </div>;

  const openPlanManager=()=>{
    setProfileMenuOpen(false);setMobileProfileOpen(false);setNotificationMenuOpen(false);
    setHomeMode('plans');setActiveTab('home');
  };
  const openProfileDestination=(tab:'schedule'|'performance')=>{
    setProfileMenuOpen(false);setMobileProfileOpen(false);setNotificationMenuOpen(false);setActiveTab(tab);
  };
  const toggleNotifications=()=>{
    setNotificationMenuOpen(value=>!value);setProfileMenuOpen(false);setMobileProfileOpen(false);
    if(!notificationMenuOpen)void loadHeaderNotifications(true);
  };
  const readNotification=async(id:string)=>{
    try{
      await notificationsApi.read(id);
      setHeaderNotifications(items=>items.filter(item=>String(item.id)!==id));
    }catch(error){console.warn('Não foi possível marcar a notificação como lida.',error);}
  };
  const readAllNotifications=async()=>{
    if(markingAllNotifications||unreadNotifications===0)return;
    setMarkingAllNotifications(true);
    try{
      await notificationsApi.readAll();
      setHeaderNotifications([]);
    }catch(error){console.warn('Não foi possível marcar as notificações como lidas.',error);}
    finally{setMarkingAllNotifications(false);}
  };
  const profileContent=()=> <>
    <div className="profile-summary"><span><UserRound/></span><div><strong>{String(user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Estudante')}</strong><small>{user?.email}</small></div></div>
    {hasPlan&&headerStudyData&&<section className="profile-study-overview" aria-label="Progresso de estudos">
      <div className="profile-progress-heading"><div><small>Progresso de hoje</small><strong>{Math.round(Number(headerStudyData.today.progress_percentage||0))}%</strong></div><span>{formatMinutes(headerStudyData.today.completed_minutes)} estudados</span></div>
      <div className="profile-progress-track" aria-hidden="true"><i style={{width:`${Math.min(100,Number(headerStudyData.today.progress_percentage||0))}%`}}/></div>
      <div className="profile-study-grid">
        <article className="profile-streak-card"><span><Flame/></span><div><small>Ofensiva</small><strong>{Number(headerStudyData.streak.current_streak||0)} dias</strong><p>Recorde: {Number(headerStudyData.streak.longest_streak||0)} dias</p><p><ShieldCheck/>{Number(headerStudyData.streak.protection_balance||0)} proteções disponíveis</p></div></article>
        <article><span><Star/></span><div><small>Nível {headerStudyData.experience.level}</small><strong>{headerStudyData.experience.level_name}</strong><p>{Number(headerStudyData.experience.total_xp||0)} XP acumulados</p></div></article>
        <article><span><Target/></span><div><small>Meta diária</small><strong>{formatMinutes(headerStudyData.today.completed_minutes)} / {formatMinutes(headerStudyData.today.goal_minutes)}</strong><p>{formatMinutes(headerStudyData.today.remaining_minutes)} restantes</p></div></article>
      </div>
    </section>}
    {hasPlan&&<nav className="profile-destinations" aria-label="Áreas do perfil">
      <button type="button" onClick={()=>openProfileDestination('performance')}><span><ChartNoAxesCombined/><span><strong>Progresso</strong><small>Resultados e evolução</small></span></span><ChevronRight/></button>
      <button type="button" onClick={()=>openProfileDestination('schedule')}><span><Calendar/><span><strong>Cronograma</strong><small>Planejamento dos estudos</small></span></span><ChevronRight/></button>
    </nav>}
    <div className="profile-account-actions">
      <button type="button" onClick={openPlanManager}><Settings2/><span>Gerenciar plano</span></button>
      <button type="button" className="profile-logout" onClick={()=>{setProfileMenuOpen(false);setMobileProfileOpen(false);void signOut();}}><LogOut/><span>Sair</span></button>
    </div>
  </>;

  const accountActions=(mobile=false)=><div className={mobile?'mobile-account-actions':'app-account'}>
    {!mobile&&hasPlan&&globalSessionTimer()}
    <div className="header-menu" data-header-menu>
      <button type="button" className="header-action-button notification-trigger" onClick={toggleNotifications}
        aria-label="Abrir notificações" aria-expanded={notificationMenuOpen} aria-haspopup="dialog">
        <Bell/>{unreadNotifications>0&&<span className="notification-count">{unreadNotifications>99?'99+':unreadNotifications}</span>}
      </button>
      {notificationMenuOpen&&<aside className="notification-popover header-notification-popover" role="dialog" aria-labelledby="notification-panel-title">
        <div className="notification-panel-header">
          <div>
            <strong id="notification-panel-title">Notificações</strong>
            <span>{unreadNotifications>0?`${unreadNotifications} ${unreadNotifications===1?'pendente':'pendentes'}`:'Nenhuma pendente'}</span>
          </div>
          <button type="button" className="icon-only" onClick={()=>setNotificationMenuOpen(false)} aria-label="Fechar notificações"><X/></button>
        </div>
        <div className="notification-list">
          {notificationLoading&&headerNotifications.length===0&&<div className="notification-loading" role="status"><RefreshCw/><span>Carregando notificações...</span></div>}
          {notificationError&&<div className="notification-load-error" role="alert"><p>Não foi possível carregar as notificações.</p><button type="button" onClick={()=>void loadHeaderNotifications(true)}><RefreshCw/> Tentar novamente</button></div>}
          {!notificationLoading&&!notificationError&&headerNotifications.length===0&&<p className="empty-note">Tudo em dia. Você não possui notificações pendentes.</p>}
          {headerNotifications.map(item=><button type="button" key={String(item.id)} className={`notification-item ${item.read_at?'':'is-unread'}`} onClick={()=>void readNotification(String(item.id))}><strong>{String(item.title)}</strong><span>{String(item.message)}</span></button>)}
        </div>
        {headerNotifications.length>0&&<div className="notification-panel-footer">
          <button type="button" className="read-all" disabled={unreadNotifications===0||markingAllNotifications} onClick={()=>void readAllNotifications()}>
            <CheckCheck/>
            <span>{markingAllNotifications?'Marcando...':unreadNotifications===0?'Todas foram lidas':'Marcar todas como lidas'}</span>
          </button>
        </div>}
      </aside>}
    </div>
    {!mobile&&<div className="header-menu" data-header-menu>
      <button type="button" className="header-action-button profile-trigger" onClick={()=>{setProfileMenuOpen(value=>!value);setNotificationMenuOpen(false);}}
        aria-label="Abrir perfil do usuário" aria-expanded={profileMenuOpen} aria-haspopup="menu"><UserRound/></button>
      {profileMenuOpen&&<aside className="profile-popover" role="menu">
        {profileContent()}
      </aside>}
    </div>}
  </div>;

  return (
    <div className={`app-shell min-h-screen bg-slate-50 text-slate-800 flex flex-col ${hasPlan ? 'has-plan' : 'no-plan'} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${activeHeaderSession&&activeTab!=='home'?'has-active-timer':''}`}>
      <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
      {/* Upper Navigation & App Bar */}
      <header className="app-header bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="app-header-inner w-full px-4 sm:px-6 xl:px-8 2xl:px-10">
          <div className="desktop-header-content flex items-center justify-between min-h-16 py-2">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 flex items-center justify-center shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm" aria-hidden="true"><BookOpenCheck/></div>
              </div>
              <div className="space-y-0.5">
                {isHome ? (
                  <>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                      Gabarita Concursos
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
          <div className="mobile-header-content" aria-label="Cabeçalho da tela atual">
            <div className="mobile-brand-mark" aria-hidden="true"><BookOpenCheck/></div>
            <div className="min-w-0">
              <span className="mobile-header-context">{hasPlan ? brand.focus : 'Gabarita Concursos'}</span>
              <h1>{mobileHeaderTitle}</h1>
            </div>
            {accountActions(true)}
          </div>
          {hasPlan&&activeTab!=='home'&&globalSessionTimer(true)}
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="app-main px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 flex-grow w-full flex flex-col space-y-6" tabIndex={-1}>
        
        {/* Navigation */}
          {hasPlan && <nav className="app-navigation desktop-app-navigation flex space-x-1 lg:space-x-2 bg-slate-100 p-1.5 rounded-xl self-start w-full md:w-auto" aria-label="Navegação principal">
            {hasPlan && <div className="sidebar-control">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Painel</p>
                <p className="text-xs text-slate-500 truncate">Rotina de estudo</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(value => !value)}
                className="sidebar-toggle"
                aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                aria-expanded={!sidebarCollapsed}
                title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>}
            {navigationItems.map(item => {
              const Icon = item.icon;
              return <button
                key={item.id}
                id={`tab-${item.id}-trigger`}
                onClick={() => { setActiveTab(item.id); if(item.id==='home')setHomeMode('dashboard'); }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>;
            })}
          </nav>}

        {/* Tab Content Rendering */}
        <div className="app-content min-w-0 flex-grow transition-all duration-300">
          {activeTab === 'home' && hasPlan && homeMode === 'dashboard' && <StudyDashboard key={dashboardVersion} onManagePlans={()=>setHomeMode('plans')} onOpenStudy={openStudyContext} onOpenQuestions={()=>setActiveTab('questions')} onStudyContextChange={updateStudyContext} onSessionChange={loadHeaderStudyData} />}
          {activeTab === 'home' && (!hasPlan || homeMode === 'plans') && <HomeTab onPlanGenerated={handlePlanGenerated} onPlansChanged={handlePlansChanged} />}
          {hasPlan && activeTab === 'study' && <StudyTab studyContext={studyContext} onCurrentActivityComplete={openCurrentReview} />}
          {hasPlan && activeTab === 'quiz' && <QuizTab mode="session" studyContext={studyContext} onReviewComplete={showReviewResult} />}
          {hasPlan && activeTab === 'schedule' && <ScheduleTab studyContext={studyContext} onOpenStudy={openStudyContext} />}
          {hasPlan && activeTab === 'questions' && <QuestionBankTab onSessionChange={loadHeaderStudyData} />}
          {hasPlan && activeTab === 'performance' && <PerformanceTab />}
        </div>
      </main>

      {reviewResult&&<div className="finish-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guided-review-result-title">
        <section className="finish-modal">
          <button type="button" className="modal-close" disabled={advancingCycle} onClick={advanceAfterReview} aria-label="Fechar resultado e avançar"><X/></button>
          <span className={`finish-icon ${reviewResult.accuracy<60?'!bg-rose-50 !text-rose-600':reviewResult.accuracy<80?'!bg-amber-50 !text-amber-600':''}`}><Award/></span>
          <h3 id="guided-review-result-title">Resultado da revisão</h3>
          <p>{reviewResult.topicTitle}</p>
          <div className="grid grid-cols-3 gap-2 my-5">
            <div className="rounded-xl bg-slate-50 p-3 text-center"><span className="block text-xs text-slate-500">Respondidas</span><strong className="text-xl text-slate-900">{reviewResult.answered}</strong></div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center"><span className="block text-xs text-emerald-700">Acertos</span><strong className="text-xl text-emerald-700">{reviewResult.correct}</strong></div>
            <div className="rounded-xl bg-rose-50 p-3 text-center"><span className="block text-xs text-rose-700">Erros</span><strong className="text-xl text-rose-700">{reviewResult.wrong}</strong></div>
          </div>
          <div className={`p-4 rounded-xl border text-sm ${reviewResult.accuracy>=80?'bg-emerald-50 border-emerald-200 text-emerald-800':reviewResult.accuracy>=60?'bg-amber-50 border-amber-200 text-amber-900':'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <strong className="block mb-1">{reviewResult.accuracy>=80?`Parabéns! ${reviewResult.accuracy}% de aproveitamento.`:reviewResult.accuracy>=60?`Bom caminho: ${reviewResult.accuracy}% de aproveitamento.`:`Atenção: ${reviewResult.accuracy}% de aproveitamento.`}</strong>
            <span>{reviewResult.accuracy>=80?`Você demonstrou ótimo domínio de ${reviewResult.topicTitle}. Mantenha o ritmo nas revisões espaçadas.`:reviewResult.accuracy>=60?`Revise as justificativas das questões erradas e tente explicar os pontos-chave de ${reviewResult.topicTitle} com suas próprias palavras.`:`Retorne aos pontos-chave de ${reviewResult.topicTitle} e concentre-se nos conceitos que apareceram nas questões erradas antes da próxima revisão.`}</span>
          </div>
          {cycleError&&<p role="alert" className="!mt-3 !mb-0 !text-rose-700">{cycleError}</p>}
          <button type="button" className="primary-study-action mt-5" disabled={advancingCycle} onClick={advanceAfterReview}>{advancingCycle?'Preparando próximo assunto…':'Continuar para o próximo assunto'}</button>
        </section>
      </div>}

      {mobileProfileOpen&&<div className="mobile-profile-layer" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&setMobileProfileOpen(false)}>
        <aside className="mobile-profile-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-profile-title">
          <div className="mobile-profile-handle" aria-hidden="true"/>
          <header><div><span>Conta e progresso</span><h2 id="mobile-profile-title">Seu perfil</h2></div><button type="button" onClick={()=>setMobileProfileOpen(false)} aria-label="Fechar perfil"><X/></button></header>
          {profileContent()}
        </aside>
      </div>}

      <nav className={`mobile-bottom-nav ${hasPlan?'':'is-no-plan'}`} aria-label="Navegação principal mobile">
        {(hasPlan?navigationItems.filter(item=>item.id!=='schedule'&&item.id!=='performance'):navigationItems.filter(item=>item.id==='home')).map(item => {
          const Icon = item.icon;
          return <button
            key={item.id}
            type="button"
            onClick={() => { setMobileProfileOpen(false);setActiveTab(item.id); if(item.id==='home')setHomeMode('dashboard'); }}
            aria-current={activeTab === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon aria-hidden="true" />
            <span>{item.mobileLabel}</span>
          </button>;
        })}
        <button type="button" onClick={()=>{setMobileProfileOpen(true);setNotificationMenuOpen(false);}} aria-current={mobileProfileOpen||activeTab==='schedule'||activeTab==='performance'?'page':undefined} aria-label="Abrir perfil">
          <UserRound aria-hidden="true"/><span>Perfil</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>2026 Gabarita Concursos. Estudos inteligentes para uma preparação consistente.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Focado no modelo CEBRASPE. Dica: Erros anulam acertos no simulado padrão!
          </p>
        </div>
      </footer>
    </div>
  );
}

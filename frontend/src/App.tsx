import { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab';
import StudyTab from './components/StudyTab';
import QuizTab from './components/QuizTab';
import ScheduleTab from './components/ScheduleTab';
import PerformanceTab from './components/PerformanceTab';
import { BookOpen, Calendar, Sparkles, CheckSquare, Target, Home as HomeIcon, ChartNoAxesCombined, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'study' | 'quiz' | 'schedule' | 'performance'>(() => {
    const saved = localStorage.getItem('app_active_tab');
    return (saved as 'home' | 'study' | 'quiz' | 'schedule' | 'performance') || 'home';
  });

  const [activeCourse, setActiveCourse] = useState<string>(() => {
    return localStorage.getItem('active_course') || 'seplag_informatica';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('app_sidebar_collapsed') === 'true';
  });

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
    localStorage.setItem('app_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Keep KPIs in sync if the user performs actions in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      loadGlobalKPIs();
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
    setActiveCourse(courseId);
    loadGlobalKPIs();
    setActiveTab('study'); // switch to study summaries tab on creation
  };

  // Get current brand and subtitle based on selected course
  const getBranding = () => {
    switch (activeCourse) {
      case 'tecnico_enfermagem':
        return {
          title: "Gabarita Técnico de Enfermagem",
          subtitle: "Código de Ética • Saúde Pública & SUS • Urgência & Farmacologia",
          focus: "SUS e Fundamentos"
        };
      case 'jornalismo':
        return {
          title: "Gabarita Jornalismo",
          subtitle: "Teoria da Comunicação • Técnicas de Redação • Assessoria de Imprensa",
          focus: "Redação e Mídia"
        };
      case 'seplag_informatica':
      default:
        return {
          title: "Gabarita SEPLAG/AL - Informática",
          subtitle: "Especialista em Gestão Pública • Especialidade: Informática",
          focus: "Foco 80% (Informática)"
        };
    }
  };

  const brand = getBranding();
  const isHome = activeTab === 'home';

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
      {/* Upper Navigation & App Bar */}
      <header className="app-header bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10">
          <div className="flex items-center justify-between min-h-16 py-2">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 flex items-center justify-center shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm">
                  {isHome ? 'GC' : (activeCourse === 'tecnico_enfermagem' ? 'E' : activeCourse === 'jornalismo' ? 'J' : 'I')}
                </div>
              </div>
              <div className="space-y-0.5">
                {isHome ? (
                  <>
                    <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                      Gabarita Concursos
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Seu plano de estudos, simples e direto
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

            {/* Overall Progress Mini KPI Panel (Desktop Only) - ONLY SHOWN IF NOT ON HOME/SELECTION */}
            {!isHome && (
              <div className="hidden md:flex items-center gap-6 text-xs border-l border-slate-200 pl-6 py-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-slate-400 block font-bold">Meta Cronograma</span>
                    <span className="font-bold text-slate-700">
                      {globalProgress.completedBlocks} de {globalProgress.totalBlocks} Metas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-slate-400 block font-bold">Questões Ativas</span>
                    <span className="font-bold text-slate-700">
                      {globalProgress.quizAnswered} Respondidas
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="app-main px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 flex-grow w-full flex flex-col space-y-6" tabIndex={-1}>
        
        {/* Navigation */}
          <nav className="app-navigation flex space-x-1 lg:space-x-2 bg-slate-100 p-1.5 rounded-xl self-start w-full md:w-auto" aria-label="Navegação principal">
            <div className="sidebar-control">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Área do aluno</p>
                <p className="text-xs text-slate-500 truncate">Rotina de aprovação</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(value => !value)}
                className="sidebar-toggle"
                aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>
            <button
              id="tab-home-trigger"
              onClick={() => setActiveTab('home')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                activeTab === 'home'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-current={activeTab === 'home' ? 'page' : undefined}
            >
              <HomeIcon className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              id="tab-study-trigger"
              onClick={() => setActiveTab('study')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                activeTab === 'study'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-current={activeTab === 'study' ? 'page' : undefined}
            >
              <BookOpen className="w-4 h-4" />
              <span>Estudar</span>
            </button>
            
            <button
              id="tab-quiz-trigger"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                activeTab === 'quiz'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-current={activeTab === 'quiz' ? 'page' : undefined}
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulado</span>
            </button>

            <button
              id="tab-schedule-trigger"
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-current={activeTab === 'schedule' ? 'page' : undefined}
            >
              <Calendar className="w-4 h-4" />
              <span>Cronograma</span>
            </button>

            <button
              id="tab-performance-trigger"
              onClick={() => setActiveTab('performance')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer grow md:grow-0 whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-current={activeTab === 'performance' ? 'page' : undefined}
            >
              <ChartNoAxesCombined className="w-4 h-4" />
              <span>Desempenho</span>
            </button>
          </nav>

        {/* Tab Content Rendering */}
        <div className="app-content flex-grow transition-all duration-300">
          {activeTab === 'home' && <HomeTab onPlanGenerated={handlePlanGenerated} />}
          {activeTab === 'study' && <StudyTab />}
          {activeTab === 'quiz' && <QuizTab />}
          {activeTab === 'schedule' && <ScheduleTab />}
          {activeTab === 'performance' && <PerformanceTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Gabarita Concursos. Desenvolvido para Estudos Inteligentes de Reta Final de Pareto.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Focado no modelo CEBRASPE. Dica: Erros anulam acertos no simulado padrão!
          </p>
        </div>
      </footer>
    </div>
  );
}

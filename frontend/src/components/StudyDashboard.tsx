import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Clock3,
  Pause,
  Play,
  Sparkles,
  Target,
  TimerReset,
  X,
  ListChecks,
} from 'lucide-react';
import { dailyStudyApi, StudyDashboardData, StudySession } from '../services/api';
import { ActiveStudyContext } from '../studyContext';
import './Studydashboard.css';

interface Props {
  onManagePlans: () => void;
  onOpenStudy: (context?: ActiveStudyContext) => void;
  onOpenQuestions: (dailyTaskId?: string, minutes?: number) => void;
  onStudyContextChange: (context: ActiveStudyContext) => void;
  onSessionChange?: (session?: Partial<StudySession> | null) => void;
  initialData?: StudyDashboardData | null;
}

const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${rest}min`;
};
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const number = (value: unknown) => Number(value || 0);
const pomodoroConfig = (session: StudySession | null) => {
  if (!session?.pomodoro_config) return null;
  try {
    return JSON.parse(session.pomodoro_config) as {
      focusMinutes: number;
      shortBreakMinutes: number;
      longBreakMinutes: number;
      cycles: number;
    };
  } catch {
    return null;
  }
};

export default function StudyDashboard({
  onManagePlans,
  onOpenStudy,
  onOpenQuestions,
  onStudyContextChange,
  onSessionChange,
  initialData,
}: Props) {
  const [data, setData] = useState<StudyDashboardData | null>(initialData || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [loadedAt, setLoadedAt] = useState(Date.now());
  const hadInitialData = useRef(Boolean(initialData));

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const response = await dailyStudyApi.today();
        setData(response);
        setError('');
        setLoadedAt(Date.now());
        setTick(0);
        const runningTask = response.active_session?.daily_task_id
          ? response.tasks.find(task => task.id === response.active_session.daily_task_id)
          : undefined;
        const contextTask =
          runningTask || response.tasks.find(task => ['AVAILABLE', 'IN_PROGRESS'].includes(task.status));
        if (contextTask)
          onStudyContextChange({
            roadmapTopicId: contextTask.roadmap_topic_id,
            topicTitle: contextTask.topic_title,
            subjectName: contextTask.subject_name,
            source: runningTask ? 'session' : 'daily-plan',
          });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar sua rotina diária.');
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [onStudyContextChange]
  );

  useEffect(() => {
    load(hadInitialData.current);
  }, [load]);
  useEffect(() => {
    const interval = window.setInterval(() => setTick(value => value + 1), 1000);
    const reconcile = window.setInterval(() => load(true), 30000);
    return () => {
      clearInterval(interval);
      clearInterval(reconcile);
    };
  }, [load]);

  const restoredSession = data?.active_session && data.active_session.id ? (data.active_session as StudySession) : null;
  const questionPractice = restoredSession?.session_kind === 'QUESTIONS' ? restoredSession : null;
  const active = restoredSession?.session_kind !== 'QUESTIONS' ? restoredSession : null;
  const elapsed = active
    ? number(active.elapsed_seconds) +
      (active.status === 'RUNNING' ? Math.max(0, Math.floor((Date.now() - loadedAt) / 1000)) : 0)
    : 0;
  void tick;
  const pomo = pomodoroConfig(active);
  const cycle = number(active?.pomodoro_cycle);
  const pauseSeconds =
    active?.status === 'PAUSED' && active.paused_at
      ? Math.max(0, Math.floor((Date.now() - new Date(active.paused_at).getTime()) / 1000))
      : 0;
  const breakSeconds = pomo
    ? (cycle > 0 && cycle % Math.max(1, pomo.cycles) === 0 ? pomo.longBreakMinutes : pomo.shortBreakMinutes) * 60
    : 0;
  const breakRemaining = Math.max(0, breakSeconds - pauseSeconds);
  const currentTask = useMemo(() => {
    if (!data || questionPractice) return null;
    if (active) return data.tasks.find(task => task.id === active.daily_task_id) || data.tasks[0] || null;
    return (
      data.tasks.find(task => ['AVAILABLE', 'IN_PROGRESS'].includes(task.status)) ||
      data.tasks.find(task => !['COMPLETED', 'SKIPPED'].includes(task.status)) ||
      null
    );
  }, [active, data]);
  const isPomoBreak =
    active?.mode === 'POMODORO' &&
    active.status === 'PAUSED' &&
    active.pause_reason === 'POMODORO_FOCUS_COMPLETE' &&
    Boolean(pomo);
  const selectedFocusMinutes = currentTask?.planned_minutes && currentTask.planned_minutes <= 30
    ? currentTask.planned_minutes
    : 50;
  const focusSeconds = Math.max(1, number(pomo?.focusMinutes) * 60);
  const focusElapsed = pomo ? Math.max(0, elapsed - cycle * focusSeconds) : 0;
  const focusRemaining = pomo ? Math.max(0, focusSeconds - focusElapsed) : selectedFocusMinutes * 60;
  const timerDisplay = isPomoBreak ? breakRemaining : active?.mode === 'POMODORO' || !active ? focusRemaining : elapsed;
  const timerCaption = isPomoBreak
    ? `restantes no descanso de ${Math.round(breakSeconds / 60)} min`
    : active?.mode === 'POMODORO' || !active
      ? `restantes no foco de ${pomo?.focusMinutes || selectedFocusMinutes} min`
      : `de ${currentTask?.planned_minutes || 0}:00`;
  const timerProgress = isPomoBreak
    ? Math.min(100, (pauseSeconds / Math.max(1, breakSeconds)) * 100)
    : active?.mode === 'POMODORO' && pomo
      ? Math.min(100, (focusElapsed / focusSeconds) * 100)
      : Math.min(100, (elapsed / Math.max(1, number(currentTask?.planned_minutes) * 60)) * 100);

  const syncSession = (session: Partial<StudySession> | null) => {
    setData(current => (current ? { ...current, active_session: session || {} } : current));
    setLoadedAt(Date.now());
    onSessionChange?.(session);
  };
  const action = async (operation: () => Promise<unknown>, optimisticSession?: Partial<StudySession>) => {
    setBusy(true);
    setFeedback([]);
    if (optimisticSession) syncSession(optimisticSession);
    try {
      const result = await operation();
      if (result && typeof result === 'object' && 'id' in result && 'status' in result)
        syncSession(result as Partial<StudySession>);
      else if (result && typeof result === 'object' && 'tasks' in result) setData(result as StudyDashboardData);
      else onSessionChange?.();
      void load(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'A operação não foi concluída.');
      void load(true);
      onSessionChange?.();
    } finally {
      setBusy(false);
    }
  };
  const start = () => {
    if (!currentTask) return;
    if (currentTask.activity_type === 'QUESTIONS') {
      onOpenQuestions(currentTask.id, currentTask.planned_minutes);
      return;
    }
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => {});
    }
    void action(async () => {
      const freeTime = currentTask.planned_minutes <= 30;
      const started = await dailyStudyApi.start(currentTask.id, {
        mode: freeTime ? 'FREE' : 'POMODORO',
        pomodoro: freeTime
          ? undefined
          : {
              focusMinutes: selectedFocusMinutes,
              shortBreakMinutes: 10,
              longBreakMinutes: 10,
              cycles: 1,
              targetCycles: 1,
            },
        device: navigator.userAgent.slice(0, 150),
      });
      onOpenStudy({
        roadmapTopicId: currentTask.roadmap_topic_id,
        topicTitle: currentTask.topic_title,
        subjectName: currentTask.subject_name,
        source: 'session',
      });
      return started;
    });
  };
  const pauseActive = () => {
    if (!active) return;
    const optimisticSession: Partial<StudySession> = {
      ...active,
      status: 'PAUSED',
      elapsed_seconds: elapsed,
      paused_at: new Date().toISOString(),
      pause_reason: 'Pausa manual',
    };
    void action(() => dailyStudyApi.pause(active.id, 'Pausa manual'), optimisticSession);
  };
  const resumeActive = () => {
    if (!active) return;
    const optimisticSession: Partial<StudySession> = {
      ...active,
      status: 'RUNNING',
      paused_at: undefined,
      pause_reason: undefined,
    };
    void action(() => dailyStudyApi.resume(active.id), optimisticSession);
  };
  const skipQuestions = (taskId: string) => {
    if (
      !window.confirm(
        'Não fazer o treino extra de questões hoje? Suas horas de conteúdo continuarão registradas normalmente.'
      )
    )
      return;
    void action(() => dailyStudyApi.skipOptionalQuestions(taskId));
  };

  if (loading)
    return (
      <div className="daily-dashboard-loading">
        <span className="loading-mark" aria-hidden="true" />
        <p>Montando seu plano de hoje</p>
      </div>
    );

  if (error && !data)
    return (
      <section className="daily-dashboard-error" role="alert">
        <span className="error-icon">
          <TimerReset />
        </span>
        <h2>Sua rotina não pôde ser carregada</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button className="ghost-action" onClick={() => load()}>
            Tentar novamente
          </button>
          <button className="text-action" onClick={onManagePlans}>
            Gerenciar planos
          </button>
        </div>
      </section>
    );

  if (!data) return null;

  const progress = Math.min(100, number(data.today.progress_percentage));

  return (
    <div className="daily-dashboard">
      <header className="daily-dashboard-heading">
        <div className="heading-copy">
          <span className="eyebrow">Rotina diária</span>
          <p>{data.plan.title}</p>
        </div>
      </header>

      {error && (
        <div className="daily-inline-error" role="alert">
          <span>{error}</span>
          <button className="icon-only" onClick={() => setError('')} aria-label="Fechar aviso">
            <X />
          </button>
        </div>
      )}
      {feedback.length > 0 && (
        <div className="completion-feedback">
          <span className="feedback-icon">
            <Sparkles />
          </span>
          <div>
            <strong>Sessão registrada</strong>
            {feedback.map(message => (
              <p key={message}>{message}</p>
            ))}
          </div>
          <button className="icon-only" onClick={() => setFeedback([])} aria-label="Dispensar">
            <X />
          </button>
        </div>
      )}

      <div className="daily-main-grid daily-main-grid-single">
        <section className="focus-card">
          <div className="focus-card-top">
            <div>
              <span className="eyebrow">
                {questionPractice ? 'Pomodoro em andamento' : active ? 'Sessão em andamento' : 'Assunto atual'}
              </span>
              <h3>
                {questionPractice
                  ? 'Banco completo de questões'
                  : currentTask?.activity_type === 'QUESTIONS'
                    ? currentTask.outside_planned_hours
                      ? currentTask.is_optional
                        ? 'Questões extras do dia'
                        : 'Revisão semanal com questões'
                      : 'Questões de fechamento'
                    : currentTask?.topic_title || 'Meta diária concluída'}
              </h3>
              <p>
                {questionPractice
                  ? `${number(questionPractice.questions_answered)} questões respondidas nesta sessão`
                  : currentTask?.activity_type === 'QUESTIONS'
                    ? currentTask.outside_planned_hours
                      ? currentTask.is_optional
                        ? 'Opcional e fora da carga planejada.'
                        : 'Obrigatória no encerramento da semana.'
                      : 'Encerramento obrigatório do estudo de hoje.'
                    : currentTask?.subject_name || 'Seu progresso de hoje foi salvo.'}
              </p>
            </div>
            {currentTask && !questionPractice && (
              <span className="focus-duration">
                <Clock3 />
                {currentTask.planned_minutes} min
              </span>
            )}
          </div>
          {currentTask && !questionPractice ? (
            <>
              <div className="focus-objective">
                <Target />
                <p>
                  <strong>Objetivo</strong>
                  {currentTask.activity_type === 'QUESTIONS'
                    ? 'Consolidar os conteúdos estudados no dia, corrigir erros e identificar pontos fracos.'
                    : currentTask.objective || 'Consolidar o conteúdo e praticar com questões.'}
                </p>
              </div>
              <div className="timer-stage">
                <div
                  className={`timer-ring ${active?.status === 'PAUSED' ? 'is-paused' : ''}`}
                  style={
                    {
                      '--timer-progress': `${timerProgress}%`,
                    } as React.CSSProperties
                  }
                >
                  <div className="timer-face">
                    <span>{clock(timerDisplay)}</span>
                    <small>{timerCaption}</small>
                  </div>
                </div>
                <div className="timer-details">
                  <p>
                    <span>Questões</span>
                    <strong>
                      {currentTask.questions_answered}/{currentTask.question_goal}
                    </strong>
                  </p>
                  <p>
                    <span>Meta de acertos</span>
                    <strong>{currentTask.minimum_accuracy}%</strong>
                  </p>
                  <p>
                    <span>Domínio atual</span>
                    <strong>{Math.round(number(currentTask.mastery))}%</strong>
                  </p>
                </div>
              </div>
              {!active && (
                <div className="timer-mode" aria-label="Duração da sessão">
                  <strong>
                    {currentTask.planned_minutes <= 30
                      ? `Tempo livre de ${currentTask.planned_minutes} min`
                      : `${selectedFocusMinutes} min de foco + 10 min de descanso`}
                  </strong>
                </div>
              )}
              <div className="timer-actions">
                {!active && (
                  <button className="primary-study-action" disabled={busy} onClick={start}>
                    <Play /> {currentTask.activity_type === 'QUESTIONS' ? 'Fazer questões' : 'Começar agora'}
                  </button>
                )}
                {!active && currentTask.activity_type === 'QUESTIONS' && currentTask.is_optional && (
                  <button
                    className="secondary-study-action"
                    disabled={busy}
                    onClick={() => skipQuestions(currentTask.id)}
                  >
                    Não fazer hoje
                  </button>
                )}
                {active?.status === 'RUNNING' && (
                  <button className="secondary-study-action" disabled={busy} onClick={pauseActive}>
                    <Pause /> Pausar
                  </button>
                )}
                {active?.status === 'PAUSED' && (
                  <button className="primary-study-action" disabled={busy} onClick={resumeActive}>
                    <Play /> {isPomoBreak && breakRemaining > 0 ? 'Pular descanso' : 'Continuar'}
                  </button>
                )}
                {active && (
                  <button
                    className="finish-study-action"
                    disabled={busy}
                    onClick={() =>
                      onOpenStudy({
                        roadmapTopicId: currentTask.roadmap_topic_id,
                        topicTitle: currentTask.topic_title,
                        subjectName: currentTask.subject_name,
                        source: 'session',
                      })
                    }
                  >
                    <BookOpen /> Continuar conteúdo
                  </button>
                )}
              </div>
            </>
          ) : questionPractice ? (
            <button className="primary-study-action" onClick={() => onOpenQuestions()}>
              <ListChecks /> Continuar questões
            </button>
          ) : (
            <button className="primary-study-action" onClick={() => onOpenStudy()}>
              <BookOpen /> Revisar conteúdos
            </button>
          )}
        </section>
      </div>

    </div>
  );
}

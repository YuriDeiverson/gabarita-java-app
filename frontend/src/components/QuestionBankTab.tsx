import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlarmClock,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  Square,
  X,
} from "lucide-react";
import QuizTab from "./QuizTab";
import { dailyStudyApi, StudySession } from "../services/api";
import { Question } from "../types";
import "./QuestionBankTab.css";

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

interface Props {
  visible?: boolean;
  externalSession?: Partial<StudySession> | null;
  dailyTask?: { id: string; minutes: number } | null;
  initialQuestionId?: string;
  onDailyTaskFinished?: () => void;
  onSessionChange?: (session?: Partial<StudySession> | null) => void;
}

type QuestionTimerMode = "POMODORO_50" | "POMODORO_25" | "FREE";

export default function QuestionBankTab({
  visible = true,
  externalSession,
  dailyTask,
  initialQuestionId,
  onDailyTaskFinished,
  onSessionChange,
}: Props) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [blockingSession, setBlockingSession] =
    useState<Partial<StudySession> | null>(null);
  const [timerMode, setTimerMode] = useState<QuestionTimerMode>(
    dailyTask && dailyTask.minutes <= 35 ? "POMODORO_25" : "POMODORO_50",
  );
  const [timerPanelOpen, setTimerPanelOpen] = useState(false);
  const [timerLoading, setTimerLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const focusMinutes = timerMode === "POMODORO_25" ? 25 : 50;
  const [loadedAt, setLoadedAt] = useState(Date.now());
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const autoPauseKey = useRef("");

  const planId = (() => {
    try {
      return JSON.parse(localStorage.getItem("study_config") || "{}")
        .studyPlanId as string | undefined;
    } catch {
      return undefined;
    }
  })();

  const loadActive = useCallback(async () => {
    setTimerLoading(true);
    try {
      const active = await dailyStudyApi.active();
      if (active.id && active.session_kind === "QUESTIONS") {
        setSession(active as StudySession);
        setBlockingSession(null);
        setLoadedAt(Date.now());
        setTimerPanelOpen(false);
      } else if (active.id) {
        setBlockingSession(active);
        setSession(null);
      } else {
        setBlockingSession(null);
        setSession(null);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Timer indisponível.",
      );
    } finally {
      setTimerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) void loadActive();
  }, [loadActive, visible]);

  useEffect(() => {
    if (!session && dailyTask) {
      setTimerMode(dailyTask.minutes <= 35 ? "POMODORO_25" : "POMODORO_50");
    }
  }, [dailyTask, session]);

  useEffect(() => {
    if (externalSession === undefined) return;
    if (
      externalSession?.id &&
      externalSession.session_kind === "QUESTIONS"
    ) {
      setSession(externalSession as StudySession);
      setBlockingSession(null);
      setLoadedAt(Date.now());
      setTimerLoading(false);
      return;
    }
    if (!externalSession?.id) {
      setSession(null);
      setTimerPanelOpen(false);
    }
  }, [externalSession]);

  useEffect(() => {
    if (!visible) {
      setShowBackToTop(false);
      return;
    }

    const updateBackToTop = () => setShowBackToTop(window.scrollY > 280);
    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    return () => window.removeEventListener("scroll", updateBackToTop);
  }, [visible]);

  useEffect(() => {
    const interval = window.setInterval(
      () => setTick((value) => value + 1),
      1_000,
    );
    return () => clearInterval(interval);
  }, []);

  const elapsed = session
    ? Number(session.elapsed_seconds || 0) +
      (session.status === "RUNNING"
        ? Math.max(0, Math.floor((Date.now() - loadedAt) / 1_000))
        : 0)
    : 0;
  void tick;

  const config = (() => {
    try {
      return JSON.parse(session?.pomodoro_config || "{}") as {
        focusMinutes?: number;
        shortBreakMinutes?: number;
        targetCycles?: number;
      };
    } catch {
      return {};
    }
  })();
  const cycle = Number(session?.pomodoro_cycle || 0);
  const targetCycles = Math.max(1, Number(config.targetCycles || 1));
  const freeMode = session ? session.mode === "FREE" : timerMode === "FREE";
  const targetMet = !freeMode && Boolean(session) && cycle >= targetCycles;
  const cycleLength =
    Math.max(1, Number(config.focusMinutes || focusMinutes)) * 60;
  const cycleElapsed = session
    ? Math.max(0, elapsed - cycle * cycleLength)
    : 0;
  const focusRemaining = session
    ? Math.max(0, cycleLength - cycleElapsed)
    : focusMinutes * 60;
  const pauseSeconds =
    session?.status === "PAUSED" && session.paused_at
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(session.paused_at).getTime()) / 1_000,
          ),
        )
      : 0;
  const breakSeconds = Math.max(1, Number(config.shortBreakMinutes || 10)) * 60;
  const breakRemaining = Math.max(0, breakSeconds - pauseSeconds);
  const isPomodoroBreak =
    !targetMet &&
    session?.mode === "POMODORO" &&
    session.status === "PAUSED" &&
    session.pause_reason === "POMODORO_FOCUS_COMPLETE";
  const timerDisplay = isPomodoroBreak
    ? breakRemaining
    : freeMode
      ? elapsed
      : targetMet
        ? 0
        : focusRemaining;

  const timerStatus = targetMet
    ? "Carga planejada concluída"
    : isPomodoroBreak
      ? `Descanso de 10 min · próximo ciclo ${cycle + 1} de ${targetCycles}`
      : freeMode
        ? session
          ? session.status === "PAUSED"
            ? "Tempo livre pausado"
            : "Tempo estudado · sem limite"
          : "Tempo livre · sem limite"
        : session?.status === "PAUSED"
          ? `Pausado · ciclo ${cycle + 1} de ${targetCycles}`
          : session
            ? `Ciclo ${cycle + 1} de ${targetCycles} · foco de ${Number(config.focusMinutes || focusMinutes)} min`
            : `Pronto para ${focusMinutes} min de foco`;

  useEffect(() => {
    if (!session || session.status !== "RUNNING" || !config.focusMinutes)
      return;
    const key = `${session.id}:${cycle}`;
    if (
      elapsed < (cycle + 1) * config.focusMinutes * 60 ||
      autoPauseKey.current === key
    )
      return;

    autoPauseKey.current = key;
    setBusy(true);
    dailyStudyApi
      .pause(session.id, "POMODORO_FOCUS_COMPLETE")
      .then((updated) => {
        setSession(updated);
        setLoadedAt(Date.now());
        setTimerPanelOpen(true);
        setSummary(
          cycle + 1 >= targetCycles
            ? `Carga planejada concluída em ${targetCycles} ciclo(s). Finalize a sessão.`
            : `Ciclo ${cycle + 1} de ${targetCycles} concluído. Faça uma pausa antes de continuar.`,
        );
        onSessionChange?.(updated);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível pausar.",
        ),
      )
      .finally(() => setBusy(false));
  }, [
    session?.id,
    session?.status,
    cycle,
    elapsed,
    config.focusMinutes,
    targetCycles,
  ]);

  const start = async () => {
    if (!planId || String(planId).startsWith("local-")) {
      setError(
        "Salve e ative o plano no servidor para usar o Pomodoro persistente.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setSummary("");
    try {
      const started = await dailyStudyApi.startQuestionPractice(planId, {
        mode: timerMode === "FREE" ? "FREE" : "POMODORO",
        focusMinutes,
        dailyTaskId: dailyTask?.id,
      });
      setSession(started);
      setLoadedAt(Date.now());
      setTimerPanelOpen(false);
      onSessionChange?.(started);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível iniciar o Pomodoro.",
      );
    } finally {
      setBusy(false);
    }
  };

  const pause = async () => {
    if (!session) return;
    const optimistic = {
      ...session,
      status: "PAUSED" as const,
      elapsed_seconds: elapsed,
      paused_at: new Date().toISOString(),
      pause_reason: "Pausa manual",
    };
    setSession(optimistic);
    setLoadedAt(Date.now());
    onSessionChange?.(optimistic);
    setBusy(true);
    try {
      const updated = await dailyStudyApi.pause(session.id, "Pausa manual");
      setSession(updated);
      setLoadedAt(Date.now());
      onSessionChange?.(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível pausar.",
      );
      void loadActive();
      onSessionChange?.();
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    if (!session) return;
    const optimistic = {
      ...session,
      status: "RUNNING" as const,
      paused_at: undefined,
      pause_reason: undefined,
    };
    setSession(optimistic);
    setLoadedAt(Date.now());
    onSessionChange?.(optimistic);
    setBusy(true);
    try {
      const updated = await dailyStudyApi.resume(session.id);
      setSession(updated);
      setLoadedAt(Date.now());
      onSessionChange?.(updated);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível continuar.",
      );
      void loadActive();
      onSessionChange?.();
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const result = await dailyStudyApi.finishQuestionPractice(session.id);
      setSummary(result.feedback?.[0] || "Sessão registrada.");
      setSession(null);
      setTimerPanelOpen(false);
      onDailyTaskFinished?.();
      onSessionChange?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível finalizar.",
      );
    } finally {
      setBusy(false);
    }
  };

  const recordAnswer = async (question: Question, correct: boolean) => {
    if (!session || session.status !== "RUNNING") return;
    try {
      const updated = await dailyStudyApi.recordQuestion(
        session.id,
        String(question.id),
        correct,
      );
      setSession((current) =>
        !current ||
        Number(updated.questions_answered || 0) >=
          Number(current.questions_answered || 0)
          ? updated
          : current,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "A resposta foi salva, mas não entrou no Pomodoro.",
      );
      setTimerPanelOpen(true);
    }
  };

  return (
    <div className="question-bank-tab space-y-5">
      {visible && timerLoading && !session && (
        <div className="question-timer-loading" role="status">
          <Clock3 aria-hidden="true" />
          <span>Sincronizando timer…</span>
        </div>
      )}

      {visible && !timerLoading && !session && (
        <section
          className="question-pomodoro-card question-pomodoro-compact"
          aria-label="Configurar timer de questões"
        >
          {error && (
            <div className="question-timer-message is-error">
              {error}
              <button onClick={() => setError("")} aria-label="Fechar aviso">
                <X />
              </button>
            </div>
          )}
          {summary && (
            <div className="question-timer-message">
              <CheckCircle2 />
              {summary}
            </div>
          )}
          {blockingSession && (
            <div className="question-timer-message is-warning">
              Existe uma sessão de estudo em andamento:{" "}
              <strong>{blockingSession.topic_title || "atividade atual"}</strong>.
              Finalize-a antes de iniciar uma nova sessão de questões.
            </div>
          )}
          <div className="question-pomodoro-body">
            <div className="question-pomodoro-intro">
              <span className="question-pomodoro-intro-icon"><Clock3 /></span>
              <div>
                <strong>Timer de foco</strong>
                <span>Escolha o ritmo da sua sessão</span>
              </div>
            </div>
            <div className="question-pomodoro-modes" role="group" aria-label="Duração do timer de questões">
              <button type="button" className={timerMode==='POMODORO_25'?'is-selected':''} aria-pressed={timerMode==='POMODORO_25'} onClick={()=>setTimerMode('POMODORO_25')}><strong>25</strong><span>min</span></button>
              <button type="button" className={timerMode==='POMODORO_50'?'is-selected':''} aria-pressed={timerMode==='POMODORO_50'} onClick={()=>setTimerMode('POMODORO_50')}><strong>50</strong><span>min</span></button>
              <button type="button" className={timerMode==='FREE'?'is-selected':''} aria-pressed={timerMode==='FREE'} onClick={()=>setTimerMode('FREE')}><strong>∞</strong><span>livre</span></button>
            </div>
            <button
                type="button"
                className="question-pomodoro-launch"
                disabled={busy || Boolean(blockingSession)}
                onClick={start}
              >
                <span className="question-pomodoro-launch-icon"><Play /></span>
                <span className="question-pomodoro-launch-copy"><small>{timerMode==='FREE'?'Sessão sem limite':`${focusMinutes} min de foco`}</small><strong>{timerMode==='FREE'?'Iniciar livre':clock(timerDisplay)}</strong></span>
                <span className="question-pomodoro-launch-action">Começar</span>
            </button>
          </div>
        </section>
      )}

      {session &&
        createPortal(
        <div
          className={`question-floating-timer ${visible ? "is-question-screen" : ""} ${session.status === "PAUSED" ? "is-paused" : "is-running"}`}
        >
          {timerPanelOpen && (
            <aside
              id="question-floating-timer-panel"
              className="question-floating-timer-panel"
              role="dialog"
              aria-label="Controles do timer de questões"
            >
              <header>
                <span className="question-floating-timer-icon" aria-hidden="true">
                  <AlarmClock />
                </span>
                <div>
                  <small>
                    {isPomodoroBreak
                      ? "Intervalo"
                      : freeMode
                        ? "Tempo de questões"
                        : "Pomodoro de questões"}
                  </small>
                  <strong>{clock(timerDisplay)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setTimerPanelOpen(false)}
                  aria-label="Recolher timer"
                >
                  <X />
                </button>
              </header>
              <p>{timerStatus}</p>
              {error && (
                <div className="question-floating-timer-message is-error" role="alert">
                  {error}
                </div>
              )}
              {summary && (
                <div className="question-floating-timer-message">
                  <CheckCircle2 /> {summary}
                </div>
              )}
              <div className="question-floating-timer-actions">
                {session.status === "RUNNING" && (
                  <button type="button" disabled={busy} onClick={pause}>
                    <Pause /> Pausar
                  </button>
                )}
                {session.status === "PAUSED" && !targetMet && (
                  <button type="button" disabled={busy} onClick={resume}>
                    <Play /> Continuar
                  </button>
                )}
                <button
                  type="button"
                  className="is-finish"
                  disabled={busy}
                  onClick={finish}
                >
                  <Square /> Finalizar
                </button>
              </div>
            </aside>
          )}
          <button
            type="button"
            className="question-floating-alarm"
            onClick={() => setTimerPanelOpen((open) => !open)}
            aria-expanded={timerPanelOpen}
            aria-controls="question-floating-timer-panel"
            aria-label={`${timerPanelOpen ? "Recolher" : "Abrir"} timer de questões. ${timerStatus}. ${clock(timerDisplay)}`}
          >
            <AlarmClock aria-hidden="true" />
            <span className="question-floating-alarm-time">{clock(timerDisplay)}</span>
          </button>
        </div>,
          document.body,
        )}

      {visible &&
        showBackToTop &&
        createPortal(
          <button
            type="button"
            className="question-back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Voltar ao topo das questões"
            title="Voltar ao topo"
          >
            <ArrowUp aria-hidden="true" />
          </button>,
          document.body,
        )}

      {visible && (
        <QuizTab
          mode="all"
          initialQuestionId={initialQuestionId}
          onQuestionAnswered={recordAnswer}
        />
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  RefreshCw,
  Target,
  X,
} from "lucide-react";
import {
  dailyStudyApi,
  scheduleApi,
  ScheduleAgendaDay,
  ScheduleAgendaItem,
  StudyDashboardData,
} from "../services/api";
import { ActiveStudyContext } from "../studyContext";
import "./ScheduleTab.css";

interface Props {
  studyContext: ActiveStudyContext | null;
  onOpenStudy: (context?: ActiveStudyContext) => void;
  onOpenQuestions: () => void;
  refreshVersion?: number;
}

const statusLabel: Record<string, string> = {
  COMPLETED: "Concluído",
  IN_PROGRESS: "Em andamento",
  AVAILABLE: "Disponível",
  PENDING: "Planejado",
  PLANNED: "Planejado",
  MISSED: "Não realizado",
  MOVED: "Reagendado",
  SKIPPED: "Ignorado",
};

const activityLabel: Record<string, string> = {
  THEORY: "Teoria",
  QUESTIONS: "Questões",
  REVIEW: "Revisão",
  REVISION: "Revisão",
  SIMULATION: "Simulado",
  READING: "Leitura",
  FLASHCARDS: "Flashcards",
  PLANNED: "Estudo",
};

const number = (value: unknown) => Number(value || 0);
const isoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const localDate = (value: string) => new Date(`${value}T12:00:00`);
const firstOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1, 12);
const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const isInMonth = (value: string, month: Date) => {
  const date = localDate(value);
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
};
const calendarRange = (month: Date) => {
  const start = firstOfMonth(month);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return { start: isoDate(start), end: isoDate(end) };
};
const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
};
const longDate = (value: string) =>
  localDate(value).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

interface AgendaTopicAccordionProps {
  item: ScheduleAgendaItem;
  index: number;
  expanded: boolean;
  current: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

function AgendaTopicAccordion({
  item,
  index,
  expanded,
  current,
  onToggle,
  onOpen,
}: AgendaTopicAccordionProps) {
  const questions = number(item.questions_answered),
    correct = number(item.correct_answers);
  const accuracy =
    item.accuracy == null
      ? questions
        ? Math.round((correct / questions) * 100)
        : 0
      : Math.round(number(item.accuracy));
  const points = Array.isArray(item.review_points) ? item.review_points : [];
  const contentId = `agenda-modal-topic-${String(item.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <article
      className={`agenda-modal-topic ${expanded ? "is-expanded" : ""} ${current ? "is-current" : ""}`}
    >
      <button
        type="button"
        className="agenda-modal-topic-trigger"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <span className="agenda-modal-topic-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="agenda-modal-topic-name">
          <small>{item.topic_title || item.subject_name}</small>
          <strong>{item.title}</strong>
        </span>
        <span className="agenda-modal-topic-brief">
          <em>{duration(number(item.planned_minutes))}</em>
          <em>{activityLabel[item.activity_type] || item.activity_type}</em>
          <span className={`agenda-status status-${item.status.toLowerCase()}`}>
            {statusLabel[item.status] || item.status}
          </span>
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {expanded && (
        <div id={contentId} className="agenda-modal-topic-body">
          <div className="agenda-modal-topic-overview">
            <section>
              <small>OBJETIVO DO ESTUDO</small>
              <p>
                {item.objective ||
                  "Consolidar os conceitos centrais deste assunto e aplicá-los em questões de prova."}
              </p>
            </section>
            <section className="agenda-modal-review">
              <small>REVISÃO RESUMIDA</small>
              {points.length > 0 ? (
                <ul>
                  {points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  Revise os conceitos centrais, as exceções e os pontos com
                  maior incidência em prova.
                </p>
              )}
            </section>
          </div>
          <div className="agenda-modal-topic-metrics">
            <span>
              <Clock3 />
              <small>Tempo realizado</small>
              <strong>{duration(number(item.studied_minutes))}</strong>
            </span>
            <span>
              <Target />
              <small>Tempo planejado</small>
              <strong>{duration(number(item.planned_minutes))}</strong>
            </span>
            <span>
              <CircleHelp />
              <small>Questões</small>
              <strong>
                {questions}
                {number(item.question_goal) > 0
                  ? ` / ${number(item.question_goal)}`
                  : ""}
              </strong>
            </span>
            <span>
              <Check />
              <small>Desempenho</small>
              <strong>
                {item.status === "COMPLETED" && questions === 0
                  ? "Finalizado"
                  : questions
                  ? `${correct} acertos · ${accuracy}%`
                  : "Ainda não realizado"}
              </strong>
            </span>
          </div>
          {(item.roadmap_topic_id || item.activity_type === "QUESTIONS") && (
            <div className="agenda-modal-topic-action">
              <button type="button" onClick={onOpen}>
                {item.activity_type === "QUESTIONS" ? <CircleHelp /> : <BookOpen />} {" "}
                {item.activity_type === "QUESTIONS"
                  ? "Abrir banco de questões"
                  : item.status === "COMPLETED"
                  ? "Revisar assunto"
                  : "Abrir assunto para estudar"}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function ScheduleTab({ studyContext, onOpenStudy, onOpenQuestions, refreshVersion }: Props) {
  const today = isoDate(new Date());
  const [dashboard, setDashboard] = useState<StudyDashboardData | null>(null);
  const [agenda, setAgenda] = useState<ScheduleAgendaDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeMonth, setActiveMonth] = useState(() =>
    firstOfMonth(new Date()),
  );
  const [loading, setLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [expandedModalItems, setExpandedModalItems] = useState<string[]>([]);
  const [mobileCalendarOpen,setMobileCalendarOpen]=useState(false);
  const agendaRequestRef = useRef(0);
  const agendaLoadingCountRef = useRef(0);
  const selectFirstPlannedMonthRef = useRef<string | null>(null);

  const requestAgenda = useCallback(
    async (planId: string, month: Date, silent = false) => {
      const requestId = ++agendaRequestRef.current;
      const range = calendarRange(month);
      if (!silent) {
        agendaLoadingCountRef.current += 1;
        setAgendaLoading(true);
      }
      try {
        const response = await scheduleApi.getAgenda(
          planId,
          range.start,
          range.end,
        );
        if (requestId !== agendaRequestRef.current) return;
        const days = response.days || [];
        setAgenda(days);
        setError("");
        const requestedMonth = monthKey(month);
        if (selectFirstPlannedMonthRef.current === requestedMonth) {
          const firstPlanned = days.find(
            (day) => day.items.length > 0 && isInMonth(day.date, month),
          );
          setSelectedDate(firstPlanned?.date || isoDate(firstOfMonth(month)));
          selectFirstPlannedMonthRef.current = null;
        }
      } catch (requestError) {
        if (requestId !== agendaRequestRef.current) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar a agenda.",
        );
      } finally {
        if (!silent) {
          agendaLoadingCountRef.current = Math.max(
            0,
            agendaLoadingCountRef.current - 1,
          );
          if (agendaLoadingCountRef.current === 0) setAgendaLoading(false);
        }
      }
    },
    [],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dailyStudyApi.today();
      setDashboard(response);
      const current = String(response.today.date || today);
      setSelectedDate(current);
      setActiveMonth(firstOfMonth(localDate(current)));
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar o cronograma.",
      );
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    const planId = dashboard?.plan?.id;
    if (planId) void requestAgenda(String(planId), activeMonth);
  }, [activeMonth, dashboard?.plan?.id, refreshVersion, requestAgenda]);
  useEffect(() => {
    const planId = dashboard?.plan?.id;
    if (!planId) return;
    const sync = () => {
      if (document.visibilityState === "visible")
        void requestAgenda(String(planId), activeMonth, true);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [activeMonth, dashboard?.plan?.id, requestAgenda]);

  const agendaByDate = useMemo(
    () => new Map(agenda.map((day) => [day.date, day])),
    [agenda],
  );
  const modalDay = modalDate ? agendaByDate.get(modalDate) : undefined;
  const monthDays = useMemo(
    () =>
      agenda.filter((day) => {
        return isInMonth(day.date, activeMonth);
      }),
    [agenda, activeMonth],
  );
  const plannedMonthDays = useMemo(
    () => monthDays.filter((day) => day.items.length > 0),
    [monthDays],
  );
  const nextPlannedDay = useMemo(
    () =>
      plannedMonthDays.find((day) => day.date > selectedDate) ||
      plannedMonthDays[0],
    [plannedMonthDays, selectedDate],
  );
  const mobileWeekDays=useMemo(()=>{
    const start=localDate(selectedDate);
    start.setDate(start.getDate()-start.getDay());
    return Array.from({length:7},(_,index)=>{
      const date=new Date(start);date.setDate(start.getDate()+index);
      const value=isoDate(date);
      return {value,date,agenda:agendaByDate.get(value)};
    });
  },[agendaByDate,selectedDate]);
  const selectedAgendaDay=agendaByDate.get(selectedDate);
  const monthStats = useMemo(
    () =>
      monthDays.reduce(
        (stats, day) => ({
          studied: stats.studied + number(day.studied_minutes),
          questions: stats.questions + number(day.questions_answered),
          completed:
            stats.completed +
            day.items.filter((item) => item.status === "COMPLETED").length,
        }),
        { studied: 0, questions: 0, completed: 0 },
      ),
    [monthDays],
  );

  const openAgendaDay = (date: Date | string) => {
    const value = typeof date === "string" ? date : isoDate(date);
    selectFirstPlannedMonthRef.current = null;
    setSelectedDate(value);
    setModalDate(value);
    const day = agendaByDate.get(value);
    setExpandedModalItems(day?.items[0] ? [String(day.items[0].id)] : []);
  };
  const closeAgendaModal = () => {
    setModalDate(null);
    setExpandedModalItems([]);
  };
  const selectMobileDay=(value:string)=>{
    setSelectedDate(value);
    const month=firstOfMonth(localDate(value));
    if(monthKey(month)!==monthKey(activeMonth))setActiveMonth(month);
  };
  const toggleModalItem = (id: string) =>
    setExpandedModalItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  useEffect(() => {
    if (!modalDate) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAgendaModal();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalDate]);

  if (loading && !dashboard)
    return (
      <div className="daily-dashboard-loading schedule-initial-loading" role="status" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <div>
          <p>Carregando cronograma…</p>
          <small>Aguarde um momento.</small>
        </div>
      </div>
    );
  if (!dashboard)
    return (
      <section className="daily-dashboard-error" role="alert">
        <CalendarDays />
        <h2>Não foi possível carregar sua agenda</h2>
        <p>{error}</p>
        <button onClick={loadDashboard}>Tentar novamente</button>
      </section>
    );

  return (
    <div id="schedule-tab-container" className="study-agenda animate-fade-in">

      {error && (
        <div className="agenda-error" role="alert">
          {error}
        </div>
      )}

      <section className="agenda-mobile-view" aria-label="Agenda semanal">
        <header><div><span>Próximos estudos</span><h2>{longDate(selectedDate)}</h2></div><button type="button" onClick={()=>setMobileCalendarOpen(value=>!value)} aria-expanded={mobileCalendarOpen}><CalendarDays/>{mobileCalendarOpen?'Fechar mês':'Ver mês'}</button></header>
        <div className="agenda-mobile-week" role="list" aria-label="Dias da semana">
          {mobileWeekDays.map(day=><button type="button" role="listitem" key={day.value} className={`${day.value===selectedDate?'is-selected':''} ${day.agenda?.items.length?'has-study':''}`} onClick={()=>selectMobileDay(day.value)}><span>{day.date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</span><strong>{day.date.getDate()}</strong><i aria-hidden="true"/></button>)}
        </div>
        <div className="agenda-mobile-day-list">
          {selectedAgendaDay?.items.length?selectedAgendaDay.items.map(item=><article key={String(item.id)}><span className={`agenda-mobile-status status-${item.status.toLowerCase()}`}><BookOpen/></span><div><small>{activityLabel[item.activity_type]||item.activity_type} · {duration(number(item.planned_minutes))}</small><strong>{item.title}</strong><p>{item.subject_name}</p></div><button type="button" onClick={()=>openAgendaDay(selectedDate)} aria-label={`Abrir detalhes de ${item.title}`}><ChevronDown/></button></article>):<div className="agenda-mobile-empty"><CalendarDays/><strong>Dia livre no planejamento</strong><p>Selecione outro dia ou abra o calendário mensal.</p></div>}
        </div>
      </section>

      <div className="agenda-layout">
        <section
          className={`agenda-calendar-card ${mobileCalendarOpen?'is-mobile-open':''}`}
          aria-label="Calendário mensal de estudos"
        >
          <ReactCalendar
            locale="pt-BR"
            value={localDate(selectedDate)}
            activeStartDate={activeMonth}
            minDetail="month"
            maxDetail="month"
            next2Label={null}
            prev2Label={null}
            onClickDay={openAgendaDay}
            onActiveStartDateChange={({ activeStartDate, action }) => {
              if (!activeStartDate) return;
              const month = firstOfMonth(activeStartDate);
              if (action === "next" || action === "prev") {
                selectFirstPlannedMonthRef.current = monthKey(month);
                closeAgendaModal();
                setAgenda([]);
              }
              setActiveMonth(month);
            }}
            formatShortWeekday={(_, date) =>
              date
                .toLocaleDateString("pt-BR", { weekday: "short" })
                .replace(".", "")
            }
            tileClassName={({ date, view }) => {
              if (view !== "month") return undefined;
              const day = agendaByDate.get(isoDate(date));
              return day
                ? `agenda-calendar-day status-${day.status.toLowerCase()}`
                : undefined;
            }}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const day = agendaByDate.get(isoDate(date));
              if (!day) return null;
              return (
                <span
                  className="agenda-day-subjects"
                  aria-label={`${day.items.length} assuntos neste dia`}
                >
                  {day.items.slice(0, 3).map((item) => (
                    <span
                      key={String(item.id)}
                      className={`agenda-calendar-event status-${item.status.toLowerCase()}`}
                      title={`${item.subject_name}: ${item.title}`}
                    >
                      {item.title}
                    </span>
                  ))}
                  <em
                    className={`agenda-day-overflow agenda-day-overflow-wide ${day.items.length > 3 ? "is-overflow" : ""}`}
                  >
                    +{day.items.length - 3}
                  </em>
                  <em
                    className={`agenda-day-overflow agenda-day-overflow-mobile ${day.items.length > 2 ? "is-overflow" : ""}`}
                  >
                    +{day.items.length - 2}
                  </em>
                </span>
              );
            }}
          />
          {agendaLoading && (
            <div className="agenda-calendar-loading">
              <RefreshCw className="animate-spin" />
              <span>Atualizando agenda…</span>
            </div>
          )}
        </section>
      </div>

      {modalDate &&
        createPortal(
          <div
            className="agenda-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAgendaModal();
            }}
          >
            <section
              className="agenda-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="agenda-modal-title"
            >
              <header className="agenda-modal-header">
                <div className="agenda-modal-date-icon">
                  <CalendarDays />
                </div>
                <div>
                  <span>AGENDA DO DIA</span>
                  <h2 id="agenda-modal-title">{longDate(modalDate)}</h2>
                  <p>
                    {modalDay?.items.length || 0}{" "}
                    {(modalDay?.items.length || 0) === 1
                      ? "assunto planejado"
                      : "assuntos planejados"}{" "}
                    · {duration(number(modalDay?.planned_minutes))} de estudo
                  </p>
                </div>
                <button
                  type="button"
                  className="agenda-modal-close"
                  onClick={closeAgendaModal}
                  aria-label="Fechar agenda do dia"
                >
                  <X />
                </button>
              </header>

              {modalDay && modalDay.items.length > 0 ? (
                <>
                  <div className="agenda-modal-summary">
                    <span>
                      <Clock3 />
                      <small>Realizado</small>
                      <strong>
                        {duration(number(modalDay.studied_minutes))}
                      </strong>
                    </span>
                    <span>
                      <Target />
                      <small>Planejado</small>
                      <strong>
                        {duration(number(modalDay.planned_minutes))}
                      </strong>
                    </span>
                    <span>
                      <CircleHelp />
                      <small>Questões feitas</small>
                      <strong>{number(modalDay.questions_answered)}</strong>
                    </span>
                    <span>
                      <BarChart3 />
                      <small>Acertos</small>
                      <strong>{number(modalDay.correct_answers)}</strong>
                    </span>
                  </div>
                  <div className="agenda-modal-content">
                    <div className="agenda-modal-section-heading">
                      <div>
                        <span>ROTEIRO DE ESTUDO</span>
                        <h3>Assuntos deste dia</h3>
                      </div>
                      <small>Clique para expandir ou recolher</small>
                    </div>
                    <div className="agenda-modal-topic-list">
                      {modalDay.items.map((item, index) => {
                        const id = String(item.id);
                        return (
                          <AgendaTopicAccordion
                            key={id}
                            item={item}
                            index={index}
                            expanded={expandedModalItems.includes(id)}
                            current={Boolean(
                              studyContext?.roadmapTopicId &&
                              String(studyContext.roadmapTopicId) ===
                                String(item.roadmap_topic_id),
                            )}
                            onToggle={() => toggleModalItem(id)}
                            onOpen={() => {
                              closeAgendaModal();
                              if (item.activity_type === "QUESTIONS") {
                                onOpenQuestions();
                                return;
                              }
                              onOpenStudy({
                                roadmapTopicId: String(item.roadmap_topic_id),
                                topicTitle: item.topic_title || item.title,
                                subjectName: item.title,
                                source: "schedule",
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="agenda-modal-empty">
                  <CalendarDays />
                  <h3>Dia livre no planejamento</h3>
                  <p>
                    Não há assuntos agendados para esta data. Escolha no
                    calendário um dia que tenha a marcação de planejamento.
                  </p>
                  {nextPlannedDay && (
                    <button
                      type="button"
                      onClick={() => openAgendaDay(nextPlannedDay.date)}
                    >
                      Abrir próximo dia de estudo
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}

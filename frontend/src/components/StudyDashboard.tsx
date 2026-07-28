import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Check, ChevronRight, Circle, Clock3, Pause,
  Play, RotateCcw, Sparkles, Target, TimerReset, X, ListChecks
} from 'lucide-react';
import { dailyStudyApi, StudyDashboardData, StudySession } from '../services/api';
import { ActiveStudyContext } from '../studyContext';
import './Studydashboard.css';

interface Props {
  onManagePlans: () => void;
  onOpenStudy: (context?: ActiveStudyContext) => void;
  onOpenQuestions: () => void;
  onStudyContextChange: (context: ActiveStudyContext) => void;
  onSessionChange?: () => void;
}

const duration = (minutes: number) => {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ''}` : `${rest}min`;
};
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const number = (value: unknown) => Number(value || 0);
const reviewTiming=(review:Record<string,any>)=>{
  if(review.status==='OVERDUE')return 'Atrasada';
  if(review.status==='AVAILABLE')return 'Hoje';
  const raw=String(review.scheduled_date||'');
  const parts=raw.slice(0,10).split('-').map(Number);
  if(parts.length!==3||parts.some(value=>!Number.isFinite(value)))return 'Agendada';
  const target=Date.UTC(parts[0],parts[1]-1,parts[2]);
  const now=new Date();
  const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  const days=Math.max(0,Math.round((target-today)/86_400_000));
  return days===0?'Hoje':days===1?'Amanhã':`Em ${days} dias`;
};
const pomodoroConfig = (session: StudySession | null) => {
  if(!session?.pomodoro_config)return null;
  try{return JSON.parse(session.pomodoro_config) as {focusMinutes:number;shortBreakMinutes:number;longBreakMinutes:number;cycles:number};}
  catch{return null;}
};

export default function StudyDashboard({ onManagePlans, onOpenStudy, onOpenQuestions, onStudyContextChange, onSessionChange }: Props) {
  const [data, setData] = useState<StudyDashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timerMode, setTimerMode] = useState<'FREE'|'POMODORO'>('FREE');
  const [pomodoroPreset, setPomodoroPreset] = useState<'25/5'|'50/10'>('25/5');
  const [feedback, setFeedback] = useState<string[]>([]);
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [loadedAt, setLoadedAt] = useState(Date.now());
  const automaticPause = useRef('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await dailyStudyApi.today();
      setData(response); setError(''); setLoadedAt(Date.now()); setTick(0);
      const runningTask=response.active_session?.daily_task_id
        ? response.tasks.find(task=>task.id===response.active_session.daily_task_id)
        : undefined;
      const contextTask=runningTask || response.tasks.find(task=>['AVAILABLE','IN_PROGRESS'].includes(task.status));
      if(contextTask)onStudyContextChange({roadmapTopicId:contextTask.roadmap_topic_id,topicTitle:contextTask.topic_title,
        subjectName:contextTask.subject_name,source:runningTask?'session':'daily-plan'});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar sua rotina diária.');
    } finally { if (!quiet) setLoading(false); }
  }, [onStudyContextChange]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = window.setInterval(() => setTick(value => value + 1), 1000);
    const reconcile = window.setInterval(() => load(true), 30000);
    return () => { clearInterval(interval); clearInterval(reconcile); };
  }, [load]);

  const restoredSession = data?.active_session && data.active_session.id ? data.active_session as StudySession : null;
  const questionPractice = restoredSession?.session_kind==='QUESTIONS' ? restoredSession : null;
  const active = restoredSession?.session_kind!=='QUESTIONS' ? restoredSession : null;
  const elapsed = active ? number(active.elapsed_seconds) + (active.status === 'RUNNING' ? Math.max(0, Math.floor((Date.now() - loadedAt) / 1000)) : 0) : 0;
  void tick;
  const pomo=pomodoroConfig(active);
  const cycle=number(active?.pomodoro_cycle);
  const pauseSeconds=active?.status==='PAUSED'&&active.paused_at?Math.max(0,Math.floor((Date.now()-new Date(active.paused_at).getTime())/1000)):0;
  const breakSeconds=pomo?(cycle>0&&cycle%Math.max(1,pomo.cycles)===0?pomo.longBreakMinutes:pomo.shortBreakMinutes)*60:0;
  const breakRemaining=Math.max(0,breakSeconds-pauseSeconds);
  const currentTask = useMemo(() => {
    if (!data || questionPractice) return null;
    if (active) return data.tasks.find(task => task.id === active.daily_task_id) || data.tasks[0] || null;
    return data.tasks.find(task => ['AVAILABLE','IN_PROGRESS'].includes(task.status)) || data.tasks.find(task => task.status !== 'COMPLETED') || null;
  }, [active, data]);
  const isPomoBreak=active?.mode==='POMODORO'&&active.status==='PAUSED'&&active.pause_reason==='POMODORO_FOCUS_COMPLETE'&&Boolean(pomo);
  const selectedFocusMinutes=pomodoroPreset==='25/5'?25:50;
  const focusSeconds=Math.max(1,number(pomo?.focusMinutes)*60);
  const focusElapsed=pomo?Math.max(0,elapsed-cycle*focusSeconds):0;
  const focusRemaining=pomo?Math.max(0,focusSeconds-focusElapsed):selectedFocusMinutes*60;
  const timerDisplay=isPomoBreak?breakRemaining:active?.mode==='POMODORO'||(!active&&timerMode==='POMODORO')?focusRemaining:elapsed;
  const timerCaption=isPomoBreak?'de pausa':active?.mode==='POMODORO'||(!active&&timerMode==='POMODORO')
    ? `restantes no foco de ${pomo?.focusMinutes||selectedFocusMinutes} min`
    : `de ${currentTask?.planned_minutes || 0}:00`;
  const timerProgress=active?.mode==='POMODORO'&&pomo
    ? Math.min(100,focusElapsed/focusSeconds*100)
    : Math.min(100,elapsed/Math.max(1,number(currentTask?.planned_minutes)*60)*100);

  useEffect(()=>{
    if(!active||active.mode!=='POMODORO'||active.status!=='RUNNING'||!pomo)return;
    const threshold=(cycle+1)*pomo.focusMinutes*60;
    const key=`${active.id}:${cycle}`;
    if(elapsed<threshold||automaticPause.current===key)return;
    automaticPause.current=key; setBusy(true);
    dailyStudyApi.pause(active.id,'POMODORO_FOCUS_COMPLETE').then(()=>{
      setFeedback([`Ciclo ${cycle+1} concluído. Sua pausa começou agora.`]); onSessionChange?.(); return load(true);
    }).catch(requestError=>setError(requestError instanceof Error?requestError.message:'Não foi possível iniciar a pausa.'))
      .finally(()=>setBusy(false));
  },[active?.id,active?.status,cycle,elapsed,pomo?.focusMinutes]);

  const action = async (operation: () => Promise<unknown>) => {
    setBusy(true); setFeedback([]);
    try { await operation(); await load(true); onSessionChange?.(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'A operação não foi concluída.'); }
    finally { setBusy(false); }
  };
  const start = () => currentTask && action(async() => {
    await dailyStudyApi.start(currentTask.id, {
      mode: timerMode,
      pomodoro: timerMode === 'POMODORO' ? {
        focusMinutes: pomodoroPreset === '25/5' ? 25 : 50,
        shortBreakMinutes: pomodoroPreset === '25/5' ? 5 : 10,
        longBreakMinutes: 15, cycles: 4
      } : undefined,
      device: navigator.userAgent.slice(0,150)
    });
    onOpenStudy({roadmapTopicId:currentTask.roadmap_topic_id,topicTitle:currentTask.topic_title,
      subjectName:currentTask.subject_name,source:'session'});
  });
  const rebalance = () => {
    const answer=window.prompt('Quanto tempo você tem hoje? Informe os minutos (mínimo 30).','60');
    if(answer===null)return;
    const minutes=Number(answer);
    if(!Number.isFinite(minutes)||minutes<30){setError('Informe pelo menos 30 minutos para reorganizar o dia.');return;}
    action(()=>dailyStudyApi.rebalance(Math.round(minutes)));
  };

  if (loading) return (
    <div className="daily-dashboard-loading">
      <span className="loading-mark" aria-hidden="true" />
      <p>Montando seu plano de hoje</p>
    </div>
  );

  if (error && !data) return (
    <section className="daily-dashboard-error" role="alert">
      <span className="error-icon"><TimerReset /></span>
      <h2>Sua rotina não pôde ser carregada</h2>
      <p>{error}</p>
      <div className="error-actions">
        <button className="ghost-action" onClick={()=>load()}>Tentar novamente</button>
        <button className="text-action" onClick={onManagePlans}>Gerenciar planos</button>
      </div>
    </section>
  );

  if (!data) return null;

  const progress = Math.min(100, number(data.today.progress_percentage));
  const recommendedTopicStudied=number(data.next.attempts)>0;
  const recommendationMastery=recommendedTopicStudied?number(data.next.mastery):number(data.next.plan_mastery);
  const recommendationMasteryLabel=recommendedTopicStudied?'Domínio do assunto':'Domínio médio do plano';
  const completedTasks=data.tasks.filter(task=>task.status==='COMPLETED').length;
  const currentTaskIndex=currentTask?data.tasks.findIndex(task=>task.id===currentTask.id):-1;
  const nextTask=data.tasks.find((task,index)=>index>currentTaskIndex&&task.status!=='COMPLETED')||null;

  return <div className="daily-dashboard">
    <header className="daily-dashboard-heading">
      <div className="heading-copy">
        <span className="eyebrow">Rotina diária</span>
        <h2>Seu plano de hoje</h2>
        <p>{data.plan.title}</p>
      </div>
    </header>

    {error&&<div className="daily-inline-error" role="alert"><span>{error}</span><button className="icon-only" onClick={()=>setError('')} aria-label="Fechar aviso"><X /></button></div>}
    {feedback.length>0&&<div className="completion-feedback"><span className="feedback-icon"><Sparkles /></span><div><strong>Sessão registrada</strong>{feedback.map(message=><p key={message}>{message}</p>)}</div><button className="icon-only" onClick={()=>setFeedback([])} aria-label="Dispensar"><X /></button></div>}

    <div className="daily-main-grid">
      <section className="focus-card">
        <div className="focus-card-top">
          <div>
            <span className="eyebrow">{questionPractice?'Pomodoro em andamento':active?'Sessão em andamento':'Próxima ação'}</span>
            <h3>{questionPractice?'Banco completo de questões':currentTask?.topic_title || 'Meta diária concluída'}</h3>
            <p>{questionPractice?`${number(questionPractice.questions_answered)} questões respondidas nesta sessão`:currentTask?.subject_name || 'Seu progresso de hoje foi salvo.'}</p>
          </div>
          {currentTask&&!questionPractice&&<span className="focus-duration"><Clock3 />{currentTask.planned_minutes} min</span>}
        </div>
        {currentTask&&!questionPractice ? <>
          <div className="focus-objective"><Target /><p><strong>Objetivo</strong>{currentTask.objective || 'Consolidar o conteúdo e praticar com questões.'}</p></div>
          <div className="timer-stage">
            <div className={`timer-ring ${active?.status==='PAUSED'?'is-paused':''}`} style={{'--timer-progress':`${timerProgress}%`} as React.CSSProperties}>
              <div className="timer-face"><span>{clock(timerDisplay)}</span><small>{timerCaption}</small></div>
            </div>
            <div className="timer-details">
              <p><span>Questões</span><strong>{currentTask.questions_answered}/{currentTask.question_goal}</strong></p>
              <p><span>Meta de acertos</span><strong>{currentTask.minimum_accuracy}%</strong></p>
              <p><span>Domínio atual</span><strong>{Math.round(number(currentTask.mastery))}%</strong></p>
            </div>
          </div>
          {!active&&<div className="timer-mode">
            <button className={timerMode==='FREE'?'is-active':''} onClick={()=>setTimerMode('FREE')}>Timer livre</button>
            <button className={timerMode==='POMODORO'?'is-active':''} onClick={()=>setTimerMode('POMODORO')}>Pomodoro</button>
            {timerMode==='POMODORO'&&<select value={pomodoroPreset} onChange={event=>setPomodoroPreset(event.target.value as '25/5'|'50/10')} aria-label="Duração do pomodoro"><option value="25/5">25 min + 5 min</option><option value="50/10">50 min + 10 min</option></select>}
          </div>}
          <div className="timer-actions">
            {!active&&<button className="primary-study-action" disabled={busy} onClick={start}><Play /> Começar agora</button>}
            {active?.status==='RUNNING'&&<button className="secondary-study-action" disabled={busy} onClick={()=>action(()=>dailyStudyApi.pause(active.id,'Pausa manual'))}><Pause /> Pausar</button>}
            {active?.status==='PAUSED'&&<button className="primary-study-action" disabled={busy} onClick={()=>action(()=>dailyStudyApi.resume(active.id))}><Play /> Continuar</button>}
            {active&&<button className="finish-study-action" disabled={busy} onClick={()=>onOpenStudy({roadmapTopicId:currentTask.roadmap_topic_id,topicTitle:currentTask.topic_title,subjectName:currentTask.subject_name,source:'session'})}><BookOpen /> Continuar conteúdo</button>}
          </div>
        </>:questionPractice?<button className="primary-study-action" onClick={onOpenQuestions}><ListChecks /> Continuar questões</button>:<button className="primary-study-action" onClick={()=>onOpenStudy()}><BookOpen /> Revisar conteúdos</button>}
      </section>

      <aside className="today-plan-card">
        <div className="card-heading"><div><span className="eyebrow">Rota do dia</span><h3>Plano de hoje</h3></div><strong className="progress-figure">{Math.round(progress)}%</strong></div>
        <div className="daily-progress-track"><i style={{width:`${progress}%`}}/></div>
        <ol className="today-task-list">{data.tasks.map((task)=>{
          const complete=task.status==='COMPLETED',current=task.id===currentTask?.id;
          return <li key={task.id} className={`${complete?'is-complete':''} ${current?'is-current':''}`}>
            <span className="task-state">{complete?<Check />:<Circle />}</span>
            <button disabled={!current&&!complete} onClick={()=>current&&!active&&start()}><strong>{task.topic_title}</strong><small>{task.subject_name} · {task.planned_minutes} min</small></button>
            <span className="task-tag">{complete?'Feito':current?'Agora':task.activity_type==='REVIEW'?'Revisão':'Depois'}</span>
          </li>;
        })}</ol>
        <div className="today-plan-footer"><Clock3 /><span><strong>{duration(number(data.today.remaining_minutes))}</strong> para cumprir a meta de hoje</span></div>
        <button className="less-time-button" onClick={rebalance}>Hoje tenho menos tempo</button>
      </aside>
    </div>

    <section className="mobile-daily-summary" aria-label="Resumo do plano de hoje">
      <div className="mobile-summary-heading">
        <div><span className="eyebrow">Progresso de hoje</span><strong>{completedTasks} de {data.tasks.length} etapas</strong></div>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="daily-progress-track" aria-hidden="true"><i style={{width:`${progress}%`}}/></div>
      <div className="mobile-summary-metrics">
        <div><Clock3/><span><small>Tempo restante</small><strong>{duration(number(data.today.remaining_minutes))}</strong></span></div>
        <div><ListChecks/><span><small>Meta de questões</small><strong>{currentTask?.question_goal||0}</strong></span></div>
      </div>
      {nextTask&&<div className="mobile-next-task"><span>Depois</span><div><strong>{nextTask.topic_title}</strong><small>{nextTask.subject_name} · {nextTask.planned_minutes} min</small></div></div>}
      <button type="button" className="less-time-button" onClick={rebalance}>Ajustar meu tempo de hoje</button>
    </section>

    <button type="button" className={`mobile-insights-toggle ${mobileInsightsOpen?'is-open':''}`} onClick={()=>setMobileInsightsOpen(value=>!value)} aria-expanded={mobileInsightsOpen} aria-controls="dashboard-insights">
      <span><Sparkles/><span><strong>Recomendações e revisões</strong><small>Consulte quando precisar</small></span></span><ChevronRight/>
    </button>

    <div id="dashboard-insights" className={`daily-secondary-grid ${mobileInsightsOpen?'is-mobile-open':''}`}>
      <section className="recommendation-card">
        <div className="recommendation-icon"><Sparkles /></div>
        <span className="eyebrow">Adaptação automática</span>
        <h3>{String(data.next.title||'Rotina em dia')}</h3>
        <p>{String(data.next.reason||'Continue cumprindo as etapas para receber recomendações personalizadas.')}</p>
        {data.next.mastery!==undefined&&<div className="recommendation-mastery"><span>{recommendationMasteryLabel}</span><strong>{Math.round(recommendationMastery)}%</strong><small>{number(data.next.studied_topics)} assuntos avaliados</small></div>}
        <button onClick={()=>onOpenStudy(data.next.title?{roadmapTopicId:String(data.next.id||''),topicTitle:String(data.next.title),subjectName:String(data.next.subject_name||''),source:'recommendation'}:undefined)}>Ver conteúdo <ChevronRight /></button>
      </section>
      <section className="reviews-card">
        <div className="card-heading"><div><span className="eyebrow">Memória ativa</span><h3>Revisões</h3></div><RotateCcw /></div>
        {data.reviews.length===0?<p className="empty-reviews">Conclua uma sessão com questões para criar seu primeiro ciclo de revisão espaçada.</p>:data.reviews.map(review=>{
          const timing=reviewTiming(review);
          return <article key={String(review.id)}><span className={`review-tag ${review.status==='OVERDUE'?'is-overdue':review.status==='SCHEDULED'?'is-scheduled':''}`}>{timing}</span><div><strong>{String(review.topic_title)}</strong><p>{String(review.subject_name)} · {number(review.question_goal)} questões</p></div></article>;
        })}
      </section>
    </div>
  </div>;
}

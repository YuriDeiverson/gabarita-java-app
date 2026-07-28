import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Pause, Play, Square, X } from 'lucide-react';
import QuizTab from './QuizTab';
import { dailyStudyApi, StudySession } from '../services/api';
import { Question } from '../types';

const clock=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;

interface Props { onSessionChange?: () => void; }

export default function QuestionBankTab({onSessionChange}:Props){
  const [session,setSession]=useState<StudySession|null>(null);
  const [blockingSession,setBlockingSession]=useState<Partial<StudySession>|null>(null);
  const [focusMinutes,setFocusMinutes]=useState(25);
  const [loadedAt,setLoadedAt]=useState(Date.now());
  const [tick,setTick]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [summary,setSummary]=useState('');
  const autoPauseKey=useRef('');

  const planId=(()=>{try{return JSON.parse(localStorage.getItem('study_config')||'{}').studyPlanId as string|undefined;}catch{return undefined;}})();
  const loadActive=useCallback(async()=>{
    try{
      const active=await dailyStudyApi.active();
      if(active.id&&active.session_kind==='QUESTIONS'){setSession(active as StudySession);setBlockingSession(null);setLoadedAt(Date.now());}
      else if(active.id){setBlockingSession(active);setSession(null);} else {setBlockingSession(null);setSession(null);}
    }catch(requestError){setError(requestError instanceof Error?requestError.message:'Timer indisponível.');}
  },[]);

  useEffect(()=>{loadActive();},[loadActive]);
  useEffect(()=>{const interval=window.setInterval(()=>setTick(value=>value+1),1000);return()=>clearInterval(interval);},[]);
  const elapsed=session?Number(session.elapsed_seconds||0)+(session.status==='RUNNING'?Math.max(0,Math.floor((Date.now()-loadedAt)/1000)):0):0;
  void tick;
  const config=(()=>{try{return JSON.parse(session?.pomodoro_config||'{}') as {focusMinutes?:number};}catch{return {};}})();
  const cycle=Number(session?.pomodoro_cycle||0);
  const cycleLength=Math.max(1,Number(config.focusMinutes||focusMinutes))*60;
  const cycleElapsed=session?Math.max(0,elapsed-cycle*cycleLength):0;
  const focusRemaining=session?Math.max(0,cycleLength-cycleElapsed):focusMinutes*60;

  useEffect(()=>{
    if(!session||session.status!=='RUNNING'||!config.focusMinutes)return;
    const key=`${session.id}:${cycle}`;
    if(elapsed<(cycle+1)*config.focusMinutes*60||autoPauseKey.current===key)return;
    autoPauseKey.current=key;setBusy(true);
    dailyStudyApi.pause(session.id,'POMODORO_FOCUS_COMPLETE').then(updated=>{setSession(updated);setLoadedAt(Date.now());setSummary(`Ciclo ${cycle+1} concluído. Faça uma pausa antes de continuar.`);onSessionChange?.();})
      .catch(requestError=>setError(requestError instanceof Error?requestError.message:'Não foi possível pausar.')).finally(()=>setBusy(false));
  },[session?.id,session?.status,cycle,elapsed,config.focusMinutes]);

  const start=async()=>{
    if(!planId||String(planId).startsWith('local-')){setError('Salve e ative o plano no servidor para usar o Pomodoro persistente.');return;}
    setBusy(true);setError('');setSummary('');
    try{const started=await dailyStudyApi.startQuestionPractice(planId,focusMinutes);setSession(started);setLoadedAt(Date.now());onSessionChange?.();}
    catch(requestError){setError(requestError instanceof Error?requestError.message:'Não foi possível iniciar o Pomodoro.');}
    finally{setBusy(false);}
  };
  const pause=async()=>{if(!session)return;setBusy(true);try{setSession(await dailyStudyApi.pause(session.id,'Pausa manual'));setLoadedAt(Date.now());onSessionChange?.();}catch(e){setError(e instanceof Error?e.message:'Não foi possível pausar.');}finally{setBusy(false);}};
  const resume=async()=>{if(!session)return;setBusy(true);try{setSession(await dailyStudyApi.resume(session.id));setLoadedAt(Date.now());onSessionChange?.();}catch(e){setError(e instanceof Error?e.message:'Não foi possível continuar.');}finally{setBusy(false);}};
  const finish=async()=>{if(!session)return;setBusy(true);try{const result=await dailyStudyApi.finishQuestionPractice(session.id);setSummary(result.feedback?.[0]||'Sessão registrada.');setSession(null);onSessionChange?.();}catch(e){setError(e instanceof Error?e.message:'Não foi possível finalizar.');}finally{setBusy(false);}};
  const recordAnswer=async(question:Question,correct:boolean)=>{
    if(!session||session.status!=='RUNNING')return;
    try{
      const updated=await dailyStudyApi.recordQuestion(session.id,String(question.id),correct);
      setSession(current=>!current||Number(updated.questions_answered||0)>=Number(current.questions_answered||0)?updated:current);
    }catch(requestError){setError(requestError instanceof Error?requestError.message:'A resposta foi salva, mas não entrou no Pomodoro.');}
  };

  return <div className="question-bank-tab space-y-5">
    <section className="question-pomodoro-card question-pomodoro-compact" aria-label="Pomodoro de questões">
      {error&&<div className="question-timer-message is-error">{error}<button onClick={()=>setError('')} aria-label="Fechar aviso"><X/></button></div>}
      {summary&&<div className="question-timer-message"><CheckCircle2/>{summary}</div>}
      {blockingSession&&<div className="question-timer-message is-warning">Existe uma sessão de estudo em andamento: <strong>{blockingSession.topic_title||'atividade atual'}</strong>. Finalize-a antes de iniciar o Pomodoro de questões.</div>}
      <div className="question-pomodoro-body">
        <div className={`question-pomodoro-time ${session?.status==='PAUSED'?'is-paused':''}`}><Clock3/><strong>{clock(focusRemaining)}</strong><span>{session?.status==='PAUSED'?'Pausado':session?`Foco de ${Number(config.focusMinutes||focusMinutes)} min`:`Pronto para ${focusMinutes} min`}</span></div>
        <div className="question-pomodoro-actions">
          {!session&&<><select value={focusMinutes} onChange={event=>setFocusMinutes(Number(event.target.value))} aria-label="Duração do foco"><option value="15">15 min</option><option value="25">25 min</option><option value="50">50 min</option><option value="60">60 min</option></select><button disabled={busy||Boolean(blockingSession)} onClick={start}><Play/> Iniciar Pomodoro</button></>}
          {session?.status==='RUNNING'&&<button disabled={busy} onClick={pause}><Pause/> Pausar</button>}
          {session?.status==='PAUSED'&&<button disabled={busy} onClick={resume}><Play/> Continuar</button>}
          {session&&<button className="finish-question-pomodoro" disabled={busy} onClick={finish}><Square/> Finalizar</button>}
        </div>
      </div>
    </section>
    <QuizTab mode="all" onQuestionAnswered={recordAnswer}/>
  </div>;
}

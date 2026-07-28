import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Check, Clock3, RefreshCw } from 'lucide-react';
import { dailyStudyApi, StudyDashboardData } from '../services/api';
import { ActiveStudyContext } from '../studyContext';

interface Props {
  studyContext: ActiveStudyContext | null;
  onOpenStudy: (context?: ActiveStudyContext) => void;
}
interface UpcomingStudy { topic_id:unknown; title:unknown; module_name:unknown; planned_minutes:unknown; recommended_questions:unknown; plannedDate:Date; }

const statusLabel: Record<string,string> = {
  COMPLETED: 'Concluído', IN_PROGRESS: 'Em andamento', AVAILABLE: 'Próximo', PENDING: 'Depois',
  NEEDS_REVIEW: 'Revisar', LOCKED: 'Bloqueado', MOVED: 'Reagendado', SKIPPED: 'Ignorado'
};

const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long'
});

export default function ScheduleTab({ studyContext, onOpenStudy }: Props) {
  const [data,setData]=useState<StudyDashboardData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [upcomingFilter,setUpcomingFilter]=useState<'next'|'week'>('next');
  const load=useCallback(async()=>{
    setLoading(true);
    try{setData(await dailyStudyApi.today());setError('');}
    catch(requestError){setError(requestError instanceof Error?requestError.message:'Não foi possível carregar o cronograma.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const activeTask=useMemo(()=>{
    if(!data)return null;
    const sessionTask=data.active_session?.daily_task_id
      ? data.tasks.find(task=>task.id===data.active_session.daily_task_id)
      : undefined;
    return sessionTask
      || data.tasks.find(task=>task.roadmap_topic_id===studyContext?.roadmapTopicId&&['AVAILABLE','IN_PROGRESS'].includes(task.status))
      || data.tasks.find(task=>['AVAILABLE','IN_PROGRESS'].includes(task.status))
      || null;
  },[data,studyContext]);

  const upcomingStudies=useMemo<UpcomingStudy[]>(()=>{
    if(!data)return [];
    const tomorrow=new Date();tomorrow.setHours(12,0,0,0);tomorrow.setDate(tomorrow.getDate()+1);
    return data.roadmap.filter(topic=>String(topic.status)!=='COMPLETED'&&String(topic.topic_id)!==activeTask?.roadmap_topic_id)
      .slice(0,7).map((topic,index)=>{const date=new Date(tomorrow);date.setDate(tomorrow.getDate()+index);return {
        topic_id:topic.topic_id,title:topic.title,module_name:topic.module_name,planned_minutes:topic.planned_minutes,
        recommended_questions:topic.recommended_questions,plannedDate:date
      };});
  },[data,activeTask?.roadmap_topic_id]);
  const visibleUpcoming=upcomingFilter==='next'?upcomingStudies.slice(0,1):upcomingStudies;

  if(loading&&!data)return <div className="daily-dashboard-loading"><span/><p>Sincronizando cronograma com sua sessão…</p></div>;
  if(error&&!data)return <section className="daily-dashboard-error" role="alert"><CalendarDays/><h2>Não foi possível carregar seu cronograma</h2><p>{error}</p><button onClick={load}>Tentar novamente</button></section>;
  if(!data)return null;

  return <div id="schedule-tab-container" className="space-y-6 animate-fade-in">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div><span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Cronograma conectado</span><h2 className="text-2xl font-extrabold text-slate-900 mt-1">{dateLabel(String(data.today.date))}</h2><p className="text-sm text-slate-500 mt-1">A sessão, o conteúdo, a revisão e esta agenda usam o mesmo assunto.</p></div>
      <button onClick={load} className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 flex items-center justify-center gap-2"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/> Atualizar</button>
    </header>
    {error&&<div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

    <section className="bg-indigo-950 text-white rounded-3xl p-5 sm:p-7 grid lg:grid-cols-[1fr_auto] gap-5 items-center">
      <div><span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{data.active_session?.id?'Sessão em andamento':'Próxima sessão'}</span><h3 className="text-xl sm:text-2xl font-extrabold mt-2">{activeTask?.topic_title||'Rotina concluída por hoje'}</h3><p className="text-indigo-200 mt-1">{activeTask?.subject_name||'Seu histórico e suas metas foram atualizados.'}</p>{activeTask?.objective&&<p className="schedule-current-objective text-sm text-indigo-100/80 mt-4 max-w-3xl">{activeTask.objective}</p>}</div>
      {activeTask&&<div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-44"><span className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 font-bold"><Clock3 className="w-4 h-4 text-amber-400"/>{activeTask.planned_minutes} min</span><button onClick={()=>onOpenStudy({roadmapTopicId:activeTask.roadmap_topic_id,topicTitle:activeTask.topic_title,subjectName:activeTask.subject_name,source:'schedule'})} className="bg-white text-indigo-950 rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-extrabold"><BookOpen className="w-4 h-4"/> Ver conteúdo</button></div>}
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5"><div><h3 className="font-extrabold text-slate-900">Rota do dia</h3><p className="text-sm text-slate-500">A ordem é atualizada quando uma sessão é finalizada.</p></div><strong className="text-indigo-600">{Number(data.today.completed_tasks||0)}/{Number(data.today.total_tasks||0)}</strong></div>
      <ol className="space-y-3">{data.tasks.map((task,index)=>{
        const current=task.id===activeTask?.id,complete=task.status==='COMPLETED';
        return <li key={task.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${current?'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100':complete?'bg-emerald-50/50 border-emerald-100':'bg-slate-50 border-slate-100'}`}>
          <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${complete?'bg-emerald-600 text-white':current?'bg-indigo-600 text-white':'bg-white border border-slate-200 text-slate-400'}`}>{complete?<Check className="w-4 h-4"/>:<span className="text-xs font-extrabold">{index+1}</span>}</span>
          <div className="grow min-w-0"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-slate-900">{task.topic_title}</strong><span className={`text-xs font-bold ${current?'text-indigo-700':complete?'text-emerald-700':'text-slate-500'}`}>{statusLabel[task.status]||task.status}</span></div><p className="text-xs text-slate-500 mt-1">{task.subject_name} · {task.planned_minutes} min · {task.question_goal} questões</p></div>
        </li>;
      })}</ol>
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5"><div><h3 className="font-extrabold text-slate-900">Próximos estudos</h3><p className="text-sm text-slate-500">Os assuntos são intercalados entre disciplinas e planejados em dias consecutivos, começando amanhã.</p></div><div className="flex bg-slate-100 rounded-xl p-1 shrink-0"><button type="button" onClick={()=>setUpcomingFilter('next')} className={`min-h-9 px-3 rounded-lg text-xs font-extrabold ${upcomingFilter==='next'?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}>Próximo dia</button><button type="button" onClick={()=>setUpcomingFilter('week')} className={`min-h-9 px-3 rounded-lg text-xs font-extrabold ${upcomingFilter==='week'?'bg-white text-indigo-700 shadow-sm':'text-slate-500'}`}>Semana</button></div></div>
      {visibleUpcoming.length===0?<div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 text-sm text-emerald-800"><strong>Planejamento concluído.</strong><p className="mt-1">Não há novos assuntos pendentes nesta trilha.</p></div>:<ol className="grid gap-3">{visibleUpcoming.map((topic,index)=><li key={String(topic.topic_id)} className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4"><div className="sm:w-40 shrink-0"><span className="text-xs font-extrabold text-indigo-600 uppercase">{index===0?'Próximo estudo':topic.plannedDate.toLocaleDateString('pt-BR',{weekday:'long'})}</span><strong className="block text-sm text-slate-900 mt-1">{topic.plannedDate.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</strong></div><div className="grow min-w-0 sm:border-l sm:border-slate-200 sm:pl-4"><strong className="block text-sm text-slate-900">{String(topic.title)}</strong><p className="text-xs text-slate-500 mt-1">{String(topic.module_name)} · {Number(topic.planned_minutes||0)} min · {Number(topic.recommended_questions||10)} questões</p></div><span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">Dia +{index+1}</span></li>)}</ol>}
    </section>
  </div>;
}

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, Award, BookOpenCheck, CheckCircle2, LoaderCircle, RefreshCw, Target, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../services/api';

interface TopicStat { topic: string; answered: number; correct: number; wrong: number; accuracy: number; }
interface DayStat { day: string; answered: number; correct: number; wrong: number; accuracy: number; }
interface Dashboard { periodDays: number; summary: { answered: number; correct: number; wrong: number; accuracy: number }; evolution: DayStat[]; byTopic: TopicStat[]; strongTopics: TopicStat[]; weakTopics: TopicStat[]; recommendation?: TopicStat | null; }

const number = (value: unknown) => Number(value || 0);

const localDashboard = (periodDays: number, activePlanId?: string | null): Dashboard => {
  try {
    const answers: Record<string,string> = JSON.parse(localStorage.getItem('quiz_answers') || '{}');
    const history: Record<string,{answer:string;answeredAt:string}> = JSON.parse(localStorage.getItem('quiz_answer_history') || '{}');
    const events: {questionId:string;answer:string;answeredAt:string;planId?:string|null;courseId?:string|null}[] = JSON.parse(localStorage.getItem('quiz_answer_events') || '[]');
    const savedQuestions = localStorage.getItem('active_quiz_questions_cache') || localStorage.getItem('custom_quiz_questions');
    const questions: any[] = savedQuestions ? JSON.parse(savedQuestions) : [];
    const questionById = new Map(questions.map(question => [String(question.id), question]));
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodDays);
    const topicMap = new Map<string,TopicStat>();
    const dayMap = new Map<string,DayStat>();
    let correct = 0, wrong = 0;

    const activeCourse = localStorage.getItem('active_course');
    const scopedEvents = events.filter(event => activePlanId
      ? event.planId === activePlanId
      : event.courseId === activeCourse);
    // Uma alteração de resposta não cria uma nova tentativa no KPI: usamos
    // somente o estado mais recente de cada questão no painel local.
    const latestEvents = new Map<string, typeof scopedEvents[number]>();
    scopedEvents.forEach(event => latestEvents.set(String(event.questionId), event));
    const attempts = latestEvents.size > 0
      ? Array.from(latestEvents.values()).map(event => [String(event.questionId), event.answer, event.answeredAt] as const)
      : Object.entries(answers).map(([id,answer]) => [id,answer,history[id]?.answeredAt || new Date().toISOString()] as const);
    attempts.forEach(([id, answer, timestamp]) => {
      const question = questionById.get(id);
      if (!question || question.correct === 'Anulada') return;
      const answeredAt = new Date(timestamp);
      if (answeredAt < cutoff) return;
      const isCorrect = answer === question.correct;
      if (isCorrect) correct++; else wrong++;
      const topic = String(question.topic || question.category || 'Geral');
      const topicStat = topicMap.get(topic) || { topic, answered: 0, correct: 0, wrong: 0, accuracy: 0 };
      topicStat.answered++; if (isCorrect) topicStat.correct++; else topicStat.wrong++;
      topicStat.accuracy = topicStat.answered ? (topicStat.correct / topicStat.answered) * 100 : 0;
      topicMap.set(topic, topicStat);
      const day = answeredAt.toISOString().slice(0,10);
      const dayStat = dayMap.get(day) || { day, answered: 0, correct: 0, wrong: 0, accuracy: 0 };
      dayStat.answered++; if (isCorrect) dayStat.correct++; else dayStat.wrong++;
      dayStat.accuracy = dayStat.answered ? (dayStat.correct / dayStat.answered) * 100 : 0;
      dayMap.set(day, dayStat);
    });

    const byTopic = Array.from(topicMap.values()).sort((a,b) => b.accuracy-a.accuracy);
    const strongTopics = byTopic.filter(item => item.answered >= 1 && item.accuracy >= 70).slice(0,5);
    const weakTopics = byTopic.filter(item => item.answered >= 1 && item.accuracy < 70).sort((a,b) => a.accuracy-b.accuracy).slice(0,5);
    const answered = correct + wrong;
    return { periodDays, summary: { answered, correct, wrong, accuracy: answered ? (correct/answered)*100 : 0 },
      evolution: Array.from(dayMap.values()).sort((a,b) => a.day.localeCompare(b.day)), byTopic, strongTopics,
      weakTopics, recommendation: weakTopics[0] || null };
  } catch (error) {
    console.warn('Não foi possível calcular o desempenho local.', error);
    return { periodDays, summary: { answered: 0, correct: 0, wrong: 0, accuracy: 0 }, evolution: [], byTopic: [], strongTopics: [], weakTopics: [], recommendation: null };
  }
};

export default function PerformanceTab() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      let activePlanId: string | null = null;
      try { activePlanId = JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || null; } catch {}
      const remote = await analyticsApi.dashboard(period, activePlanId);
      const local = localDashboard(period, activePlanId);
      setData(number(remote?.summary?.answered) > 0 ? remote : local);
    }
    catch (requestError) {
      console.warn('Desempenho remoto indisponível; usando dados locais.', requestError);
      let activePlanId: string | null = null;
      try { activePlanId = JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || null; } catch {}
      setData(localDashboard(period, activePlanId));
    }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [period]);

  const summary = data?.summary;
  const maxAnswered = useMemo(() => Math.max(1, ...(data?.evolution || []).map(day => number(day.answered))), [data]);

  if (loading && !data) return <div className="min-h-72 flex items-center justify-center gap-2 text-slate-500"><LoaderCircle className="w-5 h-5 animate-spin" /> Calculando seu desempenho...</div>;

  return <div id="performance-tab-container" className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div><h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Activity className="w-6 h-6 text-indigo-600" /> Seu desempenho</h2><p className="text-sm text-slate-500 mt-1">Evolução baseada nos assuntos que você acertou e errou.</p></div>
      <div className="flex gap-2 overflow-x-auto">{[7,30,90].map(days=><button key={days} onClick={()=>setPeriod(days)} className={`px-4 rounded-xl text-sm font-bold whitespace-nowrap ${period===days?'bg-slate-900 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{days} dias</button>)}<button onClick={load} aria-label="Atualizar desempenho" className="w-11 h-11 min-h-11 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></button></div>
    </div>
    {error&&<div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

    {!summary || number(summary.answered)===0 ? <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center"><Target className="w-10 h-10 text-slate-300 mx-auto mb-3" /><h3 className="font-bold text-slate-800">Seu painel começa com a primeira resposta</h3><p className="text-sm text-slate-500 mt-1">Responda algumas questões do simulado para descobrir seus pontos fortes e o que precisa revisar.</p></div> : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Respondidas" value={number(summary.answered)} icon={<BookOpenCheck />} color="indigo" />
        <Metric label="Acertos" value={number(summary.correct)} icon={<CheckCircle2 />} color="emerald" />
        <Metric label="Erros" value={number(summary.wrong)} icon={<AlertTriangle />} color="rose" />
        <Metric label="Aproveitamento" value={`${number(summary.accuracy).toFixed(0)}%`} icon={<Target />} color="amber" />
      </div>

      {data?.recommendation&&<div className="bg-indigo-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-amber-400" /></div><div className="grow"><span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Próximo assunto recomendado</span><h3 className="font-extrabold mt-1">{data.recommendation.topic}</h3><p className="text-sm text-indigo-200 mt-1">{number(data.recommendation.accuracy).toFixed(0)}% de acertos em {number(data.recommendation.answered)} respostas. Revise o resumo e tente novas questões.</p></div></div>}

      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6"><div className="mb-5"><h3 className="font-bold text-slate-900">Evolução diária</h3><p className="text-sm text-slate-500">Altura indica quantidade respondida; a cor mostra o aproveitamento.</p></div>{data?.evolution.length===0?<p className="text-sm text-slate-500">Ainda não há respostas neste período.</p>:<div className="daily-chart flex items-end gap-3 overflow-x-auto min-h-48 pb-2">{data?.evolution.map(day=><div key={day.day} className="flex flex-col items-center gap-2 min-w-12 grow"><span className="text-xs font-bold text-slate-600">{number(day.accuracy).toFixed(0)}%</span><div title={`${day.answered} respostas`} className={`w-full max-w-12 rounded-t-lg ${number(day.accuracy)>=70?'bg-emerald-500':number(day.accuracy)>=50?'bg-amber-400':'bg-rose-400'}`} style={{height:`${Math.max(24,(number(day.answered)/maxAnswered)*120)}px`}} /><span className="text-[10px] text-slate-500">{new Date(`${day.day}T00:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span></div>)}</div>}</section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><TopicList title="Pontos fortes" subtitle="Assuntos com aproveitamento de 70% ou mais" items={data?.strongTopics||[]} tone="strong" /><TopicList title="Pontos para revisar" subtitle="Assuntos com maior incidência de erros" items={data?.weakTopics||[]} tone="weak" /></div>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6"><h3 className="font-bold text-slate-900 mb-4">Desempenho por assunto</h3><div className="space-y-4">{data?.byTopic.map(item=><div key={item.topic}><div className="flex justify-between gap-3 text-sm mb-1.5"><span className="font-semibold text-slate-700 truncate">{item.topic}</span><span className="font-bold text-slate-900 shrink-0">{number(item.accuracy).toFixed(0)}%</span></div><div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${number(item.accuracy)>=70?'bg-emerald-500':number(item.accuracy)>=50?'bg-amber-400':'bg-rose-400'}`} style={{width:`${number(item.accuracy)}%`}} /></div><p className="text-xs text-slate-400 mt-1">{item.correct} acertos • {item.wrong} erros • {item.answered} respostas</p></div>)}</div></section>
    </>}
  </div>;
}

function Metric({label,value,icon,color}:{label:string;value:string|number;icon:ReactNode;color:string}) { const tones:Record<string,string>={indigo:'bg-indigo-50 text-indigo-600',emerald:'bg-emerald-50 text-emerald-600',rose:'bg-rose-50 text-rose-600',amber:'bg-amber-50 text-amber-600'};return <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className={`w-9 h-9 rounded-xl ${tones[color]} flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5`}>{icon}</div><p className="text-xs font-semibold text-slate-500 mt-3">{label}</p><p className="text-2xl font-extrabold text-slate-900 mt-0.5">{value}</p></div>; }
function TopicList({title,subtitle,items,tone}:{title:string;subtitle:string;items:TopicStat[];tone:'strong'|'weak'}) { return <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6"><div className="flex items-center gap-2"><Award className={`w-5 h-5 ${tone==='strong'?'text-emerald-500':'text-rose-500'}`} /><h3 className="font-bold text-slate-900">{title}</h3></div><p className="text-xs text-slate-500 mt-1 mb-4">{subtitle}</p>{items.length===0?<p className="text-sm text-slate-400 py-4">Responda mais questões para gerar esta análise.</p>:<div className="space-y-2">{items.map(item=><div key={item.topic} className={`p-3 rounded-xl ${tone==='strong'?'bg-emerald-50':'bg-rose-50'}`}><div className="flex justify-between gap-2"><span className="text-sm font-bold text-slate-800">{item.topic}</span><span className={`text-sm font-extrabold ${tone==='strong'?'text-emerald-700':'text-rose-700'}`}>{number(item.accuracy).toFixed(0)}%</span></div><p className="text-xs text-slate-500 mt-1">{item.answered} respostas</p></div>)}</div>}</section>; }

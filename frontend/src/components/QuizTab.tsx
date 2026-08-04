import { useState, useMemo, useEffect, useRef } from 'react';
import { quizQuestions } from '../data/quizData';
import { QuestionAnswer, QuestionCategory, Question } from '../types';
import { passages } from '../data/passagesData';
import { questionsApi, quizProgressApi } from '../services/api';
import { CheckCircle2, XCircle, Filter, Sparkles, AlertCircle, Info, Bookmark, Flag, Target, ChevronDown } from 'lucide-react';
import { ActiveStudyContext, findContextCard, normalizeStudyText, questionRelevance } from '../studyContext';
import { studySections } from '../data/studyData';
import { filterQuestionsByBoards, questionBoardsFromConfig, questionExamBoard } from '../questionBanks';

interface QuizTabProps {
  mode?: 'session'|'all';
  studyContext?: ActiveStudyContext | null;
  onQuestionAnswered?: (question:Question,correct:boolean)=>void|Promise<void>;
  onReviewComplete?: (result:GuidedReviewResult)=>void;
}

export interface GuidedReviewResult { topicTitle:string; subjectName:string; answered:number; correct:number; wrong:number; accuracy:number; }

const normalizeQuestionText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const preservePassages = (remoteQuestions: Question[], localQuestions: Question[]) => {
  const localByText = new Map(
    [...quizQuestions, ...localQuestions].map(question => [normalizeQuestionText(question.text), question])
  );

  return remoteQuestions.map(question => {
    const localQuestion = localByText.get(normalizeQuestionText(question.text));
    const passageId = question.passageId || localQuestion?.passageId;
    const catalogPassage = passageId ? passages[passageId] : undefined;

    return {
      ...question,
      topic: question.topic && question.topic !== question.category ? question.topic : (localQuestion?.topic || question.topic),
      passageId,
      passageTitle: question.passageTitle || localQuestion?.passageTitle || catalogPassage?.title,
      passageContent: question.passageContent || localQuestion?.passageContent || catalogPassage?.content,
      options: question.options?.length ? question.options : localQuestion?.options,
    };
  });
};

const mergeQuestionBanks=(primary:Question[],secondary:Question[])=>{
  const seen=new Set<string>();
  return [...primary,...secondary].filter(question=>{const key=normalizeQuestionText(question.text);if(seen.has(key))return false;seen.add(key);return true;});
};

const readPlanQuestionBank=()=>{
  const course=localStorage.getItem('active_course')||'seplag_informatica';
  for(const key of [`${course}_quiz_questions`,'custom_quiz_questions']){
    const saved=localStorage.getItem(key);
    if(saved===null)continue;
    try{
      const parsed=JSON.parse(saved);
      if(Array.isArray(parsed))return {configured:true,questions:parsed as Question[]};
    }catch(error){console.warn(`Banco de questões inválido em ${key}.`,error);}
  }
  return {configured:false,questions:[] as Question[]};
};

const topicGeneratedQuestions=(context:ActiveStudyContext):Question[]=>{
  let sections=studySections;
  try{const saved=localStorage.getItem('custom_study_sections');if(saved)sections=JSON.parse(saved);}catch{}
  const match=findContextCard(sections,context);
  if(!match)return [];
  const plain=String(match.card.content||'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ')
    .replace(/\s+/g,' ').trim();
  const contentFacts=plain.split(/(?<=[.!?;:])\s+/).map(value=>value.trim()).filter(value=>value.length>=35&&value.length<=360);
  const facts=[...(match.card.keyTakeaways||[]),...contentFacts].map(String).filter(Boolean);
  if(facts.length===0)return [];
  const key=String(context.roadmapTopicId||normalizeStudyText(context.topicTitle)).replace(/[^a-zA-Z0-9-]/g,'-');
  return Array.from({length:200},(_,index)=>{
    const fact=facts[index%facts.length];
    const correct=index%2===0;
    const round=Math.floor(index/facts.length)+1;
    return {
      id:`guided-${key}-${index+1}`,category:context.subjectName,topic:context.topicTitle,
      text:correct
        ? `[${context.topicTitle}] Julgue o item ${round}: ${fact}`
        : `[${context.topicTitle}] Julgue o item ${round}: o enunciado “${fact}” não integra os fundamentos deste assunto e deve ser desconsiderado.`,
      correct:correct?'Certo':'Errado',
      explanation:correct
        ? `Certo. Esse ponto faz parte do conteúdo estudado em ${context.topicTitle}.`
        : `Errado. O enunciado citado integra diretamente os fundamentos de ${context.topicTitle}.`,
      reference:`Revisão guiada — ${context.topicTitle}`
    } as Question;
  });
};

const belongsToExactTopic=(question:Question,context:ActiveStudyContext)=>{
  const searchable=normalizeStudyText([question.topic,question.reference,question.text].filter(Boolean).join(' '));
  const topic=normalizeStudyText(context.topicTitle);
  if(question.topic&&normalizeStudyText(question.topic)===topic)return true;
  const legalAnchors:string[]=(context.topicTitle.match(/\d+/g)??[] as string[]).filter(value=>value.length>=2);
  if(legalAnchors.length>0)return legalAnchors.every(anchor=>searchable.split(' ').includes(anchor));
  return questionRelevance(question,context)>=60;
};

const guidedReviewQuestionIds=()=>{
  try{return new Set<string>(JSON.parse(localStorage.getItem('guided_review_question_ids')||'[]'));}
  catch{return new Set<string>();}
};

interface GuidedReviewDraft {
  answers: Record<string,QuestionAnswer>;
  questionIds: string[];
  reviewGoal: number;
  visibleQuestions: number;
  updatedAt: string;
}

const guidedReviewDraftKey=(context:ActiveStudyContext)=>{
  let planId='local';
  try{planId=String(JSON.parse(localStorage.getItem('study_config')||'{}').studyPlanId||'local');}catch{}
  const course=localStorage.getItem('active_course')||'default';
  const topic=String(context.roadmapTopicId||normalizeStudyText(context.topicTitle)).replace(/[^a-zA-Z0-9_-]/g,'-');
  return `guided_review_draft:${course}:${planId}:${topic}`;
};

const readGuidedReviewDraft=(key:string|null):GuidedReviewDraft|null=>{
  if(!key)return null;
  try{
    const parsed=JSON.parse(localStorage.getItem(key)||'null') as Partial<GuidedReviewDraft>|null;
    if(!parsed||typeof parsed!=='object')return null;
    const validAnswers:QuestionAnswer[]=['Certo','Errado','A','B','C','D','E'];
    const answers=Object.fromEntries(Object.entries(parsed.answers||{}).filter(([,answer])=>validAnswers.includes(answer as QuestionAnswer))) as GuidedReviewDraft['answers'];
    return {
      answers,
      questionIds:Array.isArray(parsed.questionIds)?parsed.questionIds.map(String):[],
      reviewGoal:[10,15,20].includes(Number(parsed.reviewGoal))?Number(parsed.reviewGoal):10,
      visibleQuestions:Math.max(10,Number(parsed.visibleQuestions||20)),
      updatedAt:String(parsed.updatedAt||new Date().toISOString())
    };
  }catch{return null;}
};

const writeGuidedReviewDraft=(key:string|null,draft:Omit<GuidedReviewDraft,'updatedAt'>)=>{
  if(!key)return;
  try{localStorage.setItem(key,JSON.stringify({...draft,updatedAt:new Date().toISOString()}));}
  catch(error){console.warn('Não foi possível salvar o progresso local da revisão.',error);}
};

export default function QuizTab({mode='session',studyContext,onQuestionAnswered,onReviewComplete}:QuizTabProps) {
  const reviewDraftKey=useMemo(()=>mode==='session'&&studyContext?guidedReviewDraftKey(studyContext):null,
    [mode,studyContext?.roadmapTopicId,studyContext?.topicTitle]);
  const initialReviewDraft=useMemo(()=>readGuidedReviewDraft(reviewDraftKey),[reviewDraftKey]);
  const selectedQuestionBoards=useMemo(()=>{
    const course=localStorage.getItem('active_course')||'seplag_informatica';
    for(const key of [`${course}_study_config`,'study_config']){
      try{
        const parsed=JSON.parse(localStorage.getItem(key)||'null');
        const boards=questionBoardsFromConfig(parsed);
        if(boards.length>0)return boards;
      }catch{}
    }
    return [];
  },[]);
  const [questions, setQuestions] = useState<Question[]>(() => {
    const planBank=readPlanQuestionBank();
    const available=planBank.configured?planBank.questions:quizQuestions;
    return filterQuestionsByBoards(available,selectedQuestionBoards);
  });

  const [answers, setAnswers] = useState<{ [key: string]: QuestionAnswer }>(() => {
    const saved = localStorage.getItem('quiz_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'Todos'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Respondidas' | 'Não Respondidas' | 'Corretas' | 'Incorretas' | 'Anuladas'>('Todos');
  const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState(()=>initialReviewDraft?.visibleQuestions||10);
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiz_favorite_questions') || '[]')); } catch { return new Set(); }
  });
  const [cycleAnswers,setCycleAnswers]=useState<{[key:string]:QuestionAnswer}>(()=>initialReviewDraft?.answers||{});
  const [draftQuestionIds,setDraftQuestionIds]=useState<string[]>(()=>initialReviewDraft?.questionIds||[]);
  const [usedBeforeCycle,setUsedBeforeCycle]=useState<Set<string>>(()=>{
    const reviewed=guidedReviewQuestionIds();
    initialReviewDraft?.questionIds.forEach(id=>reviewed.delete(id));
    return reviewed;
  });
  const [reviewGoal,setReviewGoal]=useState(()=>initialReviewDraft?.reviewGoal||10);
  const activeAnswers=mode==='session'?cycleAnswers:answers;
  const [reportedQuestions, setReportedQuestions] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiz_reported_questions') || '[]')); } catch { return new Set(); }
  });
  const [reportDraft,setReportDraft]=useState<{question:Question;reason:string;details:string}|null>(null);
  const [reportBusy,setReportBusy]=useState(false);
  const [reportError,setReportError]=useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const courseId = localStorage.getItem('active_course');
    if (!courseId) return;
    questionsApi.forCourse(courseId).then(remoteQuestions => {
      if (remoteQuestions.length > 0) {
        setQuestions(localQuestions => {
          const planBank=readPlanQuestionBank();
          const allowedIds=new Set(planBank.questions.map(question=>String(question.id)));
          const allowedTexts=new Set(planBank.questions.map(question=>normalizeQuestionText(question.text)));
          const scopedRemoteQuestions=planBank.configured
            ? remoteQuestions.filter(question=>allowedIds.has(String(question.id))||allowedTexts.has(normalizeQuestionText(question.text)))
            : remoteQuestions;
          const reconciledQuestions = preservePassages(scopedRemoteQuestions, localQuestions);
          const available=filterQuestionsByBoards(
            mergeQuestionBanks(reconciledQuestions,localQuestions),
            selectedQuestionBoards
          );
          localStorage.setItem('active_quiz_questions_cache', JSON.stringify(available));
          return available;
        });
      }
    }).catch(error => console.warn('Banco de questões indisponível; usando conteúdo offline.', error));
  }, [selectedQuestionBoards]);

  useEffect(()=>{
    if(mode!=='session')return;
    const draft=readGuidedReviewDraft(reviewDraftKey);
    const reviewed=guidedReviewQuestionIds();
    draft?.questionIds.forEach(id=>reviewed.delete(id));
    setCycleAnswers(draft?.answers||{});
    setDraftQuestionIds(draft?.questionIds||[]);
    setUsedBeforeCycle(reviewed);
    setReviewGoal(draft?.reviewGoal||10);
    setStatusFilter('Todos');
    setVisibleQuestions(draft?.visibleQuestions||20);
  },[mode,reviewDraftKey]);

  // Sync answers with localStorage
  useEffect(() => {
    localStorage.setItem('quiz_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const config = localStorage.getItem('study_config');
    if (!config) return;
    try {
      const { studyPlanId } = JSON.parse(config);
      if (!studyPlanId || String(studyPlanId).startsWith('local-')) return;
      quizProgressApi.getByStudyPlan(studyPlanId).then(progress => {
        const remoteAnswers: { [key: string]: QuestionAnswer } = {};
        progress.forEach(item => {
          const questionId = String(item.question_id);
          if (['Certo','Errado','A','B','C','D','E'].includes(item.answer)) {
            remoteAnswers[questionId] = item.answer as QuestionAnswer;
          }
        });
        setAnswers(current => ({ ...current, ...remoteAnswers }));
      }).catch(error => console.warn('Respostas remotas indisponíveis; usando cache local.', error));
    } catch (error) {
      console.warn('Configuração local inválida.', error);
    }
  }, []);

  useEffect(() => {
    if(mode==='all')setVisibleQuestions(10);
  }, [categoryFilter, statusFilter, mode]);

  const toggleFavorite = (questionId: number | string) => {
    const id = String(questionId);
    setFavoriteQuestions(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('quiz_favorite_questions', JSON.stringify([...next]));
      return next;
    });
  };

  const submitReport = async () => {
    if(!reportDraft||reportBusy)return;setReportBusy(true);setReportError('');
    try{
      await questionsApi.report({questionId:String(reportDraft.question.id),courseId:localStorage.getItem('active_course')||'',
        text:reportDraft.question.text,category:String(reportDraft.question.category||''),reference:reportDraft.question.reference,
        reason:reportDraft.reason,details:reportDraft.details});
      const id=String(reportDraft.question.id);setReportedQuestions(current=>{const next=new Set(current);next.add(id);
        localStorage.setItem('quiz_reported_questions',JSON.stringify([...next]));return next;});setReportDraft(null);
    }catch(cause){setReportError(cause instanceof Error?cause.message:'Não foi possível enviar a sinalização.');}
    finally{setReportBusy(false);}
  };

  const handleAnswer = async (questionId: number | string, option: QuestionAnswer) => {
    const question = questions.find(q => String(q.id) === String(questionId))
      || (mode==='session'&&studyContext
        ? filterQuestionsByBoards(topicGeneratedQuestions(studyContext),selectedQuestionBoards)
            .find(q=>String(q.id)===String(questionId))
        : undefined);
    if (!question) return;
    if (question.correct === 'Anulada') return;

    if(mode==='session'){
      setCycleAnswers(prev=>{
        const next={...prev,[String(questionId)]:option};
        writeGuidedReviewDraft(reviewDraftKey,{answers:next,questionIds:draftQuestionIds,reviewGoal,visibleQuestions});
        return next;
      });
      const reviewed=guidedReviewQuestionIds();
      reviewed.add(String(questionId));
      localStorage.setItem('guided_review_question_ids',JSON.stringify([...reviewed]));
    }else{
      setAnswers(prev => ({...prev,[questionId]: option}));
    }
    void onQuestionAnswered?.(question,option===question.correct);

    if(mode==='all')try {
      const savedHistory = JSON.parse(localStorage.getItem('quiz_answer_history') || '{}');
      savedHistory[String(questionId)] = { answer: option, answeredAt: new Date().toISOString() };
      localStorage.setItem('quiz_answer_history', JSON.stringify(savedHistory));
      const events = JSON.parse(localStorage.getItem('quiz_answer_events') || '[]');
      let planId = null;
      try { planId = JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || null; } catch {}
      events.push({ questionId: String(questionId), answer: option, answeredAt: new Date().toISOString(), planId, courseId: localStorage.getItem('active_course') });
      localStorage.setItem('quiz_answer_events', JSON.stringify(events.slice(-5000)));
    } catch (error) {
      console.warn('Não foi possível atualizar o histórico local da resposta.', error);
    }

    // Save to API if study plan ID exists
    const config = localStorage.getItem('study_config');
    if (mode==='all'&&config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.studyPlanId && !String(parsed.studyPlanId).startsWith('local-')) {
          const isCorrect = option === question.correct;
          await quizProgressApi.create({
            studyPlanId: parsed.studyPlanId,
            questionId,
            answer: option,
            isCorrect
          });
        }
      } catch (error) {
        console.error('Error saving quiz progress:', error);
      }
    }
  };

  const questionPool = useMemo(() => {
    if(mode==='all')return questions;
    if(!studyContext)return [];
    const precise=questions.filter(question=>question.correct!=='Anulada'&&belongsToExactTopic(question,studyContext))
      .map(question=>({question,score:questionRelevance(question,studyContext)}))
      .sort((a,b)=>b.score-a.score).map(item=>item.question);
    const generated=filterQuestionsByBoards(topicGeneratedQuestions(studyContext),selectedQuestionBoards);
    const available=mergeQuestionBanks(precise,generated);
    const byId=new Map(available.map(question=>[String(question.id),question]));
    const restored=draftQuestionIds.map(id=>byId.get(id)).filter((question):question is Question=>Boolean(question));
    const restoredIds=new Set(restored.map(question=>String(question.id)));
    const fresh=available.filter(question=>!restoredIds.has(String(question.id))&&!usedBeforeCycle.has(String(question.id)));
    return [...restored,...fresh].slice(0,20);
  },[mode,questions,studyContext,usedBeforeCycle,draftQuestionIds,selectedQuestionBoards]);

  useEffect(()=>{
    if(mode!=='session'||!reviewDraftKey||draftQuestionIds.length>0||questionPool.length===0)return;
    setDraftQuestionIds(questionPool.map(question=>String(question.id)));
  },[mode,reviewDraftKey,draftQuestionIds.length,questionPool]);

  useEffect(()=>{
    if(mode!=='session'||!reviewDraftKey)return;
    writeGuidedReviewDraft(reviewDraftKey,{answers:cycleAnswers,questionIds:draftQuestionIds,reviewGoal,visibleQuestions});
  },[mode,reviewDraftKey,cycleAnswers,draftQuestionIds,reviewGoal,visibleQuestions]);

  const scopedQuestions=useMemo(()=>mode==='session'?questionPool.slice(0,reviewGoal):questionPool,[mode,questionPool,reviewGoal]);

  // Calculate statistics
  const stats = useMemo(() => {
    const validQuestions = scopedQuestions.filter(q => q.correct !== 'Anulada');
    const total = validQuestions.length;
    const answeredCount = Object.keys(activeAnswers).filter(id => {
      const question = scopedQuestions.find(q => String(q.id) === id);
      return question && question.correct !== 'Anulada';
    }).length;
    let correctCount = 0;
    let incorrectCount = 0;
    let bankAwareScore = 0;

    validQuestions.forEach(q => {
      const userAnswer = activeAnswers[q.id];
      if (userAnswer) {
        if (userAnswer === q.correct) {
          correctCount++;
          bankAwareScore++;
        } else {
          incorrectCount++;
          if (questionExamBoard(q) === 'CEBRASPE') bankAwareScore--;
        }
      }
    });

    // CEBRASPE Score Formula: Correct - Incorrect (minimum 0)
    const cebraspeScore = Math.max(0, correctCount - incorrectCount);
    const simpleScore = correctCount;

    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const cebraspePercentage = total > 0 ? Math.round((cebraspeScore / total) * 100) : 0;

    return {
      total,
      answeredCount,
      correctCount,
      incorrectCount,
      bankAwareScore: Math.max(0, bankAwareScore),
      cebraspeScore,
      simpleScore,
      percentage,
      cebraspePercentage,
      unansweredCount: total - answeredCount
    };
  }, [activeAnswers, scopedQuestions]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return scopedQuestions.filter(q => {
      // Category filter
      const categoryMatch = categoryFilter === 'Todos' || q.category === categoryFilter;

      // Status filter
      let statusMatch = true;
      const userAnswer = activeAnswers[q.id];
      const isAnnulled = q.correct === 'Anulada';
      const isCorrect = !isAnnulled && userAnswer === q.correct;

      if (statusFilter === 'Respondidas') {
        statusMatch = !isAnnulled && !!userAnswer;
      } else if (statusFilter === 'Não Respondidas') {
        statusMatch = !isAnnulled && !userAnswer;
      } else if (statusFilter === 'Corretas') {
        statusMatch = !!userAnswer && isCorrect;
      } else if (statusFilter === 'Incorretas') {
        statusMatch = !isAnnulled && !!userAnswer && !isCorrect;
      } else if (statusFilter === 'Anuladas') {
        statusMatch = isAnnulled;
      }

      return categoryMatch && statusMatch;
    });
  }, [categoryFilter, statusFilter, activeAnswers, scopedQuestions]);

  const completeReview=()=>{
    if(mode!=='session'||stats.answeredCount<reviewGoal||!studyContext)return;
    if(reviewDraftKey)localStorage.removeItem(reviewDraftKey);
    onReviewComplete?.({topicTitle:studyContext.topicTitle,subjectName:studyContext.subjectName,
      answered:stats.answeredCount,correct:stats.correctCount,wrong:stats.incorrectCount,
      accuracy:stats.answeredCount?Math.round(stats.correctCount*100/stats.answeredCount):0});
  };

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleQuestions >= filteredQuestions.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleQuestions(current => Math.min(current + 10, filteredQuestions.length));
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleQuestions, filteredQuestions.length]);

  const selectedExamBoard=useMemo(()=>{
    const course=localStorage.getItem('active_course')||'seplag_informatica';
    for(const key of [`${course}_study_config`,'study_config']){
      try{const value=JSON.parse(localStorage.getItem(key)||'{}').examBoard;if(value)return String(value);}catch{}
    }
    return 'CEBRASPE';
  },[]);
  const usesCebraspeScoring=/cebraspe|cespe/i.test(selectedExamBoard);
  const currentScore=selectedQuestionBoards.length>1
    ? stats.bankAwareScore
    : usesCebraspeScoring?stats.cebraspeScore:stats.simpleScore;
  const currentAccuracy=stats.answeredCount?Math.round(stats.correctCount*100/stats.answeredCount):0;

  return (
    <div id="quiz-tab-container" className="quiz-layout space-y-7">
      {mode==='session'&&studyContext&&<div className="session-context-banner"><Target aria-hidden="true"/><div><span>REVISÃO DO ASSUNTO ATUAL</span><strong>{studyContext.topicTitle}</strong><p>{studyContext.subjectName} · meta de {reviewGoal} questões</p></div></div>}
      <div className="quiz-overview quiz-overview-compact">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          {mode==='session'&&<div className="quiz-heading">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500"/>Revisão da sessão</h2>
          </div>}
          <div className="quiz-stats grid grid-cols-2 md:grid-cols-4 gap-3" aria-label={`Pontuação calculada para ${selectedQuestionBoards.join(' e ') || selectedExamBoard}`}>
            <div className="bg-slate-50 p-3 rounded-lg text-center"><span className="text-xs text-slate-500 block">Pontuação</span><strong className="text-xl font-bold text-slate-800">{currentScore}</strong></div>
            <div className="bg-emerald-50 p-3 rounded-lg text-center"><span className="text-xs text-emerald-800 font-bold">Acertos</span><strong className="text-xl font-bold text-emerald-600 block mt-1">{stats.correctCount}</strong></div>
            <div className="bg-rose-50 p-3 rounded-lg text-center"><span className="font-bold text-rose-800 text-xs">Erros</span><strong className="text-rose-600 block mt-1 text-xl font-bold">{stats.incorrectCount}</strong></div>
            <div className="bg-slate-50 p-3 rounded-lg text-center"><span className="font-bold text-slate-800 text-xs">Aproveitamento</span><strong className="text-slate-900 block mt-1 text-xl font-bold">{currentAccuracy}%</strong></div>
          </div>
        </div>
      </div>

      {mode==='session'&&<section className="bg-white border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div><span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Meta da revisão</span><h3 className="font-bold text-slate-900 mt-1">Responda entre 10 e 20 questões</h3><p className="text-xs text-slate-500 mt-1">A conclusão será liberada quando todas as questões da meta forem respondidas.</p></div>
        <div className="flex flex-wrap items-center gap-2">{[10,15,20].map(goal=><button type="button" key={goal} disabled={questionPool.length<goal} onClick={()=>setReviewGoal(goal)} className={`min-h-10 px-4 rounded-xl text-sm font-extrabold border ${reviewGoal===goal?'bg-indigo-600 border-indigo-600 text-white':'bg-white border-slate-200 text-slate-600'} disabled:opacity-35`}>{goal}</button>)}<button type="button" disabled={stats.answeredCount<reviewGoal||questionPool.length<10} onClick={completeReview} className="min-h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-extrabold disabled:opacity-40">{stats.answeredCount<reviewGoal?`Faltam ${Math.max(0,reviewGoal-stats.answeredCount)}`:'Concluir revisão'}</button></div>
        {questionPool.length<10&&<p className="text-xs text-rose-600 font-semibold">Este assunto possui apenas {questionPool.length} questões pertinentes. Cadastre pelo menos 10 para liberar a revisão.</p>}
      </section>}

      {/* Question Filters Row */}
      <button type="button" className="quiz-mobile-filter-trigger" onClick={()=>setMobileFiltersOpen(value=>!value)} aria-expanded={mobileFiltersOpen} aria-controls="question-bank-filters"><span><Filter/>Filtros do banco</span><span>{categoryFilter!=='Todos'||statusFilter!=='Todos'?'Ativos':'Todos'}<ChevronDown/></span></button>
      <div id="question-bank-filters" className={`quiz-filters ${mobileFiltersOpen?'is-mobile-open':''} flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100`}>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>{mode==='session'?'Questões da sessão:':'Filtros do banco:'}</span>
        </div>

        <div className="flex flex-wrap gap-2 grow justify-start md:justify-end">
          {/* Category Selector */}
          {mode==='all'&&<select
            id="select-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          >
            <option value="Todos">Todas as Disciplinas</option>
            {Array.from(new Set(scopedQuestions.map(q => q.category))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>}

          {/* Status Selector */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Respondidas">Respondidas</option>
            <option value="Não Respondidas">Não Respondidas</option>
            <option value="Corretas">Corretas</option>
            <option value="Incorretas">Incorretas</option>
            <option value="Anuladas">Anuladas</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-list space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">Nenhuma questão encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          filteredQuestions.slice(0, visibleQuestions).map((q, index) => {
            const userAnswer = activeAnswers[q.id];
            const isAnswered = !!userAnswer;
            const isAnnulled = q.correct === 'Anulada';
            const isCorrect = !isAnnulled && userAnswer === q.correct;

            return (
              <div
                key={q.id}
                id={`q-card-${q.id}`}
                className={`bg-white rounded-xl shadow-xs border transition-all overflow-hidden ${
                  isAnnulled
                    ? 'border-amber-200 bg-amber-50/20'
                    : isAnswered
                    ? isCorrect
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header info */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">Questão {index + 1} de {filteredQuestions.length}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {mode==='session'&&studyContext?studyContext.topicTitle:q.category}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {questionExamBoard(q)}
                    </span>
                    {q.passageId && <span className="passage-available">Texto de apoio</span>}
                  </div>
                  <div className="question-card-actions">
                    {q.reference && <span className="question-reference text-[10px] text-slate-400 font-mono">{q.reference}</span>}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(q.id)}
                      className={favoriteQuestions.has(String(q.id)) ? 'is-active' : ''}
                      aria-pressed={favoriteQuestions.has(String(q.id))}
                      aria-label={favoriteQuestions.has(String(q.id)) ? 'Remover questão dos favoritos' : 'Favoritar questão'}
                      title={favoriteQuestions.has(String(q.id)) ? 'Remover dos favoritos' : 'Favoritar questão'}
                    ><Bookmark aria-hidden="true" /></button>
                    <button
                      type="button"
                      onClick={() => { setReportError('');setReportDraft({question:q,reason:'ANSWER',details:''}); }}
                      className={reportedQuestions.has(String(q.id)) ? 'is-reported' : ''}
                      aria-pressed={reportedQuestions.has(String(q.id))}
                      aria-label={reportedQuestions.has(String(q.id)) ? 'Questão já sinalizada' : 'Sinalizar problema na questão'}
                      title={reportedQuestions.has(String(q.id)) ? 'Questão já sinalizada — clique para atualizar' : 'Sinalizar problema na questão'}
                    ><Flag aria-hidden="true" /></button>
                  </div>
                </div>

                {/* The passage is part of the question and must remain visible while answering. */}
                {q.passageId && (q.passageContent || passages[q.passageId]) && (
                  <div className="question-passage px-5 py-4 border-b border-slate-100 text-xs leading-relaxed text-slate-600">
                    <div className="question-passage-title font-bold flex items-center gap-1 mb-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>{q.passageTitle || passages[q.passageId]?.title || 'Texto de apoio'}</span>
                    </div>
                    <div className="question-passage-content whitespace-pre-wrap">
                      {q.passageContent || passages[q.passageId]?.content}
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="p-5 space-y-4">
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">{q.text}</p>

                  {/* Actions (Buttons for answering) */}
                  <div className="space-y-3">
                    {isAnnulled ? (
                      <span className="px-4 py-2 rounded-lg text-sm font-bold border border-amber-200 bg-amber-50 text-amber-800">
                        Questão anulada
                      </span>
                    ) : q.options?.length ? (
                      <div className="grid gap-2" role="radiogroup" aria-label={`Alternativas da questão ${index + 1}`}>
                        {q.options.map(option => {
                          const selected=userAnswer===option.label;
                          const optionIsCorrect=q.correct===option.label;
                          return <button
                            key={option.label}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={()=>handleAnswer(q.id,option.label)}
                            className={`w-full p-3 rounded-xl border text-left text-sm transition flex items-start gap-3 ${
                              selected
                                ? optionIsCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                                  : 'bg-rose-50 border-rose-400 text-rose-900'
                                : isAnswered&&optionIsCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <strong className={`w-7 h-7 shrink-0 rounded-lg grid place-items-center ${selected?'bg-current/10':'bg-slate-100'}`}>{option.label}</strong>
                            <span className="leading-relaxed pt-0.5">{option.text}</span>
                            {selected&&(optionIsCorrect?<CheckCircle2 className="w-5 h-5 shrink-0 ml-auto text-emerald-600"/>:<XCircle className="w-5 h-5 shrink-0 ml-auto text-rose-600"/>)}
                          </button>;
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                    <button
                      id={`btn-certo-${q.id}`}
                      onClick={() => handleAnswer(q.id, 'Certo')}
                      className={`px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        userAnswer === 'Certo'
                          ? q.correct === 'Certo'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {userAnswer === 'Certo' && (q.correct === 'Certo' ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />)}
                      Certo
                    </button>
                    <button
                      id={`btn-errado-${q.id}`}
                      onClick={() => handleAnswer(q.id, 'Errado')}
                      className={`px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        userAnswer === 'Errado'
                          ? q.correct === 'Errado'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {userAnswer === 'Errado' && (q.correct === 'Errado' ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />)}
                      Errado
                    </button>
                      </div>
                    )}

                    {/* Quick indicator icon */}
                    {(isAnswered || isAnnulled) && (
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {isAnnulled ? (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Anulada
                          </span>
                        ) : isCorrect ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Gabaritou!
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Incorreto
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Educational Feedback Section */}
                  {(isAnswered || isAnnulled) && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 transition-all ${
                      isAnnulled
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : isCorrect 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>JUSTIFICATIVA DA BANCA:</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px]">
                          Gabarito: {q.correct}
                        </span>
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {mode==='session'&&stats.answeredCount>=reviewGoal&&<div className="sticky bottom-20 md:bottom-4 z-20 flex justify-center"><button type="button" onClick={completeReview} className="min-h-12 px-7 rounded-full bg-emerald-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-900/20">Concluir revisão e ver resultado</button></div>}

      {reportDraft&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!reportBusy)setReportDraft(null);}}>
        <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="question-report-title">
          <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-wider text-rose-600">Revisão de conteúdo</span><h3 id="question-report-title" className="mt-1 text-xl font-black text-slate-950">Sinalizar problema na questão</h3></div><button type="button" disabled={reportBusy} onClick={()=>setReportDraft(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><XCircle className="h-5 w-5" /></button></div>
          <p className="mt-3 line-clamp-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{reportDraft.question.text}</p>
          <label className="mt-4 block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Qual é o problema?</span><select className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400" value={reportDraft.reason} onChange={event=>setReportDraft(value=>value?{...value,reason:event.target.value}:value)}><option value="ANSWER">Gabarito incorreto</option><option value="STATEMENT">Erro no enunciado</option><option value="EXPLANATION">Explicação incorreta</option><option value="OUTDATED">Questão desatualizada</option><option value="OTHER">Outro problema</option></select></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Explique a sinalização</span><textarea rows={4} maxLength={2000} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" value={reportDraft.details} onChange={event=>setReportDraft(value=>value?{...value,details:event.target.value}:value)} placeholder="Ex.: o gabarito deveria ser Errado porque…" /></label>
          {reportError&&<p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" role="alert">{reportError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={reportBusy} onClick={()=>setReportDraft(null)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Cancelar</button><button type="button" disabled={reportBusy} onClick={()=>void submitReport()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-extrabold text-white disabled:opacity-60"><Flag className="h-4 w-4" />{reportBusy?'Enviando…':'Enviar sinalização'}</button></div>
        </section>
      </div>}

      <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
    </div>
  );
}

export { quizQuestions };

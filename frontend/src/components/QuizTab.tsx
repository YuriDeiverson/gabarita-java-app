import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QuestionAnswer, Question } from '../types';
import { CatalogContest, QuestionNote, catalogApi, questionsApi, quizProgressApi } from '../services/api';
import { CheckCircle2, XCircle, Filter, Sparkles, AlertCircle, Info, Bookmark, Flag, Target, ChevronDown, LoaderCircle, NotebookPen, Save, Trash2, X } from 'lucide-react';
import { ActiveStudyContext, normalizeStudySubjectTitle, normalizeStudyText, questionRelevance } from '../studyContext';
import { filterQuestionsByBoards, questionBoardsFromConfig, questionExamBoard } from '../questionBanks';

interface QuizTabProps {
  mode?: 'session'|'all';
  studyContext?: ActiveStudyContext | null;
  onQuestionAnswered?: (question:Question,correct:boolean)=>void|Promise<void>;
  onReviewComplete?: (result:GuidedReviewResult)=>void;
  initialQuestionId?: string;
}

export interface GuidedReviewResult { topicTitle:string; subjectName:string; answered:number; correct:number; wrong:number; accuracy:number; }

type FilterOption={value:string;label?:string;count?:number};
type MultiFilterProps={id:string;label:string;options:Array<string|FilterOption>;selected:string[];onChange:(values:string[])=>void;openFilterId:string|null;onOpenFilterChange:(id:string|null)=>void;emptyLabel?:string};
const MultiFilter=({id,label,options,selected,onChange,openFilterId,onOpenFilterChange,emptyLabel='Todas'}:MultiFilterProps)=>{
  const toggle=(value:string)=>onChange(selected.includes(value)?selected.filter(item=>item!==value):[...selected,value]);
  const open=openFilterId===id;
  return <details open={open} className="relative min-w-40 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700">
    <summary onClick={event=>{event.preventDefault();const filter=event.currentTarget.closest('details');onOpenFilterChange(open?null:id);if(!open)window.requestAnimationFrame(()=>filter?.scrollIntoView({behavior:'smooth',block:'nearest'}));}} className="cursor-pointer list-none px-3 py-2 font-bold marker:content-none">{label}<span className="ml-1 font-normal text-slate-400">{selected.length?`(${selected.length})`:`(${emptyLabel})`}</span></summary>
    <div className="absolute z-30 mt-1 max-h-64 min-w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
      {options.length===0?<p className="px-2 py-1.5 text-slate-400">Sem opções disponíveis</p>:options.map(item=>{
        const option=typeof item==='string'?{value:item,label:item}:item;
        return <label key={option.value} className="flex cursor-pointer items-start justify-between gap-2 rounded px-2 py-1.5 hover:bg-slate-50"><span className="flex items-start gap-2"><input type="checkbox" checked={selected.includes(option.value)} onChange={()=>toggle(option.value)} className="mt-0.5"/><span>{option.label||option.value}</span></span>{option.count!=null&&<small className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-400">{option.count}</small>}</label>;
      })}
    </div>
  </details>;
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

type CurriculumTopic = { title?: unknown; subtopics?: unknown };

const topicKey=(value:string)=>normalizeStudySubjectTitle(value);

const isPrimaryCurriculumTopic=(value:string)=>{
  const trimmed=value.trim();
  // "4.1" and "II.3" are details of a subject and must not be selectable here.
  return !/^\s*(?:\d+|[IVXLCDM]+)\s*[.)]\s*\d+/i.test(trimmed);
};

const categoryMatchesCurriculum=(category:string,title:string)=>{
  const normalizedCategory=normalizeStudyText(category);
  const normalizedTitle=normalizeStudyText(title);
  if(normalizedCategory.includes(normalizedTitle)||normalizedTitle.includes(normalizedCategory))return true;
  if(normalizedCategory==='portugues')return /lingua portuguesa|portugues/.test(normalizedTitle);
  if(normalizedCategory==='ti basica')return /informatica|tecnologia da informacao/.test(normalizedTitle);
  if(normalizedCategory==='conhecimentos de alagoas')return /alagoas/.test(normalizedTitle);
  if(normalizedCategory==='etica e compliance')return /etica/.test(normalizedTitle);
  return false;
};

const curriculumTopicsForCourse=(catalog:CatalogContest[],courseId:string)=>{
  const topicsByCategory:Record<string,string[]>={};
  const roles=catalog.flatMap(contest=>contest.roles).filter(role=>role.courseId===courseId);
  roles.forEach(role=>{
    const topics=Array.isArray(role.curriculum?.topics)?role.curriculum.topics as CurriculumTopic[]:[];
    topics.forEach(subject=>{
      const title=String(subject.title||'').trim();
      const subtopics=Array.isArray(subject.subtopics)?subject.subtopics.map(String):[];
      if(!title||subtopics.length===0)return;
      const primaryTopics=subtopics.filter(isPrimaryCurriculumTopic);
      if(primaryTopics.length===0)return;
      const titleKey=normalizeStudyText(title);
      topicsByCategory[titleKey]=[...(topicsByCategory[titleKey]||[]),...primaryTopics];
      // O currículo descreve a disciplina como "Língua Portuguesa", enquanto
      // as questões podem registrá-la simplesmente como "Português".
      const knownCategories=['Português','TI Básica','Ética e Compliance','Conhecimentos de Alagoas','Língua Inglesa','Conhecimentos Específicos','Conhecimentos Específicos - Jornalismo','Conhecimentos Específicos - Técnico em Enfermagem'];
      knownCategories.filter(category=>categoryMatchesCurriculum(category,title)).forEach(category=>{
        const key=normalizeStudyText(category);
        topicsByCategory[key]=[...(topicsByCategory[key]||[]),...primaryTopics];
      });
    });
  });
  return Object.fromEntries(Object.entries(topicsByCategory).map(([category,topics])=>[
    category,
    Array.from(new Map(topics.map(topic=>[topicKey(topic),topic])).values()),
  ]));
};

const questionMatchesTopic=(question:Question,selectedTopic:string)=>{
  const selected=topicKey(selectedTopic);
  const questionTopic=topicKey(question.topic||'');
  return Boolean(selected&&questionTopic&&(questionTopic===selected||questionTopic.includes(selected)||selected.includes(questionTopic)));
};

const specificDisciplineSuffix=(category:string)=>String(category||'').replace(/^conhecimentos\s+espec[ií]ficos\s*(?:[-–—:]\s*)?/i,'').trim();
const categoryGroup=(category:string)=>{
  const normalized=normalizeStudyText(category);
  if(normalized.startsWith('conhecimentos especificos'))return 'Conhecimentos Específicos';
  if(['portugues','lingua portuguesa','lingua inglesa','ti basica','etica e compliance','conhecimentos de alagoas','conhecimentos gerais'].includes(normalized)
    ||normalized.startsWith('conhecimentos gerais'))return 'Conhecimentos Gerais';
  return 'Outras disciplinas';
};
const categoryLabel=(category:string)=>{
  if(categoryGroup(category)!=='Conhecimentos Específicos')return category;
  const suffix=specificDisciplineSuffix(category);
  return suffix?`Específicos · ${suffix}`:'Específicos · Geral';
};
const questionCategoryGroup=(question:Question)=>{
  const area=String(question.area||'').trim();
  if(area==='Conhecimentos Gerais'||area==='Conhecimentos Específicos')return area;
  return categoryGroup(String(question.category));
};

export default function QuizTab({mode='session',studyContext,onQuestionAnswered,onReviewComplete,initialQuestionId}:QuizTabProps) {
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsError, setQuestionsError] = useState('');

  const [answers, setAnswers] = useState<{ [key: string]: QuestionAnswer }>(() => {
    const saved = localStorage.getItem('quiz_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [categoryGroupFilters,setCategoryGroupFilters]=useState<string[]>([]);
  const [categoryFilters,setCategoryFilters]=useState<string[]>([]);
  const [topicFilters,setTopicFilters]=useState<string[]>([]);
  const [statusFilters,setStatusFilters]=useState<string[]>([]);
  const [boardFilters,setBoardFilters]=useState<string[]>([]);
  const [yearFilters,setYearFilters]=useState<string[]>([]);
  const [roleFilters,setRoleFilters]=useState<string[]>([]);
  const [educationFilters,setEducationFilters]=useState<string[]>([]);
  const [formationFilters,setFormationFilters]=useState<string[]>([]);
  const [activityAreaFilters,setActivityAreaFilters]=useState<string[]>([]);
  const [modalityFilters,setModalityFilters]=useState<string[]>([]);
  const [difficultyFilters,setDifficultyFilters]=useState<string[]>([]);
  const [excludeAnnulled,setExcludeAnnulled]=useState(false);
  const [excludeOutdated,setExcludeOutdated]=useState(false);
  const [excludeInedit,setExcludeInedit]=useState(false);
  const [curriculumTopics,setCurriculumTopics]=useState<Record<string,string[]>>({});
  const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
  const [advancedFiltersOpen,setAdvancedFiltersOpen]=useState(false);
  const [openFilterId,setOpenFilterId]=useState<string|null>(null);
  const filterPanelRef=useRef<HTMLDivElement>(null);
  const [visibleQuestions, setVisibleQuestions] = useState(()=>initialReviewDraft?.visibleQuestions||10);
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiz_favorite_questions') || '[]')); } catch { return new Set(); }
  });
  const [questionNotes,setQuestionNotes]=useState<QuestionNote[]>([]);
  const [noteDraft,setNoteDraft]=useState<{question:Question;note:string}|null>(null);
  const [noteBusy,setNoteBusy]=useState(false);
  const [noteError,setNoteError]=useState('');
  const [cycleAnswers,setCycleAnswers]=useState<{[key:string]:QuestionAnswer}>(()=>initialReviewDraft?.answers||{});
  const [draftQuestionIds,setDraftQuestionIds]=useState<string[]>(()=>initialReviewDraft?.questionIds||[]);
  const [usedBeforeCycle,setUsedBeforeCycle]=useState<Set<string>>(()=>{
    const reviewed=guidedReviewQuestionIds();
    initialReviewDraft?.questionIds.forEach(id=>reviewed.delete(id));
    return reviewed;
  });

  useEffect(()=>{
    if(!openFilterId)return;
    const closeOnOutsideClick=(event:MouseEvent)=>{
      if(!filterPanelRef.current?.contains(event.target as Node))setOpenFilterId(null);
    };
    document.addEventListener('mousedown',closeOnOutsideClick);
    return()=>document.removeEventListener('mousedown',closeOnOutsideClick);
  },[openFilterId]);
  const [reviewGoal,setReviewGoal]=useState(()=>initialReviewDraft?.reviewGoal||10);
  const activeAnswers=mode==='session'?cycleAnswers:answers;
  const [reportedQuestions, setReportedQuestions] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiz_reported_questions') || '[]')); } catch { return new Set(); }
  });
  const [reportDraft,setReportDraft]=useState<{question:Question;reason:string;details:string}|null>(null);
  const [reportBusy,setReportBusy]=useState(false);
  const [reportError,setReportError]=useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const openedQuestionRef=useRef('');

  const currentCourseId=localStorage.getItem('active_course')||'';

  useEffect(()=>{
    questionsApi.notes().then(items=>{
      setQuestionNotes(items);
      setFavoriteQuestions(current=>{
        const next=new Set(current);
        items.filter(item=>item.course_id===currentCourseId).forEach(item=>next.add(String(item.question_id)));
        localStorage.setItem('quiz_favorite_questions',JSON.stringify([...next]));
        return next;
      });
    }).catch(error=>console.warn('Anotações de questões indisponíveis.',error));
  },[currentCourseId]);

  useEffect(()=>{
    if(!noteDraft)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=previousOverflow;};
  },[noteDraft]);

  useEffect(() => {
    const courseId = localStorage.getItem('active_course');
    if (mode==='session'&&!courseId) {
      setQuestionsError('Nenhum curso ativo foi selecionado.');
      return;
    }
    const request=mode==='all'?questionsApi.all():questionsApi.forCourse(courseId!);
    request.then(remoteQuestions => {
      const visible=mode==='all'?remoteQuestions:filterQuestionsByBoards(remoteQuestions, selectedQuestionBoards);
      setQuestions(visible);
      setQuestionsError(visible.length ? '' : mode==='all'?'Ainda não há questões cadastradas.':'Ainda não há questões cadastradas para este curso.');
    }).catch(cause => {
      setQuestions([]);
      setQuestionsError(cause instanceof Error ? cause.message : 'Erro ao carregar as questões. Tente novamente mais tarde.');
    });
  }, [mode,selectedQuestionBoards,currentCourseId]);

  useEffect(()=>{
    const courseId=localStorage.getItem('active_course');
    if(!courseId)return;
    let cancelled=false;
    catalogApi.contests().then(catalog=>{
      if(!cancelled)setCurriculumTopics(curriculumTopicsForCourse(catalog,courseId));
    }).catch(error=>console.warn('Assuntos do edital indisponíveis; exibindo apenas os assuntos já cadastrados nas questões.',error));
    return()=>{cancelled=true;};
  },[currentCourseId]);

  useEffect(()=>{
    if(mode!=='session')return;
    const draft=readGuidedReviewDraft(reviewDraftKey);
    const reviewed=guidedReviewQuestionIds();
    draft?.questionIds.forEach(id=>reviewed.delete(id));
    setCycleAnswers(draft?.answers||{});
    setDraftQuestionIds(draft?.questionIds||[]);
    setUsedBeforeCycle(reviewed);
    setReviewGoal(draft?.reviewGoal||10);
    setStatusFilters([]);
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
  }, [categoryGroupFilters,categoryFilters,topicFilters,statusFilters,boardFilters,yearFilters,roleFilters,educationFilters,formationFilters,activityAreaFilters,modalityFilters,difficultyFilters,excludeAnnulled,excludeOutdated,excludeInedit,mode]);

  const noteForQuestion=(questionId:number|string)=>questionNotes.find(item=>
    item.course_id===currentCourseId&&String(item.question_id)===String(questionId));

  const openNoteEditor=(question:Question)=>{
    const existing=noteForQuestion(question.id);
    setNoteError('');
    setNoteDraft({question,note:existing?.note||''});
  };

  const saveQuestionNote=async()=>{
    if(!noteDraft||noteBusy)return;
    if(!noteDraft.note.trim()){setNoteError('Escreva o que você identificou ou precisa estudar.');return;}
    setNoteBusy(true);setNoteError('');
    try{
      const saved=await questionsApi.saveNote({questionId:String(noteDraft.question.id),courseId:currentCourseId,
        text:noteDraft.question.text,category:String(noteDraft.question.category||''),topic:noteDraft.question.topic,
        reference:noteDraft.question.reference,note:noteDraft.note.trim()});
      setQuestionNotes(current=>[saved,...current.filter(item=>item.id!==saved.id&&!(item.course_id===saved.course_id&&String(item.question_id)===String(saved.question_id)))]);
      setFavoriteQuestions(current=>{const next=new Set(current);next.add(String(noteDraft.question.id));
        localStorage.setItem('quiz_favorite_questions',JSON.stringify([...next]));return next;});
      setNoteDraft(null);
    }catch(cause){setNoteError(cause instanceof Error?cause.message:'Não foi possível salvar a anotação.');}
    finally{setNoteBusy(false);}
  };

  const removeQuestionNote=async()=>{
    if(!noteDraft||noteBusy)return;
    const existing=noteForQuestion(noteDraft.question.id);
    if(!existing){setNoteDraft(null);return;}
    setNoteBusy(true);setNoteError('');
    try{
      await questionsApi.deleteNote(String(noteDraft.question.id),currentCourseId);
      setQuestionNotes(current=>current.filter(item=>item.id!==existing.id));
      setFavoriteQuestions(current=>{const next=new Set(current);next.delete(String(noteDraft.question.id));
        localStorage.setItem('quiz_favorite_questions',JSON.stringify([...next]));return next;});
      setNoteDraft(null);
    }catch(cause){setNoteError(cause instanceof Error?cause.message:'Não foi possível remover a anotação.');}
    finally{setNoteBusy(false);}
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
    const question = questions.find(q => String(q.id) === String(questionId));
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
    const byId=new Map(precise.map(question=>[String(question.id),question]));
    const restored=draftQuestionIds.map(id=>byId.get(id)).filter((question):question is Question=>Boolean(question));
    const restoredIds=new Set(restored.map(question=>String(question.id)));
    const fresh=precise.filter(question=>!restoredIds.has(String(question.id))&&!usedBeforeCycle.has(String(question.id)));
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

  const availableCategories=useMemo(()=>{
    if(categoryGroupFilters.length===0)return scopedQuestions.map(question=>String(question.category));
    return scopedQuestions.filter(question=>categoryGroupFilters.includes(questionCategoryGroup(question)))
      .map(question=>String(question.category));
  },[categoryGroupFilters,scopedQuestions]);

  useEffect(()=>{
    setCategoryFilters(current=>current.filter(category=>availableCategories.includes(category)));
  },[availableCategories]);

  const availableTopics=useMemo(()=>{
    if(categoryFilters.length===0)return [];
    const fromCurriculum=categoryFilters.flatMap(category=>curriculumTopics[normalizeStudyText(category)]||[]);
    if(mode!=='all'&&fromCurriculum.length>0)return Array.from(new Map(fromCurriculum.map(topic=>[topicKey(topic),topic])).values());
    return Array.from(new Map(scopedQuestions
      .filter(question=>categoryFilters.includes(String(question.category))&&question.topic&&topicKey(question.topic)!==topicKey(String(question.category))&&isPrimaryCurriculumTopic(question.topic))
      .map(question=>[topicKey(question.topic||''),question.topic||'']))
      .values());
  },[categoryFilters,curriculumTopics,scopedQuestions,mode]);

  useEffect(()=>{
    setTopicFilters(current=>current.filter(selected=>availableTopics.some(topic=>topicKey(topic)===topicKey(selected))));
  },[availableTopics]);

  const filterOptions=useMemo(()=>{
    const strings=(values:(string|undefined)[])=>Array.from(new Set(values.filter((value):value is string=>Boolean(value&&value.trim())).map(value=>value.trim()))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const flatten=(values:(string[]|undefined)[])=>strings(values.flatMap(value=>value||[]));
    const countedOptions=(values:string[],label:(value:string)=>string=(value=>value))=>{
      const counts=new Map<string,number>();
      values.forEach(value=>counts.set(value,(counts.get(value)||0)+1));
      return [...counts.entries()].sort(([left],[right])=>label(left).localeCompare(label(right),'pt-BR'))
        .map(([value,count])=>({value,label:label(value),count}));
    };
    return {
      categoryGroups:countedOptions(scopedQuestions.map(question=>questionCategoryGroup(question)),value=>value),
      categories:countedOptions(availableCategories,categoryLabel),
      boards:strings(scopedQuestions.map(question=>questionExamBoard(question))),
      years:strings(scopedQuestions.map(question=>question.year?String(question.year):undefined)).sort((a,b)=>Number(b)-Number(a)),
      roles:flatten(scopedQuestions.map(question=>question.roles)),
      education:flatten(scopedQuestions.map(question=>question.educationLevels)),
      formation:flatten(scopedQuestions.map(question=>question.formationAreas)),
      activityAreas:flatten(scopedQuestions.map(question=>question.activityAreas)),
    };
  },[scopedQuestions,availableCategories]);

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
      const categoryGroupMatch=categoryGroupFilters.length===0||categoryGroupFilters.includes(questionCategoryGroup(q));
      const categoryMatch = categoryFilters.length===0 || categoryFilters.includes(String(q.category));
      const topicMatch = topicFilters.length===0 || topicFilters.some(topic=>questionMatchesTopic(q,topic));
      const boardMatch=boardFilters.length===0||boardFilters.includes(questionExamBoard(q));
      const yearMatch=yearFilters.length===0||(q.year!=null&&yearFilters.includes(String(q.year)));
      const roleMatch=roleFilters.length===0||roleFilters.some(value=>q.roles?.includes(value));
      const educationMatch=educationFilters.length===0||educationFilters.some(value=>q.educationLevels?.includes(value));
      const formationMatch=formationFilters.length===0||formationFilters.some(value=>q.formationAreas?.includes(value));
      const activityAreaMatch=activityAreaFilters.length===0||activityAreaFilters.some(value=>q.activityAreas?.includes(value));
      const modality=q.options?.length?'Múltipla escolha':'Certo ou errado';
      const modalityMatch=modalityFilters.length===0||modalityFilters.includes(modality);
      const difficulty=Math.max(1,Math.min(5,Number(q.difficulty||3)));
      // A escala persistida vai de 1 a 5 e o valor histórico padrão é 3 (Média).
      const difficultyLabel=difficulty===1?'Fácil':difficulty<=3?'Média':difficulty===4?'Difícil':'Muito difícil';
      const difficultyMatch=difficultyFilters.length===0||difficultyFilters.includes(difficultyLabel);
      const userAnswer = activeAnswers[q.id];
      const isAnnulled = q.correct === 'Anulada';
      const isCorrect = !isAnnulled && userAnswer === q.correct;
      const statusMatch=statusFilters.length===0||statusFilters.some(status=>
        (status==='Resolvidas'&&!isAnnulled&&Boolean(userAnswer))||
        (status==='Não resolvidas'&&!isAnnulled&&!userAnswer)||
        (status==='Acertei'&&Boolean(userAnswer)&&isCorrect)||
        (status==='Errei'&&!isAnnulled&&Boolean(userAnswer)&&!isCorrect)||
        (status==='Anuladas'&&isAnnulled));
      const isInedit=/\bin[eé]dit|simulado\b/i.test(`${q.reference||''} ${q.text}`);
      return categoryGroupMatch&&categoryMatch&&topicMatch&&boardMatch&&yearMatch&&roleMatch&&educationMatch&&formationMatch&&activityAreaMatch&&modalityMatch&&difficultyMatch&&statusMatch
        &&(!excludeAnnulled||!isAnnulled)&&(!excludeOutdated||!q.isOutdated)&&(!excludeInedit||!isInedit);
    });
  }, [categoryGroupFilters,categoryFilters,topicFilters,statusFilters,boardFilters,yearFilters,roleFilters,educationFilters,formationFilters,activityAreaFilters,modalityFilters,difficultyFilters,excludeAnnulled,excludeOutdated,excludeInedit,activeAnswers,scopedQuestions]);

  useEffect(()=>{
    if(mode!=='all'||!initialQuestionId||openedQuestionRef.current===initialQuestionId)return;
    const targetIndex=scopedQuestions.findIndex(question=>String(question.id)===String(initialQuestionId));
    if(targetIndex<0)return;
    openedQuestionRef.current=initialQuestionId;
    setCategoryGroupFilters([]);setCategoryFilters([]);setTopicFilters([]);setStatusFilters([]);
    setVisibleQuestions(current=>Math.max(current,targetIndex+1));
    window.setTimeout(()=>document.getElementById(`q-card-${initialQuestionId}`)?.scrollIntoView({behavior:'smooth',block:'center'}),120);
  },[initialQuestionId,mode,scopedQuestions]);

  const completeReview=()=>{
    if(mode!=='session'||stats.answeredCount<reviewGoal||!studyContext)return;
    if(reviewDraftKey)localStorage.removeItem(reviewDraftKey);
    onReviewComplete?.({topicTitle:studyContext.topicTitle,subjectName:studyContext.subjectName,
      answered:stats.answeredCount,correct:stats.correctCount,wrong:stats.incorrectCount,
      accuracy:stats.answeredCount?Math.round(stats.correctCount*100/stats.answeredCount):0});
  };

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (mobileFiltersOpen || !sentinel || visibleQuestions >= filteredQuestions.length) return;

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
  }, [mobileFiltersOpen, visibleQuestions, filteredQuestions.length]);

  useEffect(()=>{
    if(!mobileFiltersOpen)return;
    const body=document.body;
    const root=document.documentElement;
    const previous={
      bodyOverflow:body.style.overflow, rootOverflow:root.style.overflow,
    };
    root.style.overflow='hidden';
    body.style.overflow='hidden';
    return()=>{
      root.style.overflow=previous.rootOverflow;
      body.style.overflow=previous.bodyOverflow;
    };
  },[mobileFiltersOpen]);

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
  const activeFilterCount=[
    categoryGroupFilters.length,categoryFilters.length,topicFilters.length,statusFilters.length,boardFilters.length,
    yearFilters.length,roleFilters.length,educationFilters.length,formationFilters.length,activityAreaFilters.length,
    modalityFilters.length,difficultyFilters.length,excludeAnnulled?1:0,excludeOutdated?1:0,excludeInedit?1:0,
  ].reduce((total,count)=>total+count,0);
  const resetFilters=()=>{
    setCategoryGroupFilters([]);setCategoryFilters([]);setTopicFilters([]);setStatusFilters([]);setBoardFilters([]);setYearFilters([]);
    setRoleFilters([]);setEducationFilters([]);setFormationFilters([]);setActivityAreaFilters([]);setModalityFilters([]);setDifficultyFilters([]);
    setExcludeAnnulled(false);setExcludeOutdated(false);setExcludeInedit(false);
  };
  const closeMobileFilters=()=>{
    setMobileFiltersOpen(false);
    setOpenFilterId(null);
  };
  const toggleMobileFilters=()=>{
    if(mobileFiltersOpen)closeMobileFilters();
    else {setAdvancedFiltersOpen(true);setMobileFiltersOpen(true);}
  };

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
      <button type="button" className="quiz-mobile-filter-trigger" onClick={toggleMobileFilters} aria-expanded={mobileFiltersOpen} aria-controls="question-bank-filters"><span><Filter/>Filtros do banco</span><span>{activeFilterCount?`${activeFilterCount} ativos`:'Todos'}<ChevronDown/></span></button>
      {mobileFiltersOpen&&<button type="button" className="quiz-filter-sheet-backdrop" aria-label="Fechar filtros" onClick={closeMobileFilters}/>}
      <div ref={filterPanelRef} id="question-bank-filters" className={`quiz-filters ${mobileFiltersOpen?'is-mobile-open':''} space-y-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-400" />{mode==='session'?'Questões da sessão':'Filtros do banco'}</span>
          <div className="flex items-center gap-2">
            {mode==='all'&&<span className="text-xs font-medium text-slate-400">{filteredQuestions.length} {filteredQuestions.length===1?'questão encontrada':'questões encontradas'}</span>}
            <button type="button" className="quiz-filter-sheet-close" onClick={closeMobileFilters}>Fechar <X aria-hidden="true"/></button>
          </div>
        </div>

        <div className="quiz-filter-scroll-content grid grid-cols-1 gap-3">
          {mode==='all'&&<>
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-indigo-700">Conteúdo</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <MultiFilter id="category-group" label="Área" options={filterOptions.categoryGroups} selected={categoryGroupFilters} onChange={values=>{setCategoryGroupFilters(values);setCategoryFilters([]);setTopicFilters([]);}} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="category" label="Disciplina" options={filterOptions.categories} selected={categoryFilters} onChange={values=>{setCategoryFilters(values);setTopicFilters([]);}} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                {categoryFilters.length>0&&<MultiFilter id="topic" label="Assunto" options={availableTopics} selected={topicFilters} onChange={setTopicFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todos"/>}
              </div>

            </section>
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Prova e desempenho</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <MultiFilter id="question-status" label="Minhas questões" options={['Resolvidas','Não resolvidas','Acertei','Errei','Anuladas']} selected={statusFilters} onChange={setStatusFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="board" label="Banca" options={filterOptions.boards} selected={boardFilters} onChange={setBoardFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="year" label="Ano" options={filterOptions.years} selected={yearFilters} onChange={setYearFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todos"/>
              </div>
            </section>
            <details open={advancedFiltersOpen} onToggle={event=>{if(event.target===event.currentTarget){setAdvancedFiltersOpen(event.currentTarget.open);setOpenFilterId(null);}}} className="quiz-advanced-filters rounded-lg border border-indigo-100 bg-indigo-50/40 text-xs text-slate-700">
              <summary className="cursor-pointer px-3 py-2.5 font-extrabold text-indigo-700">Mais filtros</summary>
              <div className="grid gap-2 border-t border-indigo-100 bg-white p-3 sm:grid-cols-2 xl:grid-cols-3">
                <MultiFilter id="role" label="Cargo" options={filterOptions.roles} selected={roleFilters} onChange={setRoleFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todos"/>
                <MultiFilter id="education" label="Nível" options={filterOptions.education} selected={educationFilters} onChange={setEducationFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todos"/>
                <MultiFilter id="formation" label="Área de formação" options={filterOptions.formation} selected={formationFilters} onChange={setFormationFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="activity-area" label="Área de atuação" options={filterOptions.activityAreas} selected={activityAreaFilters} onChange={setActivityAreaFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="modality" label="Modalidade" options={['Certo ou errado','Múltipla escolha']} selected={modalityFilters} onChange={setModalityFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <MultiFilter id="difficulty" label="Dificuldade" options={['Fácil','Média','Difícil','Muito difícil']} selected={difficultyFilters} onChange={setDifficultyFilters} openFilterId={openFilterId} onOpenFilterChange={setOpenFilterId} emptyLabel="Todas"/>
                <div className="col-span-full mt-1 border-t border-slate-100 pt-2 text-slate-600">
                  <p className="mb-1.5 font-bold">Excluir do resultado</p>
                  <label className="mr-3 inline-flex items-center gap-1.5"><input type="checkbox" checked={excludeOutdated} onChange={event=>setExcludeOutdated(event.target.checked)}/>Desatualizadas</label>
                  <label className="mr-3 inline-flex items-center gap-1.5"><input type="checkbox" checked={excludeAnnulled} onChange={event=>setExcludeAnnulled(event.target.checked)}/>Anuladas</label>
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={excludeInedit} onChange={event=>setExcludeInedit(event.target.checked)}/>Inéditas e simulados</label>
                </div>
              </div>
            </details>
            <button type="button" onClick={resetFilters} className="quiz-filter-reset rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Limpar todos os filtros</button>
          </>}
        </div>
        {mode==='all'&&<footer className="quiz-filter-mobile-actions">
          <button type="button" onClick={resetFilters}>Limpar</button>
          <button type="button" onClick={closeMobileFilters}>Filtrar</button>
        </footer>}
      </div>

      {/* Questions List */}
      <div className="questions-list space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">{questionsError || 'Nenhuma questão encontrada para os filtros selecionados.'}</p>
          </div>
        ) : (
          filteredQuestions.slice(0, visibleQuestions).map((q, index) => {
            const userAnswer = activeAnswers[q.id];
            const isAnswered = !!userAnswer;
            const isAnnulled = q.correct === 'Anulada';
            const isCorrect = !isAnnulled && userAnswer === q.correct;
            const savedNote = noteForQuestion(q.id);

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
                      onClick={() => openNoteEditor(q)}
                      className={favoriteQuestions.has(String(q.id)) ? 'is-active' : ''}
                      aria-pressed={favoriteQuestions.has(String(q.id))}
                      aria-label={savedNote ? 'Editar anotação da questão' : 'Salvar questão e criar anotação'}
                      title={savedNote ? 'Editar sua anotação' : 'Salvar questão e anotar'}
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
                {q.passageId && q.passageContent && (
                  <div className="question-passage px-5 py-4 border-b border-slate-100 text-xs leading-relaxed text-slate-600">
                    <div className="question-passage-title font-bold flex items-center gap-1 mb-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>{q.passageTitle || 'Texto de apoio'}</span>
                    </div>
                    <div className="question-passage-content whitespace-pre-wrap">
                      {q.passageContent}
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="p-5 space-y-4">
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">{q.text}</p>
                  {savedNote&&<aside className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-5 text-slate-700"><span className="mb-1 flex items-center gap-1.5 font-extrabold text-indigo-700"><NotebookPen className="h-3.5 w-3.5"/>Sua anotação</span><p className="whitespace-pre-wrap">{savedNote.note}</p></aside>}

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
                        <span>EXPLICAÇÃO E MINI REVISÃO:</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px]">
                          Gabarito: {q.correct}
                        </span>
                      </div>
                      <p>{q.explanation}</p>
                      {q.topic && <p className="pt-2 text-[11px] font-semibold opacity-80">Para revisar: {q.topic}.</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {mode==='session'&&stats.answeredCount>=reviewGoal&&<div className="sticky bottom-20 md:bottom-4 z-20 flex justify-center"><button type="button" onClick={completeReview} className="min-h-12 px-7 rounded-full bg-emerald-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-900/20">Concluir revisão e ver resultado</button></div>}

      {noteDraft&&createPortal(<div className="question-note-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!noteBusy)setNoteDraft(null);}}>
        <section className="question-note-modal w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="question-note-title">
          <div className="flex items-start justify-between gap-4"><div><span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-600"><Bookmark className="h-4 w-4"/>Questão salva</span><h3 id="question-note-title" className="mt-1 text-xl font-black text-slate-950">O que você quer lembrar?</h3></div><button type="button" disabled={noteBusy} onClick={()=>setNoteDraft(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><XCircle className="h-5 w-5"/></button></div>
          <p className="mt-4 line-clamp-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">{noteDraft.question.text}</p>
          <label className="mt-4 block"><span className="mb-1.5 block text-xs font-extrabold text-slate-700">Sua anotação</span><textarea autoFocus required rows={6} maxLength={4000} className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" value={noteDraft.note} onChange={event=>setNoteDraft(current=>current?{...current,note:event.target.value}:current)} placeholder="Ex.: errei porque confundi correlação com causalidade. Revisar metodologia científica e tipos de estudo."/><span className="mt-1 block text-right text-[10px] font-bold text-slate-400">{noteDraft.note.length}/4000</span></label>
          {noteError&&<p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" role="alert">{noteError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><div>{noteForQuestion(noteDraft.question.id)&&<button type="button" disabled={noteBusy} onClick={()=>void removeQuestionNote()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><Trash2 className="h-4 w-4"/>Remover dos salvos</button>}</div><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" disabled={noteBusy} onClick={()=>setNoteDraft(null)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Cancelar</button><button type="button" disabled={noteBusy||!noteDraft.note.trim()} onClick={()=>void saveQuestionNote()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-extrabold text-white disabled:opacity-60">{noteBusy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}{noteBusy?'Salvando…':'Salvar anotação'}</button></div></div>
        </section>
      </div>,document.body)}

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

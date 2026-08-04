import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenText, Building2, FileQuestion, Flag, LoaderCircle, Pencil, Plus, Save, Search, Trash2, UsersRound, X } from 'lucide-react';
import { AdminPassage, AdminQuestion, AdminQuestionReport, CatalogContest, CatalogRole, adminApi } from '../services/api';

type Section = 'contests' | 'roles' | 'passages' | 'questions';
type Difficulty = 'Fácil'|'Médio'|'Difícil';
interface CurriculumDiscipline {
  key:string; title:string; category:string; weight:string; difficulty:Difficulty; highPriority:boolean;
  justification:string; subjectsText:string; summary:string; keyPointsText:string;
  existingMaterials:Record<string,{content:string;keyTakeaways:string[];id?:string}>;
}

const slugify = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100);
const subjectLines = (value:string) => value.split('\n').map(line=>line.trim()).filter(Boolean);
const newDiscipline = (index=0):CurriculumDiscipline => ({key:`new-${Date.now()}-${index}`,title:'',category:'Conhecimentos Específicos',
  weight:'10%',difficulty:'Médio',highPriority:false,justification:'',subjectsText:'',summary:'',keyPointsText:'',existingMaterials:{}});
const curriculumFromDisciplines = (disciplines:CurriculumDiscipline[]) => {
  const valid=disciplines.filter(item=>item.title.trim());
  if(!valid.length)throw new Error('Adicione pelo menos uma disciplina ao edital.');
  valid.forEach(item=>{if(!subjectLines(item.subjectsText).length)throw new Error(`Adicione ao menos um assunto em “${item.title}”.`);});
  const ids=new Set<string>();
  const prepared=valid.map((item,index)=>{let id=slugify(item.title)||`disciplina_${index+1}`;while(ids.has(id))id=`${id}_${index+1}`;ids.add(id);return{item,id,subjects:subjectLines(item.subjectsText)};});
  return {
    topics:prepared.map(({item,id,subjects})=>({id,title:item.title.trim(),category:item.category.trim()||'Conhecimentos Específicos',subtopics:subjects})),
    studySections:prepared.map(({item,id,subjects})=>({id,title:item.title.trim(),icon:'BookOpen',color:'blue',difficulty:item.difficulty,
      weight:item.weight.trim()||'10%',paretoJustification:item.justification.trim()||(item.highPriority?'Disciplina de alta prioridade no edital.':'Prioridade definida pelo conteúdo do edital.'),
      cards:subjects.map((title,index)=>{const existing=item.existingMaterials[title.toLocaleLowerCase('pt-BR')];const keyPoints=subjectLines(item.keyPointsText);
        return{id:existing?.id||`${id}_${slugify(title)||index+1}`,title,paretoRatio:item.highPriority?'Alta relevância':'Relevância do edital',isQuente:item.highPriority,
          content:existing?.content||item.summary.trim()||`Estude os conceitos, regras e aplicações mais cobrados de ${title}.`,
          keyTakeaways:existing?.keyTakeaways?.length?existing.keyTakeaways:(keyPoints.length?keyPoints:[`Dominar os pontos principais de ${title}.`])};})})),
  };
};
const disciplinesFromCurriculum = (curriculum:CatalogRole['curriculum']):CurriculumDiscipline[] => {
  const topics=Array.isArray(curriculum?.topics)?curriculum.topics as Array<Record<string,unknown>>:[];
  const sections=Array.isArray(curriculum?.studySections)?curriculum.studySections as Array<Record<string,unknown>>:[];
  const result=topics.map((topic,index)=>{const id=String(topic.id||'');const section=sections.find(item=>String(item.id||'')===id)||{};
    const cards=Array.isArray(section.cards)?section.cards as Array<Record<string,unknown>>:[];const materials:CurriculumDiscipline['existingMaterials']={};
    cards.forEach(card=>{const title=String(card.title||'').trim();if(title)materials[title.toLocaleLowerCase('pt-BR')]={id:String(card.id||''),content:String(card.content||''),keyTakeaways:Array.isArray(card.keyTakeaways)?card.keyTakeaways.map(String):[]};});
    const subtopics=Array.isArray(topic.subtopics)?topic.subtopics.map(String):[];const firstCard=cards[0];
    return{key:id||`existing-${index}`,title:String(topic.title||section.title||''),category:String(topic.category||'Conhecimentos Específicos'),
      weight:String(section.weight||'10%'),difficulty:(['Fácil','Médio','Difícil'].includes(String(section.difficulty))?String(section.difficulty):'Médio') as Difficulty,
      highPriority:cards.some(card=>Boolean(card.isQuente)),justification:String(section.paretoJustification||''),subjectsText:subtopics.join('\n'),
      summary:String(firstCard?.content||''),keyPointsText:Array.isArray(firstCard?.keyTakeaways)?(firstCard.keyTakeaways as unknown[]).map(String).join('\n'):'',existingMaterials:materials};});
  return result.length?result:[newDiscipline()];
};

const emptyContest = {
  id: '', label: '', acronym: '', organization: '', description: '', board: '', examDate: '', status: 'Edital publicado',
  state: '', area: '', education: '', vacancies: '', remuneration: '', location: '', stages: '', noticeReference: '', active: true,
};
const emptyRole = {
  contestId: '', id: '', label: '', courseId: '', board: '', includeDiscursive: false, requirement: '', remuneration: '',
  vacancies: '', estimatedHours: 120, active: true,
};
const emptyPassage = { title: '', source: '', content: '' };
const emptyQuestion = {
  courseId: '', category: '', topic: '', board: '', type: 'MULTIPLE_CHOICE', text: '', correct: '', explanation: '',
  reference: '', passageId: '', status: 'ACTIVE', options: 'A | \nB | \nC | \nD | \nE | ',
};

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-xs font-extrabold text-slate-700">{label}</span>{children}</label>;
}

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
const buttonPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60';
const buttonSecondary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50';

export default function AdminPanel() {
  const [section, setSection] = useState<Section>('contests');
  const [contests, setContests] = useState<CatalogContest[]>([]);
  const [passages, setPassages] = useState<AdminPassage[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [questionReports, setQuestionReports] = useState<AdminQuestionReport[]>([]);
  const [reportStatus, setReportStatus] = useState<'PENDING'|'RESOLVED'|'DISMISSED'|'ALL'>('PENDING');
  const [hasSearchedQuestions, setHasSearchedQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contestForm, setContestForm] = useState(emptyContest);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [curriculumDisciplines,setCurriculumDisciplines]=useState<CurriculumDiscipline[]>([newDiscipline()]);
  const [passageForm, setPassageForm] = useState(emptyPassage);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingContest, setEditingContest] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [editingPassage, setEditingPassage] = useState('');
  const [editingQuestion, setEditingQuestion] = useState('');
  const [questionFilter, setQuestionFilter] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [catalogResult, passagesResult] = await Promise.allSettled([adminApi.catalog(), adminApi.passages()]);
    if (catalogResult.status === 'fulfilled') setContests(catalogResult.value);
    if (passagesResult.status === 'fulfilled') setPassages(passagesResult.value);
    const coreError = catalogResult.status === 'rejected' ? catalogResult.reason
      : passagesResult.status === 'rejected' ? passagesResult.reason : null;
    if (coreError) setError(coreError instanceof Error ? coreError.message : 'Parte do painel administrativo não pôde ser carregada.');
    setLoading(false);

  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try { setQuestionReports(await adminApi.questionReports(reportStatus)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as sinalizações.'); }
    finally { setReportsLoading(false); }
  }, [reportStatus]);
  useEffect(() => { if (section === 'questions') void loadReports(); }, [loadReports, section]);

  const roles = useMemo(() => contests.flatMap(contest => contest.roles.map(role => ({ ...role, contest }))), [contests]);
  const courseIds = useMemo(() => [...new Set(roles.map(item => item.courseId).filter(Boolean))].sort(), [roles]);
  const questionCurriculum=useMemo(()=>roles.find(item=>item.courseId===questionForm.courseId)?.curriculum,[questionForm.courseId,roles]);
  const questionCategories=useMemo(()=>{const topics=Array.isArray(questionCurriculum?.topics)?questionCurriculum.topics as Array<Record<string,unknown>>:[];return[...new Set(topics.map(item=>String(item.title||'')).filter(Boolean))];},[questionCurriculum]);
  const questionTopics=useMemo(()=>{const topics=Array.isArray(questionCurriculum?.topics)?questionCurriculum.topics as Array<Record<string,unknown>>:[];const selected=topics.find(item=>String(item.title||'')===questionForm.category);return Array.isArray(selected?.subtopics)?selected.subtopics.map(String):[];},[questionCurriculum,questionForm.category]);
  const notify = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 3500); };
  const run = async (operation: () => Promise<unknown>, message: string, reset: () => void) => {
    setSaving(true); setError('');
    try { await operation(); reset(); await load(); notify(message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.'); }
    finally { setSaving(false); }
  };

  const submitContest = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...contestForm, code: contestForm.id };
    void run(
      () => editingContest ? adminApi.updateContest(editingContest, payload) : adminApi.createContest(payload),
      editingContest ? 'Concurso atualizado.' : 'Concurso cadastrado.',
      () => { setContestForm(emptyContest); setEditingContest(''); },
    );
  };
  const editContest = (item: CatalogContest) => {
    setContestForm({
      id: item.id, label: item.label, acronym: item.acronym, organization: item.organization, description: item.description,
      board: item.board, examDate: item.examDate, status: item.status, state: item.state, area: item.area, education: item.education,
      vacancies: item.vacancies, remuneration: item.remuneration, location: item.location, stages: item.stages,
      noticeReference: item.noticeReference, active: item.active !== false,
    });
    setEditingContest(item.databaseId || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const automaticCourseId=(contestId:string,label:string)=>{if(!label.trim())return'';const selected=contests.find(item=>item.databaseId===contestId);return slugify(`${selected?.id||''}_${label}`);};
  const updateDiscipline=(index:number,patch:Partial<CurriculumDiscipline>)=>setCurriculumDisciplines(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,...patch}:item));

  const submitRole = (event: FormEvent) => {
    event.preventDefault(); let curriculum: unknown;
    try { curriculum=curriculumFromDisciplines(curriculumDisciplines); }
    catch(cause) { setError(cause instanceof Error?cause.message:'Revise as disciplinas e assuntos do edital.'); return; }
    const payload = { ...roleForm, code: roleForm.id, contestId: roleForm.contestId, curriculum };
    void run(
      () => editingRole ? adminApi.updateRole(editingRole, payload) : adminApi.createRole(payload),
      editingRole ? 'Cargo e edital atualizados.' : 'Cargo e edital cadastrados.',
      () => { setRoleForm(emptyRole);setCurriculumDisciplines([newDiscipline()]);setEditingRole(''); },
    );
  };
  const editRole = (item: CatalogRole & { contest: CatalogContest }) => {
    setRoleForm({
      contestId: item.contest.databaseId || '', id: item.id, label: item.label, courseId: item.courseId, board: item.board,
      includeDiscursive: Boolean(item.includeDiscursive), requirement: item.requirement || '', remuneration: item.remuneration || '',
      vacancies: item.vacancies || '', estimatedHours: item.estimatedHours || 120, active: item.active !== false,
    });
    setCurriculumDisciplines(disciplinesFromCurriculum(item.curriculum));
    setEditingRole(item.databaseId || ''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitPassage = (event: FormEvent) => {
    event.preventDefault();
    const nextPassage=editingPassage?emptyPassage:{...emptyPassage,source:passageForm.source};
    void run(
      () => editingPassage ? adminApi.updatePassage(editingPassage, passageForm) : adminApi.createPassage(passageForm),
      editingPassage ? 'Texto de apoio atualizado.' : 'Texto de apoio cadastrado.',
      () => { setPassageForm(nextPassage); setEditingPassage(''); },
    );
  };

  const parseOptions = (value: string) => value.split('\n').map(line => {
    const [label, ...parts] = line.split('|'); return { label: label.trim(), text: parts.join('|').trim() };
  }).filter(option => option.label && option.text);
  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...questionForm, passageId: questionForm.passageId || null, options: parseOptions(questionForm.options) };
    const nextQuestion=editingQuestion?emptyQuestion:{...emptyQuestion,courseId:questionForm.courseId,category:questionForm.category,
      topic:questionForm.topic,board:questionForm.board,type:questionForm.type,reference:questionForm.reference,passageId:questionForm.passageId};
    void run(
      () => editingQuestion ? adminApi.updateQuestion(editingQuestion, payload) : adminApi.createQuestion(payload),
      editingQuestion ? 'Questão atualizada.' : 'Questão cadastrada.',
      () => { setQuestionForm(nextQuestion); setEditingQuestion(''); setQuestions([]); setHasSearchedQuestions(false); void loadReports(); },
    );
  };

  const editQuestion = (item: AdminQuestion) => {
    setQuestionForm({ courseId: item.courseId, category: item.category, topic: item.topic, board: item.board, type: item.type,
      text: item.text, correct: item.correct, explanation: item.explanation || '', reference: item.reference || '',
      passageId: item.passageId || '', status: item.status || 'ACTIVE', options: item.options.map(option => `${option.label} | ${option.text}`).join('\n') });
    setEditingQuestion(item.id); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const searchQuestions = async (event?: FormEvent) => {
    event?.preventDefault();
    if (questionSearch.trim().length < 2 && !questionFilter) { setError('Digite ao menos 2 caracteres ou selecione um curso para pesquisar.'); return; }
    setQuestionsLoading(true); setError(''); setHasSearchedQuestions(true);
    try { setQuestions(await adminApi.questions({ query: questionSearch.trim(), courseId: questionFilter, limit: 50 })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível pesquisar as questões.'); setQuestions([]); }
    finally { setQuestionsLoading(false); }
  };
  const editReportedQuestion = async (report:AdminQuestionReport) => {
    if (!report.questionId) { setError('Esta sinalização pertence a uma questão local ou gerada e não possui cadastro editável no banco.'); return; }
    setQuestionsLoading(true); setError('');
    try { const result=await adminApi.questions({query:report.questionId,limit:1});if(!result[0])throw new Error('Questão sinalizada não encontrada.');editQuestion(result[0]); }
    catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível abrir a questão sinalizada.');}
    finally{setQuestionsLoading(false);}
  };
  const reviewReport = async (report:AdminQuestionReport,status:'RESOLVED'|'DISMISSED') => {
    const note=window.prompt(status==='RESOLVED'?'Informe o que foi corrigido (opcional):':'Motivo para descartar a sinalização (opcional):','') ?? null;
    if(note===null)return;setSaving(true);setError('');
    try{await adminApi.reviewQuestionReport(report.id,status,note);await loadReports();notify(status==='RESOLVED'?'Sinalização marcada como corrigida.':'Sinalização descartada.');}
    catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível analisar a sinalização.');}
    finally{setSaving(false);}
  };

  const remove = (label: string, operation: () => Promise<unknown>) => {
    if (!window.confirm(`Excluir “${label}”? Esta ação não poderá ser desfeita.`)) return;
    void run(operation, 'Registro excluído.', () => {});
  };

  const tabs: Array<{ id: Section; label: string; icon: typeof Building2; count: number }> = [
    { id: 'contests', label: 'Concursos', icon: Building2, count: contests.length },
    { id: 'roles', label: 'Editais e cargos', icon: UsersRound, count: roles.length },
    { id: 'passages', label: 'Textos de apoio', icon: BookOpenText, count: passages.length },
    { id: 'questions', label: 'Questões', icon: FileQuestion, count: questionReports.length },
  ];

  if (loading && !contests.length) return <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-slate-500"><LoaderCircle className="animate-spin" /> Carregando painel administrativo…</div>;

  return <main className="mx-auto w-full max-w-7xl animate-fade-in pb-12">
    <header className="mb-6 rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
      <span className="text-xs font-black uppercase tracking-[.18em] text-indigo-300">Administração</span>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl">Catálogo e banco de conteúdo</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Cadastre concursos, datas de prova, editais por cargo, conteúdos programáticos, questões e textos vinculados. Os concursos ativos passam a alimentar automaticamente a criação dos planos.</p>
    </header>

    <nav className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:grid-cols-4" aria-label="Seções administrativas">
      {tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => { setSection(tab.id); setError(''); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${section === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{tab.label}<span className={`rounded-full px-2 py-0.5 text-[10px] ${section === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>{tab.count}</span></button>; })}
    </nav>

    {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700" role="alert">{error}</div>}
    {success && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status">{success}</div>}

    {section === 'contests' && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.8fr)]">
      <AdminCard title={editingContest ? 'Editar concurso' : 'Novo concurso'} description="A data da prova define automaticamente a estratégia e a duração do cronograma.">
        <form onSubmit={submitContest} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do concurso"><input required className={inputClass} value={contestForm.label} onChange={e => setContestForm(v => ({ ...v, label:e.target.value,id:!v.id||v.id===slugify(v.label)?slugify(e.target.value):v.id }))} placeholder="Ex.: Secretaria de Estado da Saúde" /></Field>
          <Field label="Sigla"><input required className={inputClass} value={contestForm.acronym} onChange={e => setContestForm(v => ({ ...v, acronym: e.target.value }))} /></Field>
          <Field label="Órgão"><input required className={inputClass} value={contestForm.organization} onChange={e => setContestForm(v => ({ ...v, organization: e.target.value }))} /></Field>
          <Field label="Banca"><input required className={inputClass} value={contestForm.board} onChange={e => setContestForm(v => ({ ...v, board: e.target.value }))} placeholder="CEBRASPE, FGV…" /></Field>
          <Field label="Data da prova"><input required type="date" className={inputClass} value={contestForm.examDate} onChange={e => setContestForm(v => ({ ...v, examDate: e.target.value }))} /></Field>
          <Field label="Situação"><input required className={inputClass} value={contestForm.status} onChange={e => setContestForm(v => ({ ...v, status: e.target.value }))} /></Field>
          <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-extrabold text-indigo-700">Informações complementares (opcional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Código interno automático"><input required className={inputClass} value={contestForm.id} onChange={e => setContestForm(v => ({ ...v,id:slugify(e.target.value) }))} /></Field><Field label="Estado"><input className={inputClass} value={contestForm.state} onChange={e => setContestForm(v => ({ ...v,state:e.target.value }))} /></Field><Field label="Área"><input className={inputClass} value={contestForm.area} onChange={e => setContestForm(v => ({ ...v,area:e.target.value }))} /></Field><Field label="Escolaridade"><input className={inputClass} value={contestForm.education} onChange={e => setContestForm(v => ({ ...v,education:e.target.value }))} /></Field><Field label="Vagas"><input className={inputClass} value={contestForm.vacancies} onChange={e => setContestForm(v => ({ ...v,vacancies:e.target.value }))} /></Field><Field label="Remuneração"><input className={inputClass} value={contestForm.remuneration} onChange={e => setContestForm(v => ({ ...v,remuneration:e.target.value }))} /></Field><Field label="Local"><input className={inputClass} value={contestForm.location} onChange={e => setContestForm(v => ({ ...v,location:e.target.value }))} /></Field><Field label="Referência/link do edital"><input className={inputClass} value={contestForm.noticeReference} onChange={e => setContestForm(v => ({ ...v,noticeReference:e.target.value }))} /></Field><Field label="Descrição" wide><textarea rows={3} className={inputClass} value={contestForm.description} onChange={e => setContestForm(v => ({ ...v,description:e.target.value }))} /></Field><Field label="Etapas" wide><textarea rows={2} className={inputClass} value={contestForm.stages} onChange={e => setContestForm(v => ({ ...v,stages:e.target.value }))} /></Field></div></details>
          <Check label="Concurso ativo e visível" checked={contestForm.active} onChange={checked => setContestForm(v => ({ ...v, active: checked }))} />
          <FormActions saving={saving} editing={Boolean(editingContest)} cancel={() => { setContestForm(emptyContest); setEditingContest(''); }} />
        </form>
      </AdminCard>
      <AdminCard title="Concursos cadastrados" description="Concursos vencidos deixam de aparecer para o aluno no dia seguinte à prova.">
        <div className="space-y-3">{contests.map(item => <RecordCard key={item.databaseId || item.id} title={item.label} eyebrow={`${item.acronym} · ${item.board}`} details={`${item.examDate.split('-').reverse().join('/')} · ${item.roles.length} cargo(s) · ${item.active === false ? 'Inativo' : item.status}`} onEdit={() => editContest(item)} onDelete={() => item.databaseId && remove(item.label, () => adminApi.deleteContest(item.databaseId!))} />)}{!contests.length && <Empty />}</div>
      </AdminCard>
    </div>}

    {section === 'roles' && <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <AdminCard title={editingRole ? 'Editar edital/cargo' : 'Novo edital/cargo'} description="Cadastre as disciplinas e cole os assuntos do edital; o cronograma será estruturado automaticamente.">
        <form onSubmit={submitRole} className="grid gap-4 sm:grid-cols-2">
          <Field label="Concurso"><select required className={inputClass} value={roleForm.contestId} onChange={e => {const selected=contests.find(item=>item.databaseId===e.target.value);setRoleForm(v => {const courseAutomatic=!v.courseId||v.courseId===slugify(v.label)||v.courseId===automaticCourseId(v.contestId,v.label);return{...v,contestId:e.target.value,board:v.board||selected?.board||'',courseId:courseAutomatic?automaticCourseId(e.target.value,v.label):v.courseId};});}}><option value="">Selecione</option>{contests.map(item => <option key={item.databaseId} value={item.databaseId}>{item.label}</option>)}</select></Field>
          <Field label="Nome do cargo"><input required className={inputClass} value={roleForm.label} onChange={e => setRoleForm(v => {const automatic=!v.id||v.id===slugify(v.label);const courseAutomatic=!v.courseId||v.courseId===slugify(v.label)||v.courseId===automaticCourseId(v.contestId,v.label);return{...v,label:e.target.value,id:automatic?slugify(e.target.value):v.id,courseId:courseAutomatic?automaticCourseId(v.contestId,e.target.value):v.courseId};})} placeholder="Ex.: Técnico em Enfermagem" /></Field>
          <Field label="Banca"><input required className={inputClass} value={roleForm.board} onChange={e => setRoleForm(v => ({ ...v, board: e.target.value }))} /></Field>
          <div className="flex flex-wrap items-end gap-5"><Check label="Tem discursiva" checked={roleForm.includeDiscursive} onChange={checked => setRoleForm(v => ({ ...v, includeDiscursive: checked }))} /><Check label="Ativo" checked={roleForm.active} onChange={checked => setRoleForm(v => ({ ...v, active: checked }))} /></div>
          <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-extrabold text-indigo-700">Dados complementares do cargo (opcional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Código do cargo automático"><input required className={inputClass} value={roleForm.id} onChange={e => setRoleForm(v => ({ ...v,id:slugify(e.target.value) }))} /></Field><Field label="Identificador do curso automático"><input required className={inputClass} value={roleForm.courseId} onChange={e => setRoleForm(v => ({ ...v,courseId:slugify(e.target.value) }))} /></Field><Field label="Carga estimada (horas)"><input required min="1" type="number" className={inputClass} value={roleForm.estimatedHours} onChange={e => setRoleForm(v => ({ ...v,estimatedHours:Number(e.target.value) }))} /></Field><Field label="Requisito"><input className={inputClass} value={roleForm.requirement} onChange={e => setRoleForm(v => ({ ...v,requirement:e.target.value }))} /></Field><Field label="Remuneração"><input className={inputClass} value={roleForm.remuneration} onChange={e => setRoleForm(v => ({ ...v,remuneration:e.target.value }))} /></Field><Field label="Vagas"><input className={inputClass} value={roleForm.vacancies} onChange={e => setRoleForm(v => ({ ...v,vacancies:e.target.value }))} /></Field></div></details>
          <div className="sm:col-span-2">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-indigo-50 p-4"><div><span className="text-xs font-black uppercase tracking-wider text-indigo-600">Conteúdo do edital</span><h4 className="mt-1 font-black text-slate-950">Disciplinas e assuntos</h4><p className="mt-1 text-xs leading-5 text-slate-600">Informe os assuntos exatamente como aparecem no edital, um por linha. O sistema monta a estrutura do cronograma automaticamente.</p></div><div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm"><strong className="block text-lg text-indigo-700">{curriculumDisciplines.length}</strong><span className="text-[10px] font-bold text-slate-500">disciplinas</span></div></div>
            <div className="space-y-4">{curriculumDisciplines.map((discipline,index)=><section key={discipline.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Disciplina {index+1}</span><h5 className="text-sm font-black text-slate-900">{discipline.title||'Nova disciplina'}</h5></div>{curriculumDisciplines.length>1&&<button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={()=>setCurriculumDisciplines(current=>current.filter((_,itemIndex)=>itemIndex!==index))}><Trash2 className="h-3.5 w-3.5" />Remover</button>}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da disciplina"><input required className={inputClass} value={discipline.title} onChange={event=>updateDiscipline(index,{title:event.target.value})} placeholder="Ex.: Língua Portuguesa" /></Field>
                <Field label="Grupo"><select className={inputClass} value={discipline.category} onChange={event=>updateDiscipline(index,{category:event.target.value})}><option>Conhecimentos Básicos</option><option>Conhecimentos Gerais</option><option>Conhecimentos Específicos</option><option>Legislação</option></select></Field>
                <Field label="Peso aproximado"><input className={inputClass} value={discipline.weight} onChange={event=>updateDiscipline(index,{weight:event.target.value})} placeholder="Ex.: 20% ou peso 2" /></Field>
                <Field label="Dificuldade"><select className={inputClass} value={discipline.difficulty} onChange={event=>updateDiscipline(index,{difficulty:event.target.value as Difficulty})}><option>Fácil</option><option>Médio</option><option>Difícil</option></select></Field>
                <Field label="Assuntos do edital — um por linha" wide><textarea required rows={7} className={inputClass} value={discipline.subjectsText} onChange={event=>updateDiscipline(index,{subjectsText:event.target.value})} placeholder={'Interpretação de textos\nCrase\nConcordância verbal e nominal'} /><span className="mt-1 block text-[11px] text-slate-500">{subjectLines(discipline.subjectsText).length} assunto(s) informado(s)</span></Field>
                <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3"><summary className="cursor-pointer text-xs font-extrabold text-indigo-700">Adicionar resumo e prioridade (opcional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Resumo ou material-base" wide><textarea rows={5} className={inputClass} value={discipline.summary} onChange={event=>updateDiscipline(index,{summary:event.target.value})} placeholder="Cole aqui um resumo que poderá ser usado nos materiais desta disciplina." /></Field><Field label="Pontos-chave — um por linha"><textarea rows={4} className={inputClass} value={discipline.keyPointsText} onChange={event=>updateDiscipline(index,{keyPointsText:event.target.value})} /></Field><Field label="Justificativa da prioridade"><textarea rows={4} className={inputClass} value={discipline.justification} onChange={event=>updateDiscipline(index,{justification:event.target.value})} /></Field><Check label="Alta prioridade / cai muito" checked={discipline.highPriority} onChange={checked=>updateDiscipline(index,{highPriority:checked})} /></div></details>
              </div>
            </section>)}</div>
            <button type="button" className={`${buttonSecondary} mt-4 w-full border-dashed border-indigo-300 text-indigo-700`} onClick={()=>setCurriculumDisciplines(current=>[...current,newDiscipline(current.length)])}><Plus className="h-4 w-4" />Adicionar outra disciplina</button>
          </div>
          <FormActions saving={saving} editing={Boolean(editingRole)} cancel={() => { setRoleForm(emptyRole);setCurriculumDisciplines([newDiscipline()]);setEditingRole(''); }} />
        </form>
      </AdminCard>
      <AdminCard title="Editais e cargos" description="Cada cargo possui seu próprio curso e conteúdo programático.">
        <div className="space-y-3">{roles.map(item => <RecordCard key={item.databaseId || `${item.contest.id}-${item.id}`} title={item.label} eyebrow={item.contest.acronym} details={`${item.courseId} · ${item.board} · ${item.active === false ? 'Inativo' : 'Ativo'}`} onEdit={() => editRole(item)} onDelete={() => item.databaseId && remove(item.label, () => adminApi.deleteRole(item.databaseId!))} />)}{!roles.length && <Empty />}</div>
      </AdminCard>
    </div>}

    {section === 'passages' && <div className="grid gap-6 xl:grid-cols-2">
      <AdminCard title={editingPassage ? 'Editar texto de apoio' : 'Novo texto de apoio'} description="O texto poderá ser vinculado a uma ou várias questões.">
        <form onSubmit={submitPassage} className="space-y-4"><Field label="Título"><input required className={inputClass} value={passageForm.title} onChange={e => setPassageForm(v => ({ ...v, title: e.target.value }))} /></Field><Field label="Fonte"><input className={inputClass} value={passageForm.source} onChange={e => setPassageForm(v => ({ ...v, source: e.target.value }))} /></Field><Field label="Conteúdo"><textarea required rows={14} className={inputClass} value={passageForm.content} onChange={e => setPassageForm(v => ({ ...v, content: e.target.value }))} /></Field><FormActions saving={saving} editing={Boolean(editingPassage)} cancel={() => { setPassageForm(emptyPassage); setEditingPassage(''); }} /></form>
      </AdminCard>
      <AdminCard title="Textos cadastrados" description="Gerencie enunciados-base, notícias, leis e demais materiais.">
        <div className="space-y-3">{passages.map(item => <RecordCard key={item.id} title={item.title} eyebrow={item.source || 'Sem fonte informada'} details={`${item.content.slice(0, 120)}${item.content.length > 120 ? '…' : ''}`} onEdit={() => { setPassageForm({ title: item.title, source: item.source || '', content: item.content }); setEditingPassage(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onDelete={() => remove(item.title, () => adminApi.deletePassage(item.id))} />)}{!passages.length && <Empty />}</div>
      </AdminCard>
    </div>}

    {section === 'questions' && <div className="space-y-6">
      <AdminCard title={`Sinalizações de questões${questionReports.length ? ` (${questionReports.length})` : ''}`} description="Questões marcadas pelos alunos como incorretas, desatualizadas ou com problemas no enunciado e na explicação.">
        <select aria-label="Filtrar sinalizações por situação" className={`${inputClass} mb-4 max-w-xs`} value={reportStatus} onChange={event=>setReportStatus(event.target.value as typeof reportStatus)}><option value="PENDING">Pendentes</option><option value="RESOLVED">Corrigidas</option><option value="DISMISSED">Descartadas</option><option value="ALL">Todas</option></select>
        {reportsLoading && <div className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Carregando sinalizações…</div>}
        {!reportsLoading && <div className="grid gap-3 lg:grid-cols-2">{questionReports.map(report => <article key={report.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800"><Flag className="h-3 w-3" />{reportReasonLabel(report.reason)}</span><time className="text-[10px] font-bold text-slate-400">{new Date(report.createdAt).toLocaleString('pt-BR')}</time></div>
          <h4 className="mt-3 line-clamp-3 text-sm font-extrabold leading-5 text-slate-900">{report.questionText}</h4>
          <p className="mt-1 text-xs font-bold text-indigo-700">{[report.courseId,report.category,report.reference].filter(Boolean).join(' · ')}</p>
          {report.details && <div className="mt-3 rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700"><strong className="block text-amber-800">Descrição do aluno</strong>{report.details}</div>}
          <p className="mt-2 text-[11px] text-slate-500">Sinalizada por {report.reporterName || report.reporterEmail || 'usuário identificado'}</p>
          {report.adminNote && <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600"><strong>Nota administrativa:</strong> {report.adminNote}</p>}
          <div className="mt-3 flex flex-wrap gap-2">{report.questionId && <button type="button" disabled={saving} className={buttonSecondary} onClick={() => void editReportedQuestion(report)}><Pencil className="h-3.5 w-3.5" />Abrir questão</button>}{report.status==='PENDING'&&<><button type="button" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-extrabold text-white hover:bg-emerald-700" onClick={() => void reviewReport(report,'RESOLVED')}>Marcar corrigida</button><button type="button" disabled={saving} className={buttonSecondary} onClick={() => void reviewReport(report,'DISMISSED')}>Descartar</button></>}</div>
        </article>)}{!questionReports.length && <div className="lg:col-span-2"><Empty text="Nenhuma sinalização pendente." /></div>}</div>}
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <AdminCard title={editingQuestion ? 'Editar questão' : 'Nova questão'} description="Use uma alternativa por linha no formato A | texto da alternativa.">
        <form onSubmit={submitQuestion} className="grid gap-4 sm:grid-cols-2">
          <Field label="Curso/cargo"><select required className={inputClass} value={questionForm.courseId} onChange={e => {const role=roles.find(item=>item.courseId===e.target.value);setQuestionForm(v => ({ ...v,courseId:e.target.value,board:v.board||role?.board||'',category:'',topic:'' }));}}><option value="">Selecione</option>{roles.map(item=><option key={item.databaseId||item.id} value={item.courseId}>{item.contest.acronym} — {item.label}</option>)}</select></Field>
          <Field label="Banca"><input required className={inputClass} value={questionForm.board} onChange={e => setQuestionForm(v => ({ ...v, board: e.target.value }))} /></Field>
          <Field label="Disciplina"><input list="admin-question-categories" required className={inputClass} value={questionForm.category} onChange={e => setQuestionForm(v => ({ ...v,category:e.target.value,topic:'' }))} /><datalist id="admin-question-categories">{questionCategories.map(value=><option key={value} value={value}/>)}</datalist></Field>
          <Field label="Assunto"><input list="admin-question-topics" className={inputClass} value={questionForm.topic} onChange={e => setQuestionForm(v => ({ ...v, topic: e.target.value }))} /><datalist id="admin-question-topics">{questionTopics.map(value=><option key={value} value={value}/>)}</datalist></Field>
          <Field label="Tipo"><select className={inputClass} value={questionForm.type} onChange={e => setQuestionForm(v => ({ ...v,type:e.target.value,correct:e.target.value==='TRUE_FALSE'?'Certo':'A',options:e.target.value==='TRUE_FALSE'?'':'A | \nB | \nC | \nD | \nE | ' }))}><option value="MULTIPLE_CHOICE">Múltipla escolha</option><option value="TRUE_FALSE">Certo ou errado</option></select></Field>
          <Field label="Resposta correta">{questionForm.type==='TRUE_FALSE'?<select required className={inputClass} value={questionForm.correct} onChange={e=>setQuestionForm(v=>({...v,correct:e.target.value}))}><option value="Certo">Certo</option><option value="Errado">Errado</option><option value="Anulada">Anulada</option></select>:<select required className={inputClass} value={questionForm.correct} onChange={e=>setQuestionForm(v=>({...v,correct:e.target.value}))}><option value="">Selecione</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>Anulada</option></select>}</Field>
          <Field label="Texto de apoio"><select className={inputClass} value={questionForm.passageId} onChange={e => setQuestionForm(v => ({ ...v, passageId: e.target.value }))}><option value="">Nenhum</option>{passages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
          <Field label="Referência"><input className={inputClass} value={questionForm.reference} onChange={e => setQuestionForm(v => ({ ...v, reference: e.target.value }))} placeholder="Banca — Órgão — Ano" /></Field>
          <Field label="Enunciado" wide><textarea required rows={5} className={inputClass} value={questionForm.text} onChange={e => setQuestionForm(v => ({ ...v, text: e.target.value }))} /></Field>
          {questionForm.type==='MULTIPLE_CHOICE'&&<Field label="Alternativas — uma por linha no formato A | texto" wide><textarea required rows={6} className={`${inputClass} font-mono`} value={questionForm.options} onChange={e => setQuestionForm(v => ({ ...v, options: e.target.value }))} /></Field>}
          <Field label="Comentário/gabarito explicado" wide><textarea rows={5} className={inputClass} value={questionForm.explanation} onChange={e => setQuestionForm(v => ({ ...v, explanation: e.target.value }))} /></Field>
          <FormActions saving={saving} editing={Boolean(editingQuestion)} cancel={() => { setQuestionForm(emptyQuestion); setEditingQuestion(''); }} />
        </form>
      </AdminCard>
      <AdminCard title="Pesquisar questões" description="Nenhuma questão é carregada automaticamente. Pesquise pelo enunciado, ID, banca, disciplina, assunto ou referência.">
        <form onSubmit={event => void searchQuestions(event)} className="mb-4 space-y-3">
          <div className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-10`} value={questionSearch} onChange={e => setQuestionSearch(e.target.value)} placeholder="Ex.: crase, LGPD, CEBRASPE ou ID da questão" /></div>
          <select aria-label="Filtrar questões por curso" className={inputClass} value={questionFilter} onChange={e => setQuestionFilter(e.target.value)}><option value="">Todos os cursos</option>{courseIds.map(id => <option key={id}>{id}</option>)}</select>
          <button type="submit" disabled={questionsLoading} className={`${buttonPrimary} w-full`}>{questionsLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{questionsLoading ? 'Pesquisando…' : 'Pesquisar no banco'}</button>
        </form>
        <div className="max-h-[72rem] space-y-3 overflow-auto pr-1">{!questionsLoading && questions.map(item => <RecordCard key={item.id} title={item.text} eyebrow={`${item.courseId} · ${item.board}${Number(item.pendingReports||0)>0?` · ${item.pendingReports} sinalização(ões)`:''}`} details={`${item.category} · Gabarito: ${item.correct}`} onEdit={() => editQuestion(item)} onDelete={() => remove(item.text.slice(0, 60), () => adminApi.deleteQuestion(item.id))} />)}{!questionsLoading && hasSearchedQuestions && !questions.length && <Empty text="Nenhuma questão encontrada para esta pesquisa." />}{!questionsLoading && !hasSearchedQuestions && <Empty text="Use a pesquisa acima para consultar o banco de questões." />}</div>
      </AdminCard>
      </div>
    </div>}
  </main>;
}

function AdminCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><header className="mb-5"><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></header>{children}</section>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
function FormActions({ saving, editing, cancel }: { saving: boolean; editing: boolean; cancel: () => void }) {
  return <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">{editing && <button type="button" className={buttonSecondary} onClick={cancel}><X className="h-4 w-4" />Cancelar</button>}<button disabled={saving} className={buttonPrimary}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar'}</button></div>;
}
function RecordCard({ title, eyebrow, details, onEdit, onDelete }: { title: string; eyebrow: string; details: string; onEdit: () => void; onDelete: () => void }) {
  return <article className="rounded-2xl border border-slate-200 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{eyebrow}</span><h4 className="mt-1 line-clamp-3 text-sm font-extrabold leading-5 text-slate-900">{title}</h4><p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500">{details}</p><div className="mt-3 flex gap-2"><button type="button" onClick={onEdit} className={buttonSecondary}><Pencil className="h-3.5 w-3.5" />Editar</button><button type="button" onClick={onDelete} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" />Excluir</button></div></article>;
}
function Empty({text='Nenhum registro cadastrado.'}:{text?:string}) { return <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{text}</div>; }
function reportReasonLabel(reason:string){return ({ANSWER:'Gabarito incorreto',STATEMENT:'Erro no enunciado',EXPLANATION:'Explicação incorreta',OUTDATED:'Questão desatualizada',OTHER:'Outro problema'} as Record<string,string>)[reason]||reason;}

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, BookOpenCheck, BriefcaseBusiness, ChevronRight, Clock3,
  GraduationCap, ListChecks, LoaderCircle, Search, ShieldCheck, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import {
  CAREER_CONTESTS, CareerContest, CareerRole, StudyPreferences, createAutomaticCareerPlan,
  isContestAvailable, localTodayIso, topicIdsForCareer, topicsForCareerRole,
} from '../careerPlan';
import { COURSES_CONFIG } from '../data/generator';
import { CatalogContest, StudyPlan, catalogApi, studyPlansApi } from '../services/api';
import './CareerTab.css';

interface Props {
  preferences: StudyPreferences;
  onPlanGenerated: (courseId: string) => void;
  onBeforeCreatePlan?: () => Promise<boolean>;
  onEditPreferences: () => void;
  onNavigate: (tab: 'home' | 'study' | 'schedule') => void;
  onPlansChanged: () => void;
}

interface Preparation {
  courseId: string;
  title: string;
  contest: CareerContest;
  examDate: string;
  board: string;
  progress: number;
  nextStudy: string;
  remainingDays: number;
  studyPlanId?: string;
}

const baseCourseIds = ['seplag_informatica', 'policial_civil', 'tecnico_enfermagem', 'jornalismo'];
const weekdayLabels: Record<number, string> = { 0: 'domingo', 1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado' };
const formatDate = (value?: string) => value ? value.split('-').reverse().join('/') : 'A definir';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const remainingDays = (examDate: string) => Math.max(0, Math.ceil((new Date(`${examDate}T00:00:00`).getTime() - Date.now()) / 86_400_000));

const loadPreparations = (contests: CareerContest[], courseIds: string[], remotePlans: StudyPlan[] = []): Preparation[] => courseIds.flatMap(courseId => {
  try {
    const config = JSON.parse(localStorage.getItem(`${courseId}_study_config`) || 'null');
    const weeks = JSON.parse(localStorage.getItem(`${courseId}_schedule_weeks`) || '[]');
    if (!config || !config.examDate || config.examDate < localTodayIso()) return [];
    const contest = contests.find(item => item.id === config.contest)
      || contests.find(item => item.roles.some(role => role.courseId === courseId));
    if (!contest) return [];
    const blocks = weeks.flatMap((week: { blocks?: Record<string, unknown>[] }) => week.blocks || []);
    const progress = JSON.parse(localStorage.getItem(`${courseId}_study_schedule_progress`) || '{}');
    const completed = blocks.filter((block: Record<string, unknown>) => Boolean(progress[String(block.id)] || block.done)).length;
    const next = blocks.find((block: Record<string, unknown>) => !progress[String(block.id)] && !block.done);
    const remotePlan = remotePlans.find(plan => String(plan.id) === String(config.studyPlanId));
    const remoteTotal = Number(remotePlan?.total_topics || 0);
    const calculatedProgress = remoteTotal > 0
      ? Math.round(Math.min(remoteTotal, Number(remotePlan?.completed_topics || 0)) / remoteTotal * 100)
      : blocks.length ? Math.round(completed / blocks.length * 100) : 0;
    return [{
      courseId,
      title: config.targetRole || COURSES_CONFIG[courseId]?.name || contest.label,
      contest,
      examDate: config.examDate,
      board: config.examBoard || contest.board,
      progress: calculatedProgress,
      nextStudy: String(next?.title || 'Plano concluído ou aguardando atualização'),
      remainingDays: remainingDays(config.examDate),
      studyPlanId: config.studyPlanId || undefined,
    }];
  } catch {
    return [];
  }
});

export default function CareerTab({
  preferences, onPlanGenerated, onBeforeCreatePlan, onEditPreferences, onNavigate, onPlansChanged,
}: Props) {
  const [contest, setContest] = useState<CareerContest | null>(null);
  const [pendingRole, setPendingRole] = useState<CareerRole | null>(null);
  const [showContents, setShowContents] = useState(false);
  const [creatingRole, setCreatingRole] = useState('');
  const [busyPreparation, setBusyPreparation] = useState('');
  const [error, setError] = useState('');
  const [preparationVersion, setPreparationVersion] = useState(0);
  const [remotePlans, setRemotePlans] = useState<StudyPlan[]>([]);
  const [remoteContests, setRemoteContests] = useState<CareerContest[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [educationFilter, setEducationFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      studyPlansApi.getAll(false).catch(() => []),
      catalogApi.contests().catch(() => [] as CatalogContest[]),
    ]).then(([plans, catalog]) => {
      if (cancelled) return;
      setRemotePlans(plans);
      setRemoteContests(catalog as CareerContest[]);
    });
    return () => { cancelled = true; };
  }, [preparationVersion]);

  useEffect(()=>{
    document.body.classList.toggle('mobile-sheet-open',filtersOpen);
    const media=window.matchMedia('(max-width: 839px)');
    const closeForWideScreen=()=>{if(!media.matches)setFiltersOpen(false);};
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setFiltersOpen(false);};
    media.addEventListener('change',closeForWideScreen);
    window.addEventListener('keydown',closeOnEscape);
    return()=>{
      document.body.classList.remove('mobile-sheet-open');
      media.removeEventListener('change',closeForWideScreen);
      window.removeEventListener('keydown',closeOnEscape);
    };
  },[filtersOpen]);

  const allContests = useMemo(() => {
    const merged = new Map<string, CareerContest>(CAREER_CONTESTS.map(item => [item.id, item]));
    remoteContests.forEach(item => merged.set(item.id, item));
    return [...merged.values()];
  }, [remoteContests]);
  const courseIds = useMemo(() => [...new Set([...baseCourseIds, ...allContests.flatMap(item => item.roles.map(role => role.courseId))])], [allContests]);
  const preparations = useMemo(() => loadPreparations(allContests, courseIds, remotePlans), [allContests, courseIds, preparationVersion, remotePlans]);
  const availableContests = useMemo(() => allContests.filter(item => isContestAvailable(item)), [allContests]);
  const filteredContests = useMemo(() => availableContests.filter(item => {
    const searchable = normalize([item.label, item.acronym, item.organization, ...item.roles.map(role => role.label)].join(' '));
    return (!search || searchable.includes(normalize(search)))
      && (!stateFilter || item.state === stateFilter)
      && (!areaFilter || item.area === areaFilter)
      && (!educationFilter || item.education === educationFilter)
      && (!boardFilter || item.board === boardFilter)
      && (!statusFilter || item.status === statusFilter);
  }), [areaFilter, availableContests, boardFilter, educationFilter, search, stateFilter, statusFilter]);

  const roleTopics = (selectedContest: CareerContest, role: CareerRole) => {
    const ids = topicIdsForCareer(selectedContest.id, role);
    return topicsForCareerRole(role).filter(topic => ids.includes(topic.id));
  };

  const createPlan = async () => {
    if (!contest || !pendingRole || creatingRole) return;
    if (onBeforeCreatePlan && !(await onBeforeCreatePlan())) return;
    setCreatingRole(pendingRole.id);
    setError('');
    try {
      const result = await createAutomaticCareerPlan(contest, pendingRole, preferences);
      setPendingRole(null);
      setPreparationVersion(value => value + 1);
      onPlanGenerated(result.courseId);
    } catch (cause) {
      console.error('Erro ao criar preparação automática:', cause);
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar esta preparação.');
    } finally {
      setCreatingRole('');
    }
  };

  const activatePreparation = async (preparation: Preparation, destination: 'study' | 'schedule') => {
    setBusyPreparation(preparation.courseId);
    setError('');
    try {
      if (preparation.studyPlanId && !String(preparation.studyPlanId).startsWith('local-')) {
        await studyPlansApi.activate(preparation.studyPlanId);
      }
      ['study_sections', 'quiz_questions', 'schedule_weeks', 'study_config', 'study_schedule_progress', 'quiz_answers'].forEach(key => {
        const value = localStorage.getItem(`${preparation.courseId}_${key}`);
        const activeKey = key === 'study_sections' ? 'custom_study_sections'
          : key === 'quiz_questions' ? 'custom_quiz_questions'
          : key === 'schedule_weeks' ? 'custom_schedule_weeks' : key;
        if (value) localStorage.setItem(activeKey, value); else localStorage.removeItem(activeKey);
      });
      localStorage.setItem('active_course', preparation.courseId);
      localStorage.removeItem('study_plan_deleted');
      onPlanGenerated(preparation.courseId);
      onNavigate(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível ativar esta preparação.');
    } finally {
      setBusyPreparation('');
    }
  };

  const removePreparation = async (preparation: Preparation) => {
    if (!window.confirm(`Remover a preparação “${preparation.title}”? O progresso deste plano também será removido.`)) return;
    setBusyPreparation(preparation.courseId);
    setError('');
    try {
      if (preparation.studyPlanId && !String(preparation.studyPlanId).startsWith('local-')) await studyPlansApi.delete(preparation.studyPlanId);
      ['study_sections', 'quiz_questions', 'schedule_weeks', 'study_config', 'study_schedule_progress', 'quiz_answers']
        .forEach(key => localStorage.removeItem(`${preparation.courseId}_${key}`));
      if (localStorage.getItem('active_course') === preparation.courseId) {
        ['active_course', 'custom_study_sections', 'custom_quiz_questions', 'custom_schedule_weeks', 'study_config',
          'study_schedule_progress', 'quiz_answers', 'active_study_context'].forEach(key => localStorage.removeItem(key));
      }
      const hasRemainingPreparation = courseIds.some(courseId => localStorage.getItem(`${courseId}_study_config`));
      if (!hasRemainingPreparation) {
        localStorage.setItem('study_plan_deleted', 'true');
        [
          'active_course', 'custom_study_sections', 'custom_quiz_questions', 'custom_schedule_weeks',
          'study_config', 'study_schedule_progress', 'quiz_answers', 'active_study_context',
          'quiz_answer_history', 'quiz_answer_events', 'active_quiz_questions_cache',
        ].forEach(key => localStorage.removeItem(key));
      }
      setPreparationVersion(value => value + 1);
      onPlansChanged();
      if (!hasRemainingPreparation) onNavigate('home');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível remover esta preparação.');
    } finally {
      setBusyPreparation('');
    }
  };

  const selectedRoleTopics = contest && pendingRole ? roleTopics(contest, pendingRole) : [];
  const filters = [
    { label: 'Estado', value: stateFilter, setter: setStateFilter, options: availableContests.map(item => item.state) },
    { label: 'Área', value: areaFilter, setter: setAreaFilter, options: availableContests.map(item => item.area) },
    { label: 'Escolaridade', value: educationFilter, setter: setEducationFilter, options: availableContests.map(item => item.education) },
    { label: 'Banca', value: boardFilter, setter: setBoardFilter, options: availableContests.map(item => item.board) },
    { label: 'Situação do edital', value: statusFilter, setter: setStatusFilter, options: availableContests.map(item => item.status) },
  ];
  const activeFilterCount=filters.filter(filter=>Boolean(filter.value)).length;
  const clearFilters=()=>{
    setStateFilter('');setAreaFilter('');setEducationFilter('');setBoardFilter('');setStatusFilter('');
  };

  return (
    <main className="career-page animate-fade-in">
      <header className="career-hero">
        <span className="career-eyebrow">Catálogo</span>
        <h2>Concursos</h2>
        <p>Escolha um concurso e o cargo que deseja preparar. O plano será montado automaticamente com base no edital e na sua disponibilidade.</p>

        {!contest && (
          <div className="career-tools">
            <label className="career-search">
              <Search aria-hidden="true" />
              <span className="sr-only">Buscar concurso, órgão ou cargo</span>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar concurso, órgão ou cargo"
              />
            </label>
            <button type="button" className="career-mobile-filter-button" onClick={()=>setFiltersOpen(true)} aria-haspopup="dialog">
              <SlidersHorizontal aria-hidden="true"/><span>Filtros</span>{activeFilterCount>0&&<strong>{activeFilterCount}</strong>}
            </button>
            <div className="career-filter-grid">
              {filters.map(filter => (
                <label key={filter.label}>
                  <span>{filter.label}</span>
                  <select value={filter.value} onChange={event => filter.setter(event.target.value)}>
                    <option value="">Todos</option>
                    {[...new Set(filter.options)].map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}
      </header>

      {!contest && preparations.length > 0 && (
        <section className="career-section">
          <div className="career-section-heading">
            <h3>Minhas preparações</h3>
            <p>Continue de onde parou ou gerencie os concursos adicionados.</p>
          </div>
          <div className="career-preparation-grid">
            {preparations.map(preparation => (
              <article key={preparation.courseId} className="career-preparation-card">
                <div className="career-card-top">
                  <div className="career-card-title">
                    <span className="career-eyebrow">{preparation.contest.acronym}</span>
                    <h4>{preparation.title}</h4>
                  </div>
                  <span className="career-pill career-pill-success">{preparation.remainingDays} dias restantes</span>
                </div>

                <dl className="career-meta-grid career-meta-grid--preparation">
                  <div><dt>Prova</dt><dd>{formatDate(preparation.examDate)}</dd></div>
                  <div><dt>Banca</dt><dd>{preparation.board}</dd></div>
                  <div className="career-meta-wide"><dt>Próximo estudo</dt><dd>{preparation.nextStudy}</dd></div>
                </dl>

                <div className="career-progress">
                  <div><span>Progresso</span><strong>{preparation.progress}%</strong></div>
                  <div className="career-progress-track" aria-hidden="true">
                    <i style={{ width: `${preparation.progress}%` }} />
                  </div>
                </div>

                <div className="career-actions career-actions--preparation">
                  <button disabled={Boolean(busyPreparation)} onClick={() => void activatePreparation(preparation, 'study')} className="career-button career-button-primary">
                    Continuar estudando
                  </button>
                  <button disabled={Boolean(busyPreparation)} onClick={() => void activatePreparation(preparation, 'schedule')} className="career-button career-button-secondary">
                    Ver cronograma
                  </button>
                  <button onClick={onEditPreferences} className="career-button career-button-secondary">
                    Ajustar disponibilidade
                  </button>
                  <button disabled={Boolean(busyPreparation)} onClick={() => void removePreparation(preparation)} className="career-button career-button-danger">
                    <Trash2 aria-hidden="true" /> Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!contest ? (
        <section className="career-section">
          <div className="career-section-heading">
            <h3>Concursos disponíveis</h3>
            <p>Explore os editais cadastrados no sistema.</p>
          </div>
          <div className="career-catalog-grid">
            {filteredContests.map(item => (
              <article key={item.id} className="career-contest-card">
                <div className="career-card-top">
                  <span className="career-icon career-icon-indigo"><BriefcaseBusiness aria-hidden="true" /></span>
                  <span className="career-pill career-pill-warning">{item.status}</span>
                </div>
                <div className="career-card-title career-card-title--contest">
                  <h4>{item.label}</h4>
                  <p>{item.acronym} · {item.organization}</p>
                </div>
                <dl className="career-meta-grid">
                  <div><dt>Banca</dt><dd>{item.board}</dd></div>
                  <div><dt>Prova</dt><dd>{formatDate(item.examDate)}</dd></div>
                  <div><dt>Escolaridade</dt><dd>{item.education}</dd></div>
                  <div><dt>Estado</dt><dd>{item.state}</dd></div>
                  <div className="career-meta-wide"><dt>Cargos disponíveis</dt><dd>{item.roles.map(role => role.label).join(', ')}</dd></div>
                </dl>
                <button type="button" onClick={() => setContest(item)} className="career-button career-button-dark career-card-cta">
                  Ver cargos <ChevronRight aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
          {filteredContests.length === 0 && <p className="career-empty">Nenhum concurso corresponde aos filtros selecionados.</p>}
        </section>
      ) : (
        <section className="career-section career-detail">
          <button type="button" onClick={() => { setContest(null); setPendingRole(null); setError(''); }} className="career-back-button">
            <ArrowLeft aria-hidden="true" /> Voltar ao catálogo
          </button>

          <article className="career-detail-hero">
            <div className="career-detail-head">
              <div>
                <span className="career-eyebrow">{contest.acronym}</span>
                <h3>{contest.label}</h3>
                <p>Órgão: {contest.organization}</p>
              </div>
              <span className="career-pill career-pill-dark">{contest.status}</span>
            </div>
            <dl className="career-detail-grid">
              <div><dt>Banca</dt><dd>{contest.board}</dd></div>
              <div><dt>Data da prova</dt><dd>{formatDate(contest.examDate)}</dd></div>
              <div><dt>Vagas</dt><dd>{contest.vacancies}</dd></div>
              <div><dt>Remuneração</dt><dd>{contest.remuneration}</dd></div>
              <div><dt>Local</dt><dd>{contest.location}</dd></div>
              <div className="career-detail-wide"><dt>Etapas</dt><dd>{contest.stages}</dd></div>
              <div><dt>Referência</dt><dd>{contest.noticeReference}</dd></div>
            </dl>
          </article>

          <div className="career-section-heading">
            <h3>Cargos disponíveis</h3>
            <p>Confira o conteúdo e escolha a preparação desejada.</p>
          </div>
          <div className="career-role-grid">
            {contest.roles.map(role => {
              const topics = roleTopics(contest, role);
              const specific = topics.filter(topic => normalize(topic.category).includes('especific'));
              const basic = topics.filter(topic => !normalize(topic.category).includes('especific'));
              const topicCount = topics.reduce((sum, topic) => sum + topic.subtopics.length, 0);
              const estimatedHours = role.estimatedHours || Math.ceil(topicCount * 20 / 60);
              return (
                <article key={role.id} className="career-role-card">
                  <span className="career-icon career-icon-green"><GraduationCap aria-hidden="true" /></span>
                  <h4>{role.label}</h4>
                  <dl className="career-meta-grid career-meta-grid--role">
                    <div className="career-meta-wide"><dt>Requisito</dt><dd>{role.requirement || contest.education}</dd></div>
                    <div><dt>Remuneração</dt><dd>{role.remuneration || contest.remuneration}</dd></div>
                    <div><dt>Vagas</dt><dd>{role.vacancies || contest.vacancies}</dd></div>
                    <div className="career-meta-wide"><dt>Disciplinas básicas</dt><dd>{basic.map(topic => topic.title.replace('Conhecimentos Específicos: ', '')).join(', ') || 'Conforme edital'}</dd></div>
                    <div className="career-meta-wide"><dt>Disciplinas específicas</dt><dd>{specific.map(topic => topic.title.replace('Conhecimentos Específicos: ', '')).join(', ') || 'Conforme edital'}</dd></div>
                    <div><dt>Assuntos estimados</dt><dd>{topicCount}</dd></div>
                    <div><dt>Carga estimada</dt><dd>{estimatedHours} horas</dd></div>
                  </dl>
                  <button type="button" onClick={() => { setPendingRole(role); setShowContents(false); }} className="career-button career-button-primary career-card-cta">
                    Escolher este cargo <ChevronRight aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {pendingRole && contest && createPortal(
        <div className="career-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !creatingRole) setPendingRole(null); }}>
          <section className="career-modal" role="dialog" aria-modal="true" aria-labelledby="preparation-confirm-title">
            <div className="career-modal-header">
              <div>
                <span className="career-eyebrow">Sua preparação</span>
                <h3 id="preparation-confirm-title">{contest.acronym} — {pendingRole.label}</h3>
              </div>
              <button type="button" disabled={Boolean(creatingRole)} onClick={() => setPendingRole(null)} aria-label="Fechar confirmação" className="career-modal-close">
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="career-modal-body">
              <dl className="career-modal-summary">
                <div><dt>Prova em</dt><dd>{formatDate(contest.examDate)}</dd></div>
                <div><dt>Disponibilidade</dt><dd>{preferences.hoursPerDay} horas por dia</dd></div>
                <div className="career-meta-wide"><dt>Dias de estudo</dt><dd>{preferences.selectedWeekdays.map(day => weekdayLabels[day]).join(', ')}</dd></div>
              </dl>
              <ul className="career-check-list">
                <li><BookOpenCheck aria-hidden="true" /><span>Conteúdos incluídos: 100% do edital cadastrado</span></li>
                <li><Clock3 aria-hidden="true" /><span>Revisões automáticas ativadas pelo ciclo de aprendizagem</span></li>
                <li><ListChecks aria-hidden="true" /><span>Questões da banca {pendingRole.board} priorizadas</span></li>
                <li><ShieldCheck aria-hidden="true" /><span>Conhecimentos básicos, específicos e complementares incluídos</span></li>
              </ul>
              <aside className="career-shared-note">
                <strong>Conteúdos em comum serão reaproveitados.</strong>
                <p>{(pendingRole.sharedTopics || ['Português', 'Segurança da Informação', 'Banco de Dados e LGPD']).join(', ')} serão organizados sem duplicação desnecessária no cronograma.</p>
              </aside>
              {showContents && (
                <div className="career-content-box">
                  <h4>Conteúdos incluídos</h4>
                  <div>{selectedRoleTopics.map(topic => <span key={topic.id}>{topic.title.replace('Conhecimentos Específicos: ', '')}</span>)}</div>
                </div>
              )}
              {error && <p role="alert" className="career-error">{error}</p>}
            </div>

            <div className="career-modal-actions">
              <button type="button" onClick={() => setShowContents(value => !value)} className="career-button career-button-secondary">
                {showContents ? 'Ocultar conteúdos' : 'Ver conteúdos incluídos'}
              </button>
              <button type="button" onClick={onEditPreferences} className="career-button career-button-secondary">Ajustar disponibilidade</button>
              <button type="button" disabled={Boolean(creatingRole)} onClick={() => void createPlan()} className="career-button career-button-primary">
                {creatingRole ? <LoaderCircle className="career-spinner" aria-hidden="true" /> : <BriefcaseBusiness aria-hidden="true" />}
                {creatingRole ? 'Criando preparação…' : 'Criar preparação'}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}

      {filtersOpen&&createPortal(
        <div className="career-filter-sheet-layer" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&setFiltersOpen(false)}>
          <section className="career-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="career-filter-title">
            <div className="career-sheet-handle" aria-hidden="true"/>
            <header><div><span className="career-eyebrow">Refinar catálogo</span><h3 id="career-filter-title">Filtros</h3></div><button type="button" onClick={()=>setFiltersOpen(false)} aria-label="Fechar filtros"><X/></button></header>
            <div className="career-filter-sheet-fields">
              {filters.map(filter=><label key={filter.label}><span>{filter.label}</span><select value={filter.value} onChange={event=>filter.setter(event.target.value)}><option value="">Todos</option>{[...new Set(filter.options)].map(option=><option key={option}>{option}</option>)}</select></label>)}
            </div>
            <footer><button type="button" className="career-button career-button-secondary" onClick={clearFilters}>Limpar</button><button type="button" className="career-button career-button-primary" onClick={()=>setFiltersOpen(false)}>Ver {filteredContests.length} concursos</button></footer>
          </section>
        </div>,document.body
      )}

      {error && !pendingRole && <p role="alert" className="career-error">{error}</p>}
    </main>
  );
}

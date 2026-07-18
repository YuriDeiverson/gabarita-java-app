import { useCallback, useEffect, useState } from 'react';
import {
  Archive, ArchiveRestore, Check, Clock3, Copy, History, LoaderCircle, Pencil, Play,
  RefreshCw, Trash2, X, CalendarDays, FolderOpen
} from 'lucide-react';
import { StudyPlan, studyPlansApi } from '../services/api';

interface PlanManagerProps {
  refreshKey?: number;
  onActivated?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
}

const courseLabel = (plan: StudyPlan) => {
  const course = plan.course_id || plan.courseId;
  if (course === 'seplag_informatica') return 'SEPLAG/AL • Informática';
  if (course === 'tecnico_enfermagem') return 'Técnico em Enfermagem';
  if (course === 'jornalismo') return 'Jornalismo';
  return course || 'Plano personalizado';
};

const examDate = (plan: StudyPlan) => {
  const value = plan.exam_date || plan.examDate;
  if (!value) return 'Data não definida';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
};

export default function PlanManager({ refreshKey, onActivated, onEdit }: PlanManagerProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[] | null>(null);
  const [historyTitle, setHistoryTitle] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPlans(await studyPlansApi.getAll(includeArchived));
    } catch (requestError) {
      console.error(requestError);
      setError('Não foi possível carregar os planos salvos no servidor.');
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => { loadPlans(); }, [loadPlans, refreshKey]);

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try { await action(); await loadPlans(); }
    catch (requestError) {
      console.error(requestError);
      setError('A operação não foi concluída. Tente novamente.');
    } finally { setBusyId(null); }
  };

  const activate = (plan: StudyPlan) => run(plan.id, async () => {
    await studyPlansApi.activate(plan.id);
    onActivated?.(plan.course_id || plan.courseId || '');
  });

  const duplicate = (plan: StudyPlan) => run(plan.id, async () => {
    await studyPlansApi.duplicate(plan.id, `${plan.title} — cópia`);
  });

  const archive = (plan: StudyPlan) => {
    if (window.confirm(`Arquivar o plano "${plan.title}"? Ele poderá ser consultado depois.`)) {
      run(plan.id, () => studyPlansApi.archive(plan.id));
    }
  };

  const remove = (plan: StudyPlan) => {
    if (window.confirm(`Excluir definitivamente o plano "${plan.title}" e seus dados relacionados?`)) {
      run(plan.id, () => studyPlansApi.delete(plan.id));
    }
  };

  const showHistory = async (plan: StudyPlan) => {
    setBusyId(plan.id);
    try {
      setHistoryTitle(plan.title);
      setHistory(await studyPlansApi.history(plan.id));
    } catch (requestError) {
      console.error(requestError);
      setError('Não foi possível carregar o histórico deste plano.');
    } finally { setBusyId(null); }
  };

  return (
    <section className="plan-manager space-y-4" aria-labelledby="server-plans-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 id="server-plans-title" className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" /> Meus planos de estudo
          </h3>
          <p className="text-sm text-slate-500 mt-1">Ative, edite, duplique ou arquive seus cronogramas em um só lugar.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer min-h-11 px-3 rounded-xl bg-white border border-slate-200">
            <input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} className="w-4 h-4 accent-indigo-600" />
            Ver arquivados
          </label>
          <button onClick={loadPlans} aria-label="Atualizar planos" className="w-11 h-11 min-h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="min-h-32 flex items-center justify-center gap-2 text-slate-500"><LoaderCircle className="w-5 h-5 animate-spin" /> Carregando planos...</div>
      ) : plans.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">Nenhum plano salvo no servidor</p>
          <p className="text-sm text-slate-500">Configure um concurso acima para criar seu primeiro plano.</p>
        </div>
      ) : (
        <div className="plan-card-grid grid grid-cols-1 lg:grid-cols-2 gap-3">
          {plans.map(plan => {
            const active = Boolean(plan.is_primary || plan.is_active);
            const archived = plan.status === 'ARCHIVED';
            const busy = busyId === plan.id;
            return (
              <article key={plan.id} className={`bg-white border rounded-2xl p-4 sm:p-5 ${active ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {active && <span className="inline-flex items-center gap-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 px-2 py-1"><Check className="w-3 h-3" /> Principal</span>}
                      {archived && <span className="text-xs font-bold rounded-full bg-slate-100 text-slate-600 px-2 py-1">Arquivado</span>}
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">{plan.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{courseLabel(plan)}</p>
                  </div>
                  {busy && <LoaderCircle className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-600"><CalendarDays className="w-4 h-4" /> Prova: {examDate(plan)}</div>
                <div className="plan-actions flex gap-2 mt-4 pt-4 border-t border-slate-100 overflow-x-auto md:overflow-visible md:flex-wrap">
                  {!active && !archived && <button disabled={busy} onClick={() => activate(plan)} className="plan-action primary"><Play className="w-4 h-4" /> Ativar</button>}
                  {!archived && <button disabled={busy} onClick={() => onEdit?.(plan.course_id || plan.courseId || '')} className="plan-action"><Pencil className="w-4 h-4" /> Editar</button>}
                  {!archived && <button disabled={busy} onClick={() => duplicate(plan)} className="plan-action"><Copy className="w-4 h-4" /> Duplicar</button>}
                  <button disabled={busy} onClick={() => showHistory(plan)} className="plan-action"><History className="w-4 h-4" /> Histórico</button>
                  {!archived && <button disabled={busy} onClick={() => archive(plan)} className="plan-action"><Archive className="w-4 h-4" /> Arquivar</button>}
                  {archived && <button disabled={busy} onClick={() => run(plan.id, () => studyPlansApi.restore(plan.id))} className="plan-action primary"><ArchiveRestore className="w-4 h-4" /> Restaurar</button>}
                  <button disabled={busy} onClick={() => remove(plan)} className="plan-action danger"><Trash2 className="w-4 h-4" /> Excluir</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {history && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 p-4 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[82vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div><h3 id="history-title" className="font-extrabold text-slate-900">Histórico do plano</h3><p className="text-sm text-slate-500 truncate">{historyTitle}</p></div>
              <button onClick={() => setHistory(null)} aria-label="Fechar histórico" className="w-11 h-11 min-h-11 rounded-full flex items-center justify-center bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh] space-y-3">
              {history.length === 0 ? <p className="text-sm text-slate-500">Nenhuma alteração registrada.</p> : history.map((entry, index) => (
                <div key={String(entry.id || index)} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock3 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div><p className="text-sm font-semibold text-slate-800">{String(entry.action || 'ALTERAÇÃO')}</p><p className="text-xs text-slate-500 mt-1">Versão {String(entry.version || '—')} • {entry.changed_at ? new Date(String(entry.changed_at)).toLocaleString('pt-BR') : ''}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

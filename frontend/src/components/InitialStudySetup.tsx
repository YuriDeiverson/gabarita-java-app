import { useMemo, useState } from 'react';
import { Check, Clock3, LoaderCircle } from 'lucide-react';
import { StudyPreferences } from '../careerPlan';

const weekdays = [
  { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' }, { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' }, { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

interface Props {
  initial?: StudyPreferences | null;
  onSave: (preferences: StudyPreferences) => void | Promise<void>;
}

export default function InitialStudySetup({ initial, onSave }: Props) {
  const [selectedDays, setSelectedDays] = useState<number[]>(initial?.selectedWeekdays || [1, 2, 3, 4, 5]);
  const [hours, setHours] = useState<Record<number, number>>(initial?.hoursByWeekday || { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const averageHours = useMemo(() => {
    if (selectedDays.length === 0) return 0;
    return Math.max(1, Math.round(selectedDays.reduce((sum, day) => sum + Number(hours[day] || 1), 0) / selectedDays.length));
  }, [hours, selectedDays]);

  const toggleDay = (day: number) => {
    setSelectedDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
    setHours(current => ({ ...current, [day]: current[day] || 4 }));
  };

  const submit = async () => {
    if (selectedDays.length === 0) {
      setError('Selecione pelo menos um dia disponível para estudar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        selectedWeekdays: [...selectedDays].sort((a, b) => (a || 7) - (b || 7)),
        hoursByWeekday: Object.fromEntries(selectedDays.map(day => [day, Math.max(1, Number(hours[day] || 1))])),
        hoursPerDay: averageHours,
        blockMinutes: 60,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl animate-fade-in space-y-6">
      <header className="rounded-3xl bg-slate-950 px-6 py-8 text-white sm:px-10">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Configuração inicial</span>
        <h2 className="mt-3 text-2xl font-black sm:text-4xl">Quando você pode estudar?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">A data da prova já vem cadastrada em cada concurso. Informe apenas sua disponibilidade; ao escolher a preparação, o cronograma será calculado automaticamente.</p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-8">
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Clock3 className="h-4 w-4 text-indigo-600" /> Disponibilidade de estudo</h3>
            <p className="mt-1 text-xs text-slate-500">Selecione os dias e informe quantas horas possui em cada um.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {weekdays.map(day => {
              const selected = selectedDays.includes(day.value);
              return <div key={day.value} className={`rounded-2xl border p-3 transition ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                <button type="button" onClick={() => toggleDay(day.value)} className="flex w-full items-center justify-between text-sm font-extrabold text-slate-700">
                  {day.label}<span className={`flex h-5 w-5 items-center justify-center rounded-full ${selected ? 'bg-indigo-600 text-white' : 'border border-slate-300'}`}>{selected && <Check className="h-3 w-3" />}</span>
                </button>
                {selected && <label className="mt-3 flex items-center gap-1"><input type="number" min="1" max="24" step="1" value={hours[day.value] || 4} onChange={event => setHours(current => ({ ...current, [day.value]: Number(event.target.value) }))} className="min-w-0 w-full rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-center text-sm font-bold" /><span className="text-xs font-bold text-slate-500">h</span></label>}
              </div>;
            })}
          </div>
        </div>

        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        <button type="button" disabled={saving} onClick={() => void submit()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-64">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Salvando disponibilidade…' : 'Salvar e continuar'}
        </button>
      </div>
    </section>
  );
}

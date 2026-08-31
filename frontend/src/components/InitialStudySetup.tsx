import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  CopyCheck,
  LoaderCircle,
} from "lucide-react";
import { StudyPreferences } from "../careerPlan";
import "./InitialStudySetup.css";

const weekdays = [
  { value: 1, label: "Seg", fullLabel: "Segunda-feira" },
  { value: 2, label: "Ter", fullLabel: "Terça-feira" },
  { value: 3, label: "Qua", fullLabel: "Quarta-feira" },
  { value: 4, label: "Qui", fullLabel: "Quinta-feira" },
  { value: 5, label: "Sex", fullLabel: "Sexta-feira" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
  { value: 0, label: "Dom", fullLabel: "Domingo" },
];

interface Props {
  initial?: StudyPreferences | null;
  onSave: (preferences: StudyPreferences) => void | Promise<void>;
}

type HoursDraft = Record<number, string>;

const isValidHours = (value: string | undefined) => {
  if (!value?.trim() || !/^\d+$/.test(value.trim())) return false;
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 24;
};

const initialHoursDraft = (initial?: StudyPreferences | null): HoursDraft =>
  Object.fromEntries(
    weekdays.map((day) => [
      day.value,
      String(initial?.hoursByWeekday?.[day.value] ?? initial?.hoursPerDay ?? 4),
    ]),
  );

export default function InitialStudySetup({ initial, onSave }: Props) {
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initial?.selectedWeekdays || [1, 2, 3, 4, 5],
  );
  const [hours, setHours] = useState<HoursDraft>(() =>
    initialHoursDraft(initial),
  );
  const [sharedHours, setSharedHours] = useState(
    String(initial?.hoursPerDay ?? 4),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const invalidDays = useMemo(
    () => selectedDays.filter((day) => !isValidHours(hours[day])),
    [hours, selectedDays],
  );
  const formIsValid = selectedDays.length > 0 && invalidDays.length === 0;

  const averageHours = useMemo(() => {
    if (!formIsValid) return 0;
    return Math.max(
      1,
      Math.round(
        selectedDays.reduce((sum, day) => sum + Number(hours[day]), 0) /
          selectedDays.length,
      ),
    );
  }, [formIsValid, hours, selectedDays]);

  const totalWeeklyHours = useMemo(
    () =>
      selectedDays.reduce(
        (sum, day) => sum + (isValidHours(hours[day]) ? Number(hours[day]) : 0),
        0,
      ),
    [hours, selectedDays],
  );

  const toggleDay = (day: number) => {
    setError("");
    if (selectedDays.includes(day)) {
      setSelectedDays((current) => current.filter((item) => item !== day));
      return;
    }

    if (!isValidHours(hours[day])) {
      const fallback = isValidHours(sharedHours) ? sharedHours : "4";
      setHours((current) => ({ ...current, [day]: fallback }));
    }
    setSelectedDays((current) =>
      current.includes(day) ? current : [...current, day],
    );
  };

  const updateDayHours = (day: number, value: string) => {
    setError("");
    setHours((current) => ({ ...current, [day]: value }));
  };

  const applyHoursToSelectedDays = () => {
    if (!isValidHours(sharedHours)) {
      setError("Informe entre 1 e 24 horas para aplicar aos dias selecionados.");
      return;
    }
    if (selectedDays.length === 0) {
      setError("Selecione pelo menos um dia antes de aplicar uma carga horária.");
      return;
    }

    setHours((current) => ({
      ...current,
      ...Object.fromEntries(selectedDays.map((day) => [day, sharedHours])),
    }));
    setError("");
  };

  const submit = async () => {
    if (selectedDays.length === 0) {
      setError("Selecione pelo menos um dia disponível para estudar.");
      return;
    }
    if (invalidDays.length > 0) {
      setError(
        "Preencha todos os dias selecionados com um número inteiro entre 1 e 24.",
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        selectedWeekdays: [...selectedDays].sort(
          (a, b) => (a || 7) - (b || 7),
        ),
        hoursByWeekday: Object.fromEntries(
          selectedDays.map((day) => [day, Number(hours[day])]),
        ),
        hoursPerDay: averageHours,
        blockMinutes: 60,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="initial-study-setup animate-fade-in" aria-labelledby="availability-title">
      <header className="availability-hero">
        <span>Configuração inicial</span>
        <h2 id="availability-title">Quando você pode estudar?</h2>
        <p>
          Selecione seus dias disponíveis e defina a carga diária. Você pode
          aplicar o mesmo número a todos e ajustar apenas as exceções.
        </p>
      </header>

      <div className="availability-panel">
        <div className="availability-panel-heading">
          <div>
            <span className="availability-step">Sua rotina semanal</span>
            <h3>
              <Clock3 aria-hidden="true" /> Disponibilidade de estudo
            </h3>
            <p>Marque os dias em que deseja incluir sessões no cronograma.</p>
          </div>
          <div className="availability-summary" aria-live="polite">
            <strong>{selectedDays.length}</strong>
            <span>{selectedDays.length === 1 ? "dia ativo" : "dias ativos"}</span>
            <i aria-hidden="true" />
            <strong>{totalWeeklyHours}h</strong>
            <span>por semana</span>
          </div>
        </div>

        <div className="availability-bulk-editor">
          <div>
            <CopyCheck aria-hidden="true" />
            <span>
              <strong>Mesma carga todos os dias?</strong>
              <small>Preencha uma vez e aplique aos dias selecionados.</small>
            </span>
          </div>
          <label htmlFor="shared-study-hours">
            <span>Horas por dia</span>
            <div className="availability-hours-input">
              <input
                id="shared-study-hours"
                type="number"
                inputMode="numeric"
                min="1"
                max="24"
                step="1"
                value={sharedHours}
                onChange={(event) => {
                  setSharedHours(event.target.value);
                  setError("");
                }}
                onFocus={(event) => event.currentTarget.select()}
                aria-invalid={!isValidHours(sharedHours)}
                aria-describedby="shared-hours-help"
              />
              <span aria-hidden="true">h</span>
            </div>
          </label>
          <button type="button" onClick={applyHoursToSelectedDays}>
            Aplicar aos selecionados
          </button>
          <small id="shared-hours-help" className="availability-visually-hidden">
            Digite um número inteiro entre 1 e 24.
          </small>
        </div>

        <div className="availability-block-size" aria-label="Ritmo fixo das sessões">
          <div>
            <span>
              <strong>Pomodoro fixo de 1 hora</strong>
              <small>Cada assunto terá 50 minutos de foco e 10 minutos de descanso antes do próximo.</small>
            </span>
          </div>
        </div>

        <fieldset className="availability-days">
          <legend>Escolha os dias e revise as horas</legend>
          <div className="availability-days-grid">
            {weekdays.map((day) => {
              const selected = selectedDays.includes(day.value);
              const invalid = selected && !isValidHours(hours[day.value]);
              const inputId = `study-hours-${day.value}`;
              const errorId = `study-hours-error-${day.value}`;

              return (
                <div
                  key={day.value}
                  className={`availability-day-card ${selected ? "is-selected" : ""} ${invalid ? "is-invalid" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    aria-pressed={selected}
                    aria-label={`${selected ? "Remover" : "Adicionar"} ${day.fullLabel}`}
                    className="availability-day-toggle"
                  >
                    <span>
                      <strong>{day.label}</strong>
                      <small>{day.fullLabel}</small>
                    </span>
                    <i aria-hidden="true">{selected && <Check />}</i>
                  </button>

                  {selected ? (
                    <label className="availability-day-hours" htmlFor={inputId}>
                      <span>Horas disponíveis</span>
                      <div className="availability-hours-input">
                        <input
                          id={inputId}
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="24"
                          step="1"
                          value={hours[day.value] ?? ""}
                          onChange={(event) =>
                            updateDayHours(day.value, event.target.value)
                          }
                          onFocus={(event) => event.currentTarget.select()}
                          aria-invalid={invalid}
                          aria-describedby={invalid ? errorId : undefined}
                        />
                        <span aria-hidden="true">h</span>
                      </div>
                      {invalid && (
                        <small id={errorId} role="alert">
                          Use um número de 1 a 24.
                        </small>
                      )}
                    </label>
                  ) : (
                    <p className="availability-day-off">Dia não incluído</p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="availability-error">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}

        <div className="availability-footer">
          <p>
            {formIsValid ? (
              <>
                <Check aria-hidden="true" /> Disponibilidade pronta para gerar
                seu cronograma.
              </>
            ) : (
              <>
                <AlertCircle aria-hidden="true" /> Revise os campos destacados
                antes de continuar.
              </>
            )}
          </p>
          <button
            type="button"
            disabled={saving}
            aria-disabled={!formIsValid || saving}
            onClick={() => void submit()}
          >
            {saving ? <LoaderCircle className="is-spinning" /> : <Check />}
            {saving
              ? "Salvando disponibilidade…"
              : initial
                ? "Salvar alterações"
                : "Concluir configuração"}
          </button>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { initialScheduleWeeks } from '../data/scheduleData';
import { scheduleApi } from '../services/api';
import { Calendar, Check, Clock, AlertTriangle, Trophy, ChevronDown } from 'lucide-react';

const durationInMinutes = (duration: string) => {
  const hours = Number(duration.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(duration.match(/(?:(?:\d+)h)?(\d+)(?:min)?$/)?.[1] || 0);
  return hours * 60 + minutes;
};

export default function ScheduleTab() {
  const [weeks, setWeeks] = useState(() => {
    const baseWeeks = (() => {
      const custom = localStorage.getItem('custom_schedule_weeks');
      if (custom) {
        try {
          return JSON.parse(custom);
        } catch (e) {}
      }
      return initialScheduleWeeks;
    })();

    const saved = localStorage.getItem('study_schedule_progress');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        return baseWeeks.map((week: any) => ({
          ...week,
          blocks: week.blocks.map((block: any) => ({
            ...block,
            done: !!parsedState[block.id]
          }))
        }));
      } catch (e) {
        console.error('Error loading schedule progress', e);
      }
    }
    return baseWeeks;
  });

  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return weeks[0]?.id || 'all';
    }
    return 'all';
  });
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  const toggleBlockDetails = (blockId: string) => {
    setExpandedBlocks(current => ({ ...current, [blockId]: !current[blockId] }));
  };

  // Load correct custom weeks on mount
  useEffect(() => {
    const baseWeeks = (() => {
      const custom = localStorage.getItem('custom_schedule_weeks');
      if (custom) {
        try {
          return JSON.parse(custom);
        } catch (e) {}
      }
      return initialScheduleWeeks;
    })();

    const saved = localStorage.getItem('study_schedule_progress');
    const parsedState = saved ? JSON.parse(saved) : {};

    setWeeks(baseWeeks.map((week: any) => ({
      ...week,
      blocks: week.blocks.map((block: any) => ({
        ...block,
        done: !!parsedState[block.id]
      }))
    })));

    const config = localStorage.getItem('study_config');
    if (config) {
      try {
        const { studyPlanId } = JSON.parse(config);
        if (studyPlanId && !String(studyPlanId).startsWith('local-')) {
          scheduleApi.getProgress(studyPlanId).then(remoteProgress => {
            const completed = new Set(
              remoteProgress.filter(item => Boolean(item.is_completed)).map(item => String(item.block_id))
            );
            setWeeks(current => current.map(week => ({
              ...week,
              blocks: week.blocks.map(block => ({ ...block, done: completed.has(String(block.id)) }))
            })));
          }).catch(error => console.warn('Progresso remoto indisponível; usando cache local.', error));
        }
      } catch (error) {
        console.warn('Configuração local inválida.', error);
      }
    }
  }, []);

  // Sync checkboxes to localStorage as a key-value object of blockId -> boolean
  useEffect(() => {
    const progressState: { [key: string]: boolean } = {};
    weeks.forEach(week => {
      week.blocks.forEach(block => {
        if (block.done) {
          progressState[block.id] = true;
        }
      });
    });
    localStorage.setItem('study_schedule_progress', JSON.stringify(progressState));
  }, [weeks]);

  const toggleBlock = async (weekId: string, blockId: string) => {
    const newDoneState = !weeks.find(w => w.id === weekId)?.blocks.find(b => b.id === blockId)?.done;

    setWeeks(prevWeeks => 
      prevWeeks.map(week => {
        if (week.id !== weekId) return week;
        return {
          ...week,
          blocks: week.blocks.map(block => {
            if (block.id !== blockId) return block;
            return { ...block, done: !block.done };
          })
        };
      })
    );

    // Save to API if study plan ID exists
    const config = localStorage.getItem('study_config');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.studyPlanId && !String(parsed.studyPlanId).startsWith('local-')) {
          await scheduleApi.saveProgress({
            studyPlanId: parsed.studyPlanId,
            blockId,
            isCompleted: newDoneState
          });
        }
      } catch (error) {
        console.error('Error saving schedule progress:', error);
      }
    }
  };

  // Calculate dynamic info tags
  const examConfig = useMemo(() => {
    const savedConfig = localStorage.getItem('study_config');
    let examDateStr = '2026-08-15';
    let daysStr = '20';
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.examDate) {
          const parts = parsed.examDate.split('-');
          if (parts.length === 3) {
            examDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            examDateStr = parsed.examDate;
          }
        }
        if (parsed.totalDays) daysStr = String(parsed.totalDays);
      } catch (e) {}
    } else {
      examDateStr = '26/07/2026';
      daysStr = '25';
    }

    const currentCourse = localStorage.getItem('active_course') || 'seplag_informatica';
    const courseName = currentCourse === 'tecnico_enfermagem' 
      ? 'Técnico de Enfermagem' 
      : currentCourse === 'jornalismo' 
        ? 'Jornalismo' 
        : 'SEPLAG/AL - Informática';

    return { examDateStr, daysStr, courseName };
  }, []);

  // Calculate global schedule statistics
  const stats = useMemo(() => {
    let totalBlocks = 0;
    let completedBlocks = 0;
    let totalHours = 0;
    let completedHours = 0;

    weeks.forEach(week => {
      week.blocks.forEach(block => {
        const hours = durationInMinutes(block.duration) / 60;
        totalBlocks++;
        totalHours += hours;

        if (block.done) {
          completedBlocks++;
          completedHours += hours;
        }
      });
    });

    const percentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

    return {
      totalBlocks,
      completedBlocks,
      totalHours,
      completedHours,
      percentage
    };
  }, [weeks]);

  // Filter weeks to render
  const filteredWeeks = useMemo(() => {
    if (activeWeekId === 'all') return weeks;
    return weeks.filter(w => w.id === activeWeekId);
  }, [weeks, activeWeekId]);

  return (
    <div id="schedule-tab-container" className="schedule-layout space-y-7">
      {/* Overview Dashboard */}
      <div className="schedule-overview grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        {/* Progress Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Cronograma linear
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe suas metas até a prova em {examConfig.examDateStr}.
            </p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600 font-medium">Progresso de Estudos</span>
              <span className="font-extrabold text-indigo-600">{stats.percentage}% Concluído</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="schedule-stats grid grid-cols-3 gap-3">
            <div className="schedule-stat-total bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] text-indigo-800 font-bold block uppercase tracking-wider">Carga Horária Total</span>
              <span className="text-lg font-extrabold text-indigo-900 font-mono">{stats.totalHours}h</span>
            </div>
            <div className="schedule-stat-studied bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">Horas Estudadas</span>
              <span className="text-lg font-extrabold text-emerald-900 font-mono">{stats.completedHours}h</span>
            </div>
            <div className="schedule-stat-goals bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Metas Cumpridas</span>
              <span className="text-lg font-extrabold text-slate-800 font-mono">{stats.completedBlocks} / {stats.totalBlocks}</span>
            </div>
          </div>
        </div>

        {/* Tactical Banner */}
        <div className="schedule-tip bg-indigo-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <Trophy className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-extrabold bg-amber-500 text-amber-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Estratégia de Reta Final
            </span>
            <h3 className="text-base font-bold text-white mt-2">Dica de Sucesso</h3>
            <p className="text-xs text-indigo-200 leading-relaxed mt-1">
              "Para garantir os 80% necessários para a aprovação, siga à risca a proporção por bloco: <strong>30% Teoria sínpótica, 50% Exercícios resolvidos, e 20% Revisão mental ativa</strong>. Deixar de responder questões é o principal motivo de reprovações."
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-200 bg-white/5 p-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Estudo Ativo Ativado: {examConfig.daysStr} dias planejados!</span>
          </div>
        </div>
      </div>

      {/* Week Navigation Selector */}
      <div className="schedule-week-nav flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setActiveWeekId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeWeekId === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          Todas as Semanas
        </button>
        {weeks.map(week => (
          <button
            key={week.id}
            onClick={() => setActiveWeekId(week.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeWeekId === week.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            {week.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Week Timeline and study goals */}
      <div className="schedule-weeks-list space-y-5">
        {filteredWeeks.map(week => {
          const completedInWeek = week.blocks.filter(b => b.done).length;
          const totalInWeek = week.blocks.length;
          const weekPercentage = totalInWeek > 0 ? Math.round((completedInWeek / totalInWeek) * 100) : 0;

          return (
            <div 
              key={week.id} 
              id={`week-card-${week.id}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
              {/* Week Header */}
              <div className="schedule-week-header bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {week.dateRange}
                    </span>
                    <h3 className="font-bold text-sm lg:text-base text-slate-800">{week.title}</h3>
                  </div>
                  <p className="week-focus text-xs text-slate-500 leading-relaxed">{week.focus}</p>
                </div>

                {/* Week Progress */}
                <div className="week-progress flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">Meta Semana</span>
                    <span className="text-xs font-bold text-slate-700">{completedInWeek} / {totalInWeek} concluídos ({weekPercentage}%)</span>
                  </div>
                  <div className="schedule-week-ring w-12 h-12 rounded-full border-4 border-slate-200 relative flex items-center justify-center font-bold text-[10px] text-slate-700">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-indigo-600"
                      style={{ 
                        clipPath: `inset(0 0 0 0)`, // simple indicator, or keep standard border
                        opacity: weekPercentage > 0 ? 1 : 0.2
                      }}
                    ></div>
                    {weekPercentage}%
                  </div>
                </div>
              </div>

              {/* Study Blocks List */}
              <div className="p-6 divide-y divide-slate-100">
                {week.blocks.map((block, blockIndex) => (
                  <div key={block.id} className="schedule-block-wrapper">
                  {(blockIndex === 0 || week.blocks[blockIndex - 1]?.date !== block.date) && (
                    <div className="schedule-day-header py-4 first:pt-2 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-indigo-900 capitalize">{block.day || 'Dia de estudo'}</h4>
                        <p className="text-xs text-slate-500">{block.date}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                        {(week.blocks.filter(item => item.date === block.date).reduce((total, item) => total + durationInMinutes(item.duration), 0) / 60).toLocaleString('pt-BR')}h planejadas
                      </span>
                    </div>
                  )}
                  <div 
                    id={`block-row-${block.id}`}
                    className={`py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start justify-between gap-4 transition-colors ${
                      block.done ? 'bg-slate-50/10' : ''
                    }`}
                  >
                    {/* Checkbox and core title */}
                    <div className="schedule-task-main flex items-start gap-4 grow min-w-0">
                      <button
                        id={`chk-${block.id}`}
                        onClick={() => toggleBlock(week.id, block.id)}
                        aria-label={block.done ? `Marcar ${block.title} como pendente` : `Marcar ${block.title} como concluído`}
                        className={`checklist-control mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          block.done 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {block.done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold ${block.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {block.title}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {block.duration}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBlockDetails(block.id)}
                          aria-expanded={!!expandedBlocks[block.id]}
                          aria-controls={`block-details-${block.id}`}
                          className="block-details-toggle text-sm font-semibold text-indigo-700 items-center gap-1"
                        >
                          {expandedBlocks[block.id] ? 'Ocultar atividades' : 'Ver atividades'}
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedBlocks[block.id] ? 'rotate-180' : ''}`} />
                        </button>

                        {/* List of subtopics */}
                        <div
                          id={`block-details-${block.id}`}
                          className={`block-subtopics flex flex-wrap gap-1.5 ${expandedBlocks[block.id] ? 'is-expanded' : ''}`}
                        >
                          {block.subtopics.map((sub, index) => (
                            <span 
                              key={index} 
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                block.done
                                  ? 'bg-slate-50 text-slate-400 border-slate-100 line-through'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Methodology information */}
                    <div className={`block-methodology flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto shrink-0 gap-2 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0 ${expandedBlocks[block.id] ? 'is-expanded' : ''}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Método de Estudo</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        block.done
                          ? 'bg-slate-50 text-slate-400 border-slate-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                      }`}>
                        {block.methodology}
                      </span>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

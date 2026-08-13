import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Layers3,
  Lightbulb,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import './PerformanceTab.css';

interface TopicStat {
  topic: string;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
  studied_seconds?: number;
}

interface AreaStat {
  area: string;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
  studied_seconds?: number;
}

interface DayStat {
  day: string;
  answered: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

interface EvolutionPoint extends DayStat {
  label: string;
  description: string;
}

interface Dashboard {
  periodDays: number;
  summary: {
    answered: number;
    correct: number;
    wrong: number;
    accuracy: number;
    total_time_seconds?: number;
    study_seconds?: number;
    question_practice_seconds?: number;
    simulation_seconds?: number;
    session_questions?: number;
    question_bank_answered?: number;
    simulation_answered?: number;
    study_sessions?: number;
    question_sessions?: number;
    simulation_sessions?: number;
  };
  evolution: DayStat[];
  byArea?: AreaStat[];
  strongAreas?: AreaStat[];
  weakAreas?: AreaStat[];
  byTopic: TopicStat[];
  strongTopics: TopicStat[];
  weakTopics: TopicStat[];
  recommendation?: TopicStat | null;
}

type TopicOrder = 'errors' | 'accuracy' | 'volume';

const number = (value: unknown) => Number(value || 0);
const percent = (value: unknown) => Math.max(0, Math.min(100, number(value)));
const timeLabel = (seconds: unknown) => {
  const minutes = Math.round(number(seconds) / 60);
  if (minutes < 60) return `${minutes} min`;
  const remaining = minutes % 60;
  return `${Math.floor(minutes / 60)}h${remaining ? ` ${remaining}min` : ''}`;
};
const dateLabel = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const periodOptions = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
  { days: 365, label: '1 ano' },
];

function evolutionGranularity(period: number) {
  if (period <= 30) return { unit: 'day', label: 'dia' } as const;
  if (period <= 180) return { unit: 'week', label: 'semana' } as const;
  return { unit: 'month', label: 'mês' } as const;
}

function aggregateEvolution(items: DayStat[], period: number): EvolutionPoint[] {
  const granularity = evolutionGranularity(period);
  if (granularity.unit === 'day')
    return items.map(item => ({
      ...item,
      label: dateLabel(item.day),
      description: new Date(`${item.day}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }),
    }));

  const groups = new Map<
    string,
    { day: string; answered: number; correct: number; wrong: number; label: string; description: string }
  >();
  items.forEach(item => {
    const date = new Date(`${item.day}T00:00:00`);
    let key: string;
    let label: string;
    let description: string;
    if (granularity.unit === 'week') {
      const mondayOffset = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - mondayOffset);
      key = date.toISOString().slice(0, 10);
      label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      description = `Semana iniciada em ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
    } else {
      date.setDate(1);
      key = date.toISOString().slice(0, 7);
      label = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      description = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    const group = groups.get(key) || { day: key, answered: 0, correct: 0, wrong: 0, label, description };
    group.answered += number(item.answered);
    group.correct += number(item.correct);
    group.wrong += number(item.wrong);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(group => ({
      ...group,
      accuracy: group.answered ? (group.correct / group.answered) * 100 : 0,
    }));
}

export default function PerformanceTab() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<Dashboard | null>(null);
  const [topicOrder, setTopicOrder] = useState<TopicOrder>('errors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      let activePlanId: string | null = null;
      try {
        activePlanId = JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || null;
      } catch {
        // Um plano ausente apenas amplia a análise para todo o histórico do usuário.
      }
      setData(await analyticsApi.dashboard(period, activePlanId));
    } catch (requestError) {
      setData(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Erro ao carregar o desempenho. Tente novamente mais tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const summary = data?.summary;
  const trend = useMemo(() => {
    const activeDays = (data?.evolution || []).filter(day => number(day.answered) > 0);
    if (activeDays.length < 2) return null;
    return number(activeDays.at(-1)?.accuracy) - number(activeDays[0].accuracy);
  }, [data]);

  const orderedTopics = useMemo(() => {
    const items = [...(data?.byTopic || [])];
    if (topicOrder === 'errors')
      return items.sort((a, b) => number(b.wrong) - number(a.wrong) || number(a.accuracy) - number(b.accuracy));
    if (topicOrder === 'volume') return items.sort((a, b) => number(b.answered) - number(a.answered));
    return items.sort((a, b) => number(b.accuracy) - number(a.accuracy) || number(b.answered) - number(a.answered));
  }, [data, topicOrder]);

  if (loading && !data) return <PerformanceSkeleton />;

  const hasActivity = summary && (number(summary.answered) > 0 || number(summary.total_time_seconds) > 0);
  const strongAreas = data?.strongAreas || data?.byArea || [];
  const weakAreas = data?.weakAreas || [];

  return (
    <div id="performance-tab-container" className="performance-v2">
      <header className="performance-v2-header">
        <div>
          <span className="performance-v2-eyebrow">
            <Activity size={14} /> Análise de desempenho
          </span>
          <h2>Entenda onde você avança e onde precisa revisar</h2>
          <p>Resultados de sessões, questões e simulados reunidos em uma leitura simples do seu progresso.</p>
        </div>
        <div className="performance-v2-periods" aria-label="Período analisado">
          {periodOptions.map(option => (
            <button
              type="button"
              key={option.days}
              aria-pressed={period === option.days}
              onClick={() => setPeriod(option.days)}
            >
              {option.label}
            </button>
          ))}
          <button type="button" className="performance-v2-refresh" onClick={load} aria-label="Atualizar desempenho">
            <RefreshCw size={17} className={loading ? 'performance-v2-spinning' : ''} />
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="performance-v2-error">
          {error}
        </div>
      )}

      {!hasActivity ? (
        <EmptyPerformance />
      ) : (
        <>
          <div className="performance-v2-overview">
            <div className="performance-v2-score-card">
              <div className="performance-v2-score-copy">
                <span>Aproveitamento geral</span>
                <strong>{percent(summary.accuracy).toFixed(0)}%</strong>
                <Trend value={trend} />
              </div>
              <AccuracyRing value={percent(summary.accuracy)} />
            </div>

            <div className="performance-v2-metrics">
              <Metric
                label="Questões respondidas"
                value={number(summary.answered)}
                detail={`${number(summary.correct)} acertos no período`}
                icon={<BookOpenCheck />}
                tone="blue"
              />
              <Metric
                label="Total de acertos"
                value={number(summary.correct)}
                detail={`${percent(summary.accuracy).toFixed(0)}% de aproveitamento`}
                icon={<CheckCircle2 />}
                tone="green"
              />
              <Metric
                label="Pontos para revisar"
                value={number(summary.wrong)}
                detail="erros identificados"
                icon={<AlertTriangle />}
                tone="red"
              />
              <Metric
                label="Tempo de preparação"
                value={timeLabel(summary.total_time_seconds)}
                detail={`${number(summary.study_sessions) + number(summary.question_sessions)} sessões concluídas`}
                icon={<Clock3 />}
                tone="amber"
              />
            </div>
          </div>

          {data?.recommendation && (
            <div className="performance-v2-recommendation">
              <div className="performance-v2-recommendation-icon">
                <Lightbulb size={22} />
              </div>
              <div>
                <span>Prioridade de revisão</span>
                <h3>{data.recommendation.topic}</h3>
                <p>
                  {number(data.recommendation.wrong)} erros em {number(data.recommendation.answered)} respostas. Retome
                  o conteúdo e faça uma nova sequência de questões.
                </p>
              </div>
              <div className="performance-v2-recommendation-rate">
                <strong>{percent(data.recommendation.accuracy).toFixed(0)}%</strong>
                <span>de acertos</span>
              </div>
            </div>
          )}

          <div className="performance-v2-main-grid">
            <div className="performance-v2-panel performance-v2-evolution">
              <PanelHeading
                icon={<TrendingUp />}
                title="Evolução do aproveitamento"
                subtitle={`Resultados agrupados por ${evolutionGranularity(period).label}`}
              />
              <EvolutionChart items={data?.evolution || []} period={period} />
            </div>
            <div className="performance-v2-panel performance-v2-snapshot">
              <PanelHeading icon={<BarChart3 />} title="Resumo do período" subtitle="Distribuição das suas respostas" />
              <AnswerDistribution correct={number(summary.correct)} wrong={number(summary.wrong)} />
              <div className="performance-v2-snapshot-numbers">
                <div>
                  <span className="is-correct" /> <strong>{number(summary.correct)}</strong>
                  <small>acertos</small>
                </div>
                <div>
                  <span className="is-wrong" /> <strong>{number(summary.wrong)}</strong>
                  <small>erros</small>
                </div>
              </div>
            </div>
          </div>

          <div className="performance-v2-area-grid">
            <AreaRanking mode="strong" items={strongAreas} />
            <AreaRanking mode="weak" items={weakAreas} />
          </div>

          <div className="performance-v2-topic-grid">
            <TopicHighlights
              title="Assuntos dominados"
              subtitle="Melhor aproveitamento com volume registrado"
              items={data?.strongTopics || []}
              tone="strong"
            />
            <TopicHighlights
              title="Assuntos que mais geram erros"
              subtitle="Ordenados pela quantidade de respostas incorretas"
              items={data?.weakTopics || []}
              tone="weak"
            />
          </div>

          <div className="performance-v2-panel performance-v2-topic-table">
            <div className="performance-v2-table-header">
              <PanelHeading
                icon={<Layers3 />}
                title="Todos os assuntos"
                subtitle="Compare volume, acertos e erros em cada conteúdo"
              />
              <div className="performance-v2-sort" aria-label="Ordenar assuntos">
                <button type="button" aria-pressed={topicOrder === 'errors'} onClick={() => setTopicOrder('errors')}>
                  Mais erros
                </button>
                <button
                  type="button"
                  aria-pressed={topicOrder === 'accuracy'}
                  onClick={() => setTopicOrder('accuracy')}
                >
                  Aproveitamento
                </button>
                <button type="button" aria-pressed={topicOrder === 'volume'} onClick={() => setTopicOrder('volume')}>
                  Volume
                </button>
              </div>
            </div>
            <div className="performance-v2-topic-rows">
              {orderedTopics.map(item => (
                <TopicRow key={item.topic} item={item} />
              ))}
            </div>
          </div>

          <div className="performance-v2-sources" aria-label="Origem dos resultados">
            <SourceMetric
              title="Estudo por assunto"
              value={`${number(summary.study_sessions)} sessões`}
              detail={`${timeLabel(summary.study_seconds)} · ${number(summary.session_questions)} questões`}
            />
            <SourceMetric
              title="Banco de questões"
              value={`${number(summary.question_bank_answered)} respostas`}
              detail={`${number(summary.question_sessions)} sessões · ${timeLabel(summary.question_practice_seconds)}`}
            />
            <SourceMetric
              title="Simulados"
              value={`${number(summary.simulation_answered)} respostas`}
              detail={`${number(summary.simulation_sessions)} simulados · ${timeLabel(summary.simulation_seconds)}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="performance-v2-skeleton" role="status" aria-label="Calculando seu desempenho">
      <span className="sr-only">Calculando seu desempenho...</span>
      <div className="performance-v2-skeleton-line is-title" />
      <div className="performance-v2-skeleton-line is-subtitle" />
      <div className="performance-v2-skeleton-cards">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} />
        ))}
      </div>
      <div className="performance-v2-skeleton-panel" />
    </div>
  );
}

function EmptyPerformance() {
  return (
    <div className="performance-v2-empty">
      <div>
        <Target size={28} />
      </div>
      <h3>Seu painel começa com a primeira sessão</h3>
      <p>Inicie o timer ou responda questões para acompanhar tempo, acertos e evolução por área e assunto.</p>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={`performance-v2-metric is-${tone}`}>
      <div className="performance-v2-metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function AccuracyRing({ value }: { value: number }) {
  return (
    <div className="performance-v2-ring" role="img" aria-label={`${value.toFixed(0)}% de aproveitamento`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="performance-v2-ring-track" cx="60" cy="60" r="49" pathLength="100" />
        <circle
          className="performance-v2-ring-value"
          cx="60"
          cy="60"
          r="49"
          pathLength="100"
          strokeDasharray={`${value} ${100 - value}`}
        />
      </svg>
      <Target size={25} />
    </div>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <small>Continue respondendo para gerar uma tendência</small>;
  const positive = value >= 0;
  return (
    <small className={positive ? 'is-positive' : 'is-negative'}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value).toFixed(0)} pontos desde o início do período
    </small>
  );
}

function PanelHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="performance-v2-panel-heading">
      <div>{icon}</div>
      <span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </span>
    </div>
  );
}

function EvolutionChart({ items, period }: { items: DayStat[]; period: number }) {
  const pointsToRender = aggregateEvolution(items, period);
  if (!pointsToRender.length)
    return <div className="performance-v2-no-data">Ainda não há respostas neste período.</div>;

  const width = 760;
  const height = 250;
  const left = 42;
  const right = 18;
  const top = 18;
  const bottom = 42;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const x = (index: number) =>
    pointsToRender.length === 1 ? left + innerWidth / 2 : left + (index / (pointsToRender.length - 1)) * innerWidth;
  const y = (accuracy: number) => top + ((100 - percent(accuracy)) / 100) * innerHeight;
  const points = pointsToRender.map((item, index) => `${x(index)},${y(number(item.accuracy))}`).join(' ');
  const area = `${x(0)},${top + innerHeight} ${points} ${x(pointsToRender.length - 1)},${top + innerHeight}`;
  const labelEvery = Math.max(1, Math.ceil(pointsToRender.length / 7));

  return (
    <div className="performance-v2-chart-wrap">
      <svg
        className="performance-v2-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="evolution-chart-title evolution-chart-description"
      >
        <title id="evolution-chart-title">Evolução diária do aproveitamento</title>
        <desc id="evolution-chart-description">
          Gráfico de linha responsivo com a porcentagem de acertos agrupada conforme o período selecionado.
        </desc>
        <defs>
          <linearGradient id="performance-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[100, 75, 50, 25, 0].map(tick => {
          const tickY = y(tick);
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={tickY} y2={tickY} className="performance-v2-chart-grid" />
              <text x={left - 8} y={tickY + 4} textAnchor="end" className="performance-v2-chart-axis">
                {tick}%
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#performance-area-gradient)" />
        <polyline points={points} className="performance-v2-chart-line" />
        {pointsToRender.map((item, index) => (
          <g key={item.day}>
            <circle cx={x(index)} cy={y(number(item.accuracy))} r="4" className="performance-v2-chart-point">
              <title>
                {item.description}: {number(item.accuracy).toFixed(0)}% em {number(item.answered)} respostas
              </title>
            </circle>
            {(index % labelEvery === 0 || index === pointsToRender.length - 1) && (
              <text x={x(index)} y={height - 14} textAnchor="middle" className="performance-v2-chart-axis">
                {item.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function AnswerDistribution({ correct, wrong }: { correct: number; wrong: number }) {
  const total = Math.max(1, correct + wrong);
  const correctWidth = (correct / total) * 100;
  const style = { '--correct-width': `${correctWidth}%` } as CSSProperties;
  return (
    <div
      className="performance-v2-distribution"
      style={style}
      role="img"
      aria-label={`${correct} acertos e ${wrong} erros`}
    >
      <div className="performance-v2-distribution-correct" />
      <div className="performance-v2-distribution-wrong" />
    </div>
  );
}

function AreaRanking({ mode, items }: { mode: 'strong' | 'weak'; items: AreaStat[] }) {
  const isStrong = mode === 'strong';
  const maximum = Math.max(1, ...items.map(item => number(isStrong ? item.correct : item.wrong)));
  return (
    <div className={`performance-v2-panel performance-v2-ranking is-${mode}`}>
      <PanelHeading
        icon={isStrong ? <Award /> : <AlertTriangle />}
        title={isStrong ? 'Áreas com mais acertos' : 'Áreas com mais erros'}
        subtitle={isStrong ? 'Onde você acumula mais respostas corretas' : 'Onde a revisão terá maior impacto'}
      />
      {!items.length ? (
        <div className="performance-v2-no-data">Responda mais questões para gerar este ranking.</div>
      ) : (
        <div className="performance-v2-ranking-list">
          {items.slice(0, 5).map((item, index) => {
            const metric = number(isStrong ? item.correct : item.wrong);
            return (
              <div className="performance-v2-ranking-row" key={item.area}>
                <span className="performance-v2-rank">{index + 1}</span>
                <div className="performance-v2-ranking-content">
                  <div className="performance-v2-ranking-label">
                    <strong>{item.area}</strong>
                    <span>{percent(item.accuracy).toFixed(0)}% de acertos</span>
                  </div>
                  <div className="performance-v2-ranking-track">
                    <i style={{ width: `${Math.max(5, (metric / maximum) * 100)}%` }} />
                  </div>
                  <small>
                    {metric} {isStrong ? 'acertos' : 'erros'} em {number(item.answered)} respostas
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopicHighlights({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: TopicStat[];
  tone: 'strong' | 'weak';
}) {
  return (
    <div className={`performance-v2-panel performance-v2-highlights is-${tone}`}>
      <PanelHeading icon={tone === 'strong' ? <Award /> : <AlertTriangle />} title={title} subtitle={subtitle} />
      {!items.length ? (
        <div className="performance-v2-no-data">Responda mais questões para gerar esta análise.</div>
      ) : (
        <div className="performance-v2-highlight-list">
          {items.slice(0, 5).map(item => (
            <div key={item.topic}>
              <span className="performance-v2-highlight-icon">
                {tone === 'strong' ? <CheckCircle2 size={16} /> : <Target size={16} />}
              </span>
              <span className="performance-v2-highlight-name">
                <strong>{item.topic}</strong>
                <small>
                  {number(item.correct)} acertos · {number(item.wrong)} erros
                </small>
              </span>
              <strong className="performance-v2-highlight-rate">{percent(item.accuracy).toFixed(0)}%</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicRow({ item }: { item: TopicStat }) {
  const accuracy = percent(item.accuracy);
  const tone = accuracy >= 70 ? 'good' : accuracy >= 50 ? 'medium' : 'weak';
  return (
    <div className="performance-v2-topic-row">
      <div className="performance-v2-topic-name">
        <strong>{item.topic}</strong>
        <small>
          {number(item.answered)} respostas
          {number(item.studied_seconds) > 0 ? ` · ${timeLabel(item.studied_seconds)} de estudo` : ''}
        </small>
      </div>
      <div className="performance-v2-topic-results">
        <span>
          <i className="is-correct" /> {number(item.correct)} acertos
        </span>
        <span>
          <i className="is-wrong" /> {number(item.wrong)} erros
        </span>
      </div>
      <div className={`performance-v2-topic-accuracy is-${tone}`}>
        <div>
          <i style={{ width: `${accuracy}%` }} />
        </div>
        <strong>{accuracy.toFixed(0)}%</strong>
      </div>
    </div>
  );
}

function SourceMetric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="performance-v2-source">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

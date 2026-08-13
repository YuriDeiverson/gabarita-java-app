import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle,
  Lightbulb,
  ListFilter,
  LoaderCircle,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { catalogApi, SharedStudySubject, studyPlansApi } from '../services/api';
import { ActiveStudyContext, findContextCard, normalizeStudyText } from '../studyContext';
import { StudyCard, StudySection } from '../types';

interface StudyTabProps {
  studyContext?: ActiveStudyContext | null;
  onCurrentActivityComplete?: () => void;
}

const settingsObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.value === 'string') return settingsObject(record.value);
    if (record.value && typeof record.value === 'object') {
      return settingsObject(record.value);
    }
    return record;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {}
  }
  return {};
};

const mergeSharedStudyLibrary = (current: StudySection[], library: SharedStudySubject[]): StudySection[] =>
  current.map(section => ({
    ...section,
    cards: section.cards.map(card => {
      const shared = library.find(item => normalizeStudyText(item.title) === normalizeStudyText(card.title));
      return shared
        ? {
            ...card,
            content: shared.content,
            keyTakeaways: shared.keyTakeaways,
            studyObjective: shared.studyObjective,
            reviewSummary: shared.reviewSummary,
            contentBlocks: shared.contentBlocks,
          }
        : card;
    }),
  }));

const distinctPoints = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter(value => {
    const text = value.trim();
    const key = normalizeStudyText(text);
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const applicationGuide = (discipline: string, subject: string) => {
  const normalized = normalizeStudyText(`${discipline} ${subject}`);
  if (/(raciocinio|matematica|estatistica|contabilidade|calculo)/.test(normalized)) {
    return 'Separe os dados do enunciado, escreva a regra que será usada e só então faça o cálculo. Ao final, confira se o resultado responde exatamente ao que foi perguntado.';
  }
  if (/(direito|legislacao|lei|norma|etica)/.test(normalized)) {
    return 'Identifique quem pratica a conduta, qual regra se aplica, em que condição ela vale e qual é a consequência. Isso evita decorar artigos de forma isolada.';
  }
  if (/(lingua|portugues|ingles|redacao|jornalismo)/.test(normalized)) {
    return 'Localize as palavras-chave do comando, volte ao trecho ou à regra pertinente e justifique a resposta com uma evidência do texto — não apenas pela impressão de leitura.';
  }
  if (/(tecnologia|informacao|sistema|seguranca|dados|informatica)/.test(normalized)) {
    return 'Comece pelo problema que o conceito resolve. Depois relacione seus componentes, benefícios, limitações e um caso de uso prático antes de escolher a alternativa.';
  }
  return 'Comece identificando o conceito central, relacione-o a uma situação prática e confirme se a conclusão atende exatamente ao comando da questão.';
};

export default function StudyTab({ studyContext, onCurrentActivityComplete }: StudyTabProps) {
  const [sections, setSections] = useState<StudySection[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeCardId, setActiveCardId] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [completedCards, setCompletedCards] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('completed_study_cards') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let active = true;
    setContentLoading(true);
    Promise.allSettled([studyPlansApi.getActive(), catalogApi.studyLibrary()])
      .then(([planResult, libraryResult]) => {
        if (!active) return;
        const remote =
          planResult.status === 'fulfilled' ? settingsObject(planResult.value.settings).studySections : null;
        if (!Array.isArray(remote)) {
          setContentError('O plano ativo ainda não possui material cadastrado.');
          setSections([]);
          return;
        }
        const merged =
          libraryResult.status === 'fulfilled'
            ? mergeSharedStudyLibrary(remote as StudySection[], libraryResult.value)
            : (remote as StudySection[]);
        setSections(merged);
        setContentError('');
      })
      .catch(() => {
        if (active) setContentError('Erro ao carregar o material. Tente novamente mais tarde.');
      })
      .finally(() => {
        if (active) setContentLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const contextMatch = useMemo(() => findContextCard(sections, studyContext), [sections, studyContext]);

  useEffect(() => {
    if (contextMatch) {
      setActiveSectionId(contextMatch.section.id);
      setActiveCardId(contextMatch.card.id);
      return;
    }
    if (!activeSectionId && sections[0]) {
      setActiveSectionId(sections[0].id);
      setActiveCardId(sections[0].cards[0]?.id || '');
    }
  }, [contextMatch?.section.id, contextMatch?.card.id, sections]);

  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [filterOpen]);

  const activeSection = useMemo(
    () => sections.find(section => section.id === activeSectionId) || sections[0],
    [activeSectionId, sections]
  );
  const activeCard = useMemo<StudyCard | undefined>(
    () => activeSection?.cards.find(card => card.id === activeCardId) || activeSection?.cards[0],
    [activeCardId, activeSection]
  );
  const completedCount = Object.values(completedCards).filter(Boolean).length;
  const totalCards = sections.reduce((total, section) => total + section.cards.length, 0);

  const selectSection = (sectionId: string) => {
    const next = sections.find(section => section.id === sectionId);
    setActiveSectionId(sectionId);
    setActiveCardId(next?.cards[0]?.id || '');
  };
  const selectCard = (cardId: string) => {
    setActiveCardId(cardId);
    setFilterOpen(false);
  };
  const completeCurrent = () => {
    if (!activeCard) return;
    setCompletedCards(current => {
      const updated = { ...current, [activeCard.id]: true };
      localStorage.setItem('completed_study_cards', JSON.stringify(updated));
      return updated;
    });
    if (activeCard.id === contextMatch?.card.id) onCurrentActivityComplete?.();
  };

  if (contentLoading) {
    return (
      <div
        className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-center"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="h-6 w-6 animate-spin text-indigo-600" aria-hidden="true" />
        <div>
          <strong className="text-sm font-extrabold text-slate-800">Carregando seu material</strong>
          <p className="mt-1 text-xs text-slate-500">Sincronizando o conteúdo do plano ativo…</p>
        </div>
      </div>
    );
  }

  if (!activeSection || !activeCard) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
        <p className="text-sm text-slate-500">{contentError || 'Nenhum material disponível no plano atual.'}</p>
      </div>
    );
  }

  const isCompleted = Boolean(completedCards[activeCard.id]);
  const contentBlocks = activeCard.contentBlocks || [];
  const objective =
    activeCard.studyObjective?.trim() ||
    `Compreender ${activeCard.title} e aplicar os conceitos com segurança em questões de prova.`;
  const reviewPoints = distinctPoints([...(activeCard.reviewSummary || []), ...(activeCard.keyTakeaways || [])]).slice(
    0,
    3
  );
  const fallbackMiniQuestions = [
    {
      prompt: `Sem consultar o texto, explique qual habilidade você precisa desenvolver em “${activeCard.title}”.`,
      answer: objective,
    },
    {
      prompt: `Qual é o conceito ou cuidado mais importante deste assunto?`,
      answer:
        reviewPoints[0] ||
        'Retome o conceito central, identifique seus elementos e relacione-os ao comando da questão.',
    },
    {
      prompt: 'Como você verificaria se uma alternativa está correta antes de marcá-la?',
      answer: reviewPoints[1] || applicationGuide(activeSection.title, activeCard.title),
    },
  ];
  const materialMiniQuestions = contentBlocks
    .flatMap(block => block.miniQuestions || [])
    .filter(question => question.prompt?.trim() && question.answer?.trim())
    .slice(0, 3);
  const miniQuestions = materialMiniQuestions.length > 0 ? materialMiniQuestions : fallbackMiniQuestions;

  return (
    <div id="study-tab-container" className="study-layout">
      <section className="study-reader-shell">
        <header className="study-reader-header">
          <div className="study-reader-title">
            <span>{activeSection.title}</span>
            <h2>{activeCard.title}</h2>
            <p>
              {completedCount} de {totalCards} assuntos concluídos
              {contentBlocks.length > 0 ? ` · ${contentBlocks.length} capítulo(s) complementar(es)` : ''}
            </p>
          </div>
          <div className="study-reader-actions" ref={filterRef}>
            <button
              type="button"
              className="study-reader-filter-button"
              onClick={() => setFilterOpen(open => !open)}
              aria-label="Filtrar caderno de leitura"
              aria-expanded={filterOpen}
              title="Filtrar caderno de leitura"
            >
              <ListFilter />
            </button>
            {filterOpen && (
              <div className="study-reader-filter-popover">
                <div>
                  <strong>Escolher assunto</strong>
                  <button type="button" onClick={() => setFilterOpen(false)} aria-label="Fechar filtro">
                    <X />
                  </button>
                </div>
                <label>
                  <span>Disciplina</span>
                  <select value={activeSection.id} onChange={event => selectSection(event.target.value)}>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Assunto</span>
                  <select value={activeCard.id} onChange={event => selectCard(event.target.value)}>
                    {activeSection.cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </header>

        <article className="study-reader-scroll" aria-label={activeCard.title}>
          <section className="study-reader-learning-path" aria-label="Roteiro de estudo">
            <div>
              <span>Objetivo do estudo</span>
              <h3>Ao final desta sessão, você deverá conseguir:</h3>
              <p>{objective}</p>
            </div>
            <ol>
              <li>Leia a explicação e destaque os termos que determinam a regra ou o conceito.</li>
              <li>Use o exemplo guiado para transformar a teoria em um raciocínio de prova.</li>
              <li>Responda às miniquestões antes de revelar a correção.</li>
            </ol>
          </section>

          <div className="study-reader-rich-content" dangerouslySetInnerHTML={{ __html: activeCard.content }} />

          <section className="study-reader-example" aria-label="Exemplo guiado">
            <strong>
              <Lightbulb /> Exemplo guiado de aplicação
            </strong>
            <p>
              Imagine uma questão cobrando <b>{activeCard.title}</b>. Antes de olhar as alternativas, explique com suas
              palavras qual conceito resolve o problema e procure no enunciado a evidência que sustenta essa escolha.
            </p>
            <p>{applicationGuide(activeSection.title, activeCard.title)}</p>
          </section>

          {contentBlocks.map((block, index) => (
            <section className="study-reader-chapter" key={block.id || index}>
              <span>Capítulo {index + 1}</span>
              <h3>{block.title}</h3>
              <div className="study-reader-plain-content">{block.content}</div>
              {Boolean(block.keyTakeaways?.length) && (
                <div className="study-reader-key-points">
                  <strong>
                    <Zap /> Pontos-chave deste capítulo
                  </strong>
                  <ul>
                    {block.keyTakeaways?.map((point, pointIndex) => (
                      <li key={pointIndex}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}

          {reviewPoints.length > 0 && (
            <aside className="study-reader-key-points">
              <strong>
                <Target /> Pontos-chave para revisar
              </strong>
              <ul>
                {reviewPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </aside>
          )}

          <section className="study-reader-mini-questions" aria-label="Miniquestões de fixação">
            <header>
              <div>
                <strong>
                  <Brain /> Miniquestões de fixação
                </strong>
                <p>Tente responder primeiro. A correção comentada está disponível logo abaixo de cada questão.</p>
              </div>
              <span>3 questões</span>
            </header>
            <div>
              {miniQuestions.map((question, index) => (
                <article key={question.prompt}>
                  <span>Questão {index + 1}</span>
                  <p>{question.prompt}</p>
                  <details>
                    <summary>Conferir resposta comentada</summary>
                    <p>{question.answer}</p>
                  </details>
                </article>
              ))}
            </div>
          </section>
        </article>

        <footer className="study-reader-footer">
          <button type="button" className={isCompleted ? 'is-completed' : ''} onClick={completeCurrent}>
            {isCompleted ? <CheckCircle /> : <Check />}
            {isCompleted
              ? 'Assunto concluído'
              : activeCard.id === contextMatch?.card.id
                ? 'Concluir e iniciar revisão'
                : 'Marcar assunto como concluído'}
            {!isCompleted && activeCard.id === contextMatch?.card.id && <ArrowRight />}
          </button>
          <BookOpen aria-hidden="true" />
        </footer>
      </section>
    </div>
  );
}

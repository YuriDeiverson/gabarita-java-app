import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  CheckCircle,
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
  onCurrentActivityComplete?: () => Promise<void> | void;
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
      const shared =
        library.find(item => card.sharedSubjectId && item.id === card.sharedSubjectId) ||
        library.find(
          item =>
            normalizeStudyText(item.title) === normalizeStudyText(card.title) &&
            normalizeStudyText(item.discipline) === normalizeStudyText(section.title)
        );
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
    if (typeof value !== 'string') return false;
    const text = value.trim();
    const key = normalizeStudyText(text);
    if (!text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sanitizeStudyHtml = (html: string) => {
  if (!html || typeof document === 'undefined') return '';
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set(['P', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'BR', 'CODE', 'BLOCKQUOTE']);
  const blockedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'FORM', 'INPUT', 'BUTTON']);
  [...template.content.querySelectorAll('*')].forEach(element => {
    if (blockedTags.has(element.tagName)) {
      element.remove();
      return;
    }
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
  });
  return template.innerHTML;
};

const genericMaterialMarkers = [
  'integra a disciplina',
  'deve ser estudado como uma ferramenta',
  'conecte o problema resolvido aos componentes',
  'desenhe uma cadeia de entrada processamento saida e controle',
  'imagine uma questao cobrando',
];

const isGenericMaterial = (content: string) => {
  const normalized = normalizeStudyText(content.replace(/<[^>]+>/g, ' '));
  return !normalized || genericMaterialMarkers.some(marker => normalized.includes(normalizeStudyText(marker)));
};

export default function StudyTab({ studyContext, onCurrentActivityComplete }: StudyTabProps) {
  const [sections, setSections] = useState<StudySection[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeCardId, setActiveCardId] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [completionBusy, setCompletionBusy] = useState(false);
  const [completionError, setCompletionError] = useState('');
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
  const completeCurrent = async () => {
    if (!activeCard || completedCards[activeCard.id] || completionBusy) return;
    setCompletionBusy(true);
    setCompletionError('');
    try {
      if (activeCard.id === contextMatch?.card.id) await onCurrentActivityComplete?.();
      setCompletedCards(current => {
        const updated = { ...current, [activeCard.id]: true };
        localStorage.setItem('completed_study_cards', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Não foi possível concluir este assunto.');
    } finally {
      setCompletionBusy(false);
    }
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
  const materialUnavailable = isGenericMaterial(activeCard.content);
  const contentBlocks = materialUnavailable ? [] : (activeCard.contentBlocks || []);
  const objective =
    activeCard.studyObjective?.trim() ||
    `Compreender ${activeCard.title} e aplicar os conceitos com segurança em questões de prova.`;
  const reviewPoints = materialUnavailable
    ? []
    : distinctPoints([...(activeCard.reviewSummary || []), ...(activeCard.keyTakeaways || [])]).slice(0, 3);
  const materialMiniQuestions = contentBlocks
    .flatMap(block => block.miniQuestions || [])
    .filter(question => question?.prompt?.trim() && question?.answer?.trim())
    .slice(0, 3);
  const miniQuestions = materialMiniQuestions;
  const safeBaseContent = materialUnavailable ? '' : sanitizeStudyHtml(activeCard.content);

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
          {!materialUnavailable && <section className="study-reader-learning-path" aria-label="Roteiro de estudo">
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
          </section>}

          {materialUnavailable ? (
            <section className="study-reader-example" role="status">
              <strong>Material editorial em revisão</strong>
              <p>Este assunto ainda não possui explicação factual suficiente para ser apresentado como aula.</p>
            </section>
          ) : (
            <div className="study-reader-rich-content" dangerouslySetInnerHTML={{ __html: safeBaseContent }} />
          )}

          {contentBlocks.map((block, index) => (
            <section className="study-reader-chapter" key={block.id || index}>
              <span>Capítulo {index + 1}</span>
              <h3>{block.title}</h3>
              <div
                className="study-reader-plain-content"
                dangerouslySetInnerHTML={{ __html: sanitizeStudyHtml(block.content) }}
              />
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

          {miniQuestions.length > 0 && <section className="study-reader-mini-questions" aria-label="Miniquestões de fixação">
            <header>
              <div>
                <strong>
                  <Brain /> Miniquestões de fixação
                </strong>
                <p>Tente responder primeiro. A correção comentada está disponível logo abaixo de cada questão.</p>
              </div>
              <span>{miniQuestions.length} {miniQuestions.length === 1 ? 'questão' : 'questões'}</span>
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
          </section>}
        </article>

        <footer className="study-reader-footer">
          <button
            type="button"
            className={isCompleted ? 'is-completed' : ''}
            disabled={completionBusy || materialUnavailable}
            onClick={completeCurrent}
          >
            {isCompleted ? <CheckCircle /> : <Check />}
            {isCompleted
              ? 'Assunto concluído'
              : completionBusy
                ? 'Finalizando…'
                : activeCard.id === contextMatch?.card.id
                  ? 'Concluir assunto'
                  : 'Marcar assunto como concluído'}
          </button>
          {completionError && <p role="alert" className="text-xs text-rose-700">{completionError}</p>}
          <BookOpen aria-hidden="true" />
        </footer>
      </section>
    </div>
  );
}

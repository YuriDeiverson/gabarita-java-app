import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  ListFilter,
  Target,
  X,
  Zap,
} from "lucide-react";
import { studySections as fallbackStudySections } from "../data/studyData";
import { catalogApi, SharedStudySubject, studyPlansApi } from "../services/api";
import { ActiveStudyContext, findContextCard, normalizeStudyText } from "../studyContext";
import { StudyCard, StudySection } from "../types";

interface StudyTabProps {
  studyContext?: ActiveStudyContext | null;
  onCurrentActivityComplete?: () => void;
}

const initialSections = (): StudySection[] => {
  try {
    const saved = localStorage.getItem("custom_study_sections");
    if (saved) return JSON.parse(saved) as StudySection[];
  } catch (error) {
    console.warn("Não foi possível abrir o caderno salvo.", error);
  }
  return fallbackStudySections;
};

const settingsObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {}
  }
  return {};
};

const mergeCurrentPlanContent = (
  current: StudySection[],
  remote: StudySection[],
): StudySection[] =>
  current.map((section) => {
    const remoteSection = remote.find(
      (item) =>
        item.id === section.id ||
        normalizeStudyText(item.title) === normalizeStudyText(section.title),
    );
    if (!remoteSection) return section;
    return {
      ...section,
      cards: section.cards.map((card) => {
        const remoteCard = remoteSection.cards.find(
          (item) =>
            item.id === card.id ||
            normalizeStudyText(item.title) === normalizeStudyText(card.title),
        );
        return remoteCard
          ? {
              ...card,
              content:
                typeof remoteCard.content === "string"
                  ? remoteCard.content
                  : card.content,
              keyTakeaways: Array.isArray(remoteCard.keyTakeaways)
                ? remoteCard.keyTakeaways
                : card.keyTakeaways,
              contentBlocks: remoteCard.contentBlocks || card.contentBlocks || [],
            }
          : card;
      }),
    };
  });

const mergeSharedStudyLibrary = (
  current: StudySection[],
  library: SharedStudySubject[],
): StudySection[] =>
  current.map((section) => ({
    ...section,
    cards: section.cards.map((card) => {
      const shared = library.find(
        (item) => normalizeStudyText(item.title) === normalizeStudyText(card.title),
      );
      return shared
        ? {
            ...card,
            content: shared.content,
            keyTakeaways: shared.keyTakeaways,
            contentBlocks: shared.contentBlocks,
          }
        : card;
    }),
  }));

export default function StudyTab({
  studyContext,
  onCurrentActivityComplete,
}: StudyTabProps) {
  const [sections, setSections] = useState<StudySection[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [activeCardId, setActiveCardId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [completedCards, setCompletedCards] = useState<Record<string, boolean>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem("completed_study_cards") || "{}");
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    let active = true;
    Promise.allSettled([studyPlansApi.getActive(), catalogApi.studyLibrary()])
      .then(([planResult, libraryResult]) => {
        if (!active) return;
        setSections((current) => {
          const remote =
            planResult.status === "fulfilled"
              ? settingsObject(planResult.value.settings).studySections
              : null;
          const fromPlan = Array.isArray(remote)
            ? mergeCurrentPlanContent(current, remote as StudySection[])
            : current;
          const merged =
            libraryResult.status === "fulfilled"
              ? mergeSharedStudyLibrary(fromPlan, libraryResult.value)
              : fromPlan;
          localStorage.setItem("custom_study_sections", JSON.stringify(merged));
          return merged;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const contextMatch = useMemo(
    () => findContextCard(sections, studyContext),
    [sections, studyContext],
  );

  useEffect(() => {
    if (contextMatch) {
      setActiveSectionId(contextMatch.section.id);
      setActiveCardId(contextMatch.card.id);
      return;
    }
    if (!activeSectionId && sections[0]) {
      setActiveSectionId(sections[0].id);
      setActiveCardId(sections[0].cards[0]?.id || "");
    }
  }, [contextMatch?.section.id, contextMatch?.card.id, sections]);

  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0],
    [activeSectionId, sections],
  );
  const activeCard = useMemo<StudyCard | undefined>(
    () =>
      activeSection?.cards.find((card) => card.id === activeCardId) ||
      activeSection?.cards[0],
    [activeCardId, activeSection],
  );
  const completedCount = Object.values(completedCards).filter(Boolean).length;
  const totalCards = sections.reduce((total, section) => total + section.cards.length, 0);

  const selectSection = (sectionId: string) => {
    const next = sections.find((section) => section.id === sectionId);
    setActiveSectionId(sectionId);
    setActiveCardId(next?.cards[0]?.id || "");
  };
  const selectCard = (cardId: string) => {
    setActiveCardId(cardId);
    setFilterOpen(false);
  };
  const completeCurrent = () => {
    if (!activeCard) return;
    setCompletedCards((current) => {
      const updated = { ...current, [activeCard.id]: true };
      localStorage.setItem("completed_study_cards", JSON.stringify(updated));
      return updated;
    });
    if (activeCard.id === contextMatch?.card.id) onCurrentActivityComplete?.();
  };

  if (!activeSection || !activeCard) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
        <p className="text-sm text-slate-500">Nenhum material disponível no plano atual.</p>
      </div>
    );
  }

  const isCompleted = Boolean(completedCards[activeCard.id]);
  const contentBlocks = activeCard.contentBlocks || [];

  return (
    <div id="study-tab-container" className="study-layout">
      <section className="study-reader-shell">
        <header className="study-reader-header">
          <div className="study-reader-title">
            <span>{activeSection.title}</span>
            <h2>{activeCard.title}</h2>
            <p>
              {completedCount} de {totalCards} assuntos concluídos
              {contentBlocks.length > 0
                ? ` · ${contentBlocks.length} capítulo(s) complementar(es)`
                : ""}
            </p>
          </div>
          <div className="study-reader-actions" ref={filterRef}>
            <button
              type="button"
              className="study-reader-filter-button"
              onClick={() => setFilterOpen((open) => !open)}
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
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    aria-label="Fechar filtro"
                  >
                    <X />
                  </button>
                </div>
                <label>
                  <span>Disciplina</span>
                  <select
                    value={activeSection.id}
                    onChange={(event) => selectSection(event.target.value)}
                  >
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Assunto</span>
                  <select
                    value={activeCard.id}
                    onChange={(event) => selectCard(event.target.value)}
                  >
                    {activeSection.cards.map((card) => (
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
          <div
            className="study-reader-rich-content"
            dangerouslySetInnerHTML={{ __html: activeCard.content }}
          />

          {contentBlocks.map((block, index) => (
            <section className="study-reader-chapter" key={block.id || index}>
              <span>Capítulo {index + 1}</span>
              <h3>{block.title}</h3>
              <div className="study-reader-plain-content">{block.content}</div>
              {Boolean(block.keyTakeaways?.length) && (
                <div className="study-reader-key-points">
                  <strong><Zap /> Pontos-chave deste capítulo</strong>
                  <ul>
                    {block.keyTakeaways?.map((point, pointIndex) => (
                      <li key={pointIndex}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}

          {activeCard.keyTakeaways.length > 0 && (
            <aside className="study-reader-key-points">
              <strong><Target /> Pontos-chave do assunto</strong>
              <ul>
                {activeCard.keyTakeaways.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </aside>
          )}
        </article>

        <footer className="study-reader-footer">
          <button
            type="button"
            className={isCompleted ? "is-completed" : ""}
            onClick={completeCurrent}
          >
            {isCompleted ? <CheckCircle /> : <Check />}
            {isCompleted
              ? "Assunto concluído"
              : activeCard.id === contextMatch?.card.id
                ? "Concluir e iniciar revisão"
                : "Marcar assunto como concluído"}
            {!isCompleted && activeCard.id === contextMatch?.card.id && <ArrowRight />}
          </button>
          <BookOpen aria-hidden="true" />
        </footer>
      </section>
    </div>
  );
}

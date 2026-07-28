import { useState, useMemo, useEffect, useRef } from 'react';
import { studySections } from '../data/studyData';
import { BookOpen, Cpu, Shield, MapPin, Terminal, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, HelpCircle, Clock, Target, Zap, ArrowRight, MoveHorizontal } from 'lucide-react';
import { ActiveStudyContext, findContextCard } from '../studyContext';

interface StudyTabProps { studyContext?:ActiveStudyContext|null; onCurrentActivityComplete?:()=>void; }

export default function StudyTab({studyContext,onCurrentActivityComplete}:StudyTabProps) {
  const sections = useMemo(() => {
    const saved = localStorage.getItem('custom_study_sections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return studySections;
  }, []);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sectionFiltersRef=useRef<HTMLDivElement>(null);

  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [completedCards, setCompletedCards] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('completed_study_cards');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(()=>{
    const activeButton=sectionFiltersRef.current?.querySelector<HTMLElement>('[data-section-active="true"]');
    activeButton?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },[activeSectionId]);

  const iconMap: { [key: string]: any } = {
    BookOpen: BookOpen,
    Cpu: Cpu,
    Shield: Shield,
    MapPin: MapPin,
    Terminal: Terminal,
  };

  const colorMap: { [key: string]: { border: string, bg: string, text: string, hover: string, activeBg: string } } = {
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-50',
      activeBg: 'bg-emerald-600 text-white'
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-50',
      activeBg: 'bg-blue-600 text-white'
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-50',
      activeBg: 'bg-amber-500 text-white'
    },
    rose: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      hover: 'hover:bg-rose-50',
      activeBg: 'bg-rose-600 text-white'
    },
    slate: {
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      hover: 'hover:bg-slate-50',
      activeBg: 'bg-slate-700 text-white'
    }
  };

  const contextMatch=useMemo(()=>findContextCard(sections,studyContext),[sections,studyContext]);

  useEffect(()=>{
    if(!contextMatch)return;
    setActiveSectionId(contextMatch.section.id);
    setExpandedCards(current=>({...current,[contextMatch.card.id]:true}));
    window.setTimeout(()=>document.getElementById(`card-${contextMatch.card.id}`)?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  },[contextMatch?.section.id,contextMatch?.card.id]);

  const activeSection = useMemo(() => {
    const currentId = activeSectionId || contextMatch?.section.id || (sections[0] ? sections[0].id : '');
    return sections.find(s => s.id === currentId) || sections[0];
  }, [activeSectionId, contextMatch, sections]);

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleComplete = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const completing=!completedCards[cardId];
    setCompletedCards(prev => {
      const updated = { ...prev, [cardId]: !prev[cardId] };
      localStorage.setItem('completed_study_cards', JSON.stringify(updated));
      return updated;
    });
    if(completing&&cardId===contextMatch?.card.id)onCurrentActivityComplete?.();
  };

  const completeCurrentContent=(cardId:string)=>{
    setCompletedCards(prev=>{
      const updated={...prev,[cardId]:true};
      localStorage.setItem('completed_study_cards',JSON.stringify(updated));
      return updated;
    });
    onCurrentActivityComplete?.();
  };

  const completedCount = Object.values(completedCards).filter(Boolean).length;
  const totalCards = sections.reduce((acc, section) => acc + section.cards.length, 0);
  const progressPercent = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;

  const filteredCards = activeSection?.cards || [];

  if (sections.length === 0 || !activeSection) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
        <p className="text-slate-500 text-sm">Nenhum assunto disponível no cronograma ativo atual. Crie um novo plano na página inicial!</p>
      </div>
    );
  }

  return (
    <div id="study-tab-container" className="study-layout space-y-7">
      {studyContext&&<div className="session-context-banner"><Target aria-hidden="true"/><div><span>CONTEÚDO DA SESSÃO ATUAL</span><strong>{studyContext.topicTitle}</strong><p>{studyContext.subjectName} · este resumo foi aberto automaticamente</p></div></div>}
      {/* Subject Selector and Search Row */}
      <div className="study-filter-shell bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="study-filter-heading flex items-center justify-between gap-3 mb-3">
          <div><p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Caderno de leitura</p><p className="text-sm text-slate-500 mt-0.5">Escolha uma disciplina e avance pelos resumos em sequência.</p></div>
          <BookOpen className="w-5 h-5 text-indigo-300 shrink-0" />
        </div>
        <div className="study-filter-row">
        <div ref={sectionFiltersRef} className="study-section-filters" role="tablist" aria-label="Disciplinas do caderno de leitura">
          {sections.map(section => {
            const IconComponent = iconMap[section.icon] || HelpCircle;
            const colors = colorMap[section.color] || colorMap.slate;
            const isActive = section.id === activeSection.id;
            const isContextSection = !contextMatch || section.id===contextMatch.section.id;

            return (
              <button
                key={section.id}
                id={`btn-tab-${section.id}`}
                role="tab"
                aria-selected={isActive}
                data-section-active={isActive}
                onClick={() => {
                  setActiveSectionId(section.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${!isContextSection?'study-context-muted':''} ${
                  isActive 
                    ? colors.activeBg + ' shadow-sm'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{section.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 font-bold">
                  {section.weight}
                </span>
              </button>
            );
          })}
        </div>
        <p className="study-filter-scroll-hint"><MoveHorizontal aria-hidden="true"/> Deslize para ver todas as disciplinas</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="study-progress-panel bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">Progresso Geral</span>
          </div>
          <span className="text-sm font-bold text-emerald-600">{completedCount}/{totalCards} ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Section Header */}
      <div className="study-section-panel bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                activeSection.difficulty === 'Fácil' ? 'bg-emerald-100 text-emerald-700' :
                activeSection.difficulty === 'Médio' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {activeSection.difficulty}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-200 text-slate-700 rounded-full">
                {activeSection.weight}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">{activeSection.title}</h2>
            <p className="text-sm text-slate-600 line-clamp-2">{activeSection.paretoJustification}</p>
          </div>
          <div className="hidden sm:block">
            <Zap className="w-8 h-8 text-amber-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Study Notes List */}
      <div className="study-notes-list space-y-3">
        {filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">Nenhum resumo disponível para esta disciplina.</p>
          </div>
        ) : (
          filteredCards.map(card => {
            const isExpanded = !!expandedCards[card.id];
            const isCompleted = !!completedCards[card.id];
            const colors = colorMap[activeSection.color];
            const isContextCard=!contextMatch||card.id===contextMatch.card.id;

            return (
              <div 
                key={card.id} 
                id={`card-${card.id}`}
                className={`study-context-card bg-white rounded-lg border transition-all ${!isContextCard?'is-context-muted':'is-context-current'} ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
                } ${isExpanded ? 'shadow-sm' : 'shadow-xs'}`}
              >
                {/* Card Header (Clickable) */}
                <div 
                  onClick={() => toggleCard(card.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`study-card-content-${card.id}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleCard(card.id);
                    }
                  }}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => toggleComplete(card.id, e)}
                      aria-label={isCompleted ? `Marcar ${card.title} como pendente` : `Marcar ${card.title} como concluído`}
                      className={`checklist-control flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {isCompleted && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm truncate ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                      }`}>
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {card.isQuente && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded" aria-label="Assunto de alta prioridade">
                        <Zap className="w-3 h-3" />
                        Prioritário
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Card Expandable Body */}
                {isExpanded && (
                  <div id={`study-card-content-${card.id}`} className="border-t border-slate-100 p-4 bg-white">
                    {/* Content */}
                    <div 
                      className="text-sm text-slate-600 leading-relaxed mb-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-slate-800"
                      dangerouslySetInnerHTML={{ __html: card.content }}
                    />

                    {/* Key Takeaways - Simplified */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pontos Chave</span>
                      </div>
                      <ul className="space-y-1">
                        {card.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {studyContext&&card.id===contextMatch?.card.id&&<button type="button" onClick={()=>completeCurrentContent(card.id)} className="mt-4 w-full min-h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors">Concluir e iniciar revisão <ArrowRight className="w-4 h-4"/></button>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import { quizQuestions } from '../data/quizData';
import { QuestionCategory, Question } from '../types';
import { passages } from '../data/passagesData';
import { questionsApi, quizProgressApi } from '../services/api';
import { CheckCircle2, XCircle, Award, Filter, Sparkles, AlertCircle, Info } from 'lucide-react';

export default function QuizTab() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('custom_quiz_questions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return quizQuestions;
  }, []);

  const [answers, setAnswers] = useState<{ [key: string]: 'Certo' | 'Errado' }>(() => {
    const saved = localStorage.getItem('quiz_answers');
    return saved ? JSON.parse(saved) : {};
  });

  const [scoreMode, setScoreMode] = useState<'tradicional' | 'simples'>(() => {
    const saved = localStorage.getItem('quiz_score_mode');
    return (saved as 'tradicional' | 'simples') || 'tradicional';
  });

  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | 'Todos'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Respondidas' | 'Não Respondidas' | 'Corretas' | 'Incorretas' | 'Anuladas'>('Todos');
  const [expandedPassages, setExpandedPassages] = useState<{ [key: string]: boolean }>({});
  const [visibleQuestions, setVisibleQuestions] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const courseId = localStorage.getItem('active_course');
    if (!courseId) return;
    questionsApi.forCourse(courseId).then(remoteQuestions => {
      if (remoteQuestions.length > 0) {
        setQuestions(remoteQuestions);
        localStorage.setItem('active_quiz_questions_cache', JSON.stringify(remoteQuestions));
      }
    }).catch(error => console.warn('Banco de questões indisponível; usando conteúdo offline.', error));
  }, []);

  // Sync answers with localStorage
  useEffect(() => {
    localStorage.setItem('quiz_answers', JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const config = localStorage.getItem('study_config');
    if (!config) return;
    try {
      const { studyPlanId } = JSON.parse(config);
      if (!studyPlanId || String(studyPlanId).startsWith('local-')) return;
      quizProgressApi.getByStudyPlan(studyPlanId).then(progress => {
        const remoteAnswers: { [key: string]: 'Certo' | 'Errado' } = {};
        progress.forEach(item => {
          const questionId = String(item.question_id);
          if (item.answer === 'Certo' || item.answer === 'Errado') {
            remoteAnswers[questionId] = item.answer;
          }
        });
        setAnswers(current => ({ ...current, ...remoteAnswers }));
      }).catch(error => console.warn('Respostas remotas indisponíveis; usando cache local.', error));
    } catch (error) {
      console.warn('Configuração local inválida.', error);
    }
  }, []);

  // Sync scoreMode with localStorage
  useEffect(() => {
    localStorage.setItem('quiz_score_mode', scoreMode);
  }, [scoreMode]);

  useEffect(() => {
    setVisibleQuestions(10);
  }, [categoryFilter, statusFilter]);

  const handleAnswer = async (questionId: number | string, option: 'Certo' | 'Errado') => {
    const question = questions.find(q => String(q.id) === String(questionId));
    if (!question) return;
    if (question.correct === 'Anulada') return;

    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));

    try {
      const savedHistory = JSON.parse(localStorage.getItem('quiz_answer_history') || '{}');
      savedHistory[String(questionId)] = { answer: option, answeredAt: new Date().toISOString() };
      localStorage.setItem('quiz_answer_history', JSON.stringify(savedHistory));
      const events = JSON.parse(localStorage.getItem('quiz_answer_events') || '[]');
      let planId = null;
      try { planId = JSON.parse(localStorage.getItem('study_config') || '{}').studyPlanId || null; } catch {}
      events.push({ questionId: String(questionId), answer: option, answeredAt: new Date().toISOString(), planId, courseId: localStorage.getItem('active_course') });
      localStorage.setItem('quiz_answer_events', JSON.stringify(events.slice(-5000)));
    } catch (error) {
      console.warn('Não foi possível atualizar o histórico local da resposta.', error);
    }

    // Save to API if study plan ID exists
    const config = localStorage.getItem('study_config');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        if (parsed.studyPlanId && !String(parsed.studyPlanId).startsWith('local-')) {
          const isCorrect = option === question.correct;
          await quizProgressApi.create({
            studyPlanId: parsed.studyPlanId,
            questionId,
            answer: option,
            isCorrect
          });
        }
      } catch (error) {
        console.error('Error saving quiz progress:', error);
      }
    }
  };

  const togglePassage = (questionId: number | string) => {
    setExpandedPassages(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleReset = async () => {
    if (window.confirm(`Tem certeza que deseja reiniciar todo o simulado com as ${questions.length} questões? Seu progresso atual será apagado.`)) {
      setAnswers({});
      setExpandedPassages({});
      localStorage.removeItem('quiz_answers');
      localStorage.removeItem('quiz_answer_history');
      localStorage.removeItem('quiz_answer_events');
      try {
        const config = JSON.parse(localStorage.getItem('study_config') || '{}');
        if (config.studyPlanId && !String(config.studyPlanId).startsWith('local-')) {
          await quizProgressApi.deleteByStudyPlan(config.studyPlanId);
        }
      } catch (error) {
        console.warn('O simulado local foi reiniciado, mas o progresso remoto não foi removido.', error);
      }
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const validQuestions = questions.filter(q => q.correct !== 'Anulada');
    const total = validQuestions.length;
    const answeredCount = Object.keys(answers).filter(id => {
      const question = questions.find(q => String(q.id) === id);
      return question && question.correct !== 'Anulada';
    }).length;
    let correctCount = 0;
    let incorrectCount = 0;

    validQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer) {
        if (userAnswer === q.correct) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    // CEBRASPE Score Formula: Correct - Incorrect (minimum 0)
    const cebraspeScore = Math.max(0, correctCount - incorrectCount);
    const simpleScore = correctCount;

    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const cebraspePercentage = total > 0 ? Math.round((cebraspeScore / total) * 100) : 0;

    return {
      total,
      answeredCount,
      correctCount,
      incorrectCount,
      cebraspeScore,
      simpleScore,
      percentage,
      cebraspePercentage,
      unansweredCount: total - answeredCount
    };
  }, [answers, questions]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Category filter
      const categoryMatch = categoryFilter === 'Todos' || categoryFilter === 'All' || q.category === categoryFilter;

      // Status filter
      let statusMatch = true;
      const userAnswer = answers[q.id];
      const isAnnulled = q.correct === 'Anulada';
      const isCorrect = !isAnnulled && userAnswer === q.correct;

      if (statusFilter === 'Respondidas') {
        statusMatch = !isAnnulled && !!userAnswer;
      } else if (statusFilter === 'Não Respondidas') {
        statusMatch = !isAnnulled && !userAnswer;
      } else if (statusFilter === 'Corretas') {
        statusMatch = !!userAnswer && isCorrect;
      } else if (statusFilter === 'Incorretas') {
        statusMatch = !isAnnulled && !!userAnswer && !isCorrect;
      } else if (statusFilter === 'Anuladas') {
        statusMatch = isAnnulled;
      }

      return categoryMatch && statusMatch;
    });
  }, [categoryFilter, statusFilter, answers, questions]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleQuestions >= filteredQuestions.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleQuestions(current => Math.min(current + 10, filteredQuestions.length));
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleQuestions, filteredQuestions.length]);

  // Performance Vibe Level
  const performanceVibe = useMemo(() => {
    const currentScore = scoreMode === 'tradicional' ? stats.cebraspePercentage : stats.percentage;
    if (stats.answeredCount === 0) return { title: 'Inicie o Simulado', color: 'text-slate-500', desc: 'Responda as questões para avaliar seu nível.' };
    if (currentScore >= 80) return { title: 'Excelente! Nível Aprovado (80%+)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Sua pontuação estimada garante 80%+ de aproveitamento. Excelente ritmo!' };
    if (currentScore >= 60) return { title: 'Bom Desempenho (60% a 79%)', color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Ritmo sólido, mas preste atenção nas questões erradas que anulam as certas.' };
    return { title: 'Precisa Ajustar (<60%)', color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Abaixo da nota de corte estimada. Revise os resumos na aba Estudar.' };
  }, [stats, scoreMode]);

  return (
    <div id="quiz-tab-container" className="space-y-6">
      {/* Quiz Header & Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="quiz-heading flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Simulador de Questões CEBRASPE
              </h2>
              <p className="text-xs text-slate-500">Avalie seu nível de prontidão com {questions.length} questões focadas no edital.</p>
            </div>
            <button id="btn-reset-quiz" onClick={handleReset} className="shrink-0 text-xs flex items-center justify-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition cursor-pointer">Resetar</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-xs text-slate-500 block">Respondidas</span>
              <span className="text-xl font-bold text-slate-800">{stats.answeredCount} / {stats.total}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-center">
              <span className="text-xs text-emerald-800 font-bold">Acertos</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {Object.keys(answers).filter(id => {
                  const q = questions.find(q => String(q.id) === id);
                  return q && q.correct !== 'Anulada' && answers[id] === q.correct;
                }).length}
              </p>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg text-center">
              <span className="font-bold text-rose-800 text-xs">Erros</span>
              <p className="text-rose-600 mt-1 text-xl font-bold font-mono">
                {Object.keys(answers).filter(id => {
                  const q = questions.find(q => String(q.id) === id);
                  return q && q.correct !== 'Anulada' && answers[id] !== q.correct;
                }).length}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="font-bold text-slate-800 text-xs">Aproveitamento</span>
              <p className="text-slate-900 mt-1 text-base font-bold">
                {stats.answeredCount > 0
                  ? Math.round(
                      (Object.keys(answers).filter(id => {
                        const q = questions.find(q => String(q.id) === id);
                        return q && q.correct !== 'Anulada' && answers[id] === q.correct;
                      }).length /
                        stats.answeredCount) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* CEBRASPE Scoring Mode Selector */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-slate-600">
                <strong>Método de Pontuação:</strong> No estilo CEBRASPE tradicional, cada erro anula um acerto (peso -1).
              </p>
            </div>
            <div className="flex bg-slate-200 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setScoreMode('tradicional')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${scoreMode === 'tradicional' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                CEBRASPE (-1)
              </button>
              <button
                onClick={() => setScoreMode('simples')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${scoreMode === 'simples' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Direto (+1)
              </button>
            </div>
          </div>
        </div>

        {/* Score Estimator / Cut-off Badge */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-slate-800">
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <Award className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-slate-300 font-bold tracking-wider uppercase">Pontuação Estimada</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                {scoreMode === 'tradicional' ? stats.cebraspeScore : stats.simpleScore}
              </span>
              <span className="text-slate-400 text-sm">/ {stats.total} pts</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              {scoreMode === 'tradicional' 
                ? 'Nota líquida calculada no critério padrão CEBRASPE (Acertos menos Erros).'
                : 'Nota direta (apenas acertos contabilizados, erros não anulam).'}
            </p>
          </div>

          <div className={`mt-4 p-3 rounded-xl border relative z-10 text-xs ${performanceVibe.color}`}>
            <p className="font-bold">{performanceVibe.title}</p>
            <p className="mt-0.5 text-slate-500 leading-relaxed">{performanceVibe.desc}</p>
          </div>
        </div>
      </div>

      {/* Question Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtros do Simulado:</span>
        </div>

        <div className="flex flex-wrap gap-2 grow justify-start md:justify-end">
          {/* Category Selector */}
          <select
            id="select-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          >
            <option value="Todos">Todas as Disciplinas</option>
            {Array.from(new Set(questions.map(q => q.category))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Respondidas">Respondidas</option>
            <option value="Não Respondidas">Não Respondidas</option>
            <option value="Corretas">Corretas</option>
            <option value="Incorretas">Incorretas</option>
            <option value="Anuladas">Anuladas</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-grid space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <p className="text-slate-500 text-sm">Nenhuma questão encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          filteredQuestions.slice(0, visibleQuestions).map((q, index) => {
            const userAnswer = answers[q.id];
            const isAnswered = !!userAnswer;
            const isAnnulled = q.correct === 'Anulada';
            const isCorrect = !isAnnulled && userAnswer === q.correct;

            return (
              <div
                key={q.id}
                id={`q-card-${q.id}`}
                className={`bg-white rounded-xl shadow-xs border transition-all overflow-hidden ${
                  isAnnulled
                    ? 'border-amber-200 bg-amber-50/20'
                    : isAnswered
                    ? isCorrect
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header info */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">Questão {index + 1} de {filteredQuestions.length}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {q.category}
                    </span>
                    {q.passageId && (
                      <button
                        id={`btn-toggle-passage-${q.id}`}
                        onClick={() => togglePassage(q.id)}
                        className="inline-flex items-center justify-center font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs border border-indigo-200 transition cursor-pointer gap-1"
                        title={expandedPassages[q.id] ? "Ocultar Texto Completo" : "Mostrar Texto Completo"}
                      >
                        <span className="text-xs leading-none font-bold">{expandedPassages[q.id] ? '−' : '+'}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Texto de Apoio</span>
                      </button>
                    )}
                  </div>
                  {q.reference && (
                    <span className="text-[10px] text-slate-400 font-mono">{q.reference}</span>
                  )}
                </div>

                {/* Supporting Passage Text (Collapsible) */}
                {q.passageId && expandedPassages[q.id] && (q.passageContent || passages[q.passageId]) && (
                  <div className="px-5 py-4 bg-indigo-50/20 border-b border-slate-100 text-xs leading-relaxed text-slate-600 transition-all">
                    <div className="font-bold text-indigo-800 flex items-center gap-1 mb-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span className="uppercase tracking-wider text-[10px]">{q.passageTitle || passages[q.passageId]?.title || 'Texto de apoio'}</span>
                    </div>
                    <div className="whitespace-pre-wrap pl-3.5 border-l-2 border-indigo-300 italic">
                      {q.passageContent || passages[q.passageId]?.content}
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="p-5 space-y-4">
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">{q.text}</p>

                  {/* Actions (Buttons for answering) */}
                  <div className="flex items-center gap-3">
                    {isAnnulled ? (
                      <span className="px-4 py-2 rounded-lg text-sm font-bold border border-amber-200 bg-amber-50 text-amber-800">
                        Questão anulada
                      </span>
                    ) : (
                      <>
                    <button
                      id={`btn-certo-${q.id}`}
                      onClick={() => handleAnswer(q.id, 'Certo')}
                      className={`px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        userAnswer === 'Certo'
                          ? q.correct === 'Certo'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Certo
                    </button>
                    <button
                      id={`btn-errado-${q.id}`}
                      onClick={() => handleAnswer(q.id, 'Errado')}
                      className={`px-5 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        userAnswer === 'Errado'
                          ? q.correct === 'Errado'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Errado
                    </button>
                      </>
                    )}

                    {/* Quick indicator icon */}
                    {(isAnswered || isAnnulled) && (
                      <div className="flex items-center gap-1.5 ml-2 text-xs font-bold">
                        {isAnnulled ? (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> Anulada
                          </span>
                        ) : isCorrect ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Gabaritou!
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Incorreto
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Educational Feedback Section */}
                  {(isAnswered || isAnnulled) && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 transition-all ${
                      isAnnulled
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : isCorrect 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>JUSTIFICATIVA DA BANCA:</span>
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px]">
                          Gabarito: {q.correct}
                        </span>
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div ref={loadMoreRef} className="h-px" aria-hidden="true" />
    </div>
  );
}

export { quizQuestions };

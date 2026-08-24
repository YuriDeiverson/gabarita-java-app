import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookmarkCheck,
  LoaderCircle,
  NotebookPen,
  Trash2,
} from "lucide-react";
import { QuestionNote, questionsApi } from "../services/api";

interface Props {
  onOpenQuestion: (note: QuestionNote) => void;
}

export default function QuestionNotesTab({ onOpenQuestion }: Props) {
  const [notes, setNotes] = useState<QuestionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    questionsApi
      .notes()
      .then(setNotes)
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível carregar suas anotações.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const remove = async (note: QuestionNote) => {
    if (!window.confirm("Remover esta questão e sua anotação?")) return;
    setDeleting(note.id);
    setError("");
    try {
      await questionsApi.deleteNote(note.question_id, note.course_id);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      try {
        const favorites = new Set<string>(
          JSON.parse(localStorage.getItem("quiz_favorite_questions") || "[]"),
        );
        favorites.delete(String(note.question_id));
        localStorage.setItem(
          "quiz_favorite_questions",
          JSON.stringify([...favorites]),
        );
      } catch {}
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover a anotação.",
      );
    } finally {
      setDeleting("");
    }
  };

  return (
    <section className="question-notes-page mx-auto w-full max-w-6xl space-y-5 animate-fade-in">
      <header className="question-notes-hero rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
          <NotebookPen className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-2xl font-black text-slate-950">
          Minhas anotações
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Questões marcadas para revisar, acompanhadas do que você identificou
          e precisa estudar.
        </p>
      </header>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <LoaderCircle className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : notes.length === 0 ? (
        <div className="question-notes-empty rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BookmarkCheck className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-3 font-extrabold text-slate-800">
            Nenhuma questão anotada
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Use o marcador nas questões para salvar seus pontos de revisão.
          </p>
        </div>
      ) : (
        <div className="question-notes-grid grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <article
              key={note.id}
              className="question-note-card flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                <span>{note.category || "Questão salva"}</span>
                {note.topic && note.topic !== note.category && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                    {note.topic}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-5 text-sm font-semibold leading-6 text-slate-800">
                {note.question_text}
              </p>
              <aside className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  <NotebookPen className="h-3.5 w-3.5" /> Sua anotação
                </span>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {note.note}
                </p>
              </aside>
              <div className="question-note-actions mt-auto flex flex-wrap gap-2 pt-5">
                <button
                  type="button"
                  onClick={() => onOpenQuestion(note)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white hover:bg-indigo-700"
                >
                  Abrir nas questões <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={deleting === note.id}
                  onClick={() => void remove(note)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  {deleting === note.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

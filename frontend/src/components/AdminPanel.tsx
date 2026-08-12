import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import {
  BookOpenText,
  Braces,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  FileQuestion,
  Filter,
  Flag,
  LibraryBig,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import {
  AdminPassage,
  AdminQuestion,
  AdminQuestionReport,
  CatalogContest,
  CatalogRole,
  QuestionTaxonomyDiscipline,
  SharedStudySubject,
  adminApi,
  catalogApi,
  questionsApi,
} from "../services/api";
import {
  normalizeStudySubjectTitle,
  normalizeStudyText,
} from "../studyContext";

export type AdminSection =
  | "contests"
  | "roles"
  | "passages"
  | "questions"
  | "subjects"
  | "materials";
type Difficulty = "Fácil" | "Médio" | "Difícil";
interface CurriculumDiscipline {
  key: string;
  title: string;
  category: string;
  weight: string;
  difficulty: Difficulty;
  highPriority: boolean;
  justification: string;
  subjectsText: string;
  existingMaterials: Record<
    string,
    {
      content: string;
      keyTakeaways: string[];
      contentBlocks?: unknown[];
      studyObjective?: string;
      reviewSummary?: string[];
      id?: string;
      sharedSubjectId?: string;
    }
  >;
}
interface SelectOption {
  value: string;
  label: string;
}
const CREATE_DISCIPLINE_OPTION: SelectOption = {
  value: "__create_discipline__",
  label: "+ Criar nova disciplina",
};
const CREATE_SUBJECT_OPTION: SelectOption = {
  value: "__create_subject__",
  label: "+ Criar novo assunto",
};

const dateFromIso = (value: string) =>
  value ? new Date(`${value}T12:00:00`) : null;
const dateToIso = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const dateToBrazilian = (value: string) =>
  value ? value.split("-").reverse().join("/") : "";

function ExamDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`date-input-with-picker ${open ? "is-open" : ""}`}>
      <input
        id="exam-date"
        required
        readOnly
        className={inputClass}
        value={dateToBrazilian(value)}
        placeholder="dd/mm/aaaa"
        aria-label="Data da prova no formato dia, mês e ano"
        onClick={() => setOpen(true)}
      />
      <button
        type="button"
        className="date-picker-trigger"
        aria-label="Abrir calendário da data da prova"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays aria-hidden="true" />
      </button>
      {open && (
        <div className="date-calendar-popover">
          <ReactCalendar
            locale="pt-BR"
            value={dateFromIso(value)}
            minDetail="month"
            maxDetail="month"
            onChange={(nextValue) => {
              const selected = Array.isArray(nextValue)
                ? nextValue[0]
                : nextValue;
              if (!selected) return;
              onChange(dateToIso(selected));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
const subjectLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
const normalizeStudyGroup = (value: string) =>
  ["Conhecimentos Básicos", "Legislação"].includes(value.trim())
    ? "Conhecimentos Gerais"
    : value.trim() || "Conhecimentos Específicos";
const weightNumber = (value: string) => {
  const normalized = value.trim().replace("%", "").replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const weight = Number(normalized);
  return Number.isFinite(weight) ? weight : null;
};
const formattedWeight = (weight: number) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(weight);
const newDiscipline = (index = 0): CurriculumDiscipline => ({
  key: `new-${Date.now()}-${index}`,
  title: "",
  category: "Conhecimentos Específicos",
  weight: "",
  difficulty: "Médio",
  highPriority: false,
  justification: "",
  subjectsText: "",
  existingMaterials: {},
});
const curriculumFromDisciplines = (disciplines: CurriculumDiscipline[]) => {
  const valid = disciplines.filter((item) => item.title.trim());
  if (!valid.length)
    throw new Error("Adicione pelo menos uma disciplina ao edital.");
  valid.forEach((item) => {
    if (!subjectLines(item.subjectsText).length)
      throw new Error(`Adicione ao menos um assunto em “${item.title}”.`);
  });
  const weights = valid.map((item) => weightNumber(item.weight));
  if (weights.some((weight) => weight === null || weight <= 0))
    throw new Error(
      "Informe um peso maior que zero para cada disciplina do edital.",
    );
  const totalWeight = weights.reduce((total, weight) => total + (weight || 0), 0);
  if (Math.abs(totalWeight - 100) > 0.01)
    throw new Error(
      `A distribuição dos pesos deve somar 100%. Total atual: ${formattedWeight(totalWeight)}%.`,
    );
  const ids = new Set<string>();
  const prepared = valid.map((item, index) => {
    let id = slugify(item.title) || `disciplina_${index + 1}`;
    while (ids.has(id)) id = `${id}_${index + 1}`;
    ids.add(id);
    return { item, id, subjects: subjectLines(item.subjectsText) };
  });
  return {
    topics: prepared.map(({ item, id, subjects }) => ({
      id,
      title: item.title.trim(),
      category: normalizeStudyGroup(item.category),
      subtopics: subjects,
    })),
    studySections: prepared.map(({ item, id, subjects }) => ({
      id,
      title: item.title.trim(),
      icon: "BookOpen",
      color: "blue",
      difficulty: item.difficulty,
      weight: `${formattedWeight(weightNumber(item.weight) || 0)}%`,
      paretoJustification:
        item.justification.trim() ||
        (item.highPriority
          ? "Disciplina de alta prioridade no edital."
          : "Prioridade definida pelo conteúdo do edital."),
      cards: subjects.map((title, index) => {
        const existing =
          item.existingMaterials[title.toLocaleLowerCase("pt-BR")] ||
          Object.entries(item.existingMaterials).find(
            ([materialTitle]) =>
              normalizeStudySubjectTitle(materialTitle) ===
              normalizeStudySubjectTitle(title),
          )?.[1];
        return {
          id: existing?.id || `${id}_${slugify(title) || index + 1}`,
          title,
          paretoRatio: item.highPriority
            ? "Alta relevância"
            : "Relevância do edital",
          isQuente: item.highPriority,
          sharedSubjectId: existing?.sharedSubjectId,
          content: existing
            ? existing.content
            : "",
          keyTakeaways: existing
            ? existing.keyTakeaways
            : [],
          contentBlocks: existing?.contentBlocks || [],
          studyObjective: existing?.studyObjective || "",
          reviewSummary: existing?.reviewSummary || [],
        };
      }),
    })),
  };
};
const disciplinesFromCurriculum = (
  curriculum: CatalogRole["curriculum"],
): CurriculumDiscipline[] => {
  const topics = Array.isArray(curriculum?.topics)
    ? (curriculum.topics as Array<Record<string, unknown>>)
    : [];
  const sections = Array.isArray(curriculum?.studySections)
    ? (curriculum.studySections as Array<Record<string, unknown>>)
    : [];
  const result = topics.map((topic, index) => {
    const id = String(topic.id || "");
    const section =
      sections.find((item) => String(item.id || "") === id) ||
      (id === "ti_basica"
        ? sections.find((item) => String(item.id || "") === "ti")
        : undefined) ||
      {};
    const cards = Array.isArray(section.cards)
      ? (section.cards as Array<Record<string, unknown>>)
      : [];
    const materials: CurriculumDiscipline["existingMaterials"] = {};
    cards.forEach((card) => {
      const title = String(card.title || "").trim();
      if (title)
        materials[title.toLocaleLowerCase("pt-BR")] = {
          id: String(card.id || ""),
          content: String(card.content || ""),
          keyTakeaways: Array.isArray(card.keyTakeaways)
            ? card.keyTakeaways.map(String)
            : [],
          contentBlocks: Array.isArray(card.contentBlocks)
            ? card.contentBlocks
            : [],
          studyObjective: String(card.studyObjective || ""),
          reviewSummary: Array.isArray(card.reviewSummary)
            ? card.reviewSummary.map(String)
            : [],
          sharedSubjectId: String(card.sharedSubjectId || "") || undefined,
        };
    });
    const subtopics = Array.isArray(topic.subtopics)
      ? topic.subtopics.map(String)
      : [];
    return {
      key: id || `existing-${index}`,
      title: String(topic.title || section.title || ""),
      category: normalizeStudyGroup(
        String(topic.category || "Conhecimentos Específicos"),
      ),
      weight: String(section.weight || ""),
      difficulty: (["Fácil", "Médio", "Difícil"].includes(
        String(section.difficulty),
      )
        ? String(section.difficulty)
        : "Médio") as Difficulty,
      highPriority: cards.some((card) => Boolean(card.isQuente)),
      justification: String(section.paretoJustification || ""),
      subjectsText: subtopics.join("\n"),
      existingMaterials: materials,
    };
  });
  return result.length ? result : [newDiscipline()];
};

const emptyContest = {
  id: "",
  label: "",
  acronym: "",
  organization: "",
  description: "",
  board: "",
  examDate: "",
  status: "Edital publicado",
  state: "",
  area: "",
  education: "",
  vacancies: "",
  remuneration: "",
  location: "",
  stages: "",
  noticeReference: "",
  active: true,
};
const emptyRole = {
  contestId: "",
  id: "",
  label: "",
  courseId: "",
  board: "",
  includeDiscursive: false,
  requirement: "",
  remuneration: "",
  vacancies: "",
  estimatedHours: 120,
  active: true,
};
const emptyPassage = { title: "", source: "", content: "" };
const emptySharedSubjectForm = {
  title: "",
  discipline: "",
  studyGroup: "Conhecimentos Gerais",
  studyObjective: "",
  reviewSummary: "",
};
const emptyQuestion = {
  category: "",
  topic: "",
  board: "",
  type: "MULTIPLE_CHOICE",
  text: "",
  correct: "",
  explanation: "",
  detailedTopic: "",
  conceptExplanation: "",
  decisiveEvidence: "",
  answerAnalysis: "",
  examTrap: "",
  fixationTips: "",
  comparisonHeaders: "",
  comparisonRows: "",
  reference: "",
  passageId: "",
  status: "ACTIVE",
  options: "A | \nB | \nC | \nD | \nE | ",
};
const questionBatchTemplate = JSON.stringify(
  [
    {
      category: "Língua Portuguesa",
      topic: "Interpretação de textos",
      board: "CEBRASPE",
      type: "MULTIPLE_CHOICE",
      text: "Enunciado da primeira questão",
      correct: "A",
      options: [
        { label: "A", text: "Primeira alternativa" },
        { label: "B", text: "Segunda alternativa" },
      ],
      explanation: "Explique, com palavras simples, qual detalhe decide a questão, por que a resposta errada parece possível e qual é a regra correta. Use um exemplo curto.",
      detailedTopic: "Interpretação de textos — inferência",
      conceptExplanation: "Explique o conceito desde o começo, com linguagem direta e um exemplo cotidiano.",
      decisiveEvidence: "Transcreva o trecho do texto ou a regra que decide a questão.",
      answerAnalysis: "Mostre como o enunciado aplica o conceito e explique por que as demais leituras não funcionam.",
      examTrap: "Explique qual troca de sentido, exagero ou confusão a banca tentou provocar.",
      fixationTips: ["Dica curta para reconhecer esse assunto", "Pegadinha que costuma aparecer em prova"],
      comparisonHeaders: { criterion: "Ponto analisado", left: "Evidência", right: "Validação" },
      comparisonRows: [{ criterion: "Ponto comparado", left: "Situação A", right: "Situação B" }],
      reference: "Banca — Órgão — Ano",
      status: "ACTIVE",
      passageTitle: "Título do texto de apoio",
      passageContent: "Conteúdo completo do texto de apoio.",
    },
    {
      category: "Direito Administrativo",
      topic: "Atos administrativos",
      board: "CEBRASPE",
      type: "TRUE_FALSE",
      text: "Enunciado da segunda questão",
      correct: "Certo",
      explanation: "Explique, com palavras simples, qual detalhe decide a questão, por que o item está errado e como lembrar da regra. Use um exemplo curto.",
      detailedTopic: "Atos administrativos — atributo cobrado",
      conceptExplanation: "Explique a regra central em linguagem simples e dê um exemplo.",
      decisiveEvidence: "Indique a regra, dispositivo ou expressão que decide o julgamento.",
      answerAnalysis: "Aponte exatamente qual palavra torna o item certo ou errado e a pegadinha usada pela banca.",
      examTrap: "Mostre por que a redação parece correta e onde está o erro.",
      fixationTips: ["Regra que deve ser lembrada", "Exceção que não pode ser confundida"],
      comparisonHeaders: { criterion: "Ponto analisado", left: "Regra", right: "Conclusão" },
      reference: "Banca — Órgão — Ano",
      status: "ACTIVE",
    },
  ],
  null,
  2,
);
const questionBatchFields = [
  {
    name: "category",
    description:
      "Disciplina usada para organizar e filtrar a questão, por exemplo: Língua Portuguesa.",
  },
  {
    name: "topic",
    description:
      "Assunto específico dentro da disciplina, por exemplo: Interpretação de textos. É opcional.",
  },
  {
    name: "board",
    description:
      "Banca organizadora ou estilo da questão, como CEBRASPE, FGV ou FCC.",
  },
  {
    name: "type",
    description:
      "Tipo da questão: MULTIPLE_CHOICE para múltipla escolha ou TRUE_FALSE para certo/errado.",
  },
  {
    name: "text",
    description: "Enunciado completo que será apresentado ao aluno.",
  },
  {
    name: "correct",
    description:
      "Gabarito: letra da alternativa correta, Certo, Errado ou Anulada.",
  },
  {
    name: "options",
    description:
      "Alternativas de múltipla escolha. Cada item precisa de label (letra) e text (conteúdo). Não use em certo/errado.",
  },
  {
    name: "explanation",
    description:
      "Explicação obrigatória em linguagem simples: apresente o ponto decisivo, mostre por que o erro está errado, ensine a regra correta e dê um exemplo curto.",
  },
  {
    name: "detailedTopic / conceptExplanation / decisiveEvidence / answerAnalysis / examTrap",
    description:
      "Campos da correção completa: tema exato, explicação teórica e análise detalhada do item.",
  },
  {
    name: "fixationTips / comparisonHeaders / comparisonRows",
    description:
      "Resumo para provas futuras. fixationTips é uma lista; comparisonRows usa objetos com criterion, left e right.",
  },
  {
    name: "reference",
    description:
      "Origem da questão, normalmente no formato Banca — Órgão — Ano. É opcional.",
  },
  {
    name: "passageContent",
    description:
      "Conteúdo completo do texto de apoio. O sistema cria ou reutiliza o texto e o vincula à questão. Use passageTitle e passageSource para identificá-lo.",
  },
  {
    name: "status",
    description:
      "Situação da questão. Normalmente use ACTIVE. Se o gabarito for Anulada, o sistema a marcará como anulada.",
  },
];

function Field({
  label,
  children,
  wide = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <label className={[wide ? "sm:col-span-2" : "", className].join(" ")}>
      <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";
const buttonSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50";
const MAX_NOTICE_PDF_BYTES = 15 * 1024 * 1024;
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
};
const openPdfBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export default function AdminPanel({
  activeSection,
  onSectionChange,
}: {
  activeSection?: AdminSection;
  onSectionChange?: (section: AdminSection) => void;
}) {
  const [section, setSection] = useState<AdminSection>(
    activeSection || "contests",
  );
  const [contests, setContests] = useState<CatalogContest[]>([]);
  const [sharedStudyLibrary, setSharedStudyLibrary] = useState<
    SharedStudySubject[]
  >([]);
  const [sharedSubjectForm, setSharedSubjectForm] = useState(
    emptySharedSubjectForm,
  );
  const [editingSharedSubject, setEditingSharedSubject] = useState("");
  const [sharedSubjectFilter, setSharedSubjectFilter] = useState("");
  const [sharedSubjectGroupFilter, setSharedSubjectGroupFilter] = useState<
    "ALL" | "Conhecimentos Gerais" | "Conhecimentos Específicos"
  >("ALL");
  const [sharedSubjectSort, setSharedSubjectSort] = useState<
    "alphabetical" | "numeric"
  >("alphabetical");
  const [sharedSubjectSortMenuOpen, setSharedSubjectSortMenuOpen] =
    useState(false);
  const [expandedSharedSubjectGroups, setExpandedSharedSubjectGroups] =
    useState<Set<string>>(() => new Set());
  const [passages, setPassages] = useState<AdminPassage[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [questionTaxonomy, setQuestionTaxonomy] = useState<QuestionTaxonomyDiscipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [questionReports, setQuestionReports] = useState<AdminQuestionReport[]>(
    [],
  );
  const [reportStatus, setReportStatus] = useState<
    "PENDING" | "RESOLVED" | "DISMISSED" | "ALL"
  >("PENDING");
  const [hasSearchedQuestions, setHasSearchedQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contestForm, setContestForm] = useState(emptyContest);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [curriculumDisciplines, setCurriculumDisciplines] = useState<
    CurriculumDiscipline[]
  >(() => [newDiscipline()]);
  const [expandedCurriculumDisciplineKeys, setExpandedCurriculumDisciplineKeys] =
    useState<string>(() => curriculumDisciplines[0]?.key || "");
  const [passageForm, setPassageForm] = useState(emptyPassage);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingContest, setEditingContest] = useState("");
  const [contestNoticePdf, setContestNoticePdf] = useState<File | null>(null);
  const [contestNoticeInputKey, setContestNoticeInputKey] = useState(0);
  const [openingNoticePdf, setOpeningNoticePdf] = useState("");
  const [editingRole, setEditingRole] = useState("");
  const [editingPassage, setEditingPassage] = useState("");
  const [editingQuestion, setEditingQuestion] = useState("");
  const [questionArea, setQuestionArea] = useState("");
  const [questionAreas, setQuestionAreas] = useState<string[]>([]);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionTotalPages, setQuestionTotalPages] = useState(0);
  const [questionSearch, setQuestionSearch] = useState("");
  const [materialRoleId, setMaterialRoleId] = useState("");
  const [materialSectionId, setMaterialSectionId] = useState("");
  const [materialCardId, setMaterialCardId] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialContent, setMaterialContent] = useState("");
  const [materialKeyPoints, setMaterialKeyPoints] = useState("");
  const [editingMaterialId, setEditingMaterialId] = useState("");
  const [editingBaseMaterial, setEditingBaseMaterial] = useState(false);
  const [materialPreviewOpen, setMaterialPreviewOpen] = useState(false);
  const [materialTaxonomySaving, setMaterialTaxonomySaving] = useState<
    "discipline" | "subject" | ""
  >("");
  const [materialCreating, setMaterialCreating] = useState<
    "discipline" | "subject" | ""
  >("");
  const [materialDeleting, setMaterialDeleting] = useState<
    "discipline" | "subject" | ""
  >("");
  const [questionBatchJson, setQuestionBatchJson] = useState("");
  const [questionBatchImporterOpen, setQuestionBatchImporterOpen] =
    useState(false);
  const questionTaxonomyAreas = useMemo(
    () => Array.from(new Set(questionTaxonomy.map((discipline) => discipline.area))),
    [questionTaxonomy],
  );
  const questionTopicOptions = useMemo(
    () => questionTaxonomy.find((discipline) => discipline.name === questionForm.category)?.topics || [],
    [questionForm.category, questionTaxonomy],
  );
  const weightedCurriculumDisciplines = curriculumDisciplines.filter((item) =>
    item.title.trim(),
  );
  const curriculumWeightTotal = weightedCurriculumDisciplines.reduce(
    (total, item) => total + (weightNumber(item.weight) || 0),
    0,
  );
  const curriculumWeightRemaining = 100 - curriculumWeightTotal;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [catalogResult, passagesResult, libraryResult, taxonomyResult] = await Promise.allSettled([
      adminApi.catalog(),
      adminApi.passages(),
      catalogApi.studyLibrary(),
      questionsApi.taxonomy('',true),
    ]);
    if (catalogResult.status === "fulfilled") setContests(catalogResult.value);
    if (passagesResult.status === "fulfilled")
      setPassages(passagesResult.value);
    if (libraryResult.status === "fulfilled")
      setSharedStudyLibrary(libraryResult.value);
    if (taxonomyResult.status === "fulfilled") setQuestionTaxonomy(taxonomyResult.value);
    const coreError =
      catalogResult.status === "rejected"
        ? catalogResult.reason
        : passagesResult.status === "rejected"
          ? passagesResult.reason
          : null;
    if (coreError)
      setError(
        coreError instanceof Error
          ? coreError.message
          : "Parte do painel administrativo não pôde ser carregada.",
      );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (activeSection) setSection(activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (!materialPreviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [materialPreviewOpen]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      setQuestionReports(await adminApi.questionReports(reportStatus));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar as sinalizações.",
      );
    } finally {
      setReportsLoading(false);
    }
  }, [reportStatus]);
  useEffect(() => {
    if (section === "questions") void loadReports();
  }, [loadReports, section]);

  const roles = useMemo(
    () =>
      contests.flatMap((contest) =>
        contest.roles.map((role) => ({ ...role, contest })),
      ),
    [contests],
  );
  const inferredStudyGroupByDiscipline = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    roles.forEach((role) => {
      const topics = Array.isArray(role.curriculum?.topics)
        ? (role.curriculum.topics as Array<Record<string, unknown>>)
        : [];
      topics.forEach((topic) => {
        const title = String(topic.title || "").trim();
        if (!title) return;
        const key = normalizeStudyText(title);
        const group = normalizeStudyGroup(String(topic.category || ""));
        const known = groups.get(key) || new Set<string>();
        known.add(group);
        groups.set(key, known);
      });
    });
    return new Map(
      [...groups.entries()].map(([discipline, groupsForDiscipline]) => [
        discipline,
        groupsForDiscipline.has("Conhecimentos Gerais")
          ? "Conhecimentos Gerais"
          : groupsForDiscipline.has("Conhecimentos Específicos")
            ? "Conhecimentos Específicos"
            : "Conhecimentos Gerais",
      ]),
    );
  }, [roles]);
  const sharedSubjectStudyGroup = (subject: SharedStudySubject) =>
    inferredStudyGroupByDiscipline.get(normalizeStudyText(subject.discipline)) ||
    normalizeStudyGroup(subject.studyGroup || "");
  const filteredSharedSubjects = useMemo(() => {
    const query = normalizeStudyText(sharedSubjectFilter);
    return sharedStudyLibrary.filter((subject) => {
      const group = sharedSubjectStudyGroup(subject);
      const matchesGroup =
        sharedSubjectGroupFilter === "ALL" || group === sharedSubjectGroupFilter;
      const matchesQuery =
        !query ||
        [subject.title, subject.discipline, group].some((value) =>
          normalizeStudyText(value).includes(query),
        );
      return matchesGroup && matchesQuery;
    });
  }, [
    inferredStudyGroupByDiscipline,
    sharedStudyLibrary,
    sharedSubjectFilter,
    sharedSubjectGroupFilter,
  ]);
  const groupedSharedSubjects = useMemo(() => {
    const collator = new Intl.Collator("pt-BR", {
      numeric: sharedSubjectSort === "numeric",
      sensitivity: "base",
    });
    const groups = new Map<
      string,
      {
        studyGroup: string;
        discipline: string;
        subjects: SharedStudySubject[];
      }
    >();
    filteredSharedSubjects.forEach((subject) => {
      const studyGroup = sharedSubjectStudyGroup(subject);
      const discipline = subject.discipline || "Sem disciplina";
      const key = `${studyGroup}::${normalizeStudyText(discipline)}`;
      const current = groups.get(key) || {
        studyGroup,
        discipline,
        subjects: [],
      };
      current.subjects.push(subject);
      groups.set(key, current);
    });
    return [...groups.values()]
      .map((group) => ({
        ...group,
        subjects: [...group.subjects].sort((first, second) =>
          collator.compare(first.title, second.title),
        ),
      }))
      .sort(
        (first, second) =>
          collator.compare(first.studyGroup, second.studyGroup) ||
          collator.compare(first.discipline, second.discipline),
      );
  }, [
    filteredSharedSubjects,
    inferredStudyGroupByDiscipline,
    sharedSubjectSort,
  ]);
  const sharedSubjectGroupKey = (group: {
    studyGroup: string;
    discipline: string;
  }) => `${group.studyGroup}::${normalizeStudyText(group.discipline)}`;
  const toggleSharedSubjectGroup = (group: {
    studyGroup: string;
    discipline: string;
  }) => {
    const key = sharedSubjectGroupKey(group);
    setExpandedSharedSubjectGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const editingContestRecord = useMemo(
    () => contests.find((item) => item.databaseId === editingContest),
    [contests, editingContest],
  );
  const materialRoles = roles;
  const materialRole = useMemo(
    () => materialRoles.find((item) => item.databaseId === materialRoleId),
    [materialRoleId, materialRoles],
  );
  const materialRoleOptions = useMemo<SelectOption[]>(
    () =>
      materialRoles.map((role) => ({
        value: String(role.databaseId || ""),
        label: `${role.contest.acronym} — ${role.label}`,
      })),
    [materialRoles],
  );
  const sharedDisciplineOptionsByGroup = useMemo<
    Map<string, SelectOption[]>
  >(
    () => {
      const groups = new Map<string, Map<string, number>>();
      sharedStudyLibrary.forEach((subject) => {
        const group = sharedSubjectStudyGroup(subject);
        const discipline = subject.discipline.trim();
        if (discipline) {
          const subjectCount = groups.get(group) || new Map<string, number>();
          subjectCount.set(
            discipline,
            (subjectCount.get(discipline) || 0) + 1,
          );
          groups.set(group, subjectCount);
        }
      });
      return new Map(
        [...groups.entries()].map(([group, subjectCount]) => [
          group,
          [...subjectCount.entries()]
            .sort(([first], [second]) => first.localeCompare(second, "pt-BR"))
            .map(([discipline, count]) => ({
              value: discipline,
              label: `${discipline} (${count} assunto${count === 1 ? "" : "s"})`,
            })),
        ]),
      );
    },
    [sharedStudyLibrary, inferredStudyGroupByDiscipline],
  );
  const materialSections = useMemo(
    () =>
      Array.isArray(materialRole?.curriculum?.studySections)
        ? (materialRole.curriculum.studySections as Array<
            Record<string, unknown>
          >)
        : [],
    [materialRole],
  );
  const materialSection = useMemo(
    () =>
      materialSections.find(
        (item) => String(item.id || "") === materialSectionId,
      ),
    [materialSectionId, materialSections],
  );
  const materialSectionOptions = useMemo<SelectOption[]>(
    () =>
      [
        CREATE_DISCIPLINE_OPTION,
        ...materialSections.map((item) => ({
          value: String(item.id || ""),
          label: String(item.title || "Disciplina"),
        })),
      ],
    [materialSections],
  );
  const materialCards = useMemo(
    () =>
      Array.isArray(materialSection?.cards)
        ? (materialSection.cards as Array<Record<string, unknown>>)
        : [],
    [materialSection],
  );
  const materialCard = useMemo(
    () =>
      materialCards.find((item) => String(item.id || "") === materialCardId),
    [materialCardId, materialCards],
  );
  const materialCardOptions = useMemo<SelectOption[]>(
    () =>
      [
        CREATE_SUBJECT_OPTION,
        ...materialCards.map((item) => ({
          value: String(item.id || ""),
          label: String(item.title || "Assunto"),
        })),
      ],
    [materialCards],
  );
  const materialSharedSubject = useMemo(
    () =>
      sharedStudyLibrary.find(
        (item) =>
          item.id === String(materialCard?.sharedSubjectId || "") ||
          (normalizeStudySubjectTitle(item.title) ===
            normalizeStudySubjectTitle(String(materialCard?.title || "")) &&
            normalizeStudyText(item.discipline) ===
              normalizeStudyText(String(materialSection?.title || ""))),
      ),
    [materialCard, materialSection, sharedStudyLibrary],
  );
  const effectiveMaterialCard = useMemo(
    () =>
      materialCard && materialSharedSubject
        ? {
            ...materialCard,
            content: materialSharedSubject.content,
            keyTakeaways: materialSharedSubject.keyTakeaways,
            contentBlocks: materialSharedSubject.contentBlocks,
          }
        : materialCard,
    [materialCard, materialSharedSubject],
  );
  const currentContentBlocks = useMemo(
    () =>
      Array.isArray(effectiveMaterialCard?.contentBlocks)
        ? (effectiveMaterialCard.contentBlocks as Array<Record<string, unknown>>)
        : [],
    [effectiveMaterialCard],
  );
  useEffect(() => {
    if (section !== "materials") return;
    const selectedExists = materialRoles.some(
      (role) => role.databaseId === materialRoleId,
    );
    if (selectedExists) return;
    const firstRole = materialRoles.find(
      (role) =>
        role.databaseId &&
        Array.isArray(role.curriculum?.studySections) &&
        role.curriculum.studySections.length > 0,
    );
    setMaterialRoleId(firstRole?.databaseId || "");
    setMaterialSectionId("");
    setMaterialCardId("");
  }, [materialRoleId, materialRoles, section]);
  useEffect(() => {
    if (
      section !== "materials" ||
      !materialRole ||
      materialCreating === "discipline"
    )
      return;
    const selectedExists = materialSections.some(
      (item) => String(item.id || "") === materialSectionId,
    );
    if (selectedExists) return;
    setMaterialSectionId(String(materialSections[0]?.id || ""));
    setMaterialCardId("");
  }, [materialCreating, materialRole, materialSectionId, materialSections, section]);
  useEffect(() => {
    if (
      section !== "materials" ||
      !materialSection ||
      materialCreating === "subject"
    )
      return;
    const selectedExists = materialCards.some(
      (item) => String(item.id || "") === materialCardId,
    );
    if (!selectedExists) setMaterialCardId(String(materialCards[0]?.id || ""));
  }, [materialCardId, materialCards, materialCreating, materialSection, section]);
  const totalStudyMaterials = useMemo(
    () =>
      materialRoles.reduce((total, role) => {
        const sections = Array.isArray(role.curriculum?.studySections)
          ? (role.curriculum.studySections as Array<Record<string, unknown>>)
          : [];
        return (
          total +
          sections.reduce((sectionTotal, item) => {
            const cards = Array.isArray(item.cards)
              ? (item.cards as Array<Record<string, unknown>>)
              : [];
            return (
              sectionTotal +
              cards.reduce(
                (cardTotal, card) =>
                  cardTotal +
                  (Array.isArray(card.contentBlocks)
                    ? card.contentBlocks.length
                    : 0),
                0,
              )
            );
          }, 0)
        );
      }, 0),
    [materialRoles],
  );
  const notify = (message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(""), 3500);
  };
  const run = async (
    operation: () => Promise<unknown>,
    message: string,
    reset: () => void,
  ) => {
    setSaving(true);
    setError("");
    try {
      await operation();
      reset();
      await load();
      notify(message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetContestEditor = () => {
    setContestForm(emptyContest);
    setEditingContest("");
    setContestNoticePdf(null);
    setContestNoticeInputKey((value) => value + 1);
  };
  const submitContest = async (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...contestForm, code: contestForm.id };
    const wasEditing = Boolean(editingContest);
    let persistedContestId = editingContest;
    let contestWasPersisted = false;
    setSaving(true);
    setError("");
    try {
      const result = editingContest
        ? await adminApi.updateContest(editingContest, payload)
        : await adminApi.createContest(payload);
      persistedContestId = editingContest || result.id;
      contestWasPersisted = true;
      if (contestNoticePdf)
        await adminApi.uploadContestNoticePdf(
          persistedContestId,
          contestNoticePdf,
        );
      resetContestEditor();
      await load();
      notify(
        `${wasEditing ? "Concurso atualizado" : "Concurso cadastrado"}${contestNoticePdf ? " com o edital em PDF" : ""}.`,
      );
    } catch (cause) {
      if (contestWasPersisted && persistedContestId) {
        setEditingContest(persistedContestId);
        await load().catch(() => undefined);
      }
      const detail =
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir o envio.";
      setError(
        contestWasPersisted && contestNoticePdf
          ? `O concurso foi salvo, mas o PDF não foi enviado: ${detail} Tente salvar novamente para reenviar o arquivo.`
          : detail,
      );
    } finally {
      setSaving(false);
    }
  };
  const editContest = (item: CatalogContest) => {
    setContestForm({
      id: item.id,
      label: item.label,
      acronym: item.acronym,
      organization: item.organization,
      description: item.description,
      board: item.board,
      examDate: item.examDate,
      status: item.status,
      state: item.state,
      area: item.area,
      education: item.education,
      vacancies: item.vacancies,
      remuneration: item.remuneration,
      location: item.location,
      stages: item.stages,
      noticeReference: item.noticeReference,
      active: item.active !== false,
    });
    setEditingContest(item.databaseId || "");
    setContestNoticePdf(null);
    setContestNoticeInputKey((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectContestNoticePdf = (file?: File) => {
    setError("");
    if (!file) {
      setContestNoticePdf(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecione o edital em formato PDF.");
      setContestNoticePdf(null);
      setContestNoticeInputKey((value) => value + 1);
      return;
    }
    if (file.size > MAX_NOTICE_PDF_BYTES) {
      setError("O edital deve ter no máximo 15 MB.");
      setContestNoticePdf(null);
      setContestNoticeInputKey((value) => value + 1);
      return;
    }
    setContestNoticePdf(file);
  };
  const viewContestNoticePdf = async (item: CatalogContest) => {
    if (!item.databaseId) return;
    setOpeningNoticePdf(item.databaseId);
    setError("");
    try {
      openPdfBlob(await catalogApi.contestNoticePdf(item.databaseId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível abrir o edital.",
      );
    } finally {
      setOpeningNoticePdf("");
    }
  };
  const removeContestNoticePdf = (item: CatalogContest) => {
    if (!item.databaseId || !window.confirm("Remover o edital em PDF deste concurso?")) return;
    void run(
      () => adminApi.deleteContestNoticePdf(item.databaseId!),
      "Edital em PDF removido.",
      () => {
        setContestNoticePdf(null);
        setContestNoticeInputKey((value) => value + 1);
      },
    );
  };

  const automaticCourseId = (contestId: string, label: string) => {
    if (!label.trim()) return "";
    const selected = contests.find((item) => item.databaseId === contestId);
    return slugify(`${selected?.id || ""}_${label}`);
  };
  const updateDiscipline = (
    index: number,
    patch: Partial<CurriculumDiscipline>,
  ) =>
    setCurriculumDisciplines((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  const applySharedDiscipline = (
    disciplineIndex: number,
    title: string,
    group: string,
  ) => {
    const sharedSubjects = sharedStudyLibrary.filter(
      (subject) =>
        normalizeStudyText(subject.discipline) === normalizeStudyText(title) &&
        sharedSubjectStudyGroup(subject) === normalizeStudyGroup(group),
    );
    setCurriculumDisciplines((current) =>
      current.map((discipline, index) => {
        if (index !== disciplineIndex) return discipline;
        const subjectsByName = new Map<string, string>();
        subjectLines(discipline.subjectsText).forEach((subject) => {
          const key = normalizeStudySubjectTitle(subject);
          if (!subjectsByName.has(key)) subjectsByName.set(key, subject);
        });
        sharedSubjects.forEach((subject) => {
          const key = normalizeStudySubjectTitle(subject.title);
          if (!subjectsByName.has(key)) subjectsByName.set(key, subject.title);
        });
        const libraryMaterials = sharedSubjects.reduce<
          CurriculumDiscipline["existingMaterials"]
        >((materials, subject) => {
          materials[subject.title.toLocaleLowerCase("pt-BR")] = {
            content: subject.content,
            keyTakeaways: subject.keyTakeaways,
            contentBlocks: subject.contentBlocks,
            studyObjective: subject.studyObjective,
            reviewSummary: subject.reviewSummary,
            sharedSubjectId: subject.id,
          };
          return materials;
        }, {});
        return {
          ...discipline,
          title,
          subjectsText: [...subjectsByName.values()].join("\n"),
          existingMaterials: {
            ...discipline.existingMaterials,
            ...libraryMaterials,
          },
        };
      }),
    );
    if (sharedSubjects.length)
      notify(
        `${sharedSubjects.length} assunto${sharedSubjects.length === 1 ? "" : "s"} da disciplina “${title}” foram incluídos com os materiais prontos.`,
      );
  };
  const selectSubjectsForDiscipline = (
    disciplineIndex: number,
    selectedTitles: string[],
  ) => {
    const selectedKeys = new Set(
      selectedTitles.map(normalizeStudySubjectTitle),
    );
    const selectedSubjects = sharedStudyLibrary.filter((subject) =>
      selectedKeys.has(normalizeStudySubjectTitle(subject.title)),
    );
    const materials = selectedSubjects.reduce<
      CurriculumDiscipline["existingMaterials"]
    >((current, subject) => {
      current[subject.title.toLocaleLowerCase("pt-BR")] = {
        content: subject.content,
        keyTakeaways: subject.keyTakeaways,
        contentBlocks: subject.contentBlocks,
        studyObjective: subject.studyObjective,
        reviewSummary: subject.reviewSummary,
        sharedSubjectId: subject.id,
      };
      return current;
    }, {});
    setCurriculumDisciplines((current) =>
      current.map((discipline, index) =>
        index === disciplineIndex
          ? {
              ...discipline,
              subjectsText: selectedTitles.join("\n"),
              existingMaterials: { ...discipline.existingMaterials, ...materials },
            }
          : discipline,
      ),
    );
  };
  const resetSharedSubjectEditor = () => {
    setSharedSubjectForm(emptySharedSubjectForm);
    setEditingSharedSubject("");
  };
  const submitSharedSubject = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      discipline: sharedSubjectForm.discipline.trim(),
      studyGroup: sharedSubjectForm.studyGroup,
      studyObjective: sharedSubjectForm.studyObjective,
      reviewSummary: subjectLines(sharedSubjectForm.reviewSummary),
    };
    if (!editingSharedSubject && !sharedSubjectForm.title.trim()) {
      setError("Informe o nome do assunto.");
      return;
    }
    void run(
      () =>
        editingSharedSubject
          ? adminApi.updateSharedSubject(editingSharedSubject, payload)
          : adminApi.createSharedSubject({
              ...payload,
              title: sharedSubjectForm.title.trim(),
            }),
      editingSharedSubject
        ? "Assunto e material atualizados na biblioteca."
        : "Assunto cadastrado na biblioteca compartilhada.",
      resetSharedSubjectEditor,
    );
  };
  const editSharedSubject = (subject: SharedStudySubject) => {
    setSharedSubjectForm({
      title: subject.title,
      discipline: subject.discipline,
      studyGroup: sharedSubjectStudyGroup(subject),
      studyObjective: subject.studyObjective,
      reviewSummary: subject.reviewSummary.join("\n"),
    });
    setEditingSharedSubject(subject.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deleteSharedSubject = (subject: SharedStudySubject) => {
    if (
      !window.confirm(
        `Excluir “${subject.title}” da biblioteca? Os cargos que já o utilizam manterão a cópia atual do material.`,
      )
    )
      return;
    void run(
      () => adminApi.deleteSharedSubject(subject.id),
      "Assunto removido da biblioteca.",
      () => {
        if (editingSharedSubject === subject.id) resetSharedSubjectEditor();
      },
    );
  };
  const toggleCurriculumDiscipline = (key: string) =>
    setExpandedCurriculumDisciplineKeys((current) =>
      current === key ? "" : key,
    );
  const expandAllCurriculumDisciplines = () =>
    setExpandedCurriculumDisciplineKeys("all");
  const collapseAllCurriculumDisciplines = () =>
    setExpandedCurriculumDisciplineKeys("");
  const addCurriculumDiscipline = () => {
    const next = newDiscipline(curriculumDisciplines.length);
    setCurriculumDisciplines((current) => [...current, next]);
    setExpandedCurriculumDisciplineKeys(next.key);
  };
  const resetCurriculumDisciplines = () => {
    const first = newDiscipline();
    setCurriculumDisciplines([first]);
    setExpandedCurriculumDisciplineKeys(first.key);
  };

  const submitRole = (event: FormEvent) => {
    event.preventDefault();
    let curriculum: unknown;
    try {
      curriculum = curriculumFromDisciplines(curriculumDisciplines);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Revise as disciplinas e assuntos do edital.",
      );
      return;
    }
    const payload = {
      ...roleForm,
      code: roleForm.id,
      contestId: roleForm.contestId,
      curriculum,
    };
    void run(
      () =>
        editingRole
          ? adminApi.updateRole(editingRole, payload)
          : adminApi.createRole(payload),
      editingRole
        ? "Cargo e edital atualizados."
        : "Cargo e edital cadastrados.",
      () => {
        setRoleForm(emptyRole);
        resetCurriculumDisciplines();
        setEditingRole("");
      },
    );
  };
  const editRole = (item: CatalogRole & { contest: CatalogContest }) => {
    setRoleForm({
      contestId: item.contest.databaseId || "",
      id: item.id,
      label: item.label,
      courseId: item.courseId,
      board: item.board,
      includeDiscursive: Boolean(item.includeDiscursive),
      requirement: item.requirement || "",
      remuneration: item.remuneration || "",
      vacancies: item.vacancies || "",
      estimatedHours: item.estimatedHours || 120,
      active: item.active !== false,
    });
    const disciplines = disciplinesFromCurriculum(item.curriculum);
    setCurriculumDisciplines(disciplines);
    setExpandedCurriculumDisciplineKeys(disciplines[0]?.key || "");
    setEditingRole(item.databaseId || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitPassage = (event: FormEvent) => {
    event.preventDefault();
    const nextPassage = editingPassage
      ? emptyPassage
      : { ...emptyPassage, source: passageForm.source };
    void run(
      () =>
        editingPassage
          ? adminApi.updatePassage(editingPassage, passageForm)
          : adminApi.createPassage(passageForm),
      editingPassage
        ? "Texto de apoio atualizado."
        : "Texto de apoio cadastrado.",
      () => {
        setPassageForm(nextPassage);
        setEditingPassage("");
      },
    );
  };

  const ensureMaterialRoleInDatabase = async () => {
    if (!materialRole) throw new Error("Selecione um cargo válido.");
    const currentId = String(materialRole.databaseId || "");
    if (currentId && !currentId.startsWith("legacy:")) return currentId;
    let contestId = materialRole.contest.databaseId || "";
    if (!contestId) {
      const contest = materialRole.contest;
      const created = (await adminApi.createContest({
        code: contest.id,
        label: contest.label,
        acronym: contest.acronym,
        organization: contest.organization,
        description: contest.description,
        board: contest.board,
        examDate: contest.examDate,
        status: contest.status,
        state: contest.state,
        area: contest.area,
        education: contest.education,
        vacancies: contest.vacancies,
        remuneration: contest.remuneration,
        location: contest.location,
        stages: contest.stages,
        noticeReference: contest.noticeReference,
        active: true,
      })) as Record<string, unknown>;
      contestId = String(created.id || "");
    }
    const createdRole = (await adminApi.createRole({
      contestId,
      code: materialRole.id,
      label: materialRole.label,
      courseId: materialRole.courseId,
      board: materialRole.board,
      includeDiscursive: Boolean(materialRole.includeDiscursive),
      requirement: materialRole.requirement || "",
      remuneration: materialRole.remuneration || "",
      vacancies: materialRole.vacancies || "",
      estimatedHours: materialRole.estimatedHours || 120,
      curriculum: materialRole.curriculum,
      active: true,
    })) as Record<string, unknown>;
    const roleId = String(createdRole.id || "");
    if (!roleId) throw new Error("O cargo legado não pôde ser migrado para o banco.");
    setMaterialRoleId(roleId);
    return roleId;
  };

  const createMaterialDiscipline = async (inputValue: string) => {
    const title = inputValue.trim();
    if (!title || !materialRole) return;
    setMaterialTaxonomySaving("discipline");
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      const created = await adminApi.createStudyDiscipline(roleId, title);
      resetMaterialEditor();
      await load();
      setMaterialRoleId(roleId);
      setMaterialSectionId(created.id);
      setMaterialCardId("");
      setMaterialCreating("");
      notify(`Disciplina “${created.title}” criada. Agora adicione o primeiro assunto.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a disciplina.",
      );
    } finally {
      setMaterialTaxonomySaving("");
    }
  };

  const createMaterialSubject = async (inputValue: string) => {
    const title = inputValue.trim();
    if (!title || !materialRole || !materialSectionId) return;
    setMaterialTaxonomySaving("subject");
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      const created = await adminApi.createStudySubject(
        roleId,
        materialSectionId,
        title,
      );
      resetMaterialEditor();
      await load();
      setMaterialRoleId(roleId);
      setMaterialSectionId(materialSectionId);
      setMaterialCardId(created.id);
      setMaterialCreating("");
      notify(
        created.synchronizedPlans > 0
          ? `Assunto criado e sincronizado com ${created.synchronizedPlans} plano(s).`
          : `Assunto “${created.title}” criado na biblioteca compartilhada.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar o assunto.",
      );
    } finally {
      setMaterialTaxonomySaving("");
    }
  };

  const deleteSelectedSubject = async () => {
    if (!materialRole || !materialSection || !materialCard) return;
    const subjectTitle = String(materialCard.title || "Assunto");
    const disciplineTitle = String(materialSection.title || "Disciplina");
    const confirmed = window.confirm(
      `Remover o assunto “${subjectTitle}” de “${disciplineTitle}” no cargo “${materialRole.label}”?\n\nEle também será retirado dos planos vinculados a este cargo. O conteúdo da biblioteca compartilhada será preservado para outros cargos.`,
    );
    if (!confirmed) return;
    setMaterialDeleting("subject");
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      const result = await adminApi.deleteStudySubject(
        roleId,
        materialSectionId,
        materialCardId,
      );
      resetMaterialEditor();
      setMaterialCreating("");
      await load();
      setMaterialRoleId(roleId);
      setMaterialSectionId(materialSectionId);
      setMaterialCardId("");
      notify(
        result.synchronizedPlans > 0
          ? `Assunto removido e ${result.synchronizedPlans} plano(s) atualizado(s).`
          : `Assunto “${result.title}” removido do cargo.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover o assunto.",
      );
    } finally {
      setMaterialDeleting("");
    }
  };

  const deleteSelectedDiscipline = async () => {
    if (!materialRole || !materialSection) return;
    const disciplineTitle = String(materialSection.title || "Disciplina");
    const subjectCount = materialCards.length;
    const confirmed = window.confirm(
      `Remover a disciplina inteira “${disciplineTitle}” do cargo “${materialRole.label}”?\n\n${subjectCount} assunto(s) serão retirados deste cargo e dos planos vinculados. Os materiais compartilhados continuarão disponíveis para outros cargos.`,
    );
    if (!confirmed) return;
    setMaterialDeleting("discipline");
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      const result = await adminApi.deleteStudyDiscipline(
        roleId,
        materialSectionId,
      );
      resetMaterialEditor();
      setMaterialCreating("");
      await load();
      setMaterialRoleId(roleId);
      setMaterialSectionId("");
      setMaterialCardId("");
      notify(
        result.synchronizedPlans > 0
          ? `Disciplina removida e ${result.synchronizedPlans} plano(s) atualizado(s).`
          : `Disciplina “${result.title}” removida do cargo.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível remover a disciplina.",
      );
    } finally {
      setMaterialDeleting("");
    }
  };

  const submitStudyMaterial = async (event: FormEvent) => {
    event.preventDefault();
    if (!materialRole?.databaseId || !materialSectionId || !materialCardId) {
      setError("Selecione o cargo, a disciplina e o assunto do material.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      const payload = {
        sectionId: materialSectionId,
        cardId: materialCardId,
        title: materialTitle.trim(),
        content: materialContent.trim(),
        keyTakeaways: subjectLines(materialKeyPoints),
      };
      const result = editingBaseMaterial
        ? await adminApi.updateBaseStudyMaterial(roleId, {
            sectionId: payload.sectionId,
            cardId: payload.cardId,
            content: payload.content,
            keyTakeaways: payload.keyTakeaways,
          })
        : editingMaterialId
          ? await adminApi.updateStudyMaterial(
              roleId,
              editingMaterialId,
              payload,
            )
          : await adminApi.addStudyMaterial(roleId, payload);
      resetMaterialEditor();
      await load();
      notify(
        result.synchronizedPlans > 0
          ? `Material salvo e sincronizado com ${result.synchronizedPlans} plano(s) ativo(s).`
          : "Material salvo no assunto.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível adicionar o material.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetMaterialEditor = () => {
    setMaterialTitle("");
    setMaterialContent("");
    setMaterialKeyPoints("");
    setEditingMaterialId("");
    setEditingBaseMaterial(false);
    setMaterialPreviewOpen(false);
  };
  const editBaseMaterial = () => {
    if (!effectiveMaterialCard) return;
    setEditingBaseMaterial(true);
    setEditingMaterialId("");
    setMaterialTitle("");
    setMaterialContent(String(effectiveMaterialCard.content || ""));
    setMaterialKeyPoints(
      Array.isArray(effectiveMaterialCard.keyTakeaways)
        ? effectiveMaterialCard.keyTakeaways.map(String).join("\n")
        : "",
    );
  };
  const editAdditionalMaterial = (block: Record<string, unknown>) => {
    setEditingBaseMaterial(false);
    setEditingMaterialId(String(block.id || ""));
    setMaterialTitle(String(block.title || ""));
    setMaterialContent(String(block.content || ""));
    setMaterialKeyPoints(
      Array.isArray(block.keyTakeaways)
        ? block.keyTakeaways.map(String).join("\n")
        : "",
    );
  };
  const deleteMaterial = async (
    kind: "base" | "additional",
    materialId = "",
  ) => {
    if (!materialRole?.databaseId || !materialSectionId || !materialCardId)
      return;
    const label = kind === "base" ? "o material principal" : "este capítulo";
    if (!window.confirm(`Excluir ${label}? Esta ação não poderá ser desfeita.`))
      return;
    setSaving(true);
    setError("");
    try {
      const roleId = await ensureMaterialRoleInDatabase();
      if (kind === "base")
        await adminApi.deleteBaseStudyMaterial(
          roleId,
          materialSectionId,
          materialCardId,
        );
      else
        await adminApi.deleteStudyMaterial(
          roleId,
          materialId,
          materialSectionId,
          materialCardId,
        );
      resetMaterialEditor();
      await load();
      notify("Material excluído.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir o material.",
      );
    } finally {
      setSaving(false);
    }
  };

  const parseOptions = (value: string) =>
    value
      .split("\n")
      .map((line) => {
        const [label, ...parts] = line.split("|");
        return { label: label.trim(), text: parts.join("|").trim() };
      })
      .filter((option) => option.label && option.text);
  const parseFixationTips = (value: string) =>
    value.split("\n").map((line) => line.trim()).filter(Boolean);
  const parseComparisonRows = (value: string) =>
    value.split("\n").map((line) => {
      const [criterion, left, right] = line.split("|").map((part) => part.trim());
      return { criterion, left, right };
    }).filter((row) => row.criterion && row.left && row.right);
  const parseComparisonHeaders = (value: string) => {
    const [criterion, left, right] = value.split("|").map((part) => part.trim());
    return criterion && left && right ? { criterion, left, right } : undefined;
  };
  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...questionForm,
      passageId: questionForm.passageId || null,
      options: parseOptions(questionForm.options),
      fixationTips: parseFixationTips(questionForm.fixationTips),
      comparisonHeaders: parseComparisonHeaders(questionForm.comparisonHeaders),
      comparisonRows: parseComparisonRows(questionForm.comparisonRows),
    };
    const nextQuestion = editingQuestion
      ? emptyQuestion
      : {
          ...emptyQuestion,
          category: questionForm.category,
          topic: questionForm.topic,
          board: questionForm.board,
          type: questionForm.type,
          reference: questionForm.reference,
          passageId: questionForm.passageId,
        };
    void run(
      () =>
        editingQuestion
          ? adminApi.updateQuestion(editingQuestion, payload)
          : adminApi.createQuestion(payload),
      editingQuestion ? "Questão atualizada." : "Questão cadastrada.",
      () => {
        setQuestionForm(nextQuestion);
        setEditingQuestion("");
        setQuestions([]);
        setHasSearchedQuestions(false);
        void loadReports();
      },
    );
  };
  const submitQuestionBatch = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(questionBatchJson);
    } catch {
      setError(
        "O JSON informado é inválido. Revise vírgulas, aspas e colchetes.",
      );
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setError("Informe um array JSON com pelo menos uma questão.");
      return;
    }
    if (parsed.length > 500) {
      setError("Cada importação pode conter no máximo 500 questões.");
      return;
    }
    for (let index = 0; index < parsed.length; index++) {
      const item = parsed[index];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        setError(`Questão ${index + 1}: cada item deve ser um objeto JSON.`);
        return;
      }
      const question = item as Record<string, unknown>;
      const missing = [
        "category",
        "board",
        "type",
        "text",
        "correct",
      ].find(
        (field) =>
          typeof question[field] !== "string" ||
          !String(question[field]).trim(),
      );
      if (missing) {
        setError(`Questão ${index + 1}: o campo “${missing}” é obrigatório.`);
        return;
      }
      if (
        String(question.type).toUpperCase() === "MULTIPLE_CHOICE" &&
        (!Array.isArray(question.options) || question.options.length < 2)
      ) {
        setError(
          `Questão ${index + 1}: questões de múltipla escolha precisam de pelo menos duas alternativas.`,
        );
        return;
      }
    }
    setSaving(true);
    try {
      const result = await adminApi.importQuestions(
        parsed as Record<string, unknown>[],
      );
      setQuestionBatchJson("");
      setQuestionBatchImporterOpen(false);
      setQuestions([]);
      setHasSearchedQuestions(false);
      notify(`${result.imported} questão(ões) importada(s) com sucesso.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível importar as questões.",
      );
    } finally {
      setSaving(false);
    }
  };

  const editQuestion = (item: AdminQuestion) => {
    setQuestionForm({
      category: item.category,
      topic: item.topic,
      board: item.board,
      type: item.type,
      text: item.text,
      correct: item.correct,
      explanation: item.explanation || "",
      detailedTopic: item.detailedTopic || "",
      conceptExplanation: item.conceptExplanation || "",
      decisiveEvidence: item.decisiveEvidence || "",
      answerAnalysis: item.answerAnalysis || "",
      examTrap: item.examTrap || "",
      fixationTips: (item.fixationTips || []).join("\n"),
      comparisonHeaders: item.comparisonHeaders ? `${item.comparisonHeaders.criterion} | ${item.comparisonHeaders.left} | ${item.comparisonHeaders.right}` : "",
      comparisonRows: (item.comparisonRows || []).map((row) => `${row.criterion} | ${row.left} | ${row.right}`).join("\n"),
      reference: item.reference || "",
      passageId: item.passageId || "",
      status: item.status || "ACTIVE",
      options: item.options
        .map((option) => `${option.label} | ${option.text}`)
        .join("\n"),
    });
    setEditingQuestion(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const searchQuestions = async (event?: FormEvent, page = 1) => {
    event?.preventDefault();
    setQuestionsLoading(true);
    setError("");
    setHasSearchedQuestions(true);
    try {
      const result = await adminApi.questions({
        query: questionSearch.trim(),
        area: questionArea,
        page,
        pageSize: 10,
      });
      setQuestions(result.items);
      setQuestionPage(result.page);
      setQuestionTotal(result.total);
      setQuestionTotalPages(result.totalPages);
      setQuestionAreas(result.areas);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível pesquisar as questões.",
      );
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };
  useEffect(() => {
    if (section === "questions" && !hasSearchedQuestions)
      void searchQuestions(undefined, 1);
  }, [section, hasSearchedQuestions]);
  const editReportedQuestion = async (report: AdminQuestionReport) => {
    if (!report.questionId) {
      setError(
        "Esta sinalização pertence a uma questão local ou gerada e não possui cadastro editável no banco.",
      );
      return;
    }
    setQuestionsLoading(true);
    setError("");
    try {
      const result = await adminApi.questions({
        query: report.questionId,
        pageSize: 10,
      });
      if (!result.items[0]) throw new Error("Questão sinalizada não encontrada.");
      editQuestion(result.items[0]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível abrir a questão sinalizada.",
      );
    } finally {
      setQuestionsLoading(false);
    }
  };
  const reviewReport = async (
    report: AdminQuestionReport,
    status: "RESOLVED" | "DISMISSED",
  ) => {
    const note =
      window.prompt(
        status === "RESOLVED"
          ? "Informe o que foi corrigido (opcional):"
          : "Motivo para descartar a sinalização (opcional):",
        "",
      ) ?? null;
    if (note === null) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.reviewQuestionReport(report.id, status, note);
      await loadReports();
      notify(
        status === "RESOLVED"
          ? "Sinalização marcada como corrigida."
          : "Sinalização descartada.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível analisar a sinalização.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = (
    label: string,
    operation: () => Promise<unknown>,
    afterRemove: () => void = () => {},
  ) => {
    if (
      !window.confirm(`Excluir “${label}”? Esta ação não poderá ser desfeita.`)
    )
      return;
    void run(operation, "Registro excluído.", afterRemove);
  };

  const tabs: Array<{
    id: AdminSection;
    label: string;
    icon: typeof Building2;
    count: number;
  }> = [
    {
      id: "contests",
      label: "Concursos",
      icon: Building2,
      count: contests.length,
    },
    {
      id: "roles",
      label: "Editais e cargos",
      icon: UsersRound,
      count: roles.length,
    },
    {
      id: "passages",
      label: "Textos de apoio",
      icon: BookOpenText,
      count: passages.length,
    },
    {
      id: "questions",
      label: "Questões",
      icon: FileQuestion,
      count: questionReports.length,
    },
    {
      id: "subjects",
      label: "Biblioteca de assuntos",
      icon: BookOpenText,
      count: sharedStudyLibrary.length,
    },
    {
      id: "materials",
      label: "Materiais de estudo",
      icon: LibraryBig,
      count: totalStudyMaterials,
    },
  ];

  if (loading && !contests.length)
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-slate-500">
        <LoaderCircle className="animate-spin" /> Carregando painel
        administrativo…
      </div>
    );

  return (
    <main className="admin-panel mx-auto w-full max-w-7xl animate-fade-in pb-12">
      <header className="admin-panel-hero mb-6 rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <span className="text-xs font-black uppercase tracking-[.18em] text-indigo-300">
          Administração
        </span>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
          Catálogo e banco de conteúdo
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Cadastre concursos, datas de prova, editais por cargo, conteúdos
          programáticos, questões e textos vinculados. Os concursos ativos
          passam a alimentar automaticamente a criação dos planos.
        </p>
      </header>

      <nav
        className="admin-section-nav mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm min-[1200px]:hidden"
        aria-label="Seções administrativas"
      >
        <label className="admin-section-select">
          <span>Gerenciar</span>
          <Select<SelectOption, false>
            classNamePrefix="admin-react-select"
            options={tabs.map((tab) => ({
              value: tab.id,
              label: `${tab.label}${tab.count ? ` (${tab.count})` : ""}`,
            }))}
            value={tabs
              .map((tab) => ({
                value: tab.id,
                label: `${tab.label}${tab.count ? ` (${tab.count})` : ""}`,
              }))
              .find((option) => option.value === section) || null}
            onChange={(option) => {
              if (!option) return;
              const nextSection = option.value as AdminSection;
              setSection(nextSection);
              onSectionChange?.(nextSection);
              setError("");
            }}
            isSearchable={false}
            menuPlacement="auto"
            menuPosition="fixed"
            menuPortalTarget={document.body}
            maxMenuHeight={240}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 200,
                maxWidth: "calc(100vw - 32px)",
              }),
              menu: (base) => ({
                ...base,
                width: "100%",
                maxWidth: "calc(100vw - 32px)",
              }),
            }}
          />
        </label>
      </nav>

      {error && (
        <div
          className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
          role="status"
        >
          {success}
        </div>
      )}

      {section === "contests" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.8fr)]">
          <AdminCard
            title={editingContest ? "Editar concurso" : "Novo concurso"}
            description="A data da prova define automaticamente a estratégia e a duração do cronograma."
          >
            <form
              onSubmit={submitContest}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="Nome do concurso">
                <input
                  required
                  className={inputClass}
                  value={contestForm.label}
                  onChange={(e) =>
                    setContestForm((v) => ({
                      ...v,
                      label: e.target.value,
                      id:
                        !v.id || v.id === slugify(v.label)
                          ? slugify(e.target.value)
                          : v.id,
                    }))
                  }
                  placeholder="Ex.: Secretaria de Estado da Saúde"
                />
              </Field>
              <Field label="Sigla">
                <input
                  required
                  className={inputClass}
                  value={contestForm.acronym}
                  onChange={(e) =>
                    setContestForm((v) => ({ ...v, acronym: e.target.value }))
                  }
                />
              </Field>
              <Field label="Órgão">
                <input
                  required
                  className={inputClass}
                  value={contestForm.organization}
                  onChange={(e) =>
                    setContestForm((v) => ({
                      ...v,
                      organization: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Banca">
                <input
                  required
                  className={inputClass}
                  value={contestForm.board}
                  onChange={(e) =>
                    setContestForm((v) => ({ ...v, board: e.target.value }))
                  }
                  placeholder="CEBRASPE, FGV…"
                />
              </Field>
              <Field label="Data da prova">
                <ExamDatePicker
                  value={contestForm.examDate}
                  onChange={(examDate) =>
                    setContestForm((v) => ({ ...v, examDate }))
                  }
                />
              </Field>
              <Field label="Situação">
                <input
                  required
                  className={inputClass}
                  value={contestForm.status}
                  onChange={(e) =>
                    setContestForm((v) => ({ ...v, status: e.target.value }))
                  }
                />
              </Field>
              <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-extrabold text-indigo-700">
                  Informações complementares (opcional)
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Código interno automático">
                    <input
                      required
                      className={inputClass}
                      value={contestForm.id}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          id: slugify(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Estado">
                    <input
                      className={inputClass}
                      value={contestForm.state}
                      onChange={(e) =>
                        setContestForm((v) => ({ ...v, state: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Área">
                    <input
                      className={inputClass}
                      value={contestForm.area}
                      onChange={(e) =>
                        setContestForm((v) => ({ ...v, area: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Escolaridade">
                    <input
                      className={inputClass}
                      value={contestForm.education}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          education: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Vagas">
                    <input
                      className={inputClass}
                      value={contestForm.vacancies}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          vacancies: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Remuneração">
                    <input
                      className={inputClass}
                      value={contestForm.remuneration}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          remuneration: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Local">
                    <input
                      className={inputClass}
                      value={contestForm.location}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          location: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Referência/link do edital">
                    <input
                      className={inputClass}
                      value={contestForm.noticeReference}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          noticeReference: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Descrição" wide>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={contestForm.description}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          description: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Etapas" wide>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={contestForm.stages}
                      onChange={(e) =>
                        setContestForm((v) => ({
                          ...v,
                          stages: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </details>
              <div className="sm:col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-800">
                      Edital em PDF
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      O aluno poderá abrir o documento diretamente na área de Concursos. PDF de até 15 MB.
                    </p>
                  </div>
                </div>
                <label className="mt-3 block">
                  <span className="sr-only">Selecionar edital em PDF</span>
                  <input
                    key={contestNoticeInputKey}
                    type="file"
                    accept="application/pdf,.pdf"
                    className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-white`}
                    onChange={(event) =>
                      selectContestNoticePdf(event.target.files?.[0])
                    }
                  />
                </label>
                {contestNoticePdf && (
                  <p className="mt-2 flex items-center gap-2 text-xs font-bold text-indigo-700">
                    <Upload className="h-4 w-4" />
                    Novo arquivo: {contestNoticePdf.name} ({formatFileSize(contestNoticePdf.size)})
                  </p>
                )}
                {editingContestRecord?.noticePdfAvailable && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-100 bg-white p-3">
                    <p className="mr-auto min-w-0 text-xs font-bold text-slate-600">
                      Atual: {editingContestRecord.noticePdfName || "edital.pdf"}
                      {editingContestRecord.noticePdfSize
                        ? ` · ${formatFileSize(editingContestRecord.noticePdfSize)}`
                        : ""}
                    </p>
                    <button
                      type="button"
                      className={buttonSecondary}
                      disabled={openingNoticePdf === editingContestRecord.databaseId}
                      onClick={() => void viewContestNoticePdf(editingContestRecord)}
                    >
                      {openingNoticePdf === editingContestRecord.databaseId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Visualizar
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 hover:bg-rose-50"
                      disabled={saving}
                      onClick={() => removeContestNoticePdf(editingContestRecord)}
                    >
                      <Trash2 className="h-4 w-4" /> Remover PDF
                    </button>
                  </div>
                )}
              </div>
              <Check
                label="Concurso ativo e visível"
                checked={contestForm.active}
                onChange={(checked) =>
                  setContestForm((v) => ({ ...v, active: checked }))
                }
              />
              <p className="sm:col-span-2 -mt-1 text-xs leading-5 text-slate-500">
                Após salvar o concurso, cadastre cada função na seção
                <strong className="font-extrabold text-slate-700"> Editais e cargos</strong>.
                A quantidade de vagas é o total de postos previsto no edital.
              </p>
              <FormActions
                saving={saving}
                editing={Boolean(editingContest)}
                cancel={resetContestEditor}
              />
            </form>
          </AdminCard>
          <AdminCard
            title="Concursos cadastrados"
            description="Concursos vencidos deixam de aparecer para o aluno no dia seguinte à prova."
          >
            <div className="space-y-3">
              {contests.map((item) => (
                <RecordCard
                  key={item.databaseId || item.id}
                  title={item.label}
                  eyebrow={`${item.acronym} · ${item.board}`}
                  details={`${item.examDate.split("-").reverse().join("/")} · Vagas: ${item.vacancies || "Conforme edital"} · ${item.roles.length === 0 ? "Sem cargos cadastrados" : `${item.roles.length} ${item.roles.length === 1 ? "cargo cadastrado" : "cargos cadastrados"}`} · ${item.active === false ? "Inativo" : item.status}${item.noticePdfAvailable ? " · Edital em PDF" : ""}`}
                  onEdit={() => editContest(item)}
                  onDelete={() =>
                    item.databaseId &&
                    remove(item.label, () =>
                      adminApi.deleteContest(item.databaseId!),
                    )
                  }
                />
              ))}
              {!contests.length && <Empty />}
            </div>
          </AdminCard>
        </div>
      )}

      {section === "roles" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
          <AdminCard
            title={editingRole ? "Editar edital/cargo" : "Novo edital/cargo"}
            description="Cadastre as disciplinas e cole os assuntos do edital; o cronograma será estruturado automaticamente."
          >
            <form onSubmit={submitRole} className="grid gap-4 sm:grid-cols-2">
              <Field label="Concurso">
                <select
                  required
                  className={inputClass}
                  value={roleForm.contestId}
                  onChange={(e) => {
                    const selected = contests.find(
                      (item) => item.databaseId === e.target.value,
                    );
                    setRoleForm((v) => {
                      const courseAutomatic =
                        !v.courseId ||
                        v.courseId === slugify(v.label) ||
                        v.courseId === automaticCourseId(v.contestId, v.label);
                      return {
                        ...v,
                        contestId: e.target.value,
                        board: v.board || selected?.board || "",
                        courseId: courseAutomatic
                          ? automaticCourseId(e.target.value, v.label)
                          : v.courseId,
                      };
                    });
                  }}
                >
                  <option value="">Selecione</option>
                  {contests.map((item) => (
                    <option key={item.databaseId} value={item.databaseId}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nome do cargo">
                <input
                  required
                  className={inputClass}
                  value={roleForm.label}
                  onChange={(e) =>
                    setRoleForm((v) => {
                      const automatic = !v.id || v.id === slugify(v.label);
                      const courseAutomatic =
                        !v.courseId ||
                        v.courseId === slugify(v.label) ||
                        v.courseId === automaticCourseId(v.contestId, v.label);
                      return {
                        ...v,
                        label: e.target.value,
                        id: automatic ? slugify(e.target.value) : v.id,
                        courseId: courseAutomatic
                          ? automaticCourseId(v.contestId, e.target.value)
                          : v.courseId,
                      };
                    })
                  }
                  placeholder="Ex.: Técnico em Enfermagem"
                />
              </Field>
              <Field label="Banca">
                <input
                  required
                  className={inputClass}
                  value={roleForm.board}
                  onChange={(e) =>
                    setRoleForm((v) => ({ ...v, board: e.target.value }))
                  }
                />
              </Field>
              <div className="flex flex-wrap items-end gap-5">
                <Check
                  label="Tem discursiva"
                  checked={roleForm.includeDiscursive}
                  onChange={(checked) =>
                    setRoleForm((v) => ({ ...v, includeDiscursive: checked }))
                  }
                />
                <Check
                  label="Ativo"
                  checked={roleForm.active}
                  onChange={(checked) =>
                    setRoleForm((v) => ({ ...v, active: checked }))
                  }
                />
              </div>
              <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-extrabold text-indigo-700">
                  Dados complementares do cargo (opcional)
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Código do cargo automático">
                    <input
                      required
                      className={inputClass}
                      value={roleForm.id}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          id: slugify(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Identificador do curso automático">
                    <input
                      required
                      className={inputClass}
                      value={roleForm.courseId}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          courseId: slugify(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Carga estimada (horas)">
                    <input
                      required
                      min="1"
                      type="number"
                      className={inputClass}
                      value={roleForm.estimatedHours}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          estimatedHours: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Requisito">
                    <input
                      className={inputClass}
                      value={roleForm.requirement}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          requirement: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Remuneração">
                    <input
                      className={inputClass}
                      value={roleForm.remuneration}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          remuneration: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Vagas">
                    <input
                      className={inputClass}
                      value={roleForm.vacancies}
                      onChange={(e) =>
                        setRoleForm((v) => ({
                          ...v,
                          vacancies: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </details>
              <div className="sm:col-span-2">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-indigo-50 p-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                      Conteúdo do edital
                    </span>
                    <h4 className="mt-1 font-black text-slate-950">
                      Disciplinas e assuntos
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Informe os assuntos exatamente como aparecem no edital, um
                      por linha e distribua os 100% de peso entre as
                      disciplinas. O sistema usa essa divisão para montar o
                      cronograma automaticamente.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                      <strong className="block text-lg text-indigo-700">
                        {curriculumDisciplines.length}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-500">
                        disciplinas
                      </span>
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 text-center shadow-sm ${
                        Math.abs(curriculumWeightRemaining) <= 0.01
                          ? "bg-emerald-100"
                          : curriculumWeightRemaining < 0
                            ? "bg-rose-100"
                            : "bg-white"
                      }`}
                    >
                      <strong
                        className={`block text-lg ${
                          Math.abs(curriculumWeightRemaining) <= 0.01
                            ? "text-emerald-700"
                            : curriculumWeightRemaining < 0
                              ? "text-rose-700"
                              : "text-indigo-700"
                        }`}
                      >
                        {formattedWeight(curriculumWeightTotal)}%
                      </strong>
                      <span className="block text-[10px] font-bold text-slate-500">
                        distribuído
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-500">
                        {Math.abs(curriculumWeightRemaining) <= 0.01
                          ? "100% concluído"
                          : curriculumWeightRemaining > 0
                            ? `${formattedWeight(curriculumWeightRemaining)}% disponível`
                            : `${formattedWeight(Math.abs(curriculumWeightRemaining))}% acima`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                    onClick={expandAllCurriculumDisciplines}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expandir todas
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    onClick={collapseAllCurriculumDisciplines}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    Recolher todas
                  </button>
                </div>
                <div className="space-y-4">
                  {curriculumDisciplines.map((discipline, index) => {
                    const isDisciplineExpanded =
                      expandedCurriculumDisciplineKeys === "all" ||
                      expandedCurriculumDisciplineKeys === discipline.key;
                    const groupLabel = normalizeStudyGroup(discipline.category);
                    const applicableSharedDisciplineOptions =
                      sharedDisciplineOptionsByGroup.get(groupLabel) || [];
                    const applicableSharedSubjects = sharedStudyLibrary.filter(
                      (subject) =>
                        sharedSubjectStudyGroup(subject) === groupLabel &&
                        normalizeStudyText(subject.discipline) ===
                          normalizeStudyText(discipline.title),
                    );
                    const selectedSubjectTitles = subjectLines(
                      discipline.subjectsText,
                    );
                    const subjectOptions = [
                      ...applicableSharedSubjects.map((subject) => ({
                        value: subject.title,
                        label: subject.title,
                      })),
                      ...selectedSubjectTitles
                        .filter(
                          (title) =>
                            !applicableSharedSubjects.some(
                              (subject) =>
                                normalizeStudySubjectTitle(subject.title) ===
                                normalizeStudySubjectTitle(title),
                            ),
                        )
                        .map((title) => ({
                          value: title,
                          label: `${title} — material não cadastrado`,
                        })),
                    ];
                    return (
                      <section
                        key={discipline.key}
                        className="admin-curriculum-card rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-expanded={isDisciplineExpanded}
                            aria-controls={`discipline-content-${discipline.key}`}
                            onClick={() =>
                              toggleCurriculumDiscipline(discipline.key)
                            }
                          >
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-indigo-600 transition-transform ${
                                isDisciplineExpanded ? "" : "-rotate-90"
                              }`}
                            />
                            <span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                                Disciplina {index + 1}
                              </span>
                              <h5 className="text-sm font-black text-slate-900">
                                {discipline.title || "Nova disciplina"}
                              </h5>
                            </span>
                          </button>
                          {curriculumDisciplines.length > 1 && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                              onClick={() =>
                                setCurriculumDisciplines((current) =>
                                  current.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover
                            </button>
                          )}
                        </div>
                        {isDisciplineExpanded && (
                          <div
                            id={`discipline-content-${discipline.key}`}
                            className="grid gap-4 sm:grid-cols-2"
                          >
                        <Field label="Nome da disciplina" className="-order-1">
                          <CreatableSelect<SelectOption, false>
                            required
                            inputId={`discipline-title-${discipline.key}`}
                            classNamePrefix="admin-react-select"
                            options={applicableSharedDisciplineOptions}
                            value={
                              discipline.title
                                ? {
                                    value: discipline.title,
                                    label: discipline.title,
                                  }
                                : null
                            }
                            onChange={(option) => {
                              if (!option) {
                                updateDiscipline(index, { title: "" });
                                return;
                              }
                              applySharedDiscipline(
                                index,
                                option.value,
                                discipline.category,
                              );
                            }}
                            onCreateOption={(title) =>
                              updateDiscipline(index, {
                                title: title.trim(),
                              })
                            }
                            formatCreateLabel={(title) =>
                              `Criar nova disciplina “${title}”`
                            }
                            placeholder={`Selecione ou crie uma disciplina de ${groupLabel}`}
                            noOptionsMessage={() =>
                              "Digite para criar uma nova disciplina"
                            }
                            isClearable
                            isSearchable
                            maxMenuHeight={220}
                            menuPosition="fixed"
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 80 }),
                            }}
                          />
                          <span className="mt-1 block text-[11px] text-slate-500">
                            Mostrando disciplinas de {groupLabel}. Ao escolher
                            uma pronta, seus assuntos e materiais são
                            incluídos. Para uma nova, digite o nome e pressione
                            Enter.
                          </span>
                        </Field>
                        <Field label="Grupo" className="order-first">
                          <select
                            className={inputClass}
                            value={discipline.category}
                            onChange={(event) =>
                              updateDiscipline(index, {
                                category: event.target.value,
                              })
                            }
                          >
                            <option>Conhecimentos Gerais</option>
                            <option>Conhecimentos Específicos</option>
                          </select>
                        </Field>
                        <Field label="Peso da disciplina no edital (%)">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            inputMode="decimal"
                            className={inputClass}
                            value={weightNumber(discipline.weight) ?? ""}
                            onChange={(event) =>
                              updateDiscipline(index, {
                                weight: event.target.value,
                              })
                            }
                            placeholder="Ex.: 20"
                          />
                          <span className="mt-1 block text-[11px] text-slate-500">
                            A soma de todas as disciplinas deve fechar em 100%.
                          </span>
                        </Field>
                        <Field label="Assuntos do edital" wide>
                          <Select<SelectOption, true>
                            required
                            inputId={`discipline-subjects-${discipline.key}`}
                            classNamePrefix="admin-react-select"
                            options={subjectOptions}
                            value={subjectOptions.filter((option) =>
                              selectedSubjectTitles.some(
                                (title) =>
                                  normalizeStudySubjectTitle(title) ===
                                  normalizeStudySubjectTitle(option.value),
                              ),
                            )}
                            onChange={(options) =>
                              selectSubjectsForDiscipline(
                                index,
                                options.map((option) => option.value),
                              )
                            }
                            placeholder={
                              discipline.title
                                ? "Selecione os assuntos deste edital"
                                : "Escolha primeiro a disciplina"
                            }
                            noOptionsMessage={() =>
                              discipline.title
                                ? "Nenhum assunto cadastrado para esta disciplina e grupo"
                                : "Escolha primeiro a disciplina"
                            }
                            isDisabled={!discipline.title}
                            isMulti
                            isSearchable
                            closeMenuOnSelect={false}
                            maxMenuHeight={240}
                            menuPosition="fixed"
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 80 }),
                            }}
                          />
                          <span className="mt-1 block text-[11px] text-slate-500">
                            {subjectLines(discipline.subjectsText).length}{" "}
                            assunto(s) informado(s)
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-500">
                            Para criar outro assunto, use a Biblioteca de
                            assuntos. Os itens selecionados já incluem o
                            material de estudo pronto.
                          </span>
                        </Field>
                        <details className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
                          <summary className="cursor-pointer text-xs font-extrabold text-indigo-700">
                            Configurações avançadas do planejamento (opcional)
                          </summary>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label="Dificuldade">
                              <select
                                className={inputClass}
                                value={discipline.difficulty}
                                onChange={(event) =>
                                  updateDiscipline(index, {
                                    difficulty: event.target.value as Difficulty,
                                  })
                                }
                              >
                                <option>Fácil</option>
                                <option>Médio</option>
                                <option>Difícil</option>
                              </select>
                            </Field>
                            <Field label="Justificativa da prioridade">
                              <textarea
                                rows={4}
                                className={inputClass}
                                value={discipline.justification}
                                onChange={(event) =>
                                  updateDiscipline(index, {
                                    justification: event.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Check
                              label="Alta prioridade / cai muito"
                              checked={discipline.highPriority}
                              onChange={(checked) =>
                                updateDiscipline(index, {
                                  highPriority: checked,
                                })
                              }
                            />
                          </div>
                        </details>
                        </div>
                      )}
                    </section>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className={`${buttonSecondary} mt-4 w-full border-dashed border-indigo-300 text-indigo-700`}
                  onClick={addCurriculumDiscipline}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar outra disciplina
                </button>
              </div>
              <FormActions
                saving={saving}
                editing={Boolean(editingRole)}
                cancel={() => {
                  setRoleForm(emptyRole);
                  resetCurriculumDisciplines();
                  setEditingRole("");
                }}
              />
            </form>
          </AdminCard>
          <AdminCard
            title="Editais e cargos"
            description="Cada cargo possui seu próprio curso e conteúdo programático."
          >
            <div className="space-y-3">
              {roles.map((item) => (
                <RecordCard
                  key={item.databaseId || `${item.contest.id}-${item.id}`}
                  title={item.label}
                  eyebrow={item.contest.acronym}
                  details={`${item.courseId} · ${item.board} · ${item.active === false ? "Inativo" : "Ativo"}`}
                  onEdit={() => editRole(item)}
                  onDelete={() =>
                    item.databaseId &&
                    remove(item.label, () =>
                      adminApi.deleteRole(item.databaseId!),
                    )
                  }
                />
              ))}
              {!roles.length && <Empty />}
            </div>
          </AdminCard>
        </div>
      )}

      {section === "subjects" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
          <AdminCard
            title={
              editingSharedSubject
                ? "Editar assunto da biblioteca"
                : "Novo assunto da biblioteca"
            }
            description="Cadastre o assunto, seu objetivo e o resumo de revisão uma única vez. Depois, ele poderá ser selecionado em qualquer edital compatível."
          >
            <form
              onSubmit={submitSharedSubject}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="Grupo">
                <select
                  className={inputClass}
                  value={sharedSubjectForm.studyGroup}
                  onChange={(event) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      studyGroup: event.target.value,
                    }))
                  }
                >
                  <option>Conhecimentos Gerais</option>
                  <option>Conhecimentos Específicos</option>
                </select>
              </Field>
              <Field label="Disciplina">
                <CreatableSelect<SelectOption, false>
                  inputId="shared-subject-discipline"
                  classNamePrefix="admin-react-select"
                  options={
                    sharedDisciplineOptionsByGroup.get(
                      sharedSubjectForm.studyGroup,
                    ) || []
                  }
                  value={
                    sharedSubjectForm.discipline
                      ? {
                          value: sharedSubjectForm.discipline,
                          label: sharedSubjectForm.discipline,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      discipline: option?.value || "",
                    }))
                  }
                  onCreateOption={(discipline) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      discipline: discipline.trim(),
                    }))
                  }
                  formatCreateLabel={(discipline) =>
                    `Criar disciplina “${discipline}”`
                  }
                  placeholder="Selecione ou crie a disciplina"
                  noOptionsMessage={() =>
                    "Digite para criar uma disciplina"
                  }
                  isClearable
                  isSearchable
                  maxMenuHeight={220}
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 80 }),
                  }}
                />
              </Field>
              <Field label="Nome do assunto" wide>
                <input
                  required
                  disabled={Boolean(editingSharedSubject)}
                  className={inputClass}
                  value={sharedSubjectForm.title}
                  onChange={(event) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Interpretação de textos"
                />
                {editingSharedSubject && (
                  <span className="mt-1 block text-[11px] text-slate-500">
                    O nome do assunto não é alterado para preservar os vínculos
                    já usados nos cargos.
                  </span>
                )}
              </Field>
              <Field label="Objetivo do estudo" wide>
                <textarea
                  required
                  rows={5}
                  className={inputClass}
                  value={sharedSubjectForm.studyObjective}
                  onChange={(event) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      studyObjective: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Compreender como identificar a ideia principal e as informações implícitas no texto."
                />
              </Field>
              <Field label="Resumo para revisão — um item por linha" wide>
                <textarea
                  rows={5}
                  className={inputClass}
                  value={sharedSubjectForm.reviewSummary}
                  onChange={(event) =>
                    setSharedSubjectForm((current) => ({
                      ...current,
                      reviewSummary: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Ideia principal é o núcleo da mensagem\nInferência decorre de pistas do texto"
                />
              </Field>
              <FormActions
                saving={saving}
                editing={Boolean(editingSharedSubject)}
                cancel={resetSharedSubjectEditor}
              />
            </form>
          </AdminCard>
          <AdminCard
            title="Assuntos cadastrados"
            description="Filtre a biblioteca e atualize o objetivo e o resumo que aparecerão no cronograma."
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                className={inputClass}
                value={sharedSubjectFilter}
                onChange={(event) => setSharedSubjectFilter(event.target.value)}
                placeholder="Pesquisar assunto ou disciplina"
              />
              <select
                className={inputClass}
                value={sharedSubjectGroupFilter}
                onChange={(event) =>
                  setSharedSubjectGroupFilter(
                    event.target.value as typeof sharedSubjectGroupFilter,
                  )
                }
              >
                <option value="ALL">Todos os grupos</option>
                <option>Conhecimentos Gerais</option>
                <option>Conhecimentos Específicos</option>
              </select>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setSharedSubjectSortMenuOpen((current) => !current)
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                  aria-label="Escolher ordenação dos assuntos"
                  aria-expanded={sharedSubjectSortMenuOpen}
                  aria-haspopup="menu"
                  title={`Ordenação: ${sharedSubjectSort === "alphabetical" ? "alfabética" : "numérica"}`}
                >
                  <Filter className="h-4 w-4" />
                </button>
                {sharedSubjectSortMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                  >
                    {[
                      ["alphabetical", "Ordem alfabética"],
                      ["numeric", "Ordem numérica"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={sharedSubjectSort === value}
                        onClick={() => {
                          setSharedSubjectSort(
                            value as typeof sharedSubjectSort,
                          );
                          setSharedSubjectSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                          sharedSubjectSort === value
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {groupedSharedSubjects.map((group) => {
                const groupKey = sharedSubjectGroupKey(group);
                const isExpanded = expandedSharedSubjectGroups.has(groupKey);
                return (
                <section
                  key={groupKey}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60"
                >
                  <header className="flex items-center justify-between gap-3 px-4 py-3">
                    <h4 className="text-sm font-black text-slate-900">
                      {group.discipline}
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleSharedSubjectGroup(group)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                      aria-label={`${isExpanded ? "Recolher" : "Mostrar"} assuntos de ${group.discipline}`}
                      aria-expanded={isExpanded}
                      title={isExpanded ? "Recolher assuntos" : "Exibir assuntos"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </header>
                  {isExpanded && (
                    <div className="space-y-2 border-t border-slate-200 bg-white/70 p-3">
                      {group.subjects.map((subject) => (
                        <RecordCard
                          key={subject.id}
                          title={subject.title}
                          eyebrow={group.studyGroup}
                          details={`${subject.reviewSummary.length} item(ns) de revisão · ${subject.studyObjective.trim() ? "objetivo cadastrado" : "objetivo pendente"}`}
                          onEdit={() => editSharedSubject(subject)}
                          onDelete={() => deleteSharedSubject(subject)}
                        />
                      ))}
                    </div>
                  )}
                </section>
                );
              })}
              {!groupedSharedSubjects.length && (
                <Empty text="Nenhum assunto encontrado neste grupo." />
              )}
            </div>
          </AdminCard>
        </div>
      )}

      {section === "materials" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
          <AdminCard
            title={
              editingBaseMaterial
                ? "Editar material principal"
                : editingMaterialId
                  ? "Editar capítulo"
                  : "Adicionar material ao assunto"
            }
            description="Crie, edite e exclua o conteúdo principal ou capítulos complementares de cada assunto."
          >
            <form id="study-material-form" onSubmit={submitStudyMaterial} className="space-y-4">
              <Field label="Concurso e cargo">
                <Select<SelectOption, false>
                  inputId="material-role-select"
                  classNamePrefix="admin-react-select"
                  options={materialRoleOptions}
                  value={
                    materialRoleOptions.find(
                      (option) => option.value === materialRoleId,
                    ) || null
                  }
                  onChange={(option) => {
                    resetMaterialEditor();
                    setMaterialCreating("");
                    setMaterialRoleId(option?.value || "");
                    setMaterialSectionId("");
                    setMaterialCardId("");
                  }}
                  placeholder="Selecione o cargo"
                  noOptionsMessage={() => "Nenhum cargo encontrado"}
                  isClearable
                  isSearchable={false}
                  maxMenuHeight={240}
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 80 }),
                  }}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Disciplina">
                  <CreatableSelect<SelectOption, false>
                    inputId="material-discipline-select"
                    classNamePrefix="admin-react-select"
                    options={
                      materialCreating === "discipline"
                        ? []
                        : materialSectionOptions
                    }
                    value={
                      materialCreating === "discipline"
                        ? null
                        : materialSectionOptions.find(
                            (option) => option.value === materialSectionId,
                          ) || null
                    }
                    onChange={(option) => {
                      resetMaterialEditor();
                      if (option?.value === CREATE_DISCIPLINE_OPTION.value) {
                        setMaterialCreating("discipline");
                        setMaterialSectionId("");
                        setMaterialCardId("");
                        return;
                      }
                      setMaterialCreating("");
                      setMaterialSectionId(option?.value || "");
                      setMaterialCardId("");
                    }}
                    onCreateOption={(value) =>
                      void createMaterialDiscipline(value)
                    }
                    formatCreateLabel={(value) =>
                      `Confirmar nova disciplina “${value}”`
                    }
                    isValidNewOption={(value) =>
                      materialCreating === "discipline" &&
                      Boolean(value.trim())
                    }
                    placeholder={
                      materialCreating === "discipline"
                        ? "Digite o nome da nova disciplina"
                        : materialRole
                          ? "Selecione uma disciplina"
                        : "Selecione primeiro o cargo"
                    }
                    noOptionsMessage={({ inputValue }) =>
                      materialCreating === "discipline"
                        ? inputValue
                          ? "Pressione Enter para confirmar"
                          : "Digite o nome da nova disciplina"
                        : "Nenhuma disciplina encontrada"
                    }
                    isClearable
                    isSearchable
                    autoFocus={materialCreating === "discipline"}
                    isDisabled={!materialRole || Boolean(materialTaxonomySaving)}
                    isLoading={materialTaxonomySaving === "discipline"}
                    maxMenuHeight={220}
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 80 }),
                    }}
                  />
                </Field>
                <Field label="Assunto">
                  <CreatableSelect<SelectOption, false>
                    inputId="material-subject-select"
                    classNamePrefix="admin-react-select"
                    options={
                      materialCreating === "subject" ? [] : materialCardOptions
                    }
                    value={
                      materialCreating === "subject"
                        ? null
                        : materialCardOptions.find(
                            (option) => option.value === materialCardId,
                          ) || null
                    }
                    onChange={(option) => {
                      resetMaterialEditor();
                      if (option?.value === CREATE_SUBJECT_OPTION.value) {
                        setMaterialCreating("subject");
                        setMaterialCardId("");
                        return;
                      }
                      setMaterialCreating("");
                      setMaterialCardId(option?.value || "");
                    }}
                    onCreateOption={(value) => void createMaterialSubject(value)}
                    formatCreateLabel={(value) =>
                      `Confirmar novo assunto “${value}”`
                    }
                    isValidNewOption={(value) =>
                      materialCreating === "subject" && Boolean(value.trim())
                    }
                    placeholder={
                      materialCreating === "subject"
                        ? "Digite o nome do novo assunto"
                        : materialSection
                          ? "Selecione um assunto"
                        : "Selecione primeiro a disciplina"
                    }
                    noOptionsMessage={({ inputValue }) =>
                      materialCreating === "subject"
                        ? inputValue
                          ? "Pressione Enter para confirmar"
                          : "Digite o nome do novo assunto"
                        : "Nenhum assunto encontrado"
                    }
                    isClearable
                    isSearchable
                    autoFocus={materialCreating === "subject"}
                    isDisabled={!materialSection || Boolean(materialTaxonomySaving)}
                    isLoading={materialTaxonomySaving === "subject"}
                    maxMenuHeight={220}
                    menuPosition="fixed"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 80 }),
                    }}
                  />
                </Field>
              </div>
              {(materialSection || materialCard) && !materialCreating && (
                <div className="flex flex-wrap justify-end gap-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                  {materialCard && (
                    <button
                      type="button"
                      disabled={Boolean(materialDeleting) || saving}
                      onClick={() => void deleteSelectedSubject()}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {materialDeleting === "subject" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remover assunto
                    </button>
                  )}
                  {materialSection && (
                    <button
                      type="button"
                      disabled={Boolean(materialDeleting) || saving}
                      onClick={() => void deleteSelectedDiscipline()}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-600 px-3 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {materialDeleting === "discipline" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remover disciplina inteira
                    </button>
                  )}
                </div>
              )}
              <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
                {materialCreating
                  ? `Digite o nome ${materialCreating === "discipline" ? "da nova disciplina" : "do novo assunto"} no seletor e pressione Enter. `
                  : "A primeira opção dos seletores permite criar uma nova disciplina ou assunto. "}
                As listas possuem altura limitada e rolagem interna.
                {materialCreating && (
                  <button
                    type="button"
                    className="ml-2 font-extrabold underline"
                    onClick={() => setMaterialCreating("")}
                  >
                    Cancelar criação
                  </button>
                )}
              </p>
              {!editingBaseMaterial && (
                <Field label={editingMaterialId ? "Título do capítulo" : "Título do novo capítulo"}>
                  <input
                    required
                    className={inputClass}
                    value={materialTitle}
                    onChange={(event) => setMaterialTitle(event.target.value)}
                    placeholder="Ex.: Estratégias e tipos de cópia de segurança"
                  />
                </Field>
              )}
              <Field label={editingBaseMaterial ? "Conteúdo principal" : "Conteúdo do capítulo"}>
                <textarea
                  required
                  rows={14}
                  className={inputClass}
                  value={materialContent}
                  onChange={(event) => setMaterialContent(event.target.value)}
                  placeholder="Escreva o conteúdo completo que será acrescentado ao assunto selecionado. Os parágrafos e quebras de linha serão preservados no leitor."
                />
              </Field>
              <Field label="Pontos-chave — um por linha">
                <textarea
                  rows={5}
                  className={inputClass}
                  value={materialKeyPoints}
                  onChange={(event) => setMaterialKeyPoints(event.target.value)}
                  placeholder={"Backup completo copia todos os dados\nBackup incremental copia somente as alterações"}
                />
              </Field>
              <button
                type="button"
                disabled={
                  !materialRoleId ||
                  !materialSectionId ||
                  !materialCardId ||
                  (!editingBaseMaterial && !materialTitle.trim()) ||
                  !materialContent.trim()
                }
                className={`${buttonSecondary} w-full`}
                onClick={() => setMaterialPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" /> Visualizar prévia
              </button>
              <button
                type="submit"
                disabled={
                  saving ||
                  !materialRoleId ||
                  !materialSectionId ||
                  !materialCardId ||
                  (!editingBaseMaterial && !materialTitle.trim()) ||
                  !materialContent.trim()
                }
                className={`${buttonPrimary} w-full`}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : editingBaseMaterial || editingMaterialId ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving
                  ? "Salvando…"
                  : editingBaseMaterial || editingMaterialId
                    ? "Salvar alterações"
                    : "Adicionar ao assunto"}
              </button>
              {(editingBaseMaterial || editingMaterialId) && (
                <button
                  type="button"
                  disabled={saving}
                  className={`${buttonSecondary} w-full`}
                  onClick={resetMaterialEditor}
                >
                  <X className="h-4 w-4" /> Cancelar edição
                </button>
              )}
            </form>
          </AdminCard>
          <AdminCard
            title={materialCard ? String(materialCard.title) : "Materiais do assunto"}
            description="Material principal e capítulos complementares vinculados ao assunto selecionado."
          >
            {!materialCard ? (
              <Empty text="Selecione um cargo, uma disciplina e um assunto para consultar os materiais." />
            ) : (
              <div className="space-y-3">
                <article className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      Material principal
                    </span>
                    {materialSharedSubject && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                        Biblioteca compartilhada
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                    {String(materialCard.title || "Conteúdo-base")}
                  </h4>
                  <p className="mt-2 line-clamp-5 whitespace-pre-line text-xs leading-5 text-slate-600">
                    {String(effectiveMaterialCard?.content || "Material principal vazio.").replace(/<[^>]*>/g, " ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={buttonSecondary} onClick={editBaseMaterial}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
                      onClick={() => void deleteMaterial("base")}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                  </div>
                </article>
                {currentContentBlocks.map((block, index) => (
                  <article
                    key={String(block.id || index)}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                      Capítulo {index + 1}
                    </span>
                    <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                      {String(block.title || "Material complementar")}
                    </h4>
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-xs leading-5 text-slate-600">
                      {String(block.content || "")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className={buttonSecondary} onClick={() => editAdditionalMaterial(block)}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
                        onClick={() => void deleteMaterial("additional", String(block.id || ""))}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </article>
                ))}
                {!currentContentBlocks.length && (
                  <Empty text="Este assunto ainda não possui capítulos complementares." />
                )}
              </div>
            )}
          </AdminCard>
        </div>
      )}

      {section === "materials" && materialPreviewOpen && materialCard &&
        createPortal(
        <div
          className="admin-material-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setMaterialPreviewOpen(false);
          }}
        >
          <section className="admin-material-preview-modal flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[.14em] text-indigo-600">
                  Prévia do material
                </span>
                <h2 id="material-preview-title" className="mt-1 text-xl font-black text-slate-950">
                  {editingBaseMaterial
                    ? String(materialCard.title || "Material principal")
                    : materialTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {materialRole?.label} · {String(materialSection?.title || "")} · {String(materialCard.title || "")}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar prévia"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                onClick={() => setMaterialPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              {editingBaseMaterial ? (
                <div
                  className="prose max-w-none text-sm leading-7 text-slate-700 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: materialContent }}
                />
              ) : (
                <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                  {materialContent}
                </div>
              )}
              {subjectLines(materialKeyPoints).length > 0 && (
                <aside className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <strong className="text-sm text-indigo-950">Pontos-chave</strong>
                  <ul className="mt-3 space-y-2">
                    {subjectLines(materialKeyPoints).map((point, index) => (
                      <li key={index} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-indigo-600">•</span> {point}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
            </div>
            <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-7">
              <button type="button" className={buttonSecondary} onClick={() => setMaterialPreviewOpen(false)}>
                Voltar para edição
              </button>
              <button
                type="submit"
                form="study-material-form"
                className={buttonPrimary}
                onClick={() => setMaterialPreviewOpen(false)}
              >
                <Save className="h-4 w-4" /> Salvar material
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )}

      {section === "passages" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminCard
            title={
              editingPassage ? "Editar texto de apoio" : "Novo texto de apoio"
            }
            description="O texto poderá ser vinculado a uma ou várias questões."
          >
            <form onSubmit={submitPassage} className="space-y-4">
              <Field label="Título">
                <input
                  required
                  className={inputClass}
                  value={passageForm.title}
                  onChange={(e) =>
                    setPassageForm((v) => ({ ...v, title: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fonte">
                <input
                  className={inputClass}
                  value={passageForm.source}
                  onChange={(e) =>
                    setPassageForm((v) => ({ ...v, source: e.target.value }))
                  }
                />
              </Field>
              <Field label="Conteúdo">
                <textarea
                  required
                  rows={14}
                  className={inputClass}
                  value={passageForm.content}
                  onChange={(e) =>
                    setPassageForm((v) => ({ ...v, content: e.target.value }))
                  }
                />
              </Field>
              <FormActions
                saving={saving}
                editing={Boolean(editingPassage)}
                cancel={() => {
                  setPassageForm(emptyPassage);
                  setEditingPassage("");
                }}
              />
            </form>
          </AdminCard>
          <AdminCard
            title="Textos cadastrados"
            description="Gerencie enunciados-base, notícias, leis e demais materiais."
          >
            <div className="space-y-3">
              {passages.map((item) => (
                <RecordCard
                  key={item.id}
                  title={item.title}
                  eyebrow={item.source || "Sem fonte informada"}
                  details={`${item.content.slice(0, 120)}${item.content.length > 120 ? "…" : ""}`}
                  onEdit={() => {
                    setPassageForm({
                      title: item.title,
                      source: item.source || "",
                      content: item.content,
                    });
                    setEditingPassage(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onDelete={() =>
                    remove(item.title, () => adminApi.deletePassage(item.id))
                  }
                />
              ))}
              {!passages.length && <Empty />}
            </div>
          </AdminCard>
        </div>
      )}

      {section === "questions" && (
        <div className="space-y-6">
          <button
            type="button"
            aria-expanded={questionBatchImporterOpen}
            aria-controls="question-batch-importer"
            onClick={() => setQuestionBatchImporterOpen((open) => !open)}
            className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left shadow-sm transition ${questionBatchImporterOpen ? "border-indigo-200 bg-indigo-50 text-indigo-950" : "border-slate-200 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50/50"}`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Braces className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-sm font-black">
                  Importar questões em lote
                </strong>
                <small className="mt-0.5 block text-xs font-medium text-slate-500">
                  Cole um arquivo JSON com várias questões de uma vez
                </small>
              </span>
            </span>
            <span className="flex items-center gap-2 text-xs font-extrabold text-indigo-700">
              {questionBatchImporterOpen ? "Recolher" : "Importar"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${questionBatchImporterOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          {questionBatchImporterOpen && (
            <div id="question-batch-importer">
              <AdminCard
                title="Importar questões em lote (JSON)"
                description="Cole um array JSON com até 500 questões. A importação é atômica: se uma questão for inválida, nenhuma será cadastrada."
              >
                <form
                  onSubmit={(event) => void submitQuestionBatch(event)}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <div>
                      <strong className="text-sm text-indigo-950">
                        Formato aceito
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-indigo-800">
                        Use <code>category</code> para disciplina,{" "}
                        <code>topic</code> para assunto e alternativas no
                        formato <code>{'[{"label":"A","text":"..."}]'}</code>.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() =>
                        setQuestionBatchJson(questionBatchTemplate)
                      }
                    >
                      <Braces className="h-4 w-4" />
                      Usar modelo
                    </button>
                  </div>
                  <section aria-labelledby="json-fields-help">
                    <div className="mb-2 flex items-center gap-2">
                      <CircleHelp className="h-4 w-4 text-indigo-600" />
                      <h4
                        id="json-fields-help"
                        className="text-xs font-black uppercase tracking-wider text-slate-700"
                      >
                        O que significa cada campo?
                      </h4>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {questionBatchFields.map((field) => (
                        <JsonFieldHelp key={field.name} {...field} />
                      ))}
                    </div>
                  </section>
                  <Field label="Array JSON de questões">
                    <textarea
                      required
                      rows={18}
                      spellCheck={false}
                      className={`${inputClass} font-mono text-xs leading-5`}
                      value={questionBatchJson}
                      onChange={(event) =>
                        setQuestionBatchJson(event.target.value)
                      }
                      placeholder={questionBatchTemplate}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Tipos: <strong>MULTIPLE_CHOICE</strong> ou{" "}
                      <strong>TRUE_FALSE</strong>. Gabarito de certo/errado:{" "}
                      <strong>Certo</strong>, <strong>Errado</strong> ou{" "}
                      <strong>Anulada</strong>.
                    </p>
                    <button
                      type="submit"
                      disabled={saving || !questionBatchJson.trim()}
                      className={buttonPrimary}
                    >
                      {saving ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Braces className="h-4 w-4" />
                      )}
                      {saving ? "Importando…" : "Importar JSON"}
                    </button>
                  </div>
                </form>
              </AdminCard>
            </div>
          )}

          <AdminCard
            title={`Sinalizações de questões${questionReports.length ? ` (${questionReports.length})` : ""}`}
            description="Questões marcadas pelos alunos como incorretas, desatualizadas ou com problemas no enunciado e na explicação."
          >
            <select
              aria-label="Filtrar sinalizações por situação"
              className={`${inputClass} mb-4 max-w-xs`}
              value={reportStatus}
              onChange={(event) =>
                setReportStatus(event.target.value as typeof reportStatus)
              }
            >
              <option value="PENDING">Pendentes</option>
              <option value="RESOLVED">Corrigidas</option>
              <option value="DISMISSED">Descartadas</option>
              <option value="ALL">Todas</option>
            </select>
            {reportsLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Carregando sinalizações…
              </div>
            )}
            {!reportsLoading && (
              <div className="grid gap-3 lg:grid-cols-2">
                {questionReports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
                        <Flag className="h-3 w-3" />
                        {reportReasonLabel(report.reason)}
                      </span>
                      <time className="text-[10px] font-bold text-slate-400">
                        {new Date(report.createdAt).toLocaleString("pt-BR")}
                      </time>
                    </div>
                    <h4 className="mt-3 line-clamp-3 text-sm font-extrabold leading-5 text-slate-900">
                      {report.questionText}
                    </h4>
                    <p className="mt-1 text-xs font-bold text-indigo-700">
                      {[report.courseId, report.category, report.reference]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {report.details && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700">
                        <strong className="block text-amber-800">
                          Descrição do aluno
                        </strong>
                        {report.details}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-500">
                      Sinalizada por{" "}
                      {report.reporterName ||
                        report.reporterEmail ||
                        "usuário identificado"}
                    </p>
                    {report.adminNote && (
                      <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                        <strong>Nota administrativa:</strong> {report.adminNote}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.questionId && (
                        <button
                          type="button"
                          disabled={saving}
                          className={buttonSecondary}
                          onClick={() => void editReportedQuestion(report)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Abrir questão
                        </button>
                      )}
                      {report.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={saving}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-extrabold text-white hover:bg-emerald-700"
                            onClick={() =>
                              void reviewReport(report, "RESOLVED")
                            }
                          >
                            Marcar corrigida
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            className={buttonSecondary}
                            onClick={() =>
                              void reviewReport(report, "DISMISSED")
                            }
                          >
                            Descartar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
                {!questionReports.length && (
                  <div className="lg:col-span-2">
                    <Empty text="Nenhuma sinalização pendente." />
                  </div>
                )}
              </div>
            )}
          </AdminCard>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
            <AdminCard
              title={editingQuestion ? "Editar questão" : "Nova questão"}
              description="Use uma alternativa por linha no formato A | texto da alternativa. As questões são globais e organizadas por disciplina e assunto."
            >
              <form
                onSubmit={submitQuestion}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Banca">
                  <input
                    required
                    className={inputClass}
                    value={questionForm.board}
                    onChange={(e) =>
                      setQuestionForm((v) => ({ ...v, board: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Disciplina">
                  <select
                    required
                    className={inputClass}
                    value={questionForm.category}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        category: e.target.value,
                        topic: "",
                      }))
                    }
                  >
                    <option value="">Selecione a disciplina</option>
                    {questionTaxonomyAreas.map((area) => (
                      <optgroup key={area} label={area}>
                        {questionTaxonomy.filter((discipline) => discipline.area === area).map((discipline) => (
                          <option key={discipline.id} value={discipline.name}>
                            {discipline.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Assunto">
                  <select
                    required
                    disabled={!questionForm.category}
                    className={inputClass}
                    value={questionForm.topic}
                    onChange={(e) =>
                      setQuestionForm((v) => ({ ...v, topic: e.target.value }))
                    }
                  >
                    <option value="">{questionForm.category ? "Selecione o assunto" : "Escolha a disciplina primeiro"}</option>
                    {questionTopicOptions.map((topic) => (
                      <option key={topic.id} value={topic.name}>
                        {topic.name}{topic.count ? ` (${topic.count} questões)` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select
                    className={inputClass}
                    value={questionForm.type}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        type: e.target.value,
                        correct:
                          e.target.value === "TRUE_FALSE" ? "Certo" : "A",
                        options:
                          e.target.value === "TRUE_FALSE"
                            ? ""
                            : "A | \nB | \nC | \nD | \nE | ",
                      }))
                    }
                  >
                    <option value="MULTIPLE_CHOICE">Múltipla escolha</option>
                    <option value="TRUE_FALSE">Certo ou errado</option>
                  </select>
                </Field>
                <Field label="Situação editorial">
                  <select
                    className={inputClass}
                    value={questionForm.status}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, status: e.target.value }))}
                  >
                    <option value="ACTIVE">Publicada</option>
                    <option value="DRAFT">Rascunho</option>
                  </select>
                </Field>
                <Field label="Resposta correta">
                  {questionForm.type === "TRUE_FALSE" ? (
                    <select
                      required
                      className={inputClass}
                      value={questionForm.correct}
                      onChange={(e) =>
                        setQuestionForm((v) => ({
                          ...v,
                          correct: e.target.value,
                        }))
                      }
                    >
                      <option value="Certo">Certo</option>
                      <option value="Errado">Errado</option>
                      <option value="Anulada">Anulada</option>
                    </select>
                  ) : (
                    <select
                      required
                      className={inputClass}
                      value={questionForm.correct}
                      onChange={(e) =>
                        setQuestionForm((v) => ({
                          ...v,
                          correct: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                      <option>E</option>
                      <option>Anulada</option>
                    </select>
                  )}
                </Field>
                <Field label="Texto de apoio">
                  <select
                    className={inputClass}
                    value={questionForm.passageId}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        passageId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Nenhum</option>
                    {passages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Referência">
                  <input
                    className={inputClass}
                    value={questionForm.reference}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        reference: e.target.value,
                      }))
                    }
                    placeholder="Banca — Órgão — Ano"
                  />
                </Field>
                <Field label="Enunciado" wide>
                  <textarea
                    required
                    rows={5}
                    className={inputClass}
                    value={questionForm.text}
                    onChange={(e) =>
                      setQuestionForm((v) => ({ ...v, text: e.target.value }))
                    }
                  />
                </Field>
                {questionForm.type === "MULTIPLE_CHOICE" && (
                  <Field
                    label="Alternativas — uma por linha no formato A | texto"
                    wide
                  >
                    <textarea
                      required
                      rows={6}
                      className={`${inputClass} font-mono`}
                      value={questionForm.options}
                      onChange={(e) =>
                        setQuestionForm((v) => ({
                          ...v,
                          options: e.target.value,
                        }))
                      }
                    />
                  </Field>
                )}
                <Field label="Por que a resposta está certa ou errada?" wide>
                  <textarea
                    required
                    maxLength={4000}
                    rows={8}
                    className={inputClass}
                    value={questionForm.explanation}
                    onChange={(e) =>
                      setQuestionForm((v) => ({
                        ...v,
                        explanation: e.target.value,
                      }))
                    }
                    placeholder="Escreva como se ensinasse uma criança: 1) diga a ideia principal sem palavras difíceis; 2) mostre exatamente qual pedaço da resposta está errado; 3) explique a regra correta; 4) dê um exemplo simples; 5) termine com uma frase curta para lembrar."
                  />
                  <span className="mt-1.5 block text-[11px] leading-5 text-slate-500">
                    Este é o comentário curto que continua aparecendo no card depois da resposta.
                  </span>
                </Field>
                <div className="col-span-full mt-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <strong className="text-sm font-black text-indigo-950">Correção completa — aberta pelo botão “Assunto cobrado”</strong>
                  <p className="mt-1 text-xs leading-5 text-indigo-700">Preencha como um material de estudo para concursos: explique o conceito, analise a questão e deixe uma forma simples de fixar.</p>
                </div>
                <Field label="Assunto exato cobrado" wide>
                  <input
                    required={questionForm.status === "ACTIVE"}
                    maxLength={240}
                    className={inputClass}
                    value={questionForm.detailedTopic}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, detailedTopic: e.target.value }))}
                    placeholder="Ex.: Segurança da Informação — Malwares: Vírus × Worms"
                  />
                </Field>
                <Field label="Explicação do conceito" wide>
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    minLength={questionForm.status === "ACTIVE" ? 180 : undefined}
                    maxLength={8000}
                    rows={8}
                    className={inputClass}
                    value={questionForm.conceptExplanation}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, conceptExplanation: e.target.value }))}
                    placeholder="Ensine o conceito do zero, com palavras simples, comparação fácil e exemplo prático. Evite apenas repetir o enunciado."
                  />
                </Field>
                <Field label="Trecho ou regra decisiva" wide>
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    minLength={questionForm.status === "ACTIVE" ? 40 : undefined}
                    maxLength={5000}
                    rows={5}
                    className={inputClass}
                    value={questionForm.decisiveEvidence}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, decisiveEvidence: e.target.value }))}
                    placeholder="Transcreva a passagem do texto, dispositivo legal, fórmula ou regra técnica que comprova o gabarito."
                  />
                </Field>
                <Field label="Análise completa — por que está certo ou errado?" wide>
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    minLength={questionForm.status === "ACTIVE" ? 300 : undefined}
                    maxLength={8000}
                    rows={8}
                    className={inputClass}
                    value={questionForm.answerAnalysis}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, answerAnalysis: e.target.value }))}
                    placeholder="Aponte os trechos decisivos, aplique a regra, explique a conclusão e destaque a pegadinha da banca, se houver."
                  />
                </Field>
                <Field label="Pegadinha da banca" wide>
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    minLength={questionForm.status === "ACTIVE" ? 80 : undefined}
                    maxLength={5000}
                    rows={5}
                    className={inputClass}
                    value={questionForm.examTrap}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, examTrap: e.target.value }))}
                    placeholder="Explique por que o item parece convincente e qual generalização, inversão, exceção omitida ou troca conceitual conduz ao erro."
                  />
                </Field>
                <Field label="Dicas de fixação — uma por linha" wide>
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    rows={5}
                    className={inputClass}
                    value={questionForm.fixationTips}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, fixationTips: e.target.value }))}
                    placeholder="Vírus precisa de arquivo hospedeiro e normalmente de execução humana.\nWorm é autônomo e se espalha pela rede.\nPegadinha: ambos são malwares, mas não se propagam do mesmo modo."
                  />
                </Field>
                <Field label="Tabela comparativa — Critério | Conceito 1 | Conceito 2" wide>
                  <input
                    required={questionForm.status === "ACTIVE"}
                    className={`${inputClass} font-mono`}
                    value={questionForm.comparisonHeaders}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, comparisonHeaders: e.target.value }))}
                    placeholder="Cabeçalhos: Termo no item | Trecho equivalente no texto | Validação"
                  />
                  <textarea
                    required={questionForm.status === "ACTIVE"}
                    rows={5}
                    className={`${inputClass} font-mono`}
                    value={questionForm.comparisonRows}
                    onChange={(e) => setQuestionForm((v) => ({ ...v, comparisonRows: e.target.value }))}
                    placeholder="Hospedeiro | Vírus: precisa | Worm: não precisa\nAção humana | Vírus: normalmente exige | Worm: não exige\nPropagação | Vírus: arquivos e mídias | Worm: redes"
                  />
                </Field>
                <FormActions
                  saving={saving}
                  editing={Boolean(editingQuestion)}
                  cancel={() => {
                    setQuestionForm(emptyQuestion);
                    setEditingQuestion("");
                  }}
                />
              </form>
            </AdminCard>
            <AdminCard
              title="Questões cadastradas"
              description="Consulte todas as questões do banco em páginas de 10 e refine por disciplina ou pesquisa."
            >
              <form
                onSubmit={(event) => void searchQuestions(event)}
                className="mb-4 space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    className={`${inputClass} pl-10`}
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Ex.: crase, LGPD, CEBRASPE ou ID da questão"
                  />
                </div>
                <select
                  aria-label="Filtrar questões por área"
                  className={inputClass}
                  value={questionArea}
                  onChange={(e) => setQuestionArea(e.target.value)}
                >
                  <option value="">Todas as áreas</option>
                  {questionAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={questionsLoading}
                  className={`${buttonPrimary} w-full`}
                >
                  {questionsLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {questionsLoading ? "Carregando…" : "Aplicar filtros"}
                </button>
              </form>
              {!questionsLoading && hasSearchedQuestions && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
                  <span>{questionTotal} questão(ões) encontrada(s)</span>
                  {questionTotalPages > 0 && (
                    <span>
                      Página {questionPage} de {questionTotalPages}
                    </span>
                  )}
                </div>
              )}
              <div className="max-h-[72rem] space-y-3 overflow-auto pr-1">
                {!questionsLoading &&
                  questions.map((item) => (
                    <RecordCard
                      key={item.id}
                      title={item.text}
                      eyebrow={`${item.courseId} · ${item.board}${Number(item.pendingReports || 0) > 0 ? ` · ${item.pendingReports} sinalização(ões)` : ""}`}
                      details={`${item.category} · Gabarito: ${item.correct}`}
                      onEdit={() => editQuestion(item)}
                      onDelete={() =>
                        remove(
                          item.text.slice(0, 60),
                          () => adminApi.deleteQuestion(item.id),
                          () =>
                            void searchQuestions(
                              undefined,
                              questions.length === 1 && questionPage > 1
                                ? questionPage - 1
                                : questionPage,
                            ),
                        )
                      }
                    />
                  ))}
                {!questionsLoading &&
                  hasSearchedQuestions &&
                  !questions.length && (
                    <Empty text="Nenhuma questão encontrada para esta pesquisa." />
                  )}
                {!questionsLoading && !hasSearchedQuestions && (
                  <Empty text="Carregando as questões cadastradas…" />
                )}
              </div>
              {!questionsLoading && questionTotalPages > 1 && (
                <nav
                  aria-label="Paginação das questões"
                  className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"
                >
                  <button
                    type="button"
                    className={buttonSecondary}
                    disabled={questionPage <= 1}
                    onClick={() => void searchQuestions(undefined, questionPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <span className="text-xs font-extrabold text-slate-600">
                    {questionPage} / {questionTotalPages}
                  </span>
                  <button
                    type="button"
                    className={buttonSecondary}
                    disabled={questionPage >= questionTotalPages}
                    onClick={() => void searchQuestions(undefined, questionPage + 1)}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </AdminCard>
          </div>
        </div>
      )}
    </main>
  );
}

function JsonFieldHelp({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <code className="text-xs font-bold text-indigo-700">{name}</code>
      <span className="group relative shrink-0">
        <button
          type="button"
          aria-label={`Ajuda sobre ${name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 outline-none transition hover:bg-indigo-100 hover:text-indigo-700 focus:bg-indigo-100 focus:text-indigo-700"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-64 rounded-xl bg-slate-950 px-3 py-2.5 text-left text-xs font-medium leading-5 text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {description}
          <span className="absolute right-2 top-full border-4 border-transparent border-t-slate-950" />
        </span>
      </span>
    </div>
  );
}

function AdminCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-5">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </header>
      {children}
    </section>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function FormActions({
  saving,
  editing,
  cancel,
}: {
  saving: boolean;
  editing: boolean;
  cancel: () => void;
}) {
  return (
    <div className="admin-form-actions flex flex-wrap justify-end gap-2 sm:col-span-2">
      {editing && (
        <button type="button" className={buttonSecondary} onClick={cancel}>
          <X className="h-4 w-4" />
          Cancelar
        </button>
      )}
      <button disabled={saving} className={buttonPrimary}>
        {saving ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : editing ? (
          <Save className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}
      </button>
    </div>
  );
}
function RecordCard({
  title,
  eyebrow,
  details,
  onEdit,
  onDelete,
}: {
  title: string;
  eyebrow: string;
  details: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="admin-record-card rounded-2xl border border-slate-200 p-4">
      <div className="admin-record-card-content">
        <span className="admin-record-card-eyebrow text-[10px] font-black uppercase tracking-wider text-indigo-600">
          {eyebrow}
        </span>
        <h4 className="mt-1 line-clamp-3 text-sm font-extrabold leading-5 text-slate-900">
          {title}
        </h4>
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500">
          {details}
        </p>
      </div>
      <div className="admin-record-card-actions mt-3 flex gap-2">
        <button type="button" onClick={onEdit} className={buttonSecondary}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>
    </article>
  );
}
function Empty({ text = "Nenhum registro cadastrado." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
function reportReasonLabel(reason: string) {
  return (
    (
      {
        ANSWER: "Gabarito incorreto",
        STATEMENT: "Erro no enunciado",
        EXPLANATION: "Explicação incorreta",
        OUTDATED: "Questão desatualizada",
        OTHER: "Outro problema",
      } as Record<string, string>
    )[reason] || reason
  );
}

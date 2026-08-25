export type StudyGroup = 'Conhecimentos Gerais' | 'Conhecimentos Específicos';

export interface ParsedSubjectBatchItem {
  sourceLine: number;
  title: string;
  discipline: string;
  studyGroup: StudyGroup;
}

export interface SubjectBatchDraft extends ParsedSubjectBatchItem {
  key: string;
  studyObjective: string;
  reviewSummary: string[];
}

export interface SubjectBatchParseResult {
  items: ParsedSubjectBatchItem[];
  errors: string[];
  skippedRepeated: number;
}

const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const studyGroup = (value: string): StudyGroup | null => {
  const key = normalized(value);
  if (key === 'conhecimentos gerais' || key === 'conhecimentos basicos' || key === 'legislacao')
    return 'Conhecimentos Gerais';
  if (key === 'conhecimentos especificos') return 'Conhecimentos Específicos';
  return null;
};

const cleanSubjectLine = (value: string) =>
  value
    .replace(/^\s*(?:[-–—•*]+\s*)?(?:⬜|☐|✅|☑|\[\s*[xX]?\s*\])?\s*/, '')
    .replace(/\s+$/g, '')
    .trim();

const heading = (line: string) => {
  const trimmed = line.trim();
  const bracket = trimmed.match(/^\[([^\]]+)]$/);
  const markdown = trimmed.match(/^#{1,6}\s+(.+)$/);
  const labelled = trimmed.match(/^disciplina\s*:\s*(.+)$/i);
  const value = bracket?.[1] || markdown?.[1] || labelled?.[1];
  if (!value) return null;
  const parts = value.split('>').map(part => part.trim()).filter(Boolean);
  if (parts.length > 1 && studyGroup(parts[0]))
    return { discipline: parts.slice(1).join(' > '), studyGroup: studyGroup(parts[0])! };
  return { discipline: value.trim(), studyGroup: null };
};

export const parseSubjectBatch = (
  source: string,
  defaultDiscipline: string,
  defaultStudyGroup: StudyGroup
): SubjectBatchParseResult => {
  const items: ParsedSubjectBatchItem[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let skippedRepeated = 0;
  let currentDiscipline = defaultDiscipline.trim();
  let currentStudyGroup = defaultStudyGroup;

  source.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) return;
    const parsedHeading = heading(rawLine);
    if (parsedHeading) {
      currentDiscipline = parsedHeading.discipline;
      currentStudyGroup = parsedHeading.studyGroup || defaultStudyGroup;
      return;
    }

    const line = cleanSubjectLine(rawLine);
    if (!line) return;
    const columns = line.split('|').map(part => part.trim());
    let discipline = currentDiscipline;
    let group = currentStudyGroup;
    let title = line;
    if (columns.length >= 3 && studyGroup(columns[0])) {
      group = studyGroup(columns[0])!;
      discipline = columns[1];
      title = columns.slice(2).join(' | ');
    } else if (columns.length >= 2) {
      discipline = columns[0];
      title = columns.slice(1).join(' | ');
    }
    if (!discipline) {
      errors.push(`Linha ${index + 1}: informe a disciplina padrão ou use um cabeçalho [Disciplina].`);
      return;
    }
    if (!title) {
      errors.push(`Linha ${index + 1}: o nome do assunto está vazio.`);
      return;
    }
    const key = `${normalized(discipline)}::${normalized(title.replace(/^\d+(?:\.\d+)*[.)-]?\s*/, ''))}`;
    if (seen.has(key)) {
      skippedRepeated++;
      return;
    }
    seen.add(key);
    items.push({ sourceLine: index + 1, title, discipline, studyGroup: group });
  });

  return { items, errors, skippedRepeated };
};

export const draftSubjectGuidance = (item: ParsedSubjectBatchItem): SubjectBatchDraft => ({
  ...item,
  key: `${item.sourceLine}-${normalized(item.discipline)}-${normalized(item.title)}`,
  studyObjective: `Dominar ${item.title}, identificando seus conceitos centrais, regras, classificações e aplicações em questões de ${item.discipline}.`,
  reviewSummary: [
    `Conceito, finalidade e elementos essenciais de ${item.title}.`,
    `Regras, requisitos, classificações e exceções relacionados a ${item.title}.`,
    `Diferenças para temas próximos e aplicação prática em questões de concurso.`,
  ],
});


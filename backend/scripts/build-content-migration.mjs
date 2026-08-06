import { readFileSync, writeFileSync } from 'node:fs';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error('Uso: node build-content-migration.mjs <conteudo.json> <migracao.sql>');
}

const payload = readFileSync(source, 'utf8').trim();
JSON.parse(payload);
const encodedPayload = Buffer.from(payload, 'utf8').toString('base64');

const sql = `-- Migra o catálogo, materiais e questões que antes estavam empacotados no frontend.
-- A carga é idempotente: registros administrados no PostgreSQL nunca são sobrescritos.
ALTER TABLE passages ADD COLUMN IF NOT EXISTS legacy_key VARCHAR(180);
ALTER TABLE shared_study_subjects ALTER COLUMN title TYPE TEXT;
ALTER TABLE shared_study_subjects ALTER COLUMN discipline TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS passages_legacy_key_unique ON passages(legacy_key) WHERE legacy_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS questions_course_legacy_unique
  ON questions((metadata->>'courseId'),(metadata->>'legacyId'))
  WHERE COALESCE(metadata->>'courseId','')<>'' AND COALESCE(metadata->>'legacyId','')<>'';
CREATE UNIQUE INDEX IF NOT EXISTS questions_course_statement_unique
  ON questions((metadata->>'courseId'),md5(regexp_replace(lower(statement),'\\s+',' ','g')))
  WHERE COALESCE(metadata->>'courseId','')<>'';

CREATE TEMP TABLE gabarita_content_seed(payload JSONB) ON COMMIT DROP;
INSERT INTO gabarita_content_seed(payload)
VALUES (convert_from(decode($gabarita_seed$${encodedPayload}$gabarita_seed$,'base64'),'UTF8')::jsonb);

INSERT INTO catalog_contests(code,label,acronym,organization,description,board,exam_date,status,state,area,
  education,vacancies,remuneration,location,stages,notice_reference,active)
SELECT contest->>'id',contest->>'label',contest->>'acronym',contest->>'organization',
  COALESCE(contest->>'description',''),contest->>'board',(contest->>'examDate')::date,
  COALESCE(contest->>'status','Edital cadastrado'),COALESCE(contest->>'state',''),COALESCE(contest->>'area',''),
  COALESCE(contest->>'education',''),COALESCE(contest->>'vacancies','Conforme edital'),
  COALESCE(contest->>'remuneration','Conforme edital'),COALESCE(contest->>'location',''),
  COALESCE(contest->>'stages',''),COALESCE(contest->>'noticeReference',''),true
FROM gabarita_content_seed seed CROSS JOIN LATERAL jsonb_array_elements(seed.payload->'contests') contest
ON CONFLICT(code) DO NOTHING;

INSERT INTO catalog_roles(contest_id,code,label,course_id,board,include_discursive,requirement,remuneration,
  vacancies,estimated_hours,curriculum,active)
SELECT database_contest.id,role->>'id',role->>'label',role->>'courseId',role->>'board',
  COALESCE((role->>'includeDiscursive')::boolean,false),COALESCE(role->>'requirement',''),
  COALESCE(role->>'remuneration',''),COALESCE(role->>'vacancies',''),
  COALESCE((role->>'estimatedHours')::integer,120),
  jsonb_build_object('topics',course.value->'topics','studySections',course.value->'studySections'),true
FROM gabarita_content_seed seed
CROSS JOIN LATERAL jsonb_array_elements(seed.payload->'contests') contest
CROSS JOIN LATERAL jsonb_array_elements(contest->'roles') role
JOIN catalog_contests database_contest ON database_contest.code=contest->>'id'
JOIN LATERAL jsonb_each(seed.payload->'courses') course ON course.key=role->>'courseId'
ON CONFLICT(contest_id,code) DO NOTHING;

INSERT INTO shared_study_subjects(canonical_key,title,discipline,base_content,key_takeaways,content_blocks)
SELECT item->>'canonicalKey',item->>'title',COALESCE(item->>'discipline',''),COALESCE(item->>'content',''),
  COALESCE(item->'keyTakeaways','[]'::jsonb),COALESCE(item->'contentBlocks','[]'::jsonb)
FROM gabarita_content_seed seed CROSS JOIN LATERAL jsonb_array_elements(seed.payload->'sharedSubjects') item
ON CONFLICT(canonical_key) DO NOTHING;

INSERT INTO passages(id,title,content,source,legacy_key)
SELECT gen_random_uuid(),item->>'title',item->>'content','Migração do catálogo do frontend',item->>'id'
FROM gabarita_content_seed seed CROSS JOIN LATERAL jsonb_array_elements(seed.payload->'passages') item
WHERE NOT EXISTS(SELECT 1 FROM passages current WHERE current.legacy_key=item->>'id'
  OR (current.title=item->>'title' AND current.content=item->>'content'));

DO $migration$
DECLARE
  seed JSONB;
  course RECORD;
  item JSONB;
  option_item JSONB;
  question_id UUID;
  passage_uuid UUID;
  legacy_id TEXT;
  question_type TEXT;
  question_status TEXT;
  option_position INTEGER;
BEGIN
  SELECT payload INTO seed FROM gabarita_content_seed;
  FOR course IN SELECT * FROM jsonb_each(seed->'courses') LOOP
    FOR item IN SELECT value FROM jsonb_array_elements(course.value->'questions') LOOP
      legacy_id := item->>'id';
      IF EXISTS(
        SELECT 1 FROM questions current
        WHERE current.metadata->>'courseId'=course.key
          AND (current.metadata->>'legacyId'=legacy_id
            OR md5(regexp_replace(lower(current.statement),'\\s+',' ','g'))=
               md5(regexp_replace(lower(item->>'text'),'\\s+',' ','g')))
      ) THEN CONTINUE; END IF;

      passage_uuid := NULL;
      IF COALESCE(item->>'passageId','')<>'' THEN
        SELECT id INTO passage_uuid FROM passages WHERE legacy_key=item->>'passageId' LIMIT 1;
      END IF;
      question_id := gen_random_uuid();
      question_type := CASE WHEN jsonb_array_length(COALESCE(item->'options','[]'::jsonb))>0
        THEN 'MULTIPLE_CHOICE' ELSE 'TRUE_FALSE' END;
      question_status := CASE WHEN lower(COALESCE(item->>'correct',''))='anulada' THEN 'ANNULLED' ELSE 'ACTIVE' END;
      INSERT INTO questions(id,passage_id,board,type,statement,explanation,status,correct_answer,metadata)
      VALUES(question_id,passage_uuid,COALESCE(NULLIF(item->>'board',''),'CEBRASPE'),question_type,
        item->>'text',COALESCE(item->>'explanation',''),question_status,to_jsonb(item->>'correct'),
        jsonb_build_object('courseId',course.key,'legacyId',legacy_id,
          'category',COALESCE(item->>'category','Geral'),'topic',COALESCE(NULLIF(item->>'topic',''),item->>'category'),
          'reference',COALESCE(item->>'reference',''),'passageId',COALESCE(item->>'passageId','')));
      option_position := 0;
      FOR option_item IN SELECT value FROM jsonb_array_elements(COALESCE(item->'options','[]'::jsonb)) LOOP
        INSERT INTO question_options(id,question_id,label,content,position)
        VALUES(gen_random_uuid(),question_id,upper(option_item->>'label'),option_item->>'text',option_position);
        option_position := option_position+1;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE questions question
  SET passage_id=passage.id,updated_at=now()
  FROM passages passage
  WHERE question.passage_id IS NULL AND COALESCE(question.metadata->>'passageId','')<>''
    AND passage.legacy_key=question.metadata->>'passageId';
END
$migration$;
`;

writeFileSync(destination, sql, 'utf8');
process.stdout.write(`Migração gerada: ${destination}\n`);

-- História é uma disciplina autônoma. Conhecimentos de Alagoas permanece para
-- geografia, economia, patrimônio e cultura regionais.
INSERT INTO subjects(name,slug,area,position)
VALUES ('História','historia','Ciências Humanas',790)
ON CONFLICT DO NOTHING;

WITH history_subject AS (
  SELECT id FROM subjects WHERE slug='historia' AND exam_id IS NULL
)
INSERT INTO topics(subject_id,slug,name,position)
SELECT id,'historia-alagoas','História de Alagoas',10 FROM history_subject
ON CONFLICT DO NOTHING;

WITH target AS (
  SELECT s.id subject_id,s.name subject_name,t.id topic_id,t.name topic_name
  FROM subjects s JOIN topics t ON t.subject_id=s.id
  WHERE s.slug='historia' AND s.exam_id IS NULL AND t.slug='historia-alagoas'
), moved AS (
  UPDATE questions q SET subject_id=target.subject_id,topic_id=target.topic_id,
    metadata=jsonb_set(jsonb_set(q.metadata,'{category}',to_jsonb(target.subject_name),true),'{topic}',to_jsonb(target.topic_name),true),
    detailed_topic=target.subject_name || ' — ' || target.topic_name,
    updated_at=now()
  FROM target JOIN subjects old_subject ON old_subject.slug='conhecimentos-alagoas' AND old_subject.exam_id IS NULL
  JOIN topics old_topic ON old_topic.subject_id=old_subject.id AND old_topic.slug='historia'
  WHERE q.subject_id=old_subject.id AND q.topic_id=old_topic.id
  RETURNING q.id
)
UPDATE questions q SET fixation_tips=jsonb_build_array(
  'Associe esta questão a História > História de Alagoas.',
  'Reescreva com suas palavras o critério decisivo apresentado na correção.',
  'Marque no enunciado sujeito, tempo ou condição, regra e consequência.',
  'Na revisão, tente explicar por que a alternativa oposta falha antes de olhar o gabarito.'
),updated_at=now()
FROM moved WHERE q.id=moved.id;

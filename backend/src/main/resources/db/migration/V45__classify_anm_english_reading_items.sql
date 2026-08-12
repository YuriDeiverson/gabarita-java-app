-- O bloco ANM 2024, itens 11 a 15, é integralmente redigido em inglês e não
-- traz o nome da disciplina na referência. Classificação editorial explícita.
WITH target AS (
  SELECT s.id subject_id,s.name subject_name,t.id topic_id,t.name topic_name
  FROM subjects s JOIN topics t ON t.subject_id=s.id
  WHERE s.slug='lingua-inglesa' AND s.exam_id IS NULL AND t.slug='interpretacao'
)
UPDATE questions q SET subject_id=target.subject_id,topic_id=target.topic_id,
  metadata=jsonb_set(jsonb_set(q.metadata,'{category}',to_jsonb(target.subject_name),true),'{topic}',to_jsonb(target.topic_name),true),
  updated_at=now()
FROM target
WHERE q.metadata->>'reference' ~ 'ANM.*(Item 11|Item 12|Item 13|Item 14|Item 15)'
  AND q.statement ~* '\m(the|in|users|perfecting)\M';

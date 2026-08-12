UPDATE questions q SET fixation_tips=jsonb_build_array(
  'Associe esta questão a História > História de Alagoas.',
  'Reescreva com suas palavras o critério decisivo apresentado na correção.',
  'Marque no enunciado sujeito, tempo ou condição, regra e consequência.',
  'Na revisão, tente explicar por que a alternativa oposta falha antes de olhar o gabarito.'
),updated_at=now()
FROM subjects s JOIN topics t ON t.subject_id=s.id
WHERE q.subject_id=s.id AND q.topic_id=t.id
  AND s.slug='historia' AND t.slug='historia-alagoas';

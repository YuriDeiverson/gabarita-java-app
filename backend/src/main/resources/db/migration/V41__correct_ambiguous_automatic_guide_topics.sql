-- Corrige falsos positivos do classificador automático sem tocar nos guias
-- autorais. Os casos eram causados por substrings: SUS em "sustentar",
-- licitação em "solicitação" e pontuação usada como escore clínico.

WITH candidates AS (
  SELECT q.id,
    COALESCE(q.metadata->>'category', s.name, 'Geral') AS category,
    lower(concat_ws(' ', q.metadata->>'reference', q.statement, q.explanation)) AS content,
    q.detailed_topic
  FROM questions q
  LEFT JOIN subjects s ON s.id = q.subject_id
  WHERE q.status IN ('ACTIVE', 'ANNULLED')
    AND q.comparison_headers->>'criterion' = 'Etapa da análise'
), corrected AS (
  SELECT id, category, detailed_topic,
    CASE
      WHEN detailed_topic = 'Língua Portuguesa — Pontuação e Organização Sintática'
        AND lower(category) ~ 'enferm|farmaco|saúde'
        AND content !~ '(vírgula|travessão|dois-pontos|oração|período|texto|frase|sinal|emprego|gramat|reescrit)'
        THEN category || ' — Conceitos e Aplicação em Questões'
      WHEN detailed_topic = 'Saúde Pública e SUS — Princípios, Organização e Atenção à Saúde'
        AND content !~ '(\msus\M|saúde pública|atenção básica|epidemiolog)'
        AND lower(category) ~ 'portugu'
        THEN 'Interpretação de Texto — Compreensão, Inferência e Limites do Texto'
      WHEN detailed_topic = 'Saúde Pública e SUS — Princípios, Organização e Atenção à Saúde'
        AND content !~ '(\msus\M|saúde pública|atenção básica|epidemiolog)'
        AND lower(category) ~ 'jornal|comunicação|imprensa'
        THEN 'Jornalismo — Gêneros, Notícia e Técnicas de Redação'
      WHEN detailed_topic = 'Direito Administrativo — Licitações e Contratos'
        AND content !~ '(\mlicitação\M|\mlicitações\M|contrato administrativo|lei 14\.133|lei nº 14\.133)'
        AND content ~ '(transparência ativa|transparência passiva|lei de acesso à informação|\mlai\M)'
        THEN 'Comunicação Pública — Transparência Ativa, Passiva e Acesso à Informação'
      ELSE detailed_topic
    END AS new_topic
  FROM candidates
), changed AS (
  SELECT * FROM corrected WHERE new_topic <> detailed_topic
)
UPDATE questions q SET
  detailed_topic = c.new_topic,
  concept_explanation = CASE
    WHEN lower(c.new_topic) ~ 'interpretação|compreensão|inferência' THEN
      c.new_topic || ' exige separar três níveis de leitura: o que está escrito de modo expresso, o que pode ser concluído por relação lógica e o que seria uma extrapolação sem apoio textual.' || E'\n\n' ||
      'Em provas, a resposta correta pode empregar palavras diferentes das usadas pelo autor, desde que preserve sentido, alcance, sujeito, condição e relação de causa ou consequência. Expressões absolutas ou conclusões acrescentadas sem apoio transformam uma paráfrase aparentemente fiel em item errado.'
    WHEN lower(c.new_topic) ~ 'jornal|notícia|imprensa|comunicação pública' THEN
      c.new_topic || ' deve ser compreendido pela finalidade da mensagem, pelo público, pelo suporte, pela responsabilidade editorial e pelo regime de divulgação. Na transparência ativa, o órgão publica espontaneamente; na passiva, responde a uma solicitação.' || E'\n\n' ||
      'Em questões de concurso, compare quem produz a informação, quem toma a iniciativa, para quem ela se dirige e com qual objetivo. Conceitos próximos deixam de ser equivalentes quando muda a iniciativa da divulgação, a função jornalística ou o dever institucional envolvido.'
    WHEN lower(c.new_topic) ~ 'enferm|farmaco|saúde' THEN
      c.new_topic || ' relaciona avaliação clínica, finalidade do cuidado, sequência do procedimento, prioridade e medidas de segurança. Escalas clínicas convertem sinais e condições observadas em faixas de risco; por isso, é indispensável conhecer o sentido da pontuação, e não apenas o número obtido.' || E'\n\n' ||
      'Em prova, verifique se uma pontuação maior representa melhora ou agravamento, quais são os limites de cada faixa e qual conduta decorre da classificação. Trocar o sentido da escala ou o nome da faixa altera a conclusão do item.'
    ELSE q.concept_explanation
  END,
  exam_trap = CASE
    WHEN lower(c.new_topic) ~ 'interpretação|compreensão|inferência' THEN
      'A armadilha é confundir paráfrase com extrapolação. Uma troca de palavras é válida quando conserva o alcance da ideia; torna-se errada quando acrescenta causa, certeza, julgamento ou generalização ausente no texto.'
    WHEN lower(c.new_topic) ~ 'jornal|notícia|imprensa|comunicação pública' THEN
      'A banca aproxima técnicas e conceitos legítimos, mas troca iniciativa, objetivo, autoria, público ou suporte. Em transparência pública, divulgação espontânea é ativa; informação fornecida após pedido é passiva.'
    WHEN lower(c.new_topic) ~ 'enferm|farmaco|saúde' THEN
      'Não presuma que uma pontuação numericamente alta ou baixa tenha sempre o mesmo significado. Cada escala possui direção e faixas próprias; a banca costuma inverter o risco associado ao escore.'
    ELSE q.exam_trap
  END,
  fixation_tips = jsonb_build_array(
    'Antes de marcar, resuma com suas palavras o conceito central de ' || c.new_topic || '.',
    'Separe no item sujeito, condição, regra e consequência; confira cada parte isoladamente.',
    'Desconfie de termos absolutos e de conceitos próximos apresentados como se fossem sinônimos.',
    'Justifique o gabarito apontando o detalhe decisivo, e não apenas repetindo “certo” ou “errado”.'
  ),
  updated_at = now()
FROM changed c
WHERE q.id = c.id;

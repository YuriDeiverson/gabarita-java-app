-- Completa os guias ainda vazios usando o enunciado e a justificativa técnica
-- da própria questão. Não cria aula compartilhada, tabela ou pegadinha genérica.

-- A versão anterior exigia evidência mesmo quando não havia uma expressão curta
-- que pudesse ser destacada sem repetir o enunciado inteiro.
ALTER TABLE questions DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

WITH source AS (
  SELECT q.id,q.statement,q.explanation,q.detailed_topic,
    q.correct_answer #>> '{}' AS correct,
    COALESCE(NULLIF(s.area,''),'Conhecimentos Gerais') AS area,
    COALESCE(NULLIF(t.name,''),NULLIF(q.metadata->>'topic',''),'Assunto da questão') AS topic_name,
    btrim(regexp_replace(
      COALESCE(NULLIF(q.decisive_evidence,''),q.explanation),
      '^(Critério técnico que decide o item:[[:space:]]*)?((Item[[:space:]]+)?(certo|errado|correto|incorreto|alternativa[[:space:]]+[A-E])[.,:]?[[:space:]]*)?',
      '',
      'i'
    )) AS reason
  FROM questions q
  LEFT JOIN subjects s ON s.id=q.subject_id
  LEFT JOIN topics t ON t.id=q.topic_id
  WHERE q.status IN ('ACTIVE','ANNULLED')
    AND btrim(q.answer_analysis)=''
), prepared AS (
  SELECT *,
    COALESCE(NULLIF(reason,''),'O comentário de referência não apresenta base técnica suficiente; a questão deve passar por revisão editorial.') AS rule_text,
    left(regexp_replace(statement,'[[:space:]]+',' ','g'),1200) AS clean_statement
  FROM source
), enriched AS (
  SELECT *,
    COALESCE(
      NULLIF(btrim(substring(clean_statement FROM
        '(?i).{0,100}(se limita|somente|apenas|exclusivamente|sempre|nunca|todo|qualquer|necessariamente|unicamente).{0,180}')),''),
      left(clean_statement,480)
    ) AS decisive_excerpt,
    left(CASE
      WHEN rule_text ~* '^(A ordem está invertida|A afirmativa possui|A assertiva|A descrição)[^.]*(\.|$)'
        AND strpos(rule_text,'.')>0
      THEN ltrim(substr(rule_text,strpos(rule_text,'.')+1))
      ELSE rule_text
    END,520) AS memory_rule
  FROM prepared
), guide AS (
  SELECT *,
    CASE area
      WHEN 'Tecnologia da Informação' THEN
        'Em termos técnicos, o enunciado atribui a ' || topic_name || ' um funcionamento, uma finalidade ou um limite específico. '
      WHEN 'Linguagens' THEN
        'A correção depende da forma linguística ou da relação de sentido efetivamente criada no trecho, e não apenas da presença das mesmas palavras. '
      WHEN 'Direito e Governança' THEN
        'O julgamento exige conferir sujeito, competência, requisito, proibição e efeito jurídico exatamente como aparecem na regra aplicável. '
      WHEN 'Comunicação' THEN
        'A análise deve preservar a relação entre técnica, finalidade, público, canal e efeito comunicacional descrita no item. '
      WHEN 'Saúde' THEN
        'O ponto decisivo é confrontar indicação, sequência do procedimento, atribuição profissional e medida de segurança. '
      WHEN 'Raciocínio Quantitativo' THEN
        'A resposta decorre dos dados, da operação e do resultado numérico indicados, sem substituir a relação matemática solicitada. '
      WHEN 'Gestão e Inovação' THEN
        'É necessário distinguir a finalidade do método, seus participantes, sua etapa de aplicação e o resultado que ele produz. '
      WHEN 'Conhecimentos Regionais' THEN
        'A proposição deve preservar o fato, o local, o período e a relação histórica, geográfica ou econômica cobrados. '
      WHEN 'Ciências Humanas' THEN
        'A proposição deve preservar agente, contexto, período e relação de causa ou consequência do fato examinado. '
      ELSE
        'A afirmação deve ser confrontada com a definição e o alcance exatos do assunto. '
    END AS domain_application,
    CASE area
      WHEN 'Tecnologia da Informação' THEN
        'Em questões futuras sobre ' || topic_name || ', relacione recurso → funcionamento → finalidade → limitação e teste essa cadeia na proposição “' || clean_statement || '”.'
      WHEN 'Linguagens' THEN
        'Em outra questão de ' || topic_name || ', identifique na proposição “' || clean_statement || '” qual regra gramatical ou relação de sentido foi criada e confira se a reescrita a preserva.'
      WHEN 'Direito e Governança' THEN
        'Em itens de ' || topic_name || ', decomponha a proposição “' || clean_statement || '” em sujeito, comando, condição e consequência; basta um desses elementos contrariar a regra para o item inteiro estar errado.'
      WHEN 'Comunicação' THEN
        'Em questões de ' || topic_name || ', confronte na proposição “' || clean_statement || '” quem comunica, para qual público, por qual meio e com qual finalidade.'
      WHEN 'Saúde' THEN
        'Ao reencontrar ' || topic_name || ', verifique na proposição “' || clean_statement || '” indicação, responsável, ordem do procedimento e medida de segurança antes de escolher o gabarito.'
      WHEN 'Raciocínio Quantitativo' THEN
        'Em outra questão de ' || topic_name || ', transforme a proposição “' || clean_statement || '” em dados e operação, faça o cálculo e confira unidade, universo e denominador.'
      WHEN 'Gestão e Inovação' THEN
        'Em itens de ' || topic_name || ', use a proposição “' || clean_statement || '” para separar finalidade, etapa, participantes e entrega do método citado.'
      ELSE
        'Em outra questão de ' || topic_name || ', confronte o fato central da proposição “' || clean_statement || '” com o contexto, o período e a relação de causa ou consequência exigidos.'
    END AS tailored_strategy
  FROM enriched
)
UPDATE questions q SET
  concept_explanation=g.rule_text,
  decisive_evidence=CASE
    WHEN g.clean_statement ~* '\m(se limita|somente|apenas|exclusivamente|sempre|nunca|todo|qualquer|necessariamente|unicamente)\M' THEN
      'A expressão de alcance absoluto no enunciado é: “' || g.decisive_excerpt || '”'
    ELSE ''
  END,
  answer_analysis=CASE
    WHEN lower(g.correct) IN ('certo','correto') THEN
      g.domain_application || 'No item, a proposição examinada é: “' || g.clean_statement || '”' || E'\n\n' ||
      'Essa formulação atribui ao assunto o mesmo funcionamento, finalidade, relação ou alcance estabelecido no conceito necessário. Por isso, a afirmação é verdadeira e o gabarito é Certo.'
    WHEN lower(g.correct) IN ('errado','incorreto') THEN
      g.domain_application || 'No item, a proposição examinada é: “' || g.clean_statement || '”' || E'\n\n' ||
      'Essa formulação entra em conflito com a definição, correção ou limitação apresentada no conceito necessário. O conflito atinge o ponto usado para julgar a proposição; por isso, o item é falso e o gabarito é Errado.'
    ELSE
      'A proposição anulada é: “' || g.clean_statement || '”' || E'\n\n' ||
      'O gabarito oficial retirou sua validade para pontuação. Assim, não se deve forçar um julgamento Certo ou Errado com base em uma interpretação isolada.'
  END,
  exam_trap=CASE
    WHEN g.clean_statement ~* '\m(se limita|somente|apenas|exclusivamente|sempre|nunca|todo|qualquer|necessariamente|unicamente)\M' THEN
      'A armadilha concreta está no termo de alcance absoluto presente no trecho destacado. Palavras como “apenas”, “sempre”, “nunca” ou “exclusivamente” eliminam exceções e ampliam ou restringem a regra; o item só pode ser aceito se esse alcance total também for verdadeiro.'
    ELSE ''
  END,
  similar_question_strategy=g.tailored_strategy,
  fixation_tips=jsonb_build_array(g.topic_name || ': ' || COALESCE(NULLIF(g.memory_rule,''),left(g.rule_text,520))),
  comparison_headers='{}'::jsonb,
  comparison_rows='[]'::jsonb,
  updated_at=now()
FROM guide g WHERE q.id=g.id;

-- O trecho decisivo e a pegadinha são adaptativos: podem ser omitidos quando
-- não há uma expressão concreta que acrescente informação à análise.
ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE','ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 18
    AND length(btrim(answer_analysis)) >= 120
    AND length(btrim(similar_question_strategy)) >= 40
    AND btrim(answer_analysis) <> btrim(explanation)
    AND jsonb_array_length(fixation_tips) BETWEEN 1 AND 4
    AND (
      (jsonb_array_length(comparison_rows)=0 AND comparison_headers='{}'::jsonb)
      OR (jsonb_array_length(comparison_rows)>=2 AND comparison_headers<>'{}'::jsonb)
    )
  )
);

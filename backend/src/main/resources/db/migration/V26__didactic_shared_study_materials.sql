-- Substitui o texto-modelo dos materiais importados por roteiros didáticos
-- reutilizáveis. Materiais já redigidos manualmente são preservados.
WITH classified AS (
  SELECT
    id,
    title,
    discipline,
    study_group,
    CASE
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(portugues|lingua|redacao|texto|gramatica|ortografia)' THEN 'linguagens'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(jornal|comunic|imprensa|midia|publicidade)' THEN 'comunicacao'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(direito|legisl|lei|norma|constitui|etica|administracao publica)' THEN 'normas'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(tecnologia|informatica|sistema|seguranca|dados|rede|software|programacao)' THEN 'tecnologia'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(matemat|raciocinio|estatistica|contabil|financeir|calculo)' THEN 'quantitativo'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(saude|enfermagem|clinica|sus|epidemi)' THEN 'saude'
      ELSE 'geral'
    END AS area
  FROM shared_study_subjects
), material AS (
  SELECT
    *,
    replace(replace(replace(title, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') AS safe_title,
    CASE area
      WHEN 'linguagens' THEN 'Em Linguagens, a resposta precisa ser sustentada pela regra ou por uma evidência do texto. Não basta escolher a alternativa que soa mais natural.'
      WHEN 'comunicacao' THEN 'Em Comunicação, relacione a técnica ao objetivo, ao público, ao meio utilizado e ao efeito que se pretende alcançar.'
      WHEN 'normas' THEN 'Em temas normativos, organize a leitura em quatro pontos: sujeito, condição, comando da regra e consequência jurídica ou administrativa.'
      WHEN 'tecnologia' THEN 'Em Tecnologia, comece pelo problema que o conceito resolve e depois conecte componentes, funcionamento, benefício, limite e exemplo de uso.'
      WHEN 'quantitativo' THEN 'Em temas quantitativos, separe os dados, escreva a relação que será usada e só então calcule. A unidade e a pergunta final devem ser conferidas.'
      WHEN 'saude' THEN 'Em Saúde, conecte definição, finalidade, sequência de execução e riscos. A banca costuma trocar uma etapa, indicação ou prioridade.'
      ELSE 'Comece pelo conceito central, conecte-o ao contexto em que é aplicado e use o comando da questão para decidir qual detalhe é relevante.'
    END AS approach,
    CASE area
      WHEN 'linguagens' THEN 'Procure marcas linguísticas no enunciado: conectivos, referentes, tempos verbais, escolha lexical ou estrutura do gênero. Elas justificam a interpretação.'
      WHEN 'comunicacao' THEN 'Compare as alternativas perguntando: qual técnica é adequada ao objetivo e ao canal? Desconfie de respostas que confundem informação, opinião, público e estratégia.'
      WHEN 'normas' THEN 'Monte uma ficha curta: quem é alcançado, quando a regra se aplica, o que é permitido, obrigatório ou vedado e qual exceção altera a conclusão.'
      WHEN 'tecnologia' THEN 'Desenhe uma cadeia simples: entrada, processamento, saída e controle. Depois teste mentalmente o que muda quando um componente falha ou é configurado de outro modo.'
      WHEN 'quantitativo' THEN 'Antes de calcular, traduza o enunciado para uma relação entre grandezas. Só aceite o resultado se ele for coerente com os dados e com a unidade solicitada.'
      WHEN 'saude' THEN 'Use um caso breve: identifique a situação, a conduta prioritária e o motivo. Em seguida, diferencie prevenção, diagnóstico, intervenção e monitoramento.'
      ELSE 'Transforme o título em uma pergunta: o que é, para que serve, quais elementos o compõem e em qual situação ele muda o resultado de uma questão?' 
    END AS practice_method,
    CASE area
      WHEN 'linguagens' THEN 'A armadilha recorrente é justificar a resposta pela impressão de leitura, sem apontar a regra ou o trecho que a sustenta.'
      WHEN 'comunicacao' THEN 'Evite tratar técnicas de comunicação como sinônimos: o objetivo, o público e o suporte alteram a escolha correta.'
      WHEN 'normas' THEN 'Atenção a palavras absolutas e a exceções: uma condição omitida pode inverter a conclusão da questão.'
      WHEN 'tecnologia' THEN 'Evite decorar siglas isoladas. Compare finalidade, responsabilidade e limitações de cada solução.'
      WHEN 'quantitativo' THEN 'A armadilha mais comum é usar a operação correta com dados, unidade ou condição errados.'
      WHEN 'saude' THEN 'Não troque ordem de prioridade, indicação ou medida de segurança; esses detalhes costumam decidir o item.'
      ELSE 'Não responda por associação de palavras. Confirme se a alternativa atende exatamente ao que foi pedido.'
    END AS caution
  FROM classified
), refreshed AS (
  SELECT
    id,
    '<h3>Entenda o assunto</h3><p><strong>' || safe_title || '</strong> deve ser estudado como uma ferramenta para resolver situações de prova, e não como uma definição isolada. ' || approach || '</p>' ||
    '<h3>Raciocínio de prova</h3><ol><li>Leia o comando e identifique qual decisão ele exige.</li><li>Recupere o conceito, regra ou procedimento relacionado a <strong>' || safe_title || '</strong>.</li><li>Elimine alternativas que trocam condição, finalidade, ordem ou consequência.</li></ol>' ||
    '<h3>Exemplo de aplicação</h3><p>Imagine uma questão que apresenta uma situação prática e pergunta qual conduta, interpretação ou conclusão é adequada. ' || practice_method || '</p>' AS content,
    jsonb_build_array(
      'Defina o conceito central de ' || title || ' com suas próprias palavras.',
      practice_method,
      caution
    ) AS takeaways,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'roteiro-didatico',
        'title', 'Como estudar este assunto',
        'content', '<p>' || practice_method || '</p><p><strong>Atenção:</strong> ' || caution || '</p>',
        'keyTakeaways', jsonb_build_array('Conceito, condição e consequência precisam aparecer juntos.', 'Use o enunciado como prova da resposta, não como mera ilustração.')
      ),
      jsonb_build_object(
        'id', 'pratica-guiada',
        'title', 'Pratique antes de conferir',
        'content', '<p>Responda às três perguntas sem consultar o texto. Depois abra a correção e compare seu raciocínio.</p>',
        'miniQuestions', jsonb_build_array(
          jsonb_build_object('prompt', 'Qual é a ideia central de ' || title || '?', 'answer', approach),
          jsonb_build_object('prompt', 'Como você aplicaria ' || title || ' em uma questão?', 'answer', practice_method),
          jsonb_build_object('prompt', 'Qual erro deve ser evitado nesse assunto?', 'answer', caution)
        )
      )
    ) AS blocks
  FROM material
)
UPDATE shared_study_subjects subject
SET
  base_content = refreshed.content,
  key_takeaways = refreshed.takeaways,
  content_blocks = CASE
    WHEN jsonb_array_length(subject.content_blocks) = 0 THEN refreshed.blocks
    WHEN NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(subject.content_blocks) block
      WHERE jsonb_typeof(block->'miniQuestions') = 'array'
    ) THEN subject.content_blocks || (refreshed.blocks->1)
    ELSE subject.content_blocks
  END,
  updated_at = now()
FROM refreshed
WHERE subject.id = refreshed.id
  AND (
    btrim(subject.base_content) = ''
    OR subject.base_content LIKE '<p>Estude este item do edital%'
  );

-- Materiais detalhados já existentes também recebem apenas as miniquestões,
-- sem substituir texto, capítulos ou pontos-chave escritos pelo administrador.
WITH classified AS (
  SELECT id, title, discipline, study_group,
    CASE
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(portugues|lingua|redacao|texto|gramatica|ortografia)' THEN 'linguagens'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(jornal|comunic|imprensa|midia|publicidade)' THEN 'comunicacao'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(direito|legisl|lei|norma|constitui|etica|administracao publica)' THEN 'normas'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(tecnologia|informatica|sistema|seguranca|dados|rede|software|programacao)' THEN 'tecnologia'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(matemat|raciocinio|estatistica|contabil|financeir|calculo)' THEN 'quantitativo'
      WHEN lower(concat_ws(' ', discipline, title, study_group)) ~ '(saude|enfermagem|clinica|sus|epidemi)' THEN 'saude'
      ELSE 'geral'
    END AS area
  FROM shared_study_subjects
), practice AS (
  SELECT id, jsonb_build_object(
    'id', 'pratica-guiada',
    'title', 'Pratique antes de conferir',
    'content', '<p>Tente responder sem consultar o material. Em seguida, revele a correção comentada e retome o ponto que faltou.</p>',
    'miniQuestions', jsonb_build_array(
      jsonb_build_object('prompt', 'Qual é o conceito central de ' || title || '?', 'answer', CASE area WHEN 'normas' THEN 'Identifique o sujeito, a condição de aplicação, o comando da regra e a consequência.' WHEN 'tecnologia' THEN 'Explique o problema resolvido, os componentes envolvidos e a limitação relevante.' WHEN 'comunicacao' THEN 'Relacione técnica, objetivo, público e meio de comunicação.' WHEN 'linguagens' THEN 'Aponte a regra ou a evidência textual que sustenta a interpretação.' WHEN 'quantitativo' THEN 'Defina as variáveis, a relação entre elas e a unidade esperada.' WHEN 'saude' THEN 'Conecte finalidade, sequência de execução e medida de segurança.' ELSE 'Defina o conceito, sua finalidade e uma situação em que ele se aplica.' END),
      jsonb_build_object('prompt', 'Que evidência do enunciado você procuraria para resolver uma questão sobre esse tema?', 'answer', 'Procure termos que indiquem condição, finalidade, exceção, ordem de etapas ou relação de causa e consequência.'),
      jsonb_build_object('prompt', 'Qual erro de prova você evitará?', 'answer', 'Marcar uma alternativa por associação de palavras, sem verificar se ela responde exatamente ao comando.')
    )
  ) AS block
  FROM classified
)
UPDATE shared_study_subjects subject
SET content_blocks = subject.content_blocks || practice.block,
    updated_at = now()
FROM practice
WHERE subject.id = practice.id
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(subject.content_blocks) block
    WHERE jsonb_typeof(block->'miniQuestions') = 'array'
  );

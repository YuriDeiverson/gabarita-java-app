-- Remove os blocos fabricados em massa pelas migrações V39/V46. Esses textos
-- variavam o enunciado, mas repetiam conceito, pegadinha, estratégia e quadro
-- em centenas de questões. O comentário específico de cada item é preservado
-- como evidência até que uma correção autoral completa seja cadastrada.

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

UPDATE questions
SET concept_explanation = '',
  decisive_evidence = COALESCE(NULLIF(btrim(regexp_replace(
    decisive_evidence,
    '^Critério técnico que decide o item:[[:space:]]*',
    '',
    'i'
  )), ''), explanation),
  answer_analysis = '',
  exam_trap = '',
  similar_question_strategy = '',
  fixation_tips = '[]'::jsonb,
  comparison_headers = '{}'::jsonb,
  comparison_rows = '[]'::jsonb,
  updated_at = now()
WHERE status IN ('ACTIVE', 'ANNULLED')
  AND comparison_headers->>'criterion' IN ('Etapa da análise', 'Elemento da questão')
  AND answer_analysis ~ '^1\. (O item afirma|Delimite a afirmação)';

-- Correção autoral: Media training.
UPDATE questions
SET detailed_topic = 'Comunicação Organizacional → Jornalismo Institucional → Media training',
  concept_explanation =
    'Media training é o treinamento de fontes e porta-vozes para o relacionamento profissional com a imprensa. Ele trabalha preparação da mensagem, clareza, postura, conhecimento do papel institucional e resposta sob pressão.' || E'\n\n' ||
    'O treinamento não serve para decorar falas ou esconder informações. Sua finalidade é ajudar o representante a comunicar fatos com precisão e coerência em entrevistas, coletivas e crises, respeitando o que pode ser divulgado pela instituição.',
  decisive_evidence =
    'A própria finalidade do media training é preparar fontes e porta-vozes para interações com jornalistas, inclusive entrevistas, coletivas e comunicação em situações de crise.',
  answer_analysis =
    'O item enumera aplicações típicas do media training: entrevistas, coletivas de imprensa e situações de crise. Nesses contextos, a fonte precisa compreender a mensagem institucional, responder com clareza e evitar improvisações que provoquem contradições ou divulguem informação inadequada.' || E'\n\n' ||
    'Como preparar fontes para essas situações faz parte diretamente do objetivo dessa modalidade de treinamento, não há troca de finalidade nem ampliação indevida do conceito. Por isso, o item está certo.',
  exam_trap = '',
  similar_question_strategy =
    'Em itens sobre media training, verifique quem é treinado e para qual interação: o foco está em fontes e porta-vozes diante da imprensa, não na produção da notícia nem na publicidade da organização.',
  fixation_tips = jsonb_build_array(
    'Media training prepara fontes e porta-vozes para o relacionamento com a imprensa.',
    'Entrevistas, coletivas e crises são situações típicas desse treinamento.'
  ),
  comparison_headers = '{}'::jsonb,
  comparison_rows = '[]'::jsonb,
  updated_at = now()
WHERE id = '060d62ce-e1d1-479e-83f7-78890ef01779'::uuid;

-- Correção autoral: transparência e acesso à informação.
UPDATE questions
SET detailed_topic = 'Comunicação Organizacional → Comunicação Pública → Transparência e acesso à informação',
  concept_explanation =
    'Transparência administrativa é o dever de tornar a atuação estatal compreensível e acessível ao cidadão. O acesso à informação permite conhecer decisões, gastos, serviços e demais dados públicos, ressalvadas as hipóteses legais de sigilo.' || E'\n\n' ||
    'Na comunicação pública, não basta divulgar: a informação deve ser correta, clara e utilizável. Ruídos, omissões ou linguagem inacessível podem impedir que o cidadão exerça efetivamente o direito de acompanhar e controlar a administração.',
  decisive_evidence =
    'O direito de acesso à informação e o dever de transparência exigem que o poder público forneça informação íntegra e compreensível ao cidadão; essa comunicação também deve observar a moralidade administrativa.',
  answer_analysis =
    'O núcleo do item é a prestação de informação correta ao cidadão. Isso é compatível com a transparência administrativa, pois uma divulgação distorcida, incompleta ou incompreensível não permite controle social nem participação informada.' || E'\n\n' ||
    'A moralidade pública reforça esse dever ao exigir atuação leal e orientada ao interesse coletivo. Assim, o item relaciona corretamente acesso à informação, transparência e qualidade da comunicação pública, razão pela qual deve ser julgado certo.',
  exam_trap = '',
  similar_question_strategy =
    'Em questões de transparência, diferencie mera divulgação de acesso efetivo: confira se a informação é disponibilizada ao cidadão com correção, clareza e possibilidade real de compreensão e controle.',
  fixation_tips = jsonb_build_array(
    'Transparência efetiva exige informação pública correta, acessível e compreensível.',
    'Acesso à informação viabiliza participação cidadã e controle da administração.'
  ),
  comparison_headers = '{}'::jsonb,
  comparison_rows = '[]'::jsonb,
  updated_at = now()
WHERE id = '0740efa2-0c59-4a1a-9a87-1e53ab8e7275'::uuid;

-- A mesma referência oficial foi associada a um segundo enunciado. Seu guia
-- precisa analisar a relação entre reconhecimento institucional e igualdade,
-- em vez de reutilizar a correção da outra paráfrase.
UPDATE questions
SET detailed_topic = 'Língua Portuguesa → Interpretação de Texto → Paráfrase e relação de condição',
  concept_explanation =
    'Uma paráfrase válida pode trocar o vocabulário do texto, desde que preserve a relação entre as ideias. Neste item, a relação central é de necessidade prática: enfrentar manifestações de racismo nas instituições é condição para construir um ambiente de trabalho orientado pela igualdade racial.' || E'\n\n' ||
    '“Reconhecer e abordar” não significa apenas conhecer uma definição. As expressões indicam identificar como o problema aparece nas práticas organizacionais e adotar medidas para enfrentá-lo.',
  decisive_evidence =
    'O fechamento do texto afirma que “reconhecer e abordar as maneiras como se manifesta o racismo institucional é fundamental para promover a igualdade racial nos espaços de trabalho”.',
  answer_analysis =
    'O item conserva os dois lados dessa relação. De um lado, menciona o reconhecimento e o combate às manifestações de racismo presentes nas práticas institucionais. De outro, associa essa atuação ao desenvolvimento de um ambiente de trabalho pautado pela igualdade racial.' || E'\n\n' ||
    'As expressões mudam, mas a estrutura lógica permanece: agir sobre o racismo manifestado no cotidiano das instituições é necessário para promover igualdade no trabalho. Como não houve inversão de causa e consequência nem ampliação incompatível com a conclusão do texto, o item está certo.',
  exam_trap =
    'A banca substitui “reconhecer e abordar” por “reconhecer e combater ativamente” e “promover a igualdade racial” por “desenvolver um ambiente pautado pela igualdade”. A troca é legítima porque mantém ação, finalidade e âmbito institucional.',
  similar_question_strategy =
    'Em questões de paráfrase, alinhe os pares de ideias do texto e do item e confira separadamente ação, finalidade e âmbito. Palavras diferentes são aceitáveis quando preservam essas três relações.',
  fixation_tips = jsonb_build_array(
    'Paráfrase válida altera as palavras, mas conserva a relação lógica entre as ideias.',
    'Reconhecer e enfrentar manifestações institucionais de racismo contribui para promover igualdade no trabalho.'
  ),
  comparison_headers = '{}'::jsonb,
  comparison_rows = '[]'::jsonb,
  updated_at = now()
WHERE id = '298d65de-bd47-4a20-971f-667a49fa2093'::uuid;

-- Guias autorais continuam completos. Questões ainda não revisadas podem
-- publicar somente sua evidência específica, sem preencher o modal com texto
-- genérico. A API administrativa continua exigindo o guia completo para todo
-- novo cadastro ou edição editorial.
ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE', 'ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(decisive_evidence)) >= 18
    AND (btrim(answer_analysis) = '' OR length(btrim(answer_analysis)) >= 120)
    AND (btrim(similar_question_strategy) = '' OR length(btrim(similar_question_strategy)) >= 40)
    AND jsonb_array_length(fixation_tips) BETWEEN 0 AND 4
    AND (
      (jsonb_array_length(comparison_rows) = 0 AND comparison_headers = '{}'::jsonb)
      OR (jsonb_array_length(comparison_rows) >= 2 AND comparison_headers <> '{}'::jsonb)
    )
  )
);

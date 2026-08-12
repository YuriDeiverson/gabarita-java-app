-- Guia aprofundado do item 4. Cada bloco tem função pedagógica própria e não
-- repete o comentário curto exibido no cartão da questão.
UPDATE questions
SET
  detailed_topic = 'Interpretação de Texto — Generalização Indevida e Condição Necessária',
  concept_explanation =
    'Em interpretação de texto, uma generalização indevida acontece quando o item transforma uma afirmação condicionada ou limitada em uma regra válida para todos os casos.' || E'\n\n' ||
    'Compare estas duas estruturas: “a desigualdade pode revelar discriminação quando favorece ou prejudica grupos raciais específicos” e “toda desigualdade é discriminação racial”. A primeira exige uma condição: a diferença precisa estar relacionada à raça. A segunda elimina essa condição e amplia o alcance da ideia.' || E'\n\n' ||
    'Nas provas do CEBRASPE, palavras como “todo”, “qualquer”, “sempre”, “necessariamente”, “por si só” e “independentemente” merecem atenção. Elas podem tornar absoluta uma ideia que o texto apresentou apenas como possibilidade ou dentro de uma situação específica.',
  decisive_evidence =
    '“Essas manifestações de racismo dentro das instituições podem ser observadas em várias áreas, desde a maneira como o pessoal é selecionado e promovido até a distribuição de recursos. Isso pode resultar em desigualdades sistêmicas que afetam grupos pertencentes a minorias raciais.”',
  answer_analysis =
    '1. O texto trata de manifestações de racismo institucional, e não de qualquer diferença existente entre pessoas, setores ou recursos.' || E'\n\n' ||
    '2. A distribuição de recursos aparece como uma área em que o racismo pode ser observado. Para isso, as políticas ou práticas da instituição precisam favorecer ou prejudicar grupos raciais específicos.' || E'\n\n' ||
    '3. Portanto, a simples existência de uma distribuição desigual não basta para provar racismo institucional. A desigualdade pode decorrer de outras causas. É indispensável demonstrar a relação com discriminação racial ou com efeitos que atingem grupos definidos pela raça.' || E'\n\n' ||
    '4. O item retirou essa condição e tratou toda desigualdade na distribuição de recursos como racismo institucional. Como ampliou o que o texto efetivamente afirma, o julgamento é ERRADO.',
  exam_trap =
    'A banca aproveita palavras que realmente aparecem no texto — “distribuição de recursos” e “desigualdades” — para criar uma conclusão que parece fiel. A troca acontece no alcance lógico: o texto diz que a discriminação pode produzir desigualdade; o item sugere que qualquer desigualdade prova discriminação. Isso inverte a relação e elimina a condição racial.',
  fixation_tips = jsonb_build_array(
    'Localize palavras absolutas no item e confira se o texto também usa o mesmo alcance.',
    'Não confunda possibilidade com certeza: “pode ocorrer” não significa “ocorre em todos os casos”.',
    'Não confunda consequência com prova automática: uma desigualdade pode ser efeito de discriminação, mas precisa haver vínculo textual ou lógico entre elas.',
    'No CEBRASPE, um único exagero ou uma condição omitida torna o item inteiro errado.'
  ),
  comparison_headers = jsonb_build_object(
    'criterion', 'Ponto analisado',
    'left', 'O que o texto autoriza concluir',
    'right', 'Erro cometido pelo item'
  ),
  comparison_rows = jsonb_build_array(
    jsonb_build_object(
      'criterion', 'Distribuição de recursos',
      'left', 'É uma das áreas em que manifestações de racismo institucional podem ser observadas.',
      'right', 'Tratá-la como prova automática de racismo em qualquer situação.'
    ),
    jsonb_build_object(
      'criterion', 'Desigualdade',
      'left', 'Pode resultar de práticas que afetam grupos pertencentes a minorias raciais.',
      'right', 'Afirmar que toda distribuição desigual possui necessariamente causa racial.'
    ),
    jsonb_build_object(
      'criterion', 'Condição necessária',
      'left', 'Deve existir relação entre a prática institucional e o favorecimento ou prejuízo de grupos raciais.',
      'right', 'Omitir o vínculo racial e fazer uma generalização.'
    )
  ),
  updated_at = now()
WHERE metadata->>'reference' = 'CODEVASF 2024 - Item 4';

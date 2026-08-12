-- Gabarito aprofundado para o item de interpretação da CODEVASF e cabeçalhos
-- semânticos para as tabelas das primeiras correções completas.
UPDATE questions
SET metadata = metadata || jsonb_build_object(
  'detailedTopic', 'Interpretação de Texto — Compreensão Textual e Inferência',
  'conceptExplanation',
    'A compreensão textual consiste em reconhecer informações que o texto apresenta de forma direta. A inferência válida é uma conclusão que não aparece necessariamente com as mesmas palavras, mas decorre logicamente das informações fornecidas pelo autor.' || E'\n\n' ||
    'Em questões de concurso com comandos como “conclui-se do texto”, “infere-se” ou “depreende-se”, a resposta precisa ter apoio em uma passagem ou em uma relação lógica presente no texto. Não é permitido acrescentar uma opinião pessoal, ampliar o alcance da afirmação nem transformar uma possibilidade em certeza.' || E'\n\n' ||
    'O método mais seguro é localizar o trecho-base e comparar seus termos com os do item. Palavras diferentes podem expressar a mesma ideia: “fundamental” pode corresponder a “relevante”, e “espaços de trabalho” pode corresponder a “ambiente laboral”. Quando a equivalência preserva o sentido e não acrescenta informação, a inferência é válida.',
  'answerAnalysis',
    'O item está CERTO. Ele afirma que conhecer o racismo institucional é relevante para promover a igualdade racial no ambiente laboral. Essa conclusão é sustentada diretamente pelo fechamento do texto.' || E'\n\n' ||
    'Trecho decisivo: “O racismo institucional é um conceito-chave para compreender como as estruturas e práticas das organizações podem perpetuar a discriminação racial [...] portanto, reconhecer e abordar as maneiras como se manifesta o racismo institucional é fundamental para promover a igualdade racial nos espaços de trabalho.”' || E'\n\n' ||
    'O item realiza três equivalências legítimas. “Conhecimento sobre o racismo institucional” retoma a ideia de compreender, reconhecer e abordar suas manifestações. “Relevante” mantém o sentido de “fundamental”, embora seja uma formulação menos intensa. “Ambiente laboral” equivale a “espaços de trabalho”.' || E'\n\n' ||
    'Não há extrapolação, inversão nem generalização indevida. A banca apenas parafraseou a conclusão expressa no último período. Por isso, o julgamento correto é CERTO.' || E'\n\n' ||
    'Pegadinha de prova: não procure obrigatoriamente as mesmas palavras do item no texto. Procure equivalência de sentido. Ao mesmo tempo, desconfie de termos absolutos como “sempre”, “somente”, “todos” e “nunca”, pois eles podem ampliar uma afirmação limitada.',
  'fixationTips', jsonb_build_array(
    'Em “conclui-se do texto”, localize primeiro a passagem que sustenta a conclusão.',
    'Paráfrase correta troca as palavras, mas preserva o sentido, o alcance e a intensidade da ideia.',
    'Inferência válida decorre do texto; extrapolação acrescenta algo que o autor não autorizou.',
    'Em itens de interpretação, compare especialmente sujeitos, condições, causa, consequência e palavras absolutas.'
  ),
  'comparisonHeaders', jsonb_build_object(
    'criterion', 'Termo no item',
    'left', 'Trecho ou ideia equivalente no texto',
    'right', 'Validação'
  ),
  'comparisonRows', jsonb_build_array(
    jsonb_build_object(
      'criterion', 'Conhecimento sobre o racismo institucional',
      'left', '“conceito-chave para compreender” e “reconhecer e abordar as maneiras como se manifesta”',
      'right', 'Equivalência de sentido'
    ),
    jsonb_build_object(
      'criterion', 'É relevante',
      'left', '“é fundamental”',
      'right', 'A ideia de importância foi preservada'
    ),
    jsonb_build_object(
      'criterion', 'Ambiente laboral',
      'left', '“espaços de trabalho”',
      'right', 'Sinônimo contextual'
    )
  )
), updated_at = now()
WHERE metadata->>'reference' = 'CODEVASF 2024 - Item 2';

UPDATE questions
SET metadata = jsonb_set(
  metadata,
  '{comparisonHeaders}',
  jsonb_build_object(
    'criterion', 'Característica',
    'left', 'Vírus',
    'right', 'Worm'
  ),
  true
), updated_at = now()
WHERE metadata->>'reference' = 'CEBRASPE — SEPLAG/AL — Especialista em Gestão Pública — Edital 2026 — Item 29';

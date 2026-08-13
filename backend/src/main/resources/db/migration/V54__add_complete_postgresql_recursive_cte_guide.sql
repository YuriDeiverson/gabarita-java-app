-- Correção autoral do item PostgreSQL 17 / WITH RECURSIVE.
UPDATE questions SET
  detailed_topic='Banco de Dados → PostgreSQL → CTE recursiva com WITH RECURSIVE',
  concept_explanation=
    'Uma CTE recursiva é uma expressão temporária definida pela cláusula WITH RECURSIVE. Em geral, sua consulta possui um termo não recursivo, chamado de caso-base ou termo âncora, e um termo recursivo que referencia o resultado produzido pela própria CTE.' || E'\n\n' ||
    'O PostgreSQL avalia primeiro o termo âncora. Depois, executa repetidamente o termo recursivo sobre as linhas obtidas na iteração anterior e acrescenta os novos resultados. O processo termina quando uma iteração não produz novas linhas. Essa estrutura é adequada para percorrer árvores, relações pai–filho, caminhos e séries calculadas.',
  decisive_evidence=
    'O item associa WITH RECURSIVE a consultas recursivas ou hierárquicas e cita duas aplicações válidas: gerar uma sequência geométrica e percorrer árvores armazenadas em relações.',
  answer_analysis=
    'A afirmação está correta porque a CTE pode referenciar a si mesma no termo recursivo. Para gerar uma sequência, o termo âncora fornece o primeiro valor e cada iteração calcula o próximo. Para uma árvore, o termo âncora seleciona a raiz e o termo recursivo relaciona cada nível aos respectivos filhos.' || E'\n\n' ||
    'Embora a sintaxe use recursão, o PostgreSQL executa esse processamento internamente de forma iterativa, mantendo um conjunto de trabalho. Também é necessário que a consulta possua uma condição de parada lógica; caso contrário, ela pode continuar produzindo linhas indefinidamente. As duas finalidades descritas no enunciado são compatíveis com esse funcionamento, por isso o item está certo.',
  exam_trap=
    'A palavra RECURSIVE modifica a cláusula WITH e habilita a autorreferência da CTE; ela não transforma qualquer SELECT em recursivo. A recursão surge quando um termo da CTE consulta o próprio nome definido.',
  similar_question_strategy=
    'Ao analisar uma CTE recursiva, localize três partes: termo âncora, referência da CTE a si mesma e condição que encerra a produção de linhas. Depois verifique se o problema possui níveis ou valores sucessivos.',
  fixation_tips=jsonb_build_array(
    'CTE recursiva = termo âncora + termo recursivo que referencia a própria CTE.',
    'Usos típicos: árvores, hierarquias, caminhos e sequências.',
    'A recursão termina quando a iteração não produz novas linhas.'
  ),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='b3d3f136-7ac1-4adf-8451-6645c047a7c3'::uuid;

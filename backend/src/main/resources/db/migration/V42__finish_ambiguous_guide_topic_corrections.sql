-- Segunda passagem para ambiguidades descobertas na auditoria do acervo:
-- "licitação" dentro de "solicitação" e "SUS" dentro de "suspenso".

WITH corrected(id, new_topic, new_concept, new_trap) AS (
  VALUES
    (
      'ba75fa8b-09ec-42f2-bd60-7ad00585334f'::uuid,
      'Engenharia de Software — Git, Pull Requests e Revisão de Código',
      'Git é um sistema de controle de versões distribuído: cada branch mantém uma linha de trabalho, e commits registram alterações. Pull Request, ou Merge Request, é o pedido para revisar e incorporar as mudanças de um branch em outro; ele é uma funcionalidade das plataformas de colaboração, como GitHub e GitLab, construída sobre o fluxo do Git.' || E'\n\n' ||
      'Em concursos, diferencie commit, push, pull, merge e Pull Request. O Pull Request não faz a fusão automaticamente nem é um comando nativo obrigatório do Git: ele organiza discussão, revisão, testes e aprovação antes do merge, conforme as regras do repositório.',
      'A banca pode tratar Git, GitHub e GitLab como sinônimos ou confundir solicitação de revisão com a própria fusão. Pull Request abre o fluxo de avaliação; o merge é a operação que efetivamente incorpora os históricos.'
    ),
    (
      '593396b7-f145-45f7-addf-30ffb0f13a5d'::uuid,
      'Direito Administrativo — Processo Disciplinar e Garantias do Servidor',
      'O processo administrativo disciplinar apura infração funcional com contraditório, ampla defesa e decisão fundamentada. Medidas cautelares, como afastamento preventivo quando previsto em lei, servem para proteger a apuração e não equivalem antecipadamente à penalidade definitiva.' || E'\n\n' ||
      'Em concursos, separe medida provisória, sanção final e efeitos remuneratórios. A consequência aplicável depende da lei e do resultado do processo; transformar uma cautela em perda definitiva, especialmente independentemente da conclusão, viola a lógica das garantias processuais.',
      'A pegadinha é antecipar a punição antes do julgamento ou usar palavras absolutas como “definitivamente” e “independentemente do resultado”. Medida cautelar não autoriza presumir culpa nem criar efeito permanente não previsto.'
    ),
    (
      'f2f23475-e7c2-4740-8122-4d176b5d4fd0'::uuid,
      'Regulação Econômica — Atos de Liberação e Aprovação Tácita',
      'A Declaração de Direitos de Liberdade Econômica disciplina a relação entre particulares e o poder público em atos de liberação de atividade econômica. Entre suas garantias está o conhecimento do prazo máximo de análise; nas hipóteses legalmente admitidas, o fim do prazo sem decisão pode produzir aprovação tácita.' || E'\n\n' ||
      'A aprovação tácita não é uma autorização universal. Ela depende do enquadramento do ato, das exceções legais e das condições definidas pela autoridade competente. Em prova, confirme prazo, espécie de ato, efeito do silêncio e ressalvas antes de concluir.',
      'A banca costuma transformar uma regra condicionada em aprovação automática para qualquer atividade. O detalhe decisivo está nas exceções e nos casos em que a legislação não permite que o silêncio administrativo produza liberação.'
    )
)
UPDATE questions q SET
  detailed_topic = c.new_topic,
  concept_explanation = c.new_concept,
  exam_trap = c.new_trap,
  fixation_tips = jsonb_build_array(
    'Antes de marcar, explique com suas palavras o conceito central de ' || c.new_topic || '.',
    'Separe o instituto principal dos conceitos próximos e identifique a função de cada um.',
    'Confira condições, exceções, agente responsável e consequência antes de aceitar a afirmação.',
    'Registre o detalhe decisivo que tornou o item certo ou errado para revisar antes da prova.'
  ),
  updated_at = now()
FROM corrected c
WHERE q.id = c.id
  AND q.comparison_headers->>'criterion' = 'Etapa da análise';

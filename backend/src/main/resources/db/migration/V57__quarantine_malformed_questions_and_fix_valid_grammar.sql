-- Retira da publicação itens cujo próprio enunciado não permite a análise
-- pedida ou cujo gabarito jurídico compartilhado exige conferência normativa.
-- Os registros são preservados como DRAFT para revisão editorial.

UPDATE questions SET status='DRAFT',
  metadata=metadata || jsonb_build_object(
    'guideReviewReason','Enunciado malformado: o fenômeno gramatical perguntado não aparece no período citado.',
    'guideReviewAt',now()::text
  ),updated_at=now()
WHERE status IN ('ACTIVE','ANNULLED')
  AND explanation='Incorreto. A assertiva inverte a regra de coesão ou a relação lógica estabelecida. A substituição proposta altera o sentido gramatical ou semântico original, gerando erro de sintaxe.'
  AND id NOT IN (
    '8512cb27-258a-4796-9ebe-a745b278da4b'::uuid,
    '62ea5591-1502-4269-8bff-5a1dbfda91aa'::uuid
  );

UPDATE questions SET status='DRAFT',
  metadata=metadata || jsonb_build_object(
    'guideReviewReason','Gabarito jurídico genérico compartilhado entre normas distintas; exige conferência na fonte oficial antes de nova publicação.',
    'guideReviewAt',now()::text
  ),updated_at=now()
WHERE status IN ('ACTIVE','ANNULLED')
  AND explanation='Incorreto. A assertiva distorce a legislação vigente (Constituição Federal, Marco Legal de CT&I, Estatuto da FAPEAL, Decreto nº 4.383/2015 ou Lei nº 5.247/1991). O texto incorreto contraria os preceitos de autonomia, fomento público ou as garantias funcionais dos servidores.';

UPDATE questions SET
  correct_answer='"Certo"'::jsonb,
  explanation='Certo. Em “Não se admitirá”, a palavra negativa “não” atrai o pronome átono “se”, tornando obrigatória a próclise.',
  concept_explanation='Palavras de sentido negativo, quando não há pausa entre elas e o verbo, são fatores de atração pronominal. Por isso, o pronome oblíquo átono deve ficar antes do verbo: “não se admitirá”, e não “não admitirá-se”.',
  decisive_evidence='O trecho decisivo é “Não se admitirá”: “não” antecede o pronome átono “se” e o verbo “admitirá”.',
  answer_analysis='O item identifica corretamente a posição do pronome. A negação “não” funciona como palavra atrativa e exige próclise; o futuro do presente não autoriza afastar o pronome desse fator de atração. Logo, a construção “Não se admitirá” confirma a afirmação e o gabarito é Certo.',
  exam_trap='Sem a palavra atrativa, o futuro do presente poderia favorecer mesóclise na norma tradicional (“admitir-se-á”). Com “não”, porém, prevalece a próclise: “não se admitirá”.',
  similar_question_strategy='Ao julgar colocação pronominal, procure antes do verbo fatores de atração como negação, pronome relativo, conjunção subordinativa ou advérbio sem pausa. Encontrando “não”, teste primeiro a próclise.',
  fixation_tips=jsonb_build_array('Palavra negativa antes do verbo atrai pronome átono: não se admitirá.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='8512cb27-258a-4796-9ebe-a745b278da4b'::uuid;

UPDATE questions SET
  explanation='Errado. “Embora” introduz concessão; “portanto” introduz conclusão. A troca altera a relação lógica entre o cenário desafiador e a manutenção das bolsas.',
  concept_explanation='Conjunções concessivas apresentam um fato que poderia dificultar o resultado, mas não o impede. Conjunções conclusivas apresentam uma consequência ou conclusão derivada do que foi dito antes.',
  decisive_evidence='A relação original é “Embora o cenário ... seja desafiador, a FAPEAL manteve...”.',
  answer_analysis='Na frase original, o cenário econômico adverso cria uma expectativa de redução das bolsas, mas essa expectativa é contrariada: a FAPEAL as manteve. “Embora” expressa exatamente essa concessão. “Portanto” faria a segunda oração parecer conclusão do cenário desafiador, relação que o período não estabelece. A substituição muda o sentido e o item está errado.',
  exam_trap='As duas palavras conectam orações e podem soar formais, mas codificam relações opostas no contexto: concessão não é conclusão.',
  similar_question_strategy='Em substituição de conectivos, nomeie a relação antes da troca. Se houver quebra de expectativa, procure concessão; se a segunda ideia decorrer da primeira, procure conclusão.',
  fixation_tips=jsonb_build_array('Embora = concessão/quebra de expectativa; portanto = conclusão.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='62ea5591-1502-4269-8bff-5a1dbfda91aa'::uuid;

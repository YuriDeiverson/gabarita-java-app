-- Substitui comentários genéricos de questões antigas de Língua Portuguesa por
-- explicações que apontam o trecho decisivo e a regra cobrada. A condição final
-- preserva eventuais comentários que já tenham sido revisados manualmente.
UPDATE questions AS question
SET
  explanation = source.explanation,
  metadata = jsonb_set(question.metadata, '{topic}', to_jsonb(source.topic), true),
  updated_at = now()
FROM (VALUES
  (
    'CODEVASF 2024 - Item 1',
    'Compreensão e interpretação de textos',
    'Item errado. O texto atribui ao racismo institucional impacto duradouro e participação na manutenção das desigualdades raciais, mas não afirma que essas características o diferenciam de todas as demais formas de racismo. A distinção apresentada pelo texto está em ele se enraizar nas políticas, nos procedimentos e nas práticas das organizações, mesmo sem intenção individual de discriminar. O erro está em transformar efeitos mencionados pelo autor no critério de diferenciação entre os tipos de racismo.'
  ),
  (
    'CODEVASF 2024 - Item 2',
    'Compreensão e interpretação de textos',
    'Item certo. O último período afirma que reconhecer e enfrentar as manifestações do racismo institucional é fundamental para promover a igualdade racial nos espaços de trabalho. Portanto, o conhecimento desse fenômeno é apresentado como etapa relevante para identificar práticas discriminatórias e combatê-las no ambiente laboral.'
  ),
  (
    'CODEVASF 2024 - Item 3',
    'Compreensão e interpretação de textos',
    'Item certo. O texto situa o racismo institucional dentro de organizações públicas e privadas e explica que ele se encontra enraizado em políticas, procedimentos, práticas, estruturas e normas. Assim, não se limita a atitudes isoladas de uma pessoa: integra o modo como a própria instituição funciona, o que sustenta a interpretação de que constitui uma cultura organizacional discriminatória.'
  ),
  (
    'CODEVASF 2024 - Item 4',
    'Compreensão e interpretação de textos',
    'Item errado. O texto diz que o racismo institucional pode ser observado na distribuição de recursos quando as práticas da organização favorecem ou prejudicam grupos raciais específicos. Nem toda distribuição desigual de recursos, por si só, constitui racismo institucional; é necessário que a desigualdade esteja ligada a critérios ou efeitos de discriminação racial. O item omite essa condição indispensável e faz uma generalização.'
  ),
  (
    'CODEVASF 2024 - Item 5',
    'Compreensão e interpretação de textos',
    'Item certo. O racismo institucional é descrito como menos conhecido e menos reconhecido que formas mais evidentes de preconceito. Além disso, pode estar presente em regras e práticas organizacionais mesmo quando não existe intenção individual declarada de discriminar. Esses elementos permitem inferir que sua manifestação costuma ser indireta ou velada.'
  ),
  (
    'CODEVASF 2024 - Item 6',
    'Compreensão e interpretação de textos',
    'Item errado. O primeiro parágrafo informa apenas que o conceito de racismo institucional ainda é pouco familiar para muitas pessoas e menos conhecido que outras formas de racismo. Isso não equivale a afirmar que toda a população brasileira é incapaz de reconhecê-lo. O item amplia indevidamente uma afirmação parcial — “muitas pessoas” — para uma conclusão absoluta sobre a população.'
  ),
  (
    'CODEVASF 2024 - Item 7',
    'Orações adverbiais e relações de sentido',
    'Item certo. No trecho “é fundamental para promover a igualdade racial nos espaços de trabalho”, a preposição “para” introduz a finalidade de reconhecer e enfrentar as manifestações do racismo institucional. A pergunta que esclarece a relação é: reconhecer e abordar essas manifestações para quê? Para promover a igualdade racial.'
  ),
  (
    'CODEVASF 2024 - Item 8',
    'Sintaxe: identificação do sujeito',
    'Item errado. Em “É um problema complexo”, o sujeito está implícito e retoma “o racismo institucional” — também referido anteriormente como “essa dimensão do racismo” —, tema de todo o parágrafo. A expressão “a discriminação racial” aparece como complemento do verbo “perpetuar” no período anterior e não funciona como sujeito da oração analisada.'
  ),
  (
    'CODEVASF 2024 - Item 9',
    'Reescrita e concordância verbal',
    'Item certo. As locuções “estão se tornando” e “vêm se tornando” expressam um processo gradual que começou anteriormente e continua no presente, preservando o sentido do trecho. Como o sujeito é plural — “as denúncias” —, a forma do verbo vir deve ser grafada “vêm”, com acento circunflexo; essa concordância é indispensável para a correção da reescrita.'
  ),
  (
    'CODEVASF 2024 - Item 10',
    'Pontuação e coesão textual',
    'Item certo. O segundo período explica a afirmação do primeiro: depois de dizer que o racismo institucional vai além de atitudes individuais e ações isoladas, o texto esclarece que ele está enraizado nas políticas, nos procedimentos e nas práticas das organizações. Por introduzirem uma explicação, os dois períodos podem ser unidos por dois-pontos, com o ajuste da inicial de “ele” para minúscula.'
  ),
  (
    'CODEVASF 2024 - Item 11',
    'Reescrita e pontuação',
    'Item errado. Na correlação aditiva “não apenas... mas também”, “mas também” forma uma unidade e não deve ser separada por vírgula. A reescrita proposta insere indevidamente vírgulas em “mas, também,”, rompendo essa correlação. Uma forma correta seria: “não se trata apenas de como as pessoas se comportam, mas também de como as estruturas e as normas podem favorecer ou prejudicar grupos raciais específicos”.'
  ),
  (
    'CODEVASF 2024 - Item 12',
    'Crase',
    'Item errado. Em “a minorias raciais”, o “a” está no singular diante do substantivo plural “minorias”, o que revela a presença somente da preposição, sem o artigo definido “as”; por isso, não ocorre crase. Seriam corretas “a minorias raciais”, em sentido genérico, ou “às minorias raciais”, com preposição mais artigo. Não é possível apenas acrescentar o acento à forma singular e manter a construção.'
  ),
  (
    'CODEVASF 2024 - Item 13',
    'Reescrita e relações de sentido',
    'Item certo. No contexto, “limitando suas oportunidades” explica de que maneira as desigualdades sistêmicas afetam os grupos de minorias raciais. A reescrita com “porque limita suas oportunidades” explicita essa relação de causa sem alterar a informação central nem criar problema de concordância, desde que o sujeito de “limita” seja recuperado do contexto.'
  ),
  (
    'CODEVASF 2024 - Item 14',
    'Semântica vocabular',
    'Item errado. “Perpetuar” significa fazer continuar, conservar ou prolongar no tempo; no texto, as estruturas organizacionais podem manter a discriminação racial. “Potencializar” significa aumentar a força, a intensidade ou o efeito de algo. Embora uma prática possa simultaneamente manter e intensificar uma desigualdade, os verbos não são sinônimos e a substituição altera o sentido.'
  )
) AS source(reference, topic, explanation)
WHERE question.metadata->>'reference' = source.reference
  AND (
    BTRIM(COALESCE(question.explanation, '')) = ''
    OR question.explanation ~* '^gabarito oficial'
    OR question.explanation ~* '^para revisar'
  );

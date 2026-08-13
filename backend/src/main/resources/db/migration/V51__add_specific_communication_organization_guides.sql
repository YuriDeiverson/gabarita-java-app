-- Guias específicos do banco de 64 questões de Comunicação Organizacional.
-- Cada item recebe explicação própria; nenhum campo é copiado entre questões.

-- Questão 2: transparência ativa e integridade.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Transparência ativa',
  concept_explanation='Transparência ativa é a divulgação espontânea, pelo poder público, de informações de interesse coletivo. Ela não depende de solicitação do cidadão e se concretiza, por exemplo, em portais de transparência, publicação de despesas, contratos e relatórios.',
  decisive_evidence='A expressão “independentemente de requerimentos” descreve exatamente a iniciativa do próprio órgão, elemento que caracteriza a transparência ativa.',
  answer_analysis='O item afirma que informações de interesse público devem ser divulgadas de forma proativa. Essa conduta permite fiscalização e reduz a assimetria de informação entre governo e sociedade, razão pela qual também demonstra compromisso institucional com integridade e publicidade.' || E'\n\n' || 'Como o cidadão não precisa provocar a administração para ter acesso ao conteúdo, a modalidade indicada é ativa. A relação estabelecida no enunciado está correta.',
  exam_trap='A distinção está em quem inicia o fluxo: na transparência ativa, o órgão publica; na passiva, o cidadão solicita.',
  similar_question_strategy='Procure no item o agente que toma a iniciativa. Verbos como “publicar espontaneamente” apontam transparência ativa; “responder ao pedido” aponta transparência passiva.',
  fixation_tips=jsonb_build_array('Transparência ativa = divulgação de ofício, sem pedido prévio.','A publicação proativa favorece publicidade, integridade e controle social.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='2f7c0ce5-24b8-4c69-adae-d1f28ecf21c7'::uuid;

-- Questão 3: accountability e prestação de contas.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Accountability e prestação de contas',
  concept_explanation='Accountability é o dever de quem exerce poder público de explicar suas decisões, demonstrar como utilizou recursos, apresentar resultados e sujeitar-se a controle e responsabilização. O conceito combina transparência, prestação de contas e possibilidade de cobrança por desvios.' || E'\n\n' || 'Na democracia, o gestor administra interesses e recursos que pertencem à coletividade. Por isso, o mandato ou cargo não confere poder sem controle: quem age em nome do povo deve tornar sua atuação verificável.',
  decisive_evidence='O ponto decisivo é a natureza pública do poder e dos recursos administrados: se o poder emana do povo, o agente que o exerce deve prestar contas à sociedade e aos órgãos de controle.',
  answer_analysis='A prestação de contas possui dimensão financeira porque alcança receitas, despesas e patrimônio público; dimensão ética porque exige responsabilidade, integridade e justificativa das decisões; e fundamento constitucional porque publicidade, controle e fiscalização integram o regime republicano.' || E'\n\n' || 'A frase liga corretamente o dever de prestar contas à democracia representativa. O gestor não é proprietário do cargo nem dos recursos que administra: exerce competência pública em nome da coletividade. Logo, a prestação de contas é obrigatória e o item está certo.',
  exam_trap='',
  similar_question_strategy='Em questões sobre accountability, verifique se aparecem três elementos: obrigação de explicar a atuação, possibilidade de fiscalização e responsabilização. Prestação de contas sem controle ou consequência descreve apenas parte do conceito.',
  fixation_tips=jsonb_build_array('Accountability = prestar contas + permitir controle + responder por resultados e desvios.','Poder e recursos públicos pertencem à coletividade; o gestor apenas os administra.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='17d99774-9b04-43e9-a321-d90b4fa1144b'::uuid;

-- Questão 4: transparência passiva.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Transparência passiva',
  concept_explanation='Transparência passiva é o fornecimento de informação pública em resposta a uma solicitação. O órgão disponibiliza canal para o pedido, processa o requerimento e responde conforme os procedimentos e prazos legais.',
  decisive_evidence='O trecho “quando o cidadão solicita formalmente” mostra que o fluxo foi provocado pelo requerente, característica central da transparência passiva.',
  answer_analysis='A informação não foi divulgada previamente pelo órgão; ela é fornecida após um pedido específico do cidadão. Isso corresponde ao exercício do direito de acesso mediante requerimento.' || E'\n\n' || 'A referência aos prazos legais também é compatível com o processamento de pedidos previsto na LAI. Portanto, a definição apresentada no item está correta.',
  exam_trap='',
  similar_question_strategy='Pergunte quem iniciou o acesso. Se o cidadão apresentou pedido e o órgão respondeu, classifique como transparência passiva, mesmo que a resposta seja publicada por meio digital.',
  fixation_tips=jsonb_build_array('Transparência passiva = informação fornecida após solicitação.','O canal pode ser digital; o que define a modalidade é a iniciativa do cidadão.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='9ca679da-65d8-4a81-9ac8-cae5dc77b9e7'::uuid;

-- Questão 5: gratuidade do acesso digital.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Lei de Acesso à Informação → Gratuidade do serviço',
  concept_explanation='O serviço de busca e fornecimento de informação pública é gratuito. A cobrança admitida relaciona-se apenas ao ressarcimento do custo de materiais e serviços usados na reprodução física, como cópias ou mídia, e não ao conteúdo da informação.',
  decisive_evidence='O erro está em “cobrar tarifas adicionais para disponibilizar o link de download”: fornecer um arquivo digital já disponível não gera custo de reprodução física que justifique cobrança.',
  answer_analysis='Se a informação já está em formato digital e não exige tratamento adicional, o órgão pode encaminhar o arquivo ou indicar o endereço eletrônico. Cobrar uma tarifa pelo simples acesso ao link transformaria o direito de informação em serviço pago.' || E'\n\n' || 'A ressalva legal de cobrança não autoriza tarifa genérica; limita-se ao ressarcimento de reprodução material. Como o enunciado amplia indevidamente essa exceção para o download, o item está errado.',
  exam_trap='A banca parte de uma exceção verdadeira — ressarcimento de reprodução — e a aplica a uma situação sem reprodução física.',
  similar_question_strategy='Ao encontrar cobrança em questão de LAI, identifique qual custo concreto existe. Acesso e busca são gratuitos; somente reprodução material pode gerar ressarcimento estritamente correspondente.',
  fixation_tips=jsonb_build_array('Acesso à informação pública é gratuito.','Pode haver ressarcimento de reprodução física, não tarifa pelo conteúdo ou por link digital.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='961595f8-836b-4479-bffd-c80fced72f0c'::uuid;

-- Questão 6: graus e prazos de sigilo.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Lei de Acesso à Informação → Classificação de sigilo',
  concept_explanation='A LAI estabelece três graus de classificação para informações cuja divulgação possa comprometer interesses protegidos: reservada, secreta e ultrassecreta. Cada grau possui prazo máximo próprio de restrição.',
  decisive_evidence='Os pares apresentados correspondem aos limites legais: reservada por até 5 anos, secreta por até 15 anos e ultrassecreta por até 25 anos.',
  answer_analysis='O item associa corretamente cada grau ao respectivo prazo máximo. A progressão acompanha a sensibilidade da informação: quanto mais elevado o grau, maior pode ser o período de restrição.' || E'\n\n' || 'Como não houve inversão entre as categorias nem alteração dos números previstos na LAI, a enumeração está correta.',
  exam_trap='É comum a banca manter os três números corretos e apenas trocar o grau ao qual um deles pertence.',
  similar_question_strategy='Memorize os prazos em progressão 5–15–25 e associe-os, nessa ordem, a reservada–secreta–ultrassecreta antes de conferir o enunciado.',
  fixation_tips=jsonb_build_array('Reservada: 5 anos; secreta: 15 anos; ultrassecreta: 25 anos.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='42fdd3d3-f2ed-4215-89ec-4bca5742fa94'::uuid;

-- Questão 8: analytics e julgamento editorial.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Digital → Métricas e decisão editorial',
  concept_explanation='Analytics reúne dados sobre alcance, consumo e interação do público. Esses dados ajudam a diagnosticar distribuição e desempenho, mas não medem sozinhos relevância social, veracidade, qualidade da apuração ou dever editorial.',
  decisive_evidence='A palavra “completamente” torna o item errado: métricas apoiam o julgamento editorial, mas não substituem critérios jornalísticos e interesse público.',
  answer_analysis='Uma pauta pode ter poucos cliques e ainda ser essencial para fiscalização, cidadania ou segurança. De modo inverso, conteúdo sensacionalista pode gerar grande audiência sem possuir maior relevância pública.' || E'\n\n' || 'A decisão editorial deve combinar evidências de audiência com apuração, contexto, missão do veículo, diversidade e responsabilidade social. Ao eliminar todos esses critérios, o item atribui aos dados uma função que eles não possuem.',
  exam_trap='O item transforma uma ferramenta auxiliar de decisão em substituta integral da responsabilidade editorial.',
  similar_question_strategy='Quando a questão usar “substitui”, “dispensa” ou “automaticamente”, separe o que a métrica mede do julgamento qualitativo que continua dependendo de critérios editoriais.',
  fixation_tips=jsonb_build_array('Métricas informam comportamento do público; não determinam sozinhas relevância jornalística.','Audiência e interesse público podem coincidir, mas não são sinônimos.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='1273e1f7-0f49-4200-8267-de9ea781baf3'::uuid;

-- Questão 9: cliques e interesse público.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Digital → Taxa de cliques e relevância pública',
  concept_explanation='Taxa de cliques indica a proporção de visualizações que resultou em clique. Ela ajuda a avaliar chamada, criativo e adequação ao público, mas não verifica qualidade da apuração nem importância social do conteúdo.',
  decisive_evidence='O erro está em considerar automaticamente o maior CTR como prova de maior relevância pública; a métrica mede resposta ao estímulo de clique, não valor jornalístico.',
  answer_analysis='Títulos curiosos, emocionais ou sensacionalistas podem elevar cliques. Já informações de serviço, controle de políticas públicas ou temas complexos podem ter audiência menor e continuar essenciais.' || E'\n\n' || 'Por isso, redações e assessorias podem usar CTR para aperfeiçoar distribuição, mas precisam preservar checagem, proporcionalidade, missão editorial e interesse público. A substituição integral afirmada no item torna-o errado.',
  exam_trap='A banca iguala desempenho de distribuição a relevância social, embora sejam dimensões diferentes.',
  similar_question_strategy='Antes de aceitar uma conclusão baseada em métrica, formule “o que este indicador mede?”. Se a conclusão tratar de qualidade, verdade ou interesse público, será necessário critério adicional.',
  fixation_tips=jsonb_build_array('CTR mede cliques em relação às impressões.','Mais cliques não significam automaticamente maior relevância pública.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='16033c0b-ff34-4335-9a3b-f8cbd72b0a10'::uuid;

-- Questão 10: pedido específico e transparência passiva.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Pedido de acesso à informação',
  concept_explanation='A LAI combina transparência ativa, realizada por divulgação de ofício, e transparência passiva, realizada pelo atendimento de pedidos. As modalidades se complementam e ampliam o acesso do cidadão.',
  decisive_evidence='A presença de “pedido específico de informação feito pelo cidadão” caracteriza provocação do órgão e, portanto, transparência passiva.',
  answer_analysis='O órgão somente fornece a informação depois que o cidadão formula uma demanda determinada. Esse fluxo corresponde à transparência passiva, pois nasce de um requerimento.' || E'\n\n' || 'Isso não elimina o dever de publicar previamente conteúdos de interesse coletivo. A resposta individual complementa a divulgação espontânea quando o dado procurado não está disponível ou não foi localizado.',
  exam_trap='',
  similar_question_strategy='Classifique primeiro a origem do fluxo: publicação antecipada pelo órgão é ativa; atendimento a pedido determinado do cidadão é passiva.',
  fixation_tips=jsonb_build_array('Pedido do cidadão + resposta do órgão = transparência passiva.','Ativa e passiva são modalidades complementares.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='18526ef3-2ef8-442b-8865-be900f12622b'::uuid;

-- Questão 15: divulgação espontânea.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Divulgação de ofício',
  concept_explanation='Divulgação de ofício significa disponibilizar informações públicas por iniciativa da própria administração, sem aguardar solicitação. É a aplicação prática da transparência ativa.',
  decisive_evidence='O advérbio “espontaneamente” e a expressão “independentemente de solicitação” identificam inequivocamente a transparência ativa.',
  answer_analysis='Portais de transparência, editais, relatórios, dados abertos e informações institucionais são publicados antes de um pedido individual para permitir acesso amplo e reduzir barreiras ao controle social.' || E'\n\n' || 'Como o enunciado descreve exatamente esse dever proativo e não confunde a iniciativa com resposta a requerimento, o item está certo.',
  exam_trap='',
  similar_question_strategy='Sublinhe expressões temporais e de iniciativa. “Antes de pedido”, “de ofício” e “espontaneamente” são marcas de transparência ativa.',
  fixation_tips=jsonb_build_array('Transparência ativa antecipa a demanda social e publica de ofício.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='2602278e-e091-45e1-8fde-2e863d1811e8'::uuid;

-- Questão 35: relatórios divulgados espontaneamente.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Lei de Acesso à Informação → Transparência ativa em portais',
  concept_explanation='Relatórios, guias e dados de interesse coletivo publicados em portal institucional constituem transparência ativa quando a disponibilização ocorre por iniciativa da entidade.',
  decisive_evidence='O termo “divulgação espontânea” contradiz diretamente a classificação como passiva: não houve pedido prévio de um cidadão.',
  answer_analysis='A fundação coloca relatórios de fomento e guias à disposição de todos em seu portal. A iniciativa parte da própria instituição e alcança coletivamente interessados e sociedade.' || E'\n\n' || 'Transparência passiva existiria se o material fosse entregue apenas depois de um requerimento. Como o item inverte as modalidades, está errado.',
  exam_trap='A banca apresenta conteúdo público legítimo, mas troca o nome da modalidade de transparência.',
  similar_question_strategy='Ignore por um momento o tipo de documento e observe apenas a iniciativa: publicação espontânea é ativa; fornecimento provocado por pedido é passiva.',
  fixation_tips=jsonb_build_array('Relatório publicado espontaneamente em portal = transparência ativa.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='90f855a5-2af9-45fc-bfdf-3277cfcc90d5'::uuid;

-- Questão 50: prestação de contas e controle social.
UPDATE questions SET
  detailed_topic='Comunicação Organizacional → Comunicação Pública → Prestação de contas e controle social',
  concept_explanation='Prestação de contas não é mera publicação de números. Para viabilizar controle social, gastos, resultados e decisões precisam ser apresentados de forma íntegra, tempestiva, verificável e compreensível.',
  decisive_evidence='Ao tornar gastos, resultados e decisões compreensíveis, a prestação de contas fornece ao cidadão elementos para fiscalizar a atuação pública.',
  answer_analysis='O controle social depende de informação que permita comparar recursos empregados, objetivos assumidos e resultados alcançados. Sem esses dados, a sociedade não consegue avaliar eficiência, legalidade ou cumprimento de políticas.' || E'\n\n' || 'O enunciado descreve corretamente essa função da accountability: transformar a atuação estatal em objeto de escrutínio público. Por isso, o item está certo.',
  exam_trap='',
  similar_question_strategy='Em itens sobre prestação de contas, confira se a informação permite verificar decisão, recurso e resultado; divulgar material incompreensível não produz accountability efetiva.',
  fixation_tips=jsonb_build_array('Prestação de contas útil conecta gasto, decisão e resultado.','Informação compreensível viabiliza controle social.'),
  comparison_headers='{}'::jsonb,comparison_rows='[]'::jsonb,updated_at=now()
WHERE id='f852e773-8547-4ec3-a00f-329d79cce0b5'::uuid;

-- Corrige a acentuação perdida na importação dos itens de Língua Portuguesa
-- da CODEVASF. Construções deliberadamente avaliadas pelas questões, como
-- "vem se tornando", "a minorias" e "mas, também,", são preservadas.
UPDATE questions AS question
SET statement = reviewed.statement,
    updated_at = now()
FROM (VALUES
  (
    'CODEVASF 2024 - Item 1',
    '[CEBRASPE - CODEVASF 2024 - Item 1] Conforme as ideias expostas no texto, o racismo institucional difere das outras formas de racismo por ter impacto duradouro e contribuir significativamente para a manutenção de desigualdades com base na raça.'
  ),
  (
    'CODEVASF 2024 - Item 2',
    '[CEBRASPE - CODEVASF 2024 - Item 2] Conclui-se do texto que o conhecimento sobre o racismo institucional é relevante para a promoção da igualdade racial no ambiente laboral.'
  ),
  (
    'CODEVASF 2024 - Item 3',
    '[CEBRASPE - CODEVASF 2024 - Item 3] O texto trata o racismo institucional como um tipo de cultura existente dentro de instituições públicas e privadas.'
  ),
  (
    'CODEVASF 2024 - Item 4',
    '[CEBRASPE - CODEVASF 2024 - Item 4] Depreende-se da leitura do texto que a distribuição desigual de recursos dentro de uma instituição consiste em um tipo de racismo institucional.'
  ),
  (
    'CODEVASF 2024 - Item 5',
    '[CEBRASPE - CODEVASF 2024 - Item 5] Infere-se do texto que o racismo institucional se manifesta de forma velada dentro das organizações.'
  ),
  (
    'CODEVASF 2024 - Item 6',
    '[CEBRASPE - CODEVASF 2024 - Item 6] De acordo com o primeiro parágrafo do texto, a população brasileira ainda não é capaz de reconhecer o racismo institucional.'
  ),
  (
    'CODEVASF 2024 - Item 7',
    '[CEBRASPE - CODEVASF 2024 - Item 7] No último período do texto, a preposição "para" introduz uma oração que expressa finalidade.'
  ),
  (
    'CODEVASF 2024 - Item 8',
    '[CEBRASPE - CODEVASF 2024 - Item 8] No quarto parágrafo, o sujeito da oração "É um problema complexo" (terceiro período) corresponde a "a discriminação racial" (segundo período).'
  ),
  (
    'CODEVASF 2024 - Item 9',
    '[CEBRASPE - CODEVASF 2024 - Item 9] Estariam mantidos os sentidos e a correção gramatical do texto caso se substituísse o segmento "estão se tornando" (primeiro período do primeiro parágrafo) por "vem se tornando".'
  ),
  (
    'CODEVASF 2024 - Item 10',
    '[CEBRASPE - CODEVASF 2024 - Item 10] Estariam mantidas a correção gramatical e a coerência das ideias do texto caso os dois primeiros períodos do segundo parágrafo fossem unidos por meio da substituição do ponto empregado após "isoladas" pelo sinal de dois-pontos, feitos os devidos ajustes de letra inicial maiúscula e minúscula no período.'
  ),
  (
    'CODEVASF 2024 - Item 11',
    '[CEBRASPE - CODEVASF 2024 - Item 11] Mantendo-se as ideias e a correção gramatical do texto, o terceiro período do segundo parágrafo poderia ser reescrito da seguinte forma: Isso significa que o racismo institucional não se trata apenas de como as pessoas se comportam, mas, também, de como as estruturas e as normas podem proteger ou prejudicar grupos raciais específicos.'
  ),
  (
    'CODEVASF 2024 - Item 12',
    '[CEBRASPE - CODEVASF 2024 - Item 12] Em "a minorias raciais" (segundo período do terceiro parágrafo), é facultativo o emprego do sinal indicativo de crase no vocábulo "a".'
  ),
  (
    'CODEVASF 2024 - Item 13',
    '[CEBRASPE - CODEVASF 2024 - Item 13] A substituição do termo "limitando" (segundo período do terceiro parágrafo) pela expressão "porque limita" manteria a correção gramatical e a coerência das ideias do texto.'
  ),
  (
    'CODEVASF 2024 - Item 14',
    '[CEBRASPE - CODEVASF 2024 - Item 14] No texto, o sentido do verbo "perpetuar" (segundo período do quarto parágrafo) é o mesmo de potencializar.'
  )
) AS reviewed(reference, statement)
WHERE question.metadata->>'reference' = reviewed.reference
  -- A referência não é única: o banco também contém itens reformulados com a
  -- mesma referência. Corrige somente a afirmação original identificada pelo
  -- cabeçalho completo, sem sobrescrever as questões reformuladas.
  AND question.statement LIKE '[CEBRASPE - ' || reviewed.reference || ']%'
  AND question.statement IS DISTINCT FROM reviewed.statement;

-- O mesmo arquivo legado perdeu diacríticos em itens de informática e
-- jornalismo. As substituições abaixo ficam restritas às referências revisadas.
WITH RECURSIVE replacements(step, pattern, replacement) AS (VALUES
  (1,  'Internet, e uma area', 'Internet, é uma área'),
  (2,  'ou seja, e uma plataforma', 'ou seja, é uma plataforma'),
  (3,  'adwares e a publicidade', 'adwares é a publicidade'),
  (4,  'jornalistico e a primeira', 'jornalístico é a primeira'),
  (5,  'paragrafo e o mais', 'parágrafo é o mais'),
  (6,  'jornalistica e protegida', 'jornalística é protegida'),
  (7,  'massa e guiada', 'massa é guiada'),
  (8,  'lhes e repassado', 'lhes é repassado'),
  (9,  'pois e o texto', 'pois é o texto'),
  (10, 'Editorial e um', 'Editorial é um'),
  (11, 'em que e apresentado', 'em que é apresentado'),
  (12, 'noticia e expor', 'notícia é expor'),
  (13, 'pauta e um material', 'pauta é um material'),
  (14, 'pagina e o suporte', 'página é o suporte'),
  (15, 'branco e necessaria', 'branco é necessária'),
  (16, 'noticia e tanto mais', 'notícia é tanto mais'),
  (17, 'real e um fator', 'real é um fator'),
  (18, 'atenda a demanda', 'atenda à demanda'),
  (19, 'cabe melhor as fontes', 'cabe melhor às fontes'),
  (20, 'vincula-se a tecnica', 'vincula-se à técnica'),
  (21, 'devido a reinterpretacao', 'devido à reinterpretação'),
  (22, 'conteudo as preferencias', 'conteúdo às preferências'),
  (23, '\mcontrario\M', 'contrário'),
  (24, '\mproprietarios\M', 'proprietários'),
  (25, '\mcomunicacao\M', 'comunicação'),
  (26, '\munica\M', 'única'),
  (27, '\morganizacao\M', 'organização'),
  (28, '\minformacoes\M', 'informações'),
  (29, '\maplicacoes\M', 'aplicações'),
  (30, '\mservicos\M', 'serviços'),
  (31, '\mrestauracao\M', 'restauração'),
  (32, '\mtransferencia\M', 'transferência'),
  (33, '\mnao\M', 'não'),
  (34, '\minformacao\M', 'informação'),
  (35, '\mvirus\M', 'vírus'),
  (36, '\mha\M', 'há'),
  (37, '\mlocalizacao\M', 'localização'),
  (38, '\mhistorico\M', 'histórico'),
  (39, '\mnavegacao\M', 'navegação'),
  (40, '\manuncios\M', 'anúncios'),
  (41, '\mespecificos\M', 'específicos'),
  (42, '\musuario\M', 'usuário'),
  (43, '\mtambem\M', 'também'),
  (44, '\macoes\M', 'ações'),
  (45, '\mliberacao\M', 'liberação'),
  (46, '\mcao\M', 'cão'),
  (47, '\mnoticia\M', 'notícia'),
  (48, '\mpertenca\M', 'pertença'),
  (49, '\mjornalistico\M', 'jornalístico'),
  (50, '\mparagrafo\M', 'parágrafo'),
  (51, '\mmateria\M', 'matéria'),
  (52, '\matuacao\M', 'atuação'),
  (53, '\mjornalistica\M', 'jornalística'),
  (54, '\matencao\M', 'atenção'),
  (55, '\mdescricao\M', 'descrição'),
  (56, '\marticulacao\M', 'articulação'),
  (57, '\mlegitimacao\M', 'legitimação'),
  (58, '\mreporter\M', 'repórter'),
  (59, '\mfuncao\M', 'função'),
  (60, '\mprincipio\M', 'princípio'),
  (61, '\mexpressao\M', 'expressão'),
  (62, '\mpopulacao\M', 'população'),
  (63, '\mselecao\M', 'seleção'),
  (64, '\mjornalisticas\M', 'jornalísticas'),
  (65, '\mveiculos\M', 'veículos'),
  (66, '\mconteudo\M', 'conteúdo'),
  (67, '\mpersonalizacao\M', 'personalização'),
  (68, '\mcaracteristica\M', 'característica'),
  (69, '\mmidia\M', 'mídia'),
  (70, '\mpublicacao\M', 'publicação'),
  (71, '\mtecnica\M', 'técnica'),
  (72, '\manalise\M', 'análise'),
  (73, '\mconstruida\M', 'construída'),
  (74, '\mminimo\M', 'mínimo'),
  (75, '\mdistorcoes\M', 'distorções'),
  (76, '\mpublicacoes\M', 'publicações'),
  (77, '\mfuncionarios\M', 'funcionários'),
  (78, '\mpiramide\M', 'pirâmide'),
  (79, '\mpublico\M', 'público'),
  (80, '\medicao\M', 'edição'),
  (81, '\mlancamentos\M', 'lançamentos'),
  (82, '\mperiodicos\M', 'periódicos'),
  (83, '\mpagina\M', 'página'),
  (84, '\mdistribuicao\M', 'distribuição'),
  (85, '\mcompoem\M', 'compõem'),
  (86, '\mdiagramacao\M', 'diagramação'),
  (87, '\msera\M', 'será'),
  (88, '\mconsideracao\M', 'consideração'),
  (89, '\mcombinacao\M', 'combinação'),
  (90, '\mespacos\M', 'espaços'),
  (91, '\mnecessaria\M', 'necessária'),
  (92, '\mgrafico\M', 'gráfico'),
  (93, '\mdistancia\M', 'distância'),
  (94, '\mcabeca\M', 'cabeça'),
  (95, '\mimportancia\M', 'importância'),
  (96, '\mcriterios\M', 'critérios'),
  (97, '\mutilizacao\M', 'utilização'),
  (98, '\mexperiencia\M', 'experiência'),
  (99, '\mresolucao\M', 'resolução'),
  (100, '\msemantica\M', 'semântica'),
  (101, '\matualizacao\M', 'atualização'),
  (102, '\mprecisao\M', 'precisão'),
  (103, '\mreinterpretacao\M', 'reinterpretação'),
  (104, '\musuarios\M', 'usuários'),
  (105, '\manaliticas\M', 'analíticas'),
  (106, '\madaptacao\M', 'adaptação'),
  (107, '\mpreferencias\M', 'preferências'),
  (108, '\mindependencia\M', 'independência'),
  (109, '\mproducao\M', 'produção'),
  (110, '\mconteudos\M', 'conteúdos'),
  (111, '\mcriacao\M', 'criação'),
  (112, '\mcomentario\M', 'comentário'),
  (113, '\mforuns\M', 'fóruns'),
  (114, '\mdiscussao\M', 'discussão'),
  (115, '\mtransformacoes\M', 'transformações'),
  (116, 'essencialmente publica', 'essencialmente pública'),
  (117, '\msao\M', 'são'),
  (118, '\marea\M', 'área'),
  (119, '\mmedio\M', 'médio'),
  (120, '\mveiculo\M', 'veículo'),
  (121, '\multimos\M', 'últimos'),
  (122, '\msequencia\M', 'sequência'),
  (123, '\mrelevancia\M', 'relevância'),
  (124, '\mdistribuido\M', 'distribuído'),
  (125, '\mnoticias\M', 'notícias'),
  (126, '\minstituicao\M', 'instituição'),
  (127, '\mabrangencia\M', 'abrangência'),
  (128, '\morganizacoes\M', 'organizações'),
  (129, '\mesquadrinhavel\M', 'esquadrinhável')
), targets AS (
  SELECT id, statement, 0 AS step
  FROM questions
  WHERE metadata->>'reference' IN (
    'CODEVASF 2024 - Item 34', 'CODEVASF 2024 - Item 35',
    'CODEVASF 2024 - Item 39', 'CODEVASF 2024 - Item 40',
    'CODEVASF 2024 - Item 59', 'CODEVASF 2024 - Item 60',
    'CODEVASF 2024 - Item 61', 'CODEVASF 2024 - Item 62',
    'CODEVASF 2024 - Item 65', 'CODEVASF 2024 - Item 66',
    'CODEVASF 2024 - Item 67', 'CODEVASF 2024 - Item 68',
    'CODEVASF 2024 - Item 69', 'CODEVASF 2024 - Item 70',
    'CODEVASF 2024 - Item 72', 'CODEVASF 2024 - Item 76',
    'CODEVASF 2024 - Item 81', 'CODEVASF 2024 - Item 83',
    'CODEVASF 2024 - Item 86', 'CODEVASF 2024 - Item 88',
    'CODEVASF 2024 - Item 90', 'CODEVASF 2024 - Item 93',
    'CODEVASF 2024 - Item 95', 'CODEVASF 2024 - Item 100',
    'CODEVASF 2024 - Item 101', 'CODEVASF 2024 - Item 102',
    'CODEVASF 2024 - Item 105', 'CODEVASF 2024 - Item 106',
    'CODEVASF 2024 - Item 108', 'CODEVASF 2024 - Item 109',
    'CODEVASF 2024 - Item 111', 'CODEVASF 2024 - Item 113',
    'CODEVASF 2024 - Item 116', 'CODEVASF 2024 - Item 117',
    'CODEVASF 2024 - Item 119', 'CODEVASF 2024 - Item 120'
  )
    -- Assim como nos itens de Língua Portuguesa, as referências também são
    -- compartilhadas por questões reformuladas que não devem ser alteradas.
    AND statement LIKE '[CEBRASPE - ' || (metadata->>'reference') || ']%'
), corrected(id, statement, step) AS (
  SELECT id, statement, step FROM targets
  UNION ALL
  SELECT corrected.id,
         regexp_replace(corrected.statement, replacements.pattern, replacements.replacement, 'g'),
         replacements.step
  FROM corrected
  JOIN replacements ON replacements.step = corrected.step + 1
)
UPDATE questions AS question
SET statement = corrected.statement,
    updated_at = now()
FROM corrected
WHERE corrected.step = (SELECT MAX(step) FROM replacements)
  AND question.id = corrected.id
  AND question.statement IS DISTINCT FROM corrected.statement;

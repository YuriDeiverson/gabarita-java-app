-- Substitui aulas-modelo por conteúdo factual. A primeira etapa reaproveita
-- somente guias de questões editorialmente completos e com correspondência
-- inequívoca de assunto. A segunda mantém aulas autorais para o núcleo de
-- Engenharia de Software, inclusive assuntos sem questão associada, como DDD.

CREATE TEMP TABLE study_material_question_guides ON COMMIT DROP AS
SELECT DISTINCT ON (gabarita_subject_normalized(term), q.id)
  gabarita_subject_normalized(term) AS term_key,
  q.id,
  q.concept_explanation,
  q.decisive_evidence,
  q.answer_analysis,
  q.exam_trap,
  q.similar_question_strategy,
  q.statement
FROM questions q
LEFT JOIN topics topic ON topic.id = q.topic_id
CROSS JOIN LATERAL regexp_split_to_table(
  concat_ws(' → ', topic.name, q.detailed_topic),
  '[→>]'
) term
WHERE q.status IN ('ACTIVE', 'ANNULLED')
  AND length(btrim(q.concept_explanation)) >= 120
  AND length(btrim(q.answer_analysis)) >= 120
  AND length(gabarita_subject_normalized(term)) >= 5
ORDER BY gabarita_subject_normalized(term), q.id;

CREATE INDEX study_material_question_guides_term
  ON study_material_question_guides(term_key);

CREATE TEMP TABLE study_material_subject_terms ON COMMIT DROP AS
SELECT DISTINCT
  shared.id AS shared_id,
  gabarita_subject_normalized(term) AS term_key
FROM shared_study_subjects shared
CROSS JOIN LATERAL regexp_split_to_table(
  gabarita_subject_display_title(shared.title),
  '[:;,]'
) term
WHERE length(gabarita_subject_normalized(term)) >= 5
  AND (
    shared.base_content LIKE '%integra a disciplina%'
    OR shared.base_content LIKE '%deve ser estudado como uma ferramenta%'
  );

CREATE INDEX study_material_subject_terms_key
  ON study_material_subject_terms(term_key);

WITH candidates AS MATERIALIZED (
  SELECT DISTINCT ON (subject_term.shared_id, guide.id)
    subject_term.shared_id,
    guide.*
  FROM study_material_subject_terms subject_term
  JOIN study_material_question_guides guide USING (term_key)
  ORDER BY subject_term.shared_id, guide.id
), ranked AS (
  SELECT
    candidate.*,
    row_number() OVER (
      PARTITION BY candidate.shared_id
      ORDER BY length(candidate.concept_explanation) DESC, candidate.id
    ) AS position
  FROM candidates candidate
), selected AS (
  SELECT
    shared_id,
    max(concept_explanation) FILTER (WHERE position = 1) AS concept_1,
    max(concept_explanation) FILTER (WHERE position = 2) AS concept_2,
    max(decisive_evidence) FILTER (WHERE position = 1) AS evidence,
    max(answer_analysis) FILTER (WHERE position = 1) AS application,
    max(exam_trap) FILTER (WHERE position = 1) AS trap,
    max(similar_question_strategy) FILTER (WHERE position = 1) AS strategy,
    max(statement) FILTER (WHERE position = 1) AS question_1,
    max(answer_analysis) FILTER (WHERE position = 2) AS answer_2,
    max(statement) FILTER (WHERE position = 2) AS question_2,
    max(answer_analysis) FILTER (WHERE position = 3) AS answer_3,
    max(statement) FILTER (WHERE position = 3) AS question_3
  FROM ranked
  WHERE position <= 3
  GROUP BY shared_id
), prepared AS (
  SELECT
    shared.id,
    '<h3>Conceito e fundamentos</h3><p>' || gabarita_html_escape(selected.concept_1) || '</p>' ||
    CASE WHEN btrim(COALESCE(selected.concept_2, '')) <> ''
      THEN '<p>' || gabarita_html_escape(selected.concept_2) || '</p>' ELSE '' END ||
    CASE WHEN btrim(COALESCE(selected.evidence, '')) <> ''
      THEN '<h3>O que decide a questão</h3><p>' || gabarita_html_escape(selected.evidence) || '</p>' ELSE '' END ||
    '<h3>Aplicação comentada</h3><p>' || gabarita_html_escape(selected.application) || '</p>' ||
    CASE WHEN btrim(COALESCE(selected.trap, '')) <> ''
      THEN '<h3>Armadilha recorrente</h3><p>' || gabarita_html_escape(selected.trap) || '</p>' ELSE '' END AS content,
    to_jsonb(array_remove(ARRAY[
      selected.concept_1,
      COALESCE(NULLIF(btrim(selected.evidence), ''), NULLIF(btrim(selected.strategy), '')),
      COALESCE(NULLIF(btrim(selected.trap), ''), NULLIF(btrim(selected.strategy), ''))
    ]::text[], NULL)) AS takeaways,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'fundamentos-especificos',
        'title', 'Fundamentos do assunto',
        'content', '<p>' || gabarita_html_escape(selected.concept_1) || '</p>' ||
          CASE WHEN btrim(COALESCE(selected.concept_2, '')) <> ''
            THEN '<p>' || gabarita_html_escape(selected.concept_2) || '</p>' ELSE '' END,
        'keyTakeaways', CASE WHEN btrim(COALESCE(selected.evidence, '')) <> ''
          THEN jsonb_build_array(selected.evidence) ELSE '[]'::jsonb END
      ),
      jsonb_build_object(
        'id', 'exemplo-aplicado',
        'title', 'Aplicação em uma questão real',
        'content', '<p>' || gabarita_html_escape(selected.application) || '</p>' ||
          CASE WHEN btrim(COALESCE(selected.strategy, '')) <> ''
            THEN '<p><strong>Como resolver variações:</strong> ' || gabarita_html_escape(selected.strategy) || '</p>' ELSE '' END,
        'keyTakeaways', CASE WHEN btrim(COALESCE(selected.trap, '')) <> ''
          THEN jsonb_build_array(selected.trap) ELSE '[]'::jsonb END,
        'miniQuestions',
          jsonb_build_array(jsonb_build_object('prompt', selected.question_1, 'answer', selected.application))
          || CASE WHEN selected.question_2 IS NOT NULL
            THEN jsonb_build_array(jsonb_build_object('prompt', selected.question_2, 'answer', selected.answer_2))
            ELSE '[]'::jsonb END
          || CASE WHEN selected.question_3 IS NOT NULL
            THEN jsonb_build_array(jsonb_build_object('prompt', selected.question_3, 'answer', selected.answer_3))
            ELSE '[]'::jsonb END
      )
    ) AS blocks
  FROM selected
  JOIN shared_study_subjects shared ON shared.id = selected.shared_id
)
UPDATE shared_study_subjects shared
SET study_objective = 'Explicar ' || shared.title || ', reconhecer seus elementos e aplicar o conceito em situações concretas de prova.',
    review_summary = prepared.takeaways,
    base_content = prepared.content,
    key_takeaways = prepared.takeaways,
    content_blocks = prepared.blocks,
    updated_at = now()
FROM prepared
WHERE shared.id = prepared.id;

-- Conteúdo autoral de Engenharia de Software. Cada linha contém conceito,
-- funcionamento, exemplo e limite próprios; não há texto-modelo por área.
WITH authored(
  title_key, objective, concept, mechanics, application, caution,
  takeaway_1, takeaway_2, takeaway_3,
  prompt_1, answer_1, prompt_2, answer_2, prompt_3, answer_3
) AS (
  VALUES
  (
    'ddd',
    'Distinguir o desenho estratégico e o desenho tático do DDD, modelar limites de consistência e reconhecer quando a abordagem é adequada.',
    'Domain-Driven Design (DDD) é uma abordagem para desenvolver software em domínios de negócio complexos. O modelo do software nasce da colaboração contínua entre especialistas do domínio e equipe técnica. Essa colaboração produz uma linguagem ubíqua: os mesmos termos devem ter significado explícito no código, nas conversas e na documentação.',
    'No desenho estratégico, o domínio é dividido em subdomínios — principal, de apoio e genérico — e em contextos delimitados. Cada contexto possui seu próprio modelo e vocabulário; um mapa de contextos registra como eles se relacionam. No desenho tático aparecem entidades, objetos-valor, agregados, raízes de agregado, eventos de domínio, serviços de domínio, fábricas e repositórios. O agregado delimita uma fronteira de consistência: alterações internas passam pela raiz e suas invariantes devem permanecer válidas.',
    'Em uma plataforma de concursos, Inscrições e Pagamentos podem ser contextos distintos. Em Inscrições, Candidato é entidade, CPF pode ser objeto-valor e Inscrição pode ser a raiz do agregado. Quando o pagamento é confirmado, Pagamentos publica um evento; Inscrições reage sem incorporar ao seu modelo toda a lógica financeira. A separação evita que a palavra “situação” tenha significados conflitantes nos dois contextos.',
    'DDD não é sinônimo de arquitetura em camadas, microsserviços, ORM ou simples organização de pastas. Também não exige aplicar todos os padrões táticos. Em sistemas CRUD de baixa complexidade, o custo de modelagem pode superar o benefício. Em prova, desconfie de alternativas que tratam entidade como qualquer classe com atributos ou que permitem alterar um agregado ignorando sua raiz.',
    'Linguagem ubíqua conecta conhecimento do negócio e implementação.',
    'Contexto delimitado define onde um modelo e seus termos são válidos.',
    'Agregado é fronteira de consistência; a raiz controla alterações externas.',
    'O que diferencia um contexto delimitado de um módulo comum?',
    'O contexto delimitado estabelece uma fronteira semântica: dentro dele há um modelo coerente e um vocabulário próprio. Um módulo apenas organiza código e não resolve, por si só, ambiguidades entre modelos.',
    'Qual é a função da raiz de agregado?',
    'Ela é o ponto de entrada para operações externas sobre o agregado e protege suas invariantes, coordenando mudanças nos objetos internos.',
    'DDD deve ser aplicado integralmente em qualquer sistema?',
    'Não. Ele é mais valioso quando regras, linguagem e processos de negócio são complexos. Soluções simples podem usar apenas os padrões que gerem benefício ou dispensar DDD.'
  ),
  (
    'solid',
    'Explicar os cinco princípios SOLID e diagnosticar responsabilidades, dependências e extensibilidade em exemplos de código.',
    'SOLID reúne cinco princípios de projeto orientado a objetos: responsabilidade única, aberto-fechado, substituição de Liskov, segregação de interfaces e inversão de dependência. O objetivo é reduzir acoplamento, tornar mudanças localizadas e manter contratos compreensíveis.',
    'SRP separa razões diferentes para uma classe mudar. OCP favorece extensão sem editar comportamento estável. LSP exige que um subtipo preserve as expectativas do tipo-base. ISP evita obrigar clientes a depender de operações que não usam. DIP faz políticas de alto nível dependerem de abstrações, não de detalhes concretos. Injeção de dependência é uma técnica possível para DIP, mas não é o princípio inteiro.',
    'Um serviço de fechamento de pedido não precisa conhecer diretamente uma classe de e-mail. Ele depende de uma interface Notificador, permitindo e-mail, SMS ou um dublê de teste. Se uma implementação do contrato lança exceção para uma operação que o tipo-base promete suportar, há violação de LSP.',
    'SOLID não significa criar uma interface para cada classe nem fragmentar o sistema indefinidamente. Abstrações sem variação real aumentam complexidade. Em prova, diferencie “ter uma única tarefa” de “ter uma única razão de mudança” no SRP.',
    'SRP trata de razão de mudança, não de quantidade de métodos.',
    'LSP preserva o contrato observável do tipo-base.',
    'DIP orienta dependências para abstrações estáveis.',
    'Qual princípio é violado quando um subtipo enfraquece garantias do tipo-base?',
    'O princípio da substituição de Liskov, porque o subtipo deixa de poder substituir o tipo-base sem surpreender o cliente.',
    'Injeção de dependência e inversão de dependência são sinônimos?',
    'Não. Injeção é uma técnica de fornecimento de dependências; DIP é o princípio arquitetural de fazer módulos dependerem de abstrações.',
    'SRP obriga uma classe a ter apenas um método?',
    'Não. Ela pode ter vários métodos coerentes com uma única responsabilidade e uma única razão de mudança.'
  ),
  (
    'uml',
    'Selecionar o diagrama UML adequado, interpretar seus elementos e distinguir estrutura de comportamento.',
    'UML é uma linguagem padronizada de modelagem visual. Ela não é metodologia de desenvolvimento nem gera, por si só, um projeto correto. Seus diagramas oferecem visões complementares da estrutura e do comportamento de um sistema.',
    'Diagramas de classes, componentes, objetos, implantação e pacotes enfatizam estrutura. Casos de uso, atividades e máquinas de estados enfatizam comportamento; sequência e comunicação detalham interações. Em sequência, o eixo vertical representa a passagem do tempo e as linhas de vida representam participantes. Em classes, associação, agregação, composição, generalização e dependência expressam relações diferentes.',
    'Para mostrar a ordem de chamadas entre aplicativo, API e banco durante um login, use sequência. Para mostrar onde API e banco são instalados, use implantação. Para representar estados e transições de uma inscrição — criada, paga, deferida — use máquina de estados.',
    'Um diagrama é uma abstração seletiva, não uma cópia completa do código. Agregação e composição não são sinônimos: na composição, a parte tem vínculo forte de ciclo de vida com o todo.',
    'UML oferece múltiplas visões complementares.',
    'Sequência modela mensagens ordenadas no tempo.',
    'Composição expressa relação todo-parte mais forte que agregação.',
    'Qual diagrama mostra a ordem temporal de mensagens?',
    'O diagrama de sequência.',
    'Qual a diferença essencial entre composição e agregação?',
    'Na composição, a parte pertence fortemente ao todo e seu ciclo de vida costuma depender dele; na agregação, a parte pode existir separadamente.',
    'UML é um processo de desenvolvimento?',
    'Não. É uma linguagem de modelagem que pode ser usada em processos diferentes.'
  ),
  (
    'arquitetura hexagonal',
    'Explicar portas e adaptadores e identificar a direção correta das dependências.',
    'Arquitetura Hexagonal, ou Ports and Adapters, isola a lógica da aplicação de mecanismos externos como banco, interface web, mensageria e APIs. O núcleo expõe ou consome portas; adaptadores traduzem tecnologias concretas para esses contratos.',
    'Portas de entrada descrevem casos de uso oferecidos pela aplicação. Portas de saída descrevem recursos de que o núcleo necessita. Um controlador HTTP é adaptador de entrada; uma implementação PostgreSQL de um repositório é adaptador de saída. As dependências de código apontam dos adaptadores para contratos definidos junto ao núcleo.',
    'O caso de uso CriarInscrição recebe um comando por uma porta de entrada e usa a porta Inscricoes para persistir. Em teste, a porta pode receber uma implementação em memória; em produção, um adaptador JDBC. A regra de validação não muda quando a tecnologia muda.',
    'Hexagonal não determina seis lados, não proíbe frameworks e não elimina integração. Seu benefício desaparece se tipos do framework e consultas específicas vazarem para a regra de negócio.',
    'O núcleo não deve depender de detalhes de infraestrutura.',
    'Portas são contratos; adaptadores fazem a tradução tecnológica.',
    'Testabilidade é consequência do isolamento das dependências.',
    'Um controlador HTTP é porta ou adaptador?',
    'É adaptador de entrada: traduz HTTP para uma chamada à porta da aplicação.',
    'Para onde devem apontar as dependências?',
    'Dos detalhes externos para os contratos do núcleo, preservando a independência da regra de negócio.',
    'Arquitetura hexagonal exige exatamente seis componentes?',
    'Não. O hexágono é uma metáfora gráfica para múltiplos pontos de interação.'
  ),
  (
    'design patterns',
    'Reconhecer intenção, estrutura e consequências dos principais padrões de projeto.',
    'Padrões de projeto são soluções nomeadas e reutilizáveis para problemas recorrentes de design em determinado contexto. Eles registram intenção, participantes, colaboração e consequências; não são trechos de código prontos nem garantem boa arquitetura automaticamente.',
    'Padrões criacionais tratam da criação de objetos, como Factory Method, Abstract Factory, Builder e Singleton. Estruturais organizam composição, como Adapter, Decorator, Facade e Composite. Comportamentais distribuem responsabilidades e comunicação, como Strategy, Observer, Command e Template Method.',
    'Se o algoritmo de cálculo de desconto varia, Strategy permite selecionar implementações com o mesmo contrato. Se objetos precisam reagir a uma mudança, Observer estabelece assinaturas e notificações. Adapter converte uma interface incompatível; Decorator acrescenta responsabilidades mantendo o contrato.',
    'Padrões têm custos. Observer pode ocultar o fluxo; Singleton introduz estado global; camadas excessivas dificultam leitura. A banca costuma trocar a intenção de Adapter com Facade ou Strategy com State.',
    'O padrão é escolhido pela intenção e pelo contexto.',
    'Adapter compatibiliza interfaces; Decorator acrescenta comportamento.',
    'Strategy encapsula algoritmos intercambiáveis.',
    'Qual padrão representa algoritmos intercambiáveis?',
    'Strategy.',
    'Facade e Adapter têm a mesma intenção?',
    'Não. Facade simplifica o acesso a um subsistema; Adapter torna interfaces incompatíveis compatíveis.',
    'Singleton é sempre recomendável?',
    'Não. O estado global e o acoplamento podem prejudicar testes e evolução.'
  ),
  (
    'engenharia de requisitos',
    'Distinguir tipos e níveis de requisito e compreender elicitação, especificação, validação e gerenciamento.',
    'Engenharia de Requisitos identifica, analisa, documenta, valida e gerencia necessidades e restrições de um sistema. Requisitos funcionais descrevem serviços ou comportamentos; não funcionais estabelecem qualidades e restrições, como desempenho, segurança e disponibilidade.',
    'Elicitação obtém informação de partes interessadas por entrevistas, observação, workshops, protótipos e outras técnicas. Análise negocia conflitos e modela o problema. Especificação registra requisitos de forma verificável. Validação confirma se representam a necessidade correta. Gerenciamento mantém rastreabilidade, versões e impacto das mudanças.',
    '“O sistema deve emitir comprovante” é funcional. “95% das respostas devem ocorrer em até dois segundos” é requisito de desempenho mensurável. Uma matriz de rastreabilidade relaciona necessidade, requisito, implementação e teste.',
    'Requisito não funcional não significa opcional. Termos vagos como “rápido” ou “amigável” dificultam verificação. Verificação pergunta se o produto foi construído conforme a especificação; validação pergunta se é o produto certo.',
    'Requisitos não funcionais também podem ser obrigatórios e testáveis.',
    'Validação trata da adequação à necessidade real.',
    'Rastreabilidade apoia análise de impacto.',
    'Qual a diferença entre requisito funcional e não funcional?',
    'O funcional descreve serviço ou comportamento; o não funcional descreve qualidade, restrição ou condição sobre o sistema/processo.',
    'Para que serve rastreabilidade?',
    'Para relacionar origens, requisitos, artefatos e testes, permitindo verificar cobertura e impacto de mudanças.',
    '“O sistema deve ser rápido” é um bom requisito?',
    'Não, porque não define medida verificável; deve informar cenário, métrica e limite.'
  ),
  (
    'ciclo de vida',
    'Relacionar fases do ciclo de vida de software e distinguir ciclo de vida de modelo de processo.',
    'O ciclo de vida de software cobre a evolução do produto desde a concepção até operação, manutenção e retirada. Atividades comuns incluem planejamento, requisitos, projeto, implementação, testes, implantação, operação e evolução.',
    'As atividades não precisam formar uma sequência rígida. Modelos de processo organizam quando e como elas ocorrem. Cascata enfatiza fases sequenciais; iterativo refina o produto em ciclos; incremental entrega partes utilizáveis; métodos ágeis combinam ciclos curtos, feedback e adaptação.',
    'Um produto pode começar com uma versão mínima, receber incrementos quinzenais e manter testes e monitoramento contínuos. Mesmo após implantação, correções, adaptação de ambiente e evolução funcional continuam fazendo parte do ciclo.',
    'Ciclo de vida não termina na entrega e não é sinônimo de cascata. Manutenção costuma consumir parte relevante do esforço total.',
    'Operação, manutenção e retirada integram o ciclo.',
    'Iteração refina; incremento amplia uma versão utilizável.',
    'Modelo de processo organiza atividades do ciclo de vida.',
    'O ciclo de vida termina na implantação?',
    'Não. Inclui operação, manutenção, evolução e eventual retirada.',
    'Iterativo e incremental são sinônimos?',
    'Não. Iteração revisita e refina; incremento adiciona uma parcela funcional ao produto.',
    'Cascata é o próprio ciclo de vida?',
    'Não. É um modelo para organizar atividades do ciclo de vida.'
  ),
  (
    'qualidade',
    'Distinguir qualidade de produto e de processo e aplicar atributos e técnicas de garantia da qualidade.',
    'Qualidade de software é a capacidade de satisfazer necessidades explícitas e implícitas sob condições definidas. Ela inclui conformidade funcional e atributos como confiabilidade, segurança, desempenho, usabilidade, manutenibilidade, compatibilidade e portabilidade.',
    'Garantia da qualidade atua preventivamente sobre processos, padrões e auditorias; controle da qualidade avalia produtos por revisões, testes e medições. Verificação compara artefatos com especificações; validação verifica se o resultado atende ao uso pretendido. Métricas precisam ter objetivo e interpretação definidos.',
    'Cobertura alta de testes pode indicar partes executadas, mas não prova ausência de defeitos. Uma revisão pode encontrar ambiguidade antes do código. Monitoramento em produção revela qualidade percebida em carga e ambiente reais.',
    'Qualidade não equivale apenas a “não ter bugs”. Atributos podem entrar em tensão: segurança e usabilidade, desempenho e manutenibilidade. A decisão precisa considerar contexto e risco.',
    'Qualidade é multidimensional e depende do contexto.',
    'Garantia previne no processo; controle avalia o produto.',
    'Uma métrica isolada não comprova qualidade total.',
    'Qual a diferença entre garantia e controle da qualidade?',
    'Garantia atua no processo para prevenir problemas; controle examina o produto para detectar desvios.',
    'Cobertura de testes prova ausência de defeitos?',
    'Não. Ela mede execução de partes do código, não a correção de todas as asserções e cenários.',
    'Qualidade significa apenas atender requisitos funcionais?',
    'Não. Também inclui atributos de qualidade e necessidades implícitas relevantes.'
  ),
  (
    'cmmi',
    'Compreender a finalidade do CMMI, seus níveis de maturidade e a diferença entre capacidade e maturidade.',
    'CMMI é um modelo de referência para melhorar processos organizacionais. Ele reúne áreas de prática e orientações para institucionalizar formas de trabalho previsíveis e aprimoráveis; não é uma metodologia de desenvolvimento nem uma certificação de produto.',
    'Na representação por maturidade, os níveis clássicos são 1 Inicial, 2 Gerenciado, 3 Definido, 4 Gerenciado Quantitativamente e 5 Em Otimização. A progressão vai de práticas imprevisíveis para processos gerenciados, padronizados, medidos estatisticamente e melhorados continuamente.',
    'Uma organização no nível 2 planeja e acompanha projetos, mas seus processos ainda podem variar entre equipes. No nível 3, processos-padrão organizacionais são adaptados de modo controlado para cada projeto.',
    'Nível de maturidade caracteriza o conjunto organizacional; capacidade pode avaliar evolução de uma área de prática. Estar em nível alto não significa produto sem defeitos.',
    'CMMI orienta melhoria e institucionalização de processos.',
    'Nível 3 introduz processos organizacionais definidos.',
    'Nível alto não garante qualidade absoluta do produto.',
    'O que diferencia os níveis 2 e 3?',
    'No nível 2, processos são gerenciados por projeto; no 3, há processos-padrão organizacionais definidos e adaptados de forma controlada.',
    'CMMI é metodologia ágil ou prescritiva de desenvolvimento?',
    'Não. É um modelo de melhoria de processos compatível com diferentes abordagens de desenvolvimento.',
    'Maturidade alta elimina defeitos?',
    'Não. Ela aumenta disciplina e previsibilidade, mas não assegura perfeição.'
  ),
  (
    'mps br',
    'Reconhecer a estrutura e os níveis do MPS.BR e compará-lo ao CMMI sem tratá-los como equivalentes.',
    'MPS.BR é um programa brasileiro de melhoria de processos coordenado pela Softex. Seu Modelo de Referência para Software organiza processos, resultados esperados e atributos de processo, buscando adoção gradual também por pequenas e médias organizações.',
    'Os níveis de maturidade evoluem de G a A: G Parcialmente Gerenciado, F Gerenciado, E Parcialmente Definido, D Largamente Definido, C Definido, B Gerenciado Quantitativamente e A Em Otimização. Cada nível acumula capacidades e processos previstos nos níveis anteriores.',
    'Uma empresa pode iniciar no nível G, institucionalizando gerenciamento de projetos e requisitos, e avançar progressivamente. Avaliações verificam evidências de implementação dos resultados e atributos exigidos.',
    'MPS.BR não é uma tradução literal do CMMI e seus níveis não têm as mesmas letras ou quantidade. A avaliação recai sobre processos organizacionais, não sobre a aprovação isolada de um software.',
    'Os níveis do MR-MPS evoluem de G até A.',
    'O modelo promove adoção gradual de melhoria de processos.',
    'Avaliação de processo não equivale a certificação de produto.',
    'Qual é a ordem de evolução dos níveis do MPS.BR?',
    'De G, o nível inicial do modelo, até A, Em Otimização.',
    'MPS.BR e CMMI têm níveis idênticos?',
    'Não. Há compatibilidade conceitual, mas estrutura, nomenclatura e quantidade de níveis diferem.',
    'A avaliação MPS.BR atesta um produto específico?',
    'Não. Ela avalia a implementação dos processos no escopo organizacional definido.'
  ),
  (
    'processo de desenvolvimento de software',
    'Distinguir processo, modelo de processo, método e prática e relacionar atividades de desenvolvimento.',
    'Processo de software é um conjunto organizado de atividades, papéis, artefatos, critérios e controles usados para desenvolver e evoluir software. Todo processo precisa tornar explícito quem faz o quê, com quais entradas, quais saídas e como se verifica a conclusão.',
    'Especificação, desenvolvimento, validação e evolução são atividades fundamentais recorrentes. Modelos prescritivos definem fluxos mais explícitos; abordagens adaptativas trabalham com ciclos curtos e inspeção. Um processo pode combinar práticas sem perder rastreabilidade e critérios de qualidade.',
    'Em uma iteração, analista e equipe refinam requisitos, desenvolvedores implementam, testes verificam critérios de aceitação e o incremento é revisado. Os resultados alimentam o planejamento seguinte.',
    'Processo não é apenas documentação nem ferramenta. Agilidade não significa ausência de disciplina; significa adaptar plano e solução com feedback frequente.',
    'Processo coordena atividades, papéis, artefatos e critérios.',
    'Validação e evolução são atividades fundamentais.',
    'Agilidade mantém disciplina com adaptação e feedback.',
    'Processo e ferramenta são sinônimos?',
    'Não. Ferramentas apoiam atividades; processo define como o trabalho é organizado e controlado.',
    'Agilidade elimina planejamento?',
    'Não. Planejamento ocorre de forma contínua e em horizontes adequados.',
    'Quais atividades fundamentais aparecem em diferentes processos?',
    'Especificação, desenvolvimento, validação e evolução.'
  ),
  (
    'processo unificado nocoes de rup disciplinas fases papeis atividades e artefatos',
    'Relacionar fases, disciplinas, papéis e artefatos do RUP e compreender seu caráter iterativo e incremental.',
    'RUP é uma implementação configurável do Processo Unificado. É orientado a casos de uso, centrado na arquitetura, iterativo e incremental. Organiza o tempo em fases e o trabalho em disciplinas que atravessam essas fases com intensidades diferentes.',
    'As fases são Concepção, Elaboração, Construção e Transição. Concepção delimita visão, escopo e viabilidade. Elaboração estabiliza arquitetura e trata riscos principais. Construção produz o sistema. Transição entrega ao ambiente dos usuários. Requisitos, análise e projeto, implementação, testes, implantação, configuração, projeto e ambiente são disciplinas, não fases.',
    'Na Elaboração, uma equipe pode implementar um esqueleto arquitetural executável para reduzir o risco de integração. O marco da fase avalia se a arquitetura está estável para sustentar a Construção.',
    'RUP não é cascata disfarçada: há iterações em cada fase. Também não exige usar todos os artefatos; o processo deve ser adaptado ao contexto.',
    'Fases organizam o ciclo; disciplinas organizam tipos de trabalho.',
    'Elaboração estabiliza arquitetura e reduz riscos centrais.',
    'RUP é iterativo, incremental e configurável.',
    'Quais são as quatro fases do RUP?',
    'Concepção, Elaboração, Construção e Transição.',
    'Testes constituem uma fase do RUP?',
    'Não. Teste é disciplina presente, com intensidades diferentes, ao longo das fases.',
    'Qual é o foco central da Elaboração?',
    'Estabilizar a arquitetura e mitigar os riscos mais relevantes.'
  ),
  (
    'processo agil conceito e metodologia scrum',
    'Explicar empirismo, eventos, responsabilidades e artefatos do Scrum sem confundi-lo com um processo prescritivo completo.',
    'Scrum é um framework leve para gerar valor em problemas complexos. Baseia-se em empirismo e pensamento lean; transparência, inspeção e adaptação sustentam as decisões. O Scrum Team é composto por Product Owner, Scrum Master e Developers.',
    'A Sprint contém o trabalho necessário, incluindo Sprint Planning, Daily Scrum, Sprint Review e Sprint Retrospective. Product Backlog se compromete com o Product Goal; Sprint Backlog, com o Sprint Goal; Increment, com a Definition of Done. O Product Owner maximiza valor e gerencia efetivamente o Product Backlog.',
    'No Planning, a equipe define por que a Sprint é valiosa, o que pode ser feito e como. Na Review, inspeciona resultado e adapta backlog com partes interessadas. Na Retrospective, melhora qualidade e eficácia do modo de trabalho.',
    'Daily Scrum não é reunião de status para o Scrum Master. Sprint Review não é apenas demonstração, e Retrospective não avalia o produto. Scrum não prescreve técnicas de engenharia nem cargo de gerente de projeto.',
    'Scrum usa transparência, inspeção e adaptação.',
    'Cada artefato possui um compromisso correspondente.',
    'Review olha produto e contexto; Retrospective olha o processo de trabalho.',
    'Quem é responsável por maximizar o valor do produto?',
    'O Product Owner.',
    'Daily Scrum é uma prestação de contas ao Scrum Master?',
    'Não. É um evento dos Developers para inspecionar progresso em direção ao Sprint Goal e adaptar o plano.',
    'Qual compromisso está associado ao Increment?',
    'A Definition of Done.'
  ),
  (
    'fundamentos de engenharia de software engenharia de requisitos processos de desenvolvimento em cascata e iterativo projeto orientado a objetos testes e validacao',
    'Integrar requisitos, processo, projeto, implementação e testes como partes do desenvolvimento sistemático de software.',
    'Engenharia de Software aplica princípios, métodos e ferramentas ao desenvolvimento, operação e evolução de software. Seu objetivo é produzir valor com qualidade, custo, prazo e risco controlados; programar é apenas uma de suas atividades.',
    'Requisitos definem necessidades e restrições; processo coordena o trabalho; projeto transforma o problema em estrutura de solução; implementação concretiza o projeto; verificação e validação produzem evidências de conformidade e adequação. Cascata organiza fases sequenciais; desenvolvimento iterativo usa ciclos de feedback e refinamento.',
    'Um requisito de desempenho influencia a arquitetura, os testes de carga e o monitoramento. Se for descoberto apenas ao final, o retrabalho pode ser alto; por isso rastreabilidade e validação antecipada conectam decisões ao longo do ciclo.',
    'Não existe processo universalmente melhor. Previsibilidade do domínio, criticidade, tamanho da equipe e frequência de mudança influenciam a escolha. Testar não substitui requisitos claros e validar não é apenas executar testes.',
    'Engenharia de Software integra atividades técnicas e gerenciais.',
    'Iteração cria feedback para reduzir incerteza.',
    'Verificação e validação respondem a perguntas diferentes.',
    'Programação e Engenharia de Software são equivalentes?',
    'Não. Programação é uma atividade dentro de um processo mais amplo de requisitos, projeto, qualidade, operação e gestão.',
    'Qual a diferença entre verificação e validação?',
    'Verificação avalia conformidade com especificações; validação avalia adequação à necessidade e ao uso.',
    'Quando cascata tende a ser mais adequada?',
    'Quando requisitos e tecnologia são relativamente estáveis e há forte necessidade de marcos e documentação, sem eliminar a gestão de riscos.'
  ),
  (
    'medicao e estimativas de projetos de software analise e processo de contagem de pontos de funcao funcoes de dados e transacionais e fatores de ajuste',
    'Compreender a medição funcional por pontos de função e distinguir funções de dados e transacionais.',
    'Análise de Pontos de Função mede o tamanho funcional percebido pelo usuário, independentemente da tecnologia de implementação. A contagem identifica funções de dados e transacionais, classifica sua complexidade e calcula pontos de função não ajustados.',
    'Funções de dados incluem Arquivo Lógico Interno, mantido pela aplicação, e Arquivo de Interface Externa, apenas referenciado. Funções transacionais incluem Entrada Externa, Saída Externa e Consulta Externa. DETs, RETs e FTRs ajudam a classificar complexidade conforme o tipo. Estimativa de esforço exige produtividade histórica; pontos de função não são horas.',
    'Um cadastro mantido pelo sistema pode ser ALI. Uma consulta que lê dados sem cálculo relevante tende a CE; um relatório com processamento derivado pode ser SE. Depois do tamanho funcional, dados históricos permitem estimar esforço e prazo.',
    'Tabela física não corresponde automaticamente a ALI e tela não corresponde automaticamente a uma transação. A contagem parte de processos elementares e visão do usuário. Fatores de ajuste pertencem a versões do método e devem seguir a técnica indicada no enunciado.',
    'Pontos de função medem tamanho funcional, não esforço direto.',
    'ALI é mantido; AIE é apenas referenciado pela aplicação.',
    'EE, SE e CE representam funções transacionais distintas.',
    'Ponto de função equivale a hora de trabalho?',
    'Não. O esforço é estimado aplicando produtividade histórica e outros fatores ao tamanho funcional.',
    'Qual a diferença entre ALI e AIE?',
    'O ALI é mantido dentro da fronteira da aplicação; o AIE é referenciado, mas mantido por outra aplicação.',
    'Uma tela sempre representa uma função transacional?',
    'Não. A unidade é o processo elementar reconhecido pelo usuário; uma tela pode conter mais de um processo ou nenhum novo processo.'
  )
), matched AS (
  SELECT shared.id, authored.*
  FROM shared_study_subjects shared
  JOIN authored
    ON authored.title_key = gabarita_subject_normalized(shared.title)
   AND gabarita_subject_normalized(shared.discipline) = 'engenharia de software'
)
UPDATE shared_study_subjects shared
SET study_objective = matched.objective,
    review_summary = jsonb_build_array(matched.takeaway_1, matched.takeaway_2, matched.takeaway_3),
    base_content =
      '<h3>O que é</h3><p>' || matched.concept || '</p>' ||
      '<h3>Como funciona</h3><p>' || matched.mechanics || '</p>' ||
      '<h3>Exemplo aplicado</h3><p>' || matched.application || '</p>' ||
      '<h3>Limites e confusões frequentes</h3><p>' || matched.caution || '</p>',
    key_takeaways = jsonb_build_array(matched.takeaway_1, matched.takeaway_2, matched.takeaway_3),
    content_blocks = jsonb_build_array(
      jsonb_build_object(
        'id', 'fundamentos-especificos',
        'title', 'Fundamentos e funcionamento',
        'content', '<p>' || matched.concept || '</p><p>' || matched.mechanics || '</p>',
        'keyTakeaways', jsonb_build_array(matched.takeaway_1, matched.takeaway_2, matched.takeaway_3)
      ),
      jsonb_build_object(
        'id', 'exemplo-aplicado',
        'title', 'Aplicação, limites e prova',
        'content', '<p>' || matched.application || '</p><p><strong>Atenção:</strong> ' || matched.caution || '</p>',
        'miniQuestions', jsonb_build_array(
          jsonb_build_object('prompt', matched.prompt_1, 'answer', matched.answer_1),
          jsonb_build_object('prompt', matched.prompt_2, 'answer', matched.answer_2),
          jsonb_build_object('prompt', matched.prompt_3, 'answer', matched.answer_3)
        )
      )
    ),
    updated_at = now()
FROM matched
WHERE shared.id = matched.id;

-- Taxonomia canônica do banco de questões.
-- A fonte de verdade deixa de ser metadata.category/topic e passa a ser
-- questions.subject_id -> subjects e questions.topic_id -> topics.

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS slug VARCHAR(140);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS area VARCHAR(100) NOT NULL DEFAULT 'Outros';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 999;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS slug VARCHAR(160);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 999;

CREATE UNIQUE INDEX IF NOT EXISTS subjects_global_slug_unique
  ON subjects(slug) WHERE exam_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS topics_subject_slug_unique
  ON topics(subject_id,slug);

INSERT INTO subjects(name,slug,area,position) VALUES
  ('Língua Portuguesa','lingua-portuguesa','Linguagens',10),
  ('Língua Inglesa','lingua-inglesa','Linguagens',20),
  ('Raciocínio Lógico','raciocinio-logico','Raciocínio Quantitativo',30),
  ('Matemática e Estatística','matematica-estatistica','Raciocínio Quantitativo',40),
  ('Informática','informatica','Tecnologia da Informação',100),
  ('Segurança da Informação','seguranca-informacao','Tecnologia da Informação',110),
  ('Banco de Dados','banco-dados','Tecnologia da Informação',120),
  ('Programação','programacao','Tecnologia da Informação',130),
  ('Engenharia de Software','engenharia-software','Tecnologia da Informação',140),
  ('Arquitetura de Software','arquitetura-software','Tecnologia da Informação',150),
  ('Redes de Computadores','redes-computadores','Tecnologia da Informação',160),
  ('Computação em Nuvem','computacao-nuvem','Tecnologia da Informação',170),
  ('Sistemas Operacionais','sistemas-operacionais','Tecnologia da Informação',180),
  ('Ferramentas de Escritório','ferramentas-escritorio','Tecnologia da Informação',190),
  ('Governança e Gestão de TI','governanca-ti','Tecnologia da Informação',200),
  ('Dados e Analytics','dados-analytics','Tecnologia da Informação',210),
  ('Jornalismo','jornalismo','Comunicação',300),
  ('Assessoria de Imprensa','assessoria-imprensa','Comunicação',310),
  ('Comunicação Organizacional','comunicacao-organizacional','Comunicação',320),
  ('Editoração e Design Editorial','editoracao-design','Comunicação',330),
  ('Produção Audiovisual','producao-audiovisual','Comunicação',340),
  ('Marketing','marketing','Comunicação',350),
  ('Ética e Compliance','etica-compliance','Direito e Governança',400),
  ('Direito Administrativo','direito-administrativo','Direito e Governança',410),
  ('Proteção de Dados e LGPD','protecao-dados-lgpd','Direito e Governança',420),
  ('Regulação e Agências Reguladoras','regulacao-agencias','Direito e Governança',430),
  ('Legislação Institucional','legislacao-institucional','Direito e Governança',440),
  ('Conhecimentos de Alagoas','conhecimentos-alagoas','Conhecimentos Regionais',500),
  ('Enfermagem','enfermagem','Saúde',600),
  ('Saúde Pública e SUS','saude-publica-sus','Saúde',610),
  ('Inovação e Tecnologia','inovacao-tecnologia','Gestão e Inovação',700),
  ('Modelos de Negócio','modelos-negocio','Gestão e Inovação',710),
  ('Sociologia e Desenvolvimento Rural','sociologia-desenvolvimento-rural','Ciências Humanas',800)
ON CONFLICT DO NOTHING;

WITH seed(subject_slug,slug,name,position) AS (VALUES
  ('lingua-portuguesa','interpretacao-texto','Interpretação de Texto',10),
  ('lingua-portuguesa','pontuacao','Pontuação',20),
  ('lingua-portuguesa','regencia','Regência',30),
  ('lingua-portuguesa','concordancia','Concordância',40),
  ('lingua-portuguesa','crase','Crase',50),
  ('lingua-portuguesa','coesao-coerencia','Coesão e Coerência',60),
  ('lingua-portuguesa','classes-palavras','Classes de Palavras',70),
  ('lingua-portuguesa','sintaxe','Sintaxe',80),
  ('lingua-portuguesa','reescrita','Reescrita de Textos',90),
  ('lingua-portuguesa','ortografia-acentuacao','Ortografia e Acentuação',100),
  ('lingua-portuguesa','tipologia-generos','Tipologia e Gêneros Textuais',110),
  ('lingua-portuguesa','semantica','Semântica',120),
  ('lingua-portuguesa','fundamentos','Fundamentos de Língua Portuguesa',999),
  ('lingua-inglesa','interpretacao','Interpretação de Textos',10),
  ('lingua-inglesa','traducao-vocabulario','Tradução e Vocabulário',20),
  ('lingua-inglesa','gramatica','Gramática da Língua Inglesa',30),
  ('raciocinio-logico','logica-proposicional','Lógica Proposicional',10),
  ('raciocinio-logico','raciocinio-analitico','Raciocínio Analítico',20),
  ('raciocinio-logico','fundamentos','Fundamentos de Raciocínio Lógico',999),
  ('matematica-estatistica','estatistica-descritiva','Estatística Descritiva',10),
  ('matematica-estatistica','probabilidade','Probabilidade',20),
  ('matematica-estatistica','matematica-basica','Matemática Básica',30),
  ('informatica','hardware-perifericos','Hardware e Periféricos',10),
  ('informatica','internet-navegadores','Internet e Navegadores',20),
  ('informatica','arquivos-pastas','Arquivos e Pastas',30),
  ('informatica','fundamentos','Fundamentos de Informática',999),
  ('seguranca-informacao','malwares','Malwares: Vírus, Worms e Ransomware',10),
  ('seguranca-informacao','criptografia-tls','Criptografia, Certificados e TLS',20),
  ('seguranca-informacao','seguranca-aplicacoes-owasp','Segurança de Aplicações e OWASP',30),
  ('seguranca-informacao','seguranca-redes','Segurança de Redes',40),
  ('seguranca-informacao','identidade-acesso','Identidade, Autenticação e Controle de Acesso',50),
  ('seguranca-informacao','gestao-riscos','Gestão de Riscos e Segurança',60),
  ('seguranca-informacao','backup-recuperacao','Backup e Recuperação',70),
  ('seguranca-informacao','fundamentos','Fundamentos de Segurança da Informação',999),
  ('banco-dados','sql','SQL',10),
  ('banco-dados','mysql','MySQL',20),
  ('banco-dados','postgresql','PostgreSQL',30),
  ('banco-dados','oracle','Oracle Database',40),
  ('banco-dados','modelagem-relacional','Modelagem e Modelo Relacional',50),
  ('banco-dados','normalizacao','Normalização de Dados',60),
  ('banco-dados','indices-transacoes','Índices e Transações',70),
  ('banco-dados','nosql','NoSQL',80),
  ('banco-dados','fundamentos','Fundamentos de Banco de Dados',999),
  ('programacao','java','Java',10),
  ('programacao','python','Python',20),
  ('programacao','javascript-typescript','JavaScript e TypeScript',30),
  ('programacao','csharp-dotnet','C# e .NET',40),
  ('programacao','orientacao-objetos','Orientação a Objetos',50),
  ('programacao','algoritmos-estruturas','Algoritmos e Estruturas de Dados',60),
  ('programacao','desenvolvimento-web','Desenvolvimento Web',70),
  ('programacao','mobile','Desenvolvimento Mobile',80),
  ('programacao','fundamentos','Fundamentos de Programação',999),
  ('engenharia-software','processos-software','Processos de Software',10),
  ('engenharia-software','modelo-cascata','Modelo Cascata',20),
  ('engenharia-software','desenvolvimento-agil','Desenvolvimento Ágil',30),
  ('engenharia-software','scrum','Scrum',40),
  ('engenharia-software','kanban-xp','Kanban e Extreme Programming',50),
  ('engenharia-software','requisitos','Engenharia de Requisitos',60),
  ('engenharia-software','testes-qualidade','Testes e Qualidade de Software',70),
  ('engenharia-software','configuracao-git','Gerência de Configuração e Git',80),
  ('engenharia-software','metricas-cmmi','Métricas, CMMI e Qualidade de Processo',90),
  ('engenharia-software','principios-padroes','Princípios e Padrões de Projeto',100),
  ('engenharia-software','fundamentos','Fundamentos de Engenharia de Software',999),
  ('arquitetura-software','microsservicos','Microsserviços e Microfrontends',10),
  ('arquitetura-software','apis-rest','APIs REST e HTTP',20),
  ('arquitetura-software','soa-integracao','SOA e Integração de Sistemas',30),
  ('arquitetura-software','eventos-mensageria','Arquitetura Orientada a Eventos e Mensageria',40),
  ('arquitetura-software','arquitetura-camadas-clean','Arquitetura em Camadas e Clean Architecture',50),
  ('arquitetura-software','devops-containers','DevOps, Containers e Orquestração',60),
  ('arquitetura-software','formatos-integracao','XML e JSON',70),
  ('arquitetura-software','fundamentos','Fundamentos de Arquitetura de Software',999),
  ('redes-computadores','modelos-osi-tcpip','Modelos OSI e TCP/IP',10),
  ('redes-computadores','protocolos-servicos','Protocolos e Serviços de Rede',20),
  ('redes-computadores','enderecamento-roteamento','Endereçamento e Roteamento',30),
  ('redes-computadores','internet-intranet-extranet','Internet, Intranet e Extranet',40),
  ('redes-computadores','vpn','Redes Privadas Virtuais',50),
  ('redes-computadores','fundamentos','Fundamentos de Redes de Computadores',999),
  ('computacao-nuvem','modelos-servico','IaaS, PaaS e SaaS',10),
  ('computacao-nuvem','modelos-implantacao','Modelos de Implantação em Nuvem',20),
  ('computacao-nuvem','armazenamento-nuvem','Armazenamento em Nuvem',30),
  ('computacao-nuvem','fundamentos','Fundamentos de Computação em Nuvem',999),
  ('sistemas-operacionais','windows','Windows',10),
  ('sistemas-operacionais','linux','Linux',20),
  ('sistemas-operacionais','processos-arquivos','Processos e Sistemas de Arquivos',30),
  ('sistemas-operacionais','fundamentos','Fundamentos de Sistemas Operacionais',999),
  ('ferramentas-escritorio','excel','Microsoft Excel',10),
  ('ferramentas-escritorio','word','Microsoft Word',20),
  ('ferramentas-escritorio','powerpoint','Microsoft PowerPoint',30),
  ('ferramentas-escritorio','power-platform','Power Platform e Automação',40),
  ('ferramentas-escritorio','fundamentos','Fundamentos de Ferramentas de Escritório',999),
  ('governanca-ti','governanca','Governança de TI',10),
  ('governanca-ti','gestao-projetos-pmbok','Gestão de Projetos e PMBOK',20),
  ('governanca-ti','contratos-ti','Gestão de Contratos de TI',30),
  ('governanca-ti','servicos-ti','Gestão de Serviços de TI',40),
  ('governanca-ti','fundamentos','Fundamentos de Governança e Gestão de TI',999),
  ('dados-analytics','big-data','Big Data',10),
  ('dados-analytics','data-warehouse-bi','Data Warehouse e Business Intelligence',20),
  ('dados-analytics','fundamentos','Fundamentos de Dados e Analytics',999),
  ('jornalismo','generos-formatos','Gêneros e Formatos Jornalísticos',10),
  ('jornalismo','noticia-reportagem','Notícia, Reportagem e Entrevista',20),
  ('jornalismo','teoria-noticia','Teoria e Produção da Notícia',30),
  ('jornalismo','redacao-jornalistica','Redação Jornalística, Lide e Pirâmide Invertida',40),
  ('jornalismo','webjornalismo','Webjornalismo',50),
  ('jornalismo','jornalismo-cientifico','Jornalismo Científico e Especializado',60),
  ('jornalismo','etica-legislacao','Ética, Legislação e Direitos Autorais',70),
  ('jornalismo','fundamentos','Fundamentos de Jornalismo',999),
  ('assessoria-imprensa','relacionamento-imprensa','Relacionamento com a Imprensa',10),
  ('assessoria-imprensa','media-training','Media Training e Porta-Vozes',20),
  ('assessoria-imprensa','clipping-mailing','Clipping e Mailing',30),
  ('assessoria-imprensa','fundamentos','Fundamentos de Assessoria de Imprensa',999),
  ('comunicacao-organizacional','comunicacao-interna','Comunicação Interna e Organizacional',10),
  ('comunicacao-organizacional','comunicacao-publica','Comunicação Pública e Transparência',20),
  ('comunicacao-organizacional','planejamento-stakeholders','Planejamento e Stakeholders',30),
  ('comunicacao-organizacional','fundamentos','Fundamentos de Comunicação Organizacional',999),
  ('editoracao-design','diagramacao','Diagramação e Projeto Gráfico',10),
  ('editoracao-design','tipografia-legibilidade','Tipografia e Legibilidade',20),
  ('editoracao-design','fundamentos','Fundamentos de Editoração',999),
  ('producao-audiovisual','radio-televisao','Rádio e Televisão',10),
  ('producao-audiovisual','producao-video','Produção de Vídeo',20),
  ('producao-audiovisual','fundamentos','Fundamentos de Produção Audiovisual',999),
  ('marketing','planejamento-marketing','Planejamento de Marketing',10),
  ('marketing','marketing-digital','Marketing Digital',20),
  ('marketing','fundamentos','Fundamentos de Marketing',999),
  ('etica-compliance','etica-servico-publico','Ética no Serviço Público',10),
  ('etica-compliance','compliance-integridade','Compliance e Integridade',20),
  ('etica-compliance','conflito-interesses','Conflito de Interesses',30),
  ('etica-compliance','fundamentos','Fundamentos de Ética e Compliance',999),
  ('direito-administrativo','atos-poderes','Atos e Poderes Administrativos',10),
  ('direito-administrativo','licitacoes-contratos','Licitações e Contratos',20),
  ('direito-administrativo','processo-disciplinar','Processo Administrativo Disciplinar',30),
  ('direito-administrativo','administracao-publica','Administração Pública',40),
  ('direito-administrativo','fundamentos','Fundamentos de Direito Administrativo',999),
  ('protecao-dados-lgpd','lgpd','Lei Geral de Proteção de Dados',10),
  ('protecao-dados-lgpd','dados-pessoais','Tratamento e Proteção de Dados Pessoais',20),
  ('regulacao-agencias','agencias-reguladoras','Agências Reguladoras',10),
  ('regulacao-agencias','liberdade-economica','Liberdade Econômica e Aprovação Tácita',20),
  ('regulacao-agencias','fundamentos','Fundamentos de Regulação',999),
  ('legislacao-institucional','embrapa','Legislação da Embrapa',10),
  ('legislacao-institucional','ebserh','Legislação da EBSERH',20),
  ('legislacao-institucional','fundamentos','Legislação Institucional Geral',999),
  ('conhecimentos-alagoas','historia','História de Alagoas',10),
  ('conhecimentos-alagoas','geografia-economia','Geografia e Economia de Alagoas',20),
  ('conhecimentos-alagoas','patrimonio-cultura','Patrimônio e Cultura Alagoana',30),
  ('conhecimentos-alagoas','fundamentos','Conhecimentos Gerais de Alagoas',999),
  ('enfermagem','fundamentos','Fundamentos de Enfermagem',10),
  ('enfermagem','seguranca-paciente','Segurança e Cuidado ao Paciente',20),
  ('enfermagem','farmacologia-medicamentos','Farmacologia e Administração de Medicamentos',30),
  ('enfermagem','urgencia-emergencia','Urgência e Emergência',40),
  ('saude-publica-sus','principios-organizacao','Princípios e Organização do SUS',10),
  ('saude-publica-sus','politicas-publicas','Políticas Públicas de Saúde',20),
  ('saude-publica-sus','epidemiologia','Epidemiologia e Atenção à Saúde',30),
  ('inovacao-tecnologia','transferencia-tecnologia','Transferência de Tecnologia e Propriedade Intelectual',10),
  ('inovacao-tecnologia','design-thinking','Design Thinking',20),
  ('inovacao-tecnologia','marco-legal-cti','Marco Legal de Ciência, Tecnologia e Inovação',30),
  ('inovacao-tecnologia','fundamentos','Fundamentos de Inovação e Tecnologia',999),
  ('modelos-negocio','canvas','Modelos de Negócio e Canvas',10),
  ('modelos-negocio','fundamentos','Fundamentos de Modelos de Negócio',999),
  ('sociologia-desenvolvimento-rural','territorio-agroecologia','Território, Agroecologia e Desenvolvimento Rural',10),
  ('sociologia-desenvolvimento-rural','fundamentos','Fundamentos de Sociologia Rural',999)
)
INSERT INTO topics(subject_id,slug,name,position)
SELECT s.id,seed.slug,seed.name,seed.position FROM seed JOIN subjects s ON s.slug=seed.subject_slug AND s.exam_id IS NULL
ON CONFLICT DO NOTHING;

CREATE FUNCTION gabarita_question_taxonomy(
  category_value TEXT,topic_value TEXT,detailed_value TEXT,reference_value TEXT,statement_value TEXT,explanation_value TEXT
) RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  category_text TEXT:=lower(COALESCE(category_value,''));
  topic_text TEXT:=lower(COALESCE(topic_value,''));
  detail_text TEXT:=lower(COALESCE(detailed_value,''));
  content_text TEXT:=lower(concat_ws(' ',topic_value,detailed_value,reference_value,statement_value,explanation_value));
BEGIN
  -- Linguagens
  IF category_text ~ 'portugu' OR detail_text ~ 'língua portuguesa|interpretação de texto|compreensão.*texto|coesão|pontuação|regência|concordância|crase|reescrita|sintaxe|semântica|classes de palavras|tipologia' THEN
    IF content_text ~ 'pontuação|vírgula|travessão|dois-pontos' THEN RETURN ARRAY['lingua-portuguesa','pontuacao']; END IF;
    IF content_text ~ 'regência|transitividade' THEN RETURN ARRAY['lingua-portuguesa','regencia']; END IF;
    IF content_text ~ 'concordância' THEN RETURN ARRAY['lingua-portuguesa','concordancia']; END IF;
    IF content_text ~ '\mcrase\M|acento grave' THEN RETURN ARRAY['lingua-portuguesa','crase']; END IF;
    IF content_text ~ 'reescrita|substitui|supressão|inserção|reorganização' THEN RETURN ARRAY['lingua-portuguesa','reescrita']; END IF;
    IF content_text ~ 'coesão|coerência|conector|conjunção|relação de sentido|referencial' THEN RETURN ARRAY['lingua-portuguesa','coesao-coerencia']; END IF;
    IF content_text ~ 'classe de palavra|substantivo|adjetivo|advérbio|pronome' THEN RETURN ARRAY['lingua-portuguesa','classes-palavras']; END IF;
    IF content_text ~ 'sintaxe|sujeito|predicado|oração|termos da oração' THEN RETURN ARRAY['lingua-portuguesa','sintaxe']; END IF;
    IF content_text ~ 'ortografia|acentuação|hífen|grafia' THEN RETURN ARRAY['lingua-portuguesa','ortografia-acentuacao']; END IF;
    IF content_text ~ 'tipologia|gênero textual|narrativ|dissertativ|injuntiv' THEN RETURN ARRAY['lingua-portuguesa','tipologia-generos']; END IF;
    IF content_text ~ 'semântica|sentido vocabular' THEN RETURN ARRAY['lingua-portuguesa','semantica']; END IF;
    IF content_text ~ 'interpretação|compreensão|infer|conclui-se|depreende-se|texto' THEN RETURN ARRAY['lingua-portuguesa','interpretacao-texto']; END IF;
    RETURN ARRAY['lingua-portuguesa','fundamentos'];
  END IF;
  IF category_text ~ 'ingles' THEN
    IF content_text ~ 'tradução|vocabulário' THEN RETURN ARRAY['lingua-inglesa','traducao-vocabulario']; END IF;
    RETURN ARRAY['lingua-inglesa','interpretacao'];
  END IF;

  -- Comunicação vem antes de TI para corrigir categorias legadas incorretas.
  IF content_text ~ 'jornalis|notícia|reportagem|lide|pirâmide invertida|sigilo da fonte|gênero jornalístico|teoria da notícia|redação jornalística' THEN
    IF content_text ~ 'webjornal|jornalismo.*internet' THEN RETURN ARRAY['jornalismo','webjornalismo']; END IF;
    IF content_text ~ 'científico|especializado' THEN RETURN ARRAY['jornalismo','jornalismo-cientifico']; END IF;
    IF content_text ~ 'direito autoral|sigilo da fonte|ética.*jornal|legislação.*comunicação' THEN RETURN ARRAY['jornalismo','etica-legislacao']; END IF;
    IF content_text ~ 'lide|pirâmide invertida|redação jornalística' THEN RETURN ARRAY['jornalismo','redacao-jornalistica']; END IF;
    IF content_text ~ 'teoria da notícia|noticiabilidade|produção da notícia' THEN RETURN ARRAY['jornalismo','teoria-noticia']; END IF;
    IF content_text ~ 'notícia|reportagem|entrevista' THEN RETURN ARRAY['jornalismo','noticia-reportagem']; END IF;
    IF content_text ~ 'gênero|formato|artigo jornalístico' THEN RETURN ARRAY['jornalismo','generos-formatos']; END IF;
    RETURN ARRAY['jornalismo','fundamentos'];
  END IF;
  IF category_text ~ 'assessoria' OR content_text ~ 'assessoria de imprensa|media training|porta-voz|clipping|mailing de imprensa|relacionamento com imprensa' THEN
    IF content_text ~ 'media training|porta-voz' THEN RETURN ARRAY['assessoria-imprensa','media-training']; END IF;
    IF content_text ~ 'clipping|mailing' THEN RETURN ARRAY['assessoria-imprensa','clipping-mailing']; END IF;
    RETURN ARRAY['assessoria-imprensa','relacionamento-imprensa'];
  END IF;
  IF category_text ~ 'comunicação organizacional' OR content_text ~ 'comunicação organizacional|comunicação interna|stakeholder|transparência ativa|transparência passiva|comunicação pública' THEN
    IF content_text ~ 'transparência|comunicação pública|lei de acesso' THEN RETURN ARRAY['comunicacao-organizacional','comunicacao-publica']; END IF;
    IF content_text ~ 'stakeholder|planejamento estratégico' THEN RETURN ARRAY['comunicacao-organizacional','planejamento-stakeholders']; END IF;
    RETURN ARRAY['comunicacao-organizacional','comunicacao-interna'];
  END IF;
  IF category_text ~ 'editoração' OR content_text ~ 'editoração|diagramação|projeto gráfico|tipografia|grid editorial|editoria de arte' THEN
    IF content_text ~ 'tipografia|legibilidade' THEN RETURN ARRAY['editoracao-design','tipografia-legibilidade']; END IF;
    RETURN ARRAY['editoracao-design','diagramacao'];
  END IF;
  IF category_text ~ 'audiovisual' OR content_text ~ 'rádio e televisão|produção audiovisual|produção de vídeo' THEN RETURN ARRAY['producao-audiovisual','radio-televisao']; END IF;
  IF category_text ~ 'marketing' OR content_text ~ 'planejamento.*marketing|marketing digital' THEN RETURN ARRAY['marketing',CASE WHEN content_text ~ 'digital' THEN 'marketing-digital' ELSE 'planejamento-marketing' END]; END IF;

  -- Tecnologia da Informação
  IF content_text ~ 'malware|ransomware|\mvírus\M|\mvirus\M|\mworm\M|phishing' THEN RETURN ARRAY['seguranca-informacao','malwares']; END IF;
  IF content_text ~ 'criptograf|certifica(do|ção) digital|\mtls\M|\mssl\M|pki|icp-brasil|assinatura digital|blockchain' THEN RETURN ARRAY['seguranca-informacao','criptografia-tls']; END IF;
  IF content_text ~ 'owasp|sast|dast|injeção sql|xss|segurança de aplica' THEN RETURN ARRAY['seguranca-informacao','seguranca-aplicacoes-owasp']; END IF;
  IF content_text ~ 'firewall|\mids\M|\mips\M|ddos|segurança de redes' THEN RETURN ARRAY['seguranca-informacao','seguranca-redes']; END IF;
  IF content_text ~ 'oauth|openid|biometria|controle de acesso|autentica|identidade' THEN RETURN ARRAY['seguranca-informacao','identidade-acesso']; END IF;
  IF content_text ~ 'gestão de riscos|risco.*segurança' THEN RETURN ARRAY['seguranca-informacao','gestao-riscos']; END IF;
  IF content_text ~ '\mbackup\M|recuperação de desastre' AND category_text ~ 'tecnologia|análise de sistemas|informática' THEN RETURN ARRAY['seguranca-informacao','backup-recuperacao']; END IF;
  IF detail_text ~ 'segurança da informação' OR topic_text ~ 'segurança da informação' THEN RETURN ARRAY['seguranca-informacao','fundamentos']; END IF;

  IF content_text ~ '\mmysql\M' THEN RETURN ARRAY['banco-dados','mysql']; END IF;
  IF content_text ~ '\mpostgresql\M' THEN RETURN ARRAY['banco-dados','postgresql']; END IF;
  IF content_text ~ 'oracle database' THEN RETURN ARRAY['banco-dados','oracle']; END IF;
  IF content_text ~ 'normalização|forma normal|dependência funcional' THEN RETURN ARRAY['banco-dados','normalizacao']; END IF;
  IF content_text ~ 'modelo relacional|modelagem de dados|entidade.relacionamento' THEN RETURN ARRAY['banco-dados','modelagem-relacional']; END IF;
  IF content_text ~ 'índice|b-tree|transação|\macid\M' AND content_text ~ 'tabela|banco|insert|update|commit' THEN RETURN ARRAY['banco-dados','indices-transacoes']; END IF;
  IF content_text ~ '\mnosql\M|mongodb|cassandra' THEN RETURN ARRAY['banco-dados','nosql']; END IF;
  IF content_text ~ '\msql\M|select |insert |update |delete |banco de dados|database' THEN RETURN ARRAY['banco-dados','sql']; END IF;
  IF detail_text ~ 'banco de dados' THEN RETURN ARRAY['banco-dados','fundamentos']; END IF;

  IF content_text ~ '\mpython\M' THEN RETURN ARRAY['programacao','python']; END IF;
  IF content_text ~ '\mjava\M' AND content_text !~ 'javascript' THEN RETURN ARRAY['programacao','java']; END IF;
  IF content_text ~ 'javascript|typescript|react|vue\.js|progressive web' THEN RETURN ARRAY['programacao','javascript-typescript']; END IF;
  IF content_text ~ '\mc#\M|\.net' THEN RETURN ARRAY['programacao','csharp-dotnet']; END IF;
  IF content_text ~ 'android|mobile' THEN RETURN ARRAY['programacao','mobile']; END IF;
  IF content_text ~ 'orientação a objetos|classe|herança|polimorfismo' AND category_text ~ 'tecnologia|análise de sistemas' THEN RETURN ARRAY['programacao','orientacao-objetos']; END IF;
  IF content_text ~ 'algoritmo|estrutura de dados' THEN RETURN ARRAY['programacao','algoritmos-estruturas']; END IF;
  IF content_text ~ 'desenvolvimento web|frontend|backend' THEN RETURN ARRAY['programacao','desenvolvimento-web']; END IF;

  IF content_text ~ '\mscrum\M' THEN RETURN ARRAY['engenharia-software','scrum']; END IF;
  IF content_text ~ '\mkanban\M|extreme programming|\mxp\M' THEN RETURN ARRAY['engenharia-software','kanban-xp']; END IF;
  IF content_text ~ 'desenvolvimento ágil|metodologia ágil|método ágil' THEN RETURN ARRAY['engenharia-software','desenvolvimento-agil']; END IF;
  IF content_text ~ 'cascata|waterfall' THEN RETURN ARRAY['engenharia-software','modelo-cascata']; END IF;
  IF content_text ~ 'processo de software|ciclo de vida|rup|espiral' THEN RETURN ARRAY['engenharia-software','processos-software']; END IF;
  IF content_text ~ 'requisito|caso de uso|uml' THEN RETURN ARRAY['engenharia-software','requisitos']; END IF;
  IF content_text ~ 'teste de software|caixa preta|caixa branca|tdd|sonarqube|qualidade de software|teste unitário' THEN RETURN ARRAY['engenharia-software','testes-qualidade']; END IF;
  IF content_text ~ '\mgit\M|pull request|merge request|controle de versão|gerência de configuração' THEN RETURN ARRAY['engenharia-software','configuracao-git']; END IF;
  IF content_text ~ 'cmmi|ponto de função|métrica de software' THEN RETURN ARRAY['engenharia-software','metricas-cmmi']; END IF;
  IF content_text ~ 'solid|clean code|padrão de projeto|singleton|gof' THEN RETURN ARRAY['engenharia-software','principios-padroes']; END IF;
  IF detail_text ~ 'engenharia de software|métodos ágeis' THEN RETURN ARRAY['engenharia-software','fundamentos']; END IF;

  IF content_text ~ 'microserviço|microfrontend' THEN RETURN ARRAY['arquitetura-software','microsservicos']; END IF;
  IF content_text ~ '\mrest\M|restful|método http|código.*http|stateless|\mapi\M' THEN RETURN ARRAY['arquitetura-software','apis-rest']; END IF;
  IF content_text ~ 'arquitetura orientada a serviços|\msoa\M' THEN RETURN ARRAY['arquitetura-software','soa-integracao']; END IF;
  IF content_text ~ 'orientada a eventos|kafka|rabbitmq|mensageria' THEN RETURN ARRAY['arquitetura-software','eventos-mensageria']; END IF;
  IF content_text ~ 'clean architecture|arquitetura em camadas' THEN RETURN ARRAY['arquitetura-software','arquitetura-camadas-clean']; END IF;
  IF content_text ~ 'docker|kubernetes|container|devops|integração contínua|ci/cd' THEN RETURN ARRAY['arquitetura-software','devops-containers']; END IF;
  IF content_text ~ '\mxml\M|\mjson\M' THEN RETURN ARRAY['arquitetura-software','formatos-integracao']; END IF;
  IF detail_text ~ 'arquitetura de software' THEN RETURN ARRAY['arquitetura-software','fundamentos']; END IF;

  IF content_text ~ 'modelo osi|tcp/ip|camada física|camada de rede' THEN RETURN ARRAY['redes-computadores','modelos-osi-tcpip']; END IF;
  IF content_text ~ '\mdns\M|\mtcp\M|\mudp\M|protocolo de rede' THEN RETURN ARRAY['redes-computadores','protocolos-servicos']; END IF;
  IF content_text ~ 'roteamento|endereço ip|endereçamento' THEN RETURN ARRAY['redes-computadores','enderecamento-roteamento']; END IF;
  IF content_text ~ 'intranet|extranet' THEN RETURN ARRAY['redes-computadores','internet-intranet-extranet']; END IF;
  IF content_text ~ '\mvpn\M|rede privada virtual' THEN RETURN ARRAY['redes-computadores','vpn']; END IF;
  IF detail_text ~ 'redes de computadores' OR content_text ~ 'rede de computadores' THEN RETURN ARRAY['redes-computadores','fundamentos']; END IF;

  IF content_text ~ 'iaas|paas|saas' THEN RETURN ARRAY['computacao-nuvem','modelos-servico']; END IF;
  IF content_text ~ 'nuvem pública|nuvem privada|nuvem comunitária|nuvem híbrida|modelo de implantação' THEN RETURN ARRAY['computacao-nuvem','modelos-implantacao']; END IF;
  IF content_text ~ 'cloud storage|armazenamento em nuvem|block storage' THEN RETURN ARRAY['computacao-nuvem','armazenamento-nuvem']; END IF;
  IF detail_text ~ 'computação em nuvem|cloud computing' OR content_text ~ 'computação em nuvem|cloud computing' THEN RETURN ARRAY['computacao-nuvem','fundamentos']; END IF;

  IF content_text ~ '\mwindows\M' THEN RETURN ARRAY['sistemas-operacionais','windows']; END IF;
  IF content_text ~ '\mlinux\M' THEN RETURN ARRAY['sistemas-operacionais','linux']; END IF;
  IF detail_text ~ 'sistemas operacionais' OR content_text ~ 'sistema operacional|processo.*arquivo' THEN RETURN ARRAY['sistemas-operacionais','processos-arquivos']; END IF;
  IF content_text ~ '\mexcel\M|planilha' THEN RETURN ARRAY['ferramentas-escritorio','excel']; END IF;
  IF content_text ~ 'microsoft word|\mword\M' THEN RETURN ARRAY['ferramentas-escritorio','word']; END IF;
  IF content_text ~ 'powerpoint|apresentação de slide' THEN RETURN ARRAY['ferramentas-escritorio','powerpoint']; END IF;
  IF content_text ~ 'power automate|power platform' THEN RETURN ARRAY['ferramentas-escritorio','power-platform']; END IF;
  IF detail_text ~ 'ferramentas de escritório|microsoft office' THEN RETURN ARRAY['ferramentas-escritorio','fundamentos']; END IF;
  IF content_text ~ 'pmbok|eap|gestão de projeto' THEN RETURN ARRAY['governanca-ti','gestao-projetos-pmbok']; END IF;
  IF content_text ~ 'contrato.*ti|gestão de contratos de ti' THEN RETURN ARRAY['governanca-ti','contratos-ti']; END IF;
  IF content_text ~ 'itil|gestão de serviços de ti' THEN RETURN ARRAY['governanca-ti','servicos-ti']; END IF;
  IF content_text ~ 'cobit|governança de ti' THEN RETURN ARRAY['governanca-ti','governanca']; END IF;
  IF content_text ~ 'big data' THEN RETURN ARRAY['dados-analytics','big-data']; END IF;
  IF content_text ~ 'data warehouse|business intelligence|\mbi\M' THEN RETURN ARRAY['dados-analytics','data-warehouse-bi']; END IF;
  IF category_text ~ 'tecnologia|análise de sistemas' THEN
    IF content_text ~ 'hardware|periférico|mouse|teclado' THEN RETURN ARRAY['informatica','hardware-perifericos']; END IF;
    IF content_text ~ 'navegador|chrome|firefox|edge|cookie|internet' THEN RETURN ARRAY['informatica','internet-navegadores']; END IF;
    IF content_text ~ 'arquivo|pasta' THEN RETURN ARRAY['informatica','arquivos-pastas']; END IF;
    RETURN ARRAY['informatica','fundamentos'];
  END IF;

  -- Direito, governança, saúde e demais áreas.
  IF detail_text ~ 'lgpd' OR content_text ~ 'lei geral de proteção de dados|dado pessoal|\mlgpd\M' THEN RETURN ARRAY['protecao-dados-lgpd','lgpd']; END IF;
  IF category_text ~ 'ética|compliance' OR detail_text ~ 'ética|compliance' THEN
    IF content_text ~ 'conflito de interesses' THEN RETURN ARRAY['etica-compliance','conflito-interesses']; END IF;
    IF content_text ~ 'compliance|integridade' THEN RETURN ARRAY['etica-compliance','compliance-integridade']; END IF;
    RETURN ARRAY['etica-compliance','etica-servico-publico'];
  END IF;
  IF category_text ~ 'direito administrativo' OR detail_text ~ 'direito administrativo' THEN
    IF content_text ~ '\mlicitação\M|\mlicitações\M|contrato administrativo|lei 14\.133' THEN RETURN ARRAY['direito-administrativo','licitacoes-contratos']; END IF;
    IF content_text ~ 'processo disciplinar|servidor suspenso' THEN RETURN ARRAY['direito-administrativo','processo-disciplinar']; END IF;
    IF content_text ~ 'ato administrativo|poder administrativo' THEN RETURN ARRAY['direito-administrativo','atos-poderes']; END IF;
    RETURN ARRAY['direito-administrativo','administracao-publica'];
  END IF;
  IF category_text ~ 'regulação|agências reguladoras' THEN
    IF content_text ~ 'liberdade econômica|aprovação tácita|ato de liberação' THEN RETURN ARRAY['regulacao-agencias','liberdade-economica']; END IF;
    RETURN ARRAY['regulacao-agencias','agencias-reguladoras'];
  END IF;
  IF category_text ~ 'legislação da embrapa' OR content_text ~ 'estatuto da embrapa|plano diretor da embrapa|lei nº 13\.303.*embrapa' THEN RETURN ARRAY['legislacao-institucional','embrapa']; END IF;
  IF category_text ~ 'ebserh' OR content_text ~ 'legislação.*ebserh' THEN RETURN ARRAY['legislacao-institucional','ebserh']; END IF;
  IF category_text ~ 'alagoas' OR content_text ~ 'alagoas|maceió|palmares|rio são francisco.*alago' THEN
    IF content_text ~ 'patrimônio|cultura' THEN RETURN ARRAY['conhecimentos-alagoas','patrimonio-cultura']; END IF;
    IF content_text ~ 'rio são francisco|geografia|economia|hidrografia' THEN RETURN ARRAY['conhecimentos-alagoas','geografia-economia']; END IF;
    IF content_text ~ 'história|quilombo|palmares' THEN RETURN ARRAY['conhecimentos-alagoas','historia']; END IF;
    RETURN ARRAY['conhecimentos-alagoas','fundamentos'];
  END IF;
  IF category_text ~ 'enfermagem|farmacologia|urgência' OR detail_text ~ 'enfermagem|farmacologia|urgência' THEN
    IF content_text ~ 'urgência|emergência|suporte básico|compressões torácicas' THEN RETURN ARRAY['enfermagem','urgencia-emergencia']; END IF;
    IF content_text ~ 'medicamento|farmacologia|dose|via de administração' THEN RETURN ARRAY['enfermagem','farmacologia-medicamentos']; END IF;
    IF content_text ~ 'segurança do paciente|lesão por pressão|escala de braden|cuidado ao paciente' THEN RETURN ARRAY['enfermagem','seguranca-paciente']; END IF;
    RETURN ARRAY['enfermagem','fundamentos'];
  END IF;
  IF category_text ~ 'saúde pública|sus' OR detail_text ~ 'saúde pública|sus' THEN
    IF content_text ~ 'epidemiolog|atenção básica|atenção à saúde' THEN RETURN ARRAY['saude-publica-sus','epidemiologia']; END IF;
    IF content_text ~ 'política pública' THEN RETURN ARRAY['saude-publica-sus','politicas-publicas']; END IF;
    RETURN ARRAY['saude-publica-sus','principios-organizacao'];
  END IF;
  IF category_text ~ 'raciocínio lógico' OR detail_text ~ 'raciocínio lógico' THEN
    IF content_text ~ 'proposi|conectivo lógico|tabela verdade' THEN RETURN ARRAY['raciocinio-logico','logica-proposicional']; END IF;
    RETURN ARRAY['raciocinio-logico','fundamentos'];
  END IF;
  IF category_text ~ 'matemática|estatística' OR detail_text ~ 'matemática|estatística' THEN
    IF content_text ~ 'estatística|média|mediana|desvio' THEN RETURN ARRAY['matematica-estatistica','estatistica-descritiva']; END IF;
    IF content_text ~ 'probabilidade' THEN RETURN ARRAY['matematica-estatistica','probabilidade']; END IF;
    RETURN ARRAY['matematica-estatistica','matematica-basica'];
  END IF;
  IF category_text ~ 'inovação|tecnologia' OR content_text ~ 'transferência de tecnologia|propriedade intelectual|marco legal de ct&i|design thinking' THEN
    IF content_text ~ 'design thinking' THEN RETURN ARRAY['inovacao-tecnologia','design-thinking']; END IF;
    IF content_text ~ 'marco legal|lei nº 13\.243|encomenda tecnológica' THEN RETURN ARRAY['inovacao-tecnologia','marco-legal-cti']; END IF;
    RETURN ARRAY['inovacao-tecnologia','transferencia-tecnologia'];
  END IF;
  IF category_text ~ 'modelos de negócio' OR content_text ~ 'modelo de negócio|business model canvas' THEN RETURN ARRAY['modelos-negocio','canvas']; END IF;
  IF category_text ~ 'sociologia rural' OR content_text ~ 'agroecologia|desenvolvimento rural' THEN RETURN ARRAY['sociologia-desenvolvimento-rural','territorio-agroecologia']; END IF;

  RETURN ARRAY['etica-compliance','fundamentos'];
END $$;

WITH classified AS (
  SELECT q.id,gabarita_question_taxonomy(
    q.metadata->>'category',q.metadata->>'topic',q.detailed_topic,q.metadata->>'reference',q.statement,q.explanation
  ) path FROM questions q
), resolved AS (
  SELECT c.id,s.id subject_id,s.name subject_name,t.id topic_id,t.name topic_name
  FROM classified c
  JOIN subjects s ON s.slug=c.path[1] AND s.exam_id IS NULL
  JOIN topics t ON t.subject_id=s.id AND t.slug=c.path[2]
)
UPDATE questions q SET
  subject_id=r.subject_id,
  topic_id=r.topic_id,
  metadata=jsonb_set(jsonb_set(q.metadata,'{category}',to_jsonb(r.subject_name),true),'{topic}',to_jsonb(r.topic_name),true),
  updated_at=now()
FROM resolved r WHERE q.id=r.id;

DROP FUNCTION gabarita_question_taxonomy(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT);

ALTER TABLE topics ADD CONSTRAINT topics_id_subject_unique UNIQUE(id,subject_id);
ALTER TABLE questions ADD CONSTRAINT questions_topic_belongs_to_subject
  FOREIGN KEY(topic_id,subject_id) REFERENCES topics(id,subject_id) NOT VALID;
ALTER TABLE questions VALIDATE CONSTRAINT questions_topic_belongs_to_subject;
ALTER TABLE questions ADD CONSTRAINT published_questions_require_taxonomy CHECK(
  status NOT IN ('ACTIVE','ANNULLED') OR (subject_id IS NOT NULL AND topic_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS subjects_area_position_idx ON subjects(area,position,name) WHERE active;
CREATE INDEX IF NOT EXISTS topics_subject_position_idx ON topics(subject_id,position,name) WHERE active;

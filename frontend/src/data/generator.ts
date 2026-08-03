import { Question, StudySection, ScheduleWeek, StudyBlock, QuestionCategory } from '../types';
import { studySections as defaultSeplagSections } from './studyData';
import { quizQuestions as defaultSeplagQuestions } from './quizData';
import { getJournalismQuestions } from './questionsJournalism';
import { deduplicateQuestions } from './questionGenerator';
import { tecnicoEnfermagemFgvEbserhQuestions } from './questionsTecnicoEnfermagemFGV';
import { filterQuestionsByBoards } from '../questionBanks';

// Curriculum structure and questions database for all 3 courses
export interface CourseTopic {
  id: string;
  title: string;
  category: string;
  subtopics: string[];
}

const TECHNOLOGY_SPECIFIC_TOPICS: CourseTopic[] = [
  {
    id: 'especificos_tecnologia_informacao',
    title: 'Tecnologia da Informação',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Lógica e programação',
      '1.1 Algoritmos básicos, scripts, versionamento e boas práticas',
      '2. Bancos de dados e SQL',
      '2.1 Modelagem, integridade e consultas',
      '3. Integração de sistemas e APIs',
      '3.1 Conceitos e automação de fluxos',
      '4. ETL/ELT e pipelines de dados',
      '4.1 Ingestão, transformação, qualidade, governança e rastreabilidade',
      '5. BI e dashboards',
      '5.1 Camada semântica, consistência de métricas e relatórios automatizados',
      '6. Segurança e LGPD aplicada',
      '6.1 Controle de acesso, logs, minimização e boas práticas no setor público',
      '7. Automação de indicadores e bibliometria computacional',
      '8. Gestão de Redes e Gestão de Equipes de TI',
      '9. Gerenciamento de Projetos de Tecnologia da Informação e Comunicação',
      '10. Uso de big data e ciência de dados em avaliação',
      '10.1 Integração e vinculação de bases; qualidade e governança de dados; documentação, rastreabilidade e auditorabilidade; privacidade e proteção de dados; potenciais e limites de análises baseadas em grandes bases administrativas e registros digitais',
    ],
  },
  {
    id: 'especificos_sistemas_operacionais',
    title: 'Sistemas Operacionais',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Conceitos e configurações básicas de MS Windows Server 2025 (LTSC): DNS, DHCP, Exchange, Active Directory, GPO, failover clustering, Kerberos, NTLM, file server, replicação e desduplicação; e Linux: sistemas de arquivos EXT4, BTRFS e XFS, conceitos de LVM e gerenciamento de processos',
      '2. Gerenciamento de memória, processos, entrada e saída',
      '2.1 Conceitos de processos e threads',
      '2.2 Memória real e virtual, paginação, segmentação, segmentação com paginação e swap',
      '2.3 Tipos de processamento: batch e transacional',
      '2.4 Administração de usuários, grupos, permissões e controles de acesso',
      '3. Noções de serviços de diretórios (LDAP)',
      '4. Virtualização de servidores',
      '5. Ferramentas de alta disponibilidade',
      '6. Contêineres e orquestração',
      '7. Contingência e continuidade de serviços',
      '8. Sistema Eletrônico de Informações (SEI) — parte operacional',
    ],
  },
  {
    id: 'especificos_desenvolvimento_sistemas',
    title: 'Desenvolvimento de Sistemas',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Projeto e desenvolvimento de sistemas em Java, AngularJS, TypeScript, Python e Framework Hibernate',
      '2. Interoperabilidade de sistemas (APIs), SOA e web services',
      '3. Controles e testes de segurança para aplicações web',
      '4. Portais corporativos, JSON; padrões HTML, xHTML, XML e CSS',
      '5. Modelo de Acessibilidade do Governo Eletrônico',
    ],
  },
  {
    id: 'especificos_engenharia_software',
    title: 'Engenharia de Software',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Fundamentos de engenharia de software: engenharia de requisitos, processos de desenvolvimento em cascata e iterativo, projeto orientado a objetos, testes e validação',
      '2. Medição e estimativas de projetos de software: análise e processo de contagem de pontos de função, funções de dados e transacionais e fatores de ajuste',
      '3. Processo de desenvolvimento de software',
      '3.1 Processo unificado: noções de RUP, disciplinas, fases, papéis, atividades e artefatos',
      '3.2 Processo ágil: conceito e metodologia Scrum',
    ],
  },
  {
    id: 'especificos_banco_dados_gestao_informacao',
    title: 'Banco de Dados e Gestão da Informação',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Fundamentos: finalidades, níveis de abstração, modelagem de dados e modelagem funcional',
      '2. Administração de dados: fundamentos; dado, informação, conhecimento e inteligência; modelos e níveis de abstração; metadados; linguagens de definição e manipulação de dados; normalização',
      '3. Administração de banco de dados: fundamentos, SGBDs, organização de arquivos, técnicas de armazenamento, métodos de acesso, tipos e projeto de bancos de dados',
      '4. Soluções de suporte à decisão: data warehouse, OLAP, data mining e business intelligence (BI)',
    ],
  },
  {
    id: 'especificos_seguranca_informacao',
    title: 'Segurança da Informação',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Gestão de segurança da informação: NBR ISO/IEC 27001 e NBR ISO/IEC 27002',
      '2. Métodos de autenticação',
      '2.1 Autenticação de dois fatores (2FA), biometria, token e certificados',
      '2.2 Protocolos OAuth 2.0, OpenID Connect e JWT',
      '3. Ameaças e vulnerabilidades: SQL/LDAP injection, XSS, quebra de autenticação e de sessão, referência insegura a objetos, CSRF e armazenamento inseguro de dados criptografados',
      '4. Segurança de aplicativos web, análise de vulnerabilidades, OWASP e técnicas de proteção',
      '5. Prevenção e combate a DDoS, DoS, DNS spoofing, eavesdropping, phishing, brute force e port scanning',
      '6. Criptografia e proteção de dados em trânsito e em repouso; sistemas simétricos, assimétricos e principais protocolos',
      '7. Assinatura e certificação digital',
      '8. Gestão de riscos e continuidade de negócio: NBR ISO/IEC 27005',
      '9. Lei nº 13.709/2018 e suas alterações — Lei Geral de Proteção de Dados Pessoais (LGPD)',
    ],
  },
  {
    id: 'especificos_fiscalizacao_contratos_ti',
    title: 'Fiscalização de Contratos de TI',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Gestão de contratação de soluções de TI',
      '2. Legislação aplicável à contratação de bens e serviços de TI',
      '2.1 Lei nº 13.303/2016 e suas alterações',
      '3. Elaboração e fiscalização de contratos de tecnologia da informação',
      '3.1 Critérios de remuneração por esforço versus produto',
      '3.2 Cláusulas e indicadores de nível de serviço',
      '3.3 Papel do fiscalizador do contrato',
      '3.4 Papel do preposto da contratada',
      '3.5 Acompanhamento da execução contratual',
      '3.6 Registro e notificação de irregularidades',
      '3.7 Definição e aplicação de penalidades e sanções administrativas',
      '3.8 Contratações de serviços de TI baseadas em UST, pontos de função e postos de trabalho com níveis de serviço',
    ],
  },
  {
    id: 'especificos_ciencia_dados',
    title: 'Ciência de Dados',
    category: 'Conhecimentos Específicos',
    subtopics: [
      '1. Manipulação, tratamento e visualização de dados',
      '1.1 Técnicas de visualização de dados',
      '1.2 Tratamento de valores faltantes',
      '1.3 Tratamento de dados categóricos',
      '1.4 Normalização numérica',
      '1.5 Detecção e tratamento de outliers',
      '1.6 Dataframes com Python Pandas: leitura, seleção, agregação, valores faltantes, duplicados e junção',
      '2. Aprendizado supervisionado: regressão e classificação',
      '2.1 Métricas de avaliação',
      '2.2 Overfitting e underfitting',
      '2.3 Regularização',
      '2.4 Seleção de modelos e erro de generalização',
      '2.5 Validação cruzada',
      '2.6 Conjuntos de treino, validação e teste',
      '2.7 Trade-off entre variância e viés',
      '2.8 Regressão linear e regressão logística',
      '2.9 Árvores de decisão e random forests',
      '2.10 Máquina de vetores de suporte (SVM)',
      '2.11 Naive Bayes',
      '2.12 K-NN',
      '2.13 Ensembles',
      '2.14 Aprendizado supervisionado com Python scikit-learn',
      '2.15 Otimização de hiperparâmetros',
      '3. Aprendizado não supervisionado',
      '3.1 Redução de dimensionalidade: PCA',
      '3.2 Agrupamento K-means',
      '3.3 Mistura de gaussianas',
      '3.4 Agrupamento hierárquico',
      '3.5 Regras de associação',
      '3.6 Aprendizado não supervisionado com Python scikit-learn',
      '4. Redes neurais artificiais',
      '4.1 Noções de redes neurais artificiais: definições e arquitetura',
      '4.2 Funções de ativação',
      '4.3 Otimização: gradiente, gradiente estocástico, backpropagation, inicialização de pesos e vanishing gradients',
      '4.4 Regularização com normas L1 e L2, dropout e early stopping',
      '4.5 Noções de redes neurais convolucionais',
      '4.6 Noções de redes neurais recorrentes',
      '4.7 Treino de redes neurais com Keras e PyTorch',
    ],
  },
];

const TECHNOLOGY_SPECIFIC_TOPIC_IDS = new Set(TECHNOLOGY_SPECIFIC_TOPICS.map(topic => topic.id));

const TECHNOLOGY_SPECIFIC_STUDY_SECTIONS: StudySection[] = TECHNOLOGY_SPECIFIC_TOPICS.map(topic => ({
  id: topic.id,
  title: topic.title.replace('Conhecimentos Específicos: ', ''),
  icon: 'Terminal',
  color: 'slate',
  difficulty: 'Difícil',
  weight: 'Específico',
  paretoJustification: 'Conteúdo integrante dos conhecimentos específicos do Cargo 5 — Gestor Especializado em Ciência e Tecnologia, especialidade Tecnologia da Informação.',
  cards: topic.subtopics.map((subtopic, index) => ({
    id: `${topic.id}-${index + 1}`,
    title: subtopic,
    paretoRatio: 'Conteúdo do edital',
    isQuente: true,
    content: `<p>Estude este item do edital com foco nos conceitos, aplicações práticas, diferenças entre tecnologias e resolução de questões da banca.</p><p><strong>Assunto:</strong> ${subtopic}.</p>`,
    keyTakeaways: [
      `Dominar os conceitos e a aplicação de ${subtopic.replace(/^\d+(?:\.\d+)?\.\s*/, '')}.`,
      'Revisar definições, casos de uso, limitações e boas práticas relacionadas ao assunto.',
      'Resolver questões e registrar os erros recorrentes para revisão espaçada.',
    ],
    materials: [subtopic],
  })),
}));

const COMMON_BASIC_TOPICS: CourseTopic[] = [
  {
    id: 'portugues',
    title: 'Língua Portuguesa',
    category: 'Português',
    subtopics: [
      '1. Compreensão e interpretação de textos de gêneros variados',
      '2. Reconhecimento de tipos e gêneros textuais',
      '3. Domínio da ortografia oficial',
      '4. Domínio dos mecanismos de coesão textual',
      '4.1 Emprego de referenciação, substituição, repetição, conectores e elementos de sequenciação textual',
      '4.2 Emprego de tempos e modos verbais',
      '5. Domínio da estrutura morfossintática do período',
      '5.1 Emprego das classes de palavras',
      '5.2 Relações de coordenação entre orações e entre termos da oração',
      '5.3 Relações de subordinação entre orações e entre termos da oração',
      '5.4 Emprego dos sinais de pontuação',
      '5.5 Concordância verbal e nominal',
      '5.6 Regência verbal e nominal',
      '5.7 Emprego do sinal indicativo de crase',
      '5.8 Colocação dos pronomes átonos',
      '6. Reescrita de frases e parágrafos do texto',
      '6.1 Significação das palavras',
      '6.2 Substituição de palavras ou de trechos de texto',
      '6.3 Reorganização da estrutura de orações e de períodos do texto',
      '6.4 Reescrita de textos de diferentes gêneros e níveis de formalidade',
    ],
  },
  {
    id: 'etica_servico_publico',
    title: 'Ética no Serviço Público',
    category: 'Ética e Compliance',
    subtopics: [
      '1. Ética e moral',
      '2. Ética, princípios e valores',
      '3. Ética e democracia: exercício da cidadania',
      '4. Ética e função pública',
      '5. Ética no setor público',
      '5.1 Lei Estadual nº 6.754/2006 — Código de Ética Funcional do Servidor Público do Estado de Alagoas',
    ],
  },
  {
    id: 'legislacao_estadual',
    title: 'Legislação Estadual',
    category: 'Ética e Compliance',
    subtopics: [
      '1. Constituição do Estado de Alagoas',
      '2. Lei Estadual nº 5.247/1991 e suas alterações — Regime Jurídico Único dos Servidores Públicos Civis do Estado de Alagoas, das Autarquias e Fundações Públicas Estaduais',
    ],
  },
  {
    id: 'ti_basica',
    title: 'Noções de Informática',
    category: 'TI Básica',
    subtopics: [
      '1. Noções de sistema operacional (ambiente Windows)',
      '2. Edição de textos, planilhas e apresentações (ambiente Microsoft Office)',
      '3. Redes de computadores',
      '3.1 Conceitos, ferramentas, aplicativos e procedimentos de Internet e intranet',
      '3.2 Navegadores: Microsoft Edge, Mozilla Firefox, Google Chrome e similares',
      '3.3 Correio eletrônico: Microsoft Outlook',
      '3.4 Sítios de busca e pesquisa na Internet',
      '3.5 Grupos de discussão',
      '3.6 Redes sociais',
      '3.7 Computação na nuvem (cloud computing)',
      '4. Organização e gerenciamento de informações, arquivos, pastas e programas',
      '5. Segurança da informação',
      '5.1 Procedimentos de segurança',
      '5.2 Malware, vírus, worms e outras pragas virtuais',
      '5.3 Aplicativos de segurança: antivírus, firewall, anti-spyware e similares',
      '5.4 Procedimentos de backup',
      '5.5 Armazenamento de dados na nuvem (cloud storage)',
      'Criptografia e proteção de dados',
    ],
  },
  {
    id: 'marco_legal_cti',
    title: 'Marco Legal de CT&I',
    category: 'Ética e Compliance',
    subtopics: [
      '1. Fundamentos constitucionais de CT&I e inovação — EC nº 85/2015',
      '2. Lei nº 10.973/2004 — Lei de Inovação',
      '2.1 Objetivos, conceitos, atores e instrumentos da Lei de Inovação',
      '3. Lei nº 13.243/2016 — Marco Legal de CT&I',
      '3.1 Principais alterações e impactos práticos para parcerias e instrumentos',
      '4. Decreto nº 9.283/2018 — regulamentação federal',
      '4.1 Operacionalização dos instrumentos, salvaguardas e mecanismos de apoio',
      '5. Encomenda Tecnológica (ETEC)',
      '5.1 Conceito, risco tecnológico, elementos estruturantes e lógica da ETEC',
      '6. Decreto nº 10.534/2020 — Política Nacional de Inovação',
      '7. Instrumentos correlatos',
      '7.1 Lei nº 11.196/2005 — Lei do Bem',
      '7.2 Lei Complementar nº 182/2021 — Marco Legal das Startups',
      '8. Legislação estadual correlata de CT&I e inovação em Alagoas',
      '8.1 Lei Estadual nº 8.956/2023 — Política Estadual de CT&I e estrutura do Sistema Estadual',
      '9. Decreto Estadual nº 95.265/2024 — mecanismos de estímulo à inovação',
    ],
  },
  {
    id: 'legislacao_especifica_fapeal',
    title: 'Legislações Específicas — FAPEAL',
    category: 'Ética e Compliance',
    subtopics: [
      '1. Lei nº 8.956/2023 — Política Estadual de Ciência, Tecnologia e Inovação de Alagoas',
      '2. Lei Delegada nº 48/2022 — modelo de gestão estadual e estrutura de cargos da FAPEAL',
      '3. Lei nº 7.117/2009 — incentivos à pesquisa, inovação e proteção da propriedade intelectual em Alagoas',
      '4. Lei nº 6.527/2004 — carreira dos profissionais da FAPEAL',
      '5. Lei Complementar nº 20/2002 — reestruturação da FAPEAL e transformação de sua natureza jurídica',
      '6. Lei nº 5.247/1991 — Regime Jurídico Único dos servidores públicos civis de Alagoas',
      '7. Lei Complementar nº 5/1990 — criação da FAPEAL',
      '8. Decreto nº 4.137/2009 — Estatuto da FAPEAL',
    ],
  },
  {
    id: 'alagoas',
    title: 'Conhecimentos do Estado de Alagoas',
    category: 'Conhecimentos de Alagoas',
    subtopics: [
      '1. Formação histórica de Alagoas',
      '1.1 Colonização portuguesa',
      '1.2 Economia açucareira',
      '1.3 Emancipação política da Capitania de Pernambuco em 1817',
      '1.4 Elevação a província em 1821',
      '2. Quilombo dos Palmares',
      '2.1 Formação no período colonial',
      '2.2 Resistência à escravidão',
      '2.3 Liderança de Zumbi dos Palmares',
      '3. Aspectos geográficos',
      '3.1 Litoral, zona da mata, agreste e sertão',
      '3.2 Rio São Francisco',
      '4. Organização político-administrativa',
      '4.1 Maceió como capital estadual',
      '4.2 Municípios',
      '4.3 Poderes Executivo, Legislativo e Judiciário',
      '5. Economia estadual',
      '5.1 Agroindústria canavieira',
      '5.2 Turismo',
      '5.3 Setor de serviços',
      '6. Cultura e patrimônio',
      '6.1 Manifestações culturais populares',
      '6.2 Patrimônio histórico-cultural alagoano',
    ],
  },
  {
    id: 'ingles',
    title: 'Língua Inglesa',
    category: 'Língua Inglesa',
    subtopics: [
      '1. Compreensão de textos variados: vocabulário, estrutura, ideias explícitas e implícitas e relações textuais',
      '2. Itens gramaticais relevantes para a compreensão de conteúdos semânticos',
      '3. Conhecimento e uso das formas contemporâneas da língua inglesa',
    ],
  },
];

const POLICE_BASIC_TOPICS: CourseTopic[] = [
  {
    ...COMMON_BASIC_TOPICS.find(topic => topic.id === 'portugues')!,
    subtopics: [...COMMON_BASIC_TOPICS.find(topic => topic.id === 'portugues')!.subtopics],
  },
  {
    id: 'pc_ti_seguranca_cibernetica',
    title: 'Tecnologia da Informação e Segurança Cibernética',
    category: 'TI Básica',
    subtopics: [
      'I.1 Noções de sistema operacional: ambientes Linux e Windows',
      'I.2 Edição de textos, planilhas e apresentações: pacotes Microsoft Office',
      'I.3 Redes de computadores',
      'I.3.1 Conceitos básicos, ferramentas, aplicativos e procedimentos de Internet e intranet',
      'I.3.2 Programas de navegação: Microsoft Edge e Google Chrome',
      'I.3.3 Programas de correio eletrônico: Microsoft Outlook',
      'I.3.4 Sítios de busca e pesquisa na Internet',
      'I.3.5 Grupos de discussão',
      'I.3.6 Computação na nuvem (cloud computing)',
      'I.4 Organização e gerenciamento de informações, arquivos, pastas e programas',
      'I.5 Segurança da informação',
      'I.5.1 Procedimentos de segurança',
      'I.5.2 Noções de vírus, worms e pragas virtuais',
      'I.5.3 Aplicativos de segurança: antivírus, firewall, anti-spyware e similares',
      'I.5.4 Procedimentos de backup',
      'I.5.5 Armazenamento de dados na nuvem (cloud storage)',
      'I.6 Banco de dados',
      'I.6.1 Organização de arquivos e métodos de acesso',
      'I.6.2 Abstração e modelos de dados',
      'I.6.3 Sistemas gerenciadores de banco de dados',
      'I.6.4 Linguagens de definição e manipulação de dados',
      'I.6.5 SQL',
      'I.6.6 Controle de proteção, segurança e integridade',
      'I.6.7 Bancos de dados distribuídos e orientados a objetos',
      'I.7 Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)',
      'I.8 Serviços públicos digitais',
      'I.9 Inteligência Artificial',
      'I.10 Linguagens de programação: Java, Python, Apex e C#',
      'II.1 Fundamentos de Segurança da Informação',
      'II.1.1 Princípio da confidencialidade',
      'II.1.2 Integridade',
      'II.1.3 Disponibilidade',
      'II.2 Gestão de Riscos e Conformidade',
      'II.2.1 Avaliação de riscos',
      'II.2.2 Políticas de segurança',
      'II.2.3 Conformidade com normas e regulamentações',
      'II.3 Segurança de Rede',
      'II.3.1 Firewalls, IDS/IPS, VPNs e segmentação de rede',
      'II.4 Criptografia',
      'II.4.1 Técnicas de criptografia e principais ferramentas',
      'II.5 Segurança em Nuvem',
      'II.5.1 Práticas de segurança para ambientes de nuvem',
      'II.6 Gestão de Identidades e Acesso: autenticação, autorização, SSO, SAML, OAuth2 e OpenID Connect',
      'II.7 Principais tipos de ataques e vulnerabilidades',
      'II.8 Controles e testes de segurança para aplicações Web e Web Services',
      'II.9 Soluções de Segurança da Informação: Firewall, IDS, IPS, SIEM, Proxy, IAM, PAM, antivírus e antispam',
      'II.10 Frameworks de segurança: MITRE, CIS Controls e NIST Cybersecurity Framework (NIST CSF)',
      'II.11 Tratamento de Incidentes Cibernéticos',
      'II.12 Assinatura e certificação digital, criptografia e proteção de dados em trânsito e em repouso',
      'II.13 Segurança em nuvens e de contêineres',
    ],
  },
  {
    id: 'pc_raciocinio_logico_matematico',
    title: 'Raciocínio Lógico-Matemático',
    category: 'Raciocínio Lógico-Matemático',
    subtopics: [
      '1. Princípios de contagem',
      '2. Razões e proporções',
      '3. Regras de três simples',
      '4. Porcentagens',
      '5. Equações de 1º e de 2º graus',
      '6. Sequências numéricas',
      '7. Progressões aritméticas e geométricas',
      '8. Funções e gráficos',
      '9. Estruturas lógicas',
      '10. Lógica de argumentação',
      '10.1 Analogias, inferências, deduções e conclusões',
      '11. Lógica sentencial ou proposicional',
      '11.1 Proposições simples e compostas',
      '11.2 Tabelas-verdade',
      '11.3 Equivalências',
      '11.4 Leis de De Morgan',
      '11.5 Diagramas lógicos',
      '12. Lógica de primeira ordem',
      '13. Princípios de contagem e probabilidade',
      '14. Operações com conjuntos',
      '15. Raciocínio lógico envolvendo problemas aritméticos, geométricos e matriciais',
    ],
  },
  {
    id: 'pc_direitos_humanos',
    title: 'Noções de Direitos Humanos',
    category: 'Noções de Direitos Humanos',
    subtopics: [
      '1. Teoria geral dos direitos humanos',
      '1.1 Conceitos, terminologia, estrutura normativa e fundamentação',
      '2. Afirmação histórica dos direitos humanos',
      '3. Direitos humanos e responsabilidade do Estado',
      '4. Direitos humanos na Constituição Federal',
      '5. Política Nacional de Direitos Humanos',
      '6. A Constituição brasileira e os tratados internacionais de direitos humanos',
      '7. Pacto de São José da Costa Rica e Decreto nº 678/1992 — Convenção Americana sobre Direitos Humanos',
    ],
  },
  {
    id: 'pc_atualidades',
    title: 'Atualidades',
    category: 'Atualidades',
    subtopics: [
      '1. Tópicos relevantes e atuais de segurança, transportes, política, economia, sociedade, educação, saúde, cultura, tecnologia, energia, relações internacionais, desenvolvimento sustentável e ecologia, suas inter-relações e vinculações históricas',
    ],
  },
  {
    ...COMMON_BASIC_TOPICS.find(topic => topic.id === 'etica_servico_publico')!,
    subtopics: [...COMMON_BASIC_TOPICS.find(topic => topic.id === 'etica_servico_publico')!.subtopics],
  },
];

const POLICE_SPECIFIC_TOPICS: CourseTopic[] = [
  {
    id: 'pc_direito_penal',
    title: 'Conhecimentos Específicos: Noções de Direito Penal',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Aplicação da lei penal',
      '1.1 Princípios',
      '1.2 Lei penal no tempo e no espaço',
      '1.3 Tempo e lugar do crime',
      '1.4 Lei penal excepcional, especial e temporária',
      '1.5 Contagem de prazo',
      '1.6 Irretroatividade da lei penal',
      '2. Crimes contra a pessoa',
      '3. Crimes contra o patrimônio',
      '4. Crimes contra a administração pública',
      '5. Disposições constitucionais aplicáveis ao direito penal',
    ],
  },
  {
    id: 'pc_direito_processual_penal',
    title: 'Conhecimentos Específicos: Noções de Direito Processual Penal',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Disposições preliminares do Código de Processo Penal',
      '2. Inquérito policial',
      '2.1 Histórico, natureza, conceito, finalidade, características, fundamento, titularidade, grau de cognição, valor probatório, formas de instauração, notitia criminis, delatio criminis, procedimentos investigativos, indiciamento, garantias do investigado e conclusão',
      '3. Prisão e liberdade provisória',
      '4. Disposições constitucionais aplicáveis ao direito processual penal',
      '5. Lei nº 9.099/1995 e suas alterações',
    ],
  },
  {
    id: 'pc_direito_constitucional',
    title: 'Conhecimentos Específicos: Noções de Direito Constitucional',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Constituição Federal de 1988',
      '1.1 Direitos e Garantias Fundamentais',
      '1.2 Título V, Capítulo III — Da Segurança Pública',
    ],
  },
  {
    id: 'pc_direito_administrativo',
    title: 'Conhecimentos Específicos: Noções de Direito Administrativo',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Organização administrativa',
      '1.1 Centralização, descentralização, concentração e desconcentração',
      '1.2 Administração direta e indireta',
      '1.3 Autarquias, fundações, empresas públicas e sociedades de economia mista',
      '2. Ato administrativo',
      '2.1 Conceito, requisitos, atributos, classificação e espécies',
      '3. Agente público',
      '3.1 Legislação pertinente',
      '3.1.1 Disposições constitucionais aplicáveis',
      '3.1.2 Cargo, emprego e função pública',
      '4. Poderes administrativos',
      '4.1 Poderes hierárquico, disciplinar, regulamentar e de polícia',
      '4.2 Uso e abuso do poder',
      '5. Licitações',
      '5.1 Princípios',
      '5.2 Contratação direta, dispensa e inexigibilidade',
      '5.3 Modalidades, tipos e procedimentos',
      '6. Controle da administração pública',
      '6.1 Controle judicial',
      '6.2 Controle legislativo',
      '7. Responsabilidade civil do Estado',
      '7.1 Responsabilidade por ato comissivo do Estado',
      '7.2 Responsabilidade por omissão do Estado',
      '7.3 Requisitos para a demonstração da responsabilidade do Estado',
      '7.4 Causas excludentes e atenuantes da responsabilidade do Estado',
    ],
  },
  {
    id: 'pc_legislacao_institucional_alagoas',
    title: 'Conhecimentos Específicos: Legislação Institucional do Estado de Alagoas',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Constituição do Estado de Alagoas',
      '2. Lei Estadual nº 3.437/1975 e suas alterações — Estatuto da Polícia Civil do Estado de Alagoas',
      '3. Lei Estadual nº 5.247/1991 e suas alterações — Regime Jurídico Único dos Servidores Públicos Civis do Estado de Alagoas, das Autarquias e das Fundações Públicas Estaduais',
      '4. Lei nº 3.437/1975 e suas alterações — Estatuto da Polícia Civil do Estado de Alagoas',
      '5. Lei nº 14.735 e suas alterações — Lei Orgânica Nacional das Polícias Civis',
      '6. Lei nº 6.441/2003 e suas alterações',
      '7. Lei Estadual nº 6.276/2001 e suas alterações',
      '8. Lei Estadual nº 6.479/2004',
      '9. Lei nº 10.826/2003 e suas alterações — Estatuto do Desarmamento',
      '10. Lei Estadual nº 4.590/1984',
    ],
  },
  {
    id: 'pc_legislacao_penal_especial',
    title: 'Conhecimentos Específicos: Legislação Penal Especial',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      '1. Crimes contra as finanças públicas',
      '2. Lei nº 11.343/2006 e suas alterações — tráfico ilícito e uso indevido de substâncias entorpecentes',
      '3. Lei nº 12.850/2013 e suas alterações — crime organizado',
      '4. Lei nº 7.492/1986 — crimes contra o Sistema Financeiro Nacional',
      '5. Lei nº 8.137/1990 e suas alterações — crimes contra a ordem econômica e tributária e as relações de consumo',
      '6. Lei nº 9.613/1998 e suas alterações — lavagem de dinheiro',
      '7. Lei nº 8.176/1991 — crimes contra a ordem econômica',
      '8. Lei nº 8.072/1990 e suas alterações — crimes hediondos',
      '9. Lei nº 7.716/1989 e suas alterações — crimes resultantes de preconceito de raça ou de cor',
      '10. Lei nº 9.455/1997 e suas alterações — crimes de tortura',
      '11. Lei nº 9.605/1998 e suas alterações — crimes contra o meio ambiente',
      '12. Crimes de responsabilidade: Decreto-Lei nº 201/1967, Lei nº 1.079/1950 e Lei nº 8.176/1991, com suas alterações',
      '13. Lei nº 11.101/2005 e suas alterações — crimes falimentares',
      '14. Lei nº 14.133/2021 — crimes em licitações e contratos administrativos',
      '15. Lei nº 13.869/2019 — crimes de abuso de autoridade',
      '15. Convenção de Budapeste: Decreto nº 11.491/2023 — Convenção sobre o Crime Cibernético',
      '16. Lei nº 13.146/2015 e suas alterações — crimes previstos no Estatuto da Pessoa com Deficiência',
      '17. Lei nº 10.741/2003 e suas alterações — crimes cometidos contra a pessoa idosa',
    ],
  },
  {
    id: 'pc_contabilidade_analise_financeira',
    title: 'Conhecimentos Específicos: Noções de Contabilidade, Análise Financeira e Crimes contra a Ordem Tributária',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      'I.1 Conceitos, objetivos e finalidades da contabilidade',
      'I.2 Patrimônio: componentes, equação fundamental, situação líquida e representação gráfica',
      'I.3 Atos e fatos administrativos: conceitos; fatos permutativos, modificativos e mistos',
      'I.4 Contas: conceitos, contas de débitos, contas de créditos e saldos',
      'I.5 Plano de contas: conceitos, elenco, função e funcionamento das contas',
      'I.6 Contabilização de operações contábeis diversas',
      'I.7 Análise e conciliações contábeis: composição e análise de contas e conciliação bancária',
      'I.8 Balancete de verificação: conceitos, modelos e técnicas de elaboração',
      'I.9 Balanço patrimonial: conceitos, objetivo e composição',
      'I.10 Demonstração do resultado do exercício: conceito, objetivo e composição',
      'I.11 Noções de finanças',
      'I.12 Noções de orçamento',
      'I.13 Noções de tributos e seus impactos nas operações das empresas',
      'II.1 Métodos de análise financeira',
      'II.2 Ferramentas de análise financeira',
      'II.3 Gestão de risco financeiro',
      'II.4 Identificação de riscos financeiros',
      'II.5 Estratégias de mitigação',
      'II.6 Monitoramento contínuo de riscos',
      'III.1 Crimes de lavagem de dinheiro ou ocultação de bens, direitos e valores',
      'III.1.1 Lei nº 9.613/1998 e suas alterações — principais dispositivos e sanções',
      'III.2 Fraude a credores em processos de recuperação judicial, extrajudicial e falência',
      'III.3 Crimes contra a previdência social',
      'III.4 Crimes contra as finanças públicas',
      'III.5 Crimes contra o Sistema Financeiro Nacional',
      'III.6 Crimes contra o mercado de capitais',
      'III.7 Comparação entre fluxos financeiros e capacidade econômica declarada',
      'III.8 Indícios de fraudes contábeis e ocultação de patrimônio',
      'III.9 Transações fracionadas para evitar detecção (smurfing)',
      'III.10 Transferências entre contas de empresas fictícias',
      'III.11 Uso de laranjas e interpostas pessoas para movimentação de recursos',
      'III.12 Saques e depósitos de valores elevados sem justificativa',
      'III.13 Movimentações incompatíveis com a renda declarada',
      'III.13 Lei nº 8.137/1990 e suas alterações — crimes contra a ordem tributária',
    ],
  },
  {
    id: 'pc_estatistica_analise_dados',
    title: 'Conhecimentos Específicos: Estatística e Análise de Dados',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      'I.1 Estatística descritiva e análise exploratória: gráficos, diagramas, tabelas e medidas de posição, dispersão, assimetria e curtose',
      'I.2 Probabilidade',
      'I.2.1 Probabilidade e probabilidade condicional',
      'I.2.2 Conceitos básicos de probabilidade',
      'I.2.3 Cálculo de probabilidades condicionais',
      'I.2.4 Definições básicas e axiomas',
      'I.2.5 Probabilidade condicional e independência',
      'I.2.6 Variáveis aleatórias discretas e contínuas',
      'I.2.7 Distribuições de probabilidades',
      'I.2.8 Função de probabilidade',
      'I.2.9 Função densidade de probabilidade',
      'I.2.10 Esperança e momentos',
      'I.2.11 Distribuições especiais',
      'I.2.12 Distribuições condicionais e independência',
      'I.2.13 Transformação de variáveis',
      'I.2.14 Leis dos grandes números',
      'I.2.15 Teorema central do limite',
      'I.2.16 Amostras aleatórias',
      'I.2.17 Distribuições amostrais',
      'I.2.18 Independência de eventos, Regra de Bayes e Teorema da Probabilidade Total',
      'I.2.19 Conceito de independência',
      'I.2.20 Aplicação da Regra de Bayes',
      'I.2.21 Uso do Teorema da Probabilidade Total',
      'I.2.21 Variáveis aleatórias e funções de probabilidade',
      'I.2.21.1 Definição e exemplos de variáveis aleatórias',
      'I.2.21.2 Função de probabilidade para variáveis discretas e função densidade para variáveis contínuas',
      'I.2.22 Principais distribuições de probabilidade discretas e contínuas',
      'I.2.22.1 Distribuição uniforme',
      'I.2.22.2 Distribuição de Bernoulli',
      'I.2.22.3 Distribuição binomial',
      'I.2.22.4 Distribuição normal',
      'I.2.23 Medidas de tendência central',
      'I.2.23.1 Médias aritmética, ponderada, geométrica e harmônica',
      'I.2.23.2 Mediana',
      'I.2.23.3 Moda',
      'I.2.24 Medidas de dispersão',
      'I.2.24.1 Amplitude',
      'I.2.24.2 Variância',
      'I.2.24.3 Desvio padrão',
      'I.2.24.4 Coeficiente de variação',
      'I.2.25 Coeficiente de Correlação de Pearson',
      'I.2.25.1 Conceito e cálculo da correlação entre duas variáveis',
      'I.2.26 Teorema Central do Limite',
      'I.2.26.1 Importância do teorema para a distribuição amostral da média',
      'I.2.27 Regra Empírica ou Regra dos Três Sigma da distribuição normal',
      'I.2.27.1 Aproximação da dispersão dos dados na distribuição normal',
      'I.2.28 Técnicas de amostragem',
      'I.2.29 Amostragem aleatória simples, estratificada, sistemática e por conglomerados',
      'I.2.29.1 Conceitos básicos para determinação do tamanho amostral',
      'I.3 Inferência estatística',
      'I.3.1 Estimação pontual: métodos, propriedades dos estimadores e suficiência',
      'I.3.2 Estimação intervalar: intervalos de confiança e de credibilidade',
      'I.3.3 Testes de hipóteses: hipóteses simples e compostas, significância, potência, teste t de Student e teste qui-quadrado',
      'I.4 Análise de regressão linear',
      'I.4.1 Critérios de mínimos quadrados e de máxima verossimilhança',
      'I.4.2 Modelos de regressão linear',
      'I.4.3 Inferência sobre os parâmetros do modelo',
      'I.4.4 Análise de variância',
      'I.4.5 Análise de resíduos',
      'I.5 Técnicas de amostragem: aleatória simples, estratificada, sistemática e por conglomerados',
      'I.5.1 Tamanho amostral',
      'II.1 Dados estruturados e não estruturados; dados abertos; coleta, tratamento, armazenamento, integração e recuperação; ETL; XML, JSON e CSV; representação de dados e aritmética computacional',
      'II.2 Exploração e mineração de dados: CRISP-DM, pré-processamento, classificação, regras de associação, clusterização, detecção de anomalias e modelagem preditiva',
      'II.3 Processamento de Linguagem Natural: semântica vetorial, redução de dimensionalidade, tópicos latentes, classificação de textos, sentimentos e n-gramas',
      'II.4 Machine Learning: erros, validação, avaliação, underfitting, overfitting, regularização, hiperparâmetros, separabilidade, redução de dimensionalidade, modelos lineares, árvores, redes neurais e Naive Bayes',
      'II.5 Python: sintaxe, variáveis, tipos, controle de fluxo, estruturas de dados, funções, arquivos, NLTK, TensorFlow, Pandas, NumPy, scikit-learn e SciPy',
    ],
  },
  {
    id: 'pc_crimes_ciberneticos_seguranca_digital',
    title: 'Conhecimentos Específicos: Crimes Cibernéticos e Segurança Digital',
    category: 'Conhecimentos Específicos - Polícia Civil',
    subtopics: [
      'I.1 Lei nº 12.737/2012',
      'I.2 Conceito e classificação de crimes cibernéticos',
      'I.3 Requisitos legais e limites para busca e apreensão de itens digitais — artigo 240 e seguintes do CPP',
      'II.1 Privacidade',
      'II.2 Cuidados com redes sociais',
      'II.3 Autenticação',
      'II.3.1 Autenticação multifator (MFA)',
      'II.3.2 Senhas seguras',
      'II.4 Golpes virtuais',
      'II.4.1 Phishing',
      'II.5 Links suspeitos',
      'II.6 Malwares',
      'II.7 Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)',
    ],
  },
];

const policeSpecificTopic = (id: string) => {
  const topic = POLICE_SPECIFIC_TOPICS.find(item => item.id === id);
  if (!topic) throw new Error(`Assunto da Polícia Civil não encontrado: ${id}`);
  return topic;
};

const splitPoliceTopic = (
  sourceId: string,
  id: string,
  title: string,
  prefix: 'I.' | 'II.' | 'III.',
): CourseTopic => {
  const source = policeSpecificTopic(sourceId);
  return {
    ...source,
    id,
    title: `Conhecimentos Específicos: ${title}`,
    subtopics: source.subtopics.filter(subtopic => subtopic.startsWith(prefix)),
  };
};

const reorderNumberedGroups = (topic: CourseTopic, order: number[]): CourseTopic => ({
  ...topic,
  subtopics: topic.subtopics
    .map((subtopic, originalIndex) => ({
      subtopic,
      originalIndex,
      group: Number(subtopic.match(/^(\d+)/)?.[1] || Number.MAX_SAFE_INTEGER),
    }))
    .sort((a, b) => {
      const aOrder = order.indexOf(a.group);
      const bOrder = order.indexOf(b.group);
      const aRank = aOrder < 0 ? order.length : aOrder;
      const bRank = bOrder < 0 ? order.length : bOrder;
      return aRank - bRank || a.originalIndex - b.originalIndex;
    })
    .map(item => item.subtopic),
});

const prioritizePoliceSubtopics = (topic: CourseTopic, terms: string[]): CourseTopic => {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return {
    ...topic,
    subtopics: topic.subtopics
      .map((subtopic, originalIndex) => {
        const normalized = normalize(subtopic);
        const found = terms.findIndex(term => normalized.includes(normalize(term)));
        return { subtopic, originalIndex, rank: found < 0 ? terms.length : found };
      })
      .sort((a, b) => a.rank - b.rank || a.originalIndex - b.originalIndex)
      .map(item => item.subtopic),
  };
};

const financialPoliceTopic = (): CourseTopic => {
  const source = policeSpecificTopic('pc_contabilidade_analise_financeira');
  return prioritizePoliceSubtopics({
    ...splitPoliceTopic(
      'pc_contabilidade_analise_financeira',
      'pc_analise_financeira_crimes_tributarios',
      'Análise Financeira e Crimes contra a Ordem Tributária',
      'II.',
    ),
    subtopics: source.subtopics.filter(subtopic => subtopic.startsWith('II.') || subtopic.startsWith('III.')),
  }, [
    'métodos de análise', 'ferramentas de análise', 'gestão de risco', 'identificação de riscos',
    'mitigação', 'monitoramento', 'fluxos financeiros', 'capacidade econômica', 'fraudes contábeis',
    'empresas fictícias', 'laranjas', 'fracionadas', 'valores elevados', 'renda declarada',
    'lavagem de dinheiro', 'ordem tributária', 'previdência social', 'sistema financeiro',
    'finanças públicas', 'mercado de capitais', 'fraude a credores',
  ]);
};

// Trilha pedagógica: fundamentos jurídicos primeiro; conteúdos financeiros e de dados depois.
// Os conhecimentos básicos continuam sendo estudados em paralelo pelo motor do cronograma.
const POLICE_ORDERED_SPECIFIC_TOPICS: CourseTopic[] = [
  policeSpecificTopic('pc_direito_constitucional'),
  reorderNumberedGroups(policeSpecificTopic('pc_direito_administrativo'), [1, 3, 2, 4, 7, 6, 5]),
  reorderNumberedGroups(policeSpecificTopic('pc_legislacao_institucional_alagoas'), [1, 3, 2, 4, 5, 7, 6, 8, 9, 10]),
  prioritizePoliceSubtopics(policeSpecificTopic('pc_direito_penal'), [
    'princípios', 'aplicação da lei penal', 'tempo e no espaço', 'tempo e lugar', 'excepcional',
    'contagem de prazo', 'irretroatividade', 'crimes contra a pessoa', 'crimes contra o patrimônio',
    'administração pública', 'disposições constitucionais',
  ]),
  reorderNumberedGroups(policeSpecificTopic('pc_direito_processual_penal'), [1, 4, 2, 3, 5]),
  prioritizePoliceSubtopics(policeSpecificTopic('pc_legislacao_penal_especial'), [
    '11.343', '12.850', '9.613', '13.869', '8.072', '9.455', '7.716', '10.826',
    'sistema financeiro', 'ordem econômica e tributária', '8.176', '9.605', '14.133',
    '11.101', 'pessoa idosa', 'pessoa com deficiência', 'budapeste', 'finanças públicas',
    'crimes de responsabilidade',
  ]),
  prioritizePoliceSubtopics(
    splitPoliceTopic('pc_contabilidade_analise_financeira', 'pc_contabilidade', 'Noções de Contabilidade', 'I.'),
    ['conceitos, objetivos', 'patrimônio', 'contas:', 'atos e fatos', 'plano de contas', 'contabilização',
      'balancete', 'balanço patrimonial', 'resultado do exercício', 'conciliações', 'finanças', 'orçamento', 'tributos'],
  ),
  financialPoliceTopic(),
  prioritizePoliceSubtopics(
    splitPoliceTopic('pc_estatistica_analise_dados', 'pc_estatistica', 'Estatística', 'I.'),
    ['descritiva', 'tendência central', 'mediana', 'moda', 'dispersão', 'amplitude', 'variância',
      'desvio padrão', 'coeficiente de variação', 'probabilidade', 'bayes', 'variáveis aleatórias',
      'distribuições', 'normal', 'amostragem', 'intervalos de confiança', 'testes de hipóteses',
      'correlação', 'regressão linear'],
  ),
  splitPoliceTopic('pc_estatistica_analise_dados', 'pc_analise_dados', 'Análise de Dados', 'II.'),
  prioritizePoliceSubtopics(policeSpecificTopic('pc_crimes_ciberneticos_seguranca_digital'), [
    'privacidade', 'autenticação', 'senhas seguras', 'multifator', 'phishing', 'malwares',
    'links suspeitos', '13.709', 'conceito e classificação', '12.737', 'busca e apreensão',
  ]),
];

const POLICE_BASIC_STUDY_SECTIONS: StudySection[] = POLICE_BASIC_TOPICS.map((topic, learningOrder) => ({
  id: topic.id,
  title: topic.title.replace('Conhecimentos Específicos: ', ''),
  learningTrack: 'basic',
  learningOrder,
  icon: topic.id === 'portugues' || topic.id === 'pc_atualidades' ? 'BookOpen' : topic.id === 'etica_servico_publico' || topic.id === 'pc_direitos_humanos' ? 'Shield' : 'Cpu',
  color: 'blue',
  difficulty: 'Médio',
  weight: 'Básico',
  paretoJustification: 'Conteúdo integrante dos conhecimentos básicos do cargo de Policial Civil, conforme o programa da banca CEBRASPE.',
  cards: topic.subtopics.map((subtopic, index) => ({
    id: `${topic.id}-${index + 1}`,
    title: subtopic,
    paretoRatio: 'Conteúdo do edital',
    isQuente: true,
    content: `<p>Estude este item do edital com atenção aos conceitos, à aplicação prática e ao padrão de julgamento de itens da banca CEBRASPE.</p><p><strong>Assunto:</strong> ${subtopic}.</p>`,
    keyTakeaways: [
      `Dominar ${subtopic.replace(/^(?:I{1,2}\.)?\d+(?:\.\d+)*\s*/, '')}.`,
      'Identificar conceitos, exceções e relações que possam alterar o julgamento de itens certos ou errados.',
      'Resolver questões da banca e revisar os erros recorrentes.',
    ],
    materials: [subtopic],
  })),
}));

const POLICE_SPECIFIC_STUDY_SECTIONS: StudySection[] = POLICE_ORDERED_SPECIFIC_TOPICS.map((topic, learningOrder) => ({
  id: topic.id,
  title: topic.title.replace('Conhecimentos Específicos: ', ''),
  learningTrack: 'specific',
  learningOrder: learningOrder + 1,
  icon: topic.id.includes('dados') || topic.id.includes('contabilidade') ? 'Cpu' : 'Shield',
  color: 'slate',
  difficulty: 'Difícil',
  weight: 'Específico',
  paretoJustification: 'Conteúdo integrante dos conhecimentos específicos comuns aos cargos de Agente de Polícia e Escrivão de Polícia, conforme o programa da banca CEBRASPE.',
  cards: topic.subtopics.map((subtopic, index) => ({
    id: `${topic.id}-${index + 1}`,
    title: subtopic,
    paretoRatio: 'Conteúdo do edital',
    isQuente: true,
    content: `<p>Estude este item dos conhecimentos específicos com atenção à literalidade normativa, aos conceitos técnicos e ao padrão de julgamento da banca CEBRASPE.</p><p><strong>Assunto:</strong> ${subtopic}.</p>`,
    keyTakeaways: [
      `Dominar ${subtopic.replace(/^(?:I{1,3}\.)?\d+(?:\.\d+)*\s*/, '')}.`,
      'Identificar conceitos, requisitos, exceções e aplicações práticas relevantes para a atividade policial.',
      'Resolver itens CEBRASPE e revisar os erros recorrentes.',
    ],
    materials: [subtopic],
  })),
}));

export const DISCURSIVE_TOPIC_ID = 'atualidades_discursiva';

export const DISCURSIVE_TOPIC: CourseTopic = {
  id: DISCURSIVE_TOPIC_ID,
  title: 'Atualidades (somente para a prova discursiva)',
  category: 'Atualidades',
  subtopics: [
    'Segurança',
    'Transportes',
    'Política',
    'Economia',
    'Sociedade',
    'Educação',
    'Saúde',
    'Cultura',
    'Tecnologia',
    'Energia',
    'Relações internacionais',
    'Desenvolvimento sustentável',
    'Ecologia',
  ],
};

const ETHICS_PUBLIC_SERVICE_SECTION: StudySection = {
  id: 'etica_servico_publico',
  title: 'Ética no Serviço Público',
  icon: 'Shield',
  color: 'indigo',
  difficulty: 'Médio',
  weight: '10%',
  paretoJustification: 'O estudo combina os fundamentos de ética, moral, cidadania e função pública com a leitura orientada do Código de Ética Funcional dos servidores de Alagoas.',
  cards: [
    {
      id: 'etica-fundamentos-cidadania',
      title: 'Ética, moral, princípios, valores e cidadania',
      paretoRatio: 'Conhecimento básico',
      isQuente: true,
      content: '<p>Estude as diferenças entre ética e moral, a aplicação de princípios e valores e a relação entre ética, democracia, cidadania e exercício da função pública.</p>',
      keyTakeaways: [
        'Distinguir ética, moral, princípios e valores.',
        'Relacionar democracia e cidadania à conduta do agente público.',
        'Aplicar os deveres éticos a situações concretas da função pública.',
      ],
      materials: ['Ética e moral', 'Ética, democracia e cidadania'],
    },
    {
      id: 'etica-lei-6754-2006',
      title: 'Lei Estadual nº 6.754/2006 — Código de Ética Funcional',
      paretoRatio: 'Leitura da lei',
      isQuente: true,
      content: '<p>Faça a leitura orientada do Código de Ética Funcional do Servidor Público do Estado de Alagoas, com atenção a princípios, deveres, vedações e responsabilização ética.</p>',
      keyTakeaways: [
        'Identificar os deveres funcionais previstos no Código de Ética.',
        'Diferenciar condutas permitidas, vedadas e passíveis de responsabilização.',
        'Resolver questões com base na literalidade da Lei Estadual nº 6.754/2006.',
      ],
      materials: ['Lei Estadual nº 6.754/2006'],
    },
  ],
};

const STATE_LEGISLATION_SECTION: StudySection = {
  id: 'legislacao_estadual',
  title: 'Legislação Estadual',
  icon: 'BookOpen',
  color: 'slate',
  difficulty: 'Difícil',
  weight: '10%',
  paretoJustification: 'A Constituição estadual e o Regime Jurídico Único exigem leitura recorrente da norma, revisão de institutos e treino de questões literais.',
  cards: [
    {
      id: 'leg-estadual-constituicao-al',
      title: 'Constituição do Estado de Alagoas',
      paretoRatio: 'Leitura constitucional',
      isQuente: true,
      content: '<p>Estude a organização do Estado, seus princípios, direitos, administração pública e regras constitucionais estaduais previstas no edital.</p>',
      keyTakeaways: [
        'Revisar a organização político-administrativa do Estado de Alagoas.',
        'Reconhecer princípios e regras aplicáveis à administração pública estadual.',
        'Treinar a literalidade dos dispositivos constitucionais cobrados.',
      ],
      materials: ['Constituição do Estado de Alagoas'],
    },
    {
      id: 'leg-estadual-lei-5247-1991',
      title: 'Lei Estadual nº 5.247/1991 — Regime Jurídico Único',
      paretoRatio: 'Leitura da lei',
      isQuente: true,
      content: '<p>Estude o Regime Jurídico Único dos servidores públicos civis de Alagoas, das autarquias e das fundações públicas estaduais, incluindo suas alterações.</p>',
      keyTakeaways: [
        'Distinguir provimento, vacância, direitos, vantagens, deveres e proibições.',
        'Revisar responsabilidade e processo disciplinar do servidor.',
        'Resolver questões conforme o texto atualizado da Lei nº 5.247/1991.',
      ],
      materials: ['Lei Estadual nº 5.247/1991 e suas alterações'],
    },
  ],
};

const DISCURSIVE_PROMPTS = [
  ['Segurança', 'Desafios para conciliar segurança pública, prevenção da violência e respeito aos direitos fundamentais'],
  ['Transportes', 'Mobilidade urbana sustentável e democratização do acesso ao transporte público'],
  ['Política', 'Participação cidadã, transparência e fortalecimento das instituições democráticas'],
  ['Economia', 'Crescimento econômico com redução das desigualdades sociais e regionais'],
  ['Sociedade', 'Desinformação, polarização e seus impactos na convivência social'],
  ['Educação', 'Educação pública de qualidade como instrumento de inclusão e desenvolvimento'],
  ['Saúde', 'Desafios para ampliar o acesso equitativo e integral à saúde pública'],
  ['Cultura', 'Valorização da diversidade cultural e preservação do patrimônio brasileiro'],
  ['Tecnologia', 'Inteligência artificial, proteção de dados e responsabilidade no uso da tecnologia'],
  ['Energia', 'Transição energética justa e segurança do abastecimento no Brasil'],
  ['Relações internacionais', 'O papel do Brasil na cooperação internacional diante de crises globais'],
  ['Desenvolvimento sustentável', 'Desenvolvimento econômico aliado à justiça social e à preservação ambiental'],
  ['Ecologia', 'Responsabilidade do poder público e da sociedade no enfrentamento das mudanças climáticas'],
] as const;

const DISCURSIVE_SECTION: StudySection = {
  id: DISCURSIVE_TOPIC_ID,
  title: 'Atualidades — Prova Discursiva',
  icon: 'Pencil',
  color: 'amber',
  difficulty: 'Difícil',
  weight: '15%',
  paretoJustification: 'A prática periódica de textos completos desenvolve repertório, tese, argumentação, coesão e gestão do tempo para a prova discursiva.',
  cards: DISCURSIVE_PROMPTS.map(([area, prompt], index) => ({
    id: `redacao-atualidades-${index + 1}`,
    title: `Treino de redação — ${area}`,
    paretoRatio: 'Prática discursiva',
    isQuente: true,
    content: `<p><strong>Tema proposto:</strong> ${prompt}.</p><p>Produza uma redação dissertativo-argumentativa, com introdução, desenvolvimento e conclusão, respeitando o limite e os critérios previstos no edital da sua prova.</p>`,
    keyTakeaways: [
      `Tema: ${prompt}.`,
      'Defina uma tese clara e desenvolva pelo menos dois argumentos relacionados ao tema.',
      'Reserve tempo para revisar coesão, coerência, ortografia e pontuação.',
    ],
    materials: [`Atualidades: ${area}`, 'Estrutura do texto dissertativo-argumentativo'],
  })),
};

const SUS_ADDITIONAL_CARDS: StudySection['cards'] = [
  {
    id: 'sus-evolucao-historica',
    title: 'Evolução histórica e construção do SUS',
    paretoRatio: 'Base conceitual',
    isQuente: true,
    content: '<p>Revise a evolução da organização da saúde no Brasil até a criação do SUS, relacionando a Reforma Sanitária, a Constituição de 1988, os princípios, as diretrizes e o arcabouço legal do sistema.</p>',
    keyTakeaways: [
      'Relacionar a Reforma Sanitária brasileira à criação do SUS.',
      'Distinguir princípios doutrinários e diretrizes organizativas.',
      'Compreender a saúde como direito de todos e dever do Estado.',
    ],
  },
  {
    id: 'sus-controle-social-resolucao-453',
    title: 'Controle social e Resolução CNS nº 453/2012',
    paretoRatio: 'Alta frequência',
    isQuente: true,
    content: '<p>Estude a participação da comunidade no SUS, o funcionamento dos Conselhos e das Conferências de Saúde e as diretrizes da Resolução nº 453/2012 do Conselho Nacional de Saúde.</p>',
    keyTakeaways: [
      'Diferenciar Conselhos e Conferências de Saúde.',
      'Revisar composição, representação e caráter permanente e deliberativo dos Conselhos.',
      'Aplicar as diretrizes de organização previstas na Resolução CNS nº 453/2012.',
    ],
    materials: ['Resolução CNS nº 453/2012'],
  },
  {
    id: 'sus-constituicao-194-200',
    title: 'Constituição Federal — artigos 194 a 200',
    paretoRatio: 'Leitura constitucional',
    isQuente: true,
    content: '<p>Faça a leitura orientada dos artigos 194 a 200 da Constituição Federal e de suas alterações, abrangendo seguridade social, direito à saúde e competências do SUS.</p>',
    keyTakeaways: [
      'Compreender o conceito e os objetivos da seguridade social.',
      'Revisar as diretrizes constitucionais das ações e dos serviços públicos de saúde.',
      'Identificar as competências constitucionais do SUS.',
    ],
    materials: ['Constituição Federal, artigos 194 a 200'],
  },
  {
    id: 'sus-leis-organicas-decreto-7508',
    title: 'Leis nº 8.080/1990 e nº 8.142/1990 e Decreto nº 7.508/2011',
    paretoRatio: 'Altíssima frequência',
    isQuente: true,
    content: '<p>Estude as Leis Orgânicas da Saúde e o Decreto nº 7.508/2011, sempre considerando suas alterações, com foco na organização, direção, articulação interfederativa e participação social no SUS.</p>',
    keyTakeaways: [
      'Revisar objetivos, atribuições, organização e direção do SUS na Lei nº 8.080/1990.',
      'Estudar participação da comunidade e transferências intergovernamentais na Lei nº 8.142/1990.',
      'Compreender Região de Saúde, portas de entrada, RENASES, RENAME e articulação interfederativa.',
    ],
    materials: ['Lei nº 8.080/1990', 'Lei nº 8.142/1990', 'Decreto nº 7.508/2011'],
  },
  {
    id: 'sus-determinantes-sociais',
    title: 'Determinantes sociais da saúde',
    paretoRatio: 'Conhecimento aplicado',
    isQuente: true,
    content: '<p>Analise como condições sociais, econômicas, ambientais, culturais e territoriais influenciam o processo saúde-doença e produzem iniquidades em saúde.</p>',
    keyTakeaways: [
      'Diferenciar determinantes sociais de fatores estritamente biológicos.',
      'Relacionar vulnerabilidade social, território e condições de vida ao processo saúde-doença.',
      'Reconhecer a importância de políticas intersetoriais para reduzir iniquidades.',
    ],
  },
  {
    id: 'sus-sistemas-informacao',
    title: 'Sistemas de informação em saúde',
    paretoRatio: 'Conhecimento aplicado',
    isQuente: true,
    content: '<p>Estude a finalidade dos principais sistemas de informação em saúde e o uso de dados para vigilância, planejamento, gestão e avaliação das políticas públicas.</p>',
    keyTakeaways: [
      'Relacionar informação em saúde a planejamento, vigilância e tomada de decisão.',
      'Reconhecer a importância da qualidade, oportunidade e completude dos dados.',
      'Distinguir a finalidade geral dos sistemas conforme o evento ou serviço registrado.',
    ],
  },
];

export const COURSES_CONFIG: {
  [key: string]: {
    name: string;
    description: string;
    topics: CourseTopic[];
    studySections: StudySection[];
    quizQuestions: any[];
  }
} = {
  seplag_informatica: {
    name: "SEPLAG Alagoas - Informática",
    description: "Preparação para cargos da área de Tecnologia da Informação, incluindo o Cargo 5 — Gestor Especializado em Ciência e Tecnologia. Abrange o conteúdo completo de conhecimentos específicos de TI.",
    topics: [
      { id: 'portugues', title: 'Língua Portuguesa', category: 'Português', subtopics: ['Reescrita de Frases', 'Coesão Textual', 'Crase e Regência', 'Pontuação CEBRASPE'] },
      { id: 'ingles', title: 'Língua Inglesa', category: 'Língua Inglesa', subtopics: ['Compreensão de Textos', 'Conectores e Advérbios', 'Tempos Verbais', 'Vocabulário Técnico'] },
      { id: 'ti_basica', title: 'TI Básica', category: 'TI Básica', subtopics: ['Redes de Computadores', 'Segurança da Informação', 'Backup e Criptografia'] },
      { id: 'etica', title: 'Ética e Compliance', category: 'Ética e Compliance', subtopics: ['Decreto Estadual 4.383/2015', 'Código de Conduta da Administração Pública'] },
      { id: 'marco_legal_cti', title: 'Marco Legal de CT&I', category: 'Ética e Compliance', subtopics: ['Constituição e EC 85/2015', 'Lei 10.973/2004 (Lei de Inovação)', 'Lei 13.243/2016', 'Decreto 9.283/2018', 'Encomenda Tecnológica (ETEC)'] },
      { id: 'legislacao_especifica_fapeal', title: 'Legislações Específicas (FAPEAL)', category: 'Ética e Compliance', subtopics: ['Lei Delegada 48/2022', 'Lei 7.117/2009', 'Lei 6.527/2004', 'L.C. 20/2002 e 5/1990', 'Lei 5.247/1991 (RJU)', 'Decreto 4.137/2009'] },
      { id: 'alagoas', title: 'Conhecimentos de Alagoas', category: 'Conhecimentos de Alagoas', subtopics: ['Emancipação Política', 'Geografia de Alagoas', 'Ciclo do Açúcar e História'] },
      ...TECHNOLOGY_SPECIFIC_TOPICS,
    ],
    studySections: [
      ...defaultSeplagSections.filter(section => section.id !== 'especificos'),
      ...TECHNOLOGY_SPECIFIC_STUDY_SECTIONS,
    ],
    quizQuestions: defaultSeplagQuestions
  },
  policial_civil: {
    name: "Policial Civil — CEBRASPE",
    description: "Preparação para os cargos de Agente de Polícia e Escrivão de Polícia com conhecimentos básicos e específicos previstos no programa da banca CEBRASPE.",
    topics: [...POLICE_BASIC_TOPICS, ...POLICE_ORDERED_SPECIFIC_TOPICS],
    studySections: [...POLICE_BASIC_STUDY_SECTIONS, ...POLICE_SPECIFIC_STUDY_SECTIONS],
    quizQuestions: defaultSeplagQuestions.filter(question =>
      ['Português', 'TI Básica', 'Ética e Compliance'].includes(question.category)
    ),
  },
  tecnico_enfermagem: {
    name: "Técnico em Enfermagem",
    description: "Concurso público para provimento de vagas de Técnico em Enfermagem. Foco em Fundamentos de Enfermagem, Saúde Pública/SUS, Farmacologia Clínica, Urgência/Emergência e Ética Profissional.",
    topics: [
      { id: 'fundamentos', title: 'Fundamentos de Enfermagem', category: 'Fundamentos de Enfermagem', subtopics: ['Sinais Vitais e Monitorização', 'Higiene e Conforto do Paciente', 'Sondagens e Aspiração de Vias'] },
      {
        id: 'sus_saude_publica',
        title: 'Legislação Aplicada ao SUS',
        category: 'Saúde Pública e SUS',
        subtopics: [
          '1. Evolução histórica da organização do sistema de saúde no Brasil e construção do SUS: princípios, diretrizes e arcabouço legal',
          '2. Controle social no SUS',
          '3. Resolução nº 453/2012 do Conselho Nacional de Saúde',
          '4. Constituição Federal, artigos 194 a 200, e suas alterações',
          '5. Lei nº 8.080/1990 e suas alterações, Lei nº 8.142/1990 e suas alterações e Decreto Presidencial nº 7.508/2011 e suas alterações',
          '6. Determinantes sociais da saúde',
          '7. Sistemas de informação em saúde',
        ],
      },
      { id: 'urgencia_emergencia', title: 'Urgência e Emergência', category: 'Urgência e Emergência', subtopics: ['Suporte Básico de Vida (SBV / RCP)', 'Atendimento ao Trauma (XABCDE)', 'Queimaduras, Intoxicações e Hemorragias'] },
      { id: 'farmacologia', title: 'Farmacologia aplicada', category: 'Farmacologia e Administração', subtopics: ['Cálculo de Gotejamento e Dosagem', 'Vias de Administração de Medicamentos', 'Segurança na Cadeia de Medicamentos'] },
      { id: 'etica_deontologia', title: 'Ética e Deontologia', category: 'Ética e Compliance', subtopics: ['Código de Ética dos Profissionais de Enfermagem', 'COFEN/COREN Legislação', 'Deveres e Direitos do Técnico'] }
    ],
    studySections: [
      {
        id: 'fundamentos',
        title: 'Fundamentos de Enfermagem',
        icon: 'BookOpen',
        color: 'emerald',
        difficulty: 'Médio',
        weight: '25%',
        paretoJustification: 'No estilo CEBRASPE, cerca de 80% das questões de fundamentos giram em torno de verificação exata de parâmetros de sinais vitais, técnicas estéreis de curativos e medidas de prevenção de Lesão por Pressão (LPP).',
        cards: [
          {
            id: 'enf-sinais-vitais',
            title: 'Sinais Vitais (Parâmetros e Normatização)',
            paretoRatio: 'Altíssima Frequência (80/20)',
            isQuente: true,
            content: `
              <p class="mb-3">A aferição exata e interpretação dos Sinais Vitais (SSVV) é fundamental. CEBRASPE foca fortemente nos valores de referência e nomenclaturas clínicas:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3 text-xs">
                <h4 class="font-bold text-slate-800">Parâmetros Críticos para Decoreba:</h4>
                <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
                  <li><strong>Pressão Arterial (PA)</strong>: Normotenso (&lt; 120/80 mmHg), Pré-hipertenso (120-129 / &lt;80 mmHg), Hipertensão Estágio 1 (130-139 / 80-89 mmHg).</li>
                  <li><strong>Frequência Cardíaca (FC)</strong>: Normocárdico (60-100 bpm), Taquicárdico (&gt; 100 bpm), Bradicárdico (&lt; 60 bpm).</li>
                  <li><strong>Frequência Respiratória (FR)</strong>: Eupneico (12-20 irpm), Taquipneico (&gt; 20 irpm), Bradipneico (&lt; 12 irpm).</li>
                  <li><strong>Temperatura (T)</strong>: Afebril (36°C-37.2°C), Estado febril/Subfebril (37.3°C-37.7°C), Febril/Pirexia (&gt; 37.8°C).</li>
                </ul>
              </div>
              <p class="text-xs text-slate-600"><strong>Atenção em Prova:</strong> Fatores que alteram temporariamente os sinais vitais, como dor aguda (eleva PA e FC) e sono profundo (reduz FR e FC), são frequentemente explorados.</p>
            `,
            keyTakeaways: [
              "Frequência respiratória eupneica em adultos varia de 12 a 20 respirações por minuto (irpm).",
              "A bradicardia é caracterizada por frequência cardíaca abaixo de 60 batimentos por minuto (bpm).",
              "O manguito de pressão muito largo subestima a PA; o manguito muito estreito superestima os valores aferidos."
            ]
          },
          {
            id: 'enf-lpp',
            title: 'Prevenção de Lesões por Pressão (LPP)',
            paretoRatio: 'Alta Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A prevenção de Lesões por Pressão (LPP) é um indicador direto de qualidade assistencial de enfermagem. CEBRASPE cobra as escalas de avaliação de risco e protocolos preventivos:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3 text-xs">
                <p class="font-bold text-slate-800">Diretrizes de Prevenção Sistemática:</p>
                <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
                  <li><strong>Mudança de decúbito</strong>: Essencial a cada 2 horas no leito ou a cada 15 minutos se o paciente estiver sentado em cadeira.</li>
                  <li><strong>Escala de Braden</strong>: Utilizada para mensurar o risco de desenvolvimento de LPP (subescalas: percepção sensorial, umidade, atividade, mobilidade, nutrição, fricção e cisalhamento). Quanto menor o escore, maior o risco do paciente.</li>
                  <li><strong>Higiene da pele</strong>: Manter a pele sempre limpa e hidratada. Proibido massagear áreas hiperemiadas ou proeminências ósseas.</li>
                </ul>
              </div>
            `,
            keyTakeaways: [
              "Nunca realizar massagem sobre áreas avermelhadas (hiperemia), pois isso aumenta o cisalhamento tecidual profundo.",
              "Na Escala de Braden, uma pontuação baixa indica alto risco de desenvolvimento de lesão por pressão.",
              "A hidratação cutânea e o uso de barreiras de proteção contra umidade excessiva (como películas protetoras) são medidas chaves."
            ]
          }
        ]
      },
      {
        id: 'sus_saude_publica',
        title: 'Legislação Aplicada ao SUS',
        icon: 'Shield',
        color: 'blue',
        difficulty: 'Médio',
        weight: '25%',
        paretoJustification: 'As leis 8.080/90 e 8.142/90 representam a base de todas as provas de SUS na banca CEBRASPE. Foco na descentralização e no controle social (Conselhos e Conferências).',
        cards: [
          {
            id: 'sus-principios',
            title: 'Princípios Doutrinários e Organizativos do SUS',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">O SUS possui princípios fundamentais consagrados na Constituição de 1988 e na Lei 8.080/90:</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <span class="font-bold text-blue-800">Princípios Doutrinários:</span>
                  <ul class="list-disc pl-4 text-blue-700 mt-1 space-y-1">
                    <li><strong>Universalidade</strong>: Acesso a todos os cidadãos, sem distinção ou barreiras de entrada.</li>
                    <li><strong>Integralidade</strong>: Assistência global, cobrindo preventivo, curativo e reabilitador.</li>
                    <li><strong>Equidade</strong>: Tratar desigualmente os desiguais para atingir a igualdade de oportunidades.</li>
                  </ul>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span class="font-bold text-slate-800">Princípios Organizativos:</span>
                  <ul class="list-disc pl-4 text-slate-700 mt-1 space-y-1">
                    <li><strong>Descentralização</strong>: Redistribuição de poder e responsabilidades para os Municípios.</li>
                    <li><strong>Regionalização e Hierarquização</strong>: Organização de serviços por complexidade crescente.</li>
                    <li><strong>Participação da Comunidade</strong>: Controle social institucionalizado pela Lei 8.142/90.</li>
                  </ul>
                </div>
              </div>
            `,
            keyTakeaways: [
              "A participação da comunidade (controle social) se dá pelos Conselhos e Conferências de Saúde.",
              "Os Conselhos de Saúde têm caráter deliberativo e permanente, compostos de forma paritária (50% usuários, 50% profissionais e gestores).",
              "A iniciativa privada participa do SUS de forma complementar, com preferência para as instituições sem fins lucrativos."
            ]
          },
          ...SUS_ADDITIONAL_CARDS,
        ]
      },
      {
        id: 'urgencia_emergencia',
        title: 'Urgência e Emergência',
        icon: 'Terminal',
        color: 'rose',
        difficulty: 'Difícil',
        weight: '20%',
        paretoJustification: 'As diretrizes de Suporte Básico de Vida (SBV) da American Heart Association (AHA) norteiam todas as questões de parada cardiorrespiratória (PCR). É o tema que define aprovações.',
        cards: [
          {
            id: 'urg-pcr',
            title: 'Parada Cardiorrespiratória (PCR) em Adultos',
            paretoRatio: 'Alta Frequência (80/20)',
            isQuente: true,
            content: `
              <p class="mb-3">A reanimação cardiopulmonar (RCP) deve ser iniciada imediatamente após a constatação de ausência de pulso central e ausência de respiração normal (ou apenas gasping):</p>
              <div class="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs mb-3 space-y-2">
                <p class="font-bold text-rose-900">Protocolo de RCP de Alta Qualidade (Adultos):</p>
                <ul class="list-disc pl-4 text-rose-800 space-y-1">
                  <li><strong>Frequência de compressão</strong>: 100 a 120 compressões por minuto.</li>
                  <li><strong>Profundidade da compressão</strong>: Mínimo de 5 cm, sem ultrapassar 6 cm.</li>
                  <li><strong>Retorno torácico</strong>: Permitir descompressão total do tórax entre as compressões para favorecer enchimento cardíaco.</li>
                  <li><strong>Relação compressão-ventilação</strong>: 30 compressões para 2 ventilações (30:2) com 1 socorrista ou 2 socorristas (sem via aérea avançada).</li>
                  <li><strong>Minimizar interrupções</strong>: Pausas máximas de 10 segundos para verificação ou posicionamento do DEA/Desfibrilador.</li>
                </ul>
              </div>
            `,
            keyTakeaways: [
              "Com via aérea avançada instalada, realizam-se compressões contínuas e 1 ventilação a cada 6 segundos (10 ventilações por minuto).",
              "O primeiro passo ao presenciar uma possível PCR é certificar-se de que a cena do atendimento está segura.",
              "O DEA (Desfibrilador Externo Automático) deve ser instalado imediatamente assim que disponível."
            ]
          }
        ]
      },
      {
        id: 'farmacologia',
        title: 'Farmacologia aplicada',
        icon: 'Cpu',
        color: 'amber',
        difficulty: 'Difícil',
        weight: '15%',
        paretoJustification: 'Questões práticas de cálculo de gotejamento de soro (gotas/min e microgotas/min) e diluição de medicamentos (como Penicilina G Cristalina) aparecem em todas as provas da área.',
        cards: [
          {
            id: 'farm-calculo',
            title: 'Cálculo de Gotejamento de Soro',
            paretoRatio: 'Altíssima Cobrança',
            isQuente: true,
            content: `
              <p class="mb-3">O cálculo do gotejamento de soluções é feito através de fórmulas clássicas que correlacionam o Volume (V, em mL) e o Tempo (T, em horas):</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                <div class="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span class="font-bold text-amber-800">Gotas por Minuto (G):</span>
                  <p class="text-sm font-bold font-mono mt-1 text-slate-800">G = V / (T * 3)</p>
                  <p class="text-[10px] text-amber-900 mt-1">Ex: Soro Fisiológico 500mL em 8 horas.<br/>G = 500 / (8 * 3) = 500 / 24 ≈ 21 gotas/min.</p>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span class="font-bold text-slate-800">Microgotas por Minuto (M):</span>
                  <p class="text-sm font-bold font-mono mt-1 text-slate-800">M = V / T</p>
                  <p class="text-[10px] text-slate-600 mt-1">Ex: Soro Fisiológico 500mL em 8 horas.<br/>M = 500 / 8 ≈ 63 microgotas/min.</p>
                </div>
              </div>
              <p class="text-xs text-slate-600"><strong>Equivalência de Medidas Úteis:</strong> 1 gota = 3 microgotas; 1 mL = 20 gotas; 1 mL = 60 microgotas.</p>
            `,
            keyTakeaways: [
              "Para o cálculo de gotas em tempo expressado em minutos, usa-se: Gotas = (Volume * 20) / Tempo (em minutos).",
              "1 mL equivale exatamente a 20 gotas ou 60 microgotas.",
              "A via endovenosa (EV) apresenta início de ação imediato devido à ausência da etapa de absorção gastrointestinal."
            ]
          }
        ]
      },
      {
        id: 'etica_deontologia',
        title: 'Ética e Deontologia',
        icon: 'Shield',
        color: 'slate',
        difficulty: 'Fácil',
        weight: '15%',
        paretoJustification: 'O Código de Ética dos Profissionais de Enfermagem (Resolução COFEN 564/2017) é cobrado em sua literalidade, separando de forma clara o que são Direitos, Deveres e Proibições.',
        cards: [
          {
            id: 'enf-decreto-etica',
            title: 'Código de Ética (Direitos vs. Proibições)',
            paretoRatio: 'Alta Frequência',
            isQuente: false,
            content: `
              <p class="mb-3">A Resolução COFEN nº 564/2017 estabelece as bases éticas do exercício profissional da Enfermagem. A banca costuma confundir o candidato trocando deveres por proibições ou direitos:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-500 mb-3 text-xs space-y-2">
                <p><strong>Direitos do Profissional:</strong> Recusar-se a executar atividades que não sejam de sua competência técnica/científica ou ética; abster-se de revelar informações confidenciais das quais tenha conhecimento pelo cargo (salvo imperativo legal ou consentimento).</p>
                <p><strong>Deveres do Profissional:</strong> Prestar assistência sem discriminação de qualquer natureza; registrar no prontuário do paciente todas as informações inerentes à assistência prestada.</p>
                <p><strong>Proibições Explícitas:</strong> Executar ou prescrever tratamentos que não estejam respaldados por lei; assinar ações que não executou ou das quais não tenha participado.</p>
              </div>
            `,
            keyTakeaways: [
              "É direito do profissional recusar-se a realizar procedimentos fora de sua competência legal ou técnica.",
              "O registro e anotação das ações de enfermagem no prontuário do paciente constitui um dever absoluto do profissional.",
              "Prescrever medicamentos é proibido para técnicos de enfermagem, sendo restrito a enfermeiros sob protocolos pré-definidos do Ministério da Saúde."
            ]
          }
        ]
      }
    ],
    quizQuestions: [
      {
        id: 1,
        category: 'Fundamentos de Enfermagem',
        text: 'De acordo com as diretrizes da American Heart Association (AHA) para Suporte Básico de Vida, a frequência de compressões torácicas recomendada para adultos é de 100 a 120 compressões por minuto.',
        correct: 'Certo',
        explanation: 'A diretriz de Suporte Básico de Vida preconiza a aplicação de compressões torácicas em uma frequência de 100 a 120 compressões por minuto, visando garantir a eficácia da circulação artificial de sangue e otimizar as chances de retorno da circulação espontânea.'
      },
      {
        id: 2,
        category: 'Fundamentos de Enfermagem',
        text: 'A Escala de Braden é uma ferramenta amplamente utilizada para predição do risco de lesão por pressão (LPP). Um paciente com escore de Braden igual a 9 é classificado como de baixo risco de desenvolver lesão.',
        correct: 'Errado',
        explanation: 'Na Escala de Braden, quanto menor o escore total obtido, maior é o risco do paciente desenvolver lesão por pressão. O escore máximo é 23. Uma pontuação igual ou inferior a 9 indica risco grave/altíssimo, e não baixo risco.'
      },
      {
        id: 3,
        category: 'Saúde Pública e SUS',
        text: 'Os Conselhos de Saúde, em conformidade com a Lei nº 8.142/90, possuem caráter consultivo e reúnem-se ordinariamente a cada quatro anos para avaliar a situação de saúde e propor as diretrizes para a formulação da política de saúde.',
        correct: 'Errado',
        explanation: 'Os Conselhos de Saúde têm caráter deliberativo (e permanente) e reúnem-se mensalmente. Quem se reúne a cada quatro anos são as Conferências de Saúde, que possuem caráter de formulação e avaliação.'
      },
      {
        id: 4,
        category: 'Saúde Pública e SUS',
        text: 'Em conformidade com a Lei nº 8.080/90, a iniciativa privada poderá participar do Sistema Único de Saúde (SUS) em caráter complementar, tendo preferência as entidades filantrópicas e as sem fins lucrativos.',
        correct: 'Certo',
        explanation: 'O artigo 24 da Lei 8.080/90 prevê explicitamente que os serviços privados de assistência à saúde podem participar de forma complementar do SUS, mediante contrato de direito público ou convênio, com prioridade para as entidades filantrópicas e as sem fins lucrativos.'
      },
      {
        id: 5,
        category: 'Urgência e Emergência',
        text: 'No atendimento pré-hospitalar ao trauma grave, a nova mnemônica adotada internacionalmente é o XABCDE, onde o X inicial representa o controle imediato de hemorragias exanguinantes, antecedendo a própria avaliação das vias aéreas.',
        correct: 'Certo',
        explanation: 'O XABCDE preconiza que o controle de grandes sangramentos externos (exanguinantes - letra X) deve vir antes mesmo de se abrir vias aéreas (letra A), uma vez que a morte por choque hemorrágico agudo é mais rápida do que a morte por asfixia obstrutiva nos momentos iniciais.'
      },
      {
        id: 6,
        category: 'Urgência e Emergência',
        text: 'Durante as manobras de Reanimação Cardiopulmonar (RCP) em adultos por um único socorrista profissional, caso não exista via aérea avançada instalada, a relação de compressões e ventilações recomendada é de 15 compressões para cada 2 ventilações.',
        correct: 'Errado',
        explanation: 'Para adultos, a relação padrão de compressão-ventilação é de 30 compressões para 2 ventilações (30:2), independentemente de se ter 1 ou 2 socorristas na cena. A relação 15:2 é utilizada exclusivamente em pediatria (bebês e crianças) quando há dois socorristas profissionais presentes.'
      },
      {
        id: 7,
        category: 'Farmacologia e Administração',
        text: 'Para administrar um soro fisiológico de 500 mL em um período de 8 horas contínuas, o profissional de enfermagem deve regular o gotejamento do equipamento para aproximadamente 21 gotas por minuto.',
        correct: 'Certo',
        explanation: 'Aplicando a fórmula padrão: Gotas = Volume / (Tempo * 3) -> Gotas = 500 / (8 * 3) = 500 / 24 = 20,83. Arredondando para o número inteiro mais próximo, obtém-se aproximadamente 21 gotas por minuto.'
      },
      {
        id: 8,
        category: 'Farmacologia e Administração',
        text: 'As microgotas apresentam uma equivalência na qual 1 microgota equivale ao volume correspondente de 3 gotas normais.',
        correct: 'Errado',
        explanation: 'É exatamente o oposto: 1 gota normal equivale a 3 microgotas (portanto, a microgota é três vezes menor). Um gotejador de microgotas gera 60 microgotas por mL, enquanto o gotejador de macrogotas gera 20 gotas por mL.'
      },
      {
        id: 9,
        category: 'Ética e Compliance',
        text: 'De acordo com o Código de Ética dos Profissionais de Enfermagem (Resolução COFEN nº 564/2017), prescrever medicamentos e tratamentos respaldados por programas de saúde pública é uma proibição expressa ao Técnico em Enfermagem.',
        correct: 'Certo',
        explanation: 'O Código de Ética veda a prescrição de medicamentos por técnicos ou auxiliares. Essa atribuição, dentro de programas de saúde do SUS ou rotinas aprovadas, é facultada unicamente ao Enfermeiro habilitado ou ao Médico.'
      },
      {
        id: 10,
        category: 'Ética e Compliance',
        text: 'É considerado um direito do profissional de enfermagem recusar-se a executar atividades de sua competência profissional que julgue que o local de trabalho não oferece condições seguras de assistência ao paciente.',
        correct: 'Certo',
        explanation: 'A Resolução COFEN 564/2017 garante ao profissional o direito de recusar-se a realizar atividades que não ofereçam segurança ao paciente ou a si próprio pelas precariedades do ambiente de trabalho.'
      }
    ]
  },
  jornalismo: {
    name: "Jornalismo",
    description: "Concurso público para provimento de vagas de Jornalista / Analista de Comunicação. Foco em Teorias da Comunicação, Técnicas de Redação, Assessoria de Imprensa, Webjornalismo, Mídias Sociais e Ética Jornalística.",
    topics: [
      {
        id: 'teorias_com',
        title: 'Jornalismo e Meios de Comunicação de Massa',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'História e conceitos do jornalismo e dos meios de comunicação de massa',
          'Veículos de comunicação de massa no Brasil: história, estrutura e funcionamento',
          'Características, linguagens e técnicas de produção, apuração, entrevista, redação e edição para jornal, revista, rádio, Internet, TV e vídeo',
          'Condições de produção da notícia',
          'Princípios e orientações gerais para redação de textos jornalísticos',
        ],
      },
      {
        id: 'redacao_jornalistica',
        title: 'Imprensa Escrita, Redação e Editoração',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'Gêneros de redação jornalística',
          'Elaboração de notícia, reportagem, entrevista, editorial, crônica, coluna, pauta, informativo, comunicado, carta, release, relatório, anúncio e briefing em texto e imagem',
          'Técnicas de redação jornalística',
          'Lead, sub-lead e pirâmide invertida',
          'Critérios de seleção, redação e edição',
          'Processo gráfico',
          'Editoração e preparação de originais',
          'Projeto gráfico e tipologia',
          'Caracteres e medidas, justificação, mancha gráfica e margens',
          'Diagramação e retrancagem',
          'Composição e impressão',
          'Planejamento editorial',
          'Ilustrações, cores, técnicas de impressão e apresentação visual da publicação',
          'Redação e edição institucional: releases, relatórios públicos, guias do proponente, campanhas e peças digitais',
        ],
      },
      {
        id: 'assessoria_imprensa',
        title: 'Jornalismo Institucional e Assessoria de Imprensa',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'História, atribuições, organização, estrutura e funcionamento do jornalismo institucional',
          'Notícia institucional',
          'Estrutura e processo de construção da notícia',
          'Notícia na mídia impressa',
          'Notícia na mídia eletrônica',
          'Notícia na mídia digital',
          'Produção da notícia e rotinas da assessoria de imprensa',
          'Papel do assessor de imprensa',
          'Atendimento à imprensa',
          'Sugestões de pauta, releases e artigos',
          'Organização de entrevistas',
          'Produtos de uma assessoria de imprensa',
          'Mecanismos de controle da informação',
          'Pauta institucional',
          'Canais e estratégias de comunicação interna',
          'Publicações jornalísticas empresariais: história, planejamento, conceitos e técnicas',
          'Métodos e técnicas de pesquisa',
        ],
      },
      {
        id: 'jornalismo_digital',
        title: 'Webjornalismo e Comunicação Digital',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'Webjornalismo',
          'Comunicação digital: estratégia e canais',
          'Métricas e indicadores de alcance, engajamento e conversão',
        ],
      },
      { id: 'marco_legal_cti', title: 'Marco Legal de CT&I', category: 'Ética e Compliance', subtopics: ['Constituição e EC 85/2015', 'Lei 10.973/2004 (Lei de Inovação)', 'Lei 13.243/2016', 'Decreto 9.283/2018', 'Encomenda Tecnológica (ETEC)'] },
      { id: 'legislacao_especifica_fapeal', title: 'Legislações Específicas (FAPEAL)', category: 'Ética e Compliance', subtopics: ['Lei Delegada 48/2022', 'Lei 7.117/2009', 'Lei 6.527/2004', 'L.C. 20/2002 e 5/1990', 'Lei 5.247/1991 (RJU)', 'Decreto 4.137/2009'] },
      {
        id: 'divulgacao_cientifica',
        title: 'Divulgação Científica e Ecossistemas de Inovação',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'Divulgação científica e da inovação',
          'Tradução de conteúdo técnico, curadoria e roteirização',
          'Data storytelling: narrativas baseadas em dados, indicadores e bibliometria',
          'Ética e boas práticas em narrativas baseadas em dados',
          'Sistemas nacionais, regionais e locais de inovação e políticas de CT&I',
          'Atores, instituições e interações entre governo, empresas, universidades e sociedade',
          'Avaliação do desempenho de sistemas de inovação',
          'Inovação e desenvolvimento: invenção, inovação e difusão',
          'Modelo linear e visão sistêmica da inovação',
          'Inovação radical, incremental, de produto, de processo e organizacional',
          'Inovação, território, desenvolvimento e tecnologia social',
          'Ambientes promotores de inovação: parques, polos, incubadoras, aceleradoras, laboratórios abertos e cidades inteligentes',
          'Governança e avaliação de resultados e impactos dos ambientes de inovação',
          'Inteligência tecnológica e prospecção em CT&I',
          'Monitoramento de tendências e serviços de informação para decisões de fomento e planejamento',
          'Universidades e institutos de pesquisa no Brasil',
          'Sistema de pesquisa, infraestruturas científicas, tecnológicas e multiusuário',
          'Formação, produção científica e interação com empresas e governo',
          'Redes de colaboração e intercâmbio de conhecimento científico',
          'Cooperação nacional e internacional, produção conjunta e circulação do conhecimento',
          'Indicadores de publicações científicas',
          'Citações, fatores de impacto, rankings, comparabilidade entre áreas e posicionamento do Brasil',
          'Inovação segundo o Manual de Oslo',
        ],
      },
      {
        id: 'etica_imprensa',
        title: 'Comunicação Pública, LAI e LGPD',
        category: 'Conhecimentos Específicos - Jornalismo',
        subtopics: [
          'Comunicação pública e institucional',
          'Planejamento da comunicação pública',
          'Linguagem cidadã, transparência ativa e prestação de informações',
          'LAI aplicada à comunicação e à publicação de informações institucionais',
          'LGPD aplicada à comunicação e à publicação de dados institucionais',
        ],
      }
    ],
    studySections: [
      {
        id: 'teorias_com',
        title: 'Teorias da Comunicação',
        icon: 'BookOpen',
        color: 'emerald',
        difficulty: 'Médio',
        weight: '25%',
        paretoJustification: 'CEBRASPE adora as chamadas "Teorias do Agendamento (Agenda-Setting)" e o papel de mediação do "Gatekeeper". Cerca de 75% das questões conceituais envolvem estas duas teorias.',
        cards: [
          {
            id: 'jor-agenda-setting',
            title: 'Teoria do Agenda-Setting (Agendamento)',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">Formulada por Maxwell McCombs e Donald Shaw, a Teoria do Agenda-Setting defende que os veículos de notícia influenciam fortemente a relevância dada aos temas sociais cotidianos:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3 text-xs">
                <h4 class="font-bold text-slate-800">Postulados Chaves do Agenda-Setting:</h4>
                <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
                  <li><strong>A Mídia Agenda</strong>: A imprensa não diz às pessoas <em>o que pensar</em>, mas sim <em>sobre o que falar e pensar</em>.</li>
                  <li><strong>Critério de Noticiabilidade</strong>: Quanto mais destaque uma notícia recebe na mídia (primeira página, chamadas de TV), maior a importância atribuída a ela pelos cidadãos.</li>
                  <li><strong>Relação Causa-Efeito</strong>: Há uma correlação estatística direta entre o espaço ocupado por um tema no noticiário e a sua classificação de prioridade na opinião pública.</li>
                </ul>
              </div>
            `,
            keyTakeaways: [
              "O agendamento sugere que a pauta midiática define a agenda de discussões da sociedade.",
              "A mídia funciona como indutora de prioridades públicas de discussão.",
              "Enquadramento (Framing) é o desdobramento do agendamento que dita como o assunto é apresentado."
            ]
          },
          {
            id: 'jor-gatekeeper',
            title: 'Gatekeeping e Filtros Editoriais',
            paretoRatio: 'Alta Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A teoria do Gatekeeping estabelece que as notícias passam por uma série de portões (gates) de seleção controlados por indivíduos específicos (gatekeepers):</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3 text-xs">
                <p><strong>Quem é o Gatekeeper?</strong> É o jornalista, o editor ou o secretário de redação que possui o poder de aprovar ou descartar uma pauta ou matéria. Suas escolhas são guiadas por critérios subjetivos, políticos, de linha editorial e operacionais (como limite de espaço físico ou tempo de programa).</p>
              </div>
            `,
            keyTakeaways: [
              "O gatekeeper atua como um filtro que barra a imensa maioria dos acontecimentos mundiais, permitindo que apenas uma fração se torne notícia.",
              "A teoria do Newsmaking expande este conceito focando nos processos industriais de rotina de trabalho dentro das redações.",
              "Fatores econômicos e técnicos exercem pressão direta sobre a decisão do gatekeeper."
            ]
          }
        ]
      },
      {
        id: 'redacao_jornalistica',
        title: 'Técnicas de Redação',
        icon: 'Terminal',
        color: 'blue',
        difficulty: 'Médio',
        weight: '25%',
        paretoJustification: 'A redação de notícias tem regras universais. A banca avalia se você domina a objetividade do Lead e a estrutura de relevância decrescente chamada Pirâmide Invertida.',
        cards: [
          {
            id: 'jor-lead',
            title: 'O Lead Jornalístico e a Pirâmide Invertida',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A estrutura fundamental da notícia serve para prender a atenção do leitor e transmitir o essencial de imediato:</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <span class="font-bold text-blue-800">As 6 Perguntas do Lead:</span>
                  <ul class="list-disc pl-4 text-blue-700 mt-1 space-y-0.5">
                    <li><strong>Quem?</strong> (o sujeito do fato)</li>
                    <li><strong>O quê?</strong> (a ação praticada)</li>
                    <li><strong>Onde?</strong> (o local do ocorrido)</li>
                    <li><strong>Quando?</strong> (a data/hora do evento)</li>
                    <li><strong>Como?</strong> (o modo/detalhes)</li>
                    <li><strong>Por quê?</strong> (os motivos/causa)</li>
                  </ul>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span class="font-bold text-slate-800">A Pirâmide Invertida:</span>
                  <p class="mt-1 text-slate-600">Consiste em colocar as informações mais importantes e impactantes no topo (primeiro parágrafo - o lead), seguidas de detalhes complementares e contexto secundário nos parágrafos inferiores. Facilita o corte do texto de trás para frente na diagramação.</p>
                </div>
              </div>
            `,
            keyTakeaways: [
              "O Lead tradicional situa o leitor respondendo às perguntas básicas de identificação do fato logo no primeiro parágrafo.",
              "A pirâmide invertida rompe com a ordem cronológica tradicional em prol de uma ordem de relevância jornalística.",
              "A concisão e a objetividade são regras de ouro na escrita para hard news."
            ]
          }
        ]
      },
      {
        id: 'assessoria_imprensa',
        title: 'Assessoria de Imprensa',
        icon: 'Shield',
        color: 'rose',
        difficulty: 'Médio',
        weight: '20%',
        paretoJustification: 'O papel do assessor mudou muito, mas press releases e gerenciamento de crises de reputação continuam sendo o coração das avaliações da banca CEBRASPE em cargos públicos.',
        cards: [
          {
            id: 'jor-assessoria',
            title: 'Press Release e o Gerenciamento de Crises',
            paretoRatio: 'Alta Relevância',
            isQuente: true,
            content: `
              <p class="mb-3">A assessoria de imprensa serve de ponte estratégica entre uma instituição (como um órgão do Estado) e os veículos de comunicação em geral:</p>
              <div class="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs mb-3 space-y-2">
                <p><strong>Press Release</strong>: É um texto informativo estruturado sob formato jornalístico enviado para redações propondo uma pauta. Deve possuir título atrativo, lead claro e dados para contato rápido.</p>
                <p><strong>Gerenciamento de Crise</strong>: Envolve ações rápidas de contenção de boatos ou notícias negativas. O assessor deve mapear riscos, capacitar o porta-voz através de <em>media training</em> e emitir comunicados oficiais transparentes e velozes.</p>
              </div>
            `,
            keyTakeaways: [
              "O press release deve possuir valor noticioso real para que seja aproveitado pelas redações de jornais.",
              "Em momentos de crise, o assessor de imprensa deve evitar a resposta reativa de 'nada a declarar', optando pela transparência ativa.",
              "O mailing list deve ser segmentado e constantemente atualizado para atingir os editores corretos."
            ]
          }
        ]
      },
      {
        id: 'jornalismo_digital',
        title: 'Jornalismo Digital e Web',
        icon: 'Cpu',
        color: 'amber',
        difficulty: 'Fácil',
        weight: '15%',
        paretoJustification: 'Busca por SEO (Search Engine Optimization), hipertextualidade e estratégias de engajamento social são cobrados de maneira técnica na atualidade.',
        cards: [
          {
            id: 'jor-seo',
            title: 'SEO Jornalístico e Hipertexto',
            paretoRatio: 'Frequência Recorrente',
            isQuente: false,
            content: `
              <p class="mb-3">Escrever para a web exige alinhar a linguagem do jornalismo com algoritmos de motores de busca (como o Google):</p>
              <div class="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs mb-3 space-y-1">
                <li><strong>Palavras-chave no Título (H1)</strong>: Colocar os termos mais procurados no início do título.</li>
                <li><strong>Hiperlinkagem</strong>: Linkar termos relevantes para outras matérias internas (aumenta o tempo de navegação).</li>
                <li><strong>URLs amigáveis</strong>: Links fáceis de ler, contendo palavras-chave e sem caracteres especiais.</li>
              </div>
            `,
            keyTakeaways: [
              "SEO jornalístico busca visibilidade técnica sem abrir mão da veracidade e qualidade do texto de notícia.",
              "Hipertexto permite caminhos não lineares de leitura, enriquecendo o consumo da informação na internet.",
              "O título web costuma ser mais explicativo e literal do que o título criativo do meio impresso."
            ]
          }
        ]
      },
      {
        id: 'basicas_marco_legal',
        title: 'Marco Legal de CT&I e FAPEAL',
        icon: 'Shield',
        color: 'sky',
        difficulty: 'Médio',
        weight: '20%',
        paretoJustification: 'O Marco Legal de CT&I (Lei 13.243/2016) e a estrutura da FAPEAL (Lei Estadual 8.956/2023) constituem a espinha dorsal regulatória do cargo. As questões da CEBRASPE focam em Encomenda Tecnológica, subvenção econômica e a atuação da FAPEAL.',
        cards: [
          {
            id: 'jor-marco-legal-basico',
            title: 'O Marco Legal de CT&I (Lei nº 13.243/2016)',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A Lei nº 13.243/2016 alterou a Lei de Inovação (Lei nº 10.973/2004) para desburocratizar a relação entre ICTs públicas e o setor produtivo:</p>
              <div class="bg-sky-50 p-3 rounded-lg border border-sky-200 text-xs mb-3 space-y-1">
                <p><strong>Isenção e Dispensa de Licitação</strong>: Facilita compras de insumos para pesquisa e desenvolvimento.</p>
                <p><strong>Subvenção Econômica</strong>: Recursos públicos aplicados diretamente em empresas privadas para projetos de inovação, com partilha de riscos.</p>
                <p><strong>Encomenda Tecnológica (ETEC)</strong>: Compra direta de soluções tecnológicas inexistentes no mercado, com risco tecnológico assumido pelo Estado.</p>
              </div>
            `,
            keyTakeaways: [
              "A Encomenda Tecnológica é contratada diretamente com dispensa de licitação e envolve alto risco tecnológico.",
              "As ICTs públicas podem compartilhar laboratórios e pessoal com empresas privadas para fomento à pesquisa.",
              "Diferença entre inovação radical (mudança revolucionária) e inovação incremental (melhorias contínuas) segundo o Manual de Oslo."
            ]
          },
          {
            id: 'jor-legislacao-fapeal',
            title: 'Estrutura da FAPEAL (Lei nº 8.956/2023)',
            paretoRatio: 'Alta Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A Fundação de Amparo à Pesquisa do Estado de Alagoas (FAPEAL) é uma entidade de direito público que integra a estrutura de CT&I:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-600 text-xs mb-3 space-y-1">
                <p><strong>Missão</strong>: Amparar e fomentar pesquisas científicas, tecnológicas e de inovação no estado de Alagoas.</p>
                <p><strong>Lei nº 6.527/2004</strong>: Estrutura o Plano de Cargos, Carreiras e Vencimentos (PCCV) dos servidores da fundação, visando sua profissionalização.</p>
                <p><strong>Linguagem e Transparência</strong>: Como órgão público, a FAPEAL deve seguir a LAI (Lei de Acesso à Informação) com transparência ativa de seus editais e prestações de conta.</p>
              </div>
            `,
            keyTakeaways: [
              "A FAPEAL atua como a principal agência pública de fomento à CT&I em Alagoas.",
              "Relatórios de fomento, guias e editais publicados espontaneamente no portal caracterizam transparência ativa.",
              "A Lei Delegada nº 48/2022 regulamenta a vinculação administrativa e competência executiva da fundação."
            ]
          }
        ]
      },
      {
        id: 'divulgacao_cientifica',
        title: 'Divulgação Científica e Sistemas de Inovação',
        icon: 'Award',
        color: 'purple',
        difficulty: 'Difícil',
        weight: '15%',
        paretoJustification: 'A tradução de conteúdo técnico para linguagem leiga e a análise de indicadores científicos são atribuições vitais do jornalista de uma fundação de amparo como a FAPEAL. CEBRASPE cobra conceitos de bibliometria e o Manual de Oslo.',
        cards: [
          {
            id: 'jor-divulgacao-fatos',
            title: 'Divulgação Científica e Curadoria de Conteúdo',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A divulgação científica consiste em traduzir jargões técnicos para aproximar a ciência do cidadão comum:</p>
              <div class="bg-purple-50 p-3 rounded-lg border border-purple-200 text-xs mb-3 space-y-1">
                <p><strong>Tradução de Linguagem</strong>: Substituir termos de alta complexidade por analogias fáceis, sem perder o rigor científico.</p>
                <p><strong>Curadoria e Roteirização</strong>: Organizar e estruturar releases, guias de proponente e peças de campanhas digitais de fomento.</p>
                <p><strong>Linguagem Cidadã</strong>: Comunicação pública que assegura o direito à informação de forma transparente, inclusiva e inteligível.</p>
              </div>
            `,
            keyTakeaways: [
              "A divulgação científica requer conciliação entre o rigor metodológico e a acessibilidade de linguagem.",
              "Campanhas públicas de CT&I devem destacar o impacto social das pesquisas financiadas com recursos estaduais.",
              "Data Storytelling traduz dados bibliométricos de editais em narrativas atraentes para o público em geral."
            ]
          },
          {
            id: 'jor-indicadores-oslo',
            title: 'Indicadores Científicos e Manual de Oslo',
            paretoRatio: 'Alta Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">A gestão e análise bibliométrica servem para mensurar o impacto das publicações científicas e os tipos de inovação:</p>
              <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-600 text-xs mb-3 space-y-1">
                <p><strong>Métricas Bibliométricas</strong>: Análise de citações, fator de impacto de periódicos e rankings institucionais.</p>
                <p><strong>Tipos de Inovação (Manual de Oslo)</strong>: Classificação clássica de inovação em: Produto (bem ou serviço), Processo, Marketing ou Organizacional.</p>
                <p><strong>Sistemas de Inovação</strong>: Articulação tripla-hélice (Governo, Empresa e Universidade) que coordena recursos para o avanço regional.</p>
              </div>
            `,
            keyTakeaways: [
              "A análise bibliométrica quantifica o avanço e prestígio das áreas de pesquisa.",
              "Inovação de processo refere-se à implementação de um método de produção ou distribuição novo ou melhorado.",
              "Ambientes promotores de inovação incluem parques tecnológicos, incubadoras de startups e aceleradoras."
            ]
          }
        ]
      },
      {
        id: 'etica_imprensa',
        title: 'Ética e Legislação dos Meios',
        icon: 'Shield',
        color: 'rose',
        difficulty: 'Médio',
        weight: '15%',
        paretoJustification: 'A ética jornalística e o segredo de fonte são temas extremamente recorrentes. A banca CEBRASPE cobra o Código de Ética e a garantia constitucional do sigilo de fonte.',
        cards: [
          {
            id: 'jor-codigo-etica',
            title: 'Código de Ética dos Jornalistas',
            paretoRatio: 'Altíssima Frequência',
            isQuente: true,
            content: `
              <p class="mb-3">O Código de Ética dos Jornalistas Brasileiros dita os deveres e direitos profissionais em relação à sociedade:</p>
              <div class="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs mb-3 space-y-1">
                <p><strong>Direito à Informação</strong>: O acesso à informação é um direito fundamental do cidadão, e o jornalista é o seu mediador.</p>
                <p><strong>Segredo de Fonte</strong>: Resguardado constitucionalmente (Art. 5º, XIV) e reiterado pelo código como dever de não revelação.</p>
                <p><strong>Contraditório</strong>: Ouvir sempre as partes citadas em denúncias antes de qualquer publicação.</p>
              </div>
            `,
            keyTakeaways: [
              "O sigilo de fonte é uma garantia constitucional absoluta para o exercício do jornalismo.",
              "Deve-se evitar o sensacionalismo e respeitar a dignidade humana e a privacidade alheia.",
              "A retificação de erros deve ser tempestiva e proporcional ao agravo causado."
            ]
          }
        ],
      }
    ],
    quizQuestions: getJournalismQuestions()
  }
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

COURSES_CONFIG.tecnico_enfermagem.quizQuestions = deduplicateQuestions([
  ...COURSES_CONFIG.tecnico_enfermagem.quizQuestions,
  ...tecnicoEnfermagemFgvEbserhQuestions,
]);

// Add core topics to Journalism (Português, Inglês, TI Básica, Legislação, Alagoas)
COURSES_CONFIG.jornalismo.topics.push(
  { id: 'portugues', title: 'Língua Portuguesa', category: 'Português', subtopics: ['Reescrita de Frases', 'Coesão Textual', 'Crase e Regência', 'Pontuação CEBRASPE'] },
  { id: 'ingles', title: 'Língua Inglesa', category: 'Língua Inglesa', subtopics: ['Compreensão de Textos', 'Conectores e Advérbios', 'Tempos Verbais', 'Vocabulário Técnico'] },
  { id: 'ti_basica', title: 'TI Básica', category: 'TI Básica', subtopics: ['Redes de Computadores', 'Segurança da Informação', 'Backup e Criptografia'] },
  { id: 'marco_legal_cti', title: 'Marco Legal de CT&I', category: 'Ética e Compliance', subtopics: ['Constituição e EC 85/2015', 'Lei 10.973/2004 (Lei de Inovação)', 'Lei 13.243/2016', 'Decreto 9.283/2018', 'Encomenda Tecnológica (ETEC)'] },
  { id: 'legislacao_especifica_fapeal', title: 'Legislações Específicas (FAPEAL)', category: 'Ética e Compliance', subtopics: ['Lei Delegada 48/2022', 'Lei 7.117/2009', 'Lei 6.527/2004', 'L.C. 20/2002 e 5/1990', 'Lei 5.247/1991 (RJU)', 'Decreto 4.137/2009'] },
  { id: 'alagoas', title: 'Conhecimentos de Alagoas', category: 'Conhecimentos de Alagoas', subtopics: ['Emancipação Política', 'Geografia de Alagoas', 'Ciclo do Açúcar e História'] }
);

// Add core study sections to Journalism (Português, Inglês, TI Básica, Legislação, Alagoas)
COURSES_CONFIG.jornalismo.studySections.push(
  ...defaultSeplagSections.filter(section => ['portugues', 'ingles', 'ti', 'etica', 'alagoas', 'marco_legal_cti', 'legislacao_especifica_fapeal'].includes(section.id))
);

COURSES_CONFIG.jornalismo.topics = uniqueById(COURSES_CONFIG.jornalismo.topics);
COURSES_CONFIG.jornalismo.studySections = uniqueById(COURSES_CONFIG.jornalismo.studySections);

const reusableTopics = [...COMMON_BASIC_TOPICS, DISCURSIVE_TOPIC];
const commonBasicTopicIds = new Set(reusableTopics.map(topic => topic.id));
const commonBasicSectionIds = new Set([
  'portugues',
  'ingles',
  'ti',
  'marco_legal_cti',
  'legislacao_especifica_fapeal',
  'alagoas',
]);
const commonBasicSections = [
  ...defaultSeplagSections.filter(section => commonBasicSectionIds.has(section.id)),
  ETHICS_PUBLIC_SERVICE_SECTION,
  STATE_LEGISLATION_SECTION,
  DISCURSIVE_SECTION,
];
const commonBasicQuestionCategories = new Set([
  'Português',
  'Língua Inglesa',
  'TI Básica',
  'Ética e Compliance',
  'Conhecimentos de Alagoas',
]);
const commonBasicQuestions = defaultSeplagQuestions.filter(question => commonBasicQuestionCategories.has(question.category));
// These subjects are reusable knowledge blocks, not tied to a single job profile.
// Canonical lists replace the old abbreviated versions so equivalent entries are not duplicated.
Object.entries(COURSES_CONFIG).forEach(([courseId, config]) => {
  if (courseId === 'policial_civil') return;
  const specificTopics = config.topics.filter(topic => !commonBasicTopicIds.has(topic.id));
  config.topics = [
    ...reusableTopics.map(topic => ({
      ...topic,
      subtopics: [...topic.subtopics],
    })),
    ...specificTopics,
  ];
  config.studySections = uniqueById([...commonBasicSections, ...config.studySections]);
  config.quizQuestions = deduplicateQuestions([...config.quizQuestions, ...commonBasicQuestions]);
});

/**
 * Algorithmic generator of study weeks based on:
 * @param course selected course id
 * @param examDateStr the exam date string (YYYY-MM-DD)
 * @param studyDaysCount the total days the user can actively study
 * @param hoursPerDay hours per study day
 * @param selectedTopicIds list of topic ids they selected
 */
export function generateCustomPlan(
  course: string,
  examDateStr: string,
  studyDaysCount: number,
  hoursPerDay: number,
  selectedTopicIds: string[],
  selectedWeekdays?: number[],
  selectedSubtopicIds: string[] = [],
  selectedQuestionBoards: string[] = [],
): {
  success: boolean;
  sections: StudySection[];
  questions: Question[];
  weeks: ScheduleWeek[];
} {
  const config = COURSES_CONFIG[course] || COURSES_CONFIG.seplag_informatica;
  const selectedSubtopicsByTopic = new Map<string, string[]>();
  selectedSubtopicIds.forEach(value => {
    const separator = value.indexOf('::');
    if (separator < 0) return;
    const topicId = value.slice(0, separator);
    const label = value.slice(separator + 2);
    selectedSubtopicsByTopic.set(topicId, [...(selectedSubtopicsByTopic.get(topicId) || []), label]);
  });
  const hasSelectedTechnologySpecificTopic = selectedTopicIds.some(topicId => TECHNOLOGY_SPECIFIC_TOPIC_IDS.has(topicId));

  // 1. Filter the study sections by selected topics
  const filteredSections = config.studySections.filter(section =>
    selectedTopicIds.includes(section.id) ||
    (section.id === 'ti' && selectedTopicIds.includes('ti_basica')) ||
    (section.id === 'especificos' && hasSelectedTechnologySpecificTopic)
  ).map(section => {
    const configuredTopic = config.topics.find(topic => topic.id === section.id);
    if (configuredTopic) {
      const selectedSubtopics = selectedSubtopicsByTopic.get(section.id) || [];
      if (selectedSubtopics.length > 0) {
        const selectedCards = section.cards.filter(card => selectedSubtopics.includes(card.title));
        if (selectedCards.length > 0) return { ...section, cards: selectedCards };
      }
    }
    if (section.id !== DISCURSIVE_TOPIC_ID) return section;
    const selectedAreas = selectedSubtopicsByTopic.get(DISCURSIVE_TOPIC_ID) || [];
    if (selectedAreas.length === 0) return section;
    const selectedCards = section.cards.filter(card => selectedAreas.some(area => card.title.endsWith(`— ${area}`)));
    return selectedCards.length > 0 ? { ...section, cards: selectedCards } : section;
  });

  // If filtered sections are empty, fall back to showing all
  const sectionsToUse = filteredSections.length > 0 ? filteredSections : config.studySections;

  // 2. Filter the quiz questions to match selected topics
  const categoriesToInclude = sectionsToUse.map(s => s.title);
  const topicFilteredQuestions = config.quizQuestions.filter((q: any) => {
    // Check if category matches any used study sections
    return categoriesToInclude.some(catTitle =>
      q.category.toLowerCase().includes(catTitle.toLowerCase()) ||
      catTitle.toLowerCase().includes(q.category.toLowerCase()) ||
      // Reusable basic-knowledge mappings
      (q.category === 'TI Básica' && selectedTopicIds.includes('ti_basica')) ||
      (q.category === 'Português' && selectedTopicIds.includes('portugues')) ||
      (q.category === 'Ética e Compliance' && (selectedTopicIds.includes('marco_legal_cti') || selectedTopicIds.includes('legislacao_especifica_fapeal'))) ||
      // SEPLAG-specific mappings
      (course === 'seplag_informatica' && q.category === 'Ética e Compliance' && (selectedTopicIds.includes('etica') || selectedTopicIds.includes('legislacao_especifica_fapeal'))) ||
      (course === 'seplag_informatica' && q.category === 'Conhecimentos Específicos' && hasSelectedTechnologySpecificTopic) ||
      // Civil Police basic-knowledge mappings
      (course === 'policial_civil' && q.category === 'Português' && selectedTopicIds.includes('portugues')) ||
      (course === 'policial_civil' && q.category === 'TI Básica' && selectedTopicIds.includes('pc_ti_seguranca_cibernetica')) ||
      (course === 'policial_civil' && q.category === 'Ética e Compliance' && selectedTopicIds.includes('etica_servico_publico')) ||
      // Nursing-specific mappings
      (course === 'tecnico_enfermagem' && q.category === 'Legislação EBSERH' && selectedTopicIds.includes('etica_deontologia')) ||
      (course === 'tecnico_enfermagem' && q.category === 'Saúde Pública e SUS' && selectedTopicIds.includes('sus_saude_publica')) ||
      (course === 'tecnico_enfermagem' && q.category === 'Conhecimentos Específicos - Técnico em Enfermagem' && (
        selectedTopicIds.includes('fundamentos') ||
        selectedTopicIds.includes('urgencia_emergencia') ||
        selectedTopicIds.includes('farmacologia') ||
        selectedTopicIds.includes('etica_deontologia')
      )) ||
      // Journalism-specific mappings
      (course === 'jornalismo' && q.category === 'Conhecimentos Específicos - Jornalismo' && (
        selectedTopicIds.includes('teorias_com') ||
        selectedTopicIds.includes('redacao_jornalistica') ||
        selectedTopicIds.includes('assessoria_imprensa') ||
        selectedTopicIds.includes('jornalismo_digital') ||
        selectedTopicIds.includes('divulgacao_cientifica') ||
        selectedTopicIds.includes('etica_imprensa')
      )) ||
      (course === 'jornalismo' && q.category === 'Português' && selectedTopicIds.includes('portugues')) ||
      (course === 'jornalismo' && q.category === 'Língua Inglesa' && selectedTopicIds.includes('ingles')) ||
      (course === 'jornalismo' && q.category === 'TI Básica' && selectedTopicIds.includes('ti_basica')) ||
      (course === 'jornalismo' && q.category === 'Ética e Compliance' && (selectedTopicIds.includes('marco_legal_cti') || selectedTopicIds.includes('legislacao_especifica_fapeal'))) ||
      (course === 'jornalismo' && q.category === 'Conhecimentos de Alagoas' && selectedTopicIds.includes('alagoas'))
    );
  });

  const filteredQuestions = filterQuestionsByBoards(topicFilteredQuestions, selectedQuestionBoards);
  const questionsToUse = deduplicateQuestions(
    selectedQuestionBoards.length > 0
      ? filteredQuestions
      : filteredQuestions.length > 0 || course === 'policial_civil' ? filteredQuestions : config.quizQuestions
  );

  // 3. Generate dynamic study blocks and timeline comparing TODAY with EXAM DATE
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(examDateStr);

  // Calculate difference in days
  const timeDiff = examDate.getTime() - today.getTime();
  const daysRemaining = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  // We have W weeks of preparation. Let's calculate the number of weeks
  const numWeeks = Math.ceil(daysRemaining / 7);

  // If selectedWeekdays is provided, calculate exact study days and dates
  const weekdays = selectedWeekdays || [1, 2, 3, 4, 5, 6, 0]; // default all days (Mon to Sun)
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const allStudyDates: { date: Date; dateStr: string; weekdayName: string }[] = [];
  let tempDate = new Date(today);
  while (tempDate <= examDate) {
    const dayOfWeek = tempDate.getDay();
    if (weekdays.includes(dayOfWeek)) {
      allStudyDates.push({
        date: new Date(tempDate),
        dateStr: tempDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weekdayName: weekdayNames[dayOfWeek]
      });
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  const computedStudyDaysCount = allStudyDates.length > 0 ? allStudyDates.length : studyDaysCount;
  const totalHoursAvailable = computedStudyDaysCount * hoursPerDay;
  const hoursPerTopic = Math.max(2, Math.floor(totalHoursAvailable / sectionsToUse.length));

  const generatedWeeks: ScheduleWeek[] = [];

  // Create a timeline week-by-week
  for (let w = 1; w <= numWeeks; w++) {
    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() + (w - 1) * 7);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    // Ensure week end doesn't surpass exam date
    const finalEnd = weekEndDate > examDate ? examDate : weekEndDate;

    const dateRangeStr = `${weekStartDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${finalEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

    // Find study dates that fall within this specific week
    const weekStudyDates = allStudyDates.filter(d => d.date >= weekStartDate && d.date <= finalEnd);
    const studyDaysInWeekStr = weekStudyDates.map(d => `${d.weekdayName} ${d.dateStr}`).join(', ');
    const hoursInWeek = weekStudyDates.length * hoursPerDay;

    // Select 1 topic for this week
    const currentSectionIndex = (w - 1) % sectionsToUse.length;
    const activeSectionForWeek = sectionsToUse[currentSectionIndex];

    const blocks: StudyBlock[] = [];
    const configuredTopic = config.topics.find(topic =>
      topic.id === activeSectionForWeek.id ||
      (activeSectionForWeek.id === 'ti' && topic.id === 'ti_basica') ||
      topic.title.toLowerCase().includes(activeSectionForWeek.title.toLowerCase()) ||
      activeSectionForWeek.title.toLowerCase().includes(topic.title.toLowerCase())
    );
    const selectedSubtopics = configuredTopic ? selectedSubtopicsByTopic.get(configuredTopic.id) || [] : [];

    // Divide hours in this week among blocks (e.g. 40% theory, 60% exercises)
    const theoryHours = Math.ceil(hoursInWeek * 0.4) || 1;
    const exercisesHours = Math.ceil(hoursInWeek * 0.6) || 1;

    if (activeSectionForWeek.id === DISCURSIVE_TOPIC_ID) {
      const writingPrompt = activeSectionForWeek.cards[(w - 1) % activeSectionForWeek.cards.length];
      blocks.push({
        id: `${course}-w${w}-b1`,
        title: writingPrompt.title,
        duration: `${Math.max(1, hoursInWeek)}h`,
        methodology: 'Pomodoro 50+10: produção de redação completa, seguida de revisão de conteúdo e linguagem',
        subtopics: writingPrompt.keyTakeaways,
        done: false,
      });
    } else {
      // Add Theory & Revision Block
      blocks.push({
        id: `${course}-w${w}-b1`,
        title: `Estudo Dirigido: ${activeSectionForWeek.title}`,
        duration: `${theoryHours}h`,
        methodology: "Pomodoro 50+10: teoria ativa e resumo de Pareto",
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : activeSectionForWeek.cards.map(c => c.title),
        done: false
      });

      // Add Exercises Block
      blocks.push({
        id: `${course}-w${w}-b2`,
        title: `Treinamento de Questões: ${activeSectionForWeek.title}`,
        duration: `${exercisesHours}h`,
        methodology: "Pomodoro 50+10: questões de prova e revisão justificada",
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : activeSectionForWeek.cards.flatMap(c => c.keyTakeaways.slice(0, 2)),
        done: false
      });
    }

    // Add Final Exam Simulation if this is the last week
    if (w === numWeeks) {
      blocks.push({
        id: `${course}-w${w}-b3`,
        title: "Simulado de Fechamento Geral de Reta Final",
        duration: `${Math.max(2, hoursPerDay)}h`,
        methodology: "Pomodoro 50+10: simulado CEBRASPE e correção",
        subtopics: ["Todas as disciplinas integradas", "Análise de erros e nota líquida"],
        done: false
      });
    }

    let weekFocus = `Revisão do edital de Pareto de ${activeSectionForWeek.title}.`;
    if (weekStudyDates.length > 0) {
      weekFocus += ` Dias de estudo planejados (${hoursInWeek}h): ${studyDaysInWeekStr}.`;
    } else {
      weekFocus += ` Nenhum dia de estudo agendado para esta semana com os dias da semana escolhidos.`;
    }

    const contentTemplates=blocks.filter(block=>!block.title.includes('Questões'));
    const hourlyBlocks = weekStudyDates.flatMap((studyDate,dateIndex) => {
      const content=Array.from({length:Math.max(1,Math.round(hoursPerDay))},(_,slot)=>{
        const template=contentTemplates[slot%Math.max(1,contentTemplates.length)]||blocks[0];
        return {
          ...template,
          id:`${course}-w${w}-${studyDate.date.toISOString().slice(0,10)}-h${slot+1}`,
          day:studyDate.weekdayName,date:studyDate.dateStr,isoDate:studyDate.date.toISOString().slice(0,10),
          duration:'1h',durationMinutes:60,activityType:'THEORY' as const,
        };
      });
      const mandatory=dateIndex===weekStudyDates.length-1;
      const questions:StudyBlock={
        id:`${course}-w${w}-${studyDate.date.toISOString().slice(0,10)}-questions`,
        day:studyDate.weekdayName,date:studyDate.dateStr,isoDate:studyDate.date.toISOString().slice(0,10),
        title:mandatory?'Revisão semanal com questões':'Questões extras do dia',
        duration:mandatory?'1h':'30min',durationMinutes:mandatory?60:30,activityType:'QUESTIONS',
        isOptional:!mandatory,outsidePlannedHours:true,
        methodology:mandatory?'Revisão semanal obrigatória: 50 minutos de questões e 10 minutos de correção':'Treino extra opcional de questões e correção dos erros',
        subtopics:[activeSectionForWeek.title],done:false,
      };
      return [...content,questions];
    });

    generatedWeeks.push({
      id: `week-${w}`,
      title: `Semana ${w}: Foco em ${activeSectionForWeek.title}`,
      dateRange: dateRangeStr,
      focus: weekFocus,
      blocks: hourlyBlocks
    });
  }

  // If no weeks were generated (e.g. exam is today or in the past), generate at least 1 week
  if (generatedWeeks.length === 0) {
    generatedWeeks.push({
      id: 'week-1',
      title: 'Semana de Resgate e Revisão Geral',
      dateRange: 'Reta Final Imediata',
      focus: 'Revisão intensiva dos pontos quentes.',
      blocks: [
        {
          id: `${course}-rescue-1`,
          title: "Super Revisão de Pontos Quentes",
          duration: `${hoursPerDay}h`,
          methodology: "Estudo sinóptico focado nos cartões de estudo",
          subtopics: sectionsToUse.flatMap(s => s.cards.map(c => c.title)),
          done: false
        }
      ]
    });
  }

  return {
    success: true,
    sections: sectionsToUse,
    questions: questionsToUse,
    weeks: generatedWeeks
  };
}

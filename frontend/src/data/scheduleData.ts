import { ScheduleWeek } from '../types';

export const initialScheduleWeeks: ScheduleWeek[] = [
  {
    id: 'week-1',
    title: 'Semana 1: Fundações Básicas e Conhecimentos Locais',
    dateRange: '02/07 a 08/07',
    focus: 'Dominar os tópicos mais recorrentes das disciplinas gerais que costumam ser negligenciadas, mas que definem a linha de corte dos aprovados.',
    blocks: [
      {
        id: 'w1-b1',
        title: 'Português - Reescrita e Equivalência',
        duration: '4h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Interpretação e tipos textuais',
          'Técnicas de reescrita do CEBRASPE (preservação de nexos sintáticos)',
          'Substituição de conectores (conjunções explicativas, causais e conformativas)'
        ],
        done: false
      },
      {
        id: 'w1-b2',
        title: 'Português - Coesão e Pronomes',
        duration: '3h',
        methodology: '30% Teoria, 55% Exercícios, 15% Revisão',
        subtopics: [
          'Anáfora e Catáfora (retomada de elementos no texto)',
          'Emprego adequado de pronomes demonstrativos e relativos (especialmente "onde" vs "em que")',
          'Identificação de elipses e termos ocultos'
        ],
        done: false
      },
      {
        id: 'w1-b3',
        title: 'História e Emancipação de Alagoas',
        duration: '4h',
        methodology: '40% Teoria (Sintetizada), 45% Questões, 15% Revisão',
        subtopics: [
          'A Revolução Pernambucana de 1817 e a consequente Emancipação em 16/09/1817',
          'Elevação a Província em 1821',
          'Primeira capital (Marechal Deodoro) e transferência para Maceió em 1839'
        ],
        done: false
      },
      {
        id: 'w1-b4',
        title: 'Quilombo dos Palmares e Resistência Negra',
        duration: '3h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Formação na Serra da Barriga (mocambos confederados)',
          'Ganga Zumba (Tratado de Cucaú de 1678) e Zumbi dos Palmares',
          'A invasão final por Domingos Jorge Velho em 1694'
        ],
        done: false
      },
      {
        id: 'w1-b5',
        title: 'Geografia Física e Econômica de Alagoas',
        duration: '4h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Mesorregiões: Litoral, Zona da Mata, Agreste e Sertão (climas e solos)',
          'Importância estratégica do Rio São Francisco para o Sertão',
          'Economia: O binômio Cana-de-açúcar (Zona da Mata) e Turismo (Litoral)'
        ],
        done: false
      },
      {
        id: 'w1-b6',
        title: 'Ética e Moral + Decreto nº 1.171/94',
        duration: '4h',
        methodology: '30% Teoria, 60% Exercícios, 10% Revisão',
        subtopics: [
          'Diferenças conceituais entre Ética (teórica/universal) e Moral (prática/cultural)',
          'Pena máxima aplicável pelas comissões de ética: CENSURA',
          'Estrutura e formalidade dos pareceres éticos e notificações'
        ],
        done: false
      },
      {
        id: 'w1-b7',
        title: 'TI Básica - Computação em Nuvem',
        duration: '4h',
        methodology: '25% Teoria, 55% Exercícios, 20% Revisão',
        subtopics: [
          'Modelos de Serviços: IaaS (infraestrutura), PaaS (plataforma), SaaS (software final)',
          'Nuvem Comunitária (relevância CEBRASPE 2024)',
          'Nuvem Pública vs Privada vs Híbrida'
        ],
        done: false
      },
      {
        id: 'w1-b8',
        title: 'TI Básica - Backup e Malware',
        duration: '4h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Backup Completo vs Diferencial vs Incremental (gerenciamento do bit de arquivamento)',
          'Malwares comuns: Spywares (predator, screenloggers), Adwares e Phishing',
          'Funcionalidades de Firewalls de host e rede'
        ],
        done: false
      }
    ]
  },
  {
    id: 'week-2',
    title: 'Semana 2: Engenharia de Software e Banco de Dados Específico',
    dateRange: '09/07 a 15/07',
    focus: 'Aprofundamento no núcleo duro da disciplina de Conhecimentos Específicos. Foco em engenharia de software ágil e estrutura de dados relacionais.',
    blocks: [
      {
        id: 'w2-b1',
        title: 'Metodologias Ágeis de Desenvolvimento',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Scrum 2020: Papéis (PO, SM, Developers), Eventos e Artefatos',
          'XP (Extreme Programming): Valores, práticas de refatoração, programação em par',
          'Kanban: Quadro de fluxo de trabalho, limites de WIP (Work in Progress)'
        ],
        done: false
      },
      {
        id: 'w2-b2',
        title: 'Esteiras DevOps e CI/CD',
        duration: '6h',
        methodology: '25% Teoria, 55% Exercícios, 20% Revisão',
        subtopics: [
          'Conceitos de Integração Contínua e Entrega Contínua',
          'CircleCI (cache de dependências, docker nativo) e Jenkins (plugins, nodes)',
          'Reverse Proxy (Proxy Reverso) para balanceamento e segurança'
        ],
        done: false
      },
      {
        id: 'w2-b3',
        title: 'Qualidade de Código e Testes Automatizados',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Clean Code e análise estática (SonarQube)',
          'TDD (Test Driven Development): Ciclo Red-Green-Refactor',
          'Testes Unitários (isolamento por Mocks) vs Testes de Integração'
        ],
        done: false
      },
      {
        id: 'w2-b4',
        title: 'Modelagem e Normalização de Dados',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Primeira Forma Normal (1FN): Atributos atômicos',
          'Segunda Forma Normal (2FN): Dependência funcional completa da chave composta',
          'Terceira Forma Normal (3FN): Eliminação de dependências transitivas'
        ],
        done: false
      },
      {
        id: 'w2-b5',
        title: 'SQL Avançado e PostgreSQL',
        duration: '6h',
        methodology: '20% Teoria, 60% Exercícios, 20% Revisão',
        subtopics: [
          'Expressões de Tabela Comuns Recursivas (WITH RECURSIVE)',
          'Manipulação de JSON no Postgres e busca de texto (tsvector/tsquery)',
          'Transações Relacionais e propriedades ACID'
        ],
        done: false
      }
    ]
  },
  {
    id: 'week-3',
    title: 'Semana 3: Segurança Avançada de TI e Resoluções CNJ',
    dateRange: '16/07 a 22/07',
    focus: 'Garantir pontuação máxima na complexa disciplina de Segurança de TI e Legislações do Judiciário Nacional, além de fechar os tópicos restantes.',
    blocks: [
      {
        id: 'w3-b1',
        title: 'Protocolos de Autenticação e Criptografia',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'OAuth 2.0: Papéis, fluxos de concessão e Access Token (JWT vs opaco)',
          'Keycloak e mecanismos de Single Sign-On (SSO)',
          'Handshake TLS 1.3 vs TLS 1.2 (criptografia simétrica rápida com 1 RTT)'
        ],
        done: false
      },
      {
        id: 'w3-b2',
        title: 'Segurança de Infraestrutura e Redes',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Zero Trust Network Access (ZTNA): "Nunca confiar, sempre verificar"',
          'Privileged Access Management (PAM): Segregação de superusuários',
          'Security Information and Event Management (SIEM): Centralização de logs corporativos'
        ],
        done: false
      },
      {
        id: 'w3-b3',
        title: 'Vulnerabilidades e Ataques Comuns',
        duration: '6h',
        methodology: '25% Teoria, 55% Exercícios, 20% Revisão',
        subtopics: [
          'OWASP Top 10: SQL Injection, XSS, CSRF e referências inseguras de objetos',
          'Ataques de rede: DDoS, DoS, MiTM e AiTM',
          'Port Scanning (técnicas de SYN scan e respostas ICMP)'
        ],
        done: false
      },
      {
        id: 'w3-b4',
        title: 'Resoluções CNJ - PDPJ-Br e MoReq-Jus',
        duration: '6h',
        methodology: '40% Teoria (Sintetizada), 45% Exercícios, 15% Revisão',
        subtopics: [
          'Resolução nº 335/2020: Plataforma PDPJ-Br, APIs com Swagger 2.0, vedação a sistemas privados restritivos',
          'Resolução nº 522/2023: Modelo MoReq-Jus, requisitos de sistemas documentais, guarda em repositório confiável'
        ],
        done: false
      },
      {
        id: 'w3-b5',
        title: 'Resoluções CNJ - ENSEC-PJ e Fiscalização',
        duration: '6h',
        methodology: '30% Teoria, 50% Exercícios, 20% Revisão',
        subtopics: [
          'Resolução nº 396/2021: Estratégia Nacional de Segurança Cibernética do Judiciário',
          'Fiscalização de Contratos de TI: Lei nº 13.303/2016, SLA, preposto da contratada, pontos de função'
        ],
        done: false
      }
    ]
  },
  {
    id: 'week-4',
    title: 'Semana 4: Reta Final, Simulações e Preparação para o Dia D',
    dateRange: '23/07 a 25/07',
    focus: 'Revisões ultra-rápidas baseadas nos resumos de Pareto, fixação de pontos de decoreba e simulações para controle de ansiedade.',
    blocks: [
      {
        id: 'w4-b1',
        title: 'Revisão Espaçada Geral - Resumos Rápidos',
        duration: '6h',
        methodology: '10% Teoria (Resumos), 90% Revisão de Erros',
        subtopics: [
          'Revisão dos tópicos de Português (crase, elipse, reescrita)',
          'Revisão da Emancipação de Alagoas e história local',
          'Revisão rápida de Tally Prime, TDD, CMMI e Scrum'
        ],
        done: false
      },
      {
        id: 'w4-b2',
        title: 'Simulados de Certo ou Errado',
        duration: '6h',
        methodology: '100% Exercícios com foco em tempo de resposta',
        subtopics: [
          'Simulação de 50 Questões Certo/Errado (Controle de Tempo)',
          'Análise minuciosa de cada erro cometido e leitura de justificativas',
          'Estratégia de prova: decidir quando deixar questões em branco no estilo CEBRASPE'
        ],
        done: false
      },
      {
        id: 'w4-b3',
        title: 'Alinhamento Final e Logística',
        duration: '6h',
        methodology: 'Organização de material de suporte e controle mental',
        subtopics: [
          'Leitura rápida de pontos de decoreba (prazos do CNJ, datas históricas, regras de crase)',
          'Checklist de material: caneta esferográfica preta fabricada em material transparente',
          'Conferência do local de prova e horário exato de fechamento dos portões'
        ],
        done: false
      }
    ]
  }
];

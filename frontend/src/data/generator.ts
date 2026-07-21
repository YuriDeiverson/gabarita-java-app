import { Question, StudySection, ScheduleWeek, StudyBlock, QuestionCategory } from '../types';
import { studySections as defaultSeplagSections } from './studyData';
import { quizQuestions as defaultSeplagQuestions } from './quizData';
import { getJournalismQuestions } from './questionsJournalism';
import { deduplicateQuestions } from './questionGenerator';

// Curriculum structure and questions database for all 3 courses
export interface CourseTopic {
  id: string;
  title: string;
  category: string;
  subtopics: string[];
}

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
    description: "Concurso para Especialista em Gestão Pública (Tecnologia da Informação e Informática). Foco em Engenharia de Software, DevOps, Banco de Dados, Redes, Legislação de Alagoas, Marco Legal de CT&I e Estatuto da FAPEAL.",
    topics: [
      { id: 'portugues', title: 'Língua Portuguesa', category: 'Português', subtopics: ['Reescrita de Frases', 'Coesão Textual', 'Crase e Regência', 'Pontuação CEBRASPE'] },
      { id: 'ingles', title: 'Língua Inglesa', category: 'Língua Inglesa', subtopics: ['Compreensão de Textos', 'Conectores e Advérbios', 'Tempos Verbais', 'Vocabulário Técnico'] },
      { id: 'ti_basica', title: 'TI Básica', category: 'TI Básica', subtopics: ['Redes de Computadores', 'Segurança da Informação', 'Backup e Criptografia'] },
      { id: 'etica', title: 'Ética e Compliance', category: 'Ética e Compliance', subtopics: ['Decreto Estadual 4.383/2015', 'Código de Conduta da Administração Pública'] },
      { id: 'marco_legal_cti', title: 'Marco Legal de CT&I', category: 'Ética e Compliance', subtopics: ['Constituição e EC 85/2015', 'Lei 10.973/2004 (Lei de Inovação)', 'Lei 13.243/2016', 'Decreto 9.283/2018', 'Encomenda Tecnológica (ETEC)'] },
      { id: 'legislacao_especifica_fapeal', title: 'Legislações Específicas (FAPEAL)', category: 'Ética e Compliance', subtopics: ['Lei Delegada 48/2022', 'Lei 7.117/2009', 'Lei 6.527/2004', 'L.C. 20/2002 e 5/1990', 'Lei 5.247/1991 (RJU)', 'Decreto 4.137/2009'] },
      { id: 'alagoas', title: 'Conhecimentos de Alagoas', category: 'Conhecimentos de Alagoas', subtopics: ['Emancipação Política', 'Geografia de Alagoas', 'Ciclo do Açúcar e História'] },
      { id: 'especificos_devops', title: 'Conhecimentos Específicos: DevOps', category: 'Conhecimentos Específicos', subtopics: ['Docker e Kubernetes', 'CI/CD Pipelines', 'Monitoramento e Git'] },
      { id: 'especificos_db', title: 'Conhecimentos Específicos: Banco de Dados', category: 'Conhecimentos Específicos', subtopics: ['Modelagem Relacional e SQL', 'NoSQL e Transações ACID', 'Drizzle e Migrações'] },
    ],
    studySections: defaultSeplagSections,
    quizQuestions: defaultSeplagQuestions
  },
  tecnico_enfermagem: {
    name: "Técnico em Enfermagem",
    description: "Concurso público para provimento de vagas de Técnico em Enfermagem. Foco em Fundamentos de Enfermagem, Saúde Pública/SUS, Farmacologia Clínica, Urgência/Emergência e Ética Profissional.",
    topics: [
      { id: 'fundamentos', title: 'Fundamentos de Enfermagem', category: 'Fundamentos de Enfermagem', subtopics: ['Sinais Vitais e Monitorização', 'Higiene e Conforto do Paciente', 'Sondagens e Aspiração de Vias'] },
      { id: 'sus_saude_publica', title: 'SUS e Saúde Pública', category: 'Saúde Pública e SUS', subtopics: ['Leis Orgânicas da Saúde 8080/90 e 8142/90', 'Princípios do SUS: Integralidade e Universalidade', 'Calendário Nacional de Imunização (PNI)'] },
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
        title: 'SUS e Saúde Pública',
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
          }
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
      { id: 'teorias_com', title: 'Teorias da Comunicação', category: 'Teoria da Comunicação', subtopics: ['Agenda-Setting e Enquadramento', 'Gatekeeping e Newsmaking', 'Escola de Frankfurt e Indústria Cultural'] },
      { id: 'redacao_jornalistica', title: 'Técnicas de Redação', category: 'Técnicas de Redação', subtopics: ['Lead, Sub-lead e Estrutura', 'Pirâmide Invertida e Objetividade', 'Gêneros Jornalísticos: Opinião e Notícia'] },
      { id: 'assessoria_imprensa', title: 'Assessoria de Imprensa', category: 'Assessoria de Imprensa', subtopics: ['Press Release e Coletivas', 'Gerenciamento de Crises de Imagem', 'Media Training para Porta-vozes'] },
      { id: 'jornalismo_digital', title: 'Jornalismo Digital e Web', category: 'Jornalismo Digital', subtopics: ['SEO para Redação Jornalística', 'Redes Sociais e Monitoramento', 'Fake News e Verificação de Fatos'] },
      { id: 'marco_legal_cti', title: 'Marco Legal de CT&I', category: 'Ética e Compliance', subtopics: ['Constituição e EC 85/2015', 'Lei 10.973/2004 (Lei de Inovação)', 'Lei 13.243/2016', 'Decreto 9.283/2018', 'Encomenda Tecnológica (ETEC)'] },
      { id: 'legislacao_especifica_fapeal', title: 'Legislações Específicas (FAPEAL)', category: 'Ética e Compliance', subtopics: ['Lei Delegada 48/2022', 'Lei 7.117/2009', 'Lei 6.527/2004', 'L.C. 20/2002 e 5/1990', 'Lei 5.247/1991 (RJU)', 'Decreto 4.137/2009'] },
      { id: 'divulgacao_cientifica', title: 'Divulgação Científica e Sistemas de Inovação', category: 'Divulgação Científica', subtopics: ['Curadoria de Conteúdo de CT&I', 'Manual de Oslo', 'Análise Bibliométrica'] },
      { id: 'etica_imprensa', title: 'Ética e Legislação dos Meios', category: 'Ética e Compliance', subtopics: ['Código de Ética dos Jornalistas Brasileiros', 'Segredo de Fonte e Direito à Informação', 'Direito de Resposta e Ofensa'] }
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
  selectedSubtopicIds: string[] = []
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
  
  // 1. Filter the study sections by selected topics
  const filteredSections = config.studySections.filter(section => 
    selectedTopicIds.includes(section.id) || 
    // Fallback for default SEPLAG where section names might map slightly differently
    ((course === 'seplag_informatica' || course === 'jornalismo') && (
      (section.id === 'portugues' && selectedTopicIds.includes('portugues')) ||
      (section.id === 'ingles' && selectedTopicIds.includes('ingles')) ||
      (section.id === 'ti' && selectedTopicIds.includes('ti_basica')) ||
      (section.id === 'etica' && selectedTopicIds.includes('etica')) ||
      (section.id === 'alagoas' && selectedTopicIds.includes('alagoas')) ||
      (section.id === 'especifico' && (selectedTopicIds.includes('especificos_devops') || selectedTopicIds.includes('especificos_db')))
    ))
  );

  // If filtered sections are empty, fall back to showing all
  const sectionsToUse = filteredSections.length > 0 ? filteredSections : config.studySections;

  // 2. Filter the quiz questions to match selected topics
  const categoriesToInclude = sectionsToUse.map(s => s.title);
  const filteredQuestions = config.quizQuestions.filter((q: any) => {
    // Check if category matches any used study sections
    return categoriesToInclude.some(catTitle => 
      q.category.toLowerCase().includes(catTitle.toLowerCase()) || 
      catTitle.toLowerCase().includes(q.category.toLowerCase()) ||
      // SEPLAG-specific mappings
      (course === 'seplag_informatica' && q.category === 'TI Básica' && selectedTopicIds.includes('ti_basica')) ||
      (course === 'seplag_informatica' && q.category === 'Português' && selectedTopicIds.includes('portugues')) ||
      (course === 'seplag_informatica' && q.category === 'Ética e Compliance' && (selectedTopicIds.includes('etica') || selectedTopicIds.includes('marco_legal_cti') || selectedTopicIds.includes('legislacao_especifica_fapeal'))) ||
      (course === 'seplag_informatica' && q.category === 'Conhecimentos Específicos' && (selectedTopicIds.includes('especificos_devops') || selectedTopicIds.includes('especificos_db'))) ||
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

  const questionsToUse = deduplicateQuestions(filteredQuestions.length > 0 ? filteredQuestions : config.quizQuestions);

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
      topic.title.toLowerCase().includes(activeSectionForWeek.title.toLowerCase()) ||
      activeSectionForWeek.title.toLowerCase().includes(topic.title.toLowerCase())
    );
    const selectedSubtopics = configuredTopic ? selectedSubtopicsByTopic.get(configuredTopic.id) || [] : [];
    
    // Divide hours in this week among blocks (e.g. 40% theory, 60% exercises)
    const theoryHours = Math.ceil(hoursInWeek * 0.4) || 1;
    const exercisesHours = Math.ceil(hoursInWeek * 0.6) || 1;

    // Add Theory & Revision Block
    blocks.push({
      id: `${course}-w${w}-b1`,
      title: `Estudo Dirigido: ${activeSectionForWeek.title}`,
      duration: `${theoryHours}h`,
      methodology: "30% Teoria Ativa, 70% Resumo de Pareto",
      subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : activeSectionForWeek.cards.map(c => c.title),
      done: false
    });

    // Add Exercises Block
    blocks.push({
      id: `${course}-w${w}-b2`,
      title: `Treinamento de Questões: ${activeSectionForWeek.title}`,
      duration: `${exercisesHours}h`,
      methodology: "50% Questões de Prova, 50% Revisão Justificada",
      subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : activeSectionForWeek.cards.flatMap(c => c.keyTakeaways.slice(0, 2)),
      done: false
    });

    // Add Final Exam Simulation if this is the last week
    if (w === numWeeks) {
      blocks.push({
        id: `${course}-w${w}-b3`,
        title: "Simulado de Fechamento Geral de Reta Final",
        duration: `${Math.max(2, hoursPerDay)}h`,
        methodology: "Simulado Geral CEBRASPE Sob Pressão",
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

    generatedWeeks.push({
      id: `week-${w}`,
      title: `Semana ${w}: Foco em ${activeSectionForWeek.title}`,
      dateRange: dateRangeStr,
      focus: weekFocus,
      blocks: blocks
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

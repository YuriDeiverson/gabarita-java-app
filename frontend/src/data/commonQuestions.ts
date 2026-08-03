import { Question } from '../types';

export const commonQuestions: Question[] = [
  // LÍNGUA PORTUGUESA (IDs 301-310)
  {
    id: 301,
    category: 'Português',
    text: 'Na frase "A assessoria de imprensa da FAPEAL, que atua na divulgação científica das pesquisas desenvolvidas no estado, elaborou um relatório completo", a supressão das vírgulas alteraria o sentido do período, transformando a oração adjetiva explicativa em restritiva.',
    correct: 'Certo',
    explanation: 'Correto. As orações subordinadas adjetivas explicativas vêm entre vírgulas. A supressão das vírgulas torna-as restritivas, o que altera semanticamente o período (passaria a restringir que apenas uma assessoria de imprensa específica elaborou o relatório, em vez de explicar o papel da assessoria da FAPEAL).',
    reference: 'CEBRASPE - Sintaxe da Oração e do Período'
  },
  {
    id: 302,
    category: 'Português',
    text: 'No período "Caso o pesquisador cumpra todos os requisitos exigidos pelo edital, o fomento financeiro será liberado", a conjunção "Caso" pode ser substituída por "Se" sem que haja necessidade de qualquer alteração na forma verbal subsequente.',
    correct: 'Errado',
    explanation: 'Errado. A conjunção condicional "Caso" exige o verbo no presente do subjuntivo ("cumpra"), enquanto a conjunção "Se" exige o verbo no futuro do subjuntivo ("cumprir"). Portanto, a substituição direta sem ajuste verbal de "cumpra" para "cumprir" causaria erro gramatical.',
    reference: 'CEBRASPE - Correlação e Emprego de Tempos Verbais'
  },
  {
    id: 303,
    category: 'Português',
    text: 'A ocorrência do sinal indicativo de crase em "O comitê gestor de CT&I deu parecer favorável à implementação de novas bolsas de estudo" está correta, pois o termo "favorável" rege a preposição "a" e a palavra "implementação" é precedida pelo artigo feminino "a".',
    correct: 'Certo',
    explanation: 'Correto. Trata-se do caso clássico de regência nominal do adjetivo "favorável" (favorável a algo) somado ao artigo feminino definido que acompanha o substantivo feminino "implementação" (a implementação), resultando em "à".',
    reference: 'CEBRASPE - Emprego do Sinal Indicativo de Crase'
  },
  {
    id: 304,
    category: 'Português',
    text: 'A concordância verbal está inteiramente correta na frase: "Constatou-se, após a verificação dos dados bibliométricos de Alagoas, diversas inconsistências nos relatórios de fomento apresentados pelos candidatos."',
    correct: 'Errado',
    explanation: 'Errado. O pronome "se" atua como partícula apassivadora do verbo transitivo direto "constatar". Portanto, o sujeito paciente é "diversas inconsistências", o que exige a flexão do verbo no plural: "Constataram-se [...] diversas inconsistências".',
    reference: 'CEBRASPE - Concordância e Vozes Verbais'
  },
  {
    id: 305,
    category: 'Português',
    text: 'Em relação à colocação pronominal, a frase "Não se admitirá a concessão de bolsas a candidatos com pendências documentais" está correta, uma vez que o advérbio de negação "Não" é palavra atrativa que exige a próclise.',
    correct: 'Certo',
    explanation: 'Correto. Palavras de sentido negativo como "Não", "Nunca" e "Jamais" são fatores atrativos obrigatórios para a próclise (pronome posicionado antes do verbo), mesmo que o verbo esteja no futuro do presente.',
    reference: 'CEBRASPE - Colocação dos Pronomes Átonos'
  },
  {
    id: 306,
    category: 'Português',
    text: 'A inserção de uma vírgula imediatamente após o sujeito no período "Os servidores aprovados no concurso da FAPEAL, deverão apresentar-se à gerência de recursos humanos amanhã" mantém a correção gramatical, dado o caráter enfático da pausa.',
    correct: 'Errado',
    explanation: 'Errado. É terminantemente proibido o uso de vírgula simples entre o sujeito ("Os servidores aprovados no concurso da FAPEAL") e o seu respectivo predicado ("deverão apresentar-se..."), pois isso rompe a estrutura sintática direta essencial da oração.',
    reference: 'CEBRASPE - Pontuação Básica'
  },
  {
    id: 307,
    category: 'Português',
    text: 'Na reescrita do trecho "Maceió cresceu muito nos últimos anos" para "O crescimento de Maceió intensificou-se no período recente", preservam-se tanto a correção gramatical quanto as relações de sentido essenciais do período original.',
    correct: 'Certo',
    explanation: 'Correto. A reescrita mantém a ideia de expansão/crescimento de Maceió em termos temporais aproximados ("últimos anos" equivale a "período recente"), preservando a correção gramatical com o uso correto da voz reflexiva.',
    reference: 'CEBRASPE - Reescrita de Frases'
  },
  {
    id: 308,
    category: 'Português',
    text: 'A palavra "eminentemente" (como em "um cargo eminentemente técnico") é sinônima perfeita de "iminentemente", podendo ser por esta substituída em qualquer contexto sem prejuízo ao sentido do texto.',
    correct: 'Errado',
    explanation: 'Errado. Trata-se de palavras parônimas com sentidos bem distintos: "eminentemente" significa principalmente, notadamente, de forma superior; "iminentemente" refere-se àquilo que está prestes a ocorrer (iminente). A substituição alteraria gravemente o sentido.',
    reference: 'CEBRASPE - Significação e Semântica de Palavras'
  },
  {
    id: 309,
    category: 'Português',
    text: 'No período "O analista de processos iniciou o mapeamento; contudo, a falta de dados integrados impediu a conclusão tempestiva", a conjunção "contudo" expressa uma relação de oposição e pode ser substituída, com ajustes de pontuação, por "entretanto" ou "no entanto" sem alteração de sentido.',
    correct: 'Certo',
    explanation: 'Correto. "Contudo", "entretanto" e "no entanto" são conjunções coordenativas adversativas, indicando oposição/contraste entre as orações coordenadas e mantendo perfeita equivalência semântica.',
    reference: 'CEBRASPE - Conjunções Coordenativas'
  },
  {
    id: 310,
    category: 'Português',
    text: 'No trecho "A inovação tecnológica traz grandes avanços, posto que acarreta riscos que devem ser geridos", o conector "posto que" introduz uma oração com sentido concessivo equivalente a "embora".',
    correct: 'Certo',
    explanation: 'Correto. A locução conjuntiva "posto que" possui valor concessivo por excelência na tradição culta da língua portuguesa, equivalente a "embora", "ainda que" ou "mesmo que".',
    reference: 'CEBRASPE - Orações Concessivas e Conectores'
  },

  // LÍNGUA INGLESA (IDs 311-320)
  {
    id: 311,
    category: 'Língua Inglesa',
    text: 'In the sentence "The state foundation has funded several research projects to foster local development", the word "foster" can be correctly translated to Portuguese as "promover" or "estimular".',
    correct: 'Certo',
    explanation: 'Correto. O verbo "to foster" no contexto de desenvolvimento ou inovação significa promover, incentivar, estimular, nutrir ou apoiar o crescimento de algo.',
    reference: 'CEBRASPE - English Vocabulary and Comprehension'
  },
  {
    id: 312,
    category: 'Língua Inglesa',
    text: 'In the sentence "Although artificial intelligence offers great efficiency, it still requires strict human oversight", the word "Although" introduces an idea of addition and could be replaced by "Furthermore" without changing the meaning.',
    correct: 'Errado',
    explanation: 'Errado. "Although" expressa uma ideia de contraste ou concessão (embora, ainda que), enquanto "Furthermore" expressa adição (além disso). A troca mudaria completamente a relação lógica entre as orações.',
    reference: 'CEBRASPE - English Connectors'
  },
  {
    id: 313,
    category: 'Língua Inglesa',
    text: 'In technical English texts, the phrase "Since the implementation of the new database system, query speed has improved significantly" uses the Present Perfect tense ("has improved") correctly to describe an action that started in the past and continues to have effects in the present.',
    correct: 'Certo',
    explanation: 'Correto. O Present Perfect ("has improved") é usado para ações que se iniciaram no passado (marcado por "since" - desde) e trazem consequências ou continuam até o presente.',
    reference: 'CEBRASPE - English Verb Tenses'
  },
  {
    id: 314,
    category: 'Língua Inglesa',
    text: 'In the clause "The research agency released its annual budget, highlighting that it would focus on sustainable innovation", the pronoun "it" refers back to "the research agency".',
    correct: 'Certo',
    explanation: 'Correto. O pronome neutro singular "it" funciona como referência anafórica ao sujeito inanimado "the research agency" mencionado anteriormente na oração principal.',
    reference: 'CEBRASPE - English Pronouns and Reference'
  },
  {
    id: 315,
    category: 'Língua Inglesa',
    text: 'In the sentence "According to state regulations, candidates must submit their research proposals before the deadline", the modal verb "must" expresses a mild recommendation or suggestion.',
    correct: 'Errado',
    explanation: 'Errado. O modal "must" expressa uma obrigação estrita, necessidade ou imposição regulatória (deve, tem a obrigação de), e não uma mera recomendação suave (que seria expressa por "should" ou "ought to").',
    reference: 'CEBRASPE - English Modal Verbs'
  },
  {
    id: 316,
    category: 'Língua Inglesa',
    text: 'The passive voice sentence "New guidelines were established by the board of directors to ensure accountability" can be rewritten in the active voice as "The board of directors established new guidelines to ensure accountability" while maintaining grammatical correctness and semantic equivalence.',
    correct: 'Certo',
    explanation: 'Correto. A reescrita inverte corretamente o agente da passiva ("the board of directors") para a posição de sujeito na voz ativa e o verbo no passado simples ("were established" -> "established"), mantendo o sentido exato.',
    reference: 'CEBRASPE - English Voice Conversions'
  },
  {
    id: 317,
    category: 'Língua Inglesa',
    text: 'In the sentence "To apply for the innovation grant, researchers must comply with all requirements", the phrasal verb "comply with" means "to oppose or challenge".',
    correct: 'Errado',
    explanation: 'Errado. "Comply with" significa obedecer, agir em conformidade, cumprir ou submeter-se a um conjunto de regras (em português: cumprir, estar em conformidade com), sendo o oposto de "to oppose" (opor-se).',
    reference: 'CEBRASPE - English Phrasal Verbs'
  },
  {
    id: 318,
    category: 'Língua Inglesa',
    text: 'The word "nonetheless" in the sentence "The project presented high risks; nonetheless, the committee decided to proceed due to its high potential" functions as an adversative linker, similar in meaning to "however" or "nevertheless".',
    correct: 'Certo',
    explanation: 'Correto. "Nonetheless" é um conector de contraste/adversidade (todavia, contudo, entretanto), funcionando exatamente como "however" ou "nevertheless".',
    reference: 'CEBRASPE - English Transition Words'
  },
  {
    id: 319,
    category: 'Língua Inglesa',
    text: 'In "The FAPEAL program aims to bridge the gap between academic research and industrial application", the expression "bridge the gap" is used metaphorically to mean "reduce the distance or build a connection".',
    correct: 'Certo',
    explanation: 'Correto. A expressão idiomática "bridge the gap" significa literalmente construir uma ponte sobre a lacuna, ou seja, aproximar dois setores distantes, superando diferenças ou barreiras.',
    reference: 'CEBRASPE - English Idioms and Metaphors'
  },
  {
    id: 320,
    category: 'Língua Inglesa',
    text: 'In the sentence "Researchers should not disclose proprietary data without written authorization", the word "disclose" means "to hide or conceal confidential information".',
    correct: 'Errado',
    explanation: 'Errado. "Disclose" significa revelar, expor, divulgar ou tornar público (em português: revelar, divulgar), sendo o exato oposto de "to hide" (esconder) ou "to conceal" (ocultar).',
    reference: 'CEBRASPE - English Vocabulary'
  },

  // NOÇÕES DE INFORMÁTICA (IDs 321-330)
  {
    id: 321,
    category: 'TI Básica',
    text: 'No sistema operacional Windows 10/11, o atalho de teclado "Tecla do Windows + L" é utilizado para alternar rapidamente entre as janelas abertas na Área de Trabalho (desktop), minimizando-as em sequência.',
    correct: 'Errado',
    explanation: 'Errado. O atalho "Win + L" serve para bloquear o computador instantaneamente ou alternar de usuário, exigindo senha para desbloqueio. O atalho para mostrar ou ocultar a Área de Trabalho é "Win + D", e para alternar janelas é "Alt + Tab".',
    reference: 'CEBRASPE - Atalhos do Windows'
  },
  {
    id: 322,
    category: 'TI Básica',
    text: 'No Microsoft Word, a funcionalidade "Controlar Alterações" permite que os usuários visualizem todas as inserções, exclusões e modificações de formatação feitas por revisores no documento de texto, facilitando o trabalho colaborativo.',
    correct: 'Certo',
    explanation: 'Correto. O controle de alterações rastreia de forma ativa cada modificação no documento, permitindo ao autor aceitar ou rejeitar as revisões sugeridas individualmente.',
    reference: 'CEBRASPE - Recursos do Microsoft Word'
  },
  {
    id: 323,
    category: 'TI Básica',
    text: 'No Microsoft Excel, ao inserir a fórmula "=SOMA($A$1:A10)" na célula B1 e arrastá-la verticalmente para a célula B2, o intervalo da soma será automaticamente atualizado para "=SOMA($A$1:A11)".',
    correct: 'Certo',
    explanation: 'Correto. O uso do caractere "$" antes de A e de 1 ($A$1) cria uma referência absoluta, travando a célula inicial do intervalo. A célula final (A10) possui referência relativa e, portanto, desloca-se uma linha para baixo (virando A11) ao ser arrastada.',
    reference: 'CEBRASPE - Referências no Excel'
  },
  {
    id: 324,
    category: 'TI Básica',
    text: 'Os navegadores modernos de internet, como Google Chrome e Microsoft Edge, dispõem de navegação anônima (ou "InPrivate"), que impede que provedores de internet (ISPs) e sítios de busca rastreiem o endereço IP físico do usuário durante seu acesso.',
    correct: 'Errado',
    explanation: 'Errado. A navegação anônima apenas evita salvar localmente no computador o histórico de navegação, cookies, senhas e dados de formulários. Ela NÃO oculta o endereço IP e não impede o monitoramento por provedores de internet, administradores de rede local ou pelos sites visitados.',
    reference: 'CEBRASPE - Navegadores e Privacidade'
  },
  {
    id: 325,
    category: 'TI Básica',
    text: 'No Microsoft Outlook, ao responder a um e-mail contendo vários destinatários, a opção "Responder a Todos" garante que todos os endereços listados nos campos "Para" e "Cc" receberão a nova resposta, ao passo que os endereços listados no campo "Cco" (Cópia Oculta) serão omitidos.',
    correct: 'Certo',
    explanation: 'Correto. O campo "Cco" oculta as identidades dos destinatários. Portanto, ao acionar "Responder a Todos", o Outlook não envia a mensagem para os e-mails ocultados, preservando o sigilo original da lista de cópias ocultas.',
    reference: 'CEBRASPE - Correio Eletrônico'
  },
  {
    id: 326,
    category: 'TI Básica',
    text: 'O ransomware é uma praga virtual que ataca computadores criptografando os dados do usuário e exigindo o pagamento de resgate (geralmente em criptomoedas) para que a chave de decodificação seja fornecida.',
    correct: 'Certo',
    explanation: 'Correto. Trata-se da exata definição e modo de operação do ransomware, um tipo de malware altamente perigoso focado em extorsão financeira baseada no sequestro de dados corporativos ou pessoais.',
    reference: 'CEBRASPE - Segurança da Informação e Malwares'
  },
  {
    id: 327,
    category: 'TI Básica',
    text: 'Um firewall de rede atua como uma barreira que filtra o tráfego de pacotes entre uma rede confiável e a internet. Ele é dotado de capacidade autônoma para detectar e excluir vírus residentes no disco rígido do computador local.',
    correct: 'Errado',
    explanation: 'Errado. O firewall controla o tráfego de rede (entrada e saída de dados com base em regras de porta e IP). Ele não possui a função de varredura ou exclusão de vírus residentes no disco de armazenamento local; essa tarefa é de competência exclusiva de um software antivírus.',
    reference: 'CEBRASPE - Segurança de Redes e Firewalls'
  },
  {
    id: 328,
    category: 'TI Básica',
    text: 'A computação na nuvem (cloud computing) na modalidade SaaS (Software as a Service) refere-se ao aluguel de infraestrutura básica de rede, máquinas virtuais e servidores físicos brutos para que a organização crie seu próprio banco de dados do zero.',
    correct: 'Errado',
    explanation: 'Errado. O aluguel de infraestrutura básica de rede, servidores virtuais e armazenamento bruto é classificado como IaaS (Infrastructure as a Service). O SaaS (Software as a Service) disponibiliza o software pronto para uso do cliente final via navegador (ex: Office 365, Gmail).',
    reference: 'CEBRASPE - Computação na Nuvem'
  },
  {
    id: 329,
    category: 'TI Básica',
    text: 'Uma intranet é uma rede de computadores privada de acesso exclusivo aos colaboradores de uma organização, a qual utiliza os mesmos protocolos de comunicação (como o TCP/IP) e tecnologias consagrados na Internet.',
    correct: 'Certo',
    explanation: 'Correto. A intranet funciona exatamente como uma internet corporativa privada, utilizando a mesma pilha de protocolos padrão TCP/IP e serviços (como servidores web HTTP) restritos a usuários autenticados da rede local institucional.',
    reference: 'CEBRASPE - Intranet e Protocolos'
  },
  {
    id: 330,
    category: 'TI Básica',
    text: 'No gerenciamento de cópias de segurança (backup), o backup incremental copia apenas os arquivos criados ou modificados desde a realização do último backup completo de dados, sendo o processo de backup mais rápido em relação ao backup diferencial.',
    correct: 'Errado',
    explanation: 'Errado. O backup incremental copia os arquivos criados ou alterados desde o último backup de qualquer tipo (seja completo ou outro incremental). O backup diferencial copia os dados alterados desde o último backup completo.',
    reference: 'CEBRASPE - Procedimentos de Backup'
  },

  // MARCO LEGAL DA CT&I E LEGISLAÇÕES ESPECÍFICAS (IDs 331-345)
  {
    id: 331,
    category: 'Ética e Compliance',
    text: 'De acordo com o Marco Legal de CT&I (Lei Federal nº 13.243/2016), as ICTs públicas brasileiras podem compartilhar o uso de seus laboratórios, equipamentos e recursos humanos com empresas privadas para atividades de pesquisa e desenvolvimento, mediante contrapartida financeira ou não financeira.',
    correct: 'Certo',
    explanation: 'Correto. O Marco Legal incentiva o compartilhamento de infraestruturas tecnológicas públicas (ICTs) e pessoal técnico com o setor privado para aproximar a ciência do mercado, superando travas burocráticas históricas.',
    reference: 'Lei Federal nº 13.243/2016'
  },
  {
    id: 332,
    category: 'Ética e Compliance',
    text: 'A subvenção econômica constitui modalidade de fomento financeiro em que recursos públicos são aplicados diretamente em empresas de direito privado para projetos de inovação tecnológica, sendo obrigatória a devolução integral desses valores ao erário caso o projeto obtenha sucesso comercial.',
    correct: 'Errado',
    explanation: 'Errado. A subvenção econômica é fomento financeiro de recursos não reembolsáveis (ou seja, valores que a empresa privada não precisa devolver ao Estado), aplicados sob partilha de risco tecnológico para estimular o desenvolvimento científico industrial nacional.',
    reference: 'Lei Federal nº 10.973/2004 - Lei de Inovação'
  },
  {
    id: 333,
    category: 'Ética e Compliance',
    text: 'Nos termos da Lei Estadual nº 8.956/2023 de Alagoas, a FAPEAL detém personalidade jurídica de direito público e autonomia administrativa e financeira, cabendo-lhe amparar financeiramente e apoiar projetos que visem ao avanço científico e tecnológico do estado.',
    correct: 'Certo',
    explanation: 'Correto. A FAPEAL possui autonomia financeira e administrativa, atuando como o principal instrumento público descentralizado do Estado de Alagoas para fomento, bolsas e financiamento de pesquisas científicas de ponta.',
    reference: 'Lei Estadual nº 8.956/2023'
  },
  {
    id: 334,
    category: 'Ética e Compliance',
    text: 'Conforme a Lei Estadual nº 6.527/2004 (PCCV FAPEAL), o desenvolvimento funcional dos servidores pertencentes ao quadro permanente da fundação ocorre por meio de progressão e promoção, as quais estão estritamente vinculadas a critérios de tempo de serviço ininterrupto, vedada a avaliação por desempenho.',
    correct: 'Errado',
    explanation: 'Errado. O Plano de Cargos, Carreiras e Vencimentos (PCCV) da FAPEAL estabelece o desenvolvimento funcional por critérios objetivos de capacitação técnica, titulação acadêmica e avaliação periódica de desempenho, e não puramente por tempo de serviço.',
    reference: 'Lei Estadual nº 6.527/2004'
  },
  {
    id: 335,
    category: 'Ética e Compliance',
    text: 'De acordo com o Regime Jurídico Único (RJU) dos Servidores Públicos do Estado de Alagoas (Lei Estadual nº 5.247/1991), é permitida a acumulação remunerada de um cargo público de professor com outro técnico ou científico, contanto que haja compatibilidade de horários.',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de uma exceção constitucional clássica e legalmente agasalhada no RJU de Alagoas (Artigo 142), exigindo sempre a compatibilidade real de jornada de trabalho nas duas funções.',
    reference: 'Lei Estadual nº 5.247/1991 - RJU AL'
  },
  {
    id: 336,
    category: 'Ética e Compliance',
    text: 'À luz da Lei Estadual nº 5.247/1991, o servidor estável de Alagoas perderá seu cargo público em virtude de processo administrativo disciplinar (PAD) em que se lhe assegure ampla defesa, ou de sentença judicial transitada em julgado.',
    correct: 'Certo',
    explanation: 'Correto. A estabilidade adquirida após três anos de estágio probatório protege o servidor estadual, que só pode perder o cargo em situações extremas justificadas por trânsito em julgado de sentença, processo administrativo disciplinar regular, ou avaliação periódica.',
    reference: 'Lei Estadual nº 5.247/1991 - Estabilidade'
  },
  {
    id: 337,
    category: 'Ética e Compliance',
    text: 'A Lei de Acesso à Informação (LAI) dispõe que, quando a informação solicitada pelo cidadão estiver disponível em formato digital e não exigir tratamento adicional, o órgão público poderá cobrar tarifas adicionais para disponibilizar o link de download.',
    correct: 'Errado',
    explanation: 'Errado. O fornecimento de informações públicas deve ser gratuito, ressalvada a cobrança de custos estritamente necessários para a reprodução física de documentos (como cópias de papel ou mídias físicas), vedada a cobrança por consultas digitais diretas.',
    reference: 'Lei de Acesso à Informação - Lei nº 12.527/2011'
  },
  {
    id: 338,
    category: 'Ética e Compliance',
    text: 'O Decreto Estadual nº 4.383/2015, que regulamenta a aplicação da Lei Anticorrupção no âmbito do Poder Executivo de Alagoas, prevê a responsabilização administrativa objetiva de pessoas jurídicas pela prática de atos lesivos contra a administração pública estadual.',
    correct: 'Certo',
    explanation: 'Correto. A Lei Anticorrupção (Lei Federal 12.846/2013) e o respectivo Decreto Estadual 4.383/2015 adotam a teoria da responsabilidade civil e administrativa objetiva da empresa, o que dispensa a comprovação de culpa ou dolo de seus diretores para fins de sanção.',
    reference: 'Decreto Estadual nº 4.383/2015'
  },
  {
    id: 339,
    category: 'Ética e Compliance',
    text: 'No fomento de Ciência e Tecnologia, a modalidade de "Encomenda Tecnológica (ETEC)" caracteriza-se pela ausência de risco tecnológico, destinando-se a compras comuns de insumos de prateleira amplamente disponíveis no mercado internacional com concorrência por menor preço.',
    correct: 'Errado',
    explanation: 'Errado. A Encomenda Tecnológica destina-se a contratar o desenvolvimento de soluções e produtos que NÃO existem no mercado e que envolvem elevado grau de risco e incerteza científica (risco tecnológico), sendo contratada mediante dispensa de licitação.',
    reference: 'Lei nº 13.243/2016 - Encomenda Tecnológica'
  },
  {
    id: 340,
    category: 'Ética e Compliance',
    text: 'Segundo a Lei Estadual nº 8.956/2023, constituem receitas da FAPEAL, entre outras, os recursos financeiros anuais previstos na lei orçamentária anual do Estado de Alagoas, correspondentes a um percentual da receita líquida ordinária estadual.',
    correct: 'Certo',
    explanation: 'Correto. A dotação orçamentária fixa e constitucional do Estado assegura a previsibilidade de recursos líquidos que devem ser transferidos à FAPEAL para manutenção do fomento acadêmico regional.',
    reference: 'Lei Estadual nº 8.956/2023'
  },
  {
    id: 341,
    category: 'Ética e Compliance',
    text: 'O estágio probatório dos servidores nomeados para cargo de provimento efetivo do Estado de Alagoas possui duração de 24 meses, período no qual são avaliados fatores como assiduidade, disciplina, capacidade de iniciativa e produtividade.',
    correct: 'Errado',
    explanation: 'Errado. Com a Emenda Constitucional nº 19/1998, o prazo de estágio probatório para aquisição de estabilidade no serviço público passou a ser de 3 anos (36 meses) de efetivo exercício, e não 24 meses.',
    reference: 'Lei Estadual nº 5.247/1991 e Constituição Federal'
  },
  {
    id: 342,
    category: 'Ética e Compliance',
    text: 'No Regime Jurídico Único de Alagoas, a "reintegração" é o retorno do servidor demitido ao cargo anteriormente ocupado, com ressarcimento integral de todos os vencimentos e vantagens devidos, em decorrência de decisão administrativa ou judicial que anule a sua demissão.',
    correct: 'Certo',
    explanation: 'Correto. Esta é a definição perfeita de reintegração. Caso o cargo tenha sido extinto, o servidor reintegrado ficará em disponibilidade remunerada até seu aproveitamento.',
    reference: 'Lei Estadual nº 5.247/1991 - Reintegração'
  },
  {
    id: 343,
    category: 'Ética e Compliance',
    text: 'A concessão de bolsas de incentivo por ICTs e órgãos de fomento como a FAPEAL a pesquisadores participantes de projetos científicos públicos é considerada fato gerador de impostos sobre serviços de qualquer natureza (ISS) e de imposto de renda retido na fonte (IRRF).',
    correct: 'Errado',
    explanation: 'Errado. Conforme a legislação federal e o Marco Legal de CT&I, as bolsas destinadas estritamente a estudos e pesquisas científicas e tecnológicas concedidas por órgãos públicos de fomento possuem natureza jurídica de doação científica e gozam de isenção tributária legal de IRRF e encargos previdenciários.',
    reference: 'Lei nº 13.243/2016 e Legislação Tributária'
  },
  {
    id: 344,
    category: 'Ética e Compliance',
    text: 'Nos termos do Decreto Estadual nº 4.383/2015, a instauração do Processo Administrativo de Responsabilização (PAR) de pessoas jurídicas acusadas de fraudar licitações estaduais cabe privativamente ao Governador do Estado, vedada a delegação de competência aos secretários.',
    correct: 'Errado',
    explanation: 'Errado. A competência para instauração do Processo de Responsabilização Administrativa (PAR) pode ser delegada aos titulares das pastas (como o Secretário da SEPLAG) ou dirigentes de autarquias e fundações no âmbito do Poder Executivo de Alagoas.',
    reference: 'Decreto Estadual nº 4.383/2015'
  },
  {
    id: 345,
    category: 'Ética e Compliance',
    text: 'Na classificação de sigilo da informação disciplinada pela Lei de Acesso à Informação, os prazos máximos de restrição de acesso público são: 5 anos para informações reservadas; 15 anos para secretas; e 25 anos para ultrassecretas.',
    correct: 'Certo',
    explanation: 'Correto. Trata-se dos prazos legais exatos determinados no Artigo 24 da Lei de Acesso à Informação (Lei Federal nº 12.527/2011) aplicados na esfera pública brasileira.',
    reference: 'Lei nº 12.527/2011 - Prazos de Sigilo'
  },

  // CONHECIMENTOS DO ESTADO DE ALAGOAS (IDs 346-355)
  {
    id: 346,
    category: 'Conhecimentos de Alagoas',
    text: 'A emancipação política de Alagoas ocorreu no dia 16 de setembro de 1817, resultando do desmembramento da então capitania de Pernambuco como reflexo e punição imposta pela Coroa Portuguesa após a eclosão da Revolução Pernambucana naquele ano.',
    correct: 'Certo',
    explanation: 'Correto. Dom João VI decretou a emancipação da Capitania de Alagoas em 16 de setembro de 1817 como recompensa à lealdade dos proprietários rurais alagoanos e punição militar e territorial direta à província rebelde de Pernambuco.',
    reference: 'História de Alagoas'
  },
  {
    id: 347,
    category: 'Conhecimentos de Alagoas',
    text: 'Historicamente, Alagoas baseou sua economia agrária colonial e imperial no cultivo de algodão de ciclo curto e na extração mineral de sal-gema, relegando a monocultura de cana-de-açúcar a um papel secundário no Vale do Paraíba alagoano.',
    correct: 'Errado',
    explanation: 'Errado. Alagoas foi um dos maiores expoentes nacionais da monocultura latifundiária da cana-de-açúcar e do sistema açucareiro de engenhos e usinas, que moldou a estrutura socioeconômica, política e espacial do estado ao longo de séculos, com destaque para a Zona da Mata.',
    reference: 'História Econômica de Alagoas'
  },
  {
    id: 348,
    category: 'Conhecimentos de Alagoas',
    text: 'O território alagoano apresenta três macroregiões geoclimáticas bem delineadas de leste para oeste: a Zona da Mata (litoral úmido e solos férteis de massapê), o Agreste (zona de transição climática e minifúndios policultores) e o Sertão (clima semiárido e vegetação de caatinga).',
    correct: 'Certo',
    explanation: 'Correto. Trata-se das três grandes divisões naturais tradicionais do estado de Alagoas, caracterizadas por variações nítidas de pluviosidade, solo, ecossistemas e atividades produtivas.',
    reference: 'Geografia de Alagoas'
  },
  {
    id: 349,
    category: 'Conhecimentos de Alagoas',
    text: 'A bacia hidrográfica do Rio São Francisco, que banha a porção meridional de Alagoas, possui relevância histórica no desenvolvimento da região de Delmiro Gouveia, onde foi erguida a histórica usina de Angiquinho, pioneira na geração de energia hidrelétrica no Nordeste.',
    correct: 'Certo',
    explanation: 'Correto. Em 1913, o pioneiro Delmiro Gouveia construiu a Usina de Angiquinho na cachoeira de Paulo Afonso, aproveitando as águas do Rio São Francisco para alimentar a sua fábrica têxtil da Pedra e impulsionar a industrialização sertaneja.',
    reference: 'História e Geografia - Rio São Francisco'
  },
  {
    id: 350,
    category: 'Conhecimentos de Alagoas',
    text: 'O Quilombo dos Palmares, considerado o maior símbolo de resistência à escravidão na América Latina colonial, localizava-se na Serra da Barriga, região atualmente pertencente ao município alagoano de União dos Palmares.',
    correct: 'Certo',
    explanation: 'Correto. A Serra da Barriga foi o coração político do Quilombo dos Palmares, liderado por Zumbi e Gangazumba, sendo hoje reconhecida como patrimônio histórico e cultural nacional de União dos Palmares, Alagoas.',
    reference: 'História de Alagoas'
  },
  {
    id: 351,
    category: 'Conhecimentos de Alagoas',
    text: 'De acordo com dados demográficos atuais, Alagoas apresenta uma distribuição demográfica em que a maior parte da população reside em áreas rurais do Sertão, fruto da atração exercida pelas lavouras mecanizadas de soja instaladas no Vale do São Francisco.',
    correct: 'Errado',
    explanation: 'Errado. Alagoas é um estado majoritariamente urbanizado, com forte concentração populacional e econômica em Maceió e sua respectiva Região Metropolitana, além do polo de Arapiraca no Agreste. A soja não é cultura de destaque nas terras semiáridas do Sertão.',
    reference: 'Demografia e Sociedade Alagoana'
  },
  {
    id: 352,
    category: 'Conhecimentos de Alagoas',
    text: 'O complexo estuarino lagunar Mundaú-Manguaba desempenha papel estratégico na economia pesqueira de Maceió, Marechal Deodoro e Coqueiro Seco, gerando subsistência alimentar e renda a milhares de famílias de marisqueiros de sururu.',
    correct: 'Certo',
    explanation: 'Correto. As lagoas Mundaú e Manguaba abrigam ecossistemas estuarinos vitais para a pesca artesanal e a extração do sururu (molusco que constitui patrimônio imaterial de Alagoas), embora sofram grave pressão de poluição urbana.',
    reference: 'Geografia e Meio Ambiente de Alagoas'
  },
  {
    id: 353,
    category: 'Conhecimentos de Alagoas',
    text: 'A fundação da vila de Maceió remonta ao ciclo do pau-brasil, tendo sido ela alçada à categoria de capital do estado de Alagoas no ano de 1817, imediatamente após o desmembramento da capitania em relação a Pernambuco, desbancando Marechal Deodoro de forma pacífica.',
    correct: 'Errado',
    explanation: 'Errado. A primeira capital de Alagoas foi a Vila de Santa Maria Madalena da Lagoa do Sul (hoje Marechal Deodoro). Maceió só passou a ser a capital provincial em 1839, devido à expansão portuária decorrente da exportação de açúcar e fumo, o que gerou forte resistência armada de oligarcas deodirenses.',
    reference: 'Evolução Urbana e Capital de Alagoas'
  },
  {
    id: 354,
    category: 'Conhecimentos de Alagoas',
    text: 'O renomado escritor alagoano Graciliano Ramos foi prefeito do município de Palmeira dos Índios nos anos de 1928 a 1930, destacando-se na história da administração pública nacional pela publicação de relatórios municipais de contas inovadores e repletos de refinamento literário.',
    correct: 'Certo',
    explanation: 'Correto. Graciliano Ramos administrou Palmeira dos Índios e elaborou relatórios administrativos anuais que, de tão bem escritos, diretos e livres de burocratês hipócrita, chamaram a atenção de editores no Rio de Janeiro, impulsionando sua consagração literária com "Caetés" e "Vidas Secas".',
    reference: 'Cultura e História de Alagoas'
  },
  {
    id: 355,
    category: 'Conhecimentos de Alagoas',
    text: 'A economia alagoana contemporânea destaca-se no cenário nacional pelo refino metalúrgico pesado e fabricação automotiva de caminhões elétricos, concentrados no Polo Tecnológico de Delmiro Gouveia no alto sertão alagoano.',
    correct: 'Errado',
    explanation: 'Errado. A economia alagoana atual assenta-se no setor de comércio e serviços, no turismo litorâneo expressivo, na agroindústria sucroalcooleira, na cadeia química e de plástico (polo petroquímico da Braskem na Grande Maceió) e em culturas agrícolas no Agreste (como fumo, mandioca e milho).',
    reference: 'Economia e Produção de Alagoas'
  }
];

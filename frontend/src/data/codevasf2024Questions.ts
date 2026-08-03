import { Question, QuestionCategory } from '../types';

type RawAnswer = 'C' | 'E' | 'X';

interface RawQuestion {
  originalNumber: number;
  category: QuestionCategory;
  text: string;
  answer: RawAnswer;
  passageId?: string;
}

const answerLabel = (answer: RawAnswer): Question['correct'] => {
  if (answer === 'C') return 'Certo';
  if (answer === 'E') return 'Errado';
  return 'Anulada';
};

const toQuestion = (q: RawQuestion): Omit<Question, 'id'> => {
  const correct = answerLabel(q.answer);

  return {
    category: q.category,
    text: `[CEBRASPE - CODEVASF 2024 - Item ${q.originalNumber}] ${q.text}`,
    correct,
    explanation: correct === 'Anulada'
      ? 'Questao anulada no gabarito oficial definitivo da CODEVASF 2024.'
      : `Gabarito oficial definitivo: ${correct}.`,
    reference: `CODEVASF 2024 - Item ${q.originalNumber}`,
    passageId: q.passageId
  };
};

const rawBasicQuestions: RawQuestion[] = [
  {
    originalNumber: 1,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'Conforme as ideias expostas no texto, o racismo institucional difere das outras formas de racismo por ter impacto duradouro e contribuir significativamente para a manutencao de desigualdades com base na raca.'
  },
  {
    originalNumber: 2,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'Conclui-se do texto que o conhecimento sobre o racismo institucional e relevante para a promocao da igualdade racial no ambiente laboral.'
  },
  {
    originalNumber: 3,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'O texto trata o racismo institucional como um tipo de cultura existente dentro de instituicoes publicas e privadas.'
  },
  {
    originalNumber: 4,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'Depreende-se da leitura do texto que a distribuicao desigual de recursos dentro de uma instituicao consiste em um tipo de racismo institucional.'
  },
  {
    originalNumber: 5,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'Infere-se do texto que o racismo institucional se manifesta de forma velada dentro das organizacoes.'
  },
  {
    originalNumber: 6,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'De acordo com o primeiro paragrafo do texto, a populacao brasileira ainda nao e capaz de reconhecer o racismo institucional.'
  },
  {
    originalNumber: 7,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'No ultimo periodo do texto, a preposicao "para" introduz uma oracao que expressa finalidade.'
  },
  {
    originalNumber: 8,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'No quarto paragrafo, o sujeito da oracao "E um problema complexo" (terceiro periodo) corresponde a "a discriminacao racial" (segundo periodo).'
  },
  {
    originalNumber: 9,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'Estariam mantidos os sentidos e a correcao gramatical do texto caso se substituisse o segmento "estao se tornando" (primeiro periodo do primeiro paragrafo) por "vem se tornando".'
  },
  {
    originalNumber: 10,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'Estariam mantidas a correcao gramatical e a coerencia das ideias do texto caso os dois primeiros periodos do segundo paragrafo fossem unidos por meio da substituicao do ponto empregado apos "isoladas" pelo sinal de dois-pontos, feitos os devidos ajustes de letra inicial maiuscula e minuscula no periodo.'
  },
  {
    originalNumber: 11,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'Mantendo-se as ideias e a correcao gramatical do texto, o terceiro periodo do segundo paragrafo poderia ser reescrito da seguinte forma: Isso significa que o racismo institucional nao se trata apenas de como as pessoas se comportam, mas, tambem, de como as estruturas e as normas podem proteger ou prejudicar grupos raciais especificos.'
  },
  {
    originalNumber: 12,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'Em "a minorias raciais" (segundo periodo do terceiro paragrafo), e facultativo o emprego do sinal indicativo de crase no vocabulo "a".'
  },
  {
    originalNumber: 13,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'C',
    text: 'A substituicao do termo "limitando" (segundo periodo do terceiro paragrafo) pela expressao "porque limita" manteria a correcao gramatical e a coerencia das ideias do texto.'
  },
  {
    originalNumber: 14,
    category: 'Português',
    passageId: 'codevasf-racismo-institucional',
    answer: 'E',
    text: 'No texto, o sentido do verbo "perpetuar" (segundo periodo do quarto paragrafo) e o mesmo de potencializar.'
  },
  {
    originalNumber: 33,
    category: 'TI Básica',
    answer: 'C',
    text: 'Ferramentas de gerenciamento de redes sociais sao aquelas que reunem diversas plataformas em um unico espaco, permitindo a otimizacao de processos, a simplificacao das publicacoes e a facilitacao do acompanhamento de postagens.'
  },
  {
    originalNumber: 34,
    category: 'TI Básica',
    answer: 'C',
    text: 'A intranet, ao contrario da Internet, e uma area de uso exclusivo de seus proprietarios, ou seja, e uma plataforma de comunicacao que pertence a uma unica organizacao e serve como infraestrutura para compartilhamento de informacoes, arquivos, aplicacoes, servicos e recursos em seu ambiente interno de trabalho.'
  },
  {
    originalNumber: 35,
    category: 'TI Básica',
    answer: 'E',
    text: 'Embora atenda a demanda pela restauracao e transferencia das informacoes que passaram por backup, o restore nao assegura a integridade e a disponibilidade da informacao registrada previamente.'
  },
  {
    originalNumber: 36,
    category: 'TI Básica',
    answer: 'E',
    text: 'O backup incremental, uma vez configurado e executado, fara uma copia exata de arquivos e pastas selecionados, sendo especialmente util quando se precisa de uma recuperacao rapida e completa de dados em casos de falha de hardware.'
  },
  {
    originalNumber: 37,
    category: 'TI Básica',
    answer: 'C',
    text: 'Os perifericos de um computador, em sua maioria, sao hardwares do tipo externo, como mouse, teclado e uma smart TV, embora seja possivel que alguns hardwares internos se enquadrem nessa definicao, como a placa de som, por exemplo.'
  },
  {
    originalNumber: 38,
    category: 'TI Básica',
    answer: 'E',
    text: 'A SRAM (static random-access memory) tem natureza volatil e perde rapidamente seus dados na falta de energia; por necessitar de um processo constante de atualizacao nos pulsos para manter os dados ativos enquanto trabalha, a SRAM e mais lenta que a DRAM (dynamic random-access memory).'
  },
  {
    originalNumber: 39,
    category: 'TI Básica',
    answer: 'X',
    text: 'Uma forma popular de adwares e a publicidade que costuma acompanhar os softwares gratuitos; apesar de esses virus serem relativamente inofensivos, ha aqueles que usam ferramentas de rastreamento para coletar informacoes sobre localizacao ou historico de navegacao, com a finalidade de direcionar anuncios especificos para o usuario.'
  },
  {
    originalNumber: 40,
    category: 'TI Básica',
    answer: 'E',
    text: 'O spyware permite o rastreamento do comportamento de um usuario da Internet sem o seu conhecimento, em diversos dispositivos; ele tambem permite criptografar dados sigilosos, como documentos pessoais ou fotos, o que favorece acoes criminosas, tal como um pedido de resgate pela liberacao desses dados.'
  },
  {
    originalNumber: 41,
    category: 'TI Básica',
    answer: 'C',
    text: 'Ao contrario dos virus, os worms propagam-se e infectam computadores sem que haja uma acao direta humana, como um comando para sua execucao; eles inicialmente infectam uma maquina e depois se propagam pela rede de computadores, infectando outras maquinas, explorando vulnerabilidades de rede, como, por exemplo, pontos fracos nos programas de e-mail.'
  }
];

const rawJournalismQuestions: RawQuestion[] = [
  [51, 'E', 'O estilo de reportagem de Joao do Rio surpreendeu muitas pessoas, que pensavam ser fantasiosa a narrativa por ele desenvolvida.'],
  [52, 'C', 'A reportagem de maior sucesso assinada por Joao do Rio foi Pequena historia matreira da fila carioca.'],
  [53, 'E', 'As caracteristicas do genero reportagem sao: humanizacao, contexto social e reconstrucao historica.'],
  [54, 'C', 'A reportagem que marcou, com grande repercussao, o inicio desse genero jornalistico foi As religioes no Rio.'],
  [55, 'X', 'Joao do Rio inovou o jornalismo, ao introduzir um texto agil, com muitos detalhes e dialogos.'],
  [56, 'C', 'Noticia e aquilo que provoca ruptura nos padroes habituais da vida cotidiana.'],
  [57, 'C', 'Um ataque de um humano a um cao e exemplo de noticia porque agrega os valores-noticia do novo, inusitado, sensacional e misterioso.'],
  [58, 'E', 'A banalidade da vida de humanos e caes e um tema que so interessa a psicologos e estudiosos de biologia.'],
  [59, 'C', 'Por ser totalmente despropositada, uma narrativa que envolva um ataque a mordidas de uma pessoa a um cao nao constitui noticia.'],
  [60, 'E', 'O fato de uma pessoa mordida por um cao ser ou nao noticia depende, por exemplo, de quem seja a pessoa ou a quem pertenca o cao.'],
  [61, 'C', 'A frase mais importante de um texto jornalistico e a primeira, assim como o primeiro paragrafo e o mais importante de uma materia.'],
  [62, 'E', 'O relato factual nao deve limitar a atuacao jornalistica, podendo o autor da materia ser criativo ao compor o lide.'],
  [63, 'E', 'Na construcao do lide classico, e necessario que se responda as questoes principais do acontecimento - Quando? Onde? Como? -, dando-se sempre preferencia a ordem cronologica dos eventos.'],
  [64, 'C', 'Para que a redacao de um lide seja eficaz, deve ser evitado o emprego de verbos de acao, da voz passiva e de expressoes categoricas.'],
  [65, 'E', 'Um recurso utilizado por jornalistas para prender a atencao do leitor e iniciar a materia pela descricao de um personagem ou de uma cena.'],
  [66, 'C', 'O jornalista pode negar-se a revelar a fonte de informacao da materia jornalistica, o que nao o exime de provar a veracidade dos fatos.'],
  [67, 'E', 'A articulacao dos meios de comunicacao permite a legitimacao da informacao que divulgam.'],
  [68, 'C', 'Para que um reporter apure e redija uma materia, basta uma ordem verbal de sua chefia, visto que a funcao jornalistica e protegida pelo principio da liberdade de expressao.'],
  [69, 'E', 'A comunicacao de massa e guiada pelo gosto medio da populacao.'],
  [70, 'E', 'A funcao de selecao dos fatos a serem noticiados cabe melhor as fontes jornalisticas que aos veiculos de comunicacao, visto que estes apenas absorvem o conteudo que lhes e repassado.'],
  [71, 'E', 'Os criterios de noticiabilidade que orientam a selecao do que se tornara uma noticia referem-se tanto aos valores da cultura profissional quanto as condicoes organizacionais do trabalho jornalistico.'],
  [72, 'C', 'A personalizacao do conteudo constitui a unica caracteristica da noticia na midia digital que influencia diretamente o modo de organizacao de sua estrutura.'],
  [73, 'C', 'O uso do lide nas noticias impressas tem sido atribuido historicamente a diferentes influencias, tais como a arte da retorica na Antiguidade romana e o uso de telegrafos pelos jornalistas norte-americanos no seculo XX.'],
  [74, 'E', 'Os titulos das noticias impressas devem revelar a essencia da noticia, sem esgota-la, ao mesmo tempo em que devem estar organizados graficamente no espaco do jornal.'],
  [75, 'E', 'A construcao por blocos de paragrafos e um tipo de modelo estrutural de texto noticioso geralmente associado a tecnica da piramide invertida.'],
  [76, 'C', 'O release segmentado, no qual geralmente se utiliza linguagem nao especializada, deve ser produzido para jornalistas que atuam em editorias de interesse geral.'],
  [77, 'E', 'O atendimento a imprensa, em geral, envolve a preparacao das fontes para responder as perguntas dos jornalistas, disponibilidade para fazer contatos e agilidade no encaminhamento das demandas.'],
  [78, 'C', 'Acompanhar e avaliar as entrevistas de gestores ou membros da organizacao sao acoes que possibilitam ao assessor de imprensa identificar vicios de fala ou eventuais erros de informacao.'],
  [79, 'E', 'Entre as funcoes basicas de um assessor de imprensa destacam-se o planejamento do trabalho da assessoria para o atendimento a demandas, a preparacao das fontes para entrevistas e o papel de porta-voz da organizacao em situacoes de crise.'],
  [80, 'E', 'Um dos papeis exercidos pelo assessor de imprensa e o de mediador qualificado entre a organizacao e as redacoes jornalisticas.'],
  [81, 'E', 'Para o melhor aproveitamento dos releases produzidos na assessoria de imprensa e maior visibilidade da publicacao na midia, recomenda-se que nao seja dada exclusividade da noticia a jornalista ou a veiculo de comunicacao.'],
  [82, 'C', 'A simulacao de perguntas e respostas e uma pratica que pode auxiliar na preparacao de gestores de organizacoes para entrevistas em situacoes de crise.'],
  [83, 'C', 'Uma entrevista coletiva em uma organizacao somente deve ser realizada se o tema for relevante para a instituicao e se tiver abrangencia editorial suficiente para atrair o interesse de diferentes veiculos de comunicacao.'],
  [84, 'C', 'A entrevista no formato pingue-pongue permite que o jornalista aprofunde o tema junto ao entrevistado, explorando nuances de sua fala, e e, em geral, acompanhada de uma longa descricao do entrevistado.'],
  [85, 'E', 'A escolha do local para a realizacao de uma entrevista televisionada e fator irrelevante para se transmitir uma boa impressao de uma organizacao, visto que o foco do espectador e direcionado para o assunto tratado na entrevista.'],
  [86, 'E', 'Nos ultimos anos, a comunicacao interna tem passado por transformacoes significativas, tornando-se essencialmente publica e virtual; intranet, redes de e-mails e sistemas wiki de compartilhamento sao exemplos de canais de comunicacao interna nas organizacoes.'],
  [87, 'C', 'A criacao do press release e atribuida a Ivy Lee, pioneiro das relacoes publicas nos Estados Unidos da America; o primeiro press release foi emitido pela empresa Pennsylvania Railroad, apos uma crise corporativa enfrentada na decada de 1960.'],
  [88, 'E', 'Na analise de conteudo, pode-se utilizar a tecnica da amostra construida para se obter confiabilidade com uma amostra variada e com o minimo de distorcoes.'],
  [89, 'C', 'A analise pragmatica da narrativa possibilita a analise de noticias isoladas sobre um mesmo tema, com base na observacao da descontinuidade temporal e da singularidade tematica de cada peca noticiosa.'],
  [90, 'C', 'As publicacoes empresariais constituem importantes canais de comunicacao interna da organizacao para o compartilhamento de informacoes motivadoras junto a seus funcionarios.'],
  [91, 'C', 'A piramide invertida e o procedimento de organizacao textual mais usado em texto noticioso e seu objetivo e oferecer, de maneira indireta, o que se considera mais importante acerca do fato.'],
  [92, 'E', 'Lead e o formato preferencial utilizado na abertura de textos noticiosos, sendo considerado a principal estrategia textual no relato noticioso.'],
  [93, 'E', 'O uso do lead, no texto jornalistico, vincula-se a tecnica da piramide invertida, que representa a maneira de apresentar as informacoes de forma decrescente no texto.'],
  [94, 'E', 'O lead e construido a partir das respostas as seguintes perguntas que envolvem o fato: "Quem?", "Quando?", "Por que?" e "Para que?".'],
  [95, 'C', 'A noticia deve ser recente, verdadeira, objetiva e de interesse publico, sendo considerada a materia-prima do jornalismo, especialmente em jornais, pois e o texto que carrega a identidade da narrativa jornalistica.'],
  [96, 'C', 'A cronica e frequentemente considerada um genero hibrido, capaz de assumir tanto a forma de historia curta quanto formas mais livres, como comentarios criticos sobre eventos noticiados pela midia, ou prosas liricas com um tom fortemente intimista.'],
  [97, 'C', 'O fragmento sobre aumento da SELIC pode ser corretamente classificado no genero cronica, haja vista a formalidade e padronizacao de sua linguagem bem como a ausencia de subjetividade.'],
  [98, 'E', 'Por apresentar uma base interpretativa dos fatos, a reportagem e mais completa e profunda que a noticia e exige do jornalista maior capacidade de observacao e investigacao, alem de explorar diversos angulos sobre o assunto relatado, como personagens, falas de especialistas e dados estatisticos.'],
  [99, 'C', 'Quanto a apresentacao do texto, e comum que a reportagem seja elaborada em mais de uma retranca, ou seja, que apresente subdivisoes, textos complementares associados ao texto principal, isto e, aquele que apresenta o gancho jornalistico.'],
  [100, 'C', 'Editorial e um texto opinativo em que e apresentado explicitamente o ponto de vista da empresa de comunicacao a respeito de fatos e assuntos da atualidade.'],
  [101, 'C', 'A melhor forma de se apresentar uma noticia e expor os fatos de forma decrescente, ou seja, partir das informacoes mais importantes e, na sequencia, acrescentar seus detalhes ou complementos de menor relevancia.'],
  [102, 'C', 'Enquanto o release se constitui de uma agenda ou um roteiro dos assuntos mais importantes a serem cobertos em uma edicao ou materia jornalistica, a pauta e um material informativo, com dados especificos que facilitem o trabalho jornalistico, distribuido entre jornalistas antes de solenidades, entrevistas, lancamentos de filmes etc.'],
  [103, 'E', 'No processo de editoracao, a preparacao de originais deve preceder a diagramacao.'],
  [104, 'E', 'A preparacao e a revisao de textos ocorrem na mesma etapa do processo editorial.'],
  [105, 'E', 'No design de periodicos, a pagina e o suporte fundamental para a distribuicao do texto e de outros elementos que compoem a mensagem jornalistica; a diagramacao de uma edicao envolve planejamento e organizacao, ou seja, um estudo preliminar de como cada componente sera disposto na pagina, levando-se em consideracao o efeito desejado com o layout para proporcionar uma proposta clara e coerente ao leitor.'],
  [106, 'E', 'Uma combinacao adequada de tipografia, fotografia e espacos em branco e necessaria para produzir impacto grafico e facilitar a leitura da materia jornalistica.'],
  [107, 'E', 'A parte escrita e considerada uma das menos importantes em um projeto grafico, por isso tem a importancia secundaria a escolha dos tipos ou das fontes a serem empregados no texto.'],
  [108, 'C', 'A entrelinha, definida como a distancia entre a cabeca de uma linha e a cabeca da linha subsequente, tem pouca importancia em um projeto grafico, visto que nao interfere na legibilidade do texto.'],
  [109, 'C', 'Por serem opostos, os criterios da harmonia e do contraste nao devem ser utilizados conjuntamente na distribuicao do conteudo de uma publicacao.'],
  [110, 'X', 'A enfase nas noticias mais relevantes e a distincao das secoes por meio do contraste sao estrategias que visam melhorar a experiencia do leitor.'],
  [111, 'E', 'A utilizacao de texto esquadrinhavel no web jornalismo visa melhorar a experiencia de leitura, pois destaca informacoes importantes e facilita a navegacao pelo conteudo.'],
  [112, 'X', 'No jornalismo online, a primeira noticia sobre um evento geralmente possui alta resolucao semantica.'],
  [113, 'E', 'Conforme o conceito de resolucao semantica, uma noticia e tanto mais precisa quanto mais informacoes forem confirmadas e complementadas ao longo do tempo.'],
  [114, 'C', 'O hipertexto inclui hiperligacoes para outros blocos informativos, o que permite multiplas opcoes de leitura.'],
  [115, 'C', 'A integracao de elementos multimidia na noticia online dispensa a criacao de uma estrutura narrativa especifica que ajude o leitor a entender e a interagir com a noticia, dada a sua liberdade de escolha de como e por qual caminho seguir a leitura.'],
  [116, 'E', 'O uso de redes sociais pelos jornalistas para disseminar noticias pode ocasionar a perda de controle sobre a narrativa original da reportagem, devido a reinterpretacao do conteudo das noticias e ao seu compartilhamento descontextualizado pelos usuarios.'],
  [117, 'E', 'No web jornalismo, a necessidade de atualizacao constante e em tempo real e um fator que pode comprometer a qualidade e a precisao das informacoes publicadas.'],
  [118, 'X', 'A convergencia de texto, som e imagem no web jornalismo resulta necessariamente em um produto noticioso mais rico e informativo, pois combina as melhores caracteristicas dos meios impressos, radiofonicos e televisivos.'],
  [119, 'C', 'No web jornalismo, o uso de ferramentas analiticas para monitorar o comportamento dos leitores em tempo real contribui para uma melhor adaptacao do conteudo as preferencias do publico, mas tambem pode influenciar negativamente a independencia editorial ao incentivar a producao de conteudos que geram mais cliques e engajamento.'],
  [120, 'E', 'A criacao de espacos de comentario e foruns de discussao em plataformas de web jornalismo enfraquece a narrativa jornalistica ao favorecer diferentes perspectivas dos leitores, prejudicando a qualidade do conteudo jornalistico.']
].map(([originalNumber, answer, text]) => ({
  originalNumber: originalNumber as number,
  category: 'Conhecimentos Específicos - Jornalismo',
  answer: answer as RawAnswer,
  text: text as string
}));

export const codevasf2024BasicQuestions: Omit<Question, 'id'>[] = rawBasicQuestions.map(toQuestion);
export const codevasf2024JournalismQuestions: Omit<Question, 'id'>[] = rawJournalismQuestions.map(toQuestion);

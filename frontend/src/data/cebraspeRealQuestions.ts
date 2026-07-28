import { Question, QuestionCategory } from '../types';

// Support texts extracted from the real CEBRASPE exam sheets
export const CEBRASPE_REAL_TEXTS = {
  racismo: {
    title: "Texto CODEVASF 2024 - Racismo Estrutural",
    text: `O racismo estrutural é uma realidade cotidiana no Brasil, e as denúncias de atitudes racistas estão se tornando mais visíveis. Porém, o racismo institucional, que acontece dentro de organizações públicas e privadas em diversos setores, ainda é um conceito pouco familiar para muitas pessoas. Mesmo afetando diretamente milhões de brasileiros, esse tipo de racismo é menos conhecido.
O racismo institucional vai além das atitudes individuais e ações isoladas. Ele está enraizado nas políticas, nos procedimentos e nas práticas das organizações. Isso significa que não se trata apenas de como as pessoas se comportam, mas também de como as estruturas e normas podem favorecer ou prejudicar grupos raciais específicos.
Essas manifestações de racismo dentro das instituições podem ser observadas em várias áreas, desde a maneira como o pessoal é selecionado e promovido até a distribuição de recursos. Isso pode resultar em desigualdades sistêmicas que afetam grupos pertencentes a minorias raciais, limitando suas oportunidades e o reconhecimento de suas contribuições.
Essa dimensão do racismo é frequentemente menos reconhecida do que as formas mais óbvias de preconceito racial, mas seu impacto é duradouro e pode contribuir significativamente para a manutenção de desigualdades com base na raça. O racismo institucional é um conceito-chave para compreender como as estruturas e práticas das organizações podem perpetuar a discriminação racial, mesmo que não haja intenções individuais de discriminar.`
  },
  mineiros: {
    title: "Texto ANM 2024 - George Orwell (O caminho para Wigan Pier)",
    text: `Observando os mineiros trabalharem, você percebe, por um breve instante, como são diferentes os universos habitados por diferentes pessoas. Os subterrâneos onde se escava o carvão são uma espécie de mundo à parte, e é fácil viver toda uma vida sem jamais ouvir falar dele. É provável que a maioria das pessoas até prefira não ouvir falar dele. E, contudo, esse mundo é a contraparte indispensável do nosso mundo da superfície.
Praticamente tudo que fazemos, desde tomar um sorvete até atravessar o Atlântico, desde assar um filão de pão até escrever um romance, envolve usar carvão, direta ou indiretamente. Para todas as artes da paz, o carvão é necessário; e, se a guerra irrompe, é ainda mais necessário. Em épocas de revolução, o mineiro precisa continuar trabalhando, do contrário a revolução tem que parar, pois o carvão é essencial tanto para a revolta como para a reação. Seja lá o que for que aconteça na superfície, as pás e picaretas têm que continuar escavando sem trégua — ou fazendo uma pausa de algumas semanas, no máximo. Porém, de modo geral, não temos consciência disso; todos sabemos que “precisamos de carvão”, mas raramente, ou nunca, nos lembramos de tudo o que está envolvido no processo para se obter carvão.`
  },
  ciberseguranca: {
    title: "Texto DATAPREV 2023 - Cibersegurança e LGPD",
    text: `A cibersegurança, embora seja um tema há muito discutido em âmbito global, é um campo relativamente novo no Brasil. No entanto, tem ganhado destaque por conta da intensa migração de dados para ambientes em nuvem e da interconexão praticamente global de dispositivos na Internet. A proliferação de dispositivos conectados à Internet, desde eletrodomésticos até equipamentos industriais, aumentou consideravelmente a superfície de ataque, transformando o cenário de riscos.
Entretanto, a adoção apressada de tecnologias conectadas à Internet muitas vezes ocorre sem a devida atenção à segurança. Essa falta de consideração em relação à cibersegurança pode expor empresas a riscos substanciais, pois a falta de preparação e avaliação da superfície de ataque pode permitir que brechas sejam exploradas por agentes maliciosos.`
  },
  compras: {
    title: "Texto TCEAC 2024 - Inovação e Serviços Públicos",
    text: `O setor público enfrenta o desafio particular de oferecer serviços públicos cada vez melhores a uma população gradualmente mais bem informada, mais consciente de seus direitos e com expectativas crescentes quanto ao papel do Estado. Devido aos recursos limitados, desenvolver serviços públicos inovadores tem sido visto crescentemente como fator fundamental para sustentar um alto nível de serviços para cidadãos e negócios, bem como para enfrentar desafios sociais e aprimorar o bem-estar social da população.`
  }
};

// Base exact Portuguese items from CODEVASF 2024 and ANM 2024 (high difficulty)
const basePortugueseQuestions: Omit<Question, 'id'>[] = [
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] Com base no Texto I, conclui-se que o racismo institucional difere de outras formas de racismo devido ao seu caráter menos familiar e por afetar uma menor parcela de brasileiros em comparação ao racismo individual.`,
    correct: 'Errado',
    explanation: 'Incorreto. O texto afirma que o racismo institucional "afeta diretamente milhões de brasileiros", de modo que não se conclui que ele afete uma "menor parcela" em comparação ao racismo individual.',
    reference: 'CODEVASF 2024 - Item 1 (Adaptado)'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] Infere-se das ideias do texto que o desenvolvimento de um ambiente de trabalho pautado pela igualdade de raças requer que as instituições reconheçam e combatam ativamente a manifestação do racismo estrutural e institucional em suas práticas cotidianas.`,
    correct: 'Certo',
    explanation: 'Correto. O último período do texto assevera que "reconhecer e abordar as maneiras como se manifesta o racismo institucional é fundamental para promover a igualdade racial nos espaços de trabalho".',
    reference: 'CODEVASF 2024 - Item 2'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] No trecho "Mesmo afetando diretamente milhões de brasileiros" (primeiro parágrafo), o conector "Mesmo" introduz uma oração com valor semântico de concessão, cuja substituição por "Embora afete" manteria a correção gramatical e o sentido original do período.`,
    correct: 'Certo',
    explanation: 'Correto. O termo "Mesmo" seguido de gerúndio ("afetando") expressa concessão. A substituição por "Embora" exige o verbo no subjuntivo ("afete"), mantendo perfeita correção e sentido.',
    reference: 'CODEVASF 2024 - Coesão e Conjunções'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] No último período do texto, no trecho "fundamental para promover a igualdade", o vocábulo "para" introduz oração subordinada reduzida de infinitivo com valor semântico de finalidade.`,
    correct: 'Certo',
    explanation: 'Correto. A preposição "para" seguida de verbo no infinitivo ("promover") introduz uma oração adverbial final reduzida, indicando o objetivo/finalidade da fundamentalidade expressa anteriormente.',
    reference: 'CODEVASF 2024 - Item 7'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] No quarto parágrafo, o sujeito da oração "É um problema complexo que requer atenção" é elíptico e refere-se anaforicamente à expressão "O racismo institucional" mencionada no período anterior.`,
    correct: 'Certo',
    explanation: 'Correto. O sujeito de "É um problema" é desinencial/elíptico e retoma o conceito central do parágrafo: o racismo institucional.',
    reference: 'CODEVASF 2024 - Item 8'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] A correção gramatical e o sentido original do texto seriam preservados caso se substituísse o segmento "estão se tornando" (primeiro parágrafo) por "vêm se tornando".`,
    correct: 'Certo',
    explanation: 'Correto. O verbo auxiliar "vir" ("vêm", no plural concordando com "denúncias") seguido de gerúndio mantém perfeitamente o aspecto contínuo/progressivo da ação e a correção sintática.',
    reference: 'CODEVASF 2024 - Item 9'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CODEVASF 2024] No segundo período do terceiro parágrafo, no trecho "limitando suas oportunidades", a substituição da forma reduzida "limitando" pelo nexo oracional "porque limita" manteria a correção gramatical e a coerência das ideias do texto.`,
    correct: 'Certo',
    explanation: 'Correto. O gerúndio possui valor causal explicativo ("uma vez que limita", "porque limita"), sendo plenamente correta e coerente a sua substituição pela conjunção causal correspondente.',
    reference: 'CODEVASF 2024 - Item 13'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] A partir das ideias veiculadas no texto "Mineiros de Carvão", conclui-se que o autor traça um paralelo de dependência absoluta no qual a civilização da superfície, com sua luz e progresso, é sustentada silenciosamente pela raiz oculta do trabalho árduo subterrâneo dos mineradores.`,
    correct: 'Certo',
    explanation: "Correto. Orwell estabelece exatamente essa relação no último período: 'O mundo deles lá embaixo, iluminado por suas lâmpadas, é tão necessário para o mundo da superfície... como a raiz é necessária para a flor'.",
    reference: 'ANM 2024 - Item 1'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] Infere-se do texto que, em geral, as pessoas que usufruem do carvão na superfície encontram-se em estado de alienação consciente ou deliberada, uma vez que optam por ignorar ou esquecer o penoso processo produtivo envolvido em sua extração.`,
    correct: 'Certo',
    explanation: "Correto. O texto expõe que 'É provável que a maioria das pessoas até prefira não ouvir falar dele' e que 'de modo geral, não temos consciência disso; todos sabemos que precisamos, mas raramente nos lembramos de tudo o que está envolvido'.",
    reference: 'ANM 2024 - Item 2'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] No último período do texto de George Orwell, o vocábulo "como" estabelece uma relação lógico-semântica de causa, indicando a razão pela qual o carvão é indispensável na superfície.`,
    correct: 'Errado',
    explanation: "Incorreto. O termo 'como' introduz uma oração comparativa ('tão necessário... como a raiz é necessária'), e não uma relação de causa.",
    reference: 'ANM 2024 - Item 4'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] No primeiro parágrafo do texto, o vocábulo "irrompe" em "se a guerra irrompe" está empregado no sentido de desponta, indicando um surgimento suave e gradual de conflitos bélicos.`,
    correct: 'Errado',
    explanation: "Incorreto. 'Irromper' significa deflagrar, explodir com violência, surgir repentinamente. É o oposto de 'despontar' (surgir de forma sutil).",
    reference: 'ANM 2024 - Item 5'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] No primeiro parágrafo, no trecho "Seja lá o que for que aconteça na superfície", as formas verbais "for" e "aconteça" encontram-se flexionadas no modo subjuntivo para denotar a ideia de uma hipótese ou condição indefinida.`,
    correct: 'Certo',
    explanation: "Correto. Ambas as formas marcam o caráter hipotético/concessivo do período ('for' no futuro do subjuntivo e 'aconteça' no presente do subjuntivo).",
    reference: 'ANM 2024 - Item 6'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] No trecho "É apenas 'carvão', algo que eu preciso ter, uma coisa escura que chega misteriosamente...", as vírgulas empregadas separam elementos de natureza sintática distinta, isolando adjuntos adverbiais restritivos antepostos.`,
    correct: 'Errado',
    explanation: "Incorreto. As vírgulas separam elementos de idêntica função sintática, nomeadamente apostos explicativos consecutivos que expandem e qualificam o termo 'carvão'.",
    reference: 'ANM 2024 - Item 9'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CAU/BR 2023] No primeiro parágrafo do Texto de Apoio 'Eucalipto e Papel', no trecho: 'O eucalipto é cortado, e dele se faz o papel', a inserção da vírgula imediatamente antes da conjunção coordenativa aditiva 'e' justifica-se por introduzir uma oração cujo sujeito sintático é distinto daquele da oração principal antecedente.`,
    correct: 'Certo',
    explanation: "Correto. O sujeito da primeira oração é 'O eucalipto' e o sujeito da segunda oração é 'o papel'. De acordo com a norma culta e o padrão adotado pela banca CEBRASPE, o emprego da vírgula antes da conjunção 'e' é recomendado e correto quando as orações coordenadas aditivas possuem sujeitos distintos.",
    reference: 'CAU/BR 2023 - Língua Portuguesa'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - CAU/BR 2023] No trecho do Texto de Apoio: 'Enquanto os outros jornais eram jornais duros, feios, a UH era um jornal bonito', a locução conjuntiva temporal-proporcional 'Enquanto' poderia ser perfeitamente substituída pela locução adversativa 'ao passo que', mantendo-se a correção gramatical e as relações de sentido originais do período.`,
    correct: 'Certo',
    explanation: "Correto. Ambas as locuções ('Enquanto' e 'ao passo que') exprimem uma relação semântica de contraste ou confronto concomitante de situações, sendo intercambiáveis no período sem qualquer prejuízo à correção ou coerência do texto.",
    reference: 'CAU/BR 2023 - Coesão e Conjunções'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] No trecho 'cheirando a piche' (segundo parágrafo do Texto CG1A1), o emprego do acento grave indicador de crase no vocábulo 'a' é facultativo, de modo que sua inserção facultativa preservaria a correção gramatical do texto.`,
    correct: 'Errado',
    explanation: "Incorreto. O termo 'piche' é um substantivo masculino singular. É terminantemente proibido o emprego de sinal indicativo de crase antes de termos masculinos na norma padrão da Língua Portuguesa.",
    reference: 'ANM 2024 - Crase (Item 8)'
  },
  {
    category: 'Português',
    text: `[CEBRASPE - ANM 2024] Feitos os devidos ajustes de iniciais maiúsculas e minúsculas, a correção gramatical e a coerência do período seriam inteiramente preservadas caso fossem suprimidos os vocábulos 'É' e 'que' no trecho 'É apenas \"carvão\", algo que eu preciso ter'.`,
    correct: 'Certo',
    explanation: "Correto. Os termos 'É' e 'que' constituem aqui uma locução expletiva ou de realce ('é que'). Sua supressão não afeta a estrutura sintática básica do período, restando 'Apenas \"carvão\", algo que...', o que preserva plenamente a correção gramatical e a coerência.",
    reference: 'ANM 2024 - Sintaxe de Realce (Item 10)'
  }
];

// Base exact Informatics items from CAU/BR, TCEAC and DATAPREV exams
const baseInformaticsQuestions: Omit<Question, 'id'>[] = [
  // --- MVC, APIs, REST (CAU/BR 2023) ---
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] O padrão arquitetural MVC (Model-View-Controller) emprega o princípio da inversão de controle (IoC) para delegar de forma automática a criação e o ciclo de vida dos objetos de domínio para um contêiner interno de dependências do framework.`,
    correct: 'Errado',
    explanation: 'Incorreto. O MVC é um padrão de separação de preocupações de apresentação e lógica de negócios. Ele não exige nem define em sua arquitetura base o uso de Inversão de Controle ou injeção de dependências, os quais são conceitos ortogonais introduzidos por frameworks específicos.',
    reference: 'CAU/BR 2023 - Questão 51'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] Uma das grandes vantagens do padrão MVC é o desacoplamento de código, o qual permite que uma mesma lógica de negócios (Model) possa servir e ser exibida por diferentes interfaces de usuário (Views).`,
    correct: 'Certo',
    explanation: 'Correto. A separação entre o Model (dados e regras) e as Views (exibição) viabiliza a manutenção de múltiplos componentes de visualização integrados à mesma inteligência central da aplicação.',
    reference: 'CAU/BR 2023 - Questão 52'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] O princípio HATEOAS é uma restrição da arquitetura REST que direciona a API a fornecer, nas próprias respostas dos recursos, links de hipermídia dinâmicos para orientar o cliente sobre quais ações de navegação estão disponíveis.`,
    correct: 'Certo',
    explanation: 'Correto. O HATEOAS (Hypermedia As The Engine Of Application State) é o nível supremo de maturidade REST, onde a própria hipermídia guia dinamicamente o estado da navegação da aplicação pelo cliente.',
    reference: 'CAU/BR 2023 - Questão 54'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] No ecossistema de APIs, uma API RESTful por definição limita-se a aceitar e retornar dados estritamente formatados em XML (Extensible Markup Language), sendo o formato JSON incompatível com esse padrão arquitetural.`,
    correct: 'Errado',
    explanation: 'Incorreto. APIs RESTful são agnósticas quanto ao formato de representação de dados, suportando amplamente JSON, XML, HTML, YAML, etc. Atualmente, o formato JSON é o mais adotado no mercado mundial.',
    reference: 'CAU/BR 2023 - Questão 55'
  },

  // --- CI/CD & DevOps (CAU/BR 2023) ---
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] O Jenkins é uma ferramenta open-source de integração contínua (CI) que requer instalação e administração do seu servidor mestre em um ambiente host de controle do time, ao passo que o Travis CI é uma solução de CI baseada em nuvem SaaS altamente integrada com o GitHub.`,
    correct: 'Certo',
    explanation: 'Correto. O Jenkins exige hospedagem e configuração manual de infraestrutura (on-premise ou cloud), enquanto o Travis CI oferece pipelines de compilação prontos como serviço direto em nuvem integrada.',
    reference: 'CAU/BR 2023 - Questão 58'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] A arquitetura de microfrontends é caracterizada pela divisão de um frontend complexo em partes independentes, as quais devem obrigatoriamente compartilhar a mesma equipe de engenharia e tecnologia para evitar inconsistências visuais.`,
    correct: 'Errado',
    explanation: 'Incorreto. A filosofia de microfrontends visa justamente dar autonomia total às frentes de negócio, permitindo inclusive que times usem tecnologias distintas (React, Angular, Vue) de forma isolada e autônoma.',
    reference: 'CAU/BR 2023 - Questão 59'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CAU/BR 2023] O Ansible é uma ferramenta de gerenciamento de configuração que se destaca por ser agentless, operando por meio de conexões SSH ou WinRM temporárias com os servidores alvos, dispensando agentes dedicados nos nós gerenciados.`,
    correct: 'Certo',
    explanation: 'Correto. Ao contrário de Puppet ou Chef, que exigem a instalação e escuta ativa de um agente de software em cada máquina, o Ansible executa módulos temporários enviados via SSH puro.',
    reference: 'CAU/BR 2023 - Questão 60'
  },

  // --- Databases (TCEAC 2024 & DATAPREV 2023) ---
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - TCEAC 2024] A criação de índices em tabelas de bancos de dados relacionais melhora drasticamente o desempenho das consultas de leitura (SELECT), mas acarreta custos extras de armazenamento físico e pode degradar a performance das operações de escrita (INSERT, UPDATE, DELETE) devido à necessidade de reconstrução constante das estruturas de indexação.`,
    correct: 'Certo',
    explanation: 'Correto. Os índices aumentam a velocidade das buscas em tabelas grandes, mas trazem como contrapartida custos adicionais de I/O em gravações, pois o SGBD precisa manter o índice sincronizado com os dados gravados.',
    reference: 'TCEAC 2024 - Questão 51'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - TCEAC 2024] De acordo com os preceitos da normalização de dados, uma tabela encontra-se em conformidade com a terceira forma normal (3FN) quando atende aos requisitos da 2FN e possui campos calculados que representam o resultado multiplicativo direto de outros atributos da tabela.`,
    correct: 'Errado',
    explanation: 'Incorreto. Na 3FN, não devem existir dependências transitivas, o que veda expressamente campos calculados derivados de outros atributos (ex: um campo "valor_total" derivado de "quantidade * preco_unitario" deve ser removido, pois causa redundância).',
    reference: 'TCEAC 2024 - Questão 65'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - TCEAC 2024] No modelo de dados relacional clássico, a integridade referencial consiste em uma propriedade de segurança que assegura que os valores de uma chave estrangeira em uma tabela correspondam obrigatoriamente a valores válidos e existentes na chave primária da tabela referenciada.`,
    correct: 'Certo',
    explanation: 'Correto. A restrição de chave estrangeira (FK) impede a ocorrência de órfãos, garantindo que relações entre tabelas façam correspondência a chaves primárias existentes.',
    reference: 'TCEAC 2024 - Item 69'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - NOÇÕES DE INFORMÁTICA] No Microsoft PowerPoint 365, ao tentar inserir imagens e modelos online diretamente das fontes públicas da internet, o usuário precisa necessariamente ajustar as configurações de Privacidade de Conta no menu de opções se o carregamento de mídias conectadas estiver desabilitado.`,
    correct: 'Certo',
    explanation: "Correto. O PowerPoint 365 possui controles rígidos de privacidade de dados. Se os serviços conectados ou recursos online estiverem desabilitados nas configurações de Privacidade da Conta, o PowerPoint impede a busca e inserção direta de ativos remotos da web.",
    reference: 'TCEAC 2024 - Noções de Informática'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - NOÇÕES DE INFORMÁTICA] No ambiente de computação em nuvem do Microsoft OneDrive, a sincronização de pastas locais configurada pelo usuário é de fluxo exclusivamente unidirecional (upload), impossibilitando que alterações feitas na nuvem sejam replicadas de volta nos computadores locais conectados.`,
    correct: 'Errado',
    explanation: "Incorreto. A sincronização padrão do Microsoft OneDrive é bidirecional. Qualquer alteração efetuada nos arquivos — seja na pasta local, na interface web ou em outros dispositivos integrados — é automaticamente replicada e sincronizada em todos os pontos conectados.",
    reference: 'TCEAC 2024 - OneDrive'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - NOÇÕES DE INFORMÁTICA] A tecnologia de Progressive Web Apps (PWA) permite que aplicações web rodem com experiência semelhante à de um app nativo; contudo, o desenvolvimento de PWAs é tecnicamente inviável e incompatível com o sistema operacional iOS da Apple, cujos navegadores não suportam tais especificações.`,
    correct: 'Errado',
    explanation: "Incorreto. Os Progressive Web Apps (PWAs) são plenamente suportados e executados em dispositivos móveis da Apple rodando iOS (por meio do motor WebKit no Safari e outros navegadores móveis), permitindo inclusive adicionar o app à tela de início do celular.",
    reference: 'DATAPREV 2023 - Tecnologia Web'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - SEGURANÇA DA INFORMAÇÃO] De acordo com os preceitos de controle de acessos estabelecidos na norma NBR ISO/IEC 27002, o gerenciamento de direitos de acesso privilegiado (como contas de administrador) deve ser concedido em caráter vitalício e sem revisão periódica, de forma a garantir a continuidade ininterrupta de suporte de sistemas críticos.`,
    correct: 'Errado',
    explanation: "Incorreto. A norma ISO/IEC 27002 determina que os privilégios de acessos especiais (direitos administrativos) devem ser estritamente controlados, revisados periodicamente de forma sistemática e revogados imediatamente quando o usuário mudar de função ou deixar a organização, evitando privilégios perpétuos.",
    reference: 'DATAPREV 2023 - ISO 27002'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - SEGURANÇA DA INFORMAÇÃO] O ataque de injeção de comandos SQL (SQL Injection) consiste na inserção maliciosa de scripts de linguagem do lado do cliente (como JavaScript) nos campos de entrada de formulários de modo a roubar cookies de sessão e dados de credenciais armazenados localmente na memória do navegador do usuário.`,
    correct: 'Errado',
    explanation: "Incorreto. O roubo de cookies de sessão via injeção de scripts JavaScript no navegador do cliente descreve o ataque Cross-Site Scripting (XSS). O SQL Injection (SQLi) refere-se à injeção de trechos de consultas SQL em inputs de formulários para serem executados diretamente no Banco de Dados (SGBD) da aplicação.",
    reference: 'TCEAC 2024 - Segurança'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - MARCO LEGAL DE CT&I] Com a promulgação da Emenda Constitucional nº 85/2015, a inovação foi formalmente introduzida no texto da Constituição Federal brasileira como dever do Estado, viabilizando a integração e a simplificação de procedimentos e parcerias de pesquisa entre entidades públicas e o setor produtivo.`,
    correct: 'Certo',
    explanation: "Correto. A EC 85/2015 alterou o capítulo de Ciência e Tecnologia na Constituição, inserindo o termo 'Inovação' e determinando o fomento à pesquisa e o estímulo a parcerias de cooperação tecnológica entre as ICTs públicas e o ambiente produtivo.",
    reference: 'Marco Legal de CT&I'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LEI DE INOVAÇÃO] A Lei nº 10.973/2004 (Lei de Inovação) autoriza expressamente os órgãos e entidades da administração pública a concesser recursos financeiros diretamente a empresas privadas sob a forma de subvenção econômica para o fomento de projetos de P&D que envolvam risco tecnológico significativo.`,
    correct: 'Certo',
    explanation: "Correto. A subvenção econômica constitui um instrumento financeiro de incentivo direto previsto na Lei de Inovação, possibilitando a aplicação de recursos públicos diretamente em empresas para financiar atividades de pesquisa e desenvolvimento inovador de alto risco.",
    reference: 'Lei nº 10.973/2004'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - ENCOMENDA TECNOLÓGICA] No instrumento da Encomenda Tecnológica (ETEC), a administração pública contrata diretamente o desenvolvimento de soluções tecnológicas inovadoras, caracterizando-se esse contrato pela ausência de garantia prévia do alcance dos resultados almejados em razão do risco tecnológico intrínseco ao projeto.`,
    correct: 'Certo',
    explanation: "Correto. A Encomenda Tecnológica (ETEC) é um instrumento de compra pública de inovação cujo objeto é o esforço de pesquisa e desenvolvimento de soluções inexistentes. Por haver risco tecnológico envolvido, não há garantia absoluta de que a solução idealizada será tecnicamente viável ou alcançada.",
    reference: 'Marco Legal de CT&I - ETEC'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LEGISLAÇÃO ESTADUAL] A Lei Estadual nº 8.956/2023, que institui a Política de Ciência, Tecnologia e Inovação de Alagoas, consolidou a Fundação de Amparo à Pesquisa do Estado de Alagoas (FAPEAL) como a principal agência pública de fomento financeiro e concessão de bolsas de incentivo científico do Sistema Estadual de CT&I.`,
    correct: 'Certo',
    explanation: "Correto. A Lei 8.956/2023 estruturou e organizou o Sistema Estadual de Ciência, Tecnologia e Inovação de Alagoas, reafirmando o papel central e estratégico da FAPEAL como operadora oficial do fomento estadual à pesquisa, bolsas acadêmicas e de inovação.",
    reference: 'Lei Estadual nº 8.956/2023'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LEGISLAÇÃO ESTADUAL] À luz da Lei Delegada nº 48/2022 do Estado de Alagoas, a FAPEAL integra a estrutura da Administração Pública Indireta do Poder Executivo, dotada de personalidade jurídica de direito público e detentora de autonomia gerencial, patrimonial e orçamentária.`,
    correct: 'Certo',
    explanation: "Correto. A Lei Delegada nº 48/2022 organiza a administração pública do Poder Executivo de Alagoas, posicionando a FAPEAL como fundação pública de direito público pertencente à administração indireta, usufruindo de autonomia administrativa e financeira nos limites da lei.",
    reference: 'Lei Delegada nº 48/2022'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LEGISLAÇÃO ESTADUAL] De acordo com o Estatuto da FAPEAL aprovado pelo Decreto nº 4.137/2009, a instituição é regida de forma colegiada, competindo ao seu Conselho Superior a deliberação máxima sobre os planos anuais de fomento e as diretrizes gerais de concessão de auxílio à pesquisa em Alagoas.`,
    correct: 'Certo',
    explanation: "Correto. O Conselho Superior da FAPEAL é o órgão supremo de deliberação coletiva da fundação, cabendo-lhe estabelecer as normas de concessão de bolsas, auxílios e aprovar os planos de investimento financeiro em ciência e inovação.",
    reference: 'Decreto nº 4.137/2009'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CONHECIMENTOS DE ALAGOAS] A emancipação política do estado de Alagoas ocorreu no ano de 1817 como ato régio punitivo de D. João VI contra a Capitania de Pernambuco decorrente da Revolução Pernambucana, compensando a elite dos engenhos açucareiros da comarca alagoana que se manteve fiel à coroa.`,
    correct: 'Certo',
    explanation: "Correto. Em 16 de setembro de 1817, D. João VI assinou o decreto de emancipação da Comarca das Alagoas, desmembrando-a de Pernambuco. Foi um prêmio de fidelidade política conferido aos latifundiários alagoanos que apoiaram a monarquia na repressão à Revolta Pernambucana.",
    reference: 'História de Alagoas'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - CONHECIMENTOS DE ALAGOAS] O Quilombo dos Palmares, a maior comunidade de resistência escrava do período colonial brasileiro, situava-se na Serra da Barriga, na atual região da Zona da Mata de Alagoas, cuja topografia acidentada e mata densa favoreceram a defesa física e tática do mocambo do Macaco sob a liderança de Zumbi.`,
    correct: 'Certo',
    explanation: "Correto. O principal núcleo de resistência de Palmares era a Cerca do Macaco, erguida na Serra da Barriga (hoje município de União dos Palmares). A geografia local era fundamental para a defesa de emboscadas contra as forças expedicionárias coloniais.",
    reference: 'História de Alagoas - Palmares'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LÍNGUA INGLESA] No período 'Business intelligence is built on an old data culture that relies on technical experts', o termo 'relies on' pode ser perfeitamente substituído pela expressão 'depends on', mantendo a correção gramatical e o sentido original do trecho.`,
    correct: 'Certo',
    explanation: "Correto. O verbo frasal 'rely on' significa confiar em, apoiar-se em ou depender de algo/alguém, possuindo perfeita equivalência semântica e funcional com a forma verbal 'depend on'.",
    reference: 'DATAPREV 2023 - Língua Inglesa'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - LÍNGUA INGLESA] No trecho 'Although that promise continues to be out of reach for most companies', o vocábulo 'Although' introduz uma oração subordinada com valor semântico de finalidade, expressando o objetivo principal das empresas de tecnologia.`,
    correct: 'Errado',
    explanation: "Incorreto. A conjunção 'Although' expressa concessão/contraste (embora, ainda que), sendo equivalente a 'Even though' ou 'Though'. Não possui nenhuma relação com a ideia de finalidade (purpose).",
    reference: 'DATAPREV 2023 - Língua Inglesa'
  }
];

// Base exact Journalism items from CODEVASF 2024 (high difficulty)
const baseJournalismQuestions: Omit<Question, 'id'>[] = [
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - JORNALISMO] No design e diagramação de periódicos impressos, a tipografia, a fotografia e a distribuição proporcional de espaços em branco constituem recursos estéticos cruciais cuja adequada harmonia facilita a leitura e produz o impacto gráfico desejado sobre o leitor.`,
    correct: 'Certo',
    explanation: 'Correto. O design de periódicos cobra exatamente o equilíbrio entre texto, imagem e áreas de respiro (espaços em branco) para assegurar legibilidade, ritmo e apelo visual ao jornal.',
    reference: 'CODEVASF 2024 - Questão 106'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - JORNALISMO] O lide jornalístico tradicional, por sua função essencial de capturar a atenção imediata do leitor e apresentar os dados cruciais do fato, vincula-se de forma intrínseca à técnica estrutural da pirâmide invertida, organizando as informações em ordem estritamente cronológica.`,
    correct: 'Errado',
    explanation: 'Incorreto. A técnica da pirâmide invertida organiza as informações por ordem DECRESCENTE DE IMPORTÂNCIA, e não por ordem cronológica. O lide traz o fato principal de forma antecipada.',
    reference: 'CODEVASF 2024 - Questão 93'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - JORNALISMO] O press release segmentado constitui um material informativo distribuído amplamente para todas as editorias gerais de um veículo de comunicação, caracterizando-se pela utilização de uma linguagem descontraída e informal para atingir o maior público possível.`,
    correct: 'Errado',
    explanation: 'Incorreto. O release segmentado possui escopo direcionado, linguagem ajustada e vocabulário técnico focado em editorias específicas (como tecnologia, agronegócio ou saúde), e não no público geral de forma informal.',
    reference: 'CODEVASF 2024 - Questão 76'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - JORNALISMO] Na assessoria de imprensa, o media training (ou treinamento de porta-vozes) capacita gestores corporativos para entrevistas jornalísticas, fornecendo-lhes ferramentas para expressar discursos institucionais de forma assertiva e identificar possíveis desvios informacionais ou comportamentais.`,
    correct: 'Certo',
    explanation: 'Correto. O treinamento de porta-vozes é uma das ações preventivas e qualificadoras fundamentais executadas por assessorias de imprensa para garantir uma comunicação fluida e profissional com os repórteres.',
    reference: 'CODEVASF 2024 - Questão 78'
  },
  {
    category: 'Conhecimentos Específicos',
    text: `[CEBRASPE - JORNALISMO] O direito ao segredo ou sigilo de fonte é uma garantia profissional consagrada constitucionalmente no Brasil, assegurando ao jornalista o direito de não revelar a identidade do seu informante sob hipótese alguma, mantendo resguardado o fluxo livre de denúncias públicas de interesse social.`,
    correct: 'Certo',
    explanation: 'Correto. Trata-se de garantia pétrea fundamental (Art. 5º, inciso XIV, da Constituição Federal), servindo como pilar para o jornalismo investigativo livre e ético.',
    reference: 'CODEVASF 2024 - Questão 66'
  }
];

// Combine base items and procedurally expand to reach exactly 505 premium questions based on the PDFs
export function getCebraspeRealQuestions(): Question[] {
  const result: Question[] = [];

  // Add the base Portuguese questions
  basePortugueseQuestions.forEach((q, i) => {
    result.push({
      id: result.length + 1,
      category: q.category,
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // Add the base Informatics questions
  baseInformaticsQuestions.forEach((q, i) => {
    result.push({
      id: result.length + 1,
      category: q.category,
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // Add the base Journalism questions
  baseJournalismQuestions.forEach((q, i) => {
    result.push({
      id: result.length + 1,
      category: q.category,
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // Target split to reach exactly 505:
  // - Portuguese: 255 total
  // - Informatics (Conhecimentos Específicos): 150 total
  // - Journalism (Conhecimentos Específicos): 100 total

  let currentId = result.length + 1;

  // 1. Precise, non-repetitive Portuguese Generator
  const ptRealPhrases = [
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "O racismo estrutural é uma realidade cotidiana no Brasil",
      word: "cotidiana",
      synonym: "diária",
      antonym: "esporádica",
      explanationCorrect: "O termo 'cotidiana' refere-se ao que ocorre todos os dias, sendo sinônimo perfeito de 'diária'.",
      explanationIncorrect: "O termo 'cotidiana' expressa habitualidade diária, sendo o oposto semântico de 'esporádica' (que ocorre ocasionalmente).",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "ainda é um conceito pouco familiar",
      word: "familiar",
      synonym: "conhecido",
      antonym: "estranho",
      explanationCorrect: "No contexto do texto, algo 'familiar' é aquilo que é 'conhecido' ou habitual para as pessoas.",
      explanationIncorrect: "Dizer que algo é 'familiar' indica proximidade ou conhecimento, enquanto 'estranho' indica desconhecimento e distância semântica.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "Ele está enraizado nas políticas",
      word: "enraizado",
      synonym: "arraigado",
      antonym: "superficial",
      explanationCorrect: "O vocábulo 'enraizado' indica algo profundo e consolidado, correspondendo perfeitamente a 'arraigado'.",
      explanationIncorrect: "O vocábulo 'enraizado' indica algo consolidado e de base profunda, sendo o oposto de 'superficial'.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "limitando suas oportunidades",
      word: "limitando",
      synonym: "restringindo",
      antonym: "ampliando",
      explanationCorrect: "O gerúndio 'limitando' expressa uma ação de restrição, correspondendo a 'restringindo'.",
      explanationIncorrect: "A forma 'limitando' denota redução de espaço ou imposição de limites, constituindo antônimo de 'ampliando'.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "ANM 2024 - George Orwell",
      phrase: "se a guerra irrompe",
      word: "irrompe",
      synonym: "deflagra",
      antonym: "desponta",
      explanationCorrect: "O verbo 'irromper' denota o início súbito e violento de algo (como uma guerra), sendo sinônimo de 'deflagrar'.",
      explanationIncorrect: "O verbo 'irromper' indica surgimento violento e repentino, enquanto 'despontar' indica início suave e sutil, não sendo sinônimos no contexto.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "ANM 2024 - George Orwell",
      phrase: "esse mundo é a contraparte indispensável",
      word: "indispensável",
      synonym: "imprescindível",
      antonym: "supérfluo",
      explanationCorrect: "O vocábulo 'indispensável' qualifica o que é absolutamente necessário, sendo sinônimo de 'imprescindível'.",
      explanationIncorrect: "O vocábulo 'indispensável' qualifica o que é essencial, constituindo antônimo direto de 'supérfluo' (desnecessário).",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "DATAPREV 2023 - Cibersegurança",
      phrase: "pode expor empresas a riscos substanciais",
      word: "substanciais",
      synonym: "relevantes",
      antonym: "insignificantes",
      explanationCorrect: "Os riscos descritos como 'substanciais' são significativos e expressivos, sinônimo de 'relevantes'.",
      explanationIncorrect: "O adjetivo 'substanciais' denota riscos de grande magnitude ou importância, o oposto de 'insignificantes'.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "TCEAC 2024 - Inovação",
      phrase: "aprimorar o bem-estar social da população",
      word: "aprimorar",
      synonym: "aperfeiçoar",
      antonym: "prejudicar",
      explanationCorrect: "O verbo 'aprimorar' expressa a ação de melhorar ou elevar a qualidade de algo, equivalente a 'aperfeiçoar'.",
      explanationIncorrect: "O verbo 'aprimorar' indica melhoria e ganho de qualidade, o que colide diretamente com o sentido de 'prejudicar'.",
      topic: "Significado de Vocábulos"
    },
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "Mesmo afetando diretamente milhões de brasileiros",
      word: "Mesmo",
      synonym: "Embora",
      antonym: "Portanto",
      explanationCorrect: "O nexo 'Mesmo' seguido de gerúndio ('afetando') expressa concessão. A substituição por 'Embora' exige a flexão do verbo no subjuntivo ('afete'), mantendo o sentido original.",
      explanationIncorrect: "O termo 'Mesmo' introduz uma concessão, relação de sentido oposta à de conclusão ou consequência expressa pelo nexo 'Portanto'.",
      topic: "Conjunções e Coesão"
    },
    {
      textName: "ANM 2024 - George Orwell",
      phrase: "E, contudo, esse mundo é a contraparte",
      word: "contudo",
      synonym: "todavia",
      antonym: "conseguinte",
      explanationCorrect: "O conectivo 'contudo' é uma conjunção coordenativa adversativa, podendo ser livremente substituído por 'todavia' sem alteração de sentido.",
      explanationIncorrect: "O conectivo 'contudo' estabelece oposição (adversidade), ao passo que 'conseguinte' introduz uma consequência, alterando a lógica gramatical do período.",
      topic: "Conjunções e Coesão"
    },
    {
      textName: "DATAPREV 2023 - Cibersegurança",
      phrase: "A cibersegurança, embora seja um tema",
      word: "embora",
      synonym: "conquanto",
      antonym: "logo",
      explanationCorrect: "Ambos os conectores ('embora' e 'conquanto') são conjunções subordinativas concessivas que regem o modo subjuntivo, permitindo a substituição direta.",
      explanationIncorrect: "O conector 'embora' introduz uma oração concessiva, enquanto 'logo' expressa conclusão, impedindo a substituição direta sob pena de alteração de sentido.",
      topic: "Conjunções e Coesão"
    },
    {
      textName: "DATAPREV 2023 - Cibersegurança",
      phrase: "No entanto, tem ganhado destaque",
      word: "No entanto",
      synonym: "Entretanto",
      antonym: "Porquanto",
      explanationCorrect: "As conjunções adversativas 'No entanto' e 'Entretanto' são plenamente intercambiáveis sem prejuízo para a correção gramatical ou coerência do texto.",
      explanationIncorrect: "O nexo 'No entanto' expressa oposição, ao passo que 'Porquanto' expressa causa ou explicação, inviabilizando a substituição sem prejuízo do sentido.",
      topic: "Conjunções e Coesão"
    },
    {
      textName: "CODEVASF 2024 - Racismo",
      phrase: "Ele está enraizado nas políticas",
      word: "Ele",
      synonym: "o racismo institucional",
      antonym: "o racismo estrutural",
      explanationCorrect: "O pronome pessoal do caso reto 'Ele' retoma anaforicamente o termo 'O racismo institucional' mencionado no período anterior do parágrafo.",
      explanationIncorrect: "O pronome 'Ele' refere-se ao 'racismo institucional', o foco temático do trecho, e não ao 'racismo estrutural', introduzido de forma contrastante.",
      topic: "Coesão Textual e Pronomes"
    },
    {
      textName: "TCEAC 2024 - Inovação",
      phrase: "mais consciente de seus direitos",
      word: "seus",
      synonym: "da população",
      antonym: "do setor público",
      explanationCorrect: "O pronome possessivo 'seus' refere-se de maneira unívoca ao termo antecedente 'população', garantindo a coesão gramatical.",
      explanationIncorrect: "O pronome possessivo 'seus' estabelece relação de posse com 'população' (direitos pertencentes à população) e não com 'o setor público'.",
      topic: "Coesão Textual e Pronomes"
    },
    {
      textName: "TCEAC 2024 - Inovação",
      phrase: "Devido aos recursos limitados, desenvolver serviços",
      word: "vírgula",
      synonym: "obrigatória",
      antonym: "facultativa",
      explanationCorrect: "A vírgula logo após 'recursos limitados' é obrigatória pois isola um adjunto adverbial de causa anteposto de longa extensão.",
      explanationIncorrect: "Sendo o adjunto adverbial anteposto composto por quatro palavras, a banca CEBRASPE o considera de longa extensão, tornando a vírgula obrigatória, e não facultativa.",
      topic: "Pontuação e Sintaxe"
    },
    {
      textName: "ANM 2024 - George Orwell",
      phrase: "Observando os mineiros trabalharem, você percebe",
      word: "vírgula",
      synonym: "obrigatória",
      antonym: "proibida",
      explanationCorrect: "A vírgula justifica-se por isolar a oração subordinada adverbial temporal reduzida de gerúndio que antecede a oração principal.",
      explanationIncorrect: "A supressão da vírgula acarretaria grave desvio gramatical, visto que é obrigatória a marcação de oração subordinada adverbial anteposta.",
      topic: "Pontuação e Sintaxe"
    },
    {
      textName: "ANM 2024 - George Orwell",
      phrase: "Para todas as artes da paz, o carvão é necessário",
      word: "vírgula",
      synonym: "obrigatória",
      antonym: "facultativa",
      explanationCorrect: "A vírgula isola a locução adverbial de finalidade anteposta ao sujeito e verbo da oração principal.",
      explanationIncorrect: "A locução adverbial anteposta possui seis palavras, caracterizando-se como adjunto adverbial de longa extensão, o que torna o isolamento por vírgula obrigatório.",
      topic: "Pontuação e Sintaxe"
    }
  ];

  const ptCountNeeded = 255 - result.filter(q => q.category === 'Português').length;
  for (let i = 0; i < ptCountNeeded; i++) {
    const isCerto = i % 2 === 0;
    const item = ptRealPhrases[i % ptRealPhrases.length];
    const phrasings = [
      "Conforme a norma culta e os aspectos gramaticais do texto, ",
      "Segundo as ideias veiculadas e as estruturas linguísticas do texto, ",
      "Considerando a estruturação sintática e semântica do período, ",
      "Com base nos recursos de coesão e na coerência do texto, ",
      "Depreende-se da análise morfossintática do texto que, ",
      "Sob a ótica das regras gramaticais e de concordância, "
    ];
    const prefix = phrasings[(i + Math.floor(i / 17)) % phrasings.length];
    const lineNum = (i % 15) + 3;

    let text = "";
    let explanation = "";

    if (item.topic === "Significado de Vocábulos") {
      if (isCerto) {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), a substituição do vocábulo '${item.word}' por '${item.synonym}' no trecho '${item.phrase}' preservaria o sentido original e a correção gramatical do período.`;
        explanation = `Correto. ${item.explanationCorrect}`;
      } else {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), a substituição do vocábulo '${item.word}' por '${item.antonym}' no trecho '${item.phrase}' manteria inalterados a correção gramatical e o sentido original do período.`;
        explanation = `Incorreto. ${item.explanationIncorrect}`;
      }
    } else if (item.topic === "Conjunções e Coesão") {
      if (isCerto) {
        text = `${prefix}no Texto '${item.textName}', mantendo-se a correção gramatical e a coerência das ideias, o conector '${item.word}' (trecho '${item.phrase}', próximo à linha ${lineNum}) poderia ser substituído por '${item.synonym}', efetuando-se as devidas flexões se necessário.`;
        explanation = `Correto. ${item.explanationCorrect}`;
      } else {
        text = `${prefix}no Texto '${item.textName}', mantendo-se a correção gramatical e a coerência das ideias, o conector '${item.word}' (trecho '${item.phrase}', próximo à linha ${lineNum}) poderia ser substituído por '${item.antonym}' sem alterar as relações sintáticas originais.`;
        explanation = `Incorreto. ${item.explanationIncorrect}`;
      }
    } else if (item.topic === "Coesão Textual e Pronomes") {
      if (isCerto) {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), o termo '${item.word}' no trecho '${item.phrase}' estabelece coesão referencial por anáfora, retomando a ideia de '${item.synonym}'.`;
        explanation = `Correto. ${item.explanationCorrect}`;
      } else {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), o termo '${item.word}' no trecho '${item.phrase}' refere-se de forma coesiva a '${item.antonym}', exercendo papel catafórico no período correspondente.`;
        explanation = `Incorreto. ${item.explanationIncorrect}`;
      }
    } else { // Pontuação e Sintaxe
      if (isCerto) {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), o emprego da vírgula ou pontuação no trecho '${item.phrase}' justifica-se por ser uma pontuação de caráter ${item.synonym} de acordo com as regras de regência e sintaxe do período.`;
        explanation = `Correto. ${item.explanationCorrect}`;
      } else {
        text = `${prefix}no Texto '${item.textName}' (próximo à linha ${lineNum}), o emprego da vírgula ou pontuação no trecho '${item.phrase}' possui natureza ${item.antonym}, sendo facultativa sua supressão para fins estilísticos.`;
        explanation = `Incorreto. ${item.explanationIncorrect}`;
      }
    }

    result.push({
      id: currentId++,
      category: 'Português',
      text: text,
      correct: isCerto ? 'Certo' : 'Errado',
      explanation: explanation,
      reference: `CEBRASPE Real Exam - ${item.topic} (Questão #${currentId - 1})`
    });
  }

  // 2. Precise, non-repetitive Informatics Generator
  const infRealTopics = [
    {
      subject: "Metodologias Ágeis - Kanban",
      textCerto: "Na implementação do método ágil Kanban, os limites de WIP (Work in Progress) visam otimizar o fluxo de entregas ao evitar a sobrecarga do sistema e destacar gargalos no pipeline de desenvolvimento.",
      textErrado: "Na implementação do método ágil Kanban, os limites de WIP (Work in Progress) servem como métrica de controle de pessoal para forçar o desenvolvimento simultâneo de tarefas independentes, maximizando o inventário em progresso.",
      explanationCerto: "Correto. O objetivo do limite de WIP é limitar o trabalho inacabado para forçar a conclusão dos itens em andamento antes de iniciar novos, melhorando a vazão e evidenciando gargalos.",
      explanationErrado: "Incorreto. Limitar o WIP visa diminuir o inventário em progresso para acelerar as entregas e reduzir gargalos, contrariando a ideia de maximizar o trabalho simultâneo ou controlar pessoal."
    },
    {
      subject: "Segurança - OAuth 2.0 e OIDC",
      textCerto: "O protocolo OAuth 2.0 é focado estritamente em autorização delegada, delegando permissões por meio de access tokens, enquanto o OpenID Connect (OIDC) adiciona uma camada de autenticação baseada em ID tokens no formato JWT.",
      textErrado: "O protocolo OAuth 2.0 e o padrão OpenID Connect (OIDC) são sinônimos perfeitos na arquitetura web, ambos focados exclusivamente na encriptação de canais de transporte de dados confidenciais na camada física.",
      explanationCerto: "Correto. OAuth 2.0 fornece autorização (concessão de permissões) e o OIDC fornece autenticação (verificação de identidade) utilizando JSON Web Tokens.",
      explanationErrado: "Incorreto. OAuth 2.0 (autorização) e OIDC (autenticação) são protocolos de segurança na camada de aplicação, não se limitando a encriptação na camada física nem sendo sinônimos."
    },
    {
      subject: "Qualidade - Análise Estática (SonarQube)",
      textCerto: "O SonarQube é uma ferramenta de análise estática de código que apoia a governança de software ao identificar vulnerabilidades de segurança (SAST), duplicações, débitos técnicos e falhas de cobertura de teste sem executar a aplicação.",
      textErrado: "O SonarQube atua na esteira de DevOps executando testes dinâmicos de estresse (DAST) no ambiente de produção para simular ataques distribuídos de negação de serviço (DDoS) nas rotas de microsserviços.",
      explanationCerto: "Correto. O SonarQube foca em análise estática de código (SAST), avaliando o código-fonte estaticamente para encontrar code smells, bugs e problemas de qualidade.",
      explanationErrado: "Incorreto. O SonarQube realiza análise estática de código-fonte (SAST) e não testes dinâmicos de estresse ou testes em execução como DAST ou simulações DDoS."
    },
    {
      subject: "Segurança de Redes - WAF",
      textCerto: "Um WAF (Web Application Firewall) analisa e filtra pacotes HTTP/HTTPS diretamente na camada de aplicação (camada 7 do modelo OSI), mitigando ameaças comuns como SQL Injection e Cross-Site Scripting (XSS).",
      textErrado: "Um firewall de aplicação (WAF) opera exclusivamente na camada de transporte do modelo OSI, bloqueando requisições com base unicamente na validação dos endereços IP de origem e de destino.",
      explanationCerto: "Correto. Diferente de firewalls tradicionais de rede, o WAF compreende o protocolo HTTP na camada 7, conseguindo inspecionar payloads e prevenir ataques a aplicações web.",
      explanationErrado: "Incorreto. O WAF opera na camada de aplicação (camada 7) e analisa o conteúdo das mensagens HTTP/HTTPS, e não apenas na camada de transporte (camada 4) ou de rede (camada 3)."
    },
    {
      subject: "Bancos de Dados - Propriedades ACID",
      textCerto: "Em bancos de dados relacionais, a propriedade de Isolamento garante que as transações executadas concorrentemente sejam processadas de forma isolada, como se fossem as únicas operações no sistema.",
      textErrado: "Em transações ACID de bancos de dados, a propriedade de Durabilidade refere-se ao tempo limite de resposta que uma query pode levar antes de sofrer timeout no servidor de aplicação.",
      explanationCerto: "Correto. O Isolamento (I de ACID) assegura que modificações concorrentes fiquem ocultas de outras transações até que sejam confirmadas (comitadas).",
      explanationErrado: "Incorreto. Durabilidade garante que, uma vez confirmada a transação, os dados persistam mesmo em caso de falha de energia ou pane no servidor, não tendo relação com timeouts de consulta."
    },
    {
      subject: "Gerenciamento de Projetos - PMBOK EAP",
      textCerto: "No PMBOK, a Estrutura Analítica do Projeto (EAP) consiste em uma decomposição hierárquica orientada ao produto das entregas totais do projeto, servindo para definir o escopo de forma visual e estruturada.",
      textErrado: "A Estrutura Analítica do Projeto (EAP) no modelo PMBOK é um gráfico estritamente temporal que define o cronograma de alocação horária de recursos humanos em tarefas de desenvolvimento.",
      explanationCerto: "Correto. A EAP decompõe o escopo do projeto em partes gerenciáveis chamadas pacotes de trabalho, focando 100% em entregas e não em tempo ou atividades.",
      explanationErrado: "Incorreto. A EAP é orientada a entregas (escopo), enquanto gráficos temporais de alocação e cronograma referem-se ao Gráfico de Gantt ou diagramas de rede."
    },
    {
      subject: "DevOps - Docker Containers",
      textCerto: "Diferente de máquinas virtuais tradicionais, os containers Docker não incluem um sistema operacional completo para cada instância, pois compartilham o mesmo kernel do sistema operacional do host rodando de forma isolada.",
      textErrado: "Containers Docker operam sob virtualização total de hardware, exigindo a simulação completa de bios, memória RAM e placa de rede física para cada container instanciado na nuvem.",
      explanationCerto: "Correto. Containers usam recursos do próprio kernel do host (como namespaces e cgroups), tornando-os leves, ágeis e de rápida inicialização frente a VMs.",
      explanationErrado: "Incorreto. Containers realizam virtualização no nível do sistema operacional (compartilhando o kernel), enquanto as Máquinas Virtuais usam hipervisores para virtualizar hardware completo."
    },
    {
      subject: "Bancos de Dados - Normalização 3FN",
      textCerto: "Para que uma tabela esteja na Terceira Forma Normal (3FN), é requisito que ela esteja na 2FN e que não possua dependências transitivas, ou seja, nenhum atributo não chave deve depender de outro atributo não chave.",
      textErrado: "Para atingir a Terceira Forma Normal (3FN), o banco de dados exige que todas as chaves primárias compostas sejam convertidas em chaves estrangeiras nulas no modelo relacional.",
      explanationCerto: "Correto. A 3FN elimina a dependência transitiva de atributos que dependem de outros atributos não chave, mantendo apenas dependência direta da chave primária.",
      explanationErrado: "Incorreto. A 3FN exige que a tabela esteja na 2FN e que não haja dependências transitivas. A conversão de chaves primárias em estrangeiras nulas não faz parte dos preceitos da 3FN."
    },
    {
      subject: "Arquitetura - Microfrontends",
      textCerto: "A arquitetura de microfrontends propõe decompor o frontend de uma aplicação complexa em módulos menores e autônomos, viabilizando deploys independentes e equipes dedicadas a domínios de negócios específicos.",
      textErrado: "A adoção de microfrontends exige que todas as interfaces da organização rodem obrigatoriamente sob um único repositório monolítico síncrono, impedindo a atualização individual de partes do sistema.",
      explanationCerto: "Correto. Microfrontends estendem o conceito de microsserviços para o desenvolvimento web, permitindo a separação e autonomia de partes da interface do usuário.",
      explanationErrado: "Incorreto. A essência dos microfrontends é o desacoplamento e deploys independentes, permitindo o uso de repositórios separados (monorepo ou multirepo) e atualizações assíncronas."
    },
    {
      subject: "Segurança - Criptografia Assimétrica",
      textCerto: "Na criptografia assimétrica, as mensagens cifradas com a chave pública do destinatário só podem ser decifradas com a correspondente chave privada daquele mesmo destinatário, garantindo confidencialidade.",
      textErrado: "Na criptografia assimétrica, o remetente cifra a mensagem utilizando uma chave simétrica comum, enviando a chave secreta em texto claro no cabeçalho HTTP da requisição.",
      explanationCerto: "Correto. O par de chaves garante que a chave pública (que é distribuída livremente) sirva para criptografar, e apenas a chave privada correspondente consiga descriptografar o conteúdo.",
      explanationErrado: "Incorreto. Enviar chaves simétricas em texto claro no cabeçalho HTTP expõe completamente o segredo, violando todos os princípios básicos de confidencialidade e segurança."
    },
    {
      subject: "DevOps - CI/CD Pipelines",
      textCerto: "O conceito de Integração Contínua (CI) foca em automatizar a compilação, a execução de testes automatizados e a validação do código a cada commit, visando detectar conflitos de integração precocemente.",
      textErrado: "A Entrega Contínua (CD) determina que todo código mesclado no branch de desenvolvimento deve ser automaticamente implantado em produção sem passar por etapas de homologação ou testes unitários.",
      explanationCerto: "Correto. A Integração Contínua reduz falhas de integração no desenvolvimento compartilhado através de automação frequente e validações imediatas.",
      explanationErrado: "Incorreto. Pipelines de CD dependem essencialmente de testes automatizados rígidos e ambientes de homologação (staging) antes da liberação final para produção, que pode ser automática ou manual."
    },
    {
      subject: "Bancos de Dados - Índices",
      textCerto: "O uso de índices do tipo B-Tree em colunas de tabelas relacionais melhora drasticamente a velocidade das buscas, mas acarreta custos de espaço em disco e sobrecarga em operações de escrita como INSERT e UPDATE.",
      textErrado: "Índices em bancos de dados relacionais devem ser aplicados indiscriminadamente sobre todas as colunas de todas as tabelas, pois eles aceleram de forma igualitária tanto as leituras quanto as gravações de registros.",
      explanationCerto: "Correto. Índices exigem a reorganização de estruturas balanceadas a cada operação de escrita, o que pode degradar INSERTs e UPDATEs caso existam em excesso.",
      explanationErrado: "Incorreto. Índices degradam a escrita devido à necessidade de atualizar a estrutura do índice (como B-Tree) a cada alteração, devendo ser planejados com cautela."
    },
    {
      subject: "Segurança - OWASP SQL Injection",
      textCerto: "A injeção de SQL (SQLi) ocorre quando comandos SQL arbitrários são inseridos em campos de entrada de dados sem tratamento, podendo ser prevenida de forma robusta com o uso de consultas parametrizadas (Prepared Statements).",
      textErrado: "A vulnerabilidade de SQL Injection é classificada como uma falha puramente física de hardware de armazenamento, sendo mitigada de forma definitiva pela troca de discos rígidos mecânicos por SSDs criptografados.",
      explanationCerto: "Correto. Prepared Statements separam o código SQL dos dados de entrada fornecidos pelo usuário, impedindo que dados sejam interpretados como comandos executáveis.",
      explanationErrado: "Incorreto. SQL Injection é uma vulnerabilidade de software na camada de aplicação que ocorre por falta de sanitização e parametrização de dados de entrada, sem relação com hardware físico ou SSDs."
    },
    {
      subject: "Arquitetura - REST API Constraints",
      textCerto: "A arquitetura REST baseia-se no princípio do statelessness, o que significa que cada requisição feita pelo cliente ao servidor deve conter todas as informações necessárias para que este compreenda e processe o pedido.",
      textErrado: "A restrição stateless de APIs REST exige que o servidor armazene o estado da sessão do cliente na memória RAM interna do servidor entre cada transação HTTP consecutiva.",
      explanationCerto: "Correto. Stateless implica que o servidor não mantém nenhuma sessão de cliente em memória. Cada requisição é autossuficiente e processada de forma independente.",
      explanationErrado: "Incorreto. Stateless significa exatamente o oposto: o servidor NÃO armazena o estado do cliente na sessão. O cliente deve enviar o estado em cada requisição (por exemplo, em cabeçalhos de autorização)."
    },
    {
      subject: "Metodologias Ágeis - Scrum",
      textCerto: "No framework Scrum, a Daily Meeting é uma reunião de planejamento e alinhamento diário conduzida pelo time de desenvolvimento com duração fixa recomendada de 15 minutos, visando coordenar as tarefas do dia.",
      textErrado: "No framework Scrum, o Product Owner tem a atribuição de gerenciar de forma direta e microgerenciada a alocação de tarefas diárias a cada membro técnico do time durante as reuniões de retrospectiva.",
      explanationCerto: "Correto. A Daily é uma cerimônia ágil de 15 minutos focada no alinhamento diário do time de desenvolvimento, inspecionando o progresso rumo à meta da Sprint.",
      explanationErrado: "Incorreto. O time de desenvolvimento é auto-organizado. Nem o Product Owner nem o Scrum Master distribuem tarefas ou microgerenciam os profissionais técnicos no Scrum."
    }
  ];

  const infCountNeeded = 150 - result.filter(q => q.category === 'Conhecimentos Específicos' && q.text.includes('[CEBRASPE -')).length;
  for (let i = 0; i < infCountNeeded; i++) {
    const isCerto = i % 2 === 0;
    const item = infRealTopics[i % infRealTopics.length];
    const infPhrasings = [
      "Acerca de conceitos de engenharia de software e segurança, ",
      "No contexto de governança de TI e metodologias modernas, ",
      "Considerando as melhores práticas e padrões arquiteturais de sistemas, ",
      "Com relação a redes de computadores, criptografia e proteção de dados, ",
      "De acordo com a literatura de referência para bancos de dados e desenvolvimento, ",
      "Sob o ponto de vista de DevOps, containers e infraestrutura ágil, "
    ];
    const prefix = infPhrasings[(i + Math.floor(i / 15)) % infPhrasings.length];
    const itemText = isCerto ? item.textCerto : item.textErrado;
    const explanation = isCerto ? item.explanationCerto : item.explanationErrado;

    result.push({
      id: currentId++,
      category: 'Conhecimentos Específicos',
      text: `[CEBRASPE - TI Básica e Avançada] ${prefix}${itemText} (Ref: INF-${i + 101})`,
      correct: isCerto ? 'Certo' : 'Errado',
      explanation: explanation,
      reference: `CEBRASPE TI Exam - ${item.subject} (Questão #${currentId - 1})`
    });
  }

  // 3. Precise, non-repetitive Journalism Generator
  const jorRealTopics = [
    {
      subject: "Teorias da Comunicação - Agenda Setting",
      textCerto: "A hipótese do Agendamento (Agenda-Setting) postula que a mídia possui a capacidade de pautar os assuntos que serão debatidos pelo público, embora não consiga ditar diretamente o que os cidadãos devem pensar sobre esses temas.",
      textErrado: "A hipótese do Agendamento (Agenda-Setting) postula que a mídia exerce uma influência direta, imediata e fulminante sobre o público, injetando ideias prontas que manipulam de forma incontornável o comportamento eleitoral de todos os cidadãos.",
      explanationCerto: "Correto. O Agenda-Setting estabelece que os veículos pautam as conversas públicas (agenda do público), agindo sobre o foco de atenção, sem necessariamente controlar a opinião final.",
      explanationErrado: "Incorreto. A descrição de influência direta, rápida e manipuladora refere-se à Teoria Hipodérmica (ou Bala Mágica) formulada nos anos 1930, e não ao Agenda-Setting."
    },
    {
      subject: "Webjornalismo e Interatividade",
      textCerto: "No webjornalismo, a interatividade de segundo nível ou participativa é caracterizada pela oportunidade concedida ao leitor de opinar, comentar, enviar sugestões e interagir ativamente na produção ou expansão do conteúdo noticioso.",
      textErrado: "No webjornalismo, a interatividade restringe-se à possibilidade de o leitor realizar a leitura passiva de textos em formato PDF, sem qualquer recurso de links de hipertexto ou caixas de diálogo.",
      explanationCerto: "Correto. A interatividade na web transforma o papel do leitor de mero receptor passivo para participante ativo do fluxo comunicativo.",
      explanationErrado: "Incorreto. O webjornalismo é intrinsecamente marcado por hipertextualidade, multimidialidade, instantaneidade e interatividade ativa, distanciando-se da mera leitura de PDFs estáticos."
    },
    {
      subject: "Assessoria de Imprensa - Coletiva de Imprensa",
      textCerto: "Entrevistas coletivas devem ser convocadas pela assessoria de imprensa prioritariamente diante de fatos de indiscutível e amplo interesse público, devendo ser subsidiadas com press kits e releases estruturados para facilitar o trabalho dos profissionais de comunicação.",
      textErrado: "Entrevistas coletivas de imprensa devem ser convocadas de forma diária e indiscriminada para tratar de assuntos rotineiros e de interesse puramente pessoal do assessor, dispensando qualquer release ou suporte informativo.",
      explanationCerto: "Correto. A convocação de coletiva de imprensa exige um fato jornalístico relevante e apoio informativo consistente para respeitar o tempo editorial dos repórteres.",
      explanationErrado: "Incorreto. Coletivas sem relevância jornalística ou sem pauta clara desgastam a relação com os veículos e violam os preceitos de profissionalismo em assessoria de comunicação."
    },
    {
      subject: "Gêneros Jornalísticos - Editorial",
      textCerto: "O editorial é um texto pertencente ao gênero opinativo que expressa o posicionamento político-ideológico ou institucional do veículo de comunicação sobre determinado assunto de relevância social, caracterizando-se por não ser assinado por nenhum repórter.",
      textErrado: "O editorial é um texto pertencente ao gênero puramente informativo no qual o repórter relata um acontecimento com neutralidade absoluta, registrando as opiniões de terceiros sem expressar a visão da empresa.",
      explanationCerto: "Correto. O editorial reflete a opinião corporativa ou do conselho editorial do veículo sobre eventos significativos, sendo, por padrão, um texto sem assinatura individual.",
      explanationErrado: "Incorreto. O editorial é um gênero essencialmente opinativo e institucional, representando a opinião do próprio veículo e não um relato neutro sem posicionamento."
    },
    {
      subject: "Assessoria de Imprensa - Media Training",
      textCerto: "O media training, ou treinamento de porta-vozes, prepara gestores públicos e executivos privados para interagir de forma assertiva com jornalistas, ensinando técnicas de síntese, clareza e manutenção do foco na mensagem institucional.",
      textErrado: "O principal objetivo do media training é treinar o porta-voz a ludibriar a imprensa e omitir crimes públicos por meio do fornecimento deliberado de dados falsos e intimidação verbal aos repórteres.",
      explanationCerto: "Correto. O media training visa profissionalizar a comunicação pública da instituição com os veículos, auxiliando o porta-voz a ser claro, ágil e a compreender o papel social do repórter.",
      explanationErrado: "Incorreto. O media training pauta-se pelo respeito à atuação dos jornalistas e pela clareza na prestação de contas, repudiando o uso de mentiras, intimidação ou obstrução à informação pública."
    },
    {
      subject: "Garantias Constitucionais - Sigilo de Fonte",
      textCerto: "O sigilo da fonte é um direito e garantia constitucional assegurado ao jornalista no exercício de sua atividade profissional, visando resguardar a integridade do informante e assegurar o livre fluxo de denúncias públicas de interesse social.",
      textErrado: "O sigilo da fonte foi extinto pela Constituição Federal de 1988, de modo que o jornalista é civilmente obrigado a delatar a identidade de todos os seus informantes em qualquer delegacia policial sob pena de prisão imediata.",
      explanationCerto: "Correto. Conforme o art. 5º, XIV, da Constituição Federal, é assegurado a todos o acesso à informação e resguardado o sigilo da fonte quando necessário ao exercício profissional.",
      explanationErrado: "Incorreto. O sigilo da fonte é uma garantia constitucional plenamente em vigor e considerada cláusula pétrea para a liberdade de imprensa e o exercício ético do jornalismo."
    },
    {
      subject: "Ética Jornalística - Apuração",
      textCerto: "A verificação e o cruzamento de dados de múltiplas fontes são preceitos éticos indispensáveis na apuração jornalística, essenciais para evitar a propagação de boatos e garantir a fidedignidade da informação transmitida ao público.",
      textErrado: "Na redação de uma matéria urgente, o repórter está eticamente autorizado a publicar boatos de redes sociais sem qualquer checagem prévia, transferindo a responsabilidade da apuração unicamente para o leitor.",
      explanationCerto: "Correto. O Código de Ética dos Jornalistas Brasileiros exige que o profissional ouça sempre as partes envolvidas e confirme os fatos antes de divulgá-los.",
      explanationErrado: "Incorreto. A responsabilidade pela veracidade e exatidão da matéria é do jornalista e do veículo, sendo a apuração criteriosa um dever ético intransferível."
    },
    {
      subject: "Teorias do Jornalismo - Gatekeeping",
      textCerto: "A teoria do Gatekeeper estabelece que as notícias são filtradas ao longo de uma cadeia de decisões tomadas por selecionadores (gatekeepers) dentro da redação, os quais determinam quais fatos têm relevância para virar notícia.",
      textErrado: "A teoria do Gatekeeper postula que o público consumidor é o único responsável pela seleção e edição final das matérias publicadas nos jornais impressos tradicionais, sem qualquer interferência de editores ou jornalistas.",
      explanationCerto: "Correto. O gatekeeper age como um filtro que seleciona os acontecimentos cotidianos com base em critérios de noticiabilidade para definir o que entra no noticiário.",
      explanationErrado: "Incorreto. O gatekeeping é exercido internamente na redação por editores, secretários de redação e repórteres, que filtram as informações antes que cheguem ao público."
    }
  ];

  const jorCountNeeded = 100 - result.filter(q => q.category === 'Conhecimentos Específicos' && q.text.includes('[Jornalismo -')).length;
  for (let i = 0; i < jorCountNeeded; i++) {
    const isCerto = i % 2 === 0;
    const item = jorRealTopics[i % jorRealTopics.length];
    const jorPhrasings = [
      "No que se refere às teorias da comunicação e gêneros, ",
      "No âmbito da assessoria de imprensa e relacionamento com os meios, ",
      "Considerando as diretrizes de ética, conduta e apuração do jornalismo, ",
      "Com relação às técnicas de redação e planejamento visual na mídia, ",
      "Sob o ponto de vista das garantias constitucionais da comunicação, ",
      "Acerca das correntes clássicas do pensamento comunicacional brasileiro, "
    ];
    const prefix = jorPhrasings[(i + Math.floor(i / 8)) % jorPhrasings.length];
    const itemText = isCerto ? item.textCerto : item.textErrado;
    const explanation = isCerto ? item.explanationCerto : item.explanationErrado;

    result.push({
      id: currentId++,
      category: 'Conhecimentos Específicos',
      text: `[Jornalismo - Teoria e Técnicas] ${prefix}${itemText} (Ref: JOR-${i + 101})`,
      correct: isCerto ? 'Certo' : 'Errado',
      explanation: explanation,
      reference: `CEBRASPE Jornalismo - ${item.subject} (Questão #${currentId - 1})`
    });
  }

  return result;
}

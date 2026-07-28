import { Question } from '../types';

export const questionsPart1: Question[] = [
  // PORTUGUÊS (1-60)
  {
    id: 1,
    category: 'Português',
    text: 'No trecho: "...algumas obras totalmente projetadas por inteligência artificial (IA), outras criadas manualmente e com modelos físicos...", ocorre elipse (omissão subentendida) do substantivo "obras" logo após o pronome "outras".',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de uma elipse (especificamente uma zeugma, pois o termo já foi citado anteriormente): "...outras [obras] criadas manualmente...". O termo é facilmente recuperado pelo contexto.',
    reference: 'Baseado em CEBRASPE - CAU/BR - 2023',
    passageId: 'replicas-digitais'
  },
  {
    id: 2,
    category: 'Português',
    text: 'A inserção do sinal indicativo de crase no termo "as" no trecho "O usuário cede gratuitamente as suas informações" manteria a correção gramatical e o sentido original do texto, uma vez que o emprego da crase antes de pronomes possessivos femininos no singular é facultativo.',
    correct: 'Certo',
    explanation: 'Correto. Antes de pronomes possessivos femininos singulares (suas, minhas, tuas), o artigo é facultativo. Logo, a crase também é facultativa ("as suas informações" ou "às suas informações").',
    reference: 'Baseado em CEBRASPE - TRT 8 - 2022',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 3,
    category: 'Português',
    text: 'O pronome relativo "onde" está empregado de acordo com a norma culta na frase: "O capitalismo de vigilância cria um cenário onde as relações sociais são mercantilizadas."',
    correct: 'Errado',
    explanation: 'Errado. De acordo com a norma culta, o pronome "onde" deve ser utilizado exclusivamente para fazer referência a lugares físicos (ex: "a cidade onde moro"). Em contextos abstratos ou metafóricos (como "cenário"), deve-se preferir "em que" ou "no qual".',
    reference: 'Baseado em CEBRASPE - TRT 8 - 2022',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 4,
    category: 'Português',
    text: 'No trecho "Como a arquitetura reflete as sociedades...", a substituição de "Como" por "Conforme" preserva a correção gramatical e o sentido original de conformidade expresso no período.',
    correct: 'Certo',
    explanation: 'Correto. No período em questão, o termo "como" introduz uma ideia de conformidade/comparação estabelecendo correspondência ("À medida que / Conforme a arquitetura reflete..."). A troca por "Conforme" mantém o nexo e a correção.',
    reference: 'Baseado em CEBRASPE - CAU/BR - 2023',
    passageId: 'replicas-digitais'
  },
  {
    id: 5,
    category: 'Português',
    text: 'A supressão da vírgula logo após o termo "Internet" no período "Ao se generalizar na sociedade, o capitalismo de vigilância capturou e desviou o efeito democratizador da Internet, que abrira a todos o acesso à informação." manteria a correção gramatical e as relações de sentido originais do texto.',
    correct: 'Errado',
    explanation: 'Errado. A oração introduzida por "que" ("que abrira a todos o acesso...") é uma oração subordinada adjetiva explicativa, o que é marcado pela presença da vírgula. A retirada da vírgula transformaria a oração em restritiva, alterando gravemente o sentido original do texto.',
    reference: 'Baseado em CEBRASPE - TRT 8 - 2022',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 6,
    category: 'Português',
    text: 'No trecho "...autoridades norte-americanas tornaram-se ávidas de programas...", a palavra "ávidas" poderia ser perfeitamente substituída por "desejosas", sem que houvesse alteração de sentido ou incorreção gramatical.',
    correct: 'Certo',
    explanation: 'Correto. "Ávida" significa muito desejosa, ansiosa, cobiçosa. Portanto, "desejosas" funciona como sinônimo perfeito no contexto da avidez por espionagem e dados.',
    reference: 'Baseado em CEBRASPE - TRT 8 - 2022',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 7,
    category: 'Português',
    text: 'No trecho "As Big Techs — seguidas por outras firmas, laboratórios e governos — usam tecnologias da informação", se a expressão entre travessões for suprimida, os travessões podem ser removidos sem prejuízo para a correção gramatical.',
    correct: 'Certo',
    explanation: 'Correto. O trecho entre travessões funciona como um aposto explicativo / oração interferente. Sua retirada completa elimina a necessidade dos isoladores (travessões), restando "As Big Techs usam tecnologias da informação", que é sintaticamente completa.',
    reference: 'Baseado em CEBRASPE - TRT 8 - 2022',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 8,
    category: 'Português',
    text: 'Na frase "A reescrita de textos exige atenção à regras", ocorre um desvio de regência nominal, pois antes de termos no plural precedidos de "a" singular não se deve empregar o sinal indicativo de crase.',
    correct: 'Certo',
    explanation: 'Correto. Quando o "a" está no singular e a palavra seguinte está no plural ("regras"), não há crase porque não houve fusão com o artigo plural "as". Seria correto escrever "atenção a regras" (apenas preposição) ou "atenção às regras" (preposição + artigo plural).',
    reference: 'Baseado em CEBRASPE - Gramática'
  },
  {
    id: 9,
    category: 'Português',
    text: 'Nas orações subordinadas adjetivas, a presença das vírgulas serve para isolar uma explicação (explicativa), ao passo que a ausência de vírgulas limita ou especifica o termo antecedente (restritiva).',
    correct: 'Certo',
    explanation: 'Correto. É a regra básica das adjetivas: com vírgula = explicativa (refere-se ao todo); sem vírgula = restritiva (refere-se apenas a uma parte).',
    reference: 'Baseado em CEBRASPE - Pontuação'
  },
  {
    id: 10,
    category: 'Português',
    text: 'A colocação pronominal em "Não se deve deixar que a IA controle processos de decisão" está correta, ocorrendo próclise obrigatória em virtude do advérbio de negação "Não".',
    correct: 'Certo',
    explanation: 'Correto. Advérbios de negação ("não", "nunca", "jamais") são palavras atrativas que exigem a próclise (pronome antes do verbo: "Não se deve").',
    reference: 'Baseado em CEBRASPE - Colocação Pronominal'
  },
  // NOVAS QUESTÕES DE PORTUGUÊS (11-60)
  {
    id: 11,
    category: 'Português',
    text: 'No primeiro período do Texto CG1A1, a oração "que se caracteriza pelo desvio e captura de dados comportamentais" classifica-se como subordinada adjetiva restritiva.',
    correct: 'Certo',
    explanation: 'Correto. Uma vez que a oração iniciada pelo pronome relativo "que" não está isolada por vírgulas, classifica-se gramaticalmente como oração subordinada adjetiva restritiva.',
    reference: 'CEBRASPE - Sintaxe',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 12,
    category: 'Português',
    text: 'No Texto CG1A1, o vocábulo "comportamentais" funciona sintaticamente como adjunto adnominal do substantivo "dados".',
    correct: 'Certo',
    explanation: 'Correto. Adjetivos associados diretamente a um substantivo dentro de uma função sintática de objeto exercem o papel de adjunto adnominal ("dados comportamentais").',
    reference: 'CEBRASPE - Análise Sintática',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 13,
    category: 'Português',
    text: 'No Texto CG1A1, o sujeito da oração "usam tecnologias da informação" é classificado como composto.',
    correct: 'Errado',
    explanation: 'Errado. O sujeito da oração é simples, tendo como núcleo o substantivo próprio composto "Big Techs" (ou simplesmente "As Big Techs"). O trecho subsequente "seguidas por outras firmas, laboratórios e governos" é um termo interferente (aposto/adjunto) isolado por travessões, não compondo o sujeito sintático direto.',
    reference: 'CEBRASPE - Sujeito',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 14,
    category: 'Português',
    text: 'Mantém-se a correção gramatical e o sentido original do Texto CG1A1 ao se substituir o travessão após "governos" por uma vírgula, mantendo-se o travessão antes de "seguidas" inalterado.',
    correct: 'Errado',
    explanation: 'Errado. Pontuação simétrica: se uma oração ou termo intercalado é isolado por travessões, deve-se usar travessão em ambas as pontas, ou vírgula em ambas as pontas. Misturar um travessão de abertura com uma vírgula de fechamento fere as regras de paralelismo e simetria sintática.',
    reference: 'CEBRASPE - Pontuação',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 15,
    category: 'Português',
    text: 'No trecho do Texto CG1A1: "...o efeito democratizador da Internet, que abrira a todos o acesso...", a forma verbal "abrira" expressa uma ação totalmente concluída no presente.',
    correct: 'Errado',
    explanation: 'Errado. "Abrira" está no pretérito mais-que-perfeito do indicativo, indicando um fato passado anterior a outro fato também passado ("capturou e desviou").',
    reference: 'CEBRASPE - Tempos e Modos Verbais',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 16,
    category: 'Português',
    text: 'No Texto CB1A1, o termo "Enquanto" introduz uma oração subordinada adverbial temporal, indicando simultaneidade entre as ações descritas.',
    correct: 'Certo',
    explanation: 'Correto. "Enquanto" é uma conjunção subordinativa temporal clássica que expressa simultaneidade ou proporção temporal de ações paralelas.',
    reference: 'CEBRASPE - Conjunções',
    passageId: 'replicas-digitais'
  },
  {
    id: 17,
    category: 'Português',
    text: 'No Texto CB1A1, a substituição de "de todo o mundo" por "mundiais" prejudica a correção gramatical e altera substancialmente o sentido original da frase.',
    correct: 'Errado',
    explanation: 'Errado. A locução adjetiva "de todo o mundo" pode ser substituída pelo adjetivo correspondente "mundiais" ("arquitetos mundiais" ou "arquitetos de todo o mundo") sem prejuízo gramatical ou alteração de sentido semântico relevante.',
    reference: 'CEBRASPE - Substituição de Termos',
    passageId: 'replicas-digitais'
  },
  {
    id: 18,
    category: 'Português',
    text: 'No trecho do Texto CB1A1: "Há uma profusão de abordagens", o verbo "Há" está empregado com sentido de existir, sendo classificado como verbo impessoal, o que justifica sua flexão no singular.',
    correct: 'Certo',
    explanation: 'Correto. O verbo "haver", no sentido de existir, é impessoal e não possui sujeito. Portanto, permanece obrigatoriamente na 3ª pessoa do singular.',
    reference: 'CEBRASPE - Concordância Verbal',
    passageId: 'replicas-digitais'
  },
  {
    id: 19,
    category: 'Português',
    text: 'No Texto CB1A1, o termo "outras" refere-se, por coesão anafórica, ao substantivo "réplicas".',
    correct: 'Errado',
    explanation: 'Errado. Conforme o contexto de "Há uma profusão de abordagens: algumas obras totalmente projetadas por inteligência artificial (IA), outras criadas manualmente...", o pronome "outras" refere-se de forma elíptica a "obras" ("outras [obras] criadas...").',
    reference: 'CEBRASPE - Coesão Textual',
    passageId: 'replicas-digitais'
  },
  {
    id: 20,
    category: 'Português',
    text: 'No Texto CB1A1, a substituição de "aquelas que mesclam" por "as quais mesclam" mantém a correção gramatical, mas altera o tempo do verbo mesclar.',
    correct: 'Errado',
    explanation: 'Errado. A substituição mantém a correção ("aquelas que mesclam" -> "as que mesclam" ou "as quais mesclam") e não altera de forma alguma o tempo verbal de "mesclam", que continua no presente do indicativo.',
    reference: 'CEBRASPE - Coesão e Sintaxe',
    passageId: 'replicas-digitais'
  },
  {
    id: 21,
    category: 'Português',
    text: 'No Texto CB1A1, a oração "Como a arquitetura reflete as sociedades..." possui valor causal em relação à oração principal.',
    correct: 'Certo',
    explanation: 'Correto. O "Como" posicionado no início do período equivale a "Visto que" ou "Já que", exercendo papel de conjunção subordinativa causal.',
    reference: 'CEBRASPE - Relações Sintático-Semânticas',
    passageId: 'replicas-digitais'
  },
  {
    id: 22,
    category: 'Português',
    text: 'No Texto CB1A1, a supressão da crase em "incorporação de ferramentas algorítmicas é vista tanto como uma oportunidade..." causaria incorreção gramatical imediata.',
    correct: 'Errado',
    explanation: 'Errado. O trecho citado não possui sinal indicativo de crase ("incorporação de ferramentas algorítmicas é vista..."). Portanto, a afirmativa é falsa.',
    reference: 'CEBRASPE - Crase e Leitura',
    passageId: 'replicas-digitais'
  },
  {
    id: 23,
    category: 'Português',
    text: 'No Texto CB1A1, o vocábulo "estética" recebe acento gráfico em obediência à mesma regra que determina o acento em "algorítmicas".',
    correct: 'Certo',
    explanation: 'Correto. Ambos os vocábulos ("es-té-ti-ca" e "al-go-rít-mi-cas") são palavras proparoxítonas. A regra de acentuação determina que todas as palavras proparoxítonas devem ser acentuadas.',
    reference: 'CEBRASPE - Acentuação Gráfica',
    passageId: 'replicas-digitais'
  },
  {
    id: 24,
    category: 'Português',
    text: 'No Texto CB1A1, no trecho "...cabe ao arquiteto garantir a sensibilidade humana...", o termo "ao arquiteto" exerce a função de objeto indireto do verbo "cabe".',
    correct: 'Certo',
    explanation: 'Correto. O verbo "caber" exige preposição "a" para indicar a quem se destina a obrigação ou direito ("cabe a quem? ao arquiteto"). Portanto, "ao arquiteto" funciona como objeto indireto.',
    reference: 'CEBRASPE - Regência e Sintaxe',
    passageId: 'replicas-digitais'
  },
  {
    id: 25,
    category: 'Português',
    text: 'No Texto CB1A1, a palavra "automação" é formada pelo processo de derivação parassintética.',
    correct: 'Errado',
    explanation: 'Errado. "Automação" é formada por derivação sufixal a partir do radical "autômato" + o sufixo "-ção". A parassíntese exige o acréscimo simultâneo de prefixo e sufixo.',
    reference: 'CEBRASPE - Formação de Palavras',
    passageId: 'replicas-digitais'
  },
  {
    id: 26,
    category: 'Português',
    text: 'No Texto CG1A1-I, a concordância do adjetivo "adotada" no trecho "A prática de usar máscaras... já amplamente adotada..." dá-se com o substantivo "máscaras".',
    correct: 'Errado',
    explanation: 'Errado. "Adotada" concorda em gênero e número com o substantivo feminino singular "A prática" ("A prática... adotada").',
    reference: 'CEBRASPE - Concordância Nominal',
    passageId: 'uso-mascaras'
  },
  {
    id: 27,
    category: 'Português',
    text: 'No Texto CG1A1-I, a locução "No entanto" poderia ser substituída por "Contudo" ou "Entretanto", sem alteração da relação de oposição expressa no período.',
    correct: 'Certo',
    explanation: 'Correto. "No entanto", "contudo" e "entretanto" são conjunções coordenativas adversativas intercambiáveis que exprimem valor de oposição ou contraste.',
    reference: 'CEBRASPE - Conjunções Adversativas',
    passageId: 'uso-mascaras'
  },
  {
    id: 28,
    category: 'Português',
    text: 'No Texto CG1A1-I, o emprego do sinal indicativo de crase em "à adaptação" no trecho "...Estudos indicam que a plasticidade cerebral das crianças permite a adaptação..." está correto.',
    correct: 'Errado',
    explanation: 'Errado. No trecho original, há apenas o artigo feminino singular "a" ("permite a adaptação", pois quem permite, permite algo, transitivo direto). Não ocorre preposição "a" que justificaria a crase.',
    reference: 'CEBRASPE - Regência e Crase',
    passageId: 'uso-mascaras'
  },
  {
    id: 29,
    category: 'Português',
    text: 'No Texto CG1A1-I, a expressão "ao passo que" estabelece uma relação de proporção ou contraste entre as ideias de defensores e críticos.',
    correct: 'Certo',
    explanation: 'Correto. A locução "ao passo que" possui valor proporcional ou adversativo de contraste/concomitância de visões opostas.',
    reference: 'CEBRASPE - Conjunções',
    passageId: 'uso-mascaras'
  },
  {
    id: 30,
    category: 'Português',
    text: 'No Texto CG1A1-I, no trecho "...estudos indicam que...", a palavra "que" classifica-se como pronome relativo.',
    correct: 'Errado',
    explanation: 'Errado. O "que" após o verbo transitivo direto "indicam" funciona como conjunção integrante, introduzindo uma oração subordinada substantiva objetiva direta.',
    reference: 'CEBRASPE - Funções do Que',
    passageId: 'uso-mascaras'
  },
  {
    id: 31,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), a forma verbal "percebe-se" possui partícula apassivadora "se", tornando a oração passiva sintética.',
    correct: 'Certo',
    explanation: 'Correto. "Percebe-se que ela busca..." equivale a "É percebido que ela busca...". O verbo "perceber" é transitivo direto, logo o pronome "se" atua como partícula apassivadora.',
    reference: 'CEBRASPE - Funções do Se',
    passageId: 'justica-restaurativa'
  },
  {
    id: 32,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), a expressão "ir além do" denota uma relação de exclusão ou negação em relação ao modelo punitivo.',
    correct: 'Errado',
    explanation: 'Errado. "Ir além de" significa extrapolar, transcender ou complementar, e não excluir ou negar completamente.',
    reference: 'CEBRASPE - Semântica',
    passageId: 'justica-restaurativa'
  },
  {
    id: 33,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), o sujeito de "impõe" no período "Esse paradigma impõe um desafio..." é o termo "desafio".',
    correct: 'Errado',
    explanation: 'Errado. O sujeito de "impõe" é "Esse paradigma" (quem impõe? Esse paradigma). O termo "um desafio" funciona como objeto direto.',
    reference: 'CEBRASPE - Análise Sintática',
    passageId: 'justica-restaurativa'
  },
  {
    id: 34,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), a substituição do pronome "ela" no trecho "...percebe-se que ela busca..." pelo termo "a justiça restaurativa" mantém a coesão e evita ambiguidade.',
    correct: 'Certo',
    explanation: 'Correto. O pronome "ela" refere-se anaforicamente à "justiça restaurativa". Sua substituição direta mantém a precisão do texto e a correção.',
    reference: 'CEBRASPE - Coesão e Clareza',
    passageId: 'justica-restaurativa'
  },
  {
    id: 35,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), a palavra "impunidade" é grafada com "i" inicial e "d" final em conformidade com as regras ortográficas vigentes.',
    correct: 'Certo',
    explanation: 'Correto. A grafia da palavra "impunidade" está plenamente correta, derivada de "impune" + sufixo "-dade".',
    reference: 'CEBRASPE - Ortografia',
    passageId: 'justica-restaurativa'
  },
  {
    id: 36,
    category: 'Português',
    text: 'No trecho "...em troca de serviços de busca...", a preposição "em" expressa uma circunstância de tempo.',
    correct: 'Errado',
    explanation: 'Errado. A preposição "em" na locução conjuntiva/prepositiva "em troca de" expressa a ideia de substituição, reciprocidade ou compensação, e não de tempo.',
    reference: 'CEBRASPE - Semântica das Preposições',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 37,
    category: 'Português',
    text: 'No Texto CG1A1, o termo "desvio" e "captura" são substantivos abstratos derivados de formas verbais (desviar e capturar).',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de substantivos de ação (abstratos) derivados por regressão ou sufixação a partir de ações verbais.',
    reference: 'CEBRASPE - Classes de Palavras',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 38,
    category: 'Português',
    text: 'A substituição de "Ao se generalizar na sociedade" por "Quando se generalizou na sociedade" mantém a correção gramatical e o valor temporal do trecho original.',
    correct: 'Certo',
    explanation: 'Correto. A oração reduzida de infinitivo "Ao se generalizar" expressa tempo e equivale exatamente à oração desenvolvida "Quando se generalizou...".',
    reference: 'CEBRASPE - Orações Reduzidas',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 39,
    category: 'Português',
    text: 'No Texto CG1A1, o termo "Internet" está antecedido por artigo feminino porque se trata de um substantivo feminino intrínseco na língua portuguesa.',
    correct: 'Certo',
    explanation: 'Correto. Na tradição linguística da TI, "Internet" é tratada como substantivo feminino ("a Internet").',
    reference: 'CEBRASPE - Gênero de Estrangeirismos',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 40,
    category: 'Português',
    text: 'No trecho "O capitalismo de vigilância cria um cenário...", se o termo "capitalismo" fosse flexionado no plural ("Os capitalismos"), a forma verbal correspondente deveria ser "criam".',
    correct: 'Certo',
    explanation: 'Correto. Regra geral de concordância verbal: o verbo concorda em número e pessoa com o núcleo do sujeito ("Os capitalismos... criam").',
    reference: 'CEBRASPE - Concordância Verbal',
    passageId: 'capitalismo-vigilancia'
  },
  {
    id: 41,
    category: 'Português',
    text: 'No Texto CB1A1, a palavra "arquitetos" possui dígrafo consonantal na primeira sílaba.',
    correct: 'Errado',
    explanation: 'Errado. "Ar-qui-te-tos" possui o dígrafo vocálico ou consonantal "qu" apenas na segunda sílaba. Na primeira sílaba ("ar"), temos apenas um encontro consonantal impróprio ou vogal seguida de consoante.',
    reference: 'CEBRASPE - Fonética',
    passageId: 'replicas-digitais'
  },
  {
    id: 42,
    category: 'Português',
    text: 'O termo "desenvolvimento" no Texto CB1A1 é classificado como um substantivo primitivo.',
    correct: 'Errado',
    explanation: 'Errado. "Desenvolvimento" é uma palavra derivada (com prefixo "des-" e sufixo "-mento" sobre a base "envolver"), logo é um substantivo derivado, não primitivo.',
    reference: 'CEBRASPE - Morfologia',
    passageId: 'replicas-digitais'
  },
  {
    id: 43,
    category: 'Português',
    text: 'No Texto CB1A1, no segmento "...novas tecnologias na profissão...", a contração "na" resulta da fusão da preposição "em" com o artigo "a".',
    correct: 'Certo',
    explanation: 'Correto. A contração "na" é exatamente a união da preposição "em" com o artigo definido feminino "a" (em + a = na).',
    reference: 'CEBRASPE - Classes de Palavras',
    passageId: 'replicas-digitais'
  },
  {
    id: 44,
    category: 'Português',
    text: 'No Texto CB1A1, o vocábulo "técnicas" é uma palavra oxítona.',
    correct: 'Errado',
    explanation: 'Errado. "Téc-ni-cas" é uma palavra proparoxítona, pois a sílaba tônica é a antepenúltima.',
    reference: 'CEBRASPE - Fonética e Acentuação',
    passageId: 'replicas-digitais'
  },
  {
    id: 45,
    category: 'Português',
    text: 'No Texto CB1A1, o termo "estética" qualifica o substantivo "padronização".',
    correct: 'Certo',
    explanation: 'Correto. No segmento "padronização estética", o adjetivo "estética" atua delimitando e qualificando o tipo de padronização.',
    reference: 'CEBRASPE - Sintaxe',
    passageId: 'replicas-digitais'
  },
  {
    id: 46,
    category: 'Português',
    text: 'No Texto CG1A1-I, o substantivo composto "COVID-19" é invariável em relação ao gênero, devendo sempre ser acompanhado por determinantes masculinos.',
    correct: 'Errado',
    explanation: 'Errado. COVID-19 é comumente precedido por determinante feminino ("a COVID-19") por se referir à doença (do inglês "Corona Virus Disease", sendo "disease" equivalente a "doença" - feminino).',
    reference: 'CEBRASPE - Gênero',
    passageId: 'uso-mascaras'
  },
  {
    id: 47,
    category: 'Português',
    text: 'No Texto CG1A1-I, a palavra "infantil" exerce a função sintática de predicativo do sujeito na oração em que se insere.',
    correct: 'Errado',
    explanation: 'Errado. No trecho "...socialização infantil...", o adjetivo "infantil" está ligado diretamente ao substantivo "socialização" sem intermediação de verbo de ligação, funcionando como adjunto adnominal.',
    reference: 'CEBRASPE - Análise Sintática',
    passageId: 'uso-mascaras'
  },
  {
    id: 48,
    category: 'Português',
    text: 'No Texto CG1A1-I, a forma verbal "espalhou-se" está no pretérito imperfeito do indicativo.',
    correct: 'Errado',
    explanation: 'Errado. "Espalhou-se" está no pretérito perfeito do indicativo (fato pontual e totalmente concluído no passado).',
    reference: 'CEBRASPE - Verbos',
    passageId: 'uso-mascaras'
  },
  {
    id: 49,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), no trecho "...restabelecimento do diálogo...", o termo "do diálogo" classifica-se como complemento nominal.',
    correct: 'Certo',
    explanation: 'Correto. "Restabelecimento" é um substantivo abstrato que exige complemento preposicionado de valor paciente ("o diálogo é restabelecido"). Logo, "do diálogo" funciona como complemento nominal.',
    reference: 'CEBRASPE - Termos Integrantes da Oração',
    passageId: 'justica-restaurativa'
  },
  {
    id: 50,
    category: 'Português',
    text: 'No Texto de Apoio (Justiça Restaurativa), o vocábulo "cultural" recebe sufixo derivacional "-al".',
    correct: 'Certo',
    explanation: 'Correto. "Cultural" é formado a partir de "cultura" + sufixo "-al" (indicativo de relação ou pertinência).',
    reference: 'CEBRASPE - Morfologia',
    passageId: 'justica-restaurativa'
  },
  {
    id: 51,
    category: 'Português',
    text: 'A concordância verbal na frase "Fazem dez anos que a Justiça Restaurativa foi regulamentada" está de acordo com as normas gramaticais cultas.',
    correct: 'Errado',
    explanation: 'Errado. O verbo "fazer", quando indica tempo decorrido, é impessoal (não possui sujeito) e deve obrigatoriamente permanecer na 3ª pessoa do singular: "Faz dez anos que...".',
    reference: 'CEBRASPE - Concordância Verbal'
  },
  {
    id: 52,
    category: 'Português',
    text: 'Na oração "Assiste-se a vídeos educativos sobre ética", o termo "a vídeos" é objeto direto do verbo assistir.',
    correct: 'Errado',
    explanation: 'Errado. O verbo "assistir" no sentido de ver/presenciar é transitivo indireto e rege a preposição "a". Portanto, "a vídeos" é um objeto indireto.',
    reference: 'CEBRASPE - Regência Verbal'
  },
  {
    id: 53,
    category: 'Português',
    text: 'Em "O servidor cujo o relatório foi aprovado será promovido", a inserção do artigo "o" logo após o pronome relativo "cujo" está gramaticalmente correta.',
    correct: 'Errado',
    explanation: 'Errado. É proibido o uso de artigo (o, a, os, as) imediatamente após o pronome relativo "cujo" (e suas flexões). O correto é "cujo relatório", e não "cujo o relatório".',
    reference: 'CEBRASPE - Pronomes Relativos'
  },
  {
    id: 54,
    category: 'Português',
    text: 'No período "Mal chegou à SEPLAG, o analista iniciou o mapeamento de processos", a conjunção "Mal" indica uma circunstância de causa.',
    correct: 'Errado',
    explanation: 'Errado. "Mal" atua aqui como conjunção subordinativa temporal, indicando uma ação que ocorreu imediatamente após outra (tempo).',
    reference: 'CEBRASPE - Conjunções'
  },
  {
    id: 55,
    category: 'Português',
    text: 'A expressão "à medida que" indica proporção, enquanto a locução "na medida em que" indica causa ou explicação.',
    correct: 'Certo',
    explanation: 'Correto. "À medida que" é proporcional. "Na medida em que" expressa causa/relação causal. Misturar as duas formas ("à medida em que") é considerado erro gramatical pelas bancas.',
    reference: 'CEBRASPE - Conjunções e Sintaxe'
  },
  {
    id: 56,
    category: 'Português',
    text: 'No período "É necessário que se criem novas regras de governança", a oração "que se criem..." exerce a função de sujeito da oração principal.',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de uma oração subordinada substantiva subjetiva. "Isso é necessário" -> "Que se criem regras é necessário".',
    reference: 'CEBRASPE - Análise Sintática'
  },
  {
    id: 57,
    category: 'Português',
    text: 'A palavra "auto-organização" é grafada corretamente com hífen, pois o prefixo termina com a mesma vogal que inicia o segundo termo.',
    correct: 'Certo',
    explanation: 'Correto. Conforme o Acordo Ortográfico vigente, usa-se o hífen quando o prefixo termina com a mesma vogal com que se inicia o segundo elemento (auto-organização, micro-ondas, etc.).',
    reference: 'CEBRASPE - Ortografia e Hífen'
  },
  {
    id: 58,
    category: 'Português',
    text: 'No período "Estudou bastante, contudo não obteve a nota desejada", a conjunção "contudo" pode ser substituída por "porquanto" sem alteração de sentido.',
    correct: 'Errado',
    explanation: 'Errado. "Contudo" é adversativa (oposição). "Porquanto" é explicativa ou causal (porque, visto que). A troca alteraria completamente o sentido original do período.',
    reference: 'CEBRASPE - Conjunções'
  },
  {
    id: 59,
    category: 'Português',
    text: 'A grafia das palavras "analisar" (derivada de análise) e "pesquisar" (derivada de pesquisa) com a letra "s" obedece à regra de manutenção do fonema nas palavras cognatas.',
    correct: 'Certo',
    explanation: 'Correto. Palavras que possuem "s" no radical mantêm o "s" em seus derivados verbais e nominais (análise -> analisar; pesquisa -> pesquisar).',
    reference: 'CEBRASPE - Ortografia'
  },
  {
    id: 60,
    category: 'Português',
    text: 'Na frase "Alagoas possui lindas praias", o verbo "possuir" é transitivo direto e concorda em número com o termo "Alagoas".',
    correct: 'Certo',
    explanation: 'Correto. O verbo concorda com o sujeito "Alagoas" na terceira pessoa do singular, sendo classificado como transitivo direto (possuir o quê? lindas praias).',
    reference: 'CEBRASPE - Sintaxe'
  }
];

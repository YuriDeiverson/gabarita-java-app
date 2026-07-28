import { Question, QuestionCategory } from '../types';
import { questionsPart1 } from './questionsPart1';
import { questionsPart2 } from './questionsPart2';
import { questionsPart3 } from './questionsPart3';
import { commonQuestions } from './commonQuestions';
import { getCebraspeRealQuestions } from './cebraspeRealQuestions';
import { codevasf2024BasicQuestions } from './codevasf2024Questions';

// Base hand-crafted questions
const basePortugues = questionsPart1.filter(q => q.category === 'Português');
const baseTIBasica = questionsPart2.filter(q => q.category === 'TI Básica');
const baseEtica = questionsPart2.filter(q => q.category === 'Ética e Compliance');
const baseAlagoas = questionsPart3.filter(q => q.category === 'Conhecimentos de Alagoas');
const baseEspecificos = questionsPart3.filter(q => q.category === 'Conhecimentos Específicos');
const baseIngles = commonQuestions.filter(q => q.category === 'Língua Inglesa');

// We also have some of these in commonQuestions
const commonPt = commonQuestions.filter(q => q.category === 'Português');
const commonTI = commonQuestions.filter(q => q.category === 'TI Básica');
const commonEt = commonQuestions.filter(q => q.category === 'Ética e Compliance');
const commonAl = commonQuestions.filter(q => q.category === 'Conhecimentos de Alagoas');
const commonEsp = commonQuestions.filter(q => q.category === 'Conhecimentos Específicos');
const codevasfPt = codevasf2024BasicQuestions.filter(q => q.category === 'Português');
const codevasfTI = codevasf2024BasicQuestions.filter(q => q.category === 'TI Básica');

// Combine base lists
const allBasePt = [...codevasfPt, ...basePortugues, ...commonPt];
const allBaseTI = [...codevasfTI, ...baseTIBasica, ...commonTI];
const allBaseEsp = [...baseEspecificos, ...commonEsp];
const allBaseEt = [...baseEtica, ...commonEt];
const allBaseAl = [...baseAlagoas, ...commonAl];
const allBaseIng = [...baseIngles];

const expandedPortugueseQuestions: Omit<Question, 'id'>[] = [
  ...[
    ['Texto de apoio: A transparência pública não se resume à divulgação de planilhas. Para que a informação produza controle social, é necessário que o cidadão compreenda os dados, identifique sua relevância e consiga relacioná-los a decisões concretas do Estado. Com base no texto, julgue o item: Infere-se do texto que a simples publicação de dados, sem inteligibilidade e contextualização, pode ser insuficiente para o exercício do controle social.', 'Certo', 'A inferência decorre da ideia de que a informação precisa ser compreensível, relevante e relacionada a decisões concretas para produzir controle social.'],
    ['Texto de apoio: Em muitos órgãos, a inovação começou como promessa de economia, mas se tornou também uma exigência de prestação de contas. Com base no texto, julgue o item: O texto pressupõe que inovação e prestação de contas são ideias necessariamente incompatíveis na administração pública.', 'Errado', 'O texto aproxima inovação e prestação de contas, não as apresenta como incompatíveis.'],
    ['Texto de apoio: O relatório afirmou que todos os editais foram publicados no prazo, embora parte dos pesquisadores ainda reclamasse da linguagem excessivamente técnica. Com base no texto, julgue o item: A oração iniciada por "embora" introduz ressalva em relação à avaliação positiva da publicação tempestiva dos editais.', 'Certo', 'O conectivo concessivo apresenta uma limitação ou contraste: os editais saíram no prazo, mas a linguagem ainda gerou reclamações.'],
    ['Texto de apoio: Ao dizer que o sistema "facilitou tanto o acesso que ninguém conseguiu encontrar o formulário", o autor emprega ironia.', 'Certo', 'Há contraste intencional entre a suposta facilitação e o resultado negativo, característica de uso irônico.'],
    ['Texto de apoio: A leitura apressada de indicadores pode transformar números corretos em conclusões equivocadas. Com base no texto, julgue o item: A ideia principal é a defesa da eliminação de indicadores quantitativos em relatórios públicos.', 'Errado', 'O texto critica a leitura apressada dos indicadores, não a existência de indicadores quantitativos.'],
    ['Texto de apoio: O texto distingue fato de opinião ao apresentar dados verificáveis e, em seguida, avaliá-los como insuficientes para explicar o fenômeno.', 'Certo', 'Dados verificáveis pertencem ao campo factual; a avaliação de suficiência constitui apreciação interpretativa.'],
    ['Texto de apoio: Quando se afirma que "a pesquisa reduziu o problema, mas não o eliminou", conclui-se corretamente que houve melhora parcial.', 'Certo', 'Reduzir sem eliminar indica avanço incompleto, isto é, melhora parcial.'],
    ['Texto de apoio: A frase "É evidente que a medida foi um sucesso" apresenta opinião, pois contém avaliação valorativa não demonstrada no próprio enunciado.', 'Certo', 'A expressão "é evidente" e o juízo de sucesso revelam avaliação, não fato comprovado no enunciado.'],
    ['Texto de apoio: Se o texto afirma que "apenas os projetos com documentação completa foram analisados", pressupõe-se que projetos sem documentação completa não foram analisados.', 'Certo', 'O advérbio "apenas" restringe o conjunto analisado aos projetos com documentação completa.'],
    ['Texto de apoio: O autor sustenta que políticas científicas devem ser avaliadas por seus efeitos sociais, e não apenas por valores executados. Com base no texto, julgue o item: A conclusão compatível é que execução orçamentária, isoladamente, não basta para medir o êxito da política.', 'Certo', 'A assertiva retoma a oposição entre efeitos sociais e mera execução de valores.'],
    ['Texto de apoio: A frase "os dados falam por si" deve ser compreendida literalmente, pois dados possuem capacidade autônoma de enunciação verbal.', 'Errado', 'Trata-se de expressão figurada que sugere evidência dos dados, não fala literal.'],
    ['Texto de apoio: Em "O programa, que atende municípios pequenos, será ampliado", a informação entre vírgulas permite inferir que o programa atende municípios pequenos, mas não restringe um programa entre outros.', 'Certo', 'A oração adjetiva explicativa acrescenta informação sobre o programa já identificado.'],
    ['Texto de apoio: A expressão "mais uma vez" em "Mais uma vez, o prazo foi prorrogado" pressupõe ocorrência anterior de prorrogação.', 'Certo', 'A locução pressupõe repetição do evento mencionado.'],
    ['Texto de apoio: Ao afirmar que "nem toda modernização representa inovação", o texto admite que algumas modernizações podem representar inovação.', 'Certo', 'A negação parcial não exclui todas as ocorrências; apenas afasta equivalência absoluta.'],
    ['Texto de apoio: A passagem "o gestor prometeu simplicidade; entregou um manual de duzentas páginas" sugere crítica irônica à complexidade do material.', 'Certo', 'O contraste entre promessa de simplicidade e manual extenso produz efeito crítico.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Interpretação de Texto] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Interpretação de texto - inferência, pressuposição e sentido'
  })),
  ...[
    ['Texto predominantemente narrativo caracteriza-se pela progressão de ações em sequência temporal, com personagens ou agentes envolvidos.', 'Certo', 'A narração organiza acontecimentos em desenvolvimento temporal.'],
    ['Texto descritivo tem como traço central a apresentação de características de seres, objetos, espaços ou situações.', 'Certo', 'A descrição privilegia atributos, estados e propriedades.'],
    ['Texto dissertativo-argumentativo busca defender ponto de vista por meio de razões, dados e relações lógicas.', 'Certo', 'A argumentação estrutura tese e justificativas.'],
    ['Texto injuntivo orienta o leitor a realizar ações, sendo comum em manuais, receitas, editais e instruções.', 'Certo', 'A injunção apresenta comandos, recomendações ou procedimentos.'],
    ['Texto expositivo tem como finalidade principal explicar ou informar sobre determinado tema, sem necessariamente defender tese polêmica.', 'Certo', 'A exposição organiza conceitos e explicações de modo didático.'],
    ['Uma sequência descritiva exige obrigatoriamente verbos no imperativo e ordenação de etapas.', 'Errado', 'Imperativos e etapas são típicos de textos injuntivos, não requisito da descrição.'],
    ['Em um edital, predominam sequências injuntivas quando o texto estabelece procedimentos, prazos e obrigações ao candidato.', 'Certo', 'Editais frequentemente orientam condutas e impõem regras de ação.'],
    ['A presença de opinião fundamentada e tentativa de convencimento indica traço argumentativo.', 'Certo', 'Argumentar é defender uma posição com fundamentos.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Tipologia Textual] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Tipologia textual'
  })),
  ...[
    ['As palavras "ciência", "necessário" e "relatório" são acentuadas por serem paroxítonas terminadas em ditongo.', 'Certo', 'Paroxítonas terminadas em ditongo oral são acentuadas na norma padrão.'],
    ['A palavra "ideia" mantém acento agudo obrigatório segundo o Acordo Ortográfico vigente.', 'Errado', 'O acordo eliminou o acento dos ditongos abertos ei e oi em paroxítonas, como ideia e assembleia.'],
    ['O vocábulo "órgão" recebe acento por apresentar ditongo nasal em palavra paroxítona.', 'Certo', 'A acentuação decorre da tonicidade e da terminação característica.'],
    ['A forma "anti-inflamatório" emprega hífen porque o prefixo termina por vogal igual à vogal inicial do segundo elemento.', 'Certo', 'Usa-se hífen quando o prefixo termina com a mesma vogal que inicia o segundo elemento.'],
    ['A grafia "autoescola" dispensa hífen porque o prefixo termina em vogal diferente da vogal inicial do segundo elemento.', 'Certo', 'Com vogais diferentes, em regra, os elementos se aglutinam sem hífen.'],
    ['A palavra "micro-ondas" é grafada com hífen segundo o Acordo Ortográfico.', 'Certo', 'O prefixo micro seguido de palavra iniciada por o mantém hífen.'],
    ['A forma "bem-vindo" é grafada sem hífen na norma padrão atual.', 'Errado', 'A grafia consagrada é bem-vindo, com hífen.'],
    ['A palavra "pôde", no pretérito perfeito, mantém acento diferencial para distinguir-se de "pode", no presente.', 'Certo', 'Esse acento diferencial permanece obrigatório.'],
    ['A forma verbal "têm" recebe acento diferencial quando o sujeito está no plural.', 'Certo', 'O acento circunflexo distingue a terceira pessoa do plural de "tem".'],
    ['A palavra "hífen" é acentuada por ser oxítona terminada em n.', 'Errado', 'Hífen é paroxítona terminada em n, caso que recebe acento.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Ortografia e Acentuação] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Ortografia, acentuação e hífen'
  })),
  ...[
    ['Em "os relatórios públicos foram divulgados", "relatórios" é substantivo e "públicos" é adjetivo.', 'Certo', 'Relatórios nomeia seres/coisas; públicos caracteriza o substantivo.'],
    ['Em "aquele edital será republicado", "aquele" exerce função de pronome demonstrativo.', 'Certo', 'O termo aponta para referente no discurso ou na situação comunicativa.'],
    ['Em "muito relevante", "muito" atua como advérbio intensificador do adjetivo "relevante".', 'Certo', 'Nesse contexto, muito modifica o grau do adjetivo.'],
    ['Em "o servidor e a pesquisadora compareceram", "e" é conjunção coordenativa aditiva.', 'Certo', 'O conectivo soma termos de mesma função.'],
    ['Em "precisamos de dados", "de" é artigo definido feminino.', 'Errado', '"De" é preposição.'],
    ['Em "as inscrições terminaram cedo", "as" é artigo definido que determina o substantivo "inscrições".', 'Certo', 'O artigo antecede e determina o nome.'],
    ['Em "dois pareceres foram emitidos", "dois" é numeral cardinal.', 'Certo', 'Indica quantidade exata.'],
    ['Em "infelizmente, o prazo expirou", "infelizmente" é advérbio que expressa avaliação do enunciador.', 'Certo', 'O advérbio modaliza a informação, revelando juízo.'],
    ['Em "se chover, a reunião será remota", "se" introduz condição.', 'Certo', 'A conjunção estabelece hipótese para a realização do fato principal.'],
    ['Em "fomento científico", o adjetivo "científico" flexiona-se em gênero e número para concordar com "fomento".', 'Certo', 'O adjetivo concorda com o substantivo a que se refere.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Classes de Palavras] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Classes de palavras'
  })),
  ...[
    ['Na frase "Os técnicos analisaram os documentos", a forma verbal está no pretérito perfeito do indicativo.', 'Certo', 'Analisaram indica ação concluída no passado.'],
    ['Em "Se o candidato entregar os documentos, será habilitado", a forma "entregar" está no futuro do subjuntivo.', 'Certo', 'Com "se" condicional, usa-se futuro do subjuntivo para hipótese futura.'],
    ['A forma "cumprisse" pertence ao presente do subjuntivo.', 'Errado', 'Cumprisse está no pretérito imperfeito do subjuntivo.'],
    ['Em "os relatórios devem ser publicados", há locução verbal formada por verbo auxiliar e verbo principal no infinitivo.', 'Certo', 'Devem ser publicados constitui encadeamento verbal com valor de obrigação/passiva.'],
    ['O modo imperativo é frequentemente usado em textos injuntivos para orientar ações do leitor.', 'Certo', 'Comandos e instruções recorrem ao imperativo.'],
    ['Em "havia muitos processos pendentes", o verbo haver, com sentido de existir, deve permanecer no singular.', 'Certo', 'Haver existencial é impessoal e fica na terceira pessoa do singular.'],
    ['Em "faz dez anos", o verbo fazer, indicando tempo decorrido, deve flexionar-se no plural.', 'Errado', 'Fazer temporal é impessoal e permanece no singular.'],
    ['Em "tinham sido avaliadas as propostas", a locução verbal expressa voz passiva analítica.', 'Certo', 'A estrutura combina auxiliar com particípio, tendo "propostas" como sujeito paciente.'],
    ['A forma "intervieram" é adequada para a terceira pessoa do plural do pretérito perfeito de "intervir".', 'Certo', 'Intervir conjuga-se como vir: eles intervieram.'],
    ['A forma "se ele propor" está correta no futuro do subjuntivo do verbo propor.', 'Errado', 'O correto é "se ele propuser", pois propor deriva de pôr.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Verbos] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Verbos, tempos, modos e locuções'
  })),
  ...[
    ['Em "o edital foi publicado, mas o sistema ficou instável", a segunda oração coordena-se à primeira com valor adversativo.', 'Certo', 'A conjunção "mas" estabelece contraste entre as orações.'],
    ['Em "estudei bastante, portanto fui aprovado", a conjunção "portanto" exprime conclusão.', 'Certo', 'O conectivo introduz consequência lógica do que foi afirmado antes.'],
    ['Em "o candidato não enviou os documentos nem justificou a ausência", há coordenação aditiva com valor negativo.', 'Certo', '"Nem" soma negativas.'],
    ['Em "quando o prazo terminou, o sistema foi bloqueado", a oração inicial é subordinada adverbial temporal.', 'Certo', 'A conjunção "quando" indica circunstância de tempo.'],
    ['Em "embora houvesse recursos, o projeto não foi executado", a oração subordinada expressa concessão.', 'Certo', '"Embora" introduz fato que não impede o acontecimento principal.'],
    ['Em "o relatório que foi entregue ontem será revisado", a oração iniciada por "que" restringe o sentido de "relatório".', 'Certo', 'Sem vírgulas, a oração adjetiva é restritiva.'],
    ['Orações coordenadas dependem sintaticamente de uma oração principal.', 'Errado', 'Orações coordenadas são sintaticamente independentes entre si.'],
    ['Em "é necessário que todos compareçam", a oração "que todos compareçam" exerce função substantiva.', 'Certo', 'A oração funciona como sujeito da expressão "é necessário".'],
    ['A conjunção "porque" pode introduzir oração subordinada adverbial causal.', 'Certo', 'Em muitos contextos, "porque" indica causa ou explicação.'],
    ['Em "trabalhou tanto que adoeceu", a segunda oração expressa consequência.', 'Certo', 'A estrutura intensiva "tanto que" produz valor consecutivo.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Coordenação e Subordinação] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Período composto'
  })),
  ...[
    ['Em "existem razões técnicas para a decisão", o verbo concorda corretamente com o sujeito plural "razões técnicas".', 'Certo', 'O verbo existir é pessoal e concorda com o sujeito.'],
    ['Em "há razões técnicas para a decisão", o verbo deveria flexionar-se no plural.', 'Errado', 'Haver existencial é impessoal e permanece no singular.'],
    ['Em "fui eu que redigi o parecer", a concordância do verbo "redigi" com "eu" está correta.', 'Certo', 'Com "fui eu que", o verbo pode concordar com o antecedente do relativo.'],
    ['Em "mais de um pesquisador participou da reunião", o verbo no singular está correto.', 'Certo', 'Com "mais de um", em regra, o verbo fica no singular.'],
    ['Em "anexas seguem as certidões", o adjetivo "anexas" concorda com "certidões".', 'Certo', 'Anexo, como adjetivo, concorda em gênero e número com o substantivo.'],
    ['Em "é proibido entrada sem identificação", a concordância nominal está correta, pois "entrada" aparece sem artigo.', 'Certo', 'Sem determinante, a expressão pode ficar no masculino singular: é proibido entrada.'],
    ['Em "é proibida a entrada sem identificação", a forma feminina está correta pela presença do artigo "a".', 'Certo', 'Com determinante feminino, o adjetivo concorda com o substantivo.'],
    ['Em "os documentos seguem incluso", a concordância nominal está correta.', 'Errado', 'O correto é "inclusos", concordando com "documentos".'],
    ['Em "um e outro servidor compareceram", admite-se concordância no plural.', 'Certo', 'Com a expressão "um e outro", o verbo pode ir ao plural.'],
    ['Em "metade dos candidatos compareceu", a concordância no singular é possível porque o núcleo é "metade".', 'Certo', 'Expressões partitivas podem concordar com o núcleo ou com o especificador, conforme o caso.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Concordância] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Concordância verbal e nominal'
  })),
  ...[
    ['Em "não se divulgaram os resultados", a próclise é motivada pela palavra negativa "não".', 'Certo', 'Palavras negativas atraem o pronome átono para antes do verbo.'],
    ['Em "jamais lhe entregariam o documento", a colocação pronominal está correta pela presença de palavra negativa.', 'Certo', '"Jamais" é fator de próclise.'],
    ['Em início absoluto de período, recomenda-se a próclise em "Me entregaram o relatório".', 'Errado', 'Na norma padrão formal, não se inicia período com pronome oblíquo átono.'],
    ['Em "entregaram-me o relatório", a ênclise está adequada em início de período sem fator de atração.', 'Certo', 'Na ausência de atrator, a ênclise é a colocação esperada no padrão formal.'],
    ['Em "dar-se-á publicidade ao resultado", ocorre mesóclise, compatível com futuro do presente sem fator de próclise.', 'Certo', 'A mesóclise pode ocorrer com futuro do presente ou do pretérito em registro formal.'],
    ['Em "não dar-se-á publicidade ao resultado", a mesóclise é obrigatória apesar do advérbio negativo.', 'Errado', 'O advérbio negativo atrai o pronome: "não se dará".'],
    ['Em "que se apresentem os documentos", o pronome está em próclise devido ao pronome relativo ou conjunção integrante "que".', 'Certo', '"Que" costuma atuar como fator de atração.'],
    ['Em locuções verbais, a colocação pronominal pode variar conforme fatores de atração e forma verbal envolvida.', 'Certo', 'A norma admite diferentes posições em locuções, desde que respeitados atratores e restrições formais.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Colocação Pronominal] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Próclise, ênclise e mesóclise'
  })),
  ...[
    ['No contexto "o parecer foi claro", "claro" pode significar compreensível, evidenciando polissemia do vocábulo.', 'Certo', 'A palavra claro pode indicar luminosidade, cor ou compreensão, conforme o contexto.'],
    ['As palavras "deferir" e "indeferir" são sinônimas perfeitas.', 'Errado', 'Deferir é atender ou conceder; indeferir é negar.'],
    ['Em "raiz do problema", a palavra "raiz" foi empregada em sentido conotativo.', 'Certo', 'Não se trata de raiz vegetal, mas de causa ou origem.'],
    ['Em "a ponte sobre o rio foi interditada", "ponte" está em sentido denotativo.', 'Certo', 'O termo designa estrutura física real.'],
    ['Ambiguidade ocorre quando uma construção permite mais de uma interpretação plausível.', 'Certo', 'A duplicidade de sentido pode resultar de posição de termos, pronomes ou estrutura sintática.'],
    ['Em "vi o servidor com o binóculo", há possível ambiguidade quanto a quem estava com o binóculo.', 'Certo', 'A expressão pode indicar instrumento usado por quem viu ou objeto portado pelo servidor.'],
    ['"Ratificar" significa corrigir, ao passo que "retificar" significa confirmar.', 'Errado', 'É o inverso: ratificar é confirmar; retificar é corrigir.'],
    ['"Eminente" e "iminente" são parônimos, mas não sinônimos.', 'Certo', 'Eminente é ilustre/elevado; iminente é prestes a ocorrer.'],
    ['Antônimo é palavra de sentido oposto ou contrastante em relação a outra.', 'Certo', 'Oposição semântica caracteriza antonímia.'],
    ['Sinonímia contextual depende do uso no texto, não sendo sempre perfeita entre palavras isoladas.', 'Certo', 'Poucos sinônimos são absolutos; o contexto define adequação.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - Significação das Palavras] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Semântica e significação'
  }))
];

const buildPortugueseDrillQuestions = (): Omit<Question, 'id'>[] => {
  const make = (
    topic: string,
    statements: Array<[string, 'Certo' | 'Errado', string]>
  ): Omit<Question, 'id'>[] => statements.map(([statement, correct, explanation], index) => ({
    category: 'Português' as QuestionCategory,
    text: `[CEBRASPE - ${topic}] Item PT-${topic.replace(/[^A-Za-zÀ-ÿ0-9]/g, '')}-${index + 1}: ${statement}`,
    correct,
    explanation,
    reference: `Língua Portuguesa - ${topic}`
  }));

  return [
    ...make('Interpretação de Texto', [
      ['Texto de apoio: O gestor que divulga dados sem explicar sua origem transforma transparência em ruído. Julgue: o texto permite inferir que a qualidade da informação pública depende também de contextualização.', 'Certo', 'A expressão "transparência em ruído" indica que divulgar dados sem explicação pode dificultar, e não facilitar, a compreensão.'],
      ['Texto de apoio: A política foi anunciada como definitiva, mas o próprio relatório admitia que os testes ainda eram preliminares. Julgue: há contraste entre o anúncio oficial e a cautela expressa no relatório.', 'Certo', 'A conjunção "mas" contrapõe a ideia de definição à de preliminaridade dos testes.'],
      ['Texto de apoio: Ninguém questionou a importância da pesquisa; questionou-se apenas a falta de critérios para distribuir os recursos. Julgue: o texto nega a relevância da pesquisa científica.', 'Errado', 'O enunciado afirma expressamente que a importância da pesquisa não foi questionada.'],
      ['Texto de apoio: O aplicativo prometia simplificar o atendimento; depois dele, o usuário precisava de três senhas para pedir uma senha nova. Julgue: há ironia na apresentação do resultado da suposta simplificação.', 'Certo', 'A complexidade descrita contradiz a promessa de simplificação, produzindo efeito irônico.'],
      ['Texto de apoio: A autora distingue acesso formal à informação de acesso efetivo ao conhecimento. Julgue: para a autora, publicar informação e garantir compreensão são ações equivalentes.', 'Errado', 'A distinção entre acesso formal e efetivo afasta a equivalência entre publicar e fazer compreender.'],
      ['Texto de apoio: O parecer não rejeitou o projeto; recomendou sua revisão. Julgue: conclui-se corretamente que o projeto ainda poderia ser reapresentado ou ajustado.', 'Certo', 'A recomendação de revisão indica possibilidade de ajuste, não rejeição definitiva.'],
      ['Texto de apoio: O índice cresceu 2% no trimestre. Julgue: essa afirmação, isoladamente, constitui fato verificável, não opinião.', 'Certo', 'O enunciado apresenta dado mensurável passível de verificação.'],
      ['Texto de apoio: A medida foi "brilhante", segundo o colunista. Julgue: o termo entre aspas expressa avaliação subjetiva.', 'Certo', '"Brilhante" contém juízo de valor.'],
      ['Texto de apoio: Apenas os candidatos inscritos até sexta-feira receberam confirmação. Julgue: pressupõe-se que candidatos inscritos após sexta-feira não receberam confirmação.', 'Certo', '"Apenas" restringe o grupo beneficiado pela confirmação.'],
      ['Texto de apoio: Ainda que os números pareçam positivos, o texto recomenda cautela. Julgue: a oração concessiva relativiza a leitura otimista dos números.', 'Certo', '"Ainda que" introduz ressalva à interpretação positiva.'],
      ['Texto de apoio: A expressão "não é pouca coisa" reforça, por lítotes, a relevância do fato mencionado.', 'Certo', 'A negação do contrário é recurso expressivo que intensifica a avaliação positiva.'],
      ['Texto de apoio: O relatório afirma que a queda foi temporária. Julgue: é correto concluir que a queda foi permanente.', 'Errado', 'Temporário e permanente têm sentidos opostos.'],
      ['Texto de apoio: A frase "o silêncio da instituição disse muito" deve ser interpretada literalmente.', 'Errado', 'Trata-se de construção figurada: o silêncio é interpretado como sinal comunicativo.'],
      ['Texto de apoio: Quando o texto afirma que a solução "não resolve tudo", admite-se que ela pode resolver parte do problema.', 'Certo', 'A negação total da suficiência não impede efeito parcial.'],
      ['Texto de apoio: A ideia central de um parágrafo é necessariamente sua primeira frase.', 'Errado', 'Embora frequente, a ideia central pode aparecer em outras posições ou ser inferida do conjunto.'],
      ['Texto de apoio: O trecho "o dado bruto informa pouco quando separado de método e contexto" valoriza a interpretação metodologicamente orientada.', 'Certo', 'O enunciado condiciona a utilidade do dado ao método e ao contexto.'],
      ['Texto de apoio: Ao comparar o portal a um "labirinto", o autor sugere dificuldade de navegação.', 'Certo', 'A metáfora associa o portal a desorientação e percurso difícil.'],
      ['Texto de apoio: O texto afirma que a crítica ao programa partiu de usuários e gestores. Julgue: é incorreto atribuir a crítica apenas aos usuários.', 'Certo', 'A informação menciona dois grupos; restringi-la a um deles altera o sentido.'],
      ['Texto de apoio: A conclusão de um texto deve decorrer de suas premissas, sob pena de extrapolação interpretativa.', 'Certo', 'A CEBRASPE costuma cobrar justamente a compatibilidade entre conclusão e informações textuais.'],
      ['Texto de apoio: Em textos argumentativos, opinião pode aparecer sustentada por fatos, dados ou exemplos.', 'Certo', 'Argumentar envolve articular ponto de vista a fundamentos.']
    ]),
    ...make('Tipologia Textual', [
      ['Uma ata pode combinar exposição de decisões com sequência narrativa dos fatos ocorridos em reunião.', 'Certo', 'Textos concretos frequentemente misturam sequências tipológicas.'],
      ['A predominância de verbos de ação em sequência temporal favorece a caracterização narrativa.', 'Certo', 'A progressão de ações é marca de narração.'],
      ['A descrição privilegia a progressão argumentativa de tese, argumentos e conclusão.', 'Errado', 'Tese, argumentos e conclusão são traços da dissertação argumentativa.'],
      ['Instruções de inscrição em edital tendem a apresentar sequência injuntiva.', 'Certo', 'O texto orienta condutas do leitor/candidato.'],
      ['Texto expositivo pode explicar o funcionamento de uma política pública sem defender opinião específica.', 'Certo', 'A exposição organiza informações para esclarecer determinado tema.'],
      ['A dissertação expositiva e a argumentativa são idênticas quanto à finalidade persuasiva.', 'Errado', 'A expositiva explica; a argumentativa procura convencer.'],
      ['Uma receita culinária é exemplo clássico de texto injuntivo.', 'Certo', 'Receitas instruem ações em sequência.'],
      ['Um relatório técnico pode conter trechos descritivos, expositivos e argumentativos.', 'Certo', 'Relatórios costumam descrever dados, explicar métodos e justificar conclusões.'],
      ['A presença de personagens e conflito é incompatível com narração.', 'Errado', 'Personagens e conflito são comuns em textos narrativos.'],
      ['A tipologia textual deve ser identificada pela função predominante, e não por uma palavra isolada.', 'Certo', 'A classificação depende do funcionamento global ou predominante do trecho.']
    ]),
    ...make('Ortografia', [
      ['"Assembleia" perdeu o acento gráfico no Acordo Ortográfico vigente.', 'Certo', 'Paroxítonas com ditongo aberto ei/oi deixaram de ser acentuadas.'],
      ['"Herói" permanece acentuada por ser oxítona com ditongo aberto.', 'Certo', 'A perda do acento atingiu paroxítonas, não oxítonas como herói.'],
      ['"Feiura" é grafada sem acento segundo a norma atual.', 'Certo', 'O acordo eliminou o acento de i/u tônicos após ditongo em paroxítonas.'],
      ['"Saúde" perdeu o acento por conter hiato.', 'Errado', 'Saúde mantém acento no u tônico em hiato.'],
      ['"Antiético" é grafado sem hífen, com duplicação desnecessária de vogal.', 'Errado', 'A forma adequada é antiético, sem hífen e sem duplicação da vogal.'],
      ['"Contra-ataque" é grafado com hífen porque o prefixo termina em a e o segundo elemento começa por a.', 'Certo', 'Vogais iguais na junção prefixal exigem hífen.'],
      ['"Inter-regional" leva hífen porque o segundo elemento começa por r.', 'Certo', 'Com prefixos terminados em r, conserva-se hífen antes de r.'],
      ['"Semianalfabeto" é grafado sem hífen.', 'Certo', 'Com prefixo semi seguido de vogal diferente, em regra não há hífen.'],
      ['"Pré-escolar" mantém hífen por envolver prefixo tônico acentuado.', 'Certo', 'Prefixos como pré, pós e pró, quando tônicos, costumam manter hífen.'],
      ['"Paraquedas" é grafia aceita sem hífen.', 'Certo', 'O Acordo Ortográfico consagrou a forma aglutinada para paraquedas e derivados.']
    ]),
    ...make('Classes de Palavras', [
      ['Em "esta decisão", "esta" é pronome demonstrativo.', 'Certo', 'O termo situa o referente no discurso ou no espaço comunicativo.'],
      ['Em "alguns candidatos recorreram", "alguns" é pronome indefinido.', 'Certo', 'Indica quantidade imprecisa.'],
      ['Em "o porquê da decisão", "porquê" funciona como substantivo.', 'Certo', 'Vem determinado por artigo e equivale a motivo.'],
      ['Em "porque choveu, a sessão foi remarcada", "porque" é conjunção causal.', 'Certo', 'Introduz causa para a remarcação.'],
      ['Em "aonde o servidor foi?", o emprego de "aonde" pressupõe ideia de movimento.', 'Certo', 'Aonde combina preposição a com onde e indica destino.'],
      ['Em "onde consta o edital", "onde" retoma adequadamente um documento abstrato em qualquer contexto formal.', 'Errado', 'Onde deve referir-se preferencialmente a lugar físico; em muitos contextos formais, usa-se "em que".'],
      ['Em "menos pessoas compareceram", "menos" é invariável.', 'Certo', 'Não existe flexão "menas" na norma padrão.'],
      ['Em "bastantes documentos foram anexados", "bastantes" pode funcionar como pronome indefinido variável.', 'Certo', 'Com sentido de muitos, varia no plural.'],
      ['Em "os documentos chegaram bastante tarde", "bastante" é advérbio invariável.', 'Certo', 'Modifica o advérbio "tarde" e não se flexiona.'],
      ['Em "meio cansada", "meio" é advérbio e permanece invariável.', 'Certo', 'Com sentido de um pouco, meio não concorda com o adjetivo.']
    ]),
    ...make('Verbos', [
      ['"Se eles mantiverem a decisão" apresenta forma correta do futuro do subjuntivo de manter.', 'Certo', 'Manter segue o paradigma de ter: se eles mantiverem.'],
      ['"Quando ele intervir" é forma correta do futuro do subjuntivo de intervir.', 'Errado', 'Na norma culta, o futuro do subjuntivo de intervir é "intervier", pois o verbo segue o paradigma de vir.'],
      ['"Quando ele intervier" é forma adequada do futuro do subjuntivo de intervir.', 'Certo', 'Intervir conjuga-se como vir: quando ele vier/intervier.'],
      ['"Se a comissão revir os documentos" está correto para o futuro do subjuntivo de rever.', 'Certo', 'Rever segue ver: se vir, se revir.'],
      ['"Eles provêm de instituições distintas" está correto quando o sujeito é plural.', 'Certo', 'O acento diferencia a terceira pessoa plural de provir.'],
      ['"Ele provém de instituição pública" está correto no singular.', 'Certo', 'No singular, usa-se provém.'],
      ['"Eles veem os dados" perdeu o acento circunflexo no Acordo Ortográfico.', 'Certo', 'A forma plural de ver no presente é veem, sem acento.'],
      ['"Crêem" é grafia atual correta.', 'Errado', 'A forma atual é creem, sem acento.'],
      ['"Houve problemas" deve permanecer no singular, pois haver tem sentido de existir.', 'Certo', 'Haver existencial é impessoal.'],
      ['"Devem haver problemas" está correto na norma padrão.', 'Errado', 'Em locução com haver impessoal, o auxiliar fica no singular: deve haver.']
    ]),
    ...make('Coordenação e Subordinação', [
      ['A conjunção "todavia" introduz coordenação adversativa.', 'Certo', 'Todavia expressa oposição ou contraste.'],
      ['A conjunção "logo" pode introduzir conclusão.', 'Certo', 'Em valor conclusivo, equivale a portanto.'],
      ['A conjunção "ou" jamais pode ter valor de inclusão.', 'Errado', 'Dependendo do contexto, "ou" pode ser inclusivo ou alternativo exclusivo.'],
      ['Orações subordinadas substantivas podem exercer função de sujeito, objeto direto ou complemento nominal.', 'Certo', 'Elas desempenham funções próprias de substantivos.'],
      ['Orações adverbiais causais e concessivas exprimem a mesma relação semântica.', 'Errado', 'Causa indica motivo; concessão indica oposição insuficiente para impedir o fato principal.'],
      ['Em "caso haja recurso, o prazo será reaberto", a oração inicial tem valor condicional.', 'Certo', 'Caso introduz hipótese.'],
      ['Em "conforme informou a banca", a oração tem valor conformativo.', 'Certo', 'Conforme indica conformidade com uma fonte ou parâmetro.'],
      ['Em "para que todos compreendam", há ideia de finalidade.', 'Certo', 'Para que introduz objetivo.'],
      ['O pronome relativo "cujo" estabelece relação de posse e não admite artigo posposto.', 'Certo', 'A construção "cujo o" é inadequada na norma padrão.'],
      ['Orações adjetivas explicativas são isoladas por vírgulas.', 'Certo', 'As vírgulas marcam caráter explicativo/acessório.']
    ]),
    ...make('Concordância', [
      ['"Aluga-se salas" está correto quando "salas" é sujeito paciente plural.', 'Errado', 'Com partícula apassivadora, o verbo concorda: alugam-se salas.'],
      ['"Precisa-se de servidores" está correto, pois o se funciona como índice de indeterminação do sujeito.', 'Certo', 'Com verbo transitivo indireto, o verbo fica no singular.'],
      ['"Vende-se equipamentos" deve ser corrigido para "vendem-se equipamentos".', 'Certo', 'Equipamentos é sujeito paciente plural.'],
      ['"Tratam-se de medidas urgentes" está correto.', 'Errado', 'Com tratar-se de, o verbo fica no singular: trata-se de medidas.'],
      ['"A maioria dos candidatos compareceu" é concordância possível.', 'Certo', 'Com expressão partitiva, pode-se concordar com o núcleo singular.'],
      ['"A maioria dos candidatos compareceram" também pode ocorrer por concordância atrativa com o especificador plural.', 'Certo', 'A concordância com o termo plural é aceita em muitos casos partitivos.'],
      ['"Fomos nós quem elaboramos o relatório" é construção possível.', 'Certo', 'Com quem, admite-se concordância com o antecedente em certos contextos.'],
      ['"Fomos nós que elaboramos o relatório" está correto.', 'Certo', 'Com que, o verbo concorda com o antecedente.'],
      ['"É necessário paciência" está correto sem determinante antes de paciência.', 'Certo', 'Sem artigo, a expressão pode ficar no masculino singular.'],
      ['"É necessária a paciência" está correto com artigo feminino.', 'Certo', 'Com determinante, há concordância com o substantivo.']
    ]),
    ...make('Colocação Pronominal', [
      ['Em "sempre se exigiu transparência", a próclise é favorecida pelo advérbio "sempre".', 'Certo', 'Advérbios podem atrair o pronome átono.'],
      ['Em "talvez se publique o resultado", a próclise decorre de palavra de valor dubitativo.', 'Certo', 'Talvez é fator de atração.'],
      ['Em "publicar-se-ia o edital", há mesóclise com futuro do pretérito.', 'Certo', 'A mesóclise é compatível com futuro do presente e futuro do pretérito em registro formal.'],
      ['Em "não publicar-se-ia o edital", a mesóclise é adequada apesar da negação.', 'Errado', 'A palavra negativa exige próclise: não se publicaria.'],
      ['Em "os dados que se divulgaram", o relativo "que" atrai o pronome.', 'Certo', 'Pronomes relativos favorecem próclise.'],
      ['Em "entregar-lhe-ei o documento", há mesóclise.', 'Certo', 'O pronome fica intercalado ao verbo no futuro.'],
      ['Em "lhe entreguei o documento" no início absoluto de período, a colocação é a preferida na norma formal escrita.', 'Errado', 'A norma formal evita iniciar período com pronome oblíquo átono.'],
      ['Em "entreguei-lhe o documento", a ênclise é adequada sem fator atrativo.', 'Certo', 'A ênclise é padrão em início de período sem atrator.'],
      ['Em "ninguém lhe respondeu", a próclise é obrigatória pela palavra negativa.', 'Certo', 'Ninguém atrai o pronome.'],
      ['Em "quem se responsabilizará?", a próclise é favorecida por pronome interrogativo.', 'Certo', 'Pronomes interrogativos atuam como atratores.']
    ]),
    ...make('Significação das Palavras', [
      ['"Cessão", "sessão" e "seção" são homófonas em muitas variedades, mas têm sentidos distintos.', 'Certo', 'Cessão é ato de ceder; sessão é reunião; seção é divisão.'],
      ['"Descrição" e "discrição" são parônimos com sentidos diferentes.', 'Certo', 'Descrição é ato de descrever; discrição é reserva.'],
      ['"Mandado" e "mandato" são sinônimos perfeitos.', 'Errado', 'Mandado é ordem judicial; mandato é delegação de poderes ou período de exercício.'],
      ['"Comprimento" e "cumprimento" têm significados distintos.', 'Certo', 'Comprimento é extensão; cumprimento é saudação ou execução.'],
      ['Em "o projeto naufragou", o verbo está em sentido conotativo quando não há referência literal a embarcação.', 'Certo', 'Naufragar pode significar fracassar.'],
      ['Em "a luz da sala falhou", "luz" foi empregada em sentido denotativo.', 'Certo', 'Refere-se a iluminação real.'],
      ['Em "à luz da Constituição", "luz" tem sentido figurado de orientação ou perspectiva.', 'Certo', 'A expressão indica critério interpretativo.'],
      ['"Vultoso" significa volumoso; "vultuoso" relaciona-se a inchaço na face.', 'Certo', 'São parônimos frequentemente cobrados.'],
      ['"Flagrante" e "fragrante" são equivalentes semânticos.', 'Errado', 'Flagrante é evidente ou no ato; fragrante refere-se a aroma.'],
      ['Ambiguidade pode ser recurso expressivo ou defeito de clareza, conforme o contexto.', 'Certo', 'Em textos objetivos, tende a ser problema; na literatura ou humor, pode ser intencional.']
    ])
  ];
};

// Templates for Português (20 dynamic templates)
const ptTemplates = [
  {
    text: "Na oração '{sentenca}', o emprego da vírgula logo após o termo '{termo}' justifica-se pela necessidade de isolar adjunto adverbial de grande extensão antecedente.",
    correct: "Certo",
    explanation: "Correto. O adjunto adverbial antecedente de longa extensão ('{termo}') deve vir isolado por vírgulas, conforme as regras gramaticais adotadas pela banca CEBRASPE.",
    reference: "Sintaxe da Oração"
  },
  {
    text: "No período '{sentenca}', a substituição da conjunção '{conjuncao}' por '{substituto}' manteria a correção gramatical e o sentido original do texto.",
    correct: "Errado",
    explanation: "Incorreto. A conjunção '{conjuncao}' expressa uma relação de {valor1}, enquanto '{substituto}' expressa uma relação de {valor2}. A troca altera substancialmente o sentido original.",
    reference: "Conjunções e Coesão"
  },
  {
    text: "Mantendo-se a correção gramatical do texto, a expressão '{expressao}' poderia ser substituída por '{sub_expressao}' na linha {linha} sem alterar o sentido do texto.",
    correct: "Certo",
    explanation: "Correto. Trata-se de uma sinonímia adequada no contexto, onde ambas as expressões exercem o papel de {papel} sem causar prejuízos sintáticos ou semânticos.",
    reference: "Coesão e Reescrita"
  },
  {
    text: "No trecho '{sentenca}', o sinal indicativo de crase em '{crase}' é facultativo, de modo que a sua supressão não afetaria a correção gramatical do período.",
    correct: "Errado",
    explanation: "Incorreto. A regência do verbo exige a preposição 'a', e o termo seguinte é precedido de artigo feminino singular definido, tornando a crase obrigatória.",
    reference: "Emprego da Crase"
  },
  {
    text: "O pronome '{pronome}' em '{sentenca}' refere-se anaforicamente ao substantivo '{referente}', exercendo função de coesão referencial por substituição.",
    correct: "Certo",
    explanation: "Correto. O pronome '{pronome}' retoma o antecedente '{referente}' de forma a evitar repetição desnecessária, mantendo a clareza e fluidez do texto.",
    reference: "Coesão Referencial"
  },
  {
    text: "A concordância verbal estabelecida em '{sentenca}' é considerada facultativa, pois o sujeito composto está posposto ao verbo.",
    correct: "Certo",
    explanation: "Correto. Quando o sujeito composto vem posposto ao verbo, a concordância pode ser feita com o elemento mais próximo ou no plural com todos os elementos.",
    reference: "Concordância Verbal"
  },
  {
    text: "No trecho '{sentenca}', a supressão do termo '{conjuncao}' comprometeria a correção gramatical, posto que o termo seguinte rege a referida preposição.",
    correct: "Errado",
    explanation: "Incorreto. O termo '{conjuncao}' atua como conectivo coordenativo e sua supressão ou substituição por pontuação adequada mantém a correção.",
    reference: "Coesão Textual"
  },
  {
    text: "O emprego do verbo haver em '{sentenca}' justifica-se por sua impessoalidade, sendo incorreta sua flexão no plural mesmo que o objeto seja plural.",
    correct: "Certo",
    explanation: "Correto. O verbo haver com sentido de existir é impessoal e deve permanecer na terceira pessoa do singular.",
    reference: "Verbos Impessoais"
  },
  {
    text: "A oração adjetiva introduzida por '{pronome}' em '{sentenca}' possui caráter explicativo, de modo que a retirada das vírgulas alteraria o sentido original do trecho.",
    correct: "Certo",
    explanation: "Correto. As vírgulas delimitam a oração adjetiva explicativa. Sua supressão a transformaria em restritiva, alterando semanticamente o período.",
    reference: "Orações Adjetivas"
  },
  {
    text: "No período '{sentenca}', ocorre próclise obrigatória do pronome átono em razão da presença de palavra com sentido negativo antecedente.",
    correct: "Certo",
    explanation: "Correto. Palavras negativas são fatores de atração obrigatórios para o pronome átono, justificando o uso da próclise.",
    reference: "Colocação Pronominal"
  }
];

// Templates for TI Básica (15 templates)
const tiTemplates = [
  {
    text: "No modelo de nuvem {modelo}, o provedor de serviços gerencia a infraestrutura física, mas o cliente retém o controle absoluto sobre as aplicações e os bancos de dados configurados.",
    correct: "Certo",
    explanation: "Correto. No modelo de infraestrutura ou plataforma, as responsabilidades físicas e virtuais são divididas conforme o nível de serviço contratado.",
    reference: "Computação em Nuvem"
  },
  {
    text: "O protocolo {protocolo}, que opera na camada de {camada} do modelo TCP/IP, é caracterizado por ser um protocolo {caracteristica}.",
    correct: "Certo",
    explanation: "Correto. O protocolo {protocolo} pertence à camada de {camada} e possui como comportamento padrão ser {caracteristica}.",
    reference: "Protocolos de Redes"
  },
  {
    text: "A técnica de criptografia {criptografia} utiliza uma única chave privada compartilhada entre o remetente e o destinatário para codificar e decodificar a mensagem.",
    correct: "Certo",
    explanation: "Correto. A criptografia simétrica ({criptografia}) baseia-se em uma chave secreta compartilhada para cifragem eficiente.",
    reference: "Segurança da Informação"
  },
  {
    text: "No backup do tipo {modelo_backup}, apenas os arquivos que foram modificados desde o último backup completo ou incremental são copiados, marcando os arquivos como salvos.",
    correct: "Certo",
    explanation: "Correto. O backup incremental copia apenas as alterações desde o último backup de qualquer tipo e zera o bit de arquivo.",
    reference: "Sistemas de Backup"
  },
  {
    text: "O software malicioso do tipo {malware} é projetado para bloquear o acesso a arquivos do sistema por meio de criptografia, exigindo um pagamento de resgate para a liberação.",
    correct: "Certo",
    explanation: "Correto. O ransomware age criptografando dados cruciais do usuário e cobrando resgates, geralmente em criptomoedas.",
    reference: "Segurança e Malwares"
  },
  {
    text: "A tecnologia {tecnologia_rede} permite criar uma rede privada virtual estendida sobre uma rede pública, viabilizando o tráfego de dados criptografados em um túnel seguro.",
    correct: "Certo",
    explanation: "Correto. Uma VPN (Virtual Private Network) encapsula e criptografa dados para garantir a confidencialidade em redes públicas.",
    reference: "Segurança de Redes"
  },
  {
    text: "No que concerne ao modelo de referência OSI, a camada física é responsável pelo endereçamento lógico e roteamento dos pacotes através dos nós da rede.",
    correct: "Errado",
    explanation: "Incorreto. O roteamento e endereçamento lógico são atribuições da camada de Rede (Camada 3), enquanto a camada física cuida da transmissão de bits brutos.",
    reference: "Modelos OSI e TCP/IP"
  },
  {
    text: "O protocolo HTTPS utiliza criptografia por meio do protocolo SSL/TLS para garantir a confidencialidade e integridade da comunicação na porta {porta_rede}.",
    correct: "Certo",
    explanation: "Correto. O HTTPS opera por padrão na porta TCP 443, garantindo transporte seguro dos dados trafegados no navegador.",
    reference: "Protocolos de Aplicação"
  },
  {
    text: "A engenharia social chamada {malware} consiste em simular comunicações legítimas para induzir os usuários a fornecer credenciais confidenciais ou dados bancários.",
    correct: "Certo",
    explanation: "Correto. O Phishing utiliza e-mails, SMS ou sites falsos idênticos aos reais para roubar informações de usuários desatentos.",
    reference: "Segurança da Informação"
  },
  {
    text: "Em redes Wi-Fi, o padrão de segurança {criptografia} é considerado obsoleto e vulnerável a ataques de quebra de chaves por força bruta em poucos minutos.",
    correct: "Certo",
    explanation: "Correto. O padrão WEP (Wired Equivalent Privacy) é antigo, vulnerável e considerado altamente inseguro para redes sem fio atuais.",
    reference: "Segurança Wi-Fi"
  }
];

// Templates for Conhecimentos Específicos TI (20 templates)
const espTemplates = [
  {
    text: "Na esteira de CI/CD do {ferramenta}, a etapa de {etapa} garante que os deploys sejam efetuados de forma segura utilizando {tecnologia} para isolamento de microsserviços.",
    correct: "Certo",
    explanation: "Correto. O {ferramenta} emprega {tecnologia} para empacotar dependências, garantindo reprodutibilidade e isolamento estrito de microsserviços na esteira de entrega contínua.",
    reference: "DevOps e Integração Contínua"
  },
  {
    text: "Em bancos de dados relacionais, o conceito de {conceito} garante que as transações sigam o princípio ACID, especificamente a propriedade de {propriedade}.",
    correct: "Certo",
    explanation: "Correto. {conceito} é fundamental para assegurar a {propriedade}, mantendo o estado do banco de dados íntegro mesmo após falhas catastróficas ou acessos concorrentes.",
    reference: "Modelagem de Bancos de Dados"
  },
  {
    text: "Segundo a recomendação do OWASP Top 10, a vulnerabilidade de '{vulnerabilidade}' pode ser mitigada com eficiência por meio de '{mitigacao}'.",
    correct: "Certo",
    explanation: "Correto. O OWASP indica que a validação, sanitização e o uso de consultas parametrizadas são as formas mais eficientes de combater a vulnerabilidade de '{vulnerabilidade}'.",
    reference: "Segurança OWASP"
  },
  {
    text: "No desenvolvimento orientado a objetos, o princípio SOLID '{conceito}' defende que uma classe deve ser aberta para extensão, mas fechada para modificação.",
    correct: "Certo",
    explanation: "Correto. O Open/Closed Principle (OCP) garante que o comportamento de um módulo possa ser estendido sem alterar seu código-fonte original.",
    reference: "Princípios SOLID"
  },
  {
    text: "Bancos de dados NoSQL do tipo {modelo_backup} (ex: Redis) utilizam o armazenamento em memória primária para viabilizar acessos com baixíssima latência (sub-milissegundos).",
    correct: "Certo",
    explanation: "Correto. Os bancos de dados em memória ou chave-valor como o Redis priorizam velocidade de acesso mantendo estruturas em RAM.",
    reference: "Bancos de Dados NoSQL"
  },
  {
    text: "Na arquitetura de microsserviços, o padrão API Gateway centraliza os pontos de entrada das requisições externas, cuidando do roteamento, autenticação e limitação de taxa.",
    correct: "Certo",
    explanation: "Correto. O API Gateway atua como fachada para a arquitetura de microsserviços, abstraindo a complexidade de rotas dos clientes.",
    reference: "Arquitetura de Sistemas"
  },
  {
    text: "No sistema de controle de versão Git, o comando 'git merge' reescreve o histórico de commits movendo a base do ramo atual para a ponta do ramo alvo.",
    correct: "Errado",
    explanation: "Incorreto. Quem reescreve o histórico aplicando commits linearmente é o 'git rebase'. O 'git merge' cria um commit de mesclagem mantendo o histórico de ramificação original intacto.",
    reference: "Controle de Versão Git"
  },
  {
    text: "Em APIs RESTful, os métodos GET e POST são considerados idempotentes, o que significa que múltiplas requisições idênticas produzirão exatamente o mesmo efeito no servidor.",
    correct: "Errado",
    explanation: "Incorreto. Apenas GET, PUT e DELETE são idempotentes. O método POST não é idempotente, pois múltiplas requisições POST idênticas criarão múltiplos recursos no servidor.",
    reference: "Protocolo HTTP e REST"
  },
  {
    text: "O padrão de projeto GoF '{conceito}' garante que uma classe possua apenas uma única instância em todo o ciclo de vida da aplicação, fornecendo um ponto global de acesso.",
    correct: "Certo",
    explanation: "Correto. O padrão Singleton assegura a existência de apenas uma instância da classe, gerenciando o acesso concorrente ao seu recurso compartilhado.",
    reference: "Padrões de Projeto (Design Patterns)"
  },
  {
    text: "A arquitetura de software limpa (Clean Architecture) preconiza que as regras de negócio cruciais (entidades e casos de uso) devem residir no núcleo interno, totalmente independentes de frameworks e bancos de dados.",
    correct: "Certo",
    explanation: "Correto. O isolamento do core de negócios de agentes externos como bancos ou UI é o princípio fundamental da arquitetura limpa de Robert C. Martin.",
    reference: "Clean Architecture"
  }
];

// Templates for Ética e Compliance / Marco Legal & FAPEAL (45 unique templates)
const eticaTemplates = [
  // 1. Marco Legal de CT&I (Federal)
  {
    text: "Segundo o Marco Legal de CT&I (Lei nº 13.243/2016), as Instituições de Ciência e Tecnologia (ICTs) públicas estão autorizadas a compartilhar seus laboratórios com empresas privadas para atividades de pesquisa e desenvolvimento.",
    correct: "Certo",
    explanation: "Correto. A Lei nº 13.243/2016 incentiva o compartilhamento de infraestrutura, laboratórios e recursos humanos entre ICTs públicas e o setor privado para promover a inovação tecnológica.",
    reference: "Marco Legal da CT&I (Lei 13.243/2016)"
  },
  {
    text: "De acordo com o Marco Legal de CT&I (Lei nº 13.243/2016), é proibida a cessão de direitos de propriedade intelectual gerados em parcerias públicas por ICTs públicas para empresas privadas, em respeito ao interesse público.",
    correct: "Errado",
    explanation: "Incorreto. A legislação federal permite e disciplina expressamente a cessão ou licenciamento de direitos sobre criações industriais e patentes desenvolvidas em parceria a empresas privadas parceiras.",
    reference: "Marco Legal da CT&I (Lei 13.243/2016)"
  },
  {
    text: "O Marco Legal de CT&I prevê que pesquisadores sob o regime de dedicação exclusiva em ICTs públicas podem exercer atividades remuneradas de pesquisa e inovação na iniciativa privada, desde que aprovado pela instituição de origem.",
    correct: "Certo",
    explanation: "Correto. O Marco Legal flexibilizou a dedicação exclusiva para permitir colaborações pagas em projetos de inovação tecnológica com o setor produtivo privado.",
    reference: "Lei Federal nº 13.243/2016"
  },
  // 2. Lei da Inovação
  {
    text: "A Lei de Inovação (Lei nº 10.973/2004) prevê que o fomento à inovação em empresas privadas pode se dar por subvenções econômicas, financiamentos ou incentivos fiscais diretos.",
    correct: "Certo",
    explanation: "Correto. A união, estados e municípios estão autorizados pela Lei de Inovação a alocar recursos públicos diretamente como subvenção econômica para empresas inovadoras.",
    reference: "Lei de Inovação (Lei 10.973/2004)"
  },
  {
    text: "Segundo a Lei de Inovação (Lei nº 10.973/2004), as bolsas de incentivo à inovação tecnológica concedidas por agências de fomento como a FAPEAL possuem natureza salarial e devem sofrer incidência de encargos previdenciários.",
    correct: "Errado",
    explanation: "Incorreto. As bolsas de estímulo à inovação possuem caráter puramente indenizatório e de fomento, não configurando vínculo empregatício e sendo isentas de encargos de folha e imposto de renda.",
    reference: "Lei de Inovação (Lei 10.973/2004)"
  },
  // 3. Regulamentação Federal (Decreto 9.283/2018)
  {
    text: "Conforme o Decreto Federal nº 9.283/2018, as prestações de contas de projetos financiados com recursos públicos de CT&I devem priorizar a análise financeira em detrimento dos resultados científicos atingidos.",
    correct: "Errado",
    explanation: "Incorreto. O Decreto nº 9.283/2018 revolucionou a prestação de contas, estabelecendo que ela deve ser focada fundamentalmente nos resultados e na consecução do objeto acordado, simplificando os ritos contábeis.",
    reference: "Decreto Federal nº 9.283/2018"
  },
  {
    text: "O Decreto Federal nº 9.283/2018 autoriza o uso de bônus tecnológico para microempresas e startups, destinado a custear a contratação de serviços tecnológicos especializados em ICTs.",
    correct: "Certo",
    explanation: "Correto. O bônus tecnológico é um instrumento de fomento direto regulamentado pelo decreto para aproximar pequenos negócios e universidades.",
    reference: "Decreto Federal nº 9.283/2018"
  },
  // 4. Encomenda Tecnológica (ETEC)
  {
    text: "A Encomenda Tecnológica (ETEC) é um instrumento de compras públicas de inovação aplicável a casos em que há elevado risco tecnológico e cujas soluções técnicas não se encontram disponíveis no mercado.",
    correct: "Certo",
    explanation: "Correto. A ETEC destina-se a resolver problemas complexos com grande incerteza técnica, financiando o desenvolvimento da inovação sem garantia de sucesso comercial imediato.",
    reference: "Encomenda Tecnológica (ETEC)"
  },
  {
    text: "A contratação de Encomenda Tecnológica (ETEC) exige obrigatoriamente licitação prévia na modalidade de concorrência pública, não se admitindo hipótese de dispensa em razão da destinação dos recursos.",
    correct: "Errado",
    explanation: "Incorreto. Devido ao altíssimo risco tecnológico envolvido e à natureza específica do desenvolvedor, a contratação de ETEC é enquadrada em hipótese legal de dispensa de licitação (art. 24 da antiga Lei de Licitações e nova Lei 14.133).",
    reference: "Encomenda Tecnológica e Licitações"
  },
  // 5. Marco Legal das Startups (LC 182/2021)
  {
    text: "A Lei Complementar nº 182/2021 (Marco Legal das Startups) institui o ambiente regulatório experimental (sandbox regulatório), no qual empresas inovadoras podem testar novos produtos sob regime jurídico especial simplificado.",
    correct: "Certo",
    explanation: "Correto. O sandbox regulatório reduz a rigidez das normas para viabilizar testes seguros de startups em mercados altamente regulados (como financeiro e telecom).",
    reference: "Marco Legal das Startups (LC 182/2021)"
  },
  {
    text: "Nos termos da LC nº 182/2021, o investidor anjo que aporta capital em startups assume responsabilidade subsidiária ilimitada pelas obrigações trabalhistas, tributárias e cíveis da empresa investida.",
    correct: "Errado",
    explanation: "Incorreto. A lei complementar expressamente blinda o investidor anjo, assegurando que o aporte de capital sob a forma de mútuo ou participação não o torna sócio e não gera nenhuma responsabilidade por dívidas da startup.",
    reference: "Marco Legal das Startups (LC 182/2021)"
  },
  // 6. Política Estadual de CT&I de Alagoas (Lei nº 8.956/2023)
  {
    text: "A Lei Estadual nº 8.956/2023, que institui a Política Estadual de CT&I de Alagoas, define que a FAPEAL é a fundação oficial encarregada de executar o fomento à pesquisa e incentivar projetos inovadores no estado.",
    correct: "Certo",
    explanation: "Correto. A Lei nº 8.956/2023 consagra a FAPEAL como a agência central executora do plano estadual de inovação e fomento científico de Alagoas.",
    reference: "Lei Estadual Alagoas nº 8.956/2023"
  },
  {
    text: "O Sistema Estadual de CT&I de Alagoas, nos termos da Lei nº 8.956/2023, é integrado exclusivamente por órgãos governamentais, sendo vedada a participação de entidades e empresas privadas em seus conselhos consultivos.",
    correct: "Errado",
    explanation: "Incorreto. O sistema segue o modelo de hélice tríplice e estimula a integração participativa do governo, academia e representantes empresariais e privados em sua estrutura e câmaras técnicas.",
    reference: "Lei Estadual Alagoas nº 8.956/2023"
  },
  // 7. Lei Delegada nº 48/2022 (FAPEAL vinculação)
  {
    text: "Conforme a Lei Delegada nº 48/2022 do Estado de Alagoas, a FAPEAL é uma fundação pública dotada de autonomia administrativa e financeira, vinculada diretamente à Secretaria de Estado da Ciência, da Tecnologia e da Inovação (SECTI).",
    correct: "Certo",
    explanation: "Correto. A reestruturação administrativa estadual de 2022 confirmou a autonomia e a vinculação de tutela da FAPEAL com a secretaria especializada (SECTI).",
    reference: "Lei Delegada nº 48/2022 (Alagoas)"
  },
  {
    text: "A Lei Delegada nº 48/2022 alterou o caráter da FAPEAL, transformando-a em uma autarquia corporativa de direito privado com fins lucrativos voltada para venda de patentes estaduais.",
    correct: "Errado",
    explanation: "Incorreto. A FAPEAL mantém-se estritamente como fundação pública de direito público, sem fins lucrativos, dedicada ao fomento científico e tecnológico social.",
    reference: "Lei Delegada nº 48/2022 (Alagoas)"
  },
  // 8. RJU dos Servidores de Alagoas (Lei Estadual nº 5.247/1991)
  {
    text: "Nos termos da Lei Estadual nº 5.247/1991 (RJU), a demissão de servidor público estável de Alagoas somente poderá ocorrer mediante sentença judicial transitada em julgado ou processo administrativo disciplinar em que lhe seja assegurada ampla defesa.",
    correct: "Certo",
    explanation: "Correto. O servidor estável possui garantias constitucionais e infraconstitucionais rígidas contra demissões arbitrárias.",
    reference: "RJU Alagoas (Lei 5.247/1991)"
  },
  {
    text: "Conforme a Lei Estadual nº 5.247/1991, o servidor suspenso preventivamente durante a tramitação do processo disciplinar perderá, em caráter definitivo, toda a sua remuneração, independentemente do resultado final da apuração.",
    correct: "Errado",
    explanation: "Incorreto. O afastamento preventivo é medida cautelar e o servidor continuará percebendo sua remuneração, fazendo jus à restituição de eventuais perdas se ao final for considerado inocente.",
    reference: "RJU Alagoas (Lei 5.247/1991)"
  },
  {
    text: "A Lei Estadual nº 5.247/1991 prevê que o prazo de prescrição da ação disciplinar contra servidor público, nos casos puníveis com demissão, é de 5 (cinco) anos, contados da data em que o fato se tornou conhecido pela administração pública.",
    correct: "Certo",
    explanation: "Correto. O prazo quinquenal é a regra geral para a punibilidade de faltas graves que ensejam demissão, cassação de aposentadoria ou disponibilidade.",
    reference: "RJU Alagoas (Lei 5.247/1991)"
  },
  // 9. Estatuto da FAPEAL (Decreto nº 4.137/2009)
  {
    text: "Nos termos do Estatuto da FAPEAL (Decreto nº 4.137/2009), o Conselho Superior é o órgão de deliberação máxima da fundação, competindo-lhe, entre outras atribuições, aprovar os planos de fomento científicos anuais.",
    correct: "Certo",
    explanation: "Correto. O Conselho Superior é o órgão colegiado deliberativo de cúpula da FAPEAL, encarregado de direcionar as diretrizes científicas e administrativas.",
    reference: "Estatuto FAPEAL (Decreto 4.137/2009)"
  },
  {
    text: "De acordo com o Estatuto da FAPEAL, os cargos de direção executiva, inclusive o de Diretor-Presidente, são de provimento vitalício, não podendo seus ocupantes serem exonerados ad nutum pelo Governador.",
    correct: "Errado",
    explanation: "Incorreto. Os cargos de Diretor-Presidente e demais diretores da FAPEAL são cargos em comissão, de livre nomeação e exoneração pelo Governador do Estado.",
    reference: "Estatuto FAPEAL (Decreto 4.137/2009)"
  },
  // 10. Código de Conduta do Executivo (Decreto Estadual nº 4.383/2015)
  {
    text: "O Código de Conduta do Executivo de Alagoas (Decreto nº 4.383/2015) proíbe expressamente o recebimento de presentes ou brindes de valor econômico significativo por agentes públicos, exceto lembranças institucionais sem valor comercial expressivo.",
    correct: "Certo",
    explanation: "Correto. O código de conduta veda benesses de terceiros com interesse em decisões estaduais, abrindo exceção estrita para brindes promocionais e protocolares genéricos de baixo valor.",
    reference: "Decreto Estadual Alagoas nº 4.383/2015"
  },
  {
    text: "O Decreto Estadual nº 4.383/2015 prevê que a infração às normas éticas poderá acarretar penas administrativas de demissão a bem do serviço público aplicadas de forma sumária pelas comissões de ética.",
    correct: "Errado",
    explanation: "Incorreto. A comissão de ética apenas aplica a pena ética de 'censura' e encaminha as conclusões ao setor de recursos humanos para eventuais processos disciplinares sob o RJU. Ela não demite servidores.",
    reference: "Decreto Estadual Alagoas nº 4.383/2015"
  },
  // 11. LGPD no Setor Público (Lei nº 13.709/2018)
  {
    text: "No tratamento de dados pessoais pelo poder público, a LGPD exige que as operações sejam realizadas para o atendimento de finalidade pública, na persecução do interesse público, com ampla transparência sobre as hipóteses de uso.",
    correct: "Certo",
    explanation: "Correto. O poder público trata dados sob o império da finalidade de executar políticas públicas e cumprir atribuições legais, devendo dar publicidade ao tratamento.",
    reference: "LGPD (Lei 13.709/2018)"
  },
  // 12. Improbidade Administrativa (Lei nº 8.429/1992 reformada)
  {
    text: "Conforme a Lei de Improbidade Administrativa reformada, constitui ato de improbidade que atenta contra os princípios da administração pública revelar segredo de que tenha conhecimento em razão das atribuições, de forma a violar a impessoalidade.",
    correct: "Certo",
    explanation: "Correto. Revelar fatos sigilosos antes de sua divulgação oficial, obtendo ou gerando vantagem ilícita, atenta diretamente contra os deveres de moralidade e sigilo funcional.",
    reference: "Lei de Improbidade Administrativa"
  },
  {
    text: "A nova Lei de Improbidade Administrativa (Lei nº 14.230/2021) eliminou a aplicação de penas de perda da função pública aos servidores punidos, limitando as sanções ao ressarcimento pecuniário simples.",
    correct: "Errado",
    explanation: "Incorreto. A suspensão dos direitos políticos e a efetiva perda do cargo público continuam sendo sanções graves aplicáveis em sede judicial para atos dolosos de improbidade.",
    reference: "Lei de Improbidade Administrativa"
  }
];

// Templates for Conhecimentos de Alagoas (15 templates)
const alagoasTemplates = [
  {
    text: "A Emancipação Política de Alagoas, ocorrida em {ano}, foi assinada por {autoridade}, tornando Alagoas juridicamente independente da província de Pernambuco.",
    correct: "Certo",
    explanation: "Correto. Em 1817, D. João VI emancipou a comarca de Alagoas, punindo a capitania de Pernambuco pela Revolução de 1817.",
    reference: "História de Alagoas - Emancipação"
  },
  {
    text: "O Quilombo dos Palmares, maior símbolo de resistência à escravidão no período colonial brasileiro, situava-se na região da Serra da Barriga, pertencente atualmente ao município alagoano de {municipio}.",
    correct: "Certo",
    explanation: "Correto. A Serra da Barriga fica no município de União dos Palmares, berço da luta quilombola nacional.",
    reference: "História de Alagoas - Palmares"
  },
  {
    text: "A mesorregião do {regiao} alagoano caracteriza-se por apresentar clima {clima} e ter na atividade {atividade} um dos pilares da sua economia local.",
    correct: "Certo",
    explanation: "Correto. O Sertão apresenta clima semiárido, tendo na pecuária um de seus esteios econômicos históricos.",
    reference: "Geografia de Alagoas"
  },
  {
    text: "Alagoas destaca-se historicamente no cenário agroindustrial brasileiro pelo cultivo intensivo da cana-de-açúcar, atividade que moldou as relações sociais, fundiárias e de poder na região litorânea e mata do estado.",
    correct: "Certo",
    explanation: "Correto. A economia açucareira foi o principal vetor econômico e sociopolítico do leste alagoano desde o período colonial.",
    reference: "História Econômica de Alagoas"
  },
  {
    text: "O polo tecnológico e industrial químico de Alagoas, sediado principalmente na região metropolitana de Maceió, tem na extração de sal-gema um insumo fundamental para a indústria petroquímica local.",
    correct: "Certo",
    explanation: "Correto. A mineração de sal-gema na lagoa Mundaú impulsionou o desenvolvimento do polo cloroquímico estadual na segunda metade do século XX.",
    reference: "Geografia Industrial de Alagoas"
  }
];

// Templates for Língua Inglesa (15 templates)
const inglesTemplates = [
  {
    text: "In the context of the sentence '{sentenca}', the word '{palavra}' could be replaced by '{substituto}' without altering the meaning and keeping grammatical accuracy.",
    correct: "Certo",
    explanation: "Correct. These words function as contextual synonyms in this paragraph.",
    reference: "English Vocabulary in Context"
  },
  {
    text: "Based on the text, the logical connector '{conector}' in the paragraph {paragrafo} introduces a relationship of {valor_logico}.",
    correct: "Certo",
    explanation: "Correct. '{conector}' acts as a cohesive marker of {valor_logico}.",
    reference: "English Connectors"
  },
  {
    text: "The pronoun '{pronome}' in the sentence '{sentenca}' refers back anaphorically to the noun phrase '{referente}'.",
    correct: "Certo",
    explanation: "Correct. The pronoun refers back to the antecedent noun phrase.",
    reference: "English Cohesive Devices"
  }
];

// Helper to generate a question using templates and dynamic slotting
function createProceduralQuestion(
  id: number,
  category: QuestionCategory,
  index: number
): Question {
  const isCerto = index % 2 === 0;

  if (category === 'Português') {
    const t = ptTemplates[index % ptTemplates.length];
    
    // Mathematically generate dynamic, unique sentences based on index
    const sentences = [
      `A concessão de incentivos à pesquisa científica fomenta o desenvolvimento industrial alagoano (ref: #${index}).`,
      `O servidor público da FAPEAL deve pautar suas decisões pela moralidade e zelo administrativo (ref: #${index}).`,
      `As ICTs públicas estão autorizadas a compartilhar infraestrutura laboratorial com startups (ref: #${index}).`,
      `O fomento estadual à inovação é um preceito constitucional indispensável para a inclusão social (ref: #${index}).`,
      `A integridade de dados e a segurança cibernética são pilares estratégicos de governança pública (ref: #${index}).`,
      `Embora o cenário macroeconômico seja desafiador, a FAPEAL manteve a concessão de bolsas (ref: #${index}).`,
      `A nova legislação estadual de CT&I foi regulamentada, para que os processos tivessem maior celeridade (ref: #${index}).`,
      `Não se admitirá qualquer forma de discriminação no processo de seleção pública de pesquisadores (ref: #${index}).`
    ];
    
    const sentence = sentences[index % sentences.length];
    
    // Select terms based on sentence index to avoid repetitiveness
    const termo = index % 3 === 0 ? "fomenta" : (index % 3 === 1 ? "moralidade" : "FAPEAL");
    const conjuncao = index % 3 === 0 ? "embora" : (index % 3 === 1 ? "para que" : "posto que");
    const substituto = isCerto 
      ? (index % 3 === 0 ? "conquanto" : "a fim de que")
      : (index % 3 === 0 ? "portanto" : "visto que");
    const valor1 = index % 3 === 0 ? "concessão" : "finalidade";
    const valor2 = isCerto ? valor1 : "conclusão";

    let text = t.text
      .replace('{sentenca}', sentence)
      .replace('{termo}', termo)
      .replace('{conjuncao}', conjuncao)
      .replace('{substituto}', substituto)
      .replace('{expressao}', "concessão")
      .replace('{sub_expressao}', isCerto ? "liberação" : "retenção")
      .replace('{linha}', String((index % 12) + 3))
      .replace('{crase}', "à pesquisa")
      .replace('{verbo}', "fomentar")
      .replace('{pronome}', "suas")
      .replace('{referente}', "decisões")
      .replace('{sujeito}', "servidor")
      .replace('{papel}', "sinonímia contextual");

    return {
      id,
      category,
      text: `[CEBRASPE] ${text}`,
      correct: isCerto ? "Certo" : "Errado",
      explanation: isCerto 
        ? t.explanation.replace('{termo}', termo).replace('{conjuncao}', conjuncao).replace('{substituto}', substituto).replace('{valor1}', valor1).replace('{valor2}', valor2).replace('{expressao}', "concessão").replace('{sub_expressao}', "liberação").replace('{papel}', "sinonímia").replace('{pronome}', "suas").replace('{referente}', "decisões").replace('{sujeito}', "servidor")
        : `Incorreto. A assertiva inverte a regra de coesão ou a relação lógica estabelecida. A substituição proposta altera o sentido gramatical ou semântico original, gerando erro de sintaxe.`,
      reference: `Simulado CEBRASPE - Língua Portuguesa (Questão #${id})`
    };
  }

  if (category === 'TI Básica') {
    const t = tiTemplates[index % tiTemplates.length];
    
    // Dynamic terms based on index
    const model = index % 3 === 0 ? "SaaS (Software as a Service)" : (index % 3 === 1 ? "IaaS (Infrastructure as a Service)" : "PaaS (Platform as a Service)");
    const protocol = index % 3 === 0 ? "TCP" : (index % 3 === 1 ? "UDP" : "DNS");
    const layer = index % 3 === 0 ? "transporte" : (index % 3 === 1 ? "transporte" : "aplicação");
    const crypt = index % 3 === 0 ? "AES (Advanced Encryption Standard)" : "RSA";
    const charact = index % 3 === 0 ? "orientado a conexão" : (index % 3 === 1 ? "não orientado a conexão" : "de resolução de nomes");
    const bkModel = index % 2 === 0 ? "incremental" : "diferencial";
    const malw = index % 3 === 0 ? "Ransomware" : (index % 3 === 1 ? "Spyware" : "Phishing");
    
    let text = t.text
      .replace('{modelo}', model)
      .replace('{protocolo}', protocol)
      .replace('{camada}', layer)
      .replace('{caracteristica}', charact)
      .replace('{criptografia}', crypt)
      .replace('{modelo_backup}', bkModel)
      .replace('{malware}', malw)
      .replace('{tecnologia_rede}', "VPN")
      .replace('{porta_rede}', "443");

    if (!isCerto) {
      text = text
        .replace("orientado a conexão", "não confiável")
        .replace("única chave privada", "par de chaves pública e privada")
        .replace("bloquear o acesso a arquivos", "acelerar o tráfego de dados")
        .replace("criptografados em um túnel seguro", "abertos em formato plaintext");
    }

    return {
      id,
      category,
      text: `[CEBRASPE] ${text}`,
      correct: isCerto ? "Certo" : "Errado",
      explanation: isCerto
        ? t.explanation.replace('{modelo}', model).replace('{protocolo}', protocol).replace('{camada}', layer).replace('{caracteristica}', charact).replace('{criptografia}', crypt)
        : `Incorreto. A descrição técnica foi alterada para introduzir um erro conceitual clássico. Verifique as definições padrão de protocolos, backups, criptografias ou malwares.`,
      reference: `Simulado CEBRASPE - TI Básica (Questão #${id})`
    };
  }

  if (category === 'Conhecimentos Específicos') {
    const t = espTemplates[index % espTemplates.length];
    
    // Dynamic parameters
    const tool = index % 3 === 0 ? "Docker" : (index % 3 === 1 ? "Kubernetes" : "Jenkins");
    const stage = index % 3 === 0 ? "deploy automatizado" : "integração contínua";
    const technology = index % 2 === 0 ? "containers Linux" : "máquinas virtuais";
    const concept = index % 3 === 0 ? "Atomicidade" : (index % 3 === 1 ? "Consistência" : "Isolamento");
    const property = index % 3 === 0 ? "transações ACID" : "integridade de chaves";
    const vulnerability = index % 2 === 0 ? "SQL Injection" : "Cross-Site Scripting (XSS)";
    const mitigation = index % 2 === 0 ? "consultas parametrizadas (Prepared Statements)" : "sanitização e escape de dados de entrada";

    let text = t.text
      .replace('{ferramenta}', tool)
      .replace('{etapa}', stage)
      .replace('{tecnologia}', technology)
      .replace('{conceito}', concept)
      .replace('{propriedade}', property)
      .replace('{vulnerabilidade}', vulnerability)
      .replace('{mitigacao}', mitigation)
      .replace('{modelo_backup}', "em memória");

    if (!isCerto) {
      text = text
        .replace("consultas parametrizadas (Prepared Statements)", "desabilitação do firewall local")
        .replace("aberta para extensão, mas fechada para modificação", "aberta para modificação direta nas classes filhas")
        .replace("única instância em todo o ciclo de vida", "múltiplas instâncias globais independentes");
    }

    return {
      id,
      category,
      text: `[CEBRASPE] ${text}`,
      correct: isCerto ? "Certo" : "Errado",
      explanation: isCerto
        ? t.explanation.replace('{ferramenta}', tool).replace('{tecnologia}', technology).replace('{conceito}', concept).replace('{propriedade}', property).replace('{vulnerabilidade}', vulnerability)
        : `Incorreto. A afirmativa possui um erro de projeto ou de segurança de dados. Práticas recomendadas (SOLID, OWASP, Padrões GoF ou arquitetura limpa) devem ser mantidas rigorosamente para conformidade em TI.`,
      reference: `Simulado CEBRASPE - Conhecimentos Específicos TI (Questão #${id})`
    };
  }

  if (category === 'Ética e Compliance') {
    // Dynamic mapping over 25 laws and statutory terms
    const t = eticaTemplates[index % eticaTemplates.length];
    const isMarcoLegal = index % 2 === 0;
    
    let text = t.text;
    
    if (!isCerto) {
      text = text
        .replace("estão autorizadas a compartilhar", "estão estritamente proibidas de compartilhar")
        .replace("permite e disciplina expressamente", "proíbe expressamente, sob pena de responsabilidade administrativa,")
        .replace("podem exercer atividades remuneradas de pesquisa", "estão sumariamente impedidos de colaborar sob qualquer pretexto")
        .replace("pode se dar por subvenções econômicas", "deve ser realizado unicamente por meio de parcerias sem repasse orçamentário")
        .replace("priorizar a análise financeira em detrimento dos resultados", "ignorar as metas do plano de trabalho e auditar apenas notas fiscais individuais")
        .replace("ambiente regulatório experimental (sandbox regulatório)", "mercado livre sem nenhuma fiscalização fazendária ou regulatória")
        .replace("expressamente blinda o investidor anjo", "equipara integralmente o investidor anjo aos sócios fundadores, responsabilizando-o civilmente")
        .replace("FAPEAL é a fundação oficial encarregada", "FAPEAL é uma empresa pública de capital misto voltada para o lucro")
        .replace("autonomia administrativa e financeira", "subordinação hierárquica absoluta e dependência jurídica direta")
        .replace("somente poderá ocorrer mediante sentença", "poderá ocorrer sumariamente por decisão interna do comitê de ética")
        .replace("5 (cinco) anos", "15 (quinze) dias")
        .replace("Conselho Superior é o órgão de deliberação máxima", "Conselho Superior é um comitê puramente decorativo sem competência normativa")
        .replace("proíbe expressamente o recebimento de presentes", "obriga todos os servidores a receber e repassar presentes de qualquer valor");
    }

    return {
      id,
      category,
      text: `[CEBRASPE] ${text}`,
      correct: isCerto ? "Certo" : "Errado",
      explanation: isCerto
        ? t.explanation
        : `Incorreto. A assertiva distorce a legislação vigente (Constituição Federal, Marco Legal de CT&I, Estatuto da FAPEAL, Decreto nº 4.383/2015 ou Lei nº 5.247/1991). O texto incorreto contraria os preceitos de autonomia, fomento público ou as garantias funcionais dos servidores.`,
      reference: isMarcoLegal 
        ? `Simulado CEBRASPE - Marco Legal da CT&I (Questão #${id})` 
        : `Simulado CEBRASPE - Legislação Específica FAPEAL (Questão #${id})`
    };
  }

  if (category === 'Conhecimentos de Alagoas') {
    const t = alagoasTemplates[index % alagoasTemplates.length];
    
    const year = "1817";
    const auth = "D. João VI";
    const city = "União dos Palmares";
    const reg = index % 2 === 0 ? "Sertão" : "Litoral";
    const climate = index % 2 === 0 ? "semiárido" : "tropical úmido";
    const job = index % 2 === 0 ? "pecuária extensiva e de subsistência" : "turismo e exploração de sal-gema";

    let text = t.text
      .replace('{ano}', year)
      .replace('{autoridade}', auth)
      .replace('{municipio}', city)
      .replace('{regiao}', reg)
      .replace('{clima}', climate)
      .replace('{atividade}', job);

    if (!isCerto) {
      text = text
        .replace("1817", "1889")
        .replace("União dos Palmares", "Delmiro Gouveia")
        .replace("cultivo intensivo da cana-de-açúcar", "cultivo extensivo de café e videiras europeias")
        .replace("extração de sal-gema", "mineração profunda de diamantes e ouro aluvionar");
    }

    return {
      id,
      category,
      text: `[CEBRASPE] ${text}`,
      correct: isCerto ? "Certo" : "Errado",
      explanation: isCerto
        ? t.explanation.replace('{ano}', year).replace('{municipio}', city).replace('{regiao}', reg).replace('{clima}', climate).replace('{atividade}', job)
        : `Incorreto. A assertiva altera fatos históricos ou geográficos consagrados de Alagoas. A cana-de-açúcar é a cultura clássica da Zona da Mata; a mineração metropolitana é de sal-gema; e a emancipação ocorreu no período imperial de 1817.`,
      reference: `Simulado CEBRASPE - Conhecimentos de Alagoas (Questão #${id})`
    };
  }

  // Língua Inglesa
  const tIng = inglesTemplates[index % inglesTemplates.length];
  const technicalSents = [
    `Machine learning models demand significant cloud infrastructure to run efficiently (ref: #${index}).`,
    `Data privacy is critical for building public trust in government-led software platforms (ref: #${index}).`,
    `Although containerization offers deep isolation, security configurations must be audited (ref: #${index}).`,
    `A clean code strategy fosters faster software feature cycles and limits technical debt (ref: #${index}).`,
    `Scientific research funded by FAPEAL accelerates regional innovation networks (ref: #${index}).`
  ];
  const technicalSent = technicalSents[index % technicalSents.length];
  const word = "fosters";
  const sub = isCerto ? "encourages" : "obstructs";
  const conn = "Although";
  const connVal = "contrast/concession";
  const pron = "their";
  const ref = "software platforms";

  let text = tIng.text
    .replace('{sentenca}', technicalSent)
    .replace('{palavra}', word)
    .replace('{substituto}', sub)
    .replace('{conector}', conn)
    .replace('{paragrafo}', String((index % 4) + 1))
    .replace('{valor_logico}', connVal)
    .replace('{pronome}', pron)
    .replace('{referente}', ref);

  if (!isCerto) {
    text = text
      .replace("contrast/concession", "addition and finality")
      .replace("anaphorically to", "cataforically to a future verb")
      .replace("replaced by", "replaced by antonyms like");
  }

  return {
    id,
    category,
    text: `[CEBRASPE - English] ${text}`,
    correct: isCerto ? "Certo" : "Errado",
    explanation: isCerto
      ? tIng.explanation.replace('{palavra}', word).replace('{substituto}', sub).replace('{sentido}', "promotion/encouragement").replace('{conector}', conn).replace('{valor_logico}', connVal).replace('{pronome}', pron).replace('{referente}', ref)
      : `Incorrect. The statement is grammatically or contextually wrong. 'Although' is a marker of contrast or concession, and the pronouns are mapped incorrectly in terms of reference devices.`,
    reference: `Simulado CEBRASPE - Língua Inglesa (Questão #${id})`
  };
}

// Helper to remove duplicated questions using a robust normalization algorithm
export function deduplicateQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const result: Question[] = [];

  for (const q of questions) {
    // 1. Remove initial brackets like [CEBRASPE], [CEBRASPE - ...], [Jornalismo - ...]
    let normalized = q.text.replace(/^\[[^\]]+\]\s*/, '').trim();

    // 2. Normalize and strip various prefixes used dynamically
    const prefixes = [
      "conforme a norma culta e os aspectos gramaticais do texto, no texto ",
      "segundo as ideias veiculadas e as estruturas linguísticas do texto, no texto ",
      "considerando a estruturação sintática e semântica do período, no texto ",
      "com base nos recursos de coesão e na coerência do texto, no texto ",
      "depreende-se da análise morfossintática do texto que, no texto ",
      "sob a ótica das regras gramaticais e de concordância, no texto ",
      "acerca de conceitos de engenharia de software e segurança, ",
      "no contexto de governança de ti e metodologias modernas, ",
      "considerando as melhores práticas e padrões arquiteturais de sistemas, ",
      "com relação a redes de computadores, criptografia e proteção de dados, ",
      "de acordo com a literatura de referência para bancos de dados e desenvolvimento, ",
      "sob o ponto de vista de devops, containers e infraestrutura ágil, ",
      "no que se refere às teorias da comunicação e gêneros, ",
      "no âmbito da assessoria de imprensa e relacionamento com os meios, ",
      "considerando as diretrizes de ética, conduta e apuração do jornalismo, ",
      "com relação às técnicas de redação e planejamento visual na mídia, ",
      "sob o ponto de vista das garantias constitucionais da comunicação, ",
      "acerca das correntes clássicas do pensamento comunicacional brasileiro, ",
      "considerando as diretrizes clássicas do tema, avalie o seguinte item: ",
      "no contexto de comunicações e editais estaduais, julgue a assertiva: ",
      "a respeito de legislações correlatas, apuração e rotinas profissionais, julgue o item subsequente: ",
      "com relação às boas práticas da profissão e fundamentos da comunicação, julgue o item a seguir: ",
      "à luz das teorias vigentes e rotinas práticas da área de atuação, avalie a seguinte afirmação: ",
      "à luz das teorias vigentes e rotinas práticas da área de atuação, avalie a seguinte affirmation: "
    ];

    let lower = normalized.toLowerCase();
    let foundPrefix = true;
    while (foundPrefix) {
      foundPrefix = false;
      for (const prefix of prefixes) {
        if (lower.startsWith(prefix)) {
          normalized = normalized.substring(prefix.length).trim();
          lower = normalized.toLowerCase();
          foundPrefix = true;
        }
      }
    }

    // 3. Remove line numbers, references, and spacing artifacts
    normalized = normalized
      .replace(/\(próximo à linha \d+\)/gi, '')
      .replace(/na linha \d+/gi, '')
      .replace(/\(ref:\s*#\s*\d+\)/gi, '')
      .replace(/\(questão\s*#\s*\d+\)/gi, '')
      .trim();

    // 4. Create an alphanumeric lowercase key with accents normalized/removed
    let key = normalized
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, ""); // Keep only alphanumeric characters

    // Fallback key if too short
    const finalKey = key.length > 10 ? key : q.text.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!seen.has(finalKey)) {
      seen.add(finalKey);
      result.push(q);
    }
  }

  // Re-index all IDs sequentially starting from 1
  return result.map((q, idx) => ({
    ...q,
    id: idx + 1
  }));
}

// Function to generate the full 1400 questions dataset
export function getFullSimulatedQuestions(): Question[] {
  const result: Question[] = [];

  // 1. Português (Target: 300)
  // Seed with basePt (allBasePt has 70 base questions)
  allBasePt.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  expandedPortugueseQuestions.forEach(q => {
    result.push({ ...q, id: result.length + 1 });
  });
  buildPortugueseDrillQuestions().forEach(q => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'Português').length < 540) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'Português').length;
    result.push(createProceduralQuestion(nextId, 'Português', idx));
  }

  // 2. Informática (Target: 200, which splits into 100 TI Básica and 100 Conhecimentos Específicos)
  // TI Básica:
  allBaseTI.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'TI Básica').length < 100) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'TI Básica').length;
    result.push(createProceduralQuestion(nextId, 'TI Básica', idx));
  }
  // Conhecimentos Específicos:
  allBaseEsp.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'Conhecimentos Específicos').length < 100) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'Conhecimentos Específicos').length;
    result.push(createProceduralQuestion(nextId, 'Conhecimentos Específicos', idx));
  }

  // 3. Ética e Compliance / Marco Legal & Legislações Específicas (Target: 600, which covers 250 Marco Legal + 350 Legislação Específica)
  allBaseEt.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'Ética e Compliance').length < 600) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'Ética e Compliance').length;
    result.push(createProceduralQuestion(nextId, 'Ética e Compliance', idx));
  }

  // 4. Conhecimentos de Alagoas (Target: 150)
  allBaseAl.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'Conhecimentos de Alagoas').length < 150) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'Conhecimentos de Alagoas').length;
    result.push(createProceduralQuestion(nextId, 'Conhecimentos de Alagoas', idx));
  }

  // 5. Língua Inglesa (Target: 150)
  allBaseIng.forEach((q, i) => {
    result.push({ ...q, id: result.length + 1 });
  });
  while (result.filter(q => q.category === 'Língua Inglesa').length < 150) {
    const nextId = result.length + 1;
    const idx = result.filter(q => q.category === 'Língua Inglesa').length;
    result.push(createProceduralQuestion(nextId, 'Língua Inglesa', idx));
  }

  // 6. Real CEBRASPE Exams Integration (Target: 505 high-fidelity real questions)
  // These are appended at the end of the 1400-question base so we reach exactly 1905 questions
  const realCebraspe = getCebraspeRealQuestions();
  realCebraspe.forEach(q => {
    result.push({
      ...q,
      id: result.length + 1
    });
  });

  return deduplicateQuestions(result);
}

import { Question, QuestionCategory } from '../types';
import { quizQuestions } from './quizData';
import { deduplicateQuestions } from './questionGenerator';
import { codevasf2024JournalismQuestions } from './codevasf2024Questions';

// Helper to map fine-grained subjects to the official QuestionCategory union type
const mapCategory = (cat: string): QuestionCategory => {
  // All journalism-specific topics map to Conhecimentos Específicos - Jornalismo
  return 'Conhecimentos Específicos - Jornalismo';
};

// High-quality hand-crafted base questions for Journalism
const baseJournalismQuestions: {
  id: number;
  category: string;
  text: string;
  correct: 'Certo' | 'Errado';
  explanation: string;
  reference?: string;
}[] = [
  {
    id: 1,
    category: 'Teoria da Comunicação',
    text: '[Teoria da Comunicação] A teoria do Gatekeeping postula que as notícias são selecionadas por filtros e decisores (gatekeepers) dentro das redações, os quais decidem quais fatos se tornarão públicos e quais serão descartados.',
    correct: 'Certo',
    explanation: 'A teoria de Gatekeeping (ou "porteiro") descreve exatamente o papel ativo dos editores e jornalistas na escolha de pautas e descarte de fatos brutos, agindo como porteiros que decidem o que cruza os portões e vira notícia.',
    reference: 'Teoria do Gatekeeping'
  },
  {
    id: 2,
    category: 'Teoria da Comunicação',
    text: '[Teoria da Comunicação] A hipótese do Agenda-Setting defende que a mídia possui um poder irrestrito de manipulação direta de opinião, ditando aos indivíduos exatamente as ideologias em que eles devem acreditar.',
    correct: 'Errado',
    explanation: 'O Agenda-Setting estabelece que a mídia não dita o que as pessoas devem "pensar" (uma influência de manipulação total - Teoria Hipodérmica), mas sim "sobre quais assuntos" as pessoas devem discutir e refletir no dia a dia.',
    reference: 'Teoria do Agenda-Setting'
  },
  {
    id: 3,
    category: 'Técnicas de Redação',
    text: '[Técnicas de Redação] O lead jornalístico tradicional é composto pelas respostas a seis perguntas fundamentais: Quem? O quê? Quando? Onde? Como? Por quê? Ele deve vir na abertura do texto de notícia.',
    correct: 'Certo',
    explanation: 'O lead de hard news traz no início do texto as respostas para as dúvidas imediatas do leitor: Quem realizou o ato, O que aconteceu, Onde, Quando, Como e as motivações (Por quê).',
    reference: 'Lead Jornalístico'
  },
  {
    id: 4,
    category: 'Técnicas de Redação',
    text: '[Técnicas de Redação] A estrutura da pirâmide invertida consiste em apresentar o clímax da matéria de forma literária somente nas conclusões do último parágrafo, mantendo o suspense nas linhas anteriores.',
    correct: 'Errado',
    explanation: 'A pirâmide invertida coloca a informação mais importante logo de cara (no topo da pirâmide - primeiro parágrafo) e os detalhes de forma decrescente nos parágrafos seguintes. Isso é o oposto de guardar o clímax para o fim.',
    reference: 'Pirâmide Invertida'
  },
  {
    id: 5,
    category: 'Assessoria de Imprensa',
    text: '[Assessoria de Imprensa] No âmbito da assessoria de imprensa corporativa, o "media training" é o treinamento dado aos executivos e porta-vozes da empresa para que aprendam a se relacionar de forma adequada, assertiva e segura com os veículos de comunicação.',
    correct: 'Certo',
    explanation: 'O media training serve precisamente para ambientar diretores e representantes institucionais sobre o funcionamento dos meios de comunicação, o controle de discursos diante de câmeras e a postura correta em entrevistas.',
    reference: 'Media Training'
  },
  {
    id: 6,
    category: 'Assessoria de Imprensa',
    text: '[Assessoria de Imprensa] Ao lidar com uma situação de crise institucional grave, a recomendação clássica das boas assessorias de comunicação é que a instituição adote o silêncio irrestrito ("sem declarações") para evitar vazamento de dados.',
    correct: 'Errado',
    explanation: 'O silêncio irrestrito em crises alimenta boatos e enfraquece a credibilidade. A boa assessoria orienta transparência, celeridade e respostas fundamentadas por notas oficiais rápidas de posicionamento claro.',
    reference: 'Gerenciamento de Crise'
  },
  {
    id: 7,
    category: 'Jornalismo Digital',
    text: '[Jornalismo Digital] No webjornalismo, a escrita voltada para SEO (Search Engine Optimization) ignora completamente a utilidade de palavras-chave, priorizando exclusivamente títulos poéticos e metafóricos para a atração do leitor.',
    correct: 'Errado',
    explanation: 'Escrever para SEO exige títulos literais, claros e o uso sistemático de palavras-chave relevantes de busca de forma a posicionar bem o texto no Google. Títulos poéticos e subjetivos dificultam a indexação algorítmica.',
    reference: 'SEO no Jornalismo'
  },
  {
    id: 8,
    category: 'Jornalismo Digital',
    text: '[Jornalismo Digital] O hipertexto é uma característica marcante do jornalismo digital que permite ao leitor uma leitura não-linear, expandindo a matéria com links e conexões externas ao longo do texto.',
    correct: 'Certo',
    explanation: 'O hipertexto permite que o leitor acesse informações complementares de forma atrativa e não sequencial, clicando em links espalhados pelo texto principal.',
    reference: 'Hipertextualidade'
  },
  {
    id: 9,
    category: 'Ética e Compliance',
    text: '[Ética e Compliance] Constitucionalmente, no Brasil, o sigilo da fonte jornalística é garantido quando necessário ao exercício profissional, não sendo permitido ao juiz exigir a revelação do nome da fonte sob pena de violação constitucional.',
    correct: 'Certo',
    explanation: 'O Art. 5º, inciso XIV da Constituição Federal garante o direito de acesso à informação e resguarda expressamente o sigilo da fonte quando necessário ao exercício profissional do jornalista.',
    reference: 'Constituição Federal / Código de Ética'
  },
  {
    id: 10,
    category: 'Ética e Compliance',
    text: '[Ética e Compliance] O Código de Ética dos Jornalistas Brasileiros proíbe expressamente a divulgação de notícias que firam os direitos humanos ou promovam o ódio, devendo o jornalista ouvir as partes envolvidas antes de publicar denúncias.',
    correct: 'Certo',
    explanation: 'O exercício do jornalismo pauta-se pelo respeito aos direitos humanos e exige a apuração rigorosa com contraditório (ouvir todas as partes citadas em acusações) antes de qualquer veiculação.',
    reference: 'Código de Ética dos Jornalistas'
  },
  {
    id: 11,
    category: 'Assessoria de Imprensa',
    text: '[Assessoria de Imprensa] As assessorias de comunicação buscam visibilidade para seus clientes, intermediando relações entre fonte e jornalista, e trabalham para publicar notícias de interesse institucional em espaços editoriais pagos.',
    correct: 'Errado',
    explanation: 'Assessoria de imprensa atua na obtenção de mídia espontânea/gratuita. Espaço editorial pago caracteriza publicidade comercial.',
    reference: 'Assessoria de Imprensa'
  },
  {
    id: 12,
    category: 'Assessoria de Imprensa',
    text: '[Assessoria de Imprensa] A clipagem é utilizada por assessorias de imprensa e empresas especializadas para monitorar a cobertura e as menções sobre a instituição nos meios de comunicação.',
    correct: 'Certo',
    explanation: 'O clipping/clipagem é o monitoramento sistemático de tudo que é publicado na mídia sobre a organização.',
    reference: 'Clipagem'
  },
  {
    id: 13,
    category: 'Assessoria de Imprensa',
    text: '[Assessoria de Imprensa] Mailing de imprensa consiste no acompanhamento e arquivamento de notícias publicadas na imprensa, realizado por meio de recortes ou cópias digitais.',
    correct: 'Errado',
    explanation: 'O mailing de imprensa é o cadastro organizado de contatos de jornalistas e veículos. O acompanhamento de notícias publicadas na imprensa é o clipping.',
    reference: 'Mailing de Imprensa'
  },
  {
    id: 14,
    category: 'Técnicas de Redação',
    text: '[Técnicas de Redação] O emprego de linguagem complexa nos textos jornalísticos institucionais valoriza a imagem da organização perante o público, realçando a importância técnica de suas ações de pesquisa.',
    correct: 'Errado',
    explanation: 'Linguagem complexa prejudica a compreensão; textos jornalísticos institucionais devem usar linguagem clara, concisa, acessível e direta (linguagem cidadã).',
    reference: 'Linguagem Cidadã'
  },
  {
    id: 15,
    category: 'Técnicas de Redação',
    text: '[Técnicas de Redação] O editorial é o gênero jornalístico caracterizado por expressar a opinião oficial do veículo de comunicação diante de fatos de grande repercussão nacional ou internacional.',
    correct: 'Certo',
    explanation: 'Diferente da reportagem ou da notícia, o editorial reflete o posicionamento institucional oficial da empresa de comunicação.',
    reference: 'Gêneros Jornalísticos'
  },
  {
    id: 16,
    category: 'Marco Legal de CT&I',
    text: '[Marco Legal de CT&I] De acordo com o Marco Legal da CT&I (Lei nº 13.243/2016) e a Lei nº 10.973/2004, a Encomenda Tecnológica (ETEC) é um instrumento de fomento que envolve risco tecnológico e dispensa de licitação para a contratação de pesquisa e desenvolvimento.',
    correct: 'Certo',
    explanation: 'A Encomenda Tecnológica destina-se à resolução de problemas técnicos específicos com risco tecnológico envolvido, dispensando licitação.',
    reference: 'Lei Federal nº 13.243/2016'
  },
  {
    id: 17,
    category: 'Marco Legal de CT&I',
    text: '[Marco Legal de CT&I] Segundo a Lei Estadual nº 8.956/2023 de Alagoas, a FAPEAL integra a estrutura do Sistema Estadual de CT&I e atua como principal agência pública de fomento à pesquisa e bolsas de pós-graduação.',
    correct: 'Certo',
    explanation: 'A Lei Estadual 8.956/2023 formaliza a estrutura do Sistema de Ciência, Tecnologia e Inovação do Estado de Alagoas, posicionando a FAPEAL como seu braço executor de fomento.',
    reference: 'Lei Estadual nº 8.956/2023'
  },
  {
    id: 18,
    category: 'Divulgação Científica',
    text: '[Divulgação Científica] O Manual de Oslo define inovação como a introdução de um produto (bem ou serviço) novo ou significativamente melhorado, ou de um processo, ou de um novo método de marketing ou método organizacional.',
    correct: 'Certo',
    explanation: 'Definição oficial clássica do Manual de Oslo para inovação.',
    reference: 'Manual de Oslo'
  },
  {
    id: 19,
    category: 'Divulgação Científica',
    text: '[Divulgação Científica] A análise bibliométrica, muito utilizada na divulgação científica de órgãos de fomento, consiste na aplicação de métodos estatísticos para analisar o padrão de publicações, citações e o fator de impacto de periódicos.',
    correct: 'Certo',
    explanation: 'A bibliometria fornece métricas quantitativas de produção e divulgação do conhecimento científico.',
    reference: 'Bibliometria'
  },
  {
    id: 20,
    category: 'Divulgação Científica',
    text: '[Divulgação Científica] Em consonância com a Lei de Acesso à Informação (LAI), a divulgação espontânea de relatórios públicos de fomento e guias do proponente nos portais das fundações de amparo à pesquisa configura uma ação de transparência passiva.',
    correct: 'Errado',
    explanation: 'A publicação espontânea de relatórios e guias no site institui transparência ATIVA. A transparência passiva ocorre quando a informação é fornecida após solicitação do cidadão.',
    reference: 'Lei de Acesso à Informação (LAI)'
  }
];

const supplementalJournalismQuestions: {
  category: string;
  text: string;
  correct: 'Certo' | 'Errado';
  explanation: string;
  reference?: string;
}[] = [
  {
    category: 'História do Jornalismo',
    text: '[História do Jornalismo] A imprensa periódica moderna consolidou-se a partir da combinação entre tecnologias de impressão, circulação urbana de mercadorias, alfabetização crescente e formação de públicos leitores.',
    correct: 'Certo',
    explanation: 'O jornalismo não nasce apenas da técnica gráfica: ele depende também de condições sociais, econômicas e culturais que criam demanda por informação regular.',
    reference: 'História da Imprensa'
  },
  {
    category: 'História do Jornalismo',
    text: '[História do Jornalismo] A Gazeta do Rio de Janeiro, criada em 1808, foi um jornal de oposição radical à monarquia portuguesa instalada no Brasil.',
    correct: 'Errado',
    explanation: 'A Gazeta do Rio de Janeiro era ligada à Impressão Régia e tinha caráter oficial, distante de uma imprensa oposicionista autônoma.',
    reference: 'Imprensa no Brasil'
  },
  {
    category: 'História do Jornalismo',
    text: '[História do Jornalismo] O Correio Braziliense, editado por Hipólito da Costa em Londres, circulou no início do século XIX com críticas à administração portuguesa e influência no debate público brasileiro.',
    correct: 'Certo',
    explanation: 'Embora produzido fora do Brasil, o periódico teve papel relevante na formação de uma esfera pública crítica sobre temas políticos e administrativos.',
    reference: 'Correio Braziliense'
  },
  {
    category: 'História do Jornalismo',
    text: '[História do Jornalismo] O rádio reforçou a instantaneidade da notícia ao permitir transmissões ao vivo e cobertura de acontecimentos em tempo real.',
    correct: 'Certo',
    explanation: 'A linguagem sonora reduziu a distância temporal entre acontecimento e divulgação, especialmente em coberturas esportivas, políticas e de utilidade pública.',
    reference: 'Radiojornalismo'
  },
  {
    category: 'História do Jornalismo',
    text: '[História do Jornalismo] A televisão jornalística dispensa a apuração textual, pois a imagem exibida sempre fala por si e elimina a necessidade de contextualização.',
    correct: 'Errado',
    explanation: 'A imagem é poderosa, mas precisa de apuração, texto, edição e contexto para evitar interpretações incompletas ou enganosas.',
    reference: 'Telejornalismo'
  },
  {
    category: 'Produção da Notícia',
    text: '[Produção da Notícia] Proximidade, atualidade, relevância, conflito, impacto e novidade são exemplos de critérios de noticiabilidade utilizados para selecionar fatos jornalísticos.',
    correct: 'Certo',
    explanation: 'Esses valores ajudam a redação a decidir quais acontecimentos merecem cobertura e destaque editorial.',
    reference: 'Critérios de Noticiabilidade'
  },
  {
    category: 'Produção da Notícia',
    text: '[Produção da Notícia] A existência de uma fonte única e interessada é suficiente para publicar uma denúncia, desde que ela forneça declaração em on.',
    correct: 'Errado',
    explanation: 'Declaração identificada não elimina a necessidade de checagem, contraditório e busca por documentos ou fontes independentes.',
    reference: 'Apuração Jornalística'
  },
  {
    category: 'Produção da Notícia',
    text: '[Produção da Notícia] Informação em off pode orientar a investigação jornalística, mas seu uso exige acordo claro com a fonte e confirmação cuidadosa por outros meios.',
    correct: 'Certo',
    explanation: 'O off não autoriza publicação descuidada; ele funciona como pista ou contexto e deve ser manejado com responsabilidade ética.',
    reference: 'Fontes Jornalísticas'
  },
  {
    category: 'Produção da Notícia',
    text: '[Produção da Notícia] Entrevistas jornalísticas devem combinar escuta ativa, perguntas abertas, repertório prévio sobre o tema e capacidade de formular repreguntas.',
    correct: 'Certo',
    explanation: 'A entrevista qualificada não é leitura mecânica de roteiro; exige preparo e reação crítica às respostas dadas.',
    reference: 'Técnicas de Entrevista'
  },
  {
    category: 'Produção da Notícia',
    text: '[Produção da Notícia] A rotina produtiva da redação inclui etapas como reunião de pauta, apuração, redação, edição, revisão, publicação e eventual atualização.',
    correct: 'Certo',
    explanation: 'Essas fases organizam o fluxo de produção e reduzem erros em ambientes marcados por prazos curtos.',
    reference: 'Rotina de Redação'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] A nota jornalística é um texto breve, geralmente usado para registrar informação objetiva de menor extensão ou atualização rápida.',
    correct: 'Certo',
    explanation: 'A nota privilegia concisão e objetividade, sem o aprofundamento típico de uma reportagem.',
    reference: 'Nota Jornalística'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] A notícia, por sua natureza informativa, deve priorizar fatos verificáveis, atualidade e resposta às informações essenciais do acontecimento.',
    correct: 'Certo',
    explanation: 'A notícia é gênero informativo e organiza os dados centrais do fato de modo claro e direto.',
    reference: 'Notícia'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] A reportagem admite apuração mais longa, contextualização, múltiplas fontes e tratamento interpretativo mais amplo que a notícia factual.',
    correct: 'Certo',
    explanation: 'A reportagem aprofunda causas, consequências e personagens, sem abandonar o compromisso factual.',
    reference: 'Reportagem'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] O editorial expressa opinião pessoal de um repórter, sem vínculo com a posição institucional do veículo.',
    correct: 'Errado',
    explanation: 'O editorial representa a opinião institucional do veículo ou empresa jornalística.',
    reference: 'Editorial'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] O artigo de opinião é geralmente assinado e apresenta argumentação autoral sobre tema de interesse público.',
    correct: 'Certo',
    explanation: 'Diferentemente da notícia, o artigo explicita ponto de vista e usa argumentos para sustentá-lo.',
    reference: 'Artigo de Opinião'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] A crônica jornalística pode tratar fatos cotidianos com linguagem subjetiva, literária e interpretativa.',
    correct: 'Certo',
    explanation: 'A crônica aproxima jornalismo e literatura, valorizando observação, estilo e reflexão sobre o cotidiano.',
    reference: 'Crônica'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] A resenha crítica combina apresentação de uma obra ou produto cultural com avaliação fundamentada.',
    correct: 'Certo',
    explanation: 'Resenhar não é apenas resumir: envolve análise, juízo crítico e contextualização.',
    reference: 'Resenha'
  },
  {
    category: 'Gêneros Jornalísticos',
    text: '[Gêneros Jornalísticos] O perfil jornalístico busca retratar uma personagem real por meio de trajetória, comportamento, contexto social e depoimentos.',
    correct: 'Certo',
    explanation: 'O perfil constrói uma compreensão mais humana e contextualizada da personagem.',
    reference: 'Perfil Jornalístico'
  },
  {
    category: 'Jornalismo Institucional',
    text: '[Jornalismo Institucional] Comunicação institucional procura fortalecer identidade, imagem e reputação da organização perante seus públicos.',
    correct: 'Certo',
    explanation: 'Ela trabalha a percepção pública da instituição e sua coerência simbólica com missão, valores e práticas.',
    reference: 'Comunicação Institucional'
  },
  {
    category: 'Jornalismo Institucional',
    text: '[Jornalismo Institucional] Comunicação organizacional restringe-se ao relacionamento com jornalistas e exclui comunicação interna, administrativa e mercadológica.',
    correct: 'Errado',
    explanation: 'A comunicação organizacional é mais ampla e integra várias dimensões comunicacionais da organização.',
    reference: 'Comunicação Organizacional'
  },
  {
    category: 'Jornalismo Institucional',
    text: '[Jornalismo Institucional] O assessor de imprensa deve facilitar o acesso a informações de interesse público sem usurpar a autonomia editorial dos veículos.',
    correct: 'Certo',
    explanation: 'A assessoria sugere pautas, organiza informações e orienta fontes; a decisão de publicar cabe à redação.',
    reference: 'Assessoria de Imprensa'
  },
  {
    category: 'Produtos de Assessoria',
    text: '[Produtos de Assessoria] Release é texto produzido pela assessoria com linguagem jornalística para divulgar informação, sugerir pauta ou subsidiar cobertura.',
    correct: 'Certo',
    explanation: 'O release precisa ter gancho noticioso, dados verificáveis, fonte identificada e redação objetiva.',
    reference: 'Release'
  },
  {
    category: 'Produtos de Assessoria',
    text: '[Produtos de Assessoria] Press kit é o conjunto de materiais de apoio entregues à imprensa, podendo reunir release, fotos, dados, contatos, currículo de porta-vozes e documentos.',
    correct: 'Certo',
    explanation: 'Sua função é facilitar o trabalho do repórter e qualificar a cobertura de eventos ou anúncios.',
    reference: 'Press Kit'
  },
  {
    category: 'Produtos de Assessoria',
    text: '[Produtos de Assessoria] Mailing de imprensa é sinônimo de clipping, pois ambos designam a coleta de matérias já publicadas.',
    correct: 'Errado',
    explanation: 'Mailing é cadastro de contatos; clipping é monitoramento e registro de publicações.',
    reference: 'Mailing e Clipping'
  },
  {
    category: 'Produtos de Assessoria',
    text: '[Produtos de Assessoria] House organ é publicação institucional voltada a públicos de interesse, especialmente o público interno, com notícias e informações da organização.',
    correct: 'Certo',
    explanation: 'Pode aparecer como jornal interno, revista, boletim, intranet ou newsletter institucional.',
    reference: 'House Organ'
  },
  {
    category: 'Produtos de Assessoria',
    text: '[Produtos de Assessoria] Clipping permite acompanhar a presença da instituição na mídia e avaliar repercussão, visibilidade e temas sensíveis.',
    correct: 'Certo',
    explanation: 'O clipping serve como insumo para diagnóstico de imagem e planejamento de comunicação.',
    reference: 'Clipping'
  },
  {
    category: 'Comunicação Pública',
    text: '[Comunicação Pública] Comunicação pública deve priorizar interesse público, cidadania, transparência e prestação de contas, não promoção pessoal de autoridades.',
    correct: 'Certo',
    explanation: 'Em órgãos públicos, a comunicação deve respeitar impessoalidade e utilidade social da informação.',
    reference: 'Comunicação Pública'
  },
  {
    category: 'Comunicação Pública',
    text: '[Comunicação Pública] Linguagem cidadã é aquela que traduz termos técnicos e burocráticos para linguagem clara, acessível e compreensível ao cidadão.',
    correct: 'Certo',
    explanation: 'Seu objetivo é ampliar o acesso real à informação e aos serviços públicos.',
    reference: 'Linguagem Cidadã'
  },
  {
    category: 'Comunicação Pública',
    text: '[Comunicação Pública] Transparência ativa ocorre quando o órgão público divulga espontaneamente informações de interesse coletivo, independentemente de solicitação.',
    correct: 'Certo',
    explanation: 'Portais de transparência, relatórios, editais e dados abertos são exemplos comuns de transparência ativa.',
    reference: 'LAI'
  },
  {
    category: 'Comunicação Pública',
    text: '[Comunicação Pública] Prestação de contas é incompatível com comunicação institucional, pois relatórios públicos devem permanecer restritos à administração interna.',
    correct: 'Errado',
    explanation: 'A prestação de contas é dimensão essencial da comunicação pública e fortalece controle social e confiança.',
    reference: 'Accountability Pública'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: '[Editoração e Projeto Gráfico] Mancha gráfica é a área efetivamente ocupada por texto, imagens e elementos gráficos dentro da página.',
    correct: 'Certo',
    explanation: 'A mancha se relaciona à composição visual, às margens e ao equilíbrio entre cheios e vazios.',
    reference: 'Mancha Gráfica'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: '[Editoração e Projeto Gráfico] Retranca é uma palavra ou código usado internamente para identificar pauta, matéria, arquivo ou conteúdo em produção.',
    correct: 'Certo',
    explanation: 'A retranca organiza o fluxo editorial e ajuda a localizar materiais no fechamento.',
    reference: 'Retranca'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: '[Editoração e Projeto Gráfico] Tipologia diz respeito ao estudo e uso de tipos e fontes, incluindo legibilidade, hierarquia e adequação ao projeto visual.',
    correct: 'Certo',
    explanation: 'A escolha tipográfica interfere diretamente na leitura e na identidade gráfica da publicação.',
    reference: 'Tipologia'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: '[Editoração e Projeto Gráfico] Diagramação consiste apenas em preencher espaços vazios da página, sem relação com hierarquia da informação.',
    correct: 'Errado',
    explanation: 'Diagramar é organizar textos, títulos, imagens, brancos, chamadas e hierarquias visuais.',
    reference: 'Diagramação'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: '[Editoração e Projeto Gráfico] Preparação de originais envolve padronização, revisão, conferência de elementos textuais e adequação do material antes da editoração.',
    correct: 'Certo',
    explanation: 'Essa etapa evita inconsistências e facilita o trabalho posterior de edição e composição.',
    reference: 'Preparação de Originais'
  },
  {
    category: 'Comunicação Digital',
    text: '[Comunicação Digital] Alcance corresponde ao número de usuários únicos expostos a determinado conteúdo, enquanto impressões indicam o total de exibições.',
    correct: 'Certo',
    explanation: 'Uma mesma pessoa pode gerar várias impressões, mas conta uma vez no alcance.',
    reference: 'Métricas Digitais'
  },
  {
    category: 'Comunicação Digital',
    text: '[Comunicação Digital] Conversão é a realização de uma ação desejada pelo usuário, como inscrição, download, cadastro, compra ou envio de formulário.',
    correct: 'Certo',
    explanation: 'A conversão mede se a comunicação levou o público a cumprir o objetivo definido.',
    reference: 'Conversão'
  },
  {
    category: 'Comunicação Digital',
    text: '[Comunicação Digital] KPI é qualquer dado disponível em uma plataforma, ainda que não esteja relacionado aos objetivos estratégicos da ação.',
    correct: 'Errado',
    explanation: 'KPI é indicador-chave de desempenho; deve estar ligado a metas relevantes, e não a qualquer número solto.',
    reference: 'KPI'
  },
  {
    category: 'Comunicação Digital',
    text: '[Comunicação Digital] CTR é uma taxa calculada pela relação entre cliques e impressões, útil para avaliar a atratividade de links, anúncios ou chamadas.',
    correct: 'Certo',
    explanation: 'Quanto maior o CTR, maior a proporção de pessoas que clicaram após visualizar a peça.',
    reference: 'CTR'
  },
  {
    category: 'LAI e LGPD',
    text: '[LAI e LGPD] A LAI estabelece a publicidade como regra e o sigilo como exceção no acesso a informações públicas.',
    correct: 'Certo',
    explanation: 'A Lei de Acesso à Informação fortalece transparência, controle social e dever estatal de fornecer informações.',
    reference: 'Lei nº 12.527/2011'
  },
  {
    category: 'LAI e LGPD',
    text: '[LAI e LGPD] Pela LAI, informações pessoais relativas à intimidade, vida privada, honra e imagem podem receber proteção de acesso, observadas as regras legais.',
    correct: 'Certo',
    explanation: 'Transparência pública convive com proteção de dados pessoais e outros sigilos legalmente previstos.',
    reference: 'Lei nº 12.527/2011'
  },
  {
    category: 'LAI e LGPD',
    text: '[LAI e LGPD] A LGPD permite o tratamento ilimitado de dados pessoais por órgãos públicos, ainda que sem finalidade pública específica.',
    correct: 'Errado',
    explanation: 'O poder público deve observar finalidade pública, interesse público, transparência, necessidade e base legal.',
    reference: 'Lei nº 13.709/2018'
  },
  {
    category: 'LAI e LGPD',
    text: '[LAI e LGPD] Dado pessoal sensível inclui informações como origem racial ou étnica, convicção religiosa, opinião política, saúde e dado biométrico.',
    correct: 'Certo',
    explanation: 'A LGPD confere maior proteção a dados que podem gerar discriminação ou riscos relevantes ao titular.',
    reference: 'Lei nº 13.709/2018'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Sistemas de inovação envolvem redes de instituições, empresas, governo e atores sociais que produzem, difundem e aplicam conhecimento tecnológico.',
    correct: 'Certo',
    explanation: 'A inovação é vista como processo sistêmico, dependente de interação e aprendizagem entre agentes.',
    reference: 'Sistemas de Inovação'
  },
  {
    category: 'CT&I',
    text: '[CT&I] A hélice tríplice descreve a interação entre universidade, governo e empresas como base para ambientes inovadores.',
    correct: 'Certo',
    explanation: 'O modelo destaca cooperação entre produção científica, políticas públicas e aplicação econômica do conhecimento.',
    reference: 'Hélice Tríplice'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Incubadoras apoiam empreendimentos em estágio inicial, oferecendo suporte gerencial, infraestrutura, mentoria e conexão com redes.',
    correct: 'Certo',
    explanation: 'Elas reduzem fragilidades iniciais e aumentam a chance de sobrevivência de negócios inovadores.',
    reference: 'Incubadoras'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Aceleradoras costumam apoiar negócios inovadores por período limitado e intensivo, com mentoria, conexões e, em alguns casos, investimento.',
    correct: 'Certo',
    explanation: 'Seu foco é tração, escala, validação de modelo e aproximação com mercado e investidores.',
    reference: 'Aceleradoras'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Living labs são ambientes de inovação fechados ao usuário final, baseados apenas em testes laboratoriais controlados.',
    correct: 'Errado',
    explanation: 'Living labs valorizam cocriação e testes em contexto real, com participação ativa de usuários.',
    reference: 'Living Labs'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Prospecção tecnológica busca identificar tendências, oportunidades, ameaças e trajetórias futuras de tecnologias ou setores.',
    correct: 'Certo',
    explanation: 'Ela subsidia planejamento estratégico, políticas de inovação e decisões de investimento.',
    reference: 'Prospecção Tecnológica'
  },
  {
    category: 'CT&I',
    text: '[CT&I] Bibliometria aplica métodos quantitativos ao estudo de publicações, citações, autores, periódicos e redes de produção científica.',
    correct: 'Certo',
    explanation: 'É ferramenta importante para mapear desempenho, colaboração e impacto da ciência.',
    reference: 'Bibliometria'
  },
  {
    category: 'CT&I',
    text: '[CT&I] O índice H considera simultaneamente produtividade e impacto, pois relaciona quantidade de publicações e número de citações.',
    correct: 'Certo',
    explanation: 'Um índice H igual a 20 indica 20 trabalhos com pelo menos 20 citações cada.',
    reference: 'Índice H'
  },
  {
    category: 'CT&I',
    text: '[CT&I] O fator de impacto mede diretamente a qualidade absoluta de cada artigo individual, dispensando leitura crítica do conteúdo.',
    correct: 'Errado',
    explanation: 'O fator de impacto é métrica agregada de periódico e não substitui avaliação qualitativa de artigos específicos.',
    reference: 'Fator de Impacto'
  },
  {
    category: 'CT&I',
    text: '[CT&I] ICTs são instituições dedicadas à pesquisa científica, desenvolvimento tecnológico ou inovação, podendo atuar em parceria com empresas e governo.',
    correct: 'Certo',
    explanation: 'As ICTs são atores centrais do ecossistema de CT&I e da transferência de conhecimento.',
    reference: 'ICTs'
  }
];

const expandedRequestedJournalismQuestions: typeof supplementalJournalismQuestions = [
  ...[
    ['A prensa de tipos móveis ampliou a circulação de impressos e reduziu custos de reprodução textual.', 'Certo', 'A mecanização da impressão permitiu maior escala de produção e favoreceu a formação de mercados leitores.'],
    ['Os primeiros periódicos modernos surgiram sem relação com comércio, correios, portos ou circulação urbana.', 'Errado', 'A imprensa periódica se fortaleceu em ambientes de circulação de mercadorias, cartas, rumores políticos e informação econômica.'],
    ['A instalação da Impressão Régia em 1808 marcou a autorização oficial da atividade tipográfica no Brasil.', 'Certo', 'A chegada da Corte portuguesa rompeu a proibição colonial de tipografias e possibilitou publicações oficiais.'],
    ['A imprensa brasileira do século XIX foi marcada por jornais de opinião, panfletos políticos e forte atuação no debate público.', 'Certo', 'O jornalismo daquele período era frequentemente opinativo, partidário e ligado a disputas políticas.'],
    ['A profissionalização do jornalismo no Brasil envolveu mudanças técnicas, empresariais e editoriais ao longo do século XX.', 'Certo', 'Empresas jornalísticas, rotinas industriais, publicidade, reportagem e edição moderna ajudaram a consolidar a profissão.'],
    ['O rádio perdeu toda relevância jornalística após o surgimento da televisão.', 'Errado', 'O rádio manteve força pela mobilidade, baixo custo, rapidez e proximidade com audiências locais.'],
    ['A linguagem radiofônica exige clareza, frases curtas e atenção à oralidade.', 'Certo', 'Como o ouvinte não relê a informação, o texto precisa ser imediatamente compreensível.'],
    ['A televisão integrou imagem, som, texto e edição, alterando a forma de narrar acontecimentos jornalísticos.', 'Certo', 'O telejornalismo depende da combinação entre informação verbal, imagem, ritmo de edição e presença de apresentadores ou repórteres.'],
    ['A internet intensificou a convergência ao reunir texto, áudio, vídeo, dados, hiperlinks e interação em ambientes digitais.', 'Certo', 'O jornalismo digital opera de forma multimídia, hipertextual, atualizável e participativa.'],
    ['Na convergência jornalística, cada plataforma atua isoladamente e impede cooperação entre equipes.', 'Errado', 'Convergência pressupõe integração de rotinas, linguagens e canais, ainda que cada suporte preserve especificidades.'],
    ['O webjornalismo facilitou atualização contínua e correção posterior de conteúdos, sem eliminar a responsabilidade da checagem prévia.', 'Certo', 'A possibilidade de atualizar não autoriza publicação precipitada de informação não verificada.'],
    ['A imprensa alternativa brasileira teve importância em contextos de censura e restrição à liberdade de expressão.', 'Certo', 'Veículos alternativos historicamente serviram como espaços de crítica, resistência e circulação de informações fora do circuito dominante.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'História do Jornalismo',
    text: `[História do Jornalismo] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'História do Jornalismo'
  })),
  ...[
    ['Valor-notícia é atributo que aumenta a chance de um acontecimento ser selecionado e hierarquizado pela redação.', 'Certo', 'Valores-notícia orientam seleção, edição e destaque, ainda que não sejam regras matemáticas.'],
    ['A atualidade é relevante, mas um fato recente sem interesse público pode não se justificar como notícia.', 'Certo', 'A noticiabilidade depende da combinação de atualidade com relevância, impacto, proximidade e outros critérios.'],
    ['Impacto social é valor-notícia associado ao número de pessoas afetadas ou à intensidade das consequências de um fato.', 'Certo', 'Quanto maior o efeito coletivo de um acontecimento, maior tende a ser seu interesse jornalístico.'],
    ['Proximidade jornalística pode ser geográfica, cultural, afetiva ou institucional.', 'Certo', 'O público tende a se interessar por fatos que dialogam com seu território, identidade ou realidade social.'],
    ['Conflito é valor-notícia porque disputas políticas, jurídicas, econômicas ou sociais revelam tensões de interesse público.', 'Certo', 'O conflito ajuda a evidenciar divergências, responsabilidades e consequências coletivas.'],
    ['A apuração termina quando o repórter recebe a primeira versão oficial sobre o fato.', 'Errado', 'A versão oficial é uma fonte, mas deve ser confrontada com documentos, dados, especialistas e partes afetadas.'],
    ['Checagem envolve verificar nomes, datas, números, documentos, contexto e coerência das declarações.', 'Certo', 'Erros factuais pequenos podem comprometer credibilidade e gerar danos relevantes.'],
    ['Confirmação cruzada significa buscar evidências independentes para sustentar uma informação sensível.', 'Certo', 'Dados críticos devem ser confirmados por fontes distintas, documentos ou registros verificáveis.'],
    ['Fonte primária é aquela diretamente relacionada ao fato, documento, dado ou personagem investigado.', 'Certo', 'A fonte primária está mais próxima do acontecimento ou da informação original.'],
    ['Fonte secundária substitui integralmente a apuração quando resume corretamente um fato.', 'Errado', 'Fontes secundárias ajudam a contextualizar, mas não dispensam verificação própria.'],
    ['Fonte oficial pode fornecer dados relevantes, mas sua posição institucional deve ser considerada na análise crítica.', 'Certo', 'Fontes oficiais também têm interesses, limites e estratégias de comunicação.'],
    ['Off the record significa que a informação pode ser publicada com nome, cargo e imagem da fonte.', 'Errado', 'Off pressupõe condição de reserva combinada com a fonte, exigindo cuidado na atribuição e uso.'],
    ['On the record é a condição em que a fonte autoriza atribuição pública de sua declaração.', 'Certo', 'Nesse caso, a fala pode ser identificada e responsabilizada.'],
    ['Em entrevista, pergunta indutiva pode direcionar artificialmente a resposta e empobrecer a apuração.', 'Certo', 'Perguntas que já carregam a resposta podem reduzir espontaneidade e rigor informativo.'],
    ['A pauta jornalística orienta a apuração, mas pode ser reformulada diante de novos fatos.', 'Certo', 'A pauta é ponto de partida, não roteiro imutável.'],
    ['A edição jornalística deve hierarquizar informações, eliminar ambiguidades e preservar o sentido factual apurado.', 'Certo', 'Editar não é distorcer: é organizar com clareza, precisão e responsabilidade.'],
    ['O contraditório é dispensável quando a denúncia parece moralmente evidente para a redação.', 'Errado', 'Ouvir o lado citado é prática fundamental de justiça, precisão e ética jornalística.'],
    ['Embargo de informação é acordo pelo qual uma fonte antecipa dados com publicação permitida apenas após horário ou data combinados.', 'Certo', 'Embargos são comuns em relatórios, pesquisas e anúncios, mas devem ser avaliados editorialmente.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Produção da Notícia',
    text: `[Produção da Notícia] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Produção da Notícia'
  })),
  ...[
    ['A chamada de capa deve atrair o leitor sem falsear o conteúdo da matéria.', 'Certo', 'Chamadas eficazes são sintéticas e atrativas, mas precisam manter fidelidade ao texto.'],
    ['A manchete é o título de maior destaque em uma edição ou página.', 'Certo', 'Ela hierarquiza a notícia considerada principal pelo veículo naquele espaço editorial.'],
    ['O título jornalístico deve sempre ser enigmático, mesmo que reduza a compreensão imediata do fato.', 'Errado', 'Títulos informativos valorizam clareza, precisão e relevância.'],
    ['A legenda contextualiza imagem, identifica elementos relevantes e pode acrescentar informação jornalística.', 'Certo', 'Legenda não é mera decoração: ajuda o leitor a compreender foto, gráfico ou ilustração.'],
    ['O box é recurso editorial usado para destacar informação complementar, serviço, cronologia, dados ou contexto.', 'Certo', 'Boxes organizam conteúdos laterais e facilitam leitura escaneável.'],
    ['A entrevista em formato pingue-pongue preserva a sequência de perguntas e respostas.', 'Certo', 'Esse formato evidencia a fala do entrevistado e a condução do entrevistador.'],
    ['O comentário é gênero opinativo que interpreta fatos e apresenta avaliação do comentarista.', 'Certo', 'Diferente da notícia, o comentário explicita análise e ponto de vista.'],
    ['A coluna é espaço periódico, geralmente assinado, com estilo e recorte temático próprios.', 'Certo', 'Colunas criam vínculo de autoria e regularidade com o público.'],
    ['A crítica cultural avalia obras, espetáculos ou produtos culturais com critérios argumentativos.', 'Certo', 'Ela combina informação, repertório e julgamento fundamentado.'],
    ['A reportagem investigativa limita-se a reproduzir releases enviados por assessorias.', 'Errado', 'Ela exige apuração autônoma, documentos, fontes diversas e verificação rigorosa.'],
    ['O obituário jornalístico pode informar a morte de uma pessoa e contextualizar sua trajetória pública.', 'Certo', 'O gênero registra falecimento e relevância social, profissional ou histórica da personagem.'],
    ['O serviço jornalístico oferece informação útil ao público, como horários, documentos exigidos, prazos e orientações.', 'Certo', 'É gênero voltado à utilidade prática e ao acesso a direitos ou atividades.'],
    ['A errata reconhece e corrige erro publicado anteriormente pelo veículo.', 'Certo', 'A correção transparente preserva credibilidade e responsabilidade editorial.'],
    ['O infográfico jornalístico organiza visualmente dados, processos ou comparações para facilitar compreensão.', 'Certo', 'Infográficos combinam informação, visualização e síntese.'],
    ['O podcast jornalístico é necessariamente opinativo e não pode assumir formato informativo.', 'Errado', 'Podcasts podem ser noticiosos, investigativos, explicativos, narrativos, opinativos ou de entrevista.'],
    ['A newsletter jornalística pode funcionar como curadoria periódica de conteúdos e relacionamento com leitores.', 'Certo', 'Newsletters organizam seleção editorial e fortalecem vínculo direto com a audiência.'],
    ['A nota oficial é texto institucional que apresenta posição formal de uma organização sobre determinado fato.', 'Certo', 'Ela expressa posicionamento autorizado e deve ser clara, objetiva e verificável.'],
    ['A fotolegenda combina imagem e texto curto, podendo constituir unidade informativa autônoma.', 'Certo', 'Em alguns casos, foto e legenda bastam para transmitir o núcleo informativo.'],
    ['A análise jornalística busca explicar causas, consequências e conexões de um fato, sem se confundir com boato ou especulação livre.', 'Certo', 'A análise deve se apoiar em dados, contexto e conhecimento especializado.'],
    ['O dossiê jornalístico reúne materiais e informações sobre tema complexo para organizar compreensão aprofundada.', 'Certo', 'Dossiês sistematizam histórico, documentos, personagens, dados e contexto.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Gêneros Jornalísticos',
    text: `[Gêneros Jornalísticos] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Gêneros Jornalísticos'
  })),
  ...[
    ['A comunicação institucional deve alinhar discurso público, identidade organizacional e práticas efetivas da instituição.', 'Certo', 'Reputação depende de coerência entre o que a organização diz e o que faz.'],
    ['A comunicação interna é irrelevante para a imagem institucional, pois não afeta públicos externos.', 'Errado', 'Colaboradores também são públicos estratégicos e influenciam clima, reputação e atendimento.'],
    ['Público interno pode incluir servidores, empregados, terceirizados, estagiários e gestores.', 'Certo', 'São grupos que vivenciam diretamente a rotina e a cultura organizacional.'],
    ['Público externo pode incluir imprensa, sociedade, comunidade científica, fornecedores, governo, usuários e entidades parceiras.', 'Certo', 'A organização se relaciona com múltiplos públicos fora de sua estrutura interna.'],
    ['O assessor deve preparar porta-vozes, organizar informações e orientar relacionamento com a imprensa.', 'Certo', 'Esse papel combina técnica jornalística, estratégia institucional e responsabilidade informativa.'],
    ['Assessoria pública pode promover pessoalmente autoridades em peças oficiais sem violar impessoalidade.', 'Errado', 'Comunicação pública deve focar políticas, serviços e interesse coletivo, não culto pessoal a gestores.'],
    ['Media training prepara fontes para entrevistas, coletivas e situações de crise.', 'Certo', 'O treinamento reduz improviso, melhora clareza e ajuda o porta-voz a respeitar limites institucionais.'],
    ['Plano de comunicação define objetivos, públicos, mensagens, canais, cronograma, responsáveis e indicadores.', 'Certo', 'Planejamento evita ações dispersas e permite avaliação de resultados.'],
    ['Gestão de crise exige rapidez, transparência possível, centralização de informações e monitoramento de repercussão.', 'Certo', 'Crises mal comunicadas ampliam boatos e danos reputacionais.'],
    ['A comunicação organizacional integrada busca coerência entre canais internos, externos, administrativos e digitais.', 'Certo', 'Integração reduz ruídos e fortalece consistência institucional.'],
    ['Endomarketing e comunicação interna são sinônimos perfeitos em qualquer contexto acadêmico.', 'Errado', 'Endomarketing é uma vertente voltada a engajamento interno; comunicação interna é campo mais amplo.'],
    ['A identidade institucional reúne elementos como missão, valores, linguagem, símbolos, conduta e posicionamento.', 'Certo', 'Identidade não se resume a logotipo; inclui modos de agir e se apresentar.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Jornalismo Institucional',
    text: `[Jornalismo Institucional] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Jornalismo Institucional'
  })),
  ...[
    ['Newsletter institucional pode ser enviada periodicamente para informar públicos sobre ações, editais, resultados e serviços.', 'Certo', 'Ela organiza comunicação recorrente e segmentada com públicos de interesse.'],
    ['Boletim é produto informativo geralmente breve, periódico e voltado à atualização objetiva de determinado público.', 'Certo', 'Boletins servem para comunicações rápidas, séries temáticas e acompanhamento de ações.'],
    ['Relatório institucional pode apresentar atividades, indicadores, resultados e prestação de contas.', 'Certo', 'Relatórios documentam desempenho e apoiam transparência e memória organizacional.'],
    ['Press kit deve conter apenas brindes promocionais, sem documentos ou informações jornalísticas.', 'Errado', 'O press kit deve priorizar material informativo útil à cobertura.'],
    ['Mailing eficiente deve ser segmentado por editoria, veículo, localização, interesse e atualização dos contatos.', 'Certo', 'Segmentação evita envio inadequado e melhora relacionamento com jornalistas.'],
    ['Clipping analítico pode ir além da coleta de links, avaliando tom, alcance, temas e veículos.', 'Certo', 'A análise qualifica o monitoramento e subsidia decisões de comunicação.'],
    ['Release sem informação nova, sem interesse público e com excesso de autopromoção tende a ter baixo aproveitamento jornalístico.', 'Certo', 'Redações priorizam relevância, novidade e utilidade para seu público.'],
    ['House organ deve obrigatoriamente circular em papel, sendo incompatível com intranet e formatos digitais.', 'Errado', 'O produto pode ser impresso ou digital, conforme estratégia e público.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Produtos de Assessoria',
    text: `[Produtos de Assessoria] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Produtos de Assessoria'
  })),
  ...[
    ['Interesse público não se confunde automaticamente com curiosidade pública.', 'Certo', 'Nem tudo que desperta curiosidade tem relevância social, coletiva ou cidadã.'],
    ['Comunicação pública deve facilitar acesso a direitos, serviços, políticas, dados e canais de participação.', 'Certo', 'Seu foco é cidadania e utilidade coletiva.'],
    ['Transparência passiva ocorre quando o órgão responde a pedido específico de informação feito pelo cidadão.', 'Certo', 'Ela complementa a transparência ativa prevista pela LAI.'],
    ['Prestação de contas fortalece controle social ao tornar compreensíveis gastos, resultados e decisões públicas.', 'Certo', 'Accountability depende de informação acessível, tempestiva e verificável.'],
    ['Linguagem cidadã elimina precisão técnica; por isso deve ser evitada em órgãos públicos.', 'Errado', 'Clareza não elimina precisão: traduz o necessário sem burocratês desnecessário.'],
    ['Comunicação governamental e comunicação pública são sempre idênticas, pois ambas servem exclusivamente ao governante eleito.', 'Errado', 'Comunicação pública serve ao cidadão e ao Estado; comunicação governamental pode estar ligada à gestão, mas deve respeitar limites legais.'],
    ['A publicidade institucional pública deve ter caráter educativo, informativo ou de orientação social.', 'Certo', 'A Constituição veda promoção pessoal em publicidade oficial.'],
    ['Dados abertos favorecem transparência, reutilização social da informação e controle público.', 'Certo', 'Quando publicados em formato acessível e reutilizável, ampliam fiscalização e inovação cívica.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Comunicação Pública',
    text: `[Comunicação Pública] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Comunicação Pública'
  })),
  ...[
    ['Justificação total alinha o texto às margens esquerda e direita, podendo exigir cuidado com espaçamentos excessivos.', 'Certo', 'Textos justificados podem gerar rios tipográficos se a composição não for bem ajustada.'],
    ['Alinhamento à esquerda costuma favorecer leitura contínua por manter espaçamento regular entre palavras.', 'Certo', 'É solução comum em telas e textos longos pela previsibilidade visual.'],
    ['Hierarquia visual orienta o leitor por meio de tamanho, peso, posição, contraste e espaçamento dos elementos.', 'Certo', 'A página precisa indicar o que é mais importante e como a leitura deve avançar.'],
    ['Editoração é o processo de organizar tecnicamente textos e elementos visuais para publicação.', 'Certo', 'Inclui preparação, composição, revisão, fechamento e adequação ao suporte.'],
    ['Grid editorial é uma estrutura invisível que ajuda a alinhar colunas, imagens, títulos e espaços.', 'Certo', 'O grid garante consistência e facilita o trabalho de diagramação.'],
    ['Entrelinha, corpo, família tipográfica e contraste afetam diretamente a legibilidade.', 'Certo', 'Escolhas tipográficas inadequadas dificultam leitura e compreensão.'],
    ['Preparação de originais dispensa conferência de nomes próprios, siglas e padronização textual.', 'Errado', 'Esses elementos precisam ser revisados para evitar inconsistências e erros.'],
    ['Diagramação jornalística deve equilibrar informação, leitura, ritmo visual e identidade do veículo.', 'Certo', 'Não é apenas estética; é organização funcional da informação.'],
    ['Margens e brancos são desperdícios de espaço e devem ser eliminados em projetos gráficos profissionais.', 'Errado', 'Espaços em branco ajudam respiração visual, hierarquia e legibilidade.'],
    ['Tipografia decorativa pode prejudicar textos longos quando compromete legibilidade.', 'Certo', 'Fontes ornamentais podem funcionar em títulos, mas raramente são adequadas ao corpo do texto.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Editoração e Projeto Gráfico',
    text: `[Editoração e Projeto Gráfico] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Editoração e Projeto Gráfico'
  })),
  ...[
    ['Engajamento pode incluir curtidas, comentários, compartilhamentos, salvamentos, respostas e outras interações.', 'Certo', 'A métrica indica reação ativa do público ao conteúdo.'],
    ['Impressões sempre equivalem ao número de pessoas únicas alcançadas.', 'Errado', 'Impressões contam exibições totais; uma mesma pessoa pode gerar várias.'],
    ['Taxa de conversão relaciona conversões ao universo de usuários impactados ou visitantes de uma ação.', 'Certo', 'Ela avalia eficiência da comunicação para gerar comportamento desejado.'],
    ['Métricas de vaidade, como curtidas isoladas, podem ser insuficientes para avaliar objetivos estratégicos.', 'Certo', 'Indicadores precisam ser interpretados conforme meta, público e contexto.'],
    ['CTR baixo pode indicar problema de chamada, segmentação, criativo, oferta ou adequação ao público.', 'Certo', 'A taxa de cliques ajuda a diagnosticar atratividade e pertinência.'],
    ['KPI deve ser definido depois da campanha apenas para escolher o número que parece melhor.', 'Errado', 'Indicadores-chave devem ser planejados antes, com metas e critérios claros.'],
    ['SEO jornalístico busca melhorar encontrabilidade sem abandonar clareza, relevância e responsabilidade editorial.', 'Certo', 'Otimizar para busca não deve gerar títulos enganosos ou empobrecimento informativo.'],
    ['Analytics digital substitui completamente julgamento editorial e interesse público.', 'Errado', 'Dados ajudam decisões, mas não eliminam critérios jornalísticos e responsabilidade social.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'Comunicação Digital',
    text: `[Comunicação Digital] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'Comunicação Digital'
  })),
  ...[
    ['A LAI prevê prazos máximos de sigilo para informações reservadas, secretas e ultrassecretas.', 'Certo', 'A classificação de sigilo é excepcional e temporalmente limitada.'],
    ['O pedido de acesso à informação não precisa apresentar justificativa do motivo da solicitação.', 'Certo', 'O direito de acesso independe de demonstração de interesse específico pelo solicitante.'],
    ['A LGPD protege apenas dados digitais, excluindo documentos físicos com dados pessoais.', 'Errado', 'A lei se aplica a tratamento de dados pessoais em meios físicos ou digitais, quando presentes seus requisitos.'],
    ['Controlador é quem toma decisões referentes ao tratamento de dados pessoais.', 'Certo', 'O operador realiza o tratamento em nome do controlador.'],
    ['Anonimização busca impedir a associação direta ou indireta de dado a um indivíduo, observados meios técnicos razoáveis.', 'Certo', 'Dados anonimizados corretamente deixam de identificar o titular de modo razoável.'],
    ['Consentimento é a única base legal possível para tratamento de dados pessoais.', 'Errado', 'A LGPD prevê várias bases legais, como obrigação legal, execução de políticas públicas e legítimo interesse, conforme o caso.'],
    ['Tratamento de dados pelo poder público deve observar finalidade pública e transparência.', 'Certo', 'Órgãos públicos precisam informar hipóteses e finalidades de uso dos dados.'],
    ['Dados pessoais de crianças e adolescentes exigem atenção especial ao melhor interesse desse público.', 'Certo', 'A LGPD dedica proteção específica a crianças e adolescentes.'],
    ['A LAI autoriza negar qualquer pedido de informação apenas porque o tema pode gerar crítica ao órgão.', 'Errado', 'Crítica pública não é fundamento legal para negar acesso.'],
    ['Encarregado de dados atua como canal de comunicação entre controlador, titulares e autoridade nacional.', 'Certo', 'É função prevista na governança de proteção de dados.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'LAI e LGPD',
    text: `[LAI e LGPD] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'LAI e LGPD'
  })),
  ...[
    ['Ambientes de inovação incluem espaços e arranjos que estimulam interação entre empreendedores, ICTs, governo, investidores e sociedade.', 'Certo', 'Parques tecnológicos, incubadoras, hubs e laboratórios vivos são exemplos de estruturas de apoio.'],
    ['Inteligência tecnológica monitora informações científicas, mercadológicas, patentárias e competitivas para apoiar decisões estratégicas.', 'Certo', 'Ela transforma sinais dispersos em conhecimento útil para inovação.'],
    ['Mapas tecnológicos podem revelar tendências de pesquisa, competidores, lacunas e oportunidades de desenvolvimento.', 'Certo', 'A análise sistemática de dados ajuda a orientar investimentos e parcerias.'],
    ['Redes de pesquisa são sempre informais e incompatíveis com financiamento público.', 'Errado', 'Redes podem ser formais, financiadas e estratégicas para cooperação científica.'],
    ['Universidades exercem papel central na formação de recursos humanos e produção de conhecimento científico.', 'Certo', 'Elas são atores fundamentais em sistemas de CT&I.'],
    ['ICTs públicas podem interagir com empresas em projetos de P&D, respeitando regras legais e institucionais.', 'Certo', 'O marco legal estimula cooperação para inovação e transferência tecnológica.'],
    ['Incubadoras e aceleradoras são idênticas quanto a estágio, duração e objetivo de apoio aos empreendimentos.', 'Errado', 'Incubadoras tendem a apoiar fases iniciais e estruturantes; aceleradoras focam tração e escala em ciclos intensivos.'],
    ['Living labs valorizam cocriação com usuários em ambientes reais de uso.', 'Certo', 'A participação do usuário ajuda a testar soluções em condições próximas da realidade.'],
    ['Bibliometria pode mapear colaboração científica por coautoria e redes institucionais.', 'Certo', 'Relações de coautoria revelam conexões entre pesquisadores, grupos e instituições.'],
    ['O fator de impacto deve ser usado com cautela, pois não mede sozinho a qualidade de uma pesquisa.', 'Certo', 'Métricas quantitativas precisam ser combinadas com avaliação qualitativa.'],
    ['Prospecção tecnológica é voltada exclusivamente a prever com certeza absoluta quais tecnologias vencerão no futuro.', 'Errado', 'Ela trabalha cenários, tendências e incertezas, não certezas absolutas.'],
    ['A hélice tríplice pode ser ampliada em modelos que incluem sociedade civil e meio ambiente em debates sobre inovação.', 'Certo', 'Modelos de quádrupla e quíntupla hélice expandem a análise para outros atores e dimensões.'],
    ['Patentes podem servir como fonte para inteligência e prospecção tecnológica.', 'Certo', 'Bases patentárias revelam trajetórias técnicas, competidores e áreas de investimento.'],
    ['Sistemas regionais de inovação consideram capacidades locais, instituições, políticas e vocações produtivas de determinado território.', 'Certo', 'A inovação tem forte dimensão territorial e institucional.'],
    ['Transferência de tecnologia envolve mecanismos como licenciamento, cooperação, contratos, spin-offs e compartilhamento de conhecimento.', 'Certo', 'É processo de passagem de conhecimento científico ou técnico para aplicação social ou produtiva.']
  ].map(([assertion, correct, explanation]) => ({
    category: 'CT&I',
    text: `[CT&I] ${assertion}`,
    correct: correct as 'Certo' | 'Errado',
    explanation,
    reference: 'CT&I'
  }))
];

const categories = [
  'Teoria da Comunicação',
  'Técnicas de Redação',
  'Assessoria de Imprensa',
  'Jornalismo Digital',
  'Marco Legal de CT&I',
  'Divulgação Científica',
  'Ética e Compliance'
];

interface Template {
  text: string;
  correct: 'Certo' | 'Errado';
  explanation: string;
  reference: string;
}

// Generate templates for each category
const getTemplatesForCategory = (category: string, index: number): Template => {
  const t = index % 10;
  switch (category) {
    case 'Teoria da Comunicação':
      if (t === 0) return {
        text: `Considerando uma cobertura em que diferentes veículos relatam o mesmo fato com recortes distintos, a teoria do enquadramento explica que a seleção e a ênfase de determinados aspectos tendem a orientar interpretações específicas do público.`,
        correct: 'Certo',
        explanation: 'O enquadramento trata exatamente do recorte temático e contextual que define a perspectiva pela qual a notícia será consumida, direcionando o julgamento do leitor.',
        reference: 'Teoria do Enquadramento (Framing)'
      };
      if (t === 1) return {
        text: `Acerca da formação da opinião pública, a espiral do silêncio ajuda a explicar por que indivíduos tendem a silenciar posições percebidas como minoritárias, em razão do receio de isolamento social.`,
        correct: 'Certo',
        explanation: 'Desenvolvida por Elisabeth Noelle-Neumann, essa teoria explica como a percepção do clima de opinião molda a disposição dos sujeitos de expressar suas convicções.',
        reference: 'Espiral do Silêncio'
      };
      if (t === 2) return {
        text: `Sob a ótica da teoria dos efeitos limitados, a mídia exerce influência direta, homogênea e independente de mediações interpessoais, razão pela qual líderes de opinião têm papel irrelevante na circulação das mensagens.`,
        correct: 'Errado',
        explanation: 'Incorreto. A Teoria dos Efeitos Limitados (Laxarsfeld et al.) defende que a influência da mídia é mediada por relações interpessoais e líderes de opinião (Two-step flow), não sendo direta nem absoluta.',
        reference: 'Teoria dos Efeitos Limitados'
      };
      if (t === 3) return {
        text: `À luz da teoria crítica, o conceito de indústria cultural está associado à padronização mercantil da cultura e à sua circulação como produto voltado ao consumo massificado.`,
        correct: 'Certo',
        explanation: 'Para a teoria crítica alemã, a produção cultural de massa industrializada atua como instrumento de alienação e manutenção do status quo socioeconômico.',
        reference: 'Escola de Frankfurt / Indústria Cultural'
      };
      if (t === 4) return {
        text: `No contexto da produção cotidiana da notícia, a perspectiva do newsmaking enfatiza que valores-notícia e decisões editoriais são atravessados por rotinas organizacionais, prazos e limitações materiais da redação.`,
        correct: 'Certo',
        explanation: 'O Newsmaking estuda a construção da notícia sob a ótica do processo fabril das redações, onde restrições de tempo, pessoal e infraestrutura determinam a pauta.',
        reference: 'Teoria do Newsmaking'
      };
      if (t === 5) return {
        text: `Na formulação clássica da teoria hipodérmica, a mensagem midiática é concebida como capaz de atingir um público passivo de maneira direta e uniforme.`,
        correct: 'Certo',
        explanation: 'Esta teoria clássica do início do século XX atribuía aos meios de comunicação um poder absoluto e direto de persuasão e controle de comportamento das massas.',
        reference: 'Teoria Hipodérmica'
      };
      if (t === 6) return {
        text: `Considerando as transformações tecnológicas e organizacionais do jornalismo, os critérios de noticiabilidade permanecem estáveis e universais, sem alteração relevante entre contextos históricos ou suportes distintos.`,
        correct: 'Errado',
        explanation: 'Errado. Os critérios de noticiabilidade são dinâmicos, históricos e mudam conforme as tecnologias, a cultura organizacional das redações e o comportamento do público leitor.',
        reference: 'Critérios de Noticiabilidade'
      };
      if (t === 7) return {
        text: `No modelo de Lasswell, a análise do processo comunicacional pode ser organizada a partir das perguntas sobre emissor, mensagem, canal, destinatário e efeito.`,
        correct: 'Certo',
        explanation: 'A fórmula de Harold Lasswell estruturou os campos clássicos de estudo da comunicação de massa: emissor, conteúdo, meio, receptor e impacto.',
        reference: 'Modelo de Lasswell'
      };
      if (t === 8) return {
        text: `Acerca da semiótica peirceana, a distinção entre ícone, índice e símbolo decorre do tipo de relação estabelecida entre o signo e o objeto a que ele remete.`,
        correct: 'Certo',
        explanation: 'Correto. Ícones guardam semelhança física com o objeto; índices apontam ou evidenciam uma relação física direta; símbolos dependem de uma convenção cultural estabelecida.',
        reference: 'Semiótica Peirceana'
      };
      return {
        text: `Sob a perspectiva de Pierre Lévy, a cibercultura diz respeito às transformações nas formas de interação, circulação de conhecimento e sociabilidade decorrentes da expansão do ciberespaço.`,
        correct: 'Certo',
        explanation: 'Lévy discute como a inteligência coletiva e o ciberespaço reorganizam as formas de produção de conhecimento, arte, sociabilidade e cidadania.',
        reference: 'Cibercultura - Pierre Lévy'
      };

    case 'Técnicas de Redação':
      if (t === 0) return {
        text: `A técnica de redação jornalística prescreve o uso predominante da ordem indireta de orações, priorizando adjetivações expressivas e uso abundante de voz passiva para conferir neutralidade ao relato.`,
        correct: 'Errado',
        explanation: 'Incorreto. A redação jornalística informativa prega a clareza e concisão, que são alcançadas pela ordem direta (sujeito-verbo-complemento), voz ativa e adjetivação econômica ou nula.',
        reference: 'Estrutura da Frase Jornalística'
      };
      if (t === 1) return {
        text: `Na redação de rádio (radiojornalismo), recomenda-se a construção de frases curtas, em ordem direta, e a repetição pontual de informações cruciais (como nomes e dados) para suprir o caráter efêmero do som.`,
        correct: 'Certo',
        explanation: 'Como o áudio é consumido em tempo real e não permite releitura imediata, o texto radiofônico deve ser extremamente coloquial, rítmico e inteligível de imediato.',
        reference: 'Técnicas de Radiojornalismo'
      };
      if (t === 2) return {
        text: `O "sub-lead" (ou linha fina) é o texto curto posicionado imediatamente acima ou abaixo do título principal da notícia, servindo para complementar o título sem repetir os dados do lead.`,
        correct: 'Certo',
        explanation: 'A linha fina enriquece o título, atraindo o leitor ao antecipar algum elemento noticioso relevante e contextual sem esvaziar o primeiro parágrafo.',
        reference: 'Estrutura do Texto Jornalístico'
      };
      if (t === 3) return {
        text: `Os gêneros jornalísticos informativos (como nota e notícia) focam na exposição objetiva de fatos atuais, ao passo que os opinativos (como editorial, crônica e artigo) manifestam julgamento de valor do autor ou do veículo.`,
        correct: 'Certo',
        explanation: 'Esta é a classificação clássica das técnicas de redação que segmenta o jornalismo em gêneros informativos, opinativos, interpretativos e utilitários.',
        reference: 'Gêneros Jornalísticos'
      };
      if (t === 4) return {
        text: `O lead de uma notícia institucional de assessoria pública deve, necessariamente, focar na exaltação personalista das autoridades políticas em vez do impacto prático da política pública realizada.`,
        correct: 'Errado',
        explanation: 'Errado. O jornalismo público institucional pauta-se pelo princípio constitucional da impessoalidade. O foco deve estar no benefício social e factual do serviço de pesquisa, fomento ou utilidade pública, e não na promoção pessoal de gestores.',
        reference: 'Redação Jornalística Pública'
      };
      if (t === 5) return {
        text: `A técnica de redação para TV (telejornalismo) exige perfeita sincronia entre texto falado (locução) e imagens exibidas (vídeo), evitando que a fala descreva exatamente o que a tela já mostra de forma redundante.`,
        correct: 'Certo',
        explanation: 'No telejornalismo, texto e imagem devem ser complementares. O texto traz as causas, dados abstratos e contexto, enquanto o vídeo materializa a cena descrita.',
        reference: 'Técnicas de Telejornalismo'
      };
      if (t === 6) return {
        text: `A reportagem difere da notícia simples por apresentar maior profundidade analítica, diversidade de fontes, dados históricos, infográficos e contextualização ampla do fato enfocado.`,
        correct: 'Certo',
        explanation: 'A notícia é factual, imediata e objetiva (hard news). A reportagem reconstrói o processo, as causas e os impactos do fato com fôlego narrativo e investigação detalhada.',
        reference: 'Notícia vs. Reportagem'
      };
      if (t === 7) return {
        text: `Na técnica de entrevista jornalística, o profissional deve evitar perguntas abertas, formulando apenas inquirições fechadas de sim ou não para garantir o controle absoluto das respostas do entrevistado.`,
        correct: 'Errado',
        explanation: 'Errado. Perguntas abertas ("Como?", "Por quê?", "Quais os impactos?") são fundamentais para obter declarações ricas, explicativas e aprofundadas do entrevistado. Perguntas de sim/não limitam o depoimento.',
        reference: 'Técnicas de Entrevista'
      };
      if (t === 8) return {
        text: `A reescrita de textos jornalísticos no processo de edição (copidesque) visa corrigir erros de gramática, eliminar excessos estilísticos, clarear a linguagem e adequar o material ao espaço físico e linha editorial.`,
        correct: 'Certo',
        explanation: 'O profissional de copidesque (subeditor/redator) limpa o texto de clichês, redundâncias e jargões para torná-lo atraente, fluido e rigoroso.',
        reference: 'Edição e Copidesque'
      };
      return {
        text: `O conceito de "linguagem cidadã" no jornalismo público visa simplificar o jargão técnico-burocrático do Estado para garantir que o cidadão de qualquer nível de instrução compreenda seus direitos e serviços propostos.`,
        correct: 'Certo',
        explanation: 'A linguagem cidadã assegura a inclusão e a transparência pública, transformando termos jurídicos e administrativos densos em informações claras e acessíveis a todos.',
        reference: 'Linguagem Cidadã e Acessibilidade'
      };

    case 'Assessoria de Imprensa':
      if (t === 0) return {
        text: `No contexto da comunicação institucional, a assessoria de imprensa atua legitimamente quando restringe o acesso da imprensa a fatos desfavoráveis, de modo a preservar a imagem do assessorado acima do dever de informação.`,
        correct: 'Errado',
        explanation: 'Errado. A assessoria moderna atua na construção de pontes transparentes de informação. Tentar blindar sistematicamente dados desfavoráveis gera ruído, quebra a credibilidade da fonte e amplifica crises.',
        reference: 'Atuação da Assessoria de Imprensa'
      };
      if (t === 1) return {
        text: `Acerca da produção de release, a adoção de linguagem jornalística, com título informativo, lide e identificação clara da fonte, tende a facilitar o aproveitamento editorial do material enviado à imprensa.`,
        correct: 'Certo',
        explanation: 'Ao entregar um texto pronto que respeita os critérios e o formato profissional das redações, o assessor aumenta expressivamente as chances de publicação de forma espontânea.',
        reference: 'Press Release'
      };
      if (t === 2) return {
        text: `Sob a ótica do relacionamento com a imprensa, a entrevista coletiva deve ser priorizada mesmo em anúncios rotineiros e de baixo impacto, porque sua repetição frequente fortalece automaticamente o vínculo com os repórteres.`,
        correct: 'Errado',
        explanation: 'Errado. Coletivas devem ser reservadas para anúncios de altíssima relevância e interesse público geral, ou gerenciamento de crises agudas. Convocá-las de forma indiscriminada esvazia o evento e irrita os jornalistas.',
        reference: 'Coletivas de Imprensa'
      };
      if (t === 3) return {
        text: `No trabalho da assessoria, o clipping funciona como instrumento de monitoramento da presença institucional na mídia e de apoio à avaliação de imagem e de repercussão.`,
        correct: 'Certo',
        explanation: 'O monitoramento de menções (clipping) permite à gestão avaliar a recepção pública de suas ações, identificar críticas urgentes e calibrar a comunicação governamental.',
        reference: 'Clipping / Clipagem'
      };
      if (t === 4) return {
        text: `Considerando a gestão de contatos com veículos, um mailing eficiente pressupõe segmentação por editoria, atualização periódica e adequação entre pauta enviada e perfil do jornalista destinatário.`,
        correct: 'Certo',
        explanation: 'Mailing segmentado garante precisão. Enviar pautas de ciência para editores de esporte compromete o prestígio da assessoria junto à redação e caracteriza desperdício de esforço.',
        reference: 'Gestão de Mailing'
      };
      if (t === 5) return {
        text: `Em situações de crise reputacional, a centralização do fluxo informativo em porta-voz preparado e o uso de mensagens consistentes tendem a reduzir ruídos e especulações.`,
        correct: 'Certo',
        explanation: 'Centralizar a informação e responder com agilidade técnica e honestidade é a regra máxima das crises de imagem pública corporativa ou governamental.',
        reference: 'Gerenciamento de Crises de Imagem'
      };
      if (t === 6) return {
        text: `No âmbito da comunicação interna, o house organ pode ser utilizado para divulgar informações institucionais, reforçar a cultura organizacional e aproximar a gestão de seus públicos internos.`,
        correct: 'Certo',
        explanation: 'Os house organs são canais estratégicos voltados para a comunicação interna (endomarketing), promovendo diálogo dentro do corpo funcional.',
        reference: 'House Organs / Comunicação Interna'
      };
      if (t === 7) return {
        text: `No caso de órgão público estadual com atuação territorialmente delimitada, a priorização de veículos locais pode ser compatível com a lógica de prestação de contas e de comunicação com os públicos diretamente afetados.`,
        correct: 'Certo',
        explanation: 'Como fundação estadual de Alagoas, a divulgação do fomento local na imprensa de Alagoas é crucial para dar visibilidade aos investimentos e beneficiar a população do estado.',
        reference: 'Comunicação Pública Estadual'
      };
      if (t === 8) return {
        text: `No media training, a simulação de entrevistas sob pressão pode auxiliar o porta-voz a responder com maior clareza, manter foco temático e lidar melhor com questionamentos adversos.`,
        correct: 'Certo',
        explanation: 'O treinamento prático sob pressão habitua o porta-voz às armadilhas retóricas dos repórteres, resguardando a integridade das informações prestadas pela instituição.',
        reference: 'Simulação no Media Training'
      };
      return {
        text: `À luz da convergência comunicacional, é compatível com a atuação contemporânea da assessoria a produção integrada de conteúdos destinados tanto à imprensa quanto aos canais digitais próprios da instituição.`,
        correct: 'Certo',
        explanation: 'A convergência midiática exige que a comunicação pública atue de forma integrada e multiplataforma, ampliando o alcance das ações de transparência.',
        reference: 'Assessoria de Imprensa Integrada'
      };

    case 'Jornalismo Digital':
      if (t === 0) return {
        text: `A "hipertextualidade" no webjornalismo refere-se à possibilidade de estruturar narrativas com links internos e externos, permitindo caminhos personalizados e não lineares de leitura.`,
        correct: 'Certo',
        explanation: 'O hipertexto rompe o fluxo linear obrigado da escrita tradicional, enriquecendo o repertório de navegação e aprofundamento do internauta.',
        reference: 'Hipertextualidade e Leitura'
      };
      if (t === 1) return {
        text: `O jornalismo de dados fundamenta-se na obtenção, limpeza, filtragem e análise visual de grandes volumes de informações públicas, utilizando programação e ferramentas estatísticas para revelar histórias de interesse público.`,
        correct: 'Certo',
        explanation: 'Essa modalidade de jornalismo investigativo digital extrai pautas de bases de dados complexas, traduzindo números brutos em narrativas interativas e legíveis.',
        reference: 'Jornalismo de Dados (Data Journalism)'
      };
      if (t === 2) return {
        text: `A prática de "fact-checking" (verificação de fatos) consolidou-se na web por meio de agências especializadas que usam critérios transparentes de investigação documental para catalogar declarações públicas em graus de veracidade.`,
        correct: 'Certo',
        explanation: 'O fact-checking combate a desinformação sistêmica verificando alegações de políticos e boatos de redes contra estatísticas, leis e registros oficiais.',
        reference: 'Fact-checking e Combate a Desinformação'
      };
      if (t === 3) return {
        text: `A redação voltada para SEO recomenda o uso do atributo "alt" em imagens das matérias para descrever textualmente a cena, o que facilita a indexação no Google Imagens e garante acessibilidade a leitores de tela.`,
        correct: 'Certo',
        explanation: 'A descrição alternativa de imagens cumpre uma função dupla vital na web moderna: otimização algorítmica de busca (SEO) e inclusão digital de deficientes visuais.',
        reference: 'SEO e Acessibilidade Digital'
      };
      if (t === 4) return {
        text: `No jornalismo digital, a velocidade de atualização ("furo online") deve sempre se sobrepor à checagem e verificação da informação, sendo aceitável publicar boatos para garantir o primeiro lugar nas buscas.`,
        correct: 'Errado',
        explanation: 'Errado. O rigor e a credibilidade factual continuam sendo o maior ativo do jornalismo profissional. Publicar boatos sem checagem para ganhar velocidade corrói a reputação da marca e propaga desinformação.',
        reference: 'Velocidade vs. Credibilidade Digital'
      };
      if (t === 5) return {
        text: `O design responsivo é opcional nos portais de notícias na atualidade, visto que a imensa maioria dos internautas consome informação jornalística exclusivamente através de computadores desktop robustos.`,
        correct: 'Errado',
        explanation: 'Incorreto. O tráfego móvel (smartphones e tablets) representa a maioria esmagadora do consumo de notícias digitais. O design responsivo é mandatório para assegurar legibilidade em qualquer tela.',
        reference: 'Usabilidade e Mobile News'
      };
      if (t === 6) return {
        text: `A interatividade no webjornalismo permite que o leitor atue não apenas como receptor passivo, mas participe ativamente por meio de comentários, enquetes, fóruns de discussão e envio de pautas colaborativas.`,
        correct: 'Certo',
        explanation: 'A comunicação em rede fomenta a descentralização do poder de emissão, abrindo canais diretos para a participação ativa do usuário nas instâncias da produção jornalística.',
        reference: 'Interatividade e Participação'
      };
      if (t === 7) return {
        text: `Métricas de engajamento na web (como taxa de rejeição, tempo de permanência na página e compartilhamentos) auxiliam editores a mensurar qualitativamente o interesse e a relevância de suas matérias de fôlego.`,
        correct: 'Certo',
        explanation: 'O monitoramento de tráfego e comportamento do leitor fornece dados objetivos sobre quais formatos e temas capturam genuinamente o interesse do público.',
        reference: 'Métricas de Tráfego Web'
      };
      if (t === 8) return {
        text: `As mídias sociais devem ser exploradas pelos órgãos de fomento à pesquisa apenas de forma unidirecional, bloqueando comentários de usuários para blindar a imagem de gestores estaduais de qualquer interatividade.`,
        correct: 'Errado',
        explanation: 'Errado. A comunicação governamental democrática em mídias sociais deve incentivar a participação social de forma bidirecional, prestando esclarecimentos e acolhendo feedbacks respeitosos, o que enriquece a cidadania digital.',
        reference: 'Comunicação Pública em Redes Sociais'
      };
      return {
        text: `O conceito de "convergência jornalística" abrange a integração de redações (impressa, web e audiovisual) e a cooperação profissional para produzir narrativas que exploram as linguagens específicas de cada suporte.`,
        correct: 'Certo',
        explanation: 'A convergência midiática exige que o profissional planeje matérias de forma integrada, cruzando texto, vídeo, som, bases de dados e infográficos de maneira sinérgica.',
        reference: 'Convergência Midiática'
      };

    case 'Marco Legal de CT&I':
      if (t === 0) return {
        text: `À luz do Marco Legal de CT&I, as ICTs públicas podem participar de arranjos cooperativos com empresas e autorizar a atuação de pesquisadores em projetos de inovação, desde que observadas as condições legais e institucionais aplicáveis.`,
        correct: 'Certo',
        explanation: 'O Marco Legal de CT&I estimula a aproximação entre universidade pública e empresas privadas para transferir e aplicar conhecimento científico na geração de inovações reais.',
        reference: 'Lei Federal nº 13.243/2016'
      };
      if (t === 1) return {
        text: `No contexto dos instrumentos públicos de fomento à inovação, a subvenção econômica permite o repasse de recursos não reembolsáveis a empresas para apoiar projetos de risco tecnológico relevante.`,
        correct: 'Certo',
        explanation: 'A subvenção econômica é um dos grandes instrumentos regulados pela Lei de Inovação para mitigar os riscos financeiros do desenvolvimento tecnológico privado pioneiro.',
        reference: 'Subvenção Econômica'
      };
      if (t === 2) return {
        text: `Sob a ótica do regime jurídico do fomento científico, é vedado às fundações de amparo à pesquisa conceder bolsas ou apoio a pesquisadores vinculados a instituições privadas, ainda que elas atuem em pesquisa e inovação.`,
        correct: 'Errado',
        explanation: 'Errado. O fomento público à pesquisa científica e tecnológica estende-se a instituições privadas sem fins lucrativos e ICTs privadas credenciadas, visando o desenvolvimento integrado do ecossistema de inovação.',
        reference: 'Fomento a Pesquisa e ICTs Privadas'
      };
      if (t === 3) return {
        text: `Considerando os mecanismos de contratação voltados à inovação, a encomenda tecnológica é instrumento destinado à obtenção de solução para problema técnico específico, com assunção de risco tecnológico pela administração.`,
        correct: 'Certo',
        explanation: 'A ETEC permite ao Estado financiar e comprar soluções tecnológicas inéditas diretamente, assumindo de forma ativa o risco tecnológico do fracasso ou sucesso do projeto.',
        reference: 'Encomenda Tecnológica (ETEC)'
      };
      if (t === 4) return {
        text: `No contexto da estrutura administrativa de fundações públicas de fomento, o PCCV funciona como instrumento de organização funcional, definição de atribuições e progressão na carreira.`,
        correct: 'Certo',
        explanation: 'O PCCV assegura a regularidade funcional, valorização profissional e a continuidade administrativa da fundação, estabelecendo atribuições e critérios de progressão funcional.',
        reference: 'Legislação FAPEAL / PCCV'
      };
      if (t === 5) return {
        text: `Acerca das políticas estaduais de CT&I, é compatível com a lógica do sistema de fomento vincular pesquisa, inovação e desenvolvimento tecnológico a objetivos de desenvolvimento regional sustentável.`,
        correct: 'Certo',
        explanation: 'A legislação estadual de fomento de Alagoas vincula de forma explícita a pesquisa científica ao avanço social, econômico, ecológico e humano da população alagoana.',
        reference: 'Lei Estadual de Alagoas nº 8.956/2023'
      };
      if (t === 6) return {
        text: `Considerando a necessidade de compatibilizar controle administrativo e dinamismo da pesquisa, o Marco Legal de CT&I admite simplificações procedimentais em contratações e aquisições destinadas a atividades de P&D.`,
        correct: 'Certo',
        explanation: 'A desburocratização de importações e aquisições de insumos laboratoriais é um pilar do marco legal para evitar que lentidões alfandegárias ou licitações longas inviabilizem experimentos.',
        reference: 'Simplificação de Aquisições de Pesquisa'
      };
      if (t === 7) return {
        text: `No arranjo institucional brasileiro de fomento científico, as fundações estaduais de amparo à pesquisa operam como agências públicas especializadas na indução e no financiamento de atividades de CT&I.`,
        correct: 'Certo',
        explanation: 'A destinação orçamentária vinculada (porcentagem da receita tributária estadual) garante a estabilidade do fomento científico de longo prazo contra volatilidades políticas.',
        reference: 'Autonomia das FAPs'
      };
      if (t === 8) return {
        text: `No regime de transferência de tecnologia entre ICT pública e empresa, a celebração do ajuste depende, obrigatoriamente, do repasse integral e permanente do resultado econômico da exploração comercial para a instituição de origem.`,
        correct: 'Errado',
        explanation: 'Errado. A transferência de tecnologia envolve partilha justa de royalties e licenciamentos contratuais negociados, mas de forma alguma exige a cessão de 100% do faturamento comercial, o que anularia o incentivo financeiro para a empresa inovar.',
        reference: 'Transferência de Tecnologia e Royalties'
      };
      return {
        text: `Sob a lógica sistêmica da inovação, o Marco Legal de CT&I favorece a constituição de ambientes promotores de inovação, como parques tecnológicos, incubadoras e outros arranjos cooperativos.`,
        correct: 'Certo',
        explanation: 'A concentração espacial cooperativa de empresas e centros de pesquisa (clusters) potencializa a sinergia produtiva, acelera o intercâmbio de inovações e atrai capital de risco.',
        reference: 'Arranjos Promotores de Inovação'
      };

    case 'Divulgação Científica':
      if (t === 0) return {
        text: `Na divulgação científica institucional, a curadoria de conteúdo envolve selecionar achados relevantes, contextualizá-los e traduzi-los em linguagem acessível, sem suprimir os limites metodológicos da pesquisa.`,
        correct: 'Certo',
        explanation: 'A curadoria atua como ponte interpretativa de valor social, decantando teses densas em releases, infográficos ou roteiros de comunicação acessível.',
        reference: 'Curadoria de Conteúdo Científico'
      };
      if (t === 1) return {
        text: `Acerca da cobertura jornalística de temas científicos, a função do repórter restringe-se à reprodução fiel de comunicados técnicos, razão pela qual a checagem independente e a análise de conflitos de interesse são etapas dispensáveis.`,
        correct: 'Errado',
        explanation: 'Errado. O jornalismo científico qualificado exige ceticismo saudável, confronto de fontes independentes, verificação de conflitos de interesse de financiamento e contextualização de riscos de testes.',
        reference: 'Senso Crítico no Jornalismo Científico'
      };
      if (t === 2) return {
        text: `Considerando os referenciais internacionais empregados em estudos de inovação, o Manual de Oslo é utilizado para orientar a coleta e a classificação de dados relativos a processos inovativos em organizações.`,
        correct: 'Certo',
        explanation: 'Publicado pela OCDE, o Manual de Oslo é o padrão global para compreender e mensurar a inovação e o progresso tecnológico nas corporações modernas.',
        reference: 'Classificação de Inovação do Manual de Oslo'
      };
      if (t === 3) return {
        text: `Na análise bibliométrica, o número absoluto de publicações basta, por si só, para medir relevância científica, sendo irrelevantes indicadores como citações, redes de colaboração ou impacto do periódico.`,
        correct: 'Errado',
        explanation: 'Errado. O número de citações que um artigo recebe e o Fator de Impacto dos periódicos que o publicam são métricas bibliométricas centrais para quantificar a real relevância e o prestígio científico das produções acadêmicas.',
        reference: 'Indicadores Bibliométricos'
      };
      if (t === 4) return {
        text: `No contexto da comunicação pública da ciência, divulgar resultados de pesquisas financiadas com recursos públicos pode reforçar a legitimidade social do investimento estatal em CT&I.`,
        correct: 'Certo',
        explanation: 'Prestar contas do investimento científico confere relevância pública à ciência, engajando os contribuintes no apoio à pesquisa e consolidação de políticas estaduais de CT&I.',
        reference: 'Legitimação Social da Ciência'
      };
      if (t === 5) return {
        text: `Sob a ótica do jornalismo de CT&I, o data storytelling combina bases quantitativas, visualização e narrativa para tornar inteligíveis informações técnicas ou volumosas.`,
        correct: 'Certo',
        explanation: 'O storytelling com dados combina números exatos, design gráfico interativo e storytelling cativante para humanizar e esclarecer informações técnicas densas.',
        reference: 'Data Storytelling de Investimentos'
      };
      if (t === 6) return {
        text: `À luz do modelo da Tripla Hélice, a dinâmica da inovação depende da interação entre universidade, governo e setor produtivo.`,
        correct: 'Certo',
        explanation: 'O intercâmbio de demandas e recursos entre Estado, setor industrial produtivo e instituições acadêmicas de pesquisa constitui a base moderna do fomento inovativo de países de ponta.',
        reference: 'Teoria da Tripla Hélice'
      };
      if (t === 7) return {
        text: `No contexto do acesso à informação, dados produzidos em pesquisas financiadas com recursos públicos são, por regra, indisponíveis à sociedade, porque o sigilo técnico-científico prevalece de forma absoluta.`,
        correct: 'Errado',
        explanation: 'Errado. Salvo em casos pontuais de patentes industriais em andamento ou segurança nacional de dados estratégicos, o princípio geral que rege o investimento público de ciência é a transparência ativa e a democratização de dados científicos de interesse público.',
        reference: 'Lei de Acesso à Informação (LAI) e Ciência'
      };
      if (t === 8) return {
        text: `Acerca da ciência aberta, a disponibilização de artigos, dados e códigos tende a favorecer transparência, reprodutibilidade e cooperação entre pesquisadores, observadas as restrições éticas e legais cabíveis.`,
        correct: 'Certo',
        explanation: 'A ciência aberta reduz barreiras econômicas de acesso a periódicos caros, democratizando a produção de conhecimentos e estimulando a colaboração científica transfronteiriça.',
        reference: 'Ciência Aberta (Open Science)'
      };
      return {
        text: `No que se refere à mensuração de atividades de P&D, o Manual de Frascati é referência para padronização de conceitos e estatísticas relacionadas à pesquisa e ao desenvolvimento experimental.`,
        correct: 'Certo',
        explanation: 'O Manual de Frascati padroniza internacionalmente o que se conceitua como investimento efetivo em P&D, sendo uma das maiores referências métricas globais ao lado do Manual de Oslo.',
        reference: 'Manual de Frascati'
      };

    case 'Ética e Compliance':
    default:
      if (t === 0) return {
        text: `À luz da ética profissional, o jornalista não deve aceitar vantagens ou benefícios de fontes quando essa relação puder comprometer sua independência editorial ou a credibilidade da cobertura.`,
        correct: 'Certo',
        explanation: 'Preservar a independência editorial e evitar conflitos de interesse flagrantes que comprometam a veracidade factual do noticiário é um dever ético fundamental de todo jornalista.',
        reference: 'Código de Ética dos Jornalistas'
      };
      if (t === 1) return {
        text: `Acerca das garantias constitucionais relacionadas à atividade de imprensa, o direito de resposta assegura ao ofendido reparação proporcional ao agravo, sem prejuízo de eventual indenização.`,
        correct: 'Certo',
        explanation: 'O direito de resposta (Art. 5º, V da CF) repara administrativamente ou judicialmente os danos morais ou factuais causados por publicações caluniosas ou erradas.',
        reference: 'Direito de Resposta na Constituição Federal'
      };
      if (t === 2) return {
        text: `No trato ético com informações recebidas em off, a proteção conferida à identidade da fonte pode ser afastada pelo jornalista sempre que a divulgação do nome gerar ampla repercussão pública nas redes.`,
        correct: 'Errado',
        explanation: 'Errado. O compromisso ético de resguardar uma fonte que falou sob regime de "off" é absoluto e inegociável, independentemente de engajamento social, pressões de assessores ou visibilidade comercial.',
        reference: 'Compromisso com Fontes Confidenciais'
      };
      if (t === 3) return {
        text: `Considerando os limites éticos da apuração, o jornalista deve resistir à divulgação de material obtido por meios ilícitos ou mediante violação abusiva da privacidade, ressalvadas hipóteses de inequívoco interesse público.`,
        correct: 'Certo',
        explanation: 'A invasão de privacidade e métodos ilícitos de apuração são vedados pelo código, salvo quando há evidente e supremo interesse coletivo em expor atos de corrupção ou crimes ocultos.',
        reference: 'Ética na Apuração Jornalística'
      };
      if (t === 4) return {
        text: `No contexto do compliance público, a gestão de editais e programas de fomento deve observar impessoalidade, moralidade administrativa e prevenção de conflitos de interesse.`,
        correct: 'Certo',
        explanation: 'A impessoalidade e a moralidade administrativa asseguram que o fomento público de Alagoas seja distribuído de forma justa e transparente por mérito científico, em total compliance com a lei.',
        reference: 'Princípios da Administração Pública / FAPEAL'
      };
      if (t === 5) return {
        text: `A liberdade de imprensa afasta, por completo, a possibilidade de responsabilização penal por calúnia, injúria ou difamação praticadas no exercício da atividade jornalística.`,
        correct: 'Errado',
        explanation: 'Errado. A liberdade de expressão não confere direito de ofensa impune. Os crimes de injúria, calúnia e difamação continuam vigentes no Código Penal e podem acarretar responsabilização civil e penal.',
        reference: 'Crimes contra a Honra e Liberdade de Imprensa'
      };
      if (t === 6) return {
        text: `Sob a ótica constitucional, a vedação à censura prévia convive com a possibilidade de responsabilização posterior por abusos cometidos no exercício da liberdade de expressão.`,
        correct: 'Certo',
        explanation: 'A constituição garante a plena liberdade de imprensa e veda a censura governamental prévia. Eventuais ofensas, calúnias ou mentiras devem ser julgadas e punidas com o devido processo legal a posteriori.',
        reference: 'Liberdade de Expressão e Censura Prévia'
      };
      if (t === 7) return {
        text: `Acerca da fidelidade informativa, a omissão de elementos factuais essenciais pode comprometer a veracidade do relato, mesmo quando os dados publicados individualmente estejam corretos.`,
        correct: 'Certo',
        explanation: 'A omissão culposa ou dolosa de contextos essenciais viola o compromisso ético de fidelidade à verdade factual, induzindo o público ao erro por enquadramento capcioso.',
        reference: 'Fidelidade Factual e Omissões'
      };
      if (t === 8) return {
        text: `No exercício da assessoria em órgão público, é incompatível com a ética funcional a produção de peças de promoção político-partidária sob a aparência de comunicação institucional.`,
        correct: 'Certo',
        explanation: 'O profissional em assessoria pública deve servir ao Estado de Alagoas e à população, não devendo instrumentalizar sua função para promoção político-partidária de governantes no exercício do cargo.',
        reference: 'Ética na Assessoria Pública'
      };
      return {
        text: `À luz das regras de integridade administrativa, é vedado ao agente público receber vantagens de particulares que possuam interesse direto em decisões relacionadas a editais, contratos ou processos de seleção.`,
        correct: 'Certo',
        explanation: 'A moralidade administrativa veda quaisquer doações, cortesias corporativas ou mimos financeiros a servidores públicos estaduais que possam configurar conflito de interesse ou prevaricação de julgamento em seleções públicas.',
        reference: 'Código de Conduta da Administração Pública / Compliance'
      };
  }
};

const countBinaryAnswers = (questions: Array<Pick<Question, 'correct'>>) => {
  return questions.reduce(
    (acc, q) => {
      if (q.correct === 'Certo') acc.certo++;
      if (q.correct === 'Errado') acc.errado++;
      return acc;
    },
    { certo: 0, errado: 0 }
  );
};

const stableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickBalancedAnswer = (
  counts: { certo: number; errado: number },
  seed: string
): 'Certo' | 'Errado' => {
  const diff = counts.certo - counts.errado;

  if (diff >= 3) return 'Errado';
  if (diff <= -3) return 'Certo';

  return stableHash(seed) % 2 === 0 ? 'Certo' : 'Errado';
};

const cebraspeContextOpeners = [
  'Considerando as rotinas de produção, circulação e validação social da notícia, julgue o item subsequente:',
  'Acerca das práticas profissionais do jornalismo e de seus efeitos na construção da informação, avalie a assertiva a seguir:',
  'Sob a ótica das técnicas de apuração, edição e apresentação do conteúdo jornalístico, julgue o item seguinte:',
  'À luz dos princípios que orientam a atividade jornalística contemporânea, analise a afirmação subsequente:',
  'No contexto das relações entre redação, fontes, públicos e critérios editoriais, julgue a proposição a seguir:',
  'Considerando situações típicas da prática jornalística e institucional, avalie o item seguinte:',
  'Acerca da linguagem, dos gêneros e das rotinas de mediação da informação, julgue a assertiva:',
  'Sob a perspectiva da comunicação social aplicada a ambientes impressos, digitais e institucionais, julgue o item:'
];

const weakOpeningPattern = /^(A|O|As|Os|Na|No|Em|Para|Segundo|Diferente|Como|Público|Fonte|Lead|Release|Mailing|Clipping|Newsletter|Boletim|Relatório|Transparência|Prestação|Justificação|Alinhamento|Hierarquia|Editoração|Grid|Entrelinha|Engajamento|Impressões|Taxa|Métricas|CTR|SEO|Analytics|Controlador|Anonimização|Consentimento|Tratamento|Dados|Ambientes|Inteligência|Mapas|Redes|Universidades|ICTs|Incubadoras|Living labs|Bibliometria|O índice|Patentes|Sistemas|Transferência)\b/;

const hasCebraspeContext = (text: string) =>
  /(Considerando|Acerca de|Sob a ótica de|À luz de|No contexto de|A respeito de|Com relação a)/.test(text);

const isCodevasf2024Question = (question: Question) =>
  question.reference?.startsWith('CODEVASF 2024 - Item ') ?? false;

const contextualizeJournalismQuestion = (question: Question): Question => {
  if (
    question.category !== 'Conhecimentos Específicos - Jornalismo' ||
    isCodevasf2024Question(question) ||
    hasCebraspeContext(question.text)
  ) {
    return question;
  }

  const match = question.text.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (!match) return question;

  const [, area, rawBody] = match;
  const body = rawBody.trim();

  if (!weakOpeningPattern.test(body)) return question;

  const opener =
    cebraspeContextOpeners[
      stableHash(`${question.reference ?? question.id}-${area}-${body}`) % cebraspeContextOpeners.length
    ];
  const normalizedBody = body.charAt(0).toLowerCase() + body.slice(1);

  return {
    ...question,
    text: `[${area}] ${opener} ${normalizedBody}`
  };
};

const orderQuestionsByAnswerVariety = (questions: Question[]): Question[] => {
  const pending = [...questions];
  const ordered: Question[] = [];

  while (pending.length > 0) {
    const recent = ordered.slice(-3);
    let currentRunLength = 1;
    const lastPlaced = ordered[ordered.length - 1];
    for (let i = ordered.length - 2; i >= 0; i--) {
      if (ordered[i].correct !== lastPlaced?.correct) break;
      currentRunLength++;
    }
    const lastAnswer = ordered[ordered.length - 1]?.correct;
    const previousAnswer = ordered[ordered.length - 2]?.correct;

    let candidates = pending.filter(question => question.correct !== 'Anulada');

    if (lastAnswer && currentRunLength >= 3) {
      const breakers = candidates.filter(question => question.correct !== lastAnswer);
      if (breakers.length > 0) candidates = breakers;
    } else if (
      lastAnswer &&
      previousAnswer &&
      lastAnswer === previousAnswer &&
      stableHash(`break-${ordered.length}-${lastAnswer}`) % 2 === 0
    ) {
      const breakers = candidates.filter(question => question.correct !== lastAnswer);
      if (breakers.length > 0) candidates = breakers;
    }

    const recentCategories = new Set(recent.map(question => question.text.match(/^\[([^\]]+)\]/)?.[1] ?? ''));
    const categoryDiversified = candidates.filter(
      question => !recentCategories.has(question.text.match(/^\[([^\]]+)\]/)?.[1] ?? '')
    );
    if (categoryDiversified.length > 0) candidates = categoryDiversified;

    const next = candidates.sort((a, b) => {
      const scoreA = stableHash(`${a.reference ?? a.text}-${ordered.length}`);
      const scoreB = stableHash(`${b.reference ?? b.text}-${ordered.length}`);
      return scoreA - scoreB;
    })[0] ?? pending[0];

    ordered.push(next);
    pending.splice(pending.indexOf(next), 1);
  }

  return ordered;
};

const getBalancedTemplateForCategory = (
  category: string,
  seedIndex: number,
  desiredAnswer: 'Certo' | 'Errado'
): Template => {
  const baseOffset = stableHash(`${category}-${seedIndex}-${desiredAnswer}`) % 17;

  for (let offset = 0; offset < 70; offset++) {
    const template = getTemplatesForCategory(category, seedIndex + baseOffset + offset);
    if (template.correct === desiredAnswer) return template;
  }

  return getTemplatesForCategory(category, seedIndex + baseOffset);
};

const balancingErradoTemplates = [
  {
    category: 'Teoria da Comunicação',
    text: 'a hipótese do agenda-setting sustenta que os meios de comunicação determinam, de forma direta e uniforme, a opinião final do público sobre cada tema pautado, dispensando mediações sociais, repertório prévio e disputas interpretativas.',
    explanation: 'Errado. O agenda-setting trata da capacidade de influenciar a saliência dos temas na agenda pública, não de determinar automaticamente a opinião final dos indivíduos.',
    reference: 'Agenda-setting'
  },
  {
    category: 'Teoria da Comunicação',
    text: 'o gatekeeping desloca integralmente para as fontes oficiais a responsabilidade de selecionar os fatos noticiáveis, cabendo à redação apenas publicar o material recebido, sem hierarquização editorial.',
    explanation: 'Errado. Gatekeeping envolve filtros e decisões editoriais nas redações; fontes podem influenciar a pauta, mas não substituem a seleção jornalística.',
    reference: 'Gatekeeping'
  },
  {
    category: 'Técnicas de Redação',
    text: 'a pirâmide invertida recomenda que a informação principal seja preservada para o encerramento da matéria, de modo a criar suspense narrativo típico do texto ficcional.',
    explanation: 'Errado. Na pirâmide invertida, as informações mais relevantes aparecem no início do texto, seguidas por detalhes de menor hierarquia.',
    reference: 'Pirâmide invertida'
  },
  {
    category: 'Técnicas de Redação',
    text: 'o lide clássico dispensa a identificação do fato central quando a matéria contém declarações de autoridade pública, pois a relevância da fonte substitui a necessidade de responder às perguntas essenciais do acontecimento.',
    explanation: 'Errado. A autoridade da fonte não elimina a necessidade de clareza sobre o fato, seus sujeitos, circunstâncias e relevância.',
    reference: 'Lide jornalístico'
  },
  {
    category: 'Assessoria de Imprensa',
    text: 'o release institucional deve ser redigido preferencialmente como peça publicitária laudatória, com adjetivação intensa, uma vez que sua finalidade é substituir a apuração independente do jornalista.',
    explanation: 'Errado. O release deve ter linguagem jornalística, informação verificável, interesse público ou editorial e não substitui a autonomia de apuração da redação.',
    reference: 'Release'
  },
  {
    category: 'Assessoria de Imprensa',
    text: 'em situação de crise, a assessoria deve pulverizar versões diferentes entre porta-vozes, pois a multiplicidade de narrativas reduz a chance de questionamento público.',
    explanation: 'Errado. Crises exigem coerência, centralização de informações, transparência possível e porta-vozes preparados para evitar ruídos e contradições.',
    reference: 'Gestão de crise'
  },
  {
    category: 'Jornalismo Digital',
    text: 'a hipertextualidade no webjornalismo elimina a responsabilidade de organizar a narrativa, pois a existência de links, por si só, assegura compreensão plena e percurso informativo coerente ao leitor.',
    explanation: 'Errado. Links ampliam caminhos de leitura, mas a narrativa ainda precisa de organização, hierarquia e contexto.',
    reference: 'Hipertextualidade'
  },
  {
    category: 'Jornalismo Digital',
    text: 'métricas de audiência devem substituir integralmente os critérios editoriais, de modo que conteúdos de maior taxa de clique sejam automaticamente considerados os mais relevantes do ponto de vista público.',
    explanation: 'Errado. Métricas auxiliam decisões, mas não substituem interesse público, checagem, responsabilidade editorial e critérios jornalísticos.',
    reference: 'Métricas digitais'
  },
  {
    category: 'Ética e Compliance',
    text: 'o sigilo da fonte autoriza o jornalista a publicar qualquer informação sem checagem, pois a proteção constitucional transfere à fonte confidencial toda a responsabilidade pela veracidade do conteúdo divulgado.',
    explanation: 'Errado. O sigilo protege a identidade da fonte, mas não dispensa apuração, checagem e responsabilidade profissional sobre o que é publicado.',
    reference: 'Sigilo de fonte'
  },
  {
    category: 'Ética e Compliance',
    text: 'a vedação à censura prévia impede qualquer responsabilização posterior por calúnia, difamação, injúria, erro deliberado ou violação abusiva de direitos individuais.',
    explanation: 'Errado. A Constituição veda censura prévia, mas admite responsabilização posterior por abusos, danos e ilícitos.',
    reference: 'Liberdade de imprensa'
  },
  {
    category: 'Comunicação Pública',
    text: 'a comunicação pública em órgãos estatais deve priorizar a promoção pessoal de gestores sempre que a ação divulgada tiver resultado positivo, pois a autoria política prevalece sobre a impessoalidade administrativa.',
    explanation: 'Errado. Comunicação pública deve observar interesse público, impessoalidade, utilidade social e prestação de contas, sem promoção pessoal.',
    reference: 'Comunicação pública'
  },
  {
    category: 'Produtos de Assessoria',
    text: 'mailing e clipping são produtos equivalentes, ambos voltados ao arquivamento de matérias já publicadas sobre a instituição assessorada.',
    explanation: 'Errado. Mailing é cadastro segmentado de contatos; clipping é monitoramento e registro de publicações.',
    reference: 'Mailing e clipping'
  },
  {
    category: 'Editoração e Projeto Gráfico',
    text: 'a escolha tipográfica é etapa meramente decorativa do projeto gráfico, sem impacto sobre legibilidade, hierarquia informativa ou identidade editorial.',
    explanation: 'Errado. Tipografia afeta leitura, organização da informação, reconhecimento visual e adequação do produto jornalístico.',
    reference: 'Tipografia'
  },
  {
    category: 'Divulgação Científica',
    text: 'a divulgação científica institucional deve suprimir incertezas, limitações metodológicas e conflitos de interesse, pois tais elementos enfraquecem a adesão pública à ciência.',
    explanation: 'Errado. Comunicação científica responsável contextualiza achados, limites, riscos e incertezas sem transformar divulgação em propaganda enganosa.',
    reference: 'Divulgação científica'
  }
];

const balancingContexts = [
  'Considerando a cobertura de temas sensíveis por órgãos públicos e veículos jornalísticos, julgue o item seguinte:',
  'Acerca das rotinas profissionais de apuração, edição e relacionamento com fontes, avalie a assertiva:',
  'Sob a ótica da comunicação pública, da ética profissional e da organização do trabalho jornalístico, julgue o item:',
  'À luz das transformações digitais e das teorias clássicas do jornalismo, analise a afirmação a seguir:',
  'No contexto de assessorias de imprensa, redações integradas e circulação multiplataforma de notícias, julgue a proposição:',
  'Considerando a distinção entre interesse público, visibilidade institucional e critérios de noticiabilidade, avalie o item:',
  'Acerca da produção de conteúdo jornalístico em ambientes institucionais e digitais, julgue a assertiva subsequente:',
  'Sob a perspectiva das práticas contemporâneas de comunicação social, analise o item seguinte:'
];

const scientificDisclosureBalancingTemplates = [
  {
    text: 'a divulgação científica institucional deve suprimir incertezas, limitações metodológicas e conflitos de interesse, pois tais elementos enfraquecem a adesão pública à ciência.',
    explanation: 'Errado. Comunicação científica responsável contextualiza achados, limites, riscos e incertezas sem transformar divulgação em propaganda enganosa.'
  },
  {
    text: 'resultados preliminares de uma pesquisa podem ser apresentados ao público como conclusões definitivas, desde que tenham potencial para gerar ampla repercussão jornalística.',
    explanation: 'Errado. Resultados preliminares exigem identificação clara de seu estágio, cautela na linguagem e contextualização das limitações antes da divulgação.'
  },
  {
    text: 'o jornalista científico deve adotar integralmente a interpretação fornecida pela instituição pesquisadora, dispensando a consulta a especialistas independentes.',
    explanation: 'Errado. A apuração independente, o contraditório técnico e a consulta a fontes sem conflito de interesse fortalecem a qualidade da cobertura científica.'
  },
  {
    text: 'percentuais de risco relativo podem ser divulgados isoladamente, sem valores absolutos ou contexto amostral, porque essa simplificação sempre facilita a compreensão pública.',
    explanation: 'Errado. Risco relativo sem valores absolutos, tamanho da amostra e contexto pode produzir percepção distorcida da relevância dos achados.'
  },
  {
    text: 'a publicação de um artigo em periódico científico elimina a necessidade de o jornalista verificar desenho metodológico, tamanho da amostra e eventuais conflitos de interesse.',
    explanation: 'Errado. A publicação acadêmica não substitui a análise crítica da metodologia, das limitações e dos interesses envolvidos na pesquisa.'
  },
  {
    text: 'em matérias sobre saúde, relações estatísticas observadas entre duas variáveis podem ser apresentadas como prova de causalidade, ainda que o estudo tenha caráter apenas observacional.',
    explanation: 'Errado. Correlação não demonstra causalidade, especialmente em estudos observacionais sujeitos a fatores de confusão.'
  },
  {
    text: 'a ausência de significância estatística comprova necessariamente que o fenômeno investigado não existe e torna desnecessária qualquer explicação sobre poder estatístico ou intervalo de confiança.',
    explanation: 'Errado. Ausência de significância pode decorrer de diferentes fatores e deve ser interpretada com tamanho amostral, poder estatístico e intervalos de confiança.'
  },
  {
    text: 'embargos de divulgação autorizam jornalistas a publicar resultados antes do horário acordado sempre que outro veículo mencionar informalmente a pesquisa nas redes sociais.',
    explanation: 'Errado. O embargo integra um acordo profissional e seu eventual rompimento deve ser confirmado formalmente, não presumido a partir de menções informais.'
  },
  {
    text: 'na cobertura de inovação, todo pedido de patente deve ser tratado como comprovação de eficácia comercial e de impacto social da tecnologia descrita.',
    explanation: 'Errado. O depósito de patente protege uma invenção, mas não comprova viabilidade comercial, eficácia prática nem impacto social.'
  },
  {
    text: 'a linguagem acessível na divulgação científica exige retirar números, condições e ressalvas do estudo, ainda que esses elementos sejam indispensáveis para interpretar corretamente o resultado.',
    explanation: 'Errado. Tornar o conteúdo acessível significa explicar dados e ressalvas com clareza, não eliminar informações necessárias à compreensão responsável.'
  }
];

const createBalancingErradoQuestion = (
  id: number,
  index: number,
  templateUsage: Map<string, number>
): Question => {
  const selectedTemplate =
    balancingErradoTemplates[stableHash(`balancing-template-${index}`) % balancingErradoTemplates.length];
  const usageKey = `${selectedTemplate.category}:${selectedTemplate.reference}`;
  const usageIndex = templateUsage.get(usageKey) || 0;
  templateUsage.set(usageKey, usageIndex + 1);
  const scientificVariant = selectedTemplate.category === 'Divulgação Científica'
    ? scientificDisclosureBalancingTemplates[usageIndex % scientificDisclosureBalancingTemplates.length]
    : null;
  const template = scientificVariant
    ? { ...selectedTemplate, ...scientificVariant }
    : selectedTemplate;
  const context =
    balancingContexts[stableHash(`balancing-context-${index}`) % balancingContexts.length];

  return {
    id,
    category: 'Conhecimentos Específicos - Jornalismo',
    text: `[${template.category}] ${context} ${template.text} (Item inédito de equilíbrio JOR-${index + 1})`,
    correct: 'Errado',
    explanation: template.explanation,
    reference: `CEBRASPE - ${template.reference} - questão inédita de equilíbrio`
  };
};

const balanceJournalismSpecificAnswers = (questions: Question[]): Question[] => {
  const balanced = [...questions];
  const countSpecific = () => countBinaryAnswers(
    balanced.filter(q => q.category === 'Conhecimentos Específicos - Jornalismo')
  );

  let counts = countSpecific();
  let balanceIndex = 0;
  let nextId = Math.max(...balanced.map(q => Number(q.id)), 0) + 1;
  const templateUsage = new Map<string, number>();

  while (counts.errado < counts.certo - 1) {
    balanced.push(createBalancingErradoQuestion(nextId, balanceIndex, templateUsage));
    nextId++;
    balanceIndex++;
    counts = countSpecific();
  }

  return balanced;
};

const polishAndReorderJournalismQuestions = (questions: Question[]): Question[] => {
  const journalismSpecific = questions
    .filter(question => question.category === 'Conhecimentos Específicos - Jornalismo')
    .map(contextualizeJournalismQuestion);
  const nonSpecific = questions.filter(
    question => question.category !== 'Conhecimentos Específicos - Jornalismo'
  );

  const anuladas = journalismSpecific.filter(question => question.correct === 'Anulada');
  const binary = journalismSpecific.filter(question => question.correct !== 'Anulada');
  const orderedBinary = orderQuestionsByAnswerVariety(binary);
  const rebuilt = [...orderedBinary, ...anuladas].map((question, index) => ({
    ...question,
    id: index + 1
  }));

  const offset = rebuilt.length;
  const rebuiltNonSpecific = nonSpecific.map((question, index) => ({
    ...question,
    id: offset + index + 1
  }));

  return [...rebuilt, ...rebuiltNonSpecific];
};

// Programmatically build exactly 300 highly professional, distinct questions for journalism
export const getJournalismQuestions = (): Question[] => {
  const result: Question[] = [];

  // 1. Seed with our base hand-crafted questions (1 to 20)
  baseJournalismQuestions.forEach(q => {
    result.push({
      id: q.id,
      category: mapCategory(q.category),
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // 2. Add hand-crafted supplemental questions for requested pending topics
  codevasf2024JournalismQuestions.forEach(q => {
    result.push({
      id: result.length + 1,
      category: mapCategory(q.category),
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference,
      passageId: q.passageId
    });
  });

  // 3. Add hand-crafted supplemental questions for requested pending topics
  supplementalJournalismQuestions.forEach(q => {
    result.push({
      id: result.length + 1,
      category: mapCategory(q.category),
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // 4. Add expanded requested topics with explicit coverage
  expandedRequestedJournalismQuestions.forEach(q => {
    result.push({
      id: result.length + 1,
      category: mapCategory(q.category),
      text: q.text,
      correct: q.correct,
      explanation: q.explanation,
      reference: q.reference
    });
  });

  // 5. Loop to generate up to 520 questions
  const totalTarget = 520;
  const numToGen = totalTarget - result.length;

  for (let i = 0; i < numToGen; i++) {
    const questionId = result.length + 1;
    // Rotate through categories beautifully
    const category = categories[i % categories.length];
    const answerCounts = countBinaryAnswers(result);
    const desiredAnswer = pickBalancedAnswer(
      answerCounts,
      `${category}-${i}-${result.length}`
    );
    const template = getBalancedTemplateForCategory(category, i, desiredAnswer);

    // Apply some slight linguistic variations to ensure unique descriptions per ID
    const variations = [
      "Considerando as diretrizes clássicas do tema, avalie o seguinte item: ",
      "No contexto de comunicações e editais estaduais, julgue a assertiva: ",
      "A respeito de legislações correlatas, apuração e rotinas profissionais, julgue o item subsequente: ",
      "Com relação às boas práticas da profissão e fundamentos da comunicação, julgue o item a seguir: ",
      "À luz das teorias vigentes e rotinas práticas da área de atuação, avalie a seguinte afirmação: "
    ];
    const prefix = variations[i % variations.length];
    
    result.push({
      id: questionId,
      category: mapCategory(category),
      text: `[${category}] ${prefix}${template.text}`,
      correct: template.correct,
      explanation: template.explanation,
      reference: `CEBRASPE - ${template.reference} (Ref: #${questionId})`
    });
  }

  // 6. Append core questions (Português, Inglês, TI Básica, Legislação, Alagoas) with non-overlapping IDs
  let currentMaxId = Math.max(...result.map(q => Number(q.id)), 300);
  quizQuestions.forEach(q => {
    // Include all core questions for journalism
    currentMaxId++;
    result.push({
      ...q,
      id: currentMaxId
    });
  });

  return polishAndReorderJournalismQuestions(
    balanceJournalismSpecificAnswers(deduplicateQuestions(result))
  );
};

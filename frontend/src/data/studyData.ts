import { StudySection } from '../types';

export const studySections: StudySection[] = [
  {
    id: 'portugues',
    title: 'Língua Portuguesa',
    icon: 'BookOpen',
    color: 'emerald',
    difficulty: 'Médio',
    weight: '15%',
    paretoJustification: 'Historicamente, o CEBRASPE concentra cerca de 80% das suas questões de português em três grandes focos: Reescrita e Preservação de Sentidos, Mecanismos de Coesão Textual e Emprego da Crase/Pontuação.',
    cards: [
      {
        id: 'pt-reescrita',
        title: 'Reescrita e Equivalência de Frases',
        paretoRatio: 'Altíssima Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A reescrita de frases é o assunto mais cobrado pelo CEBRASPE. A banca apresenta um trecho original e propõe uma alteração, questionando se ela <strong>preserva os sentidos originais</strong> e <strong>mantém a correção gramatical</strong>.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3">
            <h4 class="font-bold text-sm text-slate-800">Fórmula de Ouro do CEBRASPE:</h4>
            <ul class="list-disc pl-4 text-xs text-slate-600 mt-1">
              <li><strong>Correção Gramatical</strong>: Refere-se à norma culta (regência, concordância, crase, pontuação).</li>
              <li><strong>Preservação do Sentido</strong>: Os fatos relatados devem ser idênticos. Mudanças sutis de ênfase são aceitas, desde que não alterem a verdade original.</li>
            </ul>
          </div>
          <p class="text-xs text-slate-600"><strong>Exemplo Clássico (Prova CAU/BR 2023):</strong> Substituir "Como a arquitetura reflete..." por "Conforme a arquitetura reflete..." preserva o sentido causal/conformativo dependendo do contexto. Se "como" introduz causa ("Como o trânsito estava lento, atrasei-me"), trocar por "Conforme" altera o sentido (causa vs conformidade).</p>
        `,
        materials: ["Gramática Normativa", "Mecanismos de Coesão"],
        tools: ["CEBRASPE - Reescrita e Estilo"],
        keyTakeaways: [
          "Cuidado com a mudança de conjunções (ex: trocar 'como' causal por 'conforme' conformativo altera os sentidos).",
          "A supressão de termos explicativos ou restritivos altera o escopo da oração.",
          "Verifique sempre a concordância verbal após a reescrita do sujeito."
        ]
      },
      {
        id: 'pt-coesao',
        title: 'Coesão Textual e Referenciação',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A banca avalia a capacidade de identificar os referentes de pronomes (ele, o qual, seu, onde) e os mecanismos de coesão (elipse, substituição lexical).</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-500 mb-3 text-xs">
            <p class="font-bold text-slate-800">Principais Armadilhas do CEBRASPE:</p>
            <ul class="list-disc pl-4 text-slate-600 mt-1">
              <li><strong>Pronomes Possessivos</strong>: Atribuição errônea do referente de 'seu/sua' gerando ambiguidade.</li>
              <li><strong>Pronome Relativo 'Onde'</strong>: Só pode retomar lugares físicos reais. Substituí-lo em trechos abstratos mantendo a correção é erro comum em alternativas incorretas.</li>
              <li><strong>Elipse</strong>: Ocultação de um termo subentendido na frase (ex: ocultar a palavra 'obras' no trecho 'algumas obras projetadas por IA, outras [obras] criadas manualmente').</li>
            </ul>
          </div>
        `,
        materials: ["Mecanismos Coesivos", "Pronomes Relativos"],
        tools: ["CEBRASPE - Análise Textual"],
        keyTakeaways: [
          "O pronome 'onde' só deve ser usado para lugares físicos (ex: 'espaços onde as máquinas estão'). No lugar de tempos/conceitos, use 'em que' ou 'no qual'.",
          "Identifique elipses restaurando mentalmente os termos ocultos para verificar concordância.",
          "O termo 'se' pode funcionar como reflexivo, recíproco, conjunção condicional ou índice de indeterminação."
        ]
      },
      {
        id: 'pt-crase',
        title: 'Emprego do Sinal Indicativo de Crase',
        paretoRatio: 'Média-Alta Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">A fusão da preposição 'a' com o artigo feminino 'a' é regida por regras claras e o CEBRASPE adora cobrar os casos facultativos e proibitivos.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span class="font-bold text-emerald-800">Casos Facultativos (Ouro em Provas):</span>
              <ul class="list-disc pl-4 text-emerald-700 mt-1">
                <li>Antes de nomes próprios femininos de pessoas.</li>
                <li>Antes de pronomes possessivos femininos singulares (ex: 'ceder informações <strong>as suas</strong> / <strong>às suas</strong> informações').</li>
                <li>Após a preposição 'até'.</li>
              </ul>
            </div>
            <div class="bg-rose-50 p-3 rounded-lg border border-rose-200">
              <span class="font-bold text-rose-800">Casos Proibidos:</span>
              <ul class="list-disc pl-4 text-rose-700 mt-1">
                <li>Antes de palavras masculinas ou verbos.</li>
                <li>Antes de pronomes de tratamento (exceto senhora/senhorita).</li>
                <li>Antes de artigo indefinido (uma).</li>
                <li>No 'a' singular antes de termo no plural (ex: 'referência a pessoas').</li>
              </ul>
            </div>
          </div>
        `,
        materials: ["Sintaxe de Regência", "Uso da Crase"],
        tools: ["CEBRASPE - Ortografia e Regência"],
        keyTakeaways: [
          "Antes de pronomes possessivos femininos singulares, a crase é estritamente facultativa.",
          "Verifique a regência do verbo ou nome: se exige preposição 'a' e o termo seguinte admite artigo feminino 'a'.",
          "A supressão ou inserção da crase facultativa mantém a correção gramatical e o sentido original."
        ]
      }
    ]
  },
  {
    id: 'ti',
    title: 'Tecnologia da Informação Básica',
    icon: 'Cpu',
    color: 'blue',
    difficulty: 'Fácil',
    weight: '15%',
    paretoJustification: 'A TI Básica foca em Cloud Computing (particularmente modelos de serviços e implantação), Segurança (tipos de malwares e backups) e Redes de Computadores.',
    cards: [
      {
        id: 'ti-cloud',
        title: 'Computação em Nuvem e Modelos',
        paretoRatio: 'Altíssima Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A computação em nuvem revolucionou a infraestrutura de TI. O CEBRASPE exige diferenciação perfeita dos modelos de serviços e implantação.</p>
          <div class="overflow-x-auto mb-3">
            <table class="min-w-full text-xs text-slate-600 border border-slate-200 rounded-lg">
              <thead>
                <tr class="bg-slate-100 text-slate-800 font-bold">
                  <th class="p-2 border border-slate-200">Modelo</th>
                  <th class="p-2 border border-slate-200">Definição</th>
                  <th class="p-2 border border-slate-200">Exemplos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="p-2 border border-slate-200 font-bold bg-slate-50 text-blue-600">IaaS</td>
                  <td class="p-2 border border-slate-200">Infraestrutura como Serviço. O usuário contrata recursos de hardware bruto (servidores, redes, storages). O controle do SO e apps é do usuário.</td>
                  <td class="p-2 border border-slate-200 text-slate-500">AWS EC2, Google Compute Engine.</td>
                </tr>
                <tr>
                  <td class="p-2 border border-slate-200 font-bold bg-slate-50 text-blue-600">PaaS</td>
                  <td class="p-2 border border-slate-200">Plataforma como Serviço. Oferece um ambiente completo para desenvolvimento, deploy e execução de sistemas. O provedor gerencia SO e hardware.</td>
                  <td class="p-2 border border-slate-200 text-slate-500">Heroku, Google App Engine, Azure App Services.</td>
                </tr>
                <tr>
                  <td class="p-2 border border-slate-200 font-bold bg-slate-50 text-blue-600">SaaS</td>
                  <td class="p-2 border border-slate-200">Software como Serviço. O usuário acessa a aplicação final diretamente via web ou aplicativo. O provedor cuida de tudo.</td>
                  <td class="p-2 border border-slate-200 text-slate-500">Google Drive, Microsoft Office 365, Gmail.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-slate-700 bg-blue-50 p-2 rounded border border-blue-200 mb-2"><strong>Tipos de Implantação Quentes:</strong> Nuvem Comunitária (compartilhada por várias organizações que possuem objetivos ou obrigações comuns, podendo ser gerenciada por elas ou por terceiros); Nuvem Pública (público geral); Nuvem Privada (uso exclusivo de uma única organização).</p>
        `,
        materials: ["NIST Cloud Definition", "Tipos de Nuvem"],
        tools: ["CEBRASPE - Computação em Nuvem"],
        keyTakeaways: [
          "Na Nuvem Comunitária, a infraestrutura é compartilhada por organizações com interesses e requisitos de conformidade idênticos.",
          "IaaS dá controle total do Sistema Operacional ao cliente; PaaS e SaaS retiram essa responsabilidade.",
          "O provisionamento de recursos em nuvem é elástico e rápido, escalando de acordo com a carga."
        ]
      },
      {
        id: 'ti-backup',
        title: 'Políticas de Backup (Cópia de Segurança)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A política de backup define a frequência, tipo e mídias de armazenamento para resguardar a integridade corporativa.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-blue-500 text-xs mb-3">
            <p class="font-bold text-slate-800">Diferenciação Estrita de Tipos de Backup:</p>
            <ul class="list-disc pl-4 text-slate-600 mt-2 space-y-1">
              <li><strong>Backup Completo (Full)</strong>: Copia todos os dados selecionados da máquina. Limpa o bit de arquivamento (marcador). Demorado e pesado.</li>
              <li><strong>Backup Diferencial</strong>: Copia apenas os dados modificados <strong>desde o último backup completo</strong>. Não limpa o bit de arquivamento (os backups subsequentes continuam copiando as mesmas coisas até outro completo). Recuperação exige apenas o último completo + o último diferencial.</li>
              <li><strong>Backup Incremental</strong>: Copia apenas os dados modificados <strong>desde o último backup de qualquer tipo</strong>. Limpa o bit de arquivamento. Leve e rápido de fazer. Recuperação exige o último completo + TODOS os incrementais em sequência.</li>
            </ul>
          </div>
        `,
        materials: ["Segurança de Dados", "Estratégia de Backup"],
        tools: ["CEBRASPE - Segurança e Backups"],
        keyTakeaways: [
          "A restauração de backup Diferencial requer o último Completo e APENAS o último backup diferencial realizado.",
          "A restauração de backup Incremental requer o último Completo e TODOS os backups incrementais subsequentes em ordem cronológica.",
          "Dados produzidos após o último backup parcial e antes da falha serão perdidos."
        ]
      },
      {
        id: 'ti-redes',
        title: 'Protocolos de Redes e Navegadores',
        paretoRatio: 'Média Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">Protocolos de rede garantem a entrega e formatação dos dados na internet.</p>
          <ul class="list-disc pl-4 text-xs text-slate-600 space-y-2 mb-3">
            <li><strong>SMTP (Simple Mail Transfer Protocol)</strong>: Protocolo padrão para o <strong>envio</strong> (saída) de e-mails.</li>
            <li><strong>POP3 (Post Office Protocol v3)</strong>: Protocolo de recepção que descarrega as mensagens do servidor para a máquina local e, por padrão, as remove do servidor.</li>
            <li><strong>IMAP (Internet Message Access Protocol)</strong>: Protocolo de recepção que sincroniza as mensagens, permitindo visualizar e gerenciar e-mails diretamente no servidor de forma síncrona em múltiplos dispositivos.</li>
            <li><strong>HTTP/1.1 vs HTTP/2</strong>: O HTTP/2 introduziu a <strong>multiplexação de mensagens</strong>, permitindo enviar múltiplas requisições e respostas simultaneamente sobre uma única conexão TCP, reduzindo gargalos.</li>
          </ul>
        `,
        materials: ["Protocolos de Aplicação TCP/IP", "Internet"],
        tools: ["CEBRASPE - Redes de Computadores"],
        keyTakeaways: [
          "SMTP envia e-mails; POP3 e IMAP recebem e-mails.",
          "POP3 remove as mensagens do servidor após o download, por padrão; IMAP mantém a sincronia remota.",
          "O HTTP/2 otimiza conexões com multiplexação e compressão de cabeçalho."
        ]
      }
    ]
  },
  {
    id: 'etica',
    title: 'Ética e Compliance',
    icon: 'Shield',
    color: 'amber',
    difficulty: 'Fácil',
    weight: '10%',
    paretoJustification: 'A prova cobra fortemente a distinção filosófica entre Ética e Moral, o Código de Ética dos Servidores Federais (Decreto 1.171/94) e os pilares de programas de Compliance (Integridade).',
    cards: [
      {
        id: 'et-etica-moral',
        title: 'Ética versus Moral',
        paretoRatio: 'Alta Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">Diferenciar Ética de Moral é o primeiro passo para gabaritar a disciplina no CEBRASPE.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
            <div class="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span class="font-bold text-amber-800">Ética (Teórica/Universal):</span>
              <p class="text-amber-700 mt-1">É a filosofia moral. Um campo de estudo reflexivo, perene, universal, racional e abstrato. É o conjunto de princípios norteadores que julgam o caráter e os valores morais de uma sociedade.</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span class="font-bold text-slate-800">Moral (Prática/Cultural):</span>
              <p class="text-slate-700 mt-1">É a prática dos costumes de um povo. É temporal (muda com o tempo), regional/cultural, pragmática, concreta e aplicada ao cotidiano das comunidades.</p>
            </div>
          </div>
        `,
        materials: ["Filosofia Moral", "Conceitos de Ética"],
        tools: ["CEBRASPE - Princípios de Ética"],
        keyTakeaways: [
          "Ética estuda e fundamenta a Moral. A ética é universal; a moral é relativa à cultura e ao tempo.",
          "Valores éticos buscam a imparcialidade e o bem comum de forma reflexiva.",
          "A moral se manifesta através de regras de conduta práticas adotadas por um grupo social."
        ]
      },
      {
        id: 'et-decreto',
        title: 'Decreto Federal nº 1.171/1994',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">O Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal é o documento máximo cobrado em leis especiais federais e estaduais correlatas.</p>
          <div class="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 text-xs mb-3">
            <p class="font-bold text-amber-900">Regras de Ouro e Penalidade:</p>
            <ul class="list-disc pl-4 text-amber-800 mt-1 space-y-1">
              <li><strong>Pena de Censura</strong>: A <strong>única penalidade</strong> aplicada pela Comissão de Ética é a censura. A comissão NÃO demite, suspende ou adverte. Sua função é puramente ética.</li>
              <li><strong>Parecer Fundamentado</strong>: A pena é lavrada em parecer fundamentado, devidamente assinado por todos os integrantes da Comissão, notificando formalmente o servidor apenado.</li>
              <li><strong>Conflito de Interesses</strong>: O servidor público federal não deve exercer gerência/administração de sociedade privada, comércio ou comércio de ações que conflitem com sua função pública.</li>
            </ul>
          </div>
        `,
        materials: ["Decreto nº 1.171/1994", "Regras Deontológicas"],
        tools: ["CEBRASPE - Conduta no Setor Público"],
        keyTakeaways: [
          "A única penalidade administrativa aplicada pela Comissão de Ética é a censura.",
          "A moralidade administrativa não se limita à legalidade; exige distinção do que é honesto e oportuno.",
          "A ausência do servidor de seu posto de trabalho é fator de desordem ética e social."
        ]
      },
      {
        id: 'et-compliance',
        title: 'Compliance e Integridade no Setor Público',
        paretoRatio: 'Média Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">Programas de Compliance e integridade visam mitigar riscos e combater fraudes na Administração Pública.</p>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <p class="font-bold text-slate-800">Pilares Fundamentais do Compliance:</p>
            <ol class="list-decimal pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Suporte da Alta Administração</strong>: Imprescindível para o comprometimento e patrocínio das ações.</li>
              <li><strong>Código de Conduta e Políticas</strong>: Estabelece as regras e a governança ética.</li>
              <li><strong>Controles Internos</strong>: Monitoramento e conciliação financeira, administrativa e operacional.</li>
              <li><strong>Treinamento e Comunicação</strong>: Disseminação da cultura de conformidade a todos os níveis.</li>
              <li><strong>Canais de Denúncia</strong>: Mecanismos seguros, anônimos e eficazes para captação de desvios.</li>
            </ol>
          </div>
        `,
        materials: ["Programas de Compliance", "Governança Pública"],
        tools: ["CEBRASPE - Compliance no Setor Público"],
        keyTakeaways: [
          "O suporte e o exemplo (Tone from the Top) da Alta Administração é o pilar mais crítico de integridade.",
          "Controles internos e auditoria independente garantem a eficácia do programa.",
          "Canais de denúncia devem assegurar absoluto sigilo e proibição de retaliação."
        ]
      }
    ]
  },
  {
    id: 'alagoas',
    title: 'Conhecimentos de Alagoas',
    icon: 'MapPin',
    color: 'rose',
    difficulty: 'Médio',
    weight: '10%',
    paretoJustification: 'Alagoas possui história riquíssima e geografia característica. Cerca de 80% das questões recaem sobre a Emancipação de 1817, o Quilombo dos Palmares e a divisão física das mesorregiões associada à economia açucareira/turística.',
    cards: [
      {
        id: 'al-emancipacao',
        title: 'Emancipação Política de Alagoas',
        paretoRatio: 'Altíssima Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A independência jurídica e política de Alagoas está intimamente ligada a um fato revolucionário em Pernambuco.</p>
          <div class="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-500 text-xs mb-3">
            <p class="font-bold text-rose-900">Linha do Tempo da Emancipação:</p>
            <ul class="list-disc pl-4 text-rose-800 mt-1 space-y-1">
              <li><strong>Até 1817</strong>: Alagoas pertencia à Comarca de Pernambuco (Capitania).</li>
              <li><strong>A Revolta Pernambucana de 1817</strong>: Como punição de D. João VI à elite de Pernambuco que tentou proclamar a República, e recompensa aos alagoanos que permaneceram fiéis à Coroa, Alagoas foi <strong>emancipada juridicamente</strong> em 16 de setembro de 1817.</li>
              <li><strong>Elevação a Província (1821)</strong>: Alagoas foi elevada ao patamar de Província autônoma logo após a Revolução Liberal do Porto.</li>
              <li><strong>Primeira Capital</strong>: A capital original era <strong>Santa Maria de Alagoas</strong> (hoje Marechal Deodoro). Em 1839, a capital foi oficialmente transferida para Maceió, devido ao crescimento do porto e escoamento comercial de açúcar.</li>
            </ul>
          </div>
        `,
        materials: ["História de Alagoas", "Processo de Emancipação de 1817"],
        tools: ["CEBRASPE - História Estadual"],
        keyTakeaways: [
          "A Emancipação ocorreu em 16 de setembro de 1817, assinada por decreto real de D. João VI.",
          "A emancipação foi uma penalidade aplicada a Pernambuco pela revolta e uma gratificação a Alagoas por fidelidade.",
          "Marechal Deodoro foi a primeira capital; Maceió assumiu em 1839 motivada pela pujança do comércio portuário."
        ]
      },
      {
        id: 'al-palmares',
        title: 'Quilombo dos Palmares e Zumbi',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">O maior símbolo de resistência à escravidão na América Latina localizou-se no atual território alagoano, na Serra da Barriga (União dos Palmares).</p>
          <ul class="list-disc pl-4 text-xs text-slate-600 space-y-2 mb-3">
            <li><strong>Estrutura de Confederação</strong>: Palmares era composto por vários mocambos (aldeamentos), chegando a abrigar mais de 20 mil habitantes livres.</li>
            <li><strong>Lideranças</strong>: Ganga Zumba (pactuou a paz temporária com a coroa portuguesa) e seu sobrinho <strong>Zumbi dos Palmares</strong> (rejeitou o acordo, assumiu o comando e resistiu até a morte).</li>
            <li><strong>Queda do Quilombo</strong>: Ocorreu em 1694, após investidas de tropas bandeirantes contratadas lideradas por Domingos Jorge Velho. Zumbi foi capturado e executado em 20 de novembro de 1695.</li>
          </ul>
        `,
        materials: ["Historiografia da Resistência Negra", "Quilombos"],
        tools: ["CEBRASPE - Cultura Afro-Alagoana"],
        keyTakeaways: [
          "Palmares se localizava na Serra da Barriga, na atual cidade de União dos Palmares/AL.",
          "Ganga Zumba tentou assinar um tratado de paz que mantinha libertos apenas os nascidos em Palmares; Zumbi recusou e rompeu.",
          "Domingos Jorge Velho liderou a destruição final de Palmares em 1694."
        ]
      },
      {
        id: 'al-geografia',
        title: 'Geografia e Mesorregiões de Alagoas',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Alagoas é dividido geograficamente em 4 mesorregiões, cada uma com características físico-climáticas e econômicas muito distintas.</p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs mb-3">
            <div class="bg-rose-50 p-2 rounded border border-rose-200">
              <span class="font-bold text-rose-800">Litoral</span>
              <p class="text-rose-700 mt-1 text-[11px]">Costa de areia, praias quentes. Economia focada no turismo nacional/internacional e comércio costeiro.</p>
            </div>
            <div class="bg-rose-50 p-2 rounded border border-rose-200">
              <span class="font-bold text-rose-800">Zona da Mata</span>
              <p class="text-rose-700 mt-1 text-[11px]">Mais úmida e fértil. Solo argiloso, dominado historicamente pela agroindústria canavieira (açúcar e álcool).</p>
            </div>
            <div class="bg-rose-50 p-2 rounded border border-rose-200">
              <span class="font-bold text-rose-800">Agreste</span>
              <p class="text-rose-700 mt-1 text-[11px]">Transição climática. Solo de média umidade. Foco em agricultura familiar e bacia leiteira (Arapiraca/Palmeira dos Índios).</p>
            </div>
            <div class="bg-rose-50 p-2 rounded border border-rose-200">
              <span class="font-bold text-rose-800">Sertão</span>
              <p class="text-rose-700 mt-1 text-[11px]">Clima semiárido, vegetação de caatinga. Rio São Francisco é vital para irrigação, energia e piscicultura.</p>
            </div>
          </div>
        `,
        materials: ["Geografia de Alagoas", "Bacias Hidrográficas"],
        tools: ["CEBRASPE - Geografia Física e Econômica"],
        keyTakeaways: [
          "O Rio São Francisco atua como a espinha dorsal de abastecimento e geração de energia (Complexo Delmiro Gouveia/Chesf) no Sertão.",
          "A economia de Alagoas apoia-se historicamente no binômio Cana-de-açúcar (Zona da Mata) e Turismo (Litoral).",
          "O Agreste tem em Arapiraca o grande polo de comércio de serviços e agricultura."
        ]
      }
    ]
  },
  {
    id: 'ingles',
    title: 'Língua Inglesa',
    icon: 'Languages',
    color: 'indigo',
    difficulty: 'Médio',
    weight: '10%',
    paretoJustification: 'CEBRASPE cobra intensamente leitura e interpretação de textos técnicos e de atualidades, focando em identificar ideias centrais, o papel semântico de conjunções/conectores lógicos e a identificação anafórica de pronomes.',
    cards: [
      {
        id: 'ing-reading',
        title: 'Leitura e Compreensão de Textos Técnicos',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Para o CEBRASPE, você não precisa traduzir palavra por palavra, mas sim aplicar estratégias rápidas de leitura (Skimming e Scanning) para capturar o sentido global e responder às assertivas:</p>
          <div class="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <p class="font-bold text-indigo-900">Estratégias Chaves para a Prova:</p>
            <ul class="list-disc pl-4 text-indigo-800 mt-1 space-y-1">
              <li><strong>Skimming</strong>: Olhar rápido para ter uma ideia do assunto geral (títulos, subtítulos, primeira e última frase dos parágrafos).</li>
              <li><strong>Scanning</strong>: Busca direcionada por termos específicos que a assertiva da prova menciona (números, nomes próprios, siglas ou termos técnicos).</li>
              <li><strong>Falsos Cognatos (False Friends)</strong>: Cuidado com termos como <em>actually</em> (na verdade, e não atualmente), <em>pretend</em> (fingir, e não pretender) ou <em>intend</em> (pretender).</li>
            </ul>
          </div>
        `,
        materials: ["Estratégias de Skimming e Scanning", "Vocabulário Técnico de TI e Inovação"],
        tools: ["CEBRASPE - English Reading Comprehension"],
        keyTakeaways: [
          "Identificar a ideia central e as ideias secundárias é mais valioso do que traduzir literalmente.",
          "O vocabulário técnico de TI foca em termos como 'framework', 'database', 'foster', 'accountability', 'compliance'.",
          "Atente-se aos falsos cognatos comuns, pois são alvos frequentes para enganar o candidato."
        ]
      },
      {
        id: 'ing-connectors',
        title: 'Conectores Lógicos e Marcadores de Transição',
        paretoRatio: 'Altíssima Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">Os conectores lógicos ligam as ideias do texto e expressam relações essenciais (contraste, adição, consequência, causa). CEBRASPE frequentemente questiona se um conector pode ser substituído por outro:</p>
          <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-3">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-300 font-bold text-slate-800">
                  <th class="py-1">Valor Lógico</th>
                  <th class="py-1">Conectores Principais</th>
                  <th class="py-1">Tradução</th>
                </tr>
              </thead>
              <tbody class="text-slate-700 divide-y divide-slate-100">
                <tr>
                  <td class="py-1"><strong>Contraste/Concessão</strong></td>
                  <td class="py-1">Although, Even though, However, Nonetheless, Nevertheless</td>
                  <td class="py-1">Embora, No entanto, Todavia</td>
                </tr>
                <tr>
                  <td class="py-1"><strong>Adição</strong></td>
                  <td class="py-1">Furthermore, Moreover, In addition, Besides</td>
                  <td class="py-1">Além disso, Além de</td>
                </tr>
                <tr>
                  <td class="py-1"><strong>Causa/Razão</strong></td>
                  <td class="py-1">Since, Because, As, Due to</td>
                  <td class="py-1">Já que, Desde que, Devido a</td>
                </tr>
                <tr>
                  <td class="py-1"><strong>Condição</strong></td>
                  <td class="py-1">Unless, Provided that, As long as</td>
                  <td class="py-1">A menos que, Contanto que</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-slate-600"><strong>Dica de ouro:</strong> 'Although' pode ser substituído por 'Even though'; 'Nonetheless' pode ser substituído por 'Nevertheless' ou 'However' mantendo o sentido de oposição.</p>
        `,
        materials: ["Logical Connectors Guide", "CEBRASPE Transitions Database"],
        tools: ["CEBRASPE - English Grammar"],
        keyTakeaways: [
          "O conector 'Unless' equivale a 'if... not' (a menos que, se não).",
          "'Furthermore' e 'Moreover' são perfeitamente intercambiáveis e indicam adição/suplemento.",
          "O termo 'Since' pode expressar tanto tempo (desde) quanto causa (visto que, já que)."
        ]
      },
      {
        id: 'ing-pronouns',
        title: 'Referência Anafórica e Coesão Pronominal',
        paretoRatio: 'Alta Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">A banca CEBRASPE adora perguntar a que termo um pronome ou expressão se refere anaforicamente (retomando algo anterior) ou cataforicamente (antecedendo algo posterior):</p>
          <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs mb-3 space-y-2">
            <p><strong>Pronomes Neutros e Plurais:</strong> O pronome <em>it</em> refere-se a um elemento singular e inanimado (ex: <em>the company</em>). O pronome <em>they</em> ou <em>their</em> refere-se a elementos plurais, podendo ser animados ou inanimados (ex: <em>the researchers</em> ou <em>the systems</em>).</p>
            <p><strong>Pronomes Relativos:</strong> <em>which</em> refere-se a coisas/ideias; <em>who</em> refere-se a pessoas; <em>whose</em> indica posse (cujo/cuja).</p>
          </div>
        `,
        materials: ["Anaphoric Reference Rules", "Pronouns in Context"],
        tools: ["CEBRASPE - Cohesion and Pronouns"],
        keyTakeaways: [
          "O pronome neutro 'it' é sempre singular e retoma um substantivo inanimado ou conceito mencionado imediatamente antes.",
          "'Which' atua como pronome relativo introduzindo orações explicativas ou restritivas referentes a objetos ou ideias.",
          "A correspondência exata do sujeito ao pronome possessivo 'its' (dele/dela para neutro) ou 'their' (deles/delas) evita erros clássicos."
        ]
      }
    ]
  },
  {
    id: 'especificos',
    title: 'Conhecimentos Específicos (TI)',
    icon: 'Terminal',
    color: 'slate',
    difficulty: 'Difícil',
    weight: '50%',
    paretoJustification: 'O maior peso da prova. O Pareto Recursivo extraído dos exames CEBRASPE recentes aponta que os tópicos quentes são: Processos Ágeis (Scrum 2020), Desenvolvimento em Java/Python, Bancos de Dados (PostgreSQL, Oracle 21C, MySQL), Engenharia de Software/Requisitos (e ferramentas No-code/Power Automate), Segurança (ISO 27001, OWASP Top 10), Fiscalização de Contratos (Lei 13.303/2016) e Ciência de Dados.',
    cards: [
      {
        id: 'esp-devops',
        title: 'DevOps, DevSecOps e Testes Automatizados',
        paretoRatio: 'Altíssima Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A modernização da arquitetura e esteiras ágeis exigem amplo conhecimento de Integração Contínua (CI) e Entrega Contínua (CD).</p>
          <div class="bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs space-y-2 mb-3">
            <p><strong>CircleCI vs Jenkins</strong>: O CircleCI utiliza-se de dependências do cache e camadas do Docker nativas para otimizar desempenho e acelerar deploys. O Jenkins é altamente personalizável e requer plugins para escalabilidade.</p>
            <p><strong>Proxy Reverso</strong>: Servidor que reside na frente dos servidores de origem na web (não de clientes), interceptando requisições dos clientes e repassando-as para balanceamento de carga, ocultando os servidores reais sob um único domínio.</p>
            <p><strong>Test Driven Development (TDD)</strong>: Desenvolvimento Guiado por Testes. Ciclo 'Red-Green-Refactor': cria-se o teste unitário <strong>antes</strong> da classe de produção (o teste guia a codificação).</p>
            <p><strong>Testes Unitários</strong>: São testes isolados de partes mínimas do código. Suas dependências <strong>não podem ter relação com recursos externos reais</strong> (banco de dados, APIs). Para isolá-los, utilizam-se Mocks.</p>
          </div>
        `,
        materials: ["DevOps Patterns", "Automated Testing Theory"],
        tools: ["CEBRASPE - DevOps e Engenharia"],
        keyTakeaways: [
          "O TDD prega a escrita do teste unitário antes de criar a lógica de produção correspondente.",
          "O CircleCI acelera compilações reaproveitando cache de dependências e camadas de containers Docker.",
          "Um teste unitário legítimo deve usar mocks ou stubs para isolar chamadas a banco de dados ou redes."
        ]
      },
      {
        id: 'esp-banco',
        title: 'Normalização, SQL ANSI e Plataformas SGBD',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Bancos de dados relacionais (PostgreSQL, Oracle 21C, MySQL) e NoSQL são cobrados de forma detalhada na normalização e linguagens DDL/DML.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-600 text-xs space-y-2 mb-3">
            <p class="font-bold text-slate-800">Camadas de Normalização de Dados:</p>
            <ul class="list-disc pl-4 text-slate-600 space-y-0.5">
              <li><strong>1ª Forma Normal (1FN)</strong>: Atributos atômicos, sem coleções ou grupos repetitivos.</li>
              <li><strong>2ª Forma Normal (2FN)</strong>: Na 1FN + eliminação de dependências parciais sobre chaves primárias compostas.</li>
              <li><strong>3ª Forma Normal (3FN)</strong>: Na 2FN + eliminação de dependências transitivas entre atributos não-chave.</li>
            </ul>
            <p class="font-bold text-slate-800">Diferenciação SGBDs e NoSQL:</p>
            <p><strong>PostgreSQL, Oracle 21C, MySQL</strong>: Abordagem relacional, ACID rígido e integridade referencial por padrão. <strong>NoSQL</strong> (bancos orientados a documentos, colunas, grafos ou chave-valor) prioriza escalabilidade horizontal e flexibilidade de esquema.</p>
          </div>
        `,
        materials: ["Relational Database Theory", "ANSI SQL Specification"],
        tools: ["CEBRASPE - Bancos de Dados"],
        keyTakeaways: [
          "A 2FN foca em dependências funcionais de chaves primárias compostas.",
          "A 3FN elimina atributos que dependem de outros atributos não-chave (dependência transitiva).",
          "PostgreSQL, Oracle e MySQL são relacionais; NoSQL flexibiliza o esquema para alta performance em larga escala."
        ]
      },
      {
        id: 'esp-seguranca',
        title: 'Segurança, Autenticação, OWASP e ISO 27001/27002',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Compreender a proteção contra ameaças e os padrões de conformidade (ISO 27001, ISO 27002, NIST) é obrigatório.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-500 text-xs mb-3 space-y-2">
            <p><strong>Mitigação OWASP Top 10</strong>:</p>
            <ul class="list-disc pl-4 space-y-1">
              <li><strong>SQL Injection (SQLi)</strong>: Resolvido pelo uso de <em>Parameterized Queries</em> (Prepared Statements) ou ORM. Nunca concatenar strings de entrada diretamente na consulta SQL.</li>
              <li><strong>Cross-Site Scripting (XSS)</strong>: Resolvido pela sanitização de saídas de texto e cabeçalhos Content Security Policy (CSP).</li>
            </ul>
            <p><strong>Protocolos e Normas</strong>: OAuth 2.0 (fluxo de autorização baseado em tokens JWT) e as normas de governança ISO/IEC 27001 (requisitos de SGSI) e ISO/IEC 27002 (código de práticas e controles de segurança cibernética).</p>
          </div>
        `,
        materials: ["NIST Cybersecurity Framework", "OAuth 2.0 RFC 6749", "OWASP Top 10 Guides"],
        tools: ["CEBRASPE - Segurança Avançada"],
        keyTakeaways: [
          "Preparar comandos (Prepared Statements) com parâmetros predefinidos é a principal mitigação para SQL Injection.",
          "ISO 27001 define os requisitos do Sistema de Gestão; ISO 27002 provê o guia prático de controles.",
          "OAuth 2.0 foca em autorização delegada, permitindo que aplicações acessem APIs sem compartilhar a senha do usuário."
        ]
      },
      {
        id: 'esp-processos-engenharia',
        title: 'Processos de Software, Requisitos, Power Automate e CMMI v2.0',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A engenharia de software engloba o ciclo de vida completo do sistema, desde a elicitação até a implantação.</p>
          <div class="bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs space-y-2 mb-3">
            <p><strong>CMMI-DEV v2.0 e Scrum 2020</strong>: O CMMI avalia a maturidade de processos organizacionais em níveis (1 a 5). O Scrum foca no gerenciamento ágil de projetos (com sprints, Product Backlog, Daily Scrum e Sprint Review).</p>
            <p><strong>Elicitação de Requisitos</strong>: Técnicas de levantamento de necessidades funcionais e não-funcionais (entrevistas, brainstorming, prototipagem, análise de documentos).</p>
            <p><strong>Codeless, No-code e Power Automate</strong>: Tecnologias modernas para automação rápida e simplificada de processos de negócios e fluxos de trabalho através de interfaces visuais e lógica assistida.</p>
          </div>
        `,
        materials: ["CMMI v2.0 Guide", "Scrum Guide 2020", "Software Requirements Engineering"],
        tools: ["CEBRASPE - Processos de Software"],
        keyTakeaways: [
          "Scrum 2020 define responsabilidades claras para Scrum Master, Product Owner e Developers.",
          "UML 2 normatiza a modelagem visual do sistema por meio de diagramas como Casos de Uso e Classes.",
          "Power Automate atua como plataforma codeless/low-code do ecossistema corporativo para automação de tarefas e workflow."
        ]
      },
      {
        id: 'esp-desenvolvimento-moderno',
        title: 'Desenvolvimento Web, Mobile, Clean Code e SonarQube',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Engloba as melhores práticas de codificação nas linguagens Java, Python 3.10+, JavaScript, e tecnologias frontend/mobile.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-500 text-xs mb-3 space-y-2">
            <p><strong>Clean Code (Código Limpo)</strong>: Princípios de legibilidade, DRY (Don't Repeat Yourself), nomenclatura autoexplicativa e funções pequenas com responsabilidade única (SOLID).</p>
            <p><strong>SonarQube</strong>: Plataforma de análise estática contínua de código para inspeção de Bugs, Vulnerabilidades (Security Hotspots) e Débito Técnico (Code Smells).</p>
            <p><strong>Frontend SPA e PWAs</strong>: React e VueJS como pilares de Single Page Applications. Progressive Web Apps (PWAs) utilizam <em>Service Workers</em> e manifestos para simular aplicativos nativos e funcionar offline.</p>
          </div>
        `,
        materials: ["Clean Code by Robert Martin", "React & Vue Patterns", "SonarQube Docs"],
        tools: ["CEBRASPE - Práticas de Desenvolvimento"],
        keyTakeaways: [
          "O SonarQube realiza varreduras de análise estática sem a necessidade de executar a aplicação.",
          "Service Workers rodam em segundo plano e são indispensáveis para o funcionamento offline de uma PWA.",
          "Blockchain atua como livro-razão distribuído, auditável, imutável e descentralizado."
        ]
      },
      {
        id: 'esp-fiscalizacao-contratos',
        title: 'Fiscalização de Contratos de TI (Lei nº 13.303/2016)',
        paretoRatio: 'Média-Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A gestão e fiscalização de soluções e contratos de TI exige aderência à legislação e mensuração correta de entregas.</p>
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-2 mb-3">
            <p><strong>Remuneração por Esforço versus Produto</strong>: A contratação de serviços de TI moderna prioriza a entrega por resultado/produto (mensurado em Pontos de Função ou Unidades de Serviço Técnico - UST) ao invés de mera mensuração de horas-homem trabalhadas (esforço).</p>
            <p><strong>Lei das Estatais (Lei nº 13.303/2016)</strong>: Rege as licitações e contratos de empresas públicas e sociedades de economia mista, exigindo matriz de riscos e acordos de nível de serviço (SLA) objetivos.</p>
          </div>
        `,
        materials: ["Lei das Estatais 13.303/2016", "Mapeamento em Ponto de Função"],
        tools: ["CEBRASPE - Governança de TI"],
        keyTakeaways: [
          "A remuneração baseada em pontos de função ou UST protege a Administração Pública de pagar por ineficiência ou horas ociosas.",
          "O fiscal do contrato representa o órgão público no acompanhamento técnico e operacional das entregas de TI.",
          "Cláusulas de Nível de Serviço (SLA) impõem multas graduais e proporcionais se o tempo de resposta ou disponibilidade forem descumpridos."
        ]
      },
      {
        id: 'esp-ciencia-dados',
        title: 'Ciência de Dados, Machine Learning e IA',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Engloba a engenharia de dados, tratamento de grandes volumes e inteligência artificial preditiva.</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-slate-600 text-xs space-y-2 mb-3">
            <p><strong>Python Pandas</strong>: Biblioteca fundamental para manipulação e análise de dataframes. Operações críticas de tratamento de dados nulos (<code>fillna</code>, <code>dropna</code>) e detecção de anomalias/outliers.</p>
            <p><strong>Algoritmos de Machine Learning (Scikit-Learn)</strong>:</p>
            <ul class="list-disc pl-4 space-y-1">
              <li><strong>Classificação e Regressão</strong>: Random Forests, SVM, Naive Bayes e K-NN para aprendizado supervisionado.</li>
              <li><strong>Agrupamento e Redução</strong>: K-Means para aprendizado não-supervisionado e PCA para redução de dimensionalidade.</li>
            </ul>
            <p><strong>Deep Learning</strong>: Redes Neurais com Keras e Pytorch (camadas densas, convolucionais, funções de ativação, backpropagation e mitigações de overfitting como dropout e early stopping).</p>
          </div>
        `,
        materials: ["Pandas Documentation", "Scikit-Learn Machine Learning Map", "Deep Learning Theory"],
        tools: ["CEBRASPE - Ciência de Dados"],
        keyTakeaways: [
          "Validação Cruzada (Cross-Validation) é essencial para garantir a robustez de generalização do modelo preditivo.",
          "O Dropout mitiga o overfitting zerando aleatoriamente ativações de neurônios durante o treinamento.",
          "O PCA reduz a dimensionalidade do dataframe projetando os dados em eixos de maior variância."
        ]
      },
      {
        id: 'esp-cnj',
        title: 'Resoluções CNJ (Poder Judiciário)',
        paretoRatio: 'Alta Frequência (Exclusivo)',
        isQuente: true,
        content: `
          <p class="mb-3">Para analistas de tribunais, o CNJ edita normativos que padronizam a governança e segurança tecnológica de todo o país.</p>
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-2 mb-3">
            <p><strong>Plataforma Digital do Poder Judiciário (PDPJ-Br) - Resolução 335/2020</strong>: Centraliza serviços em microsserviços. Documentação técnica obrigatória sob o padrão <strong>Swagger 2.0</strong> ou superior. É proibida a adoção de sistemas privados que criem dependência tecnológica ou impeçam o compartilhamento de código entre os tribunais parceiros.</p>
            <p><strong>Modelo MoReq-Jus - Resolução 522/2023</strong>: Requisitos para sistemas de gestão documental. Os sistemas antigos em desuso podem ser substituídos por sistemas menos aderentes, desde que os dados sejam permanentemente salvos em repositório arquivístico confiável.</p>
            <p><strong>Estratégia ENSEC-PJ - Resolução 396/2021</strong>: Estabelece a governança cibernética unificada para TODOS os órgãos do Judiciário (incluindo o STF, TST, TRTs, etc.), cobrindo sistemas de processo eletrônico e também sistemas meramente institucionais/administrativos.</p>
          </div>
        `,
        materials: ["Resoluções CNJ 335/2020", "CNJ 396/2021", "CNJ 522/2023"],
        tools: ["CEBRASPE - Normas do Judiciário"],
        keyTakeaways: [
          "PDPJ-Br unifica os tribunais brasileiros em arquitetura de microsserviços com Swagger 2.0.",
          "MoReq-Jus normatiza a integridade, fidedignidade e preservação de documentos jurídicos eletrônicos.",
          "A ENSEC-PJ obriga a implementação de governança cibernética para todo o ecossistema do Judiciário."
        ]
      }
    ]
  },
  {
    id: 'marco_legal_cti',
    title: 'Marco Legal de CT&I',
    icon: 'Shield',
    color: 'sky',
    difficulty: 'Médio',
    weight: '15%',
    paretoJustification: 'O Marco Legal de CT&I nacional (Lei 13.243/2016 e Decreto 9.283/2018) reorganizou as parcerias entre o setor público e o privado. A banca CEBRASPE foca intensamente nos conceitos de Encomenda Tecnológica (ETEC), subvenções, compartilhamento de laboratórios públicos e na regulamentação do ecossistema de inovação de Alagoas (Lei 8.956/2023 e Decreto Estadual 95.265/2024).',
    cards: [
      {
        id: 'cti-fundamentos-constitucionais',
        title: 'Fundamentos Constitucionais de CT&I (EC 85/2015)',
        paretoRatio: 'Alta Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A Emenda Constitucional nº 85/2015 reformulou de forma profunda o tratamento constitucional dado à Ciência, Tecnologia e Inovação (Art. 218 e 219 da CF/88):</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Principais Alterações Constitucionais:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Inclusão da Inovação</strong>: O termo "Inovação" foi formalmente incorporado à Constituição Federal, equiparando seu fomento ao fomento da pesquisa científica pura.</li>
              <li><strong>Tratamento Diferenciado</strong>: O Estado deve dar tratamento prioritário à pesquisa científica básica e tecnológica, visando à autonomia tecnológica e ao desenvolvimento do país.</li>
              <li><strong>Estímulo à Cooperação</strong>: Autorização expressa para a articulação entre ICTs públicas e empresas privadas, simplificando parcerias e intercâmbio de pesquisadores.</li>
            </ul>
          </div>
          <p class="text-xs text-slate-600"><strong>Dica de Prova:</strong> O mercado interno é considerado patrimônio nacional e será incentivado de modo a viabilizar o desenvolvimento cultural e socioeconômico, bem como a autonomia tecnológica.</p>
        `,
        materials: ["Artigos 218 e 219 da CF/88", "Texto da Emenda Constitucional 85/2015"],
        tools: ["CEBRASPE - Direito Constitucional"],
        keyTakeaways: [
          "A EC 85/2015 incluiu formalmente o termo 'Inovação' na Constituição Federal.",
          "O Estado é constitucionalmente obrigado a incentivar a formação e o fortalecimento da inovação no setor produtivo.",
          "A autonomia tecnológica e a soberania científica nacional são objetivos de primeira linha inscritos na Carta Magna."
        ]
      },
      {
        id: 'cti-lei-inovacao',
        title: 'Lei de Inovação (Lei nº 10.973/2004)',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei nº 10.973/2004 (conhecida como Lei de Inovação) estabelece medidas de incentivo à inovação e à pesquisa científica e tecnológica no ambiente produtivo:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Conceitos e Atores Críticos (Art. 2º):</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Instituição Científica, Tecnológica e de Inovação (ICT)</strong>: Órgão ou entidade da administração pública direta ou indireta ou pessoa jurídica de direito privado sem fins lucrativos que tenha como missão institucional a pesquisa básica ou aplicada de caráter científico ou tecnológico.</li>
              <li><strong>Inovação</strong>: Introdução de novidade ou aperfeiçoamento no ambiente produtivo e social que resulte em novos produtos, serviços ou processos, ou que compreenda a agregação de novas funcionalidades.</li>
              <li><strong>Agência de Fomento</strong>: Órgão ou entidade de direito público ou privado que tenha como objetivo financiar ações voltadas ao desenvolvimento científico e tecnológico.</li>
              <li><strong>Núcleo de Inovação Tecnológica (NIT)</strong>: Estrutura instituída por uma ou mais ICTs para gerir sua política de inovação.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Federal nº 10.973/2004", "Conceitos Legais de Inovação"],
        tools: ["CEBRASPE - Legislação Federal"],
        keyTakeaways: [
          "O NIT é obrigatório para ICTs públicas e coordena a proteção de propriedade intelectual e transferência de tecnologia.",
          "Pesquisadores públicos podem cooperar com empresas e, inclusive, solicitar licença sem vencimento para constituir empresas de base tecnológica.",
          "As agências de fomento estão autorizadas a aplicar recursos sob a forma de subvenção econômica diretamente no setor produtivo."
        ]
      },
      {
        id: 'cti-marco-legal-13243',
        title: 'Marco Legal de CT&I (Lei nº 13.243/2016)',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei nº 13.243/2016 veio para desburocratizar a pesquisa científica no país e aproximar a universidade e os institutos de pesquisa das empresas privadas:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Principais Alterações e Impactos Práticos:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Compartilhamento de Infraestrutura</strong>: ICTs públicas podem autorizar o uso de seus laboratórios e recursos humanos por empresas privadas (com ou sem fins lucrativos), mediante remuneração financeira ou em propriedade intelectual.</li>
              <li><strong>Prestação de Serviços Técnico-Especiais</strong>: Permite a contratação de ICTs públicas diretamente por empresas para atividades de pesquisa e desenvolvimento científico.</li>
              <li><strong>Regime Especial de Licitação</strong>: Institui dispensa de licitação para compras e contratações de insumos destinados estritamente a projetos de pesquisa científica, tecnológica e de inovação.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Federal nº 13.243/2016", "Estudos de Impacto do Marco Legal"],
        tools: ["CEBRASPE - Parcerias Públicas"],
        keyTakeaways: [
          "A lei regulamentou a subvenção econômica para empresas inovadoras de todos os portes.",
          "Pesquisadores públicos sob regime de Dedicação Exclusiva (DE) podem exercer atividades remuneradas de pesquisa e inovação em empresas de forma limitada.",
          "As ICTs públicas podem participar do capital social de empresas de base tecnológica (Startups)."
        ]
      },
      {
        id: 'cti-decreto-9283',
        title: 'Regulamentação Federal (Decreto nº 9.283/2018)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">O Decreto nº 9.283/2018 regulamenta a Lei de Inovação e as alterações do Marco Legal de CT&I, estabelecendo ritos procedimentais e salvaguardas para o administrador público:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Instrumentos e Operacionalização:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Termo de Outorga</strong>: Instrumento para concessão de bolsas e auxílios financeiros diretamente a pesquisadores e inventores independentes.</li>
              <li><strong>Acordo de Parceria</strong>: Celebração de projetos conjuntos de P&D entre ICTs públicas e entidades privadas, definindo a partilha de resultados e propriedade intelectual.</li>
              <li><strong>Prestação de Contas Simplificada</strong>: Foco nos resultados técnico-científicos alcançados e não apenas na verificação formal de comprovantes de despesas cotidianas, desde que respeitados os parâmetros regulamentares.</li>
            </ul>
          </div>
        `,
        materials: ["Decreto Federal nº 9.283/2018", "Guia de Prestação de Contas CT&I"],
        tools: ["CEBRASPE - Gestão Pública"],
        keyTakeaways: [
          "O decreto institui mecanismos claros de controle e auditoria baseados no atingimento de metas científicas (Accountability).",
          "O Acordo de Parceria define previamente de quem será a titularidade da patente gerada no projeto cooperado.",
          "Garante a segurança jurídica para o gestor público assumir riscos inerentes a atividades de pesquisa científica."
        ]
      },
      {
        id: 'cti-encomenda-tecnologica',
        title: 'Encomenda Tecnológica (ETEC)',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Encomenda Tecnológica (ETEC) é um instrumento de compra pública de alta complexidade regulado pelo Art. 20 da Lei de Inovação e detalhado pelo Decreto nº 9.283/2018:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Conceito e Elementos Estruturantes:</h4>
            <p class="mb-2"><strong>O que é?</strong> É a contratação direta de prestador de serviço ou empresa para realizar atividades de desenvolvimento tecnológico de produtos ou processos que envolvam <strong>alto risco tecnológico</strong> e cujas soluções não estejam disponíveis de antemão no mercado de consumo comum.</p>
            <ul class="list-disc pl-4 text-slate-600 space-y-1">
              <li><strong>Risco Tecnológico</strong>: Possibilidade de a solução buscada não ser tecnicamente viável ou não atingir o desempenho pretendido, mesmo com a execução diligente dos trabalhos.</li>
              <li><strong>Dispensa de Licitação</strong>: Contratada de forma direta por inexigibilidade ou dispensa fundamentada tecnicamente.</li>
              <li><strong>Lógica do Instrumento</strong>: O Estado assume o risco financeiro do insucesso da pesquisa em prol do potencial benefício social da inovação disruptiva.</li>
            </ul>
          </div>
        `,
        materials: ["Manual de Encomenda Tecnológica", "Casos Práticos de ETEC no Brasil"],
        tools: ["CEBRASPE - Licitações e Contratos"],
        keyTakeaways: [
          "Na ETEC, o pagamento pode ser efetuado mesmo que o resultado tecnológico pretendido não seja alcançado, desde que comprovada a boa-fé e o cumprimento diligente do plano de trabalho.",
          "Exige mapeamento prévio de que não há solução comercialmente viável no mercado nacional ou internacional.",
          "O contrato de ETEC deve prever regras explícitas sobre a propriedade intelectual e direito de exploração comercial do produto gerado."
        ]
      },
      {
        id: 'cti-pni-10534',
        title: 'Política Nacional de Inovação (Decreto nº 10.534/2020)',
        paretoRatio: 'Média Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">O Decreto nº 10.534/2020 institui a Política Nacional de Inovação (PNI) com a finalidade de orientar, coordenar e integrar as ações de fomento à inovação no Brasil:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Eixos Estratégicos da PNI:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Fomento à Inovação no Setor Privado</strong>: Incentivo à competitividade global das empresas brasileiras e à criação de empregos de alto valor agregado.</li>
              <li><strong>Tecnologia e Inserção Social</strong>: Difusão de tecnologias para melhoria de serviços públicos essenciais, como saúde, educação e segurança pública.</li>
              <li><strong>Governança Unificada</strong>: Criação da Câmara de Inovação Federal para articular os recursos de ministérios e agências reguladoras de fomento (Finep, CNPq).</li>
            </ul>
          </div>
        `,
        materials: ["Decreto nº 10.534/2020", "Planejamento Estratégico de Inovação"],
        tools: ["CEBRASPE - Políticas Públicas"],
        keyTakeaways: [
          "A PNI busca superar o isolamento entre a academia e o setor empresarial, unificando canais de financiamento público.",
          "Prioriza o investimento em talentos humanos e infraestrutura tecnológica de ponta.",
          "Alinha as ações de fomento nacional às melhores práticas de desenvolvimento sustentável internacionais."
        ]
      },
      {
        id: 'cti-lei-bem-startups',
        title: 'Lei do Bem (11.196/2005) e Startups (LC 182/2021)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Dois instrumentos centrais de suporte indireto e desburocratização do empreendedorismo inovador:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs space-y-2">
            <p><strong>Lei do Bem (Lei nº 11.196/2005)</strong>: Institui incentivos fiscais significativos para empresas que realizam Pesquisa, Desenvolvimento e Inovação Tecnológica (PD&I). Destaca-se a dedução de despesas operacionais de P&D da base de cálculo do IRPJ e da CSLL (regime de Lucro Real).</p>
            <p><strong>Marco Legal das Startups (Lei Complementar nº 182/2021)</strong>: Estabelece o enquadramento de startups, facilita o aporte de capital por investidores-anjo sem responsabilização por dívidas da empresa (segurança jurídica) e cria a modalidade especial de licitação 'Sandbox Regulatório' e o contrato de teste de soluções inovadoras (CPSI).</p>
          </div>
        `,
        materials: ["Lei do Bem nº 11.196/2005", "Lei Complementar nº 182/2021"],
        tools: ["CEBRASPE - Direito Tributário e Empresarial"],
        keyTakeaways: [
          "A Lei do Bem aplica-se exclusivamente a empresas optantes pelo regime de tributação do Lucro Real.",
          "O Marco Legal das Startups protege o Investidor-Anjo, de modo que ele não responde solidariamente pelas dívidas trabalhistas ou fiscais da startup.",
          "O CPSI (Contrato Público para Solução Inovadora) permite ao Estado testar soluções de startups com teto especial de faturamento."
        ]
      },
      {
        id: 'cti-legislacao-alagoas',
        title: 'Ecossistema de Alagoas (Lei 8.956/2023 & Decreto 95.265/2024)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A legislação de Alagoas internalizou os preceitos do Marco Legal Federal, criando estruturas específicas de fomento e operacionalização da inovação regional:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Inovações do Estado de Alagoas:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Lei Estadual nº 8.956/2023</strong>: Institui a Política Estadual de CT&I, definindo a FAPEAL como órgão técnico-executivo chave do sistema de fomento do Estado de Alagoas.</li>
              <li><strong>Decreto Estadual nº 95.265/2024</strong>: Regulamenta as medidas de estímulo à inovação trazidas pela Lei 8.956/2023, operacionalizando a concessão de bolsas de inovação, subvenções econômicas locais e o uso partilhado de laboratórios públicos estaduais.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Estadual nº 8.956/2023", "Decreto Estadual nº 95.265/2024"],
        tools: ["CEBRASPE - Legislação Estadual"],
        keyTakeaways: [
          "A Lei Estadual 8.956/2023 organiza o Sistema Estadual de CT&I de Alagoas sob a liderança do Executivo.",
          "O Decreto 95.265/2024 define os ritos seguros para que as ICTs estaduais assinem parcerias com empresas locais.",
          "Bolsas de estímulo à inovação de Alagoas possuem isenção tributária conforme os parâmetros normativos."
        ]
      }
    ]
  },
  {
    id: 'legislacao_especifica_fapeal',
    title: 'Legislações Específicas',
    icon: 'FileText',
    color: 'indigo',
    difficulty: 'Médio',
    weight: '15%',
    paretoJustification: 'As leis específicas do Estado de Alagoas determinam a estrutura de cargos, o plano de carreira, o regime de trabalho e a própria natureza jurídica de direito público da FAPEAL, bem como o regime estatutário (RJU) aplicável aos seus servidores públicos.',
    cards: [
      {
        id: 'leg-fapeal-8956',
        title: 'Política Estadual de CT&I (Lei nº 8.956/2023)',
        paretoRatio: 'Alta Frequência (80/20)',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei Estadual nº 8.956/2023 institui a Política Estadual da Ciência, Tecnologia e Inovação do Estado de Alagoas, consolidando regras para a consolidação do ecossistema local:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Diretrizes da Lei nº 8.956/2023:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Objetivo</strong>: Promover a pesquisa, a capacitação científica e o desenvolvimento de base tecnológica para a redução das desigualdades regionais e sociais no Estado.</li>
              <li><strong>Fomento Ativo</strong>: Atuação forte de agências de fomento, especificamente a FAPEAL, no financiamento de projetos acadêmicos e corporativos inovadores.</li>
              <li><strong>Parcerias Locais</strong>: Facilita convênios entre a FAPEAL, universidades alagoanas (como UFAL, UNEAL, UNCISAL) e o ecossistema empresarial local.</li>
            </ul>
          </div>
        `,
        materials: ["Inteiro Teor da Lei nº 8.956/2023"],
        tools: ["CEBRASPE - Legislação Especial Alagoas"],
        keyTakeaways: [
          "A lei estabelece que o fomento à inovação deve priorizar setores estratégicos da economia de Alagoas (turismo, energias, agricultura).",
          "Determina a governança de fomento visando simplificação e transparência de editais de seleção de bolsistas.",
          "Fortalece o papel estratégico da FAPEAL como integradora das ICTs do Estado de Alagoas."
        ]
      },
      {
        id: 'leg-fapeal-delegada-48',
        title: 'Modelo de Gestão e FAPEAL (Lei Delegada nº 48/2022)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei Delegada nº 48/2022 institui o modelo de gestão da administração pública estadual do Poder Executivo e define a estrutura e cargos da FAPEAL:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Estrutura de Gestão e Cargos:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Vinculação Administrativa</strong>: Define de forma clara a que secretaria a FAPEAL está hierarquicamente vinculada dentro da estrutura de órgãos do Poder Executivo de Alagoas.</li>
              <li><strong>Cargos Integrantes</strong>: Estrutura os cargos de Direção Superior, Assessoramento Especial e Funções de Confiança da fundação.</li>
              <li><strong>Competências Executivas</strong>: Atribuições do Diretor-Presidente, Diretores Setoriais (Científico, de Inovação, Administrativo-Financeiro) e do Conselho Superior da fundação.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Delegada Estadual nº 48/2022"],
        tools: ["CEBRASPE - Administração Pública Estadual"],
        keyTakeaways: [
          "O estatuto de cargos garante a FAPEAL profissionais técnicos em cargos chaves de governança científica.",
          "A Lei Delegada reestruturou o organograma do Executivo do Estado, assegurando autonomia orçamentária relativa à fundação.",
          "Regula as funções comissionadas voltadas à auditoria técnica interna de projetos subvencionados."
        ]
      },
      {
        id: 'leg-fapeal-incentivos-7117',
        title: 'Incentivos à Pesquisa e Propriedade Intelectual (Lei nº 7.117/2009)',
        paretoRatio: 'Média-Alta Frequência',
        isQuente: false,
        content: `
          <p class="mb-3">A Lei nº 7.117/2009 dispõe sobre incentivos à pesquisa científica e tecnológica, à inovação e à proteção da propriedade intelectual em ambiente produtivo e social em Alagoas:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <p class="mb-2"><strong>Proteção de Ativos Científicos</strong>: Regula como o Estado de Alagoas apoia o registro de patentes, desenhos industriais e marcas geradas por pesquisadores financiados com recursos públicos estaduais.</p>
            <ul class="list-disc pl-4 text-slate-600 space-y-1">
              <li><strong>Repartição de Benefícios</strong>: Regras para partilha de royalties e receitas obtidas com licenciamento de tecnologias entre a ICT, o pesquisador público e o Estado de Alagoas.</li>
              <li><strong>Incentivo Social</strong>: Apoio à pesquisa voltada a tecnologias sociais aplicáveis à melhoria das condições de vida do povo alagoano.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Estadual Alagoas nº 7.117/2009"],
        tools: ["CEBRASPE - Propriedade Intelectual"],
        keyTakeaways: [
          "A Lei 7.117/2009 visa assegurar que as criações alagoanas de P&D sejam devidamente patenteadas.",
          "Estipula as percentagens de direito do pesquisador público inventor nos ganhos econômicos de licenciamentos da FAPEAL.",
          "Os recursos obtidos com royalties devem ser reinvestidos em novas pesquisas científicas pelo órgão."
        ]
      },
      {
        id: 'leg-fapeal-carreira-6527',
        title: 'Carreira dos Profissionais da FAPEAL (Lei nº 6.527/2004)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei nº 6.527/2004 dispõe sobre a criação da carreira dos profissionais da Fundação de Amparo à Pesquisa do Estado de Alagoas – FAPEAL:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Diretrizes da Carreira da FAPEAL:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Grupo Ocupacional</strong>: Estabelece os cargos de provimento efetivo do quadro pessoal da fundação, divididos por níveis de escolaridade (Nível Superior e Nível Médio).</li>
              <li><strong>Evolução Funcional</strong>: Regula a progressão (mudança de classe por tempo de serviço) e promoção (mudança de nível de capacitação por titulação acadêmica ou mérito profissional).</li>
              <li><strong>Vencimentos e Gratificações</strong>: Estrutura a tabela remuneratória base, as gratificações por titulação (Especialização, Mestrado, Doutorado) e as regras de desenvolvimento na carreira.</li>
            </ul>
          </div>
        `,
        materials: ["Lei Estadual nº 6.527/2004", "PCCV dos Servidores Públicos de Alagoas"],
        tools: ["CEBRASPE - Gestão de Pessoas no Setor Público"],
        keyTakeaways: [
          "A lei profissionalizou o quadro técnico de servidores da FAPEAL, reduzindo a rotatividade e gerando memória técnica.",
          "Exige concurso público de provas ou de provas e títulos para provimento de todos os cargos efetivos de carreira.",
          "O incentivo à titulação acadêmica garante gratificações pecuniárias substanciais adicionais ao vencimento base."
        ]
      },
      {
        id: 'leg-fapeal-reestruturacao-20',
        title: 'Reestruturação Jurídica da FAPEAL (LC nº 20/2002 e LC nº 5/1990)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">Dois marcos fundamentais na consolidação histórica e institucional da principal fundação de fomento de Alagoas:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs space-y-2">
            <p><strong>Lei Complementar nº 5/1990</strong>: Dispõe sobre a criação originária da Fundação de Amparo à Pesquisa do Estado de Alagoas – FAPEAL, instituindo seus objetivos institucionais e dotação inicial de patrimônio público estadual.</p>
            <p><strong>Lei Complementar nº 20/2002</strong>: Dispõe sobre a profunda reestruturação da FAPEAL, operando uma transformação jurídica crítica: <strong>transformou a natureza jurídica de direito privado da fundação para direito público</strong>. Isso alterou as regras de contabilidade pública, responsabilidade civil e estabilidade pessoal aplicáveis.</p>
          </div>
        `,
        materials: ["Lei Complementar Alagoas nº 5/1990", "Lei Complementar Alagoas nº 20/2002"],
        tools: ["CEBRASPE - Organização Administrativa"],
        keyTakeaways: [
          "A FAPEAL foi originalmente idealizada na LC 5/1990 e materializada sob governança relativa de direito privado.",
          "A LC 20/2002 converteu a FAPEAL de forma irrevogável em fundação autárquica pública, submetendo-a integralmente ao regime administrativo constitucional.",
          "Como entidade de direito público, seus servidores submetem-se de forma obrigatória ao Regime Jurídico Único estadual."
        ]
      },
      {
        id: 'leg-fapeal-rju-5247',
        title: 'Regime Jurídico Único dos Servidores Civis (Lei nº 5.247/1991)',
        paretoRatio: 'Altíssima Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">A Lei nº 5.247/1991 institui o Regime Jurídico Único (RJU) dos Servidores Públicos Civis de Alagoas, das Autarquias e das Fundações Públicas Estaduais, aplicando-se integralmente à FAPEAL:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Principais Disposições Estatutárias:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Provimento e Vacância</strong>: Formas de provimento (nomeação, reintegração, reversão, aproveitamento) e vacância (exoneração, demissão, aposentadoria).</li>
              <li><strong>Direitos, Deveres e Proibições</strong>: Direitos funcionais, regime de licenças (saúde, prêmio, capacitação) e deveres ético-profissionais dos servidores públicos civis estaduais.</li>
              <li><strong>Processo Administrativo Disciplinar (PAD)</strong>: Ritos procedimentais para apuração de faltas funcionais, garantindo ampla defesa, contraditório e prazos de suspensão preventiva.</li>
            </ul>
          </div>
        `,
        materials: ["Estatuto dos Servidores de Alagoas (Lei nº 5.247/1991)"],
        tools: ["CEBRASPE - Regime Jurídico Único"],
        keyTakeaways: [
          "O servidor efetivo adquire estabilidade funcional após cumprir de forma satisfatória 3 anos de efetivo serviço em estágio probatório.",
          "A demissão é uma penalidade administrativa grave aplicada em hipóteses legais taxativas, como improbidade ou abandono de cargo.",
          "A suspensão preventiva do servidor investigado em PAD visa assegurar a lisura de provas no processo administrativo, limitada a 60 dias por Alagoas."
        ]
      },
      {
        id: 'leg-fapeal-estatuto-4137',
        title: 'Estatuto da FAPEAL (Decreto nº 4.137/2009)',
        paretoRatio: 'Alta Frequência',
        isQuente: true,
        content: `
          <p class="mb-3">O Decreto nº 4.137/2009 aprova o Estatuto da FAPEAL, detalhando a governança administrativa, o funcionamento dos conselhos e as competências de cada diretoria:</p>
          <div class="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500 mb-3 text-xs">
            <h4 class="font-bold text-slate-800">Funcionamento e Órgãos Colegiados:</h4>
            <ul class="list-disc pl-4 text-slate-600 mt-1 space-y-1">
              <li><strong>Conselho Superior</strong>: Órgão deliberativo máximo que define as políticas gerais de fomento, composto de forma mista por representantes governamentais, universidades e do setor produtivo alagoano.</li>
              <li><strong>Conselho Curador</strong>: Órgão permanente de fiscalização contábil, orçamentária e financeira dos recursos destinados a editais e custeio.</li>
              <li><strong>Diretoria Executiva</strong>: Composta pelo Diretor-Presidente e Diretores Setoriais, responsável pela gestão administrativa, operacional e científica da fundação.</li>
            </ul>
          </div>
        `,
        materials: ["Estatuto da FAPEAL (Decreto nº 4.137/2009)"],
        tools: ["CEBRASPE - Estruturas Estatutárias"],
        keyTakeaways: [
          "O Conselho Superior define as diretrizes estratégicas e prioridades temáticas de fomento científico anuais.",
          "O Conselho Curador é encarregado de examinar e emitir parecer prévio sobre as prestações de contas anuais da fundação.",
          "O Diretor-Presidente representa a FAPEAL em juízo ou fora dele, coordenando as ações executivas diárias."
        ]
      }
    ]
  }
];

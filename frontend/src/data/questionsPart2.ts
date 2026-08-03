import { Question } from '../types';

export const questionsPart2: Question[] = [
  // TI BÁSICA (61-120)
  {
    id: 61,
    category: 'TI Básica',
    text: 'Na computação em nuvem, o modelo de serviço IaaS (Infrastructure as a Service) fornece ao usuário controle direto sobre o hardware físico, permitindo a ele alterar fisicamente os cabos de rede e discos nos datacenters.',
    correct: 'Errado',
    explanation: 'Errado. A nuvem abstrai e virtualiza o hardware físico. O usuário de IaaS contrata infraestrutura virtualizada (máquinas virtuais, armazenamento lógico, redes virtuais), mas nunca tem acesso ou controle físico real sobre o hardware nos datacenters.',
    reference: 'CEBRASPE - Conceitos de Nuvem'
  },
  {
    id: 62,
    category: 'TI Básica',
    text: 'A nuvem comunitária é um tipo de implantação em que a infraestrutura é compartilhada por diversas organizações que têm preocupações e objetivos comuns, como requisitos de segurança, conformidade e missão.',
    correct: 'Certo',
    explanation: 'Correto. A nuvem comunitária destina-se a atender a uma comunidade específica de organizações com interesses e obrigações compartilhados. Pode ser gerenciada pelas próprias organizações ou por terceiros.',
    reference: 'CEBRASPE - TRF 6 - 2024'
  },
  {
    id: 63,
    category: 'TI Básica',
    text: 'O backup diferencial copia apenas os arquivos alterados desde o último backup completo. Após realizar o backup diferencial, o bit de arquivamento (marcador) desses arquivos é redefinido (limpo), garantindo que no próximo backup diferencial esses mesmos dados não sejam duplicados.',
    correct: 'Errado',
    explanation: 'Errado. O backup diferencial NÃO limpa/redefine o bit de arquivamento. Ele continua copiando todas as alterações desde o último backup completo. Quem limpa o bit de arquivamento após a cópia é o backup Incremental.',
    reference: 'CEBRASPE - TRF 6 - 2024'
  },
  {
    id: 64,
    category: 'TI Básica',
    text: 'Para realizar a restauração completa de um sistema que utiliza backup diferencial, o administrador precisa do último backup completo realizado e apenas do último backup diferencial da sequência.',
    correct: 'Certo',
    explanation: 'Correto. Como o backup diferencial acumula todas as alterações desde o último backup completo, basta restaurar o completo e o último diferencial disponível.',
    reference: 'CEBRASPE - TRF 6 - 2024'
  },
  {
    id: 65,
    category: 'TI Básica',
    text: 'O protocolo POP3, por padrão, baixa as mensagens da caixa postal do servidor para o computador do usuário e as apaga do servidor, enquanto o IMAP permite ler e sincronizar as mensagens mantendo-as armazenadas no servidor.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a diferença fundamental: o POP3 faz download físico e apaga do servidor (por padrão); o IMAP sincroniza e lê direto do servidor, permitindo múltiplos acessos coordenados.',
    reference: 'CEBRASPE - CAU/BR - 2023'
  },
  {
    id: 66,
    category: 'TI Básica',
    text: 'No Microsoft Office 365 Excel, a fórmula =MÉDIA(B2:B6) calcula a média ponderada simples dos valores presentes no intervalo.',
    correct: 'Errado',
    explanation: 'Errado. A função MÉDIA calcula a média aritmética simples (soma os valores e divide pela quantidade de células). Média ponderada requer cálculo com pesos, geralmente usando SOMARPRODUTO dividido por SOMA.',
    reference: 'CEBRASPE - CAU/BR - 2023'
  },
  {
    id: 67,
    category: 'TI Básica',
    text: 'O malware conhecido como spyware é projetado para monitorar as atividades do sistema e coletar informações pessoais ou corporativas sem o consentimento do usuário, podendo agir ocultamente em segundo plano.',
    correct: 'Certo',
    explanation: 'Correto. Spywares são softwares espiões de coleta silenciosa de telemetria, dados de navegação, senhas e credenciais de usuários.',
    reference: 'CEBRASPE - CAU/BR - 2023'
  },
  {
    id: 68,
    category: 'TI Básica',
    text: 'O protocolo HTTP/2, em comparação ao HTTP/1.1, trouxe melhorias de performance significativas, destacando-se a multiplexação de mensagens, que permite enviar requisições e respostas em paralelo por uma única conexão TCP.',
    correct: 'Certo',
    explanation: 'Correto. A multiplexação elimina o bloqueio de cabeça de fila (head-of-line blocking) do HTTP/1.1, permitindo múltiplos fluxos simultâneos em paralelo.',
    reference: 'CEBRASPE - CAU/BR - 2023'
  },
  {
    id: 69,
    category: 'TI Básica',
    text: 'Na navegação anônima disponível nos principais navegadores (Edge, Chrome, Firefox), os cookies criados durante a sessão permanecem permanentemente ativos e rastreando o usuário mesmo após fechar todas as janelas anônimas.',
    correct: 'Errado',
    explanation: 'Errado. Na navegação anônima, os cookies e dados do site são temporariamente armazenados apenas para o funcionamento daquela sessão ativa e são completamente apagados e descartados assim que todas as janelas de navegação anônima são fechadas.',
    reference: 'CEBRASPE - CAU/BR - 2023'
  },
  {
    id: 70,
    category: 'TI Básica',
    text: 'O firewall de borda é um mecanismo de proteção de rede capaz de filtrar o tráfego de entrada e saída baseado em portas e IPs, mas não deve ser considerado a única solução absoluta capaz de evitar infecções por spywares que entrem via engenharia social ou downloads manuais de usuários.',
    correct: 'Certo',
    explanation: 'Correto. O firewall de borda é uma camada importante de segurança perimetral (filtra portas e pacotes), mas não protege contra ameaças internas em que o próprio usuário executa e autoriza o download de spywares via phishing ou links maliciosos.',
    reference: 'CEBRASPE - Segurança'
  },
  {
    id: 71,
    category: 'TI Básica',
    text: 'O modelo de nuvem SaaS (Software as a Service) exige que o cliente gerencie as configurações de sistema operacional e aplique patches de segurança periódicos nas máquinas virtuais hospedadas.',
    correct: 'Errado',
    explanation: 'Errado. No modelo SaaS, toda a infraestrutura, middleware, software de aplicação e segurança são gerenciados pelo provedor. O cliente apenas consome o serviço diretamente (ex: Office 365, Gmail).',
    reference: 'CEBRASPE - Cloud Computing'
  },
  {
    id: 72,
    category: 'TI Básica',
    text: 'Na nuvem híbrida, a infraestrutura é composta por duas ou mais nuvens distintas (privada, comunitária ou pública) que permanecem entidades únicas, mas estão unidas por tecnologia proprietária ou padronizada que permite a portabilidade de dados e aplicativos.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a definição exata de nuvem híbrida fornecida pelo NIST, caracterizando o acoplamento funcional de nuvens sob uma arquitetura de portabilidade.',
    reference: 'CEBRASPE - NIST Cloud Guidelines'
  },
  {
    id: 73,
    category: 'TI Básica',
    text: 'A computação em nuvem do tipo multicloud obrigatoriamente envolve a fusão física e jurídica de dois ou mais provedores públicos de nuvem para formar um novo provedor único.',
    correct: 'Errado',
    explanation: 'Errado. Multicloud é uma estratégia que consiste no uso de serviços de múltiplos provedores de nuvem independentes (ex: AWS e Google Cloud concomitantemente) para evitar lock-in ou otimizar custos, sem qualquer tipo de fusão jurídica entre eles.',
    reference: 'CEBRASPE - Cloud Computing'
  },
  {
    id: 74,
    category: 'TI Básica',
    text: 'O backup completo (Full) realiza a cópia de todos os arquivos selecionados para o meio de armazenamento, sendo o bit de arquivamento (marcador) de todos esses arquivos mantido ativado após o encerramento do processo.',
    correct: 'Errado',
    explanation: 'Errado. O backup completo desmarca (limpa/redefine) o bit de arquivamento dos arquivos copiados, indicando ao sistema que eles já foram salvaguardados em um backup integral.',
    reference: 'CEBRASPE - Gestão de Backup'
  },
  {
    id: 75,
    category: 'TI Básica',
    text: 'O backup incremental realiza a cópia de segurança apenas dos arquivos criados ou modificados desde o último backup completo ou desde o último backup incremental, limpando o bit de arquivamento após a conclusão de sua execução.',
    correct: 'Certo',
    explanation: 'Correto. O incremental copia apenas as alterações desde o backup mais recente de qualquer tipo (completo ou incremental) e redefine o bit de arquivamento para preparar o próximo ciclo.',
    reference: 'CEBRASPE - Backups'
  },
  {
    id: 76,
    category: 'TI Básica',
    text: 'Para restabelecer um sistema que sofreu uma perda total utilizando backup incremental, o administrador precisará apenas do último backup incremental realizado na semana.',
    correct: 'Errado',
    explanation: 'Errado. A restauração com backup incremental exige o último backup completo AND todos os backups incrementais subsequentes realizados em ordem cronológica até o momento da falha.',
    reference: 'CEBRASPE - Políticas de Backup'
  },
  {
    id: 77,
    category: 'TI Básica',
    text: 'No Microsoft Excel, se a célula A1 contiver o valor 10 e a célula A2 contiver o valor 20, a fórmula =SE(A1>A2; "Maior"; "Menor") retornará o resultado "Menor".',
    correct: 'Certo',
    explanation: 'Correto. A condição A1>A2 (10>20) é falsa. Portanto, a função SE executa o seu terceiro argumento, retornando "Menor".',
    reference: 'CEBRASPE - Planilhas Eletrônicas'
  },
  {
    id: 78,
    category: 'TI Básica',
    text: 'No LibreOffice Calc, o atalho para salvar um documento em edição é Ctrl+S, o mesmo utilizado nativamente no Microsoft Excel em língua portuguesa.',
    correct: 'Errado',
    explanation: 'Errado. No LibreOffice Calc, o atalho de salvar é Ctrl+S (padrão internacional). No Microsoft Excel em português, o atalho nativo para salvar é Ctrl+B.',
    reference: 'CEBRASPE - Atalhos de Teclado'
  },
  {
    id: 79,
    category: 'TI Básica',
    text: 'O protocolo SMTP (Simple Mail Transfer Protocol) é projetado primariamente para o envio de mensagens de correio eletrônico entre servidores ou de um cliente para o servidor, não sendo utilizado para a leitura final de e-mails.',
    correct: 'Certo',
    explanation: 'Correto. O SMTP é o protocolo padrão de envio de mensagens ("Simple Mail Transfer Protocol"). Os protocolos de recebimento/leitura são o POP3 e o IMAP.',
    reference: 'CEBRASPE - Protocolos de Redes'
  },
  {
    id: 80,
    category: 'TI Básica',
    text: 'O Ransomware é um tipo de código malicioso que rouba senhas bancárias através da gravação das teclas digitadas (keylogger), sem criptografar arquivos.',
    correct: 'Errado',
    explanation: 'Errado. Ransomware é o malware de extorsão que sequestra/criptografa os dados da vítima e exige um pagamento em criptomoedas para liberação da chave de decifragem. A captura de teclas digitadas é típica de keyloggers (subcategoria de spywares).',
    reference: 'CEBRASPE - Segurança Cibernética'
  },
  {
    id: 81,
    category: 'TI Básica',
    text: 'O phishing consiste em uma técnica de engenharia social por meio da qual golpistas criam páginas e e-mails falsos que imitam instituições legítimas com o objetivo de capturar dados confidenciais do usuário.',
    correct: 'Certo',
    explanation: 'Correto. O phishing ("pescaria") visa enganar o usuário induzindo-o a entregar voluntariamente informações sensíveis (senhas, cartões) sob pretexto de urgência ou segurança.',
    reference: 'CEBRASPE - Engenharia Social'
  },
  {
    id: 82,
    category: 'TI Básica',
    text: 'Os vírus de computador, ao contrário dos Worms, propagam-se de forma totalmente autônoma pelas redes de computadores, sem necessitar de um arquivo ou programa hospedeiro para serem executados.',
    correct: 'Errado',
    explanation: 'Errado. O vírus necessita obrigatoriamente de um arquivo ou programa hospedeiro para se espalhar (precisa ser executado pelo usuário). Quem se propaga de forma totalmente autônoma explorando vulnerabilidades na rede é o Worm (verme).',
    reference: 'CEBRASPE - Malwares'
  },
  {
    id: 83,
    category: 'TI Básica',
    text: 'A criptografia simétrica utiliza um par de chaves públicas e privadas numericamente associadas, em que a chave pública criptografa a mensagem e apenas a chave privada correspondente pode decodificá-la.',
    correct: 'Errado',
    explanation: 'Errado. A utilização de par de chaves (pública e privada) é característica da criptografia ASSIMÉTRICA. A criptografia simétrica utiliza uma única chave compartilhada para cifrar e decifrar os dados.',
    reference: 'CEBRASPE - Criptografia'
  },
  {
    id: 84,
    category: 'TI Básica',
    text: 'O protocolo HTTPS utiliza uma camada adicional de segurança baseada nos protocolos SSL ou TLS para garantir o sigilo e a integridade da comunicação entre o navegador do usuário e o servidor web.',
    correct: 'Certo',
    explanation: 'Correto. O HTTPS é a combinação do protocolo HTTP tradicional com criptografia SSL/TLS, protegendo os dados trafegados contra interceptações não autorizadas.',
    reference: 'CEBRASPE - Protocolos Seguros'
  },
  {
    id: 85,
    category: 'TI Básica',
    text: 'No Microsoft Excel, a fórmula =CONT.SE(A1:A10; ">50") conta quantas células no intervalo de A1 a A10 possuem valores maiores do que 50.',
    correct: 'Certo',
    explanation: 'Correto. A função CONT.SE serve exatamente para contar células que atendem a um critério específico (neste caso, conter um valor estritamente maior que 50).',
    reference: 'CEBRASPE - Funções do Excel'
  },
  {
    id: 86,
    category: 'TI Básica',
    text: 'O comando "Save As" (Salvar Como) em processadores de texto serve exclusivamente para salvar o documento ativo com o exato mesmo nome em sua pasta de origem, apagando quaisquer versões anteriores sem aviso.',
    correct: 'Errado',
    explanation: 'Errado. O "Salvar Como" permite que o usuário salve o documento com um nome diferente, formato diferente (ex: PDF, RTF) ou em um diretório alternativo, preservando o arquivo original intacto.',
    reference: 'CEBRASPE - Conceitos de Office'
  },
  {
    id: 87,
    category: 'TI Básica',
    text: 'O protocolo IP (Internet Protocol) opera na camada de aplicação do modelo OSI, sendo diretamente responsável pelo envio de páginas HTML para o usuário final.',
    correct: 'Errado',
    explanation: 'Errado. O protocolo IP opera na camada de Rede (Camada 3) do modelo OSI e de internet do modelo TCP/IP. O envio de páginas HTML é feito pelo HTTP/HTTPS, que operam na camada de Aplicação.',
    reference: 'CEBRASPE - Modelo OSI/TCP-IP'
  },
  {
    id: 88,
    category: 'TI Básica',
    text: 'A assinatura digital garante os princípios de autenticidade, integridade e não-repúdio de um documento eletrônico, mas não garante, por si só, o sigilo (confidencialidade) do conteúdo assinado.',
    correct: 'Certo',
    explanation: 'Correto. A assinatura digital prova quem assinou (autenticidade), que o documento não foi alterado (integridade) e impede a negação da autoria (não-repúdio). No entanto, o texto continua legível a terceiros a menos que tenha sido encriptado separadamente para fins de confidencialidade.',
    reference: 'CEBRASPE - Certificados Digitais'
  },
  {
    id: 89,
    category: 'TI Básica',
    text: 'A rede do tipo Intranet é uma rede privada acessível apenas aos membros de uma organização específica, sendo baseada nas mesmas tecnologias e protocolos utilizados na Internet global.',
    correct: 'Certo',
    explanation: 'Correto. A Intranet utiliza a mesma pilha TCP/IP, servidores web e navegadores que a Internet, porém seu acesso é restrito de forma corporativa e segura.',
    reference: 'CEBRASPE - Conceitos de Internet/Intranet'
  },
  {
    id: 90,
    category: 'TI Básica',
    text: 'O Trojan Horse (Cavalo de Troia) é um malware de propagação ativa idêntico ao Worm, que infecta o setor de boot do sistema operacional com o intuito de inutilizar o disco rígido fisicamente.',
    correct: 'Errado',
    explanation: 'Errado. Um Cavalo de Troia é um programa aparentemente legítimo que executa funções maliciosas sem o conhecimento do usuário (geralmente abre portas para invasores - backdoors), mas não possui capacidade de replicação autônoma como os Worms nem danifica hardware fisicamente.',
    reference: 'CEBRASPE - Malwares'
  },
  {
    id: 91,
    category: 'TI Básica',
    text: 'O armazenamento híbrido (Hybrid Cloud) exige obrigatoriamente que todos os dados sejam replicados integralmente em servidores locais e servidores em nuvem simultaneamente em intervalos máximos de 5 segundos.',
    correct: 'Errado',
    explanation: 'Errado. O armazenamento em nuvem híbrida gerencia a alocação de dados de forma flexível e inteligente. Dados frios ou regulados podem ser armazenados localmente e dados de alta escala ou analíticos na nuvem, sem obrigatoriedade de replicação total em 5 segundos.',
    reference: 'CEBRASPE - Nuvem Híbrida'
  },
  {
    id: 92,
    category: 'TI Básica',
    text: 'Na computação em nuvem, o termo "Elasticidade" refere-se à habilidade do sistema de provisionar e descontinuar dinamicamente recursos computacionais conforme a demanda flutuante.',
    correct: 'Certo',
    explanation: 'Correto. A elasticidade garante que os recursos computacionais se adaptem rapidamente às demandas, crescendo ou encolhendo sob demanda para evitar desperdícios.',
    reference: 'CEBRASPE - Características da Nuvem'
  },
  {
    id: 93,
    category: 'TI Básica',
    text: 'O modelo de nuvem privada é projetado para uso exclusivo de uma única organização, podendo pertencer e ser administrado pela própria organização ou por terceiros.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a definição oficial do NIST para nuvens privadas: infraestrutura sob medida com dedicação exclusiva a uma corporação.',
    reference: 'CEBRASPE - NIST Cloud Models'
  },
  {
    id: 94,
    category: 'TI Básica',
    text: 'No Microsoft Excel, a combinação de teclas Ctrl + C copia os dados selecionados, ao passo que a tecla de atalho Ctrl + V cola o conteúdo mantendo-o obrigatoriamente formatado apenas como texto simples.',
    correct: 'Errado',
    explanation: 'Errado. O Ctrl + V cola o conteúdo mantendo todas as fórmulas e formatações originais por padrão, a menos que o usuário escolha opções específicas de colar especial.',
    reference: 'CEBRASPE - Planilhas'
  },
  {
    id: 95,
    category: 'TI Básica',
    text: 'O antivírus com análise heurística é capaz de identificar malwares novos ou desconhecidos baseando-se em comportamentos ou padrões de código suspeitos, sem necessitar exclusivamente da assinatura do vírus.',
    correct: 'Certo',
    explanation: 'Correto. A análise heurística procura assinaturas genéricas ou comportamentos nocivos (ex: tentar alterar chaves importantes de registro), permitindo proteção proativa contra malwares "zero-day".',
    reference: 'CEBRASPE - Segurança'
  },
  {
    id: 96,
    category: 'TI Básica',
    text: 'No LibreOffice Calc, o operador padrão utilizado para realizar a potenciação entre dois números em uma célula é o símbolo de circunflexo (^).',
    correct: 'Certo',
    explanation: 'Correto. Tanto no Excel quanto no Calc, utiliza-se o caractere ^ para indicar potenciação (ex: =2^3 resulta em 8).',
    reference: 'CEBRASPE - Fórmulas e Operadores'
  },
  {
    id: 97,
    category: 'TI Básica',
    text: 'O conceito de BYOD (Bring Your Own Device) refere-se à prática corporativa de forçar funcionários a comprarem seus próprios computadores de trabalho diretamente da empresa com desconto em folha.',
    correct: 'Errado',
    explanation: 'Errado. BYOD refere-se a permitir ou incentivar que colaboradores utilizem seus próprios dispositivos móveis pessoais (laptops, celulares, tablets) para fins de trabalho dentro da infraestrutura de segurança da organização.',
    reference: 'CEBRASPE - Tendências de TI'
  },
  {
    id: 98,
    category: 'TI Básica',
    text: 'Na internet de banda larga baseada em fibras ópticas, a transmissão dos dados ocorre por meio de pulsos de luz gerados por lasers ou LEDs através de filamentos de vidro ou plástico flexível.',
    correct: 'Certo',
    explanation: 'Correto. Diferente dos cabos metálicos que transmitem pulsos elétricos, a fibra óptica utiliza reflexão total da luz para trafegar dados com enorme velocidade e baixa atenuação.',
    reference: 'CEBRASPE - Meios Físicos de Rede'
  },
  {
    id: 99,
    category: 'TI Básica',
    text: 'O Cookie de internet é um tipo de vírus que se multiplica na memória RAM do computador do usuário toda vez que ele digita senhas bancárias.',
    correct: 'Errado',
    explanation: 'Errado. Cookies são apenas pequenos arquivos de texto criados pelos sites para armazenar preferências de navegação ou dados de estado da sessão do usuário. Não são arquivos executáveis e não se multiplicam.',
    reference: 'CEBRASPE - Conceitos de Navegação'
  },
  {
    id: 100,
    category: 'TI Básica',
    text: 'No Microsoft Outlook 365, o campo Cco (Cópia Carbono Oculta) envia a mensagem para destinatários cujos e-mails ficam invisíveis para os demais leitores daquela mensagem.',
    correct: 'Certo',
    explanation: 'Correto. Destinatários incluídos no campo Cco recebem a mensagem sem que os demais participantes (dos campos Para ou Cc) saibam de sua existência.',
    reference: 'CEBRASPE - Correio Eletrônico'
  },
  {
    id: 101,
    category: 'TI Básica',
    text: 'No Microsoft Excel, a função PROCV busca um determinado valor na primeira coluna à esquerda de uma tabela de dados e retorna um valor correspondente na mesma linha a partir de uma coluna indicada.',
    correct: 'Certo',
    explanation: 'Correto. É o comportamento clássico da função PROCV (Procura Vertical): pesquisar na coluna esquerda e retornar dados das colunas adjacentes.',
    reference: 'CEBRASPE - Funções Excel'
  },
  {
    id: 102,
    category: 'TI Básica',
    text: 'O protocolo TCP garante a entrega ordenada e confiável dos pacotes de dados por meio de controle de fluxo e mecanismos de confirmação de recebimento (acks).',
    correct: 'Certo',
    explanation: 'Correto. O TCP é um protocolo orientado à conexão e confiável na camada de Transporte, que reagrupa pacotes e reenvia dados perdidos se necessário.',
    reference: 'CEBRASPE - Camada de Transporte'
  },
  {
    id: 103,
    category: 'TI Básica',
    text: 'O protocolo UDP, ao contrário do TCP, não exige conexões prévias nem confirmação de recebimento, sendo ideal para transmissões de vídeo em tempo real (streaming) em que a velocidade é preferível à correção total de pequenas perdas de pacotes.',
    correct: 'Certo',
    explanation: 'Correto. O UDP é um protocolo não-orientado à conexão e de melhor esforço (não confiável), o que reduz overhead e latência para aplicações que toleram pequenas perdas (voz, vídeo).',
    reference: 'CEBRASPE - Protocolo UDP'
  },
  {
    id: 104,
    category: 'TI Básica',
    text: 'O DNS (Domain Name System) atua na tradução de nomes de domínio amigáveis (como www.al.gov.br) em seus respectivos endereços IP numéricos legíveis pelos roteadores.',
    correct: 'Certo',
    explanation: 'Correto. O DNS funciona como uma lista telefônica da internet, convertendo domínios em IPs utilizáveis para conexão de pacotes.',
    reference: 'CEBRASPE - Protocolos'
  },
  {
    id: 105,
    category: 'TI Básica',
    text: 'Para proteger dados sigilosos armazenados em um notebook corporativo em caso de roubo ou perda física do equipamento, a medida técnica mais eficiente recomendada é a criptografia de disco completo.',
    correct: 'Certo',
    explanation: 'Correto. A criptografia de disco completo (ex: BitLocker) impede que invasores leiam os arquivos diretamente ligando o HD em outra máquina, garantindo confidencialidade.',
    reference: 'CEBRASPE - Boas Práticas de Segurança'
  },
  {
    id: 106,
    category: 'TI Básica',
    text: 'O IPV6 foi criado para substituir progressivamente o IPV4 em virtude do esgotamento dos endereços IPV4 disponíveis, possuindo um formato de endereçamento composto por 128 bits.',
    correct: 'Certo',
    explanation: 'Correto. O IPv6 utiliza endereços de 128 bits escritos em hexadecimal, fornecendo um número colossal de endereços únicos contra os 32 bits limitados do IPv4.',
    reference: 'CEBRASPE - Endereçamento IP'
  },
  {
    id: 107,
    category: 'TI Básica',
    text: 'Um firewall de filtragem de pacotes analisa o cabeçalho IP e as portas TCP/UDP de cada pacote de tráfego, decidindo aceitar ou descartar o pacote com base em regras predefinidas de segurança.',
    correct: 'Certo',
    explanation: 'Correto. Esse é o comportamento do firewall de pacotes tradicional stateless: inspeciona as informações da camada de rede e transporte (IP e portas) sem analisar o conteúdo da aplicação.',
    reference: 'CEBRASPE - Redes e Segurança'
  },
  {
    id: 108,
    category: 'TI Básica',
    text: 'A nuvem comunitária é restrita ao uso exclusivo de órgãos da administração pública federal direta, sendo proibido o seu uso por empresas privadas ou consórcios educacionais.',
    correct: 'Errado',
    explanation: 'Errado. A nuvem comunitária pode ser partilhada por quaisquer organizações (públicas ou privadas, civis ou estatais) desde que possuam requisitos, missões ou conformidades compartilhadas comuns.',
    reference: 'CEBRASPE - NIST Cloud Computing'
  },
  {
    id: 109,
    category: 'TI Básica',
    text: 'A técnica de backup "Gente-Pai-Filho" (Grandfather-Father-Son) é uma rota de rodízio de fitas de segurança estruturada em ciclos mensais, semanais e diários.',
    correct: 'Certo',
    explanation: 'Correto. O GFS é o esquema clássico de rotação de mídia: Mensal (Grandfather), Semanal (Father) e Diário (Son).',
    reference: 'CEBRASPE - Armazenamento'
  },
  {
    id: 110,
    category: 'TI Básica',
    text: 'No Microsoft Excel, se aplicarmos a função =ARRED(12,456; 2), o resultado exibido na célula será 12,46.',
    correct: 'Certo',
    explanation: 'Correto. A função ARRED arredonda o número indicado para a quantidade especificada de casas decimais (12,456 com 2 casas arredonda para cima, pois o terceiro dígito 6 é >= 5).',
    reference: 'CEBRASPE - Excel Avançado'
  },
  {
    id: 111,
    category: 'TI Básica',
    text: 'O "Worm" necessita anexar-se a programas existentes no disco para conseguir infectar o computador do usuário.',
    correct: 'Errado',
    explanation: 'Errado. Os Worms são independentes e não precisam se anexar a nenhum arquivo existente ou programa hospedeiro. Eles utilizam a rede para replicar cópias exatas de si mesmos diretamente entre sistemas.',
    reference: 'CEBRASPE - Segurança'
  },
  {
    id: 112,
    category: 'TI Básica',
    text: 'O protocolo IMAP permite o gerenciamento e a criação de pastas personalizadas diretamente na conta de correio eletrônico localizada no servidor remoto de e-mail.',
    correct: 'Certo',
    explanation: 'Correto. O IMAP mantém as mensagens sincronizadas diretamente no servidor, possibilitando a criação de pastas, marcadores e a organização remota do correio.',
    reference: 'CEBRASPE - Protocolos de Correio'
  },
  {
    id: 113,
    category: 'TI Básica',
    text: 'No Microsoft Word 365, a funcionalidade "Controlar Alterações" exibe todas as inclusões, exclusões e formatações feitas em um documento em coautoria.',
    correct: 'Certo',
    explanation: 'Correto. Essa ferramenta é vital para rastrear revisões de texto, mantendo um registro detalhado de quem alterou o quê no arquivo.',
    reference: 'CEBRASPE - Microsoft Office'
  },
  {
    id: 114,
    category: 'TI Básica',
    text: 'O "Adware" é uma modalidade de código malicioso desenvolvido estritamente para apagar todas as pastas de mídias de vídeo e música do computador.',
    correct: 'Errado',
    explanation: 'Errado. Adware (Advertising-supported software) é o programa projetado para exibir publicidade invasiva e propagandas redirecionadas ao usuário, e não para apagar ou danificar arquivos.',
    reference: 'CEBRASPE - Malware'
  },
  {
    id: 115,
    category: 'TI Básica',
    text: 'A criptografia assimétrica de chaves é amplamente recomendada para encriptar arquivos massivos de bancos de dados ativos em virtude de sua enorme velocidade de processamento comparada à criptografia simétrica.',
    correct: 'Errado',
    explanation: 'Errado. A criptografia assimétrica é matematicamente muito complexa e significativamente mais lenta do que a simétrica. Na prática, utiliza-se a criptografia simétrica para dados pesados e a assimétrica apenas para a troca segura de chaves.',
    reference: 'CEBRASPE - Segurança e Criptografia'
  },
  {
    id: 116,
    category: 'TI Básica',
    text: 'O protocolo FTP (File Transfer Protocol) é projetado exclusivamente para a navegação segura em sites de bancos e comércio eletrônico.',
    correct: 'Errado',
    explanation: 'Errado. O FTP serve estritamente para a transferência e compartilhamento de arquivos entre computadores de forma direta na rede. O protocolo de comércio eletrônico seguro é o HTTPS.',
    reference: 'CEBRASPE - Protocolos'
  },
  {
    id: 117,
    category: 'TI Básica',
    text: 'Um Ataque do tipo DDoS (Distributed Denial of Service) visa saturar a capacidade operacional de um servidor alvo, utilizando múltiplos computadores distribuídos para enviar volumes maciços de requisições simultâneas.',
    correct: 'Certo',
    explanation: 'Correto. O DDoS é um ataque distribuído coordenado por redes de computadores zumbis (botnets) que esgota os recursos do alvo, indisponibilizando o serviço a usuários reais.',
    reference: 'CEBRASPE - Segurança de Redes'
  },
  {
    id: 118,
    category: 'TI Básica',
    text: 'Na computação em nuvem, "On-demand self-service" significa que o usuário pode adquirir capacidades computacionais de forma automatizada sem intervenção humana de técnicos do provedor.',
    correct: 'Certo',
    explanation: 'Correto. É um dos princípios do NIST: o provisionamento automatizado sob demanda por meio de painel web, APIs ou consoles sem burocracia.',
    reference: 'CEBRASPE - NIST Cloud'
  },
  {
    id: 119,
    category: 'TI Básica',
    text: 'A rede local sem fio padrão Wi-Fi é baseada na especificação do protocolo IEEE 802.3.',
    correct: 'Errado',
    explanation: 'Errado. O Wi-Fi é baseado no padrão IEEE 802.11. O padrão IEEE 802.3 regula a rede local física Ethernet (cabos e conectores).',
    reference: 'CEBRASPE - Redes e Protocolos'
  },
  {
    id: 120,
    category: 'TI Básica',
    text: 'O certificado digital no padrão da ICP-Brasil garante a fé pública e a equivalência legal à assinatura de próprio punho em transações eletrônicas.',
    correct: 'Certo',
    explanation: 'Correto. A Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil) regula a certificação digital nacional, conferindo validade jurídica irrefutável aos documentos digitais assinados.',
    reference: 'CEBRASPE - ICP-Brasil'
  },

  // ÉTICA E COMPLIANCE (121-180)
  {
    id: 121,
    category: 'Ética e Compliance',
    text: 'Do ponto de vista filosófico, a ética caracteriza-se como um saber reflexivo, universal, teórico e perene, enquanto a moral é prática, regional, histórica e aplicada aos costumes cotidianos de uma sociedade.',
    correct: 'Certo',
    explanation: 'Correto. Ética é a ciência/filosofia que estuda e fundamenta a conduta (universal/atemporal). Moral são as regras sociais práticas e de comportamento do cotidiano (temporal/cultural).',
    reference: 'CEBRASPE - TJ/RJ - 2020'
  },
  {
    id: 122,
    category: 'Ética e Compliance',
    text: 'A comissão de ética instituída no âmbito de órgão público civil federal tem competência legal para aplicar penalidades disciplinares de demissão e suspensão a servidores que violarem o código de ética profissional.',
    correct: 'Errado',
    explanation: 'Errado. A comissão de ética possui competência para aplicar UNICAMENTE a penalidade de CENSURA. Suspensão, demissão e advertência são sanções disciplinares aplicadas por comissões de PAD.',
    reference: 'CEBRASPE - TRF 6 - 2024'
  },
  {
    id: 123,
    category: 'Ética e Compliance',
    text: 'A pena de censura aplicada pela comissão de ética deve ser fundamentada e lavrada em parecer assinado por todos os integrantes da comissão, devendo-se obrigatoriamente dar ciência ao servidor envolvido.',
    correct: 'Certo',
    explanation: 'Correto. Conforme o Decreto 1.171/94, a aplicação da pena de censura exige parecer devidamente fundamentado, com assinatura dos três membros que compõem a comissão de ética, cientificando o apenado.',
    reference: 'CEBRASPE - TRF 6 - 2024'
  },
  {
    id: 124,
    category: 'Ética e Compliance',
    text: 'De acordo com a doutrina ética kantiana (imperativo categórico), a moralidade de uma ação deve ser julgada de acordo com as suas consequências e utilidade prática para a maximização da felicidade da maioria.',
    correct: 'Errado',
    explanation: 'Errado. A maximização da felicidade da maioria é a base da doutrina ética do Utilitarismo. A ética de Immanuel Kant é deontológica, focando no imperativo categórico (dever absoluto, impessoal e racional, independente das consequências).',
    reference: 'CEBRASPE - TJ/RJ - 2020'
  },
  {
    id: 125,
    category: 'Ética e Compliance',
    text: 'No contexto de um programa de compliance, o pilar de "Suporte da Alta Administração" estabelece que a responsabilidade pela conformidade ética e legal recai unicamente sobre os diretores seniores, isentando os demais servidores de seguir o código de conduta.',
    correct: 'Errado',
    explanation: 'Errado. O suporte da alta administração (Tone from the top) significa que os líderes devem apoiar, patrocinar e dar o exemplo ético a ser seguido por toda a organização, mas o compliance é mandatório para TODOS os colaboradores.',
    reference: 'CEBRASPE - Compliance'
  },
  {
    id: 126,
    category: 'Ética e Compliance',
    text: 'Controles internos eficientes, auditorias recorrentes e canais de denúncia anônimos com políticas restritas de não-retaliação ao denunciante são elementos cruciais para a sobrevivência e eficácia de um programa de Compliance e Integridade.',
    correct: 'Certo',
    explanation: 'Correto. Sem esses mecanismos de proteção ao denunciante e averiguação contínua de desvios, o programa de conformidade corre risco de falha operacional estrutural.',
    reference: 'CEBRASPE - Integridade'
  },
  {
    id: 127,
    category: 'Ética e Compliance',
    text: 'A ética no setor público exige que o servidor paute suas decisões não apenas entre o que é legal e ilegal, mas também ponderando estritamente entre o que é honesto e desonesto, oportuno e inoportuno, em busca do bem comum.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a base do princípio da moralidade administrativa. O servidor deve ir além da legalidade estrita, optando sempre pelo caminho da honestidade e utilidade social.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 128,
    category: 'Ética e Compliance',
    text: 'No âmbito do serviço público, a ausência injustificada do servidor de seu posto de trabalho é considerada uma atitude eticamente neutra, visto que acarreta apenas consequências operacionais e nenhum dano social.',
    correct: 'Errado',
    explanation: 'Errado. O Código de Ética (Decreto 1.171/94) afirma expressamente que a ausência do servidor de seu posto de trabalho é fator de desordem ética, administrativa e social, sendo gravemente prejudicial.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 129,
    category: 'Ética e Compliance',
    text: 'O conflito de interesses na Administração Pública caracteriza-se quando um agente público coloca seus interesses particulares ou financeiros em patamar superior ou conflitante com o interesse público que ele deveria salvaguardar.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a definição de conflito de interesses. O dever de impessoalidade exige o afastamento de interesses privados nas decisões estatais.',
    reference: 'Lei nº 12.813/2013'
  },
  {
    id: 130,
    category: 'Ética e Compliance',
    text: 'Os códigos de conduta e programas de integridade devem ser estáticos e imutáveis ao longo do tempo, sob pena de perderem a sua validade jurídica e coerência institucional.',
    correct: 'Errado',
    explanation: 'Errado. Programas de integridade e conformidade devem ser dinâmicos, atualizados periodicamente e revisados conforme novos riscos, leis ou alterações estruturais do órgão.',
    reference: 'Diretrizes da CGU'
  },
  {
    id: 131,
    category: 'Ética e Compliance',
    text: 'De acordo com a Lei de Conflito de Interesses (Lei nº 12.813/2013), configura conflito de interesses a divulgação de informações privilegiadas obtidas em razão do cargo antes da divulgação oficial pelas vias de comunicação social.',
    correct: 'Certo',
    explanation: 'Correto. A divulgação de informação confidencial ou privilegiada que possa trazer vantagens pessoais ou financeiras a terceiros é considerada ato de desvio ético e infração legal severa.',
    reference: 'Lei nº 12.813/2013'
  },
  {
    id: 132,
    category: 'Ética e Compliance',
    text: 'As denúncias acolhidas pelos canais de compliance devem ser investigadas com absoluta confidencialidade, sendo permitida a retaliação do denunciante de boa-fé caso as acusações não resultem em demissão dos suspeitos.',
    correct: 'Errado',
    explanation: 'Errado. A proteção ao denunciante de boa-fé e a proibição expressa de retaliações são pilares fundamentais de qualquer programa de integridade íntegro.',
    reference: 'CEBRASPE - Governança'
  },
  {
    id: 133,
    category: 'Ética e Compliance',
    text: 'O conceito de "due diligence" de integridade (ou de terceiros) consiste no procedimento de avaliação prévia de riscos de integridade e conformidade antes da contratação de fornecedores e parceiros de negócios.',
    correct: 'Certo',
    explanation: 'Correto. O due diligence de terceiros ajuda a assegurar que a organização não contrate parceiros com histórico de corrupção ou violações éticas graves.',
    reference: 'CEBRASPE - Governança Corporativa'
  },
  {
    id: 134,
    category: 'Ética e Compliance',
    text: 'Nas comissões de ética do setor público, as investigações de conduta ética devem transcorrer com a garantia do contraditório e da ampla defesa para o servidor representado.',
    correct: 'Certo',
    explanation: 'Correto. O contraditório e a ampla defesa são garantias constitucionais obrigatórias aplicadas também no âmbito administrativo-ético.',
    reference: 'Regulamentos de Comissões de Ética'
  },
  {
    id: 135,
    category: 'Ética e Compliance',
    text: 'O suborno comercial constitui ato lícito que pode ser incentivado em programas de compliance corporativos de empresas estatais com o intuito de acelerar licitações emperradas.',
    correct: 'Errado',
    explanation: 'Errado. O suborno é crime de corrupção grave (ativo ou passivo). Um programa de compliance existe justamente para combater, coibir e extinguir essa prática.',
    reference: 'CEBRASPE - Compliance Público'
  },
  {
    id: 136,
    category: 'Ética e Compliance',
    text: 'O Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal estabelece que a verdade não deve ser omitida, ainda que contrária aos interesses da própria administração ou de seus chefes.',
    correct: 'Certo',
    explanation: 'Correto. Conforme o Decreto 1.171/94, o servidor não pode falsear a verdade, devendo pautar sua conduta pelo respeito à transparência e fidelidade factual.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 137,
    category: 'Ética e Compliance',
    text: 'A cortesia e a urbanidade no tratamento com o cidadão constituem meras recomendações informais sem qualquer relevância jurídica para a comissão de ética de um órgão civil.',
    correct: 'Errado',
    explanation: 'Errado. Tratar mal as pessoas, demonstrar desleixo ou descortesia no atendimento ao cidadão constitui infração direta aos deveres do servidor previstos no Decreto 1.171/94.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 138,
    category: 'Ética e Compliance',
    text: 'Constitui dever fundamental do servidor público guardar segredo profissional sobre assuntos confidenciais da repartição que tenham amparo em classificação de sigilo legal.',
    correct: 'Certo',
    explanation: 'Correto. O dever de sigilo profissional para dados protegidos legalmente (ex: segredo industrial, dados pessoais regulados pela LGPD) é um dos deveres primários do servidor público.',
    reference: 'Código de Ética'
  },
  {
    id: 139,
    category: 'Ética e Compliance',
    text: 'No utilitarismo ético de Stuart Mill, uma ação é eticamente correta se as suas consequências maximizarem o prazer geral e minimizarem o sofrimento coletivo dos envolvidos.',
    correct: 'Certo',
    explanation: 'Correto. O utilitarismo fundamenta a moralidade no princípio da utilidade, visando a maior felicidade líquida ou bem-estar para o maior número de pessoas.',
    reference: 'Filosofia da Ética'
  },
  {
    id: 140,
    category: 'Ética e Compliance',
    text: 'O nepotismo configura ato lícito e moralmente desejável no setor público por prestigiar a união familiar nas esferas superiores do governo.',
    correct: 'Errado',
    explanation: 'Errado. O nepotismo viola frontalmente os princípios constitucionais da moralidade e da impessoalidade administrativa, sendo formalmente proibido (Súmula Vinculante 13 do STF).',
    reference: 'Súmula Vinculante 13 STF'
  },
  {
    id: 141,
    category: 'Ética e Compliance',
    text: 'O princípio da integridade assegura que as práticas organizacionais reais coincidem de forma honesta com as políticas públicas anunciadas, vedando a publicidade enganosa.',
    correct: 'Certo',
    explanation: 'Correto. Integridade corporativa e pública pressupõe o alinhamento total entre discursos éticos declarados e comportamentos práticos diários.',
    reference: 'Conceitos de Compliance'
  },
  {
    id: 142,
    category: 'Ética e Compliance',
    text: 'O assédio moral no ambiente corporativo, caracterizado por condutas abusivas reiteradas que atentem contra a dignidade psíquica do servidor, constitui grave desvio ético passível de punição disciplinar.',
    correct: 'Certo',
    explanation: 'Correto. O assédio moral degrada o ambiente laboral, mina a produtividade e infringe frontalmente a moralidade administrativa e o respeito mútuo exigido dos servidores.',
    reference: 'Ética e Assédio'
  },
  {
    id: 143,
    category: 'Ética e Compliance',
    text: 'Os membros da comissão de ética de um órgão federal devem obrigatoriamente ser indicados diretamente pelo presidente de um sindicato de classe externo, sem interferência da chefia máxima do órgão.',
    correct: 'Errado',
    explanation: 'Errado. Os membros da comissão de ética são servidores públicos efetivos designados pelo dirigente máximo do respectivo órgão ou entidade pública.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 144,
    category: 'Ética e Compliance',
    text: 'O desvio de poder (ou desvio de finalidade) ocorre quando o agente público pratica um ato legal dentro de sua esfera de competência, mas com fins diversos daqueles determinados pela lei (satisfação de propósitos particulares).',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de uma modalidade de abuso de poder que atenta diretamente contra a impessoalidade e a moralidade administrativa.',
    reference: 'Direito Administrativo / Ética'
  },
  {
    id: 145,
    category: 'Ética e Compliance',
    text: 'A prestação de informações corretas e sem ruídos aos cidadãos é um direito social básico assegurado pela transparência administrativa e pelo princípio da moralidade pública.',
    correct: 'Certo',
    explanation: 'Correto. O acesso à informação e a transparência pública ativa constituem garantias sociais fundamentais do cidadão moderno.',
    reference: 'Lei de Acesso à Informação'
  },
  {
    id: 146,
    category: 'Ética e Compliance',
    text: 'Os presentes ofertados a servidores públicos de valor irrisório e caráter estritamente institucional ou diplomático (como agendas promocionais ou canetas corporativas de baixo custo) são permitidos pelas regras éticas nacionais, não configurando suborno.',
    correct: 'Certo',
    explanation: 'Correto. Brindes corporativos genéricos e sem valor comercial representativo (como canetas, lápis, blocos de rascunho com o logotipo da marca) de distribuição pública ampla são permitidos, diferentemente de "presentes" com valor pecuniário relevante.',
    reference: 'Regulamentos da CEP / Decreto 1.171/94'
  },
  {
    id: 147,
    category: 'Ética e Compliance',
    text: 'O pilar "Monitoramento e Auditoria" do compliance foca estritamente em treinar novos servidores de forma teórica na primeira semana de sua posse.',
    correct: 'Errado',
    explanation: 'Errado. Monitoramento e auditoria destinam-se a realizar testes operacionais constantes das conformidades, identificando violações em andamento de forma técnica contínua, sem se resumir a treinamentos iniciais.',
    reference: 'Compliance'
  },
  {
    id: 148,
    category: 'Ética e Compliance',
    text: 'O "Código de Conduta Ética" deve ser redigido em linguagem excessivamente técnica, hermética e incompreensível para o público comum para aumentar sua força jurídica no tribunal.',
    correct: 'Errado',
    explanation: 'Errado. Para ser efetivo, o código de conduta deve ser escrito de forma clara, direta, acessível e objetiva, permitindo que todos os servidores compreendam seus direitos, deveres e as consequências de infrações.',
    reference: 'Criação de Códigos de Conduta'
  },
  {
    id: 149,
    category: 'Ética e Compliance',
    text: 'A comissão de ética possui poder para instaurar processo de apuração ética de ofício (por iniciativa própria), não dependendo obrigatoriamente de denúncia externa formal.',
    correct: 'Certo',
    explanation: 'Correto. A apuração ética pode começar tanto mediante denúncia subscrita por cidadão quanto de ofício, sempre que a comissão tome conhecimento de comportamento passível de infração ética.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 150,
    category: 'Ética e Compliance',
    text: 'O princípio ético da responsabilidade social exige que as instituições públicas e corporações tomem decisões que resguardem também o meio ambiente e o bem-estar comunitário de longo prazo.',
    correct: 'Certo',
    explanation: 'Correto. A responsabilidade social e socioambiental reflete o compromisso ético das organizações modernas com as gerações futuras.',
    reference: 'ESG / Compliance'
  },
  {
    id: 151,
    category: 'Ética e Compliance',
    text: 'O dever de eficiência administrativa estabelece que o servidor deve atuar com celeridade e perfeição técnica, maximizando a qualidade do serviço com o menor custo possível aos cofres públicos.',
    correct: 'Certo',
    explanation: 'Correto. Eficiência é princípio constitucional explícito e dever ético basilar no trato com a coisa pública.',
    reference: 'Art. 37 da CF / Ética'
  },
  {
    id: 152,
    category: 'Ética e Compliance',
    text: 'De acordo com as doutrinas éticas clássicas, o agir moral depende do livre-arbítrio e da consciência crítica do indivíduo perante suas próprias escolhas sociais.',
    correct: 'Certo',
    explanation: 'Correto. Sem livre-arbítrio ou capacidade de escolha consciente, as ações humanas seriam meramente mecânicas ou instintivas, anulando a imputabilidade moral.',
    reference: 'Doutrinas Éticas'
  },
  {
    id: 153,
    category: 'Ética e Compliance',
    text: 'O uso de bens públicos (computadores, carros, impressoras) para fins exclusivamente recreativos particulares ou empresariais privados é um direito subjetivo garantido a todos os servidores de nível de diretoria em Alagoas.',
    correct: 'Errado',
    explanation: 'Errado. O uso de recursos públicos para fins particulares constitui improbidade administrativa grave, violando diretamente os deveres de lealdade e moralidade com o erário público.',
    reference: 'Lei de Improbidade Administrativa'
  },
  {
    id: 154,
    category: 'Ética e Compliance',
    text: 'A desonestidade na vida privada de um servidor público civil é incapaz de influenciar na apuração de desvio ético funcional pela comissão de ética, pois as esferas são totalmente estanques.',
    correct: 'Errado',
    explanation: 'Errado. Conforme o Decreto 1.171/94, os fatos ocorridos na vida privada do servidor público podem influenciar no seu conceito profissional na repartição, não havendo blindagem absoluta da vida pessoal.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 155,
    category: 'Ética e Compliance',
    text: 'O favorecimento ilegal de licitantes por intermédio de direcionamento técnico de editais na SEPLAG configura desvio ético punível civil, administrativa e eticamente.',
    correct: 'Certo',
    explanation: 'Correto. Favorecer ilegalmente licitantes desrespeita os princípios de isonomia, moralidade e impessoalidade, constituindo infração ética grave e crime licitatório.',
    reference: 'Licitações e Compliance'
  },
  {
    id: 156,
    category: 'Ética e Compliance',
    text: 'A "Quarentena de Saída" consiste em um período de restrição imposto a ex-ocupantes de cargos públicos de alta relevância, que ficam impedidos de atuar na iniciativa privada no mesmo setor em que atuavam por determinado período para evitar o tráfico de influência e uso de informações privilegiadas.',
    correct: 'Certo',
    explanation: 'Correto. Essa restrição temporária visa resguardar o interesse público e a integridade de segredos industriais/governamentais (conforme regido pela Lei de Conflito de Interesses).',
    reference: 'Lei nº 12.813/2013'
  },
  {
    id: 157,
    category: 'Ética e Compliance',
    text: 'Em programas de conformidade, as "linhas de defesa" separam auditoria interna (3ª linha) de controles internos e gestão de riscos (2ª linha), e de operações e gestão de negócios (1ª linha).',
    correct: 'Certo',
    explanation: 'Correto. Este é o famoso modelo de três linhas do IIA para assegurar papéis e responsabilidades claros no gerenciamento de riscos e governança.',
    reference: 'Modelo de 3 Linhas do IIA'
  },
  {
    id: 158,
    category: 'Ética e Compliance',
    text: 'A conformidade regulatória (compliance) foca exclusivamente em fraudes financeiras, sendo perfeitamente toleradas práticas de assédio moral e discriminação em ambientes sob conformidade formal.',
    correct: 'Errado',
    explanation: 'Errado. Programas robustos de integridade e compliance abrangem também o clima organizacional, vedando veementemente assédio moral, sexual, preconceitos e discriminações de quaisquer naturezas.',
    reference: 'ESG e Integridade'
  },
  {
    id: 159,
    category: 'Ética e Compliance',
    text: 'Os canais de denúncias devem disponibilizar acessos claros para que qualquer cidadão ou colaborador possa relatar condutas ilícitas sem o receio de sofrer retaliações.',
    correct: 'Certo',
    explanation: 'Correto. O canal de denúncia confiável é o canal centralizador da ética organizacional moderna.',
    reference: 'Canais de Ouvidoria / Ética'
  },
  {
    id: 160,
    category: 'Ética e Compliance',
    text: 'A comissão de ética, ao tomar conhecimento de uma infração ético-disciplinar grave que também se caracterize como crime comum de desvio de verba, deve limitar sua atuação à aplicação de censura, sem necessidade de notificar outras esferas (Ministério Público ou corregedoria).',
    correct: 'Errado',
    explanation: 'Errado. Sempre que a comissão de ética identificar indícios de infração civil, penal ou administrativa disciplinar comum de corrupção, deve encaminhar cópias das provas à corregedoria e ao Ministério Público para as providências cabíveis.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 161,
    category: 'Ética e Compliance',
    text: 'A integridade na Administração Pública baseia-se no conceito de transparência ativa, em que as informações de interesse público devem ser divulgadas de forma proativa, independentemente de requerimentos.',
    correct: 'Certo',
    explanation: 'Correto. A transparência ativa é pilar fundamental da Lei de Acesso à Informação e demonstra integridade e compromisso ético dos governos.',
    reference: 'Lei 12.527/2011'
  },
  {
    id: 162,
    category: 'Ética e Compliance',
    text: 'A moral administrativa é elemento indissociável da legalidade do ato, de modo que um ato administrativo formalmente legal pode ser nulo se violar a moralidade e a lealdade institucional.',
    correct: 'Certo',
    explanation: 'Correto. O Judiciário pode anular um ato que, mesmo respeitando a letra fria da lei, desrespeite a moralidade administrativa e os princípios éticos da Constituição.',
    reference: 'Constituição Federal, Art. 37'
  },
  {
    id: 163,
    category: 'Ética e Compliance',
    text: 'Doutrinas éticas contratualistas (como de Thomas Hobbes e Jean-Jacques Rousseau) postulam que os deveres morais e direitos individuais nascem de um acordo implícito fundamental que organiza o convívio pacífico em sociedade.',
    correct: 'Certo',
    explanation: 'Correto. O contratualismo enxerga a moralidade e as leis como frutos de convenções racionais e acordos sociais estabelecidos para manter a cooperação mútua.',
    reference: 'Doutrinas Éticas Clássicas'
  },
  {
    id: 164,
    category: 'Ética e Compliance',
    text: 'As denúncias falsas feitas dolosamente (com o intuito de prejudicar deliberadamente um colega) com mentiras inventadas não podem receber punições administrativas em compliance devido à blindagem irrestrita e cega aos denunciantes.',
    correct: 'Errado',
    explanation: 'Errado. A proteção de conformidade e não-retaliação aplica-se de forma absoluta a denunciantes de boa-fé. A má-fé manifesta e a calúnia intencional devem ser rigorosamente investigadas e sancionadas conforme as regras civis e disciplinares.',
    reference: 'Conceitos de Compliance e Ética'
  },
  {
    id: 165,
    category: 'Ética e Compliance',
    text: 'O princípio da impessoalidade veda que o agente público se utilize de publicidade governamental para promoção estritamente pessoal de sua própria figura política.',
    correct: 'Certo',
    explanation: 'Correto. A propaganda estatal possui intuito educativo, informativo ou de orientação social, proibindo a personalização de atos, obras e campanhas públicas.',
    reference: 'Art. 37, § 1º, CF'
  },
  {
    id: 166,
    category: 'Ética e Compliance',
    text: 'Em conformidade, a matriz de riscos éticos permite identificar e catalogar os perigos de condutas impróprias em cada departamento, facilitando o planejamento preventivo do plano de integridade.',
    correct: 'Certo',
    explanation: 'Correto. Avaliação de riscos (Risk Assessment) é passo preliminar essencial para focar recursos de auditoria nas áreas mais sensíveis do órgão público.',
    reference: 'Matrizes de Riscos'
  },
  {
    id: 167,
    category: 'Ética e Compliance',
    text: 'A comissão de ética pode aplicar a sanção de censura ética ao servidor terceirizado ou estagiário, caso estes violem as diretrizes éticas aplicadas no órgão.',
    correct: 'Certo',
    explanation: 'Correto. Para fins de responsabilidade ética, o conceito de servidor público é amplo e atinge todos os que exercem mandato, cargo, emprego ou função temporária, remunerada ou não, terceirizada ou por convênio.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 168,
    category: 'Ética e Compliance',
    text: 'No contexto de controle interno, a segregação de funções visa evitar fraudes ao proibir que uma mesma pessoa seja responsável por autorizar, executar e auditar um determinado procedimento financeiro.',
    correct: 'Certo',
    explanation: 'Correto. A segregação de funções reduz o risco de fraudes e conluios internos de forma drástica.',
    reference: 'Auditoria e Controle Interno'
  },
  {
    id: 169,
    category: 'Ética e Compliance',
    text: 'A ética teleológica foca sua análise na busca do "telos", ou seja, na finalidade ou propósito último que direciona as condutas virtuosas (como a busca da felicidade em Aristóteles).',
    correct: 'Certo',
    explanation: 'Correto. A ética teleológica (em oposição à deontológica) avalia as ações morais com base no seu propósito de realizar a felicidade ou finalidade virtuosa da essência humana.',
    reference: 'Aristotelianismo / Ética'
  },
  {
    id: 170,
    category: 'Ética e Compliance',
    text: 'O assédio moral exige, por definição, que as condutas vexatórias sejam praticadas apenas do subordinado para com o chefe, sendo impossível o assédio moral vertical descendente.',
    correct: 'Errado',
    explanation: 'Errado. O tipo mais comum de assédio moral é o vertical descendente (de superiores em relação a subordinados), embora existam o vertical ascendente (subordinado para chefe) e o horizontal (entre colegas de mesmo nível).',
    reference: 'Assédio Moral no Trabalho'
  },
  {
    id: 171,
    category: 'Ética e Compliance',
    text: 'Configura nepotismo a nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o terceiro grau, inclusive, da autoridade nomeante ou de servidor da mesma pessoa jurídica investido em cargo de direção.',
    correct: 'Certo',
    explanation: 'Correto. Essa é a redação exata do nepotismo regulado pelo STF no país, garantindo o combate ao favoritismo familiar e privilegiando a meritocracia.',
    reference: 'Súmula Vinculante nº 13'
  },
  {
    id: 172,
    category: 'Ética e Compliance',
    text: 'O princípio do "Tone from the Top" refere-se à cultura de integridade que deve começar e ser mantida de forma firme pelas lideranças e alta cúpula administrativa da instituição.',
    correct: 'Certo',
    explanation: 'Correto. A liderança pelo exemplo (Tone from the top) é pré-requisito indispensável para que as políticas de compliance ganhem credibilidade prática na ponta operacional.',
    reference: 'Compliance'
  },
  {
    id: 173,
    category: 'Ética e Compliance',
    text: 'O canal de denúncias pode desrespeitar o sigilo da identidade do denunciante sob pretexto de criar cartazes informativos semanais expondo os desvios de conduta mais inusitados na entrada do prédio.',
    correct: 'Errado',
    explanation: 'Errado. A confidencialidade é sagrada. Expor dados do denunciante expõe-no a riscos severos de retaliações, destruindo a confiabilidade do sistema e violando preceitos básicos de governança.',
    reference: 'Proteção ao Denunciante'
  },
  {
    id: 174,
    category: 'Ética e Compliance',
    text: 'A moralidade e a probidade administrativa não estão sujeitas à discricionariedade do agente público, devendo ser observadas em todos os atos estatais sob pena de nulidade absoluta por desvio moral.',
    correct: 'Certo',
    explanation: 'Correto. Trata-se de um dever vinculado. O administrador não tem a opção de decidir quando ser honesto ou moral em suas escolhas funcionais.',
    reference: 'Princípios Administrativos'
  },
  {
    id: 175,
    category: 'Ética e Compliance',
    text: 'A prestação de contas dos gestores públicos é um princípio ético, financeiro e constitucional obrigatório decorrente da natureza democrática da república, onde todo o poder emana do povo.',
    correct: 'Certo',
    explanation: 'Correto. O princípio da "Accountability" ou dever de prestar contas é corolário do Estado Democrático de Direito e do respeito à representatividade social.',
    reference: 'Accountability / Finanças'
  },
  {
    id: 176,
    category: 'Ética e Compliance',
    text: 'O suborno transnacional consiste na prática de ofertar, prometer ou dar vantagem indevida a funcionário público estrangeiro para obter vantagens em transações comerciais internacionais, sendo tipificado na Lei Anticorrupção Brasileira.',
    correct: 'Certo',
    explanation: 'Correto. A Lei Federal Anticorrupção (Lei 12.846/2013) tipifica a corrupção de agentes públicos nacionais e internacionais de forma rigorosa.',
    reference: 'Lei nº 12.846/2013'
  },
  {
    id: 177,
    category: 'Ética e Compliance',
    text: 'No utilitarismo de Jeremy Bentham, as ações devem ser calculadas com base na intensidade, duração e certeza dos prazeres que irão desencadear na sociedade.',
    correct: 'Certo',
    explanation: 'Correto. Bentham propôs o cálculo utilitário (cálculo felicífico) baseado em dimensões do prazer quantitativo imediato e de longo prazo.',
    reference: 'Utilitarismo Filosófico'
  },
  {
    id: 178,
    category: 'Ética e Compliance',
    text: 'A comissão de ética pode aplicar a penalidade de suspensão de até 90 dias a um servidor, desde que haja parecer favorável da maioria simples dos sindicatos de Alagoas.',
    correct: 'Errado',
    explanation: 'Errado. Como já visto, a comissão de ética possui poder restrito à aplicação da sanção administrativa de CENSURA. A suspensão é punição de corregedoria resultante de PAD.',
    reference: 'Decreto 1.171/94'
  },
  {
    id: 179,
    category: 'Ética e Compliance',
    text: 'A transparência passiva ocorre quando o cidadão solicita formalmente uma informação e o órgão público a fornece dentro dos prazos de lei.',
    correct: 'Certo',
    explanation: 'Correto. Transparência passiva é a resposta a requerimentos formais provocados por terceiros.',
    reference: 'Lei de Acesso à Informação'
  },
  {
    id: 180,
    category: 'Ética e Compliance',
    text: 'O dever de lealdade com as instituições públicas impede que o servidor denuncie esquemas de corrupção que ele presencie em sua diretoria, devendo manter-se em silêncio obsequioso absoluto por coleguismo corporativo.',
    correct: 'Errado',
    explanation: 'Errado. O dever de lealdade e moralidade exige o combate atrativo ao desvio ético. O servidor tem o dever ético e legal de denunciar desvios de conduta, fraudes ou irregularidades às instâncias de corregedoria ou órgãos de investigação.',
    reference: 'Deveres do Servidor'
  }
];

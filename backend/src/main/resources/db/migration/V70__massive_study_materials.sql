-- ==============================================================================
-- V70__massive_study_materials.sql
-- Gerado automaticamente em: 2026-09-29 15:44:47
-- Materiais de estudo para o concurso de Agente/Escrivão de Polícia Civil de Alagoas
-- ==============================================================================

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'lingua_portuguesa_compreensao_interpretacao_textos',
    'Compreensão e Interpretação de Textos de Gêneros Variados',
    'LÍNGUA PORTUGUESA',
    'Leitura e Interpretação',
    'Desenvolver habilidades de leitura crítica e compreensão de diferentes tipos textuais, identificando informações explícitas e implícitas, inferências e sentido global do texto.',
    '{"main_concepts": ["Texto", "Gênero textual", "Leitura", "Interpretação", "Coerência", "Coesão"], "key_points": ["Identificar ideia central e secundárias", "Reconhecer informações implícitas", "Fazer inferências e deduções", "Compreender o sentido global e específico", "Analisar a intenção comunicativa"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A compreensão e interpretação de textos envolve a capacidade de ler, entender e extrair significados de diferentes tipos de textos, considerando o contexto, o autor e o propósito comunicativo.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Leitura: processo ativo de construção de sentido a partir do texto</li>
        <li>Interpretação: atribuição de significado ao que foi lido</li>
        <li>Texto: unidade de comunicação com sentido completo</li>
        <li>Gênero textual: categoria de textos com características sociais e funcionais similares</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Informações explícitas: dados diretamente apresentados no texto</li>
        <li>Informações implícitas: dados que precisam ser inferidos pelo leitor</li>
        <li>Ideia central: tema principal do texto</li>
        <li>Ideias secundárias: informações que complementam a ideia central</li>
        <li>Inferência: conclusão baseada em indícios do texto</li>
        <li>Contexto: situação em que o texto é produzido</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar o tema e a ideia central do texto</li>
        <li>Distinguir fatos de opiniões</li>
        <li>Reconhecer diferentes gêneros textuais (notícia, crônica, artigo, etc.)</li>
        <li>Compreender a intenção do autor (informar, persuadir, entreter)</li>
        <li>Relacionar partes do texto para construir sentido global</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Em uma notícia sobre crime, identificar o fato principal (o quê, quem, quando, onde, como, por que)</li>
        <li>Em um artigo de opinião, distinguir argumentos do autor de fatos objetivos</li>
        <li>Em uma crônica, compreender o tom humorístico ou crítico do narrador</li>
        <li>Em um texto jurídico, identificar as normas e suas aplicações</li>
        <li>Em um relatório policial, extrair informações essenciais para investigação</li>
    </ul>
</div>',
    'A leitura é um processo ativo de construção de sentido, não passivo
Informações implícitas exigem inferência e conhecimento de mundo
O gênero textual influencia a estrutura e o propósito do texto
A identificação da ideia central é fundamental para a compreensão global
O contexto de produção é essencial para a interpretação adequada
Distinguir fato de opinião é crucial para leitura crítica
A coesão e coerência textuais garantem a unidade do texto',
    '[{"type": "concept", "title": "Conceito de Texto", "content": "Unidade de comunicação com sentido completo, produzida em um contexto específico."}, {"type": "definition", "title": "Leitura", "content": "Processo de interação entre leitor e texto para construção de significado."}, {"type": "example", "title": "Exemplo de Interpretação", "content": "Ao ler um boletim de ocorrência, o policial deve extrair fatos objetivos para investigação."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'lingua_portuguesa_tipos_generos_textuais',
    'Reconhecimento de Tipos e Gêneros Textuais',
    'LÍNGUA PORTUGUESA',
    'Leitura e Interpretação',
    'Identificar e diferenciar os diversos tipos e gêneros textuais, compreendendo suas características estruturais, funcionais e sociais.',
    '{"main_concepts": ["Tipo textual", "Gênero textual", "Domínio discursivo", "Estrutura textual", "Função social"], "key_points": ["Tipos textuais: narração, descrição, dissertação, injunção", "Gêneros textuais: manifestações concretas dos tipos", "Cada gênero tem características específicas", "Função social determina o gênero adequado", "Hibridismo entre tipos e gêneros é comum"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Tipos textuais são categorias teóricas que se referem à organização linguística do texto (narração, descrição, dissertação, injunção). Gêneros textuais são manifestações concretas desses tipos (notícia, crônica, artigo, relatório, etc.).</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Tipo textual: organização estrutural e linguística do texto</li>
        <li>Gênero textual: realização concreta de um tipo em situações comunicativas</li>
        <li>Domínio discursivo: esfera de atividade humana em que o gênero circula</li>
        <li>Intertextualidade: diálogo entre textos e gêneros</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Narração: relato de eventos em sequência temporal</li>
        <li>Descrição: representação de pessoas, objetos, cenários</li>
        <li>Dissertação: apresentação e defesa de ideias</li>
        <li>Injunção: instruções e orientações</li>
        <li>Gêneros jornalísticos: notícia, reportagem, editorial</li>
        <li>Gêneros literários: crônica, conto, romance</li>
        <li>Gêneros jurídicos: lei, sentença, parecer</li>
        <li>Gêneros administrativos: ofício, memorando, relatório</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar o tipo predominante em um texto</li>
        <li>Reconhecer características de cada gênero</li>
        <li>Adaptar a linguagem ao gênero exigido</li>
        <li>Produzir textos adequados a diferentes situações comunicativas</li>
        <li>Compreender a função social de cada gênero</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Relatório policial: gênero injuntivo/descritivo, linguagem formal, objetiva</li>
        <li>Boletim de ocorrência: gênero descritivo/narrativo, estrutura padronizada</li>
        <li>Notícia jornalística: gênero narrativo, lead (quem, o quê, quando, onde, como, por que)</li>
        <li>Artigo de opinião: gênero dissertativo, defesa de ponto de vista</li>
        <li>Edital: gênero injuntivo, linguagem prescritiva</li>
    </ul>
</div>',
    'Tipos textuais são categorias teóricas (narração, descrição, dissertação, injunção)
Gêneros textuais são realizações concretas dos tipos em contextos sociais
Um mesmo gênero pode combinar diferentes tipos textuais
A função social determina as características do gênero
O contexto de produção define o gênero adequado
No trabalho policial, dominar gêneros oficiais é essencial
A adequação ao gênero é critério de correção textual',
    '[{"type": "concept", "title": "Tipos Textuais", "content": "Narração, descrição, dissertação e injunção são os quatro tipos básicos."}, {"type": "example", "title": "Gêneros Policiais", "content": "Boletim de ocorrência, auto de prisão em flagrante, relatório circunstanciado."}, {"type": "tip", "title": "Identificação", "content": "Analise a estrutura, linguagem e função social para identificar o gênero."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'lingua_portuguesa_ortografia_oficial',
    'Domínio da Ortografia Oficial',
    'LÍNGUA PORTUGUESA',
    'Norma Culta',
    'Dominar as regras de ortografia oficial brasileira, conforme o Acordo Ortográfico de 1990, para produção de textos corretos e profissionais.',
    '{"main_concepts": ["Ortografia", "Acordo Ortográfico", "Acentuação", "Hífen", "Parônimos", "Homônimos"], "key_points": ["Regras de acentuação gráfica", "Uso do hífen", "Emprego de s, z, x, j, g", "Distinção entre parônimos e homônimos", "Orientações do Acordo Ortográfico de 1990"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A ortografia oficial estabelece as regras para a escrita correta das palavras em português. O Acordo Ortográfico de 1990 unificou a ortografia dos países lusófonos, eliminando algumas acentuações e modificando regras de hifenização.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Ortografia: conjunto de regras que estabelece a escrita correta das palavras</li>
        <li>Acento agudo (´): marca sílaba tônica aberta</li>
        <li>Acento circunflexo (^): marca sílaba tônica fechada</li>
        <li>Til (~): marca nasalização e sílaba tônica</li>
        <li>Hífen: sinal gráfico usado em compostos e derivados</li>
        <li>Parônimos: palavras com significados diferentes e pronúncia similar</li>
        <li>Homônimos: palavras com mesma escrita e/ou pronúncia, significados diferentes</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Regras de acentuação de oxítonas, paroxítonas e proparoxítonas</li>
        <li>Regras especiais para ditongos, tritongos e hiatos</li>
        <li>Uso do hífen em compostos, prefixos e sufixos</li>
        <li>Emprego de s, z, x em diferentes contextos</li>
        <li>Distinção entre homônimos e parônimos comuns</li>
        <li>Casos de trema (eliminado pelo Acordo, mantido em nomes próprios)</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Aplicar corretamente as regras de acentuação</li>
        <li>Usar o hífen conforme as novas regras do Acordo</li>
        <li>Diferenciar palavras parônimas em contexto</li>
        <li>Escrever corretamente termos técnicos e jurídicos</li>
        <li>Evitar erros ortográficos em documentos oficiais</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Acento em paroxítonas terminadas em -i, -is, -us: júri, lápis, vírus</li>
        <li>Sem acento em paroxítonas terminadas em -oa, -eo: ideia, coreografia</li>
        <li>Hífen com prefixos anti-, semi-, sobre-: anti-higiênico, semi-interno</li>
        <li>Emprego de x em palavras de origem indígena: abacaxi, caxixe</li>
        <li>Distinção: descrição (narrar) x discrição (reserva, modéstia)</li>
        <li>Distinção: infligir (aplicar pena) x infringir (violar, desrespeitar)</li>
    </ul>
</div>',
    'Proparoxítonas são sempre acentuadas
Paroxítonas terminadas em ditongo crescente são acentuadas
O Acordo eliminou o trema em palavras portuguesas
Hífen é usado quando o prefixo termina em vogal e o segundo elemento começa com vogal diferente
Cuidado com homônimos como descrição/discrição, infligir/infringir
Em documentos oficiais, erro ortográfico pode comprometer a credibilidade
Consultar dicionário em caso de dúvida é prática recomendada',
    '[{"type": "rule", "title": "Regra de Proparoxítonas", "content": "Todas as proparoxítonas são acentuadas: médico, cônjuge, último."}, {"type": "rule", "title": "Regra de Hífen", "content": "Prefixo terminado em vogal + palavra iniciada com vogal diferente = hífen (anti-inflamatório)."}, {"type": "example", "title": "Homônimos Comuns", "content": "Cela (prisão) x Sela (arreio); Censo (contagem) x Senso (juízo)."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'lingua_portuguesa_coesao_textual',
    'Domínio dos Mecanismos de Coesão Textual',
    'LÍNGUA PORTUGUESA',
    'Textualidade',
    'Compreender e aplicar os mecanismos de coesão textual para produzir textos unificados, coesos e fluidos, com referenciação adequada e conectores eficientes.',
    '{"main_concepts": ["Coesão", "Coerência", "Referenciação", "Conectores", "Sequenciação textual", "Substituição", "Repetição"], "key_points": ["Referenciação: pronomes, artigos, numerais", "Substituição: sinônimos, hipônimos, hiperônimos", "Repetição: estratégica e retomativa", "Conectores: conjunções e locuções conectivas", "Sequenciação: organização lógica do texto"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A coesão textual é a conexão linguística entre os elementos de um texto, garantindo sua unidade e progressão. A referenciação, a substituição, a repetição e o uso de conectores são os principais mecanismos coesivos.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Coesão: conexão linguística entre elementos do texto</li>
        <li>Coerência: consistência lógica e semântica do texto</li>
        <li>Referenciação: processo de retomada ou antecipação de elementos</li>
        <li>Catáfora: antecipação de um elemento ainda não mencionado</li>
        <li>Anáfora: retomada de elemento já mencionado</li>
        <li>Conectores: palavras que ligam orações e parágrafos</li>
        <li>Progressão textual: avanço temático do texto</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Pronomes pessoais: ele, ela, o, a (retomada de substantivos)</li>
        <li>Pronomes demonstrativos: este, esse, aquele (localização espacial/temporal)</li>
        <li>Artigos definidos: o, a (retomada de elementos já citados)</li>
        <li>Substituição por sinônimos: autor = escritor = narrador</li>
        <li>Substituição por hipônimos: veículo = carro = automóvel</li>
        <li>Conectivos adversativos: mas, porém, contudo, entretanto</li>
        <li>Conectivos conclusivos: portanto, logo, por conseguinte</li>
        <li>Conectivos explicativos: porque, pois, visto que</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Usar pronomes para evitar repetições excessivas</li>
        <li>Empregar conectores adequados ao tipo de relação lógica</li>
        <li>Manter a progressão temática constante</li>
        <li>Evitar ambiguidades na referenciação</li>
        <li>Usar repetição estratégica para ênfase</li>
        <li>Garantir que cada elemento coesivo tenha referente claro</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Anáfora: ''O suspeito foi detido. Ele confessou o crime.'' (ele = o suspeito)</li>
        <li>Catáfora: ''Esta é a conclusão: o investigado é inocente.'' (esta = a conclusão que virá)</li>
        <li>Conector adversativo: ''O réu negou a autoria, mas as provas o incriminam.''</li>
        <li>Substituição por sinônimo: ''A autoridade policial agiu rapidamente. O delegado ordenou a prisão.''</li>
        <li>Elipse: ''O delegado chegou e iniciou o inquérito.'' (sujeito da segunda oração omitido)</li>
    </ul>
</div>',
    'Coesão é a conexão linguística; coerência é a consistência lógica
Anáfora retoma elementos já citados; catáfora antecipa elementos
Pronomes, artigos e demonstrativos são principais referenciais
Conectores estabelecem relações lógicas entre orações
Substituição lexical evita repetição monótona
Ambiguidade na referenciação compromete a compreensão
Em textos jurídicos, a coesão é essencial para precisão',
    '[{"type": "concept", "title": "Anáfora", "content": "Retomada de elemento já mencionado: ''O delegado chegou. Ele iniciou o inquérito.''"}, {"type": "concept", "title": "Catáfora", "content": "Antecipação de elemento: ''Disse o seguinte: o investigado é inocente.''"}, {"type": "list", "title": "Principais Conectores", "content": "Aditivos (e, também), Adversativos (mas, porém), Conclusivos (logo, portanto), Explicativos (porque, pois)."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'tecnologia_informacao_sistema_operacional',
    'Noções de Sistema Operacional (Linux e Windows)',
    'TECNOLOGIA DA INFORMAÇÃO',
    'Sistemas Operacionais',
    'Compreender os fundamentos de sistemas operacionais Linux e Windows, incluindo gerenciamento de arquivos, processos, permissões e comandos básicos.',
    '{"main_concepts": ["Sistema Operacional", "Kernel", "Gerenciamento de Arquivos", "Processos", "Permissões", "CLI", "GUI"], "key_points": ["Linux: sistema open-source, baseado em Unix", "Windows: sistema proprietário da Microsoft", "CLI vs GUI: linha de comando vs interface gráfica", "Permissões de arquivos no Linux (rwx)", "Gerenciamento de processos e serviços"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Sistema operacional é software que gerencia recursos de hardware e fornece serviços para programas de aplicação. Linux é um sistema operacional open-source baseado em Unix, amplamente usado em servidores. Windows é um sistema operacional proprietário da Microsoft, predominante em computadores pessoais.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Kernel: núcleo do sistema operacional, gerencia hardware</li>
        <li>Shell: interface de linha de comando (Linux)</li>
        <li>Distribuição Linux: Ubuntu, Debian, Fedora, CentOS</li>
        <li>Windows 10/11: versões atuais do sistema Microsoft</li>
        <li>Arquitetura: x86, x64, ARM</li>
        <li>Gerenciador de arquivos: Explorer (Windows), Nautilus (Linux)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Linux: sistema de arquivos hierárquico (/home, /etc, /var)</li>
        <li>Windows: sistema de arquivos NTFS, C:, D:</li>
        <li>Permissões Linux: read (r), write (w), execute (x)</li>
        <li>Comandos Linux básicos: ls, cd, mkdir, rm, cp, mv</li>
        <li>Comandos Windows: dir, cd, mkdir, del, copy, move</li>
        <li>Gerenciamento de processos: top/htop (Linux), Task Manager (Windows)</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Navegar pelo sistema de arquivos via CLI</li>
        <li>Gerenciar arquivos e diretórios</li>
        <li>Alterar permissões de arquivos no Linux</li>
        <li>Monitorar processos e uso de recursos</li>
        <li>Instalar e gerenciar pacotes de software</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Linux: ''ls -la'' lista arquivos com permissões detalhadas</li>
        <li>Linux: ''chmod 755 arquivo.sh'' concede permissão de execução</li>
        <li>Windows: ''tasklist'' mostra processos em execução</li>
        <li>Linux: ''systemctl status nginx'' verifica status de serviço</li>
        <li>Windows: ''ipconfig'' mostra configuração de rede</li>
    </ul>
</div>',
    'Linux é open-source; Windows é proprietário
CLI permite automação e scripts poderosos
Permissões no Linux são críticas para segurança
Sistema de arquivos Linux é hierárquico (/)
Windows usa letras de unidade (C:, D:)
Gerenciamento de processos é essencial para troubleshooting
Conhecimento de ambos sistemas é valorizado no mercado',
    '[{"type": "command", "title": "Comandos Linux Básicos", "content": "ls (listar), cd (mudar diretório), mkdir (criar diretório), rm (remover)"}, {"type": "command", "title": "Comandos Windows Básicos", "content": "dir (listar), cd (mudar diretório), mkdir (criar diretório), del (remover)"}, {"type": "concept", "title": "Permissões Linux", "content": "r (read), w (write), x (execute). Ex: chmod 755"}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_penal_crimes_contra_pessoa',
    'Crimes Contra a Pessoa',
    'NOÇÕES DE DIREITO PENAL',
    'Crimes em Espécie',
    'Dominar os crimes contra a pessoa previstos no Código Penal (homicídio, lesões corporais, crimes contra a honra, crimes contra a liberdade individual), seus elementos típicos e penas.',
    '{"main_concepts": ["Homicídio", "Lesões Corporais", "Crimes contra a Honra", "Crimes contra a Liberdade", "Elemento Subjetivo", "Consumação"], "key_points": ["Homicídio doloso e culposo", "Lesões corporais leves, graves e gravíssimas", "Crimes contra a honra: calúnia, difamação, injúria", "Crimes contra a liberdade: constrangimento ilegal, ameaça", "Agressão física vs psicológica"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Os crimes contra a pessoa estão previstos no Título I do Código Penal (Art. 121 a 154). Incluem crimes contra a vida (homicídio), integridade física (lesões corporais), honra (calúnia, difamação, injúria) e liberdade individual (constrangimento ilegal, ameaça, sequestro).</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Homicídio: tirar a vida de alguém (Art. 121 CP)</li>
        <li>Lesões corporais: ofender integridade física ou saúde (Art. 129 CP)</li>
        <li>Calúnia: imputar crime falsamente (Art. 138 CP)</li>
        <li>Difamação: atribuir fato ofensivo à reputação (Art. 139 CP)</li>
        <li>Injúria: ofender dignidade ou decoro (Art. 140 CP)</li>
        <li>Constrangimento ilegal: constranger alguém (Art. 146 CP)</li>
        <li>Ameaça: ameaçar pessoa com violência (Art. 147 CP)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Homicídio doloso: dolo de matar, pena 6-20 anos</li>
        <li>Homicídio culposo: sem intenção, pena 1-3 anos</li>
        <li>Homicídio qualificado: motivos fúteis, meio cruel, etc.</li>
        <li>Lesões corporais leves: detenção 3 meses a 1 ano</li>
        <li>Lesões corporais graves: incapacidade >30 dias, deformidade, etc.</li>
        <li>Lesões corporais gravíssimas: aborto, invalidez, etc.</li>
        <li>Crime contra honra: ação penal pública condicionada (exceto injúria racial)</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar elemento subjetivo (dolo ou culpa)</li>
        <li>Distinguir crime doloso de culposo</li>
        <li>Reconhecer qualificadoras e causas de aumento</li>
        <li>Aplicar lei dos crimes contra a honra em contexto policial</li>
        <li>Investigar crimes contra a pessoa de forma adequada</li>
        <li>Documentar provas de lesões e ameaças</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Homicídio doloso: suspeito disparou arma contra vítima</li>
        <li>Homicídio culposo: motorista atropela pedestre por imprudência</li>
        <li>Lesão corporal grave: agressão causou incapacidade de 40 dias</li>
        <li>Calúnia: acusar falsamente alguém de roubo</li>
        <li>Constrangimento ilegal: forçar alguém a fazer algo contra vontade</li>
        <li>Ameaça: ''Vou te matar se não pagar'' constitui crime</li>
    </ul>
</div>',
    'Homicídio doloso: dolo de matar; culposo: sem intenção
Lesões corporais: leves, graves, gravíssimas têm penas diferentes
Crimes contra honra: calúnia (crime), difamação (fato), injúria (qualidade)
Constrangimento ilegal exige violência ou grave ameaça
Ameaça é crime contra a liberdade individual
Prova é essencial em crimes contra a pessoa
Policiais devem estar atentos a esses crimes em inquéritos',
    '[{"type": "article", "title": "Art. 121 CP - Homicídio", "content": "Matar alguém: pena 6-20 anos. Qualificado: 12-30 anos."}, {"type": "article", "title": "Art. 129 CP - Lesões Corporais", "content": "Ofender integridade física ou saúde. Pena varia de 3 meses a 8 anos."}, {"type": "tip", "title": "Investigação", "content": "Documentar provas com laudos periciais, depoimentos e imagens."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_penal_crimes_contra_patrimonio',
    'Crimes Contra o Patrimônio',
    'NOÇÕES DE DIREITO PENAL',
    'Crimes em Espécie',
    'Compreender os crimes contra o patrimônio (furto, roubo, extorsão, dano, apropriação indébita, estelionato), seus elementos típicos e distinções importantes.',
    '{"main_concepts": ["Furto", "Roubo", "Extorsão", "Dano", "Apropriação Indébita", "Estelionato", "Posse", "Propriedade"], "key_points": ["Furto: subtração sem violência", "Roubo: subtração com violência ou grave ameaça", "Extorsão: obtenção de vantagem mediante violência", "Dano: destruição de alheio", "Estelionato: fraude para obter vantagem ilícita"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Os crimes contra o patrimônio estão previstos no Título II do Código Penal (Art. 155 a 183). Incluem furto, roubo, extorsão, dano, apropriação indébita, estelionato e receptação. A distinção entre furto e roubo é fundamental.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Furto: subtrair para si ou para outrem coisa alheia móvel (Art. 155 CP)</li>
        <li>Roubo: subtrair mediante violência ou grave ameaça (Art. 157 CP)</li>
        <li>Extorsão: obter vantagem mediante violência ou grave ameaça (Art. 158 CP)</li>
        <li>Dano: destruir, inutilizar ou deteriorar coisa alheia (Art. 163 CP)</li>
        <li>Apropriação indébita: apropriar-se de coisa que tem posse (Art. 168 CP)</li>
        <li>Estelionato: obter vantagem ilícita mediante fraude (Art. 171 CP)</li>
        <li>Receptação: adquirir coisa sabendo ser produto de crime (Art. 180 CP)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Furto: pena 1-4 anos, sem violência</li>
        <li>Roubo: pena 4-10 anos, com violência/grave ameaça</li>
        <li>Roubo qualificado: arma, concurso, etc.</li>
        <li>Extorsão: pena 4-10 anos, vantagem econômica</li>
        <li>Dano: pena 1-6 meses, pode ser qualificado</li>
        <li>Estelionato: pena 1-5 anos, mediante fraude</li>
        <li>Apropriação indébita: tem posse legítima inicialmente</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Distinguir furto de roubo (violência)</li>
        <li>Identificar qualificadoras em crimes patrimoniais</li>
        <li>Investigar crimes contra o patrimônio com diligência</li>
        <li>Documentar circunstâncias do crime (arma, concurso, etc.)</li>
        <li>Compreender diferença entre estelionato e apropriação indébita</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Furto: suspeito subtrai celular de mesa sem vítima perceber</li>
        <li>Roubo: suspeito aponta arma e subtrai celular da vítima</li>
        <li>Extorsão: sequestrador exige resgate em troca de libertação</li>
        <li>Dano: vândalo quebra vidros de loja durante protesto</li>
        <li>Estelionato: golpista vende produto inexistente via internet</li>
        <li>Apropriação indébita: taxista encontra celular de passageiro e não devolve</li>
    </ul>
</div>',
    'Furto: subtração sem violência; Roubo: com violência/grave ameaça
Roubo qualificado: arma, concurso, privação de liberdade
Extorsão: obter vantagem mediante violação da vontade
Estelionato: fraude para obter vantagem econômica
Apropriação indébita: tem posse legítima, depois se apropria
Receptação: receber produto de crime sabendo da origem
Dano qualificado: bem público, patrimônio histórico, etc.',
    '[{"type": "article", "title": "Art. 155 CP - Furto", "content": "Subtrair coisa alheia móvel: pena 1-4 anos. Qualificado: 2-8 anos."}, {"type": "article", "title": "Art. 157 CP - Roubo", "content": "Subtrair com violência/grave ameaça: pena 4-10 anos. Qualificado: 7-30 anos."}, {"type": "comparison", "title": "Furto vs Roubo", "content": "Furto: sem violência. Roubo: com violência ou grave ameaça."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_penal_crimes_administracao_publica',
    'Crimes Contra a Administração Pública',
    'NOÇÕES DE DIREITO PENAL',
    'Crimes em Espécie',
    'Dominar os crimes contra a administração pública (corrupção passiva, corrupção ativa, prevaricação, concussão, peculato), essenciais para atuação policial.',
    '{"main_concepts": ["Corrupção Passiva", "Corrupção Ativa", "Prevaricação", "Concussão", "Peculato", "Funcionário Público", "Advocacia Administrativa"], "key_points": ["Corrupção passiva: funcionário recebe vantagem indevida", "Corrupção ativa: oferece vantagem a funcionário", "Prevaricação: retardar ou omitir ato de ofício", "Concussão: exigir vantagem indevida", "Peculato: apropriar-se de bem público"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Os crimes contra a administração pública estão previstos no Título XI do Código Penal (Art. 312 a 359-H). São crimes cometidos por funcionários públicos contra a administração ou por particulares contra a administração pública.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Peculato: apropriar-se de bem público (Art. 312 CP)</li>
        <li>Peculato culposo: negligência na guarda de bem público</li>
        <li>Concussão: exigir vantagem indevida (Art. 316 CP)</li>
        <li>Corrupção passiva: receber vantagem indevida (Art. 317 CP)</li>
        <li>Corrupção ativa: oferecer vantagem a funcionário (Art. 333 CP)</li>
        <li>Prevaricação: retardar ou omitir ato de ofício (Art. 319 CP)</li>
        <li>Advocacia administrativa: patrocinar interesse privado (Art. 321 CP)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Peculato doloso: pena 2-12 anos</li>
        <li>Peculato culposo: pena 3 meses a 1 ano</li>
        <li>Concussão: pena 2-8 anos</li>
        <li>Corrupção passiva: pena 2-12 anos</li>
        <li>Corrupção ativa: pena 2-12 anos</li>
        <li>Prevaricação: pena 3 meses a 1 ano</li>
        <li>Sujeito ativo: funcionário público na maioria dos crimes</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar crimes funcionais em investigações</li>
        <li>Compreender diferença entre corrupção passiva e ativa</li>
        <li>Investigar crimes de peculato com diligência</li>
        <li>Documentar provas de corrupção e prevaricação</li>
        <li>Atuar com integridade para não cometer crimes funcionais</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Peculato: servidor desvia verba pública para conta pessoal</li>
        <li>Concussão: policial exige propina para não multar motorista</li>
        <li>Corrupção passiva: delegado recebe propina para arquivar inquérito</li>
        <li>Corrupção ativa: empresário oferece propina a servidor</li>
        <li>Prevaricação: servidor retarda ato para favorecer amigo</li>
        <li>Advocacia administrativa: servidor usa cargo para favorecer empresa</li>
    </ul>
</div>',
    'Peculato: apropriação de bem público
Concussão: exigência de vantagem (coação)
Corrupção passiva: recebimento de vantagem (acordo)
Corrupção ativa: oferta de vantagem a funcionário
Prevaricação: retardar ou omitir ato de ofício
Advocacia administrativa: patrocinar interesse privado
Policiais devem estar atentos a crimes funcionais',
    '[{"type": "article", "title": "Art. 312 CP - Peculato", "content": "Apropriar-se de bem público: pena 2-12 anos. Culposo: 3 meses a 1 ano."}, {"type": "article", "title": "Art. 317 CP - Corrupção Passiva", "content": "Receber vantagem indevida: pena 2-12 anos."}, {"type": "tip", "title": "Integridade", "content": "Policiais devem recusar propinas e agir com transparência."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_processual_penal_inquerito_policial',
    'Inquérito Policial',
    'NOÇÕES DE DIREITO PROCESSUAL PENAL',
    'Procedimento Investigativo',
    'Dominar o instituto do inquérito policial, suas características, finalidade, titularidade, procedimentos, garantias do investigado e valor probatório.',
    '{"main_concepts": ["Inquérito Policial", "Titularidade", "Valor Probatório", "Notitia Criminis", "Indiciamento", "Garantias", "Conclusão"], "key_points": ["Inquérito: procedimento investigativo preparatório", "Titularidade: delegado de polícia", "Natureza: inquisitiva (não contraditório)", "Valor probatório: informativo, não vinculante", "Garantias do investigado: advogado, habeas corpus", "Prazo: geralmente 30 dias (prisão) ou indefinido (sem prisão)"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>O inquérito policial é procedimento administrativo-inquisitivo, presidido por delegado de polícia, destinado a apurar infração penal e sua autoria. É peça informativa, não vinculante para o juiz, que serve de base para a ação penal.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Inquérito policial: procedimento investigativo (Art. 4º CPP)</li>
        <li>Natureza: inquisitiva (não contraditório, sem ampla defesa)</li>
        <li>Finalidade: apurar infração penal e sua autoria</li>
        <li>Titularidade: delegado de polícia (autoridade policial)</li>
        <li>Valor probatório: informativo, não vincula juiz</li>
        <li>Notitia criminis: conhecimento da prática de crime</li>
        <li>Indiciamento: indicação de autoria pelo delegado</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Formas de instauração: de ofício, por requisição, por representação, auto de prisão em flagrante</li>
        <li>Notitia criminis: direta (vítima comunica) ou indireta (mídia, etc.)</li>
        <li>Indiciamento: não é acusação, é indicação de autoria</li>
        <li>Garantias do investigado: direito ao silêncio, advogado, habeas corpus</li>
        <li>Prazo: 30 dias com réu preso, sem prazo fixo sem réu preso</li>
        <li>Conclusão: relatório circunstanciado enviado ao MP</li>
        <li>Arquivamento: se não houver elementos para ação penal</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Instaurar inquérito conforme formas previstas no CPP</li>
        <li>Respeitar garantias do investigado durante investigação</li>
        <li>Produzir provas legais e constitucionais</li>
        <li>Elaborar relatório circunstanciado ao final</li>
        <li>Compreender valor probatório limitado do inquérito</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>De ofício: delegado toma conhecimento de crime e instaura inquérito</li>
        <li>Por requisição: Ministério Público ou juiz requisita instauração</li>
        <li>Por representação: vítima representa ao delegado</li>
        <li>Auto de prisão em flagrante: prisão em flagrante instaura inquérito</li>
        <li>Indiciamento: delegado indica autor com base em provas</li>
        <li>Relatório: delegado resume investigação e encaminha ao MP</li>
    </ul>
</div>',
    'Inquérito é procedimento inquisitivo, não contraditório
Titularidade exclusiva do delegado de polícia
Valor probatório é informativo, não vincula juiz
Indiciamento não é acusação criminal
Garantias do investigado devem ser respeitadas
Prazo: 30 dias com réu preso, indefinido sem réu preso
Arquivamento se não houver elementos para ação penal',
    '[{"type": "article", "title": "Art. 4º CPP - Inquérito", "content": "Procedimento administrativo presidido por delegado para apurar crime."}, {"type": "list", "title": "Formas de Instauração", "content": "De ofício, por requisição (MP/juiz), por representação (vítima), auto de prisão em flagrante."}, {"type": "tip", "title": "Valor Probatório", "content": "Inquérito é peça informativa. Juiz pode decidir contrário às conclusões do delegado."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_processual_penal_prisao_liberdade_provisoria',
    'Prisão e Liberdade Provisória',
    'NOÇÕES DE DIREITO PROCESSUAL PENAL',
    'Medidas Cautelares',
    'Compreender as espécies de prisão, seus requisitos, casos de cabimento e as medidas cautelares alternativas à prisão.',
    '{"main_concepts": ["Prisão em Flagrante", "Prisão Preventiva", "Prisão Temporária", "Liberdade Provisória", "Medidas Cautelares", "Fiança", "Prazos"], "key_points": ["Prisão em flagrante: crime no momento da prática", "Prisão preventiva: garantia da ordem processual", "Prisão temporária: investigação de crimes graves", "Liberdade provisória: substituição por medidas cautelares", "Fiança: depósito monetário para garantir comparecimento"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A prisão pode ser provisória (flagrante, preventiva, temporária) ou definitiva (após condenação transitada). A liberdade provisória é o direito de o acusado responder ao processo em liberdade, mediante medidas cautelares ou fiança.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Prisão em flagrante: flagrante próprio, impróprio, presumido (Art. 302 CPP)</li>
        <li>Prisão preventiva: garantia da ordem pública, econômica, instrução ou aplicação da lei (Art. 312 CPP)</li>
        <li>Prisão temporária: investigação de crimes graves (Lei 7.960/89)</li>
        <li>Liberdade provisória: direito de responder processo em liberdade</li>
        <li>Medidas cautelares: comparecimento, suspensão de armas, etc. (Art. 319 CPP)</li>
        <li>Fiança: depósito em dinheiro ou bens para garantir comparecimento</li>
        <li>Prazos: flagrante (24h para comunicação), preventiva (prazo indeterminado)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Flagrante: crime no momento ou logo após (perseguição, posse de objetos)</li>
        <li>Preventiva: requisitos do Art. 313 CPP (crime com pena >4 anos, etc.)</li>
        <li>Temporalária: prazo de 5 dias (crime comum) ou 30 dias (heinous)</li>
        <li>Liberdade provisória: vedada em crimes hediondos (exceto se primário)</li>
        <li>Medidas cautelares: comparecimento, afastamento do lar, proibição de contato</li>
        <li>Fiança: não pode em crimes hediondos, racismo, tortura</li>
        <li>Relaxamento: quando prisão for ilegal</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar hipóteses de prisão em flagrante</li>
        <li>Verificar requisitos da prisão preventiva</li>
        <li>Aplicar medidas cautelares quando cabível</li>
        <li>Conceder liberdade provisória quando não houver vedação</li>
        <li>Arbitrar fiança nos casos permitidos</li>
        <li>Relaxar prisão ilegal (falta de motivo, prazo, formalidade)</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Flagrante próprio: suspeito é encontrado cometendo crime</li>
        <li>Flagrante impróprio: suspeito é perseguido logo após crime</li>
        <li>Flagrante presumido: suspeito é encontrado com instrumentos do crime</li>
        <li>Preventiva: réu ameaça testemunhas em investigação</li>
        <li>Liberdade provisória: réu primário, crime leve, sem periculosidade</li>
        <li>Fiança: réu paga R$5.000 para responder em liberdade por furto simples</li>
    </ul>
</div>',
    'Flagrante: crime no momento ou logo após
Preventiva: garantia da ordem processual
Temporalária: investigação de crimes graves (5-30 dias)
Liberdade provisória: direito de responder em liberdade
Medidas cautelares: alternativas à prisão
Fiança: vedada em crimes hediondos, racismo, tortura
Relaxamento: quando prisão for ilegal',
    '[{"type": "article", "title": "Art. 302 CPP - Flagrante", "content": "Flagrante: momento do crime, perseguição, ou com instrumentos do crime."}, {"type": "article", "title": "Art. 312 CPP - Preventiva", "content": "Garantia da ordem pública, econômica, instrução ou aplicação da lei penal."}, {"type": "list", "title": "Medidas Cautelares", "content": "Comparecimento, suspensão de armas, afastamento do lar, proibição de contato."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_administrativo_organizacao_administrativa',
    'Noção de Organização Administrativa',
    'NOÇÕES DE DIREITO ADMINISTRATIVO',
    'Organização do Estado',
    'Compreender os conceitos de centralização, descentralização, concentração e desconcentração, bem como a distinção entre administração direta e indireta.',
    '{"main_concepts": ["Centralização", "Descentralização", "Concentração", "Desconcentração", "Administração Direta", "Administração Indireta"], "key_points": ["Centralização: poder concentrado em uma autoridade", "Descentralização: transferência de competências", "Concentração: acumulação de funções em um órgão", "Desconcentração: distribuição de funções em vários órgãos", "Administração direta: União, Estados, Municípios", "Administração indireta: autarquias, fundações, empresas públicas, sociedades de economia mista"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A organização administrativa refere-se à estrutura do Estado e distribuição de competências. Centralização e descentralização referem-se à distribuição vertical de poder. Concentração e desconcentração referem-se à distribuição horizontal de funções.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Centralização: poder concentrado no nível central (União)</li>
        <li>Descentralização: transferência de competências para entes federados ou entidades</li>
        <li>Concentração: acumulação de funções em um único órgão</li>
        <li>Desconcentração: distribuição de funções em vários órgãos hierarquizados</li>
        <li>Administração direta: União, Estados, Municípios, DF</li>
        <li>Administração indireta: autarquias, fundações, empresas públicas, sociedades de economia mista</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Descentralização territorial: União para Estados/Municípios</li>
        <li>Descentralização administrativa: criação de autarquias, fundações, etc.</li>
        <li>Desconcentração: distribuição de funções em departamentos hierarquizados</li>
        <li>Autarquias: pessoas jurídicas de direito público, regime especial</li>
        <li>Fundações públicas: pessoas jurídicas de direito privado, patrimônio dedicado</li>
        <li>Empresas públicas: pessoas jurídicas de direito privado, capital 100% público</li>
        <li>Sociedades de economia mista: capital público e privado, maioria pública</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Distinguir centralização de descentralização</li>
        <li>Identificar entidades da administração indireta</li>
        <li>Compreender natureza jurídica de cada entidade</li>
        <li>Aplicar conceitos em estrutura de órgãos públicos</li>
        <li>Entender relação de tutela e subordinação</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Centralização: União determina política educacional nacional</li>
        <li>Descentralização: União transfere competência para Estado implementar política</li>
        <li>Autarquia: Polícia Civil (autarquia estadual)</li>
        <li>Fundação pública: Fundação de Saúde do Estado</li>
        <li>Empresa pública: Banco do Brasil (capital 100% público)</li>
        <li>Sociedade de economia mista: Petrobras (capital público e privado)</li>
    </ul>
</div>',
    'Centralização: poder no centro; Descentralização: transferência de poder
Concentração: funções em um órgão; Desconcentração: distribuição horizontal
Administração direta: União, Estados, Municípios
Administração indireta: autarquias, fundações, empresas públicas, sociedades de economia mista
Autarquias: direito público, regime especial
Empresas públicas: direito privado, capital 100% público
Sociedades de economia mista: direito privado, capital misto',
    '[{"type": "concept", "title": "Centralização vs Descentralização", "content": "Centralização: poder concentrado. Descentralização: transferência de competências."}, {"type": "concept", "title": "Administração Direta", "content": "União, Estados, Municípios e Distrito Federal."}, {"type": "list", "title": "Administração Indireta", "content": "Autarquias, Fundações, Empresas Públicas, Sociedades de Economia Mista."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'direito_administrativo_ato_administrativo',
    'Ato Administrativo',
    'NOÇÕES DE DIREITO ADMINISTRATIVO',
    'Atos da Administração',
    'Dominar o conceito, requisitos, atributos, classificação e espécies de atos administrativos, essenciais para atuação funcional.',
    '{"main_concepts": ["Ato Administrativo", "Requisitos", "Atributos", "Classificação", "Espécies", "Vício", "Anulação", "Revogação"], "key_points": ["Ato administrativo: manifestação de vontade da administração", "Requisitos: competência, forma, objeto, motivo, finalidade", "Atributos: presunção de legitimidade, imperatividade, autoexecutoriedade", "Classificação: vinculados vs discricionários", "Espécies: licenças, autorizações, certidões, etc."]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Ato administrativo é toda manifestação de vontade da administração pública que tenha por fim imediato adquirir, resguardar, transferir, modificar, extinguir e declarar direitos, ou impor obrigações aos administrados.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Ato administrativo: manifestação de vontade da administração</li>
        <li>Requisitos (elementos): competência, forma, objeto, motivo, finalidade</li>
        <li>Atributos: presunção de legitimidade, imperatividade, autoexecutoriedade</li>
        <li>Classificação: vinculados (sem liberdade) vs discricionários (com liberdade)</li>
        <li>Espécies: licenças, autorizações, certidões, atos normativos, punitivos</li>
        <li>Vício: defeito em algum requisito (ilegalidade)</li>
        <li>Anulação: ato ilegal é anulado (efeito ex tunc)</li>
        <li>Revogação: ato legal é revogado por conveniência (efeito ex nunc)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Competência: poder do agente para praticar o ato</li>
        <li>Forma: modo de exteriorização do ato (escrito, verbal)</li>
        <li>Objeto: conteúdo do ato (o que ele dispõe)</li>
        <li>Motivo: razão de fato e de direito que fundamenta o ato</li>
        <li>Finalidade: objetivo visado pelo ato (interesse público)</li>
        <li>Ato vinculado: sem liberdade de escolha (ex: concessão de licença-paternidade)</li>
        <li>Ato discricionário: com liberdade de escolha (ex: autorização de evento)</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar requisitos de validade do ato administrativo</li>
        <li>Reconhecer atributos que conferem eficácia ao ato</li>
        <li>Distinguir ato vinculado de discricionário</li>
        <li>Identificar vícios que podem tornar ato nulo</li>
        <li>Compreender diferença entre anulação e revogação</li>
        <li>Produzir atos administrativos conforme os requisitos</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Vício de competência: delegado sem autoridade pratica ato</li>
        <li>Vício de forma: ato não escrito quando exigido por lei</li>
        <li>Vício de objeto: ato dispõe coisa impossível</li>
        <li>Vício de motivo: ato fundamentado em motivo inexistente</li>
        <li>Vício de finalidade: ato com finalidade diversa do interesse público</li>
        <li>Anulação: ato viciado é anulado (efeito retroativo)</li>
        <li>Revogação: ato legal é revogado por conveniência (efeito futuro)</li>
    </ul>
</div>',
    'Requisitos: competência, forma, objeto, motivo, finalidade
Atributos: presunção de legitimidade, imperatividade, autoexecutoriedade
Ato vinculado: sem liberdade; Ato discricionário: com liberdade
Vício: defeito em requisito torna ato nulo
Anulação: ato ilegal (efeito ex tunc)
Revogação: ato legal por conveniência (efeito ex nunc)
Policial deve conhecer atos que pratica (multas, apreensões, etc.)',
    '[{"type": "list", "title": "Requisitos do Ato", "content": "Competência, Forma, Objeto, Motivo, Finalidade."}, {"type": "list", "title": "Atributos", "content": "Presunção de legitimidade, Imperatividade, Autoexecutoriedade."}, {"type": "comparison", "title": "Anulação vs Revogação", "content": "Anulação: ato ilegal (ex tunc). Revogação: ato legal por conveniência (ex nunc)."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'etica_servico_publico_ética_moral',
    'Ética e Moral',
    'ÉTICA NO SERVIÇO PÚBLICO',
    'Fundamentos Éticos',
    'Compreender a distinção entre ética e moral, bem como os fundamentos da ética no serviço público e sua importância para a atuação profissional.',
    '{"main_concepts": ["Ética", "Moral", "Valores", "Princípios", "Dever", "Responsabilidade", "Integridade"], "key_points": ["Ética: reflexão sobre comportamento moral", "Moral: conjunto de normas e valores de uma sociedade", "Ética é teórica; moral é prática", "Servidor público deve agir com ética e moral", "Integridade é fundamental para confiança pública"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Ética é a reflexão filosófica sobre o comportamento moral, questionando a validade e fundamentação das normas morais. Moral é o conjunto de normas, valores e costumes que regem o comportamento de uma sociedade. No serviço público, ética e moral são essenciais.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Ética: reflexão sobre o que é certo/errado, bom/mau</li>
        <li>Moral: conjunto de normas de comportamento socialmente aceitas</li>
        <li>Ética é teórica; moral é prática</li>
        <li>Valores: crenças sobre o que é importante (honestidade, justiça)</li>
        <li>Princípios: diretrizes que orientam a ação (impessoalidade, moralidade)</li>
        <li>Dever: obrigação moral de agir corretamente</li>
        <li>Responsabilidade: accountability pelas ações</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Ética questiona fundamentos da moral</li>
        <li>Moral muda entre sociedades e épocas</li>
        <li>Ética busca princípios universais</li>
        <li>No serviço público, ética é regulamentada por leis e códigos</li>
        <li>Comportamento ético aumenta confiança pública</li>
        <li>Comportamento antiético corrói a instituição</li>
        <li>Integridade: coerência entre valores e ações</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Distinguir ética de moral</li>
        <li>Identificar dilemas éticos no serviço público</li>
        <li>Agir com integridade em todas as situações</li>
        <li>Recusar comportamentos antiéticos (corrupção, favoritismo)</li>
        <li>Promover cultura ética na instituição</li>
        <li>Denunciar comportamentos antiéticos</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Dilema ético: colega pede para ignorar infração de amigo</li>
        <li>Comportamento ético: recusar e seguir procedimento regular</li>
        <li>Comportamento antiético: aceitar propina para arquivar inquérito</li>
        <li>Integridade: aplicar lei igualmente a todos, sem favoritismo</li>
        <li>Responsabilidade: assumir responsabilidade por erros e corrigi-los</li>
    </ul>
</div>',
    'Ética: reflexão sobre comportamento moral
Moral: normas e valores de uma sociedade
Ética é teórica; moral é prática
Integridade: coerência entre valores e ações
Servidor público deve ser exemplo de ética
Comportamento antiético corrói confiança pública
Lei 8.429/92 (Improbidade Administrativa) pune comportamentos antiéticos',
    '[{"type": "concept", "title": "Ética vs Moral", "content": "Ética: reflexão teórica. Moral: normas práticas de comportamento."}, {"type": "list", "title": "Valores Éticos", "content": "Honestidade, integridade, justiça, respeito, responsabilidade."}, {"type": "tip", "title": "No Serviço Público", "content": "Agir com ética aumenta confiança da população na instituição."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'etica_servico_publico_codigo_etica_alagoas',
    'Lei Estadual nº 6.754/2006 (Código de Ética)',
    'ÉTICA NO SERVIÇO PÚBLICO',
    'Legislação',
    'Dominar as disposições do Código de Ética Funcional do Servidor Público do Estado de Alagoas, seus deveres, proibições e penalidades.',
    '{"main_concepts": ["Código de Ética", "Deveres", "Proibições", "Penalidades", "Comissão de Ética", "Servidor Público", "Alagoas"], "key_points": ["Código de Ética estabelece deveres e proibições", "Deveres: dignidade, decoro, eficiência, lealdade", "Proibições: corrupção, nepotismo, uso indevido de cargo", "Penalidades: advertência, suspensão, demissão", "Comissão de Ética apura infrações éticas"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A Lei Estadual nº 6.754/2006 institui o Código de Ética Funcional do Servidor Público do Estado de Alagoas, estabelecendo deveres, proibições e penalidades para condutas antiéticas. O código visa garantir a integridade e dignidade do serviço público.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Código de Ética: conjunto de normas de conduta para servidores</li>
        <li>Deveres: dignidade, decoro, eficiência, lealdade, discrição</li>
        <li>Proibições: corrupção, nepotismo, uso indevido de cargo, favorecimento</li>
        <li>Penalidades: advertência, suspensão, demissão</li>
        <li>Comissão de Ética: órgão que apura infrações éticas</li>
        <li>Sindicância: procedimento para apurar infrações</li>
        <li>Processo Administrativo Disciplinar (PAD): procedimento formal</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Dever de dignidade: comportamento respeitoso</li>
        <li>Dever de decoro: conduta compatível com cargo</li>
        <li>Dever de eficiência: desempenho com qualidade</li>
        <li>Dever de lealdade: fidelidade à instituição</li>
        <li>Proibição de corrupção: aceitar propinas, vantagens indevidas</li>
        <li>Proibição de nepotismo: contratar parentes</li>
        <li>Proibição de uso indevido: usar cargo para fins pessoais</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Conhecer os deveres estabelecidos no Código</li>
        <li>Respeitar as proibições estabelecidas</li>
        <li>Denunciar infrações éticas observadas</li>
        <li>Cooperar com investigações da Comissão de Ética</li>
        <li>Agir com integridade em todas as situações</li>
        <li>Promover cultura ética na instituição</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Dever de dignidade: servidor trata cidadão com respeito</li>
        <li>Dever de eficiência: servidor conclua inquérito em prazo razoável</li>
        <li>Proibição de corrupção: servidor recusa propina</li>
        <li>Proibição de nepotismo: servidor não contrata filho para cargo</li>
        <li>Proibição de uso indevido: servidor não usa viatura para fins pessoais</li>
        <li>Penalidade: servidor demitido por corrupção</li>
    </ul>
</div>',
    'Código de Ética estabelece deveres e proibições
Deveres: dignidade, decoro, eficiência, lealdade
Proibições: corrupção, nepotismo, uso indevido de cargo
Penalidades: advertência, suspensão, demissão
Comissão de Ética apura infrações éticas
PAD é procedimento formal para infrações graves
Servidor deve conhecer e cumprir o Código',
    '[{"type": "article", "title": "Lei 6.754/2006", "content": "Código de Ética Funcional do Servidor Público do Estado de Alagoas."}, {"type": "list", "title": "Deveres Principais", "content": "Dignidade, decoro, eficiência, lealdade, discrição."}, {"type": "list", "title": "Proibições Principais", "content": "Corrupção, nepotismo, uso indevido de cargo, favorecimento."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'crimes_ciberneticos_lei_12737_2012',
    'Lei nº 12.737/2012 (Carolina Dieckmann)',
    'CRIMES CIBERNÉTICOS E SEGURANÇA DIGITAL',
    'Legislação',
    'Dominar a Lei Carolina Dieckmann, que tipifica crimes cometidos em meios digitais, como invasão de dispositivo, roubo de dados e violação de sigilo.',
    '{"main_concepts": ["Lei Carolina Dieckmann", "Invasão de Dispositivo", "Roubo de Dados", "Violação de Sigilo", "Crimes Digitais", "Penalidades"], "key_points": ["Invasão de dispositivo com violação de sigilo", "Roubo de dados para obter vantagem econômica", "Violação de correspondência digital", "Agressão a sistemas informatizados", "Penalidades variam de 3 meses a 10 anos"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A Lei nº 12.737/2012, conhecida como Lei Carolina Dieckmann, tipifica crimes cometidos em meios digitais, como invasão de dispositivo, roubo de dados e violação de sigilo. A lei foi criada após caso de invasão de computador da apresentadora De igual.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Lei Carolina Dieckmann: Lei 12.737/2012</li>
        <li>Invasão de dispositivo: acessar dispositivo sem autorização (Art. 154-A)</li>
        <li>Roubo de dados: obter dados para vantagem econômica (Art. 154-B)</li>
        <li>Violação de sigilo: acessar dados protegidos (Art. 154-C)</li>
        <li>Agressão a sistemas: causar dano a sistema informatizado (Art. 154-D)</li>
        <li>Divulgação de segredo: revelar segredo obtido (Art. 154-E)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Invasão de dispositivo: pena 3 meses a 1 ano, aumenta se houver violação de sigilo</li>
        <li>Roubo de dados: pena 1-4 anos, aumenta se houver vantagem econômica</li>
        <li>Violação de sigilo: pena 1-4 anos</li>
        <li>Agressão a sistemas: pena 6 meses a 2 anos</li>
        <li>Divulgação de segredo: pena 1-4 anos</li>
        <li>Aumenta pena se crime cometido por servidor público</li>
        <li>Aumenta pena se crime cometido contra pessoas vulneráveis</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar crimes cibernéticos tipificados na lei</li>
        <li>Investigar invasões de dispositivos digitais</li>
        <li>Coletar provas digitais (logs, IPs, etc.)</li>
        <li>Cooperar com peritos forenses digitais</li>
        <li>Aplicar lei em casos de crimes digitais</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Invasão de dispositivo: hacker invade computador de vítima</li>
        <li>Roubo de dados: hacker rouba dados de cartão de crédito</li>
        <li>Violação de sigilo: funcionário acessa dados de cliente sem autorização</li>
        <li>Agressão a sistemas: hacker causa dano a servidor de empresa</li>
        <li>Divulgação de segredo: ex-funcionário revela segredos de empresa</li>
    </ul>
</div>',
    'Lei Carolina Dieckmann tipifica crimes digitais
Invasão de dispositivo: acessar sem autorização
Roubo de dados: obter dados para vantagem econômica
Violação de sigilo: acessar dados protegidos
Agressão a sistemas: causar dano a sistema informatizado
Penalidades aumentam se cometido por servidor público
Policiais devem investigar crimes digitais com peritos forenses',
    '[{"type": "article", "title": "Art. 154-A - Invasão", "content": "Invadir dispositivo sem autorização: pena 3 meses a 1 ano."}, {"type": "article", "title": "Art. 154-B - Roubo de Dados", "content": "Obter dados para vantagem econômica: pena 1-4 anos."}, {"type": "tip", "title": "Investigação", "content": "Coletar provas digitais (logs, IPs, metadados) com peritos forenses."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'crimes_ciberneticos_conceito_classificacao',
    'Conceito e Classificação de Crimes Cibernéticos',
    'CRIMES CIBERNÉTICOS E SEGURANÇA DIGITAL',
    'Fundamentos',
    'Compreender o conceito de crimes cibernéticos e suas classificações (crimes contra sistemas, crimes contra dados, crimes contra pessoas, crimes contra propriedade).',
    '{"main_concepts": ["Crime Cibernético", "Cibercrime", "Classificação", "Hacking", "Phishing", "Malware", "Ransomware"], "key_points": ["Crime cibernético: crime cometido usando tecnologia", "Classificação: contra sistemas, dados, pessoas, propriedade", "Hacking: invasão não autorizada de sistemas", "Phishing: fraude para obter dados sensíveis", "Malware: software malicioso (vírus, worms, trojan)", "Ransomware: sequestra dados e exige resgate"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Crime cibernético é crime cometido usando computadores, redes ou internet. Pode ser classificado em crimes contra sistemas (hacking), crimes contra dados (roubo de dados), crimes contra pessoas (cyberbullying) e crimes contra propriedade (pirataria).</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Crime cibernético: crime cometido usando tecnologia</li>
        <li>Cibercrime: termo internacional para crime cibernético</li>
        <li>Hacking: invasão não autorizada de sistemas</li>
        <li>Phishing: fraude para obter dados sensíveis (senhas, cartões)</li>
        <li>Malware: software malicioso (vírus, worms, trojan, ransomware)</li>
        <li>Ransomware: sequestra dados e exige pagamento</li>
        <li>DDoS: ataque de negação de serviço distribuído</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Crimes contra sistemas: hacking, DDoS, malware</li>
        <li>Crimes contra dados: roubo de dados, violação de sigilo</li>
        <li>Crimes contra pessoas: cyberbullying, grooming, vingança pornográfica</li>
        <li>Crimes contra propriedade: pirataria, roubo de identidade</li>
        <li>Crimes financeiros: fraude online, lavagem de dinheiro</li>
        <li>Crimes contra governos: espionagem cibernética, sabotagem</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar tipos de crimes cibernéticos</li>
        <li>Investigar crimes digitais com peritos forenses</li>
        <li>Coletar provas digitais (logs, IPs, metadados)</li>
        <li>Prevenir crimes cibernéticos com medidas de segurança</li>
        <li>Educar cidadãos sobre segurança digital</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Hacking: hacker invade servidor de banco e rouba dados</li>
        <li>Phishing: e-mail falso de banco pedindo senha</li>
        <li>Malware: vírus infecta computador e rouba dados</li>
        <li>Ransomware: malware criptografa arquivos e exige resgate</li>
        <li>DDoS: atacante sobrecarrega servidor de empresa</li>
        <li>Cyberbullying: assédio online contra adolescente</li>
    </ul>
</div>',
    'Crime cibernético: crime cometido usando tecnologia
Classificação: contra sistemas, dados, pessoas, propriedade
Hacking: invasão não autorizada de sistemas
Phishing: fraude para obter dados sensíveis
Malware: software malicioso (vírus, worms, trojan)
Ransomware: sequestra dados e exige resgate
Investigação requer peritos forenses digitais',
    '[{"type": "concept", "title": "Crime Cibernético", "content": "Crime cometido usando computadores, redes ou internet."}, {"type": "list", "title": "Classificação", "content": "Contra sistemas, dados, pessoas, propriedade, finanças, governos."}, {"type": "list", "title": "Tipos Comuns", "content": "Hacking, Phishing, Malware, Ransomware, DDoS, Cyberbullying."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'crimes_ciberneticos_busca_apreensao_digital',
    'Busca e Apreensão de Itens Digitais (Art. 240 CPP)',
    'CRIMES CIBERNÉTICOS E SEGURANÇA DIGITAL',
    'Procedimento',
    'Dominar os requisitos legais e limites para busca e apreensão de itens digitais conforme o Art. 240 e seguintes do CPP.',
    '{"main_concepts": ["Busca e Apreensão", "Art. 240 CPP", "Provas Digitais", "Perícia Forense", "Cadeia de Custódia", "Sigilo"], "key_points": ["Busca e apreensão: medida cautelar para coletar provas", "Art. 240 CPP: requisitos para busca e apreensão", "Provas digitais: computadores, celulares, e-mails", "Perícia forense: análise de provas digitais", "Cadeia de custódia: rastreabilidade das provas", "Sigilo: proteção de dados sensíveis"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>A busca e apreensão de itens digitais é regulada pelo Art. 240 e seguintes do CPP. Requer mandado judicial, respeitando direitos fundamentais e garantindo a integridade das provas digitais coletadas.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Busca e apreensão: medida cautelar para coletar provas</li>
        <li>Art. 240 CPP: requisitos para busca e apreensão</li>
        <li>Mandado judicial: necessário para busca em domicílio</li>
        <li>Provas digitais: computadores, celulares, e-mails, servidores</li>
        <li>Perícia forense: análise técnica de provas digitais</li>
        <li>Cadeia de custódia: rastreabilidade das provas</li>
        <li>Sigilo: proteção de dados sensíveis (médicos, financeiros)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Requisitos do Art. 240 CPP: fundada suspeita, indicação do local, nome do autor</li>
        <li>Mandado judicial: necessário para busca em domicílio (Art. 5º XI CF)</li>
        <li>Flagrante: possível sem mandado em situações excepcionais</li>
        <li>Perícia forense: perito analisa dispositivo sem alterar dados</li>
        <li>Cadeia de custódia: documentar origem, transporte e armazenamento de provas</li>
        <li>Sigilo: dados sensíveis devem ser protegidos</li>
        <li>Decomposição: se dispositivo contém dados irrelevantes, pode ser devolvido</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Obter mandado judicial para busca e apreensão</li>
        <li>Respeitar direitos fundamentais (intimidade, propriedade)</li>
        <li>Coletar provas digitais com perícia forense</li>
        <li>Documentar cadeia de custódia das provas</li>
        <li>Proteger dados sensíveis coletados</li>
        <li>Aplicar Art. 240 CPP em crimes cibernéticos</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Mandado judicial: juiz autoriza busca em computador de suspeito</li>
        <li>Perícia forense: perito analisa computador e extrai provas</li>
        <li>Cadeia de custódia: perito documenta origem e transporte de computador</li>
        <li>Sigilo: dados médicos coletados são protegidos</li>
        <li>Decomposição: parte irrelevante do computador é devolvida</li>
    </ul>
</div>',
    'Busca e apreensão requer mandado judicial (exceto flagrante)
Art. 240 CPP estabelece requisitos para busca
Provas digitais requer perícia forense
Cadeia de custódia garante integridade das provas
Dados sensíveis devem ser protegidos
Decomposição permite devolução de parte irrelevante
Policial deve cooperar com peritos forenses',
    '[{"type": "article", "title": "Art. 240 CPP", "content": "Requisitos para busca e apreensão: fundada suspeita, indicação do local, nome do autor."}, {"type": "list", "title": "Provas Digitais", "content": "Computadores, celulares, e-mails, servidores, logs, metadados."}, {"type": "tip", "title": "Cadeia de Custódia", "content": "Documentar origem, transporte e armazenamento para garantir integridade das provas."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'seguranca_digital_privacidade',
    'Privacidade',
    'CRIMES CIBERNÉTICOS E SEGURANÇA DIGITAL',
    'Proteção de Dados',
    'Compreender a importância da privacidade digital, os riscos de exposição de dados pessoais e as medidas para proteger informações.',
    '{"main_concepts": ["Privacidade", "Dados Pessoais", "Exposição", "Redes Sociais", "LGPD", "Proteção", "Riscos"], "key_points": ["Privacidade: direito de controlar informações pessoais", "Dados pessoais: informações que identificam pessoa", "Exposição: compartilhamento excessivo online", "Redes sociais: risco de vazamento de dados", "LGPD: Lei Geral de Proteção de Dados", "Proteção: medidas para garantir privacidade"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Privacidade digital é o direito de controlar informações pessoais online. Dados pessoais (nome, CPF, e-mail, fotos) podem ser expostos inadvertidamente em redes sociais, sites e aplicativos. A LGPD protege dados pessoais no Brasil.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Privacidade: direito de controlar informações pessoais</li>
        <li>Dados pessoais: informações que identificam pessoa (nome, CPF, e-mail)</li>
        <li>Dados sensíveis: origem racial, saúde, biometria, opinião política</li>
        <li>Exposição: compartilhamento excessivo online</li>
        <li>Redes sociais: risco de vazamento de dados</li>
        <li>LGPD: Lei 13.709/2018 protege dados pessoais</li>
        <li>Violação: sanções de multa e responsabilização</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Privacidade é direito fundamental (Art. 5º X CF)</li>
        <li>LGPD estabelece regras para tratamento de dados</li>
        <li>Consentimento: titular deve autorizar uso de dados</li>
        <li>Finalidade: dados só podem ser usados para propósito específico</li>
        <li>Minimização: coletar apenas dados necessários</li>
        <li>Segurança: medidas para proteger dados contra vazamento</li>
        <li>Violação: sanções de até 2% do faturamento</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Proteger dados pessoais em redes sociais</li>
        <li>Usar senhas fortes e autenticação em dois fatores</li>
        <li>Limitar compartilhamento de informações online</li>
        <li>Verificar políticas de privacidade de aplicativos</li>
        <li>Denunciar vazamentos de dados</li>
        <li>Aplicar LGPD em investigações criminais</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Exposição: usuário compartilha foto de documento em rede social</li>
        <li>Vazamento: site sofre ataque e dados de usuários são expostos</li>
        <li>LGPD: empresa que viola dados pode ser multada</li>
        <li>Proteção: usuário usa senha forte e autenticação em dois fatores</li>
        <li>Investigação: policial coleta dados com autorização judicial</li>
    </ul>
</div>',
    'Privacidade é direito fundamental
Dados pessoais devem ser protegidos
LGPD estabelece regras para tratamento de dados
Consentimento é necessário para uso de dados
Redes sociais são riscos para privacidade
Senhas fortes e MFA protegem contas
Policiais devem proteger dados coletados em investigações',
    '[{"type": "concept", "title": "Privacidade Digital", "content": "Direito de controlar informações pessoais online."}, {"type": "article", "title": "LGPD", "content": "Lei 13.709/2018 protege dados pessoais no Brasil."}, {"type": "list", "title": "Medidas de Proteção", "content": "Senhas fortes, MFA, limitar compartilhamento, verificar políticas de privacidade."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'seguranca_digital_golpes_virtuais',
    'Golpes Virtuais e Phishing',
    'CRIMES CIBERNÉTICOS E SEGURANÇA DIGITAL',
    'Ameaças Digitais',
    'Identificar e prevenir golpes virtuais, especialmente phishing, que visa obter dados sensíveis através de engenharia social.',
    '{"main_concepts": ["Phishing", "Golpe Virtual", "Engenharia Social", "E-mail Falso", "Site Falso", "Prevenção", "Denúncia"], "key_points": ["Phishing: fraude para obter dados sensíveis", "Engenharia social: manipulação psicológica", "E-mail falso: imitação de instituição legítima", "Site falso: clone de site legítimo", "Prevenção: verificar origem, não clicar em links suspeitos", "Denúncia: reportar golpes às autoridades"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Phishing é golpe virtual que usa engenharia social para obter dados sensíveis (senhas, cartões) através de e-mails, sites ou mensagens falsas. Golpeiros imitam instituições legítimas (bancos, governos) para enganar vítimas.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Phishing: fraude para obter dados sensíveis</li>
        <li>Engenharia social: manipulação psicológica</li>
        <li>E-mail falso: imitação de instituição legítima</li>
        <li>Site falso: clone de site legítimo (phishing site)</li>
        <li>Spear phishing: phishing direcionado a pessoa específica</li>
        <li>Smishing: phishing via SMS</li>
        <li>Vishing: phishing via telefone</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Phishing usa e-mail falso de banco pedindo senha</li>
        <li>Engenharia social: urgência, medo, ganância para manipular</li>
        <li>E-mail falso: imita logotipo, domínio similar</li>
        <li>Site falso: URL similar mas não é o site oficial</li>
        <li>Prevenção: verificar origem, não clicar em links suspeitos</li>
        <li>Verificação: conferir URL, contatar instituição oficialmente</li>
        <li>Denúncia: reportar a banco, polícia, CERT.br</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar e-mails suspeitos</li>
        <li>Verificar URL antes de inserir dados</li>
        <li>Não clicar em links de origem desconhecida</li>
        <li>Usar autenticação em dois fatores</li>
        <li>Denunciar golpes às autoridades</li>
        <li>Educar cidadãos sobre prevenção</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Phishing: e-mail falso de banco pedindo senha</li>
        <li>Spear phishing: e-mail direcionado a CEO pedindo transferência</li>
        <li>Smishing: SMS falso de banco pedindo clique em link</li>
        <li>Vishing: ligação falsa de banco pedindo dados</li>
        <li>Prevenção: usuário verifica URL e percebe que não é site oficial</li>
        <li>Denúncia: usuário reporta phishing ao banco e polícia</li>
    </ul>
</div>',
    'Phishing usa engenharia social para obter dados
E-mails falsos imitam instituições legítimas
Sites falsos têm URLs similares mas não são oficiais
Verificar origem antes de fornecer dados
Não clicar em links suspeitos
Usar MFA para proteger contas
Denunciar golpes às autoridades',
    '[{"type": "concept", "title": "Phishing", "content": "Fraude para obter dados sensíveis através de engenharia social."}, {"type": "list", "title": "Tipos de Phishing", "content": "E-mail, SMS (smishing), telefone (vishing), spear phishing."}, {"type": "tip", "title": "Prevenção", "content": "Verificar URL, não clicar em links suspeitos, usar MFA."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'estatistica_estatistica_descritiva',
    'Estatística Descritiva e Análise Exploratória de Dados',
    'ESTATÍSTICA E ANÁLISE DE DADOS',
    'Estatística Descritiva',
    'Dominar técnicas de estatística descritiva, incluindo gráficos, tabelas e medidas descritivas (posição, dispersão, assimetria e curtose).',
    '{"main_concepts": ["Estatística Descritiva", "Medidas de Posição", "Medidas de Dispersão", "Gráficos", "Tabelas", "Assimetria", "Curtose"], "key_points": ["Medidas de posição: média, mediana, moda", "Medidas de dispersão: variância, desvio padrão, amplitude", "Gráficos: histograma, boxplot, gráfico de dispersão", "Tabelas: frequência absoluta e relativa", "Assimetria: distribuição simétrica ou assimétrica", "Curtose: achatamento da distribuição"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Estatística descritiva resume e descreve dados usando medidas numéricas e gráficos. Medidas de posição (média, mediana, moda) indicam o centro dos dados. Medidas de dispersão (variância, desvio padrão) indicam a variabilidade.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Estatística descritiva: resumo e descrição de dados</li>
        <li>Medidas de posição: média (aritmética), mediana, moda</li>
        <li>Medidas de dispersão: variância, desvio padrão, amplitude, coeficiente de variação</li>
        <li>Gráficos: histograma, boxplot, gráfico de dispersão, gráfico de barras</li>
        <li>Tabelas: frequência absoluta, frequência relativa, tabela de contingência</li>
        <li>Assimetria: distribuição simétrica (assimetria ≈ 0) ou assimétrica</li>
        <li>Curtose: leptocúrtica (pico alto), mesocúrtica (normal), platicúrtica (achatada)</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Média aritmética: soma dos valores dividido pelo número de valores</li>
        <li>Mediana: valor central quando dados ordenados</li>
        <li>Moda: valor mais frequente</li>
        <li>Variância: média dos quadrados dos desvios da média</li>
        <li>Desvio padrão: raiz quadrada da variância</li>
        <li>Amplitude: diferença entre máximo e mínimo</li>
        <li>Coeficiente de variação: desvio padrão dividido pela média</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Calcular medidas de posição para resumir dados</li>
        <li>Calcular medidas de dispersão para entender variabilidade</li>
        <li>Criar gráficos para visualizar distribuição</li>
        <li>Construir tabelas de frequência</li>
        <li>Interpretar assimetria e curtose</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Média: (1+2+3+4+5)/5 = 3</li>
        <li>Mediana de [1,2,3,4,5]: 3</li>
        <li>Moda de [1,2,2,3]: 2</li>
        <li>Variância: média dos quadrados dos desvios</li>
        <li>Desvio padrão: raiz quadrada da variância</li>
        <li>Amplitude: máximo - mínimo</li>
        <li>Coeficiente de variação: (desvio padrão/média) × 100%</li>
    </ul>
</div>',
    'Média: soma dividida pelo número de valores
Mediana: valor central quando ordenado
Moda: valor mais frequente
Variância: média dos quadrados dos desvios
Desvio padrão: raiz quadrada da variância
Coeficiente de variação: desvio padrão/média
Gráficos visualizam distribuição dos dados',
    '[{"type": "formula", "title": "Média Aritmética", "content": "μ = (Σx)/n, onde Σx é soma dos valores e n é número de valores."}, {"type": "formula", "title": "Desvio Padrão", "content": "σ = √(Σ(x-μ)²/n), onde μ é média e n é número de valores."}, {"type": "list", "title": "Gráficos Comuns", "content": "Histograma, boxplot, gráfico de dispersão, gráfico de barras."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'estatistica_probabilidade',
    'Probabilidade',
    'ESTATÍSTICA E ANÁLISE DE DADOS',
    'Probabilidade',
    'Dominar conceitos de probabilidade, incluindo probabilidade condicional, regra de Bayes, distribuições de probabilidade e variáveis aleatórias.',
    '{"main_concepts": ["Probabilidade", "Probabilidade Condicional", "Regra de Bayes", "Variável Aleatória", "Distribuição", "Esperança", "Variância"], "key_points": ["Probabilidade: medida de chance de evento ocorrer", "Probabilidade condicional: P(A|B) = P(A∩B)/P(B)", "Regra de Bayes: P(A|B) = P(B|A)P(A)/P(B)", "Variável aleatória: função que atribui valor a resultado", "Distribuição: conjunto de valores e probabilidades", "Esperança: valor esperado da variável", "Variância: medida de dispersão da variável"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Probabilidade é medida de chance de evento ocorrer, variando de 0 (impossível) a 1 (certo). Probabilidade condicional é probabilidade de A dado que B ocorreu. Regra de Bayes atualiza probabilidades com novas informações.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Probabilidade: P(A) = número de casos favoráveis / número de casos possíveis</li>
        <li>Probabilidade condicional: P(A|B) = P(A∩B)/P(B)</li>
        <li>Independência: P(A|B) = P(A) se A e B independentes</li>
        <li>Regra de Bayes: P(A|B) = P(B|A)P(A)/P(B)</li>
        <li>Variável aleatória discreta: valores enumeráveis</li>
        <li>Variável aleatória contínua: valores em intervalo</li>
        <li>Distribuição binomial: n tentativas, probabilidade p de sucesso</li>
        <li>Distribuição normal: curva em sino, média μ, desvio padrão σ</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Esperança (média): E[X] = Σx·P(x) (discreta) ou ∫x·f(x)dx (contínua)</li>
        <li>Variância: Var(X) = E[X²] - (E[X])²</li>
        <li>Distribuição binomial: P(X=k) = C(n,k)·p^k·(1-p)^(n-k)</li>
        <li>Distribuição normal: P(X<x) = Φ((x-μ)/σ), onde Φ é função de distribuição normal padrão</li>
        <li>Teorema central do limite: soma de variáveis independentes tende a distribuição normal</li>
        <li>Regra de Bayes: P(A|B) = P(B|A)P(A)/P(B)</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Calcular probabilidade de eventos</li>
        <li>Aplicar probabilidade condicional</li>
        <li>Usar regra de Bayes para atualizar probabilidades</li>
        <li>Identificar distribuição de probabilidade</li>
        <li>Calcular esperança e variância</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Probabilidade: P(lançar cara) = 0.5</li>
        <li>Probabilidade condicional: P(acusado culpado|DNA presente) = ?</li>
        <li>Regra de Bayes: P(culpado|DNA) = P(DNA|culpado)P(culpado)/P(DNA)</li>
        <li>Distribuição binomial: P(3 caras em 5 lançamentos) = C(5,3)·0.5³·0.5²</li>
        <li>Distribuição normal: P(X<μ) = 0.5 (50% abaixo da média)</li>
    </ul>
</div>',
    'Probabilidade: 0 (impossível) a 1 (certo)
Probabilidade condicional: P(A|B) = P(A∩B)/P(B)
Regra de Bayes: P(A|B) = P(B|A)P(A)/P(B)
Esperança: valor esperado da variável
Variância: E[X²] - (E[X])²
Distribuição binomial: n tentativas, probabilidade p
Distribuição normal: curva em sino',
    '[{"type": "formula", "title": "Probabilidade Condicional", "content": "P(A|B) = P(A∩B)/P(B)"}, {"type": "formula", "title": "Regra de Bayes", "content": "P(A|B) = P(B|A)P(A)/P(B)"}, {"type": "formula", "title": "Esperança", "content": "E[X] = Σx·P(x) (discreta) ou ∫x·f(x)dx (contínua)"}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'analise_dados_etl_processamento',
    'Processos de ETL e Tratamento de Dados',
    'ESTATÍSTICA E ANÁLISE DE DADOS',
    'Engenharia de Dados',
    'Compreender processos de ETL (Extract, Transform, Load), formatos de dados (XML, JSON, CSV) e técnicas de tratamento de dados.',
    '{"main_concepts": ["ETL", "Extract", "Transform", "Load", "XML", "JSON", "CSV", "Limpeza de Dados", "Integração"], "key_points": ["ETL: Extract, Transform, Load", "Extract: extração de dados de fontes diversas", "Transform: limpeza, validação, transformação", "Load: carregamento em data warehouse", "Formatos: XML (estruturado), JSON (flexível), CSV (simples)", "Limpeza: remover duplicatas, tratar valores nulos"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>ETL (Extract, Transform, Load) é processo de integrar dados de múltiplas fontes. Extract extrai dados de bancos, APIs, arquivos. Transform limpa, valida e transforma dados. Load carrega dados em data warehouse para análise.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>ETL: Extract, Transform, Load</li>
        <li>Extract: extração de dados de bancos, APIs, arquivos</li>
        <li>Transform: limpeza, validação, normalização, agregação</li>
        <li>Load: carregamento em data warehouse ou data lake</li>
        <li>XML: formato estruturado com tags</li>
        <li>JSON: formato flexível com pares chave-valor</li>
        <li>CSV: formato simples com valores separados por vírgula</li>
        <li>Limpeza: remover duplicatas, tratar valores nulos, corrigir erros</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Extract: conectar a fonte (banco, API, arquivo), extrair dados</li>
        <li>Transform: limpar dados (remover duplicatas), validar (verificar tipos), normalizar (padronizar formatos), agregar (resumir dados)</li>
        <li>Load: carregar dados em data warehouse (SQL) ou data lake (NoSQL)</li>
        <li>XML: <nome>João</nome> - estruturado com tags</li>
        <li>JSON: {"nome": "João"} - flexível com pares chave-valor</li>
        <li>CSV: nome,idade,cidade - simples com valores separados por vírgula</li>
        <li>Limpeza: remover duplicatas, imputar valores nulos, corrigir erros de digitação</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Projetar pipeline ETL para integrar dados</li>
        <li>Escolher formato de dados adequado (XML, JSON, CSV)</li>
        <li>Implementar transformações para limpar dados</li>
        <li>Carregar dados em data warehouse para análise</li>
        <li>Monitorar pipeline ETL para erros</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Extract: extrair dados de banco MySQL e API REST</li>
        <li>Transform: limpar dados (remover duplicatas), validar (verificar tipos), normalizar (padronizar datas)</li>
        <li>Load: carregar dados em PostgreSQL</li>
        <li>XML: <pessoa><nome>João</nome></pessoa></li>
        <li>JSON: {"pessoa": {"nome": "João"}}</li>
        <li>CSV: nome,idade,cidade
João,30,Maceió</li>
    </ul>
</div>',
    'ETL: Extract, Transform, Load
Extract: extração de dados de fontes diversas
Transform: limpeza, validação, normalização
Load: carregamento em data warehouse
XML: estruturado com tags
JSON: flexível com pares chave-valor
CSV: simples com valores separados por vírgula',
    '[{"type": "concept", "title": "ETL", "content": "Extract (extração), Transform (transformação), Load (carregamento)."}, {"type": "list", "title": "Formatos de Dados", "content": "XML (estruturado), JSON (flexível), CSV (simples)."}, {"type": "list", "title": "Transformações", "content": "Limpeza, validação, normalização, agregação."}]'::jsonb,
    NOW(),
    NOW()
);

INSERT INTO shared_study_subjects (
    canonical_key,
    title,
    discipline,
    study_group,
    study_objective,
    review_summary,
    base_content,
    key_takeaways,
    content_blocks,
    created_at,
    updated_at
) VALUES (
    'analise_dados_machine_learning',
    'Conceitos de Machine Learning',
    'ESTATÍSTICA E ANÁLISE DE DADOS',
    'Aprendizado de Máquina',
    'Compreender fundamentos de machine learning, incluindo tipos de aprendizado, modelos (árvores de decisão, redes neurais), overfitting, underfitting e validação.',
    '{"main_concepts": ["Machine Learning", "Aprendizado Supervisionado", "Aprendizado Não Supervisionado", "Overfitting", "Underfitting", "Validação", "Modelos"], "key_points": ["Aprendizado supervisionado: dados rotulados", "Aprendizado não supervisionado: dados não rotulados", "Overfitting: modelo aprende ruído, não generaliza", "Underfitting: modelo não aprende padrões", "Validação: testar modelo em dados não vistos", "Modelos: árvores de decisão, redes neurais, Naive Bayes"]}'::jsonb,
    '
<div class="study-content">
    <h3>Conceito</h3>
    <p>Machine Learning é subcampo de IA que ensina computadores a aprender com dados. Aprendizado supervisionado usa dados rotulados (classificação, regressão). Aprendizado não supervisionado agrupa dados sem rótulos (clusterização). Overfitting e underfitting são problemas comuns.</p>
    
    <h3>Definições</h3>
    <ul>
        <li>Machine Learning: computadores aprendem com dados</li>
        <li>Aprendizado supervisionado: dados rotulados (ex: classificar e-mails como spam/não spam)</li>
        <li>Aprendizado não supervisionado: dados não rotulados (ex: clusterizar clientes)</li>
        <li>Overfitting: modelo aprende ruído, não generaliza (bem em treino, mal em teste)</li>
        <li>Underfitting: modelo não aprende padrões (mal em treino e teste)</li>
        <li>Validação: testar modelo em dados não vistos (cross-validation)</li>
        <li>Modelos: árvores de decisão, redes neurais, Naive Bayes, regressão linear</li>
    </ul>
    
    <h3>Elementos Essenciais</h3>
    <ul>
        <li>Aprendizado supervisionado: classificação (prever categoria), regressão (prever valor)</li>
        <li>Aprendizado não supervisionado: clusterização (agrupar dados semelhantes), redução de dimensionalidade</li>
        <li>Overfitting: modelo complexo demais, aprende ruído</li>
        <li>Underfitting: modelo simples demais, não aprende padrões</li>
        <li>Validação: separar dados em treino (70%) e teste (30%)</li>
        <li>Cross-validation: dividir dados em k folds, treinar em k-1, testar em 1</li>
        <li>Regularização: penalizar modelo complexo para evitar overfitting</li>
    </ul>
    
    <h3>Aplicações Práticas</h3>
    <ul>
        <li>Identificar tipo de aprendizado (supervisionado/não supervisionado)</li>
        <li>Escolher modelo adequado para problema</li>
        <li>Detectar overfitting e underfitting</li>
        <li>Aplicar validação e cross-validation</li>
        <li>Usar regularização para evitar overfitting</li>
    </ul>
    
    <h3>Exemplos e Casos</h3>
    <ul>
        <li>Supervisionado: classificar e-mails como spam/não spam</li>
        <li>Não supervisionado: clusterizar clientes em grupos</li>
        <li>Overfitting: modelo 100% acerto em treino, 50% em teste</li>
        <li>Underfitting: modelo 60% acerto em treino, 55% em teste</li>
        <li>Validação: treinar em 70% dos dados, testar em 30%</li>
        <li>Cross-validation: 5-fold cross-validation</li>
    </ul>
</div>',
    'Supervisionado: dados rotulados (classificação, regressão)
Não supervisionado: dados não rotulados (clusterização)
Overfitting: modelo aprende ruído, não generaliza
Underfitting: modelo não aprende padrões
Validação: testar em dados não vistos
Cross-validation: k-fold para avaliar modelo
Regularização: penalizar modelo complexo',
    '[{"type": "concept", "title": "Aprendizado Supervisionado", "content": "Dados rotulados: classificação (prever categoria), regressão (prever valor)."}, {"type": "concept", "title": "Aprendizado Não Supervisionado", "content": "Dados não rotulados: clusterização (agrupar), redução de dimensionalidade."}, {"type": "list", "title": "Modelos Comuns", "content": "Árvores de decisão, redes neurais, Naive Bayes, regressão linear."}]'::jsonb,
    NOW(),
    NOW()
);

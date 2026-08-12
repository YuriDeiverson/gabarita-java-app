-- Auditoria estrutural do banco de questões.
--
-- A taxonomia relacional foi criada depois dos guias automáticos. Alguns
-- rótulos antigos passaram a prevalecer sobre o conteúdo real e deixaram
-- guias de Jornalismo, TI etc. associados a disciplinas diferentes.
-- Esta migração:
--   1. reclassifica somente sinais de alta confiança;
--   2. corrige gabaritos binários que contradizem explicitamente a explicação;
--   3. regenera todos os guias automáticos a partir da taxonomia final;
--   4. preserva integralmente os quatro guias editoriais.

CREATE FUNCTION gabarita_audited_taxonomy(
  current_subject TEXT,current_topic TEXT,reference_value TEXT,statement_value TEXT
) RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  reference_text TEXT:=lower(COALESCE(reference_value,''));
  statement_text TEXT:=lower(COALESCE(statement_value,''));
  content_text TEXT:=lower(concat_ws(' ',reference_value,statement_value));
  subject_slug TEXT:=current_subject;
  topic_slug TEXT:=current_topic;
BEGIN
  -- Referências editoriais e cabeçalhos explícitos têm precedência máxima.
  IF reference_text ~ 'história de alagoas|conhecimentos de alagoas|cultura e história de alagoas|história e turismo alagoano'
    OR statement_text ~ '^\s*\[cebraspe\s*-\s*conhecimentos de alagoas\]' THEN
    subject_slug:='conhecimentos-alagoas';
  ELSIF reference_text ~ 'língua inglesa|\menglish\M' OR statement_text ~ '^\s*\[(cebraspe\s*-\s*)?(língua inglesa|english)\]' THEN
    subject_slug:='lingua-inglesa';
  ELSIF reference_text ~ 'língua portuguesa|interpretação de texto|pontuação|crase|concordância|coesão|classes de palavras|ortografia|tipologia textual|significação das palavras|colocação pronominal'
    OR statement_text ~ '^\s*\[(cebraspe\s*-\s*)?(língua portuguesa|interpretação de texto|pontuação|crase|concordância|ortografia)\]' THEN
    subject_slug:='lingua-portuguesa';

  -- Em provas de linguagem, o assunto da frase é apenas o suporte usado para
  -- cobrar gramática ou interpretação. Ele não muda a disciplina examinada.
  ELSIF current_subject IN ('lingua-portuguesa','lingua-inglesa') THEN
    subject_slug:=current_subject;

  -- Legislação institucional e saúde também exigem contexto. O nome do cargo
  -- "Técnico em Enfermagem" na referência não transforma itens do Estatuto da
  -- EBSERH em procedimentos de enfermagem.
  ELSIF content_text ~ 'estatuto.*ebserh|lei (federal )?nº 12\.550|decreto nº 7\.661|regulamento de pessoal.*ebserh|código de ética e conduta.*ebserh' THEN
    subject_slug:='legislacao-institucional';
  ELSIF current_subject IN ('direito-administrativo','etica-compliance','protecao-dados-lgpd','regulacao-agencias','legislacao-institucional') THEN
    subject_slug:=current_subject;
  ELSIF statement_text ~ '\msus\M|sistema único de saúde|atenção básica|rede de atenção à saúde|vigilância (em|sanitária)|saúde pública|conselho de saúde|política nacional de saúde|dengue|arbovirose|notificação compulsória' THEN
    subject_slug:='saude-publica-sus';
  ELSIF statement_text ~ 'técnico de enfermagem|equipe de enfermagem|cuidados? de enfermagem|medicação|medicamento|paciente|lesão por pressão|escala de braden|suporte básico de vida|compressões torácicas|procedimento de enfermagem' THEN
    subject_slug:='enfermagem';

  -- O núcleo técnico da afirmação prevalece sobre introduções genéricas.
  ELSIF content_text ~ 'sql injection|\msqli\M|owasp|xss|cross.site scripting|malware|ransomware|\mvírus\M|\mvirus\M|\mworm\M|phishing|firewall|\mids\M|\mips\M|oauth|openid|biometria|certifica(do|ção) digital|criptograf|\mtls\M|\mssl\M|assinatura digital|zero trust|gestão de riscos.*segurança' THEN
    subject_slug:='seguranca-informacao';
  ELSIF content_text ~ 'terceira forma normal|forma normal|dependência funcional|índice.*b.tree|b.tree.*índice|transaç(ão|ões).*acid|propriedade acid|modelo relacional|modelagem de dados|oracle database|\mpostgresql\M|\mmysql\M|\mnosql\M|data warehouse|business intelligence' THEN
    subject_slug:='banco-dados';
  ELSIF content_text ~ 'microserviço|microfrontend|api gateway|clean architecture|arquitetura em camadas|arquitetura orientada a eventos|\mkafka\M|rabbitmq|mensageria|\mkubernetes\M|\mdocker\M|containerização|\mdevops\M|integração contínua|entrega contínua|\mci/cd\M|\mrestful\M|método http|métodos http|código http|códigos http|\mjson\M|\mxml\M' THEN
    subject_slug:='arquitetura-software';
  ELSIF (current_subject IN ('informatica','seguranca-informacao','banco-dados','programacao','engenharia-software','arquitetura-software','redes-computadores','computacao-nuvem','sistemas-operacionais','governanca-ti')
    OR reference_text ~ 'redes de computadores|modelo osi|camada de transporte|endereçamento ip|protocolos')
    AND content_text ~ 'modelo osi|tcp/ip|camada física|camada de rede|camada de transporte|\mdns\M|roteamento|endereço ip|endereçamento ip|\mtcp\M|\mudp\M|intranet|extranet|rede privada virtual|\mvpn\M' THEN
    subject_slug:='redes-computadores';
  ELSIF content_text ~ 'computação (na|em) nuvem|cloud computing|\miaas\M|\mpaas\M|\msaas\M|nuvem pública|nuvem privada|nuvem comunitária|nuvem híbrida|cloud storage|block storage|\monedrive\M' THEN
    subject_slug:='computacao-nuvem';
  ELSIF content_text ~ '\mscrum\M|\mkanban\M|extreme programming|\mcmmi\M|engenharia de requisitos|obtenção de requisitos|requisito funcional|controle de vers(ão|ões)|\mgit\M|pull request|merge request|\msolid\M|clean code|teste de software|teste unitário|sonarqube|modelo cascata|processo de software|ciclo de vida.*software' THEN
    subject_slug:='engenharia-software';
  ELSIF content_text ~ '\mpython\M|\mjava\M|javascript|typescript|\mc#\M|\.net|orientação a objetos|herança.*polimorfismo|algoritmo|estrutura de dados|progressive web app' THEN
    subject_slug:='programacao';
  ELSIF content_text ~ 'microsoft excel|\mexcel\M|microsoft word|\mword\M|powerpoint|power automate|power platform' THEN
    subject_slug:='ferramentas-escritorio';
  ELSIF reference_text ~ 'marco legal de ct&i|inovação|transferência de tecnologia|prospecção tecnológica|manual de oslo|bibliometria|living labs|aceleradoras|encomenda tecnológica' THEN
    subject_slug:='inovacao-tecnologia';

  -- Comunicação: usa termos profissionais específicos, não a palavra
  -- genérica "comunicação" encontrada em outros conteúdos.
  ELSIF reference_text ~ 'assessoria de imprensa|produtos de assessoria|media training|clipping|clipagem|mailing|press kit|\mrelease\M|gestão de crise'
    OR statement_text ~ '^\s*\[(produtos de assessoria|assessoria de imprensa)\]' THEN
    subject_slug:='assessoria-imprensa';
  ELSIF reference_text ~ 'comunicação pública|comunicação institucional|jornalismo institucional|comunicação organizacional|comunicação interna|métricas digitais|comunicação digital|linguagem cidadã|accountability|lei de acesso|\mlai\M'
    OR statement_text ~ '^\s*\[(comunicação pública|comunicação digital|jornalismo institucional)\]' THEN
    subject_slug:='comunicacao-organizacional';
  ELSIF reference_text ~ 'editoração|projeto gráfico|diagramação|mancha gráfica|tipografia|preparação de originais' THEN
    subject_slug:='editoracao-design';
  ELSIF reference_text ~ 'telejornalismo|radiojornalismo|produção audiovisual|rádio e televisão' THEN
    subject_slug:='producao-audiovisual';
  ELSIF current_subject IN ('jornalismo','assessoria-imprensa','comunicacao-organizacional','editoracao-design','producao-audiovisual','marketing') THEN
    subject_slug:=current_subject;
  ELSIF reference_text ~ 'jornalismo|notícia|reportagem|agenda.setting|gatekeeping|noticiabilidade|pirâmide invertida|lead jornalístico|lide jornalístico' THEN
    subject_slug:='jornalismo';

  -- Direito, saúde, inovação e áreas correlatas com referência inequívoca.
  ELSIF content_text ~ 'lei geral de proteção de dados|\mlgpd\M|lei nº 13\.709|lei 13\.709' THEN
    subject_slug:='protecao-dados-lgpd';
  ELSIF reference_text ~ 'direito administrativo|licitaç|contrato administrativo|processo administrativo disciplinar' THEN
    subject_slug:='direito-administrativo';
  ELSIF reference_text ~ 'ética|compliance|conflito de interesses|integridade pública' THEN
    subject_slug:='etica-compliance';
  ELSIF reference_text ~ 'saúde pública|\msus\M|epidemiologia' THEN
    subject_slug:='saude-publica-sus';
  END IF;

  -- O assunto é inferido dentro da disciplina já resolvida. Quando não há
  -- sinal suficiente, conserva-se o assunto atual da mesma disciplina ou usa
  -- o assunto de fundamentos da nova disciplina.
  topic_slug:=CASE subject_slug
    WHEN 'conhecimentos-alagoas' THEN CASE
      WHEN content_text ~ 'quilombo|palmares|zumbi|ganga zumba|ganga.zumba|emancipação|graciliano ramos|história de alagoas' THEN 'historia'
      WHEN content_text ~ 'patrimônio|cultura|folclore' THEN 'patrimonio-cultura'
      WHEN content_text ~ 'geografia|economia|rio são francisco|hidrografia|zona da mata|agricultura|turismo|transporte' THEN 'geografia-economia'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'lingua-portuguesa' THEN CASE
      WHEN content_text ~ 'pontuação|vírgula|travessão|dois-pontos' THEN 'pontuacao'
      WHEN content_text ~ 'regência|transitividade' THEN 'regencia'
      WHEN content_text ~ 'concordância' THEN 'concordancia'
      WHEN content_text ~ '\mcrase\M|acento grave' THEN 'crase'
      WHEN content_text ~ 'reescrita|substitui|supressão|inserção' THEN 'reescrita'
      WHEN content_text ~ 'coesão|coerência|conector|conjunção|relação de sentido' THEN 'coesao-coerencia'
      WHEN content_text ~ 'classe de palavra|substantivo|adjetivo|advérbio|pronome' THEN 'classes-palavras'
      WHEN content_text ~ 'sintaxe|sujeito|predicado|oração' THEN 'sintaxe'
      WHEN content_text ~ 'ortografia|acentuação|hífen|grafia' THEN 'ortografia-acentuacao'
      WHEN content_text ~ 'tipologia|gênero textual' THEN 'tipologia-generos'
      WHEN content_text ~ 'semântica|significação|sentido vocabular' THEN 'semantica'
      WHEN content_text ~ 'interpretação|compreensão|infer|conclui-se|depreende-se|texto' THEN 'interpretacao-texto'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'lingua-inglesa' THEN CASE WHEN content_text ~ 'vocabulary|vocabulário|translation|tradução|means|translated' THEN 'traducao-vocabulario'
      WHEN content_text ~ 'verb tense|modal verb|passive voice|pronoun|connector|grammatical' THEN 'gramatica' ELSE 'interpretacao' END
    WHEN 'seguranca-informacao' THEN CASE
      WHEN content_text ~ 'sql injection|\msqli\M|owasp|xss|cross.site|sast|dast' THEN 'seguranca-aplicacoes-owasp'
      WHEN content_text ~ 'malware|ransomware|\mvírus\M|\mvirus\M|\mworm\M|phishing' THEN 'malwares'
      WHEN content_text ~ 'criptograf|certifica(do|ção) digital|\mtls\M|\mssl\M|assinatura digital|blockchain' THEN 'criptografia-tls'
      WHEN content_text ~ 'firewall|\mids\M|\mips\M|ddos|zero trust|segurança de redes' THEN 'seguranca-redes'
      WHEN content_text ~ 'oauth|openid|biometria|autentica|identidade|controle de acesso' THEN 'identidade-acesso'
      WHEN content_text ~ 'gestão de riscos|risco.*segurança' THEN 'gestao-riscos'
      WHEN content_text ~ '\mbackup\M|recuperação de desastre|\mrestore\M' THEN 'backup-recuperacao'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'banco-dados' THEN CASE
      WHEN content_text ~ '\mmysql\M' THEN 'mysql' WHEN content_text ~ '\mpostgresql\M' THEN 'postgresql'
      WHEN content_text ~ 'oracle database' THEN 'oracle'
      WHEN content_text ~ 'normalização|forma normal|dependência funcional' THEN 'normalizacao'
      WHEN content_text ~ 'modelo relacional|modelagem de dados|entidade.relacionamento' THEN 'modelagem-relacional'
      WHEN content_text ~ 'índice|b.tree|transação|\macid\M' THEN 'indices-transacoes'
      WHEN content_text ~ '\mnosql\M|mongodb|cassandra' THEN 'nosql'
      WHEN content_text ~ '\msql\M|select |insert |update |delete |banco de dados|database' THEN 'sql'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'engenharia-software' THEN CASE
      WHEN content_text ~ '\mscrum\M' THEN 'scrum' WHEN content_text ~ '\mkanban\M|extreme programming|\mxp\M' THEN 'kanban-xp'
      WHEN content_text ~ 'desenvolvimento ágil|método ágil|metodologia ágil' THEN 'desenvolvimento-agil'
      WHEN content_text ~ 'cascata|waterfall' THEN 'modelo-cascata'
      WHEN content_text ~ 'processo de software|ciclo de vida|\mrup\M|espiral' THEN 'processos-software'
      WHEN content_text ~ 'requisito|caso de uso|\muml\M' THEN 'requisitos'
      WHEN content_text ~ 'teste de software|teste unitário|caixa preta|caixa branca|\mtdd\M|sonarqube|qualidade de software' THEN 'testes-qualidade'
      WHEN content_text ~ '\mgit\M|pull request|merge request|controle de vers' THEN 'configuracao-git'
      WHEN content_text ~ '\mcmmi\M|ponto de função|métrica de software' THEN 'metricas-cmmi'
      WHEN content_text ~ '\msolid\M|clean code|padrão de projeto|singleton|\mgof\M' THEN 'principios-padroes'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'arquitetura-software' THEN CASE
      WHEN content_text ~ 'microserviço|microfrontend|api gateway' THEN 'microsservicos'
      WHEN content_text ~ '\mrest\M|restful|método http|código http|stateless' THEN 'apis-rest'
      WHEN content_text ~ 'arquitetura orientada a serviços|\msoa\M' THEN 'soa-integracao'
      WHEN content_text ~ 'orientada a eventos|kafka|rabbitmq|mensageria' THEN 'eventos-mensageria'
      WHEN content_text ~ 'clean architecture|arquitetura em camadas' THEN 'arquitetura-camadas-clean'
      WHEN content_text ~ 'docker|kubernetes|container|devops|integração contínua|entrega contínua|ci/cd|jenkins|telemetria|monitoramento|traces' THEN 'devops-containers'
      WHEN content_text ~ '\mxml\M|\mjson\M' THEN 'formatos-integracao'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'redes-computadores' THEN CASE
      WHEN content_text ~ 'modelo osi|tcp/ip|camada física|camada de rede|camada de transporte' THEN 'modelos-osi-tcpip'
      WHEN content_text ~ '\mdns\M|\mtcp\M|\mudp\M|protocolo' THEN 'protocolos-servicos'
      WHEN content_text ~ 'roteamento|endereço ip|endereçamento' THEN 'enderecamento-roteamento'
      WHEN content_text ~ 'intranet|extranet|internet' THEN 'internet-intranet-extranet'
      WHEN content_text ~ '\mvpn\M|rede privada virtual' THEN 'vpn'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'computacao-nuvem' THEN CASE
      WHEN content_text ~ '\miaas\M|\mpaas\M|\msaas\M' THEN 'modelos-servico'
      WHEN content_text ~ 'nuvem pública|nuvem privada|nuvem comunitária|nuvem híbrida|implantação' THEN 'modelos-implantacao'
      WHEN content_text ~ 'cloud storage|armazenamento em nuvem|block storage|onedrive' THEN 'armazenamento-nuvem'
      ELSE 'fundamentos' END
    WHEN 'programacao' THEN CASE
      WHEN content_text ~ '\mpython\M' THEN 'python' WHEN content_text ~ '\mjava\M' AND content_text !~ 'javascript' THEN 'java'
      WHEN content_text ~ 'javascript|typescript|react|vue\.js|progressive web' THEN 'javascript-typescript'
      WHEN content_text ~ '\mc#\M|\.net' THEN 'csharp-dotnet'
      WHEN content_text ~ 'orientação a objetos|herança|polimorfismo' THEN 'orientacao-objetos'
      WHEN content_text ~ 'algoritmo|estrutura de dados' THEN 'algoritmos-estruturas'
      WHEN content_text ~ 'frontend|backend|desenvolvimento web' THEN 'desenvolvimento-web'
      WHEN content_text ~ 'android|mobile' THEN 'mobile'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'assessoria-imprensa' THEN CASE
      WHEN content_text ~ 'media training|porta.voz' THEN 'media-training'
      WHEN content_text ~ 'clipping|clipagem|mailing' THEN 'clipping-mailing'
      WHEN content_text ~ 'release|press kit|newsletter|boletim|house organ|produtos de assessoria' THEN 'releases-produtos'
      WHEN content_text ~ 'crise' THEN 'gestao-crise' ELSE 'relacionamento-imprensa' END
    WHEN 'comunicacao-organizacional' THEN CASE
      WHEN content_text ~ 'métrica|\mkpi\M|\mctr\M|analytics|engajamento|alcance|impressões|conversão|\mseo\M' THEN 'comunicacao-digital-metricas'
      WHEN content_text ~ 'institucional|identidade|imagem|reputação' THEN 'comunicacao-institucional'
      WHEN content_text ~ 'transparência|comunicação pública|lei de acesso|\mlai\M|accountability|linguagem cidadã' THEN 'comunicacao-publica'
      WHEN content_text ~ 'stakeholder|planejamento' THEN 'planejamento-stakeholders'
      ELSE 'comunicacao-interna' END
    WHEN 'jornalismo' THEN CASE
      WHEN content_text ~ 'webjornal|jornalismo digital|hipertext|convergência|\mseo\M' THEN 'webjornalismo'
      WHEN content_text ~ 'científico|divulgação científica|especializado' THEN 'jornalismo-cientifico'
      WHEN content_text ~ 'direito autoral|sigilo da fonte|ética.*jornal|legislação.*comunicação' THEN 'etica-legislacao'
      WHEN content_text ~ 'lide|lead jornalístico|pirâmide invertida|redação jornalística' THEN 'redacao-jornalistica'
      WHEN content_text ~ 'agenda.setting|gatekeeping|noticiabilidade|teoria da notícia|produção da notícia' THEN 'teoria-noticia'
      WHEN content_text ~ 'notícia|reportagem|entrevista' THEN 'noticia-reportagem'
      WHEN content_text ~ 'gênero|formato|artigo|resenha' THEN 'generos-formatos'
      ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'enfermagem' THEN CASE
      WHEN content_text ~ 'urgência|emergência|suporte básico|compressões torácicas' THEN 'urgencia-emergencia'
      WHEN content_text ~ 'medicação|medicamento|farmacologia|dose|via de administração' THEN 'farmacologia-medicamentos'
      WHEN content_text ~ 'segurança do paciente|lesão por pressão|escala de braden|cuidado.*paciente' THEN 'seguranca-paciente'
      ELSE 'fundamentos' END
    WHEN 'saude-publica-sus' THEN CASE
      WHEN content_text ~ 'epidemiolog|vigilância|dengue|arbovirose|atenção básica|rede de atenção|notificação compulsória' THEN 'epidemiologia'
      WHEN content_text ~ 'política pública|política nacional|financiamento|recursos mínimos' THEN 'politicas-publicas'
      ELSE 'principios-organizacao' END
    WHEN 'legislacao-institucional' THEN CASE WHEN content_text ~ 'ebserh|lei (federal )?nº 12\.550|decreto nº 7\.661' THEN 'ebserh' ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END END
    WHEN 'protecao-dados-lgpd' THEN CASE WHEN content_text ~ 'dado pessoal|tratamento de dados' THEN 'dados-pessoais' ELSE 'lgpd' END
    WHEN 'etica-compliance' THEN CASE WHEN content_text ~ 'conflito de interesses' THEN 'conflito-interesses' WHEN content_text ~ 'compliance|integridade' THEN 'compliance-integridade' ELSE 'etica-servico-publico' END
    WHEN 'direito-administrativo' THEN CASE WHEN content_text ~ 'licitaç|contrato administrativo' THEN 'licitacoes-contratos' WHEN content_text ~ 'processo disciplinar' THEN 'processo-disciplinar' WHEN content_text ~ 'ato administrativo|poder administrativo' THEN 'atos-poderes' ELSE 'administracao-publica' END
    WHEN 'inovacao-tecnologia' THEN CASE WHEN content_text ~ 'design thinking' THEN 'design-thinking' WHEN content_text ~ 'marco legal|lei nº 13\.243|encomenda tecnológica' THEN 'marco-legal-cti' WHEN content_text ~ 'transferência de tecnologia|propriedade intelectual|royalt' THEN 'transferencia-tecnologia' ELSE 'fundamentos' END
    ELSE CASE WHEN current_subject=subject_slug THEN current_topic ELSE 'fundamentos' END
  END;
  RETURN ARRAY[subject_slug,topic_slug];
END $$;

WITH classified AS (
  SELECT q.id,gabarita_audited_taxonomy(s.slug,t.slug,q.metadata->>'reference',q.statement) path
  FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN topics t ON t.id=q.topic_id
), resolved AS (
  SELECT c.id,s.id subject_id,s.name subject_name,t.id topic_id,t.name topic_name
  FROM classified c JOIN subjects s ON s.slug=c.path[1] AND s.exam_id IS NULL
  JOIN topics t ON t.subject_id=s.id AND t.slug=c.path[2]
)
UPDATE questions q SET subject_id=r.subject_id,topic_id=r.topic_id,
  metadata=jsonb_set(jsonb_set(q.metadata,'{category}',to_jsonb(r.subject_name),true),'{topic}',to_jsonb(r.topic_name),true),
  updated_at=now()
FROM resolved r WHERE q.id=r.id AND (q.subject_id,q.topic_id) IS DISTINCT FROM (r.subject_id,r.topic_id);

DROP FUNCTION gabarita_audited_taxonomy(TEXT,TEXT,TEXT,TEXT);

-- Se a explicação declara inequivocamente o veredito oposto, ela é a fonte
-- editorial mais específica que o valor binário importado.
UPDATE questions SET correct_answer=to_jsonb(
  CASE WHEN lower(correct_answer #>> '{}') IN ('certo','correto') THEN 'Errado' ELSE 'Certo' END
),updated_at=now()
WHERE status IN('ACTIVE','ANNULLED') AND comparison_headers->>'criterion'='Etapa da análise'
  AND ((lower(correct_answer #>> '{}') IN ('certo','correto') AND explanation ~* '^\s*(item\s+)?(errado|incorreto)[.:]')
    OR (lower(correct_answer #>> '{}') IN ('errado','incorreto') AND explanation ~* '^\s*(item\s+)?(certo|correto)[.:]'));

-- Correções factuais encontradas na revisão do conjunto de Palmares.
UPDATE questions SET correct_answer=to_jsonb('Errado'::text),
  explanation='Errado. O acordo de paz de Ganga Zumba com o governo de Pernambuco ocorreu em 1678, antes da ofensiva final contra Palmares. Zumbi rejeitou os termos e manteve a resistência. A destruição do mocambo do Macaco ocorreu em 1694; portanto, é anacrônico afirmar que Ganga Zumba capitulou depois dessa queda.',
  updated_at=now()
WHERE id='65f83bbd-6fd5-4bf4-9e2c-db785aad5b37';

UPDATE questions SET
  explanation='Errado. A Serra da Barriga e o Parque Memorial Quilombo dos Palmares ficam no município de União dos Palmares, na Zona da Mata alagoana, e não em Delmiro Gouveia, no Sertão. O item troca o município e a região do marco histórico.',
  updated_at=now()
WHERE id='9d64b6a6-b763-4bb3-ada2-22205a6a4866';

CREATE FUNCTION gabarita_taxonomy_concept(subject_slug TEXT,topic_slug TEXT,topic_name TEXT,statement_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE statement_text TEXT:=lower(COALESCE(statement_value,''));
BEGIN
  IF subject_slug='conhecimentos-alagoas' AND topic_slug='historia' AND statement_text ~ 'palmares|zumbi|ganga' THEN
    RETURN topic_name || ' abrange a formação histórica do território alagoano e seus processos de resistência. O Quilombo dos Palmares foi uma confederação de mocambos instalada na Serra da Barriga, no atual município de União dos Palmares. A mata e o relevo de difícil acesso contribuíam para sua defesa.' || E'\n\n' ||
      'Ganga Zumba negociou um acordo com o governo de Pernambuco em 1678. Zumbi recusou as condições e continuou a resistência. O mocambo do Macaco foi destruído na ofensiva de 1694; por isso, a ordem cronológica desses fatos é decisiva em provas.';
  END IF;
  RETURN CASE subject_slug
    WHEN 'conhecimentos-alagoas' THEN topic_name || ' exige relacionar o fato ao período, ao município, à região geográfica e aos agentes históricos envolvidos. História, geografia, economia e patrimônio podem aparecer juntos, mas cada afirmação precisa respeitar localização e cronologia.' || E'\n\n' || 'Em concursos, compare datas, lugares e relações de causa e consequência. Um acontecimento verdadeiro torna-se errado quando é deslocado para outro município, período ou personagem.'
    WHEN 'lingua-portuguesa' THEN topic_name || ' deve ser resolvido pela função dos termos na oração e pelo sentido construído no contexto. Não basta a frase parecer natural: a alteração precisa preservar simultaneamente a norma gramatical, o referente e a relação lógica do texto.' || E'\n\n' || 'Em itens de reescrita e interpretação, verifique sujeito, alcance, conectores, pontuação e informação efetivamente autorizada pelo texto.'
    WHEN 'lingua-inglesa' THEN topic_name || ' cobra compreensão global e localizada, referência de pronomes, conectores, tempos verbais e vocabulário em contexto. A tradução palavra por palavra pode distorcer a função que a expressão exerce no período.' || E'\n\n' || 'Compare sujeito, tempo, intensidade e relação lógica antes de aceitar uma paráfrase ou tradução.'
    WHEN 'seguranca-informacao' THEN topic_name || ' deve ser analisado identificando ativo, ameaça, vulnerabilidade, mecanismo de ataque e controle de proteção. Confidencialidade, integridade, disponibilidade, autenticidade e não repúdio são propriedades distintas.' || E'\n\n' || 'A banca costuma trocar finalidade, alcance ou camada de mecanismos próximos. Determine exatamente o que a tecnologia garante e o que permanece fora de seu escopo.'
    WHEN 'banco-dados' THEN topic_name || ' trata da organização consistente dos dados e das operações usadas para armazenar, consultar e proteger transações. Chaves, dependências, normalização, índices e propriedades ACID resolvem problemas diferentes.' || E'\n\n' || 'Em prova, identifique a estrutura envolvida, sua finalidade, o custo e as condições necessárias. Índices melhoram determinadas consultas, mas também consomem espaço e oneram escritas.'
    WHEN 'engenharia-software' THEN topic_name || ' integra práticas para planejar, construir, testar, versionar e evoluir software com qualidade. Processo, método ágil, requisito, teste, métrica e controle de versão possuem responsabilidades próprias.' || E'\n\n' || 'A banca costuma transformar recomendação em obrigação ou atribuir a uma prática o efeito de outra. Verifique finalidade, participante responsável, entrada e resultado esperado.'
    WHEN 'arquitetura-software' THEN topic_name || ' organiza componentes, integrações e decisões estruturais do sistema. APIs, microsserviços, mensageria, containers e automação de entrega atacam problemas diferentes e produzem custos próprios.' || E'\n\n' || 'Para julgar o item, identifique fronteira, direção da comunicação, responsabilidade e garantia efetivamente oferecida pelo padrão ou ferramenta.'
    WHEN 'redes-computadores' THEN topic_name || ' relaciona camadas, protocolos, endereçamento e serviços responsáveis pela comunicação entre dispositivos. Cada camada possui funções específicas e não herda automaticamente as garantias das demais.' || E'\n\n' || 'Em concursos, associe protocolo, camada, unidade de dados e finalidade. Roteamento, transporte confiável, tradução de nomes e criptografia do canal não são equivalentes.'
    WHEN 'computacao-nuvem' THEN topic_name || ' descreve recursos oferecidos sob demanda e a divisão de responsabilidades entre provedor e cliente. IaaS, PaaS e SaaS entregam camadas diferentes; nuvem pública, privada, comunitária e híbrida descrevem formas de implantação.' || E'\n\n' || 'A classificação depende do que é fornecido e de quem administra cada camada, não apenas do fato de o recurso estar remoto.'
    WHEN 'programacao' THEN topic_name || ' envolve sintaxe, estruturas, tipos, controle de fluxo e organização do código para produzir comportamento correto e sustentável. Linguagem, paradigma, biblioteca e ambiente de execução não devem ser tratados como sinônimos.' || E'\n\n' || 'Acompanhe o estado do programa passo a passo e confira o contrato de cada operação antes de concluir.'
    WHEN 'jornalismo' THEN topic_name || ' deve ser compreendido pela finalidade editorial, pelo gênero, pela apuração, pela construção da notícia e pelo público. Notícia, reportagem, entrevista, opinião e conteúdo institucional cumprem funções diferentes.' || E'\n\n' || 'Em provas, identifique autoria, objetivo, interesse público, método de apuração e forma de apresentação.'
    WHEN 'assessoria-imprensa' THEN topic_name || ' integra o relacionamento profissional entre organizações e veículos. Release, press kit, mailing, clipping, coletiva e media training possuem finalidades específicas e não substituem a decisão editorial da imprensa.' || E'\n\n' || 'Verifique quem produz o material, a quem se destina e se sua função é informar, preparar fonte, distribuir conteúdo ou monitorar repercussão.'
    WHEN 'comunicacao-organizacional' THEN topic_name || ' articula identidade, reputação, públicos, transparência e canais institucionais. Comunicação pública prioriza o interesse do cidadão; comunicação governamental e promoção de gestão não são automaticamente equivalentes.' || E'\n\n' || 'Em métricas digitais, alcance, impressões, engajamento, conversão e CTR medem fenômenos diferentes e precisam ser definidos antes da campanha.'
    WHEN 'direito-administrativo' THEN topic_name || ' exige localizar sujeito competente, requisito, procedimento, comando, exceção e consequência previstos na norma. Faculdade, dever, medida cautelar e sanção não podem ser confundidos.' || E'\n\n' || 'Termos absolutos, competência trocada e requisito omitido são pegadinhas frequentes.'
    WHEN 'etica-compliance' THEN topic_name || ' relaciona princípios, integridade, prevenção de conflitos e responsabilização. Controle, gestão de riscos, auditoria e comissão de ética possuem competências diferentes.' || E'\n\n' || 'Identifique o agente responsável e a consequência permitida antes de aceitar a afirmação.'
    WHEN 'protecao-dados-lgpd' THEN topic_name || ' organiza o tratamento de dados segundo finalidade, necessidade, adequação, segurança, transparência e direitos do titular. Base legal, consentimento e legítimo interesse não são sinônimos.' || E'\n\n' || 'Confira agente, categoria do dado, finalidade, base legal e direito exercido.'
    WHEN 'enfermagem' THEN topic_name || ' relaciona avaliação clínica, finalidade do cuidado, sequência do procedimento e segurança do paciente. A conduta depende da indicação, da via, da dose e da prioridade clínica.' || E'\n\n' || 'Em prova, uma etapa trocada ou uma recomendação transformada em regra universal pode invalidar o item.'
    WHEN 'saude-publica-sus' THEN topic_name || ' envolve princípios, organização da rede, vigilância e políticas públicas de saúde. Universalidade, integralidade, equidade, descentralização e participação social têm sentidos próprios.' || E'\n\n' || 'Associe cada princípio ao efeito correto e verifique o nível de gestão responsável.'
    WHEN 'inovacao-tecnologia' THEN topic_name || ' abrange instrumentos jurídicos e gerenciais para pesquisa, desenvolvimento, transferência e exploração de tecnologia. ICT, NIT, agência de fomento e empresa parceira possuem papéis diferentes.' || E'\n\n' || 'Confira agente competente, instrumento, condição e possibilidade prevista na legislação.'
    ELSE topic_name || ' deve ser estudado distinguindo definição, finalidade, condição de aplicação e consequência. A análise correta confronta cada parte do enunciado com esses quatro elementos.' || E'\n\n' || 'Uma afirmação pode começar correta e tornar-se errada por uma condição omitida, um agente trocado ou uma conclusão mais ampla que a regra.'
  END;
END $$;

CREATE FUNCTION gabarita_taxonomy_trap(subject_slug TEXT,topic_slug TEXT,statement_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE statement_text TEXT:=lower(COALESCE(statement_value,''));
BEGIN
  IF subject_slug='conhecimentos-alagoas' AND statement_text ~ 'palmares|zumbi|ganga' THEN
    RETURN 'A banca costuma trocar Serra da Barriga por Sertão ou margens do São Francisco, União dos Palmares por outro município e o acordo de 1678 pela ofensiva de 1694. Monte uma linha do tempo e um mapa mental antes de julgar.';
  ELSIF statement_text ~ '(sempre|nunca|todo|qualquer|exclusivamente|somente|necessariamente|independentemente)' THEN
    RETURN 'O item usa termo absoluto. Confirme se a regra vale sem exceções ou se a banca eliminou uma condição necessária.';
  END IF;
  RETURN CASE subject_slug
    WHEN 'lingua-portuguesa' THEN 'Não julgue apenas pelo que “soa bem”. Localize a função sintática e verifique se a mudança preserva gramática e sentido.'
    WHEN 'seguranca-informacao' THEN 'Não atribua a um controle a garantia de outro. Compare ameaça, mecanismo, propriedade protegida e limite da solução.'
    WHEN 'banco-dados' THEN 'Não transforme benefício em garantia universal. Modelos, índices, normalização e transações possuem condições e custos.'
    WHEN 'engenharia-software' THEN 'A banca troca papéis, objetivos e artefatos de práticas próximas ou transforma recomendação contextual em obrigação.'
    WHEN 'arquitetura-software' THEN 'Um padrão pode resolver um problema e introduzir outros custos. Confira fronteira, acoplamento e direção da comunicação.'
    WHEN 'redes-computadores' THEN 'A pegadinha recorrente é deslocar uma função para a camada ou protocolo errado.'
    WHEN 'computacao-nuvem' THEN 'Não confunda modelo de serviço com modelo de implantação, nem elasticidade com simples hospedagem remota.'
    WHEN 'jornalismo' THEN 'Separe gênero, técnica de apuração, opinião, informação e comunicação institucional.'
    WHEN 'assessoria-imprensa' THEN 'Material de assessoria subsidia a imprensa, mas não garante publicação nem elimina a autonomia editorial.'
    WHEN 'comunicacao-organizacional' THEN 'Identifique público, iniciativa, finalidade e métrica; conceitos próximos medem ou comunicam coisas diferentes.'
    WHEN 'direito-administrativo' THEN 'Confira competência, requisito, exceção e consequência; a banca costuma trocar faculdade por dever ou cautela por sanção.'
    ELSE 'Separe sujeito, condição, regra e consequência e confira cada elemento isoladamente.'
  END;
END $$;

WITH automatic AS (
  SELECT q.id,q.statement,q.explanation,q.correct_answer #>> '{}' correct,s.slug subject_slug,s.name subject_name,
    t.slug topic_slug,t.name topic_name,
    btrim(regexp_replace(COALESCE(q.explanation,''),'^(item[[:space:]]+)?(certo|errado|correto|incorreto)[.:]?[[:space:]]*','','i')) reason
  FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN topics t ON t.id=q.topic_id
  WHERE q.status IN('ACTIVE','ANNULLED') AND q.comparison_headers->>'criterion'='Etapa da análise'
), generated AS (
  SELECT *,CASE WHEN lower(correct) IN('certo','correto') THEN 'CERTO' WHEN lower(correct) IN('errado','incorreto') THEN 'ERRADO' ELSE upper(correct) END verdict,
    gabarita_taxonomy_concept(subject_slug,topic_slug,topic_name,statement) concept,
    gabarita_taxonomy_trap(subject_slug,topic_slug,statement) trap
  FROM automatic
)
UPDATE questions q SET
  detailed_topic=g.subject_name || ' — ' || g.topic_name,
  concept_explanation=g.concept,
  decisive_evidence='Critério técnico que decide o item: ' || COALESCE(NULLIF(g.reason,''),'compare a afirmação com a definição, as condições e os limites do assunto cobrado.'),
  answer_analysis='1. O item afirma: “' || left(regexp_replace(g.statement,'[[:space:]]+',' ','g'),900) || '”' || E'\n\n' ||
    '2. O critério decisivo é: ' || COALESCE(NULLIF(g.reason,''),'aplicar a definição e verificar suas condições e limites.') || E'\n\n' ||
    CASE WHEN g.verdict='CERTO' THEN '3. O núcleo da afirmação coincide com esse critério; não há troca de agente, tempo, lugar, condição ou consequência capaz de invalidá-lo.' || E'\n\n4. Por isso, o julgamento correto é CERTO.'
      WHEN g.verdict='ERRADO' THEN '3. O item altera pelo menos um elemento decisivo indicado no critério. Usar termos verdadeiros do assunto não salva uma relação, data, finalidade ou consequência incorreta.' || E'\n\n4. Por isso, o julgamento correto é ERRADO.'
      ELSE '3. O gabarito oficial anulou o item; ele não deve ser contabilizado como certo ou errado.' END,
  exam_trap=g.trap || ' Confira o conceito exato e confronte cada termo do item antes de marcar.',
  fixation_tips=jsonb_build_array(
    'Associe esta questão a ' || g.subject_name || ' > ' || g.topic_name || '.',
    'Reescreva com suas palavras o critério decisivo apresentado na correção.',
    'Marque no enunciado sujeito, tempo ou condição, regra e consequência.',
    'Na revisão, tente explicar por que a alternativa oposta falha antes de olhar o gabarito.'
  ),
  comparison_headers=jsonb_build_object('criterion','Elemento da questão','left','Como analisar','right','Aplicação'),
  comparison_rows=jsonb_build_array(
    jsonb_build_object('criterion','Afirmação','left','Identifique exatamente o que o item declara.','right',left(regexp_replace(g.statement,'[[:space:]]+',' ','g'),360)),
    jsonb_build_object('criterion','Regra ou evidência','left','Confronte a afirmação com o critério técnico.','right',left(COALESCE(NULLIF(g.reason,''),'Aplicar o conceito e seus limites.'),360)),
    jsonb_build_object('criterion','Conclusão','left','Verifique se todos os elementos permanecem compatíveis.','right','Gabarito: ' || g.verdict)
  ),updated_at=now()
FROM generated g WHERE q.id=g.id;

DROP FUNCTION gabarita_taxonomy_trap(TEXT,TEXT,TEXT);
DROP FUNCTION gabarita_taxonomy_concept(TEXT,TEXT,TEXT,TEXT);

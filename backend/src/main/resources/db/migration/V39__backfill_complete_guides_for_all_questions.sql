-- Preenche o guia aprofundado de todas as questões publicadas. Guias autorais
-- já cadastrados são preservados. As funções existem apenas durante a migração.

CREATE FUNCTION gabarita_infer_guide_topic(
  category_value TEXT, topic_value TEXT, reference_value TEXT,
  statement_value TEXT, explanation_value TEXT
) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  category_text TEXT := btrim(COALESCE(category_value, 'Geral'));
  topic_text TEXT := btrim(COALESCE(topic_value, ''));
  content_text TEXT := lower(concat_ws(' ', reference_value, statement_value, explanation_value));
BEGIN
  IF topic_text <> '' AND lower(topic_text) <> lower(category_text) AND length(topic_text) > 4 THEN
    RETURN topic_text;
  END IF;

  -- A classificação pelo conteúdo vem antes da disciplina porque parte do
  -- acervo legado possui categoria incorreta.
  IF content_text ~ '(media training|assessoria de imprensa|porta-voz|coletiva de imprensa)' THEN RETURN 'Assessoria de Imprensa — Media Training e Relacionamento com a Imprensa'; END IF;
  IF content_text ~ '(webjornal|texto esquadrinhável|portal.*internet|hipertext|multimídia)' THEN RETURN 'Webjornalismo — Linguagem, Navegação e Leitura em Tela'; END IF;
  IF content_text ~ '(editorial|reportagem|notícia|gênero jornalístico|lide|pirâmide invertida)' THEN RETURN 'Jornalismo — Gêneros, Notícia e Técnicas de Redação'; END IF;
  IF content_text ~ '(grid editorial|entrelinha|tipografia|diagramação|projeto gráfico|editoração)' THEN RETURN 'Editoração e Projeto Gráfico — Legibilidade e Organização Visual'; END IF;
  IF content_text ~ '(agenda.setting|teoria da comunicação|critérios? de noticiabilidade|fonte primária)' THEN RETURN 'Teorias e Produção da Notícia'; END IF;

  IF content_text ~ '(racismo institucional|conclui-se do texto|infere-se do texto|depreende-se|compreensão.*texto|interpretação.*texto)' THEN RETURN 'Interpretação de Texto — Compreensão, Inferência e Limites do Texto'; END IF;
  IF content_text ~ '(crase|acento grave)' THEN RETURN 'Língua Portuguesa — Crase'; END IF;
  IF content_text ~ '(concordância verbal|concordância nominal|sujeito paciente|aluga-se)' THEN RETURN 'Língua Portuguesa — Concordância'; END IF;
  IF content_text ~ '(regência|transitividade|preposição exigida)' THEN RETURN 'Língua Portuguesa — Regência'; END IF;
  IF content_text ~ '(pontuação|vírgula|travessão|dois-pontos)' THEN RETURN 'Língua Portuguesa — Pontuação e Organização Sintática'; END IF;
  IF content_text ~ '(conjunção|conector|coesão|relação.*causal|valor causal|concess)' THEN RETURN 'Língua Portuguesa — Coesão e Relações de Sentido'; END IF;
  IF content_text ~ '(classe.*palavra|advérbio|pronome|substantivo|adjetivo)' THEN RETURN 'Língua Portuguesa — Classes de Palavras e Funções no Texto'; END IF;
  IF content_text ~ '(reescrita|substituição.*trecho|correção gramatical)' THEN RETURN 'Língua Portuguesa — Reescrita, Sentido e Correção Gramatical'; END IF;

  IF content_text ~ '(malware|vírus|virus|worm|ransomware|phishing|firewall|segurança da informação)' THEN RETURN 'Segurança da Informação — Ameaças, Proteção e Controle'; END IF;
  IF content_text ~ '(dns|tcp|udp|ip |roteador|protocolo|rede de computadores|intranet|extranet|vpn)' THEN RETURN 'Redes de Computadores — Protocolos, Serviços e Segurança'; END IF;
  IF content_text ~ '(normalização|forma normal|dependência funcional|sql|banco de dados)' THEN RETURN 'Banco de Dados — Modelagem, Normalização e Consultas'; END IF;
  IF content_text ~ '(solid|orientad[oa] a objetos|padrões gof|arquitetura limpa)' THEN RETURN 'Engenharia de Software — Princípios de Projeto e Orientação a Objetos'; END IF;
  IF content_text ~ '(microsserviço|arquitetura.*evento|kafka|rabbitmq|docker|container|ci/cd)' THEN RETURN 'Arquitetura de Software — Microsserviços, Eventos e Entrega Contínua'; END IF;
  IF content_text ~ '(kanban|scrum|método ágil|metodologia ágil|wip)' THEN RETURN 'Métodos Ágeis — Fluxo, Papéis e Melhoria Contínua'; END IF;
  IF content_text ~ '(computação em nuvem|cloud|elasticidade|block storage|saas|paas|iaas)' THEN RETURN 'Computação em Nuvem — Serviços, Elasticidade e Armazenamento'; END IF;
  IF content_text ~ '(excel|word|powerpoint|planilha|microsoft office)' THEN RETURN 'Ferramentas de Escritório — Microsoft Office'; END IF;
  IF content_text ~ '(windows|linux|sistema operacional|arquivo|pasta)' THEN RETURN 'Sistemas Operacionais — Processos, Arquivos e Administração'; END IF;

  IF content_text ~ '(lgpd|lei geral de proteção|dado pessoal)' THEN RETURN 'LGPD — Princípios, Agentes e Tratamento de Dados'; END IF;
  IF content_text ~ '(licitação|contrato administrativo|lei 14\.133|lei nº 14\.133)' THEN RETURN 'Direito Administrativo — Licitações e Contratos'; END IF;
  IF content_text ~ '(ato administrativo|poder administrativo|administração pública)' THEN RETURN 'Direito Administrativo — Atos, Poderes e Administração Pública'; END IF;
  IF content_text ~ '(ética|compliance|integridade|conflito de interesses|accountability)' THEN RETURN 'Ética e Compliance — Integridade, Responsabilidade e Interesse Público'; END IF;

  IF content_text ~ '(enfermagem|paciente|medicamento|dose|administração.*medicamento)' THEN RETURN 'Enfermagem — Segurança, Procedimentos e Cuidado ao Paciente'; END IF;
  IF content_text ~ '(sus|saúde pública|atenção básica|epidemiolog)' THEN RETURN 'Saúde Pública e SUS — Princípios, Organização e Atenção à Saúde'; END IF;
  IF content_text ~ '(porcentagem|probabilidade|estatística|média|mediana|equação|raciocínio lógico)' THEN RETURN 'Raciocínio Lógico, Matemática e Estatística'; END IF;
  IF content_text ~ '(alagoas|maceió|quilombo|palmares|são francisco)' THEN RETURN 'Conhecimentos de Alagoas — História, Geografia e Sociedade'; END IF;
  IF lower(category_text) ~ '(ingl)' THEN RETURN 'Língua Inglesa — Compreensão, Vocabulário e Estruturas Textuais'; END IF;

  RETURN category_text || ' — Conceitos e Aplicação em Questões';
END $$;

CREATE FUNCTION gabarita_concept_for(topic_value TEXT, category_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE topic_text TEXT := COALESCE(topic_value, 'Assunto da questão');
BEGIN
  RETURN CASE
    WHEN lower(topic_text) ~ 'interpretação|compreensão|inferência' THEN
      topic_text || ' exige separar três níveis de leitura: o que está escrito de modo expresso, o que pode ser concluído por relação lógica e o que seria uma extrapolação sem apoio textual.' || E'\n\n' ||
      'Em provas, a resposta correta pode usar palavras diferentes das empregadas pelo autor, desde que preserve sentido, alcance, sujeito, condição e relação de causa ou consequência. Termos absolutos e condições omitidas costumam transformar uma paráfrase aparentemente fiel em item errado.'
    WHEN lower(topic_text) ~ 'crase|concordância|regência|pontuação|classes de palavras|coesão|reescrita' THEN
      topic_text || ' deve ser resolvido pela função que cada termo exerce na oração e pela relação de sentido construída no contexto. A análise não pode se limitar ao que “soa melhor”; é necessário identificar a regra e testar seus efeitos sobre correção e significado.' || E'\n\n' ||
      'Em questões de reescrita, uma alteração só é válida quando preserva simultaneamente a gramática e a ideia original. Mudança de regência, concordância, referente, relação lógica ou alcance já é suficiente para invalidar o item.'
    WHEN lower(topic_text) ~ 'segurança da informação' THEN
      topic_text || ' organiza medidas de proteção segundo o ativo protegido, a ameaça, a vulnerabilidade explorada e o controle utilizado. Confidencialidade, integridade, disponibilidade, autenticidade e rastreabilidade são objetivos diferentes e não devem ser tratados como sinônimos.' || E'\n\n' ||
      'Para resolver a questão, identifique o mecanismo descrito, o que ele consegue fazer, de que condição depende e qual limite permanece. Bancas frequentemente trocam finalidade, modo de propagação ou responsabilidade de ferramentas próximas.'
    WHEN lower(topic_text) ~ 'redes de computadores' THEN
      topic_text || ' relaciona camadas, protocolos, endereçamento e serviços que permitem a comunicação entre dispositivos. Cada protocolo possui finalidade e nível de atuação próprios; compartilhar a mesma rede não torna dois serviços equivalentes.' || E'\n\n' ||
      'A resolução segura compara entrada, processamento, destino e tipo de comunicação. Atenção a trocas entre nome e endereço, conexão e datagrama, rede pública e privada, ou proteção do canal e proteção do equipamento.'
    WHEN lower(topic_text) ~ 'banco de dados' THEN
      topic_text || ' trata da representação consistente dos dados, das dependências entre atributos e das operações usadas para consultar ou modificar informações. Normalização reduz redundâncias e anomalias; transações preservam propriedades de execução; consultas expressam relações entre conjuntos.' || E'\n\n' ||
      'Em prova, confirme as condições de cada forma normal, o alcance de chaves e restrições e o momento em que uma operação produz efeito. Uma palavra como “sempre” ou “somente” pode eliminar uma exceção essencial.'
    WHEN lower(topic_text) ~ 'engenharia de software|arquitetura de software|métodos ágeis' THEN
      topic_text || ' envolve decisões de projeto que equilibram responsabilidade, acoplamento, coesão, capacidade de mudança e fluxo de entrega. Princípios, padrões e práticas não são objetivos isolados: cada um resolve determinado tipo de problema e possui limites.' || E'\n\n' ||
      'Para julgar o item, identifique qual problema a prática pretende resolver e se a consequência afirmada realmente decorre dela. A banca costuma trocar nomes de princípios, transformar recomendação em obrigação ou atribuir a uma técnica a finalidade de outra.'
    WHEN lower(topic_text) ~ 'computação em nuvem' THEN
      topic_text || ' descreve recursos computacionais oferecidos sob demanda, com diferentes divisões de responsabilidade entre provedor e cliente. Elasticidade, escalabilidade, disponibilidade e modelo de serviço são conceitos relacionados, porém distintos.' || E'\n\n' ||
      'A análise deve verificar quem administra cada camada, como os recursos aumentam ou diminuem e qual serviço está sendo entregue. Usar infraestrutura remota, isoladamente, não prova todas as características de nuvem.'
    WHEN lower(topic_text) ~ 'jornal|notícia|imprensa|editoração|webjornalismo' THEN
      topic_text || ' deve ser compreendido pela finalidade comunicacional, pelo público, pelo suporte e pela responsabilidade editorial envolvidos. Gênero, formato, técnica de apuração e estratégia institucional cumprem funções diferentes dentro do processo de comunicação.' || E'\n\n' ||
      'Em questões de concurso, compare quem produz a mensagem, para quem ela se dirige, com qual objetivo e em qual meio circula. A banca costuma aproximar conceitos legítimos e trocar apenas sua finalidade ou seu campo de aplicação.'
    WHEN lower(topic_text) ~ 'lgpd|direito administrativo|licitações|ética e compliance' THEN
      topic_text || ' exige localizar sujeito, competência, condição de aplicação, comando e consequência. Normas e princípios devem ser interpretados conjuntamente, sem criar obrigação, proibição ou exceção que não esteja autorizada.' || E'\n\n' ||
      'Palavras absolutas, troca do agente responsável, omissão de requisito e confusão entre conceitos próximos são pegadinhas recorrentes. A conclusão precisa respeitar exatamente o alcance da regra.'
    WHEN lower(topic_text) ~ 'enfermagem|saúde pública|sus' THEN
      topic_text || ' relaciona finalidade do cuidado, avaliação do paciente, sequência do procedimento, prioridade clínica e medidas de segurança. A conduta correta depende do contexto, da indicação e dos riscos envolvidos.' || E'\n\n' ||
      'Em prova, verifique ordem, via, dose, responsabilidade profissional e prioridade. Trocar uma etapa ou transformar uma recomendação contextual em regra universal pode tornar o item incorreto.'
    WHEN lower(topic_text) ~ 'raciocínio lógico|matemática|estatística' THEN
      topic_text || ' requer traduzir o enunciado em relações entre dados antes de calcular. Hipóteses, operação, unidade e pergunta final precisam permanecer coerentes durante toda a resolução.' || E'\n\n' ||
      'A banca pode fornecer números corretos e induzir ao uso de fórmula, universo ou unidade inadequados. O resultado só é válido quando responde exatamente ao que foi solicitado.'
    WHEN lower(topic_text) ~ 'alagoas' THEN
      topic_text || ' relaciona acontecimentos históricos, organização territorial, atividades econômicas, patrimônio cultural e características socioambientais do estado. Datas e nomes devem ser conectados ao processo histórico a que pertencem.' || E'\n\n' ||
      'Em prova, desconfie de trocas de período, localização, condição político-administrativa e relação de causa e consequência. Um fato verdadeiro pode tornar-se errado quando associado ao contexto errado.'
    WHEN lower(topic_text) ~ 'língua inglesa' THEN
      topic_text || ' cobra compreensão global, identificação de informações específicas, referência de pronomes e vocabulário em contexto. Traduzir palavra por palavra não basta; a função da expressão dentro do texto decide o sentido.' || E'\n\n' ||
      'A resposta deve manter tempo, sujeito, intensidade e relação lógica. Falsos cognatos, conectores e termos com múltiplos sentidos são fontes frequentes de erro.'
    ELSE
      topic_text || ' deve ser estudado por quatro perguntas: qual é o conceito, para que serve, em quais condições se aplica e qual consequência produz. Essa estrutura permite diferenciar definição, exemplo, requisito e efeito.' || E'\n\n' ||
      'Na resolução, confronte cada parte do item com o critério técnico apresentado no conteúdo. Uma afirmação pode começar correta e tornar-se errada por uma condição omitida, uma finalidade trocada ou uma conclusão mais ampla do que a regra permite.'
  END;
END $$;

CREATE FUNCTION gabarita_trap_for(topic_value TEXT, statement_value TEXT, correct_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE topic_text TEXT := lower(COALESCE(topic_value, '')); statement_text TEXT := lower(COALESCE(statement_value, ''));
BEGIN
  IF statement_text ~ '(sempre|nunca|todo|qualquer|exclusivamente|somente|necessariamente|independentemente)' THEN
    RETURN 'A redação usa termo de alcance amplo. A banca costuma partir de um conceito verdadeiro e eliminar suas condições ou exceções. Confira se o conteúdo autoriza a conclusão em todos os casos ou apenas na situação descrita.';
  END IF;
  IF topic_text ~ 'interpretação|compreensão|inferência' THEN
    RETURN 'A armadilha é confundir paráfrase com extrapolação. Uma troca de palavras é válida quando conserva o alcance da ideia; torna-se errada quando acrescenta causa, certeza, julgamento ou generalização que o texto não apresenta.';
  END IF;
  IF topic_text ~ 'crase|concordância|regência|pontuação|coesão|reescrita' THEN
    RETURN 'A frase pode parecer natural e ainda estar gramaticalmente ou semanticamente errada. A banca espera que o candidato identifique a função sintática e verifique se a alteração preserva tanto a regra quanto o sentido.';
  END IF;
  IF topic_text ~ 'segurança|redes|banco de dados|software|nuvem|sistemas operacionais' THEN
    RETURN 'A pegadinha técnica mais comum é atribuir a um recurso a finalidade, a camada ou a garantia de outro. Compare mecanismo, dependência e limite; termos parecidos não significam funcionamento idêntico.';
  END IF;
  IF topic_text ~ 'jornal|notícia|imprensa|comunicação|editoração' THEN
    RETURN 'A banca aproxima técnicas e gêneros legítimos, mas troca objetivo, autoria, público ou suporte. Identifique a função específica do conceito no processo comunicacional antes de julgar.';
  END IF;
  IF topic_text ~ 'direito|lgpd|ética|compliance|licitação' THEN
    RETURN 'A redação pode omitir requisito, trocar competência ou transformar faculdade em obrigação. Leia a regra em termos de sujeito, condição, comando, exceção e consequência.';
  END IF;
  IF topic_text ~ 'enfermagem|saúde|sus' THEN
    RETURN 'A armadilha costuma estar na prioridade, na indicação, na sequência ou na medida de segurança. Uma conduta conhecida pode ser inadequada para o contexto específico descrito.';
  END IF;
  RETURN CASE WHEN lower(COALESCE(correct_value,'')) IN ('errado','incorreto')
    THEN 'O item combina elementos relacionados ao assunto, mas altera um detalhe decisivo. Localize a condição, a finalidade ou a consequência que não coincide com o critério técnico.'
    ELSE 'O item pode parecer simples porque reformula a regra. Confirme que todos os elementos essenciais foram preservados e que nenhuma condição incompatível foi acrescentada.' END;
END $$;

WITH source AS (
  SELECT q.id,q.statement,q.explanation,q.correct_answer #>> '{}' correct,
    COALESCE(q.metadata->>'category',s.name,'Geral') category,
    COALESCE(NULLIF(q.metadata->>'topic',''),q.metadata->>'category',s.name,'Geral') current_topic,
    COALESCE(q.metadata->>'reference',q.board,'') reference,
    gabarita_infer_guide_topic(
      COALESCE(q.metadata->>'category',s.name,'Geral'),
      COALESCE(NULLIF(q.metadata->>'topic',''),q.metadata->>'category',s.name,'Geral'),
      COALESCE(q.metadata->>'reference',q.board,''),q.statement,q.explanation
    ) inferred_topic,
    btrim(regexp_replace(COALESCE(q.explanation,''),'^(item[[:space:]]+)?(certo|errado|correto|incorreto)[.:]?[[:space:]]*','','i')) reason
  FROM questions q LEFT JOIN subjects s ON s.id=q.subject_id
  WHERE q.status IN('ACTIVE','ANNULLED')
), guides AS (
  SELECT *,
    gabarita_concept_for(inferred_topic,category) generated_concept,
    gabarita_trap_for(inferred_topic,statement,correct) generated_trap,
    CASE WHEN lower(correct) IN ('certo','correto') THEN 'CERTO' WHEN lower(correct) IN ('errado','incorreto') THEN 'ERRADO' ELSE upper(correct) END verdict
  FROM source
)
UPDATE questions q SET
  detailed_topic=CASE WHEN btrim(q.detailed_topic)='' THEN g.inferred_topic ELSE q.detailed_topic END,
  concept_explanation=CASE WHEN btrim(q.concept_explanation)='' THEN g.generated_concept ELSE q.concept_explanation END,
  decisive_evidence=CASE WHEN btrim(q.decisive_evidence)='' THEN
    'Critério técnico que decide o item: ' || COALESCE(NULLIF(g.reason,''),'o enunciado deve ser confrontado com a definição, as condições e os limites do assunto cobrado.')
    ELSE q.decisive_evidence END,
  answer_analysis=CASE WHEN btrim(q.answer_analysis)='' THEN
    '1. Delimite a afirmação examinada: “' || left(regexp_replace(g.statement,'[[:space:]]+',' ','g'),900) || '”' || E'\n\n' ||
    '2. Compare cada elemento dessa afirmação com o critério técnico destacado acima. Observe especialmente o sujeito, a condição de aplicação, a finalidade e a consequência.' || E'\n\n' ||
    CASE WHEN g.verdict='CERTO' THEN
      '3. Os elementos essenciais permanecem compatíveis com o critério: a formulação não cria exceção, causa ou alcance incompatível com o conteúdo.' || E'\n\n' ||
      '4. Como a afirmação preserva a regra aplicada ao caso, o julgamento correto é CERTO.'
    WHEN g.verdict='ERRADO' THEN
      '3. O confronto revela incompatibilidade em pelo menos um elemento decisivo. Não basta o item usar termos do assunto; toda a relação afirmada precisa coincidir com a regra.' || E'\n\n' ||
      '4. Como a formulação altera ou ultrapassa o critério aplicável, o julgamento correto é ERRADO.'
    ELSE
      '3. O item não pode receber pontuação regular porque o gabarito oficial o classificou como anulado. A anulação deve prevalecer sobre qualquer tentativa de contabilizá-lo como acerto ou erro.'
    END ELSE q.answer_analysis END,
  exam_trap=CASE WHEN btrim(q.exam_trap)='' THEN g.generated_trap ELSE q.exam_trap END,
  fixation_tips=CASE WHEN jsonb_array_length(q.fixation_tips)=0 THEN jsonb_build_array(
    'Antes de marcar, resuma com suas palavras o conceito central de ' || g.inferred_topic || '.',
    'Separe no item sujeito, condição, regra e consequência; confira cada parte isoladamente.',
    'Desconfie de termos absolutos e de conceitos próximos apresentados como se fossem sinônimos.',
    'Justifique o gabarito apontando o detalhe decisivo, e não apenas repetindo “certo” ou “errado”.'
  ) ELSE q.fixation_tips END,
  comparison_headers=CASE WHEN q.comparison_headers='{}'::jsonb THEN jsonb_build_object(
    'criterion','Etapa da análise','left','O que verificar','right','Aplicação nesta questão'
  ) ELSE q.comparison_headers END,
  comparison_rows=CASE WHEN jsonb_array_length(q.comparison_rows)=0 THEN jsonb_build_array(
    jsonb_build_object('criterion','Afirmação','left','Identificar exatamente o que o item declara.','right',left(regexp_replace(g.statement,'[[:space:]]+',' ','g'),360)),
    jsonb_build_object('criterion','Critério decisivo','left','Confrontar o item com a regra, definição ou evidência.','right',left(COALESCE(NULLIF(g.reason,''),'Aplicar o conceito e seus limites.'),360)),
    jsonb_build_object('criterion','Conclusão','left','Verificar se todos os elementos são compatíveis.','right','Gabarito: ' || g.verdict)
  ) ELSE q.comparison_rows END,
  updated_at=now()
FROM guides g WHERE q.id=g.id;

DROP FUNCTION gabarita_trap_for(TEXT,TEXT,TEXT);
DROP FUNCTION gabarita_concept_for(TEXT,TEXT);
DROP FUNCTION gabarita_infer_guide_topic(TEXT,TEXT,TEXT,TEXT,TEXT);

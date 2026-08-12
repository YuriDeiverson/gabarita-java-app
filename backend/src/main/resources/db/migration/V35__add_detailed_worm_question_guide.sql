-- Primeira correção completa no novo formato. O comentário curto do card é
-- preservado; os campos abaixo alimentam somente o modal "Assunto cobrado".
UPDATE questions
SET metadata = metadata || jsonb_build_object(
  'detailedTopic', 'Segurança da Informação — Malwares: Vírus × Worms',
  'conceptExplanation',
    'Malware é um programa criado para causar dano, roubar informações ou entrar em um computador sem permissão. Vírus e worm são dois tipos de malware, mas eles se espalham de maneiras diferentes.' || E'\n\n' ||
    'Pense no vírus como algo que pega carona em outro arquivo. Ele precisa de um hospedeiro, como um programa ou documento infectado, e normalmente começa a agir quando alguém abre ou executa esse arquivo.' || E'\n\n' ||
    'O worm, também chamado de verme, é um programa completo e autônomo. Depois de alcançar uma máquina, ele procura outros computadores conectados, identifica falhas de segurança e cria cópias de si mesmo. Por isso, consegue se espalhar pela rede sem esperar que uma pessoa clique em cada nova máquina.',
  'answerAnalysis',
    'O item está CERTO porque apresenta as duas características centrais do worm. Primeiro, ele não depende de uma ação humana direta para continuar sua propagação. Segundo, utiliza a rede e pode explorar vulnerabilidades em programas, serviços do sistema ou configurações inseguras para chegar a outras máquinas.' || E'\n\n' ||
    'A pegadinha da banca é misturar o modo de propagação do vírus com o do worm. Um vírus costuma precisar de um arquivo hospedeiro e da execução desse arquivo. O worm é autônomo: uma vez ativo, replica-se e procura novos alvos sozinho. Isso não significa que toda infecção inicial seja mágica; significa que a propagação de uma máquina para as seguintes não depende de um novo clique do usuário.',
  'fixationTips', jsonb_build_array(
    'Vírus pega carona em um arquivo ou programa hospedeiro.',
    'Worm é autônomo e consegue criar cópias de si mesmo.',
    'Vírus normalmente depende da execução do arquivo infectado; worm se propaga automaticamente pela rede.',
    'Pegadinha comum: vírus e worm são malwares, mas não usam o mesmo mecanismo de propagação.'
  ),
  'comparisonRows', jsonb_build_array(
    jsonb_build_object('criterion','Precisa de hospedeiro?','left','Vírus: sim, costuma ficar ligado a um arquivo ou programa.','right','Worm: não, é um programa autônomo.'),
    jsonb_build_object('criterion','Exige ação humana?','left','Vírus: normalmente precisa que o arquivo seja aberto ou executado.','right','Worm: não precisa de um novo clique para se espalhar.'),
    jsonb_build_object('criterion','Foco da propagação','left','Vírus: arquivos, programas e mídias removíveis.','right','Worm: redes e vulnerabilidades de sistemas ou serviços.')
  )
), updated_at = now()
WHERE metadata->>'reference' = 'CEBRASPE — SEPLAG/AL — Especialista em Gestão Pública — Edital 2026 — Item 29';

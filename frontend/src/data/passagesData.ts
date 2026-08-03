export interface Passage {
  id: string;
  title: string;
  content: string;
}

export const passages: { [key: string]: Passage } = {
  'codevasf-racismo-institucional': {
    id: 'codevasf-racismo-institucional',
    title: 'Texto CB1A1 - Racismo Estrutural e Institucional (CODEVASF 2024)',
    content: `O racismo estrutural é uma realidade cotidiana no Brasil, e as denúncias de atitudes racistas estão se tornando mais visíveis. Porém, o racismo institucional, que acontece dentro de organizações públicas e privadas em diversos setores, ainda é um conceito pouco familiar para muitas pessoas. Mesmo afetando diretamente milhões de brasileiros, esse tipo de racismo é menos conhecido.

O racismo institucional vai além das atitudes individuais e ações isoladas. Ele está enraizado nas políticas, nos procedimentos e nas práticas das organizações. Isso significa que não se trata apenas de como as pessoas se comportam, mas também de como as estruturas e normas podem favorecer ou prejudicar grupos raciais específicos.

Essas manifestações de racismo dentro das instituições podem ser observadas em várias áreas, desde a maneira como o pessoal é selecionado e promovido até a distribuição de recursos. Isso pode resultar em desigualdades sistêmicas que afetam grupos pertencentes a minorias raciais, limitando suas oportunidades e o reconhecimento de suas contribuições.

Essa dimensão do racismo é frequentemente menos reconhecida do que as formas mais óbvias de preconceito racial, mas seu impacto é duradouro e pode contribuir significativamente para a manutenção de desigualdades com base na raça. O racismo institucional é um conceito-chave para compreender como as estruturas e práticas das organizações podem perpetuar a discriminação racial, mesmo que não haja intenções individuais de discriminar. É um problema complexo que requer atenção, portanto, reconhecer e abordar as maneiras como se manifesta o racismo institucional é fundamental para promover a igualdade racial nos espaços de trabalho.`
  },
  'capitalismo-vigilancia': {
    id: 'capitalismo-vigilancia',
    title: 'Texto CG1A1 - Capitalismo de Vigilância (TRT 8ª Região)',
    content: `O capitalismo de vigilância é uma mutação do capitalismo da informação que se caracteriza pelo desvio e captura de dados comportamentais das pessoas. As Big Techs — seguidas por outras firmas, laboratórios e governos — usam tecnologias da informação para rastrear, monitorar e prever o comportamento humano. O usuário cede gratuitamente as suas informações em troca de serviços de busca, redes sociais e e-mail.

Ao se generalizar na sociedade, o capitalismo de vigilância capturou e desviou o efeito democratizador da Internet, que abrira a todos o acesso à informação. Nesse cenário, as autoridades norte-americanas tornaram-se ávidas de programas de rastreamento de dados em nome da segurança nacional, o que acabou por legitimar essas práticas intrusivas.`
  },
  'replicas-digitais': {
    id: 'replicas-digitais',
    title: 'Texto CB1A1 - Inteligência Artificial e Arquitetura (CAU/BR)',
    content: `Enquanto Singapura e Dublin lançaram suas réplicas digitais para prever o impacto do desenvolvimento urbano, arquitetos de todo o mundo debatem o impacto das novas tecnologias na profissão. Há uma profusão de abordagens: algumas obras totalmente projetadas por inteligência artificial (IA), outras criadas manualmente e com modelos físicos, e ainda aquelas que mesclam ambas as técnicas.

Como a arquitetura reflete as sociedades em que está inserida, a incorporação de ferramentas algorítmicas é vista tanto como uma oportunidade revolucionária quanto como um risco de padronização estética. A automação pode agilizar processos, mas cabe ao arquiteto garantir a sensibilidade humana no design do espaço público.`
  },
  'uso-mascaras': {
    id: 'uso-mascaras',
    title: 'Texto CG1A1-I - Uso de Máscaras em Crianças (TJ/RJ)',
    content: `A prática de usar máscaras para se proteger de doenças respiratórias, já amplamente adotada pela população de diversos países asiáticos muito antes da pandemia de COVID-19, espalhou-se rapidamente pelo mundo nos últimos anos.

No entanto, o uso de máscaras em crianças pequenas é objeto de intensos debates entre pediatras e educadores. Defensores apontam a eficácia na redução da transmissão comunitária de vírus, ao passo que críticos manifestam preocupação com o impacto no desenvolvimento da fala e na socialização infantil. Estudos indicam que a plasticidade cerebral das crianças permite a adaptação a esses novos cenários de interação social sem prejuízos de longo prazo.`
  },
  'justica-restaurativa': {
    id: 'justica-restaurativa',
    title: 'Texto de Apoio - Justiça Restaurativa (TRF 6ª Região)',
    content: `Analisando-se a literatura produzida sobre justiça restaurativa, percebe-se que ela busca ir além do modelo puramente punitivo do direito penal clássico. Ao focar na reparação do dano causado à vítima e no restabelecimento do diálogo comunitário, a justiça restaurativa coloca o ofensor em uma posição de responsabilidade ativa, e não meramente passiva diante de uma sanção estatal.

Esse paradigma impõe um desafio de escala aos tribunais modernos. O acolhimento de práticas de conciliação e mediação exige equipes preparadas e uma mudança cultural profunda tanto nos magistrados quanto na sociedade em geral, que por vezes confunde práticas restaurativas com impunidade ou leniência jurídica.`
  }
};

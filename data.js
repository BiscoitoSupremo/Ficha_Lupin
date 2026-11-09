/* Tudo de cálculo tá por aqui, se precisar mexer Ryan do futuro, saiba que tá tudo aqui plmds */
window.LUPIN = {

  /* Atributos (todos começam em 1; criação: 10 pontos, máx. 4; em jogo, máx. 5) */
  ATTRS: [
    { k: 'FOR', n: 'Força',        d: 'Imobilizar, arrombar, carregar, aguentar esforço bruto.' },
    { k: 'DES', n: 'Destreza',     d: 'Mira, furtividade, direção, reflexos, sutileza manual.' },
    { k: 'CON', n: 'Constituição', d: 'Saúde, vigília, resistência a dor e estresse físico.' },
    { k: 'PER', n: 'Percepção',    d: 'Notar detalhes, ler cenas, sentir que algo está errado.' },
    { k: 'INT', n: 'Intelecto',    d: 'Lógica, memória, técnica, raciocínio abstrato.' },
    { k: 'CAR', n: 'Carisma',      d: 'Persuadir, intimidar, liderar, impor presença.' }
  ],
  CRIACAO: { pontos: 10, base: 6, teto: 4, tetoJogo: 5, px: 10 },

  /* Custo em PX de cada marco (20% a 100%). Em outra Área o custo dobra. */
  CUSTO: [3, 5, 8, 12, 17],
  PCT: [20, 40, 60, 80, 100],

  /* Dificuldades */
  DIFS: [
    { v: 6,  n: 'Rotina' },
    { v: 9,  n: 'Padrão' },
    { v: 12, n: 'Difícil' },
    { v: 15, n: 'Extrema' },
    { v: 18, n: 'Lendária' }
  ],

  /* Cargos: Autoridade = nº do cargo; Recursos = reserva; mer = Méritos exigidos */
  CARGOS: [
    null,
    { n: 1, nome: 'Agente',    deic: 'Investigador',        fbi: 'Special Agent',                     aut: 1, rec: 2, mer: 0 },
    { n: 2, nome: 'Sênior',    deic: 'Investigador Sênior', fbi: 'Senior Special Agent',              aut: 2, rec: 3, mer: 3 },
    { n: 3, nome: 'Inspetor',  deic: 'Inspetor de Polícia', fbi: 'Supervisory Special Agent',         aut: 3, rec: 4, mer: 7 },
    { n: 4, nome: 'Adjunto',   deic: 'Delegado-Adjunto',    fbi: 'Assistant Special Agent in Charge', aut: 4, rec: 5, mer: 12 },
    { n: 5, nome: 'Chefe',     deic: 'Delegado Titular',    fbi: 'Special Agent in Charge',           aut: 5, rec: 6, mer: 18 }
  ],
  MERITOS: [
    ['Fechar um caso', 1], ['Salvar civis em risco', 1], ['Relatório impecável', 1],
    ['Expor corrupção com provas', 2], ['Abusar de autoridade', -1],
    ['Mentir em juízo', -2], ['Esconder prova', -2]
  ],

  /* Credibilidade (0 a 10) */
  CRED: [
    { min: 0, max: 2,  n: 'Suspeito',   mod: -2, d: 'Investigação interna a caminho. −2 em testes sociais com instituições.' },
    { min: 3, max: 4,  n: 'Abalado',    mod: -1, d: 'A chefia hesita. −1 em testes sociais com instituições.' },
    { min: 5, max: 6,  n: 'Estável',    mod: 0,  d: 'Sem modificadores.' },
    { min: 7, max: 8,  n: 'Respeitado', mod: 1,  d: '+1 em testes sociais com instituições e imprensa.' },
    { min: 9, max: 10, n: 'Referência', mod: 2,  d: '+2 nos mesmos testes. Portas se abrem sem pedir.' }
  ],

  /* Equipamento. disp: Comum (0) · Requisitado (1 Recurso) · Especial (2 Recursos, Cargo 3+) */
  DISP: { 'Comum': 0, 'Requisitado': 1, 'Especial': 2 },
  EQUIP: [
    { id: 'pistola',  nome: 'Pistola ou revólver',      disp: 'Comum',       tipo: 'arma', dano: 3, skill: 'forca-tatica.0', attr: 'DES', efeito: 'Dano 3. Curto e médio alcance. Padrão da força-tarefa.' },
    { id: 'cassete',  nome: 'Cassetete ou faca',        disp: 'Comum',       tipo: 'arma', dano: 2, skill: 'forca-tatica.1', attr: 'FOR', efeito: 'Dano 2, corpo a corpo. A faca é letal.' },
    { id: 'escopeta', nome: 'Escopeta',                 disp: 'Requisitado', tipo: 'arma', dano: 4, skill: 'forca-tatica.0', attr: 'DES', efeito: 'Dano 4. Curto alcance. Barulhenta e imprecisa à distância.' },
    { id: 'rifle',    nome: 'Rifle tático',             disp: 'Requisitado', tipo: 'arma', dano: 5, skill: 'forca-tatica.0', attr: 'DES', efeito: 'Dano 5. Médio e longo alcance. Exige preparo.' },
    { id: 'colete1',  nome: 'Colete leve',              disp: 'Comum',       tipo: 'prot', red: 1, efeito: 'Reduz 1 de dano.' },
    { id: 'colete2',  nome: 'Colete tático',            disp: 'Requisitado', tipo: 'prot', red: 2, efeito: 'Reduz 2 de dano. Volumoso.' },
    { id: 'radio',    nome: 'Rádio de ponto',           disp: 'Comum',       tipo: 'tool', efeito: '+1 em testes de coordenação entre agentes.' },
    { id: 'celular',  nome: 'Celular ou pager',         disp: 'Comum',       tipo: 'tool', efeito: 'Contato rápido. Pode ser rastreado.' },
    { id: 'maleta',   nome: 'Maleta forense',           disp: 'Comum',       tipo: 'tool', efeito: '+1 em Coleta de Vestígios e Cena de Crime.' },
    { id: 'labmovel', nome: 'Laboratório móvel',        disp: 'Especial',    tipo: 'tool', efeito: 'Análises de campo em horas. Requer Forense.' },
    { id: 'notebook', nome: 'Notebook com modem',       disp: 'Comum',       tipo: 'tool', efeito: '+1 em Informática. Precisa de linha telefônica.' },
    { id: 'escuta',   nome: 'Escuta ambiental',         disp: 'Requisitado', tipo: 'tool', efeito: '+2 em Vigilância Eletrônica. Exige mandado ou custa Credibilidade.' },
    { id: 'camera',   nome: 'Câmera 35 mm ou filmadora',disp: 'Comum',       tipo: 'tool', efeito: 'Registra a cena e dá +1 ao apresentar prova.' },
    { id: 'binoculo', nome: 'Binóculos e lente longa',  disp: 'Comum',       tipo: 'tool', efeito: '+1 em Campana e vigilância à distância.' },
    { id: 'detector', nome: 'Detector de metais',       disp: 'Requisitado', tipo: 'tool', efeito: '+2 para achar objetos metálicos escondidos.' },
    { id: 'disfarce', nome: 'Kit de disfarce',          disp: 'Requisitado', tipo: 'tool', efeito: '+1 em Disfarce Físico e Identidade de Cobertura.' },
    { id: 'viatura',  nome: 'Viatura descaracterizada', disp: 'Comum',       tipo: 'tool', efeito: 'Seguimento veicular sem ser notado.' },
    { id: 'heli',     nome: 'Helicóptero de apoio',     disp: 'Especial',    tipo: 'tool', efeito: 'Cobertura aérea de uma operação por uma cena.' }
  ],

  /* As 7 Áreas, 28 Campos e 140 marcos (gerado a partir do livro de regras) */
  AREAS: [
 {
  "key": "forca-tatica",
  "no": 1,
  "nome": "Força Tática",
  "desc": "Operações de alto risco, combate, captura e contenção. Quem entra primeiro, protege os outros e sabe quando não atirar.",
  "nucleo": "Armas de Fogo (usa armas padrão sem penalidade) · Condicionamento (+1 em testes de resistência física e de fuga a pé).",
  "campos": [
   {
    "nome": "Armas e Tiro",
    "attr": "DES",
    "resumo": "Mira, cadência e controle sob fogo.",
    "marcos": [
     {
      "nome": "Tiro de Precisão",
      "efeito": "Mirando por uma rodada inteira, ignore −2 de cobertura leve."
     },
     {
      "nome": "Tiro Rápido sob Pressão",
      "efeito": "Ao sacar e atirar na mesma ação, sofre só −1 em vez de −3."
     },
     {
      "nome": "Fogo de Supressão",
      "efeito": "Impõe −2 às ações de alvos em campo aberto por uma rodada. Gasta munição extra."
     },
     {
      "nome": "Atirador Designado",
      "efeito": "Com rifle e uma rodada de preparo, +2 de dano a longa distância."
     },
     {
      "nome": "Tiro Impossível",
      "efeito": "Uma vez por operação, reduza em um nível a dificuldade de um tiro."
     }
    ]
   },
   {
    "nome": "Combate e Captura",
    "attr": "FOR",
    "resumo": "Corpo a corpo e contenção de alvos.",
    "marcos": [
     {
      "nome": "Imobilização",
      "efeito": "Teste de FOR + Campo (Dif. 9) para conter um alvo até ele se soltar."
     },
     {
      "nome": "Defesa Pessoal",
      "efeito": "+1 de Defesa contra ataques corpo a corpo."
     },
     {
      "nome": "Algemamento Tático",
      "efeito": "Algeme um alvo contido sem novo teste, mesmo em grupo."
     },
     {
      "nome": "Contenção Não Letal",
      "efeito": "Ao capturar, causa Atordoado: o alvo perde a próxima ação."
     },
     {
      "nome": "Captura de Alvo Evasivo",
      "efeito": "Anule uma vantagem de fuga do alvo por cena."
     }
    ]
   },
   {
    "nome": "Entradas Táticas",
    "attr": "DES",
    "resumo": "Ingresso em locais hostis ou desconhecidos.",
    "marcos": [
     {
      "nome": "Entrada Dinâmica",
      "efeito": "Sua equipe age primeiro na rodada de entrada."
     },
     {
      "nome": "Limpeza de Cômodos",
      "efeito": "Uma vez por cena, o mestre revela uma ameaça escondida no ambiente."
     },
     {
      "nome": "Operação Noturna",
      "efeito": "Sem penalidade por escuridão e +1 em furtividade tática."
     },
     {
      "nome": "Resgate de Reféns",
      "efeito": "+2 em testes para proteger civis e −1 nível de risco colateral."
     },
     {
      "nome": "Assalto Coordenado",
      "efeito": "Una até 3 agentes em um teste conjunto, usando o melhor resultado."
     }
    ]
   },
   {
    "nome": "Condução e Perseguição",
    "attr": "DES",
    "resumo": "Veículos, bloqueios e alcance de alvos em fuga.",
    "marcos": [
     {
      "nome": "Direção Defensiva",
      "efeito": "+1 ao dirigir sob chuva, tráfego ou pressão."
     },
     {
      "nome": "Perseguição Urbana",
      "efeito": "Mantém contato visual com alvos em ruas que você conhece."
     },
     {
      "nome": "Bloqueios e Interceptação",
      "efeito": "Prepare um bloqueio: o alvo precisa de teste para escapar."
     },
     {
      "nome": "Pilotagem Especial",
      "efeito": "Helicóptero, lancha e moto com o Campo como perícia."
     },
     {
      "nome": "Perseguição Total",
      "efeito": "Em uma perseguição, role duas vezes e fique com o melhor. Consome 1 Recurso."
     }
    ]
   }
  ]
 },
 {
  "key": "inteligencia",
  "no": 2,
  "nome": "Inteligência",
  "desc": "Coleta, análise e interpretação de informação estratégica. Quem vê o desenho inteiro enquanto os outros veem pedaços.",
  "nucleo": "Análise Básica (cruza dois documentos e encontra discrepâncias) · Dossiê (ao entregar um relatório formal, o mestre revela uma conexão adicional).",
  "campos": [
   {
    "nome": "Análise de Dados",
    "attr": "INT",
    "resumo": "Padrões, códigos e síntese de informação.",
    "marcos": [
     {
      "nome": "Reconhecimento de Padrões",
      "efeito": "Diante de 3 pistas relacionadas, o mestre indica que há um padrão. Teste (Dif. 9) revela o tipo."
     },
     {
      "nome": "Criptografia",
      "efeito": "Decifra códigos simples. Códigos complexos (Dif. 12) levam um dia."
     },
     {
      "nome": "Cruzamento de Bases",
      "efeito": "Una duas bases de dados e ganhe uma pista de profundidade sem teste."
     },
     {
      "nome": "Modelagem Preditiva",
      "efeito": "Antes de uma cena, pergunte onde Lupin pode agir. O mestre indica 1 entre 3 locais."
     },
     {
      "nome": "Síntese Estratégica",
      "efeito": "Uma vez por ato, una todas as pistas. O mestre revela o próximo passo de Lupin."
     }
    ]
   },
   {
    "nome": "Inteligência de Fontes",
    "attr": "CAR",
    "resumo": "Informantes, contatos e redes humanas.",
    "marcos": [
     {
      "nome": "Recrutamento",
      "efeito": "Transforme um contato em informante recorrente."
     },
     {
      "nome": "Avaliação de Fontes",
      "efeito": "Descubra se uma fonte mente ou exagera (Dif. 9)."
     },
     {
      "nome": "Rede de Contatos",
      "efeito": "Ganhe 2 Contatos de perfis distintos."
     },
     {
      "nome": "Dupla Checagem",
      "efeito": "Detecte desinformação plantada em informes recebidos."
     },
     {
      "nome": "Controle de Agentes",
      "efeito": "Uma vez por sessão, obtenha informação de sua rede sem teste."
     }
    ]
   },
   {
    "nome": "Contra-inteligência",
    "attr": "PER",
    "resumo": "Proteger segredos e achar quem os vaza.",
    "marcos": [
     {
      "nome": "Detecção de Vazamentos",
      "efeito": "Percebe que algo vazou e por qual canal."
     },
     {
      "nome": "Análise de Documentos",
      "efeito": "Identifica falsificações e adulterações."
     },
     {
      "nome": "Desinformação Controlada",
      "efeito": "Plante uma informação falsa. Lupin e aliados agirão sobre ela."
     },
     {
      "nome": "Segurança Operacional",
      "efeito": "Inimigos sofrem −2 para antecipar uma operação sua."
     },
     {
      "nome": "Caça à Toupeira",
      "efeito": "O mestre indica quem tem acesso suspeito aos dados."
     }
    ]
   },
   {
    "nome": "Geoespacial e Sinais",
    "attr": "INT",
    "resumo": "Mapas, rádio, rotas e imagens.",
    "marcos": [
     {
      "nome": "Mapas e Plantas",
      "efeito": "Deduza saídas e pontos cegos em plantas e mapas."
     },
     {
      "nome": "Interceptação de Rádio",
      "efeito": "Escuta transmissões em frequências comuns."
     },
     {
      "nome": "Triangulação de Sinais",
      "efeito": "Aproxima a posição de uma emissão a um bairro."
     },
     {
      "nome": "Análise de Rotas",
      "efeito": "Prevê o caminho de fuga mais provável entre 3 opções."
     },
     {
      "nome": "Imageamento Estratégico",
      "efeito": "Fotos e imagens aéreas localizam um esconderijo. Um uso por ato."
     }
    ]
   }
  ]
 },
 {
  "key": "forense",
  "no": 3,
  "nome": "Forense",
  "desc": "Análise de evidências, vestígios e reconstrução de cenas. Quem lê o que o crime deixou para trás.",
  "nucleo": "Cadeia de Custódia (evidência bem registrada vale +2 ao ser apresentada) · Coleta de Vestígios (coleta básica sem danificar a prova).",
  "campos": [
   {
    "nome": "Cena de Crime",
    "attr": "PER",
    "resumo": "Preservação e leitura de cenas.",
    "marcos": [
     {
      "nome": "Isolamento e Preservação",
      "efeito": "Pistas da cena permanecem disponíveis por mais uma cena antes de se perderem."
     },
     {
      "nome": "Reconstrução de Trajetória",
      "efeito": "Descobre de onde veio um tiro ou como alguém entrou (Dif. 9)."
     },
     {
      "nome": "Reconstrução de Sequência",
      "efeito": "Descobre a ordem em que os eventos aconteceram na cena."
     },
     {
      "nome": "Cena Forjada",
      "efeito": "Detecta uma cena manipulada. O mestre aponta 1 elemento falso."
     },
     {
      "nome": "Leitura Total da Cena",
      "efeito": "Uma vez por ato, peça ao mestre 3 fatos sobre o que ocorreu ali."
     }
    ]
   },
   {
    "nome": "Vestígios e Impressões",
    "attr": "PER",
    "resumo": "Digitais, fibras, caligrafia e peças raras.",
    "marcos": [
     {
      "nome": "Papiloscopia",
      "efeito": "Coleta e compara impressões digitais."
     },
     {
      "nome": "Fibras e Resíduos",
      "efeito": "Liga tecidos, poeiras e solos a lugares específicos."
     },
     {
      "nome": "Grafotecnia",
      "efeito": "Compara caligrafias e assinaturas."
     },
     {
      "nome": "Falsificações e Arte",
      "efeito": "Autentica ou desmascara documentos e obras."
     },
     {
      "nome": "Autenticação de Peças Raras",
      "efeito": "Identifica de imediato origem, dono anterior e se uma joia é cópia."
     }
    ]
   },
   {
    "nome": "Balística e Toxicologia",
    "attr": "INT",
    "resumo": "Armas, ferramentas, venenos e explosivos.",
    "marcos": [
     {
      "nome": "Balística Básica",
      "efeito": "Liga projétil e arma."
     },
     {
      "nome": "Marcas de Ferramenta",
      "efeito": "Identifica a ferramenta usada em arrombamentos e cofres."
     },
     {
      "nome": "Toxicologia",
      "efeito": "Identifica toxinas e drogas em amostras."
     },
     {
      "nome": "Explosivos e Resíduos",
      "efeito": "Determina tipo e origem de um explosivo."
     },
     {
      "nome": "Perícia Combinada",
      "efeito": "Cruze dois laudos e ganhe uma pista extra sem teste."
     }
    ]
   },
   {
    "nome": "Medicina Legal e Laboratório",
    "attr": "INT",
    "resumo": "Corpos, sangue, DNA e análises de campo.",
    "marcos": [
     {
      "nome": "Tanatologia",
      "efeito": "Estima o horário e a causa provável da morte."
     },
     {
      "nome": "Sangue e Tipagem",
      "efeito": "Lê padrões de manchas e determina tipo sanguíneo."
     },
     {
      "nome": "Genética Forense",
      "efeito": "Resultado de DNA em três dias de jogo."
     },
     {
      "nome": "Odontologia e Antropologia",
      "efeito": "Identifica restos e padrões de ferimento."
     },
     {
      "nome": "Laboratório Móvel",
      "efeito": "Análises de campo. Resultados que levariam dias saem em horas."
     }
    ]
   }
  ]
 },
 {
  "key": "investigacao",
  "no": 4,
  "nome": "Investigação",
  "desc": "Interrogatórios, vigilância, infiltração e investigação de suspeitos. Quem trabalha com gente, rua e paciência.",
  "nucleo": "Entrevista Básica (conversa de rotina com testemunhas: fatos simples sem teste) · Campana (vigilância a pé por algumas horas).",
  "campos": [
   {
    "nome": "Interrogatório",
    "attr": "CAR",
    "resumo": "Conversas difíceis com pessoas que não querem falar.",
    "marcos": [
     {
      "nome": "Rapport",
      "efeito": "+2 em primeiras conversas amistosas com testemunhas e suspeitos."
     },
     {
      "nome": "Leitura de Mentiras",
      "efeito": "Percebe quando o suspeito mente (Dif. 9), sem saber sobre o quê."
     },
     {
      "nome": "Pressão Psicológica",
      "efeito": "Causa Estresse social e arranca uma informação."
     },
     {
      "nome": "Confissão Dirigida",
      "efeito": "Conduz o suspeito a revelar seu próprio papel."
     },
     {
      "nome": "Interrogatório Mestre",
      "efeito": "Reduza em um nível a dificuldade ao interrogar alvo treinado."
     }
    ]
   },
   {
    "nome": "Vigilância e Campana",
    "attr": "PER",
    "resumo": "Seguir e observar sem ser visto.",
    "marcos": [
     {
      "nome": "Seguimento a Pé",
      "efeito": "Segue alvos em ambiente público."
     },
     {
      "nome": "Seguimento Veicular",
      "efeito": "Segue alvos de carro sem ser notado."
     },
     {
      "nome": "Vigilância Eletrônica",
      "efeito": "Grampos e escuta ambiental. Exige mandado ou cobra Credibilidade."
     },
     {
      "nome": "Equipe de Vigilância",
      "efeito": "Coordena 3 agentes. Perder o alvo exige falha dupla."
     },
     {
      "nome": "Olhos em Toda Parte",
      "efeito": "Uma vez por ato, monitore 3 locais ao mesmo tempo."
     }
    ]
   },
   {
    "nome": "Infiltração e Disfarce",
    "attr": "CAR",
    "resumo": "Entrar onde não foram convidados.",
    "marcos": [
     {
      "nome": "Identidade de Cobertura",
      "efeito": "Cria uma identidade falsa com documentos plausíveis."
     },
     {
      "nome": "Disfarce Físico",
      "efeito": "Altere sua aparência. Quem o conhece precisa de teste para reconhecer você."
     },
     {
      "nome": "Imersão Social",
      "efeito": "+2 em eventos de alta sociedade e ambientes fechados."
     },
     {
      "nome": "Agente Duplo",
      "efeito": "Mantenha duas lealdades. Uma vez por cena, afirme que um aliado é seu contato."
     },
     {
      "nome": "Infiltração Profunda",
      "efeito": "Permaneça infiltrado por um ato inteiro sem testes de exposição."
     }
    ]
   },
   {
    "nome": "Rua e Pesquisa",
    "attr": "INT",
    "resumo": "Informantes, arquivos e dinheiro.",
    "marcos": [
     {
      "nome": "Informantes de Rua",
      "efeito": "Ganha 1 Contato em qualquer bairro que visitar."
     },
     {
      "nome": "Pesquisa Documental",
      "efeito": "Encontra registros em arquivos e cartórios com rapidez."
     },
     {
      "nome": "Rastreamento de Dinheiro",
      "efeito": "Segue transações e esconderijos financeiros."
     },
     {
      "nome": "Arquivos Internacionais",
      "efeito": "Acesso a bases do FBI e polícias estrangeiras sem pedir autorização."
     },
     {
      "nome": "Faro do Caso",
      "efeito": "Uma vez por ato, o mestre indica a pista mais promissora ainda inexplorada."
     }
    ]
   }
  ]
 },
 {
  "key": "cibernetica",
  "no": 5,
  "nome": "Cibernética",
  "desc": "Rastreamento digital, invasão de sistemas, recuperação de dados e crimes tecnológicos. Em 2001, quase ninguém sabe o que vocês fazem, e todos precisam de vocês.",
  "nucleo": "Informática Básica (opera sistemas e redes comuns) · Segurança Digital (reconhece sinais de invasão e protege arquivos).",
  "campos": [
   {
    "nome": "Rastreamento Digital",
    "attr": "INT",
    "resumo": "Logs, linhas telefônicas e sinais.",
    "marcos": [
     {
      "nome": "Logs e Registros",
      "efeito": "Lê registros de acesso e identifica horários e usuários."
     },
     {
      "nome": "Rastreio de Linhas",
      "efeito": "Segue conexões e linhas fixas até uma origem."
     },
     {
      "nome": "Telefonia Móvel e Pagers",
      "efeito": "Obtém histórico de chamadas e mensagens de aparelhos de 2001."
     },
     {
      "nome": "Triangulação Móvel",
      "efeito": "Localiza um celular em uma região de poucas quadras."
     },
     {
      "nome": "Fantasma na Rede",
      "efeito": "Rastreia um alvo mesmo quando ele apagou seus passos. Dificuldade −1 nível."
     }
    ]
   },
   {
    "nome": "Invasão e Defesa",
    "attr": "INT",
    "resumo": "Entrar em sistemas e impedir que entrem.",
    "marcos": [
     {
      "nome": "Quebra de Senhas",
      "efeito": "Descobre senhas fracas ou padronizadas."
     },
     {
      "nome": "Engenharia Social",
      "efeito": "Convence alguém a revelar acessos (usa CAR ou INT)."
     },
     {
      "nome": "Intrusão em Sistemas",
      "efeito": "Invade redes corporativas e bancos de dados protegidos."
     },
     {
      "nome": "Defesa Ativa",
      "efeito": "Detecta uma invasão em curso e a bloqueia ou a rastreia."
     },
     {
      "nome": "Controle Remoto Total",
      "efeito": "Assume sistemas de segurança, portas e câmeras de um prédio por uma cena."
     }
    ]
   },
   {
    "nome": "Recuperação de Dados",
    "attr": "INT",
    "resumo": "Arquivos apagados e informação escondida.",
    "marcos": [
     {
      "nome": "Recuperação de Arquivos",
      "efeito": "Recupera arquivos apagados de discos e disquetes."
     },
     {
      "nome": "Análise de Mídias",
      "efeito": "Examina discos, fitas e CDs em busca de pistas."
     },
     {
      "nome": "Criptoanálise Prática",
      "efeito": "Quebra cifras de uso comercial e criminoso."
     },
     {
      "nome": "Esteganografia",
      "efeito": "Encontra mensagens escondidas em imagens, áudio e documentos."
     },
     {
      "nome": "Arquivo Impossível",
      "efeito": "Recupere dados de mídia danificada. Uma vez por ato."
     }
    ]
   },
   {
    "nome": "Sistemas e Fraudes",
    "attr": "INT",
    "resumo": "Alarmes, câmeras e dinheiro eletrônico.",
    "marcos": [
     {
      "nome": "Sistemas de Alarme",
      "efeito": "Entende e contorna alarmes comerciais."
     },
     {
      "nome": "CFTV",
      "efeito": "Recupera e analisa imagens de câmeras de vigilância."
     },
     {
      "nome": "Fraudes Bancárias",
      "efeito": "Identifica fraudes em transações e cartões."
     },
     {
      "nome": "Redes Financeiras",
      "efeito": "Segue dinheiro por contas e transferências internacionais."
     },
     {
      "nome": "Mestre de Sistemas Bancários",
      "efeito": "Congele ou desvie uma transação por uma cena."
     }
    ]
   }
  ]
 },
 {
  "key": "perfil-criminal",
  "no": 6,
  "nome": "Perfil Criminal",
  "desc": "Análise de comportamento, padrões e previsão das ações de criminosos. Quem pensa como o alvo sem se tornar o alvo.",
  "nucleo": "Psicologia Básica (lê estados emocionais comuns) · Leitura de Comportamento (percebe sinais de nervosismo, mentira e hostilidade).",
  "campos": [
   {
    "nome": "Análise Comportamental",
    "attr": "INT",
    "resumo": "Assinaturas, padrões e geografia do crime.",
    "marcos": [
     {
      "nome": "Assinatura Criminal",
      "efeito": "Identifica a \"assinatura\" de um autor em cenas de crime."
     },
     {
      "nome": "Padrões de Reincidência",
      "efeito": "Mostra quando e como o autor tende a agir de novo."
     },
     {
      "nome": "Perfil Geográfico",
      "efeito": "Estima onde o autor mora ou se esconde."
     },
     {
      "nome": "Perfil Psicológico Completo",
      "efeito": "Descreve valores, medos e limites do autor."
     },
     {
      "nome": "Prever o Próximo Passo",
      "efeito": "Uma vez por ato, o mestre indica o próximo alvo de Lupin entre duas opções."
     }
    ]
   },
   {
    "nome": "Psicologia do Alvo",
    "attr": "PER",
    "resumo": "Foco na mente do próprio Lupin.",
    "marcos": [
     {
      "nome": "Motivação",
      "efeito": "Entende por que Lupin escolheu um alvo específico."
     },
     {
      "nome": "Vaidade e Ego",
      "efeito": "Descobre como atrair Lupin para uma armadilha."
     },
     {
      "nome": "Hábitos e Disfarces",
      "efeito": "Reconhece traços de comportamento por trás dos disfarces."
     },
     {
      "nome": "Mente do Mestre-Ladrão",
      "efeito": "+2 contra planos e truques de Lupin."
     },
     {
      "nome": "Espelho de Lupin",
      "efeito": "Uma vez por ato, descreva o plano que Lupin faria, e o mestre diz o quanto você acertou."
     }
    ]
   },
   {
    "nome": "Negociação e Crise",
    "attr": "CAR",
    "resumo": "Conversas sob fogo cruzado.",
    "marcos": [
     {
      "nome": "Escuta Ativa",
      "efeito": "Ganha confiança de pessoas em crise."
     },
     {
      "nome": "Negociação com Reféns",
      "efeito": "+2 em negociações com reféns e sequestradores."
     },
     {
      "nome": "Desescalada",
      "efeito": "Reduz hostilidade de um grupo antes de o combate começar."
     },
     {
      "nome": "Mediação Política",
      "efeito": "Negocia entre facções e órgãos em conflito."
     },
     {
      "nome": "Acordo Impossível",
      "efeito": "Uma vez por ato, consiga um acordo entre partes que se recusam a conversar."
     }
    ]
   },
   {
    "nome": "Vitimologia e Testemunhas",
    "attr": "PER",
    "resumo": "Vítimas, memória e erro humano.",
    "marcos": [
     {
      "nome": "Entrevista Cognitiva",
      "efeito": "Obtém memória detalhada de testemunhas sem sugestão."
     },
     {
      "nome": "Memória e Falsos Testemunhos",
      "efeito": "Detecta falsas lembranças e relatos combinados."
     },
     {
      "nome": "Vitimologia",
      "efeito": "Entende por que a vítima foi escolhida."
     },
     {
      "nome": "Perfil de Quadrilha",
      "efeito": "Identifica papéis e hierarquia dentro de um grupo criminoso."
     },
     {
      "nome": "Reconstituição da Mente do Crime",
      "efeito": "O mestre explica a sequência de decisões do autor durante o crime."
     }
    ]
   }
  ]
 },
 {
  "key": "comando",
  "no": 7,
  "nome": "Comando",
  "desc": "Planejamento, coordenação de operações, gestão de recursos e liderança. Transformam talento isolado em equipe.",
  "nucleo": "Liderança (dá ordens claras e é obedecido por NPCs subordinados) · Protocolo Institucional (conhece trâmites e canais corretos).",
  "campos": [
   {
    "nome": "Planejamento Operacional",
    "attr": "INT",
    "resumo": "Planos, contingências e coordenação.",
    "marcos": [
     {
      "nome": "Briefing",
      "efeito": "Antes de uma operação, a equipe recebe +1 no primeiro teste."
     },
     {
      "nome": "Planos de Contingência",
      "efeito": "Uma vez por operação, ative um plano B sem custo de Estresse."
     },
     {
      "nome": "Coordenação Multiagências",
      "efeito": "Une DEIC, FBI e outras agências sem atrito burocrático."
     },
     {
      "nome": "Operação em Camadas",
      "efeito": "Divida a operação em duas frentes. Uma falha não derruba a outra."
     },
     {
      "nome": "Plano Perfeito",
      "efeito": "Uma vez por ato, flashbacks de preparação custam 1 Estresse a menos."
     }
    ]
   },
   {
    "nome": "Logística e Recursos",
    "attr": "INT",
    "resumo": "Equipamentos, verbas e apoio.",
    "marcos": [
     {
      "nome": "Requisição",
      "efeito": "Pedidos de equipamento padrão são atendidos na hora."
     },
     {
      "nome": "Orçamento e Verbas",
      "efeito": "Recupera 1 Recurso Institucional a mais a cada caso."
     },
     {
      "nome": "Apoio Aéreo",
      "efeito": "Solicita helicóptero ou drone com tempo de resposta curto."
     },
     {
      "nome": "Cadeia de Suprimento Internacional",
      "efeito": "Acesso a materiais do FBI no Brasil e do DEIC nos EUA."
     },
     {
      "nome": "Arsenal sob Demanda",
      "efeito": "Uma vez por ato, consiga qualquer equipamento razoável da lista."
     }
    ]
   },
   {
    "nome": "Liderança e Moral",
    "attr": "CAR",
    "resumo": "Equipes e pressão emocional.",
    "marcos": [
     {
      "nome": "Ordem Clara",
      "efeito": "Dê uma ordem a aliado e ele recebe +1 ao cumpri-la."
     },
     {
      "nome": "Inspirar",
      "efeito": "Gaste 1 Estresse e dê +2 a um aliado em um teste importante."
     },
     {
      "nome": "Gestão de Estresse",
      "efeito": "Ajude um aliado a recuperar 1 Estresse em uma cena de descanso."
     },
     {
      "nome": "Comando em Crise",
      "efeito": "Em situações de pânico, sua equipe não sofre penalidades de medo."
     },
     {
      "nome": "Autoridade Absoluta",
      "efeito": "Uma vez por ato, uma ordem sua é obedecida por NPCs subordinados sem teste."
     }
    ]
   },
   {
    "nome": "Política e Diplomacia",
    "attr": "CAR",
    "resumo": "Imprensa, leis e relações entre órgãos.",
    "marcos": [
     {
      "nome": "Relações com Imprensa",
      "efeito": "Reduza o dano de Credibilidade ao lidar com a mídia."
     },
     {
      "nome": "Mandados e Legislação",
      "efeito": "Conhece caminhos legais para mandados rápidos."
     },
     {
      "nome": "Cooperação Internacional",
      "efeito": "Negocia entre DEIC e FBI. Nenhuma das partes se sente desrespeitada."
     },
     {
      "nome": "Blindagem Política",
      "efeito": "Proteja um aliado de investigação interna por uma sessão."
     },
     {
      "nome": "Mão na Alta Cúpula",
      "efeito": "Uma vez por ato, abra um canal direto com um membro da Cúpula."
     }
    ]
   }
  ]
 }
]
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  Layers,
  Sparkles,
  Shield,
  Sword,
  Zap,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Check,
  Copy,
  Flame,
  Compass,
  Clock,
  Award,
  FileText,
  HelpCircle,
  History,
  Grid,
  List,
  ArrowRight,
  Menu,
  Info,
  SlidersHorizontal,
  Hash,
  Tag,
  Scale,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

// ============================================================================
// 1. TOP-LEVEL DATA CONSTANTS (Swap these out for your own Card Game Wiki)
// ============================================================================

export const GAME_META = {
  title: 'Hashire',
  tagline:
    'Jogo em Bot de Discord de Uma Musume feito por ganimeru @Mambo\nWiki mantida por capcatdev @Luís',
  version: 'v1',
  latestSet: '0.2',
  latestSetCode: 'SHM',
  releaseDate: '2026-10-15',
  totalCardsInSet: 180,
  patchSummary:
    'Patch v1.4.2 introduces keyword timing clarifications for Chronoshift, adjusts Solaris Shieldbearer health from 3 to 4, and updates Shatter interactions against multi-layered Ward barriers.',
  quickStats: [
    { label: 'Indexed Cards', value: '8 Sample / 180 Set' },
    { label: 'Core Keywords', value: '6 Mechanics' },
    { label: 'Current Format', value: 'Meridian Standard' },
    { label: 'Rules Version', value: 'CompRules 1.4.2' }
  ]
};

const TYPE_ICONS = {
  speed: {
    icon: '/cards/speed.png',
    ring: 'border-sky-400/70 bg-sky-950/60',
    label: 'Speed'
  },
  stamina: {
    icon: '/cards/stamina.png',
    ring: 'border-rose-400/70 bg-rose-950/60',
    label: 'Stamina'
  },
  power: {
    icon: '/cards/power.png',
    ring: 'border-amber-400/70 bg-amber-950/60',
    label: 'Power'
  },
  guts: {
    icon: '/cards/guts.png',
    ring: 'border-pink-400/70 bg-pink-950/60',
    label: 'Guts'
  },
  wits: {
    icon: '/cards/wits.png',
    ring: 'border-emerald-400/70 bg-emerald-950/60',
    label: 'Wits'
  }
};

export const KEYWORDS = [
  {
    id: 'vanguard',
    name: 'Vanguard',
    type: 'Static',
    reminderText:
      'Opponents must target or block this unit first if able when declaring attacks or single-target unit Staminas.',
    rulesExplanation:
      'Vanguard creates a combat and targeting priority lock while the unit is stationed in the Frontline Zone. As long as you control at least one ready or exhausted unit with Vanguard, opposing attackers cannot bypass it to strike your Commander directly, and single-target opposing Staminas that can legally target a unit must choose a Vanguard unit if one is legal.',
    edgeCases: [
      'If you control multiple units with Vanguard, the opposing player chooses which Vanguard unit to attack or target.',
      'Vanguard does not force opponents to target the unit with Staminas that explicitly specify "non-Vanguard" or target non-unit permanents like Powers.',
      'If a Vanguard unit is placed in the Astral Zone or loses its abilities, the targeting restriction ends immediately.'
    ]
  },
  {
    id: 'surge',
    name: 'Surge',
    type: 'Triggered',
    reminderText:
      'Triggers an additional bonus effect if you have cast at least one other Stamina earlier this turn.',
    rulesExplanation:
      'Surge checks the turn history at the exact moment a card is played or enters the battlefield. If the controller has already cast one or more Stamina cards during the current turn (regardless of whether those Staminas resolved or were countered), the Surge clause activates and resolves immediately after the card’s primary effect.',
    edgeCases: [
      'Playing a Unit, Power, or Guts card does not count toward activating Surge—only Stamina cards increment your Surge count.',
      'A Stamina with Surge does not count itself; you must have cast a different Stamina earlier in the same turn.',
      'Copies of Staminas created on the stack are not "cast" and therefore do not trigger Surge.'
    ]
  },
  {
    id: 'ward',
    name: 'Ward',
    type: 'Static',
    reminderText:
      'Opponents must pay 2 additional Aether whenever they target this permanent with a Stamina or activated ability.',
    rulesExplanation:
      'Ward is a protective tax applied during the cost-payment step of casting a Stamina or activating an ability. Whenever an opponent selects a permanent with Ward as one or more targets, the total Aether cost increases by 2 for each Ward permanent targeted. If the opponent cannot or refuses to pay the extra Aether, the targeting action is illegal and reversed.',
    edgeCases: [
      'Area-of-effect Staminas that do not use the word "target" (such as "Deal 2 damage to all units") bypass Ward completely.',
      'Multiple instances of Ward on the same permanent stack cumulatively (e.g., two instances of Ward require 4 extra Aether).',
      'Ward does not tax the permanent’s controller—you can target your own Ward units freely.'
    ]
  },
  {
    id: 'shatter',
    name: 'Shatter',
    type: 'Stamina Mechanic',
    reminderText:
      'Destroy target Power, or remove all Shield counters and Ward buffs from target Unit.',
    rulesExplanation:
      'Shatter is a modal destructive keyword found primarily on Ruin and Void Staminas or assassins. When resolving a Shatter effect, choose an eligible Power or Unit. If an Power is chosen, it is immediately destroyed and sent to its owner’s Scrapyard. If a Unit is chosen, all Shield counters and Ward abilities granted to it until end of turn are stripped away.',
    edgeCases: [
      'Stripping Ward with Shatter still requires you to pay the unit’s Ward cost when initially targeting it with the Shatter Stamina.',
      'Shatter can target an Power even if it has Indestructible; however, Indestructible prevents destruction while still triggering "when targeted" abilities.',
      'If a Unit has zero Shield counters and no Ward, it is still a legal target for Shatter to trigger secondary effects.'
    ]
  },
  {
    id: 'overclock',
    name: 'Overclock',
    type: 'Activated',
    reminderText:
      'Pay the listed Aether cost and exhaust this permanent during your Main Phase to trigger its overloaded system.',
    rulesExplanation:
      'Overclock represents pushing an Power or Guts conduit beyond safe limits. You may activate an Overclock ability at sorcery speed during your Main Phase if the permanent is currently ready (unexhausted) and you can pay its listed Overclock Aether cost. Exhausting the permanent is part of the activation cost.',
    edgeCases: [
      'Units with Overclock cannot activate Overclock on the same turn they enter play unless they have Haste.',
      'Because exhausting is paid as a cost, opponents cannot respond by exhausting the permanent to stop an Overclock already on the stack.',
      'If an Overclock ability states "Overclock 2", you pay 2 Aether plus exhaust the card.'
    ]
  },
  {
    id: 'chronoshift',
    name: 'Chronoshift',
    type: 'Triggered',
    reminderText:
      'When this card enters or leaves the Astral Zone, look at the top 2 cards of your deck (Scry 2) and gain 1 temporary Aether.',
    rulesExplanation:
      'Chronoshift rewards temporal manipulation and exile-zone cycling. Whenever a card with Chronoshift is banished to the Astral Zone from any zone—or returns from the Astral Zone to the field or your hand—its controller immediately looks at the top 2 cards of their deck, puts any number on the bottom in any order, and adds 1 temporary Aether to their pool until end of phase.',
    edgeCases: [
      'Temporary Aether gained from Chronoshift empties when the current phase ends if unspent.',
      'If a card with Chronoshift is banished face-down, Chronoshift does not trigger because its characteristics are hidden.',
      'Flickering a card (banishing to the Astral Zone and immediately returning it) triggers Chronoshift twice—once on entry and once on exit.'
    ]
  }
];

export const CARDS = [
  {
    slug: 'aston-machan',
    name: 'Aston Machan',
    type: 'Speed',
    rarity: 'R',
    image: '/cards/aston_machan_R.png',
    collectorNumber: '001',
    keywords: [],
    cardText:
      'Frontrunner, Mid\n+25 Speed\n Sem Skill',
    cardActionText:
      '**Coroa da Machan**\n__Correndo de Front Runner:__\n**Sempre no Mid:** +2 Casas - Dispara sozinha no 1° turno do mid (ao passar 1/6 do percurso)\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Mid:** +2 Casas\n**Caiu no Early ou no Late:** +1 Casa',
    flavorText:
      '"Não esqueça dela."',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      'Use essa carta para ganhar vantagem no Mid, e se possível, use ela junto com cartas que aumentem a velocidade do Mid.',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'biko-pegasus',
    name: 'Biko Pegasus',
    type: 'Speed',
    rarity: 'R',
    image: '/cards/biko_pegasus_R.png',
    collectorNumber: '002',
    keywords: [],
    cardText:
      'End Closer, Early\n+25 Speed\n Sem Skill',
    cardActionText:
      '**Voo de Pégaso**\n__Correndo de End Closer:__\n**Sempre no Early:** +2 Face Máxima - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima\n**Caiu no Mid ou no Late:** +1 Casa',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      'Use essa carta para ganhar vantagem no Early, e se possível, use ela junto com cartas que aumentem a velocidade do Early.',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'satono_diamond',
    name: 'Satono Diamond',
    type: 'Stamina',
    rarity: 'R',
    image: '/cards/satono_diamond_R.png',
    collectorNumber: '003',
    keywords: [],
    cardText:
      'Late Surger, End Closer, Mid\n+25 Stamina\n Sem Skill',
    cardActionText:
      '**Brilho de Diamante**\n__Correndo de Late Surger ou End Closer:__\n**Sempre no Mid:** +1 Face Mínima e +1 Casa por 2 Turnos - Dispara sozinha no 1° turno do mid (ao passar de 1/6 do percurso)\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Mid:** +1 Face Mínima e +1 Casa por 2 Turnos\n**Caiu no Early ou no Late:** +1 Face Mínima.',
    flavorText:
      '"Você é meu treinador agora, não resista!"',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      ' ',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'zenno_rob_roy',
    name: 'Zenno Rob Roy',
    type: 'Stamina',
    rarity: 'R',
    image: '/cards/zenno_rob_roy_R.png',
    collectorNumber: '004',
    keywords: [],
    cardText:
      'Front Runner, Late\n+25 Stamina\n Sem Skill',
    cardActionText:
      '**Leitura de Ritmo**\n__Correndo de Front Runner:__\n**Sempre no Late:** +1 Casa por 2 Turnos - Dispara sozinha no 1° turno do late (ao passar de 4/6 do percurso)\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Late:** +1 Casa por 2 Turnos\n**Caiu no Mid ou no Early:** +1 Casa',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'yaeno_muteki',
    name: 'Yaeno Muteki',
    type: 'Power',
    rarity: 'R',
    image: '/cards/yaeno_muteki_R.png',
    collectorNumber: '005',
    keywords: [],
    cardText:
      'Pace Chaser, Late\n+25 Power\n Sem Skill',
    cardActionText:
      '**Golpe Invencível**\n__Correndo de Pace Chaser:__\n**Sempre no Late:** +1 Face Mínima e +1 Casa - Dispara sozinha no 1° turno do late (ao passar de 4/6 do percurso)\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Late:** +1 Face Mínima e +1 Casa\n**Caiu no Mid ou no Early:** +1 Face Mínima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'bamboo_memory',
    name: 'Bamboo Memory',
    type: 'Power',
    rarity: 'R',
    image: '/cards/bamboo_memory_R.png',
    collectorNumber: '006',
    keywords: [],
    cardText:
      'Late Surger, Early\n+25 Power\n Sem Skill',
    cardActionText:
      '**Disciplina Total**\n__Correndo de Late Surger:__\n**Sempre no Early:** +1 Face Máxima e +1 Casa - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima e +1 Casa\n**Caiu no Mid ou no Late:** +1 Face Máxima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'matikanetannhauser',
    name: 'Matikanetannhauser',
    type: 'Guts',
    rarity: 'R',
    image: '/cards/matikanetannhauser_R.png',
    collectorNumber: '007',
    keywords: [],
    cardText:
      'Late Surger, Early\n+25 Power\n Sem Skill',
    cardActionText:
      '**Disciplina Total**\n__Correndo de Late Surger:__\n**Sempre no Early:** +1 Face Máxima e +1 Casa - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima e +1 Casa\n**Caiu no Mid ou no Late:** +1 Face Máxima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'winning_ticket',
    name: 'Winning Ticket',
    type: 'Guts',
    rarity: 'R',
    image: '/cards/winning_ticket_R.png',
    collectorNumber: '008',
    keywords: [],
    cardText:
      'Late Surger, Early\n+25 Power\n Sem Skill',
    cardActionText:
      '**Disciplina Total**\n__Correndo de Late Surger:__\n**Sempre no Early:** +1 Face Máxima e +1 Casa - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima e +1 Casa\n**Caiu no Mid ou no Late:** +1 Face Máxima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'matikanefukukitaru',
    name: 'Matikanefukukitaru',
    type: 'Wits',
    rarity: 'R',
    image: '/cards/matikanefukukitaru_R.png',
    collectorNumber: '009',
    keywords: [],
    cardText:
      'Late Surger, Early\n+25 Power\n Sem Skill',
    cardActionText:
      '**Disciplina Total**\n__Correndo de Late Surger:__\n**Sempre no Early:** +1 Face Máxima e +1 Casa - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima e +1 Casa\n**Caiu no Mid ou no Late:** +1 Face Máxima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  },
  {
    slug: 'ikuno_dictus',
    name: 'Ikuno Dictus',
    type: 'Wits',
    rarity: 'R',
    image: '/cards/ikuno_dictus_R.png',
    collectorNumber: '010',
    keywords: [],
    cardText:
      'Late Surger, Early\n+25 Power\n Sem Skill',
    cardActionText:
      '**Disciplina Total**\n__Correndo de Late Surger:__\n**Sempre no Early:** +1 Face Máxima e +1 Casa - Dispara sozinha no 1° turno da corrida\n__Em Outro Estilo:__ etapa sorteada na largada (1 em 3)\n**Caiu no Early:** +1 Face Máxima e +1 Casa\n**Caiu no Mid ou no Late:** +1 Face Máxima',
    flavorText:
      '" "',
    rulings: [
      {
        question:
          'Exemplo de Pergunta Frequente',
        answer:
          'Quando muitas perguntas forem feitas sobre essa carta em especifico, será adicionado aqui. Avisar capcatdev no discord caso uma pergunta frequente nova apareça.'
      }
    ],
    interactionNotes:
      '',
    patchHistory: [
      {
        version: 'v1',
        date: '18/11/2026',
        note: 'Adicionada ao banco de dados inicial das cartas'
      }
    ],
    artConfig: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      motif: 'shield'
    }
  }
];

export const RULES = {
  objective: {
    title: 'Game Objective & Win Conditions',
    summary:
      'Reduce the opposing Commander’s Life total from 25 to 0, or force your opponent to attempt to draw from an empty Main Deck.',
    details: [
      'Each player begins the match with 25 Commander Life and a 40-card Main Deck plus a 10-card Guts Conduit Deck.',
      'If both Commanders reach 0 Life simultaneously during the resolution of a single effect, the match ends in a Draw.',
      'A player immediately loses the match as a state-based action if they must draw a card while their Main Deck contains 0 cards.'
    ]
  },
  setup: [
    {
      step: 1,
      title: 'Present Decks & Roll for Initiative',
      description:
        'Each player shuffles their 40-card Main Deck and 10-card Guts Deck separately. Determine the starting player via a random roll; the winner chooses whether to play first or second.'
    },
    {
      step: 2,
      title: 'Draw Opening Hand & Mulligan',
      description:
        'Each player draws an opening hand of 5 cards. Once per game, each player may select any number of cards from their opening hand, place them on the bottom of their Main Deck, and draw that many replacement cards.'
    },
    {
      step: 3,
      title: 'Initialize Commander & Starting Aether',
      description:
        'Set both Commanders to 25 Life. The second player begins the game with 1 temporary Aether Shard token in their Reserve Zone to offset the first-turn initiative advantage.'
    },
    {
      step: 4,
      title: 'Deploy Initial Guts Conduit',
      description:
        'Before Turn 1 begins, both players reveal the top card of their Guts Deck and place it into their Conduit Zone ready.'
    }
  ],
  phases: [
    {
      id: 'start',
      number: '01',
      name: 'Start Phase',
      shortDesc: 'Ready all exhausted permanents, deploy a Guts, and resolve start-of-turn triggers.',
      substeps: [
        'Ready Step: Simultaneously ready (unexhaust) all Units, Powers, and Guts Conduits you control.',
        'Conduit Step: Deploy the top card of your Guts Deck into your Conduit Zone (up to a maximum of 10 Conduits).',
        'Upkeep Step: All "At the start of your turn" triggered abilities are placed on the stack and resolved in active-player order.'
      ],
      priorityNote:
        'Players receive priority to cast Instant-speed Staminas after Upkeep triggers are placed on the stack.'
    },
    {
      id: 'draw',
      number: '02',
      name: 'Draw Phase',
      shortDesc: 'The active player draws 1 card from their Main Deck.',
      substeps: [
        'Standard Draw: The active player draws the top card of their Main Deck.',
        'First-Turn Exception: The player going first skips their Draw Step on Turn 1.',
        'Draw Triggers: Any abilities triggered by drawing a card resolve before proceeding to the Main Phase.'
      ],
      priorityNote:
        'Both players gain a brief priority window after the card draw before transitioning to Main Phase.'
    },
    {
      id: 'main',
      number: '03',
      name: 'Main Phase',
      shortDesc: 'Play Units, Powers, and Sorcery/Instant Staminas, and activate Overclock abilities.',
      substeps: [
        'Play Cards: Spend Aether from your Conduits to deploy Units to the Frontline, place Powers in the Support Row, or cast Staminas.',
        'Activate Abilities: Activate Overclock and other abilities on permanents you control.',
        'Sequence Surge: Cast low-cost Staminas early in the Main Phase to unlock Surge bonuses on subsequent cards.'
      ],
      priorityNote:
        'Active player holds full sorcery-speed priority whenever the stack is empty.'
    },
    {
      id: 'combat',
      number: '04',
      name: 'Combat / Action Phase',
      shortDesc: 'Declare attackers, assign Vanguard/standard blockers, and calculate simultaneous combat damage.',
      substeps: [
        'Declare Attackers: Exhaust any number of ready Units (that do not have summoning sickness) and assign them to attack the opposing Commander or an exhausted opposing Unit.',
        'Declare Blockers: The defending player assigns ready Units to block attackers. If the defender controls a ready Vanguard unit, at least one attacker must be blocked by a Vanguard unit.',
        'Combat Trick Window: Both players may cast Instant Staminas or activate combat abilities.',
        'Damage Resolution: Attackers and blockers deal damage equal to their Attack simultaneously. Units with damage equal to or exceeding their Health are destroyed.'
      ],
      priorityNote:
        'Combat damage does not use the stack—once the Combat Trick Window closes, damage is applied immediately.'
    },
    {
      id: 'end',
      number: '05',
      name: 'End Phase',
      shortDesc: 'Resolve end-of-turn triggers, clear temporary Aether/damage, and pass the turn.',
      substeps: [
        'End Step: Trigger all "At the end of your turn" or "At the start of the End Phase" effects (such as Chronos Astrolabe returns).',
        'Cleanup Step: Discard down to the maximum hand size of 7 cards. All temporary Aether empties, until-end-of-turn buffs expire, and unmarked damage on Units is healed.',
        'Pass Turn: Initiative passes to the opponent.'
      ],
      priorityNote:
        'No player receives priority during the Cleanup Step unless an ability triggers from discarding.'
    }
  ],
  deckbuilding: [
    {
      title: 'Main Deck Size',
      value: 'Exactly 40 Cards',
      detail: 'Must contain Units, Staminas, and Powers. Guts cards belong exclusively in the Guts Deck.'
    },
    {
      title: 'Guts Deck Size',
      value: '10 Cards',
      detail: 'Separate 10-card deck of Guts Conduits. One is deployed automatically during each Start Phase.'
    },
    {
      title: 'Card Copy Limit',
      value: 'Up to 3 Copies (1 for Legendary)',
      detail: 'You may include up to 3 copies of any Common, Uncommon, or Rare card, and at most 1 copy of each Legendary card.'
    },
    {
      title: 'Faction Alignment',
      value: 'Up to 2 Factions + Neutral',
      detail: 'Constructed decks may combine cards from at most two Factions alongside any number of Neutral cards.'
    }
  ]
};

// ============================================================================
// 2. STYLING HELPERS & RARITY / FACTION MAPS
// ============================================================================

const RARITY_ICONS = {
  R: '/cards/r_rarity.png',
  SR: '/cards/sr_rarity.png',
  SSR: '/cards/ssr_rarity.png'
};

const RARITY_STYLES = {
  R: {
    border: 'border-zinc-500/70',
    glow: 'shadow-zinc-500/10',
    badge: 'bg-zinc-800/90 text-zinc-200 border-zinc-600/70',
    dot: 'bg-zinc-400'
  },
  SR: {
    border: 'border-amber-400/80',
    glow: 'shadow-amber-500/15',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
    dot: 'bg-amber-400'
  },
  SSR: {
    border: 'border-fuchsia-400/80',
    glow: 'shadow-fuchsia-500/20',
    badge: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/60',
    dot: 'bg-fuchsia-400'
  }
};

const MECHANIC_TYPE_STYLES = {
  Static: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
  Triggered: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  Activated: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  'Stamina Mechanic': 'bg-purple-950/80 text-purple-300 border-purple-700/60'
};

const FACTION_ACCENTS = {
  'Solaris Enclave': 'text-amber-400',
  'Aetherwright Guild': 'text-cyan-400',
  Voidwalkers: 'text-purple-400',
  Neutral: 'text-emerald-400'
};

// ============================================================================
// 3. BESPOKE SVG/CSS CARD FRAME ILLUSTRATION COMPONENT (Zero Broken Images)
// ============================================================================

function CardArtSvg({ card }) {
  const { primaryColor, secondaryColor, accentColor, motif } = card.artConfig;
  const uid = `art-${card.slug}`;

  return (
    <svg
      viewBox="0 0 320 200"
      className="w-full h-full object-cover block select-none"
      aria-label={`${card.name} custom vector illustration`}
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="0.38" />
          <stop offset="55%" stopColor={accentColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${uid}-beam`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9" />
          <stop offset="50%" stopColor={primaryColor} stopOpacity="0.7" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
        </linearGradient>
        <pattern id={`${uid}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke={primaryColor}
            strokeOpacity="0.09"
            strokeWidth="0.75"
          />
        </pattern>
      </defs>

      {/* Atmospheric Backdrop */}
      <rect width="320" height="200" fill="#09090b" />
      <rect width="320" height="200" fill={`url(#${uid}-bg)`} />
      <rect width="320" height="200" fill={`url(#${uid}-grid)`} />

      {/* Celestial Orbital Rings */}
      <circle
        cx="160"
        cy="100"
        r="76"
        fill="none"
        stroke={primaryColor}
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <circle
        cx="160"
        cy="100"
        r="54"
        fill="none"
        stroke={secondaryColor}
        strokeOpacity="0.18"
        strokeWidth="0.75"
      />

      {/* Motif-specific Central Emblem */}
      {motif === 'shield' && (
        <g transform="translate(160, 100)">
          <path
            d="M 0 -54 L 44 -34 L 38 18 C 34 40 16 54 0 62 C -16 54 -34 40 -38 18 L -44 -34 Z"
            fill={`url(#${uid}-beam)`}
            fillOpacity="0.22"
            stroke={secondaryColor}
            strokeWidth="2"
          />
          <path
            d="M 0 -38 L 28 -24 L 24 12 C 21 26 10 36 0 42 C -10 36 -21 26 -24 12 L -28 -24 Z"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          />
          <line x1="0" y1="-38" x2="0" y2="42" stroke={secondaryColor} strokeWidth="1.2" />
          <line x1="-26" y1="-4" x2="26" y2="-4" stroke={secondaryColor} strokeWidth="1.2" />
        </g>
      )}

      {motif === 'vortex' && (
        <g transform="translate(160, 100)">
          {[0, 45, 90, 135].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="0"
              rx="62"
              ry="20"
              transform={`rotate(${deg})`}
              fill="none"
              stroke={deg % 90 === 0 ? secondaryColor : primaryColor}
              strokeOpacity="0.65"
              strokeWidth="1.4"
            />
          ))}
          <circle cx="0" cy="0" r="14" fill={secondaryColor} fillOpacity="0.85" />
          <circle cx="0" cy="0" r="22" fill="none" stroke={primaryColor} strokeWidth="1.5" />
        </g>
      )}

      {motif === 'fracture' && (
        <g transform="translate(160, 100)">
          <polygon
            points="-12,-64 18,-22 4,-16 32,26 -6,12 8,62 -28,14 -10,6 -36,-32"
            fill={`url(#${uid}-beam)`}
            stroke={secondaryColor}
            strokeWidth="1.8"
          />
          <line x1="-65" y1="-45" x2="65" y2="45" stroke={primaryColor} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="65" y1="-45" x2="-65" y2="45" stroke={primaryColor} strokeWidth="1" strokeDasharray="3 3" />
        </g>
      )}

      {motif === 'astrolabe' && (
        <g transform="translate(160, 100)">
          <circle cx="0" cy="0" r="56" fill="none" stroke={secondaryColor} strokeWidth="2" />
          <circle cx="0" cy="0" r="42" fill="none" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="8 3" />
          <polygon points="0,-56 48,28 -48,28" fill="none" stroke={secondaryColor} strokeOpacity="0.6" strokeWidth="1.2" />
          <polygon points="0,56 48,-28 -48,-28" fill="none" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="10" fill={primaryColor} />
        </g>
      )}

      {motif === 'valkyrie' && (
        <g transform="translate(160, 100)">
          <path
            d="M -68 -18 C -42 -48 -18 -36 -6 -10 C -22 -14 -42 -8 -68 -18 Z"
            fill={`url(#${uid}-beam)`}
            stroke={secondaryColor}
            strokeWidth="1.4"
          />
          <path
            d="M 68 -18 C 42 -48 18 -36 6 -10 C 22 -14 42 -8 68 -18 Z"
            fill={`url(#${uid}-beam)`}
            stroke={secondaryColor}
            strokeWidth="1.4"
          />
          <polygon points="0,-52 14,0 0,56 -14,0" fill={secondaryColor} fillOpacity="0.85" />
          <circle cx="0" cy="-24" r="16" fill="none" stroke={primaryColor} strokeWidth="1.8" />
        </g>
      )}

      {motif === 'blade' && (
        <g transform="translate(160, 100)">
          <polygon
            points="0,-64 14,-12 6,36 0,54 -6,36 -14,-12"
            fill={`url(#${uid}-beam)`}
            stroke={secondaryColor}
            strokeWidth="1.6"
          />
          <polygon points="-28,12 28,12 18,20 -18,20" fill={primaryColor} />
          <circle cx="0" cy="-16" r="6" fill="#09090b" stroke={secondaryColor} strokeWidth="1.4" />
        </g>
      )}

      {motif === 'lattice' && (
        <g transform="translate(160, 100)">
          <polygon points="0,-54 47,-27 47,27 0,54 -47,27 -47,-27" fill="none" stroke={secondaryColor} strokeWidth="1.8" />
          <polygon points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16" fill={`url(#${uid}-beam)`} fillOpacity="0.25" stroke={primaryColor} strokeWidth="1.4" />
          <line x1="0" y1="-54" x2="0" y2="54" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="1" />
          <line x1="-47" y1="-27" x2="47" y2="27" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="1" />
          <line x1="47" y1="-27" x2="-47" y2="27" stroke={primaryColor} strokeOpacity="0.6" strokeWidth="1" />
        </g>
      )}

      {motif === 'spire' && (
        <g transform="translate(160, 100)">
          <polygon points="0,-66 22,48 -22,48" fill={`url(#${uid}-beam)`} fillOpacity="0.3" stroke={secondaryColor} strokeWidth="1.6" />
          <polygon points="0,-42 10,48 -10,48" fill="none" stroke={primaryColor} strokeWidth="1.2" />
          <circle cx="0" cy="-32" r="9" fill={secondaryColor} />
          <line x1="-48" y1="48" x2="48" y2="48" stroke={primaryColor} strokeWidth="2" />
        </g>
      )}

      {/* Corner Set Sigil */}
      <text
        x="306"
        y="188"
        textAnchor="end"
        fill={secondaryColor}
        fillOpacity="0.55"
        fontSize="9"
        fontFamily="monospace"
      >
        {card.setCode} · #{card.collectorNumber.split('/')[0]}
      </text>
    </svg>
  );
}

function FormattedText({ text }) {
  if (!text) return null;

  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

  return (
    <span className="whitespace-pre-line">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-zinc-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('__') && part.endsWith('__')) {
          return (
            <span key={i} className="underline underline-offset-2 decoration-zinc-400">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

function CardFrameIllustration({ card, compact = false }) {
  const rarityKey = card.rarity?.toUpperCase();
  const rarityIcon = RARITY_ICONS[rarityKey];
  const rarityStyle = RARITY_STYLES[rarityKey] || RARITY_STYLES.R;
  const typeInfo = TYPE_ICONS[card.type?.toLowerCase()];

  return (
    <div
      className={`rounded-xl bg-zinc-950 border-2 ${rarityStyle.border} ${rarityStyle.glow} overflow-hidden flex flex-col transition-all duration-200`}
    >
      {/* Top Card Header Bar */}
      <div className="px-3 py-2 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between gap-2">
        <span className="font-semibold text-zinc-100 text-xs sm:text-sm truncate">
          {card.name}
        </span>
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center ${
            typeInfo ? '' : 'text-zinc-300 font-mono text-xs font-bold'
          }`}
          title={`Tipo: ${typeInfo ? typeInfo.label : card.type}`}
        >
          {typeInfo ? (
            <img
              src={typeInfo.icon}
              alt={typeInfo.label}
              className="w-7 h-7 object-contain"
            />
          ) : (
            card.type
          )}
        </span>
      </div>

      {/* Art Frame */}
        <div className="relative w-full aspect-[3/4] bg-zinc-950 overflow-hidden">
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <CardArtSvg card={card} />
          )}
        </div>

      {/* Type & Rarity Strip */}
      <div className="px-3 py-1.5 bg-zinc-900 border-y border-zinc-800 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-zinc-300 font-medium truncate">
          {card.type}
        </span>
        {rarityIcon ? (
          <img
            src={rarityIcon}
            alt={rarityKey}
            className="h-5 w-auto object-contain shrink-0"
          />
        ) : (
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${rarityStyle.badge}`}>
            {card.rarity}
          </span>
        )}
      </div>

      {/* Card Rules Preview Box */}
      <div className="p-3 bg-zinc-950/90 flex-1 flex flex-col justify-between gap-2">
        <p className={`text-zinc-300 whitespace-pre-line leading-relaxed ${compact ? 'text-[11px] line-clamp-3' : 'text-xs'}`}>
          {card.cardText}
        </p>

        {/* Bottom Stats / Faction Footer */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
          <span className={`font-medium ${FACTION_ACCENTS[card.faction] || 'text-zinc-400'}`}>
            {card.faction}
          </span>

          {card.type === 'W' ? (
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-300">
                <Sword className="w-3 h-3" />
                {card.attack}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-700/60 text-sky-300">
                <Shield className="w-3 h-3" />
                {card.health}
              </span>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-zinc-500 uppercase">
              {card.type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. INTERACTIVE KEYWORD TOKENIZER FOR CARD TEXT (Tooltip + Glossary Jump)
// ============================================================================

function InteractiveCardText({ text, onJumpToKeyword }) {
  const [openKeywordId, setOpenKeywordId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenKeywordId(null);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const keywordMap = useMemo(() => {
    const map = {};
    KEYWORDS.forEach((kw) => {
      map[kw.name.toLowerCase()] = kw;
    });
    return map;
  }, []);

  const pattern = useMemo(() => {
    if (!KEYWORDS.length) return null;
    const names = KEYWORDS.map((k) => k.name).join('|');
    return new RegExp(`\\b(${names})\\b`, 'gi');
  }, []);

  if (!text) return null;

  const renderKeywords = (segment, keyPrefix) => {
    if (!pattern) return segment;

    const parts = segment.split(pattern);
    return parts.map((part, partIdx) => {
      const matchedKw = keywordMap[part.toLowerCase()];
      if (!matchedKw) {
        return <React.Fragment key={`${keyPrefix}-${partIdx}`}>{part}</React.Fragment>;
      }

      const tokenKey = `${keyPrefix}-${partIdx}-${matchedKw.id}`;
      const isOpen = openKeywordId === tokenKey;

      return (
        <span
          key={tokenKey}
          className="relative inline-block mx-0.5"
          onMouseEnter={() => setOpenKeywordId(tokenKey)}
          onMouseLeave={() => setOpenKeywordId(null)}
        >
          <button
            type="button"
            onClick={() => setOpenKeywordId(isOpen ? null : tokenKey)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-700/70 font-semibold text-xs sm:text-sm transition-colors cursor-pointer align-baseline"
            aria-expanded={isOpen}
          >
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            {part}
          </button>

          {isOpen && (
            <span
              role="tooltip"
              className="block z-30 absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-left"
            >
              <span className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                  {matchedKw.name}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    MECHANIC_TYPE_STYLES[matchedKw.type] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {matchedKw.type}
                </span>
              </span>
              <span className="block text-xs italic text-zinc-400 mb-2">
                {matchedKw.reminderText}
              </span>
              <span className="block text-xs text-zinc-300 leading-relaxed mb-3">
                {matchedKw.rulesExplanation}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpenKeywordId(null);
                  onJumpToKeyword(matchedKw.id);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
              >
                View in Keyword Glossary
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </span>
      );
    });
  };

  const lines = text.split('\n');

  return (
    <div ref={containerRef} className="space-y-2 text-sm sm:text-base text-zinc-200 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const formattedParts = line.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

        return (
          <p key={lineIdx} className="leading-7 min-h-[1.75rem]">
            {formattedParts.map((part, fmtIdx) => {
              const keyPrefix = `${lineIdx}-${fmtIdx}`;

              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={keyPrefix} className="font-bold text-white">
                    {renderKeywords(part.slice(2, -2), keyPrefix)}
                  </strong>
                );
              }

              if (part.startsWith('__') && part.endsWith('__')) {
                return (
                  <span key={keyPrefix} className="underline underline-offset-4 decoration-zinc-400">
                    {renderKeywords(part.slice(2, -2), keyPrefix)}
                  </span>
                );
              }

              return (
                <React.Fragment key={keyPrefix}>
                  {renderKeywords(part, keyPrefix)}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

// ============================================================================
// 5. GLOBAL NAVBAR & LIVE INSTANT SEARCH BAR
// ============================================================================

function GlobalSearchBox({ navigate, placeholder = 'Procure por cartas, palavras-chave e regras...', large = false }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setFocused(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { cards: [], keywords: [] };
    const matchedCards = CARDS.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.subtype?.toLowerCase().includes(q) ||
          c.faction?.toLowerCase().includes(q) ||
          c.cardText?.toLowerCase().includes(q) ||
          (c.cardActionText || '').replace(/(\*\*|__)/g, '').toLowerCase().includes(q)
      ).slice(0, 5);

    const matchedKeywords = KEYWORDS.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.reminderText.toLowerCase().includes(q) ||
        k.type.toLowerCase().includes(q)
    ).slice(0, 4);

    return { cards: matchedCards, keywords: matchedKeywords };
  }, [query]);

  const hasResults = results.cards.length > 0 || results.keywords.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className={`flex items-center bg-zinc-900/90 border ${
          focused ? 'border-cyan-500/70 ring-2 ring-cyan-500/20' : 'border-zinc-800 hover:border-zinc-700'
        } rounded-xl transition-all ${large ? 'px-4 py-3.5' : 'px-3 py-1.5'}`}
      >
        <Search className={`${large ? 'w-5 h-5' : 'w-4 h-4'} text-zinc-400 shrink-0 mr-2.5`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none ${
            large ? 'text-base' : 'text-sm'
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          !large && (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded">
              /
            </kbd>
          )
        )}
      </div>

      {/* Live Autocomplete Dropdown */}
      {focused && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden z-50">
          {!hasResults ? (
            <div className="p-4 text-sm text-zinc-400 text-center">
              No matching cards or keywords found for <span className="text-zinc-200 font-medium">"{query}"</span>.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80 max-h-96 overflow-y-auto">
              {results.keywords.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Keywords & Mechanics
                  </div>
                  {results.keywords.map((kw) => (
                    <button
                      key={kw.id}
                      type="button"
                      onClick={() => {
                        setFocused(false);
                        setQuery('');
                        navigate(`/keywords`, { highlightKeyword: kw.id });
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-cyan-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {kw.name}
                        </div>
                        <div className="text-xs text-zinc-400 line-clamp-1">{kw.reminderText}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 shrink-0">
                        {kw.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.cards.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Cards
                  </div>
                  {results.cards.map((card) => (
                    <button
                      key={card.slug}
                      type="button"
                      onClick={() => {
                        setFocused(false);
                        setQuery('');
                        navigate(`/cards/${card.slug}`);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-100 truncate">{card.name}</div>
                        <div className="text-xs text-zinc-400 truncate">
                          {card.type} · {card.faction} · {card.rarity}
                        </div>
                      </div>
                      <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700 text-cyan-300 font-mono text-xs flex items-center justify-center">
                        {card.cost}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Navbar({ currentPath, navigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: Compass },
    { label: 'Cartas', path: '/cards', icon: Layers },
    { label: 'Glossário', path: '/keywords', icon: Sparkles },
    { label: 'Como Jogar', path: '/rules', icon: BookOpen }
  ];

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo + Version Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-cyan-500/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-zinc-100 text-base sm:text-lg group-hover:text-cyan-300 transition-colors">
                {GAME_META.title}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                Wiki
              </span>
            </div>
          </button>
          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
            {GAME_META.version}
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Global Search Bar */}
        <div className="hidden sm:block w-56 lg:w-72">
          <GlobalSearchBox navigate={navigate} />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-5 space-y-3">
          <div className="sm:hidden">
            <GlobalSearchBox navigate={navigate} />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                    active
                      ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-zinc-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

// ============================================================================
// 6. VIEW 1: HOME PORTAL (/)
// ============================================================================

function HomePortalView({ navigate }) {
  const featuredCards = useMemo(() => [...CARDS].slice(-4).reverse(), []);

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-zinc-950 to-zinc-950 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ruleset {GAME_META.version}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-cyan-300">Patch atual: {GAME_META.latestSet}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-50">
            {GAME_META.title}{' '}
            <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Wiki
            </span>
          </h1>

          <p className="whitespace-pre-line text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto text-center leading-relaxed">
  {GAME_META.tagline}
</p>

          {/* Prominent Hero Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <GlobalSearchBox
              navigate={navigate}
              large
              placeholder="Jump to any card (e.g. Valkyrie) or keyword (e.g. Surge, Ward)..."
            />
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto">
            {GAME_META.quickStats.map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center"
              >
                <div className="text-xs font-mono text-zinc-500">{stat.label}</div>
                <div className="text-sm font-semibold text-zinc-200 mt-0.5">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation Portal Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Knowledge Base Sections</h2>
          <span className="text-xs font-mono text-zinc-500">Official Reference</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => navigate('/cards')}
            className="group text-left p-6 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                Cartas
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Explore o banco de dados mantido pela comunidade, com informações detalhadas sobre cada carta, incluindo texto de regras, arte, estatísticas e muito mais.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              Cheque {CARDS.length} cartas disponíveis.
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/keywords')}
            className="group text-left p-6 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                Glossário de Mecânicas
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Comprehensive definitions, reminder text, edge-case rulings, and card cross-references for all {KEYWORDS.length} core keywords.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              Open Keyword Reference
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/rules')}
            className="group text-left p-6 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                Regras de Corrida e Treino
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Learn win conditions, game setup, deckbuilding constraints, and the interactive 5-phase turn structure breakdown.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              Read Comprehensive Rules
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Featured Cards Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Cartas em Destaque</h2>
            <p className="text-sm text-zinc-400">
              Cartas mais novas do patch:  <span className="text-zinc-200">{GAME_META.latestSet}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/cards')}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
          >
            Veja todas as Cartas
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredCards.map((card) => (
            <div
              key={card.slug}
              onClick={() => navigate(`/cards/${card.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/cards/${card.slug}`)}
              className="group cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
            >
              <CardFrameIllustration card={card} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Latest Set & Patch Summary Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-950/90 border border-cyan-700/60 text-cyan-300 font-mono text-xs font-semibold">
                {GAME_META.version} RELEASE NOTES
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Set: {GAME_META.latestSet} ({GAME_META.latestSetCode}) · {GAME_META.releaseDate}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100">
              Latest Balance & Rules Errata Summary
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{GAME_META.patchSummary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/cards', { initialSet: GAME_META.latestSet })}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              Browse {GAME_META.latestSet}
            </button>
            <button
              type="button"
              onClick={() => navigate('/keywords')}
              className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Review Keywords
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// 7. VIEW 2: CARD DATABASE (/cards)
// ============================================================================

function CardDatabaseView({ navigate, initialSetFilter = 'All' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [setFilter, setSetFilter] = useState(initialSetFilter || 'All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  useEffect(() => {
    if (initialSetFilter) {
      setSetFilter(initialSetFilter);
    }
  }, [initialSetFilter]);

  const types = ['All', 'Speed', 'Stamina', 'Power', 'Guts', 'Wits'];
  const rarities = ['All', 'R', 'SR', 'SSR'];
  const sets = useMemo(() => ['All', ...Array.from(new Set(CARDS.map((c) => c.set)))], []);

  const filteredCards = useMemo(() => {
    return CARDS.filter((card) => {
      const q = searchQuery.trim().toLowerCase();
      if (
        q &&
        !card.name.toLowerCase().includes(q) &&
        !(card.cardText || '').toLowerCase().includes(q) &&
        !(card.cardActionText || '').replace(/(\*\*|__)/g, '').toLowerCase().includes(q) &&
        !(card.keywords || []).some((k) => k.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (rarityFilter !== 'All' && card.rarity !== rarityFilter) return false;
      if (setFilter !== 'All' && card.set !== setFilter) return false;

      return true;
    });
  }, [searchQuery, typeFilter, rarityFilter, setFilter]);

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'All' ||
    rarityFilter !== 'All' ||
    setFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setRarityFilter('All');
    setSetFilter('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            Index de Cartas & Detalhes
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Banco de dados de cartas
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Filtre por Tipo de carta ou Raridade. Selecione qualquer carta para ver seus detalhes.
          </p>
        </div>

        {/* View Toggle (Visual Grid vs Scryfall Table) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Grid Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela de Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/75 border border-zinc-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtre por nome, habilidades, tipo, raridade e etc..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500/70 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Card Type Select */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Card Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500/70 focus:outline-none text-sm text-zinc-200"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'Type: All' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Select */}
          <div className="md:col-span-3">
            <select
              aria-label="Filter by Rarity"
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500/70 focus:outline-none text-sm text-zinc-200"
            >
              {rarities.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'Rarity: All' : r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost Pills + Set Filter + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          {/* DELETE from <div className="flex flex-wrap items-center gap-1.5"> down to its closing </div> */}

          {/* Keep your Set Filter & Reset button right here */}
        </div>

          <div className="flex items-center gap-3">
            {setFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs">
                Set: {setFilter}
                <button
                  type="button"
                  onClick={() => setSetFilter('All')}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <span className="text-xs font-mono text-zinc-400">
              Showing <strong className="text-zinc-100">{filteredCards.length}</strong> of {CARDS.length}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

      {/* Results Display */}
      {filteredCards.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-12 text-center space-y-3">
          <p className="text-zinc-300 font-medium">No cards match your active filter criteria.</p>
          <p className="text-sm text-zinc-500">Try clearing one or more filters to expand your search.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            Redefina todos os filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredCards.map((card) => (
            <div
              key={card.slug}
              onClick={() => navigate(`/cards/${card.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/cards/${card.slug}`)}
              className="group cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
            >
              <CardFrameIllustration card={card} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">N.</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Raridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-sm">
              {filteredCards.map((card) => {
                const rStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES.Common;
                return (
                  <tr
                    key={card.slug}
                    onClick={() => navigate(`/cards/${card.slug}`)}
                    className="hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-zinc-500">
                      #{card.collectorNumber.split('/')[0]}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-100 hover:text-cyan-300">
                      {card.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {card.type} <span className="text-zinc-500"> {card.subtype}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${rStyle.badge}`}>
                        {card.rarity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. VIEW 3: INDIVIDUAL CARD PAGE (/cards/:slug) — IMPLEMENTING TEMPLATE B
// ============================================================================

function IndividualCardView({ slug, navigate }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const cardIndex = useMemo(() => CARDS.findIndex((c) => c.slug === slug), [slug]);
  const card = cardIndex >= 0 ? CARDS[cardIndex] : CARDS[0];

  const prevCard = CARDS[(cardIndex - 1 + CARDS.length) % CARDS.length];
  const nextCard = CARDS[(cardIndex + 1) % CARDS.length];

  const handleCopyUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}#/cards/${card.slug}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJumpToKeyword = (keywordId) => {
    navigate('/keywords', { highlightKeyword: keywordId });
  };

  const rarityKey = card.rarity?.toUpperCase();
  const rarityIcon = RARITY_ICONS[rarityKey];
  const rarityStyle = RARITY_STYLES[rarityKey] || RARITY_STYLES.R;

  const metadataRows = [
    { label: 'Card Type', value: card.type },
    {
      label: 'Rarity',
      value: rarityIcon ? (
        <img
          src={rarityIcon}
          alt={rarityKey}
          title={rarityKey}
          className="h-6 w-auto object-contain"
        />
      ) : (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${rarityStyle.badge}`}>
          {card.rarity}
        </span>
      )
    },
    {
      label: 'ID',
      value: card.collectorNumber
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumbs + Prev/Next Card Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-zinc-400">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <button
            type="button"
            onClick={() => navigate('/cards')}
            className="hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Card Database
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-100 font-medium">{card.name}</span>
        </nav>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate(`/cards/${prevCard.slug}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
            title={`Previous: ${prevCard.name}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{prevCard.name}</span>
            <span className="md:hidden">Prev</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/cards/${nextCard.slug}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
            title={`Next: ${nextCard.name}`}
          >
            <span className="hidden md:inline">{nextCard.name}</span>
            <span className="md:hidden">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Template B Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN COLUMN (Left 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-50">
                  {card.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400">
                  #{card.collectorNumber}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                {card.type}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link da Wiki</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Card Text (with interactive Keyword Popovers & Links) */}
          <section className="rounded-2xl bg-zinc-900/75 border border-zinc-800 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Texto da Carta
              </h2>
              <span className="text-[11px] text-zinc-500">
                Passe o mouse ou toque nas palavras-chave destacadas para ver as regras
              </span>
            </div>

            <div className="pt-1">
              <InteractiveCardText
                text={card.cardText}
                onJumpToKeyword={handleJumpToKeyword}
              />
            </div>           

            {/* Quick Keyword Pill Bar */}
            {card.keywords?.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/70 flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500">Palavras-chave Referenciadas:</span>
                {card.keywords.map((kwName) => {
                  const kwObj = KEYWORDS.find((k) => k.name.toLowerCase() === kwName.toLowerCase());
                  return (
                    <button
                      key={kwName}
                      type="button"
                      onClick={() => kwObj && handleJumpToKeyword(kwObj.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 hover:bg-cyan-950/60 border border-zinc-800 hover:border-cyan-700/60 text-xs font-medium text-cyan-300 transition-colors cursor-pointer"
                    >
                      {kwName}
                      <ExternalLink className="w-3 h-3 opacity-75" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 1.5: Action */}
          <section className="rounded-2xl bg-zinc-900/75 border border-zinc-800 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Ação da Carta
              </h2>
              <span className="text-[11px] text-zinc-500">
                Passe o mouse ou toque nas palavras-chave destacadas para ver as regras
              </span>
            </div>

           <div className="pt-1">
            <InteractiveCardText
              text={card.cardActionText}
              onJumpToKeyword={handleJumpToKeyword}
            />
            </div>
          </section>

          {/* Section 2: Flavor Text */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
              Texto de Flavore
            </h2>
            <blockquote className="p-5 rounded-2xl bg-zinc-900/40 border-l-4 border-cyan-500/70 border-y border-r border-zinc-800/80 italic text-zinc-300 text-sm sm:text-base leading-relaxed">
              {card.flavorText}
            </blockquote>
          </section>

          {/* Section 3: Specific Rulings & FAQ */}
          <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Regras Específicas & Perguntas Frequentes
            </h2>

            <div className="space-y-4">
              {card.rulings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1.5"
                >
                  <div className="text-sm font-semibold text-zinc-100">
                    <span className="font-mono text-amber-400 mr-1.5">Q:</span>
                    {item.question}
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed">
                    <span className="font-mono text-cyan-400 font-semibold mr-1.5">A:</span>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>

            {card.interactionNotes && (
              <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-800/40 flex items-start gap-2.5 text-xs sm:text-sm text-cyan-200">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-cyan-300">Dica do Luís: </strong>
                  {card.interactionNotes}
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Patch History */}
          <section className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <History className="w-4 h-4 text-indigo-400" />
              Histórico de Atualizações
            </h2>

            <ul className="space-y-3">
              {card.patchHistory.map((entry, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-indigo-300">
                    {entry.version}
                  </span>
                  <div className="text-zinc-300 leading-relaxed">
                    <span>{entry.note}</span>
                    <span className="block text-xs font-mono text-zinc-500 mt-0.5">
                      {entry.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* RIGHT SIDEBAR: TEMPLATE B INFOBOX (Right 4 cols on desktop) */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Informações da Carta
              </span>
              <span className="text-xs font-mono text-zinc-500">{card.setCode}</span>
            </div>

            {/* Rendered Custom SVG/CSS Card Frame */}
            <div className="p-4 bg-zinc-950/60 border-b border-zinc-800">
              <CardFrameIllustration card={card} />
            </div>

            {/* Structured Template B Metadata Table */}
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <tbody className="divide-y divide-zinc-800/80">
                {metadataRows.map((row) => (
                  <tr key={row.label} className="hover:bg-zinc-800/30">
                    <th className="py-2.5 px-4 font-medium text-zinc-400 bg-zinc-950/40 w-2/5">
                      {row.label}
                    </th>
                    <td className="py-2.5 px-4 text-zinc-100">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// 9. VIEW 4: KEYWORD & MECHANIC GLOSSARY (/keywords) — TEMPLATE C
// ============================================================================

function KeywordGlossaryView({ navigate, highlightedKeywordId = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeHighlight, setActiveHighlight] = useState(highlightedKeywordId);

  useEffect(() => {
    if (highlightedKeywordId) {
      setActiveHighlight(highlightedKeywordId);
      setSearchQuery('');
      setTypeFilter('All');
      setTimeout(() => {
        const el = document.getElementById(`kw-${highlightedKeywordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 80);
    }
  }, [highlightedKeywordId]);

  const mechanicTypes = ['All', 'Static', 'Triggered', 'Activated', 'Stamina Mechanic'];

  const filteredKeywords = useMemo(() => {
    return KEYWORDS.filter((kw) => {
      const q = searchQuery.trim().toLowerCase();
      if (
        q &&
        !kw.name.toLowerCase().includes(q) &&
        !kw.reminderText.toLowerCase().includes(q) &&
        !kw.rulesExplanation.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== 'All' && kw.type !== typeFilter) return false;
      return true;
    });
  }, [searchQuery, typeFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
          Referência a Regras & Habilidades
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
          Glossário de Palavras-chave & Mecânicas
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Referência completa para todas as habilidades de palavras-chave, textos de lembrete, decisões de casos extremos e cartas que utilizam cada mecânica.
        </p>
      </div>

      {/* Search & Mechanic Type Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveHighlight(null);
            }}
            placeholder="Pesquisar palavras-chave ou textos de regras..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-500/70 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {mechanicTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTypeFilter(type);
                setActiveHighlight(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Keyword Entries List */}
      {filteredKeywords.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-sm text-zinc-400">
          Nenhuma palavra-chave corresponde a "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-6">
          {filteredKeywords.map((kw) => {
            const matchingCards = CARDS.filter((c) =>
              c.keywords.some((k) => k.toLowerCase() === kw.name.toLowerCase())
            );
            const isHighlighted = activeHighlight === kw.id;

            return (
              <article
                key={kw.id}
                id={`kw-${kw.id}`}
                className={`rounded-2xl bg-zinc-900/75 border p-6 space-y-4 transition-all ${
                  isHighlighted
                    ? 'border-cyan-500 ring-2 ring-cyan-500/25 shadow-lg shadow-cyan-500/10'
                    : 'border-zinc-800'
                }`}
              >
                {/* Keyword Name + Mechanic Type Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-bold text-zinc-100">{kw.name}</h2>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md border font-mono text-xs font-semibold ${
                      MECHANIC_TYPE_STYLES[kw.type] || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {kw.type}
                  </span>
                </div>

                {/* Reminder Text in Italics */}
                <div className="px-4 py-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 text-sm italic text-zinc-300">
                  <span className="not-italic font-mono text-xs text-zinc-500 mr-2">
                    Texto de Lembrete:
                  </span>
                  ({kw.reminderText})
                </div>

                {/* Detailed Rules Explanation */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Explicação das Regras
                  </h3>
                  <p className="text-sm text-zinc-200 leading-relaxed">{kw.rulesExplanation}</p>
                </div>

                {/* Edge Cases & Rulings Bullet List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Casos Extremos & Decisões
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-300">
                    {kw.edgeCases.map((rule, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Clickable "Cards with [Keyword]" Pills */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400 mr-1">
                    Cartas com {kw.name}:
                  </span>
                  {matchingCards.map((card) => (
                    <button
                      key={card.slug}
                      type="button"
                      onClick={() => navigate(`/cards/${card.slug}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 hover:bg-cyan-950/70 border border-zinc-700 hover:border-cyan-500/60 text-xs font-medium text-zinc-200 hover:text-cyan-200 transition-colors cursor-pointer"
                    >
                      <span>{card.name}</span>
                      <span className="font-mono text-[10px] text-zinc-500">({card.cost})</span>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 10. VIEW 5: RULES & TURN STRUCTURE (/rules) — TEMPLATE D
// ============================================================================

function RulesAndTurnStructureView({ navigate }) {
  const [expandedPhases, setExpandedPhases] = useState({
    start: true,
    draw: false,
    main: true,
    combat: true,
    end: false
  });

  const togglePhase = (id) => {
    setExpandedPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    RULES.phases.forEach((p) => (all[p.id] = true));
    setExpandedPhases(all);
  };

  const collapseAll = () => {
    const none = {};
    RULES.phases.forEach((p) => (none[p.id] = false));
    setExpandedPhases(none);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
          Comprehensive Rulebook · {GAME_META.version}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
          Como Jogar & Estrutura da Rodada
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Objetivos principais da corrida, procedimentos de configuração antes do da corrida, fases de turno, regras de prioridade, janelas de ação e decisões de casos extremos.
        </p>
      </div>

      {/* Section 1: Objective */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-950/35 via-zinc-900/80 to-zinc-900/80 border border-indigo-800/50 p-6 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs uppercase tracking-wider">
          <Award className="w-4 h-4" />
          1. Objetivo do Jogo
        </div>
        <h2 className="text-xl font-bold text-zinc-100">{RULES.objective.title}</h2>
        <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed">
          {RULES.objective.summary}
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-400 pt-1">
          {RULES.objective.details.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Section 2: Game Setup */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4" />
          2. Setup da Corrida
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Preparação Antes da Corrida</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RULES.setup.map((s) => (
            <div
              key={s.step}
              className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-100 text-sm sm:text-base">{s.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Interactive 5-Phase Turn Structure */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              3. Estrutura de Turno
            </div>
            <p className="text-sm text-zinc-400">
              Click any turn phase below to inspect sub-steps, action windows, and priority rules.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {RULES.phases.map((phase) => {
            const isExpanded = !!expandedPhases[phase.id];
            return (
              <div
                key={phase.id}
                className={`rounded-2xl border transition-colors ${
                  isExpanded
                    ? 'bg-zinc-900/90 border-zinc-700'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => togglePhase(phase.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs font-bold text-amber-400 shrink-0">
                      PHASE {phase.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-zinc-100 text-base">{phase.name}</h3>
                      <p className="text-xs sm:text-sm text-zinc-400 truncate">{phase.shortDesc}</p>
                    </div>
                  </div>
                  <div className="text-zinc-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 space-y-4">
                    <ul className="space-y-2.5 text-sm text-zinc-300">
                      {phase.substeps.map((sub, idx) => {
                        const [stepLead, ...rest] = sub.split(':');
                        return (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <span>
                              <strong className="text-zinc-100">{stepLead}:</strong>
                              {rest.join(':')}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-zinc-200">Priority & Timing: </strong>
                        {phase.priorityNote}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Deckbuilding Rules */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          4. Deckbuilding Rules
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Constructed Format Constraints</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RULES.deckbuilding.map((rule) => (
            <div
              key={rule.title}
              className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase text-zinc-400">{rule.title}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-mono text-xs font-semibold">
                  {rule.value}
                </span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed pt-1">{rule.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Cross-Links */}
      <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          Need clarification on a specific keyword mentioned in the turn phases?
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/keywords')}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-100 transition-colors cursor-pointer"
          >
            Open Keyword Glossary
          </button>
          <button
            type="button"
            onClick={() => navigate('/cards')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
          >
            Browse Card Database
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. MAIN APP SHELL WITH CLIENT-SIDE HASH ROUTING
// ============================================================================

export default function App() {
  const parseHashPath = () => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw || raw === '') return '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  };

  const [currentPath, setCurrentPath] = useState(parseHashPath);
  const [routeMeta, setRouteMeta] = useState({
    highlightKeyword: null,
    initialSet: 'All'
  });

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPath(parseHashPath());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (path, meta = {}) => {
    setRouteMeta({
      highlightKeyword: meta.highlightKeyword || null,
      initialSet: meta.initialSet || 'All'
    });
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Match routes cleanly
  const renderRoute = () => {
    if (currentPath === '/' || currentPath === '') {
      return <HomePortalView navigate={navigate} />;
    }
    if (currentPath === '/cards') {
      return (
        <CardDatabaseView
          navigate={navigate}
          initialSetFilter={routeMeta.initialSet}
        />
      );
    }
    if (currentPath.startsWith('/cards/')) {
      const slug = currentPath.replace('/cards/', '').trim();
      return <IndividualCardView slug={slug} navigate={navigate} />;
    }
    if (currentPath === '/keywords') {
      return (
        <KeywordGlossaryView
          navigate={navigate}
          highlightedKeywordId={routeMeta.highlightKeyword}
        />
      );
    }
    if (currentPath === '/rules') {
      return <RulesAndTurnStructureView navigate={navigate} />;
    }

    // Fallback to Home Portal
    return <HomePortalView navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar currentPath={currentPath} navigate={navigate} />

      <main className="flex-1">{renderRoute()}</main>

      {/* Documentation Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">{GAME_META.title} Wiki</span>
            <span>·</span>
            <span className="font-mono">{GAME_META.version}</span>
            <span>·</span>
            <span>{GAME_META.latestSet}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('/cards')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => navigate('/keywords')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Keywords
            </button>
            <button
              type="button"
              onClick={() => navigate('/rules')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Rules
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
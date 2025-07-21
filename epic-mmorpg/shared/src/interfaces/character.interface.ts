import { 
  CharacterClass, 
  CharacterRace, 
  Gender,
  PlayerStatus,
  ProfessionType,
  TitleType
} from '../enums/index.js';
import { IInventory } from './item.interface.js';
import { ISkill } from './skill.interface.js';
import { IQuest } from './quest.interface.js';
import { IBuff } from './combat.interface.js';
import { IReputation } from './reputation.interface.js';
import { ICurrency } from './economy.interface.js';
import { IProfession } from './crafting.interface.js';
import { IMount } from './mount.interface.js';
import { IPet } from './pet.interface.js';
import { IAchievement, ITitle } from './achievement.interface.js';
import { IPvPStats } from './pvp.interface.js';

export interface IPosition {
  x: number;
  y: number;
  z: number;
  rotation: number;
  mapId: string;
  zoneId: string;
  subZoneId?: string;
  instanceId?: string;
}

export interface IStats {
  // Primary Stats
  strength: number;
  agility: number;
  intellect: number;
  spirit: number;
  stamina: number;
  
  // Secondary Stats
  attackPower: number;
  spellPower: number;
  criticalStrike: number;
  haste: number;
  mastery: number;
  versatility: number;
  
  // Defensive Stats
  armor: number;
  dodge: number;
  parry: number;
  block: number;
  resilience: number;
  
  // Resource Stats
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  energy: number;
  maxEnergy: number;
  rage: number;
  maxRage: number;
  focus: number;
  maxFocus: number;
  runicPower: number;
  maxRunicPower: number;
  chi: number;
  maxChi: number;
  holyPower: number;
  maxHolyPower: number;
  soulShards: number;
  maxSoulShards: number;
  astralPower: number;
  maxAstralPower: number;
  fury: number;
  maxFury: number;
  pain: number;
  maxPain: number;
  insanity: number;
  maxInsanity: number;
  maelstrom: number;
  maxMaelstrom: number;
  
  // Resistances
  fireResistance: number;
  frostResistance: number;
  natureResistance: number;
  shadowResistance: number;
  arcaneResistance: number;
  holyResistance: number;
  
  // Other Stats
  speed: number;
  swimSpeed: number;
  flySpeed: number;
  mountSpeed: number;
  luck: number;
  magicFind: number;
  goldFind: number;
  experienceBonus: number;
  reputationBonus: number;
  craftingSpeed: number;
  gatheringSpeed: number;
  
  // Combat Ratings
  hit: number;
  expertise: number;
  penetration: number;
  lifesteal: number;
  avoidance: number;
  sturdiness: number;
  indestructible: number;
  
  // Calculated Stats
  attackSpeed: number;
  castSpeed: number;
  globalCooldown: number;
  damageReduction: number;
  healingBonus: number;
  threatGeneration: number;
  
  // Special Stats
  corruption: number;
  maxCorruption: number;
  sanity: number;
  maxSanity: number;
  karma: number;
  maxKarma: number;
  divinity: number;
  maxDivinity: number;
  void: number;
  maxVoid: number;
  balance: number;
  maxBalance: number;
  resonance: number;
  maxResonance: number;
  attunement: number;
  maxAttunement: number;
  harmony: number;
  maxHarmony: number;
  discord: number;
  maxDiscord: number;
}

export interface IEquipment {
  head?: string;
  shoulders?: string;
  chest?: string;
  back?: string;
  shirt?: string;
  tabard?: string;
  wrists?: string;
  hands?: string;
  waist?: string;
  legs?: string;
  feet?: string;
  neck?: string;
  finger1?: string;
  finger2?: string;
  trinket1?: string;
  trinket2?: string;
  mainHand?: string;
  offHand?: string;
  ranged?: string;
  ammo?: string;
  relic1?: string;
  relic2?: string;
  relic3?: string;
}

export interface ITalent {
  id: string;
  name: string;
  rank: number;
  maxRank: number;
  description: string;
  icon: string;
  requirements: {
    level?: number;
    talents?: string[];
    points?: number;
  };
}

export interface ITalentTree {
  id: string;
  name: string;
  specialization: string;
  talents: ITalent[];
  pointsSpent: number;
  maxPoints: number;
}

export interface ISpellbook {
  knownSpells: string[];
  activeSpells: string[];
  passiveSpells: string[];
  talentSpells: string[];
  itemSpells: string[];
  racialSpells: string[];
  guildSpells: string[];
  temporarySpells: string[];
}

export interface IActionBar {
  barId: number;
  slots: {
    slotId: number;
    type: 'spell' | 'item' | 'macro' | 'companion' | 'mount';
    actionId: string;
    keybind?: string;
  }[];
}

export interface ICharacterAppearance {
  skinColor: string;
  faceType: number;
  hairStyle: number;
  hairColor: string;
  facialHair: number;
  facialHairColor: string;
  eyeColor: string;
  features: {
    scars?: number;
    tattoos?: number;
    piercings?: number;
    bodyType?: number;
    height?: number;
    voice?: number;
  };
  customization: {
    [key: string]: any;
  };
}

export interface ICharacter {
  id: string;
  playerId: string;
  name: string;
  realm: string;
  class: CharacterClass;
  race: CharacterRace;
  gender: Gender;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  experienceRested: number;
  
  stats: IStats;
  baseStats: IStats;
  bonusStats: IStats;
  
  position: IPosition;
  homePosition?: IPosition;
  deathPosition?: IPosition;
  
  equipment: IEquipment;
  inventory: IInventory;
  bank: IInventory;
  voidStorage?: IInventory;
  
  currencies: ICurrency[];
  
  skills: ISkill[];
  spellbook: ISpellbook;
  actionBars: IActionBar[];
  
  talentTrees: ITalentTree[];
  currentSpec: number;
  dualSpec?: ITalentTree[];
  
  professions: {
    primary: IProfession[];
    secondary: IProfession[];
    gathering: IProfession[];
  };
  
  quests: {
    active: IQuest[];
    completed: string[];
    abandoned: string[];
    daily: {
      completed: string[];
      resetTime: Date;
    };
    weekly: {
      completed: string[];
      resetTime: Date;
    };
  };
  
  reputation: IReputation[];
  
  achievements: {
    completed: string[];
    progress: {
      achievementId: string;
      criteria: {
        id: string;
        progress: number;
        completed: boolean;
      }[];
    }[];
  };
  
  titles: {
    unlocked: string[];
    selected?: string;
  };
  
  pvp: IPvPStats;
  
  mounts: {
    unlocked: string[];
    favorites: string[];
    current?: string;
  };
  
  pets: {
    unlocked: IPet[];
    active?: IPet;
    battlePets: IPet[];
  };
  
  appearance: ICharacterAppearance;
  transmog: {
    [slot: string]: string;
  };
  
  buffs: IBuff[];
  debuffs: IBuff[];
  auras: IBuff[];
  
  combatLog: {
    inCombat: boolean;
    lastCombatStart?: Date;
    lastCombatEnd?: Date;
    combatTime: number;
  };
  
  social: {
    guildId?: string;
    guildRank?: number;
    friends: string[];
    ignored: string[];
    recentPlayers: {
      characterId: string;
      timestamp: Date;
      interaction: string;
    }[];
  };
  
  mail: {
    inbox: string[];
    sent: string[];
    unreadCount: number;
  };
  
  statistics: {
    kills: {
      players: number;
      creatures: number;
      elites: number;
      bosses: number;
    };
    deaths: {
      total: number;
      byPlayers: number;
      byEnvironment: number;
      byCreatures: number;
    };
    damage: {
      dealt: bigint;
      taken: bigint;
      highest: number;
      critical: number;
    };
    healing: {
      done: bigint;
      received: bigint;
      highest: number;
      critical: number;
    };
    distance: {
      walked: number;
      mounted: number;
      flown: number;
      swum: number;
      fallen: number;
    };
    interactions: {
      npcsInteracted: number;
      objectsInteracted: number;
      itemsUsed: number;
      spellsCast: number;
    };
    economy: {
      goldLooted: bigint;
      goldSpent: bigint;
      itemsSold: number;
      itemsBought: number;
      auctionsSold: number;
      auctionsBought: number;
    };
    crafting: {
      itemsCrafted: number;
      recipesLearned: number;
      materialsGathered: number;
      enchantments: number;
    };
    exploration: {
      zonesDiscovered: number;
      subZonesDiscovered: number;
      flightPathsUnlocked: number;
      teleportsUnlocked: number;
    };
  };
  
  preferences: {
    autoLoot: boolean;
    showHelm: boolean;
    showCloak: boolean;
    showTitles: boolean;
    enablePvP: boolean;
    acceptDuels: boolean;
    showGuildTabard: boolean;
    characterVoice: number;
    emoteVoice: boolean;
    combatText: {
      incoming: boolean;
      outgoing: boolean;
      periodic: boolean;
      combo: boolean;
    };
  };
  
  flags: {
    isGhost: boolean;
    isStealthed: boolean;
    isMounted: boolean;
    isFlying: boolean;
    isSwimming: boolean;
    isResting: boolean;
    isAFK: boolean;
    isDND: boolean;
    isPvPFlagged: boolean;
    isInInstance: boolean;
    isInRaid: boolean;
    isInBattleground: boolean;
    isInArena: boolean;
    isPhased: boolean;
    isInVehicle: boolean;
    isChanneling: boolean;
    isCasting: boolean;
    isLooting: boolean;
    isTrading: boolean;
    isCrafting: boolean;
  };
  
  cooldowns: {
    spells: Map<string, Date>;
    items: Map<string, Date>;
    global: Date;
  };
  
  lastLogout: Date;
  playedTime: number;
  playedTimeAtLevel: number;
  createdAt: Date;
  updatedAt: Date;
  
  seasonal?: {
    seasonId: string;
    seasonLevel: number;
    seasonExperience: number;
    seasonAchievements: string[];
    seasonRewards: string[];
  };
  
  hardcore?: {
    isHardcore: boolean;
    hardcoreDeaths: number;
    hardcoreSurvivalTime: number;
    hardcoreAchievements: string[];
  };
  
  roleplay?: {
    biography: string;
    personality: string;
    history: string;
    currentlyDoing: string;
    lookingFor: string[];
    roleplayStyle: string;
    availableForRP: boolean;
  };
  
  customData?: {
    [key: string]: any;
  };
}
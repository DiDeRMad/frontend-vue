import { z } from 'zod';
import { ItemType, EquipmentSlot } from './item.types';
import { SkillType } from './skill.types';

// Player Classes
export enum PlayerClass {
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  ARCHER = 'ARCHER',
  ROGUE = 'ROGUE',
  PALADIN = 'PALADIN',
  NECROMANCER = 'NECROMANCER',
  DRUID = 'DRUID',
  BERSERKER = 'BERSERKER',
  PRIEST = 'PRIEST',
  RANGER = 'RANGER',
  ASSASSIN = 'ASSASSIN',
  WARLOCK = 'WARLOCK',
  MONK = 'MONK',
  SHAMAN = 'SHAMAN',
  BARD = 'BARD'
}

// Player Races
export enum PlayerRace {
  HUMAN = 'HUMAN',
  ELF = 'ELF',
  DWARF = 'DWARF',
  ORC = 'ORC',
  UNDEAD = 'UNDEAD',
  TROLL = 'TROLL',
  GOBLIN = 'GOBLIN',
  DRAGONKIN = 'DRAGONKIN',
  CELESTIAL = 'CELESTIAL',
  DEMON = 'DEMON',
  HALFLING = 'HALFLING',
  GNOME = 'GNOME',
  TAUREN = 'TAUREN',
  NAGA = 'NAGA',
  ELEMENTAL = 'ELEMENTAL'
}

// Player Stats
export interface PlayerStats {
  // Primary Stats
  strength: number;
  agility: number;
  intelligence: number;
  stamina: number;
  spirit: number;
  luck: number;
  
  // Secondary Stats
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  energy: number;
  maxEnergy: number;
  
  // Combat Stats
  attackPower: number;
  spellPower: number;
  criticalChance: number;
  criticalDamage: number;
  armor: number;
  magicResistance: number;
  dodge: number;
  parry: number;
  block: number;
  
  // Resistance Stats
  fireResistance: number;
  iceResistance: number;
  lightningResistance: number;
  poisonResistance: number;
  holyResistance: number;
  darkResistance: number;
  
  // Other Stats
  movementSpeed: number;
  attackSpeed: number;
  castSpeed: number;
  itemFind: number;
  goldFind: number;
  experienceGain: number;
}

// Player Position
export interface Position {
  x: number;
  y: number;
  z: number;
  zone: string;
  subZone?: string;
  instance?: string;
}

// Player Rotation
export interface Rotation {
  yaw: number;
  pitch: number;
  roll: number;
}

// Player Inventory
export interface InventorySlot {
  itemId?: string;
  quantity: number;
  slot: number;
  locked?: boolean;
}

// Player Equipment
export interface Equipment {
  [EquipmentSlot.HEAD]?: string;
  [EquipmentSlot.NECK]?: string;
  [EquipmentSlot.SHOULDERS]?: string;
  [EquipmentSlot.CHEST]?: string;
  [EquipmentSlot.BACK]?: string;
  [EquipmentSlot.WRISTS]?: string;
  [EquipmentSlot.HANDS]?: string;
  [EquipmentSlot.WAIST]?: string;
  [EquipmentSlot.LEGS]?: string;
  [EquipmentSlot.FEET]?: string;
  [EquipmentSlot.RING1]?: string;
  [EquipmentSlot.RING2]?: string;
  [EquipmentSlot.TRINKET1]?: string;
  [EquipmentSlot.TRINKET2]?: string;
  [EquipmentSlot.MAIN_HAND]?: string;
  [EquipmentSlot.OFF_HAND]?: string;
  [EquipmentSlot.RANGED]?: string;
}

// Player Skills
export interface PlayerSkill {
  skillId: string;
  level: number;
  experience: number;
  maxExperience: number;
  unlocked: boolean;
  hotkey?: string;
}

// Player Achievements
export interface PlayerAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  completed: boolean;
}

// Player Titles
export interface PlayerTitle {
  titleId: string;
  unlockedAt: Date;
  equipped: boolean;
}

// Player Currency
export interface PlayerCurrency {
  gold: number;
  silver: number;
  copper: number;
  premiumCurrency: number;
  honorPoints: number;
  arenaPoints: number;
  dungeonTokens: number;
  raidTokens: number;
  craftingTokens: number;
  eventTokens: number;
}

// Player Reputation
export interface PlayerReputation {
  factionId: string;
  reputation: number;
  rank: number;
  maxRank: number;
}

// Player Quest Progress
export interface QuestProgress {
  questId: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  objectives: {
    objectiveId: string;
    current: number;
    required: number;
    completed: boolean;
  }[];
  startedAt: Date;
  completedAt?: Date;
}

// Player Profession
export interface PlayerProfession {
  professionId: string;
  level: number;
  experience: number;
  recipes: string[];
}

// Player Social
export interface PlayerSocial {
  friendList: string[];
  blockedList: string[];
  guildId?: string;
  guildRank?: number;
  partyId?: string;
  raidId?: string;
  mentorId?: string;
  apprentices: string[];
}

// Player Settings
export interface PlayerSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    shadows: boolean;
    antiAliasing: boolean;
    vsync: boolean;
    particleEffects: number;
    viewDistance: number;
  };
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    ambientVolume: number;
  };
  gameplay: {
    autoLoot: boolean;
    showDamageNumbers: boolean;
    showHealthBars: boolean;
    showQuestMarkers: boolean;
    enableTutorials: boolean;
    combatText: boolean;
  };
  controls: {
    keyBindings: Record<string, string>;
    mouseSensitivity: number;
    invertY: boolean;
  };
  ui: {
    scale: number;
    miniMapSize: number;
    chatOpacity: number;
    showHelmet: boolean;
    showCloak: boolean;
  };
}

// Player Buffs/Debuffs
export interface StatusEffect {
  id: string;
  type: 'buff' | 'debuff';
  name: string;
  description: string;
  icon: string;
  duration: number;
  remainingDuration: number;
  stacks: number;
  maxStacks: number;
  source: string;
  effects: {
    stat: keyof PlayerStats;
    value: number;
    percentage?: boolean;
  }[];
}

// Player Combat State
export interface CombatState {
  inCombat: boolean;
  target?: string;
  combatStartedAt?: Date;
  lastDamageDealt?: number;
  lastDamageReceived?: number;
  comboPoints?: number;
  rage?: number;
  focus?: number;
  holyPower?: number;
  runicPower?: number;
  soulShards?: number;
}

// Player Death State
export interface DeathState {
  isDead: boolean;
  deathLocation?: Position;
  deathTime?: Date;
  killer?: string;
  canResurrect: boolean;
  resurrectionTime?: number;
  spiritLocation?: Position;
}

// Player PvP Stats
export interface PvPStats {
  kills: number;
  deaths: number;
  assists: number;
  honorKills: number;
  dishonorKills: number;
  rating: {
    arena2v2: number;
    arena3v3: number;
    arena5v5: number;
    battleground: number;
  };
  weeklyWins: number;
  weeklyLosses: number;
  lifetimeWins: number;
  lifetimeLosses: number;
}

// Main Player Interface
export interface Player {
  id: string;
  accountId: string;
  name: string;
  class: PlayerClass;
  race: PlayerRace;
  gender: 'male' | 'female' | 'other';
  level: number;
  experience: number;
  experienceToNextLevel: number;
  
  stats: PlayerStats;
  position: Position;
  rotation: Rotation;
  
  inventory: InventorySlot[];
  equipment: Equipment;
  bank: InventorySlot[];
  
  skills: PlayerSkill[];
  talents: Record<string, number>;
  
  achievements: PlayerAchievement[];
  titles: PlayerTitle[];
  activeTitle?: string;
  
  currency: PlayerCurrency;
  reputation: PlayerReputation[];
  
  quests: QuestProgress[];
  completedQuests: string[];
  
  professions: PlayerProfession[];
  
  social: PlayerSocial;
  settings: PlayerSettings;
  
  buffs: StatusEffect[];
  debuffs: StatusEffect[];
  
  combatState: CombatState;
  deathState: DeathState;
  pvpStats: PvPStats;
  
  mount?: string;
  pet?: string;
  companion?: string;
  
  playtime: number;
  createdAt: Date;
  lastLoginAt: Date;
  lastLogoutAt?: Date;
  
  isOnline: boolean;
  connectionId?: string;
}

// Player Creation Schema
export const PlayerCreationSchema = z.object({
  name: z.string().min(3).max(16).regex(/^[a-zA-Z0-9]+$/),
  class: z.nativeEnum(PlayerClass),
  race: z.nativeEnum(PlayerRace),
  gender: z.enum(['male', 'female', 'other']),
  customization: z.object({
    face: z.number().min(0).max(20),
    hair: z.number().min(0).max(30),
    hairColor: z.number().min(0).max(20),
    skinColor: z.number().min(0).max(20),
    facialHair: z.number().min(0).max(10).optional(),
    tattoos: z.number().min(0).max(10).optional(),
    scars: z.number().min(0).max(10).optional(),
    bodyType: z.number().min(0).max(5),
    height: z.number().min(0).max(100),
    voice: z.number().min(0).max(10)
  })
});

// Player Update Schema
export const PlayerUpdateSchema = z.object({
  level: z.number().min(1).max(100).optional(),
  experience: z.number().min(0).optional(),
  stats: z.object({
    health: z.number().min(0).optional(),
    mana: z.number().min(0).optional(),
    energy: z.number().min(0).optional()
  }).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    zone: z.string()
  }).optional(),
  rotation: z.object({
    yaw: z.number(),
    pitch: z.number(),
    roll: z.number()
  }).optional()
});

// Player Action Types
export enum PlayerAction {
  MOVE = 'MOVE',
  ATTACK = 'ATTACK',
  CAST_SPELL = 'CAST_SPELL',
  USE_ITEM = 'USE_ITEM',
  INTERACT = 'INTERACT',
  TRADE = 'TRADE',
  CHAT = 'CHAT',
  EMOTE = 'EMOTE',
  MOUNT = 'MOUNT',
  DISMOUNT = 'DISMOUNT',
  RESURRECT = 'RESURRECT',
  TELEPORT = 'TELEPORT',
  LOGOUT = 'LOGOUT'
}

// Player Event Types
export enum PlayerEvent {
  LEVEL_UP = 'LEVEL_UP',
  DEATH = 'DEATH',
  RESURRECT = 'RESURRECT',
  QUEST_COMPLETE = 'QUEST_COMPLETE',
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  ITEM_OBTAINED = 'ITEM_OBTAINED',
  SKILL_LEARNED = 'SKILL_LEARNED',
  ZONE_CHANGED = 'ZONE_CHANGED',
  COMBAT_STARTED = 'COMBAT_STARTED',
  COMBAT_ENDED = 'COMBAT_ENDED',
  GUILD_JOINED = 'GUILD_JOINED',
  GUILD_LEFT = 'GUILD_LEFT',
  PARTY_JOINED = 'PARTY_JOINED',
  PARTY_LEFT = 'PARTY_LEFT'
}
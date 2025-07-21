import { z } from 'zod';
import { PlayerClass, PlayerStats } from './player.types';

// Skill Types
export enum SkillType {
  // Combat Skills
  MELEE_ATTACK = 'MELEE_ATTACK',
  RANGED_ATTACK = 'RANGED_ATTACK',
  MAGIC_ATTACK = 'MAGIC_ATTACK',
  
  // Defensive Skills
  BLOCK = 'BLOCK',
  PARRY = 'PARRY',
  DODGE = 'DODGE',
  SHIELD_BASH = 'SHIELD_BASH',
  
  // Magic Schools
  FIRE_MAGIC = 'FIRE_MAGIC',
  ICE_MAGIC = 'ICE_MAGIC',
  LIGHTNING_MAGIC = 'LIGHTNING_MAGIC',
  EARTH_MAGIC = 'EARTH_MAGIC',
  WIND_MAGIC = 'WIND_MAGIC',
  WATER_MAGIC = 'WATER_MAGIC',
  LIGHT_MAGIC = 'LIGHT_MAGIC',
  DARK_MAGIC = 'DARK_MAGIC',
  ARCANE_MAGIC = 'ARCANE_MAGIC',
  NATURE_MAGIC = 'NATURE_MAGIC',
  
  // Healing & Support
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  CLEANSE = 'CLEANSE',
  RESURRECT = 'RESURRECT',
  SHIELD = 'SHIELD',
  
  // Movement & Utility
  DASH = 'DASH',
  TELEPORT = 'TELEPORT',
  STEALTH = 'STEALTH',
  MOUNT_SUMMON = 'MOUNT_SUMMON',
  PORTAL = 'PORTAL',
  
  // Crowd Control
  STUN = 'STUN',
  SLOW = 'SLOW',
  ROOT = 'ROOT',
  SILENCE = 'SILENCE',
  FEAR = 'FEAR',
  CHARM = 'CHARM',
  POLYMORPH = 'POLYMORPH',
  
  // Summon Skills
  SUMMON_PET = 'SUMMON_PET',
  SUMMON_MINION = 'SUMMON_MINION',
  SUMMON_ELEMENTAL = 'SUMMON_ELEMENTAL',
  SUMMON_DEMON = 'SUMMON_DEMON',
  
  // Transformation
  SHAPESHIFT = 'SHAPESHIFT',
  BERSERK = 'BERSERK',
  AVATAR = 'AVATAR',
  
  // Profession Skills
  MINING = 'MINING',
  HERBALISM = 'HERBALISM',
  SKINNING = 'SKINNING',
  FISHING = 'FISHING',
  ARCHAEOLOGY = 'ARCHAEOLOGY',
  
  // Crafting Skills
  BLACKSMITHING = 'BLACKSMITHING',
  LEATHERWORKING = 'LEATHERWORKING',
  TAILORING = 'TAILORING',
  ENGINEERING = 'ENGINEERING',
  ALCHEMY = 'ALCHEMY',
  ENCHANTING = 'ENCHANTING',
  JEWELCRAFTING = 'JEWELCRAFTING',
  INSCRIPTION = 'INSCRIPTION',
  COOKING = 'COOKING',
  
  // Other
  FIRST_AID = 'FIRST_AID',
  LOCKPICKING = 'LOCKPICKING',
  PICKPOCKET = 'PICKPOCKET',
  TRACKING = 'TRACKING',
  SURVIVAL = 'SURVIVAL'
}

// Skill Category
export enum SkillCategory {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE',
  REACTIVE = 'REACTIVE',
  CHANNELED = 'CHANNELED',
  TOGGLE = 'TOGGLE',
  PROFESSION = 'PROFESSION'
}

// Target Type
export enum TargetType {
  SELF = 'SELF',
  SINGLE_ENEMY = 'SINGLE_ENEMY',
  SINGLE_ALLY = 'SINGLE_ALLY',
  SINGLE_ANY = 'SINGLE_ANY',
  AOE_ENEMY = 'AOE_ENEMY',
  AOE_ALLY = 'AOE_ALLY',
  AOE_ANY = 'AOE_ANY',
  CONE = 'CONE',
  LINE = 'LINE',
  POINT_BLANK = 'POINT_BLANK',
  GROUND = 'GROUND',
  NONE = 'NONE'
}

// Resource Type
export enum ResourceType {
  MANA = 'MANA',
  ENERGY = 'ENERGY',
  RAGE = 'RAGE',
  FOCUS = 'FOCUS',
  RUNIC_POWER = 'RUNIC_POWER',
  HOLY_POWER = 'HOLY_POWER',
  SOUL_SHARDS = 'SOUL_SHARDS',
  COMBO_POINTS = 'COMBO_POINTS',
  CHI = 'CHI',
  ARCANE_CHARGES = 'ARCANE_CHARGES',
  HEALTH = 'HEALTH',
  NONE = 'NONE'
}

// Skill Range
export interface SkillRange {
  min: number;
  max: number;
  radius?: number; // For AoE skills
  angle?: number; // For cone skills
  width?: number; // For line skills
}

// Skill Cost
export interface SkillCost {
  type: ResourceType;
  amount: number;
  percentage?: boolean; // If true, cost is percentage of max resource
}

// Skill Cooldown
export interface SkillCooldown {
  duration: number; // In seconds
  charges?: number; // Number of charges
  chargeTime?: number; // Time to restore one charge
  sharedCooldown?: string; // ID of shared cooldown group
  modifiedByHaste?: boolean;
}

// Skill Cast Time
export interface SkillCastTime {
  base: number; // In seconds
  channeled?: boolean;
  channelTicks?: number;
  interruptible?: boolean;
  movementAllowed?: boolean;
  modifiedByHaste?: boolean;
}

// Skill Damage
export interface SkillDamage {
  base: {
    min: number;
    max: number;
  };
  scaling: {
    stat: keyof PlayerStats;
    ratio: number;
  }[];
  type: 'physical' | 'magic' | 'fire' | 'ice' | 'lightning' | 'poison' | 'holy' | 'dark' | 'true';
  canCrit: boolean;
  ignoreArmor?: boolean;
  ignoreResistance?: boolean;
}

// Skill Heal
export interface SkillHeal {
  base: {
    min: number;
    max: number;
  };
  scaling: {
    stat: keyof PlayerStats;
    ratio: number;
  }[];
  canCrit: boolean;
  affectedByHealingPower: boolean;
}

// Skill Effect
export interface SkillEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon' | 'control' | 'movement' | 'transform';
  
  // Damage/Heal
  damage?: SkillDamage;
  heal?: SkillHeal;
  
  // Status Effects
  statusEffect?: {
    id: string;
    duration: number;
    stacks?: number;
    maxStacks?: number;
    refreshable?: boolean;
    dispellable?: boolean;
    
    // Stat Modifications
    statModifications?: {
      stat: keyof PlayerStats;
      value: number;
      percentage?: boolean;
    }[];
    
    // Damage Over Time
    dot?: {
      damage: number;
      interval: number;
      ticks: number;
      type: string;
    };
    
    // Heal Over Time
    hot?: {
      heal: number;
      interval: number;
      ticks: number;
    };
    
    // Control Effects
    control?: {
      type: 'stun' | 'slow' | 'root' | 'silence' | 'fear' | 'charm' | 'polymorph' | 'blind' | 'disarm';
      breakOnDamage?: boolean;
      diminishingReturns?: boolean;
    };
  };
  
  // Summon
  summon?: {
    creatureId: string;
    count: number;
    duration: number;
    inheritStats?: boolean;
    statPercentage?: number;
  };
  
  // Movement
  movement?: {
    type: 'dash' | 'teleport' | 'leap' | 'charge' | 'pull' | 'knockback';
    distance?: number;
    speed?: number;
    toTarget?: boolean;
    toGround?: boolean;
    throughWalls?: boolean;
  };
  
  // Transform
  transform?: {
    formId: string;
    duration: number;
    statsModification?: Partial<PlayerStats>;
    skillsAvailable?: string[];
    breakOnDamage?: boolean;
  };
  
  // Conditions
  conditions?: {
    requiresBuff?: string;
    requiresDebuff?: string;
    requiresResource?: {
      type: ResourceType;
      amount: number;
    };
    requiresComboPoints?: number;
    requiresWeaponType?: string[];
    requiresStealthed?: boolean;
    requiresBehindTarget?: boolean;
    requiresLowHealth?: number; // Percentage
  };
  
  // Chance to Apply
  chance?: number; // 0-100
}

// Skill Modifier (from talents, items, etc.)
export interface SkillModifier {
  id: string;
  skillId: string;
  type: 'damage' | 'healing' | 'cooldown' | 'cost' | 'range' | 'duration' | 'chance';
  value: number;
  percentage?: boolean;
  source: 'talent' | 'item' | 'buff' | 'passive';
  sourceId: string;
}

// Skill Combo
export interface SkillCombo {
  id: string;
  name: string;
  skills: string[]; // Skill IDs in order
  timeWindow: number; // Time to complete combo
  effects: SkillEffect[];
  cooldown?: number;
}

// Skill Tree Node
export interface SkillTreeNode {
  id: string;
  skillId: string;
  tier: number;
  position: { x: number; y: number };
  maxRank: number;
  requirements: {
    level?: number;
    points?: number;
    prerequisite?: string[]; // Node IDs
  };
  benefits: {
    rank: number;
    description: string;
    modifiers: SkillModifier[];
  }[];
}

// Main Skill Interface
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  type: SkillType;
  category: SkillCategory;
  
  // Class Requirements
  requiredClass?: PlayerClass[];
  requiredLevel?: number;
  
  // Targeting
  targetType: TargetType;
  range: SkillRange;
  
  // Resource & Cooldown
  cost: SkillCost;
  cooldown: SkillCooldown;
  globalCooldown?: boolean;
  
  // Casting
  castTime: SkillCastTime;
  
  // Effects
  effects: SkillEffect[];
  
  // Scaling
  ranks?: {
    level: number;
    requiredSkillLevel: number;
    effects: SkillEffect[];
    cost: SkillCost;
    description: string;
  }[];
  
  // Animation & Visual
  animation: string;
  visualEffect: string;
  sound: string;
  
  // AI Hints
  aiPriority?: number;
  aiConditions?: {
    useOnLowHealth?: number;
    useOnHighThreat?: boolean;
    useOnMultipleEnemies?: number;
    useAsOpener?: boolean;
    useAsFinisher?: boolean;
  };
  
  // PvP Modifications
  pvpModifications?: {
    damageReduction?: number;
    healingReduction?: number;
    durationReduction?: number;
  };
  
  // Combos
  combosFrom?: string[]; // Skills that combo into this
  combosInto?: string[]; // Skills this combos into
}

// Skill Schema
export const SkillSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  type: z.nativeEnum(SkillType),
  category: z.nativeEnum(SkillCategory),
  targetType: z.nativeEnum(TargetType),
  range: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    radius: z.number().min(0).optional()
  })
});

// Skill Use Schema
export const SkillUseSchema = z.object({
  skillId: z.string(),
  targetId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }).optional(),
  queueNext: z.boolean().optional()
});

// Skill Learn Schema
export const SkillLearnSchema = z.object({
  skillId: z.string(),
  rank: z.number().min(1).optional()
});
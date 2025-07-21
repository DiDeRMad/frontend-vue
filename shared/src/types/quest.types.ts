import { z } from 'zod';
import { Position } from './player.types';
import { ItemType } from './item.types';
import { NPCType } from './world.types';

// Quest Types
export enum QuestType {
  MAIN_STORY = 'MAIN_STORY',
  SIDE_QUEST = 'SIDE_QUEST',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  REPEATABLE = 'REPEATABLE',
  WORLD_QUEST = 'WORLD_QUEST',
  DUNGEON = 'DUNGEON',
  RAID = 'RAID',
  PVP = 'PVP',
  PROFESSION = 'PROFESSION',
  CLASS = 'CLASS',
  RACE = 'RACE',
  SEASONAL = 'SEASONAL',
  HIDDEN = 'HIDDEN',
  LEGENDARY = 'LEGENDARY'
}

// Quest Objective Types
export enum QuestObjectiveType {
  KILL = 'KILL',
  COLLECT = 'COLLECT',
  DELIVER = 'DELIVER',
  ESCORT = 'ESCORT',
  INTERACT = 'INTERACT',
  EXPLORE = 'EXPLORE',
  SURVIVE = 'SURVIVE',
  DEFEND = 'DEFEND',
  CRAFT = 'CRAFT',
  USE_SKILL = 'USE_SKILL',
  REACH_LEVEL = 'REACH_LEVEL',
  REACH_REPUTATION = 'REACH_REPUTATION',
  WIN_PVP = 'WIN_PVP',
  COMPLETE_DUNGEON = 'COMPLETE_DUNGEON',
  CUSTOM = 'CUSTOM'
}

// Quest Objective
export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  description: string;
  
  // Target
  targetId?: string; // NPC, Item, Zone, etc.
  targetName?: string;
  quantity: number;
  
  // Location
  location?: {
    zoneId: string;
    position?: Position;
    radius?: number;
    marker?: {
      type: 'circle' | 'exclamation' | 'question' | 'skull' | 'star';
      color: string;
    };
  };
  
  // Conditions
  conditions?: {
    hasItem?: string;
    hasSkill?: string;
    hasBuff?: string;
    inGroup?: boolean;
    timeLimit?: number; // In seconds
    duringEvent?: string;
  };
  
  // Progress tracking
  progressText?: string; // e.g., "Wolves killed: {0}/{1}"
  hidden?: boolean; // Hidden until discovered
  optional?: boolean;
  
  // Rewards for completing this objective
  objectiveRewards?: {
    experience?: number;
    items?: { itemId: string; quantity: number; chance?: number }[];
  };
}

// Quest Reward
export interface QuestReward {
  experience: number;
  money: {
    gold: number;
    silver: number;
    copper: number;
  };
  
  // Items
  guaranteedItems?: {
    itemId: string;
    quantity: number;
  }[];
  
  choiceItems?: {
    itemId: string;
    quantity: number;
  }[]; // Player picks one
  
  // Reputation
  reputation?: {
    factionId: string;
    amount: number;
  }[];
  
  // Skills & Spells
  learnSkills?: string[];
  learnRecipes?: string[];
  
  // Titles & Achievements
  title?: string;
  achievement?: string;
  
  // Currency
  currency?: {
    type: string;
    amount: number;
  }[];
  
  // Other
  unlockQuests?: string[];
  unlockZones?: string[];
  unlockFlightPaths?: string[];
}

// Quest Requirement
export interface QuestRequirement {
  level?: {
    min?: number;
    max?: number;
  };
  
  class?: string[];
  race?: string[];
  faction?: string;
  
  questsCompleted?: string[];
  questsActive?: string[];
  questsNotCompleted?: string[];
  
  reputation?: {
    factionId: string;
    minRank: number;
  }[];
  
  skills?: {
    skillId: string;
    minLevel: number;
  }[];
  
  achievements?: string[];
  items?: string[];
  
  timeRestriction?: {
    startDate?: Date;
    endDate?: Date;
    dayOfWeek?: number[]; // 0-6
    hourOfDay?: { start: number; end: number };
  };
}

// Quest Chain
export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: string[]; // Quest IDs in order
  finalReward?: QuestReward;
}

// Quest
export interface Quest {
  id: string;
  name: string;
  description: string;
  summary?: string; // Short version for quest log
  
  type: QuestType;
  level: number;
  suggestedPlayers?: number;
  
  // Quest giver & turn in
  giver: {
    type: 'npc' | 'object' | 'item' | 'auto';
    id?: string;
    name?: string;
    location?: Position;
  };
  
  turnIn: {
    type: 'npc' | 'object' | 'auto';
    id?: string;
    name?: string;
    location?: Position;
  };
  
  // Requirements
  requirements: QuestRequirement;
  
  // Objectives
  objectives: QuestObjective[];
  
  // Rewards
  rewards: QuestReward;
  
  // Dialogue
  dialogue?: {
    accept: string[];
    progress: string[];
    complete: string[];
    incomplete?: string[]; // When trying to turn in incomplete
  };
  
  // Story
  previousQuest?: string;
  nextQuest?: string;
  questChain?: string;
  
  // Sharing
  shareable: boolean;
  abandonable: boolean;
  
  // Tracking
  autoAccept?: boolean;
  autoComplete?: boolean;
  trackOnAccept?: boolean;
  
  // Map markers
  showGiverOnMap?: boolean;
  showObjectivesOnMap?: boolean;
  showTurnInOnMap?: boolean;
  
  // Scripting
  onAccept?: string; // Script ID
  onComplete?: string; // Script ID
  onAbandon?: string; // Script ID
  
  // Time limit
  timeLimit?: number; // In minutes
  
  // Repeatable settings
  repeatable?: {
    cooldown: number; // In hours
    maxDaily?: number;
    maxWeekly?: number;
    resetTime?: string; // Cron expression
  };
}

// Achievement Category
export enum AchievementCategory {
  GENERAL = 'GENERAL',
  QUESTS = 'QUESTS',
  EXPLORATION = 'EXPLORATION',
  PVP = 'PVP',
  DUNGEONS_RAIDS = 'DUNGEONS_RAIDS',
  PROFESSIONS = 'PROFESSIONS',
  REPUTATION = 'REPUTATION',
  WORLD_EVENTS = 'WORLD_EVENTS',
  COLLECTIONS = 'COLLECTIONS',
  CHARACTER = 'CHARACTER',
  GUILD = 'GUILD',
  FEATS_OF_STRENGTH = 'FEATS_OF_STRENGTH'
}

// Achievement Criteria Type
export enum AchievementCriteriaType {
  KILL_CREATURE = 'KILL_CREATURE',
  WIN_PVP = 'WIN_PVP',
  COMPLETE_QUEST = 'COMPLETE_QUEST',
  COMPLETE_ACHIEVEMENT = 'COMPLETE_ACHIEVEMENT',
  REACH_LEVEL = 'REACH_LEVEL',
  REACH_SKILL_LEVEL = 'REACH_SKILL_LEVEL',
  COMPLETE_DUNGEON = 'COMPLETE_DUNGEON',
  COMPLETE_RAID = 'COMPLETE_RAID',
  LOOT_ITEM = 'LOOT_ITEM',
  LEARN_SKILL = 'LEARN_SKILL',
  EXPLORE_AREA = 'EXPLORE_AREA',
  EARN_REPUTATION = 'EARN_REPUTATION',
  EQUIP_ITEM = 'EQUIP_ITEM',
  USE_ITEM = 'USE_ITEM',
  DEAL_DAMAGE = 'DEAL_DAMAGE',
  HEAL_DAMAGE = 'HEAL_DAMAGE',
  GOLD_EARNED = 'GOLD_EARNED',
  DEATHS = 'DEATHS',
  CUSTOM_STAT = 'CUSTOM_STAT'
}

// Achievement Criteria
export interface AchievementCriteria {
  id: string;
  type: AchievementCriteriaType;
  description: string;
  
  // Target
  targetId?: string;
  targetName?: string;
  quantity: number;
  
  // Conditions
  conditions?: {
    map?: string;
    area?: string;
    difficulty?: string;
    withClass?: string[];
    withRace?: string[];
    inTime?: number; // Seconds
    withoutDying?: boolean;
    solo?: boolean;
    inGroup?: boolean;
    duringEvent?: string;
  };
  
  // Progress tracking
  showProgress: boolean;
  progressText?: string;
  hidden?: boolean; // Hidden until discovered
}

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  
  category: AchievementCategory;
  subcategory?: string;
  
  icon: string;
  points: number;
  
  // Criteria
  criteria: AchievementCriteria[];
  requireAll: boolean; // true = AND, false = OR
  
  // Requirements
  requirements?: {
    achievements?: string[];
    faction?: string;
    class?: string[];
    race?: string[];
    season?: string;
  };
  
  // Rewards
  rewards?: {
    title?: string;
    mount?: string;
    pet?: string;
    toy?: string;
    transmog?: string[];
    currency?: {
      type: string;
      amount: number;
    }[];
  };
  
  // Display
  hidden?: boolean; // Hidden until first criteria met
  tracking?: boolean; // Auto-track progress
  accountWide?: boolean;
  
  // Statistics
  showInStatistics?: boolean;
  statisticOrder?: number;
  
  // Related
  previousAchievement?: string; // For chains
  nextAchievement?: string;
  relatedAchievements?: string[];
  
  // Meta achievement
  metaAchievement?: boolean;
  requiredAchievements?: string[]; // For meta
  
  // Feats of Strength
  featOfStrength?: boolean;
  removedInVersion?: string;
}

// Statistics
export interface Statistic {
  id: string;
  name: string;
  category: string;
  
  type: 'highest' | 'total' | 'average' | 'fastest' | 'count';
  value: number;
  
  format?: string; // e.g., "{0} gold earned"
  hidden?: boolean;
  accountWide?: boolean;
}

// Quest Schema
export const QuestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  type: z.nativeEnum(QuestType),
  level: z.number().min(1),
  objectives: z.array(z.object({
    type: z.nativeEnum(QuestObjectiveType),
    description: z.string(),
    quantity: z.number().min(1)
  })).min(1)
});

// Achievement Schema
export const AchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: z.nativeEnum(AchievementCategory),
  points: z.number().min(0).max(100),
  criteria: z.array(z.object({
    type: z.nativeEnum(AchievementCriteriaType),
    description: z.string(),
    quantity: z.number().min(1)
  })).min(1)
});

// Quest Accept Schema
export const QuestAcceptSchema = z.object({
  questId: z.string(),
  sharedBy: z.string().optional()
});

// Quest Complete Schema  
export const QuestCompleteSchema = z.object({
  questId: z.string(),
  rewardChoice: z.number().optional()
});
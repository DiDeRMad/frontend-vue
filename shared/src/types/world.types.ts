import { z } from 'zod';
import { Position, Rotation, PlayerStats } from './player.types';
import { LootTable } from './item.types';
import { Skill } from './skill.types';

// NPC Types
export enum NPCType {
  FRIENDLY = 'FRIENDLY',
  NEUTRAL = 'NEUTRAL',
  HOSTILE = 'HOSTILE',
  VENDOR = 'VENDOR',
  QUEST_GIVER = 'QUEST_GIVER',
  TRAINER = 'TRAINER',
  GUARD = 'GUARD',
  BOSS = 'BOSS',
  RARE = 'RARE',
  ELITE = 'ELITE',
  CRITTER = 'CRITTER',
  COMPANION = 'COMPANION'
}

// Creature Types
export enum CreatureType {
  HUMANOID = 'HUMANOID',
  BEAST = 'BEAST',
  DRAGON = 'DRAGON',
  ELEMENTAL = 'ELEMENTAL',
  UNDEAD = 'UNDEAD',
  DEMON = 'DEMON',
  MECHANICAL = 'MECHANICAL',
  GIANT = 'GIANT',
  ABERRATION = 'ABERRATION',
  PLANT = 'PLANT',
  CONSTRUCT = 'CONSTRUCT',
  CELESTIAL = 'CELESTIAL',
  FEY = 'FEY',
  OOZE = 'OOZE',
  INSECT = 'INSECT'
}

// NPC Behavior
export enum NPCBehavior {
  AGGRESSIVE = 'AGGRESSIVE',
  DEFENSIVE = 'DEFENSIVE',
  PASSIVE = 'PASSIVE',
  FLEE = 'FLEE',
  PATROL = 'PATROL',
  GUARD = 'GUARD',
  FOLLOW = 'FOLLOW',
  WANDER = 'WANDER',
  STATIONARY = 'STATIONARY'
}

// Zone Types
export enum ZoneType {
  CITY = 'CITY',
  TOWN = 'TOWN',
  VILLAGE = 'VILLAGE',
  WILDERNESS = 'WILDERNESS',
  DUNGEON = 'DUNGEON',
  RAID = 'RAID',
  BATTLEGROUND = 'BATTLEGROUND',
  ARENA = 'ARENA',
  INSTANCE = 'INSTANCE',
  SANCTUARY = 'SANCTUARY',
  CONTESTED = 'CONTESTED'
}

// Weather Types
export enum WeatherType {
  CLEAR = 'CLEAR',
  CLOUDY = 'CLOUDY',
  RAIN = 'RAIN',
  STORM = 'STORM',
  SNOW = 'SNOW',
  BLIZZARD = 'BLIZZARD',
  FOG = 'FOG',
  SANDSTORM = 'SANDSTORM',
  VOLCANIC_ASH = 'VOLCANIC_ASH'
}

// Faction
export interface Faction {
  id: string;
  name: string;
  description: string;
  baseReputation: number;
  maxReputation: number;
  hostileTo: string[]; // Faction IDs
  friendlyTo: string[]; // Faction IDs
  ranks: {
    name: string;
    minReputation: number;
    rewards?: {
      items?: string[];
      titles?: string[];
      discounts?: number;
    };
  }[];
}

// NPC Stats
export interface NPCStats extends PlayerStats {
  threat: number;
  alertRadius: number;
  chaseRadius: number;
  respawnTime: number;
}

// NPC Dialogue
export interface NPCDialogue {
  id: string;
  text: string;
  voiceFile?: string;
  options?: {
    id: string;
    text: string;
    conditions?: {
      questRequired?: string;
      questCompleted?: string;
      itemRequired?: string;
      levelRequired?: number;
      reputationRequired?: {
        factionId: string;
        rank: number;
      };
    };
    action?: {
      type: 'quest' | 'shop' | 'train' | 'teleport' | 'bank' | 'craft';
      data?: any;
    };
    nextDialogue?: string;
  }[];
}

// Vendor Item
export interface VendorItem {
  itemId: string;
  stock: number; // -1 for unlimited
  restockTime?: number; // In minutes
  cost: {
    currency: string;
    amount: number;
  };
  alternativeCost?: {
    itemId: string;
    quantity: number;
  }[];
  requiredReputation?: {
    factionId: string;
    rank: number;
  };
}

// Trainer Skill
export interface TrainerSkill {
  skillId: string;
  requiredLevel: number;
  cost: number;
  requiredSkills?: string[];
}

// Patrol Point
export interface PatrolPoint {
  position: Position;
  waitTime?: number; // In seconds
  animation?: string;
  facingDirection?: Rotation;
}

// Spawn Point
export interface SpawnPoint {
  id: string;
  position: Position;
  rotation: Rotation;
  radius: number; // Random spawn within radius
  maxCount: number;
  respawnTime: number; // In seconds
  conditions?: {
    timeOfDay?: { start: number; end: number };
    weather?: WeatherType[];
    event?: string;
  };
}

// NPC (Non-Player Character)
export interface NPC {
  id: string;
  name: string;
  title?: string;
  level: number;
  
  type: NPCType;
  creatureType: CreatureType;
  behavior: NPCBehavior;
  
  stats: NPCStats;
  skills: string[]; // Skill IDs
  
  faction?: string;
  reputation?: number;
  
  model: string;
  scale?: number;
  
  // Loot
  lootTable?: string; // LootTable ID
  skinnable?: boolean;
  pickpocketable?: boolean;
  
  // Vendor
  vendorItems?: VendorItem[];
  
  // Trainer
  trainerSkills?: TrainerSkill[];
  
  // Quest
  questsAvailable?: string[];
  questsToTurnIn?: string[];
  
  // Dialogue
  dialogues?: NPCDialogue[];
  greetingText?: string;
  
  // AI
  aggroRadius: number;
  leashRadius: number;
  callForHelpRadius?: number;
  fleeAtHealth?: number; // Percentage
  
  // Patrol
  patrolPath?: PatrolPoint[];
  
  // Immunities
  immunities?: {
    stun?: boolean;
    slow?: boolean;
    root?: boolean;
    fear?: boolean;
    poison?: boolean;
    bleed?: boolean;
  };
  
  // Special Abilities
  phases?: {
    healthPercentage: number;
    skills: string[];
    immunities?: string[];
    enrage?: boolean;
  }[];
  
  // Events
  onSpawn?: string; // Script ID
  onDeath?: string; // Script ID
  onAggro?: string; // Script ID
  onEvade?: string; // Script ID
}

// Zone
export interface Zone {
  id: string;
  name: string;
  description: string;
  
  type: ZoneType;
  level: { min: number; max: number };
  
  bounds: {
    min: Position;
    max: Position;
  };
  
  // Environment
  terrain: string;
  weather?: {
    type: WeatherType;
    chance: number;
    duration: { min: number; max: number };
  }[];
  ambientMusic?: string[];
  ambientSounds?: string[];
  
  // Sub-zones
  subZones?: {
    id: string;
    name: string;
    bounds: {
      min: Position;
      max: Position;
    };
    type?: string;
    music?: string;
  }[];
  
  // Spawns
  npcSpawns: {
    npcId: string;
    spawnPoints: SpawnPoint[];
  }[];
  
  // Objects
  gameObjects: GameObject[];
  
  // Resources
  resourceNodes: ResourceNode[];
  
  // PvP
  pvpEnabled: boolean;
  sanctuaryAreas?: {
    bounds: { min: Position; max: Position };
  }[];
  
  // Graveyards
  graveyards: {
    id: string;
    position: Position;
    faction?: string;
  }[];
  
  // Flight paths
  flightPaths?: {
    id: string;
    position: Position;
    name: string;
    faction?: string;
    destinations: string[]; // Flight path IDs
  }[];
  
  // Zone events
  events?: {
    id: string;
    name: string;
    schedule?: {
      startTime: string; // Cron expression
      duration: number; // In minutes
    };
    spawns?: string[]; // Special spawn IDs
    worldState?: Record<string, any>;
  }[];
}

// Game Object Types
export enum GameObjectType {
  CHEST = 'CHEST',
  HERB = 'HERB',
  ORE = 'ORE',
  FISHING = 'FISHING',
  QUEST = 'QUEST',
  DOOR = 'DOOR',
  TRAP = 'TRAP',
  PORTAL = 'PORTAL',
  MEETING_STONE = 'MEETING_STONE',
  MAILBOX = 'MAILBOX',
  AUCTION_HOUSE = 'AUCTION_HOUSE',
  BANK = 'BANK',
  FORGE = 'FORGE',
  ANVIL = 'ANVIL',
  CAMPFIRE = 'CAMPFIRE'
}

// Game Object
export interface GameObject {
  id: string;
  name: string;
  type: GameObjectType;
  
  position: Position;
  rotation: Rotation;
  
  model: string;
  
  // Interaction
  interactRadius: number;
  interactTime?: number; // Cast time in seconds
  
  // Loot
  lootTable?: string;
  
  // Quest
  questRequired?: string;
  questItem?: string;
  
  // Lock
  locked?: boolean;
  lockLevel?: number;
  keyRequired?: string;
  
  // Trap
  trap?: {
    damage: { min: number; max: number };
    type: string;
    radius: number;
    triggerRadius: number;
    disarmable: boolean;
    disarmLevel: number;
  };
  
  // Portal
  destination?: Position;
  
  // Respawn
  respawnTime?: number;
  
  // Events
  onInteract?: string; // Script ID
  onOpen?: string; // Script ID
}

// Resource Node
export interface ResourceNode {
  id: string;
  name: string;
  type: 'herb' | 'ore' | 'leather' | 'cloth' | 'wood' | 'fish';
  
  position: Position;
  
  skill: string; // Skill ID required
  skillLevel: number;
  
  lootTable: string;
  
  respawnTime: number;
  sharedSpawn?: string[]; // Other nodes that share spawn
}

// World Event
export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  
  startDate: Date;
  endDate: Date;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
    duration: number; // In hours
  };
  
  // World changes
  zoneModifications?: {
    zoneId: string;
    spawns?: string[];
    quests?: string[];
    vendors?: string[];
    decorations?: GameObject[];
  }[];
  
  // Rewards
  achievements?: string[];
  titles?: string[];
  currencies?: {
    id: string;
    name: string;
    icon: string;
    maxAmount: number;
  }[];
  
  // Special mechanics
  buffs?: {
    id: string;
    name: string;
    effect: string;
  }[];
}

// Dungeon/Raid Instance
export interface Instance {
  id: string;
  name: string;
  description: string;
  
  type: 'dungeon' | 'raid';
  difficulty: 'normal' | 'heroic' | 'mythic' | 'mythic_plus';
  
  minLevel: number;
  maxPlayers: number;
  minPlayers?: number;
  
  lockoutDuration?: number; // In hours
  
  zones: string[]; // Zone IDs
  
  bosses: {
    npcId: string;
    required: boolean; // Required to complete instance
    lootTable: string;
    achievements?: string[];
  }[];
  
  // Mythic+ affixes
  affixes?: {
    id: string;
    name: string;
    description: string;
    minLevel: number; // Mythic+ level
  }[];
  
  // Time limit for Mythic+
  timeLimit?: number; // In minutes
  
  // Completion rewards
  completionRewards?: {
    experience: number;
    currency?: { type: string; amount: number }[];
    items?: string[];
    reputation?: { factionId: string; amount: number }[];
  };
}

// Transportation
export interface Transportation {
  id: string;
  name: string;
  type: 'boat' | 'zeppelin' | 'tram' | 'elevator';
  
  route: {
    start: Position;
    end: Position;
    waypoints?: Position[];
  };
  
  schedule: {
    departureInterval: number; // In minutes
    travelTime: number; // In seconds
  };
  
  model: string;
  
  // Passengers
  maxPassengers?: number;
  faction?: string;
}

// World Schema
export const ZoneSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ZoneType),
  level: z.object({
    min: z.number().min(1),
    max: z.number().min(1)
  }),
  pvpEnabled: z.boolean()
});

// NPC Schema
export const NPCSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.number().min(1),
  type: z.nativeEnum(NPCType),
  creatureType: z.nativeEnum(CreatureType),
  behavior: z.nativeEnum(NPCBehavior)
});
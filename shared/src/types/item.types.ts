import { z } from 'zod';
import { PlayerClass, PlayerStats } from './player.types';

// Item Types
export enum ItemType {
  // Weapons
  SWORD = 'SWORD',
  AXE = 'AXE',
  MACE = 'MACE',
  DAGGER = 'DAGGER',
  SPEAR = 'SPEAR',
  STAFF = 'STAFF',
  WAND = 'WAND',
  BOW = 'BOW',
  CROSSBOW = 'CROSSBOW',
  GUN = 'GUN',
  THROWN = 'THROWN',
  FIST_WEAPON = 'FIST_WEAPON',
  POLEARM = 'POLEARM',
  
  // Armor
  CLOTH = 'CLOTH',
  LEATHER = 'LEATHER',
  MAIL = 'MAIL',
  PLATE = 'PLATE',
  SHIELD = 'SHIELD',
  
  // Accessories
  RING = 'RING',
  NECKLACE = 'NECKLACE',
  TRINKET = 'TRINKET',
  CLOAK = 'CLOAK',
  
  // Consumables
  POTION = 'POTION',
  ELIXIR = 'ELIXIR',
  FLASK = 'FLASK',
  FOOD = 'FOOD',
  BANDAGE = 'BANDAGE',
  SCROLL = 'SCROLL',
  RUNE = 'RUNE',
  
  // Materials
  ORE = 'ORE',
  HERB = 'HERB',
  CLOTH_MATERIAL = 'CLOTH_MATERIAL',
  LEATHER_MATERIAL = 'LEATHER_MATERIAL',
  GEM = 'GEM',
  ENCHANTING_MATERIAL = 'ENCHANTING_MATERIAL',
  ALCHEMY_MATERIAL = 'ALCHEMY_MATERIAL',
  COOKING_MATERIAL = 'COOKING_MATERIAL',
  
  // Special
  QUEST_ITEM = 'QUEST_ITEM',
  KEY = 'KEY',
  CONTAINER = 'CONTAINER',
  CURRENCY = 'CURRENCY',
  RECIPE = 'RECIPE',
  BOOK = 'BOOK',
  MAP = 'MAP',
  TOKEN = 'TOKEN',
  MOUNT_ITEM = 'MOUNT_ITEM',
  PET_ITEM = 'PET_ITEM',
  TOY = 'TOY',
  COSMETIC = 'COSMETIC'
}

// Item Rarity
export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  ARTIFACT = 'ARTIFACT',
  HEIRLOOM = 'HEIRLOOM'
}

// Equipment Slots
export enum EquipmentSlot {
  HEAD = 'HEAD',
  NECK = 'NECK',
  SHOULDERS = 'SHOULDERS',
  CHEST = 'CHEST',
  BACK = 'BACK',
  WRISTS = 'WRISTS',
  HANDS = 'HANDS',
  WAIST = 'WAIST',
  LEGS = 'LEGS',
  FEET = 'FEET',
  RING1 = 'RING1',
  RING2 = 'RING2',
  TRINKET1 = 'TRINKET1',
  TRINKET2 = 'TRINKET2',
  MAIN_HAND = 'MAIN_HAND',
  OFF_HAND = 'OFF_HAND',
  RANGED = 'RANGED'
}

// Item Binding
export enum ItemBinding {
  NONE = 'NONE',
  ON_PICKUP = 'ON_PICKUP',
  ON_EQUIP = 'ON_EQUIP',
  ON_USE = 'ON_USE',
  TO_ACCOUNT = 'TO_ACCOUNT'
}

// Item Stats
export interface ItemStats {
  // Primary Stats
  strength?: number;
  agility?: number;
  intelligence?: number;
  stamina?: number;
  spirit?: number;
  
  // Secondary Stats
  attackPower?: number;
  spellPower?: number;
  criticalChance?: number;
  criticalDamage?: number;
  haste?: number;
  mastery?: number;
  versatility?: number;
  
  // Defensive Stats
  armor?: number;
  dodge?: number;
  parry?: number;
  block?: number;
  blockValue?: number;
  
  // Resistances
  fireResistance?: number;
  iceResistance?: number;
  lightningResistance?: number;
  poisonResistance?: number;
  holyResistance?: number;
  darkResistance?: number;
  
  // Other Stats
  movementSpeed?: number;
  attackSpeed?: number;
  lifeSteal?: number;
  manaRegen?: number;
  healthRegen?: number;
}

// Item Effects
export interface ItemEffect {
  id: string;
  type: 'on_use' | 'on_equip' | 'on_hit' | 'on_damage_taken' | 'passive';
  name: string;
  description: string;
  chance?: number; // Proc chance percentage
  cooldown?: number; // Cooldown in seconds
  duration?: number; // Effect duration in seconds
  stacks?: number;
  
  // Effect Data
  damage?: {
    min: number;
    max: number;
    type: 'physical' | 'magic' | 'fire' | 'ice' | 'lightning' | 'poison' | 'holy' | 'dark';
  };
  heal?: {
    min: number;
    max: number;
    percentage?: boolean;
  };
  buff?: {
    stat: keyof PlayerStats;
    value: number;
    percentage?: boolean;
  }[];
  debuff?: {
    stat: keyof PlayerStats;
    value: number;
    percentage?: boolean;
  }[];
  summon?: {
    creatureId: string;
    duration: number;
    maxCount: number;
  };
  teleport?: {
    locationId: string;
    castTime: number;
  };
}

// Item Requirements
export interface ItemRequirements {
  level?: number;
  class?: PlayerClass[];
  reputation?: {
    factionId: string;
    rank: number;
  }[];
  quest?: string;
  achievement?: string;
  profession?: {
    professionId: string;
    level: number;
  };
  stats?: Partial<PlayerStats>;
}

// Socket Types
export enum SocketType {
  RED = 'RED', // Strength gems
  BLUE = 'BLUE', // Intelligence gems
  YELLOW = 'YELLOW', // Agility gems
  META = 'META', // Special gems
  PRISMATIC = 'PRISMATIC' // Any gem
}

// Item Socket
export interface ItemSocket {
  type: SocketType;
  gemId?: string;
  bonus?: ItemStats; // Socket bonus when matching colors
}

// Enchantment
export interface Enchantment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot[];
  stats?: ItemStats;
  effects?: ItemEffect[];
  requiredLevel?: number;
  requiredProfession?: {
    professionId: string;
    level: number;
  };
}

// Item Set
export interface ItemSet {
  id: string;
  name: string;
  items: string[]; // Item IDs
  bonuses: {
    pieces: number;
    stats?: ItemStats;
    effects?: ItemEffect[];
  }[];
}

// Upgrade Path
export interface UpgradePath {
  targetItemId: string;
  materials: {
    itemId: string;
    quantity: number;
  }[];
  currency?: {
    type: string;
    amount: number;
  };
  requiredLevel?: number;
  requiredProfession?: {
    professionId: string;
    level: number;
  };
}

// Item Durability
export interface ItemDurability {
  current: number;
  max: number;
  repairCost: number;
  breakable: boolean;
}

// Item Instance (Actual item in game)
export interface ItemInstance {
  id: string; // Unique instance ID
  itemId: string; // Reference to base item
  ownerId?: string; // Player ID
  quantity: number;
  
  // Variable Properties
  durability?: ItemDurability;
  enchantmentId?: string;
  gems?: string[]; // Gem item IDs
  randomStats?: ItemStats; // For random stat items
  
  // Binding
  boundTo?: string; // Player ID if bound
  bindingType?: ItemBinding;
  
  // Trading
  tradeable: boolean;
  sellPrice?: number;
  
  // Timestamps
  createdAt: Date;
  obtainedAt?: Date;
  lastModified?: Date;
}

// Base Item Definition
export interface Item {
  id: string;
  name: string;
  description: string;
  lore?: string;
  
  type: ItemType;
  subType?: string;
  rarity: ItemRarity;
  
  icon: string;
  model?: string;
  
  // Equipment Properties
  slot?: EquipmentSlot;
  twoHanded?: boolean;
  
  // Stats and Effects
  stats?: ItemStats;
  effects?: ItemEffect[];
  
  // Requirements
  requirements?: ItemRequirements;
  
  // Sockets
  sockets?: ItemSocket[];
  
  // Set Information
  setId?: string;
  
  // Upgrade
  upgradePaths?: UpgradePath[];
  
  // Item Properties
  stackSize: number;
  binding: ItemBinding;
  unique?: boolean;
  uniqueEquipped?: boolean;
  
  // Economy
  vendorPrice: number;
  disenchantable?: boolean;
  disenchantMaterials?: {
    itemId: string;
    quantity: number;
    chance: number;
  }[];
  
  // Consumable Properties
  consumable?: {
    charges: number;
    cooldown: number;
    sharedCooldown?: string;
  };
  
  // Container Properties
  container?: {
    slots: number;
    itemTypes?: ItemType[];
  };
  
  // Quest Properties
  questItem?: {
    questId: string;
    objectives: string[];
  };
  
  // Crafting
  craftable?: {
    professionId: string;
    requiredLevel: number;
    materials: {
      itemId: string;
      quantity: number;
    }[];
    createsQuantity: number;
  };
  
  // Source Information
  sources?: {
    type: 'drop' | 'quest' | 'vendor' | 'craft' | 'achievement' | 'event';
    id: string;
    chance?: number;
  }[];
}

// Loot Table
export interface LootTable {
  id: string;
  name: string;
  items: {
    itemId: string;
    chance: number; // 0-100
    minQuantity: number;
    maxQuantity: number;
    conditions?: {
      minLevel?: number;
      maxLevel?: number;
      questRequired?: string;
      questCompleted?: string;
    };
  }[];
  guaranteedItems?: {
    itemId: string;
    quantity: number;
  }[];
  currency?: {
    type: string;
    min: number;
    max: number;
  };
}

// Item Schema
export const ItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.nativeEnum(ItemType),
  rarity: z.nativeEnum(ItemRarity),
  stackSize: z.number().min(1).max(999),
  vendorPrice: z.number().min(0),
  binding: z.nativeEnum(ItemBinding)
});

// Item Trade Schema
export const ItemTradeSchema = z.object({
  itemInstanceId: z.string(),
  quantity: z.number().min(1),
  price: z.number().min(0)
});

// Item Use Schema
export const ItemUseSchema = z.object({
  itemInstanceId: z.string(),
  targetId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }).optional()
});
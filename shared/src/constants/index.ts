// Game Version
export const GAME_VERSION = '1.0.0';
export const PROTOCOL_VERSION = 1;

// Server Configuration
export const SERVER_TICK_RATE = 20; // 20 ticks per second
export const WORLD_SAVE_INTERVAL = 300000; // 5 minutes in milliseconds

// Player Constants
export const MAX_LEVEL = 100;
export const STARTING_LEVEL = 1;
export const STARTING_GOLD = 0;
export const STARTING_ZONE = 'zone_starting_human';

// Character Limits
export const MAX_CHARACTER_NAME_LENGTH = 16;
export const MIN_CHARACTER_NAME_LENGTH = 3;
export const MAX_CHARACTERS_PER_ACCOUNT = 10;

// Inventory
export const INVENTORY_SLOTS = 120;
export const BANK_SLOTS = 280;
export const MAX_STACK_SIZE = 999;

// Combat
export const GLOBAL_COOLDOWN = 1500; // 1.5 seconds in milliseconds
export const MAX_COMBAT_RANGE = 50;
export const COMBAT_LEAVE_TIME = 6000; // 6 seconds
export const RESURRECT_SICKNESS_DURATION = 600000; // 10 minutes

// PvP
export const PVP_FLAG_DURATION = 300000; // 5 minutes
export const HONOR_KILL_LEVEL_RANGE = 10;
export const ARENA_TEAM_SIZES = [2, 3, 5];
export const BATTLEGROUND_MIN_LEVEL = 10;

// Stats
export const BASE_STATS = {
  WARRIOR: { strength: 20, agility: 15, intelligence: 10, stamina: 18, spirit: 12 },
  MAGE: { strength: 10, agility: 12, intelligence: 20, stamina: 13, spirit: 18 },
  ARCHER: { strength: 12, agility: 20, intelligence: 13, stamina: 15, spirit: 13 },
  ROGUE: { strength: 14, agility: 19, intelligence: 12, stamina: 14, spirit: 14 },
  PALADIN: { strength: 18, agility: 13, intelligence: 14, stamina: 17, spirit: 15 },
  NECROMANCER: { strength: 11, agility: 13, intelligence: 19, stamina: 14, spirit: 16 },
  DRUID: { strength: 14, agility: 15, intelligence: 16, stamina: 16, spirit: 17 },
  BERSERKER: { strength: 22, agility: 16, intelligence: 8, stamina: 20, spirit: 10 },
  PRIEST: { strength: 9, agility: 11, intelligence: 18, stamina: 12, spirit: 20 },
  RANGER: { strength: 13, agility: 18, intelligence: 14, stamina: 16, spirit: 14 },
  ASSASSIN: { strength: 15, agility: 21, intelligence: 11, stamina: 13, spirit: 12 },
  WARLOCK: { strength: 10, agility: 12, intelligence: 19, stamina: 15, spirit: 17 },
  MONK: { strength: 16, agility: 17, intelligence: 15, stamina: 16, spirit: 16 },
  SHAMAN: { strength: 15, agility: 14, intelligence: 17, stamina: 15, spirit: 18 },
  BARD: { strength: 12, agility: 14, intelligence: 16, stamina: 14, spirit: 19 }
};

// Stat Conversions
export const STAT_CONVERSIONS = {
  STRENGTH_TO_ATTACK_POWER: 2,
  AGILITY_TO_CRIT: 0.05, // 0.05% crit per agility
  AGILITY_TO_DODGE: 0.04, // 0.04% dodge per agility
  INTELLIGENCE_TO_SPELL_POWER: 1.5,
  INTELLIGENCE_TO_MANA: 15,
  STAMINA_TO_HEALTH: 10,
  SPIRIT_TO_MANA_REGEN: 0.5,
  SPIRIT_TO_HEALTH_REGEN: 0.2,
  ARMOR_TO_DAMAGE_REDUCTION: 0.0001 // Simplified formula
};

// Experience Formula Constants
export const EXP_CONSTANTS = {
  BASE_EXP: 100,
  LEVEL_MULTIPLIER: 1.5,
  QUEST_BONUS: 2.0,
  GROUP_BONUS: 1.1,
  RESTED_BONUS: 2.0,
  MOB_LEVEL_DIFFERENCE_PENALTY: 0.1
};

// Movement Speeds (units per second)
export const MOVEMENT_SPEEDS = {
  WALK: 2.5,
  RUN: 7.0,
  SWIM: 4.5,
  FLY: 14.0,
  MOUNT_GROUND: 10.0,
  MOUNT_FLYING: 21.0,
  MOUNT_EPIC_GROUND: 14.0,
  MOUNT_EPIC_FLYING: 28.0
};

// Chat Ranges
export const CHAT_RANGES = {
  SAY: 25,
  YELL: 300,
  EMOTE: 25
};

// Loot
export const LOOT_ROLL_TIME = 60000; // 60 seconds
export const LOOT_THRESHOLD = {
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5
};

// Guild
export const GUILD_CREATION_COST = 10000; // 1 gold in copper
export const GUILD_BANK_TABS = 8;
export const GUILD_BANK_SLOTS_PER_TAB = 98;
export const GUILD_RANKS = 10;
export const GUILD_MEMBER_LIMIT = 1000;

// Party & Raid
export const PARTY_SIZE = 5;
export const RAID_SIZE = 40;
export const RAID_GROUP_SIZE = 5;
export const DUNGEON_RESET_TIME = 86400000; // 24 hours
export const RAID_RESET_TIME = 604800000; // 7 days

// Trading
export const TRADE_DISTANCE = 10;
export const TRADE_SLOTS = 7;
export const AUCTION_HOUSE_CUT = 0.05; // 5% fee
export const MAIL_EXPIRY_TIME = 2592000000; // 30 days
export const COD_MAIL_EXPIRY_TIME = 259200000; // 3 days

// Profession
export const MAX_PROFESSIONS = 2;
export const MAX_SECONDARY_PROFESSIONS = 4;
export const PROFESSION_MAX_SKILL = 800;
export const GATHERING_RESPAWN_TIME = 120000; // 2 minutes

// Currency Conversion
export const COPPER_PER_SILVER = 100;
export const SILVER_PER_GOLD = 100;
export const COPPER_PER_GOLD = 10000;

// Reputation
export const REPUTATION_LEVELS = {
  HATED: -42000,
  HOSTILE: -6000,
  UNFRIENDLY: -3000,
  NEUTRAL: 0,
  FRIENDLY: 3000,
  HONORED: 9000,
  REVERED: 21000,
  EXALTED: 42000
};

// Damage Types
export const DAMAGE_SCHOOLS = {
  PHYSICAL: 0,
  HOLY: 1,
  FIRE: 2,
  NATURE: 3,
  FROST: 4,
  SHADOW: 5,
  ARCANE: 6
};

// Creature Families (for Hunter pets, etc.)
export const CREATURE_FAMILIES = {
  WOLF: { diet: 'meat', abilities: ['bite', 'howl'] },
  CAT: { diet: 'meat', abilities: ['claw', 'prowl'] },
  BEAR: { diet: 'omnivore', abilities: ['swipe', 'growl'] },
  BIRD: { diet: 'meat', abilities: ['claw', 'screech'] },
  BOAR: { diet: 'omnivore', abilities: ['charge', 'gore'] },
  SPIDER: { diet: 'meat', abilities: ['web', 'poison'] },
  TURTLE: { diet: 'omnivore', abilities: ['shell_shield', 'bite'] },
  RAPTOR: { diet: 'meat', abilities: ['dash', 'savage_rend'] }
};

// World Constants
export const WORLD_WIDTH = 100000;
export const WORLD_HEIGHT = 100000;
export const CHUNK_SIZE = 1000;
export const VIEW_DISTANCE = 500;
export const SPAWN_DISTANCE = 300;
export const DESPAWN_DISTANCE = 600;

// Network
export const MAX_PACKET_SIZE = 65536;
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const CONNECTION_TIMEOUT = 300000; // 5 minutes

// Database
export const DB_POOL_SIZE = 20;
export const DB_CONNECTION_TIMEOUT = 60000;
export const DB_IDLE_TIMEOUT = 600000;

// API Rate Limits
export const RATE_LIMITS = {
  CHAT: { points: 10, duration: 60000 }, // 10 messages per minute
  MOVEMENT: { points: 60, duration: 1000 }, // 60 updates per second
  COMBAT: { points: 20, duration: 1000 }, // 20 actions per second
  TRADE: { points: 5, duration: 60000 }, // 5 trades per minute
  MAIL: { points: 10, duration: 300000 } // 10 mails per 5 minutes
};

// Error Codes
export const ERROR_CODES = {
  // General
  UNKNOWN_ERROR: 1000,
  INVALID_REQUEST: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  RATE_LIMITED: 1005,
  
  // Player
  PLAYER_NOT_FOUND: 2000,
  PLAYER_OFFLINE: 2001,
  PLAYER_BUSY: 2002,
  PLAYER_DEAD: 2003,
  
  // Combat
  TARGET_OUT_OF_RANGE: 3000,
  TARGET_NOT_VISIBLE: 3001,
  NOT_ENOUGH_RESOURCES: 3002,
  ON_COOLDOWN: 3003,
  INVALID_TARGET: 3004,
  
  // Items
  INVENTORY_FULL: 4000,
  ITEM_NOT_FOUND: 4001,
  CANNOT_EQUIP: 4002,
  CANNOT_USE: 4003,
  
  // Social
  ALREADY_IN_GROUP: 5000,
  GROUP_FULL: 5001,
  GUILD_FULL: 5002,
  ALREADY_IN_GUILD: 5003,
  
  // Trade
  TRADE_DISTANCE_TOO_FAR: 6000,
  TRADE_CANCELLED: 6001,
  NOT_ENOUGH_GOLD: 6002,
  
  // Quest
  QUEST_NOT_AVAILABLE: 7000,
  QUEST_ALREADY_COMPLETED: 7001,
  QUEST_LOG_FULL: 7002
};
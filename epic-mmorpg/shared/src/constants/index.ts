// Game Configuration Constants
export const GAME_CONFIG = {
  MAX_LEVEL: 100,
  MAX_ITEM_LEVEL: 1000,
  MAX_SKILL_RANK: 1000,
  MAX_REPUTATION: 999999,
  MAX_GOLD: 9999999999,
  MAX_INVENTORY_SLOTS: 140,
  MAX_BANK_SLOTS: 280,
  MAX_GUILD_BANK_TABS: 8,
  MAX_GUILD_MEMBERS: 1000,
  MAX_FRIENDS: 200,
  MAX_IGNORED: 200,
  MAX_MAIL_ITEMS: 12,
  MAX_AUCTION_DURATION: 72 * 60 * 60 * 1000, // 72 hours
  MAX_TRADE_ITEMS: 7,
  MAX_PARTY_SIZE: 5,
  MAX_RAID_SIZE: 40,
  MAX_BATTLEGROUND_SIZE: 40,
  MAX_ARENA_TEAM_SIZE: 5,
  MAX_CHAT_MESSAGE_LENGTH: 500,
  MAX_NAME_LENGTH: 16,
  MIN_NAME_LENGTH: 2,
  MAX_GUILD_NAME_LENGTH: 24,
  MIN_GUILD_NAME_LENGTH: 3,
  MAX_NOTE_LENGTH: 200,
  MAX_MACRO_LENGTH: 1024,
  MAX_TALENT_POINTS: 71,
  MAX_PROFESSION_SKILL: 1000,
  MAX_ACHIEVEMENT_POINTS: 50000,
  RESTED_XP_RATE: 2,
  RESTED_XP_CAP: 1.5, // 150% of level
  DEATH_PENALTY_DURABILITY: 0.1, // 10% durability loss
  RESURRECTION_SICKNESS_DURATION: 10 * 60 * 1000, // 10 minutes
  HEARTHSTONE_COOLDOWN: 30 * 60 * 1000, // 30 minutes
  INSTANCE_RESET_TIMER: 60 * 60 * 1000, // 1 hour
  PVP_FLAG_DURATION: 5 * 60 * 1000, // 5 minutes
  COMBAT_LOG_RANGE: 100,
  INTERACTION_RANGE: 5,
  TRADE_RANGE: 10,
  INSPECT_RANGE: 30,
  SAY_CHAT_RANGE: 25,
  YELL_CHAT_RANGE: 300,
  EMOTE_RANGE: 100,
  GROUP_LOOT_RANGE: 100,
  QUEST_SHARE_RANGE: 100,
  SUMMON_RANGE: 100,
  FOLLOW_RANGE: 50,
  DUEL_RANGE: 40,
  AOE_CAP: 20,
  DEBUFF_LIMIT: 40,
  BUFF_LIMIT: 40,
  SPELL_QUEUE_WINDOW: 400, // ms
  BATCH_WINDOW: 10, // ms
  WORLD_TICK_RATE: 50, // ms
  MOVEMENT_TICK_RATE: 100, // ms
  COMBAT_REACH: 5,
  TARGET_SWITCHING_DELAY: 150, // ms
  GLOBAL_COOLDOWN: 1500, // ms
  MIN_GLOBAL_COOLDOWN: 1000, // ms
} as const;

// Experience Table
export const EXPERIENCE_TABLE: Record<number, number> = (() => {
  const table: Record<number, number> = {};
  for (let level = 1; level <= GAME_CONFIG.MAX_LEVEL; level++) {
    table[level] = Math.floor(
      (8 * level + Math.pow(level, 2) - 4) * (5 * Math.pow(level, 2) - 5 * level - 20)
    );
  }
  return table;
})();

// Stat Formulas
export const STAT_FORMULAS = {
  // Base stats per level
  HEALTH_PER_STAMINA: 10,
  MANA_PER_INTELLECT: 15,
  BASE_HEALTH: 100,
  BASE_MANA: 100,
  
  // Combat ratings at max level
  RATING_PER_PERCENT: {
    CRITICAL: 35,
    HASTE: 32.5,
    MASTERY: 35,
    VERSATILITY: 40,
    HIT: 30,
    EXPERTISE: 30,
    DODGE: 35,
    PARRY: 35,
    BLOCK: 35,
  },
  
  // Diminishing returns thresholds
  DIMINISHING_RETURNS: {
    DODGE: 0.20,
    PARRY: 0.20,
    BLOCK: 0.30,
    MISS: 0.05,
  },
  
  // Armor mitigation
  ARMOR_CONSTANT: 7500,
  RESISTANCE_CAP: 0.75, // 75% max resistance
  
  // Level difference penalties
  LEVEL_DIFFERENCE_HIT: 0.01, // 1% per level
  LEVEL_DIFFERENCE_CRIT_SUPPRESSION: 0.002, // 0.2% per level
  GLANCING_BLOW_PENALTY: 0.3, // 30% damage reduction
  CRUSHING_BLOW_BONUS: 1.5, // 150% damage
} as const;

// Class Base Stats
export const CLASS_BASE_STATS = {
  WARRIOR: { strength: 20, agility: 15, intellect: 10, spirit: 10, stamina: 20 },
  MAGE: { strength: 10, agility: 10, intellect: 25, spirit: 20, stamina: 10 },
  ARCHER: { strength: 12, agility: 25, intellect: 12, spirit: 10, stamina: 15 },
  ROGUE: { strength: 15, agility: 25, intellect: 10, spirit: 10, stamina: 15 },
  PALADIN: { strength: 18, agility: 12, intellect: 15, spirit: 15, stamina: 18 },
  NECROMANCER: { strength: 10, agility: 12, intellect: 23, spirit: 18, stamina: 12 },
  DRUID: { strength: 15, agility: 15, intellect: 18, spirit: 18, stamina: 15 },
  SHAMAN: { strength: 16, agility: 14, intellect: 18, spirit: 17, stamina: 16 },
  MONK: { strength: 17, agility: 20, intellect: 14, spirit: 14, stamina: 17 },
  BERSERKER: { strength: 25, agility: 18, intellect: 8, spirit: 8, stamina: 22 },
} as const;

// Race Stat Modifiers
export const RACE_STAT_MODIFIERS = {
  HUMAN: { strength: 0, agility: 0, intellect: 0, spirit: 2, stamina: 0 },
  ELF: { strength: -2, agility: 2, intellect: 1, spirit: 0, stamina: -1 },
  DWARF: { strength: 2, agility: -2, intellect: -1, spirit: 0, stamina: 3 },
  ORC: { strength: 3, agility: 0, intellect: -2, spirit: -2, stamina: 2 },
  UNDEAD: { strength: -1, agility: 0, intellect: 0, spirit: -2, stamina: 0 },
} as const;

// Combat Constants
export const COMBAT_CONSTANTS = {
  BASE_MISS_CHANCE: 0.05,
  BASE_DODGE_CHANCE: 0.05,
  BASE_PARRY_CHANCE: 0.05,
  BASE_BLOCK_CHANCE: 0.05,
  BASE_CRIT_CHANCE: 0.05,
  BASE_CRIT_DAMAGE: 2.0,
  BOSS_CRIT_IMMUNITY: 0.03,
  DUAL_WIELD_MISS_PENALTY: 0.19,
  BEHIND_TARGET_CRIT_BONUS: 0.04,
  PARRY_HASTE_PERCENT: 0.4,
  BLOCK_VALUE_PERCENT: 0.3,
  PARTIAL_RESIST_PERCENTAGES: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
} as const;

// PvP Constants
export const PVP_CONSTANTS = {
  RESILIENCE_CAP: 0.5, // 50% damage reduction
  PVP_POWER_COEFFICIENT: 0.5,
  DIMINISHING_RETURNS_CATEGORIES: {
    STUN: ['STUN', 'CHARGE'],
    DISORIENT: ['DISORIENT', 'CYCLONE'],
    FEAR: ['FEAR', 'HORROR'],
    ROOT: ['ROOT', 'FROST_NOVA'],
    SILENCE: ['SILENCE', 'INTERRUPT'],
  },
  DR_RESET_TIME: 18000, // 18 seconds
  DR_LEVELS: [1, 0.5, 0.25, 0], // 100%, 50%, 25%, immune
  HONOR_KILL_WINDOW: 86400000, // 24 hours
  HONOR_DIMINISHING_KILLS: 10,
} as const;

// Item Constants
export const ITEM_CONSTANTS = {
  ITEM_QUALITY_COLORS: {
    COMMON: '#9d9d9d',
    UNCOMMON: '#1eff00',
    RARE: '#0070dd',
    EPIC: '#a335ee',
    LEGENDARY: '#ff8000',
    MYTHIC: '#e6cc80',
    ARTIFACT: '#e6cc80',
  },
  SOCKET_COLORS: {
    RED: '#ee4444',
    BLUE: '#4444ee',
    YELLOW: '#eeee44',
    META: '#999999',
    PRISMATIC: '#ffffff',
  },
  VENDOR_SELL_PERCENTAGE: 0.25,
  REPAIR_COST_PERCENTAGE: 0.1,
  ENCHANT_ITEM_LEVEL_REQUIREMENT: 35,
  GEM_ITEM_LEVEL_REQUIREMENT: 60,
  UPGRADE_COST_MULTIPLIER: 1.5,
  TITANFORGE_CHANCE: 0.06,
  WARFORGE_CHANCE: 0.15,
  SOCKET_CHANCE: 0.1,
  TERTIARY_STAT_CHANCE: 0.1,
} as const;

// Zone Constants
export const ZONE_CONSTANTS = {
  RESTED_AREA_BONUS: 2.0,
  SANCTUARY_PVP_DISABLED: true,
  CONTESTED_ZONE_LEVEL_RANGE: 10,
  INSTANCE_PLAYER_LIMITS: {
    DUNGEON: 5,
    HEROIC_DUNGEON: 5,
    RAID_10: 10,
    RAID_25: 25,
    RAID_40: 40,
    SCENARIO: 3,
    ARENA_2V2: 2,
    ARENA_3V3: 3,
    ARENA_5V5: 5,
    BATTLEGROUND_10V10: 10,
    BATTLEGROUND_15V15: 15,
    BATTLEGROUND_40V40: 40,
  },
  WEATHER_CHANGE_FREQUENCY: 3600000, // 1 hour
  DAY_NIGHT_CYCLE_LENGTH: 2880000, // 48 minutes (30x speed)
} as const;

// Guild Constants
export const GUILD_CONSTANTS = {
  CREATION_COST: 1000, // gold
  CHARTER_SIGNATURES: 4,
  BANK_TAB_COSTS: [100, 250, 500, 1000, 2500, 5000, 10000, 25000],
  MAX_BANK_MONEY: 10000000, // 1000 platinum
  PERK_UNLOCK_LEVELS: [5, 10, 15, 20, 25],
  REPUTATION_WEEKLY_CAP: 10000,
  TAX_MAX_PERCENTAGE: 0.1, // 10%
  INACTIVE_KICK_DAYS: 180,
  RANK_PERMISSIONS: {
    GUILD_MASTER: 0xFFFFFFFF,
    OFFICER: 0x0000FFFF,
    VETERAN: 0x00000FFF,
    MEMBER: 0x000000FF,
    INITIATE: 0x0000000F,
    RECRUIT: 0x00000001,
  },
} as const;

// Currency Exchange Rates
export const CURRENCY_RATES = {
  COPPER_PER_SILVER: 100,
  SILVER_PER_GOLD: 100,
  GOLD_PER_PLATINUM: 100,
  HONOR_TO_CONQUEST: 0.5,
  VALOR_TO_JUSTICE: 2.0,
} as const;

// Profession Constants
export const PROFESSION_CONSTANTS = {
  MAX_PRIMARY_PROFESSIONS: 2,
  SKILL_GAIN_CHANCE: {
    GREY: 0,
    GREEN: 0.25,
    YELLOW: 0.5,
    ORANGE: 1.0,
  },
  SPECIALIZATION_LEVEL: 300,
  GRAND_MASTER_LEVEL: 600,
  GATHERING_RESPAWN_TIME: {
    COMMON: 60000, // 1 minute
    UNCOMMON: 180000, // 3 minutes
    RARE: 600000, // 10 minutes
    RICH: 1800000, // 30 minutes
  },
} as const;

// Achievement Constants
export const ACHIEVEMENT_CONSTANTS = {
  POINTS_PER_TIER: {
    COMMON: 5,
    UNCOMMON: 10,
    RARE: 15,
    EPIC: 20,
    LEGENDARY: 25,
  },
  META_ACHIEVEMENT_BONUS: 10,
  ACCOUNT_WIDE_PERCENTAGE: 0.8, // 80% are account-wide
  FEAT_OF_STRENGTH_POINTS: 0,
} as const;

// Mount Constants
export const MOUNT_CONSTANTS = {
  GROUND_SPEED_BONUS: {
    SLOW: 0.6, // 60%
    NORMAL: 1.0, // 100%
    FAST: 1.5, // 150%
    EPIC: 2.0, // 200%
  },
  FLYING_SPEED_BONUS: {
    SLOW: 1.5, // 150%
    NORMAL: 2.8, // 280%
    FAST: 3.1, // 310%
    MASTER: 4.1, // 410%
  },
  WATER_SPEED_BONUS: 1.0, // 100%
  DISMOUNT_IN_COMBAT: true,
  CAST_TIME: 1500, // 1.5 seconds
} as const;

// Chat Constants
export const CHAT_CONSTANTS = {
  MESSAGE_THROTTLE_COUNT: 10,
  MESSAGE_THROTTLE_WINDOW: 10000, // 10 seconds
  SPAM_MUTE_DURATION: 600000, // 10 minutes
  CHANNEL_LIMITS: {
    SAY: 25, // meters
    YELL: 300,
    EMOTE: 100,
    PARTY: Infinity,
    GUILD: Infinity,
    RAID: Infinity,
    INSTANCE: Infinity,
    WHISPER: Infinity,
    TRADE: 'CITY_ONLY',
    GENERAL: 'ZONE',
    LOCAL_DEFENSE: 'ZONE',
  },
} as const;

// Network Constants
export const NETWORK_CONSTANTS = {
  PACKET_SIZE_LIMIT: 65536, // 64KB
  MESSAGE_QUEUE_SIZE: 1000,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 5000, // 5 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  TIMEOUT_DURATION: 90000, // 90 seconds
  POSITION_UPDATE_RATE: 100, // ms
  INTERPOLATION_DELAY: 100, // ms
  MAX_LATENCY_COMPENSATION: 400, // ms
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ACTION_BAR_SLOTS: 12,
  MAX_ACTION_BARS: 10,
  BAG_SLOTS: 5,
  DEFAULT_BAG_SIZE: 16,
  TOOLTIP_DELAY: 200, // ms
  DOUBLE_CLICK_TIME: 500, // ms
  DRAG_THRESHOLD: 5, // pixels
  ZOOM_SPEED: 0.1,
  CAMERA_MIN_DISTANCE: 5,
  CAMERA_MAX_DISTANCE: 50,
  MINIMAP_ZOOM_LEVELS: [0.5, 0.75, 1.0, 1.5, 2.0],
  COMBAT_TEXT_DURATION: 3000, // ms
  NAMEPLATE_DISTANCE: 60,
  QUEST_TRACKER_MAX: 25,
} as const;

// Damage Type Colors
export const DAMAGE_COLORS = {
  PHYSICAL: '#ffffff',
  FIRE: '#ff6600',
  FROST: '#66ccff',
  NATURE: '#66ff66',
  SHADOW: '#9966ff',
  HOLY: '#ffff66',
  ARCANE: '#ff66ff',
} as const;

// Server Tick Rates
export const TICK_RATES = {
  WORLD_UPDATE: 50, // 20 Hz
  MOVEMENT_UPDATE: 100, // 10 Hz
  COMBAT_UPDATE: 50, // 20 Hz
  AI_UPDATE: 200, // 5 Hz
  WEATHER_UPDATE: 60000, // 1 minute
  AUCTION_UPDATE: 300000, // 5 minutes
  SPAWN_UPDATE: 1000, // 1 Hz
  SAVE_UPDATE: 300000, // 5 minutes
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_TARGET: 'Invalid target',
  OUT_OF_RANGE: 'Target is out of range',
  NOT_ENOUGH_MANA: 'Not enough mana',
  NOT_ENOUGH_ENERGY: 'Not enough energy',
  NOT_ENOUGH_RAGE: 'Not enough rage',
  ON_COOLDOWN: 'Ability is not ready yet',
  CANT_DO_THAT_YET: "Can't do that yet",
  MUST_BE_STANDING: 'You must be standing to do that',
  CANT_USE_WHILE_MOVING: "Can't use while moving",
  INTERRUPTED: 'Interrupted',
  IMMUNE: 'Immune',
  INVALID_WHILE_DEAD: "Can't do that while dead",
  NOT_IN_COMBAT: 'You must be in combat to do that',
  IN_COMBAT: "Can't do that in combat",
  INVENTORY_FULL: 'Inventory is full',
  NOT_ENOUGH_GOLD: "You don't have enough gold",
  LEVEL_REQUIREMENT: "You don't meet the level requirement",
  CLASS_REQUIREMENT: 'Your class cannot use that',
  ALREADY_KNOWN: 'You already know that',
  TARGET_FRIENDLY: 'Target is friendly',
  TARGET_HOSTILE: 'Target is hostile',
  NOT_WHILE_MOUNTED: "Can't do that while mounted",
  MUST_HAVE_WEAPON: 'Requires a weapon',
  WRONG_WEAPON_TYPE: 'Requires a different weapon type',
  NO_PATH_AVAILABLE: 'No path available',
  INSTANCE_FULL: 'Instance is full',
  NOT_IN_GROUP: 'You are not in a group',
  NOT_GROUP_LEADER: 'You are not the group leader',
  PLAYER_NOT_FOUND: 'Player not found',
  PLAYER_OFFLINE: 'Player is offline',
  CANT_ATTACK_TARGET: "Can't attack that target",
  PVP_RANK_REQUIREMENT: "You don't have the required PvP rank",
  FACTION_REQUIREMENT: 'Wrong faction',
  NOT_ENOUGH_ITEMS: "You don't have the required items",
  QUEST_REQUIREMENT: 'Requires quest completion',
  IN_BATTLEGROUND: 'You are in a battleground',
  NOT_IN_BATTLEGROUND: 'You are not in a battleground',
  CANT_USE_IN_ARENA: "Can't use in arena",
  DUEL_REQUESTED: 'Duel already requested',
  ALREADY_IN_DUEL: 'Already in a duel',
  TRADE_ALREADY_OPEN: 'Trade already open',
  MAIL_SENT: 'Mail sent successfully',
  AUCTION_CREATED: 'Auction created successfully',
  GUILD_INVITE_SENT: 'Guild invitation sent',
  FRIEND_REQUEST_SENT: 'Friend request sent',
  REPORT_SUBMITTED: 'Report submitted successfully',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  CHARACTER_NAME: /^[A-Za-z]{2,16}$/,
  GUILD_NAME: /^[A-Za-z\s]{3,24}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  CHAT_COMMAND: /^\/(\w+)\s?(.*)?$/,
  EMOTE_COMMAND: /^\/e\s+(.+)$/,
  ITEM_LINK: /\|c([0-9a-fA-F]{8})\|Hitem:(\d+)(:[0-9\-:]*)\|h\[([^\]]+)\]\|h\|r/g,
  COLOR_HEX: /^#[0-9A-Fa-f]{6}$/,
} as const;

// Default Keybinds
export const DEFAULT_KEYBINDS = {
  // Movement
  MOVE_FORWARD: 'W',
  MOVE_BACKWARD: 'S',
  TURN_LEFT: 'A',
  TURN_RIGHT: 'D',
  STRAFE_LEFT: 'Q',
  STRAFE_RIGHT: 'E',
  JUMP: 'Space',
  TOGGLE_RUN_WALK: 'NumLock',
  TOGGLE_AUTORUN: 'Shift+R',
  
  // Action Bars
  ACTION_BAR_1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ACTION_BAR_2: ['Shift+1', 'Shift+2', 'Shift+3', 'Shift+4', 'Shift+5', 'Shift+6'],
  
  // Targeting
  TARGET_NEAREST_ENEMY: 'Tab',
  TARGET_PREVIOUS_ENEMY: 'Shift+Tab',
  TARGET_NEAREST_FRIEND: 'Ctrl+Tab',
  TARGET_SELF: 'F1',
  TARGET_PARTY_1: 'F2',
  TARGET_PARTY_2: 'F3',
  TARGET_PARTY_3: 'F4',
  TARGET_PARTY_4: 'F5',
  
  // Combat
  ATTACK: 'T',
  ASSIST: 'F',
  TOGGLE_SHEATHE: 'Z',
  
  // Interface
  CHARACTER_PANEL: 'C',
  INVENTORY: 'B',
  SPELLBOOK: 'P',
  TALENTS: 'N',
  QUEST_LOG: 'L',
  MAP: 'M',
  SOCIAL: 'O',
  GUILD: 'J',
  ACHIEVEMENTS: 'Y',
  PVP: 'H',
  GROUP_FINDER: 'I',
  COLLECTIONS: 'Shift+P',
  ADVENTURE_GUIDE: 'Shift+J',
  
  // Chat
  OPEN_CHAT: 'Enter',
  REPLY_WHISPER: 'R',
  RE_WHISPER: 'Shift+R',
  
  // Misc
  SCREENSHOT: 'PrintScreen',
  TOGGLE_UI: 'Alt+Z',
  TOGGLE_NAMES: 'V',
  INTERACT: 'G',
  MOUNT: 'X',
} as const;

// Emotes
export const EMOTES = {
  AGREE: '/agree',
  AMAZE: '/amaze',
  ANGRY: '/angry',
  APOLOGIZE: '/apologize',
  APPLAUD: '/applaud',
  BASHFUL: '/bashful',
  BECKON: '/beckon',
  BEG: '/beg',
  BITE: '/bite',
  BLEED: '/bleed',
  BLINK: '/blink',
  BLUSH: '/blush',
  BONK: '/bonk',
  BORED: '/bored',
  BOUNCE: '/bounce',
  BOW: '/bow',
  BRB: '/brb',
  BURP: '/burp',
  BYE: '/bye',
  CACKLE: '/cackle',
  CHEER: '/cheer',
  CHICKEN: '/chicken',
  CHUCKLE: '/chuckle',
  CLAP: '/clap',
  CONFUSED: '/confused',
  CONGRATULATE: '/congratulate',
  COUGH: '/cough',
  COWER: '/cower',
  CRACK: '/crack',
  CRINGE: '/cringe',
  CRY: '/cry',
  CUDDLE: '/cuddle',
  CURTSEY: '/curtsey',
  DANCE: '/dance',
  DRINK: '/drink',
  DROOL: '/drool',
  EAT: '/eat',
  EYE: '/eye',
  FACEPALM: '/facepalm',
  FART: '/fart',
  FIDGET: '/fidget',
  FLEX: '/flex',
  FLIRT: '/flirt',
  GASP: '/gasp',
  GAZE: '/gaze',
  GIGGLE: '/giggle',
  GLARE: '/glare',
  GLOAT: '/gloat',
  GREET: '/greet',
  GRIN: '/grin',
  GROAN: '/groan',
  GROVEL: '/grovel',
  GUFFAW: '/guffaw',
  HAIL: '/hail',
  HAPPY: '/happy',
  HELLO: '/hello',
  HUG: '/hug',
  HUNGRY: '/hungry',
  KISS: '/kiss',
  KNEEL: '/kneel',
  LAUGH: '/laugh',
  LAY: '/lay',
  LICK: '/lick',
  LIE: '/lie',
  LISTEN: '/listen',
  LOL: '/lol',
  LOVE: '/love',
  MAD: '/mad',
  MASSAGE: '/massage',
  MOAN: '/moan',
  MOCK: '/mock',
  MOO: '/moo',
  MOON: '/moon',
  MOURN: '/mourn',
  NO: '/no',
  NOD: '/nod',
  PANIC: '/panic',
  PAT: '/pat',
  PEER: '/peer',
  PICK: '/pick',
  PLEAD: '/plead',
  POINT: '/point',
  POKE: '/poke',
  PONDER: '/ponder',
  POUNCE: '/pounce',
  PRAISE: '/praise',
  PRAY: '/pray',
  PUZZLE: '/puzzle',
  QUESTION: '/question',
  RAISE: '/raise',
  READY: '/ready',
  ROAR: '/roar',
  ROFL: '/rofl',
  RUDE: '/rude',
  SALUTE: '/salute',
  SCRATCH: '/scratch',
  SEXY: '/sexy',
  SHAKE: '/shake',
  SHIVER: '/shiver',
  SHOO: '/shoo',
  SHRUG: '/shrug',
  SHY: '/shy',
  SIGH: '/sigh',
  SIT: '/sit',
  SLEEP: '/sleep',
  SLAP: '/slap',
  SMELL: '/smell',
  SMILE: '/smile',
  SMIRK: '/smirk',
  SNARL: '/snarl',
  SNICKER: '/snicker',
  SNIFF: '/sniff',
  SNUB: '/snub',
  SOB: '/sob',
  SOOTHE: '/soothe',
  SORRY: '/sorry',
  SPIT: '/spit',
  STARE: '/stare',
  SURPRISED: '/surprised',
  SURRENDER: '/surrender',
  TAP: '/tap',
  TAUNT: '/taunt',
  TEASE: '/tease',
  THANK: '/thank',
  THINK: '/think',
  THIRSTY: '/thirsty',
  THREATEN: '/threaten',
  TICKLE: '/tickle',
  TIRED: '/tired',
  TRAIN: '/train',
  VIOLIN: '/violin',
  WAIT: '/wait',
  WAVE: '/wave',
  WELCOME: '/welcome',
  WHINE: '/whine',
  WHISTLE: '/whistle',
  WINK: '/wink',
  WORK: '/work',
  YAWN: '/yawn',
  YES: '/yes',
} as const;
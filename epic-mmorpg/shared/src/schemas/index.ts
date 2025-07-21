import { z } from 'zod';
import { 
  CharacterClass, 
  CharacterRace, 
  Gender,
  ItemType,
  ItemRarity,
  QuestType,
  SkillType,
  DamageType,
  ZoneType,
  BiomeType
} from '../enums/index.js';
import { GAME_CONFIG, REGEX_PATTERNS } from '../constants/index.js';

// Common Schemas
export const idSchema = z.string().uuid();
export const timestampSchema = z.number().int().positive();
export const dateSchema = z.date();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const hexColorSchema = z.string().regex(REGEX_PATTERNS.COLOR_HEX);

export const vector2Schema = z.object({
  x: z.number(),
  y: z.number()
});

export const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
});

export const coordinatesSchema = vector3Schema;

export const boundingBoxSchema = z.object({
  min: coordinatesSchema,
  max: coordinatesSchema
});

export const levelRangeSchema = z.object({
  min: z.number().int().min(1).max(GAME_CONFIG.MAX_LEVEL),
  max: z.number().int().min(1).max(GAME_CONFIG.MAX_LEVEL)
}).refine(data => data.min <= data.max, {
  message: "Min level must be less than or equal to max level"
});

// Player Schemas
export const playerRegistrationSchema = z.object({
  username: z.string()
    .min(3)
    .max(16)
    .regex(/^[a-zA-Z0-9_-]+$/),
  email: emailSchema,
  password: z.string()
    .min(8)
    .regex(REGEX_PATTERNS.PASSWORD, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  birthDate: dateSchema.refine(date => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 13;
  }, {
    message: "You must be at least 13 years old"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const playerLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean().optional()
});

// Character Schemas
export const characterCreationSchema = z.object({
  name: z.string()
    .min(GAME_CONFIG.MIN_NAME_LENGTH)
    .max(GAME_CONFIG.MAX_NAME_LENGTH)
    .regex(REGEX_PATTERNS.CHARACTER_NAME, {
      message: "Character name can only contain letters"
    }),
  class: z.nativeEnum(CharacterClass),
  race: z.nativeEnum(CharacterRace),
  gender: z.nativeEnum(Gender),
  appearance: z.object({
    skinColor: hexColorSchema,
    faceType: z.number().int().min(0).max(20),
    hairStyle: z.number().int().min(0).max(50),
    hairColor: hexColorSchema,
    facialHair: z.number().int().min(0).max(20),
    facialHairColor: hexColorSchema,
    eyeColor: hexColorSchema,
    features: z.object({
      scars: z.number().int().min(0).max(10).optional(),
      tattoos: z.number().int().min(0).max(20).optional(),
      piercings: z.number().int().min(0).max(10).optional(),
      bodyType: z.number().int().min(0).max(5).optional(),
      height: z.number().int().min(0).max(10).optional(),
      voice: z.number().int().min(0).max(10).optional()
    }).optional()
  })
});

export const characterUpdateSchema = z.object({
  appearance: z.object({
    hairStyle: z.number().int().min(0).max(50).optional(),
    hairColor: hexColorSchema.optional(),
    facialHair: z.number().int().min(0).max(20).optional(),
    facialHairColor: hexColorSchema.optional()
  }).optional(),
  title: idSchema.optional().nullable(),
  transmog: z.record(z.string(), idSchema).optional()
});

// Item Schemas
export const itemStatsSchema = z.object({
  strength: z.number().optional(),
  agility: z.number().optional(),
  intellect: z.number().optional(),
  spirit: z.number().optional(),
  stamina: z.number().optional(),
  attackPower: z.number().optional(),
  spellPower: z.number().optional(),
  criticalStrike: z.number().optional(),
  haste: z.number().optional(),
  mastery: z.number().optional(),
  versatility: z.number().optional(),
  armor: z.number().optional(),
  dodge: z.number().optional(),
  parry: z.number().optional(),
  block: z.number().optional(),
  blockValue: z.number().optional(),
  resilience: z.number().optional()
});

export const itemSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.nativeEnum(ItemType),
  rarity: z.nativeEnum(ItemRarity),
  itemLevel: z.number().int().min(1).max(GAME_CONFIG.MAX_ITEM_LEVEL),
  requiredLevel: z.number().int().min(1).max(GAME_CONFIG.MAX_LEVEL).optional(),
  icon: z.string(),
  stats: itemStatsSchema.optional(),
  sellPrice: z.object({
    gold: z.number().int().min(0),
    silver: z.number().int().min(0).max(99),
    copper: z.number().int().min(0).max(99)
  }).optional(),
  stackable: z.boolean().optional(),
  maxStack: z.number().int().min(1).max(1000).optional(),
  unique: z.boolean().optional(),
  soulbound: z.boolean().optional()
});

// Skill Schemas
export const skillResourceSchema = z.object({
  type: z.string(),
  amount: z.number(),
  percentage: z.boolean().optional()
});

export const skillEffectSchema = z.object({
  id: idSchema,
  type: z.string(),
  target: z.string(),
  damage: z.object({
    base: z.object({
      min: z.number(),
      max: z.number()
    }),
    scaling: z.array(z.object({
      stat: z.string(),
      coefficient: z.number()
    })),
    type: z.nativeEnum(DamageType),
    canCrit: z.boolean()
  }).optional(),
  heal: z.object({
    base: z.object({
      min: z.number(),
      max: z.number()
    }),
    scaling: z.array(z.object({
      stat: z.string(),
      coefficient: z.number()
    })),
    canCrit: z.boolean()
  }).optional(),
  duration: z.number().optional(),
  stacks: z.number().optional()
});

export const skillSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(500),
  icon: z.string(),
  type: z.nativeEnum(SkillType),
  school: z.nativeEnum(DamageType),
  range: z.number().min(0).max(100),
  cost: skillResourceSchema.optional(),
  cooldown: z.number().min(0).optional(),
  castTime: z.number().min(0).optional(),
  instant: z.boolean(),
  effects: z.array(skillEffectSchema)
});

// Quest Schemas
export const questObjectiveSchema = z.object({
  id: idSchema,
  type: z.string(),
  description: z.string(),
  target: z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional()
  }),
  progress: z.number().min(0),
  required: z.number().min(1),
  completed: z.boolean(),
  optional: z.boolean().optional()
});

export const questRewardSchema = z.object({
  experience: z.number().optional(),
  gold: z.number().optional(),
  items: z.array(z.object({
    itemId: idSchema,
    quantity: z.number().min(1),
    choice: z.boolean().optional()
  })).optional(),
  reputation: z.array(z.object({
    factionId: idSchema,
    amount: z.number()
  })).optional()
});

export const questSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  type: z.nativeEnum(QuestType),
  level: z.number().int().min(1).max(GAME_CONFIG.MAX_LEVEL),
  objectives: z.array(questObjectiveSchema),
  rewards: questRewardSchema,
  requirements: z.object({
    level: levelRangeSchema.optional(),
    class: z.array(z.nativeEnum(CharacterClass)).optional(),
    race: z.array(z.nativeEnum(CharacterRace)).optional(),
    quests: z.array(idSchema).optional()
  }).optional()
});

// Guild Schemas
export const guildCreationSchema = z.object({
  name: z.string()
    .min(GAME_CONFIG.MIN_GUILD_NAME_LENGTH)
    .max(GAME_CONFIG.MAX_GUILD_NAME_LENGTH)
    .regex(REGEX_PATTERNS.GUILD_NAME),
  tag: z.string().min(2).max(5).regex(/^[A-Z]+$/),
  description: z.string().max(500).optional(),
  emblem: z.object({
    icon: z.number().int().min(0).max(100),
    border: z.number().int().min(0).max(20),
    background: z.number().int().min(0).max(20),
    iconColor: hexColorSchema,
    borderColor: hexColorSchema,
    backgroundColor: hexColorSchema
  })
});

export const guildUpdateSchema = z.object({
  description: z.string().max(500).optional(),
  motd: z.string().max(200).optional(),
  website: urlSchema.optional(),
  discord: z.string().optional(),
  recruitment: z.object({
    open: z.boolean(),
    minLevel: z.number().int().min(1).max(GAME_CONFIG.MAX_LEVEL).optional(),
    classes: z.array(z.nativeEnum(CharacterClass)).optional(),
    message: z.string().max(500).optional()
  }).optional()
});

// Chat Schemas
export const chatMessageSchema = z.object({
  channel: z.string(),
  content: z.string()
    .min(1)
    .max(GAME_CONFIG.MAX_CHAT_MESSAGE_LENGTH),
  target: z.string().optional()
});

// Trade Schemas
export const tradeItemSchema = z.object({
  itemId: idSchema,
  quantity: z.number().int().min(1),
  slot: z.number().int().min(0).max(GAME_CONFIG.MAX_TRADE_ITEMS - 1)
});

export const tradeSchema = z.object({
  items: z.array(tradeItemSchema).max(GAME_CONFIG.MAX_TRADE_ITEMS),
  gold: z.number().int().min(0).max(GAME_CONFIG.MAX_GOLD)
});

// Auction Schemas
export const auctionCreateSchema = z.object({
  itemId: idSchema,
  quantity: z.number().int().min(1),
  startPrice: z.number().int().min(1),
  buyoutPrice: z.number().int().min(1).optional(),
  duration: z.number().int().min(1).max(GAME_CONFIG.MAX_AUCTION_DURATION)
}).refine(data => !data.buyoutPrice || data.buyoutPrice >= data.startPrice, {
  message: "Buyout price must be greater than or equal to start price",
  path: ["buyoutPrice"]
});

export const auctionBidSchema = z.object({
  auctionId: idSchema,
  amount: z.number().int().min(1)
});

// Mail Schemas
export const mailSendSchema = z.object({
  recipient: z.string().min(GAME_CONFIG.MIN_NAME_LENGTH).max(GAME_CONFIG.MAX_NAME_LENGTH),
  subject: z.string().min(1).max(50),
  body: z.string().max(500),
  items: z.array(z.object({
    itemId: idSchema,
    quantity: z.number().int().min(1)
  })).max(GAME_CONFIG.MAX_MAIL_ITEMS).optional(),
  gold: z.number().int().min(0).max(GAME_CONFIG.MAX_GOLD).optional(),
  cod: z.number().int().min(0).max(GAME_CONFIG.MAX_GOLD).optional()
});

// Party/Raid Schemas
export const partyInviteSchema = z.object({
  targetId: idSchema,
  message: z.string().max(100).optional()
});

export const raidRoleAssignmentSchema = z.object({
  memberId: idSchema,
  role: z.enum(['tank', 'healer', 'dps'])
});

export const raidMarkerSchema = z.object({
  targetId: idSchema,
  marker: z.number().int().min(1).max(8)
});

// Combat Schemas
export const damageEventSchema = z.object({
  sourceId: idSchema,
  targetId: idSchema,
  amount: z.number().int().min(0),
  type: z.nativeEnum(DamageType),
  skillId: idSchema.optional(),
  critical: z.boolean(),
  timestamp: timestampSchema
});

export const healEventSchema = z.object({
  sourceId: idSchema,
  targetId: idSchema,
  amount: z.number().int().min(0),
  effective: z.number().int().min(0),
  overheal: z.number().int().min(0),
  skillId: idSchema.optional(),
  critical: z.boolean(),
  timestamp: timestampSchema
});

// Movement Schemas
export const movementSchema = z.object({
  position: coordinatesSchema,
  rotation: z.number().min(0).max(360),
  velocity: vector3Schema.optional(),
  timestamp: timestampSchema
});

// Zone Schemas
export const zoneSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: z.nativeEnum(ZoneType),
  biome: z.nativeEnum(BiomeType),
  level: levelRangeSchema,
  bounds: boundingBoxSchema
});

// Settings Schemas
export const graphicsSettingsSchema = z.object({
  quality: z.enum(['low', 'medium', 'high', 'ultra']),
  resolution: z.string().regex(/^\d+x\d+$/),
  fullscreen: z.boolean(),
  vsync: z.boolean(),
  antialiasing: z.string(),
  shadows: z.string(),
  textures: z.string(),
  effects: z.string(),
  viewDistance: z.number().min(1).max(10),
  fps: z.number().min(30).max(240)
});

export const audioSettingsSchema = z.object({
  master: z.number().min(0).max(100),
  music: z.number().min(0).max(100),
  effects: z.number().min(0).max(100),
  voice: z.number().min(0).max(100),
  ambient: z.number().min(0).max(100)
});

export const gameplaySettingsSchema = z.object({
  difficulty: z.string(),
  autoLoot: z.boolean(),
  showTutorials: z.boolean(),
  smartCasting: z.boolean(),
  actionCombat: z.boolean(),
  showDamageNumbers: z.boolean(),
  showHealingNumbers: z.boolean()
});

export const settingsSchema = z.object({
  graphics: graphicsSettingsSchema,
  audio: audioSettingsSchema,
  gameplay: gameplaySettingsSchema
});

// API Request/Response Schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: dateSchema
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: apiErrorSchema.optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    timestamp: dateSchema
  }).optional()
});

// Validation Helpers
export const validateSchema = <T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: T; errors?: z.ZodError } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

export const validatePartialSchema = <T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: Partial<T>; errors?: z.ZodError } => {
  const partialSchema = schema.partial();
  return validateSchema(partialSchema, data);
};

// Type inference helpers
export type InferSchema<T extends z.ZodType> = z.infer<T>;

export type PlayerRegistration = InferSchema<typeof playerRegistrationSchema>;
export type CharacterCreation = InferSchema<typeof characterCreationSchema>;
export type ItemData = InferSchema<typeof itemSchema>;
export type SkillData = InferSchema<typeof skillSchema>;
export type QuestData = InferSchema<typeof questSchema>;
export type GuildCreation = InferSchema<typeof guildCreationSchema>;
export type ChatMessage = InferSchema<typeof chatMessageSchema>;
export type TradeData = InferSchema<typeof tradeSchema>;
export type AuctionCreate = InferSchema<typeof auctionCreateSchema>;
export type MailSend = InferSchema<typeof mailSendSchema>;
export type MovementData = InferSchema<typeof movementSchema>;
export type SettingsData = InferSchema<typeof settingsSchema>;
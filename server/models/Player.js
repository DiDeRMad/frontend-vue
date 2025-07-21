import mongoose from 'mongoose';

const { Schema } = mongoose;

// Sub-schemas for complex data structures
const PositionSchema = new Schema({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  z: { type: Number, default: 0 },
  worldId: { type: String, default: 'newbie-island' },
  region: { type: String, default: 'spawn' },
  instance: { type: String, default: null }
}, { _id: false });

const StatsSchema = new Schema({
  strength: { type: Number, default: 10, min: 1, max: 9999 },
  agility: { type: Number, default: 10, min: 1, max: 9999 },
  intelligence: { type: Number, default: 10, min: 1, max: 9999 },
  vitality: { type: Number, default: 10, min: 1, max: 9999 },
  luck: { type: Number, default: 10, min: 1, max: 9999 },
  
  // Derived stats
  attackPower: { type: Number, default: 0 },
  magicPower: { type: Number, default: 0 },
  armor: { type: Number, default: 0 },
  magicResist: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  evasion: { type: Number, default: 0 },
  criticalChance: { type: Number, default: 0.05 },
  criticalDamage: { type: Number, default: 2.0 },
  movementSpeed: { type: Number, default: 150 },
  attackSpeed: { type: Number, default: 1.0 },
  castSpeed: { type: Number, default: 1.0 }
}, { _id: false });

const SkillSchema = new Schema({
  skillId: { type: String, required: true },
  level: { type: Number, default: 1, min: 1, max: 100 },
  experience: { type: Number, default: 0, min: 0 },
  totalExperience: { type: Number, default: 0, min: 0 },
  maxLevel: { type: Number, default: 100 },
  unlockedAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
  timesUsed: { type: Number, default: 0 },
  
  // Skill-specific data
  specializations: [String],
  modifiers: [{
    type: { type: String },
    value: { type: Number },
    source: { type: String },
    expiresAt: { type: Date }
  }]
}, { _id: false });

const InventoryItemSchema = new Schema({
  itemId: { type: String, required: true },
  instanceId: { type: String, unique: true, sparse: true },
  quantity: { type: Number, default: 1, min: 0 },
  slot: { type: Number, required: true },
  
  // Item state
  durability: { type: Number, default: 100, min: 0, max: 100 },
  enchantLevel: { type: Number, default: 0, min: 0, max: 15 },
  socketedGems: [String],
  
  // Item metadata
  obtainedAt: { type: Date, default: Date.now },
  obtainedFrom: { type: String },
  isBound: { type: Boolean, default: false },
  bindType: { type: String, enum: ['none', 'pickup', 'equip', 'use'], default: 'none' },
  
  // Custom properties
  customName: { type: String },
  customDescription: { type: String },
  properties: { type: Map, of: Schema.Types.Mixed }
});

const EquipmentSchema = new Schema({
  helmet: { type: String, default: null },
  armor: { type: String, default: null },
  gloves: { type: String, default: null },
  boots: { type: String, default: null },
  weapon: { type: String, default: null },
  shield: { type: String, default: null },
  accessory1: { type: String, default: null },
  accessory2: { type: String, default: null },
  cloak: { type: String, default: null },
  belt: { type: String, default: null },
  
  // Equipment sets
  activeSet: { type: String, default: 'primary' },
  sets: {
    primary: { type: Map, of: String },
    secondary: { type: Map, of: String },
    pvp: { type: Map, of: String },
    pve: { type: Map, of: String }
  }
}, { _id: false });

const QuestSchema = new Schema({
  questId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'failed', 'abandoned'], 
    default: 'active' 
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  
  // Quest progress
  progress: { type: Map, of: Schema.Types.Mixed },
  objectives: [{
    id: { type: String, required: true },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    data: { type: Map, of: Schema.Types.Mixed }
  }],
  
  // Quest metadata
  givenBy: { type: String },
  turnInTo: { type: String },
  category: { type: String },
  difficulty: { type: Number, min: 1, max: 10 },
  isRepeatable: { type: Boolean, default: false },
  timesCompleted: { type: Number, default: 0 },
  
  // Rewards (given when completed)
  rewards: {
    experience: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    items: [String],
    reputation: { type: Map, of: Number },
    skills: { type: Map, of: Number }
  }
});

const AchievementSchema = new Schema({
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  
  // Achievement metadata
  category: { type: String },
  rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
  points: { type: Number, default: 0 },
  
  // Progress tracking
  criteria: { type: Map, of: Schema.Types.Mixed },
  milestones: [{
    threshold: { type: Number },
    reached: { type: Boolean, default: false },
    reachedAt: { type: Date }
  }]
});

const SocialSchema = new Schema({
  friends: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    friendedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
    nickname: { type: String },
    isFavorite: { type: Boolean, default: false }
  }],
  
  blocked: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    blockedAt: { type: Date, default: Date.now },
    reason: { type: String }
  }],
  
  guild: {
    guildId: { type: Schema.Types.ObjectId, ref: 'Guild' },
    rank: { type: String, default: 'member' },
    joinedAt: { type: Date },
    contribution: { type: Number, default: 0 },
    permissions: [String]
  },
  
  party: {
    partyId: { type: String },
    isLeader: { type: Boolean, default: false },
    joinedAt: { type: Date }
  }
}, { _id: false });

const StatisticsSchema = new Schema({
  // General stats
  totalPlayTime: { type: Number, default: 0 }, // in milliseconds
  sessionsPlayed: { type: Number, default: 0 },
  loginCount: { type: Number, default: 0 },
  
  // Combat stats
  monstersKilled: { type: Number, default: 0 },
  playersKilled: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
  damageDealt: { type: Number, default: 0 },
  damageTaken: { type: Number, default: 0 },
  healingDone: { type: Number, default: 0 },
  
  // Quest stats
  questsCompleted: { type: Number, default: 0 },
  questsAbandoned: { type: Number, default: 0 },
  questsFailed: { type: Number, default: 0 },
  
  // Economic stats
  goldEarned: { type: Number, default: 0 },
  goldSpent: { type: Number, default: 0 },
  itemsTraded: { type: Number, default: 0 },
  itemsCrafted: { type: Number, default: 0 },
  
  // Social stats
  messagesSent: { type: Number, default: 0 },
  tradesCompleted: { type: Number, default: 0 },
  dungeonsCompleted: { type: Number, default: 0 },
  raidsCompleted: { type: Number, default: 0 },
  
  // PvP stats
  pvpWins: { type: Number, default: 0 },
  pvpLosses: { type: Number, default: 0 },
  pvpRating: { type: Number, default: 1000 },
  arenaRank: { type: Number, default: 0 },
  
  // Detailed tracking
  killsByMonsterType: { type: Map, of: Number },
  questsByCategory: { type: Map, of: Number },
  skillUsageCount: { type: Map, of: Number },
  locationVisits: { type: Map, of: Number }
}, { _id: false });

const PreferencesSchema = new Schema({
  // UI preferences
  interface: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'dark' },
    language: { type: String, default: 'en' },
    uiScale: { type: Number, default: 1.0, min: 0.5, max: 2.0 },
    showHelpTooltips: { type: Boolean, default: true },
    enableAnimations: { type: Boolean, default: true }
  },
  
  // Audio preferences
  audio: {
    masterVolume: { type: Number, default: 0.8, min: 0, max: 1 },
    musicVolume: { type: Number, default: 0.6, min: 0, max: 1 },
    sfxVolume: { type: Number, default: 0.8, min: 0, max: 1 },
    voiceVolume: { type: Number, default: 1.0, min: 0, max: 1 },
    ambientVolume: { type: Number, default: 0.4, min: 0, max: 1 },
    muteWhenInactive: { type: Boolean, default: true }
  },
  
  // Gameplay preferences
  gameplay: {
    autoLoot: { type: Boolean, default: true },
    autoAttack: { type: Boolean, default: false },
    pvpMode: { type: Boolean, default: false },
    tradingEnabled: { type: Boolean, default: true },
    partyInvites: { type: Boolean, default: true },
    guildInvites: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    whisperFromStrangers: { type: Boolean, default: true }
  },
  
  // Notification preferences
  notifications: {
    questComplete: { type: Boolean, default: true },
    levelUp: { type: Boolean, default: true },
    achievement: { type: Boolean, default: true },
    friendOnline: { type: Boolean, default: true },
    guildMessages: { type: Boolean, default: true },
    tradeRequests: { type: Boolean, default: true },
    combatEvents: { type: Boolean, default: true }
  },
  
  // Privacy preferences
  privacy: {
    showOnlineStatus: { type: Boolean, default: true },
    allowWhispers: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    shareStatistics: { type: Boolean, default: true }
  }
}, { _id: false });

const PlayerSchema = new Schema({
  // Account information
  accountId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Account', 
    required: true,
    index: true
  },
  
  // Basic player information
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  displayName: { 
    type: String,
    trim: true,
    maxlength: 30
  },
  
  // Character details
  class: { 
    type: String, 
    required: true,
    enum: ['warrior', 'mage', 'archer', 'rogue', 'cleric', 'paladin', 'berserker', 'necromancer', 'monk', 'bard']
  },
  race: { 
    type: String, 
    required: true,
    enum: ['human', 'elf', 'dwarf', 'orc', 'demon', 'angel', 'beast', 'undead']
  },
  gender: { 
    type: String, 
    required: true,
    enum: ['male', 'female', 'neutral']
  },
  
  // Appearance
  appearance: {
    hairStyle: { type: Number, default: 1 },
    hairColor: { type: String, default: '#8B4513' },
    skinColor: { type: String, default: '#FDBCB4' },
    eyeColor: { type: String, default: '#654321' },
    height: { type: Number, default: 170, min: 120, max: 220 },
    weight: { type: Number, default: 70, min: 40, max: 150 },
    customization: { type: Map, of: Schema.Types.Mixed }
  },
  
  // Character progression
  level: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 100,
    index: true
  },
  experience: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  totalExperience: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  availableStatPoints: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  availableSkillPoints: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  
  // Vital statistics
  health: { 
    type: Number, 
    default: 100, 
    min: 0 
  },
  maxHealth: { 
    type: Number, 
    default: 100, 
    min: 1 
  },
  mana: { 
    type: Number, 
    default: 50, 
    min: 0 
  },
  maxMana: { 
    type: Number, 
    default: 50, 
    min: 0 
  },
  stamina: { 
    type: Number, 
    default: 100, 
    min: 0 
  },
  maxStamina: { 
    type: Number, 
    default: 100, 
    min: 0 
  },
  
  // Regeneration rates (per second)
  healthRegen: { type: Number, default: 1 },
  manaRegen: { type: Number, default: 2 },
  staminaRegen: { type: Number, default: 5 },
  
  // Position and world state
  position: { 
    type: PositionSchema, 
    default: () => ({}) 
  },
  lastPosition: { 
    type: PositionSchema, 
    default: () => ({}) 
  },
  homePoint: { 
    type: PositionSchema, 
    default: () => ({}) 
  },
  
  // Character stats
  stats: { 
    type: StatsSchema, 
    default: () => ({}) 
  },
  
  // Skills
  skills: { 
    type: Map, 
    of: SkillSchema,
    default: () => new Map()
  },
  
  // Inventory and equipment
  inventory: [InventoryItemSchema],
  equipment: { 
    type: EquipmentSchema, 
    default: () => ({}) 
  },
  inventorySize: { 
    type: Number, 
    default: 50, 
    min: 20, 
    max: 500 
  },
  
  // Currency
  gold: { 
    type: Number, 
    default: 100, 
    min: 0,
    index: true
  },
  premiumCurrency: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  
  // Reputation system
  reputation: { 
    type: Map, 
    of: Number,
    default: () => new Map()
  },
  
  // Quests and achievements
  activeQuests: [QuestSchema],
  completedQuests: [String],
  failedQuests: [String],
  achievements: [AchievementSchema],
  titles: [{
    titleId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false }
  }],
  
  // Social connections
  social: { 
    type: SocialSchema, 
    default: () => ({}) 
  },
  
  // Player state
  isOnline: { 
    type: Boolean, 
    default: false,
    index: true
  },
  lastLogin: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  lastLogout: { 
    type: Date 
  },
  currentSession: {
    sessionId: { type: String },
    startTime: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  
  // Combat state
  isInCombat: { 
    type: Boolean, 
    default: false 
  },
  combatStartTime: { 
    type: Date 
  },
  lastAttacker: { 
    type: Schema.Types.ObjectId, 
    ref: 'Player' 
  },
  
  // Player status effects
  statusEffects: [{
    effectId: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    stacks: { type: Number, default: 1 },
    source: { type: String },
    data: { type: Map, of: Schema.Types.Mixed }
  }],
  
  // Flags and settings
  flags: {
    isNewPlayer: { type: Boolean, default: true },
    completedTutorial: { type: Boolean, default: false },
    isPvPEnabled: { type: Boolean, default: false },
    isTradingEnabled: { type: Boolean, default: true },
    canReceiveInvites: { type: Boolean, default: true },
    isAfk: { type: Boolean, default: false },
    afkSince: { type: Date }
  },
  
  // Player statistics
  statistics: { 
    type: StatisticsSchema, 
    default: () => ({}) 
  },
  
  // Preferences
  preferences: { 
    type: PreferencesSchema, 
    default: () => ({}) 
  },
  
  // Moderation
  moderation: {
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    banExpiresAt: { type: Date },
    isMuted: { type: Boolean, default: false },
    muteExpiresAt: { type: Date },
    warnings: [{
      reason: { type: String, required: true },
      issuedBy: { type: String, required: true },
      issuedAt: { type: Date, default: Date.now },
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
    }]
  },
  
  // Metadata
  metadata: {
    ipHistory: [String],
    deviceFingerprints: [String],
    loginHistory: [{
      timestamp: { type: Date, default: Date.now },
      ipAddress: { type: String },
      userAgent: { type: String },
      success: { type: Boolean, default: true }
    }],
    dataVersion: { type: Number, default: 1 }
  }
}, {
  timestamps: true,
  collection: 'players',
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.metadata;
      delete ret.moderation;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PlayerSchema.index({ accountId: 1, name: 1 }, { unique: true });
PlayerSchema.index({ level: -1, experience: -1 });
PlayerSchema.index({ gold: -1 });
PlayerSchema.index({ 'social.guild.guildId': 1 });
PlayerSchema.index({ isOnline: 1, lastLogin: -1 });
PlayerSchema.index({ 'position.worldId': 1, 'position.region': 1 });
PlayerSchema.index({ class: 1, race: 1 });

// Virtual fields
PlayerSchema.virtual('experienceToNext').get(function() {
  const experienceTable = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  if (this.level >= experienceTable.length) return 0;
  return experienceTable[this.level] - this.experience;
});

PlayerSchema.virtual('healthPercent').get(function() {
  return this.maxHealth > 0 ? (this.health / this.maxHealth) * 100 : 0;
});

PlayerSchema.virtual('manaPercent').get(function() {
  return this.maxMana > 0 ? (this.mana / this.maxMana) * 100 : 0;
});

PlayerSchema.virtual('staminaPercent').get(function() {
  return this.maxStamina > 0 ? (this.stamina / this.maxStamina) * 100 : 0;
});

PlayerSchema.virtual('powerLevel').get(function() {
  const statSum = this.stats.strength + this.stats.agility + 
                  this.stats.intelligence + this.stats.vitality;
  return this.level * 10 + statSum + (this.totalExperience / 1000);
});

PlayerSchema.virtual('totalSkillLevel').get(function() {
  let total = 0;
  for (const skill of this.skills.values()) {
    total += skill.level;
  }
  return total;
});

// Instance methods
PlayerSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  this.totalExperience += amount;
  
  // Check for level up
  const experienceTable = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  while (this.level < 100 && this.experience >= experienceTable[this.level]) {
    this.experience -= experienceTable[this.level];
    this.level++;
    this.availableStatPoints += 5;
    this.availableSkillPoints += 1;
    
    // Increase base stats on level up
    this.maxHealth += 10 + Math.floor(this.stats.vitality * 0.5);
    this.maxMana += 5 + Math.floor(this.stats.intelligence * 0.3);
    this.maxStamina += 5 + Math.floor(this.stats.agility * 0.2);
    
    // Restore health/mana on level up
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    this.stamina = this.maxStamina;
  }
  
  return this.level;
};

PlayerSchema.methods.addSkillExperience = function(skillId, amount) {
  if (!this.skills.has(skillId)) {
    this.skills.set(skillId, {
      skillId: skillId,
      level: 1,
      experience: 0,
      totalExperience: 0,
      unlockedAt: new Date(),
      timesUsed: 0,
      specializations: [],
      modifiers: []
    });
  }
  
  const skill = this.skills.get(skillId);
  skill.experience += amount;
  skill.totalExperience += amount;
  
  // Check for skill level up
  const skillExpTable = [0, 50, 120, 210, 320, 450, 600, 770, 960, 1170];
  while (skill.level < 100 && skill.experience >= skillExpTable[skill.level]) {
    skill.experience -= skillExpTable[skill.level];
    skill.level++;
  }
  
  this.skills.set(skillId, skill);
  return skill.level;
};

PlayerSchema.methods.addItem = function(itemId, quantity = 1, properties = {}) {
  // Find existing item or first empty slot
  let targetSlot = -1;
  let existingItem = null;
  
  for (let i = 0; i < this.inventory.length; i++) {
    const item = this.inventory[i];
    if (item.itemId === itemId && !item.instanceId) {
      existingItem = item;
      break;
    }
  }
  
  if (existingItem) {
    // Stack with existing item
    existingItem.quantity += quantity;
  } else {
    // Find empty slot
    for (let i = 0; i < this.inventorySize; i++) {
      if (!this.inventory.find(item => item.slot === i)) {
        targetSlot = i;
        break;
      }
    }
    
    if (targetSlot === -1) {
      throw new Error('Inventory is full');
    }
    
    // Add new item
    this.inventory.push({
      itemId: itemId,
      quantity: quantity,
      slot: targetSlot,
      obtainedAt: new Date(),
      obtainedFrom: 'unknown',
      ...properties
    });
  }
  
  return true;
};

PlayerSchema.methods.removeItem = function(itemId, quantity = 1) {
  const item = this.inventory.find(i => i.itemId === itemId);
  if (!item || item.quantity < quantity) {
    return false;
  }
  
  item.quantity -= quantity;
  if (item.quantity <= 0) {
    this.inventory = this.inventory.filter(i => i !== item);
  }
  
  return true;
};

PlayerSchema.methods.hasItem = function(itemId, quantity = 1) {
  const item = this.inventory.find(i => i.itemId === itemId);
  return item && item.quantity >= quantity;
};

PlayerSchema.methods.addGold = function(amount) {
  this.gold = Math.max(0, this.gold + amount);
  if (amount > 0) {
    this.statistics.goldEarned += amount;
  } else {
    this.statistics.goldSpent += Math.abs(amount);
  }
};

PlayerSchema.methods.canAfford = function(cost) {
  return this.gold >= cost;
};

PlayerSchema.methods.addReputation = function(faction, amount) {
  const current = this.reputation.get(faction) || 0;
  this.reputation.set(faction, current + amount);
};

PlayerSchema.methods.getReputation = function(faction) {
  return this.reputation.get(faction) || 0;
};

PlayerSchema.methods.isEnemyOf = function(otherPlayer) {
  // Check if players are enemies based on reputation, PvP flags, etc.
  if (this.flags.isPvPEnabled && otherPlayer.flags.isPvPEnabled) {
    return true;
  }
  
  // Check guild relations
  if (this.social.guild.guildId && otherPlayer.social.guild.guildId) {
    // TODO: Check guild war status
    return false;
  }
  
  return false;
};

PlayerSchema.methods.canAttack = function(target) {
  if (!target || target._id.equals(this._id)) return false;
  if (!this.flags.isPvPEnabled) return false;
  if (target.flags && !target.flags.isPvPEnabled) return false;
  
  return this.isEnemyOf(target);
};

PlayerSchema.methods.addStatusEffect = function(effectId, duration, data = {}) {
  // Remove existing effect of the same type
  this.statusEffects = this.statusEffects.filter(e => e.effectId !== effectId);
  
  // Add new effect
  this.statusEffects.push({
    effectId: effectId,
    appliedAt: new Date(),
    expiresAt: new Date(Date.now() + duration),
    stacks: data.stacks || 1,
    source: data.source || 'unknown',
    data: data
  });
};

PlayerSchema.methods.removeStatusEffect = function(effectId) {
  this.statusEffects = this.statusEffects.filter(e => e.effectId !== effectId);
};

PlayerSchema.methods.hasStatusEffect = function(effectId) {
  return this.statusEffects.some(e => e.effectId === effectId && 
    (!e.expiresAt || e.expiresAt > new Date()));
};

PlayerSchema.methods.cleanupExpiredEffects = function() {
  const now = new Date();
  this.statusEffects = this.statusEffects.filter(e => 
    !e.expiresAt || e.expiresAt > now);
};

PlayerSchema.methods.calculateStats = function() {
  // Base stats from character
  let totalStats = { ...this.stats.toObject() };
  
  // Add equipment bonuses
  // TODO: Implement equipment stat calculation
  
  // Add status effect modifiers
  for (const effect of this.statusEffects) {
    if (effect.data && effect.data.statModifiers) {
      for (const [stat, modifier] of Object.entries(effect.data.statModifiers)) {
        totalStats[stat] = (totalStats[stat] || 0) + modifier;
      }
    }
  }
  
  return totalStats;
};

PlayerSchema.methods.getEquippedItems = function() {
  const equipped = {};
  for (const [slot, itemId] of Object.entries(this.equipment.toObject())) {
    if (itemId && typeof itemId === 'string') {
      equipped[slot] = itemId;
    }
  }
  return equipped;
};

PlayerSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.metadata;
  delete obj.moderation;
  delete obj.accountId;
  return obj;
};

// Static methods
PlayerSchema.statics.findByName = function(name) {
  return this.findOne({ name: new RegExp('^' + name + '$', 'i') });
};

PlayerSchema.statics.findOnlinePlayers = function() {
  return this.find({ isOnline: true }).sort({ lastLogin: -1 });
};

PlayerSchema.statics.getTopPlayers = function(limit = 100) {
  return this.find()
    .sort({ level: -1, totalExperience: -1 })
    .limit(limit)
    .select('name level totalExperience class race');
};

PlayerSchema.statics.findByGuild = function(guildId) {
  return this.find({ 'social.guild.guildId': guildId });
};

// Pre-save middleware
PlayerSchema.pre('save', function(next) {
  // Update computed stats
  this.stats = { ...this.stats, ...this.calculateStats() };
  
  // Clean up expired effects
  this.cleanupExpiredEffects();
  
  // Validate health/mana/stamina bounds
  this.health = Math.max(0, Math.min(this.health, this.maxHealth));
  this.mana = Math.max(0, Math.min(this.mana, this.maxMana));
  this.stamina = Math.max(0, Math.min(this.stamina, this.maxStamina));
  
  next();
});

// Post-save middleware
PlayerSchema.post('save', function(doc) {
  // Emit events for level changes, achievement unlocks, etc.
  // This could be used for real-time notifications
});

const Player = mongoose.model('Player', PlayerSchema);

export default Player;
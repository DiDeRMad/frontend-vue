// ==================== БАЗОВЫЕ ТИПЫ ====================

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  isOnline: boolean
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
  settings: UserSettings
  stats: UserStats
  subscription?: Subscription
}

export enum UserRole {
  PLAYER = 'player',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  DEVELOPER = 'developer'
}

export interface UserSettings {
  sound: {
    masterVolume: number
    musicVolume: number
    effectsVolume: number
    voiceVolume: number
    muted: boolean
  }
  graphics: {
    quality: GraphicsQuality
    shadows: boolean
    particles: boolean
    vsync: boolean
    fullscreen: boolean
    resolution: Resolution
  }
  gameplay: {
    autoLoot: boolean
    showDamageNumbers: boolean
    showPlayerNames: boolean
    chatFilter: boolean
    language: string
  }
  controls: {
    keyBindings: KeyBindings
    mouseSensitivity: number
    invertMouse: boolean
  }
}

export enum GraphicsQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface Resolution {
  width: number
  height: number
}

export interface KeyBindings {
  moveForward: string
  moveBack: string
  moveLeft: string
  moveRight: string
  attack: string
  defend: string
  jump: string
  crouch: string
  inventory: string
  character: string
  skills: string
  map: string
  chat: string
  guild: string
  quest: string
  [key: string]: string
}

export interface UserStats {
  totalPlayTime: number
  totalCharacters: number
  achievementsUnlocked: number
  questsCompleted: number
  monstersKilled: number
  playersKilled: number
  deathCount: number
  goldEarned: number
  itemsCrafted: number
  dungeonsCompleted: number
}

export interface Subscription {
  type: SubscriptionType
  startDate: Date
  endDate: Date
  isActive: boolean
  benefits: string[]
}

export enum SubscriptionType {
  FREE = 'free',
  PREMIUM = 'premium',
  VIP = 'vip'
}

// ==================== ПЕРСОНАЖ ====================

export interface Character {
  id: string
  userId: string
  name: string
  class: CharacterClass
  race: CharacterRace
  level: number
  experience: number
  experienceToNext: number
  
  // Основные характеристики
  stats: CharacterStats
  attributes: CharacterAttributes
  
  // Внешность
  appearance: CharacterAppearance
  
  // Местоположение
  position: Vector3
  map: string
  zone: string
  
  // Состояние
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  stamina: number
  maxStamina: number
  
  // Инвентарь и экипировка
  inventory: InventorySlot[]
  equipment: Equipment
  
  // Навыки
  skills: CharacterSkills
  
  // Квесты
  activeQuests: Quest[]
  completedQuests: string[]
  
  // Социальное
  guildId?: string
  friends: string[]
  blocked: string[]
  
  // Время
  createdAt: Date
  lastLogin: Date
  totalPlayTime: number
  
  // PvP
  pvpStats: PvPStats
  
  // Достижения
  achievements: Achievement[]
  titles: Title[]
  activeTitle?: string
}

export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ARCHER = 'archer',
  ROGUE = 'rogue',
  CLERIC = 'cleric',
  PALADIN = 'paladin',
  WARLOCK = 'warlock',
  SHAMAN = 'shaman'
}

export enum CharacterRace {
  HUMAN = 'human',
  ELF = 'elf',
  DWARF = 'dwarf',
  ORC = 'orc',
  UNDEAD = 'undead',
  GNOME = 'gnome',
  TROLL = 'troll',
  DEMON = 'demon'
}

export interface CharacterStats {
  level: number
  experience: number
  skillPoints: number
  attributePoints: number
  
  // Боевые характеристики
  damage: number
  armor: number
  criticalChance: number
  criticalDamage: number
  blockChance: number
  dodgeChance: number
  
  // Скорости
  attackSpeed: number
  castSpeed: number
  moveSpeed: number
  
  // Сопротивления
  fireResistance: number
  iceResistance: number
  lightningResistance: number
  poisonResistance: number
  holyResistance: number
  shadowResistance: number
}

export interface CharacterAttributes {
  strength: number      // Физический урон, здоровье
  dexterity: number     // Критический шанс, скорость атаки
  intelligence: number  // Магический урон, мана
  vitality: number      // Здоровье, выносливость
  wisdom: number        // Регенерация маны, сопротивления
  luck: number          // Дроп, крит шанс
}

export interface CharacterAppearance {
  gender: Gender
  bodyType: number
  skinColor: string
  hairStyle: number
  hairColor: string
  eyeColor: string
  facialHair?: number
  tattoos?: number[]
  scars?: number[]
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface CharacterSkills {
  // Боевые навыки
  combat: {
    oneHanded: number
    twoHanded: number
    dualWield: number
    archery: number
    block: number
    dodge: number
  }
  
  // Магические школы
  magic: {
    fire: number
    ice: number
    lightning: number
    earth: number
    holy: number
    shadow: number
    healing: number
    enchantment: number
  }
  
  // Ремесленные навыки
  crafting: {
    blacksmithing: number
    tailoring: number
    alchemy: number
    cooking: number
    enchanting: number
    jewelcrafting: number
  }
  
  // Другие навыки
  gathering: {
    mining: number
    herbalism: number
    skinning: number
    fishing: number
    lumberjacking: number
  }
  
  // Социальные навыки
  social: {
    trading: number
    leadership: number
    diplomacy: number
  }
}

export interface PvPStats {
  kills: number
  deaths: number
  assists: number
  rating: number
  rank: PvPRank
  winStreak: number
  longestWinStreak: number
  totalMatches: number
  wins: number
  losses: number
}

export enum PvPRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
  LEGEND = 'legend'
}

// ==================== ИНВЕНТАРЬ И ПРЕДМЕТЫ ====================

export interface InventorySlot {
  id: string
  itemId: string
  quantity: number
  item: Item
  position: number
  locked?: boolean
}

export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  subtype: ItemSubtype
  rarity: ItemRarity
  level: number
  
  // Характеристики
  stats?: ItemStats
  requirements?: ItemRequirements
  
  // Внешний вид
  icon: string
  model?: string
  
  // Стоимость
  price: number
  stackSize: number
  
  // Особые свойства
  enchantments?: Enchantment[]
  sockets?: Socket[]
  durability?: number
  maxDurability?: number
  
  // Крафт
  craftable: boolean
  recipe?: CraftingRecipe
  
  // Прочее
  tradeable: boolean
  destroyable: boolean
  questItem: boolean
  unique: boolean
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  QUEST = 'quest',
  MISC = 'misc'
}

export enum ItemSubtype {
  // Оружие
  SWORD = 'sword',
  AXE = 'axe',
  MACE = 'mace',
  DAGGER = 'dagger',
  BOW = 'bow',
  CROSSBOW = 'crossbow',
  STAFF = 'staff',
  WAND = 'wand',
  SHIELD = 'shield',
  
  // Броня
  HELMET = 'helmet',
  CHEST = 'chest',
  LEGS = 'legs',
  BOOTS = 'boots',
  GLOVES = 'gloves',
  CLOAK = 'cloak',
  
  // Аксессуары
  RING = 'ring',
  NECKLACE = 'necklace',
  EARRING = 'earring',
  BRACELET = 'bracelet',
  
  // Расходники
  POTION = 'potion',
  FOOD = 'food',
  SCROLL = 'scroll',
  
  // Материалы
  ORE = 'ore',
  HERB = 'herb',
  LEATHER = 'leather',
  CLOTH = 'cloth',
  GEM = 'gem'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
  ARTIFACT = 'artifact'
}

export interface ItemStats {
  damage?: number
  armor?: number
  strength?: number
  dexterity?: number
  intelligence?: number
  vitality?: number
  wisdom?: number
  luck?: number
  
  // Особые характеристики
  criticalChance?: number
  criticalDamage?: number
  attackSpeed?: number
  blockChance?: number
  dodgeChance?: number
  
  // Сопротивления
  fireResistance?: number
  iceResistance?: number
  lightningResistance?: number
  poisonResistance?: number
  holyResistance?: number
  shadowResistance?: number
}

export interface ItemRequirements {
  level?: number
  class?: CharacterClass[]
  race?: CharacterRace[]
  stats?: {
    strength?: number
    dexterity?: number
    intelligence?: number
    vitality?: number
    wisdom?: number
  }
  quest?: string
}

export interface Equipment {
  mainHand?: InventorySlot
  offHand?: InventorySlot
  helmet?: InventorySlot
  chest?: InventorySlot
  legs?: InventorySlot
  boots?: InventorySlot
  gloves?: InventorySlot
  cloak?: InventorySlot
  ring1?: InventorySlot
  ring2?: InventorySlot
  necklace?: InventorySlot
  earring1?: InventorySlot
  earring2?: InventorySlot
  bracelet?: InventorySlot
}

export interface Enchantment {
  id: string
  name: string
  description: string
  type: EnchantmentType
  level: number
  stats: ItemStats
}

export enum EnchantmentType {
  DAMAGE = 'damage',
  DEFENSE = 'defense',
  UTILITY = 'utility',
  SPECIAL = 'special'
}

export interface Socket {
  type: SocketType
  gem?: Gem
}

export enum SocketType {
  RED = 'red',
  BLUE = 'blue',
  YELLOW = 'yellow',
  PRISMATIC = 'prismatic'
}

export interface Gem {
  id: string
  name: string
  type: SocketType
  level: number
  stats: ItemStats
}

// ==================== КРАФТИНГ ====================

export interface CraftingRecipe {
  id: string
  name: string
  description: string
  profession: CraftingProfession
  level: number
  category: string
  
  // Ингредиенты
  materials: CraftingMaterial[]
  
  // Результат
  result: {
    itemId: string
    quantity: number
    chance: number
  }
  
  // Условия
  station?: string
  tool?: string
  time: number
  experience: number
}

export enum CraftingProfession {
  BLACKSMITHING = 'blacksmithing',
  TAILORING = 'tailoring',
  ALCHEMY = 'alchemy',
  COOKING = 'cooking',
  ENCHANTING = 'enchanting',
  JEWELCRAFTING = 'jewelcrafting'
}

export interface CraftingMaterial {
  itemId: string
  quantity: number
}

// ==================== КВЕСТЫ ====================

export interface Quest {
  id: string
  name: string
  description: string
  type: QuestType
  level: number
  
  // Цепочка квестов
  chain?: string
  prerequisites?: string[]
  
  // NPC
  giver: string
  turnIn?: string
  
  // Цели
  objectives: QuestObjective[]
  
  // Награды
  rewards: QuestReward
  
  // Условия
  requirements?: QuestRequirements
  
  // Состояние
  status: QuestStatus
  progress: QuestProgress
  
  // Время
  timeLimit?: number
  startTime?: Date
  
  // Прочее
  repeatable: boolean
  daily: boolean
  weekly: boolean
  shareable: boolean
}

export enum QuestType {
  MAIN = 'main',
  SIDE = 'side',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  EVENT = 'event',
  GUILD = 'guild',
  PVP = 'pvp',
  DUNGEON = 'dungeon',
  RAID = 'raid'
}

export interface QuestObjective {
  id: string
  type: ObjectiveType
  description: string
  target?: string
  location?: Vector3
  current: number
  required: number
  completed: boolean
}

export enum ObjectiveType {
  KILL = 'kill',
  COLLECT = 'collect',
  DELIVER = 'deliver',
  TALK = 'talk',
  EXPLORE = 'explore',
  CRAFT = 'craft',
  USE = 'use',
  ESCORT = 'escort'
}

export interface QuestReward {
  experience: number
  gold: number
  items?: ItemReward[]
  choice?: ItemReward[]
  title?: string
  achievement?: string
}

export interface ItemReward {
  itemId: string
  quantity: number
  chance: number
}

export interface QuestRequirements {
  level?: number
  class?: CharacterClass[]
  race?: CharacterRace[]
  completedQuests?: string[]
  items?: string[]
  skills?: { [skill: string]: number }
}

export enum QuestStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TURNED_IN = 'turned_in'
}

export interface QuestProgress {
  [objectiveId: string]: number
}

// ==================== ГИЛЬДИИ ====================

export interface Guild {
  id: string
  name: string
  tag: string
  description: string
  level: number
  experience: number
  
  // Участники
  members: GuildMember[]
  maxMembers: number
  
  // Лидерство
  leader: string
  officers: string[]
  
  // Ресурсы
  treasury: number
  
  // Здания
  buildings: GuildBuilding[]
  
  // Активности
  activities: GuildActivity[]
  
  // Настройки
  settings: GuildSettings
  
  // Время
  createdAt: Date
  lastActivity: Date
  
  // Статистика
  stats: GuildStats
}

export interface GuildMember {
  userId: string
  characterId: string
  rank: GuildRank
  joinedAt: Date
  lastSeen: Date
  contribution: number
  permissions: GuildPermission[]
}

export enum GuildRank {
  MEMBER = 'member',
  VETERAN = 'veteran',
  OFFICER = 'officer',
  LEADER = 'leader'
}

export enum GuildPermission {
  INVITE = 'invite',
  KICK = 'kick',
  PROMOTE = 'promote',
  DEMOTE = 'demote',
  MANAGE_TREASURY = 'manage_treasury',
  MANAGE_BUILDINGS = 'manage_buildings',
  MANAGE_SETTINGS = 'manage_settings',
  START_WAR = 'start_war'
}

export interface GuildBuilding {
  type: GuildBuildingType
  level: number
  upgradeCost: number
  benefits: string[]
}

export enum GuildBuildingType {
  HALL = 'hall',
  TREASURY = 'treasury',
  ARMORY = 'armory',
  LIBRARY = 'library',
  BARRACKS = 'barracks',
  WORKSHOP = 'workshop'
}

export interface GuildActivity {
  type: GuildActivityType
  description: string
  timestamp: Date
  participants: string[]
}

export enum GuildActivityType {
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MEMBER_PROMOTED = 'member_promoted',
  BUILDING_UPGRADED = 'building_upgraded',
  WAR_DECLARED = 'war_declared',
  WAR_WON = 'war_won',
  EVENT_COMPLETED = 'event_completed'
}

export interface GuildSettings {
  public: boolean
  autoAccept: boolean
  minLevel: number
  requiredClass?: CharacterClass[]
  message: string
  language: string
}

export interface GuildStats {
  totalMembers: number
  averageLevel: number
  totalKills: number
  dungeonsCompleted: number
  warsWon: number
  warsLost: number
}

// ==================== БОЙ ====================

export interface Combat {
  id: string
  participants: CombatParticipant[]
  type: CombatType
  status: CombatStatus
  turn: number
  currentParticipant: string
  
  // Время
  startTime: Date
  endTime?: Date
  turnTimeLimit: number
  
  // Результат
  result?: CombatResult
  
  // Лог действий
  actions: CombatAction[]
}

export enum CombatType {
  PVE = 'pve',
  PVP = 'pvp',
  DUEL = 'duel',
  ARENA = 'arena',
  RAID = 'raid',
  SIEGE = 'siege'
}

export enum CombatStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended'
}

export interface CombatParticipant {
  id: string
  type: ParticipantType
  name: string
  level: number
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  position: Vector3
  
  // Состояния
  buffs: StatusEffect[]
  debuffs: StatusEffect[]
  
  // Характеристики
  stats: CharacterStats
  
  // AI для монстров
  ai?: MonsterAI
}

export enum ParticipantType {
  PLAYER = 'player',
  MONSTER = 'monster',
  NPC = 'npc',
  PET = 'pet',
  SUMMON = 'summon'
}

export interface StatusEffect {
  id: string
  name: string
  type: StatusEffectType
  duration: number
  stacks: number
  stats?: Partial<CharacterStats>
  tickDamage?: number
  tickHealing?: number
}

export enum StatusEffectType {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  DOT = 'dot', // Damage over time
  HOT = 'hot', // Heal over time
  STUN = 'stun',
  SILENCE = 'silence',
  ROOT = 'root',
  SLOW = 'slow',
  HASTE = 'haste'
}

export interface CombatAction {
  id: string
  participantId: string
  type: ActionType
  targetId?: string
  skillId?: string
  itemId?: string
  damage?: number
  healing?: number
  effects?: StatusEffect[]
  timestamp: Date
  description: string
}

export enum ActionType {
  ATTACK = 'attack',
  SKILL = 'skill',
  ITEM = 'item',
  MOVE = 'move',
  DEFEND = 'defend',
  FLEE = 'flee'
}

export interface CombatResult {
  winners: string[]
  losers: string[]
  experience: { [participantId: string]: number }
  loot: { [participantId: string]: Item[] }
  gold: { [participantId: string]: number }
}

export interface MonsterAI {
  type: AIType
  aggression: number
  intelligence: number
  preferredTargets: string[]
  skills: string[]
  behavior: AIBehavior
}

export enum AIType {
  PASSIVE = 'passive',
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  SMART = 'smart',
  BERSERKER = 'berserker'
}

export interface AIBehavior {
  fleeAtHealthPercent: number
  useSkillsAtHealthPercent: number
  callForHelpRadius: number
  patrolRadius: number
  chaseRadius: number
}

// ==================== ПОДЗЕМЕЛЬЯ ====================

export interface Dungeon {
  id: string
  name: string
  description: string
  type: DungeonType
  difficulty: DungeonDifficulty
  minLevel: number
  maxLevel: number
  maxPlayers: number
  
  // Карта
  rooms: DungeonRoom[]
  connections: DungeonConnection[]
  
  // Монстры и боссы
  monsters: Monster[]
  bosses: Boss[]
  
  // Награды
  loot: LootTable[]
  
  // Условия
  requirements?: DungeonRequirements
  
  // Время
  timeLimit?: number
  respawnTime: number
  
  // Механики
  mechanics: DungeonMechanic[]
}

export enum DungeonType {
  NORMAL = 'normal',
  ELITE = 'elite',
  RAID = 'raid',
  MYTHIC = 'mythic',
  EVENT = 'event'
}

export enum DungeonDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  NIGHTMARE = 'nightmare',
  HELL = 'hell'
}

export interface DungeonRoom {
  id: string
  name: string
  type: RoomType
  position: Vector3
  size: Vector3
  monsters: string[]
  interactables: Interactable[]
  events: RoomEvent[]
}

export enum RoomType {
  ENTRANCE = 'entrance',
  CORRIDOR = 'corridor',
  CHAMBER = 'chamber',
  BOSS = 'boss',
  TREASURE = 'treasure',
  PUZZLE = 'puzzle',
  TRAP = 'trap'
}

export interface DungeonConnection {
  from: string
  to: string
  type: ConnectionType
  locked: boolean
  key?: string
}

export enum ConnectionType {
  DOOR = 'door',
  PORTAL = 'portal',
  STAIRS = 'stairs',
  BRIDGE = 'bridge',
  TUNNEL = 'tunnel'
}

export interface Monster {
  id: string
  name: string
  level: number
  type: MonsterType
  rarity: MonsterRarity
  
  // Характеристики
  stats: CharacterStats
  health: number
  mana: number
  
  // Поведение
  ai: MonsterAI
  
  // Способности
  skills: Skill[]
  
  // Дроп
  loot: LootTable
  experience: number
  gold: number
  
  // Внешний вид
  model: string
  scale: number
  
  // Респавн
  respawnTime: number
  spawnPoints: Vector3[]
}

export enum MonsterType {
  BEAST = 'beast',
  HUMANOID = 'humanoid',
  UNDEAD = 'undead',
  DEMON = 'demon',
  ELEMENTAL = 'elemental',
  DRAGON = 'dragon',
  CONSTRUCT = 'construct'
}

export enum MonsterRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  ELITE = 'elite',
  BOSS = 'boss',
  WORLD_BOSS = 'world_boss'
}

export interface Boss extends Monster {
  phases: BossPhase[]
  enrageTimer: number
  mechanics: BossMechanic[]
}

export interface BossPhase {
  healthPercent: number
  abilities: string[]
  mechanics: string[]
  description: string
}

export interface BossMechanic {
  id: string
  name: string
  type: MechanicType
  trigger: MechanicTrigger
  effect: MechanicEffect
}

export enum MechanicType {
  DAMAGE = 'damage',
  HEALING = 'healing',
  SUMMON = 'summon',
  TELEPORT = 'teleport',
  TRANSFORM = 'transform',
  ENVIRONMENTAL = 'environmental'
}

export interface MechanicTrigger {
  type: TriggerType
  value?: number
  condition?: string
}

export enum TriggerType {
  HEALTH_PERCENT = 'health_percent',
  TIME = 'time',
  PLAYER_COUNT = 'player_count',
  DAMAGE_TAKEN = 'damage_taken'
}

export interface MechanicEffect {
  type: EffectType
  value: number
  duration?: number
  radius?: number
  target: TargetType
}

export enum EffectType {
  DAMAGE = 'damage',
  HEAL = 'heal',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  KNOCKBACK = 'knockback',
  STUN = 'stun'
}

export enum TargetType {
  SELF = 'self',
  PLAYERS = 'players',
  RANDOM_PLAYER = 'random_player',
  CLOSEST_PLAYER = 'closest_player',
  ALL = 'all'
}

export interface LootTable {
  id: string
  items: LootItem[]
  gold: GoldDrop
  experience: number
}

export interface LootItem {
  itemId: string
  chance: number
  minQuantity: number
  maxQuantity: number
  conditions?: LootCondition[]
}

export interface LootCondition {
  type: ConditionType
  value: any
}

export enum ConditionType {
  PLAYER_LEVEL = 'player_level',
  PLAYER_CLASS = 'player_class',
  DIFFICULTY = 'difficulty',
  FIRST_KILL = 'first_kill',
  PARTY_SIZE = 'party_size'
}

export interface GoldDrop {
  min: number
  max: number
  chance: number
}

export interface Interactable {
  id: string
  type: InteractableType
  position: Vector3
  model: string
  action: InteractableAction
}

export enum InteractableType {
  CHEST = 'chest',
  DOOR = 'door',
  LEVER = 'lever',
  BUTTON = 'button',
  CRYSTAL = 'crystal',
  ALTAR = 'altar',
  PORTAL = 'portal',
  NPC = 'npc'
}

export interface InteractableAction {
  type: ActionType
  requirements?: InteractionRequirement[]
  rewards?: InteractionReward[]
  effects?: InteractionEffect[]
}

export interface InteractionRequirement {
  type: RequirementType
  value: any
}

export enum RequirementType {
  ITEM = 'item',
  KEY = 'key',
  LEVEL = 'level',
  CLASS = 'class',
  QUEST = 'quest'
}

export interface InteractionReward {
  type: RewardType
  itemId?: string
  quantity?: number
  experience?: number
  gold?: number
}

export enum RewardType {
  ITEM = 'item',
  GOLD = 'gold',
  EXPERIENCE = 'experience',
  QUEST_PROGRESS = 'quest_progress'
}

export interface InteractionEffect {
  type: EffectType
  target: TargetType
  value: number
  duration?: number
}

export interface RoomEvent {
  id: string
  type: EventType
  trigger: EventTrigger
  effect: EventEffect
}

export enum EventType {
  TRAP = 'trap',
  AMBUSH = 'ambush',
  TREASURE = 'treasure',
  PUZZLE = 'puzzle',
  STORY = 'story'
}

export interface EventTrigger {
  type: TriggerType
  condition?: string
}

export interface EventEffect {
  type: EffectType
  description: string
  consequences: EventConsequence[]
}

export interface EventConsequence {
  type: ConsequenceType
  value: any
  target?: TargetType
}

export enum ConsequenceType {
  DAMAGE = 'damage',
  HEALING = 'healing',
  SPAWN_MONSTER = 'spawn_monster',
  TELEPORT = 'teleport',
  ITEM_DROP = 'item_drop',
  QUEST_UPDATE = 'quest_update'
}

export interface DungeonRequirements {
  level?: number
  class?: CharacterClass[]
  items?: string[]
  quests?: string[]
  partySize?: number
}

export interface DungeonMechanic {
  id: string
  name: string
  description: string
  type: MechanicType
  global: boolean
  rooms?: string[]
}

// ==================== НАВЫКИ ====================

export interface Skill {
  id: string
  name: string
  description: string
  type: SkillType
  school: SkillSchool
  level: number
  maxLevel: number
  
  // Характеристики
  damage?: number
  healing?: number
  manaCost: number
  castTime: number
  cooldown: number
  range: number
  
  // Эффекты
  effects: SkillEffect[]
  
  // Требования
  requirements: SkillRequirements
  
  // Улучшения
  upgrades: SkillUpgrade[]
  
  // Анимация и эффекты
  animation: string
  sound: string
  particle: string
  
  // Механики
  targetType: SkillTargetType
  areaOfEffect?: number
  piercing?: boolean
  channeled?: boolean
}

export enum SkillType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  TOGGLE = 'toggle',
  ULTIMATE = 'ultimate'
}

export enum SkillSchool {
  COMBAT = 'combat',
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning',
  EARTH = 'earth',
  HOLY = 'holy',
  SHADOW = 'shadow',
  NATURE = 'nature',
  ARCANE = 'arcane'
}

export interface SkillEffect {
  type: SkillEffectType
  value: number
  duration?: number
  chance: number
  target: SkillTargetType
}

export enum SkillEffectType {
  DAMAGE = 'damage',
  HEAL = 'heal',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  TELEPORT = 'teleport',
  SUMMON = 'summon',
  TRANSFORM = 'transform'
}

export enum SkillTargetType {
  SELF = 'self',
  TARGET = 'target',
  AREA = 'area',
  ALL_ENEMIES = 'all_enemies',
  ALL_ALLIES = 'all_allies',
  RANDOM = 'random'
}

export interface SkillRequirements {
  level: number
  class?: CharacterClass[]
  skills?: { [skillId: string]: number }
  attributes?: { [attribute: string]: number }
  items?: string[]
}

export interface SkillUpgrade {
  level: number
  cost: number
  benefits: SkillBenefit[]
}

export interface SkillBenefit {
  type: BenefitType
  value: number
}

export enum BenefitType {
  DAMAGE = 'damage',
  HEALING = 'healing',
  MANA_COST = 'mana_cost',
  COOLDOWN = 'cooldown',
  CAST_TIME = 'cast_time',
  RANGE = 'range',
  DURATION = 'duration'
}

// ==================== ДОСТИЖЕНИЯ ====================

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  type: AchievementType
  
  // Условия
  requirements: AchievementRequirement[]
  
  // Награды
  rewards: AchievementReward
  
  // Прогресс
  progress: number
  maxProgress: number
  completed: boolean
  completedAt?: Date
  
  // Редкость
  rarity: AchievementRarity
  points: number
  
  // Отображение
  icon: string
  hidden: boolean
}

export enum AchievementCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  CRAFTING = 'crafting',
  SOCIAL = 'social',
  PVP = 'pvp',
  DUNGEONS = 'dungeons',
  QUESTS = 'quests',
  MISC = 'misc'
}

export enum AchievementType {
  PROGRESS = 'progress',
  MILESTONE = 'milestone',
  COLLECTION = 'collection',
  SECRET = 'secret'
}

export interface AchievementRequirement {
  type: AchievementRequirementType
  target: string
  value: number
  operator: ComparisonOperator
}

export enum AchievementRequirementType {
  KILL_MONSTER = 'kill_monster',
  COMPLETE_QUEST = 'complete_quest',
  REACH_LEVEL = 'reach_level',
  CRAFT_ITEM = 'craft_item',
  COLLECT_ITEM = 'collect_item',
  VISIT_LOCATION = 'visit_location',
  DEFEAT_BOSS = 'defeat_boss',
  WIN_PVP = 'win_pvp'
}

export enum ComparisonOperator {
  EQUAL = 'equal',
  GREATER = 'greater',
  LESS = 'less',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal'
}

export interface AchievementReward {
  experience?: number
  gold?: number
  items?: string[]
  title?: string
  badge?: string
  points: number
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Title {
  id: string
  name: string
  description: string
  color: string
  rarity: AchievementRarity
  requirements: string[]
  effects?: TitleEffect[]
}

export interface TitleEffect {
  type: TitleEffectType
  value: number
}

export enum TitleEffectType {
  EXPERIENCE_BONUS = 'experience_bonus',
  GOLD_BONUS = 'gold_bonus',
  DAMAGE_BONUS = 'damage_bonus',
  DEFENSE_BONUS = 'defense_bonus'
}

// ==================== СОБЫТИЯ ====================

export interface GameEvent {
  id: string
  name: string
  description: string
  type: GameEventType
  status: EventStatus
  
  // Время
  startTime: Date
  endTime: Date
  duration: number
  
  // Участие
  participants: EventParticipant[]
  maxParticipants?: number
  
  // Условия
  requirements?: EventRequirements
  
  // Награды
  rewards: EventReward[]
  
  // Механики
  mechanics: EventMechanic[]
  
  // Прогресс
  progress: EventProgress
}

export enum GameEventType {
  WORLD_BOSS = 'world_boss',
  SIEGE = 'siege',
  TOURNAMENT = 'tournament',
  FESTIVAL = 'festival',
  INVASION = 'invasion',
  DOUBLE_XP = 'double_xp',
  SPECIAL_DUNGEON = 'special_dungeon'
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface EventParticipant {
  userId: string
  characterId: string
  joinedAt: Date
  contribution: number
  rewards: EventReward[]
}

export interface EventRequirements {
  level?: number
  class?: CharacterClass[]
  guild?: boolean
  pvpRating?: number
}

export interface EventReward {
  type: EventRewardType
  value: number
  condition?: EventRewardCondition
}

export enum EventRewardType {
  EXPERIENCE = 'experience',
  GOLD = 'gold',
  ITEM = 'item',
  TITLE = 'title',
  ACHIEVEMENT = 'achievement'
}

export interface EventRewardCondition {
  type: ConditionType
  value: number
  operator: ComparisonOperator
}

export interface EventMechanic {
  id: string
  type: EventMechanicType
  parameters: { [key: string]: any }
}

export enum EventMechanicType {
  SPAWN_BOSS = 'spawn_boss',
  MODIFY_STATS = 'modify_stats',
  SPECIAL_LOOT = 'special_loot',
  TELEPORT_PLAYERS = 'teleport_players'
}

export interface EventProgress {
  current: number
  target: number
  percentage: number
  milestones: EventMilestone[]
}

export interface EventMilestone {
  threshold: number
  reward: EventReward
  completed: boolean
}

// ==================== ЧАТ ====================

export interface ChatMessage {
  id: string
  channel: ChatChannel
  sender: ChatSender
  content: string
  timestamp: Date
  type: MessageType
  
  // Дополнительные данные
  data?: { [key: string]: any }
  
  // Модерация
  edited: boolean
  deleted: boolean
  moderatedBy?: string
  moderationReason?: string
}

export enum ChatChannel {
  GLOBAL = 'global',
  LOCAL = 'local',
  GUILD = 'guild',
  PARTY = 'party',
  WHISPER = 'whisper',
  TRADE = 'trade',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement'
}

export interface ChatSender {
  id: string
  username: string
  characterName?: string
  role: UserRole
  guildTag?: string
  title?: string
}

export enum MessageType {
  TEXT = 'text',
  EMOTE = 'emote',
  SYSTEM = 'system',
  ITEM_LINK = 'item_link',
  QUEST_LINK = 'quest_link',
  ACHIEVEMENT = 'achievement',
  TRADE_REQUEST = 'trade_request'
}

// ==================== ТОРГОВЛЯ ====================

export interface Trade {
  id: string
  participants: TradeParticipant[]
  status: TradeStatus
  type: TradeType
  
  // Время
  createdAt: Date
  expiresAt?: Date
  completedAt?: Date
  
  // Предметы и валюта
  items: TradeItem[]
  gold: { [participantId: string]: number }
  
  // Подтверждения
  confirmations: { [participantId: string]: boolean }
}

export interface TradeParticipant {
  userId: string
  characterId: string
  characterName: string
  ready: boolean
}

export enum TradeStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum TradeType {
  DIRECT = 'direct',
  AUCTION = 'auction',
  MARKET = 'market'
}

export interface TradeItem {
  participantId: string
  itemId: string
  quantity: number
  item: Item
}

export interface Auction {
  id: string
  sellerId: string
  item: Item
  quantity: number
  
  // Цены
  startingPrice: number
  currentBid: number
  buyoutPrice?: number
  
  // Время
  startTime: Date
  endTime: Date
  
  // Ставки
  bids: AuctionBid[]
  
  // Статус
  status: AuctionStatus
}

export interface AuctionBid {
  bidderId: string
  amount: number
  timestamp: Date
}

export enum AuctionStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// ==================== УВЕДОМЛЕНИЯ ====================

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  
  // Статус
  read: boolean
  priority: NotificationPriority
  
  // Данные
  data?: { [key: string]: any }
  
  // Действия
  actions?: NotificationAction[]
  
  // Время жизни
  expiresAt?: Date
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  ACHIEVEMENT = 'achievement',
  QUEST = 'quest',
  GUILD = 'guild',
  TRADE = 'trade',
  FRIEND = 'friend',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationAction {
  id: string
  label: string
  action: string
  data?: { [key: string]: any }
}

// ==================== КОНФИГУРАЦИЯ ====================

export interface GameConfig {
  version: string
  build: string
  
  // Сервер
  server: {
    maxPlayers: number
    maintenanceMode: boolean
    messageOfTheDay: string
  }
  
  // Настройки игрового мира
  world: {
    experienceRate: number
    goldRate: number
    dropRate: number
    pvpEnabled: boolean
    maxLevel: number
  }
  
  // События
  events: {
    enabled: boolean
    schedule: EventSchedule[]
  }
  
  // Экономика
  economy: {
    inflationRate: number
    tradeTax: number
    auctionTax: number
  }
  
  // PvP
  pvp: {
    enabled: boolean
    safeZones: string[]
    penaltyOnDeath: boolean
  }
  
  // Настройки по умолчанию
  defaults: {
    userSettings: UserSettings
    characterSlots: number
    startingGold: number
    startingItems: string[]
  }
}

export interface EventSchedule {
  eventId: string
  cronExpression: string
  duration: number
}

// ==================== API ТИПЫ ====================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: { [key: string]: any }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface LoginRequest {
  username: string
  password: string
  rememberMe: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface CharacterCreateRequest {
  name: string
  class: CharacterClass
  race: CharacterRace
  appearance: CharacterAppearance
}

// ==================== SOCKET СОБЫТИЯ ====================

export interface SocketEvents {
  // Подключение
  'connected': { message: string; timestamp: string; serverVersion: string }
  'disconnected': { reason: string }
  
  // Игрок
  'player:update': { character: Character }
  'player:move': { position: Vector3; direction: number }
  'player:action': { action: string; data: any }
  
  // Бой
  'combat:start': { combat: Combat }
  'combat:update': { combat: Combat }
  'combat:end': { result: CombatResult }
  'combat:action': { action: CombatAction }
  
  // Чат
  'chat:message': { message: ChatMessage }
  'chat:whisper': { message: ChatMessage }
  
  // Квесты
  'quest:update': { quest: Quest }
  'quest:complete': { quest: Quest; rewards: QuestReward }
  
  // Гильдия
  'guild:update': { guild: Guild }
  'guild:invite': { guildId: string; inviterName: string }
  
  // Торговля
  'trade:request': { trade: Trade }
  'trade:update': { trade: Trade }
  
  // Уведомления
  'notification': { notification: Notification }
  
  // Система
  'server:shutdown': { message: string; countdown: number }
  'server:maintenance': { message: string; duration: number }
  
  // Ошибки
  'error': { message: string; code: string }
}

// ==================== УТИЛИТАРНЫЕ ТИПЫ ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type EntityId = string
export type UserId = string
export type CharacterId = string
export type GuildId = string
export type ItemId = string
export type QuestId = string
export type SkillId = string

// Экспортируем все типы для удобства
export * from './game'
export * from './ui'
export * from './api'
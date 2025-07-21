// ==================== БАЗОВЫЕ API ТИПЫ ====================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
  timestamp: string
  requestId: string
}

export interface ApiError {
  code: string
  message: string
  details?: { [key: string]: any }
  stack?: string
  validation?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ApiMeta {
  version: string
  requestTime: number
  serverTime: string
  rateLimit?: RateLimitInfo
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor?: string
  prevCursor?: string
}

export interface ApiRequestOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  cache?: boolean
  cacheTime?: number
  headers?: { [key: string]: string }
  params?: { [key: string]: any }
}

// ==================== АУТЕНТИФИКАЦИЯ ====================

export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
  twoFactorCode?: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
  permissions: string[]
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  captcha?: string
  referralCode?: string
}

export interface RegisterResponse {
  user: User
  verification: {
    required: boolean
    method: VerificationMethod
    expiresIn?: number
  }
}

export enum VerificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  NONE = 'none'
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  expiresIn: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TwoFactorSetupRequest {
  method: TwoFactorMethod
  phone?: string
}

export enum TwoFactorMethod {
  SMS = 'sms',
  TOTP = 'totp',
  EMAIL = 'email'
}

export interface TwoFactorSetupResponse {
  secret?: string
  qrCode?: string
  backupCodes: string[]
}

export interface TwoFactorVerifyRequest {
  code: string
  method: TwoFactorMethod
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================

export interface UserProfileRequest {
  userId?: string
}

export interface UserProfileResponse {
  user: User
  characters: Character[]
  stats: UserStats
  achievements: Achievement[]
  friends: Friend[]
  recentActivity: Activity[]
}

export interface UpdateProfileRequest {
  email?: string
  settings?: Partial<UserSettings>
  privacy?: PrivacySettings
}

export interface PrivacySettings {
  showOnlineStatus: boolean
  showCharacters: boolean
  showStats: boolean
  showFriends: boolean
  allowFriendRequests: boolean
  allowGuildInvites: boolean
  allowTradeRequests: boolean
}

export interface Friend {
  id: string
  username: string
  characterName?: string
  level?: number
  class?: CharacterClass
  online: boolean
  lastSeen: Date
  status: FriendStatus
  note?: string
}

export enum FriendStatus {
  PENDING_SENT = 'pending_sent',
  PENDING_RECEIVED = 'pending_received',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked'
}

export interface AddFriendRequest {
  username: string
  message?: string
}

export interface FriendActionRequest {
  friendId: string
  action: FriendAction
}

export enum FriendAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
  REMOVE = 'remove',
  BLOCK = 'block',
  UNBLOCK = 'unblock'
}

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  data?: { [key: string]: any }
}

export enum ActivityType {
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  QUEST_COMPLETE = 'quest_complete',
  BOSS_DEFEAT = 'boss_defeat',
  ITEM_OBTAIN = 'item_obtain',
  PVP_WIN = 'pvp_win',
  GUILD_JOIN = 'guild_join',
  DUNGEON_COMPLETE = 'dungeon_complete'
}

// ==================== ПЕРСОНАЖИ ====================

export interface CharacterListRequest {
  userId?: string
}

export interface CharacterListResponse {
  characters: Character[]
  maxSlots: number
  usedSlots: number
}

export interface CharacterCreateRequest {
  name: string
  class: CharacterClass
  race: CharacterRace
  appearance: CharacterAppearance
  startingLocation?: string
}

export interface CharacterCreateResponse {
  character: Character
  startingItems: Item[]
  startingSkills: Skill[]
}

export interface CharacterDeleteRequest {
  characterId: string
  confirmation: string
}

export interface CharacterSelectRequest {
  characterId: string
}

export interface CharacterSelectResponse {
  character: Character
  worldState: WorldState
  serverInfo: ServerInfo
}

export interface WorldState {
  time: GameTime
  weather: Weather
  events: GameEvent[]
  announcements: Announcement[]
}

export interface GameTime {
  day: number
  hour: number
  minute: number
  season: Season
  year: number
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

export interface Weather {
  type: WeatherType
  intensity: number
  duration: number
}

export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  STORM = 'storm',
  SNOW = 'snow',
  FOG = 'fog'
}

export interface Announcement {
  id: string
  type: AnnouncementType
  title: string
  message: string
  timestamp: Date
  priority: number
}

export enum AnnouncementType {
  MAINTENANCE = 'maintenance',
  EVENT = 'event',
  UPDATE = 'update',
  NEWS = 'news',
  WARNING = 'warning'
}

export interface ServerInfo {
  name: string
  region: string
  population: ServerPopulation
  status: ServerStatus
  features: ServerFeature[]
}

export enum ServerPopulation {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  FULL = 'full'
}

export enum ServerStatus {
  ONLINE = 'online',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline'
}

export enum ServerFeature {
  PVP = 'pvp',
  RP = 'rp',
  HARDCORE = 'hardcore',
  EVENTS = 'events',
  BETA = 'beta'
}

export interface UpdateCharacterRequest {
  characterId: string
  updates: Partial<Character>
}

// ==================== ИГРОВОЙ МИР ====================

export interface MapDataRequest {
  mapId: string
  region?: string
  detail?: MapDetailLevel
}

export enum MapDetailLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  FULL = 'full'
}

export interface MapDataResponse {
  map: GameMap
  npcs: NPC[]
  monsters: Monster[]
  items: WorldItem[]
  players: OnlinePlayer[]
  events: LocalEvent[]
}

export interface GameMap {
  id: string
  name: string
  description: string
  type: MapType
  level: number
  size: Vector3
  zones: MapZone[]
  spawns: SpawnPoint[]
  boundaries: MapBoundary[]
  weather: Weather
  time: GameTime
}

export enum MapType {
  OVERWORLD = 'overworld',
  DUNGEON = 'dungeon',
  CITY = 'city',
  INSTANCE = 'instance',
  BATTLEGROUND = 'battleground'
}

export interface MapZone {
  id: string
  name: string
  type: ZoneType
  bounds: Bounds
  level: number
  pvpEnabled: boolean
  effects: ZoneEffect[]
}

export enum ZoneType {
  SAFE = 'safe',
  COMBAT = 'combat',
  PVP = 'pvp',
  NEUTRAL = 'neutral',
  RESTRICTED = 'restricted'
}

export interface ZoneEffect {
  type: ZoneEffectType
  value: number
  description: string
}

export enum ZoneEffectType {
  EXPERIENCE_BONUS = 'experience_bonus',
  DAMAGE_BONUS = 'damage_bonus',
  HEALING_BONUS = 'healing_bonus',
  MOVEMENT_SPEED = 'movement_speed',
  MANA_REGEN = 'mana_regen',
  HEALTH_REGEN = 'health_regen'
}

export interface SpawnPoint {
  id: string
  position: Vector3
  type: SpawnType
  conditions?: SpawnCondition[]
}

export enum SpawnType {
  PLAYER = 'player',
  MONSTER = 'monster',
  NPC = 'npc',
  ITEM = 'item',
  RESOURCE = 'resource'
}

export interface SpawnCondition {
  type: ConditionType
  value: any
  operator: ComparisonOperator
}

export interface MapBoundary {
  type: BoundaryType
  points: Vector3[]
  action: BoundaryAction
}

export enum BoundaryType {
  WORLD = 'world',
  ZONE = 'zone',
  SAFE = 'safe',
  PVP = 'pvp'
}

export enum BoundaryAction {
  BLOCK = 'block',
  TELEPORT = 'teleport',
  DAMAGE = 'damage',
  WARNING = 'warning'
}

export interface NPC {
  id: string
  name: string
  type: NPCType
  position: Vector3
  level: number
  faction: string
  dialogue: DialogueTree
  quests: Quest[]
  shop?: Shop
  services: NPCService[]
}

export enum NPCType {
  VENDOR = 'vendor',
  QUEST_GIVER = 'quest_giver',
  GUARD = 'guard',
  TRAINER = 'trainer',
  BANKER = 'banker',
  INNKEEPER = 'innkeeper',
  STABLE_MASTER = 'stable_master'
}

export interface DialogueTree {
  id: string
  root: DialogueNode
}

export interface DialogueNode {
  id: string
  text: string
  options: DialogueOption[]
  conditions?: DialogueCondition[]
  actions?: DialogueAction[]
}

export interface DialogueOption {
  id: string
  text: string
  nextNode?: string
  conditions?: DialogueCondition[]
  actions?: DialogueAction[]
}

export interface DialogueCondition {
  type: ConditionType
  target: string
  value: any
  operator: ComparisonOperator
}

export interface DialogueAction {
  type: ActionType
  target: string
  value: any
}

export interface Shop {
  id: string
  type: ShopType
  items: ShopItem[]
  currency: CurrencyType[]
  refreshInterval: number
  lastRefresh: Date
}

export enum ShopType {
  GENERAL = 'general',
  WEAPONS = 'weapons',
  ARMOR = 'armor',
  POTIONS = 'potions',
  MATERIALS = 'materials',
  SPECIAL = 'special'
}

export interface ShopItem {
  itemId: string
  price: number
  currency: CurrencyType
  quantity: number
  unlimited: boolean
  requirements?: ItemRequirements
}

export enum CurrencyType {
  GOLD = 'gold',
  SILVER = 'silver',
  COPPER = 'copper',
  HONOR = 'honor',
  GUILD_POINTS = 'guild_points',
  EVENT_TOKENS = 'event_tokens'
}

export enum NPCService {
  REPAIR = 'repair',
  BANK = 'bank',
  AUCTION = 'auction',
  TRAINING = 'training',
  TELEPORT = 'teleport',
  RESURRECTION = 'resurrection'
}

export interface WorldItem {
  id: string
  itemId: string
  position: Vector3
  quantity: number
  owner?: string
  spawned: Date
  despawnTime?: Date
}

export interface OnlinePlayer {
  id: string
  name: string
  level: number
  class: CharacterClass
  position: Vector3
  status: PlayerStatus
  guild?: GuildInfo
}

export enum PlayerStatus {
  IDLE = 'idle',
  MOVING = 'moving',
  COMBAT = 'combat',
  TRADING = 'trading',
  AFK = 'afk'
}

export interface GuildInfo {
  id: string
  name: string
  tag: string
  level: number
}

export interface LocalEvent {
  id: string
  type: EventType
  position: Vector3
  radius: number
  duration: number
  participants: string[]
}

// ==================== ИНВЕНТАРЬ И ПРЕДМЕТЫ ====================

export interface InventoryRequest {
  characterId: string
}

export interface InventoryResponse {
  inventory: InventorySlot[]
  equipment: Equipment
  gold: number
  capacity: number
}

export interface MoveItemRequest {
  characterId: string
  fromSlot: number
  toSlot: number
  quantity?: number
}

export interface UseItemRequest {
  characterId: string
  slot: number
  targetId?: string
  quantity?: number
}

export interface DropItemRequest {
  characterId: string
  slot: number
  quantity?: number
}

export interface SplitStackRequest {
  characterId: string
  slot: number
  quantity: number
  targetSlot: number
}

export interface EnchantItemRequest {
  characterId: string
  itemSlot: number
  enchantmentId: string
  materials: CraftingMaterial[]
}

export interface RepairItemRequest {
  characterId: string
  itemSlot?: number
  repairAll?: boolean
}

export interface RepairItemResponse {
  cost: number
  currency: CurrencyType
  durabilityRestored: number
}

// ==================== КРАФТИНГ ====================

export interface CraftingRecipesRequest {
  profession?: CraftingProfession
  category?: string
  level?: number
}

export interface CraftingRecipesResponse {
  recipes: CraftingRecipe[]
  professionLevel: number
  experience: number
  experienceToNext: number
}

export interface CraftItemRequest {
  characterId: string
  recipeId: string
  quantity: number
  station?: string
}

export interface CraftItemResponse {
  result: Item[]
  experience: number
  success: boolean
  quality?: ItemQuality
}

export enum ItemQuality {
  POOR = 'poor',
  NORMAL = 'normal',
  GOOD = 'good',
  EXCELLENT = 'excellent',
  MASTERWORK = 'masterwork'
}

export interface LearnRecipeRequest {
  characterId: string
  recipeId: string
}

// ==================== КВЕСТЫ ====================

export interface QuestListRequest {
  characterId: string
  status?: QuestStatus
  type?: QuestType
}

export interface QuestListResponse {
  quests: Quest[]
  dailyQuests: Quest[]
  weeklyQuests: Quest[]
  completedToday: number
  completedThisWeek: number
}

export interface AcceptQuestRequest {
  characterId: string
  questId: string
  npcId?: string
}

export interface AbandonQuestRequest {
  characterId: string
  questId: string
}

export interface CompleteQuestRequest {
  characterId: string
  questId: string
  npcId?: string
  chosenReward?: string
}

export interface CompleteQuestResponse {
  rewards: QuestReward
  experience: number
  items: Item[]
  newQuests: Quest[]
}

export interface QuestProgressRequest {
  characterId: string
  questId: string
  objectiveId: string
  progress: number
}

// ==================== ГИЛЬДИИ ====================

export interface GuildListRequest {
  search?: string
  minLevel?: number
  maxLevel?: number
  language?: string
  recruiting?: boolean
  page?: number
  limit?: number
}

export interface GuildListResponse {
  guilds: GuildInfo[]
  pagination: PaginationInfo
}

export interface GuildDetailsRequest {
  guildId: string
}

export interface GuildDetailsResponse {
  guild: Guild
  members: GuildMember[]
  activities: GuildActivity[]
  permissions: GuildPermission[]
}

export interface CreateGuildRequest {
  name: string
  tag: string
  description: string
  public: boolean
  language: string
  minLevel: number
}

export interface CreateGuildResponse {
  guild: Guild
  cost: number
}

export interface JoinGuildRequest {
  guildId: string
  message?: string
}

export interface LeaveGuildRequest {
  guildId: string
  reason?: string
}

export interface InviteToGuildRequest {
  guildId: string
  targetUsername: string
  message?: string
}

export interface ManageGuildMemberRequest {
  guildId: string
  memberId: string
  action: GuildMemberAction
  reason?: string
}

export enum GuildMemberAction {
  PROMOTE = 'promote',
  DEMOTE = 'demote',
  KICK = 'kick',
  BAN = 'ban',
  SET_NOTE = 'set_note'
}

export interface UpdateGuildRequest {
  guildId: string
  updates: Partial<Guild>
}

export interface DonateToGuildRequest {
  guildId: string
  amount: number
  currency: CurrencyType
}

export interface UpgradeBuildingRequest {
  guildId: string
  buildingType: GuildBuildingType
}

// ==================== PvP И АРЕНЫ ====================

export interface PvPStatsRequest {
  characterId?: string
  season?: string
}

export interface PvPStatsResponse {
  stats: PvPStats
  ranking: PvPRanking
  history: PvPMatch[]
  rewards: PvPReward[]
}

export interface PvPRanking {
  rank: number
  rating: number
  tier: PvPRank
  winsRequired: number
  lossesUntilDemotion: number
}

export interface PvPMatch {
  id: string
  type: PvPMatchType
  result: MatchResult
  rating: number
  ratingChange: number
  duration: number
  timestamp: Date
  opponents: PvPOpponent[]
}

export enum PvPMatchType {
  DUEL = 'duel',
  ARENA_1V1 = 'arena_1v1',
  ARENA_2V2 = 'arena_2v2',
  ARENA_3V3 = 'arena_3v3',
  BATTLEGROUND = 'battleground'
}

export enum MatchResult {
  WIN = 'win',
  LOSS = 'loss',
  DRAW = 'draw'
}

export interface PvPOpponent {
  name: string
  level: number
  class: CharacterClass
  rating: number
  rank: PvPRank
}

export interface PvPReward {
  type: PvPRewardType
  item?: Item
  amount?: number
  currency?: CurrencyType
  requirement: string
  claimed: boolean
}

export enum PvPRewardType {
  ITEM = 'item',
  CURRENCY = 'currency',
  TITLE = 'title',
  ACHIEVEMENT = 'achievement'
}

export interface JoinQueueRequest {
  characterId: string
  queueType: PvPQueueType
  teammates?: string[]
}

export enum PvPQueueType {
  DUEL = 'duel',
  ARENA_1V1 = 'arena_1v1',
  ARENA_2V2 = 'arena_2v2',
  ARENA_3V3 = 'arena_3v3',
  BATTLEGROUND = 'battleground',
  RANKED = 'ranked'
}

export interface LeaveQueueRequest {
  characterId: string
  queueType: PvPQueueType
}

export interface ChallengePlayerRequest {
  challengerId: string
  targetId: string
  type: PvPMatchType
  wager?: PvPWager
}

export interface PvPWager {
  amount: number
  currency: CurrencyType
  items?: string[]
}

// ==================== ПОДЗЕМЕЛЬЯ ====================

export interface DungeonListRequest {
  characterId: string
  difficulty?: DungeonDifficulty
  type?: DungeonType
  level?: number
}

export interface DungeonListResponse {
  dungeons: DungeonInfo[]
  completions: DungeonCompletion[]
  lockouts: DungeonLockout[]
}

export interface DungeonInfo {
  id: string
  name: string
  description: string
  type: DungeonType
  difficulty: DungeonDifficulty
  minLevel: number
  maxLevel: number
  maxPlayers: number
  timeLimit: number
  rewards: DungeonRewards
}

export interface DungeonRewards {
  experience: number
  gold: number
  items: LootTable[]
  firstTime: LootTable[]
}

export interface DungeonCompletion {
  dungeonId: string
  difficulty: DungeonDifficulty
  completions: number
  bestTime: number
  firstCompletion: Date
  lastCompletion: Date
}

export interface DungeonLockout {
  dungeonId: string
  difficulty: DungeonDifficulty
  expiresAt: Date
  attempts: number
  maxAttempts: number
}

export interface EnterDungeonRequest {
  characterId: string
  dungeonId: string
  difficulty: DungeonDifficulty
  partyMembers?: string[]
}

export interface LeaveDungeonRequest {
  characterId: string
  reason?: string
}

export interface DungeonProgressRequest {
  characterId: string
  dungeonId: string
}

export interface DungeonProgressResponse {
  progress: DungeonProgress
  bosses: BossStatus[]
  loot: WorldItem[]
  time: number
}

export interface DungeonProgress {
  roomsCleared: number
  totalRooms: number
  bossesDefeated: number
  totalBosses: number
  secretsFound: number
  totalSecrets: number
}

export interface BossStatus {
  bossId: string
  defeated: boolean
  defeatedBy: string[]
  defeatedAt?: Date
  attempts: number
}

// ==================== ТОРГОВЛЯ ====================

export interface AuctionListRequest {
  category?: ItemType
  subtype?: ItemSubtype
  rarity?: ItemRarity
  minLevel?: number
  maxLevel?: number
  search?: string
  sortBy?: AuctionSortBy
  sortOrder?: SortOrder
  page?: number
  limit?: number
}

export enum AuctionSortBy {
  PRICE = 'price',
  TIME_LEFT = 'time_left',
  LEVEL = 'level',
  RARITY = 'rarity',
  NAME = 'name'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export interface AuctionListResponse {
  auctions: Auction[]
  pagination: PaginationInfo
  categories: AuctionCategory[]
}

export interface AuctionCategory {
  type: ItemType
  subtype?: ItemSubtype
  count: number
}

export interface CreateAuctionRequest {
  characterId: string
  itemSlot: number
  quantity: number
  startingPrice: number
  buyoutPrice?: number
  duration: number
}

export interface CreateAuctionResponse {
  auction: Auction
  fee: number
}

export interface BidOnAuctionRequest {
  characterId: string
  auctionId: string
  amount: number
}

export interface BuyoutAuctionRequest {
  characterId: string
  auctionId: string
}

export interface CancelAuctionRequest {
  characterId: string
  auctionId: string
}

export interface MyAuctionsRequest {
  characterId: string
  type: MyAuctionType
}

export enum MyAuctionType {
  SELLING = 'selling',
  BIDDING = 'bidding',
  WON = 'won',
  SOLD = 'sold'
}

export interface DirectTradeRequest {
  initiatorId: string
  targetId: string
}

export interface TradeOfferRequest {
  tradeId: string
  items: TradeOfferItem[]
  gold: number
}

export interface TradeOfferItem {
  slot: number
  quantity: number
}

export interface AcceptTradeRequest {
  tradeId: string
}

export interface CancelTradeRequest {
  tradeId: string
  reason?: string
}

// ==================== ЛИДЕРБОРДЫ ====================

export interface LeaderboardRequest {
  type: LeaderboardType
  timeframe?: LeaderboardTimeframe
  class?: CharacterClass
  server?: string
  page?: number
  limit?: number
}

export enum LeaderboardType {
  LEVEL = 'level',
  PVP_RATING = 'pvp_rating',
  ACHIEVEMENT_POINTS = 'achievement_points',
  WEALTH = 'wealth',
  MONSTERS_KILLED = 'monsters_killed',
  QUESTS_COMPLETED = 'quests_completed',
  DUNGEONS_COMPLETED = 'dungeons_completed',
  CRAFTING_SKILL = 'crafting_skill'
}

export enum LeaderboardTimeframe {
  ALL_TIME = 'all_time',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily'
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  pagination: PaginationInfo
  playerRank?: LeaderboardEntry
}

export interface LeaderboardEntry {
  rank: number
  characterId: string
  characterName: string
  level: number
  class: CharacterClass
  guild?: GuildInfo
  value: number
  change?: number
}

// ==================== СОБЫТИЯ И НОВОСТИ ====================

export interface NewsRequest {
  category?: NewsCategory
  page?: number
  limit?: number
}

export enum NewsCategory {
  UPDATES = 'updates',
  EVENTS = 'events',
  MAINTENANCE = 'maintenance',
  COMMUNITY = 'community'
}

export interface NewsResponse {
  articles: NewsArticle[]
  pagination: PaginationInfo
}

export interface NewsArticle {
  id: string
  title: string
  content: string
  category: NewsCategory
  author: string
  publishedAt: Date
  updatedAt?: Date
  tags: string[]
  featured: boolean
  image?: string
}

export interface EventListRequest {
  status?: EventStatus
  type?: GameEventType
  page?: number
  limit?: number
}

export interface EventListResponse {
  events: GameEvent[]
  pagination: PaginationInfo
}

export interface JoinEventRequest {
  characterId: string
  eventId: string
}

export interface LeaveEventRequest {
  characterId: string
  eventId: string
}

// ==================== СТАТИСТИКА И АНАЛИТИКА ====================

export interface StatsRequest {
  characterId: string
  timeframe?: StatsTimeframe
  category?: StatsCategory
}

export enum StatsTimeframe {
  SESSION = 'session',
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  ALL_TIME = 'all_time'
}

export enum StatsCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  CRAFTING = 'crafting',
  TRADING = 'trading',
  SOCIAL = 'social'
}

export interface StatsResponse {
  stats: { [key: string]: StatValue }
  charts: ChartData[]
  achievements: RecentAchievement[]
}

export interface StatValue {
  value: number
  change?: number
  rank?: number
  percentile?: number
}

export interface ChartData {
  id: string
  type: ChartType
  title: string
  data: ChartPoint[]
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area'
}

export interface ChartPoint {
  x: string | number
  y: number
  label?: string
}

export interface RecentAchievement {
  id: string
  name: string
  icon: string
  unlockedAt: Date
  rarity: AchievementRarity
}

// ==================== ПОДДЕРЖКА И МОДЕРАЦИЯ ====================

export interface SupportTicketRequest {
  subject: string
  category: SupportCategory
  description: string
  priority: TicketPriority
  attachments?: string[]
}

export enum SupportCategory {
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  BILLING = 'billing',
  GAMEPLAY = 'gameplay',
  REPORT = 'report',
  SUGGESTION = 'suggestion'
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface SupportTicketResponse {
  ticket: SupportTicket
}

export interface SupportTicket {
  id: string
  subject: string
  category: SupportCategory
  status: TicketStatus
  priority: TicketPriority
  createdAt: Date
  updatedAt: Date
  responses: TicketResponse[]
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_REPLY = 'waiting_reply',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface TicketResponse {
  id: string
  message: string
  author: string
  timestamp: Date
  isStaff: boolean
  attachments?: string[]
}

export interface ReportPlayerRequest {
  reporterId: string
  targetId: string
  reason: ReportReason
  description: string
  evidence?: string[]
}

export enum ReportReason {
  CHEATING = 'cheating',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_NAME = 'inappropriate_name',
  SPAM = 'spam',
  REAL_MONEY_TRADING = 'real_money_trading',
  OTHER = 'other'
}

// ==================== ТИПЫ ЭКСПОРТОВ ====================

export * from './index'
export * from './game'
export * from './ui'
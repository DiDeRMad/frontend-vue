// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Game-specific types
export type PlayerId = string;
export type CharacterId = string;
export type ItemId = string;
export type SkillId = string;
export type QuestId = string;
export type ZoneId = string;
export type GuildId = string;

export type Timestamp = number;
export type Duration = number;

export type Vector2 = { x: number; y: number };
export type Vector3 = { x: number; y: number; z: number };
export type Quaternion = { x: number; y: number; z: number; w: number };

export type Color = string;
export type HexColor = `#${string}`;
export type RGBColor = { r: number; g: number; b: number };
export type RGBAColor = { r: number; g: number; b: number; a: number };

export type Percentage = number;
export type Multiplier = number;

export type Level = number;
export type Experience = number;
export type Gold = number;

export type DamageRange = { min: number; max: number };
export type StatModifier = { stat: string; value: number; type: 'flat' | 'percent' };

export type Keybind = string;
export type MacroCommand = string;

export type LocaleString = string;
export type TranslationKey = string;

export type AssetPath = string;
export type ModelPath = string;
export type TexturePath = string;
export type SoundPath = string;
export type AnimationPath = string;

export type ServerRegion = 'NA' | 'EU' | 'AS' | 'OC' | 'SA';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';

export type Resolution = `${number}x${number}`;
export type AspectRatio = `${number}:${number}`;

export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';

export type PaginationParams = {
  page: number;
  limit: number;
  offset?: number;
};

export type SortParams<T> = {
  field: keyof T;
  direction: SortDirection;
};

export type FilterParams<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: any;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: Date;
  };
};

export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export type Unsubscribe = () => void;

export type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'disconnected';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting';

export type InputAction = {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel' | 'gamepad';
  key?: string;
  button?: number;
  position?: Vector2;
  delta?: Vector2;
  gamepad?: {
    button?: number;
    axis?: number;
    value?: number;
  };
  timestamp: Timestamp;
};

export type NetworkLatency = {
  ping: number;
  jitter: number;
  packetLoss: Percentage;
  timestamp: Timestamp;
};

export type PerformanceMetrics = {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory: {
    used: number;
    allocated: number;
    limit: number;
  };
  cpu: Percentage;
  gpu: Percentage;
};

export type ValidationRule<T = any> = {
  field: keyof T;
  rules: Array<{
    type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
  }>;
};

export type CacheEntry<T> = {
  data: T;
  timestamp: Timestamp;
  ttl: Duration;
  tags?: string[];
};

export type DiffResult<T> = {
  added: T[];
  removed: T[];
  modified: Array<{
    old: T;
    new: T;
    changes: Partial<T>;
  }>;
};

export type MergeStrategy = 'overwrite' | 'combine' | 'prefer_source' | 'prefer_target' | 'custom';

export type SerializedData = {
  type: string;
  version: string;
  data: string;
  compression?: 'none' | 'gzip' | 'brotli';
  checksum?: string;
};

export type ScheduledTask = {
  id: string;
  name: string;
  schedule: string;
  handler: string;
  data?: any;
  lastRun?: Date;
  nextRun: Date;
  enabled: boolean;
};

export type Subscription = {
  id: string;
  topic: string;
  handler: EventHandler;
  filter?: any;
  options?: {
    once?: boolean;
    priority?: number;
    debounce?: Duration;
    throttle?: Duration;
  };
};

export type RateLimitConfig = {
  window: Duration;
  limit: number;
  strategy: 'sliding' | 'fixed' | 'token_bucket';
  keyGenerator?: (context: any) => string;
};

export type CooldownInfo = {
  ability: string;
  startTime: Timestamp;
  duration: Duration;
  modifiers?: Array<{
    source: string;
    reduction: Percentage;
  }>;
};

export type DamageCalculation = {
  base: number;
  modifiers: Array<{
    source: string;
    type: 'flat' | 'percent' | 'multiplier';
    value: number;
  }>;
  mitigation: Array<{
    source: string;
    type: 'armor' | 'resistance' | 'absorb' | 'block';
    value: number;
  }>;
  final: number;
  overkill?: number;
};

export type LootDistribution = {
  method: 'need_greed' | 'round_robin' | 'master_loot' | 'personal' | 'group_loot';
  threshold?: 'uncommon' | 'rare' | 'epic' | 'legendary';
  rules?: Array<{
    priority: number;
    condition: any;
    recipients: string[];
  }>;
};

export type ChatMessage = {
  id: string;
  channel: string;
  sender: {
    id: string;
    name: string;
    guild?: string;
    level?: number;
  };
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'item' | 'achievement' | 'location' | 'image';
    data: any;
  }>;
  mentions?: string[];
  reactions?: Map<string, string[]>;
};

export type MarketData = {
  itemId: string;
  listings: number;
  lowestPrice: Gold;
  averagePrice: Gold;
  highestPrice: Gold;
  volume24h: number;
  priceHistory: Array<{
    timestamp: Date;
    price: Gold;
    volume: number;
  }>;
};

export type CraftingRecipe = {
  id: string;
  result: {
    itemId: string;
    quantity: number;
    quality?: string;
  };
  materials: Array<{
    itemId: string;
    quantity: number;
    recoverable?: boolean;
  }>;
  requirements: {
    profession: string;
    skill: number;
    tools?: string[];
    station?: string;
  };
  difficulty: number;
  experience: Experience;
  discoverable?: boolean;
};

export type SpellSchool = 'physical' | 'fire' | 'frost' | 'nature' | 'shadow' | 'holy' | 'arcane';
export type ResourceType = 'health' | 'mana' | 'energy' | 'rage' | 'focus' | 'runic_power' | 'custom';
export type TargetingMode = 'single' | 'aoe' | 'cone' | 'line' | 'chain' | 'smart';

export type StatusEffect = {
  id: string;
  stacks: number;
  duration: Duration;
  remaining: Duration;
  source: string;
  refreshable: boolean;
  dispellable?: boolean;
};

export type CombatRating = {
  value: number;
  percentage: Percentage;
  cap?: number;
  diminishingReturns?: boolean;
};

export type TalentLoadout = {
  id: string;
  name: string;
  class: string;
  spec: string;
  talents: Map<string, number>;
  glyphs?: Map<string, string>;
  soulbinds?: Map<string, string>;
};

export type GroupFinderListing = {
  id: string;
  activity: {
    type: 'dungeon' | 'raid' | 'pvp' | 'quest' | 'custom';
    id?: string;
    name: string;
    difficulty?: string;
  };
  leader: string;
  members: Array<{
    id: string;
    role: 'tank' | 'healer' | 'dps';
    class: string;
    level: Level;
    itemLevel?: number;
  }>;
  requirements: {
    minLevel?: Level;
    minItemLevel?: number;
    achievements?: string[];
    rating?: number;
  };
  description?: string;
  voice?: boolean;
  language?: Language;
};

export type WorldBossSpawn = {
  bossId: string;
  location: Vector3;
  health: Percentage;
  phase: number;
  mechanics: string[];
  participants: number;
  topDamagers: Array<{
    player: string;
    damage: number;
    percentage: Percentage;
  }>;
  expectedKillTime?: Date;
};

export type PhaseState = {
  id: string;
  active: boolean;
  conditions: Array<{
    type: 'quest' | 'time' | 'event' | 'population' | 'custom';
    met: boolean;
    data: any;
  }>;
  changes: {
    npcs?: string[];
    objects?: string[];
    quests?: string[];
    terrain?: any;
  };
};

export type AIState = {
  behavior: string;
  target?: string;
  path?: Vector3[];
  alertLevel: number;
  memory: Map<string, any>;
  goals: Array<{
    type: string;
    priority: number;
    target?: any;
    progress?: number;
  }>;
  decisions: Array<{
    action: string;
    score: number;
    factors: Map<string, number>;
  }>;
};
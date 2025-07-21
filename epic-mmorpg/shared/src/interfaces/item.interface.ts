import { 
  ItemType, 
  ItemRarity, 
  EquipmentSlot, 
  WeaponType, 
  ArmorType,
  CharacterClass,
  CharacterRace,
  DamageType,
  CraftingQuality
} from '../enums/index.js';

export interface IItemStats {
  // Primary Stats
  strength?: number;
  agility?: number;
  intellect?: number;
  spirit?: number;
  stamina?: number;
  
  // Secondary Stats  
  attackPower?: number;
  spellPower?: number;
  criticalStrike?: number;
  haste?: number;
  mastery?: number;
  versatility?: number;
  
  // Defensive Stats
  armor?: number;
  dodge?: number;
  parry?: number;
  block?: number;
  blockValue?: number;
  resilience?: number;
  
  // Resistances
  fireResistance?: number;
  frostResistance?: number;
  natureResistance?: number;
  shadowResistance?: number;
  arcaneResistance?: number;
  holyResistance?: number;
  
  // Other Stats
  hit?: number;
  expertise?: number;
  penetration?: number;
  lifesteal?: number;
  speed?: number;
  
  // Resource Stats
  health?: number;
  mana?: number;
  energy?: number;
  rage?: number;
  focus?: number;
  
  // Special Stats
  corruption?: number;
  sanity?: number;
  karma?: number;
  divinity?: number;
  void?: number;
}

export interface IWeaponDamage {
  min: number;
  max: number;
  type: DamageType;
  speed: number;
  dps: number;
}

export interface IItemEffect {
  id: string;
  type: 'use' | 'equip' | 'proc' | 'chance_on_hit' | 'aura';
  name: string;
  description: string;
  cooldown?: number;
  duration?: number;
  stacks?: number;
  procChance?: number;
  internalCooldown?: number;
  spellId?: string;
  scriptId?: string;
  visual?: string;
}

export interface IItemRequirement {
  level?: number;
  class?: CharacterClass[];
  race?: CharacterRace[];
  faction?: string;
  reputation?: {
    factionId: string;
    level: number;
  };
  profession?: {
    professionId: string;
    skill: number;
  };
  achievement?: string;
  quest?: string;
  pvpRank?: number;
  honor?: number;
  arena?: number;
  guild?: {
    level?: number;
    achievement?: string;
  };
  covenant?: string;
  renown?: number;
  currency?: {
    type: string;
    amount: number;
  }[];
}

export interface ISocket {
  id: string;
  type: 'red' | 'blue' | 'yellow' | 'meta' | 'prismatic' | 'domination' | 'primordial';
  gem?: IItem;
  bonus?: IItemStats;
}

export interface IEnchantment {
  id: string;
  name: string;
  description: string;
  stats?: IItemStats;
  effect?: IItemEffect;
  visual?: string;
  temporary?: boolean;
  duration?: number;
}

export interface ITransmog {
  itemId: string;
  appearanceId: string;
  unlocked: boolean;
  source: string;
}

export interface ISetBonus {
  pieces: number;
  bonus: {
    stats?: IItemStats;
    effects?: IItemEffect[];
    description: string;
  };
}

export interface IItemSet {
  id: string;
  name: string;
  items: string[];
  bonuses: ISetBonus[];
}

export interface IUpgrade {
  level: number;
  cost: {
    currency: string;
    amount: number;
  }[];
  materials?: {
    itemId: string;
    amount: number;
  }[];
  stats: IItemStats;
  effects?: IItemEffect[];
}

export interface ICorruption {
  id: string;
  name: string;
  level: number;
  cost: number;
  effect: IItemEffect;
  negative?: IItemEffect;
}

export interface IRuneforge {
  id: string;
  name: string;
  power: IItemEffect;
  restriction?: EquipmentSlot[];
}

export interface ISoulbind {
  id: string;
  conduits: {
    slotId: string;
    conduitId?: string;
    level?: number;
  }[];
  path: string[];
  traits: string[];
}

export interface ILegendaryPower {
  id: string;
  name: string;
  description: string;
  effect: IItemEffect;
  slots: EquipmentSlot[];
  class: CharacterClass;
  spec?: string;
}

export interface IArtifactTrait {
  id: string;
  name: string;
  rank: number;
  maxRank: number;
  description: string;
  cost: number;
  prerequisite?: string[];
}

export interface IArtifact {
  power: number;
  traits: IArtifactTrait[];
  relics: {
    slot: string;
    relic?: IItem;
  }[];
  appearance: {
    unlocked: string[];
    selected: string;
  };
}

export interface IItem {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  type: ItemType;
  subType?: string;
  rarity: ItemRarity;
  itemLevel: number;
  requiredLevel?: number;
  icon: string;
  model?: string;
  
  // Equipment specific
  slot?: EquipmentSlot;
  weaponType?: WeaponType;
  armorType?: ArmorType;
  weaponDamage?: IWeaponDamage;
  
  // Stats and Effects
  stats?: IItemStats;
  effects?: IItemEffect[];
  
  // Requirements
  requirements?: IItemRequirement;
  
  // Binding
  bindType?: 'none' | 'pickup' | 'equip' | 'use' | 'account' | 'guild';
  soulbound?: boolean;
  
  // Durability
  durability?: number;
  maxDurability?: number;
  
  // Stack
  stackable?: boolean;
  maxStack?: number;
  unique?: boolean;
  uniqueEquipped?: number;
  
  // Value
  sellPrice?: {
    gold: number;
    silver: number;
    copper: number;
  };
  buyPrice?: {
    gold: number;
    silver: number;
    copper: number;
  };
  
  // Enhancement
  sockets?: ISocket[];
  socketBonus?: IItemStats;
  enchantment?: IEnchantment;
  temporaryEnchantment?: IEnchantment;
  gems?: IItem[];
  
  // Set
  setId?: string;
  setPieces?: string[];
  
  // Upgrade
  upgradeable?: boolean;
  upgradeLevel?: number;
  maxUpgradeLevel?: number;
  upgrades?: IUpgrade[];
  
  // Special Features
  corruption?: ICorruption;
  runeforge?: IRuneforge;
  soulbind?: ISoulbind;
  legendary?: ILegendaryPower;
  artifact?: IArtifact;
  
  // Crafting
  quality?: CraftingQuality;
  crafted?: boolean;
  crafter?: string;
  recipe?: string;
  materials?: {
    itemId: string;
    amount: number;
  }[];
  
  // Cosmetic
  transmogId?: string;
  dyeable?: boolean;
  dyes?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  
  // Consumable specific
  charges?: number;
  consumable?: {
    type: string;
    instant?: boolean;
    castTime?: number;
    cooldown?: number;
    sharedCooldown?: string;
    effect: IItemEffect;
  };
  
  // Container specific
  container?: {
    slots: number;
    specialization?: ItemType;
  };
  
  // Quest specific
  questItem?: boolean;
  questId?: string;
  
  // Currency specific
  currencyId?: string;
  currencyCategory?: string;
  
  // Mount/Pet specific
  spell?: string;
  creature?: string;
  
  // Toy specific
  toy?: {
    effect: string;
    cooldown: number;
    duration?: number;
  };
  
  // Book/Recipe specific
  teaches?: {
    type: string;
    id: string;
    profession?: string;
    requiredSkill?: number;
  };
  
  // Key specific
  opens?: string[];
  keyring?: boolean;
  
  // Token specific
  redeems?: {
    type: string;
    id: string;
    amount?: number;
  };
  
  // Source
  source?: {
    type: string;
    id: string;
    dropChance?: number;
  }[];
  
  // Trading
  tradeable?: boolean;
  auctionable?: boolean;
  mailable?: boolean;
  
  // Misc
  startQuest?: string;
  classRestriction?: CharacterClass[];
  raceRestriction?: CharacterRace[];
  professionRestriction?: string[];
  factionRestriction?: string;
  seasonRestriction?: string;
  eventRestriction?: string;
  expirationDate?: Date;
  deprecated?: boolean;
  hidden?: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
  
  // Custom properties
  custom?: {
    [key: string]: any;
  };
}

export interface IInventorySlot {
  slotId: number;
  item?: IItem;
  quantity?: number;
  locked?: boolean;
}

export interface IInventory {
  slots: IInventorySlot[];
  bags: {
    slotId: number;
    bag?: IItem;
    slots: IInventorySlot[];
  }[];
  maxSlots: number;
  usedSlots: number;
  gold: number;
  silver: number;
  copper: number;
}

export interface ILoot {
  id: string;
  source: {
    type: string;
    id: string;
    name: string;
  };
  items: {
    item: IItem;
    quantity: number;
    roll?: number;
    winner?: string;
  }[];
  gold?: number;
  experience?: number;
  reputation?: {
    factionId: string;
    amount: number;
  }[];
  currency?: {
    type: string;
    amount: number;
  }[];
  timestamp: Date;
  participants: string[];
  lootMethod: string;
  threshold?: ItemRarity;
}

export interface ILootTable {
  id: string;
  name: string;
  items: {
    itemId: string;
    weight: number;
    minQuantity: number;
    maxQuantity: number;
    condition?: any;
  }[];
  gold?: {
    min: number;
    max: number;
  };
  always?: string[];
  groupLoot?: {
    chance: number;
    items: string[];
  }[];
}

export interface IItemFilter {
  name?: string;
  type?: ItemType[];
  rarity?: ItemRarity[];
  minLevel?: number;
  maxLevel?: number;
  minItemLevel?: number;
  maxItemLevel?: number;
  slot?: EquipmentSlot[];
  stats?: string[];
  effects?: string[];
  set?: string;
  source?: string;
  tradeable?: boolean;
  usable?: boolean;
  affordable?: boolean;
}
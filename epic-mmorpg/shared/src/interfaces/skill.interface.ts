import { 
  SkillType, 
  TargetType, 
  DamageType,
  CharacterClass,
  BuffType
} from '../enums/index.js';

export interface IResource {
  type: 'mana' | 'energy' | 'rage' | 'focus' | 'runic_power' | 'chi' | 'holy_power' | 'soul_shards' | 'astral_power' | 'fury' | 'pain' | 'insanity' | 'maelstrom' | 'combo_points' | 'arcane_charges' | 'void_form' | 'essence' | 'custom';
  amount: number;
  percentage?: boolean;
}

export interface ISkillDamage {
  base: {
    min: number;
    max: number;
  };
  scaling: {
    stat: string;
    coefficient: number;
  }[];
  type: DamageType;
  canCrit: boolean;
  ignoreArmor?: boolean;
  ignoreResistance?: boolean;
}

export interface ISkillHeal {
  base: {
    min: number;
    max: number;
  };
  scaling: {
    stat: string;
    coefficient: number;
  }[];
  canCrit: boolean;
  smartHeal?: boolean;
  overheal?: boolean;
}

export interface ISkillEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon' | 'teleport' | 'transform' | 'control' | 'dispel' | 'shield' | 'taunt' | 'threat' | 'resource' | 'custom';
  target: TargetType;
  damage?: ISkillDamage;
  heal?: ISkillHeal;
  buff?: {
    type: BuffType;
    duration: number;
    stacks?: number;
    stats?: any;
    effect?: any;
  };
  summon?: {
    creatureId: string;
    duration?: number;
    max?: number;
    inherit?: string[];
  };
  teleport?: {
    type: 'target' | 'location' | 'random' | 'behind' | 'forward';
    range?: number;
  };
  control?: {
    type: 'stun' | 'root' | 'slow' | 'fear' | 'charm' | 'sleep' | 'silence' | 'disarm' | 'pacify' | 'banish';
    duration: number;
    breakOnDamage?: boolean;
    diminishingReturns?: boolean;
  };
  dispel?: {
    type: 'magic' | 'curse' | 'disease' | 'poison' | 'all';
    count: number;
    friendly?: boolean;
    hostile?: boolean;
  };
  resource?: {
    type: string;
    amount: number;
    target: 'self' | 'target' | 'party' | 'raid';
    restore?: boolean;
    drain?: boolean;
  };
  script?: string;
  visual?: string;
  sound?: string;
}

export interface ISkillRequirement {
  level?: number;
  class?: CharacterClass;
  spec?: string;
  talent?: string;
  spell?: string;
  item?: string;
  buff?: string;
  stance?: string;
  form?: string;
  pet?: boolean;
  mounted?: boolean;
  combat?: boolean;
  stealth?: boolean;
  resource?: IResource;
  combo?: number;
  charges?: number;
  aura?: string;
  target?: {
    type?: string[];
    hostile?: boolean;
    friendly?: boolean;
    self?: boolean;
    alive?: boolean;
    dead?: boolean;
    player?: boolean;
    npc?: boolean;
  };
}

export interface ISkillModifier {
  id: string;
  source: 'talent' | 'glyph' | 'passive' | 'set_bonus' | 'legendary' | 'conduit' | 'soulbind' | 'covenant' | 'buff' | 'item';
  sourceId: string;
  modifications: {
    damage?: number;
    healing?: number;
    cost?: number;
    cooldown?: number;
    castTime?: number;
    range?: number;
    duration?: number;
    charges?: number;
    effect?: any;
  };
  condition?: any;
}

export interface IComboPoint {
  current: number;
  max: number;
  generators: string[];
  spenders: string[];
  decay?: number;
}

export interface ISkillUpgrade {
  rank: number;
  level: number;
  improvements: {
    damage?: number;
    healing?: number;
    duration?: number;
    cooldown?: number;
    cost?: number;
    range?: number;
    effect?: any;
  };
  cost?: {
    gold?: number;
    points?: number;
    currency?: {
      type: string;
      amount: number;
    };
  };
}

export interface ISkillCombo {
  id: string;
  name: string;
  skills: string[];
  window: number;
  effect: ISkillEffect;
  cooldown?: number;
}

export interface ISkillTree {
  id: string;
  name: string;
  class: CharacterClass;
  spec?: string;
  nodes: ISkillTreeNode[];
  connections: {
    from: string;
    to: string;
    requirement?: number;
  }[];
  points: number;
  maxPoints: number;
}

export interface ISkillTreeNode {
  id: string;
  skillId: string;
  position: {
    x: number;
    y: number;
  };
  tier: number;
  maxRank: number;
  currentRank: number;
  cost: number;
  requirements?: {
    points?: number;
    skills?: {
      skillId: string;
      rank: number;
    }[];
  };
}

export interface ISkillRotation {
  id: string;
  name: string;
  class: CharacterClass;
  spec: string;
  priority: {
    skillId: string;
    condition?: any;
    weight: number;
  }[];
  opener?: string[];
  burst?: string[];
  aoe?: string[];
  defensive?: string[];
}

export interface ISkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: SkillType;
  school: DamageType;
  
  // Targeting
  targetType: TargetType;
  range: number;
  radius?: number;
  maxTargets?: number;
  
  // Cost
  cost?: IResource;
  secondaryCost?: IResource;
  
  // Casting
  instant: boolean;
  castTime?: number;
  channeled?: boolean;
  channelTicks?: number;
  interruptible?: boolean;
  castWhileMoving?: boolean;
  
  // Cooldown
  cooldown?: number;
  charges?: number;
  chargeRecovery?: number;
  globalCooldown?: boolean;
  sharedCooldown?: string;
  
  // Requirements
  requirements?: ISkillRequirement;
  
  // Effects
  effects: ISkillEffect[];
  
  // Modifiers
  modifiers?: ISkillModifier[];
  
  // Combos
  combos?: string[];
  comboPoints?: IComboPoint;
  
  // Procs
  proc?: {
    chance: number;
    ppm?: number;
    internal_cooldown?: number;
    effect: ISkillEffect;
  };
  
  // Travel
  projectile?: {
    speed: number;
    arc?: boolean;
    pierce?: boolean;
    bounce?: number;
    return?: boolean;
    homing?: boolean;
    split?: {
      count: number;
      angle: number;
    };
  };
  
  // Animation
  animation?: {
    cast?: string;
    projectile?: string;
    impact?: string;
    channel?: string;
  };
  
  // Sound
  sounds?: {
    cast?: string;
    impact?: string;
    travel?: string;
  };
  
  // Visual Effects
  visuals?: {
    cast?: string;
    projectile?: string;
    impact?: string;
    aura?: string;
    trail?: string;
  };
  
  // Threat
  threat?: {
    base: number;
    modifier: number;
  };
  
  // PvP
  pvp?: {
    damageModifier?: number;
    healingModifier?: number;
    durationModifier?: number;
    diminishingReturns?: string;
  };
  
  // Scaling
  scaling?: {
    level: boolean;
    gear: boolean;
    spec: boolean;
  };
  
  // Upgrades
  upgradeable?: boolean;
  upgrades?: ISkillUpgrade[];
  currentRank?: number;
  maxRank?: number;
  
  // Learn
  learned: boolean;
  learnLevel?: number;
  trainer?: string;
  quest?: string;
  item?: string;
  achievement?: string;
  
  // Category
  category: string;
  subcategory?: string;
  tags: string[];
  
  // AI
  aiPriority?: number;
  aiConditions?: any;
  aiCooldown?: number;
  
  // Tooltips
  tooltipValues?: {
    [key: string]: number | string;
  };
  
  // Flags
  flags: {
    usableWhileDead?: boolean;
    usableWhileMounted?: boolean;
    usableWhileStunned?: boolean;
    usableWhileSilenced?: boolean;
    usableInShapeshift?: boolean;
    autoAttack?: boolean;
    onNextSwing?: boolean;
    requiresStealth?: boolean;
    breaksStealh?: boolean;
    generatesCombo?: boolean;
    consumesCombo?: boolean;
    aoe?: boolean;
    dot?: boolean;
    hot?: boolean;
    channel?: boolean;
    toggle?: boolean;
    passive?: boolean;
    hidden?: boolean;
    pvpTalent?: boolean;
    racial?: boolean;
    trinket?: boolean;
    consumable?: boolean;
  };
  
  // Metadata
  version: number;
  patch: string;
  disabled?: boolean;
  experimental?: boolean;
}

export interface ISkillBar {
  id: string;
  characterId: string;
  slots: {
    position: number;
    skillId?: string;
    type: 'skill' | 'item' | 'macro' | 'mount' | 'companion';
    keybind?: string;
  }[];
  locked: boolean;
  hidden: boolean;
}

export interface IMacro {
  id: string;
  name: string;
  icon: string;
  commands: string[];
  conditional?: boolean;
  showTooltip?: boolean;
  perCharacter?: boolean;
}

export interface ISkillSet {
  id: string;
  name: string;
  class: CharacterClass;
  spec: string;
  skills: string[];
  passives: string[];
  pvpTalents?: string[];
  description: string;
  playstyle: string;
  strengths: string[];
  weaknesses: string[];
}
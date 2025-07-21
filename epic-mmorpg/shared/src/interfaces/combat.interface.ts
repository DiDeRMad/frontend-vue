import { 
  DamageType, 
  BuffType, 
  TargetType,
  CharacterClass
} from '../enums/index.js';
import { ISkill, ISkillEffect } from './skill.interface.js';
import { ICharacter } from './character.interface.js';

export interface IDamageInfo {
  amount: number;
  type: DamageType;
  source: {
    type: 'player' | 'npc' | 'environment' | 'dot' | 'reflect';
    id: string;
    name: string;
    skill?: string;
  };
  target: {
    type: 'player' | 'npc' | 'object';
    id: string;
    name: string;
  };
  
  // Modifiers
  critical: boolean;
  criticalMultiplier?: number;
  blocked: boolean;
  blockAmount?: number;
  absorbed: boolean;
  absorbAmount?: number;
  resisted: boolean;
  resistAmount?: number;
  dodged: boolean;
  parried: boolean;
  missed: boolean;
  glancing: boolean;
  crushing: boolean;
  
  // Damage breakdown
  baseDamage: number;
  bonusDamage: number;
  mitigation: {
    armor: number;
    resistance: number;
    block: number;
    absorb: number;
    other: number;
  };
  
  overkill?: number;
  
  timestamp: Date;
}

export interface IHealInfo {
  amount: number;
  source: {
    type: 'player' | 'npc' | 'hot' | 'consumable';
    id: string;
    name: string;
    skill?: string;
  };
  target: {
    type: 'player' | 'npc';
    id: string;
    name: string;
  };
  
  critical: boolean;
  criticalMultiplier?: number;
  absorbed: boolean;
  absorbAmount?: number;
  
  effective: number;
  overheal: number;
  
  timestamp: Date;
}

export interface IBuff {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: BuffType;
  
  source: {
    type: 'player' | 'npc' | 'item' | 'environment';
    id: string;
    name: string;
  };
  
  target: string;
  
  duration: number;
  remaining: number;
  permanent?: boolean;
  
  stacks: number;
  maxStacks: number;
  
  effects: ISkillEffect[];
  
  stats?: {
    [key: string]: number;
  };
  
  dispelType?: 'magic' | 'curse' | 'poison' | 'disease' | 'none';
  hidden?: boolean;
  
  appliedAt: Date;
  expiresAt?: Date;
  
  tooltip?: {
    dynamicValues: { [key: string]: any };
  };
}

export interface IThreat {
  targetId: string;
  amount: number;
  percentage: number;
  isTanking: boolean;
  distance: number;
}

export interface ICombatStats {
  damage: {
    done: {
      total: number;
      byType: Map<DamageType, number>;
      bySkill: Map<string, number>;
      byTarget: Map<string, number>;
      dps: number;
      burst: number;
    };
    taken: {
      total: number;
      byType: Map<DamageType, number>;
      bySource: Map<string, number>;
      dtps: number;
      spike: number;
    };
  };
  
  healing: {
    done: {
      total: number;
      effective: number;
      overheal: number;
      bySkill: Map<string, number>;
      byTarget: Map<string, number>;
      hps: number;
    };
    received: {
      total: number;
      bySource: Map<string, number>;
      hrps: number;
    };
  };
  
  mitigation: {
    dodged: number;
    parried: number;
    blocked: number;
    absorbed: number;
    resisted: number;
    missed: number;
  };
  
  resources: {
    gained: Map<string, number>;
    spent: Map<string, number>;
    wasted: Map<string, number>;
  };
  
  interrupts: number;
  dispels: number;
  crowdControl: {
    applied: number;
    broken: number;
    duration: number;
  };
  
  deaths: number;
  kills: number;
  assists: number;
}

export interface ICombatLog {
  entries: ICombatLogEntry[];
  startTime: Date;
  endTime?: Date;
  participants: {
    id: string;
    name: string;
    type: 'player' | 'npc' | 'pet';
    class?: CharacterClass;
    level?: number;
  }[];
  
  summary: {
    duration: number;
    totalDamage: number;
    totalHealing: number;
    deaths: string[];
    kills: Map<string, string[]>;
  };
}

export interface ICombatLogEntry {
  timestamp: Date;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'death' | 'resurrect' | 'summon' | 'cast' | 'interrupt' | 'dispel' | 'extra';
  
  source?: {
    id: string;
    name: string;
    type: string;
  };
  
  target?: {
    id: string;
    name: string;
    type: string;
  };
  
  skill?: {
    id: string;
    name: string;
    icon: string;
  };
  
  damage?: IDamageInfo;
  heal?: IHealInfo;
  buff?: IBuff;
  
  extra?: {
    type: string;
    data: any;
  };
}

export interface ICombatState {
  inCombat: boolean;
  combatStartTime?: Date;
  
  targets: string[];
  targetedBy: string[];
  
  threat: IThreat[];
  
  casting?: {
    skill: ISkill;
    startTime: Date;
    endTime: Date;
    progress: number;
    interruptible: boolean;
  };
  
  channeling?: {
    skill: ISkill;
    startTime: Date;
    endTime: Date;
    ticks: number;
    nextTick: Date;
  };
  
  globalCooldown?: {
    duration: number;
    endTime: Date;
  };
  
  autoAttack?: {
    enabled: boolean;
    nextSwing: Date;
    speed: number;
  };
  
  comboPoints?: {
    current: number;
    max: number;
  };
  
  lastAction?: {
    type: string;
    skill?: string;
    target?: string;
    timestamp: Date;
  };
}

export interface IDamageCalculation {
  baseDamage: number;
  
  // Attacker modifiers
  attackPower?: number;
  spellPower?: number;
  versatility?: number;
  mastery?: number;
  
  // Critical
  critChance: number;
  critDamage: number;
  
  // Target defenses
  armor: number;
  resistance: number;
  blockChance: number;
  blockValue: number;
  dodgeChance: number;
  parryChance: number;
  missChance: number;
  
  // Damage reduction
  damageReduction: number;
  
  // Final calculation
  calculate(): IDamageResult;
}

export interface IDamageResult {
  damage: number;
  type: DamageType;
  critical: boolean;
  blocked: boolean;
  dodged: boolean;
  parried: boolean;
  missed: boolean;
  absorbed: number;
  resisted: number;
  mitigated: number;
}

export interface ICombatFormula {
  // Melee
  meleeAttackPower(strength: number, agility: number, level: number): number;
  meleeCritChance(agility: number, critRating: number, level: number): number;
  meleeHitChance(hitRating: number, targetLevel: number, attackerLevel: number): number;
  
  // Spell
  spellPower(intellect: number, level: number): number;
  spellCritChance(intellect: number, critRating: number, level: number): number;
  spellHitChance(hitRating: number, targetLevel: number, attackerLevel: number): number;
  
  // Defense
  armor(armorValue: number, attackerLevel: number): number;
  dodge(agility: number, dodgeRating: number, level: number): number;
  parry(parryRating: number, level: number): number;
  block(blockRating: number, level: number): number;
  
  // Resistance
  resistance(resistanceValue: number, attackerLevel: number, school: DamageType): number;
  
  // Level scaling
  levelDifferencePenalty(attackerLevel: number, defenderLevel: number): number;
  glancingBlowChance(attackerLevel: number, defenderLevel: number): number;
  crushingBlowChance(attackerLevel: number, defenderLevel: number): number;
}

export interface ICombatEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
  
  process(combat: ICombatEngine): void;
}

export interface ICombatEngine {
  participants: Map<string, ICombatParticipant>;
  
  events: ICombatEvent[];
  log: ICombatLog;
  
  formulas: ICombatFormula;
  
  // Core methods
  addParticipant(participant: ICombatParticipant): void;
  removeParticipant(id: string): void;
  
  dealDamage(source: string, target: string, damage: IDamageInfo): void;
  heal(source: string, target: string, heal: IHealInfo): void;
  
  applyBuff(source: string, target: string, buff: IBuff): void;
  removeBuff(target: string, buffId: string): void;
  
  cast(caster: string, skill: ISkill, targets: string[]): void;
  interrupt(interrupter: string, target: string): boolean;
  
  updateThreat(source: string, target: string, amount: number): void;
  
  tick(deltaTime: number): void;
}

export interface ICombatParticipant {
  id: string;
  type: 'player' | 'npc' | 'pet' | 'object';
  
  stats: any;
  buffs: IBuff[];
  debuffs: IBuff[];
  
  combatState: ICombatState;
  combatStats: ICombatStats;
  
  position: { x: number; y: number; z: number };
  facing: number;
  
  isAlive(): boolean;
  canAttack(target: ICombatParticipant): boolean;
  isInRange(target: ICombatParticipant, range: number): boolean;
  isFacing(target: ICombatParticipant, angle: number): boolean;
}

export interface ICombatGroup {
  id: string;
  members: string[];
  type: 'party' | 'raid' | 'battleground' | 'arena';
  
  roles: Map<string, 'tank' | 'healer' | 'dps'>;
  leader: string;
  
  lootMethod: string;
  lootThreshold: string;
  masterLooter?: string;
  
  markers: Map<string, number>;
  readyCheck?: {
    initiator: string;
    startTime: Date;
    responses: Map<string, boolean>;
  };
  
  combatStats: {
    pulls: number;
    wipes: number;
    bosseKilled: string[];
    startTime: Date;
  };
}
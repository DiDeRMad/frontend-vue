import { BaseSystem } from './BaseSystem';
import { prisma } from '../../config/database.config';
import { CacheManager, CacheKeys } from '../../config/redis.config';
import { gameLogger } from '../../utils/logger';
import type {
  ICharacter,
  IDamageInfo,
  IHealInfo,
  ICombatStats,
  DamageType,
  CharacterClass,
  CombatEventType,
  BuffType,
  DebuffType,
  Vector3
} from '@epic-mmorpg/shared';
import { 
  calculateDistance,
  clamp,
  randomFloat,
  randomInt
} from '@epic-mmorpg/shared';

interface ActiveCombat {
  participants: Set<string>;
  startTime: number;
  lastActionTime: number;
}

interface CombatAction {
  attackerId: string;
  targetId: string;
  skillId: string;
  timestamp: number;
}

export class CombatSystem extends BaseSystem {
  private activeCombats: Map<string, ActiveCombat> = new Map();
  private combatQueue: CombatAction[] = [];
  private threatTables: Map<string, Map<string, number>> = new Map(); // targetId -> Map<attackerId, threat>

  constructor() {
    super('CombatSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Combat system initializing...');
    
    // Subscribe to combat events
    this.world.on('combatAction', this.handleCombatAction.bind(this));
    this.world.on('characterDeath', this.handleCharacterDeath.bind(this));
    
    this.log('Combat system initialized');
  }

  protected async onShutdown(): Promise<void> {
    this.activeCombats.clear();
    this.combatQueue = [];
    this.threatTables.clear();
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    // Process combat queue
    await this.processCombatQueue();
    
    // Update active combats
    this.updateActiveCombats(deltaTime);
    
    // Update DoT/HoT effects
    await this.updatePeriodicEffects(deltaTime);
  }

  // Combat Actions
  async performAttack(
    attackerId: string, 
    targetId: string, 
    skillId: string
  ): Promise<IDamageInfo | null> {
    try {
      // Get attacker and target data
      const [attacker, target] = await Promise.all([
        this.getCharacterCombatData(attackerId),
        this.getCharacterCombatData(targetId)
      ]);

      if (!attacker || !target) {
        this.logWarn('Attack failed: Character not found', { attackerId, targetId });
        return null;
      }

      // Check if target is valid
      if (!this.isValidTarget(attacker, target)) {
        return null;
      }

      // Get skill data
      const skill = await this.getSkillData(skillId);
      if (!skill) {
        this.logWarn('Attack failed: Skill not found', { skillId });
        return null;
      }

      // Check range
      const distance = calculateDistance(attacker.position, target.position);
      if (distance > skill.range) {
        this.emit('combatError', {
          type: 'out_of_range',
          attackerId,
          targetId,
          skillId
        });
        return null;
      }

      // Check if skill is on cooldown
      if (await this.isSkillOnCooldown(attackerId, skillId)) {
        this.emit('combatError', {
          type: 'on_cooldown',
          attackerId,
          skillId
        });
        return null;
      }

      // Calculate hit chance
      const hitChance = this.calculateHitChance(attacker.stats, target.stats);
      const hitRoll = randomFloat(0, 100);

      if (hitRoll > hitChance) {
        // Miss
        this.emit('combatEvent', {
          type: CombatEventType.MISS,
          attackerId,
          targetId,
          skillId
        });
        return null;
      }

      // Calculate damage
      const damageInfo = this.calculateDamage(
        attacker,
        target,
        skill,
        hitRoll <= attacker.stats.critChance
      );

      // Apply damage
      await this.applyDamage(targetId, damageInfo);

      // Update threat
      this.updateThreat(targetId, attackerId, damageInfo.total);

      // Set skill cooldown
      await this.setSkillCooldown(attackerId, skillId, skill.cooldown);

      // Add to combat
      this.addToCombat(attackerId, targetId);

      // Emit combat event
      this.emit('combatEvent', {
        type: damageInfo.isCritical ? CombatEventType.CRITICAL_HIT : CombatEventType.HIT,
        attackerId,
        targetId,
        skillId,
        damage: damageInfo
      });

      // Log combat action
      gameLogger.combat('Attack performed', {
        attackerId,
        targetId,
        skillId,
        damage: damageInfo.total,
        isCritical: damageInfo.isCritical
      });

      return damageInfo;
    } catch (error) {
      this.logError('Error performing attack', error);
      return null;
    }
  }

  async performHeal(
    healerId: string,
    targetId: string,
    skillId: string
  ): Promise<IHealInfo | null> {
    try {
      // Get healer and target data
      const [healer, target] = await Promise.all([
        this.getCharacterCombatData(healerId),
        this.getCharacterCombatData(targetId)
      ]);

      if (!healer || !target) {
        return null;
      }

      // Get skill data
      const skill = await this.getSkillData(skillId);
      if (!skill || skill.type !== 'heal') {
        return null;
      }

      // Check range
      const distance = calculateDistance(healer.position, target.position);
      if (distance > skill.range) {
        return null;
      }

      // Calculate heal amount
      const baseHeal = skill.baseValue + (healer.stats.spellPower * skill.spellPowerCoeff);
      const critRoll = randomFloat(0, 100);
      const isCritical = critRoll <= healer.stats.critChance;
      const healAmount = isCritical ? baseHeal * 1.5 : baseHeal;

      const healInfo: IHealInfo = {
        amount: Math.floor(healAmount),
        isCritical,
        healerId,
        targetId,
        skillId,
        timestamp: Date.now()
      };

      // Apply heal
      await this.applyHeal(targetId, healInfo);

      // Generate threat (healers generate reduced threat)
      this.updateThreat(targetId, healerId, healInfo.amount * 0.5);

      // Emit heal event
      this.emit('combatEvent', {
        type: CombatEventType.HEAL,
        healerId,
        targetId,
        skillId,
        heal: healInfo
      });

      return healInfo;
    } catch (error) {
      this.logError('Error performing heal', error);
      return null;
    }
  }

  // Damage Calculation
  private calculateDamage(
    attacker: any,
    target: any,
    skill: any,
    isCritical: boolean
  ): IDamageInfo {
    const stats = attacker.stats;
    const targetStats = target.stats;

    // Base damage calculation
    let baseDamage = skill.baseDamage || 0;
    
    // Add weapon damage for physical skills
    if (skill.damageType === DamageType.PHYSICAL) {
      baseDamage += stats.attackPower * skill.attackPowerCoeff;
    } else {
      baseDamage += stats.spellPower * skill.spellPowerCoeff;
    }

    // Apply damage modifiers
    let damage = baseDamage;

    // Critical strike
    if (isCritical) {
      damage *= this.getCriticalDamageMultiplier(attacker.class);
    }

    // Apply armor/resistance reduction
    const mitigation = this.calculateMitigation(skill.damageType, targetStats);
    damage *= (1 - mitigation);

    // Random variance (±5%)
    damage *= randomFloat(0.95, 1.05);

    // Apply damage reduction from defensive stats
    if (targetStats.damageReduction) {
      damage *= (1 - targetStats.damageReduction / 100);
    }

    const damageInfo: IDamageInfo = {
      total: Math.floor(damage),
      base: Math.floor(baseDamage),
      mitigated: Math.floor(baseDamage - damage),
      type: skill.damageType,
      isCritical,
      isBlocked: false,
      isDodged: false,
      isParried: false,
      overkill: 0,
      timestamp: Date.now()
    };

    return damageInfo;
  }

  private calculateHitChance(attackerStats: any, targetStats: any): number {
    const baseHitChance = 95; // 95% base hit chance
    const hitBonus = attackerStats.hitChance || 0;
    const dodgeChance = targetStats.dodge || 0;
    const parryChance = targetStats.parry || 0;

    return clamp(baseHitChance + hitBonus - dodgeChance - parryChance, 5, 100);
  }

  private calculateMitigation(damageType: DamageType, targetStats: any): number {
    let mitigation = 0;

    switch (damageType) {
      case DamageType.PHYSICAL:
        mitigation = this.calculateArmorMitigation(targetStats.armor);
        break;
      case DamageType.FIRE:
        mitigation = (targetStats.resistances?.fire || 0) / 100;
        break;
      case DamageType.FROST:
        mitigation = (targetStats.resistances?.frost || 0) / 100;
        break;
      case DamageType.NATURE:
        mitigation = (targetStats.resistances?.nature || 0) / 100;
        break;
      case DamageType.SHADOW:
        mitigation = (targetStats.resistances?.shadow || 0) / 100;
        break;
      case DamageType.ARCANE:
        mitigation = (targetStats.resistances?.arcane || 0) / 100;
        break;
      case DamageType.HOLY:
        mitigation = (targetStats.resistances?.holy || 0) / 100;
        break;
    }

    return clamp(mitigation, 0, 0.75); // Max 75% mitigation
  }

  private calculateArmorMitigation(armor: number): number {
    // Simplified armor formula
    const armorConstant = 400; // This would scale with attacker level
    return armor / (armor + armorConstant);
  }

  private getCriticalDamageMultiplier(characterClass: CharacterClass): number {
    // Different classes have different crit multipliers
    switch (characterClass) {
      case CharacterClass.ROGUE:
      case CharacterClass.HUNTER:
        return 2.0;
      case CharacterClass.WARRIOR:
      case CharacterClass.DEATH_KNIGHT:
        return 1.8;
      case CharacterClass.MAGE:
      case CharacterClass.WARLOCK:
        return 1.7;
      default:
        return 1.5;
    }
  }

  // Damage/Heal Application
  private async applyDamage(characterId: string, damage: IDamageInfo): Promise<void> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true, health: true, maxHealth: true }
    });

    if (!character) return;

    const newHealth = Math.max(0, character.health - damage.total);
    const isDead = newHealth === 0;

    // Calculate overkill
    if (isDead) {
      damage.overkill = damage.total - character.health;
    }

    // Update character health
    await prisma.character.update({
      where: { id: characterId },
      data: {
        health: newHealth,
        isDead
      }
    });

    // Update cache
    await CacheManager.hset(
      CacheKeys.character(characterId),
      'health',
      newHealth.toString()
    );

    if (isDead) {
      this.world.emit('characterDeath', { characterId, damage });
    }
  }

  private async applyHeal(characterId: string, heal: IHealInfo): Promise<void> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true, health: true, maxHealth: true }
    });

    if (!character) return;

    const newHealth = Math.min(character.maxHealth, character.health + heal.amount);
    const actualHeal = newHealth - character.health;

    // Update heal info with actual amount
    heal.amount = actualHeal;

    // Update character health
    await prisma.character.update({
      where: { id: characterId },
      data: { health: newHealth }
    });

    // Update cache
    await CacheManager.hset(
      CacheKeys.character(characterId),
      'health',
      newHealth.toString()
    );
  }

  // Threat Management
  private updateThreat(targetId: string, attackerId: string, amount: number): void {
    if (!this.threatTables.has(targetId)) {
      this.threatTables.set(targetId, new Map());
    }

    const threatTable = this.threatTables.get(targetId)!;
    const currentThreat = threatTable.get(attackerId) || 0;
    threatTable.set(attackerId, currentThreat + amount);

    // Emit threat update event
    this.emit('threatUpdate', {
      targetId,
      attackerId,
      threat: currentThreat + amount,
      threatTable: Array.from(threatTable.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id, threat]) => ({ characterId: id, threat }))
    });
  }

  getHighestThreatTarget(characterId: string): string | null {
    const threatTable = this.threatTables.get(characterId);
    if (!threatTable || threatTable.size === 0) {
      return null;
    }

    let highestThreat = 0;
    let highestThreatTarget: string | null = null;

    for (const [targetId, threat] of threatTable) {
      if (threat > highestThreat) {
        highestThreat = threat;
        highestThreatTarget = targetId;
      }
    }

    return highestThreatTarget;
  }

  clearThreat(characterId: string): void {
    this.threatTables.delete(characterId);
    
    // Also remove from other threat tables
    for (const [_, threatTable] of this.threatTables) {
      threatTable.delete(characterId);
    }
  }

  // Combat State Management
  private addToCombat(attackerId: string, targetId: string): void {
    const combatId = this.getCombatId(attackerId, targetId);
    
    if (!this.activeCombats.has(combatId)) {
      this.activeCombats.set(combatId, {
        participants: new Set([attackerId, targetId]),
        startTime: Date.now(),
        lastActionTime: Date.now()
      });
      
      this.emit('combatStart', { attackerId, targetId });
    } else {
      const combat = this.activeCombats.get(combatId)!;
      combat.participants.add(attackerId);
      combat.participants.add(targetId);
      combat.lastActionTime = Date.now();
    }
  }

  private getCombatId(char1: string, char2: string): string {
    // Create a consistent combat ID regardless of who attacked first
    return [char1, char2].sort().join(':');
  }

  private updateActiveCombats(deltaTime: number): void {
    const now = Date.now();
    const combatTimeout = 5000; // 5 seconds out of combat

    for (const [combatId, combat] of this.activeCombats) {
      if (now - combat.lastActionTime > combatTimeout) {
        // End combat
        this.activeCombats.delete(combatId);
        
        for (const participantId of combat.participants) {
          this.emit('combatEnd', { characterId: participantId });
          
          // Clear threat for NPCs
          // TODO: Check if participant is NPC
        }
      }
    }
  }

  isInCombat(characterId: string): boolean {
    for (const [_, combat] of this.activeCombats) {
      if (combat.participants.has(characterId)) {
        return true;
      }
    }
    return false;
  }

  // Periodic Effects (DoT/HoT)
  private async updatePeriodicEffects(deltaTime: number): Promise<void> {
    // TODO: Implement DoT/HoT tick logic
    // This would process all active buffs/debuffs with periodic effects
  }

  // Helper Methods
  private async getCharacterCombatData(characterId: string): Promise<any> {
    // Try cache first
    const cached = await CacheManager.get(CacheKeys.character(characterId));
    if (cached) {
      return cached;
    }

    // Fetch from database
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        combatStats: true,
        buffs: {
          where: { expiresAt: { gt: new Date() } }
        },
        debuffs: {
          where: { expiresAt: { gt: new Date() } }
        }
      }
    });

    if (character) {
      // Cache for future use
      await CacheManager.set(CacheKeys.character(characterId), character, 300);
    }

    return character;
  }

  private async getSkillData(skillId: string): Promise<any> {
    // TODO: Implement skill data fetching
    // This would fetch skill information from database or cache
    return {
      id: skillId,
      name: 'Basic Attack',
      baseDamage: 100,
      damageType: DamageType.PHYSICAL,
      range: 5,
      cooldown: 1500,
      attackPowerCoeff: 1.0,
      spellPowerCoeff: 0,
      type: 'damage'
    };
  }

  private isValidTarget(attacker: any, target: any): boolean {
    // Check if target is dead
    if (target.isDead) {
      return false;
    }

    // Check faction (simplified)
    // TODO: Implement proper faction/pvp flag checking
    
    return true;
  }

  private async isSkillOnCooldown(characterId: string, skillId: string): Promise<boolean> {
    const cooldownKey = CacheKeys.cooldown(characterId, skillId);
    return await CacheManager.exists(cooldownKey);
  }

  private async setSkillCooldown(characterId: string, skillId: string, duration: number): Promise<void> {
    const cooldownKey = CacheKeys.cooldown(characterId, skillId);
    await CacheManager.set(cooldownKey, true, Math.ceil(duration / 1000));
  }

  // Event Handlers
  private async handleCombatAction(data: CombatAction): Promise<void> {
    this.combatQueue.push(data);
  }

  private async handleCharacterDeath(data: { characterId: string }): Promise<void> {
    // Clear threat
    this.clearThreat(data.characterId);
    
    // Remove from active combats
    for (const [combatId, combat] of this.activeCombats) {
      if (combat.participants.has(data.characterId)) {
        combat.participants.delete(data.characterId);
        if (combat.participants.size < 2) {
          this.activeCombats.delete(combatId);
        }
      }
    }
  }

  private async processCombatQueue(): Promise<void> {
    while (this.combatQueue.length > 0) {
      const action = this.combatQueue.shift()!;
      
      // Process combat action
      await this.performAttack(action.attackerId, action.targetId, action.skillId);
    }
  }
}
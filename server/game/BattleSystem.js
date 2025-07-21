import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { DamageCalculator } from './combat/DamageCalculator.js';
import { EffectManager } from './effects/EffectManager.js';
import { SkillExecutor } from './skills/SkillExecutor.js';
import { AIBattleController } from './ai/AIBattleController.js';
import { BattleLogger } from './logging/BattleLogger.js';
import { RewardCalculator } from './rewards/RewardCalculator.js';

export class BattleSystem extends EventEmitter {
  constructor(gameEngine) {
    super();
    this.gameEngine = gameEngine;
    
    // Battle tracking
    this.activeBattles = new Map();
    this.battleQueues = new Map();
    this.battleHistory = new Map();
    
    // Combat subsystems
    this.damageCalculator = new DamageCalculator();
    this.effectManager = new EffectManager();
    this.skillExecutor = new SkillExecutor();
    this.aiBattleController = new AIBattleController();
    this.battleLogger = new BattleLogger();
    this.rewardCalculator = new RewardCalculator();
    
    // Configuration
    this.config = {
      maxBattleDuration: 300000, // 5 minutes
      turnTimeout: 30000, // 30 seconds per turn
      maxSimultaneousBattles: 1000,
      enablePvP: true,
      enablePvE: true,
      enableGuildWars: true,
      enableWorldBosses: true,
      criticalHitChance: 0.05,
      dodgeChance: 0.1,
      blockChance: 0.15,
      statusEffectResistance: 0.2
    };
    
    // Battle types
    this.battleTypes = {
      DUEL: 'duel',
      GROUP: 'group',
      RAID: 'raid',
      GUILD_WAR: 'guild_war',
      WORLD_BOSS: 'world_boss',
      DUNGEON: 'dungeon',
      ARENA: 'arena',
      TOURNAMENT: 'tournament'
    };
    
    // Combat actions
    this.actionTypes = {
      ATTACK: 'attack',
      SKILL: 'skill',
      SPELL: 'spell',
      ITEM: 'item',
      DEFEND: 'defend',
      FLEE: 'flee',
      WAIT: 'wait'
    };
    
    // Battle phases
    this.battlePhases = {
      PREPARATION: 'preparation',
      ACTIVE: 'active',
      FINISHING: 'finishing',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    };
    
    // Statistics
    this.stats = {
      totalBattles: 0,
      activeBattleCount: 0,
      damageDealt: 0,
      healingDone: 0,
      criticalHits: 0,
      dodges: 0,
      blocks: 0,
      kills: 0,
      deaths: 0
    };
  }

  async initialize() {
    console.log('⚔️ Initializing Battle System...');
    
    // Initialize subsystems
    await this.damageCalculator.initialize();
    await this.effectManager.initialize();
    await this.skillExecutor.initialize();
    await this.aiBattleController.initialize();
    await this.battleLogger.initialize();
    await this.rewardCalculator.initialize();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredBattles();
      this.updateBattleMetrics();
    }, 30000); // Every 30 seconds
    
    console.log('✅ Battle System initialized');
  }

  async handleBattleAction(socket, data) {
    const playerId = socket.playerId;
    const { battleId, action, target, skill, item, position } = data;
    
    try {
      // Validate battle exists
      const battle = this.activeBattles.get(battleId);
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      // Validate player is in battle
      const participant = this.findParticipant(battle, playerId);
      if (!participant) {
        throw new Error('Player not in battle');
      }
      
      // Validate it's player's turn
      if (!this.isPlayerTurn(battle, playerId)) {
        throw new Error('Not your turn');
      }
      
      // Validate action
      if (!this.isValidAction(battle, participant, action)) {
        throw new Error('Invalid action');
      }
      
      // Execute action
      const result = await this.executeAction(battle, participant, {
        type: action,
        target: target,
        skill: skill,
        item: item,
        position: position,
        timestamp: Date.now()
      });
      
      // Update battle state
      await this.updateBattleState(battle, result);
      
      // Check for battle end conditions
      if (this.checkBattleEndConditions(battle)) {
        await this.endBattle(battle);
      } else {
        // Advance to next turn
        this.advanceTurn(battle);
      }
      
      // Emit battle update
      this.emitBattleUpdate(battle);
      
    } catch (error) {
      console.error('Error handling battle action:', error);
      socket.emit('battle:error', { error: error.message });
    }
  }

  async startBattle(initiator, target, battleType = this.battleTypes.DUEL, options = {}) {
    try {
      // Generate battle ID
      const battleId = uuidv4();
      
      // Create battle instance
      const battle = {
        id: battleId,
        type: battleType,
        phase: this.battlePhases.PREPARATION,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        
        // Participants
        participants: new Map(),
        teams: new Map(),
        turnOrder: [],
        currentTurn: 0,
        
        // Battle state
        round: 1,
        actions: [],
        effects: new Map(),
        conditions: new Set(),
        
        // Configuration
        maxRounds: options.maxRounds || 50,
        turnTimeLimit: options.turnTimeLimit || this.config.turnTimeout,
        allowFlee: options.allowFlee !== false,
        allowItems: options.allowItems !== false,
        allowSpectators: options.allowSpectators !== false,
        
        // Environment
        terrain: options.terrain || 'plains',
        weather: options.weather || 'clear',
        timeOfDay: options.timeOfDay || 'day',
        
        // Rewards
        rewards: {
          experience: 0,
          gold: 0,
          items: [],
          reputation: 0
        },
        
        // Metadata
        metadata: options.metadata || {}
      };
      
      // Add participants
      await this.addParticipant(battle, initiator, 'team1');
      await this.addParticipant(battle, target, 'team2');
      
      // Calculate turn order
      this.calculateTurnOrder(battle);
      
      // Apply environmental effects
      this.applyEnvironmentalEffects(battle);
      
      // Store battle
      this.activeBattles.set(battleId, battle);
      this.stats.totalBattles++;
      this.stats.activeBattleCount++;
      
      // Log battle start
      this.battleLogger.logBattleStart(battle);
      
      // Start battle timer
      this.startBattleTimer(battle);
      
      // Notify participants
      this.notifyBattleStart(battle);
      
      // Emit to game engine
      this.gameEngine.emit('battle:started', battle);
      
      console.log(`Battle started: ${battleId} (${battleType})`);
      
      return battle;
      
    } catch (error) {
      console.error('Error starting battle:', error);
      throw error;
    }
  }

  async addParticipant(battle, entity, teamId) {
    const participantId = entity.id;
    
    // Create participant data
    const participant = {
      id: participantId,
      entity: entity,
      teamId: teamId,
      isPlayer: entity.type === 'player',
      isAI: entity.type !== 'player',
      
      // Combat stats
      health: entity.health,
      maxHealth: entity.maxHealth,
      mana: entity.mana,
      maxMana: entity.maxMana,
      stamina: entity.stamina,
      maxStamina: entity.maxStamina,
      
      // Battle state
      isAlive: true,
      isActive: true,
      isDefending: false,
      isFleeing: false,
      isStunned: false,
      
      // Action state
      lastAction: null,
      actionQueue: [],
      cooldowns: new Map(),
      
      // Effects
      activeEffects: new Map(),
      buffs: [],
      debuffs: [],
      
      // Statistics
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      actionsPerformed: 0,
      killCount: 0,
      
      // Initiative
      initiative: this.calculateInitiative(entity),
      turnPosition: 0
    };
    
    // Add to battle
    battle.participants.set(participantId, participant);
    
    // Add to team
    if (!battle.teams.has(teamId)) {
      battle.teams.set(teamId, {
        id: teamId,
        members: [],
        isAlive: true,
        totalHealth: 0,
        totalMaxHealth: 0
      });
    }
    
    const team = battle.teams.get(teamId);
    team.members.push(participantId);
    team.totalHealth += participant.health;
    team.totalMaxHealth += participant.maxHealth;
    
    return participant;
  }

  calculateTurnOrder(battle) {
    // Get all participants and sort by initiative
    const participants = Array.from(battle.participants.values())
      .filter(p => p.isAlive && p.isActive)
      .sort((a, b) => {
        // Higher initiative goes first
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        // Tie-breaker: players before AI
        if (a.isPlayer && !b.isPlayer) return -1;
        if (!a.isPlayer && b.isPlayer) return 1;
        // Final tie-breaker: random
        return Math.random() - 0.5;
      });
    
    // Set turn positions
    battle.turnOrder = participants.map((p, index) => {
      p.turnPosition = index;
      return p.id;
    });
    
    battle.currentTurn = 0;
  }

  calculateInitiative(entity) {
    const baseInitiative = entity.stats?.agility || 10;
    const levelModifier = (entity.level || 1) * 0.5;
    const randomFactor = Math.random() * 10;
    
    return Math.floor(baseInitiative + levelModifier + randomFactor);
  }

  isPlayerTurn(battle, playerId) {
    if (battle.turnOrder.length === 0) return false;
    
    const currentPlayerId = battle.turnOrder[battle.currentTurn];
    return currentPlayerId === playerId;
  }

  isValidAction(battle, participant, action) {
    // Check if participant is alive and active
    if (!participant.isAlive || !participant.isActive) {
      return false;
    }
    
    // Check if participant is stunned
    if (participant.isStunned) {
      return action === this.actionTypes.WAIT;
    }
    
    // Check if action is allowed in this battle type
    if (action === this.actionTypes.FLEE && !battle.allowFlee) {
      return false;
    }
    
    if (action === this.actionTypes.ITEM && !battle.allowItems) {
      return false;
    }
    
    return true;
  }

  async executeAction(battle, participant, actionData) {
    const { type, target, skill, item, position } = actionData;
    let result = {
      success: false,
      damage: 0,
      healing: 0,
      effects: [],
      message: '',
      critical: false,
      dodged: false,
      blocked: false,
      statusEffects: []
    };
    
    try {
      switch (type) {
        case this.actionTypes.ATTACK:
          result = await this.executeAttack(battle, participant, target);
          break;
          
        case this.actionTypes.SKILL:
          result = await this.executeSkill(battle, participant, skill, target, position);
          break;
          
        case this.actionTypes.SPELL:
          result = await this.executeSpell(battle, participant, skill, target, position);
          break;
          
        case this.actionTypes.ITEM:
          result = await this.executeItem(battle, participant, item, target);
          break;
          
        case this.actionTypes.DEFEND:
          result = await this.executeDefend(battle, participant);
          break;
          
        case this.actionTypes.FLEE:
          result = await this.executeFlee(battle, participant);
          break;
          
        case this.actionTypes.WAIT:
          result = await this.executeWait(battle, participant);
          break;
          
        default:
          throw new Error(`Unknown action type: ${type}`);
      }
      
      // Record action
      participant.lastAction = actionData;
      participant.actionsPerformed++;
      
      // Add to battle log
      battle.actions.push({
        participant: participant.id,
        action: actionData,
        result: result,
        timestamp: Date.now()
      });
      
      // Update statistics
      this.updateActionStatistics(participant, result);
      
    } catch (error) {
      console.error('Error executing action:', error);
      result.message = error.message;
    }
    
    return result;
  }

  async executeAttack(battle, attacker, targetId) {
    const target = battle.participants.get(targetId);
    if (!target || !target.isAlive) {
      throw new Error('Invalid target');
    }
    
    // Calculate hit chance
    const hitChance = this.calculateHitChance(attacker, target);
    const hit = Math.random() < hitChance;
    
    if (!hit) {
      return {
        success: false,
        damage: 0,
        dodged: true,
        message: `${attacker.entity.name} attacks ${target.entity.name} but misses!`
      };
    }
    
    // Calculate damage
    const damage = this.damageCalculator.calculateMeleeDamage(
      attacker.entity, 
      target.entity
    );
    
    // Check for critical hit
    const critical = Math.random() < this.config.criticalHitChance;
    const finalDamage = critical ? damage * 2 : damage;
    
    // Check for block
    const blocked = target.isDefending && Math.random() < this.config.blockChance;
    const actualDamage = blocked ? Math.floor(finalDamage * 0.5) : finalDamage;
    
    // Apply damage
    await this.applyDamage(target, actualDamage, 'physical');
    
    // Update statistics
    attacker.damageDealt += actualDamage;
    target.damageTaken += actualDamage;
    
    if (critical) {
      this.stats.criticalHits++;
    }
    
    if (blocked) {
      this.stats.blocks++;
    }
    
    return {
      success: true,
      damage: actualDamage,
      critical: critical,
      blocked: blocked,
      message: this.generateAttackMessage(attacker, target, actualDamage, critical, blocked)
    };
  }

  async executeSkill(battle, user, skillId, targetId, position) {
    // Get skill data
    const skill = await this.skillExecutor.getSkill(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    // Check if user can use skill
    if (!this.skillExecutor.canUseSkill(user.entity, skill)) {
      throw new Error('Cannot use skill');
    }
    
    // Check cooldown
    if (user.cooldowns.has(skillId)) {
      const cooldownEnd = user.cooldowns.get(skillId);
      if (Date.now() < cooldownEnd) {
        throw new Error('Skill on cooldown');
      }
    }
    
    // Check resource cost
    if (!this.hasResources(user, skill.cost)) {
      throw new Error('Insufficient resources');
    }
    
    // Execute skill
    const result = await this.skillExecutor.executeSkill(
      battle, 
      user, 
      skill, 
      targetId, 
      position
    );
    
    // Apply resource cost
    this.consumeResources(user, skill.cost);
    
    // Set cooldown
    if (skill.cooldown > 0) {
      user.cooldowns.set(skillId, Date.now() + skill.cooldown);
    }
    
    return result;
  }

  async executeSpell(battle, caster, spellId, targetId, position) {
    // Similar to executeSkill but for magical abilities
    const spell = await this.skillExecutor.getSpell(spellId);
    if (!spell) {
      throw new Error('Spell not found');
    }
    
    // Check mana cost
    if (caster.mana < spell.manaCost) {
      throw new Error('Insufficient mana');
    }
    
    // Execute spell
    const result = await this.skillExecutor.executeSpell(
      battle, 
      caster, 
      spell, 
      targetId, 
      position
    );
    
    // Consume mana
    caster.mana = Math.max(0, caster.mana - spell.manaCost);
    
    return result;
  }

  async executeItem(battle, user, itemId, targetId) {
    const item = await this.getItemData(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Check if user has item
    if (!this.hasItem(user.entity, itemId)) {
      throw new Error('Item not in inventory');
    }
    
    // Execute item effect
    const result = await this.applyItemEffect(battle, user, item, targetId);
    
    // Consume item
    this.consumeItem(user.entity, itemId);
    
    return result;
  }

  async executeDefend(battle, participant) {
    participant.isDefending = true;
    
    // Defending reduces damage taken by 50% and increases block chance
    const defendEffect = {
      id: 'defending',
      type: 'defend',
      duration: 1, // Until next turn
      damageReduction: 0.5,
      blockChanceBonus: 0.2
    };
    
    this.effectManager.applyEffect(participant, defendEffect);
    
    return {
      success: true,
      message: `${participant.entity.name} takes a defensive stance.`
    };
  }

  async executeFlee(battle, participant) {
    const fleeChance = this.calculateFleeChance(battle, participant);
    const success = Math.random() < fleeChance;
    
    if (success) {
      participant.isFleeing = true;
      participant.isActive = false;
      
      return {
        success: true,
        fled: true,
        message: `${participant.entity.name} successfully flees from battle!`
      };
    } else {
      return {
        success: false,
        message: `${participant.entity.name} fails to flee!`
      };
    }
  }

  async executeWait(battle, participant) {
    // Waiting restores some stamina and mana
    const staminaRestore = Math.floor(participant.maxStamina * 0.1);
    const manaRestore = Math.floor(participant.maxMana * 0.05);
    
    participant.stamina = Math.min(participant.maxStamina, 
      participant.stamina + staminaRestore);
    participant.mana = Math.min(participant.maxMana, 
      participant.mana + manaRestore);
    
    return {
      success: true,
      healing: staminaRestore + manaRestore,
      message: `${participant.entity.name} waits and recovers some energy.`
    };
  }

  calculateHitChance(attacker, defender) {
    const baseHitChance = 0.85;
    const attackerAccuracy = (attacker.entity.stats?.accuracy || 10) / 100;
    const defenderEvasion = (defender.entity.stats?.evasion || 5) / 100;
    
    let hitChance = baseHitChance + attackerAccuracy - defenderEvasion;
    
    // Apply status effects
    if (defender.isDefending) {
      hitChance *= 0.8; // Harder to hit defending targets
    }
    
    // Clamp between 5% and 95%
    return Math.max(0.05, Math.min(0.95, hitChance));
  }

  calculateFleeChance(battle, participant) {
    let baseFleeChance = 0.3;
    
    // Easier to flee early in battle
    if (battle.round <= 3) {
      baseFleeChance += 0.2;
    }
    
    // Harder to flee if low health
    const healthPercent = participant.health / participant.maxHealth;
    if (healthPercent < 0.3) {
      baseFleeChance -= 0.3;
    }
    
    // Agility affects flee chance
    const agilityBonus = (participant.entity.stats?.agility || 10) / 100;
    baseFleeChance += agilityBonus;
    
    return Math.max(0.05, Math.min(0.8, baseFleeChance));
  }

  async applyDamage(target, amount, damageType = 'physical') {
    // Apply damage reduction from armor/effects
    const finalDamage = this.calculateFinalDamage(target, amount, damageType);
    
    // Apply damage
    target.health = Math.max(0, target.health - finalDamage);
    
    // Check for death
    if (target.health <= 0) {
      await this.handleParticipantDeath(target);
    }
    
    // Apply damage effects (knockback, status effects, etc.)
    await this.applyDamageEffects(target, finalDamage, damageType);
    
    return finalDamage;
  }

  calculateFinalDamage(target, amount, damageType) {
    let finalDamage = amount;
    
    // Apply armor reduction
    if (damageType === 'physical') {
      const armor = target.entity.stats?.armor || 0;
      const reduction = armor / (armor + 100);
      finalDamage *= (1 - reduction);
    } else if (damageType === 'magical') {
      const magicResist = target.entity.stats?.magicResist || 0;
      const reduction = magicResist / (magicResist + 100);
      finalDamage *= (1 - reduction);
    }
    
    // Apply effect-based reductions
    for (const effect of target.activeEffects.values()) {
      if (effect.damageReduction) {
        finalDamage *= (1 - effect.damageReduction);
      }
    }
    
    return Math.floor(finalDamage);
  }

  async handleParticipantDeath(participant) {
    participant.isAlive = false;
    participant.isActive = false;
    
    // Apply death effects
    this.effectManager.clearEffects(participant);
    
    // Update team status
    this.updateTeamStatus(participant);
    
    // Emit death event
    this.emit('participant:death', participant);
    
    this.stats.deaths++;
  }

  updateTeamStatus(participant) {
    const team = Array.from(this.activeBattles.values())
      .find(battle => battle.participants.has(participant.id))
      ?.teams.get(participant.teamId);
    
    if (team) {
      team.totalHealth = team.members
        .map(id => this.activeBattles.get(participant.id)?.participants.get(id))
        .filter(p => p?.isAlive)
        .reduce((sum, p) => sum + p.health, 0);
      
      team.isAlive = team.members.some(id => {
        const p = this.activeBattles.get(participant.id)?.participants.get(id);
        return p?.isAlive;
      });
    }
  }

  checkBattleEndConditions(battle) {
    // Check if any team has no living members
    const aliveTeams = Array.from(battle.teams.values())
      .filter(team => team.isAlive);
    
    if (aliveTeams.length <= 1) {
      return true;
    }
    
    // Check maximum rounds
    if (battle.round >= battle.maxRounds) {
      return true;
    }
    
    // Check time limit
    const elapsed = Date.now() - battle.startTime;
    if (elapsed >= this.config.maxBattleDuration) {
      return true;
    }
    
    // Check if all participants fled
    const activeParticipants = Array.from(battle.participants.values())
      .filter(p => p.isActive && !p.isFleeing);
    
    if (activeParticipants.length === 0) {
      return true;
    }
    
    return false;
  }

  async endBattle(battle) {
    battle.phase = this.battlePhases.FINISHING;
    battle.endTime = Date.now();
    battle.duration = battle.endTime - battle.startTime;
    
    // Determine winner
    const winner = this.determineWinner(battle);
    battle.winner = winner;
    
    // Calculate rewards
    const rewards = await this.rewardCalculator.calculateBattleRewards(battle);
    battle.rewards = rewards;
    
    // Distribute rewards
    await this.distributeRewards(battle, rewards);
    
    // Update player statistics
    await this.updatePlayerStatistics(battle);
    
    // Log battle end
    this.battleLogger.logBattleEnd(battle);
    
    // Clean up
    battle.phase = this.battlePhases.COMPLETED;
    this.activeBattles.delete(battle.id);
    this.battleHistory.set(battle.id, battle);
    this.stats.activeBattleCount--;
    
    // Notify participants
    this.notifyBattleEnd(battle);
    
    // Emit event
    this.gameEngine.emit('battle:ended', battle);
    
    console.log(`Battle ended: ${battle.id} - Winner: ${winner?.id || 'Draw'}`);
  }

  determineWinner(battle) {
    const aliveTeams = Array.from(battle.teams.values())
      .filter(team => team.isAlive);
    
    if (aliveTeams.length === 1) {
      return aliveTeams[0];
    } else if (aliveTeams.length === 0) {
      // All died - determine by remaining health
      let bestTeam = null;
      let bestHealth = -1;
      
      for (const team of battle.teams.values()) {
        if (team.totalHealth > bestHealth) {
          bestHealth = team.totalHealth;
          bestTeam = team;
        }
      }
      
      return bestTeam;
    }
    
    // Timeout - determine by health percentage
    let bestTeam = null;
    let bestHealthPercent = -1;
    
    for (const team of battle.teams.values()) {
      const healthPercent = team.totalHealth / team.totalMaxHealth;
      if (healthPercent > bestHealthPercent) {
        bestHealthPercent = healthPercent;
        bestTeam = team;
      }
    }
    
    return bestTeam;
  }

  advanceTurn(battle) {
    // Clear defending state
    const currentParticipant = battle.participants.get(
      battle.turnOrder[battle.currentTurn]
    );
    if (currentParticipant) {
      currentParticipant.isDefending = false;
    }
    
    // Move to next turn
    battle.currentTurn = (battle.currentTurn + 1) % battle.turnOrder.length;
    
    // If back to first player, increment round
    if (battle.currentTurn === 0) {
      battle.round++;
      this.processRoundEffects(battle);
    }
    
    // Process turn effects (regeneration, status effects, etc.)
    this.processTurnEffects(battle);
    
    // Start turn timer for next player
    this.startTurnTimer(battle);
  }

  processTurnEffects(battle) {
    for (const participant of battle.participants.values()) {
      if (!participant.isAlive) continue;
      
      // Process active effects
      this.effectManager.processTurnEffects(participant);
      
      // Natural regeneration
      if (participant.health > 0) {
        const healthRegen = Math.floor(participant.maxHealth * 0.02);
        participant.health = Math.min(participant.maxHealth, 
          participant.health + healthRegen);
        
        const manaRegen = Math.floor(participant.maxMana * 0.05);
        participant.mana = Math.min(participant.maxMana, 
          participant.mana + manaRegen);
      }
    }
  }

  processRoundEffects(battle) {
    // Apply environmental effects each round
    this.applyEnvironmentalEffects(battle);
    
    // Process round-based status effects
    for (const participant of battle.participants.values()) {
      this.effectManager.processRoundEffects(participant);
    }
  }

  applyEnvironmentalEffects(battle) {
    const { terrain, weather, timeOfDay } = battle;
    
    // Terrain effects
    switch (terrain) {
      case 'swamp':
        // Reduced movement speed
        for (const p of battle.participants.values()) {
          if (p.isAlive) {
            this.effectManager.applyEffect(p, {
              id: 'swamp_slow',
              type: 'movement_penalty',
              duration: 1,
              movementSpeedMultiplier: 0.8
            });
          }
        }
        break;
        
      case 'desert':
        // Gradual stamina loss
        for (const p of battle.participants.values()) {
          if (p.isAlive) {
            p.stamina = Math.max(0, p.stamina - 5);
          }
        }
        break;
        
      case 'arctic':
        // Gradual health loss from cold
        for (const p of battle.participants.values()) {
          if (p.isAlive && !p.hasEffect('cold_immunity')) {
            p.health = Math.max(0, p.health - 2);
          }
        }
        break;
    }
    
    // Weather effects
    switch (weather) {
      case 'rain':
        // Reduced fire damage, increased water damage
        battle.conditions.add('wet');
        break;
        
      case 'storm':
        // Chance for lightning strikes
        if (Math.random() < 0.1) {
          this.triggerLightningStrike(battle);
        }
        break;
    }
  }

  startBattleTimer(battle) {
    setTimeout(() => {
      if (this.activeBattles.has(battle.id) && 
          battle.phase === this.battlePhases.ACTIVE) {
        // Auto-end battle due to timeout
        this.endBattle(battle);
      }
    }, this.config.maxBattleDuration);
  }

  startTurnTimer(battle) {
    setTimeout(() => {
      if (this.activeBattles.has(battle.id) && 
          battle.phase === this.battlePhases.ACTIVE) {
        // Auto-pass turn if no action taken
        this.handleTurnTimeout(battle);
      }
    }, battle.turnTimeLimit);
  }

  handleTurnTimeout(battle) {
    const currentParticipant = battle.participants.get(
      battle.turnOrder[battle.currentTurn]
    );
    
    if (currentParticipant && currentParticipant.isPlayer) {
      // Player timed out - force wait action
      this.executeWait(battle, currentParticipant);
    }
    
    this.advanceTurn(battle);
    this.emitBattleUpdate(battle);
  }

  emitBattleUpdate(battle) {
    const updateData = {
      battleId: battle.id,
      phase: battle.phase,
      round: battle.round,
      currentTurn: battle.currentTurn,
      participants: Array.from(battle.participants.values()).map(p => ({
        id: p.id,
        name: p.entity.name,
        health: p.health,
        maxHealth: p.maxHealth,
        mana: p.mana,
        maxMana: p.maxMana,
        isAlive: p.isAlive,
        isActive: p.isActive,
        effects: Array.from(p.activeEffects.keys())
      })),
      lastAction: battle.actions[battle.actions.length - 1],
      timestamp: Date.now()
    };
    
    // Send to all participants
    for (const participant of battle.participants.values()) {
      if (participant.isPlayer) {
        const socket = this.gameEngine.playerManager.playerSocketMap.get(participant.id);
        if (socket) {
          socket.emit('battle:update', updateData);
        }
      }
    }
    
    // Send to spectators if allowed
    if (battle.allowSpectators) {
      this.gameEngine.io.to(`battle:${battle.id}`).emit('battle:update', updateData);
    }
  }

  notifyBattleStart(battle) {
    for (const participant of battle.participants.values()) {
      if (participant.isPlayer) {
        const socket = this.gameEngine.playerManager.playerSocketMap.get(participant.id);
        if (socket) {
          socket.emit('battle:started', {
            battleId: battle.id,
            type: battle.type,
            participants: Array.from(battle.participants.values()).map(p => ({
              id: p.id,
              name: p.entity.name,
              level: p.entity.level,
              teamId: p.teamId
            })),
            turnOrder: battle.turnOrder,
            environment: {
              terrain: battle.terrain,
              weather: battle.weather,
              timeOfDay: battle.timeOfDay
            }
          });
        }
      }
    }
  }

  notifyBattleEnd(battle) {
    const endData = {
      battleId: battle.id,
      winner: battle.winner,
      duration: battle.duration,
      rewards: battle.rewards,
      statistics: this.compileBattleStatistics(battle)
    };
    
    for (const participant of battle.participants.values()) {
      if (participant.isPlayer) {
        const socket = this.gameEngine.playerManager.playerSocketMap.get(participant.id);
        if (socket) {
          socket.emit('battle:ended', endData);
        }
      }
    }
  }

  findParticipant(battle, playerId) {
    return battle.participants.get(playerId);
  }

  cleanupExpiredBattles() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [battleId, battle] of this.battleHistory) {
      if (battle.endTime && battle.endTime < oneHourAgo) {
        this.battleHistory.delete(battleId);
      }
    }
  }

  updateBattleMetrics() {
    // Update active battle count
    this.stats.activeBattleCount = this.activeBattles.size;
    
    // Emit metrics update
    this.emit('metrics:update', this.stats);
  }

  getMetrics() {
    return {
      ...this.stats,
      activeBattles: this.activeBattles.size,
      historicalBattles: this.battleHistory.size
    };
  }
}
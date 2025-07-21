import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

/**
 * Advanced AI System with Machine Learning and Complex Behaviors
 * Handles NPC AI, monster behavior, companion AI, and adaptive learning
 */
export class AdvancedAISystem extends EventEmitter {
  constructor(gameEngine) {
    super();
    this.gameEngine = gameEngine;
    this.aiEntities = new Map();
    this.behaviorTrees = new Map();
    this.learningModels = new Map();
    this.pathfinding = new PathfindingEngine();
    this.decisionEngine = new DecisionEngine();
    this.emotionEngine = new EmotionEngine();
    this.memorySystem = new AIMemorySystem();
    this.communicationSystem = new AICommunicationSystem();
    
    // AI Performance tracking
    this.metrics = {
      totalAIEntities: 0,
      avgProcessingTime: 0,
      decisionsPerSecond: 0,
      pathfindingRequests: 0,
      learningUpdates: 0
    };
    
    // AI Configuration
    this.config = {
      maxAIEntities: 10000,
      updateFrequency: 16, // 60 FPS
      learningRate: 0.001,
      memoryCapacity: 1000,
      communicationRange: 100,
      emotionDecayRate: 0.1,
      aggressionThreshold: 0.7,
      curiosityThreshold: 0.5,
      fearThreshold: 0.8
    };
    
    this.initialize();
  }

  async initialize() {
    console.log('🤖 Initializing Advanced AI System...');
    
    // Initialize pathfinding grid
    await this.pathfinding.initialize();
    
    // Load pre-trained models
    await this.loadLearningModels();
    
    // Initialize behavior trees
    this.initializeBehaviorTrees();
    
    // Start AI processing loop
    this.startAILoop();
    
    console.log('✅ Advanced AI System initialized');
  }

  async loadLearningModels() {
    // Combat behavior model
    this.learningModels.set('combat', new CombatAI({
      inputSize: 20,
      hiddenLayers: [64, 32, 16],
      outputSize: 8,
      learningRate: this.config.learningRate
    }));
    
    // Movement prediction model
    this.learningModels.set('movement', new MovementPredictor({
      inputSize: 12,
      hiddenLayers: [32, 16],
      outputSize: 4,
      learningRate: this.config.learningRate
    }));
    
    // Player behavior analysis
    this.learningModels.set('playerBehavior', new PlayerBehaviorAnalyzer({
      inputSize: 30,
      hiddenLayers: [128, 64, 32],
      outputSize: 16,
      learningRate: this.config.learningRate
    }));
    
    // Economic decision making
    this.learningModels.set('economy', new EconomicAI({
      inputSize: 25,
      hiddenLayers: [64, 32],
      outputSize: 10,
      learningRate: this.config.learningRate
    }));
  }

  initializeBehaviorTrees() {
    // Guard AI behavior tree
    this.behaviorTrees.set('guard', new BehaviorTree({
      root: new SelectorNode([
        new SequenceNode([
          new ConditionNode('enemyInRange'),
          new ActionNode('engage')
        ]),
        new SequenceNode([
          new ConditionNode('hearNoise'),
          new ActionNode('investigate')
        ]),
        new ActionNode('patrol')
      ])
    }));
    
    // Merchant AI behavior tree
    this.behaviorTrees.set('merchant', new BehaviorTree({
      root: new SelectorNode([
        new SequenceNode([
          new ConditionNode('playerNearby'),
          new ActionNode('greet')
        ]),
        new SequenceNode([
          new ConditionNode('inventoryFull'),
          new ActionNode('restockItems')
        ]),
        new ActionNode('idle')
      ])
    }));
    
    // Monster AI behavior tree
    this.behaviorTrees.set('monster', new BehaviorTree({
      root: new SelectorNode([
        new SequenceNode([
          new ConditionNode('healthLow'),
          new ActionNode('flee')
        ]),
        new SequenceNode([
          new ConditionNode('playerInRange'),
          new ParallelNode([
            new ActionNode('attack'),
            new ActionNode('moveToPlayer')
          ])
        ]),
        new SequenceNode([
          new ConditionNode('heardSound'),
          new ActionNode('investigate')
        ]),
        new ActionNode('wander')
      ])
    }));
    
    // Companion AI behavior tree
    this.behaviorTrees.set('companion', new BehaviorTree({
      root: new SelectorNode([
        new SequenceNode([
          new ConditionNode('masterInDanger'),
          new ActionNode('defendMaster')
        ]),
        new SequenceNode([
          new ConditionNode('masterAttacking'),
          new ActionNode('assistAttack')
        ]),
        new SequenceNode([
          new ConditionNode('tooFarFromMaster'),
          new ActionNode('followMaster')
        ]),
        new ActionNode('idle')
      ])
    }));
  }

  startAILoop() {
    const aiLoop = () => {
      const startTime = performance.now();
      
      this.updateAllAI();
      
      const endTime = performance.now();
      this.metrics.avgProcessingTime = (this.metrics.avgProcessingTime * 0.95) + 
        ((endTime - startTime) * 0.05);
      
      setTimeout(aiLoop, this.config.updateFrequency);
    };
    
    aiLoop();
  }

  updateAllAI() {
    for (const [entityId, aiEntity] of this.aiEntities) {
      try {
        this.updateEntityAI(aiEntity);
      } catch (error) {
        console.error(`Error updating AI for entity ${entityId}:`, error);
      }
    }
    
    // Update AI systems
    this.pathfinding.update();
    this.decisionEngine.update();
    this.emotionEngine.update();
    this.memorySystem.update();
    this.communicationSystem.update();
  }

  updateEntityAI(aiEntity) {
    const deltaTime = this.config.updateFrequency;
    
    // Update emotions
    this.emotionEngine.updateEmotions(aiEntity, deltaTime);
    
    // Update memory
    this.memorySystem.updateMemory(aiEntity, deltaTime);
    
    // Get current perception
    const perception = this.getEntityPerception(aiEntity);
    
    // Update learning models
    this.updateLearning(aiEntity, perception);
    
    // Execute behavior tree
    const behaviorTree = this.behaviorTrees.get(aiEntity.aiType);
    if (behaviorTree) {
      const context = {
        entity: aiEntity,
        perception: perception,
        gameEngine: this.gameEngine,
        memory: this.memorySystem.getMemory(aiEntity.id),
        emotions: this.emotionEngine.getEmotions(aiEntity.id)
      };
      
      behaviorTree.execute(context);
    }
    
    // Process AI communications
    this.communicationSystem.processEntityCommunication(aiEntity);
    
    // Update AI decision making
    this.decisionEngine.makeDecisions(aiEntity, perception);
  }

  getEntityPerception(aiEntity) {
    const perception = {
      nearbyPlayers: [],
      nearbyEnemies: [],
      nearbyAllies: [],
      nearbyItems: [],
      nearbyBuildings: [],
      environment: {},
      sounds: [],
      smells: [],
      threats: [],
      opportunities: []
    };
    
    const perceptionRange = aiEntity.perceptionRange || 50;
    
    // Get nearby players
    for (const [playerId, player] of this.gameEngine.players) {
      const distance = this.calculateDistance(aiEntity.position, player.position);
      if (distance <= perceptionRange) {
        perception.nearbyPlayers.push({
          id: playerId,
          position: player.position,
          distance: distance,
          level: player.level,
          health: player.health,
          isHostile: this.isHostile(aiEntity, player),
          threatLevel: this.calculateThreatLevel(aiEntity, player)
        });
      }
    }
    
    // Get nearby entities
    for (const [entityId, entity] of this.gameEngine.entities) {
      if (entityId === aiEntity.id) continue;
      
      const distance = this.calculateDistance(aiEntity.position, entity.position);
      if (distance <= perceptionRange) {
        if (entity.isHostile) {
          perception.nearbyEnemies.push({
            id: entityId,
            position: entity.position,
            distance: distance,
            type: entity.type,
            threatLevel: this.calculateThreatLevel(aiEntity, entity)
          });
        } else {
          perception.nearbyAllies.push({
            id: entityId,
            position: entity.position,
            distance: distance,
            type: entity.type
          });
        }
      }
    }
    
    // Get environmental information
    perception.environment = {
      temperature: this.gameEngine.systems.get('weather').getTemperature(aiEntity.position),
      humidity: this.gameEngine.systems.get('weather').getHumidity(aiEntity.position),
      windSpeed: this.gameEngine.systems.get('weather').getWindSpeed(aiEntity.position),
      timeOfDay: this.gameEngine.systems.get('daynight').getTimeOfDay(),
      visibility: this.calculateVisibility(aiEntity.position),
      terrain: this.getTerrainType(aiEntity.position),
      coverAvailable: this.checkCoverAvailability(aiEntity.position)
    };
    
    return perception;
  }

  updateLearning(aiEntity, perception) {
    if (!aiEntity.learningEnabled) return;
    
    // Prepare training data
    const trainingData = this.prepareTrainingData(aiEntity, perception);
    
    // Update combat AI
    if (aiEntity.inCombat) {
      const combatAI = this.learningModels.get('combat');
      combatAI.train(trainingData.combat);
      this.metrics.learningUpdates++;
    }
    
    // Update movement prediction
    if (aiEntity.isMoving) {
      const movementAI = this.learningModels.get('movement');
      movementAI.train(trainingData.movement);
      this.metrics.learningUpdates++;
    }
    
    // Update player behavior analysis
    if (perception.nearbyPlayers.length > 0) {
      const behaviorAI = this.learningModels.get('playerBehavior');
      behaviorAI.train(trainingData.playerBehavior);
      this.metrics.learningUpdates++;
    }
  }

  prepareTrainingData(aiEntity, perception) {
    return {
      combat: {
        input: [
          aiEntity.health / aiEntity.maxHealth,
          aiEntity.mana / aiEntity.maxMana,
          perception.nearbyEnemies.length,
          perception.nearbyAllies.length,
          perception.environment.visibility,
          ...perception.nearbyEnemies.slice(0, 3).map(e => [
            e.distance / 100,
            e.threatLevel,
            Math.cos(this.getAngleTo(aiEntity.position, e.position)),
            Math.sin(this.getAngleTo(aiEntity.position, e.position))
          ]).flat()
        ].slice(0, 20),
        output: this.getOptimalCombatAction(aiEntity, perception)
      },
      movement: {
        input: [
          aiEntity.position.x / 1000,
          aiEntity.position.y / 1000,
          aiEntity.velocity.x,
          aiEntity.velocity.y,
          perception.nearbyEnemies.length,
          perception.nearbyAllies.length,
          perception.environment.visibility,
          perception.environment.coverAvailable ? 1 : 0,
          aiEntity.currentGoal ? aiEntity.currentGoal.x / 1000 : 0,
          aiEntity.currentGoal ? aiEntity.currentGoal.y / 1000 : 0,
          aiEntity.health / aiEntity.maxHealth,
          aiEntity.stamina / aiEntity.maxStamina
        ],
        output: this.getOptimalMovement(aiEntity, perception)
      },
      playerBehavior: {
        input: this.extractPlayerBehaviorFeatures(perception.nearbyPlayers),
        output: this.predictPlayerActions(perception.nearbyPlayers)
      }
    };
  }

  // Pathfinding and movement
  async findPath(startPos, endPos, options = {}) {
    this.metrics.pathfindingRequests++;
    return await this.pathfinding.findPath(startPos, endPos, options);
  }

  // Communication between AI entities
  sendAIMessage(fromEntity, toEntity, message) {
    this.communicationSystem.sendMessage(fromEntity, toEntity, message);
  }

  // Memory management
  addMemory(entityId, memory) {
    this.memorySystem.addMemory(entityId, memory);
  }

  getMemory(entityId, query) {
    return this.memorySystem.query(entityId, query);
  }

  // Emotion system
  setEmotion(entityId, emotion, intensity) {
    this.emotionEngine.setEmotion(entityId, emotion, intensity);
  }

  getEmotion(entityId, emotion) {
    return this.emotionEngine.getEmotion(entityId, emotion);
  }

  // AI Entity management
  registerAIEntity(entity) {
    this.aiEntities.set(entity.id, {
      ...entity,
      aiEnabled: true,
      learningEnabled: entity.learningEnabled !== false,
      perceptionRange: entity.perceptionRange || 50,
      intelligence: entity.intelligence || 1.0,
      aggression: entity.aggression || 0.5,
      curiosity: entity.curiosity || 0.3,
      fear: entity.fear || 0.2,
      loyalty: entity.loyalty || 0.0,
      lastUpdate: Date.now()
    });
    
    // Initialize AI-specific data
    this.memorySystem.initializeEntity(entity.id);
    this.emotionEngine.initializeEntity(entity.id);
    this.communicationSystem.registerEntity(entity.id);
    
    this.metrics.totalAIEntities++;
    this.emit('aiEntityRegistered', entity);
  }

  unregisterAIEntity(entityId) {
    this.aiEntities.delete(entityId);
    this.memorySystem.removeEntity(entityId);
    this.emotionEngine.removeEntity(entityId);
    this.communicationSystem.unregisterEntity(entityId);
    
    this.metrics.totalAIEntities--;
    this.emit('aiEntityUnregistered', entityId);
  }

  // Utility methods
  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateThreatLevel(aiEntity, target) {
    const levelDiff = target.level - aiEntity.level;
    const healthRatio = target.health / target.maxHealth;
    const distance = this.calculateDistance(aiEntity.position, target.position);
    
    let threatLevel = 0.5 + (levelDiff * 0.1);
    threatLevel *= healthRatio;
    threatLevel *= Math.max(0.1, 1 - (distance / 100));
    
    return Math.max(0, Math.min(1, threatLevel));
  }

  isHostile(aiEntity, target) {
    // Check faction relationships
    if (aiEntity.faction && target.faction) {
      return this.gameEngine.factionSystem.areHostile(aiEntity.faction, target.faction);
    }
    
    // Default hostility rules
    if (aiEntity.type === 'monster' && target.type === 'player') {
      return true;
    }
    
    if (aiEntity.type === 'guard' && target.criminalStatus > 0) {
      return true;
    }
    
    return false;
  }

  getAngleTo(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  calculateVisibility(position) {
    const weather = this.gameEngine.systems.get('weather');
    const daynight = this.gameEngine.systems.get('daynight');
    
    let visibility = 1.0;
    
    // Weather effects
    if (weather.getCurrentWeather() === 'fog') visibility *= 0.3;
    if (weather.getCurrentWeather() === 'rain') visibility *= 0.7;
    if (weather.getCurrentWeather() === 'snow') visibility *= 0.5;
    
    // Time of day effects
    const timeOfDay = daynight.getTimeOfDay();
    if (timeOfDay >= 20 || timeOfDay <= 6) visibility *= 0.4; // Night
    if (timeOfDay >= 6 && timeOfDay <= 8) visibility *= 0.7; // Dawn
    if (timeOfDay >= 18 && timeOfDay <= 20) visibility *= 0.7; // Dusk
    
    return Math.max(0.1, visibility);
  }

  getTerrainType(position) {
    // Simplified terrain detection
    const x = Math.floor(position.x / 32);
    const y = Math.floor(position.y / 32);
    
    const terrainMap = this.gameEngine.worldManager.getTerrainMap();
    return terrainMap.getTile(x, y)?.type || 'grass';
  }

  checkCoverAvailability(position) {
    // Check for nearby buildings, trees, rocks, etc.
    const coverRange = 10;
    
    for (const [buildingId, building] of this.gameEngine.buildings) {
      const distance = this.calculateDistance(position, building.position);
      if (distance <= coverRange) {
        return true;
      }
    }
    
    // Check for natural cover (trees, rocks)
    const terrain = this.getTerrainType(position);
    return ['forest', 'mountain', 'rocky'].includes(terrain);
  }

  getOptimalCombatAction(aiEntity, perception) {
    // Simplified optimal action calculation
    const actions = [
      [1, 0, 0, 0, 0, 0, 0, 0], // attack
      [0, 1, 0, 0, 0, 0, 0, 0], // defend
      [0, 0, 1, 0, 0, 0, 0, 0], // flee
      [0, 0, 0, 1, 0, 0, 0, 0], // use skill
      [0, 0, 0, 0, 1, 0, 0, 0], // use item
      [0, 0, 0, 0, 0, 1, 0, 0], // move closer
      [0, 0, 0, 0, 0, 0, 1, 0], // move away
      [0, 0, 0, 0, 0, 0, 0, 1]  // wait
    ];
    
    if (aiEntity.health < aiEntity.maxHealth * 0.3) {
      return actions[2]; // flee
    }
    
    if (perception.nearbyEnemies.length > 0) {
      const nearestEnemy = perception.nearbyEnemies[0];
      if (nearestEnemy.distance < 10) {
        return actions[0]; // attack
      } else {
        return actions[5]; // move closer
      }
    }
    
    return actions[7]; // wait
  }

  getOptimalMovement(aiEntity, perception) {
    // Return normalized movement vector [x, y, speed, direction]
    if (aiEntity.currentGoal) {
      const dx = aiEntity.currentGoal.x - aiEntity.position.x;
      const dy = aiEntity.currentGoal.y - aiEntity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        return [
          dx / distance,
          dy / distance,
          Math.min(1.0, distance / 100),
          Math.atan2(dy, dx) / Math.PI
        ];
      }
    }
    
    return [0, 0, 0, 0];
  }

  extractPlayerBehaviorFeatures(players) {
    // Extract 30 features about player behavior
    const features = new Array(30).fill(0);
    
    if (players.length === 0) return features;
    
    const player = players[0]; // Focus on nearest player
    
    features[0] = player.level / 100;
    features[1] = player.health / player.maxHealth;
    features[2] = player.distance / 100;
    features[3] = player.threatLevel;
    features[4] = player.isHostile ? 1 : 0;
    
    // Add more features based on player state, equipment, etc.
    // This would be expanded based on actual game data
    
    return features;
  }

  predictPlayerActions(players) {
    // Predict player actions (16 possible actions)
    const predictions = new Array(16).fill(0);
    
    if (players.length === 0) return predictions;
    
    // Simple heuristic-based prediction
    const player = players[0];
    
    if (player.health < 0.3) {
      predictions[0] = 1; // likely to flee
    } else if (player.distance < 20) {
      predictions[1] = 1; // likely to attack
    } else {
      predictions[2] = 1; // likely to move closer
    }
    
    return predictions;
  }

  getMetrics() {
    return {
      ...this.metrics,
      aiEntitiesCount: this.aiEntities.size,
      behaviorTreesCount: this.behaviorTrees.size,
      learningModelsCount: this.learningModels.size
    };
  }
}

// Supporting AI Classes
class PathfindingEngine {
  constructor() {
    this.grid = null;
    this.obstacles = new Set();
    this.paths = new Map();
  }

  async initialize() {
    // Initialize pathfinding grid
    this.grid = new PathfindingGrid(1024, 1024);
    console.log('Pathfinding engine initialized');
  }

  async findPath(start, end, options = {}) {
    // A* pathfinding implementation
    return this.aStar(start, end, options);
  }

  aStar(start, end, options) {
    // Simplified A* implementation
    const path = [start, end];
    return Promise.resolve(path);
  }

  update() {
    // Update dynamic obstacles
    this.updateObstacles();
  }

  updateObstacles() {
    // Update obstacles based on game state
  }
}

class DecisionEngine {
  constructor() {
    this.decisions = new Map();
    this.weights = new Map();
  }

  makeDecisions(entity, perception) {
    // Multi-criteria decision making
    const options = this.generateOptions(entity, perception);
    const scores = this.scoreOptions(options, entity, perception);
    const bestOption = this.selectBestOption(scores);
    
    if (bestOption) {
      this.executeDecision(entity, bestOption);
    }
  }

  generateOptions(entity, perception) {
    const options = [];
    
    // Generate possible actions based on current state
    if (perception.nearbyEnemies.length > 0) {
      options.push({ type: 'combat', target: perception.nearbyEnemies[0] });
    }
    
    if (entity.currentGoal) {
      options.push({ type: 'moveToGoal', target: entity.currentGoal });
    }
    
    options.push({ type: 'idle' });
    
    return options;
  }

  scoreOptions(options, entity, perception) {
    return options.map(option => ({
      option,
      score: this.calculateScore(option, entity, perception)
    }));
  }

  calculateScore(option, entity, perception) {
    let score = 0;
    
    switch (option.type) {
      case 'combat':
        score = entity.aggression * 0.8 + (1 - entity.fear) * 0.2;
        break;
      case 'moveToGoal':
        score = entity.curiosity * 0.6 + entity.loyalty * 0.4;
        break;
      case 'idle':
        score = 0.1;
        break;
    }
    
    return score;
  }

  selectBestOption(scores) {
    return scores.reduce((best, current) => 
      current.score > best.score ? current : best
    )?.option;
  }

  executeDecision(entity, decision) {
    entity.currentDecision = decision;
    entity.decisionTimestamp = Date.now();
  }

  update() {
    // Update decision weights based on outcomes
  }
}

class EmotionEngine {
  constructor() {
    this.emotions = new Map();
    this.emotionTypes = ['happiness', 'anger', 'fear', 'curiosity', 'loyalty', 'aggression'];
  }

  initializeEntity(entityId) {
    const emotions = {};
    this.emotionTypes.forEach(type => {
      emotions[type] = Math.random() * 0.5; // Start with low random emotions
    });
    this.emotions.set(entityId, emotions);
  }

  updateEmotions(entity, deltaTime) {
    const emotions = this.emotions.get(entity.id);
    if (!emotions) return;
    
    // Decay emotions over time
    this.emotionTypes.forEach(type => {
      emotions[type] *= Math.pow(0.99, deltaTime / 1000);
    });
    
    // Update based on current situation
    this.updateEmotionBasedOnSituation(entity, emotions);
  }

  updateEmotionBasedOnSituation(entity, emotions) {
    // Increase fear if health is low
    if (entity.health < entity.maxHealth * 0.3) {
      emotions.fear = Math.min(1, emotions.fear + 0.1);
    }
    
    // Increase anger if recently damaged
    if (entity.recentlyDamaged) {
      emotions.anger = Math.min(1, emotions.anger + 0.2);
    }
    
    // Increase happiness if well-fed or rested
    if (entity.satisfied) {
      emotions.happiness = Math.min(1, emotions.happiness + 0.05);
    }
  }

  setEmotion(entityId, emotion, intensity) {
    const emotions = this.emotions.get(entityId);
    if (emotions && this.emotionTypes.includes(emotion)) {
      emotions[emotion] = Math.max(0, Math.min(1, intensity));
    }
  }

  getEmotion(entityId, emotion) {
    const emotions = this.emotions.get(entityId);
    return emotions ? emotions[emotion] || 0 : 0;
  }

  getEmotions(entityId) {
    return this.emotions.get(entityId) || {};
  }

  removeEntity(entityId) {
    this.emotions.delete(entityId);
  }

  update() {
    // Global emotion system updates
  }
}

class AIMemorySystem {
  constructor() {
    this.memories = new Map();
    this.maxMemoriesPerEntity = 1000;
  }

  initializeEntity(entityId) {
    this.memories.set(entityId, []);
  }

  addMemory(entityId, memory) {
    const entityMemories = this.memories.get(entityId);
    if (!entityMemories) return;
    
    const memoryEntry = {
      ...memory,
      timestamp: Date.now(),
      importance: memory.importance || 1.0
    };
    
    entityMemories.push(memoryEntry);
    
    // Limit memory capacity
    if (entityMemories.length > this.maxMemoriesPerEntity) {
      // Remove least important old memories
      entityMemories.sort((a, b) => a.importance - b.importance);
      entityMemories.splice(0, entityMemories.length - this.maxMemoriesPerEntity);
    }
  }

  query(entityId, query) {
    const entityMemories = this.memories.get(entityId);
    if (!entityMemories) return [];
    
    // Simple memory search
    return entityMemories.filter(memory => 
      memory.type === query.type ||
      (query.target && memory.target === query.target) ||
      (query.location && this.isNearLocation(memory.location, query.location))
    );
  }

  getMemory(entityId) {
    return this.memories.get(entityId) || [];
  }

  removeEntity(entityId) {
    this.memories.delete(entityId);
  }

  isNearLocation(loc1, loc2, threshold = 50) {
    if (!loc1 || !loc2) return false;
    const dx = loc1.x - loc2.x;
    const dy = loc1.y - loc2.y;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  }

  update() {
    // Clean up old, unimportant memories
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [entityId, memories] of this.memories) {
      this.memories.set(entityId, 
        memories.filter(memory => 
          (now - memory.timestamp) < oneHour || memory.importance > 0.5
        )
      );
    }
  }
}

class AICommunicationSystem {
  constructor() {
    this.entities = new Set();
    this.messages = new Map();
    this.communicationRange = 100;
  }

  registerEntity(entityId) {
    this.entities.add(entityId);
    this.messages.set(entityId, []);
  }

  unregisterEntity(entityId) {
    this.entities.delete(entityId);
    this.messages.delete(entityId);
  }

  sendMessage(fromEntity, toEntity, message) {
    const toMessages = this.messages.get(toEntity.id);
    if (toMessages) {
      toMessages.push({
        from: fromEntity.id,
        content: message,
        timestamp: Date.now(),
        type: message.type || 'general'
      });
    }
  }

  processEntityCommunication(entity) {
    const messages = this.messages.get(entity.id) || [];
    
    messages.forEach(message => {
      this.processMessage(entity, message);
    });
    
    // Clear processed messages
    this.messages.set(entity.id, []);
  }

  processMessage(entity, message) {
    switch (message.type) {
      case 'alert':
        this.handleAlert(entity, message);
        break;
      case 'request_help':
        this.handleHelpRequest(entity, message);
        break;
      case 'share_information':
        this.handleInformationSharing(entity, message);
        break;
      case 'coordinate_attack':
        this.handleAttackCoordination(entity, message);
        break;
    }
  }

  handleAlert(entity, message) {
    // Process alert messages (enemy spotted, danger, etc.)
    if (message.content.type === 'enemy_spotted') {
      entity.alertLevel = Math.min(1, entity.alertLevel + 0.3);
      entity.lastKnownEnemyPosition = message.content.position;
    }
  }

  handleHelpRequest(entity, message) {
    // Process help requests from allies
    const sender = this.gameEngine.entities.get(message.from);
    if (sender && this.isAlly(entity, sender)) {
      entity.helpRequests = entity.helpRequests || [];
      entity.helpRequests.push({
        from: message.from,
        position: message.content.position,
        urgency: message.content.urgency || 0.5,
        timestamp: message.timestamp
      });
    }
  }

  handleInformationSharing(entity, message) {
    // Process shared information
    entity.sharedInformation = entity.sharedInformation || [];
    entity.sharedInformation.push(message.content);
  }

  handleAttackCoordination(entity, message) {
    // Process attack coordination messages
    if (message.content.target && message.content.action) {
      entity.coordinatedActions = entity.coordinatedActions || [];
      entity.coordinatedActions.push({
        target: message.content.target,
        action: message.content.action,
        timestamp: message.timestamp
      });
    }
  }

  isAlly(entity1, entity2) {
    return entity1.faction === entity2.faction ||
           entity1.team === entity2.team ||
           entity1.loyalty > 0.5;
  }

  update() {
    // Clean up old messages
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    for (const [entityId, messages] of this.messages) {
      this.messages.set(entityId,
        messages.filter(message => (now - message.timestamp) < fiveMinutes)
      );
    }
  }
}

// Behavior Tree Implementation
class BehaviorTree {
  constructor(config) {
    this.root = config.root;
  }

  execute(context) {
    return this.root.execute(context);
  }
}

class BehaviorNode {
  constructor() {
    this.children = [];
    this.status = 'ready'; // ready, running, success, failure
  }

  execute(context) {
    throw new Error('Execute method must be implemented');
  }

  addChild(node) {
    this.children.push(node);
  }
}

class SelectorNode extends BehaviorNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  execute(context) {
    for (const child of this.children) {
      const result = child.execute(context);
      if (result === 'success' || result === 'running') {
        return result;
      }
    }
    return 'failure';
  }
}

class SequenceNode extends BehaviorNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  execute(context) {
    for (const child of this.children) {
      const result = child.execute(context);
      if (result === 'failure' || result === 'running') {
        return result;
      }
    }
    return 'success';
  }
}

class ParallelNode extends BehaviorNode {
  constructor(children = []) {
    super();
    this.children = children;
  }

  execute(context) {
    let successCount = 0;
    let failureCount = 0;
    
    for (const child of this.children) {
      const result = child.execute(context);
      if (result === 'success') successCount++;
      if (result === 'failure') failureCount++;
    }
    
    if (successCount === this.children.length) return 'success';
    if (failureCount > 0) return 'failure';
    return 'running';
  }
}

class ConditionNode extends BehaviorNode {
  constructor(conditionName) {
    super();
    this.conditionName = conditionName;
  }

  execute(context) {
    const result = this.evaluateCondition(context);
    return result ? 'success' : 'failure';
  }

  evaluateCondition(context) {
    const { entity, perception, memory, emotions } = context;
    
    switch (this.conditionName) {
      case 'enemyInRange':
        return perception.nearbyEnemies.length > 0;
      
      case 'hearNoise':
        return perception.sounds.length > 0;
      
      case 'playerNearby':
        return perception.nearbyPlayers.length > 0;
      
      case 'inventoryFull':
        return entity.inventory && entity.inventory.length >= entity.maxInventory;
      
      case 'healthLow':
        return entity.health < entity.maxHealth * 0.3;
      
      case 'playerInRange':
        return perception.nearbyPlayers.some(p => p.distance < 30);
      
      case 'heardSound':
        return perception.sounds.some(s => s.type === 'footsteps' || s.type === 'combat');
      
      case 'masterInDanger':
        if (entity.master) {
          const master = perception.nearbyPlayers.find(p => p.id === entity.master);
          return master && master.health < master.maxHealth * 0.5;
        }
        return false;
      
      case 'masterAttacking':
        if (entity.master) {
          const master = perception.nearbyPlayers.find(p => p.id === entity.master);
          return master && master.inCombat;
        }
        return false;
      
      case 'tooFarFromMaster':
        if (entity.master) {
          const master = perception.nearbyPlayers.find(p => p.id === entity.master);
          return master && master.distance > 50;
        }
        return false;
      
      default:
        return false;
    }
  }
}

class ActionNode extends BehaviorNode {
  constructor(actionName) {
    super();
    this.actionName = actionName;
  }

  execute(context) {
    return this.performAction(context);
  }

  performAction(context) {
    const { entity, perception, gameEngine } = context;
    
    switch (this.actionName) {
      case 'engage':
        return this.engageEnemy(entity, perception.nearbyEnemies[0], gameEngine);
      
      case 'investigate':
        return this.investigate(entity, perception.sounds[0], gameEngine);
      
      case 'patrol':
        return this.patrol(entity, gameEngine);
      
      case 'greet':
        return this.greet(entity, perception.nearbyPlayers[0], gameEngine);
      
      case 'restockItems':
        return this.restockItems(entity, gameEngine);
      
      case 'idle':
        return this.idle(entity, gameEngine);
      
      case 'flee':
        return this.flee(entity, perception.nearbyEnemies, gameEngine);
      
      case 'attack':
        return this.attack(entity, perception.nearbyEnemies[0], gameEngine);
      
      case 'moveToPlayer':
        return this.moveToPlayer(entity, perception.nearbyPlayers[0], gameEngine);
      
      case 'wander':
        return this.wander(entity, gameEngine);
      
      case 'defendMaster':
        return this.defendMaster(entity, perception, gameEngine);
      
      case 'assistAttack':
        return this.assistAttack(entity, perception, gameEngine);
      
      case 'followMaster':
        return this.followMaster(entity, perception, gameEngine);
      
      default:
        return 'failure';
    }
  }

  engageEnemy(entity, enemy, gameEngine) {
    if (!enemy) return 'failure';
    
    entity.currentTarget = enemy.id;
    entity.state = 'combat';
    entity.lastAction = 'engage';
    entity.lastActionTime = Date.now();
    
    return 'success';
  }

  investigate(entity, sound, gameEngine) {
    if (!sound) return 'failure';
    
    entity.currentGoal = sound.position;
    entity.state = 'investigating';
    entity.lastAction = 'investigate';
    entity.lastActionTime = Date.now();
    
    return 'running';
  }

  patrol(entity, gameEngine) {
    if (!entity.patrolRoute || entity.patrolRoute.length === 0) {
      // Generate random patrol route
      entity.patrolRoute = this.generatePatrolRoute(entity.position);
      entity.currentPatrolIndex = 0;
    }
    
    entity.currentGoal = entity.patrolRoute[entity.currentPatrolIndex];
    entity.state = 'patrolling';
    entity.lastAction = 'patrol';
    entity.lastActionTime = Date.now();
    
    // Check if reached current patrol point
    const distance = this.calculateDistance(entity.position, entity.currentGoal);
    if (distance < 5) {
      entity.currentPatrolIndex = (entity.currentPatrolIndex + 1) % entity.patrolRoute.length;
    }
    
    return 'running';
  }

  greet(entity, player, gameEngine) {
    if (!player) return 'failure';
    
    // Send greeting message to player
    gameEngine.chatSystem.sendSystemMessage(player.id, 
      `${entity.name}: Hello there, ${player.name}!`);
    
    entity.lastGreetedPlayer = player.id;
    entity.lastGreetTime = Date.now();
    entity.lastAction = 'greet';
    entity.lastActionTime = Date.now();
    
    return 'success';
  }

  restockItems(entity, gameEngine) {
    if (entity.type !== 'merchant') return 'failure';
    
    // Restock merchant inventory
    entity.restockCooldown = Date.now() + (30 * 60 * 1000); // 30 minutes
    entity.lastAction = 'restock';
    entity.lastActionTime = Date.now();
    
    // Trigger restock logic in merchant system
    gameEngine.merchantSystem?.restockMerchant(entity.id);
    
    return 'success';
  }

  idle(entity, gameEngine) {
    entity.state = 'idle';
    entity.lastAction = 'idle';
    entity.lastActionTime = Date.now();
    
    // Random idle animations or sounds
    if (Math.random() < 0.1) {
      entity.animation = entity.idleAnimations?.[
        Math.floor(Math.random() * entity.idleAnimations.length)
      ] || 'idle';
    }
    
    return 'success';
  }

  flee(entity, enemies, gameEngine) {
    if (!enemies || enemies.length === 0) return 'failure';
    
    // Calculate flee direction (opposite of enemies)
    let fleeX = 0, fleeY = 0;
    
    enemies.forEach(enemy => {
      const dx = entity.position.x - enemy.position.x;
      const dy = entity.position.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        fleeX += dx / distance;
        fleeY += dy / distance;
      }
    });
    
    // Normalize flee direction
    const fleeDistance = Math.sqrt(fleeX * fleeX + fleeY * fleeY);
    if (fleeDistance > 0) {
      fleeX /= fleeDistance;
      fleeY /= fleeDistance;
    }
    
    // Set flee destination
    entity.currentGoal = {
      x: entity.position.x + fleeX * 100,
      y: entity.position.y + fleeY * 100
    };
    
    entity.state = 'fleeing';
    entity.lastAction = 'flee';
    entity.lastActionTime = Date.now();
    
    return 'running';
  }

  attack(entity, enemy, gameEngine) {
    if (!enemy) return 'failure';
    
    // Check if in attack range
    if (enemy.distance > entity.attackRange) {
      return 'failure';
    }
    
    // Check attack cooldown
    if (entity.lastAttackTime && 
        Date.now() - entity.lastAttackTime < entity.attackCooldown) {
      return 'running';
    }
    
    // Perform attack
    gameEngine.battleSystem.performAttack(entity.id, enemy.id);
    
    entity.lastAttackTime = Date.now();
    entity.lastAction = 'attack';
    entity.lastActionTime = Date.now();
    
    return 'success';
  }

  moveToPlayer(entity, player, gameEngine) {
    if (!player) return 'failure';
    
    entity.currentGoal = player.position;
    entity.state = 'moving';
    entity.lastAction = 'moveToPlayer';
    entity.lastActionTime = Date.now();
    
    return 'running';
  }

  wander(entity, gameEngine) {
    // Generate random nearby destination
    if (!entity.wanderTarget || 
        this.calculateDistance(entity.position, entity.wanderTarget) < 10) {
      
      entity.wanderTarget = {
        x: entity.position.x + (Math.random() - 0.5) * 100,
        y: entity.position.y + (Math.random() - 0.5) * 100
      };
    }
    
    entity.currentGoal = entity.wanderTarget;
    entity.state = 'wandering';
    entity.lastAction = 'wander';
    entity.lastActionTime = Date.now();
    
    return 'running';
  }

  defendMaster(entity, perception, gameEngine) {
    if (!entity.master) return 'failure';
    
    const master = perception.nearbyPlayers.find(p => p.id === entity.master);
    if (!master) return 'failure';
    
    // Find threats to master
    const threats = perception.nearbyEnemies.filter(e => 
      this.calculateDistance(e.position, master.position) < 50
    );
    
    if (threats.length > 0) {
      entity.currentTarget = threats[0].id;
      entity.currentGoal = threats[0].position;
      entity.state = 'defending';
      entity.lastAction = 'defendMaster';
      entity.lastActionTime = Date.now();
      
      return 'running';
    }
    
    return 'failure';
  }

  assistAttack(entity, perception, gameEngine) {
    if (!entity.master) return 'failure';
    
    const master = perception.nearbyPlayers.find(p => p.id === entity.master);
    if (!master || !master.currentTarget) return 'failure';
    
    entity.currentTarget = master.currentTarget;
    entity.state = 'assisting';
    entity.lastAction = 'assistAttack';
    entity.lastActionTime = Date.now();
    
    return 'running';
  }

  followMaster(entity, perception, gameEngine) {
    if (!entity.master) return 'failure';
    
    const master = perception.nearbyPlayers.find(p => p.id === entity.master);
    if (!master) return 'failure';
    
    // Follow at a comfortable distance
    const followDistance = 20;
    const dx = master.position.x - entity.position.x;
    const dy = master.position.y - entity.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > followDistance) {
      // Move closer to master
      const ratio = (distance - followDistance) / distance;
      entity.currentGoal = {
        x: entity.position.x + dx * ratio,
        y: entity.position.y + dy * ratio
      };
      
      entity.state = 'following';
      entity.lastAction = 'followMaster';
      entity.lastActionTime = Date.now();
      
      return 'running';
    }
    
    return 'success';
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  generatePatrolRoute(startPosition) {
    const route = [];
    const routePoints = 4;
    const routeRadius = 50;
    
    for (let i = 0; i < routePoints; i++) {
      const angle = (i / routePoints) * Math.PI * 2;
      route.push({
        x: startPosition.x + Math.cos(angle) * routeRadius,
        y: startPosition.y + Math.sin(angle) * routeRadius
      });
    }
    
    return route;
  }
}

// Machine Learning Models (Simplified implementations)
class CombatAI {
  constructor(config) {
    this.config = config;
    this.weights = this.initializeWeights();
    this.bias = this.initializeBias();
  }

  initializeWeights() {
    // Initialize neural network weights
    const weights = [];
    let prevSize = this.config.inputSize;
    
    for (const hiddenSize of this.config.hiddenLayers) {
      weights.push(this.randomMatrix(prevSize, hiddenSize));
      prevSize = hiddenSize;
    }
    
    weights.push(this.randomMatrix(prevSize, this.config.outputSize));
    return weights;
  }

  initializeBias() {
    const bias = [];
    
    for (const hiddenSize of this.config.hiddenLayers) {
      bias.push(this.randomArray(hiddenSize));
    }
    
    bias.push(this.randomArray(this.config.outputSize));
    return bias;
  }

  predict(input) {
    let activation = input;
    
    for (let i = 0; i < this.weights.length; i++) {
      activation = this.matrixMultiply(activation, this.weights[i]);
      activation = this.addBias(activation, this.bias[i]);
      
      if (i < this.weights.length - 1) {
        activation = this.relu(activation);
      } else {
        activation = this.softmax(activation);
      }
    }
    
    return activation;
  }

  train(trainingData) {
    // Simplified training - in reality would use backpropagation
    const prediction = this.predict(trainingData.input);
    const error = this.calculateError(prediction, trainingData.output);
    
    // Update weights (simplified gradient descent)
    this.updateWeights(error);
  }

  // Utility methods for neural network operations
  randomMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() - 0.5) * 2;
      }
    }
    return matrix;
  }

  randomArray(size) {
    return new Array(size).fill(0).map(() => (Math.random() - 0.5) * 2);
  }

  matrixMultiply(a, b) {
    // Simplified matrix multiplication
    if (!Array.isArray(a)) a = [a];
    const result = [];
    
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < b.length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return result.length === 1 ? result[0] : result;
  }

  addBias(activation, bias) {
    return activation.map((val, i) => val + bias[i]);
  }

  relu(arr) {
    return arr.map(val => Math.max(0, val));
  }

  softmax(arr) {
    const max = Math.max(...arr);
    const exp = arr.map(val => Math.exp(val - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(val => val / sum);
  }

  calculateError(prediction, target) {
    return prediction.map((pred, i) => target[i] - pred);
  }

  updateWeights(error) {
    // Simplified weight update
    const learningRate = this.config.learningRate;
    
    for (let i = 0; i < this.weights.length; i++) {
      for (let j = 0; j < this.weights[i].length; j++) {
        for (let k = 0; k < this.weights[i][j].length; k++) {
          this.weights[i][j][k] += learningRate * error[k] * 0.1;
        }
      }
    }
  }
}

class MovementPredictor extends CombatAI {
  constructor(config) {
    super(config);
  }

  predictMovement(entity, perception) {
    const input = this.prepareMovementInput(entity, perception);
    return this.predict(input);
  }

  prepareMovementInput(entity, perception) {
    return [
      entity.position.x / 1000,
      entity.position.y / 1000,
      entity.velocity.x,
      entity.velocity.y,
      perception.nearbyEnemies.length,
      perception.nearbyAllies.length,
      perception.environment.visibility,
      perception.environment.coverAvailable ? 1 : 0,
      entity.health / entity.maxHealth,
      entity.stamina / entity.maxStamina,
      entity.fear || 0,
      entity.aggression || 0
    ];
  }
}

class PlayerBehaviorAnalyzer extends CombatAI {
  constructor(config) {
    super(config);
    this.playerProfiles = new Map();
  }

  analyzePlayer(playerId, actions) {
    let profile = this.playerProfiles.get(playerId);
    if (!profile) {
      profile = {
        aggression: 0.5,
        caution: 0.5,
        exploration: 0.5,
        social: 0.5,
        economic: 0.5,
        skill: 0.5,
        patterns: []
      };
      this.playerProfiles.set(playerId, profile);
    }
    
    // Update profile based on recent actions
    this.updatePlayerProfile(profile, actions);
    
    return profile;
  }

  updatePlayerProfile(profile, actions) {
    actions.forEach(action => {
      switch (action.type) {
        case 'attack':
          profile.aggression = Math.min(1, profile.aggression + 0.1);
          break;
        case 'flee':
          profile.caution = Math.min(1, profile.caution + 0.1);
          break;
        case 'explore':
          profile.exploration = Math.min(1, profile.exploration + 0.1);
          break;
        case 'chat':
          profile.social = Math.min(1, profile.social + 0.05);
          break;
        case 'trade':
          profile.economic = Math.min(1, profile.economic + 0.1);
          break;
      }
    });
    
    // Store action patterns
    profile.patterns.push({
      actions: actions.map(a => a.type),
      timestamp: Date.now()
    });
    
    // Limit pattern history
    if (profile.patterns.length > 100) {
      profile.patterns = profile.patterns.slice(-100);
    }
  }

  predictPlayerAction(playerId, currentSituation) {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return null;
    
    const input = this.preparePlayerInput(profile, currentSituation);
    return this.predict(input);
  }

  preparePlayerInput(profile, situation) {
    return [
      profile.aggression,
      profile.caution,
      profile.exploration,
      profile.social,
      profile.economic,
      profile.skill,
      situation.threatsNearby ? 1 : 0,
      situation.alliesNearby ? 1 : 0,
      situation.resourcesNearby ? 1 : 0,
      situation.questObjectivesNearby ? 1 : 0,
      situation.health,
      situation.mana,
      situation.timeOfDay / 24,
      situation.playerLevel / 100,
      situation.wealth / 10000,
      ...new Array(15).fill(0) // Padding to reach input size
    ].slice(0, 30);
  }
}

class EconomicAI extends CombatAI {
  constructor(config) {
    super(config);
    this.marketData = new Map();
    this.priceHistory = new Map();
  }

  analyzeMarket(marketState) {
    const input = this.prepareMarketInput(marketState);
    const prediction = this.predict(input);
    
    return {
      buySignal: prediction[0],
      sellSignal: prediction[1],
      holdSignal: prediction[2],
      priceDirection: prediction[3] > 0.5 ? 'up' : 'down',
      confidence: Math.max(...prediction)
    };
  }

  prepareMarketInput(marketState) {
    return [
      marketState.currentPrice / 1000,
      marketState.volume / 10000,
      marketState.volatility,
      marketState.trend,
      marketState.demand / 1000,
      marketState.supply / 1000,
      marketState.timeOfDay / 24,
      marketState.dayOfWeek / 7,
      marketState.seasonalFactor,
      marketState.eventFactor,
      marketState.playerActivity,
      marketState.economicHealth,
      marketState.inflationRate,
      marketState.interestRate,
      marketState.competitionLevel,
      marketState.marketSentiment,
      marketState.technicalIndicator1,
      marketState.technicalIndicator2,
      marketState.fundamentalIndicator1,
      marketState.fundamentalIndicator2,
      marketState.riskFactor,
      marketState.liquidityLevel,
      marketState.marketDepth,
      marketState.spreadSize,
      marketState.orderBookBalance
    ];
  }

  updateMarketData(itemId, price, volume, timestamp) {
    if (!this.priceHistory.has(itemId)) {
      this.priceHistory.set(itemId, []);
    }
    
    const history = this.priceHistory.get(itemId);
    history.push({ price, volume, timestamp });
    
    // Keep only recent history
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  calculateMarketTrend(itemId) {
    const history = this.priceHistory.get(itemId);
    if (!history || history.length < 10) return 0;
    
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, data) => sum + data.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, data) => sum + data.price, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }
}

class PathfindingGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(height).fill(null).map(() => new Array(width).fill(0));
  }

  setObstacle(x, y) {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = 1;
    }
  }

  removeObstacle(x, y) {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = 0;
    }
  }

  isObstacle(x, y) {
    if (!this.isValidPosition(x, y)) return true;
    return this.grid[y][x] === 1;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (this.isValidPosition(nx, ny) && !this.isObstacle(nx, ny)) {
        neighbors.push({ x: nx, y: ny, cost: Math.abs(dx) + Math.abs(dy) === 2 ? 1.414 : 1 });
      }
    }
    
    return neighbors;
  }
}
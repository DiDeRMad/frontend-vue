import { EventEmitter } from 'events'

export class WorldManager extends EventEmitter {
  constructor(io) {
    super()
    this.io = io
    this.zones = new Map()
    this.locations = new Map()
    this.npcs = new Map()
    this.worldObjects = new Map()
    this.spawns = new Map()
    this.weather = {
      current: 'clear',
      temperature: 20,
      humidity: 50,
      windSpeed: 5,
      precipitation: 0
    }
    this.worldEvents = new Map()
    this.playerLocations = new Map()
    this.regionInstances = new Map()
  }

  async initialize() {
    console.log('Initializing World Manager...')
    
    await this.loadWorldData()
    await this.initializeZones()
    await this.spawnNPCs()
    await this.spawnWorldObjects()
    this.initializeWeatherSystem()
    
    // Start periodic updates
    setInterval(() => {
      this.updateWeather()
      this.updateNPCs()
      this.updateWorldEvents()
    }, 30000) // Update every 30 seconds

    console.log('World Manager initialized')
  }

  async loadWorldData() {
    // In a real implementation, this would load from database
    // For now, we'll create some default zones
    this.createDefaultZones()
    this.createDefaultLocations()
  }

  createDefaultZones() {
    const zones = [
      {
        id: 'elven_forest',
        name: 'Elven Forest',
        description: 'A mystical forest inhabited by ancient elves',
        level: { min: 1, max: 10 },
        type: 'forest',
        weather: ['clear', 'rain', 'fog'],
        climate: 'temperate',
        dangerLevel: 1,
        resources: ['wood', 'herbs', 'mushrooms'],
        boundaries: {
          x: { min: 0, max: 1000 },
          y: { min: 0, max: 1000 },
          z: { min: 0, max: 100 }
        }
      },
      {
        id: 'human_capital',
        name: 'Valoria',
        description: 'The grand capital city of the human kingdom',
        level: { min: 1, max: 100 },
        type: 'city',
        weather: ['clear', 'rain'],
        climate: 'temperate',
        dangerLevel: 0,
        resources: ['goods', 'services', 'information'],
        boundaries: {
          x: { min: 1000, max: 2000 },
          y: { min: 0, max: 1000 },
          z: { min: 0, max: 200 }
        }
      },
      {
        id: 'dwarven_mountains',
        name: 'Ironpeak Mountains',
        description: 'Towering mountains rich in minerals and dwarven culture',
        level: { min: 5, max: 25 },
        type: 'mountain',
        weather: ['clear', 'snow', 'blizzard'],
        climate: 'cold',
        dangerLevel: 2,
        resources: ['ore', 'gems', 'stone'],
        boundaries: {
          x: { min: 2000, max: 3000 },
          y: { min: 0, max: 1000 },
          z: { min: 0, max: 500 }
        }
      },
      {
        id: 'orc_wastelands',
        name: 'Blighted Wastelands',
        description: 'Desolate lands controlled by orc tribes',
        level: { min: 15, max: 40 },
        type: 'wasteland',
        weather: ['clear', 'sandstorm', 'heat'],
        climate: 'arid',
        dangerLevel: 4,
        resources: ['scrap', 'bones', 'dark_herbs'],
        boundaries: {
          x: { min: 3000, max: 4000 },
          y: { min: 0, max: 1000 },
          z: { min: 0, max: 50 }
        }
      },
      {
        id: 'dragon_peaks',
        name: 'Dragon\'s Crown',
        description: 'The highest peaks where ancient dragons dwell',
        level: { min: 50, max: 100 },
        type: 'mountain',
        weather: ['clear', 'storm', 'volcanic'],
        climate: 'extreme',
        dangerLevel: 5,
        resources: ['dragon_scales', 'rare_gems', 'ancient_artifacts'],
        boundaries: {
          x: { min: 4000, max: 5000 },
          y: { min: 0, max: 1000 },
          z: { min: 0, max: 1000 }
        }
      }
    ]

    zones.forEach(zoneData => {
      this.zones.set(zoneData.id, {
        ...zoneData,
        players: new Set(),
        monsters: new Map(),
        objects: new Map(),
        events: new Map(),
        lastUpdate: Date.now()
      })
    })
  }

  createDefaultLocations() {
    const locations = [
      // Elven Forest locations
      {
        id: 'elven_grove',
        zoneId: 'elven_forest',
        name: 'Sacred Grove',
        description: 'A peaceful clearing where elves gather',
        position: { x: 500, y: 500, z: 0 },
        type: 'landmark',
        services: ['healer', 'vendor'],
        npcs: ['elven_elder', 'herb_vendor']
      },
      {
        id: 'forest_entrance',
        zoneId: 'elven_forest',
        name: 'Forest Gate',
        description: 'The main entrance to the elven territory',
        position: { x: 100, y: 500, z: 0 },
        type: 'entrance',
        connections: ['human_capital']
      },

      // Human Capital locations
      {
        id: 'valoria_center',
        zoneId: 'human_capital',
        name: 'Central Plaza',
        description: 'The bustling heart of Valoria',
        position: { x: 1500, y: 500, z: 0 },
        type: 'plaza',
        services: ['bank', 'auction', 'guild_hall', 'inn'],
        npcs: ['town_crier', 'banker', 'auctioneer']
      },
      {
        id: 'valoria_market',
        zoneId: 'human_capital',
        name: 'Grand Market',
        description: 'A vast marketplace with goods from across the realm',
        position: { x: 1300, y: 300, z: 0 },
        type: 'market',
        services: ['vendor', 'blacksmith', 'enchanter'],
        npcs: ['merchant_leader', 'weapon_smith', 'armor_smith']
      },

      // Dwarven Mountains locations
      {
        id: 'ironpeak_hall',
        zoneId: 'dwarven_mountains',
        name: 'Great Hall of Ironpeak',
        description: 'The magnificent dwarven stronghold',
        position: { x: 2500, y: 500, z: 200 },
        type: 'stronghold',
        services: ['forge', 'mining_guild', 'tavern'],
        npcs: ['dwarf_king', 'master_smith', 'mining_captain']
      }
    ]

    locations.forEach(locationData => {
      this.locations.set(locationData.id, {
        ...locationData,
        players: new Set(),
        objects: new Map(),
        lastVisited: null
      })
    })
  }

  async initializeZones() {
    for (const [zoneId, zone] of this.zones) {
      // Initialize zone-specific data
      zone.monsters = this.generateMonsters(zone)
      zone.resources = this.generateResources(zone)
      zone.weather = this.generateWeather(zone)
      
      console.log(`Initialized zone: ${zone.name}`)
    }
  }

  generateMonsters(zone) {
    const monsters = new Map()
    const monsterTypes = this.getMonsterTypesForZone(zone)
    
    // Spawn monsters based on zone level and type
    for (let i = 0; i < 10; i++) {
      const monsterId = `${zone.id}_monster_${i}`
      const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)]
      
      monsters.set(monsterId, {
        id: monsterId,
        type: monsterType,
        level: zone.level.min + Math.floor(Math.random() * (zone.level.max - zone.level.min)),
        position: this.generateRandomPosition(zone),
        health: 100,
        maxHealth: 100,
        aggressive: Math.random() > 0.5,
        respawnTime: 60000, // 1 minute
        lastSeen: Date.now()
      })
    }
    
    return monsters
  }

  getMonsterTypesForZone(zone) {
    const monsterTypes = {
      forest: ['wolf', 'bear', 'spider', 'treant'],
      city: ['rat', 'thief', 'guard'],
      mountain: ['goblin', 'orc', 'dragon', 'giant'],
      wasteland: ['scorpion', 'vulture', 'bandit', 'demon'],
      desert: ['snake', 'sandworm', 'djinn']
    }
    
    return monsterTypes[zone.type] || ['generic_monster']
  }

  generateResources(zone) {
    const resources = new Map()
    
    zone.resources.forEach((resourceType, index) => {
      for (let i = 0; i < 5; i++) {
        const resourceId = `${zone.id}_${resourceType}_${i}`
        resources.set(resourceId, {
          id: resourceId,
          type: resourceType,
          position: this.generateRandomPosition(zone),
          amount: 1 + Math.floor(Math.random() * 3),
          respawnTime: 300000, // 5 minutes
          lastHarvested: null
        })
      }
    })
    
    return resources
  }

  generateRandomPosition(zone) {
    return {
      x: zone.boundaries.x.min + Math.random() * (zone.boundaries.x.max - zone.boundaries.x.min),
      y: zone.boundaries.y.min + Math.random() * (zone.boundaries.y.max - zone.boundaries.y.min),
      z: zone.boundaries.z.min + Math.random() * (zone.boundaries.z.max - zone.boundaries.z.min)
    }
  }

  generateWeather(zone) {
    const possibleWeather = zone.weather
    return {
      current: possibleWeather[Math.floor(Math.random() * possibleWeather.length)],
      temperature: this.generateTemperature(zone.climate),
      nextChange: Date.now() + (30 + Math.random() * 60) * 60000 // 30-90 minutes
    }
  }

  generateTemperature(climate) {
    const tempRanges = {
      tropical: { min: 25, max: 35 },
      temperate: { min: 10, max: 25 },
      cold: { min: -10, max: 10 },
      arid: { min: 20, max: 40 },
      extreme: { min: -20, max: 50 }
    }
    
    const range = tempRanges[climate] || tempRanges.temperate
    return range.min + Math.random() * (range.max - range.min)
  }

  async spawnNPCs() {
    const npcData = [
      {
        id: 'elven_elder',
        name: 'Elder Thalion',
        type: 'quest_giver',
        level: 50,
        location: 'elven_grove',
        dialogue: 'Welcome, traveler. The forest has been restless lately...',
        services: ['quests', 'lore'],
        faction: 'elves'
      },
      {
        id: 'town_crier',
        name: 'Harold the Crier',
        type: 'information',
        level: 10,
        location: 'valoria_center',
        dialogue: 'Hear ye, hear ye! Latest news from across the realm!',
        services: ['news', 'directions'],
        faction: 'humans'
      },
      {
        id: 'dwarf_king',
        name: 'King Thorin Ironbeard',
        type: 'ruler',
        level: 80,
        location: 'ironpeak_hall',
        dialogue: 'The mountains have been our home for centuries...',
        services: ['royal_quests', 'diplomacy'],
        faction: 'dwarves'
      }
    ]

    npcData.forEach(npc => {
      this.npcs.set(npc.id, {
        ...npc,
        position: this.getLocationPosition(npc.location),
        lastInteraction: null,
        currentDialogue: npc.dialogue,
        mood: 'neutral'
      })
    })
  }

  getLocationPosition(locationId) {
    const location = this.locations.get(locationId)
    return location ? location.position : { x: 0, y: 0, z: 0 }
  }

  async spawnWorldObjects() {
    // Spawn interactive objects in the world
    const objects = [
      {
        id: 'elven_fountain',
        name: 'Moonwell Fountain',
        type: 'healing_fountain',
        position: { x: 500, y: 500, z: 0 },
        zoneId: 'elven_forest',
        effect: 'heal',
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'ancient_tree',
        name: 'World Tree',
        type: 'landmark',
        position: { x: 600, y: 600, z: 0 },
        zoneId: 'elven_forest',
        effect: 'wisdom_buff',
        cooldown: 0
      }
    ]

    objects.forEach(obj => {
      this.worldObjects.set(obj.id, {
        ...obj,
        lastUsed: null,
        usedBy: new Set()
      })
    })
  }

  initializeWeatherSystem() {
    // Update weather periodically
    setInterval(() => {
      this.updateGlobalWeather()
    }, 600000) // Update every 10 minutes
  }

  updateWeather() {
    for (const [zoneId, zone] of this.zones) {
      if (Date.now() > zone.weather.nextChange) {
        const newWeather = zone.weather[Math.floor(Math.random() * zone.weather.length)]
        zone.weather.current = newWeather
        zone.weather.temperature = this.generateTemperature(zone.climate)
        zone.weather.nextChange = Date.now() + (30 + Math.random() * 60) * 60000

        // Notify players in the zone
        this.broadcastToZone(zoneId, 'weather_change', {
          zone: zoneId,
          weather: zone.weather
        })
      }
    }
  }

  updateGlobalWeather() {
    // Update global weather patterns
    this.weather.temperature += (Math.random() - 0.5) * 5
    this.weather.humidity += (Math.random() - 0.5) * 10
    this.weather.windSpeed += (Math.random() - 0.5) * 3

    // Clamp values
    this.weather.temperature = Math.max(-20, Math.min(50, this.weather.temperature))
    this.weather.humidity = Math.max(0, Math.min(100, this.weather.humidity))
    this.weather.windSpeed = Math.max(0, Math.min(20, this.weather.windSpeed))
  }

  updateNPCs() {
    for (const [npcId, npc] of this.npcs) {
      // Simple NPC behavior - they might move or change dialogue
      if (Math.random() < 0.1) { // 10% chance to do something
        this.updateNPCBehavior(npc)
      }
    }
  }

  updateNPCBehavior(npc) {
    // Simple random behavior
    const behaviors = ['idle', 'patrol', 'interact']
    const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
    
    switch (behavior) {
      case 'patrol':
        // Move NPC slightly
        npc.position.x += (Math.random() - 0.5) * 10
        npc.position.y += (Math.random() - 0.5) * 10
        break
      case 'interact':
        // Change mood or dialogue
        const moods = ['happy', 'neutral', 'concerned', 'excited']
        npc.mood = moods[Math.floor(Math.random() * moods.length)]
        break
    }
  }

  updateWorldEvents() {
    // Check for and update world events
    for (const [eventId, event] of this.worldEvents) {
      if (Date.now() > event.endTime) {
        this.endWorldEvent(eventId)
      }
    }
  }

  // Player movement and zone management
  movePlayer(playerId, newPosition, zoneId) {
    const oldZone = this.getPlayerZone(playerId)
    
    if (oldZone && oldZone !== zoneId) {
      this.removePlayerFromZone(playerId, oldZone)
    }
    
    this.addPlayerToZone(playerId, zoneId)
    this.playerLocations.set(playerId, { position: newPosition, zone: zoneId })
    
    // Notify other players in the zone
    this.broadcastToZone(zoneId, 'player_moved', {
      playerId,
      position: newPosition
    }, playerId)
    
    return this.getZoneData(zoneId)
  }

  addPlayerToZone(playerId, zoneId) {
    const zone = this.zones.get(zoneId)
    if (zone) {
      zone.players.add(playerId)
      
      // Send zone information to player
      this.io.to(playerId).emit('zone_entered', {
        zone: this.getZoneData(zoneId),
        players: Array.from(zone.players).filter(id => id !== playerId),
        monsters: Array.from(zone.monsters.values()),
        objects: Array.from(zone.objects.values())
      })
    }
  }

  removePlayerFromZone(playerId, zoneId) {
    const zone = this.zones.get(zoneId)
    if (zone) {
      zone.players.delete(playerId)
      
      // Notify other players
      this.broadcastToZone(zoneId, 'player_left', { playerId })
    }
  }

  getPlayerZone(playerId) {
    const location = this.playerLocations.get(playerId)
    return location ? location.zone : null
  }

  getZoneData(zoneId) {
    const zone = this.zones.get(zoneId)
    if (!zone) return null
    
    return {
      id: zoneId,
      name: zone.name,
      description: zone.description,
      level: zone.level,
      type: zone.type,
      weather: zone.weather,
      boundaries: zone.boundaries,
      locations: Array.from(this.locations.values()).filter(loc => loc.zoneId === zoneId)
    }
  }

  broadcastToZone(zoneId, event, data, excludePlayer = null) {
    const zone = this.zones.get(zoneId)
    if (zone) {
      zone.players.forEach(playerId => {
        if (playerId !== excludePlayer) {
          this.io.to(playerId).emit(event, data)
        }
      })
    }
  }

  // World events
  startWorldEvent(eventData) {
    const eventId = eventData.id || `event_${Date.now()}`
    
    this.worldEvents.set(eventId, {
      id: eventId,
      type: eventData.type,
      name: eventData.name,
      description: eventData.description,
      zone: eventData.zone,
      startTime: Date.now(),
      endTime: Date.now() + (eventData.duration || 3600000), // Default 1 hour
      participants: new Set(),
      rewards: eventData.rewards || {},
      status: 'active'
    })
    
    // Notify all players
    this.io.emit('world_event_started', this.worldEvents.get(eventId))
    
    return eventId
  }

  endWorldEvent(eventId) {
    const event = this.worldEvents.get(eventId)
    if (event) {
      event.status = 'completed'
      
      // Distribute rewards to participants
      event.participants.forEach(playerId => {
        this.distributeEventRewards(playerId, event.rewards)
      })
      
      // Notify all players
      this.io.emit('world_event_ended', event)
      
      this.worldEvents.delete(eventId)
    }
  }

  distributeEventRewards(playerId, rewards) {
    // This would integrate with the player manager to give rewards
    this.emit('distribute_rewards', { playerId, rewards })
  }

  // Utility methods
  getPlayersInZone(zoneId) {
    const zone = this.zones.get(zoneId)
    return zone ? Array.from(zone.players) : []
  }

  getNPCsInZone(zoneId) {
    return Array.from(this.npcs.values()).filter(npc => {
      const location = this.locations.get(npc.location)
      return location && location.zoneId === zoneId
    })
  }

  getWorldState() {
    return {
      zones: Array.from(this.zones.keys()),
      activeEvents: Array.from(this.worldEvents.values()),
      weather: this.weather,
      playerCount: this.playerLocations.size
    }
  }

  shutdown() {
    console.log('Shutting down World Manager...')
    this.zones.clear()
    this.locations.clear()
    this.npcs.clear()
    this.worldObjects.clear()
    this.playerLocations.clear()
    this.worldEvents.clear()
  }
}
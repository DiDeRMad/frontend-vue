export const gameConfig = {
    // Server settings
    maxPlayersPerServer: parseInt(process.env.MAX_PLAYERS_PER_SERVER) || 1000,
    maxPlayersPerZone: 200,
    maxPlayersPerInstance: 50,
    serverTickRate: parseInt(process.env.WORLD_TICK_RATE) || 20,
    
    // World settings
    worldSize: {
        width: 10000,
        height: 10000,
        depth: 1000
    },
    chunkSize: 256,
    viewDistance: 5, // chunks
    spawnProtectionRadius: 100,
    
    // Time settings
    dayDuration: 24 * 60, // 24 minutes real time = 1 game day
    seasonDuration: 30, // days
    weatherChangeProbability: 0.1,
    
    // Physics settings
    physicsTickRate: parseInt(process.env.PHYSICS_TICK_RATE) || 60,
    gravity: { x: 0, y: -9.81, z: 0 },
    maxVelocity: 50,
    friction: 0.98,
    airResistance: 0.99,
    
    // Character settings
    character: {
        maxLevel: 100,
        startingLevel: 1,
        baseHealth: 100,
        baseMana: 50,
        baseStamina: 100,
        baseSpeed: 5,
        respawnTime: 30, // seconds
        invulnerabilityTime: 3, // seconds after respawn
        
        stats: {
            strength: { min: 1, max: 999, startingValue: 10 },
            agility: { min: 1, max: 999, startingValue: 10 },
            intelligence: { min: 1, max: 999, startingValue: 10 },
            vitality: { min: 1, max: 999, startingValue: 10 },
            wisdom: { min: 1, max: 999, startingValue: 10 },
            luck: { min: 1, max: 999, startingValue: 10 }
        },
        
        races: [
            { id: 'human', name: 'Human', bonuses: { vitality: 2, luck: 1 } },
            { id: 'elf', name: 'Elf', bonuses: { agility: 2, intelligence: 1 } },
            { id: 'dwarf', name: 'Dwarf', bonuses: { strength: 2, vitality: 1 } },
            { id: 'orc', name: 'Orc', bonuses: { strength: 3, vitality: -1 } },
            { id: 'undead', name: 'Undead', bonuses: { intelligence: 2, wisdom: 1 } },
            { id: 'dragonborn', name: 'Dragonborn', bonuses: { strength: 1, intelligence: 1, vitality: 1 } }
        ],
        
        classes: [
            { id: 'warrior', name: 'Warrior', primaryStat: 'strength', bonusStats: { strength: 3, vitality: 2 } },
            { id: 'mage', name: 'Mage', primaryStat: 'intelligence', bonusStats: { intelligence: 3, wisdom: 2 } },
            { id: 'rogue', name: 'Rogue', primaryStat: 'agility', bonusStats: { agility: 3, luck: 2 } },
            { id: 'cleric', name: 'Cleric', primaryStat: 'wisdom', bonusStats: { wisdom: 3, vitality: 2 } },
            { id: 'ranger', name: 'Ranger', primaryStat: 'agility', bonusStats: { agility: 2, strength: 2, luck: 1 } },
            { id: 'paladin', name: 'Paladin', primaryStat: 'strength', bonusStats: { strength: 2, wisdom: 2, vitality: 1 } },
            { id: 'necromancer', name: 'Necromancer', primaryStat: 'intelligence', bonusStats: { intelligence: 3, vitality: 2 } },
            { id: 'druid', name: 'Druid', primaryStat: 'wisdom', bonusStats: { wisdom: 2, intelligence: 2, vitality: 1 } }
        ]
    },
    
    // Combat settings
    combat: {
        globalCooldown: 1.5, // seconds
        maxTargetDistance: 100,
        criticalHitMultiplier: 2.0,
        blockChance: 0.25,
        parryChance: 0.15,
        dodgeChance: 0.1,
        
        damageTypes: ['physical', 'magical', 'fire', 'ice', 'lightning', 'poison', 'holy', 'shadow'],
        
        damageCalculation: {
            physical: (damage, attacker, defender) => {
                const defense = defender.stats.defense || 0;
                const reduction = defense / (defense + 100);
                return damage * (1 - reduction);
            },
            magical: (damage, attacker, defender) => {
                const resistance = defender.stats.magicResistance || 0;
                const reduction = resistance / (resistance + 100);
                return damage * (1 - reduction);
            }
        }
    },
    
    // AI settings
    aiUpdateRate: parseInt(process.env.AI_UPDATE_RATE) || 10,
    ai: {
        maxActiveNPCs: 5000,
        aggroRange: 30,
        leashRange: 100,
        patrolRadius: 50,
        respawnTime: 300, // seconds
        
        behaviors: {
            aggressive: { attackOnSight: true, pursueDistance: 100 },
            defensive: { attackOnSight: false, pursueDistance: 50 },
            passive: { attackOnSight: false, pursueDistance: 0 },
            boss: { attackOnSight: true, pursueDistance: 200, immuneToCC: true }
        }
    },
    
    // Economy settings
    economy: {
        startingGold: 100,
        maxGold: 999999999,
        vendorTaxRate: 0.05,
        auctionHouseTaxRate: 0.1,
        tradeTaxRate: 0.02,
        repairCostMultiplier: 0.1,
        
        currencies: [
            { id: 'gold', name: 'Gold', icon: '🪙' },
            { id: 'gems', name: 'Gems', icon: '💎', premium: true },
            { id: 'honor', name: 'Honor Points', icon: '⚔️', pvp: true },
            { id: 'tokens', name: 'Event Tokens', icon: '🎟️', event: true }
        ]
    },
    
    // Item settings
    items: {
        maxInventorySlots: 100,
        maxBankSlots: 500,
        maxMailItems: 50,
        itemQualities: [
            { id: 'common', name: 'Common', color: '#ffffff', dropRate: 0.7 },
            { id: 'uncommon', name: 'Uncommon', color: '#1eff00', dropRate: 0.2 },
            { id: 'rare', name: 'Rare', color: '#0070dd', dropRate: 0.08 },
            { id: 'epic', name: 'Epic', color: '#a335ee', dropRate: 0.019 },
            { id: 'legendary', name: 'Legendary', color: '#ff8000', dropRate: 0.001 },
            { id: 'artifact', name: 'Artifact', color: '#e6cc80', dropRate: 0.0001 }
        ],
        
        equipmentSlots: [
            'head', 'neck', 'shoulders', 'chest', 'back', 'wrists',
            'hands', 'waist', 'legs', 'feet', 'ring1', 'ring2',
            'trinket1', 'trinket2', 'mainHand', 'offHand'
        ]
    },
    
    // Quest settings
    quests: {
        maxActiveQuests: 25,
        maxDailyQuests: 10,
        questShareRange: 100,
        
        types: [
            { id: 'main', name: 'Main Story', icon: '📜', trackByDefault: true },
            { id: 'side', name: 'Side Quest', icon: '📋', trackByDefault: false },
            { id: 'daily', name: 'Daily Quest', icon: '📅', trackByDefault: true },
            { id: 'weekly', name: 'Weekly Quest', icon: '📆', trackByDefault: true },
            { id: 'event', name: 'Event Quest', icon: '🎉', trackByDefault: true },
            { id: 'class', name: 'Class Quest', icon: '🎓', trackByDefault: true }
        ],
        
        rewardMultipliers: {
            experience: 1.0,
            gold: 1.0,
            reputation: 1.0,
            items: 1.0
        }
    },
    
    // Guild settings
    guilds: {
        maxMembers: 500,
        maxRanks: 10,
        creationCost: 10000,
        maxBankTabs: 8,
        maxBankSlots: 98,
        
        permissions: [
            'invite', 'kick', 'promote', 'demote', 'editMOTD',
            'withdrawGold', 'depositItems', 'withdrawItems',
            'startGuildWar', 'editRanks', 'disbandGuild'
        ]
    },
    
    // PvP settings
    pvp: {
        enabled: process.env.ENABLE_PVP === 'true',
        minLevel: 10,
        flagDuration: 300, // seconds
        honorPerKill: 10,
        honorDecay: 0.1, // per week
        
        zones: [
            { id: 'arena', name: 'Arena', type: 'instance', maxPlayers: 10 },
            { id: 'battleground', name: 'Battleground', type: 'instance', maxPlayers: 40 },
            { id: 'openworld', name: 'Open World', type: 'persistent', maxPlayers: 200 }
        ],
        
        rankings: [
            { rank: 1, title: 'Private', honorRequired: 0 },
            { rank: 2, title: 'Corporal', honorRequired: 100 },
            { rank: 3, title: 'Sergeant', honorRequired: 500 },
            { rank: 4, title: 'Lieutenant', honorRequired: 1000 },
            { rank: 5, title: 'Captain', honorRequired: 2500 },
            { rank: 6, title: 'Major', honorRequired: 5000 },
            { rank: 7, title: 'Commander', honorRequired: 10000 },
            { rank: 8, title: 'General', honorRequired: 25000 },
            { rank: 9, title: 'Marshal', honorRequired: 50000 },
            { rank: 10, title: 'Grand Marshal', honorRequired: 100000 }
        ]
    },
    
    // Crafting settings
    crafting: {
        maxProfessions: 2,
        maxSkillLevel: 300,
        
        professions: [
            { id: 'blacksmithing', name: 'Blacksmithing', icon: '⚒️', creates: ['armor', 'weapons'] },
            { id: 'leatherworking', name: 'Leatherworking', icon: '🎽', creates: ['armor'] },
            { id: 'tailoring', name: 'Tailoring', icon: '🧵', creates: ['armor', 'bags'] },
            { id: 'engineering', name: 'Engineering', icon: '⚙️', creates: ['gadgets', 'bombs'] },
            { id: 'alchemy', name: 'Alchemy', icon: '⚗️', creates: ['potions', 'elixirs'] },
            { id: 'enchanting', name: 'Enchanting', icon: '✨', creates: ['enchantments'] },
            { id: 'jewelcrafting', name: 'Jewelcrafting', icon: '💍', creates: ['gems', 'jewelry'] },
            { id: 'inscription', name: 'Inscription', icon: '📝', creates: ['scrolls', 'glyphs'] },
            { id: 'cooking', name: 'Cooking', icon: '🍳', creates: ['food', 'drinks'] },
            { id: 'fishing', name: 'Fishing', icon: '🎣', creates: ['fish', 'materials'] }
        ]
    },
    
    // Social settings
    social: {
        maxFriends: 200,
        maxIgnored: 100,
        maxGuildApplications: 5,
        
        emoteRange: 50,
        chatChannels: [
            { id: 'general', name: 'General', color: '#ffffff', range: 100 },
            { id: 'trade', name: 'Trade', color: '#ffd700', global: true },
            { id: 'party', name: 'Party', color: '#66ccff', partyOnly: true },
            { id: 'guild', name: 'Guild', color: '#40ff40', guildOnly: true },
            { id: 'whisper', name: 'Whisper', color: '#ff66ff', private: true },
            { id: 'zone', name: 'Zone', color: '#ffcc66', zoneWide: true }
        ]
    },
    
    // Performance settings
    performance: {
        maxEntitiesPerChunk: 1000,
        entityCullingDistance: 200,
        lodDistances: [50, 100, 200, 500],
        shadowDistance: 100,
        maxParticles: 10000,
        maxDecals: 1000
    }
};
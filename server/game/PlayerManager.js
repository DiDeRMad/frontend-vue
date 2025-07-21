import { EventEmitter } from 'events';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class PlayerManager extends EventEmitter {
    constructor(io) {
        super();
        this.io = io;
        this.connectedPlayers = new Map();
        this.playerSessions = new Map();
        this.playerCache = new Map();
        
        // Player templates and configurations
        this.characterClasses = new Map();
        this.races = new Map();
        this.startingZones = new Map();
        
        // Player statistics
        this.playerStats = {
            totalPlayers: 0,
            onlinePlayers: 0,
            newPlayersToday: 0,
            averageLevel: 0,
            topPlayers: []
        };
        
        console.log('👥 PlayerManager initialized');
    }

    async initialize() {
        console.log('🚀 Initializing PlayerManager...');
        
        // Initialize character classes
        this.initializeCharacterClasses();
        
        // Initialize races
        this.initializeRaces();
        
        // Initialize starting zones
        this.initializeStartingZones();
        
        // Load player statistics
        await this.loadPlayerStatistics();
        
        console.log('✅ PlayerManager initialized successfully');
    }

    initializeCharacterClasses() {
        const classes = [
            {
                id: 'warrior',
                name: 'Warrior',
                description: 'A mighty fighter skilled in melee combat',
                primaryStat: 'strength',
                startingStats: {
                    strength: 15,
                    agility: 8,
                    intelligence: 5,
                    vitality: 12,
                    luck: 5
                },
                startingSkills: ['slash', 'block', 'charge'],
                startingEquipment: {
                    weapon: 'iron_sword',
                    armor: 'leather_armor',
                    shield: 'wooden_shield'
                },
                abilities: [
                    { id: 'power_strike', name: 'Power Strike', level: 1 },
                    { id: 'defensive_stance', name: 'Defensive Stance', level: 1 }
                ]
            },
            {
                id: 'mage',
                name: 'Mage',
                description: 'A master of arcane arts and elemental magic',
                primaryStat: 'intelligence',
                startingStats: {
                    strength: 5,
                    agility: 8,
                    intelligence: 15,
                    vitality: 7,
                    luck: 10
                },
                startingSkills: ['fireball', 'ice_shard', 'mana_shield'],
                startingEquipment: {
                    weapon: 'apprentice_staff',
                    armor: 'mage_robes',
                    accessory: 'mana_crystal'
                },
                abilities: [
                    { id: 'magic_missile', name: 'Magic Missile', level: 1 },
                    { id: 'mana_regeneration', name: 'Mana Regeneration', level: 1 }
                ]
            },
            {
                id: 'ranger',
                name: 'Ranger',
                description: 'A skilled archer and nature guardian',
                primaryStat: 'agility',
                startingStats: {
                    strength: 10,
                    agility: 15,
                    intelligence: 8,
                    vitality: 10,
                    luck: 12
                },
                startingSkills: ['archery', 'tracking', 'stealth'],
                startingEquipment: {
                    weapon: 'hunting_bow',
                    armor: 'leather_vest',
                    accessory: 'quiver'
                },
                abilities: [
                    { id: 'precise_shot', name: 'Precise Shot', level: 1 },
                    { id: 'nature_bond', name: 'Nature Bond', level: 1 }
                ]
            },
            {
                id: 'rogue',
                name: 'Rogue',
                description: 'A stealthy assassin with deadly precision',
                primaryStat: 'agility',
                startingStats: {
                    strength: 8,
                    agility: 15,
                    intelligence: 10,
                    vitality: 8,
                    luck: 14
                },
                startingSkills: ['stealth', 'backstab', 'lockpicking'],
                startingEquipment: {
                    weapon: 'steel_dagger',
                    armor: 'dark_cloak',
                    accessory: 'lockpick_set'
                },
                abilities: [
                    { id: 'sneak_attack', name: 'Sneak Attack', level: 1 },
                    { id: 'shadow_step', name: 'Shadow Step', level: 1 }
                ]
            },
            {
                id: 'cleric',
                name: 'Cleric',
                description: 'A divine healer and supporter of allies',
                primaryStat: 'intelligence',
                startingStats: {
                    strength: 8,
                    agility: 6,
                    intelligence: 12,
                    vitality: 15,
                    luck: 14
                },
                startingSkills: ['heal', 'bless', 'divine_protection'],
                startingEquipment: {
                    weapon: 'holy_mace',
                    armor: 'blessed_robes',
                    accessory: 'holy_symbol'
                },
                abilities: [
                    { id: 'healing_light', name: 'Healing Light', level: 1 },
                    { id: 'divine_favor', name: 'Divine Favor', level: 1 }
                ]
            },
            {
                id: 'paladin',
                name: 'Paladin',
                description: 'A holy warrior combining combat and divine magic',
                primaryStat: 'strength',
                startingStats: {
                    strength: 12,
                    agility: 8,
                    intelligence: 10,
                    vitality: 12,
                    luck: 13
                },
                startingSkills: ['holy_strike', 'heal', 'protection'],
                startingEquipment: {
                    weapon: 'blessed_sword',
                    armor: 'plate_mail',
                    shield: 'holy_shield'
                },
                abilities: [
                    { id: 'smite', name: 'Smite', level: 1 },
                    { id: 'divine_protection', name: 'Divine Protection', level: 1 }
                ]
            }
        ];

        classes.forEach(cls => {
            this.characterClasses.set(cls.id, cls);
        });

        console.log(`📝 Initialized ${classes.length} character classes`);
    }

    initializeRaces() {
        const races = [
            {
                id: 'human',
                name: 'Human',
                description: 'Versatile and adaptable beings',
                statModifiers: {
                    strength: 0,
                    agility: 0,
                    intelligence: 0,
                    vitality: 2,
                    luck: 3
                },
                racialAbilities: [
                    { id: 'adaptability', name: 'Adaptability', description: '+10% XP gain' },
                    { id: 'diplomatic', name: 'Diplomatic', description: '+5% reputation gain' }
                ],
                startingZone: 'human_capital'
            },
            {
                id: 'elf',
                name: 'Elf',
                description: 'Graceful beings with natural magic affinity',
                statModifiers: {
                    strength: -2,
                    agility: 3,
                    intelligence: 3,
                    vitality: -1,
                    luck: 2
                },
                racialAbilities: [
                    { id: 'keen_senses', name: 'Keen Senses', description: '+15% critical chance' },
                    { id: 'magic_affinity', name: 'Magic Affinity', description: '+20% mana capacity' }
                ],
                startingZone: 'elven_forest'
            },
            {
                id: 'dwarf',
                name: 'Dwarf',
                description: 'Hardy mountain folk known for their craftsmanship',
                statModifiers: {
                    strength: 3,
                    agility: -2,
                    intelligence: 1,
                    vitality: 3,
                    luck: 0
                },
                racialAbilities: [
                    { id: 'smithing_mastery', name: 'Smithing Mastery', description: '+25% crafting speed' },
                    { id: 'mountain_born', name: 'Mountain Born', description: '+20% resistance to earth attacks' }
                ],
                startingZone: 'dwarven_mines'
            },
            {
                id: 'orc',
                name: 'Orc',
                description: 'Fierce warriors with incredible strength',
                statModifiers: {
                    strength: 4,
                    agility: 1,
                    intelligence: -3,
                    vitality: 2,
                    luck: -1
                },
                racialAbilities: [
                    { id: 'berserker_rage', name: 'Berserker Rage', description: '+30% damage when below 50% health' },
                    { id: 'intimidating', name: 'Intimidating', description: 'Enemies have -10% accuracy' }
                ],
                startingZone: 'orcish_stronghold'
            },
            {
                id: 'halfling',
                name: 'Halfling',
                description: 'Small but nimble folk with incredible luck',
                statModifiers: {
                    strength: -2,
                    agility: 2,
                    intelligence: 1,
                    vitality: 0,
                    luck: 4
                },
                racialAbilities: [
                    { id: 'lucky', name: 'Lucky', description: '+20% chance to find rare items' },
                    { id: 'small_target', name: 'Small Target', description: '+10% dodge chance' }
                ],
                startingZone: 'halfling_village'
            },
            {
                id: 'dragonborn',
                name: 'Dragonborn',
                description: 'Descendants of ancient dragons with elemental powers',
                statModifiers: {
                    strength: 2,
                    agility: 1,
                    intelligence: 2,
                    vitality: 1,
                    luck: -1
                },
                racialAbilities: [
                    { id: 'dragon_breath', name: 'Dragon Breath', description: 'Elemental breath attack' },
                    { id: 'scale_armor', name: 'Scale Armor', description: '+15% physical resistance' }
                ],
                startingZone: 'dragon_peaks'
            }
        ];

        races.forEach(race => {
            this.races.set(race.id, race);
        });

        console.log(`📝 Initialized ${races.length} races`);
    }

    initializeStartingZones() {
        const zones = [
            {
                id: 'human_capital',
                name: 'Valeria Capital',
                description: 'The grand capital city of the human kingdom',
                startingLocation: { x: 100, y: 100 },
                availableNPCs: ['trainer_marcus', 'merchant_elena', 'quest_giver_thomas'],
                recommendedLevel: '1-10'
            },
            {
                id: 'elven_forest',
                name: 'Silverleaf Forest',
                description: 'The mystical home of the elven people',
                startingLocation: { x: -200, y: 150 },
                availableNPCs: ['elder_silvanus', 'magic_teacher_luna', 'forest_guardian'],
                recommendedLevel: '1-10'
            },
            {
                id: 'dwarven_mines',
                name: 'Ironforge Mines',
                description: 'The underground kingdom of the dwarves',
                startingLocation: { x: 0, y: -100 },
                availableNPCs: ['master_smith_thorin', 'mine_foreman', 'gem_merchant'],
                recommendedLevel: '1-10'
            },
            {
                id: 'orcish_stronghold',
                name: 'Bloodfist Stronghold',
                description: 'The fortress home of the orc clans',
                startingLocation: { x: 300, y: -50 },
                availableNPCs: ['warchief_grosh', 'weapon_master', 'shaman_ugrok'],
                recommendedLevel: '1-10'
            },
            {
                id: 'halfling_village',
                name: 'Greenhill Village',
                description: 'The peaceful village of the halflings',
                startingLocation: { x: -100, y: 200 },
                availableNPCs: ['mayor_bilbo', 'tavern_keeper', 'local_farmer'],
                recommendedLevel: '1-10'
            },
            {
                id: 'dragon_peaks',
                name: 'Dragonspire Peaks',
                description: 'The mountain realm of the dragonborn',
                startingLocation: { x: 0, y: 300 },
                availableNPCs: ['ancient_sage', 'dragon_trainer', 'peak_guardian'],
                recommendedLevel: '1-10'
            }
        ];

        zones.forEach(zone => {
            this.startingZones.set(zone.id, zone);
        });

        console.log(`📝 Initialized ${zones.length} starting zones`);
    }

    async createPlayer(playerData) {
        const {
            username,
            email,
            password,
            characterName,
            characterClass,
            race,
            appearance = {}
        } = playerData;

        // Validate input
        if (!username || !email || !password || !characterName || !characterClass || !race) {
            throw new Error('Missing required character creation data');
        }

        // Check if username/email already exists
        const existingPlayer = await this.findPlayerByUsernameOrEmail(username, email);
        if (existingPlayer) {
            throw new Error('Username or email already exists');
        }

        // Get character class and race data
        const classData = this.characterClasses.get(characterClass);
        const raceData = this.races.get(race);
        
        if (!classData || !raceData) {
            throw new Error('Invalid character class or race');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Calculate final stats (base + class + race modifiers)
        const finalStats = {};
        Object.keys(classData.startingStats).forEach(stat => {
            finalStats[stat] = classData.startingStats[stat] + (raceData.statModifiers[stat] || 0);
        });

        // Get starting zone
        const startingZoneId = raceData.startingZone;
        const startingZone = this.startingZones.get(startingZoneId);

        // Create player object
        const newPlayer = {
            id: uuidv4(),
            username,
            email,
            password: hashedPassword,
            
            // Character info
            character: {
                name: characterName,
                class: characterClass,
                race: race,
                level: 1,
                experience: 0,
                experienceToNext: 100,
                
                // Stats
                stats: {
                    ...finalStats,
                    health: finalStats.vitality * 10 + 100,
                    maxHealth: finalStats.vitality * 10 + 100,
                    mana: finalStats.intelligence * 5 + 50,
                    maxMana: finalStats.intelligence * 5 + 50,
                    stamina: 100,
                    maxStamina: 100
                },
                
                // Appearance
                appearance: {
                    hairColor: appearance.hairColor || 'brown',
                    skinColor: appearance.skinColor || 'fair',
                    eyeColor: appearance.eyeColor || 'brown',
                    height: appearance.height || 'average',
                    build: appearance.build || 'average',
                    ...appearance
                },
                
                // Location
                location: {
                    x: startingZone.startingLocation.x,
                    y: startingZone.startingLocation.y,
                    zone: startingZoneId,
                    instance: 'main'
                },
                
                // Skills and abilities
                skills: [...classData.startingSkills],
                abilities: [...classData.abilities],
                skillPoints: 0,
                talentPoints: 0,
                
                // Equipment and inventory
                equipment: {
                    helmet: null,
                    armor: classData.startingEquipment.armor || null,
                    weapon: classData.startingEquipment.weapon || null,
                    shield: classData.startingEquipment.shield || null,
                    gloves: null,
                    boots: null,
                    ring1: null,
                    ring2: null,
                    necklace: classData.startingEquipment.accessory || null,
                    earrings: null
                },
                
                inventory: {
                    size: 30,
                    items: [
                        { id: 'health_potion', quantity: 5, slot: 0 },
                        { id: 'mana_potion', quantity: 3, slot: 1 },
                        { id: 'bread', quantity: 10, slot: 2 }
                    ]
                },
                
                // Currency
                currency: {
                    gold: 100,
                    silver: 0,
                    copper: 0,
                    gems: 0,
                    tokens: 0
                },
                
                // Progress tracking
                questLog: [],
                completedQuests: [],
                achievements: [],
                titles: [],
                activeTitle: null,
                
                // Social
                guild: null,
                friends: [],
                blocked: [],
                
                // Game state
                lastLogin: new Date(),
                lastLogout: null,
                totalPlayTime: 0,
                currentSession: 0,
                
                // PvP and reputation
                pvpRating: 1000,
                pvpKills: 0,
                pvpDeaths: 0,
                reputation: {},
                criminalFlag: false,
                
                // Pets and mounts
                pets: [],
                mounts: [],
                activePet: null,
                activeMount: null,
                
                // Housing
                house: null,
                
                // Professions and crafting
                professions: {},
                recipes: [],
                
                // Mail and storage
                mailbox: [],
                bankStorage: {
                    size: 50,
                    items: []
                },
                
                // Settings
                settings: {
                    showHelmet: true,
                    showCloak: true,
                    allowTrade: true,
                    allowDuel: true,
                    allowPartyInvite: true,
                    allowGuildInvite: true,
                    showOnlineStatus: true,
                    language: 'en'
                }
            },
            
            // Account info
            account: {
                createdAt: new Date(),
                lastLogin: new Date(),
                emailVerified: false,
                accountType: 'free',
                subscriptionEnd: null,
                banned: false,
                banReason: null,
                warnings: 0,
                moderatorNotes: []
            }
        };

        // Add racial abilities
        raceData.racialAbilities.forEach(ability => {
            newPlayer.character.abilities.push({
                ...ability,
                level: 1,
                type: 'racial'
            });
        });

        // Save to database
        await this.savePlayerToDatabase(newPlayer);

        console.log(`👤 New player created: ${characterName} (${username})`);
        
        // Update statistics
        this.playerStats.totalPlayers++;
        this.playerStats.newPlayersToday++;

        return newPlayer;
    }

    async authenticatePlayer(credentials) {
        const { username, email, password } = credentials;
        
        // Find player by username or email
        const player = await this.findPlayerByUsernameOrEmail(username, email);
        if (!player) {
            throw new Error('Player not found');
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, player.password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        // Check if account is banned
        if (player.account.banned) {
            throw new Error(`Account banned: ${player.account.banReason}`);
        }

        // Generate session token
        const token = jwt.sign(
            { 
                playerId: player.id,
                username: player.username,
                characterName: player.character.name
            },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        // Update last login
        player.account.lastLogin = new Date();
        player.character.lastLogin = new Date();
        player.character.currentSession = Date.now();

        // Cache player data
        this.playerCache.set(player.id, player);

        console.log(`🔐 Player authenticated: ${player.character.name}`);

        return {
            token,
            player: this.getPublicPlayerData(player)
        };
    }

    async connectPlayer(socket, token) {
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            const playerId = decoded.playerId;

            // Load player data
            let player = this.playerCache.get(playerId);
            if (!player) {
                player = await this.loadPlayerFromDatabase(playerId);
                this.playerCache.set(playerId, player);
            }

            // Setup player session
            const session = {
                id: playerId,
                socket: socket,
                player: player,
                joinedAt: Date.now(),
                lastActivity: Date.now(),
                currentZone: player.character.location.zone,
                isInCombat: false,
                isTrading: false,
                isFishing: false,
                isMining: false,
                isCrafting: false
            };

            this.connectedPlayers.set(socket.id, session);
            this.playerSessions.set(playerId, session);

            // Associate socket with player
            socket.playerId = playerId;
            socket.playerName = player.character.name;

            // Update online statistics
            this.playerStats.onlinePlayers = this.connectedPlayers.size;

            // Join socket to appropriate rooms
            socket.join(`zone_${player.character.location.zone}`);
            if (player.character.guild) {
                socket.join(`guild_${player.character.guild}`);
            }

            console.log(`🟢 Player connected: ${player.character.name} (${socket.id})`);

            // Emit connection success
            socket.emit('connectionSuccess', {
                player: this.getPublicPlayerData(player),
                worldTime: this.getWorldTime(),
                serverBoosts: this.getActiveServerBoosts()
            });

            // Notify other players in the same zone
            socket.to(`zone_${player.character.location.zone}`).emit('playerJoined', {
                id: playerId,
                name: player.character.name,
                level: player.character.level,
                class: player.character.class,
                race: player.character.race,
                location: player.character.location
            });

            this.emit('playerConnected', { playerId, session });

            return session;

        } catch (error) {
            console.error('❌ Player connection failed:', error);
            socket.emit('connectionError', { message: error.message });
            throw error;
        }
    }

    async handlePlayerDisconnect(playerId) {
        const session = this.playerSessions.get(playerId);
        if (!session) return;

        const player = session.player;
        
        // Calculate session play time
        const sessionDuration = Date.now() - session.joinedAt;
        player.character.totalPlayTime += sessionDuration;
        player.character.lastLogout = new Date();

        // Save player data
        await this.savePlayerToDatabase(player);

        // Remove from active sessions
        this.connectedPlayers.delete(session.socket.id);
        this.playerSessions.delete(playerId);

        // Update statistics
        this.playerStats.onlinePlayers = this.connectedPlayers.size;

        // Notify other players
        session.socket.to(`zone_${player.character.location.zone}`).emit('playerLeft', {
            id: playerId,
            name: player.character.name
        });

        console.log(`🔴 Player disconnected: ${player.character.name} (session: ${Math.round(sessionDuration / 1000)}s)`);

        this.emit('playerDisconnected', { playerId, sessionDuration });
    }

    gainExperience(playerId, experience, source = 'unknown') {
        const session = this.playerSessions.get(playerId);
        if (!session) return;

        const player = session.player;
        const character = player.character;
        
        // Apply experience multipliers
        let finalExp = experience;
        
        // Server boosts
        const activeBoosts = this.getActiveServerBoosts();
        for (const boost of activeBoosts) {
            if (boost.type === 'experience') {
                finalExp *= boost.multiplier;
            }
        }

        // Racial bonuses
        if (character.race === 'human') {
            finalExp *= 1.1; // +10% for humans
        }

        // Add experience
        character.experience += Math.floor(finalExp);

        // Check for level up
        while (character.experience >= character.experienceToNext) {
            this.levelUpPlayer(playerId);
        }

        // Emit experience gain
        session.socket.emit('experienceGained', {
            amount: Math.floor(finalExp),
            source,
            total: character.experience,
            toNext: character.experienceToNext
        });

        console.log(`📈 ${character.name} gained ${Math.floor(finalExp)} XP from ${source}`);
    }

    levelUpPlayer(playerId) {
        const session = this.playerSessions.get(playerId);
        if (!session) return;

        const player = session.player;
        const character = player.character;
        
        // Calculate remaining experience
        const remainingExp = character.experience - character.experienceToNext;
        
        // Level up
        character.level++;
        character.experience = remainingExp;
        character.experienceToNext = this.calculateExperienceForLevel(character.level + 1);
        
        // Gain skill and talent points
        character.skillPoints += 1;
        if (character.level % 5 === 0) {
            character.talentPoints += 1;
        }

        // Increase stats based on class
        const classData = this.characterClasses.get(character.class);
        const statGains = this.calculateStatGains(classData, character.level);
        
        Object.keys(statGains).forEach(stat => {
            character.stats[stat] += statGains[stat];
        });

        // Recalculate derived stats
        character.stats.maxHealth = character.stats.vitality * 10 + (character.level * 5) + 100;
        character.stats.maxMana = character.stats.intelligence * 5 + (character.level * 3) + 50;
        character.stats.health = character.stats.maxHealth; // Full heal on level up
        character.stats.mana = character.stats.maxMana; // Full mana on level up

        // Check for new abilities
        this.checkForNewAbilities(player);

        // Emit level up
        session.socket.emit('levelUp', {
            newLevel: character.level,
            skillPoints: character.skillPoints,
            talentPoints: character.talentPoints,
            statGains,
            newAbilities: character.abilities.filter(a => a.unlockedAt === character.level)
        });

        // Broadcast to zone
        session.socket.to(`zone_${character.location.zone}`).emit('playerLevelUp', {
            playerId,
            name: character.name,
            newLevel: character.level
        });

        console.log(`🎉 ${character.name} leveled up to level ${character.level}!`);

        this.emit('playerLevelUp', { playerId, newLevel: character.level });
    }

    calculateExperienceForLevel(level) {
        // Exponential XP curve
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    calculateStatGains(classData, level) {
        const gains = {};
        
        // Base gains per level based on class primary stat
        switch (classData.primaryStat) {
            case 'strength':
                gains.strength = 2;
                gains.vitality = 1;
                gains.agility = 1;
                gains.intelligence = 0;
                gains.luck = 1;
                break;
            case 'agility':
                gains.strength = 1;
                gains.vitality = 1;
                gains.agility = 2;
                gains.intelligence = 0;
                gains.luck = 1;
                break;
            case 'intelligence':
                gains.strength = 0;
                gains.vitality = 1;
                gains.agility = 1;
                gains.intelligence = 2;
                gains.luck = 1;
                break;
            default:
                gains.strength = 1;
                gains.vitality = 1;
                gains.agility = 1;
                gains.intelligence = 1;
                gains.luck = 1;
        }

        // Bonus gains every 10 levels
        if (level % 10 === 0) {
            Object.keys(gains).forEach(stat => {
                gains[stat] += 1;
            });
        }

        return gains;
    }

    checkForNewAbilities(player) {
        const character = player.character;
        const classData = this.characterClasses.get(character.class);
        
        // Add level-based abilities (this would be expanded with a proper ability system)
        const newAbilities = [];
        
        if (character.level === 5) {
            newAbilities.push({ id: 'class_skill_1', name: 'Class Skill I', level: 1, unlockedAt: 5 });
        }
        if (character.level === 10) {
            newAbilities.push({ id: 'class_skill_2', name: 'Class Skill II', level: 1, unlockedAt: 10 });
        }
        if (character.level === 15) {
            newAbilities.push({ id: 'ultimate_1', name: 'Ultimate Ability', level: 1, unlockedAt: 15 });
        }

        character.abilities.push(...newAbilities);
    }

    addGold(playerId, amount, source = 'unknown') {
        const session = this.playerSessions.get(playerId);
        if (!session) return false;

        const player = session.player;
        player.character.currency.gold += amount;

        session.socket.emit('goldChanged', {
            amount,
            total: player.character.currency.gold,
            source
        });

        console.log(`💰 ${player.character.name} gained ${amount} gold from ${source}`);
        return true;
    }

    removeGold(playerId, amount, reason = 'unknown') {
        const session = this.playerSessions.get(playerId);
        if (!session) return false;

        const player = session.player;
        if (player.character.currency.gold < amount) {
            return false; // Insufficient gold
        }

        player.character.currency.gold -= amount;

        session.socket.emit('goldChanged', {
            amount: -amount,
            total: player.character.currency.gold,
            reason
        });

        console.log(`💸 ${player.character.name} spent ${amount} gold on ${reason}`);
        return true;
    }

    movePlayer(playerId, newLocation) {
        const session = this.playerSessions.get(playerId);
        if (!session) return false;

        const player = session.player;
        const oldZone = player.character.location.zone;
        
        // Update location
        player.character.location = { ...player.character.location, ...newLocation };
        
        // Handle zone changes
        if (newLocation.zone && newLocation.zone !== oldZone) {
            // Leave old zone
            session.socket.leave(`zone_${oldZone}`);
            session.socket.to(`zone_${oldZone}`).emit('playerLeft', {
                id: playerId,
                name: player.character.name
            });

            // Join new zone
            session.socket.join(`zone_${newLocation.zone}`);
            session.socket.to(`zone_${newLocation.zone}`).emit('playerJoined', {
                id: playerId,
                name: player.character.name,
                level: player.character.level,
                class: player.character.class,
                race: player.character.race,
                location: player.character.location
            });

            session.currentZone = newLocation.zone;
        }

        // Broadcast movement to zone
        session.socket.to(`zone_${player.character.location.zone}`).emit('playerMoved', {
            playerId,
            location: player.character.location
        });

        return true;
    }

    getPublicPlayerData(player) {
        return {
            id: player.id,
            username: player.username,
            character: {
                name: player.character.name,
                class: player.character.class,
                race: player.character.race,
                level: player.character.level,
                experience: player.character.experience,
                experienceToNext: player.character.experienceToNext,
                stats: player.character.stats,
                location: player.character.location,
                equipment: player.character.equipment,
                inventory: player.character.inventory,
                currency: player.character.currency,
                questLog: player.character.questLog,
                achievements: player.character.achievements,
                titles: player.character.titles,
                activeTitle: player.character.activeTitle,
                guild: player.character.guild,
                pvpRating: player.character.pvpRating,
                settings: player.character.settings
            }
        };
    }

    getPlayerSession(playerId) {
        return this.playerSessions.get(playerId);
    }

    getConnectedPlayers() {
        return Array.from(this.connectedPlayers.values());
    }

    getPlayersInZone(zoneId) {
        return Array.from(this.connectedPlayers.values())
            .filter(session => session.currentZone === zoneId);
    }

    async saveAllPlayers() {
        console.log('💾 Saving all connected players...');
        
        const savePromises = Array.from(this.playerSessions.values()).map(session => {
            return this.savePlayerToDatabase(session.player);
        });

        await Promise.all(savePromises);
        console.log(`✅ Saved ${savePromises.length} players`);
    }

    async loadPlayerStatistics() {
        // This would load from database
        // For now, initialize with defaults
        this.playerStats = {
            totalPlayers: 0,
            onlinePlayers: 0,
            newPlayersToday: 0,
            averageLevel: 1,
            topPlayers: []
        };
    }

    getWorldTime() {
        // This would come from the GameEngine
        return {
            day: 1,
            hour: 12,
            minute: 0,
            season: 'spring',
            year: 1
        };
    }

    getActiveServerBoosts() {
        // This would come from the GameEngine
        return [];
    }

    // Database operations (these would interact with actual database)
    async findPlayerByUsernameOrEmail(username, email) {
        // Placeholder - would query database
        return null;
    }

    async savePlayerToDatabase(player) {
        // Placeholder - would save to database
        console.log(`💾 Saving player: ${player.character.name}`);
    }

    async loadPlayerFromDatabase(playerId) {
        // Placeholder - would load from database
        throw new Error('Player not found in database');
    }
}
const EventEmitter = require('events');

class QuestSystem extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.quests = new Map();
        this.questTemplates = new Map();
        this.playerQuests = new Map();
        this.completedQuests = new Map();
        this.questChains = new Map();
        this.dailyQuests = new Map();
        this.weeklyQuests = new Map();
        this.eventQuests = new Map();
        this.questGivers = new Map();
        this.questRewards = new Map();
        this.questConditions = new Map();
        this.questProgress = new Map();
        this.questHistory = new Map();
        this.questNotifications = new Map();
        this.questAchievements = new Map();
        this.questCategories = new Map();
        this.questDifficulties = new Map();
        this.statistics = {
            totalQuests: 0,
            questsCompleted: 0,
            questsAbandoned: 0,
            questsCreated: 0,
            dailyQuestsCompleted: 0,
            weeklyQuestsCompleted: 0,
            totalRewardsGiven: 0,
            totalExperienceGiven: 0,
            totalGoldGiven: 0
        };
        this.config = {
            maxActiveQuests: 25,
            maxDailyQuests: 10,
            maxWeeklyQuests: 5,
            questResetTime: '00:00',
            weeklyResetDay: 1, // Monday
            autoCompleteEnabled: true,
            questSharingEnabled: true,
            questHintsEnabled: true,
            questTrackingEnabled: true
        };
        this.questTimers = new Map();
        this.questValidators = new Map();
        this.questGenerators = new Map();
    }

    async initialize() {
        console.log('Initializing QuestSystem...');
        
        try {
            // Load quest templates
            await this.loadQuestTemplates();
            
            // Load quest givers
            await this.loadQuestGivers();
            
            // Initialize quest categories
            this.initializeQuestCategories();
            
            // Initialize quest difficulties
            this.initializeQuestDifficulties();
            
            // Setup quest validators
            this.setupQuestValidators();
            
            // Setup quest generators
            this.setupQuestGenerators();
            
            // Load active quests
            await this.loadActiveQuests();
            
            // Setup quest timers
            this.setupQuestTimers();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            console.log('QuestSystem initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize QuestSystem:', error);
            throw error;
        }
    }

    async loadQuestTemplates() {
        // Load quest templates from database or configuration
        const defaultQuests = [
            {
                id: 'starter_kill_goblins',
                name: 'Goblin Menace',
                description: 'The local goblin population has grown too large. Kill 10 goblins to help protect the town.',
                category: 'combat',
                difficulty: 'easy',
                level: 1,
                type: 'kill',
                objectives: [
                    {
                        id: 'kill_goblins',
                        type: 'kill',
                        target: 'goblin',
                        count: 10,
                        description: 'Kill goblins'
                    }
                ],
                rewards: {
                    experience: 100,
                    gold: 50,
                    items: [
                        { id: 'potion_health_small', quantity: 2 }
                    ]
                },
                requirements: {
                    level: 1,
                    quests: []
                },
                questGiver: 'town_guard_captain',
                location: 'starter_town',
                timeLimit: null,
                repeatable: false,
                autoComplete: true
            },
            {
                id: 'starter_collect_herbs',
                name: 'Herb Gathering',
                description: 'Collect 5 healing herbs for the town alchemist.',
                category: 'gathering',
                difficulty: 'easy',
                level: 1,
                type: 'collect',
                objectives: [
                    {
                        id: 'collect_herbs',
                        type: 'collect',
                        target: 'healing_herb',
                        count: 5,
                        description: 'Collect healing herbs'
                    }
                ],
                rewards: {
                    experience: 75,
                    gold: 25,
                    items: [
                        { id: 'potion_mana_small', quantity: 1 }
                    ]
                },
                requirements: {
                    level: 1,
                    quests: []
                },
                questGiver: 'town_alchemist',
                location: 'starter_town',
                timeLimit: null,
                repeatable: false,
                autoComplete: false
            },
            {
                id: 'daily_monster_hunt',
                name: 'Daily Monster Hunt',
                description: 'Defeat any 15 monsters to earn daily rewards.',
                category: 'daily',
                difficulty: 'medium',
                level: 5,
                type: 'kill',
                objectives: [
                    {
                        id: 'kill_any_monsters',
                        type: 'kill',
                        target: 'any_monster',
                        count: 15,
                        description: 'Defeat any monsters'
                    }
                ],
                rewards: {
                    experience: 500,
                    gold: 200,
                    items: [
                        { id: 'daily_reward_box', quantity: 1 }
                    ]
                },
                requirements: {
                    level: 5,
                    quests: []
                },
                questGiver: 'system',
                location: 'any',
                timeLimit: 86400000, // 24 hours
                repeatable: true,
                autoComplete: true,
                resetType: 'daily'
            },
            {
                id: 'chain_ancient_artifact_1',
                name: 'The Ancient Artifact - Part 1',
                description: 'Find clues about the ancient artifact hidden in the old ruins.',
                category: 'story',
                difficulty: 'medium',
                level: 10,
                type: 'explore',
                objectives: [
                    {
                        id: 'explore_ruins',
                        type: 'explore',
                        target: 'ancient_ruins',
                        count: 1,
                        description: 'Explore the ancient ruins'
                    },
                    {
                        id: 'find_artifact_clue',
                        type: 'interact',
                        target: 'artifact_tablet',
                        count: 1,
                        description: 'Examine the artifact tablet'
                    }
                ],
                rewards: {
                    experience: 300,
                    gold: 100
                },
                requirements: {
                    level: 10,
                    quests: ['starter_kill_goblins', 'starter_collect_herbs']
                },
                questGiver: 'ancient_scholar',
                location: 'starter_town',
                timeLimit: null,
                repeatable: false,
                autoComplete: false,
                chainNext: 'chain_ancient_artifact_2'
            },
            {
                id: 'dungeon_clear_spider_nest',
                name: 'Clear the Spider Nest',
                description: 'Clear out the spider nest dungeon and defeat the Spider Queen.',
                category: 'dungeon',
                difficulty: 'hard',
                level: 15,
                type: 'dungeon',
                objectives: [
                    {
                        id: 'defeat_spider_queen',
                        type: 'kill',
                        target: 'spider_queen',
                        count: 1,
                        description: 'Defeat the Spider Queen'
                    },
                    {
                        id: 'clear_spider_minions',
                        type: 'kill',
                        target: 'spider',
                        count: 20,
                        description: 'Clear spider minions'
                    }
                ],
                rewards: {
                    experience: 1000,
                    gold: 500,
                    items: [
                        { id: 'spider_silk_armor', quantity: 1 },
                        { id: 'arachnid_bow', quantity: 1 }
                    ]
                },
                requirements: {
                    level: 15,
                    quests: ['chain_ancient_artifact_1']
                },
                questGiver: 'dungeon_master',
                location: 'spider_nest_dungeon',
                timeLimit: null,
                repeatable: true,
                autoComplete: true,
                partyQuest: true,
                minPartySize: 2,
                maxPartySize: 5
            }
        ];

        for (const questTemplate of defaultQuests) {
            this.questTemplates.set(questTemplate.id, questTemplate);
            this.statistics.totalQuests++;
        }

        console.log(`Loaded ${this.questTemplates.size} quest templates`);
    }

    async loadQuestGivers() {
        const questGivers = [
            {
                id: 'town_guard_captain',
                name: 'Guard Captain Marcus',
                location: 'starter_town',
                position: { x: 500, y: 600 },
                quests: ['starter_kill_goblins'],
                questTypes: ['combat', 'protection'],
                dialogue: {
                    greeting: "Greetings, adventurer! The town needs your help.",
                    questAvailable: "I have a task that might interest you.",
                    questActive: "How goes your mission?",
                    questComplete: "Excellent work! Here's your reward.",
                    noQuests: "I have no tasks for you at the moment."
                }
            },
            {
                id: 'town_alchemist',
                name: 'Alchemist Elena',
                location: 'starter_town',
                position: { x: 300, y: 400 },
                quests: ['starter_collect_herbs'],
                questTypes: ['gathering', 'crafting'],
                dialogue: {
                    greeting: "Welcome to my shop! I'm always in need of ingredients.",
                    questAvailable: "Could you help me gather some materials?",
                    questActive: "Have you found what I need?",
                    questComplete: "Perfect! These will be very useful.",
                    noQuests: "I have everything I need for now."
                }
            },
            {
                id: 'ancient_scholar',
                name: 'Scholar Aldric',
                location: 'starter_town',
                position: { x: 200, y: 300 },
                quests: ['chain_ancient_artifact_1'],
                questTypes: ['story', 'exploration'],
                dialogue: {
                    greeting: "Ah, a fellow seeker of knowledge!",
                    questAvailable: "I've discovered something that might interest you.",
                    questActive: "Any progress on your research?",
                    questComplete: "Fascinating! Your findings are most valuable.",
                    noQuests: "I'm still analyzing my recent discoveries."
                }
            },
            {
                id: 'system',
                name: 'System',
                location: 'any',
                position: { x: 0, y: 0 },
                quests: ['daily_monster_hunt'],
                questTypes: ['daily', 'weekly', 'event'],
                dialogue: {
                    greeting: "Daily quests available!",
                    questAvailable: "New daily quest available!",
                    questActive: "Quest in progress...",
                    questComplete: "Quest completed! Rewards claimed.",
                    noQuests: "No daily quests available."
                }
            }
        ];

        for (const questGiver of questGivers) {
            this.questGivers.set(questGiver.id, questGiver);
        }

        console.log(`Loaded ${this.questGivers.size} quest givers`);
    }

    initializeQuestCategories() {
        this.questCategories.set('combat', {
            name: 'Combat',
            description: 'Quests involving fighting monsters and enemies',
            color: '#ff4444',
            icon: 'sword'
        });

        this.questCategories.set('gathering', {
            name: 'Gathering',
            description: 'Quests involving collecting items and resources',
            color: '#44ff44',
            icon: 'basket'
        });

        this.questCategories.set('story', {
            name: 'Story',
            description: 'Main storyline and lore quests',
            color: '#4444ff',
            icon: 'book'
        });

        this.questCategories.set('daily', {
            name: 'Daily',
            description: 'Daily repeatable quests',
            color: '#ffaa44',
            icon: 'calendar'
        });

        this.questCategories.set('weekly', {
            name: 'Weekly',
            description: 'Weekly repeatable quests',
            color: '#aa44ff',
            icon: 'calendar-week'
        });

        this.questCategories.set('dungeon', {
            name: 'Dungeon',
            description: 'Dungeon and raid quests',
            color: '#ff44aa',
            icon: 'castle'
        });

        this.questCategories.set('exploration', {
            name: 'Exploration',
            description: 'Quests involving discovering new areas',
            color: '#44aaff',
            icon: 'map'
        });

        this.questCategories.set('crafting', {
            name: 'Crafting',
            description: 'Quests involving creating items',
            color: '#aaff44',
            icon: 'hammer'
        });

        console.log(`Initialized ${this.questCategories.size} quest categories`);
    }

    initializeQuestDifficulties() {
        this.questDifficulties.set('easy', {
            name: 'Easy',
            color: '#00ff00',
            experienceMultiplier: 1.0,
            goldMultiplier: 1.0,
            levelRange: [1, 10]
        });

        this.questDifficulties.set('medium', {
            name: 'Medium',
            color: '#ffff00',
            experienceMultiplier: 1.5,
            goldMultiplier: 1.3,
            levelRange: [5, 25]
        });

        this.questDifficulties.set('hard', {
            name: 'Hard',
            color: '#ff8800',
            experienceMultiplier: 2.0,
            goldMultiplier: 1.7,
            levelRange: [15, 40]
        });

        this.questDifficulties.set('expert', {
            name: 'Expert',
            color: '#ff0000',
            experienceMultiplier: 3.0,
            goldMultiplier: 2.5,
            levelRange: [25, 50]
        });

        this.questDifficulties.set('legendary', {
            name: 'Legendary',
            color: '#ff00ff',
            experienceMultiplier: 5.0,
            goldMultiplier: 4.0,
            levelRange: [40, 100]
        });

        console.log(`Initialized ${this.questDifficulties.size} quest difficulties`);
    }

    setupQuestValidators() {
        // Kill objective validator
        this.questValidators.set('kill', (objective, progress, event) => {
            if (event.type === 'entity:killed' && 
                (objective.target === 'any_monster' || event.entity.type === objective.target)) {
                return Math.min(progress.count + 1, objective.count);
            }
            return progress.count;
        });

        // Collect objective validator
        this.questValidators.set('collect', (objective, progress, event) => {
            if (event.type === 'item:collected' && event.item.id === objective.target) {
                return Math.min(progress.count + event.quantity, objective.count);
            }
            return progress.count;
        });

        // Explore objective validator
        this.questValidators.set('explore', (objective, progress, event) => {
            if (event.type === 'area:explored' && event.area.id === objective.target) {
                return objective.count; // Exploration is usually binary
            }
            return progress.count;
        });

        // Interact objective validator
        this.questValidators.set('interact', (objective, progress, event) => {
            if (event.type === 'object:interacted' && event.object.id === objective.target) {
                return Math.min(progress.count + 1, objective.count);
            }
            return progress.count;
        });

        // Talk objective validator
        this.questValidators.set('talk', (objective, progress, event) => {
            if (event.type === 'npc:talked' && event.npc.id === objective.target) {
                return objective.count; // Talking is usually binary
            }
            return progress.count;
        });

        // Craft objective validator
        this.questValidators.set('craft', (objective, progress, event) => {
            if (event.type === 'item:crafted' && event.item.id === objective.target) {
                return Math.min(progress.count + event.quantity, objective.count);
            }
            return progress.count;
        });

        console.log(`Setup ${this.questValidators.size} quest validators`);
    }

    setupQuestGenerators() {
        // Daily quest generator
        this.questGenerators.set('daily_kill', (playerLevel) => {
            const monsters = ['goblin', 'wolf', 'spider', 'skeleton', 'orc'];
            const monster = monsters[Math.floor(Math.random() * monsters.length)];
            const count = Math.floor(5 + Math.random() * 10);
            
            return {
                id: `daily_kill_${monster}_${Date.now()}`,
                name: `Daily Hunt: ${monster.charAt(0).toUpperCase() + monster.slice(1)}s`,
                description: `Defeat ${count} ${monster}s for daily rewards.`,
                category: 'daily',
                difficulty: 'medium',
                level: Math.max(1, playerLevel - 2),
                type: 'kill',
                objectives: [{
                    id: 'kill_monsters',
                    type: 'kill',
                    target: monster,
                    count: count,
                    description: `Defeat ${count} ${monster}s`
                }],
                rewards: {
                    experience: 100 + (playerLevel * 10),
                    gold: 50 + (playerLevel * 5),
                    items: [{ id: 'daily_reward_box', quantity: 1 }]
                },
                timeLimit: 86400000, // 24 hours
                resetType: 'daily'
            };
        });

        // Weekly quest generator
        this.questGenerators.set('weekly_dungeon', (playerLevel) => {
            const dungeons = ['spider_nest', 'goblin_caves', 'ancient_tomb'];
            const dungeon = dungeons[Math.floor(Math.random() * dungeons.length)];
            
            return {
                id: `weekly_dungeon_${dungeon}_${Date.now()}`,
                name: `Weekly Challenge: ${dungeon.replace('_', ' ').toUpperCase()}`,
                description: `Complete the ${dungeon.replace('_', ' ')} dungeon for weekly rewards.`,
                category: 'weekly',
                difficulty: 'hard',
                level: Math.max(5, playerLevel - 5),
                type: 'dungeon',
                objectives: [{
                    id: 'complete_dungeon',
                    type: 'dungeon_complete',
                    target: dungeon,
                    count: 1,
                    description: `Complete ${dungeon.replace('_', ' ')} dungeon`
                }],
                rewards: {
                    experience: 1000 + (playerLevel * 50),
                    gold: 500 + (playerLevel * 25),
                    items: [{ id: 'weekly_reward_chest', quantity: 1 }]
                },
                timeLimit: 604800000, // 7 days
                resetType: 'weekly'
            };
        });

        console.log(`Setup ${this.questGenerators.size} quest generators`);
    }

    async loadActiveQuests() {
        try {
            // Load active quests from database
            const activeQuests = await this.gameEngine.database.collection('active_quests')
                .find({}).toArray();

            for (const questData of activeQuests) {
                this.quests.set(questData.id, questData);
            }

            // Load player quests
            const playerQuestData = await this.gameEngine.database.collection('player_quests')
                .find({}).toArray();

            for (const data of playerQuestData) {
                if (!this.playerQuests.has(data.playerId)) {
                    this.playerQuests.set(data.playerId, new Map());
                }
                this.playerQuests.get(data.playerId).set(data.questId, data);
            }

            console.log(`Loaded ${this.quests.size} active quests`);
        } catch (error) {
            console.error('Failed to load active quests:', error);
        }
    }

    setupQuestTimers() {
        // Daily quest reset timer
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilReset = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetDailyQuests();
            setInterval(() => {
                this.resetDailyQuests();
            }, 86400000); // 24 hours
        }, timeUntilReset);

        // Weekly quest reset timer
        const daysUntilMonday = (8 - now.getDay()) % 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        
        const timeUntilWeeklyReset = nextMonday.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetWeeklyQuests();
            setInterval(() => {
                this.resetWeeklyQuests();
            }, 604800000); // 7 days
        }, timeUntilWeeklyReset);

        console.log('Quest timers setup complete');
    }

    startBackgroundProcesses() {
        // Quest cleanup process
        setInterval(() => {
            this.cleanupExpiredQuests();
        }, 300000); // 5 minutes

        // Auto-completion check
        setInterval(() => {
            this.checkAutoCompletion();
        }, 10000); // 10 seconds

        // Quest progress save
        setInterval(() => {
            this.saveQuestProgress();
        }, 60000); // 1 minute

        console.log('Background processes started');
    }

    async giveQuest(playerId, questId) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const questTemplate = this.questTemplates.get(questId);

            if (!player || !questTemplate) {
                return { success: false, message: 'Player or quest not found' };
            }

            // Check if player can accept quest
            const canAccept = this.canPlayerAcceptQuest(player, questTemplate);
            if (!canAccept.allowed) {
                return { success: false, message: canAccept.reason };
            }

            // Create quest instance
            const quest = this.createQuestInstance(questTemplate, playerId);

            // Add to player's quest log
            if (!this.playerQuests.has(playerId)) {
                this.playerQuests.set(playerId, new Map());
            }

            const playerQuestData = {
                questId: quest.id,
                playerId: playerId,
                status: 'active',
                startTime: Date.now(),
                progress: quest.objectives.map(obj => ({
                    objectiveId: obj.id,
                    count: 0,
                    completed: false
                })),
                completedAt: null,
                abandonedAt: null
            };

            this.playerQuests.get(playerId).set(quest.id, playerQuestData);
            this.quests.set(quest.id, quest);

            // Send quest to player
            this.sendQuestUpdate(playerId, quest, 'accepted');

            // Log quest acceptance
            this.logQuestEvent(playerId, quest.id, 'accepted');

            console.log(`Quest ${questId} given to player ${player.name}`);
            this.emit('questGiven', playerId, quest);

            return { success: true, quest: quest };
        } catch (error) {
            console.error('Failed to give quest:', error);
            return { success: false, message: 'Failed to give quest' };
        }
    }

    canPlayerAcceptQuest(player, questTemplate) {
        // Check if player already has the quest
        const playerQuests = this.playerQuests.get(player.id);
        if (playerQuests && playerQuests.has(questTemplate.id)) {
            const questData = playerQuests.get(questTemplate.id);
            if (questData.status === 'active') {
                return { allowed: false, reason: 'Quest already active' };
            }
            if (questData.status === 'completed' && !questTemplate.repeatable) {
                return { allowed: false, reason: 'Quest already completed' };
            }
        }

        // Check level requirements
        if (player.level < questTemplate.level) {
            return { 
                allowed: false, 
                reason: `Level ${questTemplate.level} required` 
            };
        }

        // Check prerequisite quests
        if (questTemplate.requirements && questTemplate.requirements.quests) {
            const completedQuests = this.getCompletedQuests(player.id);
            for (const prereq of questTemplate.requirements.quests) {
                if (!completedQuests.includes(prereq)) {
                    return { 
                        allowed: false, 
                        reason: `Prerequisite quest required: ${prereq}` 
                    };
                }
            }
        }

        // Check quest log capacity
        const activeQuests = this.getActiveQuests(player.id);
        if (activeQuests.length >= this.config.maxActiveQuests) {
            return { 
                allowed: false, 
                reason: `Quest log full (${this.config.maxActiveQuests} max)` 
            };
        }

        // Check party requirements for party quests
        if (questTemplate.partyQuest) {
            const party = this.gameEngine.partyManager?.getPlayerParty(player.id);
            if (!party) {
                return {
                    allowed: false,
                    reason: 'Party required for this quest'
                };
            }
            if (party.members.length < questTemplate.minPartySize) {
                return {
                    allowed: false,
                    reason: `Minimum party size of ${questTemplate.minPartySize} required`
                };
            }
        }

        return { allowed: true };
    }

    createQuestInstance(questTemplate, playerId) {
        const questId = `${questTemplate.id}_${playerId}_${Date.now()}`;
        
        return {
            id: questId,
            templateId: questTemplate.id,
            playerId: playerId,
            name: questTemplate.name,
            description: questTemplate.description,
            category: questTemplate.category,
            difficulty: questTemplate.difficulty,
            level: questTemplate.level,
            type: questTemplate.type,
            objectives: [...questTemplate.objectives],
            rewards: { ...questTemplate.rewards },
            questGiver: questTemplate.questGiver,
            location: questTemplate.location,
            timeLimit: questTemplate.timeLimit,
            repeatable: questTemplate.repeatable,
            autoComplete: questTemplate.autoComplete,
            chainNext: questTemplate.chainNext,
            partyQuest: questTemplate.partyQuest,
            createdAt: Date.now(),
            expiresAt: questTemplate.timeLimit ? Date.now() + questTemplate.timeLimit : null
        };
    }

    async completeQuest(playerId, questId) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const quest = this.quests.get(questId);
            const playerQuestData = this.playerQuests.get(playerId)?.get(questId);

            if (!player || !quest || !playerQuestData) {
                return { success: false, message: 'Player, quest, or quest data not found' };
            }

            if (playerQuestData.status !== 'active') {
                return { success: false, message: 'Quest is not active' };
            }

            // Check if all objectives are completed
            const allCompleted = playerQuestData.progress.every(prog => prog.completed);
            if (!allCompleted) {
                return { success: false, message: 'Not all objectives completed' };
            }

            // Mark quest as completed
            playerQuestData.status = 'completed';
            playerQuestData.completedAt = Date.now();

            // Give rewards
            const rewardResult = await this.giveQuestRewards(player, quest);

            // Update statistics
            this.statistics.questsCompleted++;
            if (quest.category === 'daily') {
                this.statistics.dailyQuestsCompleted++;
            } else if (quest.category === 'weekly') {
                this.statistics.weeklyQuestsCompleted++;
            }

            // Send completion notification
            this.sendQuestUpdate(playerId, quest, 'completed', rewardResult);

            // Check for chain quest
            if (quest.chainNext) {
                const nextQuestTemplate = this.questTemplates.get(quest.chainNext);
                if (nextQuestTemplate) {
                    // Automatically give next quest in chain
                    setTimeout(() => {
                        this.giveQuest(playerId, quest.chainNext);
                    }, 1000);
                }
            }

            // Log quest completion
            this.logQuestEvent(playerId, questId, 'completed', rewardResult);

            console.log(`Quest ${questId} completed by player ${player.name}`);
            this.emit('questCompleted', playerId, quest, rewardResult);

            return { success: true, rewards: rewardResult };
        } catch (error) {
            console.error('Failed to complete quest:', error);
            return { success: false, message: 'Failed to complete quest' };
        }
    }

    async giveQuestRewards(player, quest) {
        const rewards = {
            experience: 0,
            gold: 0,
            items: []
        };

        try {
            // Calculate level-based multipliers
            const difficulty = this.questDifficulties.get(quest.difficulty);
            const levelDiff = player.level - quest.level;
            let levelMultiplier = 1.0;
            
            // Reduce rewards for quests significantly below player level
            if (levelDiff > 5) {
                levelMultiplier = Math.max(0.1, 1.0 - (levelDiff - 5) * 0.1);
            }

            // Give experience
            if (quest.rewards.experience) {
                const expReward = Math.floor(
                    quest.rewards.experience * 
                    (difficulty?.experienceMultiplier || 1.0) * 
                    levelMultiplier
                );
                
                if (expReward > 0) {
                    await this.gameEngine.playerManager.addExperience(player.id, expReward);
                    rewards.experience = expReward;
                    this.statistics.totalExperienceGiven += expReward;
                }
            }

            // Give gold
            if (quest.rewards.gold) {
                const goldReward = Math.floor(
                    quest.rewards.gold * 
                    (difficulty?.goldMultiplier || 1.0) * 
                    levelMultiplier
                );
                
                if (goldReward > 0) {
                    await this.gameEngine.playerManager.addGold(player.id, goldReward);
                    rewards.gold = goldReward;
                    this.statistics.totalGoldGiven += goldReward;
                }
            }

            // Give items
            if (quest.rewards.items && quest.rewards.items.length > 0) {
                for (const itemReward of quest.rewards.items) {
                    const success = await this.gameEngine.inventorySystem.addItem(
                        player.id, 
                        itemReward.id, 
                        itemReward.quantity || 1
                    );
                    
                    if (success) {
                        rewards.items.push({
                            id: itemReward.id,
                            quantity: itemReward.quantity || 1
                        });
                    }
                }
            }

            this.statistics.totalRewardsGiven++;
            return rewards;
        } catch (error) {
            console.error('Failed to give quest rewards:', error);
            return rewards;
        }
    }

    async abandonQuest(playerId, questId) {
        try {
            const playerQuestData = this.playerQuests.get(playerId)?.get(questId);
            const quest = this.quests.get(questId);

            if (!playerQuestData || !quest) {
                return { success: false, message: 'Quest not found' };
            }

            if (playerQuestData.status !== 'active') {
                return { success: false, message: 'Quest is not active' };
            }

            // Mark quest as abandoned
            playerQuestData.status = 'abandoned';
            playerQuestData.abandonedAt = Date.now();

            // Remove quest from active quests
            this.playerQuests.get(playerId).delete(questId);

            // Update statistics
            this.statistics.questsAbandoned++;

            // Send abandonment notification
            this.sendQuestUpdate(playerId, quest, 'abandoned');

            // Log quest abandonment
            this.logQuestEvent(playerId, questId, 'abandoned');

            console.log(`Quest ${questId} abandoned by player ${playerId}`);
            this.emit('questAbandoned', playerId, quest);

            return { success: true };
        } catch (error) {
            console.error('Failed to abandon quest:', error);
            return { success: false, message: 'Failed to abandon quest' };
        }
    }

    updateQuestProgress(playerId, event) {
        const playerQuests = this.playerQuests.get(playerId);
        if (!playerQuests) return;

        for (const [questId, questData] of playerQuests) {
            if (questData.status !== 'active') continue;

            const quest = this.quests.get(questId);
            if (!quest) continue;

            let questUpdated = false;

            // Update progress for each objective
            for (let i = 0; i < quest.objectives.length; i++) {
                const objective = quest.objectives[i];
                const progress = questData.progress[i];

                if (progress.completed) continue;

                const validator = this.questValidators.get(objective.type);
                if (!validator) continue;

                const newCount = validator(objective, progress, event);
                if (newCount !== progress.count) {
                    progress.count = newCount;
                    
                    if (progress.count >= objective.count) {
                        progress.completed = true;
                    }
                    
                    questUpdated = true;
                }
            }

            if (questUpdated) {
                // Send progress update
                this.sendQuestUpdate(playerId, quest, 'progress');

                // Check if quest can be auto-completed
                if (quest.autoComplete && this.config.autoCompleteEnabled) {
                    const allCompleted = questData.progress.every(prog => prog.completed);
                    if (allCompleted) {
                        this.completeQuest(playerId, questId);
                    }
                }

                // Log progress update
                this.logQuestEvent(playerId, questId, 'progress', {
                    objectives: questData.progress
                });
            }
        }
    }

    getActiveQuests(playerId) {
        const playerQuests = this.playerQuests.get(playerId);
        if (!playerQuests) return [];

        const activeQuests = [];
        for (const [questId, questData] of playerQuests) {
            if (questData.status === 'active') {
                const quest = this.quests.get(questId);
                if (quest) {
                    activeQuests.push({
                        ...quest,
                        progress: questData.progress
                    });
                }
            }
        }

        return activeQuests;
    }

    getCompletedQuests(playerId) {
        const completedQuests = [];
        const playerQuests = this.playerQuests.get(playerId);
        
        if (playerQuests) {
            for (const [questId, questData] of playerQuests) {
                if (questData.status === 'completed') {
                    completedQuests.push(questData.questId);
                }
            }
        }

        return completedQuests;
    }

    getAvailableQuests(playerId) {
        const player = this.gameEngine.playerManager.getPlayer(playerId);
        if (!player) return [];

        const availableQuests = [];

        for (const [questId, questTemplate] of this.questTemplates) {
            const canAccept = this.canPlayerAcceptQuest(player, questTemplate);
            if (canAccept.allowed) {
                availableQuests.push(questTemplate);
            }
        }

        return availableQuests;
    }

    async generateDailyQuests(playerId) {
        const player = this.gameEngine.playerManager.getPlayer(playerId);
        if (!player) return [];

        const generatedQuests = [];
        const questTypes = ['daily_kill'];

        for (let i = 0; i < this.config.maxDailyQuests; i++) {
            const questType = questTypes[Math.floor(Math.random() * questTypes.length)];
            const generator = this.questGenerators.get(questType);
            
            if (generator) {
                const questTemplate = generator(player.level);
                questTemplate.questGiver = 'system';
                questTemplate.repeatable = true;
                questTemplate.autoComplete = true;

                // Add to templates temporarily
                this.questTemplates.set(questTemplate.id, questTemplate);
                generatedQuests.push(questTemplate);
            }
        }

        return generatedQuests;
    }

    async resetDailyQuests() {
        console.log('Resetting daily quests...');

        // Remove completed daily quests
        for (const [playerId, playerQuests] of this.playerQuests) {
            const questsToRemove = [];
            
            for (const [questId, questData] of playerQuests) {
                const quest = this.quests.get(questId);
                if (quest && quest.category === 'daily') {
                    questsToRemove.push(questId);
                }
            }

            for (const questId of questsToRemove) {
                playerQuests.delete(questId);
                this.quests.delete(questId);
            }
        }

        // Generate new daily quests for all players
        for (const [playerId] of this.playerQuests) {
            await this.generateDailyQuests(playerId);
        }

        this.emit('dailyQuestsReset');
        console.log('Daily quests reset completed');
    }

    async resetWeeklyQuests() {
        console.log('Resetting weekly quests...');

        // Similar to daily quest reset but for weekly quests
        for (const [playerId, playerQuests] of this.playerQuests) {
            const questsToRemove = [];
            
            for (const [questId, questData] of playerQuests) {
                const quest = this.quests.get(questId);
                if (quest && quest.category === 'weekly') {
                    questsToRemove.push(questId);
                }
            }

            for (const questId of questsToRemove) {
                playerQuests.delete(questId);
                this.quests.delete(questId);
            }
        }

        this.emit('weeklyQuestsReset');
        console.log('Weekly quests reset completed');
    }

    cleanupExpiredQuests() {
        const now = Date.now();
        const expiredQuests = [];

        for (const [questId, quest] of this.quests) {
            if (quest.expiresAt && now > quest.expiresAt) {
                expiredQuests.push(questId);
            }
        }

        for (const questId of expiredQuests) {
            const quest = this.quests.get(questId);
            if (quest) {
                // Mark as expired and remove
                const playerQuests = this.playerQuests.get(quest.playerId);
                if (playerQuests && playerQuests.has(questId)) {
                    const questData = playerQuests.get(questId);
                    questData.status = 'expired';
                    questData.expiredAt = now;
                    playerQuests.delete(questId);
                    
                    // Notify player
                    this.sendQuestUpdate(quest.playerId, quest, 'expired');
                }
                
                this.quests.delete(questId);
            }
        }

        if (expiredQuests.length > 0) {
            console.log(`Cleaned up ${expiredQuests.length} expired quests`);
        }
    }

    checkAutoCompletion() {
        for (const [playerId, playerQuests] of this.playerQuests) {
            for (const [questId, questData] of playerQuests) {
                if (questData.status !== 'active') continue;

                const quest = this.quests.get(questId);
                if (!quest || !quest.autoComplete) continue;

                const allCompleted = questData.progress.every(prog => prog.completed);
                if (allCompleted) {
                    this.completeQuest(playerId, questId);
                }
            }
        }
    }

    async saveQuestProgress() {
        try {
            const savePromises = [];

            // Save active quests
            for (const [questId, quest] of this.quests) {
                savePromises.push(
                    this.gameEngine.database.collection('active_quests')
                        .replaceOne(
                            { id: questId },
                            quest,
                            { upsert: true }
                        )
                );
            }

            // Save player quest data
            for (const [playerId, playerQuests] of this.playerQuests) {
                for (const [questId, questData] of playerQuests) {
                    savePromises.push(
                        this.gameEngine.database.collection('player_quests')
                            .replaceOne(
                                { playerId: playerId, questId: questId },
                                questData,
                                { upsert: true }
                            )
                    );
                }
            }

            await Promise.all(savePromises);
        } catch (error) {
            console.error('Failed to save quest progress:', error);
        }
    }

    sendQuestUpdate(playerId, quest, type, data = null) {
        const player = this.gameEngine.playerManager.getPlayer(playerId);
        if (player && player.socket) {
            player.socket.emit('quest:update', {
                type: type,
                quest: quest,
                data: data,
                timestamp: Date.now()
            });
        }
    }

    logQuestEvent(playerId, questId, eventType, data = null) {
        const logEntry = {
            playerId: playerId,
            questId: questId,
            eventType: eventType,
            data: data,
            timestamp: Date.now()
        };

        // Store in quest history
        if (!this.questHistory.has(playerId)) {
            this.questHistory.set(playerId, []);
        }
        
        const history = this.questHistory.get(playerId);
        history.push(logEntry);
        
        // Keep only recent history
        if (history.length > 100) {
            history.shift();
        }

        // Emit event for logging systems
        this.emit('questEvent', logEntry);
    }

    getQuestStatistics() {
        return {
            ...this.statistics,
            totalActiveQuests: this.quests.size,
            totalQuestTemplates: this.questTemplates.size,
            playersWithQuests: this.playerQuests.size,
            questGivers: this.questGivers.size,
            questCategories: this.questCategories.size
        };
    }

    getPlayerQuestSummary(playerId) {
        const activeQuests = this.getActiveQuests(playerId);
        const completedQuests = this.getCompletedQuests(playerId);
        const availableQuests = this.getAvailableQuests(playerId);

        return {
            active: activeQuests,
            completed: completedQuests,
            available: availableQuests,
            statistics: {
                totalActive: activeQuests.length,
                totalCompleted: completedQuests.length,
                totalAvailable: availableQuests.length
            }
        };
    }

    destroy() {
        console.log('Destroying QuestSystem...');
        
        // Save all quest data
        this.saveQuestProgress();
        
        // Clear all timers
        for (const [timerId, timer] of this.questTimers) {
            clearTimeout(timer);
        }
        
        // Clear all data
        this.quests.clear();
        this.questTemplates.clear();
        this.playerQuests.clear();
        this.completedQuests.clear();
        this.questGivers.clear();
        this.questValidators.clear();
        this.questGenerators.clear();
        
        console.log('QuestSystem destroyed');
    }
}

module.exports = QuestSystem;
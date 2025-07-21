import mongoose from 'mongoose';
import { gameConfig } from '../config/game.js';

const characterSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 16,
        match: /^[a-zA-Z]+$/,
        index: true
    },
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Character Details
    race: {
        type: String,
        required: true,
        enum: gameConfig.character.races.map(r => r.id)
    },
    
    class: {
        type: String,
        required: true,
        enum: gameConfig.character.classes.map(c => c.id)
    },
    
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },
    
    // Appearance
    appearance: {
        height: {
            type: Number,
            min: 0.5,
            max: 3.0,
            default: 1.8
        },
        bodyType: {
            type: Number,
            min: 0,
            max: 5,
            default: 2
        },
        skinColor: {
            type: String,
            default: '#FFD4A3'
        },
        hairStyle: {
            type: Number,
            default: 1
        },
        hairColor: {
            type: String,
            default: '#4A3C28'
        },
        faceType: {
            type: Number,
            default: 1
        },
        eyeColor: {
            type: String,
            default: '#4B7399'
        },
        features: {
            scars: Number,
            tattoos: [String],
            accessories: [String]
        }
    },
    
    // Level & Experience
    level: {
        type: Number,
        default: gameConfig.character.startingLevel,
        min: 1,
        max: gameConfig.character.maxLevel,
        index: true
    },
    
    experience: {
        current: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            default: 0,
            min: 0
        },
        toNextLevel: {
            type: Number,
            default: 100
        }
    },
    
    // Stats
    stats: {
        // Base stats
        strength: {
            type: Number,
            default: gameConfig.character.stats.strength.startingValue,
            min: gameConfig.character.stats.strength.min,
            max: gameConfig.character.stats.strength.max
        },
        agility: {
            type: Number,
            default: gameConfig.character.stats.agility.startingValue,
            min: gameConfig.character.stats.agility.min,
            max: gameConfig.character.stats.agility.max
        },
        intelligence: {
            type: Number,
            default: gameConfig.character.stats.intelligence.startingValue,
            min: gameConfig.character.stats.intelligence.min,
            max: gameConfig.character.stats.intelligence.max
        },
        vitality: {
            type: Number,
            default: gameConfig.character.stats.vitality.startingValue,
            min: gameConfig.character.stats.vitality.min,
            max: gameConfig.character.stats.vitality.max
        },
        wisdom: {
            type: Number,
            default: gameConfig.character.stats.wisdom.startingValue,
            min: gameConfig.character.stats.wisdom.min,
            max: gameConfig.character.stats.wisdom.max
        },
        luck: {
            type: Number,
            default: gameConfig.character.stats.luck.startingValue,
            min: gameConfig.character.stats.luck.min,
            max: gameConfig.character.stats.luck.max
        },
        
        // Derived stats (calculated from base stats and equipment)
        maxHealth: {
            type: Number,
            default: gameConfig.character.baseHealth
        },
        maxMana: {
            type: Number,
            default: gameConfig.character.baseMana
        },
        maxStamina: {
            type: Number,
            default: gameConfig.character.baseStamina
        },
        
        attackPower: {
            type: Number,
            default: 10
        },
        spellPower: {
            type: Number,
            default: 10
        },
        defense: {
            type: Number,
            default: 10
        },
        magicResistance: {
            type: Number,
            default: 10
        },
        
        criticalChance: {
            type: Number,
            default: 0.05,
            min: 0,
            max: 1
        },
        criticalDamage: {
            type: Number,
            default: 1.5,
            min: 1,
            max: 5
        },
        
        hitChance: {
            type: Number,
            default: 0.95,
            min: 0,
            max: 1
        },
        dodgeChance: {
            type: Number,
            default: 0.05,
            min: 0,
            max: 0.75
        },
        blockChance: {
            type: Number,
            default: 0.05,
            min: 0,
            max: 0.75
        },
        parryChance: {
            type: Number,
            default: 0.05,
            min: 0,
            max: 0.75
        },
        
        moveSpeed: {
            type: Number,
            default: gameConfig.character.baseSpeed
        },
        attackSpeed: {
            type: Number,
            default: 1.0,
            min: 0.5,
            max: 3.0
        },
        castSpeed: {
            type: Number,
            default: 1.0,
            min: 0.5,
            max: 3.0
        }
    },
    
    // Current status
    status: {
        health: {
            type: Number,
            default: gameConfig.character.baseHealth
        },
        mana: {
            type: Number,
            default: gameConfig.character.baseMana
        },
        stamina: {
            type: Number,
            default: gameConfig.character.baseStamina
        },
        
        isAlive: {
            type: Boolean,
            default: true
        },
        isDead: {
            type: Boolean,
            default: false
        },
        isInCombat: {
            type: Boolean,
            default: false
        },
        isResting: {
            type: Boolean,
            default: false
        },
        isMounted: {
            type: Boolean,
            default: false
        },
        isFlying: {
            type: Boolean,
            default: false
        },
        isStealthed: {
            type: Boolean,
            default: false
        },
        isChanneling: {
            type: Boolean,
            default: false
        }
    },
    
    // Position & Movement
    position: {
        world: {
            type: String,
            default: 'main'
        },
        zone: {
            type: String,
            default: 'starter_town'
        },
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        z: {
            type: Number,
            default: 0
        },
        rotation: {
            type: Number,
            default: 0,
            min: 0,
            max: 360
        },
        instance: {
            type: String,
            default: null
        }
    },
    
    // Equipment
    equipment: {
        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        neck: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        shoulders: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        chest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        back: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        wrists: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        hands: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        waist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        legs: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        feet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        ring1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        ring2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        trinket1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        trinket2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        mainHand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },
        offHand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        }
    },
    
    // Inventory
    inventory: {
        bags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
        }],
        items: [{
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item'
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
            slot: {
                type: Number,
                min: 0,
                max: gameConfig.items.maxInventorySlots - 1
            }
        }],
        gold: {
            type: Number,
            default: gameConfig.economy.startingGold,
            min: 0,
            max: gameConfig.economy.maxGold
        }
    },
    
    // Skills & Abilities
    skills: [{
        skillId: {
            type: String,
            required: true
        },
        level: {
            type: Number,
            default: 1,
            min: 1
        },
        experience: {
            type: Number,
            default: 0,
            min: 0
        },
        unlocked: {
            type: Boolean,
            default: false
        }
    }],
    
    actionBar: {
        slots: [{
            slot: {
                type: Number,
                min: 0,
                max: 11
            },
            type: {
                type: String,
                enum: ['skill', 'item', 'macro', 'empty'],
                default: 'empty'
            },
            id: String
        }]
    },
    
    // Talents
    talents: {
        points: {
            available: {
                type: Number,
                default: 0,
                min: 0
            },
            spent: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        trees: [{
            treeId: String,
            talents: [{
                talentId: String,
                rank: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 5
                }
            }]
        }]
    },
    
    // Buffs & Debuffs
    buffs: [{
        buffId: String,
        source: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'buffs.sourceType'
        },
        sourceType: {
            type: String,
            enum: ['Character', 'NPC', 'Item', 'Environment']
        },
        stacks: {
            type: Number,
            default: 1,
            min: 1
        },
        duration: Number,
        expiresAt: Date,
        isPermanent: {
            type: Boolean,
            default: false
        }
    }],
    
    debuffs: [{
        debuffId: String,
        source: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'debuffs.sourceType'
        },
        sourceType: {
            type: String,
            enum: ['Character', 'NPC', 'Item', 'Environment']
        },
        stacks: {
            type: Number,
            default: 1,
            min: 1
        },
        duration: Number,
        expiresAt: Date,
        isRemovable: {
            type: Boolean,
            default: true
        }
    }],
    
    // Quests
    quests: {
        active: [{
            quest: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quest'
            },
            progress: [{
                objectiveId: String,
                current: {
                    type: Number,
                    default: 0
                },
                required: Number,
                completed: {
                    type: Boolean,
                    default: false
                }
            }],
            acceptedAt: {
                type: Date,
                default: Date.now
            }
        }],
        completed: [{
            quest: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Quest'
            },
            completedAt: Date,
            rewardsClaimed: {
                type: Boolean,
                default: true
            }
        }],
        daily: {
            count: {
                type: Number,
                default: 0
            },
            lastReset: {
                type: Date,
                default: Date.now
            }
        }
    },
    
    // Professions
    professions: {
        primary: [{
            professionId: {
                type: String,
                enum: gameConfig.crafting.professions.map(p => p.id)
            },
            level: {
                type: Number,
                default: 1,
                min: 1,
                max: gameConfig.crafting.maxSkillLevel
            },
            experience: {
                type: Number,
                default: 0,
                min: 0
            },
            recipes: [String]
        }],
        secondary: [{
            professionId: {
                type: String,
                enum: ['cooking', 'fishing', 'firstaid']
            },
            level: {
                type: Number,
                default: 1,
                min: 1,
                max: gameConfig.crafting.maxSkillLevel
            },
            experience: {
                type: Number,
                default: 0,
                min: 0
            },
            recipes: [String]
        }]
    },
    
    // Reputation
    reputation: [{
        factionId: String,
        standing: {
            type: Number,
            default: 0
        },
        level: {
            type: String,
            enum: ['hated', 'hostile', 'unfriendly', 'neutral', 'friendly', 'honored', 'revered', 'exalted'],
            default: 'neutral'
        }
    }],
    
    // PvP
    pvp: {
        enabled: {
            type: Boolean,
            default: false
        },
        flaggedUntil: Date,
        kills: {
            type: Number,
            default: 0,
            min: 0
        },
        deaths: {
            type: Number,
            default: 0,
            min: 0
        },
        honorPoints: {
            type: Number,
            default: 0,
            min: 0
        },
        rating: {
            arena2v2: {
                type: Number,
                default: 1500
            },
            arena3v3: {
                type: Number,
                default: 1500
            },
            arena5v5: {
                type: Number,
                default: 1500
            },
            battleground: {
                type: Number,
                default: 1500
            }
        },
        rank: {
            type: Number,
            default: 0,
            min: 0,
            max: gameConfig.pvp.rankings.length
        }
    },
    
    // Achievements
    achievements: [{
        achievementId: String,
        unlockedAt: Date,
        progress: [{
            criteriaId: String,
            current: Number,
            required: Number,
            completed: Boolean
        }]
    }],
    
    // Collections
    collections: {
        mounts: [{
            mountId: String,
            acquiredAt: Date,
            isFavorite: {
                type: Boolean,
                default: false
            }
        }],
        pets: [{
            petId: String,
            name: String,
            level: {
                type: Number,
                default: 1
            },
            experience: {
                type: Number,
                default: 0
            },
            acquiredAt: Date,
            isSummoned: {
                type: Boolean,
                default: false
            }
        }],
        toys: [{
            toyId: String,
            acquiredAt: Date
        }],
        titles: [{
            titleId: String,
            acquiredAt: Date,
            isActive: {
                type: Boolean,
                default: false
            }
        }]
    },
    
    // Social
    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        default: null
    },
    
    guild: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guild',
        default: null
    },
    
    friends: [{
        character: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Character'
        },
        addedAt: Date
    }],
    
    ignored: [{
        character: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Character'
        },
        ignoredAt: Date,
        reason: String
    }],
    
    // Death & Resurrection
    deathCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    lastDeath: {
        timestamp: Date,
        location: {
            zone: String,
            x: Number,
            y: Number,
            z: Number
        },
        killedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'lastDeath.killerType'
        },
        killerType: {
            type: String,
            enum: ['Character', 'NPC', 'Environmental']
        }
    },
    
    // Playtime
    playtime: {
        total: {
            type: Number,
            default: 0
        },
        thisLevel: {
            type: Number,
            default: 0
        },
        lastSession: {
            type: Number,
            default: 0
        }
    },
    
    // Last activity
    lastSeen: {
        type: Date,
        default: Date.now
    },
    
    lastZone: String,
    
    // Flags
    flags: {
        isOnline: {
            type: Boolean,
            default: false,
            index: true
        },
        isAFK: {
            type: Boolean,
            default: false
        },
        isDND: {
            type: Boolean,
            default: false
        },
        isLFG: {
            type: Boolean,
            default: false
        }
    }
    
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes
characterSchema.index({ owner: 1, name: 1 });
characterSchema.index({ level: -1, 'flags.isOnline': 1 });
characterSchema.index({ 'position.zone': 1, 'flags.isOnline': 1 });
characterSchema.index({ guild: 1, 'flags.isOnline': 1 });
characterSchema.index({ 'pvp.rating.arena3v3': -1 });

// Virtual properties
characterSchema.virtual('kdr').get(function() {
    if (this.pvp.deaths === 0) return this.pvp.kills;
    return this.pvp.kills / this.pvp.deaths;
});

characterSchema.virtual('itemLevel').get(function() {
    // Calculate average item level from equipment
    let totalItemLevel = 0;
    let equippedItems = 0;
    
    for (const slot in this.equipment) {
        if (this.equipment[slot]) {
            equippedItems++;
            // Would need to populate items to get their levels
        }
    }
    
    return equippedItems > 0 ? Math.floor(totalItemLevel / equippedItems) : 0;
});

// Methods
characterSchema.methods.calculateStats = async function() {
    // Base stats from race and class
    const race = gameConfig.character.races.find(r => r.id === this.race);
    const classData = gameConfig.character.classes.find(c => c.id === this.class);
    
    // Apply race bonuses
    if (race && race.bonuses) {
        for (const stat in race.bonuses) {
            if (this.stats[stat] !== undefined) {
                this.stats[stat] += race.bonuses[stat];
            }
        }
    }
    
    // Apply class bonuses
    if (classData && classData.bonusStats) {
        for (const stat in classData.bonusStats) {
            if (this.stats[stat] !== undefined) {
                this.stats[stat] += classData.bonusStats[stat];
            }
        }
    }
    
    // Calculate derived stats
    this.stats.maxHealth = gameConfig.character.baseHealth + (this.stats.vitality * 10) + (this.level * 5);
    this.stats.maxMana = gameConfig.character.baseMana + (this.stats.intelligence * 5) + (this.level * 2);
    this.stats.maxStamina = gameConfig.character.baseStamina + (this.stats.vitality * 5);
    
    this.stats.attackPower = this.stats.strength * 2 + this.level;
    this.stats.spellPower = this.stats.intelligence * 2 + this.level;
    this.stats.defense = this.stats.vitality + Math.floor(this.stats.agility / 2);
    this.stats.magicResistance = this.stats.wisdom + Math.floor(this.stats.intelligence / 2);
    
    this.stats.criticalChance = 0.05 + (this.stats.agility * 0.001) + (this.stats.luck * 0.002);
    this.stats.dodgeChance = 0.05 + (this.stats.agility * 0.002);
    this.stats.moveSpeed = gameConfig.character.baseSpeed + (this.stats.agility * 0.1);
    
    await this.save();
};

characterSchema.methods.gainExperience = async function(amount) {
    this.experience.current += amount;
    this.experience.total += amount;
    
    // Check for level up
    while (this.experience.current >= this.experience.toNextLevel && this.level < gameConfig.character.maxLevel) {
        this.experience.current -= this.experience.toNextLevel;
        this.level += 1;
        this.experience.toNextLevel = this.calculateExperienceToNextLevel();
        
        // Restore health and mana on level up
        this.status.health = this.stats.maxHealth;
        this.status.mana = this.stats.maxMana;
        this.status.stamina = this.stats.maxStamina;
        
        // Award talent point
        if (this.level % 2 === 0) { // Every 2 levels
            this.talents.points.available += 1;
        }
        
        await this.calculateStats();
    }
    
    await this.save();
};

characterSchema.methods.calculateExperienceToNextLevel = function() {
    // Experience curve formula
    return Math.floor(100 * Math.pow(1.5, this.level - 1));
};

characterSchema.methods.die = async function(killer = null, killerType = 'Environmental') {
    this.status.isAlive = false;
    this.status.isDead = true;
    this.status.health = 0;
    this.deathCount += 1;
    
    this.lastDeath = {
        timestamp: new Date(),
        location: {
            zone: this.position.zone,
            x: this.position.x,
            y: this.position.y,
            z: this.position.z
        },
        killedBy: killer,
        killerType: killerType
    };
    
    // Clear buffs on death
    this.buffs = [];
    
    // Durability loss
    // TODO: Implement durability system
    
    await this.save();
};

characterSchema.methods.resurrect = async function(atGraveyard = true) {
    this.status.isAlive = true;
    this.status.isDead = false;
    this.status.health = Math.floor(this.stats.maxHealth * 0.5);
    this.status.mana = Math.floor(this.stats.maxMana * 0.5);
    this.status.stamina = Math.floor(this.stats.maxStamina * 0.5);
    
    if (atGraveyard) {
        // TODO: Teleport to nearest graveyard
        // Apply resurrection sickness debuff
        this.debuffs.push({
            debuffId: 'resurrection_sickness',
            duration: 600000, // 10 minutes
            expiresAt: new Date(Date.now() + 600000),
            isRemovable: false
        });
    }
    
    await this.save();
};

characterSchema.methods.isInCombat = function() {
    return this.status.isInCombat;
};

characterSchema.methods.enterCombat = async function() {
    this.status.isInCombat = true;
    this.status.isResting = false;
    await this.save();
};

characterSchema.methods.leaveCombat = async function() {
    this.status.isInCombat = false;
    await this.save();
};

characterSchema.methods.addBuff = async function(buffId, source, sourceType, duration = null) {
    const existingBuff = this.buffs.find(b => b.buffId === buffId);
    
    if (existingBuff) {
        // Refresh duration or add stack
        existingBuff.stacks = Math.min(existingBuff.stacks + 1, 99);
        if (duration) {
            existingBuff.duration = duration;
            existingBuff.expiresAt = new Date(Date.now() + duration);
        }
    } else {
        const buff = {
            buffId,
            source,
            sourceType,
            stacks: 1
        };
        
        if (duration) {
            buff.duration = duration;
            buff.expiresAt = new Date(Date.now() + duration);
        } else {
            buff.isPermanent = true;
        }
        
        this.buffs.push(buff);
    }
    
    await this.save();
};

characterSchema.methods.removeBuff = async function(buffId) {
    this.buffs = this.buffs.filter(b => b.buffId !== buffId);
    await this.save();
};

characterSchema.methods.updatePosition = async function(x, y, z, rotation = null) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    if (rotation !== null) {
        this.position.rotation = rotation;
    }
    await this.save();
};

// Static methods
characterSchema.statics.findOnlineInZone = function(zone) {
    return this.find({
        'position.zone': zone,
        'flags.isOnline': true
    });
};

characterSchema.statics.getTopPvPPlayers = function(type = 'arena3v3', limit = 100) {
    return this.find({ [`pvp.rating.${type}`]: { $gt: 0 } })
        .sort({ [`pvp.rating.${type}`]: -1 })
        .limit(limit)
        .select('name class race level pvp.rating guild')
        .populate('guild', 'name tag');
};

const Character = mongoose.model('Character', characterSchema);

export default Character;
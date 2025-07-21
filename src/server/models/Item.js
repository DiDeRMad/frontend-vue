import mongoose from 'mongoose';
import { gameConfig } from '../config/game.js';

const itemSchema = new mongoose.Schema({
    // Basic Information
    itemId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    name: {
        type: String,
        required: true,
        index: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    lore: String,
    
    icon: {
        type: String,
        default: '/assets/icons/items/default.png'
    },
    
    model: {
        type: String,
        default: null
    },
    
    // Item Type & Category
    type: {
        type: String,
        required: true,
        enum: ['equipment', 'consumable', 'quest', 'material', 'currency', 'container', 'misc'],
        index: true
    },
    
    subtype: {
        type: String,
        required: true,
        enum: [
            // Equipment
            'sword', 'axe', 'mace', 'dagger', 'staff', 'bow', 'gun', 'wand',
            'shield', 'offhand', 'helmet', 'shoulders', 'chest', 'gloves',
            'belt', 'legs', 'boots', 'neck', 'ring', 'trinket', 'back',
            // Consumables
            'potion', 'elixir', 'food', 'drink', 'scroll', 'bandage',
            // Materials
            'ore', 'herb', 'leather', 'cloth', 'gem', 'enchanting',
            // Containers
            'bag', 'box', 'chest',
            // Quest items
            'quest_item',
            // Currency
            'money', 'token',
            // Misc
            'junk', 'recipe', 'book', 'key', 'toy', 'mount', 'pet'
        ]
    },
    
    // Quality & Rarity
    quality: {
        type: String,
        required: true,
        enum: gameConfig.items.itemQualities.map(q => q.id),
        default: 'common',
        index: true
    },
    
    // Requirements
    requirements: {
        level: {
            type: Number,
            default: 1,
            min: 1,
            max: gameConfig.character.maxLevel
        },
        class: [{
            type: String,
            enum: gameConfig.character.classes.map(c => c.id)
        }],
        race: [{
            type: String,
            enum: gameConfig.character.races.map(r => r.id)
        }],
        reputation: [{
            faction: String,
            level: String
        }],
        profession: {
            id: String,
            level: Number
        },
        stats: {
            strength: Number,
            agility: Number,
            intelligence: Number,
            vitality: Number,
            wisdom: Number
        }
    },
    
    // Binding
    binding: {
        type: String,
        enum: ['none', 'pickup', 'equip', 'use', 'account'],
        default: 'none'
    },
    
    unique: {
        type: Boolean,
        default: false
    },
    
    maxStack: {
        type: Number,
        default: 1,
        min: 1,
        max: 1000
    },
    
    // Equipment Stats (for equipment type items)
    equipment: {
        slot: {
            type: String,
            enum: gameConfig.items.equipmentSlots
        },
        
        // Base stats
        armor: {
            type: Number,
            default: 0,
            min: 0
        },
        
        damageMin: {
            type: Number,
            default: 0,
            min: 0
        },
        
        damageMax: {
            type: Number,
            default: 0,
            min: 0
        },
        
        speed: {
            type: Number,
            default: 2.0,
            min: 0.5,
            max: 4.0
        },
        
        // Stat bonuses
        stats: {
            strength: { type: Number, default: 0 },
            agility: { type: Number, default: 0 },
            intelligence: { type: Number, default: 0 },
            vitality: { type: Number, default: 0 },
            wisdom: { type: Number, default: 0 },
            luck: { type: Number, default: 0 },
            
            health: { type: Number, default: 0 },
            mana: { type: Number, default: 0 },
            stamina: { type: Number, default: 0 },
            
            attackPower: { type: Number, default: 0 },
            spellPower: { type: Number, default: 0 },
            defense: { type: Number, default: 0 },
            magicResistance: { type: Number, default: 0 },
            
            critChance: { type: Number, default: 0 },
            critDamage: { type: Number, default: 0 },
            hitChance: { type: Number, default: 0 },
            dodgeChance: { type: Number, default: 0 },
            blockChance: { type: Number, default: 0 },
            parryChance: { type: Number, default: 0 },
            
            moveSpeed: { type: Number, default: 0 },
            attackSpeed: { type: Number, default: 0 },
            castSpeed: { type: Number, default: 0 },
            
            healthRegen: { type: Number, default: 0 },
            manaRegen: { type: Number, default: 0 },
            
            lifeSteal: { type: Number, default: 0 },
            spellVamp: { type: Number, default: 0 }
        },
        
        // Resistances
        resistances: {
            physical: { type: Number, default: 0 },
            magical: { type: Number, default: 0 },
            fire: { type: Number, default: 0 },
            ice: { type: Number, default: 0 },
            lightning: { type: Number, default: 0 },
            poison: { type: Number, default: 0 },
            holy: { type: Number, default: 0 },
            shadow: { type: Number, default: 0 }
        },
        
        // Set bonus
        set: {
            setId: String,
            pieces: [{
                itemId: String,
                name: String
            }],
            bonuses: [{
                requiredPieces: Number,
                stats: mongoose.Schema.Types.Mixed,
                description: String
            }]
        },
        
        // Enchantments
        enchantments: [{
            enchantId: String,
            name: String,
            stats: mongoose.Schema.Types.Mixed,
            description: String,
            enchantedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Character'
            },
            enchantedAt: Date
        }],
        
        // Gem sockets
        sockets: [{
            color: {
                type: String,
                enum: ['red', 'blue', 'yellow', 'meta', 'prismatic']
            },
            gem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Item',
                default: null
            }
        }],
        
        // Durability
        durability: {
            current: {
                type: Number,
                default: 100,
                min: 0,
                max: 100
            },
            max: {
                type: Number,
                default: 100,
                min: 1
            }
        }
    },
    
    // Consumable Effects (for consumable type items)
    consumable: {
        uses: {
            type: Number,
            default: 1,
            min: 1
        },
        
        cooldown: {
            type: Number,
            default: 0, // milliseconds
            min: 0
        },
        
        sharedCooldown: String,
        
        effects: [{
            type: {
                type: String,
                enum: ['heal', 'mana', 'stamina', 'buff', 'debuff', 'damage', 'teleport', 'resurrect', 'transform']
            },
            value: Number,
            duration: Number, // milliseconds
            buffId: String,
            description: String
        }],
        
        requirements: {
            inCombat: Boolean,
            outOfCombat: Boolean,
            sitting: Boolean,
            zone: [String],
            level: {
                min: Number,
                max: Number
            }
        }
    },
    
    // Crafting (for materials and recipes)
    crafting: {
        profession: {
            type: String,
            enum: gameConfig.crafting.professions.map(p => p.id)
        },
        
        skillRequired: {
            type: Number,
            default: 1,
            min: 1,
            max: gameConfig.crafting.maxSkillLevel
        },
        
        recipe: {
            materials: [{
                itemId: String,
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1
                }
            }],
            
            produces: [{
                itemId: String,
                quantity: {
                    min: {
                        type: Number,
                        default: 1
                    },
                    max: {
                        type: Number,
                        default: 1
                    }
                },
                chance: {
                    type: Number,
                    default: 1.0,
                    min: 0,
                    max: 1
                }
            }],
            
            tools: [String],
            
            location: {
                type: String,
                enum: ['anywhere', 'forge', 'anvil', 'alchemy_lab', 'workbench', 'campfire']
            },
            
            castTime: {
                type: Number,
                default: 3000 // milliseconds
            },
            
            skillGain: {
                type: Number,
                default: 1
            }
        }
    },
    
    // Quest Related
    quest: {
        questId: String,
        startsQuest: Boolean,
        questItem: Boolean,
        objectives: [String]
    },
    
    // Container Properties
    container: {
        slots: {
            type: Number,
            default: 0,
            min: 0,
            max: 36
        },
        
        allowedTypes: [{
            type: String,
            enum: ['all', 'equipment', 'consumable', 'material', 'gem', 'herb', 'ore']
        }]
    },
    
    // Special Properties
    special: {
        mount: {
            speed: {
                ground: Number,
                flying: Number,
                swimming: Number
            },
            modelId: String,
            spellId: String
        },
        
        pet: {
            creatureId: String,
            spellId: String,
            family: String
        },
        
        toy: {
            spellId: String,
            cooldown: Number,
            duration: Number,
            charges: Number
        },
        
        currency: {
            currencyType: String,
            exchangeRate: Number
        }
    },
    
    // Trading & Economy
    value: {
        buy: {
            type: Number,
            default: 0,
            min: 0
        },
        sell: {
            type: Number,
            default: 0,
            min: 0
        },
        repair: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    tradeable: {
        type: Boolean,
        default: true
    },
    
    destroyable: {
        type: Boolean,
        default: true
    },
    
    // Source & Acquisition
    source: {
        type: {
            type: String,
            enum: ['drop', 'quest', 'vendor', 'craft', 'achievement', 'event', 'premium']
        },
        
        drops: [{
            npcId: String,
            chance: {
                type: Number,
                min: 0,
                max: 1
            },
            minQuantity: {
                type: Number,
                default: 1
            },
            maxQuantity: {
                type: Number,
                default: 1
            }
        }],
        
        vendors: [{
            vendorId: String,
            cost: {
                gold: Number,
                currency: [{
                    currencyId: String,
                    amount: Number
                }]
            },
            reputation: {
                faction: String,
                level: String
            },
            limited: {
                stock: Number,
                restockTime: Number // minutes
            }
        }],
        
        achievements: [{
            achievementId: String,
            points: Number
        }]
    },
    
    // Visual Effects
    visual: {
        glow: {
            color: String,
            intensity: Number
        },
        
        particle: {
            effectId: String,
            attachPoint: String
        },
        
        sound: {
            equip: String,
            use: String,
            hit: String
        },
        
        animation: {
            equip: String,
            use: String,
            idle: String
        }
    },
    
    // Flags
    flags: {
        isStarterItem: {
            type: Boolean,
            default: false
        },
        isEventItem: {
            type: Boolean,
            default: false
        },
        isLegacyItem: {
            type: Boolean,
            default: false
        },
        isDisabled: {
            type: Boolean,
            default: false
        },
        noSalvage: {
            type: Boolean,
            default: false
        },
        noRepair: {
            type: Boolean,
            default: false
        },
        indestructible: {
            type: Boolean,
            default: false
        }
    },
    
    // Metadata
    addedInPatch: {
        type: String,
        default: '1.0.0'
    },
    
    lastModified: {
        type: Date,
        default: Date.now
    },
    
    tags: [String]
    
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
itemSchema.index({ itemId: 1 });
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ type: 1, subtype: 1 });
itemSchema.index({ quality: 1 });
itemSchema.index({ 'requirements.level': 1 });
itemSchema.index({ 'source.type': 1 });
itemSchema.index({ 'equipment.slot': 1 });

// Virtual properties
itemSchema.virtual('displayName').get(function() {
    const qualityData = gameConfig.items.itemQualities.find(q => q.id === this.quality);
    return qualityData ? `<span style="color: ${qualityData.color}">${this.name}</span>` : this.name;
});

itemSchema.virtual('vendorPrice').get(function() {
    return Math.floor(this.value.sell * 0.2); // Vendors buy at 20% of sell price
});

itemSchema.virtual('isEquipment').get(function() {
    return this.type === 'equipment';
});

itemSchema.virtual('isConsumable').get(function() {
    return this.type === 'consumable';
});

itemSchema.virtual('itemLevel').get(function() {
    if (!this.isEquipment) return 0;
    
    // Calculate item level based on stats and requirements
    let ilvl = this.requirements.level || 1;
    
    // Add bonus based on quality
    const qualityBonus = {
        'common': 0,
        'uncommon': 5,
        'rare': 10,
        'epic': 20,
        'legendary': 40,
        'artifact': 60
    };
    
    ilvl += qualityBonus[this.quality] || 0;
    
    // Add bonus based on stats
    const statTotal = Object.values(this.equipment.stats).reduce((sum, val) => sum + (val || 0), 0);
    ilvl += Math.floor(statTotal / 10);
    
    return ilvl;
});

// Methods
itemSchema.methods.canEquip = function(character) {
    // Check level requirement
    if (this.requirements.level > character.level) {
        return { canEquip: false, reason: 'Level too low' };
    }
    
    // Check class requirement
    if (this.requirements.class.length > 0 && !this.requirements.class.includes(character.class)) {
        return { canEquip: false, reason: 'Wrong class' };
    }
    
    // Check race requirement
    if (this.requirements.race.length > 0 && !this.requirements.race.includes(character.race)) {
        return { canEquip: false, reason: 'Wrong race' };
    }
    
    // Check stat requirements
    for (const stat in this.requirements.stats) {
        if (character.stats[stat] < this.requirements.stats[stat]) {
            return { canEquip: false, reason: `Insufficient ${stat}` };
        }
    }
    
    // Check reputation requirements
    for (const rep of this.requirements.reputation) {
        const charRep = character.reputation.find(r => r.factionId === rep.faction);
        if (!charRep || charRep.level < rep.level) {
            return { canEquip: false, reason: 'Insufficient reputation' };
        }
    }
    
    return { canEquip: true };
};

itemSchema.methods.use = async function(character, target = null) {
    if (this.type !== 'consumable') {
        return { success: false, message: 'Item is not consumable' };
    }
    
    // Check cooldown
    // TODO: Implement cooldown tracking
    
    // Check requirements
    if (this.consumable.requirements.inCombat && !character.isInCombat()) {
        return { success: false, message: 'Can only be used in combat' };
    }
    
    if (this.consumable.requirements.outOfCombat && character.isInCombat()) {
        return { success: false, message: 'Cannot be used in combat' };
    }
    
    // Apply effects
    for (const effect of this.consumable.effects) {
        switch (effect.type) {
            case 'heal':
                character.status.health = Math.min(
                    character.status.health + effect.value,
                    character.stats.maxHealth
                );
                break;
                
            case 'mana':
                character.status.mana = Math.min(
                    character.status.mana + effect.value,
                    character.stats.maxMana
                );
                break;
                
            case 'buff':
                await character.addBuff(effect.buffId, this._id, 'Item', effect.duration);
                break;
                
            case 'teleport':
                // TODO: Implement teleportation
                break;
                
            case 'resurrect':
                if (character.status.isDead) {
                    await character.resurrect(false);
                }
                break;
        }
    }
    
    await character.save();
    
    return { success: true, message: `Used ${this.name}` };
};

itemSchema.methods.repair = function() {
    if (!this.isEquipment) return false;
    
    const repairCost = Math.ceil(
        (this.equipment.durability.max - this.equipment.durability.current) * 
        this.value.repair / 100
    );
    
    this.equipment.durability.current = this.equipment.durability.max;
    
    return repairCost;
};

itemSchema.methods.addEnchantment = async function(enchantment, enchanter) {
    if (!this.isEquipment) {
        throw new Error('Only equipment can be enchanted');
    }
    
    // Remove existing enchantment of same slot
    this.equipment.enchantments = this.equipment.enchantments.filter(
        e => e.slot !== enchantment.slot
    );
    
    this.equipment.enchantments.push({
        ...enchantment,
        enchantedBy: enchanter._id,
        enchantedAt: new Date()
    });
    
    await this.save();
};

itemSchema.methods.socketGem = async function(gem, socketIndex) {
    if (!this.isEquipment || !this.equipment.sockets[socketIndex]) {
        throw new Error('Invalid socket');
    }
    
    const socket = this.equipment.sockets[socketIndex];
    
    // Check gem color compatibility
    if (socket.color !== 'prismatic' && gem.subtype !== socket.color && gem.subtype !== 'prismatic') {
        throw new Error('Gem color does not match socket');
    }
    
    socket.gem = gem._id;
    await this.save();
};

itemSchema.methods.calculateTotalStats = function() {
    if (!this.isEquipment) return {};
    
    const totalStats = { ...this.equipment.stats };
    
    // Add enchantment stats
    for (const enchant of this.equipment.enchantments) {
        for (const stat in enchant.stats) {
            totalStats[stat] = (totalStats[stat] || 0) + enchant.stats[stat];
        }
    }
    
    // Add gem stats (would need to populate gems)
    // TODO: Implement gem stat calculation
    
    return totalStats;
};

// Static methods
itemSchema.statics.generateRandomItem = async function(level, quality = null) {
    // TODO: Implement random item generation based on level and quality
};

itemSchema.statics.getBySlot = function(slot) {
    return this.find({
        type: 'equipment',
        'equipment.slot': slot
    });
};

itemSchema.statics.searchItems = function(query, filters = {}) {
    const search = { $text: { $search: query } };
    
    if (filters.type) search.type = filters.type;
    if (filters.quality) search.quality = filters.quality;
    if (filters.minLevel) search['requirements.level'] = { $gte: filters.minLevel };
    if (filters.maxLevel) {
        search['requirements.level'] = search['requirements.level'] || {};
        search['requirements.level'].$lte = filters.maxLevel;
    }
    
    return this.find(search)
        .sort({ score: { $meta: 'textScore' } })
        .limit(100);
};

const Item = mongoose.model('Item', itemSchema);

export default Item;
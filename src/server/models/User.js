import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { securityConfig } from '../config/security.js';

const userSchema = new mongoose.Schema({
    // Account Information
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_-]+$/,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    
    // Profile Information
    profile: {
        displayName: {
            type: String,
            default: function() { return this.username; }
        },
        avatar: {
            type: String,
            default: '/assets/avatars/default.png'
        },
        bio: {
            type: String,
            maxlength: 500
        },
        country: String,
        language: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    
    // Account Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'banned', 'deleted'],
        default: 'active'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Security
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    
    lastLogin: Date,
    lastLoginIP: String,
    loginHistory: [{
        timestamp: Date,
        ip: String,
        userAgent: String,
        success: Boolean
    }],
    
    // OAuth
    oauth: {
        google: {
            id: String,
            email: String,
            verified: Boolean
        },
        facebook: {
            id: String,
            email: String,
            verified: Boolean
        },
        discord: {
            id: String,
            username: String,
            discriminator: String
        }
    },
    
    // Game Data
    characters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character'
    }],
    
    activeCharacter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Character'
    },
    
    maxCharacterSlots: {
        type: Number,
        default: 5
    },
    
    // Account Level (different from character level)
    accountLevel: {
        type: Number,
        default: 1
    },
    accountExperience: {
        type: Number,
        default: 0
    },
    
    // Premium Status
    premium: {
        isPremium: {
            type: Boolean,
            default: false
        },
        tier: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            default: null
        },
        expiresAt: Date,
        autoRenew: {
            type: Boolean,
            default: false
        }
    },
    
    // Currency
    currencies: {
        gems: {
            type: Number,
            default: 0,
            min: 0
        },
        tokens: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Social
    friends: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'pending'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    guild: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guild'
    },
    
    // Achievements & Statistics
    achievements: [{
        achievementId: String,
        unlockedAt: Date,
        progress: Number
    }],
    
    statistics: {
        playtime: {
            type: Number,
            default: 0
        },
        monstersKilled: {
            type: Number,
            default: 0
        },
        playersKilled: {
            type: Number,
            default: 0
        },
        deaths: {
            type: Number,
            default: 0
        },
        questsCompleted: {
            type: Number,
            default: 0
        },
        dungeonsCompleted: {
            type: Number,
            default: 0
        },
        pvpRating: {
            type: Number,
            default: 1500
        },
        highestLevel: {
            type: Number,
            default: 1
        }
    },
    
    // Settings
    settings: {
        notifications: {
            email: {
                newsletter: { type: Boolean, default: true },
                friendRequests: { type: Boolean, default: true },
                guildInvites: { type: Boolean, default: true },
                promotions: { type: Boolean, default: false }
            },
            ingame: {
                friendOnline: { type: Boolean, default: true },
                guildAnnouncements: { type: Boolean, default: true },
                tradeRequests: { type: Boolean, default: true },
                whispers: { type: Boolean, default: true }
            }
        },
        privacy: {
            profileVisibility: {
                type: String,
                enum: ['public', 'friends', 'private'],
                default: 'public'
            },
            showOnlineStatus: { type: Boolean, default: true },
            allowFriendRequests: { type: Boolean, default: true },
            allowGuildInvites: { type: Boolean, default: true },
            allowTradeRequests: { type: Boolean, default: true }
        },
        gameplay: {
            autoLoot: { type: Boolean, default: true },
            showDamageNumbers: { type: Boolean, default: true },
            showHealthBars: { type: Boolean, default: true },
            enableTutorials: { type: Boolean, default: true }
        }
    },
    
    // Moderation
    reports: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        description: String,
        timestamp: Date,
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending'
        }
    }],
    
    warnings: [{
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        timestamp: Date
    }],
    
    bans: [{
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        startDate: Date,
        endDate: Date,
        permanent: Boolean
    }],
    
    // Metadata
    registrationIP: String,
    registrationUserAgent: String,
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    
    // Admin
    roles: [{
        type: String,
        enum: ['player', 'moderator', 'gamemaster', 'admin', 'developer'],
        default: 'player'
    }],
    
    permissions: [String]
    
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.twoFactorSecret;
            delete ret.emailVerificationToken;
            delete ret.passwordResetToken;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes
userSchema.index({ 'status': 1, 'lastActivityAt': -1 });
userSchema.index({ 'guild': 1 });
userSchema.index({ 'accountLevel': -1 });
userSchema.index({ 'statistics.pvpRating': -1 });
userSchema.index({ 'premium.isPremium': 1, 'premium.expiresAt': 1 });

// Virtual properties
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('friendCount').get(function() {
    return this.friends.filter(f => f.status === 'accepted').length;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(securityConfig.bcrypt.saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.incrementLoginAttempts = async function() {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after max attempts
    if (this.loginAttempts + 1 >= securityConfig.maxLoginAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + securityConfig.lockoutDuration };
    }
    
    return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
    return await this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

userSchema.methods.hasRole = function(role) {
    return this.roles.includes(role);
};

userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

userSchema.methods.updateLastActivity = async function() {
    this.lastActivityAt = new Date();
    await this.save();
};

userSchema.methods.addFriend = async function(friendId) {
    if (!this.friends.some(f => f.user.toString() === friendId.toString())) {
        this.friends.push({ user: friendId, status: 'pending' });
        await this.save();
    }
};

userSchema.methods.removeFriend = async function(friendId) {
    this.friends = this.friends.filter(f => f.user.toString() !== friendId.toString());
    await this.save();
};

userSchema.methods.canCreateCharacter = function() {
    return this.characters.length < this.maxCharacterSlots;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

userSchema.statics.getLeaderboard = function(type = 'accountLevel', limit = 100) {
    const sortField = type === 'pvp' ? 'statistics.pvpRating' : 'accountLevel';
    return this.find({ status: 'active' })
        .sort({ [sortField]: -1 })
        .limit(limit)
        .select('username profile.displayName profile.avatar accountLevel statistics.pvpRating');
};

const User = mongoose.model('User', userSchema);

export default User;
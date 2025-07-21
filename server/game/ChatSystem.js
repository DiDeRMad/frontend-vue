const EventEmitter = require('events');
const { profanityFilter, sanitizeInput } = require('../utils/textUtils');

class ChatSystem extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.channels = new Map();
        this.messageHistory = new Map();
        this.muteList = new Map();
        this.bannedWords = new Set();
        this.privateMessages = new Map();
        this.systemMessages = new Map();
        this.moderators = new Set();
        this.chatFilters = new Map();
        this.rateLimits = new Map();
        this.messageQueue = new Map();
        this.announcements = new Map();
        this.chatCommands = new Map();
        this.emotes = new Map();
        this.userPreferences = new Map();
        this.statistics = {
            totalMessages: 0,
            messagesFiltered: 0,
            usersWarned: 0,
            usersMuted: 0,
            commandsExecuted: 0,
            privateMessagesSent: 0,
            announcementsSent: 0,
            emotesUsed: 0
        };
        this.config = {
            maxMessageLength: 500,
            maxMessagesPerMinute: 10,
            historyLength: 100,
            profanityFilterEnabled: true,
            spamDetectionEnabled: true,
            autoModerateEnabled: true,
            allowPrivateMessages: true,
            allowSystemMessages: true,
            muteDuration: 600000, // 10 minutes
            warnThreshold: 3,
            muteThreshold: 5,
            banThreshold: 10
        };
        this.spamDetection = new Map();
        this.warningSystem = new Map();
        this.chatLogs = new Map();
        this.activeReports = new Map();
        this.autoModerationRules = new Map();
    }

    async initialize() {
        console.log('Initializing ChatSystem...');
        
        try {
            // Initialize default channels
            await this.initializeDefaultChannels();
            
            // Load banned words and filters
            await this.loadChatFilters();
            
            // Setup chat commands
            this.setupChatCommands();
            
            // Initialize emotes
            await this.initializeEmotes();
            
            // Load moderation settings
            await this.loadModerationSettings();
            
            // Setup rate limiting
            this.setupRateLimiting();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            console.log('ChatSystem initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize ChatSystem:', error);
            throw error;
        }
    }

    async initializeDefaultChannels() {
        const defaultChannels = [
            {
                id: 'global',
                name: 'Global',
                type: 'public',
                description: 'Global chat for all players',
                maxUsers: 1000,
                persistent: true,
                moderated: true,
                levelRequired: 1,
                allowGuests: false
            },
            {
                id: 'trade',
                name: 'Trade',
                type: 'public',
                description: 'Trading and marketplace discussions',
                maxUsers: 500,
                persistent: true,
                moderated: true,
                levelRequired: 5,
                allowGuests: false
            },
            {
                id: 'help',
                name: 'Help',
                type: 'public',
                description: 'Ask questions and get help',
                maxUsers: 200,
                persistent: true,
                moderated: true,
                levelRequired: 1,
                allowGuests: true
            },
            {
                id: 'newbie',
                name: 'Newbie',
                type: 'public',
                description: 'Chat for new players',
                maxUsers: 100,
                persistent: true,
                moderated: true,
                levelRequired: 1,
                maxLevel: 10,
                allowGuests: true
            },
            {
                id: 'pvp',
                name: 'PvP',
                type: 'public',
                description: 'Player vs Player discussions',
                maxUsers: 300,
                persistent: true,
                moderated: true,
                levelRequired: 15,
                allowGuests: false
            }
        ];

        for (const channelConfig of defaultChannels) {
            await this.createChannel(channelConfig);
        }

        console.log(`Initialized ${defaultChannels.length} default channels`);
    }

    async createChannel(config) {
        const channel = {
            id: config.id,
            name: config.name,
            type: config.type || 'public',
            description: config.description || '',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            users: new Set(),
            moderators: new Set(),
            bannedUsers: new Set(),
            mutedUsers: new Map(),
            messageHistory: [],
            settings: {
                maxUsers: config.maxUsers || 100,
                persistent: config.persistent !== false,
                moderated: config.moderated !== false,
                levelRequired: config.levelRequired || 1,
                maxLevel: config.maxLevel || null,
                allowGuests: config.allowGuests !== false,
                password: config.password || null,
                inviteOnly: config.inviteOnly || false
            },
            statistics: {
                totalMessages: 0,
                totalUsers: 0,
                peakUsers: 0,
                messagesFiltered: 0,
                usersKicked: 0
            },
            filters: new Set(),
            customCommands: new Map()
        };

        this.channels.set(config.id, channel);
        this.messageHistory.set(config.id, []);
        this.chatLogs.set(config.id, []);

        console.log(`Created channel: ${config.name} (${config.id})`);
        this.emit('channelCreated', channel);

        return channel;
    }

    async loadChatFilters() {
        // Load banned words from database or config
        const defaultBannedWords = [
            'spam', 'cheat', 'hack', 'bot', 'exploit', 'dupe'
        ];

        defaultBannedWords.forEach(word => {
            this.bannedWords.add(word.toLowerCase());
        });

        // Setup automatic moderation rules
        this.autoModerationRules.set('excessive_caps', {
            enabled: true,
            threshold: 0.7, // 70% caps
            action: 'warn',
            message: 'Please avoid excessive use of capital letters'
        });

        this.autoModerationRules.set('repeated_characters', {
            enabled: true,
            threshold: 5, // More than 5 repeated characters
            action: 'filter',
            message: 'Message contains excessive repeated characters'
        });

        this.autoModerationRules.set('flooding', {
            enabled: true,
            threshold: 3, // 3 identical messages
            action: 'mute',
            duration: 300000, // 5 minutes
            message: 'Flooding detected'
        });

        console.log('Chat filters and moderation rules loaded');
    }

    setupChatCommands() {
        // Player commands
        this.chatCommands.set('/help', {
            handler: this.handleHelpCommand.bind(this),
            description: 'Show available commands',
            requiresAuth: false,
            cooldown: 5000
        });

        this.chatCommands.set('/who', {
            handler: this.handleWhoCommand.bind(this),
            description: 'List players in current channel',
            requiresAuth: true,
            cooldown: 10000
        });

        this.chatCommands.set('/whisper', {
            handler: this.handleWhisperCommand.bind(this),
            description: 'Send private message to player',
            requiresAuth: true,
            cooldown: 1000,
            aliases: ['/w', '/tell', '/pm']
        });

        this.chatCommands.set('/ignore', {
            handler: this.handleIgnoreCommand.bind(this),
            description: 'Ignore messages from a player',
            requiresAuth: true,
            cooldown: 5000
        });

        this.chatCommands.set('/unignore', {
            handler: this.handleUnignoreCommand.bind(this),
            description: 'Stop ignoring a player',
            requiresAuth: true,
            cooldown: 5000
        });

        this.chatCommands.set('/join', {
            handler: this.handleJoinCommand.bind(this),
            description: 'Join a chat channel',
            requiresAuth: true,
            cooldown: 5000
        });

        this.chatCommands.set('/leave', {
            handler: this.handleLeaveCommand.bind(this),
            description: 'Leave a chat channel',
            requiresAuth: true,
            cooldown: 5000
        });

        this.chatCommands.set('/channels', {
            handler: this.handleChannelsCommand.bind(this),
            description: 'List available channels',
            requiresAuth: true,
            cooldown: 10000
        });

        // Moderator commands
        this.chatCommands.set('/mute', {
            handler: this.handleMuteCommand.bind(this),
            description: 'Mute a player',
            requiresModerator: true,
            cooldown: 1000
        });

        this.chatCommands.set('/unmute', {
            handler: this.handleUnmuteCommand.bind(this),
            description: 'Unmute a player',
            requiresModerator: true,
            cooldown: 1000
        });

        this.chatCommands.set('/kick', {
            handler: this.handleKickCommand.bind(this),
            description: 'Kick a player from channel',
            requiresModerator: true,
            cooldown: 1000
        });

        this.chatCommands.set('/ban', {
            handler: this.handleBanCommand.bind(this),
            description: 'Ban a player from channel',
            requiresModerator: true,
            cooldown: 1000
        });

        this.chatCommands.set('/announce', {
            handler: this.handleAnnounceCommand.bind(this),
            description: 'Send server announcement',
            requiresModerator: true,
            cooldown: 30000
        });

        console.log(`Setup ${this.chatCommands.size} chat commands`);
    }

    async initializeEmotes() {
        const defaultEmotes = [
            { name: 'smile', text: ':)', unicode: '😊' },
            { name: 'laugh', text: ':D', unicode: '😄' },
            { name: 'sad', text: ':(', unicode: '😢' },
            { name: 'angry', text: '>:(', unicode: '😠' },
            { name: 'wink', text: ';)', unicode: '😉' },
            { name: 'love', text: '<3', unicode: '❤️' },
            { name: 'thumbsup', text: '(y)', unicode: '👍' },
            { name: 'thumbsdown', text: '(n)', unicode: '👎' },
            { name: 'clap', text: '(clap)', unicode: '👏' },
            { name: 'wave', text: '(wave)', unicode: '👋' }
        ];

        defaultEmotes.forEach(emote => {
            this.emotes.set(emote.text, emote);
        });

        console.log(`Loaded ${this.emotes.size} emotes`);
    }

    async loadModerationSettings() {
        // Load moderators from database
        try {
            const moderatorData = await this.gameEngine.database.collection('moderators')
                .find({ active: true }).toArray();
            
            moderatorData.forEach(mod => {
                this.moderators.add(mod.userId);
            });

            console.log(`Loaded ${this.moderators.size} moderators`);
        } catch (error) {
            console.error('Failed to load moderators:', error);
        }
    }

    setupRateLimiting() {
        // Rate limiting cleanup interval
        setInterval(() => {
            const now = Date.now();
            const cleanupTime = 60000; // 1 minute

            for (const [userId, rateLimitData] of this.rateLimits) {
                if (now - rateLimitData.lastMessage > cleanupTime) {
                    this.rateLimits.delete(userId);
                }
            }
        }, 60000);

        console.log('Rate limiting setup complete');
    }

    startBackgroundProcesses() {
        // Cleanup old messages
        setInterval(() => {
            this.cleanupOldMessages();
        }, 300000); // 5 minutes

        // Update channel statistics
        setInterval(() => {
            this.updateChannelStatistics();
        }, 60000); // 1 minute

        // Process message queue
        setInterval(() => {
            this.processMessageQueue();
        }, 1000); // 1 second

        // Cleanup expired mutes
        setInterval(() => {
            this.cleanupExpiredMutes();
        }, 30000); // 30 seconds

        console.log('Background processes started');
    }

    async sendMessage(userId, channelId, content, type = 'normal') {
        try {
            const player = this.gameEngine.playerManager.getPlayer(userId);
            if (!player) {
                throw new Error('Player not found');
            }

            const channel = this.channels.get(channelId);
            if (!channel) {
                throw new Error('Channel not found');
            }

            // Check if player can send messages to this channel
            const canSend = await this.canPlayerSendMessage(player, channel, content);
            if (!canSend.allowed) {
                this.sendErrorMessage(userId, canSend.reason);
                return false;
            }

            // Process message content
            const processedContent = await this.processMessageContent(content, player);
            if (!processedContent) {
                this.sendErrorMessage(userId, 'Message filtered');
                this.statistics.messagesFiltered++;
                return false;
            }

            // Create message object
            const message = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: userId,
                username: player.name,
                displayName: player.displayName || player.name,
                channelId: channelId,
                content: processedContent,
                originalContent: content,
                type: type,
                timestamp: Date.now(),
                edited: false,
                editHistory: [],
                reactions: new Map(),
                mentions: this.extractMentions(processedContent),
                metadata: {
                    playerLevel: player.level,
                    playerClass: player.class,
                    playerTitle: player.activeTitle,
                    playerGuild: player.guildId,
                    isVIP: player.isVIP || false,
                    isModerator: this.moderators.has(userId)
                }
            };

            // Add message to channel history
            channel.messageHistory.push(message);
            if (channel.messageHistory.length > this.config.historyLength) {
                channel.messageHistory.shift();
            }

            // Update channel statistics
            channel.statistics.totalMessages++;
            channel.lastActivity = Date.now();

            // Update global statistics
            this.statistics.totalMessages++;

            // Log message
            this.logMessage(message);

            // Broadcast message to channel users
            this.broadcastToChannel(channelId, 'chat:message', message);

            // Update rate limit
            this.updateRateLimit(userId);

            // Process mentions
            await this.processMentions(message);

            // Check for spam/abuse
            await this.checkMessageForAbuse(player, message);

            console.log(`Message sent: ${player.name} in ${channelId}: ${content}`);
            this.emit('messageSent', message);

            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            this.sendErrorMessage(userId, 'Failed to send message');
            return false;
        }
    }

    async canPlayerSendMessage(player, channel, content) {
        // Check if player is in channel
        if (!channel.users.has(player.id)) {
            return { allowed: false, reason: 'You are not in this channel' };
        }

        // Check if player is muted globally
        if (this.muteList.has(player.id)) {
            const muteData = this.muteList.get(player.id);
            if (muteData.expiresAt > Date.now()) {
                return { 
                    allowed: false, 
                    reason: `You are muted until ${new Date(muteData.expiresAt).toLocaleString()}` 
                };
            } else {
                this.muteList.delete(player.id);
            }
        }

        // Check if player is muted in channel
        if (channel.mutedUsers.has(player.id)) {
            const muteData = channel.mutedUsers.get(player.id);
            if (muteData.expiresAt > Date.now()) {
                return { 
                    allowed: false, 
                    reason: `You are muted in this channel until ${new Date(muteData.expiresAt).toLocaleString()}` 
                };
            } else {
                channel.mutedUsers.delete(player.id);
            }
        }

        // Check rate limiting
        if (!this.checkRateLimit(player.id)) {
            return { allowed: false, reason: 'You are sending messages too quickly' };
        }

        // Check message length
        if (content.length > this.config.maxMessageLength) {
            return { 
                allowed: false, 
                reason: `Message too long (max ${this.config.maxMessageLength} characters)` 
            };
        }

        // Check level requirements
        if (player.level < channel.settings.levelRequired) {
            return { 
                allowed: false, 
                reason: `Level ${channel.settings.levelRequired} required for this channel` 
            };
        }

        // Check max level restrictions (for newbie channel)
        if (channel.settings.maxLevel && player.level > channel.settings.maxLevel) {
            return { 
                allowed: false, 
                reason: `This channel is for players level ${channel.settings.maxLevel} and below` 
            };
        }

        return { allowed: true };
    }

    async processMessageContent(content, player) {
        let processedContent = content.trim();

        // Apply profanity filter
        if (this.config.profanityFilterEnabled) {
            processedContent = this.applyProfanityFilter(processedContent);
        }

        // Process emotes
        processedContent = this.processEmotes(processedContent);

        // Check for banned words
        if (this.containsBannedWords(processedContent)) {
            this.issueWarning(player.id, 'Use of banned words');
            return null;
        }

        // Apply auto-moderation rules
        const moderationResult = this.applyAutoModeration(processedContent, player);
        if (!moderationResult.allowed) {
            if (moderationResult.action === 'filter') {
                return null;
            } else if (moderationResult.action === 'warn') {
                this.issueWarning(player.id, moderationResult.reason);
            } else if (moderationResult.action === 'mute') {
                this.mutePlayer(player.id, moderationResult.duration, moderationResult.reason);
                return null;
            }
        }

        return processedContent;
    }

    applyProfanityFilter(content) {
        // Basic profanity filter implementation
        let filtered = content;
        
        for (const word of this.bannedWords) {
            const regex = new RegExp(word, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        }

        return filtered;
    }

    processEmotes(content) {
        let processed = content;

        for (const [text, emote] of this.emotes) {
            const regex = new RegExp(this.escapeRegex(text), 'g');
            processed = processed.replace(regex, emote.unicode);
        }

        return processed;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    containsBannedWords(content) {
        const lowerContent = content.toLowerCase();
        
        for (const word of this.bannedWords) {
            if (lowerContent.includes(word)) {
                return true;
            }
        }

        return false;
    }

    applyAutoModeration(content, player) {
        // Check excessive caps
        const capsRule = this.autoModerationRules.get('excessive_caps');
        if (capsRule && capsRule.enabled) {
            const capsPercentage = this.calculateCapsPercentage(content);
            if (capsPercentage > capsRule.threshold) {
                return {
                    allowed: false,
                    action: capsRule.action,
                    reason: capsRule.message
                };
            }
        }

        // Check repeated characters
        const repeatedRule = this.autoModerationRules.get('repeated_characters');
        if (repeatedRule && repeatedRule.enabled) {
            if (this.hasExcessiveRepeatedChars(content, repeatedRule.threshold)) {
                return {
                    allowed: false,
                    action: repeatedRule.action,
                    reason: repeatedRule.message
                };
            }
        }

        // Check flooding
        const floodRule = this.autoModerationRules.get('flooding');
        if (floodRule && floodRule.enabled) {
            if (this.isFlooding(player.id, content, floodRule.threshold)) {
                return {
                    allowed: false,
                    action: floodRule.action,
                    duration: floodRule.duration,
                    reason: floodRule.message
                };
            }
        }

        return { allowed: true };
    }

    calculateCapsPercentage(content) {
        const letters = content.replace(/[^a-zA-Z]/g, '');
        if (letters.length === 0) return 0;
        
        const caps = content.replace(/[^A-Z]/g, '');
        return caps.length / letters.length;
    }

    hasExcessiveRepeatedChars(content, threshold) {
        const regex = /(.)\1+/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            if (match[0].length > threshold) {
                return true;
            }
        }
        
        return false;
    }

    isFlooding(userId, content, threshold) {
        if (!this.spamDetection.has(userId)) {
            this.spamDetection.set(userId, {
                messages: [],
                violations: 0
            });
        }

        const userData = this.spamDetection.get(userId);
        const now = Date.now();
        
        // Clean old messages (older than 1 minute)
        userData.messages = userData.messages.filter(msg => now - msg.timestamp < 60000);
        
        // Count identical messages
        const identicalCount = userData.messages.filter(msg => msg.content === content).length;
        
        // Add current message
        userData.messages.push({ content, timestamp: now });
        
        return identicalCount >= threshold;
    }

    extractMentions(content) {
        const mentions = [];
        const mentionRegex = /@(\w+)/g;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }

        return mentions;
    }

    async processMentions(message) {
        for (const username of message.mentions) {
            const mentionedPlayer = this.gameEngine.playerManager.getPlayerByName(username);
            if (mentionedPlayer) {
                // Send notification to mentioned player
                this.sendNotification(mentionedPlayer.id, {
                    type: 'mention',
                    from: message.username,
                    channel: message.channelId,
                    message: message.content,
                    timestamp: message.timestamp
                });
            }
        }
    }

    async checkMessageForAbuse(player, message) {
        // Update player's message history for spam detection
        if (!this.spamDetection.has(player.id)) {
            this.spamDetection.set(player.id, {
                messages: [],
                violations: 0
            });
        }

        const userData = this.spamDetection.get(player.id);
        userData.messages.push({
            content: message.content,
            timestamp: message.timestamp,
            channelId: message.channelId
        });

        // Check for spam patterns
        this.checkSpamPatterns(player.id, userData);
    }

    checkSpamPatterns(userId, userData) {
        const now = Date.now();
        const recentMessages = userData.messages.filter(msg => now - msg.timestamp < 60000);

        // Check message frequency
        if (recentMessages.length > this.config.maxMessagesPerMinute) {
            this.issueWarning(userId, 'Sending messages too quickly');
            userData.violations++;
        }

        // Check for identical messages
        const messageGroups = new Map();
        recentMessages.forEach(msg => {
            const count = messageGroups.get(msg.content) || 0;
            messageGroups.set(msg.content, count + 1);
        });

        for (const [content, count] of messageGroups) {
            if (count >= 3) {
                this.issueWarning(userId, 'Repeated identical messages');
                userData.violations++;
                break;
            }
        }

        // Take action based on violations
        if (userData.violations >= this.config.banThreshold) {
            this.banPlayer(userId, 'Excessive chat violations');
        } else if (userData.violations >= this.config.muteThreshold) {
            this.mutePlayer(userId, this.config.muteDuration, 'Multiple chat violations');
        }
    }

    checkRateLimit(userId) {
        if (!this.rateLimits.has(userId)) {
            this.rateLimits.set(userId, {
                messages: 0,
                lastMessage: Date.now(),
                windowStart: Date.now()
            });
            return true;
        }

        const rateData = this.rateLimits.get(userId);
        const now = Date.now();
        const windowDuration = 60000; // 1 minute

        // Reset window if needed
        if (now - rateData.windowStart > windowDuration) {
            rateData.messages = 0;
            rateData.windowStart = now;
        }

        // Check if under limit
        if (rateData.messages >= this.config.maxMessagesPerMinute) {
            return false;
        }

        return true;
    }

    updateRateLimit(userId) {
        if (!this.rateLimits.has(userId)) {
            this.rateLimits.set(userId, {
                messages: 1,
                lastMessage: Date.now(),
                windowStart: Date.now()
            });
        } else {
            const rateData = this.rateLimits.get(userId);
            rateData.messages++;
            rateData.lastMessage = Date.now();
        }
    }

    issueWarning(userId, reason) {
        if (!this.warningSystem.has(userId)) {
            this.warningSystem.set(userId, {
                warnings: 0,
                lastWarning: 0,
                reasons: []
            });
        }

        const warningData = this.warningSystem.get(userId);
        warningData.warnings++;
        warningData.lastWarning = Date.now();
        warningData.reasons.push({
            reason: reason,
            timestamp: Date.now()
        });

        this.statistics.usersWarned++;

        // Send warning message to user
        this.sendSystemMessage(userId, `Warning: ${reason}. Total warnings: ${warningData.warnings}`);

        // Auto-mute if too many warnings
        if (warningData.warnings >= this.config.warnThreshold) {
            this.mutePlayer(userId, this.config.muteDuration, 'Too many warnings');
        }

        console.log(`Issued warning to user ${userId}: ${reason}`);
        this.emit('warningIssued', userId, reason, warningData.warnings);
    }

    mutePlayer(userId, duration, reason) {
        const expiresAt = Date.now() + duration;
        
        this.muteList.set(userId, {
            reason: reason,
            mutedAt: Date.now(),
            expiresAt: expiresAt,
            mutedBy: 'system'
        });

        this.statistics.usersMuted++;

        // Send mute notification
        this.sendSystemMessage(userId, `You have been muted for ${Math.floor(duration / 60000)} minutes. Reason: ${reason}`);

        console.log(`Muted user ${userId} for ${duration}ms: ${reason}`);
        this.emit('playerMuted', userId, duration, reason);
    }

    banPlayer(userId, reason) {
        // Implementation would depend on your ban system
        console.log(`Player ${userId} should be banned: ${reason}`);
        this.emit('playerBanned', userId, reason);
    }

    async sendPrivateMessage(fromUserId, toUsername, content) {
        try {
            const fromPlayer = this.gameEngine.playerManager.getPlayer(fromUserId);
            const toPlayer = this.gameEngine.playerManager.getPlayerByName(toUsername);

            if (!fromPlayer || !toPlayer) {
                this.sendErrorMessage(fromUserId, 'Player not found');
                return false;
            }

            // Check if private messages are allowed
            if (!this.config.allowPrivateMessages) {
                this.sendErrorMessage(fromUserId, 'Private messages are disabled');
                return false;
            }

            // Check if sender is muted
            if (this.muteList.has(fromUserId)) {
                this.sendErrorMessage(fromUserId, 'You are muted and cannot send private messages');
                return false;
            }

            // Check if recipient is ignoring sender
            const toPreferences = this.userPreferences.get(toPlayer.id) || {};
            if (toPreferences.ignoredUsers && toPreferences.ignoredUsers.includes(fromUserId)) {
                this.sendErrorMessage(fromUserId, 'That player is ignoring you');
                return false;
            }

            // Process message content
            const processedContent = await this.processMessageContent(content, fromPlayer);
            if (!processedContent) {
                this.sendErrorMessage(fromUserId, 'Message filtered');
                return false;
            }

            const message = {
                id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'private',
                fromUserId: fromUserId,
                fromUsername: fromPlayer.name,
                toUserId: toPlayer.id,
                toUsername: toPlayer.name,
                content: processedContent,
                timestamp: Date.now()
            };

            // Store private message
            if (!this.privateMessages.has(fromUserId)) {
                this.privateMessages.set(fromUserId, []);
            }
            if (!this.privateMessages.has(toPlayer.id)) {
                this.privateMessages.set(toPlayer.id, []);
            }

            this.privateMessages.get(fromUserId).push(message);
            this.privateMessages.get(toPlayer.id).push(message);

            // Send to both players
            this.sendToPlayer(fromUserId, 'chat:privateMessage', {
                ...message,
                direction: 'sent'
            });

            this.sendToPlayer(toPlayer.id, 'chat:privateMessage', {
                ...message,
                direction: 'received'
            });

            this.statistics.privateMessagesSent++;

            console.log(`Private message: ${fromPlayer.name} -> ${toPlayer.name}: ${content}`);
            this.emit('privateMessageSent', message);

            return true;
        } catch (error) {
            console.error('Failed to send private message:', error);
            this.sendErrorMessage(fromUserId, 'Failed to send private message');
            return false;
        }
    }

    async joinChannel(userId, channelId, password = null) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(userId);
            const channel = this.channels.get(channelId);

            if (!player || !channel) {
                this.sendErrorMessage(userId, 'Player or channel not found');
                return false;
            }

            // Check if already in channel
            if (channel.users.has(userId)) {
                this.sendErrorMessage(userId, 'You are already in this channel');
                return false;
            }

            // Check channel capacity
            if (channel.users.size >= channel.settings.maxUsers) {
                this.sendErrorMessage(userId, 'Channel is full');
                return false;
            }

            // Check level requirements
            if (player.level < channel.settings.levelRequired) {
                this.sendErrorMessage(userId, `Level ${channel.settings.levelRequired} required`);
                return false;
            }

            // Check if banned
            if (channel.bannedUsers.has(userId)) {
                this.sendErrorMessage(userId, 'You are banned from this channel');
                return false;
            }

            // Check password
            if (channel.settings.password && password !== channel.settings.password) {
                this.sendErrorMessage(userId, 'Incorrect password');
                return false;
            }

            // Add user to channel
            channel.users.add(userId);
            channel.statistics.totalUsers++;
            
            if (channel.users.size > channel.statistics.peakUsers) {
                channel.statistics.peakUsers = channel.users.size;
            }

            // Send join confirmation
            this.sendToPlayer(userId, 'chat:joinedChannel', {
                channelId: channelId,
                channelName: channel.name,
                userCount: channel.users.size,
                recentMessages: channel.messageHistory.slice(-10)
            });

            // Notify other users
            this.broadcastToChannel(channelId, 'chat:userJoined', {
                userId: userId,
                username: player.name,
                userCount: channel.users.size
            }, [userId]);

            console.log(`Player ${player.name} joined channel ${channelId}`);
            this.emit('playerJoinedChannel', userId, channelId);

            return true;
        } catch (error) {
            console.error('Failed to join channel:', error);
            this.sendErrorMessage(userId, 'Failed to join channel');
            return false;
        }
    }

    async leaveChannel(userId, channelId) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(userId);
            const channel = this.channels.get(channelId);

            if (!player || !channel) {
                return false;
            }

            if (!channel.users.has(userId)) {
                return false;
            }

            // Remove user from channel
            channel.users.delete(userId);

            // Send leave confirmation
            this.sendToPlayer(userId, 'chat:leftChannel', {
                channelId: channelId,
                channelName: channel.name
            });

            // Notify other users
            this.broadcastToChannel(channelId, 'chat:userLeft', {
                userId: userId,
                username: player.name,
                userCount: channel.users.size
            });

            console.log(`Player ${player.name} left channel ${channelId}`);
            this.emit('playerLeftChannel', userId, channelId);

            return true;
        } catch (error) {
            console.error('Failed to leave channel:', error);
            return false;
        }
    }

    broadcastToChannel(channelId, event, data, excludeUsers = []) {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        for (const userId of channel.users) {
            if (!excludeUsers.includes(userId)) {
                this.sendToPlayer(userId, event, data);
            }
        }
    }

    sendToPlayer(userId, event, data) {
        const player = this.gameEngine.playerManager.getPlayer(userId);
        if (player && player.socket) {
            player.socket.emit(event, data);
        }
    }

    sendErrorMessage(userId, message) {
        this.sendToPlayer(userId, 'chat:error', {
            message: message,
            timestamp: Date.now()
        });
    }

    sendSystemMessage(userId, message) {
        this.sendToPlayer(userId, 'chat:system', {
            message: message,
            timestamp: Date.now()
        });
    }

    sendNotification(userId, notification) {
        this.sendToPlayer(userId, 'chat:notification', notification);
    }

    // Chat command handlers
    async handleHelpCommand(userId, args) {
        const commands = Array.from(this.chatCommands.entries())
            .filter(([command, config]) => {
                if (config.requiresModerator && !this.moderators.has(userId)) {
                    return false;
                }
                return true;
            })
            .map(([command, config]) => `${command} - ${config.description}`)
            .join('\n');

        this.sendSystemMessage(userId, `Available commands:\n${commands}`);
    }

    async handleWhoCommand(userId, args) {
        const channelId = args[0] || 'global';
        const channel = this.channels.get(channelId);
        
        if (!channel) {
            this.sendErrorMessage(userId, 'Channel not found');
            return;
        }

        const users = Array.from(channel.users)
            .map(id => this.gameEngine.playerManager.getPlayer(id))
            .filter(player => player)
            .map(player => `${player.name} (Level ${player.level})`)
            .join(', ');

        this.sendSystemMessage(userId, `Players in ${channel.name}: ${users}`);
    }

    async handleWhisperCommand(userId, args) {
        if (args.length < 2) {
            this.sendErrorMessage(userId, 'Usage: /whisper <player> <message>');
            return;
        }

        const targetUsername = args[0];
        const message = args.slice(1).join(' ');

        await this.sendPrivateMessage(userId, targetUsername, message);
    }

    async handleIgnoreCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /ignore <player>');
            return;
        }

        const targetUsername = args[0];
        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);

        if (!targetPlayer) {
            this.sendErrorMessage(userId, 'Player not found');
            return;
        }

        if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, {});
        }

        const preferences = this.userPreferences.get(userId);
        if (!preferences.ignoredUsers) {
            preferences.ignoredUsers = [];
        }

        if (!preferences.ignoredUsers.includes(targetPlayer.id)) {
            preferences.ignoredUsers.push(targetPlayer.id);
            this.sendSystemMessage(userId, `Now ignoring ${targetUsername}`);
        } else {
            this.sendErrorMessage(userId, 'Already ignoring that player');
        }
    }

    async handleUnignoreCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /unignore <player>');
            return;
        }

        const targetUsername = args[0];
        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);

        if (!targetPlayer) {
            this.sendErrorMessage(userId, 'Player not found');
            return;
        }

        const preferences = this.userPreferences.get(userId);
        if (preferences && preferences.ignoredUsers) {
            const index = preferences.ignoredUsers.indexOf(targetPlayer.id);
            if (index > -1) {
                preferences.ignoredUsers.splice(index, 1);
                this.sendSystemMessage(userId, `No longer ignoring ${targetUsername}`);
            } else {
                this.sendErrorMessage(userId, 'Not ignoring that player');
            }
        } else {
            this.sendErrorMessage(userId, 'Not ignoring that player');
        }
    }

    async handleJoinCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /join <channel> [password]');
            return;
        }

        const channelId = args[0];
        const password = args[1] || null;

        await this.joinChannel(userId, channelId, password);
    }

    async handleLeaveCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /leave <channel>');
            return;
        }

        const channelId = args[0];
        await this.leaveChannel(userId, channelId);
    }

    async handleChannelsCommand(userId, args) {
        const channelList = Array.from(this.channels.values())
            .map(channel => `${channel.id} - ${channel.name} (${channel.users.size}/${channel.settings.maxUsers})`)
            .join('\n');

        this.sendSystemMessage(userId, `Available channels:\n${channelList}`);
    }

    // Moderator command handlers
    async handleMuteCommand(userId, args) {
        if (args.length < 2) {
            this.sendErrorMessage(userId, 'Usage: /mute <player> <duration_minutes> [reason]');
            return;
        }

        const targetUsername = args[0];
        const duration = parseInt(args[1]) * 60000; // Convert to milliseconds
        const reason = args.slice(2).join(' ') || 'No reason provided';

        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);
        if (!targetPlayer) {
            this.sendErrorMessage(userId, 'Player not found');
            return;
        }

        this.mutePlayer(targetPlayer.id, duration, reason);
        this.sendSystemMessage(userId, `Muted ${targetUsername} for ${args[1]} minutes`);
    }

    async handleUnmuteCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /unmute <player>');
            return;
        }

        const targetUsername = args[0];
        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);

        if (!targetPlayer) {
            this.sendErrorMessage(userId, 'Player not found');
            return;
        }

        if (this.muteList.has(targetPlayer.id)) {
            this.muteList.delete(targetPlayer.id);
            this.sendSystemMessage(userId, `Unmuted ${targetUsername}`);
            this.sendSystemMessage(targetPlayer.id, 'You have been unmuted');
        } else {
            this.sendErrorMessage(userId, 'Player is not muted');
        }
    }

    async handleKickCommand(userId, args) {
        if (args.length < 2) {
            this.sendErrorMessage(userId, 'Usage: /kick <player> <channel> [reason]');
            return;
        }

        const targetUsername = args[0];
        const channelId = args[1];
        const reason = args.slice(2).join(' ') || 'No reason provided';

        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);
        const channel = this.channels.get(channelId);

        if (!targetPlayer || !channel) {
            this.sendErrorMessage(userId, 'Player or channel not found');
            return;
        }

        if (channel.users.has(targetPlayer.id)) {
            channel.users.delete(targetPlayer.id);
            channel.statistics.usersKicked++;
            
            this.sendSystemMessage(targetPlayer.id, `You were kicked from ${channel.name}. Reason: ${reason}`);
            this.sendSystemMessage(userId, `Kicked ${targetUsername} from ${channel.name}`);
            
            this.broadcastToChannel(channelId, 'chat:userKicked', {
                username: targetUsername,
                reason: reason
            });
        } else {
            this.sendErrorMessage(userId, 'Player is not in that channel');
        }
    }

    async handleBanCommand(userId, args) {
        if (args.length < 2) {
            this.sendErrorMessage(userId, 'Usage: /ban <player> <channel> [reason]');
            return;
        }

        const targetUsername = args[0];
        const channelId = args[1];
        const reason = args.slice(2).join(' ') || 'No reason provided';

        const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetUsername);
        const channel = this.channels.get(channelId);

        if (!targetPlayer || !channel) {
            this.sendErrorMessage(userId, 'Player or channel not found');
            return;
        }

        channel.bannedUsers.add(targetPlayer.id);
        channel.users.delete(targetPlayer.id);

        this.sendSystemMessage(targetPlayer.id, `You were banned from ${channel.name}. Reason: ${reason}`);
        this.sendSystemMessage(userId, `Banned ${targetUsername} from ${channel.name}`);
    }

    async handleAnnounceCommand(userId, args) {
        if (args.length < 1) {
            this.sendErrorMessage(userId, 'Usage: /announce <message>');
            return;
        }

        const message = args.join(' ');
        const moderator = this.gameEngine.playerManager.getPlayer(userId);

        const announcement = {
            id: `announce_${Date.now()}`,
            type: 'announcement',
            content: message,
            author: moderator.name,
            timestamp: Date.now()
        };

        // Broadcast to all channels
        for (const [channelId] of this.channels) {
            this.broadcastToChannel(channelId, 'chat:announcement', announcement);
        }

        this.statistics.announcementsSent++;
        console.log(`Announcement by ${moderator.name}: ${message}`);
    }

    async processCommand(userId, command, args) {
        const commandConfig = this.chatCommands.get(command);
        if (!commandConfig) {
            this.sendErrorMessage(userId, 'Unknown command');
            return;
        }

        // Check authentication
        if (commandConfig.requiresAuth) {
            const player = this.gameEngine.playerManager.getPlayer(userId);
            if (!player) {
                this.sendErrorMessage(userId, 'Authentication required');
                return;
            }
        }

        // Check moderator permissions
        if (commandConfig.requiresModerator && !this.moderators.has(userId)) {
            this.sendErrorMessage(userId, 'Moderator permissions required');
            return;
        }

        // Check cooldown
        if (commandConfig.cooldown) {
            const now = Date.now();
            const cooldownKey = `${userId}:${command}`;
            const lastUsed = this.commandCooldowns?.get(cooldownKey) || 0;
            
            if (now - lastUsed < commandConfig.cooldown) {
                const remaining = Math.ceil((commandConfig.cooldown - (now - lastUsed)) / 1000);
                this.sendErrorMessage(userId, `Command on cooldown. ${remaining} seconds remaining.`);
                return;
            }

            if (!this.commandCooldowns) {
                this.commandCooldowns = new Map();
            }
            this.commandCooldowns.set(cooldownKey, now);
        }

        // Execute command
        try {
            await commandConfig.handler(userId, args);
            this.statistics.commandsExecuted++;
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
            this.sendErrorMessage(userId, 'Command execution failed');
        }
    }

    logMessage(message) {
        const channelLogs = this.chatLogs.get(message.channelId) || [];
        channelLogs.push({
            messageId: message.id,
            userId: message.userId,
            username: message.username,
            content: message.originalContent,
            processedContent: message.content,
            timestamp: message.timestamp,
            type: message.type
        });

        // Keep only recent logs
        if (channelLogs.length > 1000) {
            channelLogs.shift();
        }

        this.chatLogs.set(message.channelId, channelLogs);
    }

    cleanupOldMessages() {
        const now = Date.now();
        const maxAge = 86400000; // 24 hours

        for (const [channelId, channel] of this.channels) {
            channel.messageHistory = channel.messageHistory.filter(
                msg => now - msg.timestamp < maxAge
            );
        }

        // Cleanup private messages
        for (const [userId, messages] of this.privateMessages) {
            this.privateMessages.set(userId, 
                messages.filter(msg => now - msg.timestamp < maxAge)
            );
        }

        console.log('Cleaned up old messages');
    }

    updateChannelStatistics() {
        for (const [channelId, channel] of this.channels) {
            // Update peak users if current users is higher
            if (channel.users.size > channel.statistics.peakUsers) {
                channel.statistics.peakUsers = channel.users.size;
            }
        }
    }

    processMessageQueue() {
        // Process any queued messages (for rate limiting, etc.)
        for (const [userId, queue] of this.messageQueue) {
            if (queue.length > 0 && this.checkRateLimit(userId)) {
                const message = queue.shift();
                this.sendMessage(message.userId, message.channelId, message.content, message.type);
            }
        }
    }

    cleanupExpiredMutes() {
        const now = Date.now();

        // Cleanup global mutes
        for (const [userId, muteData] of this.muteList) {
            if (muteData.expiresAt <= now) {
                this.muteList.delete(userId);
                this.sendSystemMessage(userId, 'Your mute has expired');
            }
        }

        // Cleanup channel mutes
        for (const [channelId, channel] of this.channels) {
            for (const [userId, muteData] of channel.mutedUsers) {
                if (muteData.expiresAt <= now) {
                    channel.mutedUsers.delete(userId);
                    this.sendSystemMessage(userId, `Your mute in ${channel.name} has expired`);
                }
            }
        }
    }

    getChannelList() {
        return Array.from(this.channels.values()).map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            description: channel.description,
            userCount: channel.users.size,
            maxUsers: channel.settings.maxUsers,
            levelRequired: channel.settings.levelRequired,
            hasPassword: !!channel.settings.password
        }));
    }

    getChannelUsers(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return [];

        return Array.from(channel.users)
            .map(userId => this.gameEngine.playerManager.getPlayer(userId))
            .filter(player => player)
            .map(player => ({
                id: player.id,
                name: player.name,
                level: player.level,
                class: player.class,
                isOnline: true
            }));
    }

    getStatistics() {
        return {
            ...this.statistics,
            totalChannels: this.channels.size,
            totalActiveUsers: Array.from(this.channels.values())
                .reduce((total, channel) => total + channel.users.size, 0),
            totalMutedUsers: this.muteList.size,
            totalModerators: this.moderators.size
        };
    }

    destroy() {
        console.log('Destroying ChatSystem...');
        
        // Clear all intervals and timers
        clearInterval(this.cleanupInterval);
        clearInterval(this.statisticsInterval);
        clearInterval(this.queueInterval);
        clearInterval(this.muteCleanupInterval);
        
        // Clear all data
        this.channels.clear();
        this.messageHistory.clear();
        this.muteList.clear();
        this.privateMessages.clear();
        this.rateLimits.clear();
        this.spamDetection.clear();
        this.warningSystem.clear();
        this.chatLogs.clear();
        
        console.log('ChatSystem destroyed');
    }
}

module.exports = ChatSystem;
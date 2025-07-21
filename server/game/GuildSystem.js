const EventEmitter = require('events');

class GuildSystem extends EventEmitter {
    constructor(gameEngine) {
        super();
        this.gameEngine = gameEngine;
        this.guilds = new Map();
        this.playerGuilds = new Map();
        this.guildInvites = new Map();
        this.guildApplications = new Map();
        this.guildRanks = new Map();
        this.guildPermissions = new Map();
        this.guildWars = new Map();
        this.guildAlliances = new Map();
        this.guildEvents = new Map();
        this.guildQuests = new Map();
        this.guildTreasury = new Map();
        this.guildBuildings = new Map();
        this.guildTech = new Map();
        this.guildAchievements = new Map();
        this.guildHistory = new Map();
        this.guildChat = new Map();
        this.guildMarkets = new Map();
        this.statistics = {
            totalGuilds: 0,
            guildsCreated: 0,
            guildsDestroyed: 0,
            guildMembersJoined: 0,
            guildMembersLeft: 0,
            guildWarsStarted: 0,
            guildWarsEnded: 0,
            guildAlliancesFormed: 0,
            guildEventsDone: 0,
            guildQuestsCompleted: 0
        };
        this.config = {
            maxGuildNameLength: 30,
            maxGuildDescriptionLength: 500,
            maxGuildMembers: 100,
            guildCreationCost: 10000,
            maxGuildRanks: 10,
            guildInactivityDays: 30,
            maxGuildWars: 5,
            maxGuildAlliances: 3,
            guildWarDuration: 604800000, // 7 days
            guildTaxRate: 0.05, // 5% of member earnings
            requireApproval: true,
            allowPublicGuilds: true
        };
        this.defaultRanks = [
            { id: 'guildmaster', name: 'Guild Master', level: 100, permissions: ['all'] },
            { id: 'officer', name: 'Officer', level: 80, permissions: ['invite', 'kick', 'promote_demote', 'manage_treasury', 'start_events'] },
            { id: 'veteran', name: 'Veteran', level: 60, permissions: ['invite', 'contribute_treasury'] },
            { id: 'member', name: 'Member', level: 40, permissions: ['contribute_treasury', 'participate_events'] },
            { id: 'recruit', name: 'Recruit', level: 20, permissions: ['chat'] }
        ];
        this.guildBenefits = new Map();
        this.guildUpgrades = new Map();
    }

    async initialize() {
        console.log('Initializing GuildSystem...');
        
        try {
            // Initialize default ranks and permissions
            this.initializeDefaultRanks();
            
            // Initialize guild benefits
            this.initializeGuildBenefits();
            
            // Initialize guild upgrades
            this.initializeGuildUpgrades();
            
            // Load existing guilds
            await this.loadGuilds();
            
            // Load player guild memberships
            await this.loadPlayerGuilds();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            console.log('GuildSystem initialized successfully');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize GuildSystem:', error);
            throw error;
        }
    }

    initializeDefaultRanks() {
        for (const rank of this.defaultRanks) {
            this.guildRanks.set(rank.id, rank);
        }

        // Initialize permissions
        const permissions = [
            'invite', 'kick', 'promote_demote', 'manage_treasury', 'start_events',
            'manage_buildings', 'declare_war', 'form_alliance', 'manage_quests',
            'access_vault', 'contribute_treasury', 'participate_events', 'chat',
            'view_logs', 'edit_description', 'manage_ranks', 'all'
        ];

        permissions.forEach(permission => {
            this.guildPermissions.set(permission, {
                name: permission,
                description: `Permission to ${permission.replace('_', ' ')}`
            });
        });

        console.log('Default ranks and permissions initialized');
    }

    initializeGuildBenefits() {
        this.guildBenefits.set('experience_bonus', {
            name: 'Experience Bonus',
            description: 'Increased experience gain for guild members',
            levels: [
                { level: 1, bonus: 0.05, cost: 5000 },
                { level: 2, bonus: 0.10, cost: 15000 },
                { level: 3, bonus: 0.15, cost: 35000 },
                { level: 4, bonus: 0.20, cost: 75000 },
                { level: 5, bonus: 0.25, cost: 150000 }
            ]
        });

        this.guildBenefits.set('gold_bonus', {
            name: 'Gold Bonus',
            description: 'Increased gold gain for guild members',
            levels: [
                { level: 1, bonus: 0.05, cost: 5000 },
                { level: 2, bonus: 0.10, cost: 15000 },
                { level: 3, bonus: 0.15, cost: 35000 },
                { level: 4, bonus: 0.20, cost: 75000 },
                { level: 5, bonus: 0.25, cost: 150000 }
            ]
        });

        this.guildBenefits.set('member_capacity', {
            name: 'Member Capacity',
            description: 'Increase maximum guild members',
            levels: [
                { level: 1, bonus: 25, cost: 10000 },
                { level: 2, bonus: 50, cost: 25000 },
                { level: 3, bonus: 100, cost: 50000 },
                { level: 4, bonus: 150, cost: 100000 },
                { level: 5, bonus: 200, cost: 200000 }
            ]
        });

        this.guildBenefits.set('treasury_capacity', {
            name: 'Treasury Capacity',
            description: 'Increase guild treasury storage',
            levels: [
                { level: 1, bonus: 50000, cost: 8000 },
                { level: 2, bonus: 100000, cost: 20000 },
                { level: 3, bonus: 200000, cost: 45000 },
                { level: 4, bonus: 400000, cost: 90000 },
                { level: 5, bonus: 800000, cost: 180000 }
            ]
        });

        console.log('Guild benefits initialized');
    }

    initializeGuildUpgrades() {
        this.guildUpgrades.set('guild_hall', {
            name: 'Guild Hall',
            description: 'Main guild building that unlocks other features',
            levels: [
                { level: 1, requirements: {}, cost: 20000, benefits: ['basic_features'] },
                { level: 2, requirements: { members: 10 }, cost: 50000, benefits: ['guild_quests'] },
                { level: 3, requirements: { members: 25 }, cost: 100000, benefits: ['guild_wars'] },
                { level: 4, requirements: { members: 50 }, cost: 200000, benefits: ['guild_market'] },
                { level: 5, requirements: { members: 75 }, cost: 400000, benefits: ['guild_fortress'] }
            ]
        });

        this.guildUpgrades.set('treasury_vault', {
            name: 'Treasury Vault',
            description: 'Secure storage for guild resources',
            levels: [
                { level: 1, requirements: { guild_hall: 1 }, cost: 15000, benefits: ['item_storage'] },
                { level: 2, requirements: { guild_hall: 2 }, cost: 35000, benefits: ['equipment_storage'] },
                { level: 3, requirements: { guild_hall: 3 }, cost: 75000, benefits: ['artifact_storage'] },
                { level: 4, requirements: { guild_hall: 4 }, cost: 150000, benefits: ['legendary_storage'] },
                { level: 5, requirements: { guild_hall: 5 }, cost: 300000, benefits: ['unlimited_storage'] }
            ]
        });

        this.guildUpgrades.set('training_grounds', {
            name: 'Training Grounds',
            description: 'Facilities for member training and skill development',
            levels: [
                { level: 1, requirements: { guild_hall: 2 }, cost: 25000, benefits: ['basic_training'] },
                { level: 2, requirements: { guild_hall: 3 }, cost: 60000, benefits: ['advanced_training'] },
                { level: 3, requirements: { guild_hall: 4 }, cost: 120000, benefits: ['expert_training'] },
                { level: 4, requirements: { guild_hall: 5 }, cost: 250000, benefits: ['master_training'] },
                { level: 5, requirements: { members: 100 }, cost: 500000, benefits: ['legendary_training'] }
            ]
        });

        console.log('Guild upgrades initialized');
    }

    async loadGuilds() {
        try {
            const guildData = await this.gameEngine.database.collection('guilds')
                .find({}).toArray();

            for (const guild of guildData) {
                this.guilds.set(guild.id, guild);
                this.statistics.totalGuilds++;
            }

            console.log(`Loaded ${this.guilds.size} guilds`);
        } catch (error) {
            console.error('Failed to load guilds:', error);
        }
    }

    async loadPlayerGuilds() {
        try {
            const playerGuildData = await this.gameEngine.database.collection('player_guilds')
                .find({}).toArray();

            for (const data of playerGuildData) {
                this.playerGuilds.set(data.playerId, {
                    guildId: data.guildId,
                    rank: data.rank,
                    joinedAt: data.joinedAt,
                    contribution: data.contribution || 0,
                    lastActive: data.lastActive || Date.now()
                });
            }

            console.log(`Loaded guild memberships for ${this.playerGuilds.size} players`);
        } catch (error) {
            console.error('Failed to load player guilds:', error);
        }
    }

    startBackgroundProcesses() {
        // Guild activity cleanup
        setInterval(() => {
            this.cleanupInactiveMembers();
        }, 3600000); // 1 hour

        // Guild war updates
        setInterval(() => {
            this.updateGuildWars();
        }, 300000); // 5 minutes

        // Guild treasury calculations
        setInterval(() => {
            this.processGuildTaxes();
        }, 600000); // 10 minutes

        // Guild data saving
        setInterval(() => {
            this.saveGuildData();
        }, 900000); // 15 minutes

        console.log('Background processes started');
    }

    async createGuild(playerId, guildName, description = '', isPublic = true) {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            if (!player) {
                return { success: false, message: 'Player not found' };
            }

            // Check if player is already in a guild
            if (this.playerGuilds.has(playerId)) {
                return { success: false, message: 'Already in a guild' };
            }

            // Validate guild name
            if (!guildName || guildName.length > this.config.maxGuildNameLength) {
                return { 
                    success: false, 
                    message: `Guild name must be 1-${this.config.maxGuildNameLength} characters` 
                };
            }

            // Check if guild name already exists
            for (const [guildId, guild] of this.guilds) {
                if (guild.name.toLowerCase() === guildName.toLowerCase()) {
                    return { success: false, message: 'Guild name already taken' };
                }
            }

            // Check player has enough gold
            if (player.gold < this.config.guildCreationCost) {
                return { 
                    success: false, 
                    message: `Requires ${this.config.guildCreationCost} gold` 
                };
            }

            // Deduct gold
            await this.gameEngine.playerManager.removeGold(playerId, this.config.guildCreationCost);

            // Create guild
            const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const guild = {
                id: guildId,
                name: guildName,
                description: description,
                createdAt: Date.now(),
                createdBy: playerId,
                leaderId: playerId,
                isPublic: isPublic,
                level: 1,
                experience: 0,
                members: new Map([[playerId, {
                    playerId: playerId,
                    rank: 'guildmaster',
                    joinedAt: Date.now(),
                    contribution: 0,
                    lastActive: Date.now()
                }]]),
                treasury: {
                    gold: 0,
                    items: new Map(),
                    capacity: 100000
                },
                ranks: new Map(this.defaultRanks.map(rank => [rank.id, { ...rank }])),
                upgrades: new Map([['guild_hall', { level: 1, purchased: Date.now() }]]),
                benefits: new Map(),
                wars: new Map(),
                alliances: new Map(),
                events: new Map(),
                quests: new Map(),
                achievements: [],
                statistics: {
                    totalMembers: 1,
                    membersJoined: 1,
                    membersLeft: 0,
                    warsWon: 0,
                    warsLost: 0,
                    questsCompleted: 0,
                    eventsCompleted: 0,
                    totalContribution: 0
                },
                settings: {
                    requireApproval: this.config.requireApproval,
                    taxRate: this.config.guildTaxRate,
                    allowPublicChat: true,
                    autoKickInactive: true,
                    inactivityDays: this.config.guildInactivityDays
                },
                motd: 'Welcome to the guild!',
                tags: []
            };

            this.guilds.set(guildId, guild);
            this.playerGuilds.set(playerId, {
                guildId: guildId,
                rank: 'guildmaster',
                joinedAt: Date.now(),
                contribution: 0,
                lastActive: Date.now()
            });

            // Update statistics
            this.statistics.totalGuilds++;
            this.statistics.guildsCreated++;
            this.statistics.guildMembersJoined++;

            // Send notifications
            this.sendGuildUpdate(guildId, 'guild_created', {
                guildId: guildId,
                name: guildName,
                creator: player.name
            });

            console.log(`Guild ${guildName} created by ${player.name}`);
            this.emit('guildCreated', guildId, guild, playerId);

            return { success: true, guild: guild };
        } catch (error) {
            console.error('Failed to create guild:', error);
            return { success: false, message: 'Failed to create guild' };
        }
    }

    async invitePlayer(guildId, inviterId, targetPlayerName) {
        try {
            const guild = this.guilds.get(guildId);
            const inviter = this.gameEngine.playerManager.getPlayer(inviterId);
            const targetPlayer = this.gameEngine.playerManager.getPlayerByName(targetPlayerName);

            if (!guild || !inviter || !targetPlayer) {
                return { success: false, message: 'Guild, inviter, or target player not found' };
            }

            // Check if inviter has permission
            if (!this.hasPermission(inviterId, guildId, 'invite')) {
                return { success: false, message: 'No permission to invite' };
            }

            // Check if target is already in a guild
            if (this.playerGuilds.has(targetPlayer.id)) {
                return { success: false, message: 'Player is already in a guild' };
            }

            // Check if already invited
            const inviteKey = `${guildId}:${targetPlayer.id}`;
            if (this.guildInvites.has(inviteKey)) {
                return { success: false, message: 'Player already invited' };
            }

            // Check guild capacity
            if (guild.members.size >= this.getGuildMemberCapacity(guild)) {
                return { success: false, message: 'Guild is full' };
            }

            // Create invitation
            const invite = {
                id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                guildId: guildId,
                guildName: guild.name,
                inviterId: inviterId,
                inviterName: inviter.name,
                targetPlayerId: targetPlayer.id,
                targetPlayerName: targetPlayer.name,
                createdAt: Date.now(),
                expiresAt: Date.now() + 604800000, // 7 days
                status: 'pending'
            };

            this.guildInvites.set(inviteKey, invite);

            // Send invitation to target player
            this.sendPlayerNotification(targetPlayer.id, 'guild_invite', invite);

            // Log guild event
            this.logGuildEvent(guildId, 'member_invited', {
                inviter: inviter.name,
                target: targetPlayer.name,
                timestamp: Date.now()
            });

            console.log(`${inviter.name} invited ${targetPlayer.name} to guild ${guild.name}`);
            this.emit('playerInvited', guildId, inviterId, targetPlayer.id, invite);

            return { success: true, invite: invite };
        } catch (error) {
            console.error('Failed to invite player:', error);
            return { success: false, message: 'Failed to invite player' };
        }
    }

    async acceptInvite(playerId, inviteId) {
        try {
            // Find the invite
            let invite = null;
            let inviteKey = null;
            
            for (const [key, inv] of this.guildInvites) {
                if (inv.id === inviteId && inv.targetPlayerId === playerId) {
                    invite = inv;
                    inviteKey = key;
                    break;
                }
            }

            if (!invite) {
                return { success: false, message: 'Invite not found' };
            }

            if (invite.status !== 'pending') {
                return { success: false, message: 'Invite is no longer valid' };
            }

            if (Date.now() > invite.expiresAt) {
                this.guildInvites.delete(inviteKey);
                return { success: false, message: 'Invite has expired' };
            }

            // Check if player is already in a guild
            if (this.playerGuilds.has(playerId)) {
                return { success: false, message: 'Already in a guild' };
            }

            const guild = this.guilds.get(invite.guildId);
            if (!guild) {
                this.guildInvites.delete(inviteKey);
                return { success: false, message: 'Guild no longer exists' };
            }

            // Check guild capacity
            if (guild.members.size >= this.getGuildMemberCapacity(guild)) {
                return { success: false, message: 'Guild is full' };
            }

            // Join the guild
            const result = await this.joinGuild(playerId, invite.guildId, 'recruit');
            
            if (result.success) {
                // Remove invite
                invite.status = 'accepted';
                this.guildInvites.delete(inviteKey);

                // Log guild event
                this.logGuildEvent(invite.guildId, 'member_joined', {
                    player: this.gameEngine.playerManager.getPlayer(playerId).name,
                    inviter: invite.inviterName,
                    timestamp: Date.now()
                });
            }

            return result;
        } catch (error) {
            console.error('Failed to accept invite:', error);
            return { success: false, message: 'Failed to accept invite' };
        }
    }

    async joinGuild(playerId, guildId, rank = 'recruit') {
        try {
            const player = this.gameEngine.playerManager.getPlayer(playerId);
            const guild = this.guilds.get(guildId);

            if (!player || !guild) {
                return { success: false, message: 'Player or guild not found' };
            }

            // Check if player is already in a guild
            if (this.playerGuilds.has(playerId)) {
                return { success: false, message: 'Already in a guild' };
            }

            // Check guild capacity
            if (guild.members.size >= this.getGuildMemberCapacity(guild)) {
                return { success: false, message: 'Guild is full' };
            }

            // Add to guild
            const memberData = {
                playerId: playerId,
                rank: rank,
                joinedAt: Date.now(),
                contribution: 0,
                lastActive: Date.now()
            };

            guild.members.set(playerId, memberData);
            this.playerGuilds.set(playerId, {
                guildId: guildId,
                rank: rank,
                joinedAt: Date.now(),
                contribution: 0,
                lastActive: Date.now()
            });

            // Update guild statistics
            guild.statistics.totalMembers = guild.members.size;
            guild.statistics.membersJoined++;

            // Update global statistics
            this.statistics.guildMembersJoined++;

            // Send notifications
            this.sendGuildUpdate(guildId, 'member_joined', {
                playerId: playerId,
                playerName: player.name,
                rank: rank
            });

            this.sendPlayerNotification(playerId, 'guild_joined', {
                guildId: guildId,
                guildName: guild.name,
                rank: rank
            });

            console.log(`${player.name} joined guild ${guild.name} as ${rank}`);
            this.emit('playerJoinedGuild', guildId, playerId, rank);

            return { success: true, guild: guild, rank: rank };
        } catch (error) {
            console.error('Failed to join guild:', error);
            return { success: false, message: 'Failed to join guild' };
        }
    }

    async leaveGuild(playerId) {
        try {
            const playerGuildData = this.playerGuilds.get(playerId);
            if (!playerGuildData) {
                return { success: false, message: 'Not in a guild' };
            }

            const guild = this.guilds.get(playerGuildData.guildId);
            if (!guild) {
                this.playerGuilds.delete(playerId);
                return { success: false, message: 'Guild not found' };
            }

            const player = this.gameEngine.playerManager.getPlayer(playerId);
            
            // Check if player is the guild leader
            if (guild.leaderId === playerId) {
                // Transfer leadership or disband guild
                if (guild.members.size > 1) {
                    // Find highest ranking member to transfer leadership
                    let newLeader = null;
                    let highestRankLevel = -1;

                    for (const [memberId, memberData] of guild.members) {
                        if (memberId !== playerId) {
                            const rank = guild.ranks.get(memberData.rank);
                            if (rank && rank.level > highestRankLevel) {
                                highestRankLevel = rank.level;
                                newLeader = memberId;
                            }
                        }
                    }

                    if (newLeader) {
                        // Transfer leadership
                        guild.leaderId = newLeader;
                        guild.members.get(newLeader).rank = 'guildmaster';
                        
                        const newLeaderPlayer = this.gameEngine.playerManager.getPlayer(newLeader);
                        this.logGuildEvent(guild.id, 'leadership_transferred', {
                            oldLeader: player.name,
                            newLeader: newLeaderPlayer.name,
                            timestamp: Date.now()
                        });
                    }
                } else {
                    // Disband guild if only member
                    return await this.disbandGuild(guild.id, playerId);
                }
            }

            // Remove from guild
            guild.members.delete(playerId);
            this.playerGuilds.delete(playerId);

            // Update statistics
            guild.statistics.totalMembers = guild.members.size;
            guild.statistics.membersLeft++;
            this.statistics.guildMembersLeft++;

            // Send notifications
            this.sendGuildUpdate(guild.id, 'member_left', {
                playerId: playerId,
                playerName: player.name
            });

            this.sendPlayerNotification(playerId, 'guild_left', {
                guildId: guild.id,
                guildName: guild.name
            });

            // Log guild event
            this.logGuildEvent(guild.id, 'member_left', {
                player: player.name,
                timestamp: Date.now()
            });

            console.log(`${player.name} left guild ${guild.name}`);
            this.emit('playerLeftGuild', guild.id, playerId);

            return { success: true };
        } catch (error) {
            console.error('Failed to leave guild:', error);
            return { success: false, message: 'Failed to leave guild' };
        }
    }

    async kickMember(guildId, kickerId, targetPlayerId, reason = '') {
        try {
            const guild = this.guilds.get(guildId);
            const kicker = this.gameEngine.playerManager.getPlayer(kickerId);
            const target = this.gameEngine.playerManager.getPlayer(targetPlayerId);

            if (!guild || !kicker || !target) {
                return { success: false, message: 'Guild, kicker, or target not found' };
            }

            // Check permissions
            if (!this.hasPermission(kickerId, guildId, 'kick')) {
                return { success: false, message: 'No permission to kick members' };
            }

            // Can't kick yourself
            if (kickerId === targetPlayerId) {
                return { success: false, message: 'Cannot kick yourself' };
            }

            // Can't kick guild leader
            if (guild.leaderId === targetPlayerId) {
                return { success: false, message: 'Cannot kick guild leader' };
            }

            // Check if target is in guild
            if (!guild.members.has(targetPlayerId)) {
                return { success: false, message: 'Player is not in the guild' };
            }

            // Check rank hierarchy
            const kickerRank = guild.ranks.get(guild.members.get(kickerId).rank);
            const targetRank = guild.ranks.get(guild.members.get(targetPlayerId).rank);
            
            if (kickerRank.level <= targetRank.level && kickerId !== guild.leaderId) {
                return { success: false, message: 'Cannot kick members of equal or higher rank' };
            }

            // Remove from guild
            guild.members.delete(targetPlayerId);
            this.playerGuilds.delete(targetPlayerId);

            // Update statistics
            guild.statistics.totalMembers = guild.members.size;
            guild.statistics.membersLeft++;

            // Send notifications
            this.sendGuildUpdate(guildId, 'member_kicked', {
                playerId: targetPlayerId,
                playerName: target.name,
                kickerId: kickerId,
                kickerName: kicker.name,
                reason: reason
            });

            this.sendPlayerNotification(targetPlayerId, 'guild_kicked', {
                guildId: guildId,
                guildName: guild.name,
                kickerName: kicker.name,
                reason: reason
            });

            // Log guild event
            this.logGuildEvent(guildId, 'member_kicked', {
                player: target.name,
                kicker: kicker.name,
                reason: reason,
                timestamp: Date.now()
            });

            console.log(`${target.name} was kicked from guild ${guild.name} by ${kicker.name}`);
            this.emit('playerKicked', guildId, targetPlayerId, kickerId, reason);

            return { success: true };
        } catch (error) {
            console.error('Failed to kick member:', error);
            return { success: false, message: 'Failed to kick member' };
        }
    }

    async promotePlayer(guildId, promoterId, targetPlayerId, newRank) {
        try {
            const guild = this.guilds.get(guildId);
            const promoter = this.gameEngine.playerManager.getPlayer(promoterId);
            const target = this.gameEngine.playerManager.getPlayer(targetPlayerId);

            if (!guild || !promoter || !target) {
                return { success: false, message: 'Guild, promoter, or target not found' };
            }

            // Check permissions
            if (!this.hasPermission(promoterId, guildId, 'promote_demote')) {
                return { success: false, message: 'No permission to promote/demote' };
            }

            // Check if target is in guild
            if (!guild.members.has(targetPlayerId)) {
                return { success: false, message: 'Player is not in the guild' };
            }

            // Check if rank exists
            if (!guild.ranks.has(newRank)) {
                return { success: false, message: 'Rank does not exist' };
            }

            const targetMember = guild.members.get(targetPlayerId);
            const currentRank = guild.ranks.get(targetMember.rank);
            const newRankData = guild.ranks.get(newRank);
            const promoterRank = guild.ranks.get(guild.members.get(promoterId).rank);

            // Can't promote to guildmaster (unless you are guildmaster)
            if (newRank === 'guildmaster' && promoterId !== guild.leaderId) {
                return { success: false, message: 'Only guild leader can promote to guildmaster' };
            }

            // Can't promote above your own rank
            if (newRankData.level >= promoterRank.level && promoterId !== guild.leaderId) {
                return { success: false, message: 'Cannot promote to equal or higher rank than your own' };
            }

            // Update rank
            const oldRank = targetMember.rank;
            targetMember.rank = newRank;
            
            // Update player guild data
            this.playerGuilds.get(targetPlayerId).rank = newRank;

            // If promoting to guildmaster, transfer leadership
            if (newRank === 'guildmaster') {
                const oldLeader = guild.members.get(guild.leaderId);
                oldLeader.rank = 'officer'; // Demote old leader to officer
                guild.leaderId = targetPlayerId;
            }

            // Send notifications
            this.sendGuildUpdate(guildId, 'member_promoted', {
                playerId: targetPlayerId,
                playerName: target.name,
                oldRank: oldRank,
                newRank: newRank,
                promoterId: promoterId,
                promoterName: promoter.name
            });

            this.sendPlayerNotification(targetPlayerId, 'guild_promoted', {
                guildId: guildId,
                guildName: guild.name,
                oldRank: oldRank,
                newRank: newRank,
                promoterName: promoter.name
            });

            // Log guild event
            this.logGuildEvent(guildId, 'member_promoted', {
                player: target.name,
                promoter: promoter.name,
                oldRank: oldRank,
                newRank: newRank,
                timestamp: Date.now()
            });

            console.log(`${target.name} promoted from ${oldRank} to ${newRank} in guild ${guild.name}`);
            this.emit('playerPromoted', guildId, targetPlayerId, oldRank, newRank);

            return { success: true };
        } catch (error) {
            console.error('Failed to promote player:', error);
            return { success: false, message: 'Failed to promote player' };
        }
    }

    async contributeToTreasury(playerId, amount, itemId = null, quantity = 1) {
        try {
            const playerGuildData = this.playerGuilds.get(playerId);
            if (!playerGuildData) {
                return { success: false, message: 'Not in a guild' };
            }

            const guild = this.guilds.get(playerGuildData.guildId);
            const player = this.gameEngine.playerManager.getPlayer(playerId);

            if (!guild || !player) {
                return { success: false, message: 'Guild or player not found' };
            }

            // Check permissions
            if (!this.hasPermission(playerId, guild.id, 'contribute_treasury')) {
                return { success: false, message: 'No permission to contribute to treasury' };
            }

            let contributionValue = 0;

            // Contribute gold
            if (amount > 0) {
                if (player.gold < amount) {
                    return { success: false, message: 'Insufficient gold' };
                }

                await this.gameEngine.playerManager.removeGold(playerId, amount);
                guild.treasury.gold += amount;
                contributionValue += amount;
            }

            // Contribute items
            if (itemId) {
                const hasItem = await this.gameEngine.inventorySystem.hasItem(playerId, itemId, quantity);
                if (!hasItem) {
                    return { success: false, message: 'Insufficient items' };
                }

                await this.gameEngine.inventorySystem.removeItem(playerId, itemId, quantity);
                
                if (!guild.treasury.items.has(itemId)) {
                    guild.treasury.items.set(itemId, 0);
                }
                guild.treasury.items.set(itemId, guild.treasury.items.get(itemId) + quantity);

                // Calculate item value for contribution tracking
                const itemData = await this.gameEngine.itemSystem.getItem(itemId);
                contributionValue += (itemData?.value || 0) * quantity;
            }

            // Update contribution tracking
            const member = guild.members.get(playerId);
            member.contribution += contributionValue;
            guild.statistics.totalContribution += contributionValue;

            // Update player guild data
            this.playerGuilds.get(playerId).contribution += contributionValue;

            // Send notifications
            this.sendGuildUpdate(guild.id, 'treasury_contribution', {
                playerId: playerId,
                playerName: player.name,
                goldAmount: amount,
                itemId: itemId,
                itemQuantity: quantity,
                totalContribution: member.contribution
            });

            // Log guild event
            this.logGuildEvent(guild.id, 'treasury_contribution', {
                player: player.name,
                goldAmount: amount,
                itemId: itemId,
                itemQuantity: quantity,
                value: contributionValue,
                timestamp: Date.now()
            });

            console.log(`${player.name} contributed to guild ${guild.name} treasury`);
            this.emit('treasuryContribution', guild.id, playerId, contributionValue);

            return { success: true, contributionValue: contributionValue };
        } catch (error) {
            console.error('Failed to contribute to treasury:', error);
            return { success: false, message: 'Failed to contribute to treasury' };
        }
    }

    async purchaseGuildUpgrade(guildId, playerId, upgradeId) {
        try {
            const guild = this.guilds.get(guildId);
            const player = this.gameEngine.playerManager.getPlayer(playerId);

            if (!guild || !player) {
                return { success: false, message: 'Guild or player not found' };
            }

            // Check permissions
            if (!this.hasPermission(playerId, guildId, 'manage_treasury')) {
                return { success: false, message: 'No permission to purchase upgrades' };
            }

            const upgradeTemplate = this.guildUpgrades.get(upgradeId);
            if (!upgradeTemplate) {
                return { success: false, message: 'Upgrade not found' };
            }

            // Get current upgrade level
            const currentUpgrade = guild.upgrades.get(upgradeId);
            const currentLevel = currentUpgrade ? currentUpgrade.level : 0;
            const nextLevel = currentLevel + 1;

            if (nextLevel > upgradeTemplate.levels.length) {
                return { success: false, message: 'Upgrade already at maximum level' };
            }

            const upgradeLevel = upgradeTemplate.levels[nextLevel - 1];

            // Check requirements
            for (const [reqType, reqValue] of Object.entries(upgradeLevel.requirements)) {
                if (reqType === 'members') {
                    if (guild.members.size < reqValue) {
                        return { 
                            success: false, 
                            message: `Requires ${reqValue} guild members` 
                        };
                    }
                } else {
                    // Check for other building requirements
                    const reqUpgrade = guild.upgrades.get(reqType);
                    if (!reqUpgrade || reqUpgrade.level < reqValue) {
                        return { 
                            success: false, 
                            message: `Requires ${reqType} level ${reqValue}` 
                        };
                    }
                }
            }

            // Check cost
            if (guild.treasury.gold < upgradeLevel.cost) {
                return { 
                    success: false, 
                    message: `Requires ${upgradeLevel.cost} gold in treasury` 
                };
            }

            // Purchase upgrade
            guild.treasury.gold -= upgradeLevel.cost;
            guild.upgrades.set(upgradeId, {
                level: nextLevel,
                purchased: Date.now()
            });

            // Apply benefits
            this.applyUpgradeBenefits(guild, upgradeId, nextLevel);

            // Send notifications
            this.sendGuildUpdate(guildId, 'upgrade_purchased', {
                upgradeId: upgradeId,
                upgradeName: upgradeTemplate.name,
                level: nextLevel,
                purchaserId: playerId,
                purchaserName: player.name,
                cost: upgradeLevel.cost
            });

            // Log guild event
            this.logGuildEvent(guildId, 'upgrade_purchased', {
                upgrade: upgradeTemplate.name,
                level: nextLevel,
                purchaser: player.name,
                cost: upgradeLevel.cost,
                timestamp: Date.now()
            });

            console.log(`Guild ${guild.name} purchased ${upgradeTemplate.name} level ${nextLevel}`);
            this.emit('upgradePerchased', guildId, upgradeId, nextLevel);

            return { success: true, upgrade: upgradeTemplate, level: nextLevel };
        } catch (error) {
            console.error('Failed to purchase guild upgrade:', error);
            return { success: false, message: 'Failed to purchase upgrade' };
        }
    }

    applyUpgradeBenefits(guild, upgradeId, level) {
        const upgradeTemplate = this.guildUpgrades.get(upgradeId);
        if (!upgradeTemplate) return;

        const upgradeLevel = upgradeTemplate.levels[level - 1];
        
        // Apply specific benefits based on upgrade type
        switch (upgradeId) {
            case 'guild_hall':
                // Guild hall unlocks features
                if (level >= 2) guild.features.quests = true;
                if (level >= 3) guild.features.wars = true;
                if (level >= 4) guild.features.market = true;
                if (level >= 5) guild.features.fortress = true;
                break;
                
            case 'treasury_vault':
                // Increase treasury capacity
                guild.treasury.capacity += 50000 * level;
                break;
                
            case 'training_grounds':
                // Unlock training benefits for members
                guild.trainingBonuses = guild.trainingBonuses || {};
                guild.trainingBonuses.experienceMultiplier = 1 + (level * 0.05);
                break;
        }
    }

    hasPermission(playerId, guildId, permission) {
        const guild = this.guilds.get(guildId);
        if (!guild) return false;

        const member = guild.members.get(playerId);
        if (!member) return false;

        const rank = guild.ranks.get(member.rank);
        if (!rank) return false;

        return rank.permissions.includes('all') || rank.permissions.includes(permission);
    }

    getGuildMemberCapacity(guild) {
        let capacity = this.config.maxGuildMembers;
        
        const memberCapacityBenefit = guild.benefits.get('member_capacity');
        if (memberCapacityBenefit) {
            capacity += memberCapacityBenefit.bonus;
        }
        
        return capacity;
    }

    async disbandGuild(guildId, requesterId) {
        try {
            const guild = this.guilds.get(guildId);
            if (!guild) {
                return { success: false, message: 'Guild not found' };
            }

            // Only guild leader can disband
            if (guild.leaderId !== requesterId) {
                return { success: false, message: 'Only guild leader can disband the guild' };
            }

            // Remove all members
            for (const playerId of guild.members.keys()) {
                this.playerGuilds.delete(playerId);
                
                this.sendPlayerNotification(playerId, 'guild_disbanded', {
                    guildId: guildId,
                    guildName: guild.name
                });
            }

            // Remove guild
            this.guilds.delete(guildId);

            // Update statistics
            this.statistics.totalGuilds--;
            this.statistics.guildsDestroyed++;

            console.log(`Guild ${guild.name} has been disbanded`);
            this.emit('guildDisbanded', guildId, guild);

            return { success: true };
        } catch (error) {
            console.error('Failed to disband guild:', error);
            return { success: false, message: 'Failed to disband guild' };
        }
    }

    cleanupInactiveMembers() {
        const now = Date.now();
        const inactivityThreshold = this.config.guildInactivityDays * 24 * 60 * 60 * 1000;

        for (const [guildId, guild] of this.guilds) {
            if (!guild.settings.autoKickInactive) continue;

            const membersToKick = [];
            
            for (const [playerId, member] of guild.members) {
                if (playerId === guild.leaderId) continue; // Don't kick guild leader
                
                if (now - member.lastActive > inactivityThreshold) {
                    membersToKick.push(playerId);
                }
            }

            for (const playerId of membersToKick) {
                this.kickMember(guildId, guild.leaderId, playerId, 'Inactive for too long');
            }
        }
    }

    updateGuildWars() {
        const now = Date.now();

        for (const [warId, war] of this.guildWars) {
            if (war.status === 'active' && now > war.endsAt) {
                this.endGuildWar(warId);
            }
        }
    }

    processGuildTaxes() {
        // Implementation for processing guild taxes from member activities
        // This would be called when members gain gold/experience
    }

    async saveGuildData() {
        try {
            const savePromises = [];

            // Save guilds
            for (const [guildId, guild] of this.guilds) {
                const guildData = {
                    ...guild,
                    members: Array.from(guild.members.entries()),
                    treasury: {
                        ...guild.treasury,
                        items: Array.from(guild.treasury.items.entries())
                    },
                    ranks: Array.from(guild.ranks.entries()),
                    upgrades: Array.from(guild.upgrades.entries()),
                    benefits: Array.from(guild.benefits.entries())
                };

                savePromises.push(
                    this.gameEngine.database.collection('guilds')
                        .replaceOne(
                            { id: guildId },
                            guildData,
                            { upsert: true }
                        )
                );
            }

            // Save player guild memberships
            for (const [playerId, playerGuildData] of this.playerGuilds) {
                savePromises.push(
                    this.gameEngine.database.collection('player_guilds')
                        .replaceOne(
                            { playerId: playerId },
                            { playerId: playerId, ...playerGuildData },
                            { upsert: true }
                        )
                );
            }

            await Promise.all(savePromises);
        } catch (error) {
            console.error('Failed to save guild data:', error);
        }
    }

    sendGuildUpdate(guildId, eventType, data) {
        const guild = this.guilds.get(guildId);
        if (!guild) return;

        for (const playerId of guild.members.keys()) {
            this.sendPlayerNotification(playerId, 'guild_update', {
                type: eventType,
                guildId: guildId,
                data: data,
                timestamp: Date.now()
            });
        }
    }

    sendPlayerNotification(playerId, type, data) {
        const player = this.gameEngine.playerManager.getPlayer(playerId);
        if (player && player.socket) {
            player.socket.emit('guild:notification', {
                type: type,
                data: data,
                timestamp: Date.now()
            });
        }
    }

    logGuildEvent(guildId, eventType, data) {
        if (!this.guildHistory.has(guildId)) {
            this.guildHistory.set(guildId, []);
        }

        const history = this.guildHistory.get(guildId);
        history.push({
            eventType: eventType,
            data: data,
            timestamp: Date.now()
        });

        // Keep only recent history
        if (history.length > 100) {
            history.shift();
        }

        this.emit('guildEvent', guildId, eventType, data);
    }

    getPlayerGuild(playerId) {
        const playerGuildData = this.playerGuilds.get(playerId);
        if (!playerGuildData) return null;

        const guild = this.guilds.get(playerGuildData.guildId);
        if (!guild) return null;

        return {
            guild: guild,
            memberData: playerGuildData,
            permissions: this.getPlayerPermissions(playerId, playerGuildData.guildId)
        };
    }

    getPlayerPermissions(playerId, guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) return [];

        const member = guild.members.get(playerId);
        if (!member) return [];

        const rank = guild.ranks.get(member.rank);
        return rank ? rank.permissions : [];
    }

    getGuildStatistics() {
        return {
            ...this.statistics,
            totalActiveGuilds: this.guilds.size,
            totalGuildMembers: this.playerGuilds.size,
            averageMembersPerGuild: this.guilds.size > 0 ? 
                Array.from(this.guilds.values()).reduce((sum, guild) => sum + guild.members.size, 0) / this.guilds.size : 0
        };
    }

    destroy() {
        console.log('Destroying GuildSystem...');
        
        // Save all guild data
        this.saveGuildData();
        
        // Clear all data
        this.guilds.clear();
        this.playerGuilds.clear();
        this.guildInvites.clear();
        this.guildApplications.clear();
        this.guildWars.clear();
        this.guildAlliances.clear();
        this.guildHistory.clear();
        
        console.log('GuildSystem destroyed');
    }
}

module.exports = GuildSystem;
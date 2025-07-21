import { z } from 'zod';
import { Player } from './player.types';
import { Item } from './item.types';

// Guild Types
export interface Guild {
  id: string;
  name: string;
  tag: string; // Short tag displayed with player names
  description?: string;
  motd?: string; // Message of the day
  
  // Leadership
  leaderId: string;
  officers: string[];
  
  // Members
  members: GuildMember[];
  maxMembers: number;
  
  // Guild Info
  level: number;
  experience: number;
  experienceToNext: number;
  
  // Resources
  bank: GuildBank;
  perks: GuildPerk[];
  
  // Customization
  emblem: {
    icon: number;
    iconColor: string;
    borderColor: string;
    backgroundColor: string;
  };
  
  // Stats
  createdAt: Date;
  achievements: string[];
  reputation: {
    factionId: string;
    reputation: number;
  }[];
  
  // Settings
  settings: {
    invitePermission: GuildRank;
    kickPermission: GuildRank;
    promotePermission: GuildRank;
    bankWithdrawPermission: GuildRank;
    motdEditPermission: GuildRank;
    publicRecruitment: boolean;
    recruitmentMessage?: string;
    recruitmentRequirements?: {
      minLevel?: number;
      minItemLevel?: number;
      classes?: string[];
      roles?: string[];
    };
  };
  
  // Activity
  activityLog: GuildActivity[];
  
  // Alliances & Wars
  alliances?: string[]; // Guild IDs
  wars?: {
    guildId: string;
    startedAt: Date;
    reason?: string;
  }[];
}

// Guild Member
export interface GuildMember {
  playerId: string;
  rank: GuildRank;
  joinedAt: Date;
  
  // Contributions
  weeklyContribution: {
    experience: number;
    gold: number;
    items: number;
  };
  totalContribution: {
    experience: number;
    gold: number;
    items: number;
  };
  
  // Notes
  publicNote?: string;
  officerNote?: string;
  
  // Last seen
  lastOnline: Date;
  
  // Permissions (can override rank permissions)
  customPermissions?: GuildPermissions;
}

// Guild Ranks
export enum GuildRank {
  LEADER = 0,
  OFFICER = 1,
  VETERAN = 2,
  MEMBER = 3,
  RECRUIT = 4,
  // Custom ranks can be added
}

// Guild Permissions
export interface GuildPermissions {
  invite: boolean;
  kick: boolean;
  promote: boolean;
  demote: boolean;
  editMotd: boolean;
  editRanks: boolean;
  
  // Bank permissions per tab
  bankAccess: {
    tabIndex: number;
    view: boolean;
    deposit: boolean;
    withdraw: boolean;
    withdrawLimit?: number; // Daily limit
  }[];
  
  // Chat permissions
  officerChat: boolean;
  
  // War permissions
  declareWar: boolean;
  makeAlliance: boolean;
}

// Guild Bank
export interface GuildBank {
  gold: number;
  tabs: GuildBankTab[];
  
  // Transaction log
  transactions: {
    id: string;
    playerId: string;
    type: 'deposit' | 'withdraw';
    itemId?: string;
    quantity?: number;
    gold?: number;
    timestamp: Date;
    tab?: number;
  }[];
}

// Guild Bank Tab
export interface GuildBankTab {
  name: string;
  icon: string;
  slots: {
    itemId?: string;
    quantity: number;
  }[];
  permissions: {
    rank: GuildRank;
    view: boolean;
    deposit: boolean;
    withdraw: boolean;
    withdrawLimit?: number;
  }[];
}

// Guild Perks
export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredLevel: number;
  
  effects: {
    type: 'stat_bonus' | 'experience_bonus' | 'reputation_bonus' | 'mount_speed' | 'teleport' | 'resurrection';
    value: number;
    percentage?: boolean;
  }[];
  
  cost: {
    gold: number;
    items?: { itemId: string; quantity: number }[];
  };
  
  active: boolean;
}

// Guild Activity
export interface GuildActivity {
  id: string;
  type: 'join' | 'leave' | 'kick' | 'promote' | 'demote' | 'achievement' | 'level_up' | 'bank_transaction';
  playerId: string;
  targetId?: string; // For promote/demote/kick
  details?: any;
  timestamp: Date;
}

// Party/Group Types
export interface Party {
  id: string;
  leaderId: string;
  members: PartyMember[];
  maxMembers: number;
  
  // Loot settings
  lootMethod: 'free_for_all' | 'round_robin' | 'master_loot' | 'group_loot' | 'need_before_greed';
  lootThreshold: 'uncommon' | 'rare' | 'epic' | 'legendary';
  masterLooterId?: string;
  
  // Instance info
  instanceId?: string;
  difficulty?: 'normal' | 'heroic' | 'mythic' | 'mythic_plus';
  mythicPlusLevel?: number;
  
  // Ready check
  readyCheck?: {
    initiatedBy: string;
    startedAt: Date;
    responses: { playerId: string; ready: boolean }[];
  };
  
  // Markers
  worldMarkers?: {
    type: 'star' | 'circle' | 'diamond' | 'triangle' | 'moon' | 'square' | 'cross' | 'skull';
    position: { x: number; y: number; z: number };
  }[];
  
  targetMarkers?: {
    targetId: string;
    marker: 'star' | 'circle' | 'diamond' | 'triangle' | 'moon' | 'square' | 'cross' | 'skull';
  }[];
}

// Party Member
export interface PartyMember {
  playerId: string;
  role: 'tank' | 'healer' | 'dps';
  joinedAt: Date;
  
  // Status
  online: boolean;
  inCombat: boolean;
  isDead: boolean;
  
  // Location
  zoneId: string;
  instanceId?: string;
  
  // For dungeon finder
  isReplacement?: boolean;
  votekickImmune?: boolean; // Recently joined
}

// Raid Group (extends Party)
export interface Raid extends Party {
  maxMembers: 40;
  
  // Raid groups (subgroups of 5)
  groups: {
    [key: number]: string[]; // Player IDs
  };
  
  // Assistants (can invite/kick)
  assistants: string[];
  
  // Raid warnings
  warnings: {
    message: string;
    sentBy: string;
    timestamp: Date;
  }[];
}

// Looking for Group
export interface LFGListing {
  id: string;
  type: 'dungeon' | 'raid' | 'quest' | 'world_boss' | 'pvp' | 'custom';
  
  // Activity
  activityId?: string; // Dungeon/Raid/Quest ID
  customTitle?: string;
  description?: string;
  
  // Requirements
  minLevel?: number;
  minItemLevel?: number;
  requiredRoles: {
    tank: number;
    healer: number;
    dps: number;
  };
  
  // Current group
  leaderId: string;
  members: {
    playerId: string;
    role: 'tank' | 'healer' | 'dps';
    class: string;
    level: number;
    itemLevel: number;
  }[];
  
  // Settings
  autoAccept: boolean;
  voiceChat?: boolean;
  language?: string;
  
  // Status
  listed: boolean;
  createdAt: Date;
}

// Dungeon Finder
export interface DungeonFinderQueue {
  playerId: string;
  roles: ('tank' | 'healer' | 'dps')[];
  dungeons: string[]; // Dungeon IDs
  
  // Queue info
  queuedAt: Date;
  averageWaitTime: number;
  
  // Match info
  matched?: {
    dungeonId: string;
    group: string[]; // Player IDs
    role: 'tank' | 'healer' | 'dps';
    acceptedPlayers: string[];
    declinedPlayers: string[];
    expiresAt: Date;
  };
}

// Chat Types
export enum ChatChannel {
  SAY = 'SAY',
  YELL = 'YELL',
  WHISPER = 'WHISPER',
  PARTY = 'PARTY',
  RAID = 'RAID',
  GUILD = 'GUILD',
  OFFICER = 'OFFICER',
  GENERAL = 'GENERAL',
  TRADE = 'TRADE',
  LOCAL_DEFENSE = 'LOCAL_DEFENSE',
  LOOKING_FOR_GROUP = 'LOOKING_FOR_GROUP',
  CUSTOM = 'CUSTOM',
  SYSTEM = 'SYSTEM',
  COMBAT = 'COMBAT',
  EMOTE = 'EMOTE'
}

// Chat Message
export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  
  // Message content
  message: string;
  language?: string; // For RP servers
  
  // Target (for whispers)
  targetId?: string;
  targetName?: string;
  
  // Custom channel
  customChannelId?: string;
  customChannelName?: string;
  
  // Metadata
  timestamp: Date;
  zoneId?: string;
  
  // Moderation
  reported?: boolean;
  filtered?: boolean;
}

// Custom Chat Channel
export interface CustomChatChannel {
  id: string;
  name: string;
  password?: string;
  
  owner: string;
  moderators: string[];
  banned: string[];
  
  members: string[];
  maxMembers: number;
  
  settings: {
    public: boolean;
    moderated: boolean;
    announceJoinLeave: boolean;
  };
}

// Friends List
export interface FriendsList {
  playerId: string;
  friends: Friend[];
  blocked: string[];
  maxFriends: number;
}

// Friend
export interface Friend {
  playerId: string;
  addedAt: Date;
  note?: string;
  
  // Status
  online: boolean;
  location?: string;
  level?: number;
  class?: string;
}

// Trade
export interface Trade {
  id: string;
  player1: TradePlayer;
  player2: TradePlayer;
  
  status: 'pending' | 'locked' | 'confirmed' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
}

// Trade Player
export interface TradePlayer {
  playerId: string;
  
  // Offered items
  items: {
    itemId: string;
    quantity: number;
    slot: number;
  }[];
  
  // Offered gold
  gold: number;
  
  // Status
  confirmed: boolean;
  locked: boolean;
}

// Mail
export interface Mail {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  
  subject: string;
  body: string;
  
  // Attachments
  items?: {
    itemId: string;
    quantity: number;
  }[];
  gold?: number;
  
  // COD (Cash on Delivery)
  cod?: number;
  
  // Status
  read: boolean;
  returned: boolean;
  deleted: boolean;
  
  // Timestamps
  sentAt: Date;
  expiresAt: Date;
  readAt?: Date;
  
  // System mail
  systemMail?: boolean;
  templateId?: string;
}

// Auction House
export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerName: string;
  
  itemId: string;
  quantity: number;
  
  // Pricing
  startingBid: number;
  buyoutPrice?: number;
  currentBid?: number;
  bidderIds: string[];
  
  // Duration
  duration: 'short' | 'medium' | 'long' | 'very_long'; // 2h, 8h, 24h, 48h
  createdAt: Date;
  expiresAt: Date;
  
  // Status
  sold: boolean;
  cancelled: boolean;
}

// Social Schemas
export const GuildCreateSchema = z.object({
  name: z.string().min(2).max(24).regex(/^[a-zA-Z\s]+$/),
  tag: z.string().min(2).max(5).regex(/^[a-zA-Z]+$/),
  description: z.string().max(500).optional()
});

export const ChatMessageSchema = z.object({
  channel: z.nativeEnum(ChatChannel),
  message: z.string().min(1).max(500),
  targetId: z.string().optional(),
  customChannelId: z.string().optional()
});

export const TradeOfferSchema = z.object({
  targetPlayerId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1)
  })).optional(),
  gold: z.number().min(0).optional()
});

export const MailSendSchema = z.object({
  recipientName: z.string(),
  subject: z.string().min(1).max(100),
  body: z.string().max(500),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1)
  })).optional(),
  gold: z.number().min(0).optional(),
  cod: z.number().min(0).optional()
});
import { 
  GuildRank, 
  GuildPermission,
  CharacterClass,
  CharacterRace
} from '../enums/index.js';
import { ICharacter } from './character.interface.js';
import { IItem } from './item.interface.js';
import { ICurrency } from './economy.interface.js';

export interface IGuildRankConfig {
  id: string;
  name: string;
  level: number;
  permissions: GuildPermission[];
  
  bankAccess: {
    tabs: number[];
    dailyWithdrawLimit: number;
    repairFromBank: boolean;
  };
  
  privileges: {
    invite: boolean;
    kick: boolean;
    promote: boolean;
    demote: boolean;
    editRanks: boolean;
    editInfo: boolean;
    editMotd: boolean;
    startEvents: boolean;
    manageAlliances: boolean;
    declareWar: boolean;
    buildGuildHall: boolean;
  };
  
  visual: {
    icon: string;
    color: string;
    chatPrefix?: string;
  };
}

export interface IGuildMember {
  characterId: string;
  characterName: string;
  accountId: string;
  
  rank: GuildRank;
  customRank?: string;
  
  joined: Date;
  lastOnline: Date;
  
  note?: string;
  officerNote?: string;
  
  contribution: {
    experience: number;
    gold: number;
    items: number;
    quests: number;
    pvpKills: number;
    achievements: number;
  };
  
  activity: {
    weekly: number;
    monthly: number;
    total: number;
  };
  
  reputation: number;
  
  bankActivity: {
    deposits: {
      itemId: string;
      quantity: number;
      timestamp: Date;
    }[];
    withdrawals: {
      itemId: string;
      quantity: number;
      timestamp: Date;
    }[];
    goldDeposited: number;
    goldWithdrawn: number;
  };
  
  warnings: {
    reason: string;
    issuedBy: string;
    timestamp: Date;
  }[];
  
  commendations: {
    reason: string;
    issuedBy: string;
    timestamp: Date;
  }[];
}

export interface IGuildBank {
  tabs: {
    id: string;
    name: string;
    icon: string;
    slots: {
      item?: IItem;
      quantity?: number;
    }[];
    permissions: {
      rank: GuildRank;
      view: boolean;
      deposit: boolean;
      withdraw: boolean;
      withdrawLimit: number;
    }[];
  }[];
  
  gold: number;
  
  log: {
    type: 'deposit' | 'withdraw' | 'repair' | 'move';
    characterId: string;
    item?: {
      id: string;
      quantity: number;
    };
    gold?: number;
    tab?: number;
    slot?: number;
    timestamp: Date;
  }[];
}

export interface IGuildPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  requirements: {
    level: number;
    achievements?: string[];
    reputation?: number;
    gold?: number;
  };
  
  effects: {
    type: string;
    value: any;
  }[];
  
  active: boolean;
  unlockedAt?: Date;
}

export interface IGuildAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  
  criteria: {
    type: string;
    target: number;
    progress: number;
  }[];
  
  reward?: {
    perks?: string[];
    items?: string[];
    titles?: string[];
    gold?: number;
  };
  
  completed: boolean;
  completedAt?: Date;
  completedBy?: string[];
}

export interface IGuildEvent {
  id: string;
  name: string;
  description: string;
  type: 'raid' | 'pvp' | 'social' | 'meeting' | 'custom';
  
  schedule: {
    start: Date;
    end: Date;
    recurring?: {
      pattern: string;
      until?: Date;
    };
  };
  
  organizer: string;
  
  requirements?: {
    level?: number;
    class?: CharacterClass[];
    role?: string[];
    itemLevel?: number;
  };
  
  signups: {
    characterId: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
    role?: string;
    note?: string;
    timestamp: Date;
  }[];
  
  maxParticipants?: number;
  
  location?: {
    zone: string;
    coordinates?: { x: number; y: number; z: number };
  };
  
  loot?: {
    method: string;
    rules: any;
  };
}

export interface IGuildAlliance {
  guilds: string[];
  name?: string;
  
  formed: Date;
  
  chat: {
    enabled: boolean;
    channel: string;
  };
  
  benefits: {
    sharedBank?: boolean;
    sharedPerks?: boolean;
    combinedEvents?: boolean;
    territoryDefense?: boolean;
  };
  
  reputation: Map<string, number>;
}

export interface IGuildWar {
  attacker: string;
  defender: string;
  
  declared: Date;
  ends?: Date;
  
  terms: {
    duration?: number;
    stakes?: {
      gold?: number;
      territory?: string[];
      items?: string[];
    };
    rules?: string[];
  };
  
  score: {
    [guildId: string]: {
      kills: number;
      deaths: number;
      objectives: number;
      points: number;
    };
  };
  
  battles: {
    location: string;
    timestamp: Date;
    participants: number;
    winner?: string;
  }[];
  
  status: 'active' | 'ceasefire' | 'ended';
  winner?: string;
}

export interface IGuildHall {
  id: string;
  theme: string;
  level: number;
  
  location: {
    zone: string;
    instance: string;
    entrance: { x: number; y: number; z: number };
  };
  
  rooms: {
    id: string;
    type: string;
    level: number;
    upgrades: string[];
    decorations: {
      itemId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      scale: number;
    }[];
  }[];
  
  npcs: {
    type: string;
    name?: string;
    services: string[];
    location: { x: number; y: number; z: number };
  }[];
  
  upgrades: {
    id: string;
    name: string;
    level: number;
    cost: {
      gold: number;
      materials: { itemId: string; quantity: number }[];
      time: number;
    };
    benefits: any;
    completedAt?: Date;
  }[];
  
  trophies: {
    achievementId: string;
    display: { x: number; y: number; z: number };
  }[];
  
  portals: {
    destination: string;
    unlocked: boolean;
    location: { x: number; y: number; z: number };
  }[];
}

export interface IGuild {
  id: string;
  name: string;
  tag: string;
  realm: string;
  
  created: Date;
  founder: string;
  
  level: number;
  experience: number;
  experienceToNext: number;
  
  members: IGuildMember[];
  maxMembers: number;
  
  ranks: IGuildRankConfig[];
  
  motd?: string;
  info?: string;
  website?: string;
  discord?: string;
  
  emblem: {
    icon: number;
    border: number;
    background: number;
    iconColor: string;
    borderColor: string;
    backgroundColor: string;
  };
  
  bank: IGuildBank;
  
  currencies: ICurrency[];
  
  perks: IGuildPerk[];
  achievements: IGuildAchievement[];
  
  reputation: {
    total: number;
    weekly: number;
    sources: Map<string, number>;
  };
  
  calendar: IGuildEvent[];
  
  alliances: string[];
  wars: IGuildWar[];
  
  hall?: IGuildHall;
  
  recruitment: {
    open: boolean;
    minLevel?: number;
    classes?: CharacterClass[];
    roles?: string[];
    message?: string;
    autoAccept?: boolean;
    applications: {
      characterId: string;
      message: string;
      timestamp: Date;
      status: 'pending' | 'accepted' | 'rejected';
      reviewedBy?: string;
    }[];
  };
  
  chat: {
    channels: {
      name: string;
      permissions: GuildRank[];
      history: {
        characterId: string;
        message: string;
        timestamp: Date;
      }[];
    }[];
  };
  
  logs: {
    type: string;
    actor: string;
    target?: string;
    data?: any;
    timestamp: Date;
  }[];
  
  statistics: {
    totalKills: number;
    totalDeaths: number;
    pvpKills: number;
    pvpDeaths: number;
    dungeonsCompleted: number;
    raidsCompleted: number;
    achievementPoints: number;
    activitiesCompleted: number;
    goldEarned: bigint;
    itemsCrafted: number;
  };
  
  settings: {
    public: boolean;
    requireApplication: boolean;
    minJoinLevel: number;
    tax: {
      gold: number;
      items: number;
      experience: number;
    };
    loot: {
      autoDeposit: boolean;
      threshold: string;
    };
    permissions: {
      [key: string]: GuildRank[];
    };
  };
}

export interface IGuildSearch {
  name?: string;
  minLevel?: number;
  maxLevel?: number;
  minMembers?: number;
  maxMembers?: number;
  recruiting?: boolean;
  hasGuildHall?: boolean;
  faction?: string;
  language?: string;
  playstyle?: string[];
  activities?: string[];
}

export interface IGuildInvite {
  id: string;
  guildId: string;
  inviterId: string;
  inviteeId: string;
  message?: string;
  sentAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
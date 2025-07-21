import { 
  QuestType, 
  QuestStatus, 
  QuestObjectiveType,
  CharacterClass,
  CharacterRace
} from '../enums/index.js';
import { IItem } from './item.interface.js';
import { ISkill } from './skill.interface.js';
import { ICurrency } from './economy.interface.js';
import { IDialogue } from './dialogue.interface.js';

export interface IQuestObjective {
  id: string;
  type: QuestObjectiveType;
  description: string;
  target: {
    id: string;
    name: string;
    type: string;
    quantity?: number;
    location?: {
      zoneId: string;
      coordinates?: { x: number; y: number; z: number };
      radius?: number;
    };
  };
  progress: number;
  required: number;
  completed: boolean;
  optional?: boolean;
  hidden?: boolean;
  order?: number;
  showProgress?: boolean;
  conditions?: any;
  tracker?: {
    show: boolean;
    text?: string;
    icon?: string;
  };
}

export interface IQuestReward {
  experience?: number;
  gold?: number;
  items?: {
    itemId: string;
    quantity: number;
    choice?: boolean;
  }[];
  currencies?: {
    type: string;
    amount: number;
  }[];
  reputation?: {
    factionId: string;
    amount: number;
  }[];
  skills?: string[];
  spells?: string[];
  talents?: number;
  titles?: string[];
  achievements?: string[];
  unlocks?: {
    type: string;
    id: string;
  }[];
  buff?: {
    id: string;
    duration: number;
  };
}

export interface IQuestRequirement {
  level?: {
    min?: number;
    max?: number;
  };
  class?: CharacterClass[];
  race?: CharacterRace[];
  faction?: string;
  gender?: string;
  profession?: {
    id: string;
    skill: number;
  };
  reputation?: {
    factionId: string;
    level: string;
  }[];
  quests?: {
    id: string;
    completed?: boolean;
    notCompleted?: boolean;
  }[];
  achievements?: string[];
  items?: {
    id: string;
    quantity: number;
  }[];
  currency?: {
    type: string;
    amount: number;
  }[];
  time?: {
    start?: Date;
    end?: Date;
    dayOfWeek?: number[];
    timeOfDay?: { start: number; end: number };
  };
  event?: string;
  season?: string;
  flag?: string;
  script?: string;
}

export interface IQuestDialogue {
  accept?: IDialogue;
  progress?: IDialogue;
  complete?: IDialogue;
  decline?: IDialogue;
}

export interface IQuestPhase {
  id: string;
  name: string;
  description: string;
  objectives: IQuestObjective[];
  dialogue?: IQuestDialogue;
  cutscene?: string;
  script?: string;
}

export interface IQuest {
  id: string;
  name: string;
  description: string;
  summary: string;
  type: QuestType;
  level: number;
  suggestedLevel?: number;
  difficulty?: 'trivial' | 'easy' | 'normal' | 'hard' | 'elite' | 'raid';
  
  // Chain
  chainId?: string;
  previousQuest?: string;
  nextQuest?: string;
  chainPosition?: number;
  
  // Location
  startNPC?: string;
  endNPC?: string;
  startLocation?: {
    zoneId: string;
    coordinates?: { x: number; y: number; z: number };
  };
  endLocation?: {
    zoneId: string;
    coordinates?: { x: number; y: number; z: number };
  };
  
  // Objectives
  objectives: IQuestObjective[];
  bonusObjectives?: IQuestObjective[];
  phases?: IQuestPhase[];
  currentPhase?: number;
  
  // Requirements
  requirements?: IQuestRequirement;
  
  // Rewards
  rewards: IQuestReward;
  choiceRewards?: IQuestReward;
  bonusRewards?: IQuestReward;
  
  // Dialogue
  dialogue?: IQuestDialogue;
  
  // Time
  timeLimit?: number;
  cooldown?: number;
  daily?: boolean;
  weekly?: boolean;
  monthly?: boolean;
  repeatable?: boolean;
  maxRepetitions?: number;
  
  // Sharing
  shareable?: boolean;
  maxPartySize?: number;
  requiresParty?: boolean;
  
  // Tracking
  autoAccept?: boolean;
  autoComplete?: boolean;
  tracked?: boolean;
  priority?: number;
  
  // Special
  escort?: {
    npcId: string;
    path: { x: number; y: number; z: number }[];
    events?: {
      position: number;
      type: string;
      data: any;
    }[];
  };
  
  vehicle?: {
    vehicleId: string;
    abilities: string[];
  };
  
  scenario?: {
    stages: {
      id: string;
      name: string;
      criteria: any;
      bonus?: any;
    }[];
  };
  
  puzzle?: {
    type: string;
    data: any;
    solution: any;
    hints?: string[];
  };
  
  choices?: {
    id: string;
    text: string;
    consequences?: {
      reputation?: { factionId: string; amount: number }[];
      flags?: string[];
      quests?: string[];
    };
  }[];
  
  // Visual
  icon?: string;
  banner?: string;
  mapMarkers?: {
    type: string;
    location: { x: number; y: number; z: number };
    zoneId: string;
    text?: string;
    icon?: string;
  }[];
  
  // Story
  lore?: string;
  voice?: {
    accept?: string;
    progress?: string;
    complete?: string;
  };
  cutscenes?: {
    trigger: string;
    cutsceneId: string;
  }[];
  
  // Flags
  flags: {
    pvp?: boolean;
    raid?: boolean;
    dungeon?: boolean;
    group?: boolean;
    heroic?: boolean;
    legendary?: boolean;
    account?: boolean;
    hidden?: boolean;
    breadcrumb?: boolean;
    story?: boolean;
    world?: boolean;
    bonus?: boolean;
    wrapper?: boolean;
  };
  
  // Progress tracking
  status: QuestStatus;
  acceptedAt?: Date;
  completedAt?: Date;
  abandonedAt?: Date;
  turnedInAt?: Date;
  
  // Metadata
  version: number;
  patch: string;
  disabled?: boolean;
}

export interface IQuestLog {
  characterId: string;
  activeQuests: IQuest[];
  completedQuests: string[];
  abandonedQuests: {
    questId: string;
    abandonedAt: Date;
    progress: any;
  }[];
  dailyQuests: {
    completed: string[];
    resetTime: Date;
  };
  weeklyQuests: {
    completed: string[];
    resetTime: Date;
  };
  questProgress: Map<string, any>;
}

export interface IQuestTracker {
  tracked: string[];
  minimized: boolean;
  position: { x: number; y: number };
  width: number;
  showObjectives: boolean;
  showRewards: boolean;
  autoTrack: boolean;
  sortBy: 'distance' | 'level' | 'progress' | 'manual';
}
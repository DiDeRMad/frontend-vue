import { 
  ZoneType, 
  BiomeType, 
  WeatherType, 
  TimeOfDay,
  EventType
} from '../enums/index.js';
import { IPosition } from './character.interface.js';
import { INPC } from './npc.interface.js';
import { IQuest } from './quest.interface.js';

export interface ICoordinates {
  x: number;
  y: number;
  z: number;
}

export interface IBoundingBox {
  min: ICoordinates;
  max: ICoordinates;
}

export interface IZone {
  id: string;
  name: string;
  description: string;
  type: ZoneType;
  biome: BiomeType;
  level: {
    min: number;
    max: number;
    recommended: number;
  };
  parentZone?: string;
  subZones: string[];
  
  // Geography
  bounds: IBoundingBox;
  terrain: {
    heightMap: string;
    textureMap: string;
    collisionMap: string;
  };
  
  // Environment
  weather: {
    current: WeatherType;
    forecast: {
      weather: WeatherType;
      startTime: Date;
      duration: number;
      intensity: number;
    }[];
    patterns: {
      weather: WeatherType;
      probability: number;
      minDuration: number;
      maxDuration: number;
    }[];
  };
  
  timeOfDay: TimeOfDay;
  dayNightCycle: {
    enabled: boolean;
    speed: number;
    sunrise: number;
    sunset: number;
  };
  
  ambiance: {
    music: string[];
    sounds: string[];
    effects: string[];
  };
  
  lighting: {
    ambient: string;
    directional: {
      direction: ICoordinates;
      color: string;
      intensity: number;
    };
    fog?: {
      color: string;
      density: number;
      start: number;
      end: number;
    };
  };
  
  // Content
  npcs: string[];
  creatures: string[];
  objects: string[];
  resources: string[];
  quests: string[];
  events: string[];
  
  // Points of Interest
  pointsOfInterest: {
    id: string;
    name: string;
    type: string;
    location: ICoordinates;
    icon?: string;
    discovered?: boolean;
  }[];
  
  // Spawns
  spawnPoints: {
    player: ICoordinates[];
    creature: {
      id: string;
      creatures: string[];
      location: ICoordinates;
      radius: number;
      maxCount: number;
      respawnTime: number;
    }[];
    resource: {
      id: string;
      resources: string[];
      location: ICoordinates;
      respawnTime: number;
    }[];
  };
  
  // Travel
  flightPaths: {
    id: string;
    start: ICoordinates;
    end: ICoordinates;
    cost: number;
    duration: number;
    discovered?: boolean;
  }[];
  
  portals: {
    id: string;
    location: ICoordinates;
    destination: {
      zoneId: string;
      location: ICoordinates;
    };
    requirements?: any;
  }[];
  
  graveyards: {
    id: string;
    location: ICoordinates;
    faction?: string;
  }[];
  
  // PvP
  pvp: {
    enabled: boolean;
    contested: boolean;
    capturePoints?: {
      id: string;
      location: ICoordinates;
      radius: number;
      owner?: string;
      captureTime: number;
    }[];
    objectives?: {
      id: string;
      type: string;
      location: ICoordinates;
      status: any;
    }[];
  };
  
  // Phasing
  phases?: {
    id: string;
    name: string;
    condition: any;
    changes: {
      npcs?: string[];
      objects?: string[];
      terrain?: any;
      weather?: WeatherType;
    };
  }[];
  
  currentPhase?: string;
  
  // Instances
  instances?: {
    id: string;
    type: 'dungeon' | 'raid' | 'scenario' | 'arena' | 'battleground';
    entrances: ICoordinates[];
    maxPlayers: number;
    minLevel: number;
    lockout?: {
      type: 'daily' | 'weekly' | 'none';
      resetTime?: Date;
    };
  }[];
  
  // Events
  activeEvents: string[];
  
  // Map Data
  map: {
    texture: string;
    bounds: {
      topLeft: ICoordinates;
      bottomRight: ICoordinates;
    };
    zoom: {
      min: number;
      max: number;
      default: number;
    };
    layers: {
      name: string;
      visible: boolean;
      data: any;
    }[];
  };
  
  // Loading
  loadingScreen?: string;
  loadingTips?: string[];
  
  // Restrictions
  restrictions?: {
    level?: { min?: number; max?: number };
    faction?: string[];
    class?: string[];
    race?: string[];
    mount?: boolean;
    flying?: boolean;
    pvp?: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface IWorldMap {
  id: string;
  name: string;
  continents: {
    id: string;
    name: string;
    zones: string[];
    bounds: IBoundingBox;
    texture: string;
  }[];
  
  oceans: {
    id: string;
    name: string;
    bounds: IBoundingBox;
    depth: number;
    currents: {
      direction: ICoordinates;
      strength: number;
    }[];
  }[];
  
  dimensions: {
    id: string;
    name: string;
    type: string;
    accessPoints: {
      location: ICoordinates;
      requirements: any;
    }[];
  }[];
}

export interface IWorldEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  
  schedule: {
    start: Date;
    end: Date;
    recurring?: {
      pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
      interval?: number;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      months?: number[];
      customRule?: string;
    };
  };
  
  phases: {
    id: string;
    name: string;
    duration: number;
    objectives: any[];
    rewards: any;
    nextPhase?: string;
  }[];
  
  currentPhase?: string;
  progress: any;
  
  zones: string[];
  
  spawns?: {
    npcs: string[];
    creatures: string[];
    objects: string[];
  };
  
  mechanics?: {
    type: string;
    data: any;
  }[];
  
  rewards: {
    participation: any;
    completion: any;
    ranking?: any[];
  };
  
  leaderboard?: {
    type: string;
    entries: {
      id: string;
      score: number;
      timestamp: Date;
    }[];
  };
  
  notifications: {
    start: string;
    phases: { [key: string]: string };
    end: string;
  };
  
  effects?: {
    weather?: WeatherType;
    skybox?: string;
    ambiance?: string;
    globalBuffs?: string[];
  };
}

export interface IWorldState {
  time: {
    server: Date;
    game: Date;
    daysSinceCreation: number;
  };
  
  weather: Map<string, WeatherType>;
  
  events: {
    active: IWorldEvent[];
    upcoming: IWorldEvent[];
    completed: string[];
  };
  
  bosses: {
    spawned: {
      bossId: string;
      location: ICoordinates;
      health: number;
      spawnTime: Date;
    }[];
    killed: {
      bossId: string;
      killedBy: string[];
      killedAt: Date;
      respawnAt: Date;
    }[];
  };
  
  pvp: {
    activeBattles: {
      zoneId: string;
      participants: number;
      score: { [faction: string]: number };
    }[];
    territory: Map<string, string>;
  };
  
  economy: {
    inflation: number;
    goldSupply: bigint;
    itemPrices: Map<string, number>;
  };
  
  population: {
    online: number;
    byZone: Map<string, number>;
    byFaction: Map<string, number>;
    byClass: Map<string, number>;
    byLevel: Map<number, number>;
  };
}

export interface IDynamicObject {
  id: string;
  type: string;
  position: ICoordinates;
  rotation: ICoordinates;
  scale: ICoordinates;
  model: string;
  
  interactive?: {
    range: number;
    action: string;
    requirements?: any;
    cooldown?: number;
    script?: string;
  };
  
  physics?: {
    static: boolean;
    mass?: number;
    friction?: number;
    restitution?: number;
    collisionGroup?: string;
  };
  
  animation?: {
    idle?: string;
    interact?: string;
    custom?: Map<string, string>;
  };
  
  sound?: {
    ambient?: string;
    interact?: string;
    custom?: Map<string, string>;
  };
  
  loot?: string;
  quest?: string;
  
  respawn?: {
    time: number;
    variance: number;
  };
  
  despawn?: {
    time?: number;
    condition?: any;
  };
  
  state: any;
  spawner?: string;
  owner?: string;
}

export interface IAreaTrigger {
  id: string;
  bounds: IBoundingBox | { center: ICoordinates; radius: number };
  
  trigger: {
    onEnter?: string;
    onExit?: string;
    onStay?: string;
    conditions?: any;
  };
  
  effects?: {
    teleport?: {
      zoneId: string;
      location: ICoordinates;
    };
    buff?: string;
    damage?: {
      amount: number;
      type: string;
      interval: number;
    };
    script?: string;
  };
  
  visual?: {
    visible: boolean;
    effect?: string;
    boundary?: string;
  };
}

export interface ILayeredMap {
  base: {
    terrain: any;
    water: any;
    props: any;
  };
  
  collision: {
    static: any;
    dynamic: any;
    triggers: IAreaTrigger[];
  };
  
  navigation: {
    mesh: any;
    paths: any;
    flyPaths: any;
  };
  
  spawns: {
    creatures: any;
    resources: any;
    objects: any;
  };
  
  fog: {
    explored: boolean[][];
    visible: boolean[][];
  };
  
  instances: Map<string, any>;
}
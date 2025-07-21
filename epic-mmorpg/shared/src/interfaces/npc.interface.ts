import { NPCType, AIBehavior } from '../enums/index.js';

export interface INPC {
  id: string;
  name: string;
  type: NPCType;
  level: number;
  health: number;
  maxHealth: number;
  behavior: AIBehavior;
  faction?: string;
  dialogue?: string[];
  quests?: string[];
  shop?: string;
}
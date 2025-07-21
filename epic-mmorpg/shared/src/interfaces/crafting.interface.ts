import { ProfessionType, CraftingQuality } from '../enums/index.js';

export interface IProfession {
  id: string;
  type: ProfessionType;
  skill: number;
  maxSkill: number;
  recipes: string[];
}
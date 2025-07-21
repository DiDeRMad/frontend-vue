import { PetType } from '../enums/index.js';

export interface IPet {
  id: string;
  name: string;
  type: PetType;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  happiness: number;
  loyalty: number;
  abilities: string[];
}
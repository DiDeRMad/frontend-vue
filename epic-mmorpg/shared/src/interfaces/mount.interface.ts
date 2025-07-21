import { MountType } from '../enums/index.js';

export interface IMount {
  id: string;
  name: string;
  type: MountType;
  speed: number;
  canFly: boolean;
  canSwim: boolean;
  model: string;
  unlocked: boolean;
}
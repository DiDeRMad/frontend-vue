import { AchievementCategory, TitleType } from '../enums/index.js';

export interface IAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  points: number;
  completed: boolean;
  completedAt?: Date;
}

export interface ITitle {
  id: string;
  name: string;
  type: TitleType;
  display: string;
}
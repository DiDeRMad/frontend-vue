import { PvPRank, PvPMode } from '../enums/index.js';

export interface IPvPStats {
  rank: PvPRank;
  rating: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  honorPoints: number;
  conquestPoints: number;
}
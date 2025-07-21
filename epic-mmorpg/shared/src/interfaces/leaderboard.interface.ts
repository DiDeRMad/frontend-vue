export interface ILeaderboard {
  id: string;
  type: string;
  season?: string;
  entries: {
    rank: number;
    playerId: string;
    playerName: string;
    score: number;
    class?: string;
    guild?: string;
    updatedAt: Date;
  }[];
  lastUpdated: Date;
}
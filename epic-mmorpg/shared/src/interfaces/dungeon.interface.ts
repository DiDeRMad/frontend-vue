export interface IDungeon {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  difficulty: string;
  bosses: string[];
  loot: string[];
}
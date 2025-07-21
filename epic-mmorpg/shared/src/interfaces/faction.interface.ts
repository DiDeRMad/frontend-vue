export interface IFaction {
  id: string;
  name: string;
  description: string;
  races: string[];
  capital: string;
  leader: string;
  relationships: Map<string, number>;
}
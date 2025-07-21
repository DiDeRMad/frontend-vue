export interface IReputation {
  factionId: string;
  name: string;
  standing: number;
  level: 'hated' | 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';
  current: number;
  max: number;
}
import { RelationshipType } from '../enums/index.js';

export interface IFriend {
  characterId: string;
  characterName: string;
  accountId: string;
  type: RelationshipType;
  note?: string;
  addedAt: Date;
}
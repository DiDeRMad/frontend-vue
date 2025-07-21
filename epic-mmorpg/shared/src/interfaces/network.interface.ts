import { NetworkMessageType } from '../enums/index.js';

export interface INetworkMessage {
  id: string;
  type: NetworkMessageType;
  payload: any;
  timestamp: Date;
  sender?: string;
  recipient?: string;
}
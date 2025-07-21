import { EventType } from '../enums/index.js';

export interface IEvent {
  id: string;
  name: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  active: boolean;
}
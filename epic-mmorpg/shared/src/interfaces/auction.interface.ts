import { AuctionStatus } from '../enums/index.js';

export interface IAuction {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  startPrice: number;
  buyoutPrice?: number;
  currentBid?: number;
  bidderId?: string;
  status: AuctionStatus;
  createdAt: Date;
  expiresAt: Date;
}
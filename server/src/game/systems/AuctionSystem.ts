import { BaseSystem } from './BaseSystem';

export class AuctionSystem extends BaseSystem {
  constructor() {
    super('AuctionSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Auction system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
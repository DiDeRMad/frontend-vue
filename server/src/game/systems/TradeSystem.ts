import { BaseSystem } from './BaseSystem';

export class TradeSystem extends BaseSystem {
  constructor() {
    super('TradeSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Trade system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
import { BaseSystem } from './BaseSystem';

export class PvPSystem extends BaseSystem {
  constructor() {
    super('PvPSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('PvP system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
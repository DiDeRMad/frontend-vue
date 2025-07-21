import { BaseSystem } from './BaseSystem';

export class LootSystem extends BaseSystem {
  constructor() {
    super('LootSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Loot system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
import { BaseSystem } from './BaseSystem';

export class CraftingSystem extends BaseSystem {
  constructor() {
    super('CraftingSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Crafting system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
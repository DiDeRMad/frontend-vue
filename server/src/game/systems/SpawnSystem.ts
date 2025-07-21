import { BaseSystem } from './BaseSystem';

export class SpawnSystem extends BaseSystem {
  constructor() {
    super('SpawnSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Spawn system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
import { BaseSystem } from './BaseSystem';

export class AISystem extends BaseSystem {
  constructor() {
    super('AISystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('AI system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
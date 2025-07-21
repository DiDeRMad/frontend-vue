import { BaseSystem } from './BaseSystem';

export class QuestSystem extends BaseSystem {
  constructor() {
    super('QuestSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Quest system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
import { BaseManager } from './BaseManager';

export class PlayerManager extends BaseManager {
  constructor() {
    super('PlayerManager');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Player manager initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
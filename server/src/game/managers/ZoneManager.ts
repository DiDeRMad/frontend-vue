import { BaseManager } from './BaseManager';

export class ZoneManager extends BaseManager {
  constructor() {
    super('ZoneManager');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Zone manager initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
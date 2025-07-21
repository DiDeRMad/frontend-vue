import { BaseManager } from './BaseManager';

export class NetworkManager extends BaseManager {
  constructor() {
    super('NetworkManager');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Network manager initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
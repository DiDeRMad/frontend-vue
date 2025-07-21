import { BaseManager } from './BaseManager';

export class InstanceManager extends BaseManager {
  constructor() {
    super('InstanceManager');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Instance manager initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
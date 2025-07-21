import { BaseSystem } from './BaseSystem';

export class EventSystem extends BaseSystem {
  constructor() {
    super('EventSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Event system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
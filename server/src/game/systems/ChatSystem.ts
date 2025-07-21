import { BaseSystem } from './BaseSystem';

export class ChatSystem extends BaseSystem {
  constructor() {
    super('ChatSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Chat system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
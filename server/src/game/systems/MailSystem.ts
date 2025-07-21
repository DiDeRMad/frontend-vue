import { BaseSystem } from './BaseSystem';

export class MailSystem extends BaseSystem {
  constructor() {
    super('MailSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Mail system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
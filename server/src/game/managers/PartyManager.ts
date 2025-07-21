import { BaseManager } from './BaseManager';

export class PartyManager extends BaseManager {
  constructor() {
    super('PartyManager');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Party manager initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
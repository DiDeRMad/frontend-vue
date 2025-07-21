import { BaseSystem } from './BaseSystem';

export class GuildSystem extends BaseSystem {
  constructor() {
    super('GuildSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Guild system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
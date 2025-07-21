import { BaseSystem } from './BaseSystem';

export class WeatherSystem extends BaseSystem {
  constructor() {
    super('WeatherSystem');
  }

  protected async onInitialize(): Promise<void> {
    this.log('Weather system initialized');
  }

  protected async onShutdown(): Promise<void> {}

  protected async onUpdate(deltaTime: number): Promise<void> {}
}
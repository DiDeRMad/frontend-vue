import { EventEmitter } from 'events';
import { GameWorld } from '../world/GameWorld';
import { logger } from '../../utils/logger';

export abstract class BaseManager extends EventEmitter {
  protected world!: GameWorld;
  protected name: string;
  protected isInitialized: boolean = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  setWorld(world: GameWorld): void {
    this.world = world;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn(`Manager ${this.name} already initialized`);
      return;
    }

    logger.info(`Initializing manager: ${this.name}`);
    await this.onInitialize();
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info(`Shutting down manager: ${this.name}`);
    await this.onShutdown();
    this.isInitialized = false;
    this.emit('shutdown');
  }

  async update(deltaTime: number): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    await this.onUpdate(deltaTime);
  }

  getName(): string {
    return this.name;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  // Override these in derived classes
  protected abstract onInitialize(): Promise<void>;
  protected abstract onShutdown(): Promise<void>;
  protected abstract onUpdate(deltaTime: number): Promise<void>;

  // Helper methods
  protected log(message: string, data?: any): void {
    logger.info(`[${this.name}] ${message}`, data);
  }

  protected logError(message: string, error?: any): void {
    logger.error(`[${this.name}] ${message}`, error);
  }

  protected logWarn(message: string, data?: any): void {
    logger.warn(`[${this.name}] ${message}`, data);
  }

  protected logDebug(message: string, data?: any): void {
    logger.debug(`[${this.name}] ${message}`, data);
  }
}
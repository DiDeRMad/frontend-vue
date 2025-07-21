import type { ICharacter } from '@epic-mmorpg/shared';

export class NetworkSync {
  private localCharacter: ICharacter | null = null;
  
  setLocalCharacter(character: ICharacter): void {
    this.localCharacter = character;
  }
  
  update(deltaTime: number): void {
    // Sync with server
  }
  
  dispose(): void {
    // Cleanup
  }
}
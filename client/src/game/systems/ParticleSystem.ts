import * as THREE from 'three';

export class ParticleSystem {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  update(deltaTime: number): void {
    // Update particles
  }
  
  dispose(): void {
    // Cleanup
  }
}
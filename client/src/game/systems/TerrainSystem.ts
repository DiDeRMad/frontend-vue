import * as THREE from 'three';
import type { IZone } from '@epic-mmorpg/shared';

export class TerrainSystem {
  private scene: THREE.Scene;
  private terrain: THREE.Mesh | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  loadZone(zone: IZone): void {
    // Create simple terrain for now
    const geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a7d44,
      roughness: 0.8,
      metalness: 0.2 
    });
    
    if (this.terrain) {
      this.scene.remove(this.terrain);
    }
    
    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }
  
  update(deltaTime: number): void {
    // Update terrain systems
  }
  
  dispose(): void {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }
  }
}
import * as THREE from 'three';
import type { ICharacter, Vector3 } from '@epic-mmorpg/shared';

export class CharacterController {
  private scene: THREE.Scene;
  private playerMesh: THREE.Mesh | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  setPlayerCharacter(character: ICharacter): void {
    // Create player mesh
    const geometry = new THREE.CapsuleGeometry(0.5, 2, 8, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x0080ff });
    this.playerMesh = new THREE.Mesh(geometry, material);
    this.playerMesh.position.set(character.positionX, character.positionY, character.positionZ);
    this.scene.add(this.playerMesh);
  }
  
  createCharacterMesh(character: ICharacter): THREE.Object3D {
    const geometry = new THREE.CapsuleGeometry(0.5, 2, 8, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(character.positionX, character.positionY, character.positionZ);
    return mesh;
  }
  
  getPlayerMesh(): THREE.Object3D | null {
    return this.playerMesh;
  }
  
  move(direction: Vector3): void {
    // Move player
  }
  
  useSkill(skillId: string): void {
    // Use skill
  }
  
  update(deltaTime: number): void {
    // Update animations
  }
  
  dispose(): void {
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
  }
}
import { EventEmitter } from 'events';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class CameraController extends EventEmitter {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private target: THREE.Object3D | null = null;
  
  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    super();
    this.camera = camera;
    this.controls = controls;
  }
  
  setTarget(target: THREE.Object3D): void {
    this.target = target;
  }
  
  update(deltaTime: number): void {
    if (this.target) {
      // Follow target
      const targetPosition = this.target.position.clone();
      this.controls.target.lerp(targetPosition, 0.1);
    }
  }
  
  dispose(): void {
    this.removeAllListeners();
  }
}
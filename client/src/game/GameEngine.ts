import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { store } from '../stores/store';
import { updateFps } from '../stores/slices/gameSlice';
import { InputManager } from './systems/InputManager';
import { CameraController } from './systems/CameraController';
import { TerrainSystem } from './systems/TerrainSystem';
import { LightingSystem } from './systems/LightingSystem';
import { CharacterController } from './systems/CharacterController';
import { NetworkSync } from './systems/NetworkSync';
import { ParticleSystem } from './systems/ParticleSystem';
import { AudioSystem } from './systems/AudioSystem';
import { UIOverlay } from './systems/UIOverlay';
import type { IZone, ICharacter, Vector3 } from '@epic-mmorpg/shared';

export interface GameEngineConfig {
  container: HTMLElement;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  showStats?: boolean;
}

export class GameEngine {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private controls!: OrbitControls;
  private stats?: Stats;
  
  private clock = new THREE.Clock();
  private frameCount = 0;
  private lastFpsUpdate = 0;
  
  // Game systems
  private inputManager!: InputManager;
  private cameraController!: CameraController;
  private terrainSystem!: TerrainSystem;
  private lightingSystem!: LightingSystem;
  private characterController!: CharacterController;
  private networkSync!: NetworkSync;
  private particleSystem!: ParticleSystem;
  private audioSystem!: AudioSystem;
  private uiOverlay!: UIOverlay;
  
  // Game state
  private isRunning = false;
  private currentZone: IZone | null = null;
  private playerCharacter: ICharacter | null = null;
  private otherPlayers = new Map<string, THREE.Object3D>();
  
  constructor(config: GameEngineConfig) {
    this.container = config.container;
    this.init(config);
  }

  private init(config: GameEngineConfig): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);
    
    // Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    this.camera.position.set(0, 10, 20);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.quality !== 'low',
      powerPreference: config.quality === 'ultra' ? 'high-performance' : 'default',
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = config.quality !== 'low';
    this.renderer.shadowMap.type = config.quality === 'ultra' 
      ? THREE.PCFSoftShadowMap 
      : THREE.PCFShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.container.appendChild(this.renderer.domElement);
    
    // Post-processing setup
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    if (config.quality === 'high' || config.quality === 'ultra') {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        0.5, // strength
        0.4, // radius
        0.85 // threshold
      );
      this.composer.addPass(bloomPass);
    }
    
    // Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.enabled = false; // Will be controlled by CameraController
    
    // Stats setup
    if (config.showStats) {
      this.stats = Stats();
      this.container.appendChild(this.stats.dom);
    }
    
    // Initialize game systems
    this.initSystems();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Add default lighting and helpers
    this.addDefaultElements();
  }

  private initSystems(): void {
    this.inputManager = new InputManager();
    this.cameraController = new CameraController(this.camera, this.controls);
    this.terrainSystem = new TerrainSystem(this.scene);
    this.lightingSystem = new LightingSystem(this.scene);
    this.characterController = new CharacterController(this.scene);
    this.networkSync = new NetworkSync();
    this.particleSystem = new ParticleSystem(this.scene);
    this.audioSystem = new AudioSystem();
    this.uiOverlay = new UIOverlay(this.container);
  }

  private addDefaultElements(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
    
    // Skybox
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide,
    });
    const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyMesh);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Input events
    this.inputManager.on('move', this.handleMove.bind(this));
    this.inputManager.on('skill', this.handleSkillUse.bind(this));
    this.inputManager.on('interact', this.handleInteract.bind(this));
    
    // Camera events
    this.cameraController.on('modeChange', this.handleCameraModeChange.bind(this));
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  private handleMove(direction: Vector3): void {
    if (this.characterController && this.playerCharacter) {
      this.characterController.move(direction);
    }
  }

  private handleSkillUse(skillId: string): void {
    if (this.characterController && this.playerCharacter) {
      this.characterController.useSkill(skillId);
    }
  }

  private handleInteract(): void {
    // Raycast from camera to find interactable objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0); // Center of screen
    
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const target = intersects[0].object;
      // TODO: Handle interaction based on target type
      console.log('Interacting with:', target);
    }
  }

  private handleCameraModeChange(mode: string): void {
    // Update UI or other systems based on camera mode
    console.log('Camera mode changed to:', mode);
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFpsUpdate = performance.now();
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private animate(): void {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update systems
    this.inputManager.update(deltaTime);
    this.cameraController.update(deltaTime);
    this.characterController.update(deltaTime);
    this.terrainSystem.update(deltaTime);
    this.lightingSystem.update(deltaTime, elapsedTime);
    this.particleSystem.update(deltaTime);
    this.networkSync.update(deltaTime);
    
    // Update controls
    this.controls.update();
    
    // Render
    this.composer.render();
    
    // Update stats
    if (this.stats) {
      this.stats.update();
    }
    
    // Update FPS counter
    this.updateFPS();
  }

  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      store.dispatch(updateFps(fps));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  public loadZone(zone: IZone): void {
    this.currentZone = zone;
    this.terrainSystem.loadZone(zone);
    this.lightingSystem.setEnvironment(zone.environment);
    // TODO: Load zone-specific assets, NPCs, objects, etc.
  }

  public setPlayerCharacter(character: ICharacter): void {
    this.playerCharacter = character;
    this.characterController.setPlayerCharacter(character);
    this.cameraController.setTarget(this.characterController.getPlayerMesh());
    this.networkSync.setLocalCharacter(character);
  }

  public addOtherPlayer(character: ICharacter): void {
    const mesh = this.characterController.createCharacterMesh(character);
    this.otherPlayers.set(character.id, mesh);
    this.scene.add(mesh);
  }

  public removeOtherPlayer(characterId: string): void {
    const mesh = this.otherPlayers.get(characterId);
    if (mesh) {
      this.scene.remove(mesh);
      this.otherPlayers.delete(characterId);
    }
  }

  public updateOtherPlayer(characterId: string, position: Vector3): void {
    const mesh = this.otherPlayers.get(characterId);
    if (mesh) {
      mesh.position.set(position.x, position.y, position.z);
    }
  }

  public dispose(): void {
    this.stop();
    
    // Dispose systems
    this.inputManager.dispose();
    this.cameraController.dispose();
    this.terrainSystem.dispose();
    this.lightingSystem.dispose();
    this.characterController.dispose();
    this.networkSync.dispose();
    this.particleSystem.dispose();
    this.audioSystem.dispose();
    this.uiOverlay.dispose();
    
    // Dispose Three.js objects
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Remove from DOM
    this.container.removeChild(this.renderer.domElement);
    if (this.stats) {
      this.container.removeChild(this.stats.dom);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
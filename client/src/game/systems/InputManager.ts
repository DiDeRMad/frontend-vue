import { EventEmitter } from 'events';
import type { Vector3 } from '@epic-mmorpg/shared';

export class InputManager extends EventEmitter {
  private keys: Set<string> = new Set();
  private mousePosition = { x: 0, y: 0 };
  private isMouseDown = false;
  private keybindings: Map<string, string> = new Map();
  
  constructor() {
    super();
    this.setupDefaultKeybindings();
    this.setupEventListeners();
  }

  private setupDefaultKeybindings(): void {
    // Movement
    this.keybindings.set('w', 'move_forward');
    this.keybindings.set('s', 'move_backward');
    this.keybindings.set('a', 'move_left');
    this.keybindings.set('d', 'move_right');
    this.keybindings.set(' ', 'jump');
    this.keybindings.set('shift', 'sprint');
    
    // Actions
    this.keybindings.set('e', 'interact');
    this.keybindings.set('tab', 'target_nearest');
    this.keybindings.set('escape', 'cancel');
    
    // UI
    this.keybindings.set('i', 'toggle_inventory');
    this.keybindings.set('c', 'toggle_character');
    this.keybindings.set('m', 'toggle_map');
    this.keybindings.set('l', 'toggle_quest_log');
    this.keybindings.set('k', 'toggle_skills');
    this.keybindings.set('g', 'toggle_guild');
    
    // Skills (1-0, -, =)
    for (let i = 1; i <= 9; i++) {
      this.keybindings.set(i.toString(), `skill_${i}`);
    }
    this.keybindings.set('0', 'skill_10');
    this.keybindings.set('-', 'skill_11');
    this.keybindings.set('=', 'skill_12');
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('wheel', this.handleWheel.bind(this));
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    
    if (!this.keys.has(key)) {
      this.keys.add(key);
      
      const action = this.keybindings.get(key);
      if (action) {
        this.emit('action', action);
        
        // Handle skill actions
        if (action.startsWith('skill_')) {
          const skillSlot = parseInt(action.split('_')[1]);
          this.emit('skill', skillSlot);
        }
        
        // Handle UI toggles
        if (action.startsWith('toggle_')) {
          this.emit('ui_toggle', action.replace('toggle_', ''));
        }
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.keys.delete(key);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
    
    if (this.isMouseDown && event.buttons === 2) {
      // Right mouse button drag for camera rotation
      this.emit('camera_rotate', {
        deltaX: event.movementX,
        deltaY: event.movementY
      });
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isMouseDown = true;
    
    if (event.button === 0) {
      // Left click
      this.emit('click', {
        x: event.clientX,
        y: event.clientY,
        button: 'left'
      });
    } else if (event.button === 2) {
      // Right click
      this.emit('click', {
        x: event.clientX,
        y: event.clientY,
        button: 'right'
      });
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    this.isMouseDown = false;
  }

  private handleWheel(event: WheelEvent): void {
    // Camera zoom
    this.emit('camera_zoom', event.deltaY);
  }

  public update(deltaTime: number): void {
    // Calculate movement vector based on pressed keys
    const movement: Vector3 = { x: 0, y: 0, z: 0 };
    
    if (this.keys.has('w')) movement.z -= 1;
    if (this.keys.has('s')) movement.z += 1;
    if (this.keys.has('a')) movement.x -= 1;
    if (this.keys.has('d')) movement.x += 1;
    
    // Normalize diagonal movement
    const length = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
    if (length > 0) {
      movement.x /= length;
      movement.z /= length;
      
      // Apply sprint modifier
      if (this.keys.has('shift')) {
        movement.x *= 2;
        movement.z *= 2;
      }
      
      this.emit('move', movement);
    }
    
    // Jump
    if (this.keys.has(' ')) {
      this.emit('jump');
    }
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  public setKeybinding(action: string, key: string): void {
    // Remove old binding
    for (const [k, v] of this.keybindings) {
      if (v === action) {
        this.keybindings.delete(k);
        break;
      }
    }
    
    // Set new binding
    this.keybindings.set(key.toLowerCase(), action);
  }

  public getKeybinding(action: string): string | undefined {
    for (const [key, value] of this.keybindings) {
      if (value === action) {
        return key;
      }
    }
    return undefined;
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('wheel', this.handleWheel.bind(this));
    
    this.keys.clear();
    this.keybindings.clear();
    this.removeAllListeners();
  }
}
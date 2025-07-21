export interface ISettings {
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    resolution: string;
    fullscreen: boolean;
    vsync: boolean;
    antialiasing: string;
    shadows: string;
    textures: string;
    effects: string;
    viewDistance: number;
    fps: number;
  };
  
  audio: {
    master: number;
    music: number;
    effects: number;
    voice: number;
    ambient: number;
  };
  
  gameplay: {
    difficulty: string;
    autoLoot: boolean;
    showTutorials: boolean;
  };
  
  controls: {
    keybindings: Map<string, string>;
    mouseSensitivity: number;
    invertY: boolean;
  };
}
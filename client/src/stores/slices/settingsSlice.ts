import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark';
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    shadows: boolean;
    particles: boolean;
    viewDistance: number;
  };
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
  };
  keybinds: Record<string, string>;
}

const initialState: SettingsState = {
  theme: 'dark',
  graphics: {
    quality: 'high',
    shadows: true,
    particles: true,
    viewDistance: 100,
  },
  audio: {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 100,
    voiceVolume: 100,
  },
  keybinds: {},
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    updateGraphics: (state, action: PayloadAction<Partial<SettingsState['graphics']>>) => {
      state.graphics = { ...state.graphics, ...action.payload };
    },
    updateAudio: (state, action: PayloadAction<Partial<SettingsState['audio']>>) => {
      state.audio = { ...state.audio, ...action.payload };
    },
    setKeybind: (state, action: PayloadAction<{ action: string; key: string }>) => {
      state.keybinds[action.payload.action] = action.payload.key;
    },
  },
});

export const { setTheme, updateGraphics, updateAudio, setKeybind } = settingsSlice.actions;
export default settingsSlice.reducer;
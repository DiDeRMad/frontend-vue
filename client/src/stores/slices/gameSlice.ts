import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IZone, WorldState } from '@epic-mmorpg/shared';

interface GameState {
  isConnected: boolean;
  currentZone: IZone | null;
  worldState: WorldState | null;
  ping: number;
  fps: number;
  isLoading: boolean;
}

const initialState: GameState = {
  isConnected: false,
  currentZone: null,
  worldState: null,
  ping: 0,
  fps: 60,
  isLoading: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setZone: (state, action: PayloadAction<IZone>) => {
      state.currentZone = action.payload;
    },
    setWorldState: (state, action: PayloadAction<WorldState>) => {
      state.worldState = action.payload;
    },
    updatePing: (state, action: PayloadAction<number>) => {
      state.ping = action.payload;
    },
    updateFps: (state, action: PayloadAction<number>) => {
      state.fps = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setConnected,
  setZone,
  setWorldState,
  updatePing,
  updateFps,
  setLoading,
} = gameSlice.actions;

export default gameSlice.reducer;
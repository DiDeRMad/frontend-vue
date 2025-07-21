import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IPlayer } from '@epic-mmorpg/shared';

interface AuthState {
  isAuthenticated: boolean;
  player: IPlayer | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  player: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ player: IPlayer; token: string }>) => {
      state.isAuthenticated = true;
      state.player = action.payload.player;
      state.token = action.payload.token;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.player = null;
      state.token = null;
      state.isLoading = false;
      state.error = action.payload;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.player = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
    },
    updatePlayer: (state, action: PayloadAction<Partial<IPlayer>>) => {
      if (state.player) {
        state.player = { ...state.player, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updatePlayer,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
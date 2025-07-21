import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import characterReducer from './slices/characterSlice';
import gameReducer from './slices/gameSlice';
import uiReducer from './slices/uiSlice';
import chatReducer from './slices/chatSlice';
import inventoryReducer from './slices/inventorySlice';
import combatReducer from './slices/combatSlice';
import questReducer from './slices/questSlice';
import settingsReducer from './slices/settingsSlice';
import socialReducer from './slices/socialSlice';
import guildReducer from './slices/guildSlice';
import mapReducer from './slices/mapSlice';
import skillsReducer from './slices/skillsSlice';
import { gameApi } from '../services/api';

export const store = configureStore({
  reducer: {
    // API slice
    [gameApi.reducerPath]: gameApi.reducer,
    
    // Feature slices
    auth: authReducer,
    character: characterReducer,
    game: gameReducer,
    ui: uiReducer,
    chat: chatReducer,
    inventory: inventoryReducer,
    combat: combatReducer,
    quest: questReducer,
    settings: settingsReducer,
    social: socialReducer,
    guild: guildReducer,
    map: mapReducer,
    skills: skillsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }).concat(gameApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
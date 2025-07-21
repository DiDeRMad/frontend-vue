import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeWindow: string | null;
  openWindows: string[];
  isInventoryOpen: boolean;
  isCharacterOpen: boolean;
  isMapOpen: boolean;
  isQuestLogOpen: boolean;
  isChatMinimized: boolean;
  selectedTab: string;
}

const initialState: UIState = {
  activeWindow: null,
  openWindows: [],
  isInventoryOpen: false,
  isCharacterOpen: false,
  isMapOpen: false,
  isQuestLogOpen: false,
  isChatMinimized: false,
  selectedTab: 'general',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openWindow: (state, action: PayloadAction<string>) => {
      if (!state.openWindows.includes(action.payload)) {
        state.openWindows.push(action.payload);
      }
      state.activeWindow = action.payload;
    },
    closeWindow: (state, action: PayloadAction<string>) => {
      state.openWindows = state.openWindows.filter(w => w !== action.payload);
      if (state.activeWindow === action.payload) {
        state.activeWindow = state.openWindows[state.openWindows.length - 1] || null;
      }
    },
    toggleInventory: (state) => {
      state.isInventoryOpen = !state.isInventoryOpen;
    },
    toggleCharacter: (state) => {
      state.isCharacterOpen = !state.isCharacterOpen;
    },
    toggleMap: (state) => {
      state.isMapOpen = !state.isMapOpen;
    },
    toggleQuestLog: (state) => {
      state.isQuestLogOpen = !state.isQuestLogOpen;
    },
    toggleChat: (state) => {
      state.isChatMinimized = !state.isChatMinimized;
    },
    setSelectedTab: (state, action: PayloadAction<string>) => {
      state.selectedTab = action.payload;
    },
  },
});

export const {
  openWindow,
  closeWindow,
  toggleInventory,
  toggleCharacter,
  toggleMap,
  toggleQuestLog,
  toggleChat,
  setSelectedTab,
} = uiSlice.actions;

export default uiSlice.reducer;
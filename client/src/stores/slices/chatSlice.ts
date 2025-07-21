import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@epic-mmorpg/shared';

interface ChatState {
  messages: ChatMessage[];
  activeChannel: string;
  channels: string[];
  unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
  messages: [],
  activeChannel: 'general',
  channels: ['general', 'trade', 'local', 'party', 'guild'],
  unreadCounts: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      if (state.messages.length > 1000) {
        state.messages = state.messages.slice(-500);
      }
    },
    setActiveChannel: (state, action: PayloadAction<string>) => {
      state.activeChannel = action.payload;
      state.unreadCounts[action.payload] = 0;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, setActiveChannel, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
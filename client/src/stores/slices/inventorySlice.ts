import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IInventory, IInventorySlot } from '@epic-mmorpg/shared';

interface InventoryState {
  inventory: IInventory | null;
  selectedSlot: number | null;
  isLoading: boolean;
}

const initialState: InventoryState = {
  inventory: null,
  selectedSlot: null,
  isLoading: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventory: (state, action: PayloadAction<IInventory>) => {
      state.inventory = action.payload;
    },
    updateSlot: (state, action: PayloadAction<IInventorySlot>) => {
      if (state.inventory) {
        const index = state.inventory.slots.findIndex(s => s.slot === action.payload.slot);
        if (index !== -1) {
          state.inventory.slots[index] = action.payload;
        }
      }
    },
    selectSlot: (state, action: PayloadAction<number | null>) => {
      state.selectedSlot = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setInventory, updateSlot, selectSlot, setLoading } = inventorySlice.actions;
export default inventorySlice.reducer;
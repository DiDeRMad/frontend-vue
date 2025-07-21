import { createSlice } from '@reduxjs/toolkit';

const combatSlice = createSlice({
  name: 'combat',
  initialState: { inCombat: false, target: null },
  reducers: {
    enterCombat: (state) => { state.inCombat = true; },
    exitCombat: (state) => { state.inCombat = false; state.target = null; },
  },
});

export const { enterCombat, exitCombat } = combatSlice.actions;
export default combatSlice.reducer;
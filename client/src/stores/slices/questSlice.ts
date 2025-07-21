import { createSlice } from '@reduxjs/toolkit';

const questSlice = createSlice({
  name: 'quest',
  initialState: { activeQuests: [], completedQuests: [] },
  reducers: {},
});

export default questSlice.reducer;
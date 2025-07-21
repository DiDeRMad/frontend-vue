import { createSlice } from '@reduxjs/toolkit';

const guildSlice = createSlice({
  name: 'guild',
  initialState: { guild: null, members: [], ranks: [] },
  reducers: {},
});

export default guildSlice.reducer;
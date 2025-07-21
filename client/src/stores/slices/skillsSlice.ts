import { createSlice } from '@reduxjs/toolkit';

const skillsSlice = createSlice({
  name: 'skills',
  initialState: { skills: [], actionBar: [], cooldowns: {} },
  reducers: {},
});

export default skillsSlice.reducer;
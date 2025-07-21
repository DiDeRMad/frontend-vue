import { createSlice } from '@reduxjs/toolkit';

const socialSlice = createSlice({
  name: 'social',
  initialState: { friends: [], ignoreList: [], partyMembers: [] },
  reducers: {},
});

export default socialSlice.reducer;
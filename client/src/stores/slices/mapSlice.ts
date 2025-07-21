import { createSlice } from '@reduxjs/toolkit';

const mapSlice = createSlice({
  name: 'map',
  initialState: { currentMap: null, markers: [], waypoints: [] },
  reducers: {},
});

export default mapSlice.reducer;
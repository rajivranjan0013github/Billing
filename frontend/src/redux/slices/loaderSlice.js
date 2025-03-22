import { createSlice } from '@reduxjs/toolkit';

const loaderSlice = createSlice({
  name: 'loader',
  initialState: {
    isLoading: true,
    isCollapsed : false
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
    },
  },
});

export const { setLoading, setIsCollapsed } = loaderSlice.actions;
export default loaderSlice.reducer;
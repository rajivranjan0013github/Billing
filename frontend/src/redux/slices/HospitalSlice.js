import { createSlice } from '@reduxjs/toolkit';
import { Backend_URL } from '../../assets/Data';
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";

// Create an async thunk for fetching hospital data
export const fetchHospitalInfo = createLoadingAsyncThunk(
  'hospital/fetchHospitalInfo',
  async () => {
    const response = await fetch(`${Backend_URL}/api/hospitals/getHospital`,{credentials:'include'});
    if (!response.ok) {
      throw new Error('Failed to fetch hospital data');
    }
    return response.json();
  }, {useGlobalLoading: true}
);

// New async thunk for updating hospital info
export const updateHospitalInfo = createLoadingAsyncThunk(
  'hospital/updateHospitalInfo',
  async (hospitalData) => {
    const response = await fetch(`${Backend_URL}/api/hospitals/${hospitalData.hospitalId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hospitalData),
    });
    if (!response.ok) {
      throw new Error('Failed to update hospital data');
    }
    return response.json();
  }, {useGlobalLoading: true}
);

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState: {
    hospitalInfo: null,
    hospitalInfoStatus: 'idle',
    updateStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospitalInfo.pending, (state) => {
        state.hospitalInfoStatus = 'loading';
      })
      .addCase(fetchHospitalInfo.fulfilled, (state, action) => {
        state.hospitalInfoStatus = 'succeeded';
        state.hospitalInfo = action.payload;
      })
      .addCase(fetchHospitalInfo.rejected, (state, action) => {
        state.hospitalInfoStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateHospitalInfo.pending, (state) => {
        state.updateStatus = 'loading';
      })
      .addCase(updateHospitalInfo.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.hospitalInfo = action.payload.hospital;
      })
      .addCase(updateHospitalInfo.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.error.message;
      });
  },
});

export default hospitalSlice.reducer;

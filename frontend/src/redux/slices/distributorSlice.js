import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Backend_URL } from '../../assets/Data';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';

export const createDistributor = createLoadingAsyncThunk(
  'distributor/createDistributor',
  async (partyData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/party/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create party');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }, {useGlobalLoader: true}
);

export const fetchDistributor = createLoadingAsyncThunk(
  'distributor/fetchDistributor',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/party`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch distributors');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const distributorSlice = createSlice({
  name: 'distributor',
  initialState: {
    distributors: [],
    createDistributorStatus: 'idle',
    fetchStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createDistributor.pending, (state) => {
        state.createDistributorStatus = 'loading';
      })
      .addCase(createDistributor.fulfilled, (state, action) => {
        state.createDistributorStatus = 'succeeded';
        state.distributors.push(action.payload);
      })
      .addCase(createDistributor.rejected, (state, action) => {
        state.createDistributorStatus = 'failed';
        state.error = action.payload.message;
      })
      .addCase(fetchDistributor.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchDistributor.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.distributors = action.payload;
      })
      .addCase(fetchDistributor.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export default distributorSlice.reducer;

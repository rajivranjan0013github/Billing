import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Backend_URL } from '../../assets/Data';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';

// create new distributor
export const createDistributor = createLoadingAsyncThunk(
  'distributor/createDistributor',
  async (distributorData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/distributor/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(distributorData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create distributor');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }, {useGlobalLoader: true}
);

// fetch all distributor
export const fetchDistributors = createLoadingAsyncThunk(
  'distributor/fetchDistributors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/distributor`, {
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

// fetch details of a distributor
export const fetchDistributorDetails = createLoadingAsyncThunk(
  'distributor/fetchDistributorDetails',
  async (distributorId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/distributor/details/${distributorId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch distributor details');
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
    currentDistributor: {
      details: null,
      invoices: [],
      payments: [],
      status: 'idle',
      tabName: 'profile',
      scrollIndex: ''
    },
  },
  reducers: {
    setTabName: (state, action) => {
      state.currentDistributor.tabName = action.payload;
    },
    setDistributorStatusIdle: (state) => {
      state.createDistributorStatus = 'idle';
      state.fetchStatus = 'idle';
      state.currentDistributor.status = 'idle';
      state.error = null;
    },
  },
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
      .addCase(fetchDistributors.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.distributors = action.payload;
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchDistributorDetails.pending, (state) => {
        state.currentDistributor.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDistributorDetails.fulfilled, (state, action) => {
        state.currentDistributor.status = 'succeeded';
        state.currentDistributor.details = action.payload.details;
        state.currentDistributor.invoices = action.payload.invoices;
        state.currentDistributor.payments = action.payload.payments;
      })
      .addCase(fetchDistributorDetails.rejected, (state, action) => {
        state.currentDistributor.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setTabName, setDistributorStatusIdle } = distributorSlice.actions;
export default distributorSlice.reducer;

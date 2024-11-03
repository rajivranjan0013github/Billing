import { createSlice } from '@reduxjs/toolkit';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';
import { Backend_URL } from '../../assets/Data';

// Create new bill
export const createBill = createLoadingAsyncThunk(
  'bill/createBill',
  async (billData) => {
    const response = await fetch(`${Backend_URL}/api/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create bill');
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Add this new thunk after createBill
export const fetchBills = createLoadingAsyncThunk(
  'bill/fetchBills',
  async () => {
    const response = await fetch(`${Backend_URL}/api/bills`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bills');
    }
    return response.json();
  }
);

// Fetch a single bill by ID
export const fetchBillById = createLoadingAsyncThunk(
  'bill/fetchBillById',
  async (id) => {
    const response = await fetch(`${Backend_URL}/api/bills/sales-bill/${id}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch bill');
    }
    return response.json();
  }, { useGlobalLoader: true }
);

const billSlice = createSlice({
  name: 'bill',
  initialState: {
    currentBill: null,
    bills: [],
    createBillStatus: 'idle',
    fetchStatus: 'idle',
    error: null,
  },
  reducers: {
    clearBillError: (state) => {
      state.error = null;
    },
    clearCurrentBill: (state) => {
      state.currentBill = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBill.pending, (state) => {
        state.createBillStatus = 'loading';
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.createBillStatus = 'succeeded';
        state.currentBill = action.payload;
      })
      .addCase(createBill.rejected, (state, action) => {
        state.createBillStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchBills.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.bills = action.payload;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearBillError, clearCurrentBill } = billSlice.actions;
export default billSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';
import { Backend_URL } from '../../assets/Data';

// Create new purchase bill
export const createPurchaseBill = createLoadingAsyncThunk(
  'purchaseBill/createPurchaseBill',
  async (purchaseBillData) => {
    const response = await fetch(`${Backend_URL}/api/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseBillData),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create purchase bill');
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Fetch all purchase bills
export const fetchPurchaseBills = createLoadingAsyncThunk(
  'purchaseBill/fetchPurchaseBills',
  async () => {
    const response = await fetch(`${Backend_URL}/api/purchase`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch purchase bills');
    }
    return response.json();
  }
);

// Fetch a single purchase bill by ID
export const fetchPurchaseBillById = createLoadingAsyncThunk(
  'purchaseBill/fetchPurchaseBillById',
  async (id) => {
    const response = await fetch(`${Backend_URL}/api/purchase/${id}`, { 
      credentials: 'include' 
    });
    if (!response.ok) {
      throw new Error('Failed to fetch purchase bill');
    }
    return response.json();
  }, 
  { useGlobalLoader: true }
);

const purchaseBillSlice = createSlice({
  name: 'purchaseBill',
  initialState: {
    currentPurchaseBill: null,
    purchaseBills: [],
    createPurchaseBillStatus: 'idle',
    fetchStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseBill.pending, (state) => {
        state.createPurchaseBillStatus = 'loading';
        state.error = null;
      })
      .addCase(createPurchaseBill.fulfilled, (state, action) => {
        state.createPurchaseBillStatus = 'succeeded';
        state.currentPurchaseBill = action.payload;
      })
      .addCase(createPurchaseBill.rejected, (state, action) => {
        state.createPurchaseBillStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPurchaseBills.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchPurchaseBills.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.purchaseBills = action.payload;
      })
      .addCase(fetchPurchaseBills.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPurchaseBillById.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchPurchaseBillById.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.currentPurchaseBill = action.payload;
      })
      .addCase(fetchPurchaseBillById.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export default purchaseBillSlice.reducer;

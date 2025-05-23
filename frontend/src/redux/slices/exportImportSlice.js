import { createSlice } from '@reduxjs/toolkit';
import { Backend_URL } from '../../assets/Data';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';
import { setDistributorStatusIdle } from './distributorSlice';
import { setCustomerStatusIdle } from './CustomerSlice';
import { setItemStatusIdle } from './inventorySlice';
// import distributors
export const importDistributors = createLoadingAsyncThunk(
  'exportImport/importDistributors',
  async (distributors, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/export-import/import-distributors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ distributors }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import distributors');
    }
    dispatch(setDistributorStatusIdle());
    return response.json();
  }
);

export const importCustomers = createLoadingAsyncThunk(
  'exportImport/importCustomers',
  async (customers, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/export-import/import-customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customers }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import customers');
    }
    dispatch(setCustomerStatusIdle());
    return response.json();
  }
);

// Import inventory
export const importInventory = createLoadingAsyncThunk(
  'exportImport/importInventory',
  async (inventory, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/export-import/import-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventory }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import inventory');
    }
    dispatch(setItemStatusIdle());
    return response.json();
  }
);

// export inventory
export const exportInventory = createLoadingAsyncThunk(
  'exportImport/exportInventory',
  async () => {
    const response = await fetch(`${Backend_URL}/api/export-import/export-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export inventory');
    }

    return response.json();
  }
);

const exportImportSlice = createSlice({
  name: 'exportImport',
  initialState: {
    importStatus: 'idle',
    importError: null,
    exportStatus: 'idle',
    exportError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(importDistributors.pending, (state) => {
        state.importStatus = 'loading';
        state.importError = null;
      })
      .addCase(importDistributors.fulfilled, (state) => {
        state.importStatus = 'succeeded';
        state.importError = null;
      })
      .addCase(importDistributors.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.importError = action.error.message;
      })
      .addCase(importInventory.pending, (state) => {
        state.importStatus = 'loading';
        state.importError = null;
      })
      .addCase(importInventory.fulfilled, (state) => {
        state.importStatus = 'succeeded';
        state.importError = null;
      })
      .addCase(importInventory.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.importError = action.error.message;
      })
      .addCase(exportInventory.pending, (state) => {
        state.exportStatus = 'loading';
        state.exportError = null;
      })
      .addCase(exportInventory.fulfilled, (state) => {
        state.exportStatus = 'succeeded';
        state.exportError = null;
      })
      .addCase(exportInventory.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.exportError = action.error.message;
      });
  },
});

export default exportImportSlice.reducer;

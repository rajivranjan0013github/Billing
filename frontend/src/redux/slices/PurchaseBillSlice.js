import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setDistributorStatusIdle } from "./distributorSlice";
import { setItemStatusIdle } from "./inventorySlice";

// Create new purchase bill
export const createPurchaseBill = createLoadingAsyncThunk(
  "purchaseBill/createPurchaseBill",
  async (purchaseBillData, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseBillData),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to create purchase bill");
    }
    const result = await response.json();
    await dispatch(setAccountsStatusIdle());
    await dispatch(setDistributorStatusIdle());
    await dispatch(setItemStatusIdle());
    return result;
  },
  { useGlobalLoader: true }
);

// Fetch all purchase bills
export const fetchPurchaseBills = createLoadingAsyncThunk(
  "purchaseBill/fetchPurchaseBills",
  async ({ startDate, endDate }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch purchase bills");
    }
    return response.json();
  }
);

// Add new search thunk
export const searchPurchaseBills = createLoadingAsyncThunk(
  "purchaseBill/searchPurchaseBills",
  async ({ query, startDate, endDate }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase/search?query=${query}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search purchase bills");
    }
    return response.json();
  }
);

// Add delete purchase bill thunk
export const deletePurchaseBill = createLoadingAsyncThunk(
  "purchaseBill/deletePurchaseBill",
  async (invoiceId, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/purchase/${invoiceId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete purchase bill");
    }
    await dispatch(setAccountsStatusIdle());
    await dispatch(setDistributorStatusIdle());
    await dispatch(setItemStatusIdle());
    return invoiceId;
  },
  { useGlobalLoader: true }
);

const purchaseBillSlice = createSlice({
  name: "purchaseBill",
  initialState: {
    purchaseBills: [],
    fetchStatus: "idle",
    createPurchaseBillStatus: "idle",
    searchStatus: "idle",
    deleteStatus: "idle",
    error: null,
  },
  reducers: {
    // Add a reset status action if needed
    resetStatus: (state) => {
      state.fetchStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseBill.pending, (state) => {
        state.createPurchaseBillStatus = "loading";
        state.error = null;
      })
      .addCase(createPurchaseBill.fulfilled, (state, action) => {
        state.createPurchaseBillStatus = "succeeded";
        state.purchaseBills.unshift(action.payload);
      })
      .addCase(createPurchaseBill.rejected, (state, action) => {
        state.createPurchaseBillStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPurchaseBills.pending, (state) => {
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchPurchaseBills.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.purchaseBills = action.payload;
        state.error = null;
      })
      .addCase(fetchPurchaseBills.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload;
      })
      .addCase(searchPurchaseBills.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchPurchaseBills.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
      })
      .addCase(searchPurchaseBills.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.payload;
      })
      .addCase(deletePurchaseBill.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deletePurchaseBill.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.purchaseBills = state.purchaseBills.filter(
          (bill) => bill._id !== action.payload
        );
      })
      .addCase(deletePurchaseBill.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetStatus } = purchaseBillSlice.actions;
export default purchaseBillSlice.reducer;

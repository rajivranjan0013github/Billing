import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setItemStatusIdle } from "./inventorySlice";
import { setCustomerStatusIdle } from "./CustomerSlice";

// Create new bill
export const createBill = createLoadingAsyncThunk(
  "bill/createBill",
  async (billData, {dispatch}) => {
    try {
      const response = await fetch(`${Backend_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create bill");
      }
      const data = await response.json();
      await dispatch(setAccountsStatusIdle());
      await dispatch(setCustomerStatusIdle());
      await dispatch(setItemStatusIdle());
      return data;
    } catch (error) {
      throw new Error("Failed to create bill");
    }
  },
  { useGlobalLoader: true }
);

// Fetch all bills with date range
export const fetchBills = createLoadingAsyncThunk(
  "bill/fetchBills",
  async ({ startDate, endDate }) => {
    const response = await fetch(
      `${Backend_URL}/api/sales?startDate=${startDate}&endDate=${endDate}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bills");
    }
    return response.json();
  }
);

// Search bills
export const searchBills = createLoadingAsyncThunk(
  "bill/searchBills",
  async ({ query, startDate, endDate }) => {
    const response = await fetch(
      `${Backend_URL}/api/sales/search?query=${query}&startDate=${startDate}&endDate=${endDate}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search bills");
    }
    return response.json();
  }
);

// Fetch a single bill by ID
export const fetchBillById = createLoadingAsyncThunk(
  "bill/fetchBillById",
  async (id) => {
    const response = await fetch(`${Backend_URL}/api/sales/sales-bill/${id}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch bill");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

const billSlice = createSlice({
  name: "bill",
  initialState: {
    bills: [],
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    selectedPreset: "today",
    createBillStatus: "idle",
    fetchStatus: "idle",
    searchStatus: "idle",
    error: null,
  },
  reducers: {
    resetStatus: (state) => {
      state.fetchStatus = "idle";
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    setSelectedPreset: (state, action) => {
      state.selectedPreset = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBill.pending, (state) => {
        state.createBillStatus = "loading";
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.createBillStatus = "succeeded";
        state.bills.unshift(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.createBillStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBills.pending, (state) => {
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.bills = action.payload;
        state.error = null;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload;
      })
      .addCase(searchBills.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchBills.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
      })
      .addCase(searchBills.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { resetStatus, setDateRange, setSelectedPreset } = billSlice.actions;
export default billSlice.reducer;

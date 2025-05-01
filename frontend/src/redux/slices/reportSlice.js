import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { format, startOfMonth } from "date-fns"; // Add date-fns import if needed for default values

// Async thunk for fetching sales report
export const fetchSalesReport = createLoadingAsyncThunk(
  "report/fetchSalesReport",
  async (params) => {
    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    const response = await fetch(
      `${Backend_URL}/api/reports/sales?${searchParams.toString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate report");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Async thunk for fetching purchase report
export const fetchPurchaseReport = createLoadingAsyncThunk(
  "report/fetchPurchaseReport",
  async (params) => {
    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    const response = await fetch(
      `${Backend_URL}/api/reports/purchase?${searchParams.toString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate report");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Async thunk for fetching inventory report
export const fetchInventoryReport = createLoadingAsyncThunk(
  "report/fetchInventoryReport",
  async (params) => {
    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });

    const response = await fetch(
      `${Backend_URL}/api/reports/inventory?${searchParams.toString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate inventory report");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

const reportSlice = createSlice({
  name: "report",
  initialState: {
    data: null,
    status: "idle", // idle | loading | succeeded | failed
    error: null,
    // Add date filter state - use null initially or default values if preferred
    dateRange: {
      from: null, // Store as ISO string or timestamp for serialization
      to: null, // Store as ISO string or timestamp for serialization
    },
    singleDate: null, // Store as ISO string or timestamp
    selectedMonth: null, // Store as ISO string or timestamp (e.g., 'yyyy-MM')
  },
  reducers: {
    clearReport: (state) => {
      state.data = null;
      state.error = null;
      state.status = "idle";
      // Optionally reset dates when clearing report data, or keep them
      // state.dateRange = { from: null, to: null };
      // state.singleDate = null;
      // state.selectedMonth = null;
    },
    // Reducer to update date range
    setDateRange: (state, action) => {
      // Ensure dates are stored in a serializable format (e.g., ISO string)
      state.dateRange.from = action.payload.from
        ? new Date(action.payload.from).toISOString()
        : null;
      state.dateRange.to = action.payload.to
        ? new Date(action.payload.to).toISOString()
        : null;
    },
    // Reducer to update single date
    setSingleDate: (state, action) => {
      state.singleDate = action.payload
        ? new Date(action.payload).toISOString()
        : null;
    },
    // Reducer to update selected month
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload
        ? new Date(action.payload).toISOString()
        : null; // Store the start of the month
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Add purchase report cases
      .addCase(fetchPurchaseReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPurchaseReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchPurchaseReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      // Add inventory report cases
      .addCase(fetchInventoryReport.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInventoryReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchInventoryReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { clearReport, setDateRange, setSingleDate, setSelectedMonth } =
  reportSlice.actions; // Export new actions

export default reportSlice.reducer;

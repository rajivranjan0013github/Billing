import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Backend_URL } from "../../assets/Data"; // Adjusted path
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";

// Async thunk for fetching dashboard metrics
export const fetchDashboardMetrics = createLoadingAsyncThunk(
  "dashboard/fetchMetrics",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/dashboard/metrics?startDate=${from.toISOString()}&endDate=${to.toISOString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch dashboard data");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "An unknown error occurred");
    }
  }
);

const initialState = {
  data: null,
  loading: "idle", // 'idle' | 'pending' | 'succeeded' | 'failed'
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    // Potential future reducers for synchronous actions
    resetDashboardState: (state) => {
      state.data = null;
      state.loading = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload; // error message from rejectWithValue
      });
  },
});

export const { resetDashboardState } = dashboardSlice.actions;
export default dashboardSlice.reducer;

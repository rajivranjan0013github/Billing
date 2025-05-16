import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

// Async thunk for fetching settings
export const fetchSettings = createLoadingAsyncThunk(
  "settings/fetchSettings",
  async () => {
    const response = await fetch(`${Backend_URL}/api/settings`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Async thunk for updating settings
export const updateSettings = createLoadingAsyncThunk(
  "settings/updateSettings",
  async (settingsData) => {
    const response = await fetch(`${Backend_URL}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settingsData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to update settings");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    settings: {
      adjustment: false,
    },
    status: "idle",
    updateStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(updateSettings.pending, (state) => {
        state.updateStatus = "loading";
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export default settingsSlice.reducer;

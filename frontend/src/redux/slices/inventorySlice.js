import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

const initialState = {
  items: [],
  itemsStatus: "idle",
  manageItemStatus: "idle",
  error: null,
};

// create or update item
export const manageInventory = createLoadingAsyncThunk(
  "inventory/manageInventory",
  async (itemData) => {
    const response = await fetch(`${Backend_URL}/api/inventory/manage-inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to create new item");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Thunk for fetching items
export const fetchItems = createLoadingAsyncThunk(
  "inventory/fetchItems",
  async () => {
    const response = await fetch(`${Backend_URL}/api/inventory`, {credentials: "include"});
    if (!response.ok) {
      throw new Error("Failed to fetch items");
    }
    return response.json();
  },
  { useGlobalLoader: true }
);

// Add new thunk for adjusting sto

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setItemStatusIdle: (state) => {
      state.itemsStatus = "idle";
      state.manageItemStatus = 'idle';
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.itemsStatus = "loading";
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.itemsStatus = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.itemsStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(manageInventory.pending, (state) => {
        state.manageItemStatus = "loading";
      })
      .addCase(manageInventory.fulfilled, (state, action) => {
        state.manageItemStatus = "succeeded";
        const itemIndex = state.items.findIndex(item => item._id === action.payload._id);
        if (itemIndex !== -1) {
          state.items[itemIndex] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(manageInventory.rejected, (state, action) => {
        state.manageItemStatus = "failed";
        state.error = action.error.message;
      })
  },
});

export const { setItemStatusIdle } = inventorySlice.actions;

export default inventorySlice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

const initialState = {
  items: [],
  itemsStatus: "idle",
  createItemStatus: "idle",
  adjustStockStatus: "idle",
  error: null,
};

export const createInventoryItem = createLoadingAsyncThunk(
    "pharmacy/createInventoryItem",
    async (itemData) => {
      const response = await fetch(`${Backend_URL}/api/inventory/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to create inventory item");
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

// Add new thunk for adjusting stock
export const adjustStock = createLoadingAsyncThunk(
  "inventory/adjustStock",
  async ({ itemId, adjustmentType, quantity, remarks }) => {
    const response = await fetch(
      `${Backend_URL}/api/inventory/${itemId}/adjust-stock`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ adjustmentType, quantity, remarks }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to adjust stock');
    }
    
    return response.json();
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
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
      .addCase(adjustStock.pending, (state) => {
        state.adjustStockStatus = "loading";
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        const updatedItem = action.payload;
        const index = state.items.findIndex(item => item._id === updatedItem._id);
        if (index !== -1) {
          state.items[index] = updatedItem;
        }
        state.adjustStockStatus = "succeeded";
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.adjustStockStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(createInventoryItem.pending, (state) => {
        state.createItemStatus = "loading";
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.createItemStatus = "succeeded";
        state.items.unshift(action.payload);
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.createItemStatus = "failed";
        state.error = action.error.message;
      })
  },
});

export default inventorySlice.reducer;

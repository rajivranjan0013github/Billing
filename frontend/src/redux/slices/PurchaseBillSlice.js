import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setDistributorStatusIdle } from "./distributorSlice";
import { setItemStatusIdle } from "./inventorySlice";

// Create purchase return
export const createPurchaseReturn = createLoadingAsyncThunk(
  "purchaseBill/createPurchaseReturn",
  async (returnData, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/purchase/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(returnData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create purchase return");
    }
    const result = await response.json();
    await dispatch(setAccountsStatusIdle());
    await dispatch(setDistributorStatusIdle());
    await dispatch(setItemStatusIdle());
    return result;
  },
  { useGlobalLoader: true }
);

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

// Save purchase draft
export const savePurchaseDraft = createLoadingAsyncThunk(
  "purchaseBill/savePurchaseDraft",
  async (draftData, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/purchase/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draftData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save purchase draft");
    }
    const result = await response.json();
    // Optionally, dispatch actions to update other slices if needed
    // await dispatch(setDistributorStatusIdle()); // Example
    return result; // This should return the saved draft with an _id
  },
  { useGlobalLoader: true } // Consider if global loader is desired here
);

// Upload invoice image
export const uploadInvoiceImage = createLoadingAsyncThunk(
  "purchaseBill/uploadInvoiceImage",
  async ({ invoiceId, imageBase64 }, { dispatch }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase/invoice/${invoiceId}/image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceImage: imageBase64 }),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload invoice image");
    }
    const result = await response.json();
    // Dispatch an action to update the specific purchase bill in the state if needed
    // Or simply refetch the bill details
    return result; // This should return the updated invoice details
  },
  { useGlobalLoader: true } // Consider if global loader is desired here
);

// Preprocess invoice image using LLM
export const preprocessImageForLLM = createLoadingAsyncThunk(
  "purchaseBill/preprocessImageForLLM",
  async ({ base64Image, mimeType }, { dispatch }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase/llm/preprocessImage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to send image for LLM preprocessing"
      );
    }
    const result = await response.json();
    // Optionally, handle the result from the preprocessing endpoint
    return result;
  },
  { useGlobalLoader: false }
);

// Fetch all purchase bills
export const fetchPurchaseBills = createLoadingAsyncThunk(
  "purchaseBill/fetchPurchaseBills",
  async ({ startDate, endDate, filter } = {}) => {
    let url = `${Backend_URL}/api/purchase`;
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (filter) params.append("filter", filter);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch purchase bills");
    }
    return response.json();
  }
);

// Search purchase bills
export const searchPurchaseBills = createLoadingAsyncThunk(
  "purchaseBill/searchPurchaseBills",
  async ({ query, searchType }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase/search?query=${query}&searchType=${searchType}`,
      { credentials: "include" }
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

// Search purchase bills by invoice
export const searchByInvoice = createLoadingAsyncThunk(
  "purchaseBill/searchByInvoice",
  async ({ distributorId, invoiceNumber }) => {
    const response = await fetch(
      `${Backend_URL}/api/purchase/search-by-invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ distributorId, invoiceNumber }),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch invoice details");
    }
    return response.json();
  }
);

const purchaseBillSlice = createSlice({
  name: "purchaseBill",
  initialState: {
    purchaseBills: [],
    fetchStatus: "idle",
    createPurchaseBillStatus: "idle",
    createPurchaseReturnStatus: "idle",
    searchStatus: "idle",
    searchByInvoiceStatus: "idle",
    deleteStatus: "idle",
    saveDraftStatus: "idle",
    uploadImageStatus: "idle",
    error: null,
    invoiceDetails: null,
    preprocessLLMStatus: "idle",
  },
  reducers: {
    resetStatus: (state) => {
      state.fetchStatus = "idle";
      state.createPurchaseBillStatus = "idle";
      state.createPurchaseReturnStatus = "idle";
      state.searchStatus = "idle";
      state.searchByInvoiceStatus = "idle";
      state.deleteStatus = "idle";
      state.saveDraftStatus = "idle";
      state.uploadImageStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseReturn.pending, (state) => {
        state.createPurchaseReturnStatus = "loading";
        state.error = null;
      })
      .addCase(createPurchaseReturn.fulfilled, (state, action) => {
        state.createPurchaseReturnStatus = "succeeded";
        state.error = null;
      })
      .addCase(createPurchaseReturn.rejected, (state, action) => {
        state.createPurchaseReturnStatus = "failed";
        state.error = action.error.message;
      })
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
        state.purchaseBills = action.payload;
        state.error = null;
      })
      .addCase(searchPurchaseBills.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.error.message;
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
      })
      .addCase(searchByInvoice.pending, (state) => {
        state.searchByInvoiceStatus = "loading";
        state.error = null;
      })
      .addCase(searchByInvoice.fulfilled, (state, action) => {
        state.searchByInvoiceStatus = "succeeded";
        state.invoiceDetails = action.payload;
        state.error = null;
      })
      .addCase(searchByInvoice.rejected, (state, action) => {
        state.searchByInvoiceStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(savePurchaseDraft.pending, (state) => {
        state.saveDraftStatus = "loading";
        state.error = null;
      })
      .addCase(savePurchaseDraft.fulfilled, (state, action) => {
        state.saveDraftStatus = "succeeded";
        const index = state.purchaseBills.findIndex(
          (bill) => bill._id === action.payload._id
        );
        if (index !== -1) {
          state.purchaseBills[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(savePurchaseDraft.rejected, (state, action) => {
        state.saveDraftStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(uploadInvoiceImage.pending, (state) => {
        state.uploadImageStatus = "loading";
        state.error = null;
      })
      .addCase(uploadInvoiceImage.fulfilled, (state, action) => {
        state.uploadImageStatus = "succeeded";
        const index = state.purchaseBills.findIndex(
          (bill) => bill._id === action.payload._id
        );
        if (index !== -1) {
          state.purchaseBills[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(uploadInvoiceImage.rejected, (state, action) => {
        state.uploadImageStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(preprocessImageForLLM.pending, (state) => {
        state.preprocessLLMStatus = "loading";
        state.error = null;
      })
      .addCase(preprocessImageForLLM.fulfilled, (state, action) => {
        state.preprocessLLMStatus = "succeeded";
        state.error = null;
      })
      .addCase(preprocessImageForLLM.rejected, (state, action) => {
        state.preprocessLLMStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { resetStatus } = purchaseBillSlice.actions;
export default purchaseBillSlice.reducer;

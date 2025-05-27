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

// Delete sale invoice
export const deleteSaleInvoice = createLoadingAsyncThunk(
  "bill/deleteSaleInvoice",
  async (invoiceId, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/sales/invoice/${invoiceId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete sale invoice");
    }
    await dispatch(setAccountsStatusIdle());
    await dispatch(setCustomerStatusIdle());
    await dispatch(setItemStatusIdle());
    return invoiceId;
  },
  { useGlobalLoader: true }
);

// Fetch bills
export const fetchBills = createLoadingAsyncThunk(
  "bill/fetchBills",
  async ({ startDate, endDate, filter } = {}) => {
    let url = `${Backend_URL}/api/sales`;
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (filter) params.append("filter", filter);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Failed to fetch bills");
    }
    return response.json();
  }
);

// Search bills
export const searchBills = createLoadingAsyncThunk(
  "bill/searchBills",
  async ({ query, searchType }) => {
    const response = await fetch(
      `${Backend_URL}/api/sales/search?query=${query}&searchType=${searchType}`,
      { credentials: "include" }
    );

    if (!response.ok) {
      throw new Error("Failed to search bills");
    }
    return response.json();
  }
);

// Edit sale invoice
export const editSaleInvoice = createLoadingAsyncThunk(
  "bill/editSaleInvoice",
  async (invoiceData, { dispatch }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/sales/invoice/${invoiceData._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to edit invoice");
      }

      const data = await response.json();
      
      // Reset related states
      await dispatch(setAccountsStatusIdle());
      await dispatch(setCustomerStatusIdle());
      await dispatch(setItemStatusIdle());
      
      return data;
    } catch (error) {
      throw new Error(error.message || "Failed to edit invoice");
    }
  },
  { useGlobalLoader: true }
);

const billSlice = createSlice({
  name: "bill",
  initialState: {
    bills: [],
    createBillStatus: "idle",
    editBillStatus: "idle",
    fetchStatus: "idle",
    searchStatus: "idle",
    deleteStatus: "idle",
    error: null,
    dateRange: {
      from: null,
      to: null
    }
  },
  reducers: {
    resetStatus: (state) => {
      state.createBillStatus = "idle";
      state.editBillStatus = "idle";
      state.fetchStatus = "idle";
      state.searchStatus = "idle";
      state.deleteStatus = "idle";
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle createBill
      .addCase(createBill.pending, (state) => {
        state.createBillStatus = "loading";
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state) => {
        state.createBillStatus = "succeeded";
        state.error = null;
      })
      .addCase(createBill.rejected, (state, action) => {
        state.createBillStatus = "failed";
        state.error = action.error.message;
      })
      // Handle fetchBills
      .addCase(fetchBills.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.bills = action.payload;
        state.error = null;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })
      // Handle searchBills
      .addCase(searchBills.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchBills.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.bills = action.payload;
        state.error = null;
      })
      .addCase(searchBills.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.error.message;
      })
      // Handle editSaleInvoice
      .addCase(editSaleInvoice.pending, (state) => {
        state.editBillStatus = "loading";
        state.error = null;
      })
      .addCase(editSaleInvoice.fulfilled, (state) => {
        state.editBillStatus = "succeeded";
        state.error = null;
      })
      .addCase(editSaleInvoice.rejected, (state, action) => {
        state.editBillStatus = "failed";
        state.error = action.error.message;
      })
      // Handle deleteSaleInvoice
      .addCase(deleteSaleInvoice.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteSaleInvoice.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.bills = state.bills.filter(bill => bill._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteSaleInvoice.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { resetStatus, setDateRange } = billSlice.actions;
export default billSlice.reducer;

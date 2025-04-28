import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setItemStatusIdle } from "./inventorySlice";
import { setCustomerStatusIdle } from "./CustomerSlice";
import { setPaymentIdle } from "./paymentSlice";

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
      await dispatch(setPaymentIdle());
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to edit invoice");
      }

      const data = await response.json();
      
      // Reset related states
      await dispatch(setAccountsStatusIdle());
      await dispatch(setCustomerStatusIdle());
      await dispatch(setItemStatusIdle());
      await dispatch(setPaymentIdle());
      
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
    dateRange: {
      from: new Date().toISOString(),
      to: new Date().toISOString()
    },
    selectedPreset: "today",
    createBillStatus: "idle",
    editBillStatus : 'idle',
    fetchStatus: "idle",
    searchStatus: "idle",
    saleTypeFilter: "all",
    error: null,
  },
  reducers: {
    resetStatus: (state) => {
      state.fetchStatus = "idle";
      state.error = null;
    },
    resetFilters: (state) => {
      state.dateRange = {
        from: new Date().toISOString(),
        to: new Date().toISOString()
      };
      state.selectedPreset = "today";
      state.saleTypeFilter = "all";
    },
    setDateRange: (state, action) => {
      state.dateRange = {
        from: action.payload.from instanceof Date ? action.payload.from.toISOString() : action.payload.from,
        to: action.payload.to instanceof Date ? action.payload.to.toISOString() : action.payload.to
      };
    },
    setSelectedPreset: (state, action) => {
      state.selectedPreset = action.payload;
    },
    setSaleTypeFilter: (state, action) => {
      state.saleTypeFilter = action.payload;
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
      })
      .addCase(editSaleInvoice.pending, (state) => {
        state.editBillStatus = "loading";
        state.error = null;
      })
      .addCase(editSaleInvoice.fulfilled, (state, action) => {
        state.editBillStatus = "succeeded";
        // Update the bill in the bills array
        const index = state.bills.findIndex(bill => bill._id === action.payload._id);
        if (index !== -1) {
          state.bills[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(editSaleInvoice.rejected, (state, action) => {
        state.editBillStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { resetStatus, resetFilters, setDateRange, setSelectedPreset, setSaleTypeFilter } = billSlice.actions;
export default billSlice.reducer;

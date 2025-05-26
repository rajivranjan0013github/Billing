import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setDistributorStatusIdle } from "./distributorSlice";

export const fetchPayments = createLoadingAsyncThunk(
  "payment/fetchPayments",
  async ({ startDate, endDate, filter } = {}) => {
    let url = `${Backend_URL}/api/payment`;
    const params = new URLSearchParams();

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (filter) params.append("filter", filter);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Failed to fetch payments");
    }
    return response.json();
  }
);

// Create Payment
export const createPayment = createLoadingAsyncThunk(
  "payment/createPayment",
  async (paymentData, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/payment/make-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error("Payment creation failed");
    }
    const result = await response.json();
    await dispatch(setAccountsStatusIdle());
    await dispatch(setDistributorStatusIdle());
    return result;
  },
  { useGlobalLoader: true }
);

// Delete Payment
export const deletePayment = createLoadingAsyncThunk(
  "payment/deletePayment",
  async (paymentId) => {
    const response = await fetch(`${Backend_URL}/api/payment/${paymentId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Payment deletion failed");
    }
    return { paymentId, message: "Payment deleted successfully" };
  },
  { useGlobalLoader: true }
);

// Search payments
export const searchPayments = createLoadingAsyncThunk(
  "payment/searchPayments",
  async ({ query, searchType }) => {
    const response = await fetch(
      `${Backend_URL}/api/payment/search?query=${query}&searchType=${searchType}`,
      { credentials: "include" }
    );

    if (!response.ok) {
      throw new Error("Failed to search payments");
    }
    return response.json();
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    createPaymentStatus: "idle",
    deletePaymentStatus: "idle",
    fetchStatus: "idle",
    searchStatus: "idle",
    error: null,
    dateRange: {
      from: null,
      to: null
    }
  },
  reducers: {
    resetStatus: (state) => {
      state.createPaymentStatus = "idle";
      state.deletePaymentStatus = "idle";
      state.fetchStatus = "idle";
      state.searchStatus = "idle";
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchPayments
      .addCase(fetchPayments.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.payments = action.payload;
        state.error = null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })
      // Handle searchPayments
      .addCase(searchPayments.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(searchPayments.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.payments = action.payload;
        state.error = null;
      })
      .addCase(searchPayments.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.error = action.error.message;
      })
      // Handle createPayment
      .addCase(createPayment.pending, (state) => {
        state.createPaymentStatus = "loading";
      })
      .addCase(createPayment.fulfilled, (state) => {
        state.createPaymentStatus = "succeeded";
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.createPaymentStatus = "failed";
        state.error = action.error.message;
      })
      // Handle deletePayment
      .addCase(deletePayment.pending, (state) => {
        state.deletePaymentStatus = "loading";
      })
      .addCase(deletePayment.fulfilled, (state) => {
        state.deletePaymentStatus = "succeeded";
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.deletePaymentStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { resetStatus, setDateRange } = paymentSlice.actions;
export default paymentSlice.reducer;

  import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setDistributorStatusIdle } from "./distributorSlice";

export const fetchPayments = createLoadingAsyncThunk(
  "payment/fetchPayments",
  async ({ startDate, endDate } = {}) => {
    let url = `${Backend_URL}/api/payment`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    const paymentArray = await response.json();
    return {paymentArray , startDate, endDate};
  },
  { useGlobalLoader: true }
);

// Create Payment
export const createPayment = createLoadingAsyncThunk(
  "payment/createPayment",
  async (paymentData, { dispatch }) => {
    const response = await fetch(`${Backend_URL}/api/payment/make-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error('Payment creation failed');
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
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Payment deletion failed');
    }
    return { paymentId, message: 'Payment deleted successfully' };
  },
  { useGlobalLoader: true }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    dateRange: {
      from: new Date(),
      to: new Date()
    },
    selectedPreset: "today",
    paymentsStatus: "idle",
    createPaymentStatus: "idle",
    deletePaymentStatus: "idle",
    error: null,
  },
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = {
        from: action.payload.from instanceof Date ? action.payload.from.toISOString() : action.payload.from,
        to: action.payload.to instanceof Date ? action.payload.to.toISOString() : action.payload.to
      };
    },
    setSelectedPreset: (state, action) => {
      state.selectedPreset = action.payload;
    },
    setPaymentIdle: (state) => {
      state.paymentsStatus = 'idle';
      state.selectedPreset = 'today';
      state.payments = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.paymentsStatus = "loading";
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentsStatus = "succeeded";
        state.payments = action.payload.paymentArray || [];
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.paymentsStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(createPayment.pending, (state) => {
        state.createPaymentStatus = "loading";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.createPaymentStatus = "succeeded";
        state.payments.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.createPaymentStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(deletePayment.pending, (state) => {
        state.deletePaymentStatus = "loading";
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.deletePaymentStatus = "succeeded";
        const paymentId = action.payload.paymentId;
        state.payments = state.payments.filter(payment => payment._id !== paymentId);
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.deletePaymentStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { setDateRange, setSelectedPreset, setPaymentIdle } = paymentSlice.actions;
export default paymentSlice.reducer;

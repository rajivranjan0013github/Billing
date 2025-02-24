import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";
import { setAccountsStatusIdle } from "./accountSlice";
import { setDistributorStatusIdle } from "./distributorSlice";

export const fetchPaymentsOut = createLoadingAsyncThunk(
  "payment/fetchPaymentsOut",
  async () => {
    const paymentType = "Payment Out";
    const response = await fetch(
      `${Backend_URL}/api/payment?paymentType=${paymentType}`,
      { credentials: "include" }
    );
    return response.json();
  },
  { useGlobalLoader: true }
);

export const fetchPaymentsIn = createLoadingAsyncThunk(
  "payment/fetchPaymentsIn",
  async () => {
    const paymentType = "Payment In";
    const response = await fetch(
      `${Backend_URL}/api/payment?paymentType=${paymentType}`,
      { credentials: "include" }
    );
    return response.json();
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
    paymentIn: [],
    paymentOut: [],
    paymentInStatus: "idle",
    paymentOutStatus: "idle",
    createPaymentStatus: "idle",
    deletePaymentStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentsOut.pending, (state) => {
        state.paymentOutStatus = "loading";
      })
      .addCase(fetchPaymentsOut.fulfilled, (state, action) => {
        state.paymentOutStatus = "succeeded";
        state.paymentOut = action.payload;
      })
      .addCase(fetchPaymentsOut.rejected, (state, action) => {
        state.paymentOutStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchPaymentsIn.pending, (state) => {
        state.paymentInStatus = "loading";
      })
      .addCase(fetchPaymentsIn.fulfilled, (state, action) => {
        state.paymentInStatus = "succeeded";
        state.paymentIn = action.payload;
      })
      .addCase(fetchPaymentsIn.rejected, (state, action) => {
        state.paymentInStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(createPayment.pending, (state) => {
        state.createPaymentStatus = "loading";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.createPaymentStatus = "succeeded";
        if(action.payload.paymentType === "Payment Out") {
          state.paymentOut.unshift(action.payload);
        } else {
          state.paymentIn.unshift(action.payload);
        }
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
        state.paymentIn = state.paymentIn.filter(payment => payment._id !== paymentId);
        state.paymentOut = state.paymentOut.filter(payment => payment._id !== paymentId);
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.deletePaymentStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export default paymentSlice.reducer;

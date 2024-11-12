import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

export const fetchPayments = createLoadingAsyncThunk(
  "payment/fetchPayments",
  async (payment_type) => {
    const response = await fetch(
      `${Backend_URL}/api/payment?payment_type=${payment_type}`,
      { credentials: "include" }
    );
    return response.json();
  }
);

export const createPayment = createLoadingAsyncThunk(
  "payment/createPayment",
  async (paymentData) => {
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
    return response.json();
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    paymentOut: [],
    fetchStatus: "idle",
    createStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.paymentOut = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(createPayment.pending, (state) => {
        state.createStatus = "loading";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.paymentOut.unshift(action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export default paymentSlice.reducer;

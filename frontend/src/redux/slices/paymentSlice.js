import { createSlice } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

export const fetchPaymentsOut = createLoadingAsyncThunk(
  "payment/fetchPaymentsOut",
  async () => {
    const payment_type = "Payment Out";
    const response = await fetch(
      `${Backend_URL}/api/payment?payment_type=${payment_type}`,
      { credentials: "include" }
    );
    return response.json();
  }
);

export const fetchPaymentsIn = createLoadingAsyncThunk(
  "payment/fetchPaymentsIn",
  async () => {
    const payment_type = "Payment In";
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
    paymentIn: [],
    paymentOut: [],
    paymentInStatus: "idle",
    paymentOutStatus: "idle",
    createStatus: "idle",
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
        state.createStatus = "loading";
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        if(action.payload.payment_type === "Payment Out") {
          state.paymentOut.unshift(action.payload);
        } else {
          state.paymentIn.unshift(action.payload);
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export default paymentSlice.reducer;

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

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    payments: [],
    fetchStatus: "idle",
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
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export default paymentSlice.reducer;

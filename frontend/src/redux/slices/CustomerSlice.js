import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Backend_URL } from "../../assets/Data";

// Async thunks
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async () => {
    const response = await fetch(`${Backend_URL}/api/customers`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch customers");
    }
    return response.json();
  }
);

export const addCustomer = createAsyncThunk(
  "customers/addCustomer",
  async (customerData) => {
    const response = await fetch(`${Backend_URL}/api/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to add customer");
    }
    return response.json();
  }
);

export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async ({ id, customerData }) => {
    const response = await fetch(`${Backend_URL}/api/customers/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to update customer");
    }
    return response.json();
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id) => {
    const response = await fetch(`${Backend_URL}/api/customers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to delete customer");
    }
    return id;
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(
          (customer) => customer._id === action.payload._id
        );
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(
          (customer) => customer._id !== action.payload
        );
      });
  },
});

export default customerSlice.reducer;

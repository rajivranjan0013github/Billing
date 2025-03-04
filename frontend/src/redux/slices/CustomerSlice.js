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

export const fetchCustomerDetails = createAsyncThunk(
  "customers/fetchCustomerDetails",
  async (customerId) => {
    const response = await fetch(`${Backend_URL}/api/customers/${customerId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch customer details");
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
    currentCustomer: {
      details: null,
      invoices: [],
      payments: [],
      returns: [],
      status: "idle",
      tabName: "profile",
    },
  },
  reducers: {
    setTabName: (state, action) => {
      state.currentCustomer.tabName = action.payload;
    },
    setCustomerStatusIdle: (state) => {
      state.status = "idle";
      state.currentCustomer.status = "idle";
      state.error = null;
    },
  },
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
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.currentCustomer.status = "loading";
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.currentCustomer.status = "succeeded";
        state.currentCustomer.details = action.payload;
        state.currentCustomer.invoices = action.payload.invoices || [];
        state.currentCustomer.payments = action.payload.payments || [];
        state.currentCustomer.returns = action.payload.returns || [];
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.currentCustomer.status = "failed";
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

export const { setTabName, setCustomerStatusIdle } = customerSlice.actions;
export default customerSlice.reducer;

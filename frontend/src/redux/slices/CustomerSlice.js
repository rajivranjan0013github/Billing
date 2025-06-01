import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Backend_URL } from "../../assets/Data";

// Async thunks
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async ({ page = 1, searchQuery = "", searchType = "name" } = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(searchQuery && { search: searchQuery, searchType }),
    });

    const response = await fetch(`${Backend_URL}/api/customers?${params}`, {
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

export const fetchCustomerLedgerEntries = createAsyncThunk(
  "customers/fetchLedgerEntries",
  async (customerId) => {
    const response = await fetch(
      `${Backend_URL}/api/customers/ledger/${customerId}`,
      {
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch ledger entries");
    }
    return response.json();
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
      ledgerEntries: [],
      ledgerStatus: "idle",
      deleteCustomerStatus: "idle",
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
    },
    search: {
      query: "",
      type: "name",
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
    setSearch: (state, action) => {
      state.search = action.payload;
      state.pagination.currentPage = 1; // Reset to first page on new search
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.customers = action.payload.customers;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount,
        };
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
      .addCase(deleteCustomer.pending, (state) => {
        state.currentCustomer.deleteCustomerStatus = "loading";
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.currentCustomer.deleteCustomerStatus = "succeeded";
        state.customers = state.customers.filter(
          (customer) => customer._id !== action.payload
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.currentCustomer.deleteCustomerStatus = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchCustomerLedgerEntries.pending, (state) => {
        state.currentCustomer.ledgerStatus = "loading";
      })
      .addCase(fetchCustomerLedgerEntries.fulfilled, (state, action) => {
        state.currentCustomer.ledgerStatus = "succeeded";
        state.currentCustomer.ledgerEntries = action.payload;
      })
      .addCase(fetchCustomerLedgerEntries.rejected, (state, action) => {
        state.currentCustomer.ledgerStatus = "failed";
        state.error = action.error.message;
      });
  },
});

export const { setTabName, setCustomerStatusIdle, setSearch } =
  customerSlice.actions;
export default customerSlice.reducer;

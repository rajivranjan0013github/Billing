import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Backend_URL } from "../../assets/Data";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";

// create new distributor
export const createDistributor = createLoadingAsyncThunk(
  "distributor/createDistributor",
  async (distributorData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/distributor/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(distributorData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create distributor");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// fetch all distributor
export const fetchDistributors = createLoadingAsyncThunk(
  "distributor/fetchDistributors",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/distributor`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch distributors");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchLedgerEntries = createLoadingAsyncThunk(
  "distributor/fetchLedgerEntries",
  async (distributorId, { rejectWithValue }) => {
    const response = await fetch(
      `${Backend_URL}/api/distributor/ledger/${distributorId}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      return rejectWithValue("Failed to fetch ledger entries");
    }

    return await response.json();
  }
);

// fetch details of a distributor (now only fetches basic details)
export const fetchDistributorDetails = createLoadingAsyncThunk(
  "distributor/fetchDistributorDetails",
  async (distributorId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/distributor/details/${distributorId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch distributor details"
        );
      }

      return await response.json(); // Expects { details: { ... } }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// fetch invoices for a distributor
export const fetchDistributorInvoices = createLoadingAsyncThunk(
  "distributor/fetchDistributorInvoices",
  async (distributorId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/distributor/invoices/${distributorId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch distributor invoices"
        );
      }
      return await response.json(); // Expects array of invoices
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// fetch payments for a distributor
export const fetchDistributorPayments = createLoadingAsyncThunk(
  "distributor/fetchDistributorPayments",
  async (distributorId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/distributor/payments/${distributorId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch distributor payments"
        );
      }
      return await response.json(); // Expects array of payments
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// update distributor
export const updateDistributor = createLoadingAsyncThunk(
  "distributor/updateDistributor",
  async ({ id, distributorData }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/distributor/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(distributorData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update distributor");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// delete distributor
export const deleteDistributor = createLoadingAsyncThunk(
  "distributor/deleteDistributor",
  async (id, { rejectWithValue }) => {
    const response = await fetch(`${Backend_URL}/api/distributor/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete distributor");
    }

    return await response.json();
  }
);

const distributorSlice = createSlice({
  name: "distributor",
  initialState: {
    distributors: [],
    createDistributorStatus: "idle",
    updateDistributorStatus: "idle",
    deleteDistributorStatus: "idle",
    fetchStatus: "idle",
    error: null,
    currentDistributor: {
      details: null,
      invoices: [],
      payments: [],
      status: "idle",
      invoicesStatus: "idle",
      paymentsStatus: "idle",
      tabName: "profile",
      scrollIndex: "",
      deleteDistributorStatus: "idle",
    },
  },
  reducers: {
    setTabName: (state, action) => {
      state.currentDistributor.tabName = action.payload;
    },
    setDistributorStatusIdle: (state) => {
      state.createDistributorStatus = "idle";
      state.fetchStatus = "idle";
      state.currentDistributor.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDistributor.pending, (state) => {
        state.createDistributorStatus = "loading";
      })
      .addCase(createDistributor.fulfilled, (state, action) => {
        state.createDistributorStatus = "succeeded";
        state.distributors.push(action.payload);
      })
      .addCase(createDistributor.rejected, (state, action) => {
        state.createDistributorStatus = "failed";
        state.error = action.payload.message;
      })
      .addCase(fetchDistributors.pending, (state) => {
        state.fetchStatus = "loading";
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.distributors = action.payload;
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchDistributorDetails.pending, (state) => {
        state.currentDistributor.status = "loading";
        state.error = null;
      })
      .addCase(fetchDistributorDetails.fulfilled, (state, action) => {
        state.currentDistributor.status = "succeeded";
        state.currentDistributor.details = action.payload.details;
        if (state.currentDistributor.details?._id !== action.meta.arg) {
          state.currentDistributor.invoices = [];
          state.currentDistributor.payments = [];
          state.currentDistributor.invoicesStatus = "idle";
          state.currentDistributor.paymentsStatus = "idle";
        }
      })
      .addCase(fetchDistributorDetails.rejected, (state, action) => {
        state.currentDistributor.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchDistributorInvoices.pending, (state) => {
        state.currentDistributor.invoicesStatus = "loading";
      })
      .addCase(fetchDistributorInvoices.fulfilled, (state, action) => {
        state.currentDistributor.invoicesStatus = "succeeded";
        state.currentDistributor.invoices = action.payload;
      })
      .addCase(fetchDistributorInvoices.rejected, (state, action) => {
        state.currentDistributor.invoicesStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchDistributorPayments.pending, (state) => {
        state.currentDistributor.paymentsStatus = "loading";
      })
      .addCase(fetchDistributorPayments.fulfilled, (state, action) => {
        state.currentDistributor.paymentsStatus = "succeeded";
        state.currentDistributor.payments = action.payload;
      })
      .addCase(fetchDistributorPayments.rejected, (state, action) => {
        state.currentDistributor.paymentsStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateDistributor.pending, (state) => {
        state.updateDistributorStatus = "loading";
      })
      .addCase(updateDistributor.fulfilled, (state, action) => {
        state.updateDistributorStatus = "succeeded";
        const index = state.distributors.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.distributors[index] = action.payload;
        }
        if (state.currentDistributor.details?._id === action.payload._id) {
          state.currentDistributor.details = action.payload;
        }
      })
      .addCase(updateDistributor.rejected, (state, action) => {
        state.updateDistributorStatus = "failed";
        state.error = action.payload;
      })
      .addCase(deleteDistributor.pending, (state) => {
        state.currentDistributor.deleteDistributorStatus = "loading";
      })
      .addCase(deleteDistributor.fulfilled, (state, action) => {
        state.currentDistributor.deleteDistributorStatus = "succeeded";
        state.distributors = state.distributors.filter(
          (distributor) => distributor._id !== action.meta.arg
        );
      })
      .addCase(deleteDistributor.rejected, (state, action) => {
        state.currentDistributor.deleteDistributorStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { setTabName, setDistributorStatusIdle } =
  distributorSlice.actions;
export default distributorSlice.reducer;

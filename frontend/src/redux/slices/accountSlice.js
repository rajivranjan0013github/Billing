import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Backend_URL } from "../../assets/Data";

// Async thunks
export const fetchAccounts = createAsyncThunk(
  "accounts/fetchAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/accounts`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addAccount = createAsyncThunk(
  "accounts/addAccount",
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(accountData),
      });
      if (!response.ok) throw new Error("Failed to add account");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAccount = createAsyncThunk(
  "accounts/updateAccount",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update account");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAccountBalance = createAsyncThunk(
  "accounts/updateBalance",
  async ({ id, amount, type }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/accounts/${id}/update-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount, type }),
        }
      );
      if (!response.ok) throw new Error("Failed to update balance");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAccountTransactions = createAsyncThunk(
  "accounts/fetchTransactions",
  async ({ id, startDate, endDate }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const response = await fetch(
        `${Backend_URL}/api/accounts/${id}/transactions?${queryParams}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const accountSlice = createSlice({
  name: "accounts",
  initialState: {
    accounts: [],
    transactions: [],
    loading: false,
    error: null,
    selectedAccount: null,
  },
  reducers: {
    setSelectedAccount: (state, action) => {
      state.selectedAccount = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Account
      .addCase(addAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts.unshift(action.payload);
      })
      .addCase(addAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex(
          (account) => account._id === action.payload._id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Balance
      .addCase(updateAccountBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex(
          (account) => account._id === action.payload._id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Transactions
      .addCase(fetchAccountTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchAccountTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedAccount, clearError } = accountSlice.actions;

export default accountSlice.reducer;

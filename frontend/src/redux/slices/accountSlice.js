import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from "../../assets/Data";

// Async thunks
export const fetchAccounts = createLoadingAsyncThunk(
  "accounts/fetchAccounts",
  async () => {
    const response = await fetch(`${Backend_URL}/api/accounts`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch accounts");
    return await response.json();
  },
  { useGlobalLoader: true }
);

export const addAccount = createLoadingAsyncThunk(
  "accounts/addAccount",
  async (accountData) => {
    const response = await fetch(`${Backend_URL}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(accountData),
    });
    if (!response.ok) throw new Error("Failed to add account");
    return await response.json();
  },
  { useGlobalLoader: true }
);

export const updateAccount = createLoadingAsyncThunk(
  "accounts/updateAccount",
  async ({ id, data }) => {
    const response = await fetch(`${Backend_URL}/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update account");
    return await response.json();
  },
  { useGlobalLoader: true }
);

export const updateAccountBalance = createLoadingAsyncThunk(
  "accounts/updateBalance",
  async ({ id, amount, type }) => {
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
  }
);

export const fetchAccountTransactions = createLoadingAsyncThunk(
  "accounts/fetchTransactions",
  async ({ accountId, page = 1 }) => {
    const response = await fetch(`${Backend_URL}/api/accounts/transactions?accountId=${accountId}&page=${page}`, {
      credentials: "include"
    });
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return await response.json();
  }
);

const accountSlice = createSlice({
  name: "accounts",
  initialState: {
    accounts: [],
    transactions: [],
    pagination: {
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: 30
    },
    error: null,
    selectedAccount: null,
    fetchStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    createAccountStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    updateAccountStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    updateBalanceStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    transactionsStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  },
  reducers: {
    setAccountsStatusIdle: (state) => {
      state.fetchStatus = 'idle';
      state.createAccountStatus = 'idle';
      state.updateAccountStatus = 'idle';
      state.updateBalanceStatus = 'idle';
      state.transactionsStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.fetchStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      })

      // Add Account
      .addCase(addAccount.pending, (state) => {
        state.createAccountStatus = 'loading';
        state.error = null;
      })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.createAccountStatus = 'succeeded';
        state.accounts.unshift(action.payload);
      })
      .addCase(addAccount.rejected, (state, action) => {
        state.createAccountStatus = 'failed';
        state.error = action.payload;
      })

      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.updateAccountStatus = 'loading';
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.updateAccountStatus = 'succeeded';
        const index = state.accounts.findIndex(
          (account) => account._id === action.payload._id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.updateAccountStatus = 'failed';
        state.error = action.payload;
      })

      // Update Balance
      .addCase(updateAccountBalance.pending, (state) => {
        state.updateBalanceStatus = 'loading';
        state.error = null;
      })
      .addCase(updateAccountBalance.fulfilled, (state, action) => {
        state.updateBalanceStatus = 'succeeded';
        const index = state.accounts.findIndex(
          (account) => account._id === action.payload._id
        );
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccountBalance.rejected, (state, action) => {
        state.updateBalanceStatus = 'failed';
        state.error = action.payload;
      })

      // Fetch Transactions
      .addCase(fetchAccountTransactions.pending, (state) => {
        state.transactionsStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAccountTransactions.fulfilled, (state, action) => {
        state.transactionsStatus = 'succeeded';
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAccountTransactions.rejected, (state, action) => {
        state.transactionsStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setAccountsStatusIdle } = accountSlice.actions;

export default accountSlice.reducer;

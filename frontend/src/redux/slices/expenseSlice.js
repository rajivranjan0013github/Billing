import { createSlice } from '@reduxjs/toolkit';
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";
import { Backend_URL } from '../../assets/Data';

// Async thunk to create an expense
export const createExpense = createLoadingAsyncThunk(
  'expenses/createExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/expenses/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// Async thunk to update an expense
export const updateExpense = createLoadingAsyncThunk(
  'expenses/updateExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/expenses/update/${expenseData._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// Async thunk to make a payment for an expense
export const payExpense = createLoadingAsyncThunk(
  'expenses/payExpense',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/expenses/${id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// Async thunk to delete an expense
export const deleteExpense = createLoadingAsyncThunk(
  'expenses/deleteExpense',
  async (expenseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/expenses/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      return expenseId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

// New async thunk to fetch expenses
export const fetchExpenses = createLoadingAsyncThunk(
  'expenses/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/expenses`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { useGlobalLoader: true }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    expensesStatus: "idle",
    createExpenseStatus: "idle",
    updateExpenseStatus: "idle",
    payExpenseStatus: "idle",
    deleteExpenseStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createExpense.pending, (state) => {
        state.createExpenseStatus = "loading";
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.createExpenseStatus = "succeeded";
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.createExpenseStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateExpense.pending, (state) => {
        state.updateExpenseStatus = "loading";
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.updateExpenseStatus = "succeeded";
        const index = state.expenses.findIndex(expense => expense._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.updateExpenseStatus = "failed";
        state.error = action.payload;
      })
      .addCase(payExpense.pending, (state) => {
        state.payExpenseStatus = "loading";
        state.error = null;
      })
      .addCase(payExpense.fulfilled, (state, action) => {
        state.payExpenseStatus = "succeeded";
        const index = state.expenses.findIndex(expense => expense._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(payExpense.rejected, (state, action) => {
        state.payExpenseStatus = "failed";
        state.error = action.payload;
      })
      .addCase(deleteExpense.pending, (state) => {
        state.deleteExpenseStatus = "loading";
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.deleteExpenseStatus = "succeeded";
        state.expenses = state.expenses.filter(expense => expense._id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.deleteExpenseStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchExpenses.pending, (state) => {
        state.expensesStatus = "loading";
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expensesStatus = "succeeded";
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.expensesStatus = "failed";
        state.error = action.payload;
      });
  },
});

export default expenseSlice.reducer;

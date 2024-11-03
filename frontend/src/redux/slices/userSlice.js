import { Backend_URL } from '../../assets/Data';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import createLoadingAsyncThunk from "./createLoadingAsyncThunk";


// Async thunk for user login
export const loginUser = createLoadingAsyncThunk(
  'user/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials:"include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }, {useGlobalLoader: true }
);

// Async thunk for fetching user data
export const fetchUserData = createLoadingAsyncThunk(
  'user/fetchUserData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/staff/me`, {
        method: 'GET',
        headers: {
          
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
  if (response.status === 500) {
    throw new Error('Server error: 500 Internal Server Error');
  }
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }, {useGlobalLoader: true }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userData: null,
    status: 'idle',
    error: null,
    isAuthenticated: false,
    loginStatus: 'idle',
    loginError: null,
  },
  reducers: {
    clearUserData: (state) => {
      state.userData = null;
      state.status = 'idle';
      state.error = null;
      state.isAuthenticated = false;
      state.loginStatus = 'idle';
      state.loginError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loginStatus = 'loading';
        state.loginError = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loginStatus = 'succeeded';
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = 'failed';
        state.loginError = action.payload;
        state.isAuthenticated = false;
      })
      // Fetch user data cases
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userData = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
      });
  },
});

export const { clearUserData } = userSlice.actions;

export default userSlice.reducer;

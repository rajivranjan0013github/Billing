import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Backend_URL } from '../../assets/Data';
import createLoadingAsyncThunk from './createLoadingAsyncThunk';

export const createParty = createLoadingAsyncThunk(
  'party/createParty',
  async (partyData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/party/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partyData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create party');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }, {useGlobalLoader: true}
);

export const fetchParties = createLoadingAsyncThunk(
  'party/fetchParties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${Backend_URL}/api/party`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch parties');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const partySlice = createSlice({
  name: 'party',
  initialState: {
    parties: [],
    createPartyStatus: 'idle',
    fetchStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createParty.pending, (state) => {
        state.createPartyStatus = 'loading';
      })
      .addCase(createParty.fulfilled, (state, action) => {
        state.createPartyStatus = 'succeeded';
        state.parties.push(action.payload);
      })
      .addCase(createParty.rejected, (state, action) => {
        state.createPartyStatus = 'failed';
        state.error = action.payload.message;
      })
      .addCase(fetchParties.pending, (state) => {
        state.fetchStatus = 'loading';
      })
      .addCase(fetchParties.fulfilled, (state, action) => {
        state.fetchStatus = 'succeeded';
        state.parties = action.payload;
      })
      .addCase(fetchParties.rejected, (state, action) => {
        state.fetchStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export default partySlice.reducer;

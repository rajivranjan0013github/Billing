import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading } from '../slices/loaderSlice';

const createLoadingAsyncThunk = (typePrefix, payloadCreator, options = {}) => {
  const { useGlobalLoader = true, ...thunkOptions } = options;

  return createAsyncThunk(
    typePrefix,
    async (arg, thunkAPI) => {
      if (useGlobalLoader) {
        thunkAPI.dispatch(setLoading(true));
      }
      try {
        return await payloadCreator(arg, thunkAPI);
      } finally {
        if (useGlobalLoader) {
          thunkAPI.dispatch(setLoading(false));
        }
      }
    },
    thunkOptions
  );
};

export default createLoadingAsyncThunk;
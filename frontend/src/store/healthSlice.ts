import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getHealth } from "../services/healthService.js";
import type { ApiError } from "../services/apiClient.js";
import type { HealthStatus } from "../types/health.js";

type LoadStatus = "idle" | "loading" | "succeeded" | "failed";

interface HealthState {
  data: HealthStatus | null;
  status: LoadStatus;
  error: string | null;
}

const initialState: HealthState = {
  data: null,
  status: "idle",
  error: null
};

export const fetchHealth = createAsyncThunk<HealthStatus, void, { rejectValue: string }>(
  "health/fetchHealth",
  async (_, { rejectWithValue }) => {
    try {
      return await getHealth();
    } catch (error) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message ?? "Unable to load API health");
    }
  }
);

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchHealth.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to load API health";
      });
  }
});

export const healthReducer = healthSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunk for fetching all tags
export const getAllTags = createAsyncThunk(
  "tags/getAllTags",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/tags", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch tags"
      );
    }
  }
);

// Async thunk for getting a single tag
export const getTagById = createAsyncThunk(
  "tags/getTagById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tags/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch tag"
      );
    }
  }
);

// Initial state
const initialState = {
  tags: [],
  currentTag: null,
  isLoading: false,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  },
  error: null,
};

// Tags slice
const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    clearCurrentTag: (state) => {
      state.currentTag = null;
    },
    resetTagsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // getAllTags reducers
      .addCase(getAllTags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tags = action.payload.tags;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllTags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // getTagById reducers
      .addCase(getTagById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTagById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTag = action.payload;
      })
      .addCase(getTagById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentTag, resetTagsState } = tagsSlice.actions;
export default tagsSlice.reducer;

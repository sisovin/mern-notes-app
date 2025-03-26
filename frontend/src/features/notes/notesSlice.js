import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Get all notes
// Add this debugging to your getNotes function
export const getNotes = createAsyncThunk(
  "notes/getNotes",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token available for notes fetch:", !!token);

      const response = await api.get("/notes");
      console.log("Notes API response:", response);

      // Check for correct response structure
      if (
        !response.data ||
        (!response.data.notes && !Array.isArray(response.data))
      ) {
        console.error("Invalid response format:", response.data);
        return rejectWithValue("Invalid response format from server");
      }

      // Handle both response formats (object with notes array or direct array)
      return response.data.notes || response.data;
    } catch (error) {
      console.error("Error fetching notes:", error);
      let errorMessage = "Failed to fetch notes";

      if (error.response) {
        // Server responded with an error
        const status = error.response.status;

        if (status === 401) {
          errorMessage = "Unauthorized: Please log in again";
        } else if (status === 404) {
          errorMessage = "API endpoint not found. Check server configuration.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error (${status})`;
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = "No response from server. Check your connection.";
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Check and fix the getNoteById action
export const getNoteById = createAsyncThunk(
  'notes/getNoteById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await api.get(`/notes/${id}`, config);
      return response.data;
    } catch (error) {
      console.error('Error fetching note by ID:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch note'
      );
    }
  }
);

// In your createNote and updateNote thunks
export const createNote = createAsyncThunk(
  "notes/createNote",
  async (noteData, { rejectWithValue, getState }) => {
    try {
      const response = await api.post("/notes", noteData);
      
      // Ensure consistent tag structure in response
      if (response.data && response.data.tags && Array.isArray(response.data.tags)) {
        // If tags are just IDs, convert them to objects with IDs and names
        // based on the available tags in the state
        const { tags: allTags } = getState().tags;
        if (allTags && allTags.length > 0) {
          response.data.tags = response.data.tags.map(tag => {
            if (typeof tag === 'string') {
              const fullTag = allTags.find(t => t._id === tag);
              return fullTag || { _id: tag, name: 'Unknown' };
            }
            return tag;
          });
        }
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create note"
      );
    }
  }
);

// Update note
// Enhanced updateNote thunk
export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async (noteData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const { id, ...updateData } = noteData;
      
      // Log the update data for debugging
      console.log(`Updating note ${id} with data:`, updateData);
      
      // If tags are provided, ensure they are properly formatted before sending
      if (updateData.tags && Array.isArray(updateData.tags)) {
        // Extract just the tag IDs if they are objects
        updateData.tags = updateData.tags.map(tag => 
          typeof tag === 'object' && tag._id ? tag._id : tag
        );
        
        console.log("Formatted tags for API request:", updateData.tags);
      }

      const response = await api.put(`/notes/${id}`, 
        {
          title: updateData.title,
          content: updateData.content,
          tags: updateData.tags,
          pinned: updateData.pinned, // Make sure this is explicitly included
          isPublic: updateData.isPublic, // Make sure this is explicitly included
        },
        config
      );
      
      console.log("Update note response:", response.data);

      // Process the response data
      try {
        // If response has tags, ensure they are in object format with names
        if (response.data && response.data.tags && Array.isArray(response.data.tags)) {
          const { tags: allTags } = getState().tags;
          
          if (allTags && allTags.length > 0) {
            // Map each tag to ensure it has both ID and name
            response.data.tags = response.data.tags.map(tag => {
              // If tag is just an ID (string)
              if (typeof tag === 'string') {
                // Find the full tag object from allTags
                const fullTag = allTags.find(t => t._id === tag);
                if (fullTag) {
                  return fullTag; // Return the complete tag object
                } else {
                  console.warn(`Tag ID ${tag} not found in available tags`);
                  return { _id: tag, name: `Tag ${tag.substring(0, 5)}...` };
                }
              }
              // If tag is already an object, return as is
              return tag;
            });
          } else {
            console.warn("No tags available in the state for lookup");
          }
        }
        
        // Clear cache entries for this note
        localStorage.removeItem(`note-${id}`);
        localStorage.removeItem("notes-list");
      } catch (cacheError) {
        console.error("Error processing response or clearing cache:", cacheError);
      }

      return response.data;
    } catch (error) {
      console.error("Error updating note:", error.response || error);
      
      // Extract the most helpful error message
      let errorMessage = "Failed to update note";
      if (error.response) {
        errorMessage = error.response.data?.message || 
                       error.response.data?.error || 
                       `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server when updating note";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete note
export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/notes/${id}`);

      // Invalidate caches
      localStorage.removeItem(`note-${id}`);
      Object.keys(localStorage)
        .filter((key) => key.startsWith("notes-list"))
        .forEach((key) => localStorage.removeItem(key));

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error || "Failed to delete note"
      );
    }
  }
);

// Pin/unpin note
export const togglePinNote = createAsyncThunk(
  "notes/togglePinNote",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notes/${id}/pin`);

      // Invalidate caches
      localStorage.removeItem(`note-${id}`);
      Object.keys(localStorage)
        .filter((key) => key.startsWith("notes-list"))
        .forEach((key) => localStorage.removeItem(key));

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.error || "Failed to toggle pin status"
      );
    }
  }
);

const initialState = {
  notes: [],
  currentNote: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  },
  isLoading: false,
  error: null,
  message: "",
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    resetNotesState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.message = "";
    },
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
  },
  // Then in your slice's extraReducers:
  extraReducers: (builder) => {
    builder
      .addCase(getNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("Notes fetch pending");
      })
      .addCase(getNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = action.payload;
        console.log("Notes fetch fulfilled:", action.payload);
        state.error = null;
      })
      .addCase(getNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Unknown error occurred";
        console.error("Notes fetch rejected:", action.payload);
      })

      // Get note by ID
      .addCase(getNoteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNoteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentNote = action.payload;
      })
      .addCase(getNoteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create note
      .addCase(createNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add the newly created note to the notes array
        if (Array.isArray(state.notes)) {
          state.notes.unshift(action.payload); // Add to beginning for newest first
        } else {
          state.notes = [action.payload]; // Initialize if notes is not an array
        }

        // Set as current note for immediate access
        state.currentNote = action.payload;

        state.message = "Note created successfully";
        state.error = null;
      })
      .addCase(createNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to create note";
        state.message = "";
      })

      // Update note
      .addCase(updateNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentNote = action.payload;

        // Update the note in the notes array if it exists there
        if (state.notes.length > 0) {
          const index = state.notes.findIndex(
            (note) => note._id === action.payload._id
          );
          if (index !== -1) {
            state.notes[index] = action.payload;
          }
        }

        state.message = "Note updated successfully";
      })
      .addCase(updateNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete note
      .addCase(deleteNote.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = state.notes.filter((note) => note._id !== action.payload);
        state.message = "Note deleted successfully";
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Pin/unpin note
      .addCase(togglePinNote.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update currentNote if it matches the pinned note
        if (state.currentNote && state.currentNote._id === action.payload._id) {
          state.currentNote = action.payload;
        }

        // Update the note in the notes array if it exists
        if (state.notes.length > 0) {
          const index = state.notes.findIndex(
            (note) => note._id === action.payload._id
          );
          if (index !== -1) {
            state.notes[index] = action.payload;
          }
        }

        state.message = `Note ${
          action.payload.pinned ? "pinned" : "unpinned"
        } successfully`;
        state.error = null;
      })
      .addCase(togglePinNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      });
  },
});

export const { resetNotesState, setCurrentPage, clearCurrentNote } =
  notesSlice.actions;
export default notesSlice.reducer;

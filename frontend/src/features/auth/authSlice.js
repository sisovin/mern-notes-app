import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Get user from localStorage
const USER = JSON.parse(localStorage.getItem("user"));
const TOKEN = localStorage.getItem("token");
const REFRESH_TOKEN = localStorage.getItem("refreshToken");

// Add this to your authSlice.js
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("No token found");
      }

      const response = await api.get("/auth/check-status");
      return {
        user: response.data.user,
        token,
        refreshToken: localStorage.getItem("refreshToken"),
      };
    } catch (error) {
      // Clean up storage on auth failure
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      return rejectWithValue(
        error?.response?.data?.error || "Authentication failed"
      );
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me", {
        _objectIdValidation: true, // Add this flag for special handling in interceptor
      });

      // If we got a modified response from the interceptor, handle it here
      if (
        response.status === 200 &&
        response.statusText === "OK (Modified by interceptor)"
      ) {
        console.log("Using interceptor-modified user data");
        // You can set a minimal user object to prevent UI errors
        return {
          user: {
            username: "User",
            role: { name: "user" },
            // Add any other minimal fields needed
          },
        };
      }

      return response.data;
    } catch (error) {
      if (error.canceled) {
        console.log("User data request was canceled");
        return rejectWithValue(null);
      }

      // Handle the specific "Invalid id format" error silently
      if (error.response?.data?.error === "Invalid id format") {
        console.warn("Invalid ID format in getCurrentUser - handling silently");
        // Return a minimal user object instead of null to prevent UI errors
        return {
          user: {
            username: "User",
            role: { name: "user" },
            // Add any other minimal fields needed
          },
        };
      }

      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to get user information"
      );
    }
  }
);

// Login user
// In your login action creator or reducer
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);

      // Store tokens
      localStorage.setItem("token", response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      // Improved error handling
      if (error.response?.data?.error?.includes("Invalid id format")) {
        // More user-friendly message for this specific error
        return rejectWithValue(
          "Server configuration issue. Please contact support."
        );
      }

      // General error handling
      const errorMessage =
        error.response?.data?.error || error.message || "Login failed";
      return rejectWithValue(errorMessage);
    }
  }
);

// In your logout action
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    // First trigger logout event to cancel pending requests
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    // Add a small delay to allow request cancellation to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Get the current refresh token
    const refreshToken = localStorage.getItem("refreshToken");

    // Try server-side logout but don't fail if it doesn't work
    try {
      console.log("Attempting server-side logout...");

      // Use a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await api.post("/auth/logout", refreshToken ? { refreshToken } : {}, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      clearTimeout(timeoutId);
      console.log("Server logout successful");
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        console.log("Logout request was canceled due to timeout");
      } else {
        console.log("Server logout failed, continuing with client logout");
        console.log("Logout API error:", error);
      }
    }

    // Always clear local storage regardless of server response
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenId"); // Also clear tokenId used for testing

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Clear tokens even on error
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenId");
    return { success: true };
  }
});

// Update the loginSuccess action to handle MongoDB document structure

export const loginSuccess = createAction('auth/loginSuccess', (userData) => {
  // Store token in localStorage
  if (userData.token) {
    localStorage.setItem('token', userData.token);
  }
  
  if (userData.refreshToken) {
    localStorage.setItem('refreshToken', userData.refreshToken);
  }
  
  // Extract username and other properties from token if possible
  let tokenData = null;
  if (userData.token) {
    try {
      const base64Url = userData.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      tokenData = JSON.parse(atob(base64));
      console.log("Token data extracted:", tokenData);
    } catch (e) {
      console.error("Failed to parse token:", e);
    }
  }
  
  // Handle the specific MongoDB structure with ObjectIds
  const enhancedUser = {
    ...userData.user,
    // Core fields - make sure to preserve all important user data
    id: userData.user?.id || userData.user?._id || 
        (userData.user?._id && userData.user?._id.$oid ? userData.user._id.$oid : null) ||
        tokenData?.id || tokenData?._id,
    
    // Critical user identification fields
    username: userData.user?.username || tokenData?.username || '',
    firstName: userData.user?.firstName || tokenData?.firstName || '',
    lastName: userData.user?.lastName || tokenData?.lastName || '',
    email: userData.user?.email || tokenData?.email || '',
    
    // Role handling
    role: userData.user?.role,
    
    // Admin status - multiple ways to check
    isAdmin: 
      userData.user?.isAdmin === true || 
      userData.user?.role === "admin" ||
      (userData.user?.role && typeof userData.user.role === "object" && 
       userData.user.role.name === "admin") ||
      tokenData?.isAdmin === true || 
      tokenData?.role === "admin",
       
    // Permissions array
    permissions: userData.user?.permissions || tokenData?.permissions || []
  };
  
  // Store complete user data for debugging
  localStorage.setItem('userData', JSON.stringify(enhancedUser));
  
  console.log("Enhanced user object created:", enhancedUser);
  
  return {
    payload: {
      token: userData.token,
      refreshToken: userData.refreshToken,
      user: enhancedUser
    }
  };
});

// Then, in your authSlice configuration, modify the reducers section:
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: USER || null,
    isAuthenticated: !!TOKEN,
    token: TOKEN || null,
    refreshToken: REFRESH_TOKEN || null,
    isLoading: false,
    error: null,
  },
  reducers: {
    resetAuthState: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    updateProfile: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
      // Update localStorage when profile is updated
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    // Remove the loginSuccess reducer definition from here since we're using createAction
    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");
      localStorage.removeItem("userData"); // Also clear the new userData storage
      localStorage.removeItem("user");

      // Reset state
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      console.log("Auth state reset in logout reducer");
    },
  },
  extraReducers: (builder) => {
    builder
      // Add a handler for the loginSuccess action
      .addCase(loginSuccess, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isLoading = false;
        state.error = null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("Auth State: Login Pending", state); // Log the state before login
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        // Inside your login.fulfilled reducer:
        state.isAuthenticated = true;
        state.user = action.payload.user;
        // Add isAdmin flag from token if it's not already in the user object
        if (action.payload.token) {
          try {
            const base64Url = action.payload.token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const decodedToken = JSON.parse(atob(base64));

            // If token has isAdmin but user object doesn't, add it to the user object
            if (
              decodedToken.isAdmin &&
              state.user &&
              state.user.isAdmin === undefined
            ) {
              state.user.isAdmin = decodedToken.isAdmin;
            }
          } catch (error) {
            console.error("Error decoding token:", error);
          }
        }
        state.hasToken = true;
        state.loading = false;
        state.error = null;
        // Store tokens in localStorage
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        console.log("Auth State: Login Fulfilled", {
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          hasToken: !!state.token,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Then add these cases to your extraReducers
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
      });
  },
});

// Add this line at the end of your file (if not already exported)
export const { resetAuthState, logout, updateProfile } =
  authSlice.actions;
export default authSlice.reducer;

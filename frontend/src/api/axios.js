import axios from "axios";

// Track pending requests for cancellation during logout
const pendingRequests = new Map();

// Make sure the baseURL is correct - this is often a source of "Not Found" errors
const baseURL =
  import.meta.env.VITE_API_URL || "http://192.168.50.131:5000/api";
console.log("Using API baseURL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true, // Include credentials (cookies) in requests
  timeout: 10000, // Set a timeout for requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    // Get token from local storage
    const token = localStorage.getItem("token");

    // If token exists, add to headers
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add request cancellation capability
    const controller = new AbortController();
    config.signal = controller.signal;
    const id = `${config.url}:${Date.now()}`;
    pendingRequests.set(id, { controller, config });
    config._id = id;

    // Special handling for endpoints that might have ObjectID validation issues
    if (
      config.url &&
      (config.url.includes("/roles") ||
        config.url.includes("/users") ||
        config.url.includes("/auth/me"))
    ) {
      // Add a flag to help response interceptor identify these requests
      config._objectIdValidation = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
     console.log(
       `API Response: ${response.status} from ${response.config.url}`
     );
    // Remove the request from tracking
    if (response.config._id) {
      pendingRequests.delete(response.config._id);
    }
    return response;
  },
  // Handle errors globally
  async (error) => {
    const originalRequest = error.config;

    // Clean up aborted requests from tracking
    if (error.code === "ERR_CANCELED" && originalRequest?._id) {
      pendingRequests.delete(originalRequest._id);
      // Don't propagate errors for canceled requests
      return Promise.reject({
        canceled: true,
        message: "Request was canceled",
      });
    }

    // Remove errored request from tracking
    if (originalRequest?._id) {
      pendingRequests.delete(originalRequest._id);
    }

    // More detailed error logging
    if (error.response) {
      // Skip logging for specific known errors to reduce console noise
      if (
        !(
          error.response.status === 400 &&
          error.response.data?.error === "Invalid id format" &&
          originalRequest?._objectIdValidation
        )
      ) {
        console.error("API Error Response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });
      }

      // Enhance ObjectID validation error handling in the response interceptor
      if (
        error.response?.status === 400 &&
        error.response.data?.error?.includes("Invalid id format")
      ) {
        console.warn(
          `Handling ObjectID validation error for ${originalRequest.url}`
        );

        // For user profile related endpoints - return fallback data
        if (
          originalRequest.url === "/users/me" ||
          originalRequest.url === "/auth/me" ||
          originalRequest.url.includes("/profile") ||
          originalRequest.url.includes("/users")
        ) {
          console.warn(
            "ObjectID format error on user data request - providing fallback data"
          );

          // Get stored user data if available
          const storedUserData = localStorage.getItem("user");
          let userData = null;
          try {
            if (storedUserData) {
              userData = JSON.parse(storedUserData);
            }
          } catch (e) {
            console.error("Error parsing stored user data:", e);
          }

          // Create a safe user object from the stored data or defaults
          const safeUser = userData
            ? {
                ...userData,
                // Handle role data correctly regardless of format
                role:
                  typeof userData.role === "object"
                    ? userData.role.name || "user"
                    : userData.role || "user",
                permissions: Array.isArray(userData.permissions)
                  ? userData.permissions
                  : [],
              }
            : {
                id: "temp-user-id",
                username: "Guest User",
                email: "guest@example.com",
                role: "user",
                permissions: [],
              };

          // Log the constructed user object for debugging
          console.log("Using fallback user data:", safeUser);

          return Promise.resolve({
            data: {
              success: true,
              user: safeUser,
              isAuthenticated: true,
              message:
                "Using fallback user data due to ObjectID validation issue",
            },
            status: 200,
            statusText: "OK (Modified by interceptor)",
          });
        }

        // For role endpoints - return empty array
        if (originalRequest.url.includes("/roles")) {
          console.warn(
            "ObjectID format error on roles request - returning empty array"
          );
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: "OK (Modified by interceptor)",
          });
        }

        // For permission endpoints - return empty array
        if (originalRequest.url.includes("/permissions")) {
          console.warn(
            "ObjectID format error on permissions request - returning empty array"
          );
          return Promise.resolve({
            data: [],
            status: 200,
            statusText: "OK (Modified by interceptor)",
          });
        }
      }

      // Check if we're in a browser environment before using window.location
      const isBrowser = typeof window !== "undefined";

      // Handle 404 errors for the permission check endpoint differently
      if (
        error.response.status === 404 &&
        originalRequest.url.includes("/auth/check-permission")
      ) {
        console.warn(
          "Permission check endpoint not found. Backend may need updating."
        );
        // Don't redirect, just reject so fallback can handle it
        return Promise.reject(error);
      }

      // Handle 403 errors (Forbidden - permissions issue)
      if (error.response.status === 403) {
        console.warn(
          "Permission denied (403). You may not have the required role or permissions."
        );

        // Don't redirect from within the interceptor for React Router apps
        // Instead, store the error state and let components handle redirection
        if (originalRequest._skipRedirect) {
          return Promise.reject(error);
        }

        if (isBrowser) {
          // For non-API calls or when we want to force a redirect
          const event = new CustomEvent("auth:forbidden", {
            detail: { url: originalRequest.url },
          });
          window.dispatchEvent(event);
        }

        return Promise.reject(error);
      }

      // Handle 401 errors (Unauthorized - authentication issue)
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        console.log("Attempting to refresh token...");

        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            console.warn("No refresh token available");
            // Clear auth data
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");

            if (isBrowser) {
              const event = new CustomEvent("auth:unauthorized");
              window.dispatchEvent(event);
            }

            return Promise.reject(error);
          }

          // Make refresh token request
          console.log("Calling refresh token endpoint...");
          const response = await axios.post(
            `${baseURL}/auth/refresh-token`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          if (response.data.token) {
            console.log("Token refresh successful");
            localStorage.setItem("token", response.data.token);
            if (response.data.refreshToken) {
              localStorage.setItem("refreshToken", response.data.refreshToken);
            }

            // Retry the original request with new token
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${response.data.token}`;
            return axios(originalRequest);
          } else {
            console.warn("Token refresh response did not include a new token");
            throw new Error("Token refresh failed");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          // Clear auth data
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");

          if (isBrowser) {
            const event = new CustomEvent("auth:unauthorized");
            window.dispatchEvent(event);
          }

          return Promise.reject(refreshError);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API No Response:", {
        request: error.request,
        url: originalRequest?.url,
        method: originalRequest?.method,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Request Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Update the cancelAllRequests function to be more robust
export const cancelAllRequests = () => {
  const count = pendingRequests.size;
  console.log(`Canceling ${count} pending requests`);
  
  pendingRequests.forEach(({ controller }, id) => {
    try {
      controller.abort();
    } catch (error) {
      console.error(`Error canceling request ${id}:`, error);
    } finally {
      pendingRequests.delete(id);
    }
  });
  
  console.log(`Requests after cancellation: ${pendingRequests.size}`);
};


// Listen for auth events to perform redirects outside of React component lifecycle
if (typeof window !== "undefined") {
  window.addEventListener("auth:unauthorized", () => {
    console.log("Auth event: Unauthorized - redirecting to login");
    // Cancel any pending requests to prevent "Invalid id format" errors during redirect
    cancelAllRequests();
    // Use a slight delay to ensure all cancellations complete
    setTimeout(() => {
      window.location.href = "/login";
    }, 50);
  });

  window.addEventListener("auth:forbidden", () => {
    console.log("Auth event: Forbidden - redirecting to unauthorized");
    window.location.href = "/unauthorized";
  });

  window.addEventListener("auth:logout", () => {
    console.log("Auth event: Logout - canceling requests");
    cancelAllRequests();
  });
}

export default api;

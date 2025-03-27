import React, { useState, useEffect, createContext } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { loginSuccess, logout } from "../features/auth/authSlice";

// Create the context directly instead of importing
const AuthContext = createContext();
// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const dispatch = useDispatch();

  // Check auth status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          // Set the token in your API headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          const storedUser = JSON.parse(localStorage.getItem("user"));

          if (storedUser) {
            console.log(
              "Loaded user from localStorage:",
              storedUser.id || storedUser._id
            );
            setUser(storedUser);
            setIsLoading(false);
          } else {
            // If we have a token but no user data, fetch the profile
            try {
              const response = await api.get("/users/profile");
              console.log("Fetched user profile from API:", response.data);
              setUser(response.data);
              localStorage.setItem("user", JSON.stringify(response.data));
            } catch (err) {
              console.error("Failed to fetch user profile:", err);
              // Token might be invalid, clear it
              localStorage.removeItem("token");
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function - preserve your existing implementation with Redux dispatch
  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { token, refreshToken, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Store user data
      localStorage.setItem("user", JSON.stringify(user));

      // Set authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update local state
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);

      // Update Redux state
      dispatch(
        loginSuccess({
          user,
          token,
          refreshToken,
        })
      );

      return user;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || "Login failed";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function - preserve your existing implementation with Redux dispatch
  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { token, refreshToken, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem("token", token);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Store user data
      localStorage.setItem("user", JSON.stringify(user));

      // Set authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update local state
      setUser(user);
      setIsAuthenticated(true);
      setAuthError(null);

      // Update Redux state
      dispatch(
        loginSuccess({
          user,
          token,
          refreshToken,
        })
      );

      return user;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.error || "Registration failed";
      setAuthError(errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function - updated to work with Redux
  const logoutUser = async () => {
    try {
      // Try to call backend logout
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Remove tokens from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Remove authorization header
      delete api.defaults.headers.common["Authorization"];

      // Update local state
      setUser(null);
      setIsAuthenticated(false);

      // Update Redux state
      dispatch(logout());
    }
  };

  // Update user in context after profile changes
  const updateUserInContext = (updatedUser) => {
    // Update local state
    setUser((prev) => {
      const newUserData = { ...prev, ...updatedUser };
      // Also update localStorage
      localStorage.setItem("user", JSON.stringify(newUserData));
      return newUserData;
    });
  };

  // Provide values for context consumers
  const value = {
    user,
    setUser: updateUserInContext,
    isAuthenticated,
    loading: isLoading,
    authError,
    login,
    register,
    logout: logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

// Update your AuthProvider to better handle user initialization
import { useState, useEffect } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from localStorage on app load
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token found in localStorage");
          setIsLoading(false);
          return;
        }

        // Set token in axios defaults
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Parse user data from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
          console.log("User loaded from localStorage:", storedUser.id);
          setUser(storedUser);

          // Try to refresh user data from server
          try {
            const response = await api.get("/users/profile");
            console.log("Fresh user data loaded from API:", response.data);

            // Update stored user
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
          } catch (err) {
            console.log("Could not refresh user profile, using cached data, error:", err);
            // Continue with stored user, don't clear on error
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { token, user } = response.data;

      // Store token and user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set token in axios defaults
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

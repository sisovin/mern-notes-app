import React, { useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContextValue";
import { resetThemeStyles } from "../utils/themeUtils"; 
import api from "../api/axios";

export const ThemeProvider = ({ children }) => {
  // Theme state (light, dark, system)
  const [theme, setTheme] = useState(() => {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "system";
  });

  // Current actual theme applied (light or dark)
  const [currentTheme, setCurrentTheme] = useState("light");

  // Load user settings from API on initial load (if authenticated)
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Only try to fetch if there's a token
    if (token) {
      const fetchUserSettings = async () => {
        try {
          const response = await api.get("/users/settings");
          if (
            response.data &&
            response.data.appearance &&
            response.data.appearance.theme
          ) {
            // Update theme from server settings
            const serverTheme = response.data.appearance.theme;
            setTheme(serverTheme);
            localStorage.setItem("theme", serverTheme);
          }
        } catch (error) {
          console.error("Could not fetch user theme settings:", error);
          // Fall back to localStorage or default
        }
      };

      fetchUserSettings();
    }
  }, []);

  // Effect to handle system preference changes and apply theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // In the applyTheme function
    const applyTheme = () => {
      // Determine which theme to apply
      let themeToApply;
      if (theme === "system") {
        themeToApply = mediaQuery.matches ? "dark" : "light";
      } else {
        themeToApply = theme;
      }

      // Set current theme for context consumers
      setCurrentTheme(themeToApply);

      console.log(`Applying theme: ${themeToApply}`);

      // Apply to document element for CSS variables
      document.documentElement.setAttribute("data-theme", themeToApply);

      // Apply class for Tailwind - this should be on documentElement, not body
      if (themeToApply === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Also call the utility function
      resetThemeStyles(themeToApply);
    };

    // Apply theme immediately
    applyTheme();

    // Listen for system theme changes
    const handleChange = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    // Modern event listener
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  // Handle theme change
  const changeTheme = (newTheme) => {
    console.log("Changing theme to:", newTheme);
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Add this method in your ThemeProvider component
  const forceTheme = (themeToForce) => {
    console.log("Forcing theme:", themeToForce);

    if (themeToForce === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }

    setCurrentTheme(themeToForce);
    // We don't update the theme preference here - this is just for debugging
  };

  /// Add it to your context value
  const value = {
    theme,
    currentTheme,
    changeTheme,
    forceTheme, // Add this
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

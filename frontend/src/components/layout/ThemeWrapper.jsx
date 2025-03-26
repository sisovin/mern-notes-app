import React from "react";
import { useTheme } from "../../context/ThemeContextValue";

const ThemeWrapper = ({ children }) => {
  const { currentTheme } = useTheme();

  return (
    <div
      className={`theme-wrapper min-h-screen ${
        currentTheme === "dark" ? "theme-dark" : "theme-light"
      }`}
      style={{
        backgroundColor: "var(--background-color)",
        color: "var(--text-color)",
      }}
    >
      {children}
    </div>
  );
};

export default ThemeWrapper;

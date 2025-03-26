import React from "react";
import { useTheme } from "../../context/ThemeContextValue";

const ThemeDebug = () => {
  const { theme, currentTheme } = useTheme();

  // Get current CSS variables for debugging
  const computedStyle = getComputedStyle(document.documentElement);
  const backgroundColor = computedStyle
    .getPropertyValue("--background-color")
    .trim();
  const textColor = computedStyle.getPropertyValue("--text-color").trim();

  // Check if dark class is applied
  const hasDarkClass = document.documentElement.classList.contains("dark");

  // Get data-theme attribute
  const dataTheme = document.documentElement.getAttribute("data-theme");

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded shadow text-xs text-black dark:text-white border border-gray-300 dark:border-gray-600 z-50">
      <div>Theme setting: {theme}</div>
      <div>Applied theme: {currentTheme}</div>
      <div>Dark class: {hasDarkClass ? "Yes" : "No"}</div>
      <div>data-theme: {dataTheme}</div>
      <div>--background-color: {backgroundColor}</div>
      <div>--text-color: {textColor}</div>
    </div>
  );
};

export default ThemeDebug;

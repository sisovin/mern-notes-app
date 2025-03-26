import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

const ThemeToggle = () => {
  const { theme, changeTheme, currentTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") changeTheme("dark");
    else if (theme === "dark") changeTheme("system");
    else changeTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Current theme: ${theme} (${currentTheme})`}
    >
      {theme === "light" && <FiSun className="w-5 h-5" />}
      {theme === "dark" && <FiMoon className="w-5 h-5" />}
      {theme === "system" && <FiMonitor className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;

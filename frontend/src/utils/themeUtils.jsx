export const resetThemeStyles = (theme) => {
  const darkMode = theme === "dark";

  // Apply to document element
  document.documentElement.classList.toggle("dark", darkMode);
  document.documentElement.setAttribute("data-theme", theme);

  // Force update for Tailwind
  const mainElements = document.querySelectorAll(
    'main, .bg-white, [class*="bg-gray-"]'
  );
  mainElements.forEach((el) => {
    if (darkMode) {
      el.classList.add("force-dark-theme");
    } else {
      el.classList.remove("force-dark-theme");
    }
  });
};

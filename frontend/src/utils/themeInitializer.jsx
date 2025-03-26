// This is a script that runs before the app loads
export const initializeTheme = () => {
  const storedTheme = localStorage.getItem('theme') || 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let themeToApply;
  if (storedTheme === 'system') {
    themeToApply = prefersDark ? 'dark' : 'light';
  } else {
    themeToApply = storedTheme;
  }
  
  if (themeToApply === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = '#1e293b';
    document.body.style.color = '#f1f5f9';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#333333';
  }
};
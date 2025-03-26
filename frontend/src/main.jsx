// filepath: d:\MernProjects\mern-notes-app\frontend\src\main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import store from "./store";
import { AuthProvider } from "./context/AuthContext.jsx"; // Use the correct AuthProvider
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { initializeTheme } from "./utils/themeInitializer";
import "./index.css"; // Adjust the path to your CSS file

// Initialize theme before rendering
initializeTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);

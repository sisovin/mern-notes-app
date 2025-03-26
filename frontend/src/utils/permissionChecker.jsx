import api from "../api/axios";

// This function checks if the user has admin access
export const checkAdminAccess = async () => {
  try {
    // First try using the API endpoint with _skipRedirect flag to prevent automatic redirection
    const response = await api.get("/auth/check-permission?role=admin", {
      _skipRedirect: true,
    });

    console.log("Permission check API response:", response.data);
    return response.data.hasAccess === true;
  } catch (error) {
    console.error("Permission check failed:", error);

    // Enhanced fallback: Check from local storage and handle more formats
    try {
      // Check user object from localStorage
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        if (
          user.isAdmin === true ||
          user.role === "admin" ||
          (user.role &&
            typeof user.role === "object" &&
            user.role.name === "admin")
        ) {
          console.log("Admin access granted via localStorage user check");
          return true;
        }
      }

      // If the user object doesn't indicate admin, try token decoding
      const token = localStorage.getItem("token");
      if (!token) return false;

      // Decode the token to check if user is admin
      const payload = decodeToken(token);
      console.log("Decoded token payload:", payload);

      if (!payload) return false;

      // Check various admin indicators
      return (
        payload.isAdmin === true ||
        payload.role === "admin" ||
        (payload.role &&
          typeof payload.role === "object" &&
          payload.role.name === "admin") ||
        (payload.permissions && payload.permissions.includes("admin"))
      );
    } catch (fallbackError) {
      console.error("Fallback permission check failed:", fallbackError);
      return false;
    }
  }
};

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

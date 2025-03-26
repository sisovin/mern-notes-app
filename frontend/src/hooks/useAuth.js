import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error("Auth context is undefined - make sure you're using AuthProvider");
    return { user: null, isAuthenticated: false };
  }

  // Handle different possible structures
  let user = null;
  let isAuthenticated = false;

  // Debug context structure
  console.log("Raw auth context:", JSON.stringify({
    hasUser: !!context.user,
    isAuthenticated: context.isAuthenticated,
    contextKeys: Object.keys(context)
  }));

  if (context.user) {
    // If user property exists in context object
    if (typeof context.user === 'object') {
      // Handle nested structure: { user: { user: {...} } }
      if (context.user.user) {
        user = context.user.user;
      } else {
        // Regular structure: { user: {...} }
        user = context.user;
      }
    }
    isAuthenticated = true;
  } else if (context.isAuthenticated) {
    // If the context itself is the auth state object
    isAuthenticated = true;
  }

  // Log resulting user for debugging
  console.log("useAuth - normalized user:", user ? 
    `${user.username || 'unnamed'} (${user.id || user._id || 'no id'})` : 
    'null');

  // If we still don't have a user but we're supposed to be authenticated,
  // try to get user data from localStorage as fallback
  if (!user && isAuthenticated) {
    try {
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser && typeof storedUser === 'object') {
          console.log("useAuth - using localStorage fallback for user data");
          user = storedUser;
        }
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
  }

  return {
    ...context,
    user,
    isAuthenticated: !!user,
    setUser: context.setUser || (() => {
      console.warn("setUser function not available in context");
    })
  };
};

export default useAuth;
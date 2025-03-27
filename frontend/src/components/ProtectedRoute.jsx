import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { checkAdminAccess } from "../utils/permissionChecker";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      // Skip permission check if not authenticated
      if (!isAuthenticated || !user) {
        setPermissionChecked(true);
        setHasPermission(false);
        return;
      }

      try {
        // For admin role specifically
        if (requiredRole === "admin") {
          // Enhanced quick check to handle different formats of admin role
          // Add token-based check as a backup
          const token = localStorage.getItem("token");
          let tokenData = null;

          if (token) {
            try {
              const base64Url = token.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              tokenData = JSON.parse(atob(base64));
            } catch (e) {
              console.error("Failed to decode token:", e);
            }
          }

          const quickCheck =
            user.isAdmin === true ||
            user.role === "admin" ||
            (user.role &&
              typeof user.role === "object" &&
              user.role.name === "admin") ||
            (user.permissions && user.permissions.includes("admin")) ||
            // Add token data check
            (tokenData && tokenData.isAdmin === true);

          console.log(
            "Admin quick check result:",
            quickCheck,
            "User role:",
            user.role,
            "User permissions:",
            user.permissions,
            "Token data:",
            tokenData
          );

          if (quickCheck) {
            setHasPermission(true);
            setPermissionChecked(true);
            return;
          } else {
            // If quick check fails, do API check as fallback
            const hasAccess = await checkAdminAccess();
            console.log("API admin check result:", hasAccess);
            setHasPermission(hasAccess);
          }
        } else if (requiredRole) {
          // For other roles, check against user's role - handle both string and object formats
          const userRole =
            typeof user.role === "object" ? user.role.name : user.role;

          // Check for direct role match, admin role, or if user has the permission in their permissions array
          const hasRole =
            userRole === requiredRole ||
            user.isAdmin === true ||
            userRole === "admin" ||
            (user.permissions && user.permissions.includes(requiredRole));

          console.log(
            "Role check:",
            userRole,
            "Required:",
            requiredRole,
            "User permissions:",
            user.permissions,
            "Result:",
            hasRole
          );
          setHasPermission(hasRole);
        } else {
          // No role required, just need to be authenticated
          setHasPermission(true);
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasPermission(false);
      }

      setPermissionChecked(true);
    };

    checkAccess();
  }, [isAuthenticated, user, requiredRole]);

  // Show loading while checking auth/permissions
  if (loading || !permissionChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Authenticated but doesn't have permission
  if (!hasPermission) {
    console.log("Permission denied for role:", requiredRole, "User:", user);
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed, render the protected content
  return children;
};

export default ProtectedRoute;

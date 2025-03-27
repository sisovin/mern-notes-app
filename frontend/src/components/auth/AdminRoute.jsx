import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { loginSuccess } from "../../features/auth/authSlice";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAdminStatus = () => {
      // First check Redux state
      if (isAuthenticated && user) {
        const reduxStateCheck =
          user.isAdmin === true ||
          user.role === "admin" ||
          (user.role &&
            typeof user.role === "object" &&
            user.role.name === "admin");

        if (reduxStateCheck) {
          console.log("Admin route: Verified admin via Redux state");
          setIsAdmin(true);
          setCheckingAuth(false);
          return;
        }
      }

      // If not authenticated or not admin in Redux, check token
      const token = localStorage.getItem("token");
      const tokenData = localStorage.getItem("tokenData");

      if (token) {
        try {
          let decoded;
          if (tokenData) {
            decoded = JSON.parse(tokenData);
          } else {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            decoded = JSON.parse(atob(base64));
            localStorage.setItem("tokenData", JSON.stringify(decoded));
          }

          // Check for admin in token
          const tokenAdminCheck =
            decoded.isAdmin === true || decoded.role === "admin";

          if (tokenAdminCheck) {
            console.log("Admin route: Verified admin via token");

            // If we have a valid token but Redux state doesn't match, update it
            if (!isAuthenticated) {
              console.log("Admin route: Restoring session from token");
              dispatch(
                loginSuccess({
                  token,
                  refreshToken: localStorage.getItem("refreshToken"),
                  user: {
                    id: decoded.id,
                    email: decoded.email || "",
                    role: decoded.role,
                    isAdmin: decoded.isAdmin,
                    permissions: decoded.permissions || [],
                  },
                })
              );
            }

            setIsAdmin(true);
            setCheckingAuth(false);
            return;
          }
        } catch (e) {
          console.error("Admin route: Failed to decode token:", e);
        }
      }

      setIsAdmin(false);
      setCheckingAuth(false);
    };

    checkAdminStatus();
  }, [isAuthenticated, user, dispatch]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    toast.error("Please login to access admin area");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    toast.error("You do not have permission to access the admin area");
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AdminRoute;

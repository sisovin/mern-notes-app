import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { logout } from "../features/auth/authSlice";

const AuthEventListener = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Handle storage events (like token removal in another tab)
    const handleStorageChange = (event) => {
      if (event.key === "token" && !event.newValue && isAuthenticated) {
        console.log("Token was removed in another tab/window");

        // Check if this is an intentional logout
        const logoutIntentional = localStorage.getItem("logout_intentional");

        if (!logoutIntentional) {
          toast.error("Your session was terminated in another window");
          dispatch(logout());
          navigate("/login");
        }
      }
    };

    // Handle the auth:logout custom event
    const handleLogoutEvent = () => {
      console.log("Auth event: Logout intercepted by AuthEventListener");
      // Don't dispatch logout here - let the component that triggered the event handle it
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, [dispatch, navigate, isAuthenticated]);

  return null;
};

export default AuthEventListener;

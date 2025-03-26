import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AuthDebug from "../debug/AuthDebug";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Add protection to ensure the user is authenticated
  useEffect(() => {
    console.log("MainLayout auth check:", { isAuthenticated, user });
    if (isAuthenticated === false) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="flex h-screen bg-gray-50">
      <AuthDebug /> {/* Added AuthDebug component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* Add error boundary or loading state here if needed */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

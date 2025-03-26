import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleBasedWelcome = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1>Welcome, {user?.role === "admin" ? "Admin" : "User"}!</h1>
      {user?.role === "admin" && (
        <Link to="/admin-panel">Go to Admin Panel</Link>
      )}
      {user?.role === "user" && <Link to="/dashboard">Go to Dashboard</Link>}
    </div>
  );
};

export default RoleBasedWelcome;

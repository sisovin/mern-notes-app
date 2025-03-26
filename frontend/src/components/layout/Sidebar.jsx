import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFileText,
  FiPlus,
  FiTag,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import AuthContext from "../../context/AuthContext";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, loading } = useContext(AuthContext); // Also get loading state
  const [userIsAdmin, setUserIsAdmin] = useState(false); // Track admin status in state

  // Update admin status whenever user changes
  useEffect(() => {
    console.log("Full user object:", JSON.stringify(user, null, 2));

    // Check admin status only when user data exists
    if (user) {
      const isAdmin =
        user.role === "admin" ||
        user.isAdmin === true ||
        user.roles?.includes("admin") ||
        user.permissions?.includes("admin") ||
        user.userType === "admin";

      setUserIsAdmin(isAdmin);
      console.log("User is admin:", isAdmin);

      if (isAdmin) {
        console.log("User has admin privileges.");
      } else {
        console.log("User does not have admin privileges.");
      }
    }
  }, [user]); // Only depend on user, not userIsAdmin

  // Rest of your component remains the same
  const menuItems = [
    { path: "/", name: "Home", icon: <FiHome className="h-5 w-5" /> },
    {
      path: "/notes",
      name: "My Notes",
      icon: <FiFileText className="h-5 w-5" />,
    },
    { path: "/create", name: "New Note", icon: <FiPlus className="h-5 w-5" /> },
    { path: "/tags", name: "Tags", icon: <FiTag className="h-5 w-5" /> },
    {
      path: "/settings",
      name: "Settings",
      icon: <FiSettings className="h-5 w-5" />,
    },
    {
      path: "/admin",
      name: "Admin Panel",
      icon: <FiShield className="h-5 w-5" />,
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Show a loading state if the auth context is still loading
  if (loading) {
    return <div className="sidebar-loading">Loading...</div>;
  }

  return (
    <div className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-header">
        <h2 className={collapsed ? "d-none" : ""}>Notes App</h2>
        <button onClick={toggleSidebar} className="toggle-btn">
          {collapsed ? "→" : "←"}
        </button>
      </div>
      <div className="sidebar-menu">
        {menuItems
          .filter((item) => item.path !== "/admin" || userIsAdmin)
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <div className="sidebar-icon">{item.icon}</div>
              {!collapsed && <span className="sidebar-text">{item.name}</span>}
            </Link>
          ))}
      </div>
    </div>
  );
};

export default Sidebar;

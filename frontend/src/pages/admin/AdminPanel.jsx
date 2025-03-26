import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useSystemStatus } from "../../hooks/useSystemStatus";
import {
  FiUsers,
  FiShield,
  FiFileText,
  FiInfo,
  FiAlertTriangle,
  FiTag, // Import the missing icon
  FiUserX, // Add this import
  FiRefreshCw, // Add this import
} from "react-icons/fi";
import api from "../../api/axios";
import ApiTester from '../../components/debug/ApiTester';
import AdminChecker from "../../components/debug/AdminChecker";
import { getUserDisplayName } from "../../utils/userUtils";
import DebugPanel from "../../components/debug/DebugPanel"; // Import DebugPanel if needed

const AdminPanel = () => {
  // Add at the top of your component
  useEffect(() => {
    // Force check for local storage admin status
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const tokenData = JSON.parse(atob(base64));
        console.log("Token data in AdminPanel:", tokenData);

        // If token has isAdmin=true but user object doesn't, we can use this info directly
        if (tokenData.isAdmin === true) {
          console.log("Admin status from token: ✅ Yes");
        }
      } catch (e) {
        console.error("Failed to decode token in AdminPanel:", e);
      }
    }
  }, []);

  const { isAuthenticated, user } = useSelector((state) => state.auth); // Removed unused variable
  const [stats, setStats] = useState({
    userCount: 0,
    roleCount: 0,
    noteCount: 0,
    tagCount: 0,
    noteDetailCount: 0,
    activeUsers: 0,
    deletedUsers: 0,
    loading: true,
    error: null,
  });
  const { systemStatus, refreshStatus } = useSystemStatus();
  // Add this at the top of the component, after the useState
  useEffect(() => {
    console.log(
      "AdminPanel mounted, user:",
      user,
      "isAuthenticated:",
      isAuthenticated
    );
    // Check if the user has the correct permissions
    if (user) {
      console.log(
        "User role:",
        user.role,
        "isAdmin:",
        user.isAdmin,
        "permissions:",
        user.permissions
      );
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats((prevStats) => ({
          ...prevStats,
          ...response.data,
          loading: false,
        }));
      } catch (error) {
        console.error(
          "Failed to fetch admin stats:",
          error.response || error.message
        );
        setStats((prevStats) => ({
          ...prevStats,
          loading: false,
          error: "Failed to fetch admin stats.",
        }));
      }
    };

    fetchAdminStats();
  }, []);

  // Handle mock data for errors
  useEffect(() => {
    if (!stats.loading && stats.error) {
      setStats({
        userCount: "...",
        roleCount: "...",
        noteCount: "...",
        tagCount: "...",
        noteDetailCount: "...",
        activeUsers: "...",
        deletedUsers: "...",
        loading: false,
        error: null,
      });
    }
  }, [stats.loading, stats.error]);

  // Wait for Redux state to initialize
  if (isAuthenticated === undefined || user === undefined) {
    return <div>Loading...</div>; // Show a loading indicator
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-black">Admin Checker</h2>
        {/* Add this line to include the AdminChecker component */}
        <AdminChecker />{" "}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user ? getUserDisplayName(user) : "Administrator"}!
        </p>
      </div>
      {stats.error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{stats.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiUsers size={24} />
            </div>

            {/* User Count Card */}
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.userCount
                )}
              </p>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 inline-block"
          >
            Manage Users →
          </Link>
        </div>

        {/* Roles Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiShield size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Roles</h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.roleCount
                )}
              </p>
            </div>
          </div>
          <Link
            to="/admin/roles"
            className="mt-4 text-sm text-green-600 hover:text-green-800 inline-block"
          >
            Manage Roles →
          </Link>
        </div>

        {/* Notes Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiFileText size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Notes</h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.noteCount
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tags Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FiTag size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Tags</h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.tagCount
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-sm font-medium text-gray-500">Notes Details</h2>
          <p className="text-lg font-semibold text-gray-800">
            {/* Add details about notes here */}
            {stats.loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              stats.noteDetailCount
            )}
          </p>
        </div>

        {/* Active Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiUsers size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Active Users
              </h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.activeUsers
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Deleted/Inactive Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiUserX size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">
                Deleted/Inactive Users
              </h2>
              <p className="text-lg font-semibold text-gray-800">
                {stats.loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stats.deletedUsers
                )}
              </p>
            </div>
          </div>
        </div>

        {/* System Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <FiInfo size={24} />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Status</h2>
                <p
                  className={`text-lg font-semibold ${
                    systemStatus.isLoading
                      ? "text-gray-400"
                      : systemStatus.isRunning
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {systemStatus.isLoading ? (
                    <span className="animate-pulse">
                      Checking system status...
                    </span>
                  ) : (
                    systemStatus.message
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={refreshStatus}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Refresh status"
            >
              <FiRefreshCw
                className={`h-5 w-5 text-gray-500 ${
                  systemStatus.isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          {!systemStatus.isLoading && (
            <div className="mt-3 border-t pt-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div
                  className={`flex items-center ${
                    systemStatus.services.api
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      systemStatus.services.api ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span>API</span>
                </div>
                <div
                  className={`flex items-center ${
                    systemStatus.services.database
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      systemStatus.services.database
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span>Database</span>
                </div>
                <div
                  className={`flex items-center ${
                    systemStatus.services.redis
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full mr-2 ${
                      systemStatus.services.redis
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span>Redis</span>
                </div>
              </div>
              {systemStatus.lastChecked && (
                <div className="text-xs text-gray-500 mt-2">
                  Last checked:{" "}
                  {new Date(systemStatus.lastChecked).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <ul className="space-y-3">
            <li>
              <Link
                to="/admin/users"
                className="flex items-center p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
              >
                <FiUsers className="mr-3" />
                <span>Manage Users</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin/roles"
                className="flex items-center p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
              >
                <FiShield className="mr-3" />
                <span>Manage Roles & Permissions</span>
              </Link>
            </li>
            <li>
              <Link
                to="/notes"
                className="flex items-center p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors"
              >
                <FiFileText className="mr-3" />
                <span>View All Notes</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* User Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            User Statistics
          </h2>

          {stats.loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Active Users
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {stats.activeUsers}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${
                        stats.userCount
                          ? (stats.activeUsers / stats.userCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Deleted/Inactive Users
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {stats.deletedUsers}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-red-500 rounded-full"
                    style={{
                      width: `${
                        stats.userCount
                          ? (stats.deletedUsers / stats.userCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/*  // Add this inside your AdminPanel component's JSX */}
      <div className="mt-2">
        <h2 className="text-xl font-semibold mb-4 text-black">API Testing</h2>
        <ApiTester />
      </div>
      {/*  // Add this inside your AdminPanel component's JSX */}
      <div className="mt-2">
        <h2 className="text-xl font-semibold mb-4 text-black">Debug Panel</h2>
        <DebugPanel />
      </div>
    </div>
  );
};

export default AdminPanel;

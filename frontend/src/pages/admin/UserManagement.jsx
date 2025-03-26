import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUserX,
  FiUserCheck,
} from "react-icons/fi";
import api from "../../api/axios";


const UserManagement = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  // Modals and forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    role: "",
    isAdmin: false,
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Fetch users with pagination and filters
  // Update the fetchUsers function with better error handling

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        role: filterRole || undefined,
        includeDeleted: showDeleted,
      };

      // Log the request for debugging
      console.log("Fetching users with params:", params);

      const response = await api.get("/users", { params });
      console.log("Users response:", response.data);

      // Check if the response contains the expected data structure
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
        setPagination(
          response.data.pagination || {
            page: 1,
            limit: 10,
            total: response.data.users.length,
            pages: Math.ceil(response.data.users.length / 10),
          }
        );
      } else {
        console.error("Invalid response format:", response.data);
        toast.error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      // Show specific error messages based on the response
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Authentication required. Please log in again.");
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to view users");
        } else if (
          error.response.status === 400 &&
          error.response.data?.error === "Invalid user ID format"
        ) {
          toast.error("Invalid user ID format in request");
          console.error("Request that caused the error:", error.config);
        } else {
          toast.error(error.response.data?.error || "Failed to load users");
        }
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Error setting up request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, filterRole, showDeleted]);

  // Fetch roles for dropdowns
  // Update the fetchRoles function with better structure initialization and error handling
  const fetchRoles = async () => {
    try {
      console.log("Fetching roles...");
      const response = await api.get("/roles");
      console.log("Roles fetched successfully:", response.data);

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setRoles(response.data);
      } else if (response.data && Array.isArray(response.data.roles)) {
        // If the API returns an object with a roles array
        setRoles(response.data.roles);
      } else {
        console.error("Invalid roles data format:", response.data);
        // Set fallback roles
        setRoles([
          { _id: "default-user", name: "User" },
          { _id: "default-admin", name: "Admin" },
          { _id: "default-editor", name: "Editor" },
        ]);
        toast.error("Error parsing roles data. Using default roles instead.");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);

      // Check if it's a 500 error
      if (error.response?.status === 500) {
        console.error("Server error details:", error.response.data);
        toast.error("Server error loading roles. Using default roles instead.");
      } else {
        toast.error("Failed to load roles. Using default roles.");
      }

      // Always provide fallback roles so the UI doesn't break
      setRoles([
        { _id: "default-user", name: "User" },
        { _id: "default-admin", name: "Admin" },
        { _id: "default-editor", name: "Editor" },
      ]);
    }
  };

  // Debugging Information
  useEffect(() => {
    console.log("UserManagement mounted", {
      isAuthenticated,
      user,
      userRole: user?.role,
      hasPermissions: user?.permissions,
    });
  }, [isAuthenticated, user]);

  // Initial data loading
  useEffect(() => {
    // Only load roles once when component mounts
    fetchRoles();
  }, []); // Empty dependency array means only run once on mount

  // Handle pagination changes
  useEffect(() => {
    // Only fetch users when pagination changes
    fetchUsers();
  }, [pagination.page, pagination.limit, fetchUsers]);

  // Apply search and filters - separate from pagination effect
  useEffect(() => {
    // Only run this effect when search or filters change
    if (
      searchQuery !== undefined ||
      filterRole !== undefined ||
      showDeleted !== undefined
    ) {
      // Reset to first page when filters change
      setPagination((prev) => ({ ...prev, page: 1 }));
      // Fetch users with new filters
      fetchUsers();
    }
  }, [searchQuery, filterRole, showDeleted, fetchUsers]);

  // Form handling
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form data
  const validateForm = (isEditMode = false) => {
    const errors = {};

    if (!formData.username) errors.username = "Username is required";
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!isEditMode) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.role) errors.role = "Role is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResetPasswordForm = () => {
    const errors = {};

    if (!resetPasswordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (resetPasswordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await api.post("/users", formData);
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.error || "Failed to create user");

      // Set specific form errors if they exist in the response
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };
  // Add this utility function to your component:

  const handleApiError = (error, defaultMessage) => {
    console.error(defaultMessage, error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (
        error.response.status === 400 &&
        error.response.data?.error === "Invalid user ID format"
      ) {
        toast.error(
          "Invalid user ID format. Please reload the page and try again."
        );
      } else if (error.response.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(defaultMessage);
      }

      // Set specific form errors if they exist in the response
      if (error.response.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error("No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error(defaultMessage);
    }
  };

  // Then update your handler functions to use this:

  // Example for handleEditUser:
  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateForm(true)) return;

    try {
      await api.put(`/users/${selectedUser._id}`, {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        role: formData.role,
        isAdmin: formData.isAdmin,
      });

      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error, "Failed to update user");
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      if (!selectedUser || !selectedUser._id) {
        toast.error("No user selected or invalid user ID");
        return;
      }

      // Use a PUT request for soft delete
      await api.put(`/users/${selectedUser._id}/delete`);
      toast.success("User deleted successfully");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error, "Failed to delete user");
    }
  };

  // Handle restore user
  const handleRestoreUser = async () => {
    try {
      if (!selectedUser || !selectedUser._id) {
        toast.error("No user selected or invalid user ID");
        return;
      }

      await api.patch(`/users/${selectedUser._id}/restore`);
      toast.success("User restored successfully");
      setIsRestoreModalOpen(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error, "Failed to restore user");
    }
  };

  // Update the handleResetPassword function to use handleApiError
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validateResetPasswordForm()) return;

    try {
      await api.patch(`/users/${selectedUser._id}/reset-password`, {
        newPassword: resetPasswordForm.newPassword,
      });

      toast.success("Password reset successfully");
      setIsResetPasswordModalOpen(false);
      setResetPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      handleApiError(error, "Failed to reset password");
    }
  };
  // Reset form
  const resetForm = () => {
    setFormData({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      role: "",
      isAdmin: false,
    });
    setFormErrors({});
  };

  // Open edit modal with user data
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      role: user.role._id,
      isAdmin: user.isAdmin,
      password: "", // Not needed for edit
      confirmPassword: "", // Not needed for edit
    });
    setIsEditModalOpen(true);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email"
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
                <FiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              <button
                type="submit"
                className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full border rounded-md py-2 px-3"
              >
                <option value="">All Roles</option>
                {Array.isArray(roles) && roles.length > 0 ? (
                  roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Loading roles...
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">
                  Include deleted users
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className={user.isDeleted ? "bg-gray-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isDeleted ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Deleted
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Reset Password"
                          >
                            <span className="sr-only">Reset Password</span>
                            <FiRefreshCw size={18} />
                          </button>

                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <span className="sr-only">Edit</span>
                            <FiEdit2 size={18} />
                          </button>

                          {user.isDeleted ? (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsRestoreModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Restore User"
                            >
                              <span className="sr-only">Restore</span>
                              <FiUserCheck size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <span className="sr-only">Delete</span>
                              <FiUserX size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.pages, pagination.page + 1)
                  )
                }
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.page === pagination.pages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  users
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">First</span>
                    <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                    <FiChevronLeft
                      className="h-5 w-5 -ml-2"
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show current page, first and last pages, and 1 page before and after current
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= pagination.page - 1 &&
                        pageNum <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && pagination.page > 3) ||
                      (pageNum === pagination.pages - 1 &&
                        pagination.page < pagination.pages - 2)
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="sr-only">Last</span>
                    <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                    <FiChevronRight
                      className="h-5 w-5 -ml-2"
                      aria-hidden="true"
                    />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create New User
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="username"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Username*
                            </label>
                            <input
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.username
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.username && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.username}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email*
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.email
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.email && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.email}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name*
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.firstName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.firstName && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name*
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.lastName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.lastName && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.lastName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Password*
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.password
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.password && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.password}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Confirm Password*
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.confirmPassword
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="dateOfBirth"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Date of Birth*
                            </label>
                            <input
                              type="date"
                              id="dateOfBirth"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.dateOfBirth
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.dateOfBirth && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.dateOfBirth}
                              </p>
                            )}
                            <div>
                              <label
                                htmlFor="role"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Role*
                              </label>
                              <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                  formErrors.role
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                              >
                                <option value="">Select a role</option>
                                {Array.isArray(roles) && roles.length > 0 ? (
                                  roles.map((role) => (
                                    <option key={role._id} value={role._id}>
                                      {role.name}
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>
                                    Loading roles...
                                  </option>
                                )}
                              </select>
                              {formErrors.role && (
                                <p className="mt-1 text-sm text-red-600">
                                  {formErrors.role}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="isAdmin"
                                name="isAdmin"
                                checked={formData.isAdmin}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor="isAdmin"
                                className="ml-2 block text-sm text-gray-700"
                              >
                                User has admin privileges
                              </label>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-5 col-span-1 sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => setIsCreateModalOpen(false)}
                              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Create User
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text
                  sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit User
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleEditUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="username"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Username*
                            </label>
                            <input
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.username
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.username && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.username}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email*
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.email
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.email && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.email}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name*
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.firstName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.firstName && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name*
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.lastName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.lastName && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.lastName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="dateOfBirth"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Date of Birth*
                            </label>
                            <input
                              type="date"
                              id="dateOfBirth"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.dateOfBirth
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.dateOfBirth && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.dateOfBirth}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="role"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Role*
                            </label>
                            <select
                              id="role"
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.role
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select a role</option>
                              {roles.map((role) => (
                                <option key={role._id} value={role._id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                            {formErrors.role && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.role}
                              </p>
                            )}
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="isAdmin"
                                name="isAdmin"
                                checked={formData.isAdmin}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor="isAdmin"
                                className="ml-2 block text-sm text-gray-700"
                              >
                                User has admin privileges
                              </label>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-5 col-span-1 sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => setIsEditModalOpen(false)}
                              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Update User
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm
                  sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete User
                    </h3>
                    <div className="mt-4">
                      <p>
                        Are you sure you want to delete this user? This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-300 text-base font-medium text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text
                  sm:text-sm"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore User Modal */}
      {isRestoreModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Restore User
                    </h3>
                    <div className="mt-4">
                      <p>
                        Are you sure you want to restore this user? This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-300 text-base font-medium text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestoreUser}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text
                  sm:text-sm"
                >
                  Restore User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reset Password
                    </h3>
                    <div className="mt-4">
                      <form
                        onSubmit={handleResetPassword}
                        className="space-y-4"
                      >
                        <div>
                          <p className="mb-4">
                            Reset password for user:{" "}
                            <span className="font-medium">
                              {selectedUser.firstName} {selectedUser.lastName}
                            </span>
                          </p>
                          <div className="mb-4">
                            <label
                              htmlFor="newPassword"
                              className="block text-sm font-medium text-gray-700"
                            >
                              New Password*
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              name="newPassword"
                              value={resetPasswordForm.newPassword}
                              onChange={handleResetPasswordChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.newPassword
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.newPassword}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Confirm Password*
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={resetPasswordForm.confirmPassword}
                              onChange={handleResetPasswordChange}
                              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                formErrors.confirmPassword
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {formErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">
                                {formErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsResetPasswordModalOpen(false);
                              setResetPasswordForm({
                                newPassword: "",
                                confirmPassword: "",
                              });
                              setFormErrors({});
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Reset Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

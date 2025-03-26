import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast"; // Also changing from react-toastify to react-hot-toast
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api from "../../api/axios";

const RoleManagement = () => {
  // Rest of your component code remains the same
  // State variables
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [availablePermissions, setAvailablePermissions] = useState([]);

  // Updated fetchRoles function with better error handling and data normalization
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await api.get(`/roles?${params.toString()}`);

      // Ensure each role has a permissions array even if it's missing
      const normalizedRoles = (response.data.roles || []).map((role) => ({
        ...role,
        permissions: role.permissions || [], // Ensure permissions is always an array
      }));

      setRoles(normalizedRoles);
      setPagination({
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        total: response.data.total || 0,
        pages: response.data.pages || 1,
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error(error.response?.data?.error || "Failed to fetch roles");
      // Set empty roles array to prevent errors
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  // Fetch permissions with fallback data to prevent UI from breaking
  const fetchPermissions = async () => {
    try {
      const response = await api.get("/permissions");
      setAvailablePermissions(response.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);

      // Default permissions fallback data
      const fallbackPermissions = [
        { _id: "read", name: "Read" },
        { _id: "write", name: "Write" },
        { _id: "edit", name: "Edit" },
        { _id: "delete", name: "Delete" },
        { _id: "view_users", name: "View Users" },
        { _id: "manage_users", name: "Manage Users" },
        { _id: "view_roles", name: "View Roles" },
        { _id: "manage_roles", name: "Manage Roles" },
        { _id: "manage_permissions", name: "Manage Permissions" },
      ];

      // Set the fallback permissions in state
      setAvailablePermissions(fallbackPermissions);

      // Show appropriate error message based on error type
      if (error.response?.status === 404) {
        toast.error(
          "Permissions endpoint not found. Using default permissions."
        );
      } else if (error.response?.status === 500) {
        toast.error(
          "Server error when loading permissions. Using default permissions."
        );
      } else {
        toast.error(
          error.response?.data?.error ||
            "Failed to fetch permissions. Using defaults."
        );
      }
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Handle pagination changes
  useEffect(() => {
    fetchRoles();
  }, [pagination.page, pagination.limit, fetchRoles]);

  // Apply search
  useEffect(() => {
    if (searchQuery !== undefined) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchRoles();
    }
  }, [searchQuery, fetchRoles]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchRoles();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Role name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Role name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (formData.permissions.length === 0) {
      errors.permissions = "At least one permission must be selected";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setFormErrors({});
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "permission") {
      // Handle checkbox for permissions
      const permissionId = value;
      setFormData((prevData) => {
        if (checked) {
          return {
            ...prevData,
            permissions: [...prevData.permissions, permissionId],
          };
        } else {
          return {
            ...prevData,
            permissions: prevData.permissions.filter((p) => p !== permissionId),
          };
        }
      });
    } else {
      // Handle other inputs
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
  };

  // Also fix the openEditModal function to handle possibly undefined permissions
  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: Array.isArray(role.permissions)
        ? role.permissions.map((p) => p._id)
        : [],
    });
    setIsEditModalOpen(true);
  };

  // Create role
  const handleCreateRole = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await api.post("/roles", formData);
      toast.success("Role created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(error.response?.data?.error || "Failed to create role");
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  // Edit role
  const handleEditRole = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await api.put(`/roles/${selectedRole._id}`, formData);
      toast.success("Role updated successfully");
      setIsEditModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error.response?.data?.error || "Failed to update role");
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    }
  };

  // Delete role
  const handleDeleteRole = async () => {
    try {
      await api.delete(`/roles/${selectedRole._id}`);
      toast.success("Role deleted successfully");
      setIsDeleteModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error(error.response?.data?.error || "Failed to delete role");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Add New Role
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-3">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roles by name"
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
        </div>
      </div>

      {/* Roles Table */}
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
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No roles found
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {role.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-md">
                        {role.description}
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(role.permissions) &&
                          role.permissions.length > 0 ? (
                            role.permissions.map((permission) => (
                              <span
                                key={permission._id || Math.random().toString()}
                                className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {permission.name || "Unknown permission"}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              No permissions
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Role"
                          >
                            <span className="sr-only">Edit</span>
                            <FiEdit2 size={18} />
                          </button>
                          {!role.isSystemRole && (
                            <button
                              onClick={() => {
                                setSelectedRole(role);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Role"
                            >
                              <span className="sr-only">Delete</span>
                              <FiTrash2 size={18} />
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
                  roles
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

                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        pagination.page === i + 1
                          ? "bg-blue-50 border-blue-500 text-blue-600 z-10"
                          : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                      } text-sm font-medium`}
                    >
                      {i + 1}
                    </button>
                  ))}

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

      {/* Create Role Modal */}
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
                      Create New Role
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleCreateRole} className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Role Name*
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.name
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description*
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.description
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {formErrors.description && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.description}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Permissions*
                          </label>
                          <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {availablePermissions.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                Loading permissions...
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {availablePermissions.map((permission) => (
                                  <div
                                    key={permission._id}
                                    className="flex items-center"
                                  >
                                    <input
                                      type="checkbox"
                                      id={`permission-${permission._id}`}
                                      name="permission"
                                      value={permission._id}
                                      checked={formData.permissions.includes(
                                        permission._id
                                      )}
                                      onChange={handleInputChange}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                      htmlFor={`permission-${permission._id}`}
                                      className="ml-2 block text-sm text-gray-700"
                                    >
                                      {permission.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {formErrors.permissions && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.permissions}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-5">
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
                            Create Role
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

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
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
                      Edit Role
                    </h3>
                    <div className="mt-4">
                      <form onSubmit={handleEditRole} className="space-y-4">
                        <div>
                          <label
                            htmlFor="edit-name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Role Name*
                          </label>
                          <input
                            type="text"
                            id="edit-name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={selectedRole.isSystemRole}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.name
                                ? "border-red-500"
                                : selectedRole.isSystemRole
                                ? "bg-gray-100 border-gray-300"
                                : "border-gray-300"
                            }`}
                          />
                          {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.name}
                            </p>
                          )}
                          {selectedRole.isSystemRole && (
                            <p className="mt-1 text-sm text-gray-500">
                              System role names cannot be changed
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="edit-description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description*
                          </label>
                          <textarea
                            id="edit-description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              formErrors.description
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {formErrors.description && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.description}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Permissions*
                          </label>
                          <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                            {availablePermissions.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                Loading permissions...
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {availablePermissions.map((permission) => (
                                  <div
                                    key={permission._id}
                                    className="flex items-center"
                                  >
                                    <input
                                      type="checkbox"
                                      id={`edit-permission-${permission._id}`}
                                      name="permission"
                                      value={permission._id}
                                      checked={formData.permissions.includes(
                                        permission._id
                                      )}
                                      onChange={handleInputChange}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                      htmlFor={`edit-permission-${permission._id}`}
                                      className="ml-2 block text-sm text-gray-700"
                                    >
                                      {permission.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {formErrors.permissions && (
                            <p className="mt-1 text-sm text-red-600">
                              {formErrors.permissions}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-5">
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
                            Update Role
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

      {/* Delete Role Modal */}
      {isDeleteModalOpen && selectedRole && (
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Role
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the role "
                        {selectedRole.name}"? This action cannot be undone.
                      </p>
                      {selectedRole.permissions &&
                        selectedRole.permissions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              This role has {selectedRole.permissions.length}{" "}
                              permission
                              {selectedRole.permissions.length !== 1
                                ? "s"
                                : ""}{" "}
                              assigned to it.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

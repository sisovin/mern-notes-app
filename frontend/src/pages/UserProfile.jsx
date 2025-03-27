import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCalendar,
  FiSave,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import api from "../api/axios";
import { updateProfile } from "../features/auth/authSlice";

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    role: { name: "" },
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Validation states
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/users/me");

        // Format date of birth for the input
        const formattedUser = {
          ...response.data,
          dateOfBirth: response.data.dateOfBirth
            ? new Date(response.data.dateOfBirth).toISOString().split("T")[0]
            : "",
        };

        setUserProfile(formattedUser);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};

    if (!userProfile.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!userProfile.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!userProfile.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userProfile.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!userProfile.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateProfileForm()) {
      return;
    }

    try {
      const profileData = {
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        dateOfBirth: userProfile.dateOfBirth,
      };

      const response = await api.put(`/users/${user.id}`, profileData);

      // Update user in Redux state
      dispatch(updateProfile(response.data));

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);

      // Set specific form errors if they exist in the response
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  // Handle password change submission
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await api.patch(`/users/${user.id}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to change password";
      toast.error(errorMessage);

      // Handle specific error for incorrect current password
      if (error.response?.data?.error === "Current password is incorrect") {
        setPasswordErrors((prev) => ({
          ...prev,
          currentPassword: "Current password is incorrect",
        }));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "profile"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Information
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "password"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-blue-500"
          }`}
          onClick={() => setActiveTab("password")}
        >
          Change Password
        </button>
      </div>

      {/* Profile Information Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Profile Details
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <FiEdit2 className="mr-1" /> Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username (non-editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
                  <FiUser className="text-gray-500 mr-2" />
                  <span>{userProfile.username}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Usernames cannot be changed
                </p>
              </div>

              {/* Role (non-editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md">
                  <FiCheckCircle className="text-gray-500 mr-2" />
                  <span className="capitalize">{userProfile.role.name}</span>
                </div>
              </div>

              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={userProfile.firstName}
                  onChange={handleProfileChange}
                  readOnly={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isEditing
                      ? "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  } ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={userProfile.lastName}
                  onChange={handleProfileChange}
                  readOnly={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isEditing
                      ? "focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  } ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={userProfile.email}
                    onChange={handleProfileChange}
                    readOnly={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      isEditing
                        ? "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "bg-gray-100"
                    } ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-500" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={userProfile.dateOfBirth}
                    onChange={handleProfileChange}
                    readOnly={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                      isEditing
                        ? "focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "bg-gray-100"
                    } ${
                      errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <FiSave className="mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </form>

          {/* Additional Profile Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">User ID:</span>
                <span className="ml-2 text-gray-700">{userProfile._id}</span>
              </div>
              <div>
                <span className="text-gray-500">Account Created:</span>
                <span className="ml-2 text-gray-700">
                  {new Date(userProfile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-700">
                  {new Date(userProfile.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === "password" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Change Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 max-w-md">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.currentPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.newPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
            </div>
          </form>

          {/* Password Security Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="flex items-center text-blue-800 font-medium">
              <FiCheckCircle className="mr-2" /> Password Security Tips
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• Use a mix of letters, numbers, and special characters</li>
              <li>• Avoid using personal information in your password</li>
              <li>• Don't reuse passwords from other websites</li>
              <li>• Consider using a password manager for better security</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

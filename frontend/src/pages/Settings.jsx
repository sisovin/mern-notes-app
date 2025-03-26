import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FiUser, FiLock, FiMonitor, FiBell, FiSave } from "react-icons/fi";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth"; 
import { useTheme } from "../context/ThemeContextValue";
import ThemeDebug from "../components/debug/ThemeDebug"; 

const Settings = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { changeTheme } = useTheme(); // Only destructure what we use

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
  });

  // Security settings
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "light",
    fontSize: "medium",
    noteViewMode: "grid",
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    reminderNotifications: false,
    shareNotifications: true,
  });

  // Errors
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Modify the useEffect in Settings.jsx
  // Add error handling
  useEffect(() => {
    const handleError = (error) => {
      console.error("Settings component error:", error);
      setHasError(true);
      setIsLoading(false);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);
  // Replace your current useEffect with this
  // Replace your current useEffect with this
  useEffect(() => {
    let isMounted = true; // For cleanup and preventing state updates after unmount

    const loadUserSettings = async () => {
      // Don't set state if component unmounted
      if (!isMounted) return;

      try {
        setIsLoading(true);

        // Enhanced debug logging
        console.log("Attempting to load user settings, auth state:", {
          user,
          isAuthenticated: !!user,
          userType: typeof user,
          hasNestedUser: user && user.user ? true : false,
        });

        // API call with proper error handling
        let userData = null;

        try {
          console.log("Loading user profile from API directly");
          const response = await api.get("/users/profile");
          console.log("API profile response:", response.data);

          if (response.data && isMounted) {
            userData = response.data;

            // Update context if possible - we'll use a local reference to avoid dependency issues
            if (setUser) {
              // Update without creating a dependency on the updated value
              setUser((prevUser) => {
                console.log("Updating user context with API data");
                // Avoid updating if it's the same data (prevents loops)
                if (
                  prevUser &&
                  prevUser._id === userData._id &&
                  prevUser.updatedAt === userData.updatedAt
                ) {
                  console.log("User data unchanged, skipping context update");
                  return prevUser;
                }
                return userData;
              });
            }
          }
        } catch (apiError) {
          console.error("Error on initial API call:", apiError);
          // Continue with fallbacks
        }

        // If we got data from API, use it
        if (userData && isMounted) {
          setProfileForm({
            username: userData.username || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            bio: userData.bio || "",
          });

          // Load other settings if available
          if (userData.settings) {
            if (userData.settings.appearance) {
              setAppearanceSettings(userData.settings.appearance);

              // Sync with theme context if available
              if (userData.settings.appearance.theme) {
                changeTheme(userData.settings.appearance.theme);
              }
            }
            if (userData.settings.notifications) {
              setNotificationSettings(userData.settings.notifications);
            }
          }
        }
        // Try to use context data if available
        else if (user && isMounted) {
          console.log("Using user data from context");
          setProfileForm({
            username: user.username || "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            bio: user.bio || "",
          });
        }
        // Final fallback to localStorage
        else if (isMounted) {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log("Using user data from localStorage as last resort");

              setProfileForm({
                username: parsedUser.username || "",
                firstName: parsedUser.firstName || "",
                lastName: parsedUser.lastName || "",
                email: parsedUser.email || "",
                bio: parsedUser.bio || "",
              });
            } catch (e) {
              console.error("Failed to parse stored user data:", e);
              toast.error("Could not load your profile data");
            }
          } else {
            console.error("No user data available from any source");
            toast.error("Please log in again to access your settings");
          }
        }
      } catch (error) {
        console.error("Error in loadUserSettings:", error);
        toast.error("Failed to load settings");
      } finally {
        // Ensure loading state is turned off even if there's an error
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Execute only once when the component mounts
    loadUserSettings();

    // Cleanup function
    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array with eslint disable

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Modify handleAppearanceChange
  const handleAppearanceChange = (e) => {
    const { name, value } = e.target;
    setAppearanceSettings((prev) => ({ ...prev, [name]: value }));

    // Apply theme immediately when changed
    if (name === "theme") {
      changeTheme(value);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!profileForm.username.trim()) {
      errors.username = "Username is required";
    } else if (profileForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (profileForm.username.length > 20) {
      errors.username = "Username must be at most 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileForm.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!profileForm.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!profileForm.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!profileForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = "Email is invalid";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setIsSaving(true);
      const response = await api.put("/users/profile", {
        username: profileForm.username,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        bio: profileForm.bio,
      });
      setUser(response.data.user); // Update the user in context
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update profile";
      toast.error(errorMsg);

      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setIsSaving(true);

      // Try to get user ID from multiple sources
      const userId = user?.id || user?._id || profileForm.id || profileForm._id;

      // If we can't find the user ID, make a profile API call to get it
      let targetUserId = userId;

      if (!targetUserId) {
        try {
          const profileResponse = await api.get("/users/profile");
          targetUserId = profileResponse.data?.id || profileResponse.data?._id;
          console.log("Retrieved user ID from profile API:", targetUserId);
        } catch (profileError) {
          console.error(
            "Could not retrieve user ID from profile:",
            profileError
          );
          toast.error(
            "Could not determine your user ID. Please reload the page."
          );
          return;
        }
      }

      if (!targetUserId) {
        toast.error("Missing user ID. Please reload the page.");
        return;
      }

      // Use the API endpoint with the correct ID
      await api.put(`/users/${targetUserId}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password updated successfully");

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      let errorMsg = "Failed to update password";

      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);

      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // In your handleUpdateAppearance function:

  const handleUpdateAppearance = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Log current settings before sending
      console.log("Saving appearance settings:", appearanceSettings);

      const response = await api.put(
        "/users/settings/appearance",
        appearanceSettings
      );

      // Update user in context if needed
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }

      // Apply theme immediately
      console.log("Applying theme:", appearanceSettings.theme);
      changeTheme(appearanceSettings.theme); // Make sure this runs

      toast.success("Appearance settings updated successfully");
    } catch (error) {
      console.error("Error updating appearance:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update appearance settings";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // And your handleUpdateNotifications function:
  const handleUpdateNotifications = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const response = await api.put(
        "/users/settings/notifications",
        notificationSettings
      );

      // Update user in context if needed
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }

      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error updating notifications:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to update notification settings";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this inside your component, after state declarations
  useEffect(() => {
    // Force loading to end after 10 seconds, as a safety measure
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn("Force-ending loading state after timeout");
        setIsLoading(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (hasError) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="mb-4">An error occurred while loading your settings.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-black">Settings</h1>
     {/*  In your component's return: */}
      <>
        {/* Your other components */}
        {import.meta.env.MODE === "development" && <ThemeDebug />}
      </>
      {/*  Replace your existing debug section */}
      {import.meta.env.MODE === "development" && (
        <div className="bg-gray-100 p-4 mb-4 rounded">
          <details>
            <summary className="font-medium cursor-pointer text-black">
              Auth & API Debug Info
            </summary>
            <div className="mt-2 text-xs text-gray-700">
              <p>User value type: {typeof user}</p>
              <p>
                User is object:{" "}
                {user && typeof user === "object" ? "Yes" : "No"}
              </p>
              <p>Has nested user: {user && user.user ? "Yes" : "No"}</p>
              <p>Has firstName: {user && user.firstName ? "Yes" : "No"}</p>
              <p>Has lastName: {user && user.lastName ? "Yes" : "No"}</p>
              <p>Has ID: {user && (user.id || user._id) ? "Yes" : "No"}</p>
              <p>Auth state from context:</p>
              <pre className="overflow-auto max-h-40 bg-gray-800 text-green-400 p-2 rounded text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>

              <p className="mt-2">Profile Form Data:</p>
              <pre className="overflow-auto max-h-40 bg-gray-800 text-yellow-400 p-2 rounded text-xs">
                {JSON.stringify(profileForm, null, 2)}
              </pre>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => console.log("Current auth state:", user)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  Log auth state to console
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get("/users/profile");
                      console.log(
                        "Direct API profile response:",
                        response.data
                      );

                      // Populate form with fresh data
                      setProfileForm({
                        username: response.data.username || "",
                        firstName: response.data.firstName || "",
                        lastName: response.data.lastName || "",
                        email: response.data.email || "",
                        bio: response.data.bio || "",
                      });

                      // Update user context if possible
                      if (setUser) {
                        setUser(response.data);
                        toast.success("Updated user context with API data");
                      }
                    } catch (err) {
                      console.error("API test error:", err);
                      toast.error(
                        "API test failed: " +
                          (err.response?.data?.error || err.message)
                      );
                    }
                  }}
                  className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                >
                  Load & Apply API Profile Data
                </button>
                <button
                  onClick={() => {
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                      try {
                        const userData = JSON.parse(storedUser);
                        console.log("User data from localStorage:", userData);
                        toast.success("See console for localStorage data");
                      } catch (e) {
                        console.error("Invalid localStorage user data:", e);
                        toast.error("Invalid localStorage data");
                      }
                    } else {
                      console.log("No user data in localStorage");
                      toast.error("No user data in localStorage");
                    }
                  }}
                  className="bg-purple-500 text-white px-2 py-1 rounded text-xs"
                >
                  Check localStorage
                </button>
              </div>
            </div>
          </details>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-wrap border-b">
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900" // Changed from text-white
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser className="inline mr-2" />
            Profile
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "security"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900" // Changed from text-white
            }`}
            onClick={() => setActiveTab("security")}
          >
            <FiLock className="inline mr-2" />
            Security
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "appearance"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900" // Changed from text-white
            }`}
            onClick={() => setActiveTab("appearance")}
          >
            <FiMonitor className="inline mr-2" />
            Appearance
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === "notifications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900" // Changed from text-white
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            <FiBell className="inline mr-2" />
            Notifications
          </button>
        </div>

        <div className="p-6">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile}>
              <h2 className="text-xl font-semibold mb-4 text-black">
                Profile Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      profileErrors.username
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {profileErrors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.username}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      profileErrors.firstName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {profileErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      profileErrors.lastName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {profileErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      profileErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                  <p className="mt-1 text-sm text-gray-500">
                    Bio length: {profileForm.bio ? profileForm.bio.length : 0}
                    /500 characters
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSave
                      className={`mr-2 ${isSaving ? "animate-spin" : ""}`}
                    />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <form onSubmit={handleUpdatePassword}>
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      passwordErrors.currentPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      passwordErrors.newPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      passwordErrors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSave
                      className={`mr-2 ${isSaving ? "animate-spin" : ""}`}
                    />
                    {isSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <form onSubmit={handleUpdateAppearance}>
              <h2 className="text-xl font-semibold mb-4 text-black">
                Appearance Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={appearanceSettings.theme === "light"}
                        onChange={handleAppearanceChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Light</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={appearanceSettings.theme === "dark"}
                        onChange={handleAppearanceChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Dark</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        checked={appearanceSettings.theme === "system"}
                        onChange={handleAppearanceChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">System</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fontSize"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Font Size
                  </label>
                  <select
                    id="fontSize"
                    name="fontSize"
                    value={appearanceSettings.fontSize}
                    onChange={handleAppearanceChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note View
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="noteViewMode"
                        value="grid"
                        checked={appearanceSettings.noteViewMode === "grid"}
                        onChange={handleAppearanceChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Grid</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="noteViewMode"
                        value="list"
                        checked={appearanceSettings.noteViewMode === "list"}
                        onChange={handleAppearanceChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">List</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSave
                      className={`mr-2 ${isSaving ? "animate-spin" : ""}`}
                    />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <form onSubmit={handleUpdateNotifications}>
              <h2 className="text-xl font-semibold mb-4">
                Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="emailNotifications"
                      className="font-medium text-gray-700"
                    >
                      Email Notifications
                    </label>
                    <p className="text-gray-500">
                      Receive notifications via email about important updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="reminderNotifications"
                      name="reminderNotifications"
                      type="checkbox"
                      checked={notificationSettings.reminderNotifications}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="reminderNotifications"
                      className="font-medium text-gray-700"
                    >
                      Reminder Notifications
                    </label>
                    <p className="text-gray-500">
                      Get notified when your notes have reminders
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="shareNotifications"
                      name="shareNotifications"
                      type="checkbox"
                      checked={notificationSettings.shareNotifications}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="shareNotifications"
                      className="font-medium text-gray-700"
                    >
                      Share Notifications
                    </label>
                    <p className="text-gray-500">
                      Get notified when someone shares a note with you
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSave
                      className={`mr-2 ${isSaving ? "animate-spin" : ""}`}
                    />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

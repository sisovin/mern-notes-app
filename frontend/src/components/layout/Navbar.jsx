import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FiPlus, FiLogOut, FiUser } from "react-icons/fi"; // Feather icons from react-icons
import { logout } from "../../features/auth/authSlice";
import { getUserDisplayName } from "../../utils/userUtils";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Enhanced debugging for user data
  useEffect(() => {
    if (user) {
      // Check if user data is complete, if not try to restore from userData in localStorage
      if (!user.username && localStorage.getItem("userData")) {
        try {
          const storedUserData = JSON.parse(localStorage.getItem("userData"));
          console.log("Found stored userData:", storedUserData);

          // Create a merged user object with data from both sources
          const mergedUser = { ...user };

          // Only copy these fields if they don't exist in the current user object
          if (storedUserData.username && !user.username) {
            mergedUser.username = storedUserData.username;
            console.log(
              "Restored username from localStorage:",
              storedUserData.username
            );
          }

          if (storedUserData.firstName && !user.firstName) {
            mergedUser.firstName = storedUserData.firstName;
            mergedUser.lastName = storedUserData.lastName || "";
          }

          // Update the user data in Redux (optional, but helpful)
          if (
            mergedUser.username !== user.username ||
            mergedUser.firstName !== user.firstName
          ) {
            // If you have an updateProfile action, you could dispatch it here
            // dispatch(updateProfile(mergedUser));
            console.log(
              "User data was merged with localStorage data:",
              mergedUser
            );
          }
        } catch (e) {
          console.error("Failed to parse stored userData:", e);
        }
      }

      console.log("Navbar user object:", {
        ...user,
        roleType: typeof user.role,
        roleValue: user.role,
        hasUsername: !!user.username,
        hasFirstName: !!user.firstName,
        displayName: getUserDisplayName(user),
      });
    }
  }, [user, dispatch]);

  const onLogout = () => {
    setIsMenuOpen(false); // Close the menu first

    try {
      // Mark this as an intentional logout to avoid loop issues
      localStorage.setItem("logout_intentional", "true");

      // Trigger the global logout event to cancel pending requests
      window.dispatchEvent(new CustomEvent("auth:logout"));

      // Clear localStorage tokens directly
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("tokenData");

      // Then dispatch the Redux logout action
      dispatch(logout());

      // Navigate immediately - don't wait for logout promise
      console.log("Navigating to login page");
      navigate("/login", { replace: true });

      // Remove the intentional flag after a delay
      setTimeout(() => {
        localStorage.removeItem("logout_intentional");
      }, 1000);
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to navigate
      navigate("/login", { replace: true });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-10 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Notes App</h1>
            </Link>
          </div>

          {user ? (
            <div className="flex items-center">
              <Link
                to="/create"
                className="mr-4 flex items-center text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <FiPlus className="h-5 w-5 mr-2" /> New Note
              </Link>

              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="flex items-center text-sm px-3 py-2 rounded-md text-gray-100 hover:text-gray-700 hover:bg-gray-100"
                >
                  {/* Fix the username display by handling different user object structures*/}

                  <span className="mr-2 text-gray-100 hover:text-gray-700 font-medium">
                    {user ? getUserDisplayName(user) : "User"}
                  </span>
                  <FiUser className="h-5 w-5" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-100 hover:text-gray-700 flex items-center"
                    >
                      <FiLogOut className="h-5 w-5 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                className="mr-4 text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, loginSuccess } from "../features/auth/authSlice";
import { toast } from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, error, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Check for token restoration on component mount
    const token = localStorage.getItem("token");

    if (token && !isAuthenticated) {
      console.log("Token found but not authenticated, attempting restoration");

      try {
        // Use the extractUserFromToken function here
        const userFromToken = extractUserFromToken(token);

        if (userFromToken) {
          // Check if token is expired
          const tokenData = JSON.parse(localStorage.getItem("tokenData"));
          const isExpired = tokenData.exp * 1000 < Date.now();

          if (!isExpired) {
            dispatch(
              loginSuccess({
                token,
                refreshToken: localStorage.getItem("refreshToken"),
                user: userFromToken,
              })
            );
            toast.success("Session restored automatically");
          } else {
            toast.error("Token expired, please login again");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("tokenData");
          }
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    console.log("isAuthenticated:", isAuthenticated);
    console.log("User:", user);

    if (isAuthenticated && user) {
      // Check for admin in different possible formats
      const isAdmin =
        user.isAdmin === true ||
        user.role === "admin" ||
        (user.role && user.role.name === "admin");

      if (isAdmin && window.location.pathname !== "/admin") {
        console.log("Navigating to /admin");
        navigate("/admin", { replace: true });
      } else if (!isAdmin && window.location.pathname !== "/dashboard") {
        console.log("Navigating to /dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setLocalError(error);
      setIsSubmitting(false);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear errors when user types
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);

    try {
      console.log("Attempting login with:", formData);

      // Use the Redux action for login which handles token storage
      const result = await dispatch(login(formData)).unwrap();
      console.log("Login result:", result);

      // Success handling
      toast.success("Login successful!");

      // Get token and check admin status directly from token
      const token = result.token;
      let isAdminFromToken = false;

      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const tokenData = JSON.parse(atob(base64));
          console.log("Token data on login:", tokenData);

          // Store token data for debugging
          localStorage.setItem("tokenData", JSON.stringify(tokenData));

          isAdminFromToken =
            tokenData.isAdmin === true || tokenData.role === "admin";
        } catch (e) {
          console.error("Error parsing token:", e);
        }
      }

      // Navigation logic should be based on user data from Redux and token
      const userData = result.user;
      const isAdmin =
        userData?.isAdmin === true ||
        userData?.role === "admin" ||
        (userData?.role &&
          typeof userData.role === "object" &&
          userData.role.name === "admin") ||
        isAdminFromToken;

      if (isAdmin) {
        console.log("Admin user logged in, navigating to admin panel");
        // Force update the user object with isAdmin flag if it's missing
        if (userData && userData.isAdmin === undefined && isAdminFromToken) {
          userData.isAdmin = true;
        }
        navigate("/admin", { replace: true });
      } else {
        console.log("Regular user logged in, navigating to dashboard");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error caught:", err);

      // Enhanced error handling
      if (
        err.response?.status === 400 &&
        err.response.data?.error?.includes("Invalid")
      ) {
        setLocalError("Authentication error. Please try again.");
      } else {
        setLocalError(err.message || "Failed to login. Please try again.");
      }
      toast.error(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractUserFromToken = (token) => {
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const tokenData = JSON.parse(atob(base64));

      // Store for debugging
      localStorage.setItem("tokenData", JSON.stringify(tokenData));

      // Create a user object with all possible fields
      return {
        id: tokenData.id || tokenData._id,
        username: tokenData.username || "",
        firstName: tokenData.firstName || "",
        lastName: tokenData.lastName || "",
        email: tokenData.email || "",
        role: tokenData.role,
        isAdmin: tokenData.isAdmin === true || tokenData.role === "admin",
        permissions: tokenData.permissions || [],
      };
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  };

  if (isAuthenticated === undefined || user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        {localError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{localError}</p>
              </div>
            </div>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="bg-black appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="bg-black appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading || isSubmitting ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : null}
              {isLoading || isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  // First check localStorage for stored tokenData (more reliable)
                  const storedTokenData = localStorage.getItem("tokenData");
                  const token = localStorage.getItem("token");

                  // Current user from Redux
                  const currentUser = user;

                  // Create a debug report
                  let debugInfo = [];

                  debugInfo.push(
                    `User authenticated: ${isAuthenticated ? "Yes" : "No"}`
                  );
                  debugInfo.push(`Token exists: ${token ? "Yes" : "No"}`);

                  if (currentUser) {
                    debugInfo.push("User object:");
                    debugInfo.push(`- ID: ${currentUser.id}`);
                    debugInfo.push(`- Email: ${currentUser.email}`);
                    debugInfo.push(
                      `- Role: ${JSON.stringify(currentUser.role)}`
                    );
                    debugInfo.push(
                      `- isAdmin property: ${currentUser.isAdmin}`
                    );
                    debugInfo.push(
                      `- Permissions: ${JSON.stringify(
                        currentUser.permissions
                      )}`
                    );
                  }

                  if (storedTokenData) {
                    try {
                      const parsedTokenData = JSON.parse(storedTokenData);
                      debugInfo.push("Token data:");
                      debugInfo.push(`- isAdmin: ${parsedTokenData.isAdmin}`);
                      debugInfo.push(`- Role: ${parsedTokenData.role}`);
                      debugInfo.push(
                        `- Permissions: ${JSON.stringify(
                          parsedTokenData.permissions
                        )}`
                      );
                      debugInfo.push(
                        `- Expires: ${new Date(
                          parsedTokenData.exp * 1000
                        ).toLocaleString()}`
                      );
                    } catch (e) {
                      debugInfo.push(
                        `Error parsing stored token data: ${e.message}`
                      );
                    }
                  } else if (token) {
                    try {
                      const base64Url = token.split(".")[1];
                      const base64 = base64Url
                        .replace(/-/g, "+")
                        .replace(/_/g, "/");
                      const tokenData = JSON.parse(atob(base64));

                      debugInfo.push("Token data (decoded on-the-fly):");
                      debugInfo.push(`- isAdmin: ${tokenData.isAdmin}`);
                      debugInfo.push(`- Role: ${tokenData.role}`);
                      debugInfo.push(
                        `- Permissions: ${JSON.stringify(
                          tokenData.permissions
                        )}`
                      );
                      debugInfo.push(
                        `- Expires: ${new Date(
                          tokenData.exp * 1000
                        ).toLocaleString()}`
                      );

                      // Save for future reference
                      localStorage.setItem(
                        "tokenData",
                        JSON.stringify(tokenData)
                      );
                    } catch (e) {
                      debugInfo.push(`Error decoding token: ${e.message}`);
                    }
                  } else {
                    debugInfo.push("No token found in localStorage");
                  }

                  // Display the report
                  toast(
                    <div className="max-h-80 overflow-auto">
                      <p className="font-bold text-lg mb-2">
                        Admin Status Debug
                      </p>
                      {debugInfo.map((line, index) => (
                        <div
                          key={index}
                          className={
                            line.startsWith("-")
                              ? "pl-4 mb-1"
                              : "font-semibold mt-2"
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>,
                    { duration: 10000 }
                  );
                }}
                className="text-sm underline text-blue-600 hover:text-blue-800"
              >
                Debug Auth Status
              </button>
            </div>
            <div className="mt-4 flex justify-between">
              <Link
                to="/api-test"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Test API Connection
              </Link>

              <button
                type="button"
                onClick={() => {
                  const token = localStorage.getItem("token");

                  if (token) {
                    try {
                      // Use the extractUserFromToken function
                      const userFromToken = extractUserFromToken(token);

                      if (userFromToken) {
                        dispatch(
                          loginSuccess({
                            token,
                            refreshToken: localStorage.getItem("refreshToken"),
                            user: userFromToken,
                          })
                        );

                        toast.success("Session restored from token");

                        // Navigate based on role
                        if (userFromToken.isAdmin) {
                          navigate("/admin");
                        } else {
                          navigate("/dashboard");
                        }
                      } else {
                        toast.error("Could not extract user data from token");
                      }
                    } catch (e) {
                      toast.error("Failed to restore session: " + e.message);
                    }
                  } else {
                    toast.error("No token found");
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Force Login from Token
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

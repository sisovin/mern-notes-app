import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { loginSuccess } from "../../features/auth/authSlice";

const AuthDebug = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [tokenInfo, setTokenInfo] = useState(null);

  // Check for token in localStorage
  // Update the token parsing in the useEffect:

  useEffect(() => {
    // Check for token in localStorage
    const checkToken = () => {
      const token = localStorage.getItem("token");
      const tokenData = localStorage.getItem("tokenData");

      if (token) {
        try {
          // Try to decode token
          let decoded;
          if (tokenData) {
            try {
              decoded = JSON.parse(tokenData);
            } catch (e) {
              console.error("Failed to parse stored tokenData:", e);
              // If stored tokenData is invalid, decode from token directly
              const base64Url = token.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              decoded = JSON.parse(atob(base64));
              localStorage.setItem("tokenData", JSON.stringify(decoded));
            }
          } else {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            decoded = JSON.parse(atob(base64));
            localStorage.setItem("tokenData", JSON.stringify(decoded));
          }

          console.log("AdminChecker - Decoded token:", decoded);
          setTokenInfo(decoded);

          // If we have a token but Redux state is not authenticated,
          // attempt to restore the session
          if (!isAuthenticated && !decoded.exp * 1000 < Date.now()) {
            console.log("Attempting to restore session from token");
            dispatch(
              loginSuccess({
                token,
                refreshToken: localStorage.getItem("refreshToken"),
                user: {
                  id: decoded.id || decoded._id || "",
                  username: decoded.username || "",
                  firstName: decoded.firstName || "",
                  lastName: decoded.lastName || "",
                  email: decoded.email || "",
                  role: decoded.role,
                  isAdmin: decoded.isAdmin === true,
                  permissions: decoded.permissions || [],
                },
              })
            );
          }
        } catch (e) {
          console.error("Failed to decode token:", e);
        }
      }
    };

    checkToken();
  }, [isAuthenticated, dispatch]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full z-50 opacity-50 hover:opacity-100"
        title="Show Auth Debug"
      >
        🐞
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-md border border-gray-200">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold text-black">Auth Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="text-sm text-gray-700">
        <div className="mb-2">
          <div className="flex justify-between">
            <span>Redux Auth:</span>
            <span
              className={isAuthenticated ? "text-green-600" : "text-red-600"}
            >
              {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Token in Storage:</span>
            <span
              className={
                localStorage.getItem("token")
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {localStorage.getItem("token") ? "✅ Present" : "❌ Missing"}
            </span>
          </div>
          {/* Replace the existing admin status check with this more comprehensive one: */}

          <div className="flex justify-between">
            <span>Admin Status:</span>
            <span
              className={
                user?.isAdmin === true ||
                user?.role === "admin" ||
                (typeof user?.role === "object" &&
                  user?.role?.name === "admin") ||
                tokenInfo?.isAdmin === true ||
                tokenInfo?.role === "admin"
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {user?.isAdmin === true ||
              user?.role === "admin" ||
              (typeof user?.role === "object" &&
                user?.role?.name === "admin") ||
              tokenInfo?.isAdmin === true ||
              tokenInfo?.role === "admin"
                ? "✅ Admin"
                : "❌ Not Admin"}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 mb-2">
          <button
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
            onClick={() => {
              // Clear redux without clearing localStorage
              toast.success("Auth state reset (Redux only)");
              dispatch({ type: "auth/resetAuthState" });
            }}
          >
            Reset Redux
          </button>

          <button
            className="px-2 py-1 bg-green-500 text-white text-xs rounded"
            onClick={() => {
              // Recover session from localStorage
              const token = localStorage.getItem("token");
              if (token) {
                try {
                  const tokenData = localStorage.getItem("tokenData");
                  const decoded = tokenData
                    ? JSON.parse(tokenData)
                    : JSON.parse(
                        atob(
                          token
                            .split(".")[1]
                            .replace(/-/g, "+")
                            .replace(/_/g, "/")
                        )
                      );

                  dispatch(
                    loginSuccess({
                      token,
                      refreshToken: localStorage.getItem("refreshToken"),
                      user: {
                        id: decoded.id,
                        email: decoded.email || "",
                        role: decoded.role,
                        isAdmin: decoded.isAdmin === true,
                        permissions: decoded.permissions || [],
                      },
                    })
                  );
                  toast.success("Session recovered from token");
                } catch (e) {
                  toast.error("Failed to recover: " + e.message);
                }
              } else {
                toast.error("No token available");
              }
            }}
          >
            Recover Session
          </button>

          <button
            className="px-2 py-1 bg-red-500 text-white text-xs rounded"
            onClick={() => {
              // Full logout
              localStorage.removeItem("token");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("tokenData");
              dispatch({ type: "auth/logout" });
              toast.success("Full logout performed");
            }}
          >
            Force Logout
          </button>
        </div>

        {user && (
          <div className="mt-2">
            <div className="font-semibold">User Data:</div>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-24">
              {JSON.stringify(
                {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  isAdmin: user.isAdmin,
                  permissions: user.permissions,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {tokenInfo && (
          <div className="mt-2">
            <div className="font-semibold">Token Data:</div>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-24">
              {JSON.stringify(
                {
                  id: tokenInfo.id,
                  email: tokenInfo.email,
                  role: tokenInfo.role,
                  isAdmin: tokenInfo.isAdmin,
                  permissions: tokenInfo.permissions,
                  exp: new Date(tokenInfo.exp * 1000).toLocaleString(),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;

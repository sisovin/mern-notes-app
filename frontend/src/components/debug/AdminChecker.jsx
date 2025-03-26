import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { loginSuccess } from "../../features/auth/authSlice";

const AdminChecker = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  
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

  return (
    <div className="bg-gray-100 rounded-md p-4 mb-4">
      <h3 className="font-bold mb-2 text-black">Authentication Status</h3>

      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-black">Redux Auth State:</span>
          <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>
            {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-black">Token Available:</span>
          <span
            className={
              localStorage.getItem("token") ? "text-green-600" : "text-red-600"
            }
          >
            {localStorage.getItem("token") ? "✅ Yes" : "❌ No"}
          </span>
        </div>
        {/* Replace the existing admin status check with this more accurate one: */}
        <div className="flex justify-between">
          <span className="text-black">Admin Status:</span>
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
            (typeof user?.role === "object" && user?.role?.name === "admin") ||
            tokenInfo?.isAdmin === true ||
            tokenInfo?.role === "admin"
              ? "✅ Admin"
              : "❌ Not Admin"}
          </span>
        </div>
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => {
            const token = localStorage.getItem("token");
            const tokenData = localStorage.getItem("tokenData");

            if (token) {
              try {
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

                toast(
                  <div className="space-y-1">
                    <p className="font-bold">Token Info</p>
                    <p>ID: {decoded.id}</p>
                    <p>Role: {decoded.role}</p>
                    <p>isAdmin: {decoded.isAdmin ? "Yes" : "No"}</p>
                    <p>
                      Permissions: {decoded.permissions?.join(", ") || "None"}
                    </p>
                    <p>
                      Expires: {new Date(decoded.exp * 1000).toLocaleString()}
                    </p>
                  </div>,
                  { duration: 5000 }
                );
              } catch (e) {
                toast.error(`Error decoding token: ${e.message}`);
              }
            } else {
              toast.error("No token found");
            }
          }}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
        >
          Show Token
        </button>

        <button
          onClick={() => {
            if (isAuthenticated && user) {
              toast(
                <div className="space-y-1">
                  <p className="font-bold">User Info</p>
                  <p>ID: {user.id}</p>
                  <p>Email: {user.email}</p>
                  <p>
                    Role:{" "}
                    {typeof user.role === "object" ? user.role.name : user.role}
                  </p>
                  <p>isAdmin: {user.isAdmin ? "Yes" : "No"}</p>
                  <p>Permissions: {user.permissions?.join(", ") || "None"}</p>
                </div>,
                { duration: 5000 }
              );
            } else {
              toast.error("Not authenticated");
            }
          }}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded"
        >
          Show User
        </button>

        <button
          onClick={() => {
            // Force session recovery from token
            const token = localStorage.getItem("token");
            const tokenData = localStorage.getItem("tokenData");

            if (token) {
              try {
                let decoded;
                if (tokenData) {
                  decoded = JSON.parse(tokenData);
                } else {
                  const base64Url = token.split(".")[1];
                  const base64 = base64Url
                    .replace(/-/g, "+")
                    .replace(/_/g, "/");
                  decoded = JSON.parse(atob(base64));
                }

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
                toast.error(`Failed to recover session: ${e.message}`);
              }
            } else {
              toast.error("No token available to recover session");
            }
          }}
          className="px-3 py-1 bg-yellow-500 text-white text-sm rounded"
        >
          Recover Session
        </button>
      </div>
    </div>
  );
};

export default AdminChecker;

import React from "react";
import { useSelector } from "react-redux";
import { getUserDisplayName } from "../../utils/userUtils";

const UserInfoDisplay = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="fixed top-20 right-4 bg-white p-3 rounded shadow-md text-xs max-w-xs z-50">
      <h3 className="font-bold text-black mb-1">User Info</h3>
      <div className="space-y-1 text-black">
        <div>
          <span className="font-medium">ID:</span> {user.id || "Not set"}
        </div>
        <div>
          <span className="font-medium">Username:</span>{" "}
          {user.username || "Not set"}
        </div>
        <div>
          <span className="font-medium">Name:</span>{" "}
          {user.firstName
            ? `${user.firstName} ${user.lastName || ""}`
            : "Not set"}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user.email || "Not set"}
        </div>
        <div>
          <span className="font-medium">Role:</span>{" "}
          {typeof user.role === "object"
            ? user.role.name || JSON.stringify(user.role)
            : user.role || "Not set"}
        </div>
        <div>
          <span className="font-medium">isAdmin:</span>{" "}
          {user.isAdmin ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-medium">Display Name:</span>{" "}
          {getUserDisplayName(user)}
        </div>
      </div>
    </div>
  );
};

export default UserInfoDisplay;

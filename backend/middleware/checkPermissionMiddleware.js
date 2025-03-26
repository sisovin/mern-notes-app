import mongoose from "mongoose";
import Role from "../models/Role.js";

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      console.log("User in permission middleware:", req.user);
      console.log(`Checking for permission: ${requiredPermission}`);

      // No user
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Admin role bypass
      if (req.user && req.user.role === "admin") {
        console.log(
          `Admin user bypassing permission check for: ${requiredPermission}`
        );
        return next();
      }

      // Check if user has required permission
      if (
        !req.user.permissions ||
        !req.user.permissions.includes(requiredPermission)
      ) {
        return res.status(403).json({
          error: `Access denied. You don't have permission: ${requiredPermission}`,
        });
      }

      // Check role-based admin access
      if (
        req.user.role === "admin" ||
        (req.user.role &&
          typeof req.user.role === "object" &&
          req.user.role.name === "admin")
      ) {
        console.log(
          `User with admin role bypassing permission check for: ${requiredPermission}`
        );
        return next();
      }

      // User has permissions array with the required permission
      if (
        req.user.permissions &&
        Array.isArray(req.user.permissions) &&
        req.user.permissions.includes(requiredPermission)
      ) {
        console.log(`User has permission: ${requiredPermission}`);
        return next();
      }

      // If permissions not found in user object, check from role
      if (req.user.role) {
        try {
          // If role is an object with permissions already populated
          if (typeof req.user.role === "object" && req.user.role.permissions) {
            const hasPermission = req.user.role.permissions.some((p) =>
              typeof p === "object"
                ? p.name === requiredPermission
                : p === requiredPermission
            );

            if (hasPermission) {
              console.log(
                `User has permission through role object: ${requiredPermission}`
              );
              return next();
            }
          }
          // Otherwise fetch role permissions from database
          else {
            let roleId;
            let roleName;

            // Determine the role ID based on different possible formats
            if (typeof req.user.role === "object") {
              roleId = req.user.role._id;
              roleName = req.user.role.name;
            } else {
              // This could be an ID or a name string
              roleName = req.user.role; // Assume it might be a name
              // Only set roleId if it's a valid ObjectId, otherwise it will stay undefined
            }

            let userRole = null;

            // Try to find by name first (since this is what's happening with "user" role)
            if (roleName) {
              console.log(`Looking up role by name: ${roleName}`);
              userRole = await Role.findOne({ name: roleName }).populate(
                "permissions"
              );
            }

            // If no role found by name and we have what looks like an ObjectId, try that
            if (
              !userRole &&
              roleId &&
              mongoose.Types.ObjectId.isValid(roleId)
            ) {
              userRole = await Role.findById(roleId).populate("permissions");
            }

            if (!userRole) {
              console.log(`Role not found for name: ${roleName}`);
              return res.status(403).json({ error: "Role not found" });
            }

            if (userRole.permissions) {
              const permissions = userRole.permissions.map((p) =>
                typeof p === "object" ? p.name : p
              );

              if (permissions.includes(requiredPermission)) {
                console.log(
                  `User has permission through role DB: ${requiredPermission}`
                );
                return next();
              }
            }
          }
        } catch (error) {
          console.error("Error checking role permissions:", error);
        }
      }

      // If we get here, user doesn't have the required permission
      console.log(`Permission denied: ${requiredPermission}`);
      return res.status(403).json({
        error: "Access denied",
        detail: `You don't have the required permission: ${requiredPermission}`,
      });
    } catch (error) {
      console.error("Error in permission middleware:", error);
      return res
        .status(500)
        .json({ error: "Server error checking permissions" });
    }
  };
};

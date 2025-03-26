import Role from "../models/Role.js";
import User from "../models/User.js";

// Middleware to check if user has a specific role
const hasRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Unauthorized - No user found" });
      }

      // Find user with populated role
      const user = await User.findById(req.user.id).populate("role");

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Check role name
      if (user.role.name !== roleName) {
        return res.status(403).json({
          msg: `Access denied: ${roleName} privileges required`,
          currentRole: user.role.name,
        });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res
        .status(500)
        .json({ msg: "Server error", error: error.message });
    }
  };
};

export { hasRole };

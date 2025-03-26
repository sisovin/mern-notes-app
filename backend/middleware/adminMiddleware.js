const adminMiddleware = async (req, res, next) => {
  try {
    // Debug: Log user info
    console.log("User in request:", req.user);
    console.log("User role:", req.user?.role);

    // Check if user exists and has admin role
    if (!req.user || req.user.role !== "admin") {
      console.log("Admin access denied - Current role:", req.user?.role);
      return res.status(403).json({
        msg: "Access denied: Admin privileges required",
        currentRole: req.user?.role || "undefined",
      });
    }

    console.log("Admin access granted");
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export default adminMiddleware;

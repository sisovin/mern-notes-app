import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  changePassword,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  getUserSettings,
  updateAppearanceSettings,
  updateNotificationSettings,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermissionMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

// Public route - no auth needed
router.post("/register", createUser);

// Current user profile routes - these need to come BEFORE the /:id routes
router.get("/profile", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateUserProfile);

// Protected routes - auth needed
router.get("/", authMiddleware, checkPermission("view_users"), getAllUsers);
router.post("/", authMiddleware, checkPermission("manage_users"), createUser);

// Settings routes
router.get(
  "/settings",
  authMiddleware,
  getUserSettings
);

router.put(
  "/settings/appearance",
  authMiddleware,
  updateAppearanceSettings
);

router.put(
  "/settings/notifications",
  authMiddleware,
  updateNotificationSettings
);


// Routes with ID parameters - these need to come AFTER the specific routes
router.get(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("view_users"),
  getUserById
);
router.put(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_users"),
  updateUser
);

// Password management
router.put(
  "/:id/change-password",
  authMiddleware,
  validateObjectId(),
  changePassword
);
router.patch(
  "/:id/reset-password",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_users"),
  resetPassword
);

// User deletion/restoration
router.put(
  "/:id/delete",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_users"),
  softDeleteUser
);
router.delete(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_users"),
  hardDeleteUser
);
router.patch(
  "/:id/restore",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_users"),
  restoreUser
);

export default router;

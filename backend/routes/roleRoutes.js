import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermissionMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

// Get all roles - available to all authenticated users
router.get("/", authMiddleware, getAllRoles);

// Get role by ID - admin only
router.get(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_roles"),
  getRoleById
);

// Create new role - admin only
router.post("/", authMiddleware, checkPermission("manage_roles"), createRole);

// Update role - admin only
router.put(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_roles"),
  updateRole
);

// Delete role - admin only
router.delete(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_roles"),
  deleteRole
);

export default router;

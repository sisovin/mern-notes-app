import express from "express";
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../controllers/permissionsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermissionMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

// For endpoints that all users might need (UI showing available permissions)
router.get("/", authMiddleware, getAllPermissions);

// For admin-only endpoints
router.post(
  "/",
  authMiddleware,
  checkPermission("manage_permissions"),
  createPermission
);
router.put(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_permissions"),
  updatePermission
);
router.delete(
  "/:id",
  authMiddleware,
  validateObjectId(),
  checkPermission("manage_permissions"),
  deletePermission
);

export default router;

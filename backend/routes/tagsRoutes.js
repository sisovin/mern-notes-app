import express from "express";
import {
  createTag,
  getAllTags,
  getTagById,
  getNotesByTag,
  updateTag,
  softDeleteTag,
  hardDeleteTag,
  restoreTag,
  createMultipleTags,
} from "../controllers/tagController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { hasRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// === Create Section === //
router.post("/", authMiddleware, createTag);
router.post("/bulk", authMiddleware, createMultipleTags);

// === Read Section === //
router.get("/", authMiddleware, getAllTags);
router.get("/:id", authMiddleware, getTagById);
router.get("/:id/notes", authMiddleware, getNotesByTag);

// === Update Section === //
router.put("/:id", authMiddleware, updateTag);
router.patch("/:id/restore", authMiddleware, hasRole("admin"), restoreTag);

// === Delete Section === //
router.delete("/:id/soft", authMiddleware, softDeleteTag);
router.delete("/:id", authMiddleware, hasRole("admin"), hardDeleteTag);

export default router;

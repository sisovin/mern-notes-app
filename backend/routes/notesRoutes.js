import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAllNotes,
  getNoteById,
  addNote,
  editNote,
  pinUnpinNote,
  deleteNote,
  searchNotes,
} from "../controllers/notesController.js";

const router = express.Router();

// Order matters - more specific routes first
router.get("/search", authMiddleware, searchNotes); // This must come before /:id
router.get("/", authMiddleware, getAllNotes);
router.get("/:id", authMiddleware, getNoteById);
router.post("/", authMiddleware, addNote);
router.put("/:id", authMiddleware, editNote);
router.patch("/:id/pin", authMiddleware, pinUnpinNote);
router.delete("/:id", authMiddleware, deleteNote);

export default router;

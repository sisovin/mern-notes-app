import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  addNoteDetail,
  getNoteDetails,
  updateNoteDetail,
  deleteNoteDetail,
} from "../controllers/noteDetailsController.js";

const router = express.Router();

// Add these routes to manage note details
router.post("/notes/:noteId/details", authMiddleware, addNoteDetail);
router.get("/notes/:noteId/details", authMiddleware, getNoteDetails);
router.put("/details/:detailId", authMiddleware, updateNoteDetail);
router.delete("/details/:detailId", authMiddleware, deleteNoteDetail);

export default router;

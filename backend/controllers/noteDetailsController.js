import NoteDetail from "../models/NoteDetail.js";
import Note from "../models/Note.js";
import mongoose from "mongoose";

// Add a detail to a note
export const addNoteDetail = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { detail } = req.body;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Adding detail to note ID:", noteId);
    console.log("User from request:", userId);

    // Check if note exists and belongs to user
    const note = await Note.findOne({
      _id: noteId,
      user: userId,
    });

    if (!note) {
      console.log("Note not found or doesn't belong to user");
      return res.status(404).json({ message: "Note not found" });
    }

    // Create new note detail
    const noteDetail = new NoteDetail({
      note: noteId,
      detail,
    });

    // Save the detail
    const savedDetail = await noteDetail.save();
    console.log("Detail saved with ID:", savedDetail._id);

    // Add the detail to the note's noteDetails array
    note.noteDetails.push(savedDetail._id);
    await note.save();

    res.status(201).json(savedDetail);
  } catch (error) {
    console.error("Error adding note detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all details for a note
// Get all details for a note
export const getNoteDetails = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Log debugging information
    console.log("Fetching details for note ID:", noteId);
    console.log("User from request:", req.user);

    // Extract user ID consistently (supporting both id and _id formats)
    const userId = req.user?.id || req.user?._id;
    console.log("Using user ID:", userId);

    // Check if note exists
    const note = await Note.findById(noteId);

    if (!note) {
      console.log("Note not found with ID:", noteId);
      return res.status(404).json({ message: "Note not found" });
    }

    // Log the note and its owner for debugging
    console.log("Note found:", note._id);
    console.log("Note owner:", note.user);
    console.log("Current user:", userId);

    // Check authorization - compare note.user (ObjectId) with userId (string)
    if (note.user.toString() !== userId) {
      console.log("User ID mismatch - note belongs to:", note.user.toString());
      return res
        .status(403)
        .json({ message: "Not authorized to access this note" });
    }

    // Find all details for this note
    const noteDetails = await NoteDetail.find({
      note: noteId,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    console.log(`Found ${noteDetails.length} details for note ${noteId}`);

    res.json(noteDetails);
  } catch (error) {
    console.error("Error in getNoteDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a note detail
export const updateNoteDetail = async (req, res) => {
  try {
    const { detailId } = req.params;
    const { detail } = req.body;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Updating detail ID:", detailId);
    console.log("User from request:", userId);

    // Find the detail
    const noteDetail = await NoteDetail.findById(detailId);

    if (!noteDetail) {
      console.log("Detail not found with ID:", detailId);
      return res.status(404).json({ message: "Note detail not found" });
    }

    console.log("Detail belongs to note:", noteDetail.note);

    // Check if the user owns the note this detail belongs to
    const note = await Note.findOne({
      _id: noteDetail.note,
      user: userId,
    });

    if (!note) {
      console.log("User is not authorized to update this detail");
      return res.status(403).json({ message: "Not authorized to update this detail" });
    }

    // Update the detail
    noteDetail.detail = detail;
    const updatedDetail = await noteDetail.save();
    console.log("Detail updated successfully");

    res.json(updatedDetail);
  } catch (error) {
    console.error("Error updating note detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a note detail
export const deleteNoteDetail = async (req, res) => {
  try {
    const { detailId } = req.params;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Deleting detail ID:", detailId);
    console.log("User from request:", userId);

    // Find the detail
    const noteDetail = await NoteDetail.findById(detailId);

    if (!noteDetail) {
      console.log("Detail not found with ID:", detailId);
      return res.status(404).json({ message: "Note detail not found" });
    }

    console.log("Detail belongs to note:", noteDetail.note);

    // Check if the user owns the note this detail belongs to
    const note = await Note.findOne({
      _id: noteDetail.note,
      user: userId,
    });

    if (!note) {
      console.log("User is not authorized to delete this detail");
      return res.status(403).json({ message: "Not authorized to delete this detail" });
    }

    // Soft delete
    noteDetail.isDeleted = true;
    await noteDetail.save();
    console.log("Detail marked as deleted");

    // Remove from note's noteDetails array
    const detailIndex = note.noteDetails.indexOf(detailId);
    if (detailIndex > -1) {
      note.noteDetails.splice(detailIndex, 1);
      await note.save();
      console.log("Detail removed from note's details array");
    }

    res.json({ message: "Note detail deleted" });
  } catch (error) {
    console.error("Error deleting note detail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

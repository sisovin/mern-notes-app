import mongoose from "mongoose";
import Note from "../models/Note.js";
import Tag from "../models/Tag.js";

// Get all notes (pinned first)
export const getAllNotes = async (req, res) => {
  try {
    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("User object in request:", req.user);
    console.log("Using user ID:", userId);

    if (!userId) {
      console.error("User ID missing in request");
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find notes with populated tags
    const notes = await Note.find({
      user: userId,
      isDeleted: false,
    })
      .populate("tags")
      .sort({ pinned: -1, updatedAt: -1 });

    console.log(`Found ${notes.length} notes for user ${userId}`);
    return res.json(notes || []);
  } catch (error) {
    console.error("Error in getAllNotes:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Add note
export const addNote = async (req, res) => {
  try {
    const { title, content, tags, isPinned, isPublic } = req.body;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Creating note for user:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Process tags - don't create new tags if they already exist by ID
    let processedTags = [];
    if (tags && tags.length > 0) {
      console.log("Processing tags:", tags);

      // For each tag ID, check if it already exists
      for (const tagId of tags) {
        // Check if it's a valid ObjectId (existing tag)
        if (mongoose.Types.ObjectId.isValid(tagId)) {
          // Look up the tag by ID
          const existingTag = await Tag.findById(tagId);
          if (existingTag) {
            // Use the existing tag's ID
            processedTags.push(existingTag._id);
          }
        }
      }
    }

    const newNote = new Note({
      title,
      content,
      tags: processedTags,
      pinned: isPinned || false,
      isPublic: isPublic || false,
      user: userId,
    });

    await newNote.save();
    console.log("Note created with ID:", newNote._id);

    // Populate tags for the response
    const populatedNote = await Note.findById(newNote._id).populate("tags");
    res.status(201).json(populatedNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Edit note
export const editNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, pinned, isPublic } = req.body;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Editing note ID:", id);
    console.log("Edit note request body:", req.body);

    // Find the note
    const note = await Note.findById(id);

    if (!note) {
      console.log("Note not found with ID:", id);
      return res.status(404).json({ message: "Note not found" });
    }

    // Check ownership
    if (note.user.toString() !== userId) {
      console.log("Unauthorized edit attempt. Note belongs to:", note.user);
      return res
        .status(403)
        .json({ message: "Not authorized to edit this note" });
    }

    // Update note fields
    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.tags = tags !== undefined ? tags : note.tags;

    // Explicitly check for boolean fields
    note.pinned = pinned !== undefined ? pinned : note.pinned;
    note.isPublic = isPublic !== undefined ? isPublic : note.isPublic;

    // Save the updated note
    const updatedNote = await note.save();
    console.log("Note updated successfully");

    // Populate tags for the response
    const populatedNote = await Note.findById(updatedNote._id).populate("tags");
    res.json(populatedNote);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Pin/Unpin note
export const pinUnpinNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Toggle pin for note ID:", id);

    // Find the note
    const note = await Note.findById(id);

    if (!note) {
      console.log("Note not found with ID:", id);
      return res.status(404).json({ message: "Note not found" });
    }

    // Check ownership
    if (note.user.toString() !== userId) {
      console.log("Unauthorized pin attempt. Note belongs to:", note.user);
      return res
        .status(403)
        .json({ message: "Not authorized to pin/unpin this note" });
    }

    // Toggle pin status
    note.pinned = !note.pinned;
    await note.save();
    console.log(`Note ${note.pinned ? "pinned" : "unpinned"} successfully`);

    // Populate tags for the response
    const populatedNote = await Note.findById(note._id).populate("tags");
    res.json(populatedNote);
  } catch (error) {
    console.error("Error pin/unpin note:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete note (soft delete)
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Deleting note ID:", id);

    // Find the note
    const note = await Note.findById(id);

    if (!note) {
      console.log("Note not found with ID:", id);
      return res.status(404).json({ message: "Note not found" });
    }

    // Check ownership
    if (note.user.toString() !== userId) {
      console.log("Unauthorized delete attempt. Note belongs to:", note.user);
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    // Soft delete the note
    note.isDeleted = true;
    await note.save();
    console.log("Note marked as deleted");

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Search notes
export const searchNotes = async (req, res) => {
  try {
    const { query } = req.query;

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Searching notes with query:", query);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find matching notes
    const notes = await Note.find({
      user: userId,
      isDeleted: false,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    })
      .populate("tags")
      .sort({ pinned: -1, updatedAt: -1 });

    console.log(`Found ${notes.length} notes matching query`);
    res.json(notes);
  } catch (error) {
    console.error("Error searching notes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get note by ID
export const getNoteById = async (req, res) => {
  try {
    console.log("Getting note by ID:", req.params.id);

    // Extract user ID consistently
    const userId = req.user?.id || req.user?._id;
    console.log("Authenticated user:", req.user);

    // Find the note with populated tags
    const note = await Note.findById(req.params.id).populate("tags");

    if (!note) {
      console.log("Note not found with ID:", req.params.id);
      return res.status(404).json({ message: "Note not found" });
    }

    // Check if note is deleted
    if (note.isDeleted) {
      console.log("Note is deleted (soft delete)");
      return res.status(404).json({ message: "Note not found" });
    }

    // Debug logs
    console.log("Note user ID:", note.user.toString());
    console.log("Request user ID:", userId);

    // Check if the note belongs to the user
    if (note.user.toString() !== userId) {
      console.log("User ID mismatch - unauthorized access");
      return res
        .status(403)
        .json({ message: "Not authorized to access this note" });
    }

    res.json(note);
  } catch (err) {
    console.error("Error fetching note by ID:", err);

    // Better error handling for invalid ObjectId
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

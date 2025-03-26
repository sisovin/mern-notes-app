import Tag from "../models/Tag.js";
import Note from "../models/Note.js";

// CREATE: Create a new tag
export const createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    // Create new tag
    const newTag = new Tag({
      name: name.toLowerCase(),
      description: description || `Tag for ${name.toLowerCase()}`,
    });

    const savedTag = await newTag.save();
    res.status(201).json(savedTag);
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Get all tags
export const getAllTags = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Filtering - exclude deleted tags by default
    const filter = { isDeleted: false };

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // Get tags with pagination
    const tags = await Tag.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count for pagination
    const total = await Tag.countDocuments(filter);

    res.json({
      tags,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error getting tags:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Get tag by ID
export const getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    if (tag.isDeleted && !req.query.includeDeleted) {
      return res.status(404).json({ error: "Tag has been deleted" });
    }

    res.json(tag);
  } catch (error) {
    console.error("Error getting tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Get notes by tag
export const getNotesByTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    if (tag.isDeleted) {
      return res.status(404).json({ error: "Tag has been deleted" });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find notes with this tag, belonging to the current user
    const notes = await Note.find({
      tags: req.params.id,
      user: req.user.id,
      isDeleted: false,
    })
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .populate("tags", "name");

    // Get total count
    const total = await Note.countDocuments({
      tags: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    res.json({
      notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error getting notes by tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Update tag
export const updateTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if tag exists
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // If name is being updated, check for duplicates
    if (name && name.toLowerCase() !== tag.name.toLowerCase()) {
      const existingTag = await Tag.findOne({ name: name.toLowerCase() });
      if (existingTag) {
        return res.status(400).json({ error: "Tag name already exists" });
      }
      tag.name = name.toLowerCase();
    }

    // Update description if provided
    if (description) {
      tag.description = description;
    }

    const updatedTag = await tag.save();
    res.json(updatedTag);
  } catch (error) {
    console.error("Error updating tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Soft delete tag
export const softDeleteTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Mark as deleted
    tag.isDeleted = true;
    await tag.save();

    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Hard delete tag (permanent)
export const hardDeleteTag = async (req, res) => {
  try {
    // First check if any notes are using this tag
    const notesWithTag = await Note.countDocuments({ tags: req.params.id });

    if (notesWithTag > 0) {
      return res.status(400).json({
        error: "Cannot permanently delete tag as it is used in notes",
        count: notesWithTag,
      });
    }

    const result = await Tag.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Tag not found" });
    }

    res.json({ message: "Tag permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Restore deleted tag
export const restoreTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    if (!tag.isDeleted) {
      return res.status(400).json({ error: "Tag is not deleted" });
    }

    tag.isDeleted = false;
    await tag.save();

    res.json({ message: "Tag restored successfully" });
  } catch (error) {
    console.error("Error restoring tag:", error);
    res.status(500).json({ error: error.message });
  }
};

// BULK: Create multiple tags at once
export const createMultipleTags = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: "Tags must be a non-empty array" });
    }

    const results = {
      created: [],
      existing: [],
    };

    // Process each tag
    for (const tagData of tags) {
      const { name, description } = tagData;

      if (!name) {
        continue; // Skip tags without names
      }

      // Check if tag exists
      const existingTag = await Tag.findOne({ name: name.toLowerCase() });
      if (existingTag) {
        results.existing.push(existingTag);
        continue;
      }

      // Create new tag
      const newTag = new Tag({
        name: name.toLowerCase(),
        description: description || `Tag for ${name.toLowerCase()}`,
      });

      const savedTag = await newTag.save();
      results.created.push(savedTag);
    }

    res.status(201).json({
      message: `Created ${results.created.length} tags. ${results.existing.length} tags already existed.`,
      created: results.created,
      existing: results.existing,
    });
  } catch (error) {
    console.error("Error creating multiple tags:", error);
    res.status(500).json({ error: error.message });
  }
};

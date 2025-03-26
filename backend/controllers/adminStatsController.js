import User from "../models/User.js";
import Role from "../models/Role.js";
import Note from "../models/Note.js";
import Tag from "../models/Tag.js";
import NoteDetail from "../models/NoteDetail.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
mongoose.set("strictQuery", false);

const adminStatsController = async (_, res) => {
  try {
    const userCount = await User.countDocuments();
    const roleCount = await Role.countDocuments();
    const noteCount = await Note.countDocuments();
    const tagCount = await Tag.countDocuments();
    const noteDetailCount = await NoteDetail.countDocuments();
    const activeUsers = await User.countDocuments({ isDeleted: false });
    const deletedUsers = await User.countDocuments({ isDeleted: true });

    res.json({
      userCount,
      roleCount,
      noteCount,
      tagCount,
      noteDetailCount,
      activeUsers,
      deletedUsers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error.message);
    res.status(500).json({
      error: "Failed to fetch admin stats",
      details: error.message,
    });
  }
};

export default adminStatsController;

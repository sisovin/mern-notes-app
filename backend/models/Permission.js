import mongoose from "mongoose";

const permissionsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Permission name is required"],
    unique: true,
  },
  description: {
    type: String,
    required: [true, "Permission description is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
});

const Permission = mongoose.model("Permission", permissionsSchema);

export default Permission;

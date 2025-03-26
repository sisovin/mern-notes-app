import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Role name is required"],
    unique: true,
  },
  description: {
    type: String,
    required: [true, "Role description is required"],
  },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }], // Reference to Permission model
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

const Role = mongoose.model("Role", roleSchema);

export default Role;

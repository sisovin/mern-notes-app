import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  pinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }, // Add this field
  noteDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "NoteDetail" }],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

noteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Note = mongoose.model("Note", noteSchema);

export default Note;

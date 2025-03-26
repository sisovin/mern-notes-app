import mongoose from "mongoose";
import validator from "validator";

const { isEmail } = validator;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  dateOfBirth: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  bio: {
    type: String,
    default: "",
    maxlength: 500,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" }, // Reference to Role
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  settings: {
    appearance: {
      theme: { type: String, default: "system" },
      fontSize: { type: String, default: "medium" },
      noteViewMode: { type: String, default: "grid" },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: false },
      reminderNotifications: { type: Boolean, default: false },
      shareNotifications: { type: Boolean, default: true },
    },
  },
});

// Update timestamp middleware
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add middleware to populate role when getting user
userSchema.pre(/^find/, function (next) {
  this.populate("role", "name");
  next();
});

// REMOVE THIS PROBLEMATIC CODE - Comment it out or delete it entirely

/* userSchema.pre("save", function (next) {
  // If role is admin, ensure isAdmin flag is true
  if (
    this.role &&
    (this.role.name === "admin" ||
      (typeof this.role === "object" &&
        this.role._id &&
        this.role._id.toString() === adminRoleId.toString()))
  ) {
    this.isAdmin = true;
  }
  next();
}); */


// Replace the problematic pre-save middleware with this corrected version:

// Keep only this fixed version that avoids the adminRoleId reference:
userSchema.pre("save", async function (next) {
  // If role matches admin name, ensure isAdmin flag is true
  if (this.role && this.role.name === "admin") {
    this.isAdmin = true;
  } else if (typeof this.role === "object" && this.role._id) {
    try {
      // Dynamically get admin role
      const adminRole = await mongoose
        .model("Role")
        .findOne({ name: "admin" });
      if (
        adminRole &&
        this.role._id.toString() === adminRole._id.toString()
      ) {
        this.isAdmin = true;
      }
    } catch (err) {
      // Just log the error but continue
      console.error("Error checking admin role:", err);
    }
  }
  
  next();
});

const User = mongoose.model("User", userSchema);

export default User;

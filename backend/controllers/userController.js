import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import argon2 from "argon2";

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// CREATE: Create a new user
export const createUser = async (req, res) => {
  // Start a session for potential transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      username,
      firstName,
      lastName,
      dateOfBirth,
      email,
      password,
      isAdmin,
      role,
      bio,
    } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          username: !username ? "Username is required" : null,
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null,
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).session(session);

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Email already in use"
            : "Username already in use",
      });
    }

    // Handle role assignment
    let userRole;
    if (role) {
      // If role is provided, validate it
      userRole = await Role.findById(role).session(session);
      if (!userRole) {
        return res.status(400).json({ error: "Invalid role" });
      }
    } else {
      // If no role is provided, assign default user role
      userRole = await Role.findOne({ name: "user" }).session(session);
      if (!userRole) {
        return res.status(500).json({
          error: "Default role not found. Please contact administrator.",
        });
      }
    }

    // Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create new user
    const newUser = new User({
      username,
      firstName: firstName || "",
      lastName: lastName || "",
      dateOfBirth,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      role: userRole._id,
      bio: bio || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedUser = await newUser.save({ session });

    // Remove password from response and format permissions
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    // Add role name for easier frontend use
    userResponse.roleName = userRole.name;

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error("Error creating user:", error);

    // Provide more specific error messages for common issues
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      error: "Failed to create user",
      message: error.message,
    });
  }
};

// READ: Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Check if user has permission to view users
    if (
      !req.user ||
      !req.user.permissions ||
      (!req.user.permissions.includes("view_users") &&
        req.user.role !== "admin")
    ) {
      return res
        .status(403)
        .json({ error: "You don't have permission to view users" });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering - Only show non-deleted users by default
    const filter = { isDeleted: false };

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Role filtering
    if (req.query.role) {
      const role = await Role.findOne({ name: req.query.role });
      if (role) {
        filter.role = role._id;
      }
    }

    // Get users with pagination and populate role
    // In getAllUsers
    const users = await User.find(filter)
      .select("-password") // Exclude password
      .populate({
        path: "role",
        select: "name description",
        populate: { path: "permissions", select: "name" },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ: Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if id is a valid ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Only check permission if the requesting user is not the same as the requested user
    // This allows users to access their own profile without explicit permissions
    if (id !== req.user.id) {
      // Check if user has permission to view other users
      if (
        !req.user ||
        !req.user.permissions ||
        (!req.user.permissions.includes("view_users") &&
          req.user.role !== "admin")
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to view this user" });
      }
    }

    const user = await User.findById(id)
      .select("-password")
      .populate({
        path: "role",
        select: "name description permissions",
        populate: { path: "permissions", select: "name" },
      });

    console.log("Raw user from database:", user); // Add this log

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't show deleted users unless specifically requested or it's the admin
    if (
      user.isDeleted &&
      !req.query.includeDeleted &&
      req.user.role !== "admin"
    ) {
      return res.status(404).json({ error: "User has been deleted" });
    }

    // Create response with explicit permissions array
    const userObj = user.toObject();

    // Extract permissions
    const permissions =
      user.role?.permissions
        ?.map((p) => (typeof p === "string" ? p : p.name || ""))
        .filter(Boolean) || [];

    // Add permissions and role name
    userObj.permissions = permissions;
    userObj.roleName = user.role?.name || "unknown";

    // Only set bio to empty string if it's undefined (not if it's null or already exists)
    if (userObj.bio === undefined) {
      userObj.bio = "";
    }

    res.json(userObj);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Update user with bio support
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Extract update fields
    const { username, firstName, lastName, email, dateOfBirth, role, isAdmin, bio } = req.body;

    // Check if user exists without session
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent updates to deleted users
    if (userToUpdate.isDeleted) {
      return res.status(400).json({
        error: "Cannot update a deleted user. Restore the user first.",
      });
    }

    // Validate email update
    if (email && email !== userToUpdate.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Check for existing email
      const existingUserWithEmail = await User.findOne({ 
        email, 
        _id: { $ne: id } 
      });

      if (existingUserWithEmail) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    // Validate username update
    if (username && username !== userToUpdate.username) {
      // Check for existing username
      const existingUserWithUsername = await User.findOne({ 
        username, 
        _id: { $ne: id } 
      });

      if (existingUserWithUsername) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    // Validate role update
    let roleObject = null;
    if (role && role !== userToUpdate.role.toString()) {
      roleObject = await Role.findById(role);

      if (!roleObject) {
        return res.status(400).json({ error: "Invalid role ID" });
      }
    }

    // Create update object with only provided fields
    const updateData = {};
    if (username) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (role) updateData.role = role;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (bio !== undefined) updateData.bio = bio;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Perform the update without transaction
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "role",
      select: "name description",
    });

    // Format the response
    const userObj = updatedUser.toObject();
    delete userObj.password; // Remove sensitive information

    // Add additional fields
    userObj.roleName = updatedUser.role.name;
    userObj.bio = updatedUser.bio || ""; // Ensure bio is included

    res.status(200).json({
      message: "User updated successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid data format" });
    }

    res.status(500).json({
      error: "Failed to update user",
      message: error.message,
    });
  }
};

// UPDATE: Change user password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await argon2.verify(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Admin reset user password
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Get user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Soft delete user
export const softDeleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isDeleted = true;
    await user.save();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE: Hard delete user (permanent)
export const hardDeleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting user:", error);
    res.status(500).json({ error: error.message });
  }
};

// Example of the restoreUser controller method with improved validation
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.isDeleted) {
      return res.status(400).json({ error: "User is not deleted" });
    }
    
    user.isDeleted = false;
    await user.save();
    
    res.status(200).json({ message: "User restored successfully" });
  } catch (error) {
    console.error("Error restoring user:", error);
    res.status(500).json({ error: error.message || "Failed to restore user" });
  }
};

// READ: Get current user profile (for logged in user)
// Make sure your getCurrentUser function in userController.js works properly:

export const getCurrentUser = async (req, res) => {
  try {
    // Get user ID from the request (set by authMiddleware)
    const userId = req.user.id || req.user._id;
    
    console.log("Getting profile for user ID:", userId);
    
    // Check if we have any user ID
    if (!userId) {
      console.error("No user ID found in request:", req.user);
      return res.status(400).json({ 
        error: "Missing user ID",
        details: "User ID not found in token. Please log in again."
      });
    }
    
    // Validate the ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID format:", userId);
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "role",
        select: "name description",
        populate: { path: "permissions", select: "name" },
      });

    if (!user) {
      console.error("User not found in database:", userId);
      return res.status(404).json({ 
        error: "User not found",
        details: "Your account may have been deleted or does not exist" 
      });
    }

    if (user.isDeleted) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated" });
    }

    // Extract permissions from user role
    const permissions = user.role?.permissions?.map((p) => 
      typeof p === 'object' ? p.name : p
    ) || [];

    // Create response with explicit permissions array and bio
    const response = {
      ...user.toObject(),
      id: user._id, // Ensure id is set
      _id: user._id, // Keep _id for backward compatibility
      permissions,
      bio: user.bio || "", // Ensure bio is included
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      username: user.username || "",
    };

    console.log("Returning user profile:", { 
      id: response._id,
      username: response.username,
      email: response.email,
      bio: response.bio
    });

    res.json(response);
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    // Get user ID from the request (set by authMiddleware)
    const userId = req.user.id || req.user._id;
    
    // Extract fields from request body
    const { username, firstName, lastName, email, bio } = req.body;

    console.log("Updating profile for user ID:", userId);
    console.log("Update data:", { username, firstName, lastName, email, bio });

    // Check if we have any user ID
    if (!userId) {
      console.error("No user ID found in request:", req.user);
      return res.status(400).json({
        error: "Missing user ID",
        details: "User ID not found in token. Please log in again.",
      });
    }

    // Check if user exists and is not deleted
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.isDeleted) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated" });
    }

    // Validate email update
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingUserWithEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUserWithEmail) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    // Validate username update
    if (username && username !== currentUser.username) {
      const existingUserWithUsername = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUserWithUsername) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    // Create update object with only provided fields
    const updateData = {};
    if (username) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    // Perform the update without transaction
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate({
        path: "role",
        select: "name description",
      });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format the response
    const userObj = updatedUser.toObject();

    // Add additional fields
    userObj.roleName = updatedUser.role.name;
    userObj.bio = updatedUser.bio || ""; // Ensure bio is included

    res.status(200).json({
      message: "Profile updated successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid data format" });
    }

    res.status(500).json({
      error: "Failed to update profile",
      message: error.message,
    });
  }
};

// READ: Get user settings
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Check if we have any user ID
    if (!userId) {
      console.error("No user ID found in request:", req.user);
      return res.status(400).json({
        error: "Missing user ID",
        details: "User ID not found in token. Please log in again.",
      });
    }

    // Get user settings
    const user = await User.findById(userId).select("settings");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.settings);
  } catch (error) {
    console.error("Error getting user settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Add these controller functions

// UPDATE: Update user appearance settings
export const updateAppearanceSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { theme, fontSize, noteViewMode } = req.body;

    // Check if we have any user ID
    if (!userId) {
      console.error("No user ID found in request:", req.user);
      return res.status(400).json({
        error: "Missing user ID",
        details: "User ID not found in token. Please log in again.",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update appearance settings
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.appearance) {
      user.settings.appearance = {};
    }

    // Only update fields that are provided
    if (theme !== undefined) user.settings.appearance.theme = theme;
    if (fontSize !== undefined) user.settings.appearance.fontSize = fontSize;
    if (noteViewMode !== undefined) user.settings.appearance.noteViewMode = noteViewMode;

    // Save user
    await user.save();

    // Return updated user with settings
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: "Appearance settings updated successfully",
      settings: user.settings.appearance,
      user: userObj
    });
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Update user notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { emailNotifications, reminderNotifications, shareNotifications } = req.body;

    // Check if we have any user ID
    if (!userId) {
      console.error("No user ID found in request:", req.user);
      return res.status(400).json({
        error: "Missing user ID",
        details: "User ID not found in token. Please log in again.",
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update notification settings
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.notifications) {
      user.settings.notifications = {};
    }

    // Only update fields that are provided
    if (emailNotifications !== undefined) user.settings.notifications.emailNotifications = emailNotifications;
    if (reminderNotifications !== undefined) user.settings.notifications.reminderNotifications = reminderNotifications;
    if (shareNotifications !== undefined) user.settings.notifications.shareNotifications = shareNotifications;

    // Save user
    await user.save();

    // Return updated user with settings
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: "Notification settings updated successfully",
      settings: user.settings.notifications,
      user: userObj
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: error.message });
  }
};

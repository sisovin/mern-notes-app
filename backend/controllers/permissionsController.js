import Permission from "../models/Permission.js";

// Get all permissions
export const getAllPermissions = async (req, res) => {
  try {
    // Log current permissions for debugging
    console.log(
      "User permissions:",
      req.user ? req.user.permissions : undefined
    );

    // No need for permission check here - if we need permissions in UI, just return them
    // Admin role check is built into the middleware

    const permissions = await Permission.find();
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

// Create a new permission
export const createPermission = async (req, res) => {
  try {
    // Permission check handled by route middleware
    const { name, description } = req.body;

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res
        .status(400)
        .json({ error: "Permission with this name already exists" });
    }

    const newPermission = new Permission({ name, description });
    await newPermission.save();
    res.status(201).json(newPermission);
  } catch (error) {
    console.error("Error creating permission:", error);
    res.status(500).json({ error: "Failed to create permission" });
  }
};

// Update a permission
export const updatePermission = async (req, res) => {
  try {
    // Permission check handled by route middleware
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if another permission with the same name exists
    const existingPermission = await Permission.findOne({
      name,
      _id: { $ne: id },
    });

    if (existingPermission) {
      return res
        .status(400)
        .json({ error: "Another permission with this name already exists" });
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updatedPermission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    res.status(200).json(updatedPermission);
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ error: "Failed to update permission" });
  }
};

// Delete a permission
export const deletePermission = async (req, res) => {
  try {
    // Permission check handled by route middleware
    const { id } = req.params;
    const deletedPermission = await Permission.findByIdAndDelete(id);

    if (!deletedPermission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    res.status(200).json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error deleting permission:", error);
    res.status(500).json({ error: "Failed to delete permission" });
  }
};

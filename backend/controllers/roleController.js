import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

// Standardized response format
const formatResponse = (success, data = null, error = null) => {
  return {
    success,
    ...(data && { data }),
    ...(error && { error })
  };
};


// Get all roles with pagination
export const getAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build query
    const query = {
      isDeleted: { $ne: true }
    };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Get roles with pagination
    const roles = await Role.find(query)
      .populate('permissions')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Ensure each role has a permissions array
    const normalizedRoles = roles.map(role => ({
      ...role.toObject(),
      permissions: role.permissions || []
    }));
    
    // Get total count for pagination
    const total = await Role.countDocuments(query);
    
    return res.status(200).json({
      roles: normalizedRoles,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    return res.status(500).json({ error: 'Failed to get roles' });
  }
};

// Get role by ID
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({ 
      _id: req.params.id,
      isDeleted: { $ne: true }
    }).populate('permissions');
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    return res.status(200).json(role);
  } catch (error) {
    console.error('Error getting role:', error);
    return res.status(500).json({ error: 'Failed to get role' });
  }
};

// Create role
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if role already exists
    const existingRole = await Role.findOne({ 
      name,
      isDeleted: { $ne: true }
    });
    
    if (existingRole) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }
    
    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        _id: { $in: permissions },
        isDeleted: { $ne: true }
      });
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permissions are invalid' });
      }
    }
    
    const role = new Role({
      name,
      description,
      permissions: permissions || []
    });
    
    await role.save();
    
    const populatedRole = await Role.findById(role._id).populate('permissions');
    
    return res.status(201).json(populatedRole);
  } catch (error) {
    console.error('Error creating role:', error);
    return res.status(500).json({ error: 'Failed to create role' });
  }
};


// Update role
export const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Check if another role with the same name exists
    const existingRole = await Role.findOne({
      name,
      _id: { $ne: req.params.id },
      isDeleted: { $ne: true }
    });
    
    if (existingRole) {
      return res.status(400).json({ error: 'Another role with this name already exists' });
    }
    
    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({
        _id: { $in: permissions },
        isDeleted: { $ne: true }
      });
      
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({ error: 'One or more permissions are invalid' });
      }
    }
    
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { name, description, permissions: permissions || [] },
      { new: true }
    ).populate('permissions');
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    return res.status(200).json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

// Delete role (soft delete)
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    return res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
};
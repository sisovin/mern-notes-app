import express from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import redis from "redis";
import User from "../models/User.js";
import Role from "../models/Role.js";
import RefreshToken from "../models/RefreshToken.js";
import Token from "../models/Token.js";

const redisClient = redis.createClient({ url: process.env.UPSTASH_REDIS_URL });
redisClient.connect().catch(console.error);

// Add hash function for refresh tokens
const hashToken = async (token) => {
  return await argon2.hash(token, {
    type: argon2.argon2id,
    memoryCost: 16384, // Less intensive for tokens
    timeCost: 2,
    parallelism: 2,
  });
};

// Update your token generation function

// Generate JWT token with proper permissions
// Update the generateToken function to properly include the JWT secret

const generateToken = (user, permissions = []) => {
  // Extract permissions from role if not provided directly
  let finalPermissions = permissions;
  
  if (!finalPermissions.length && user.role && user.role.permissions) {
    // If permissions objects are populated
    if (user.role.permissions[0] && typeof user.role.permissions[0] === "object") {
      finalPermissions = user.role.permissions.map((p) => p.name);
    } 
    // If permissions are just IDs
    else {
      finalPermissions = user.role.permissions;
    }
  }

  // Extract role name or ID
  const roleName = user.role && user.role.name ? user.role.name : "user";
  const roleId = user.role && user.role._id ? user.role._id : user.role;

  // When generating JWT token, standardize the ID field
  // CRITICAL FIX: We need to pass the ACCESS_TOKEN_SECRET as the second parameter
  return jwt.sign(
    {
      id: user._id, // Use standard 'id' field
      _id: user._id, // Include _id for backward compatibility
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: roleName,
      roleId: roleId,
      permissions: finalPermissions, // Include permissions in the token
      isAdmin: user.isAdmin || roleName === "admin",
    },
    process.env.ACCESS_TOKEN_SECRET, // ← This was missing!
    { expiresIn: "1h" }
  );
};

// Generate refresh token
const generateRefreshToken = async (user) => {
  const userId = user._id || user.id; // Handle both full user object and decoded token
  const userRole = user.role;

  const token = jwt.sign(
    { id: userId, role: userRole },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Optionally hash the token before storing it
  // const hashedToken = await hashToken(token);

  return new RefreshToken({
    user: userId,
    token, // Use token directly, or change this to hashedToken if you want to hash it
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
};

// Update signup to include default role
const signUp = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Get the user role (default role)
    const userRole = await Role.findOne({ name: "user" }).populate("permissions");
    if (!userRole) {
      return res.status(500).json({
        error: "Default role not found. Run role initialization first.",
      });
    }

    // Extract permissions from the role
    const permissions = userRole.permissions.map((perm) => perm.name);

    // Create new user with the user role
    const newUser = new User({
      email,
      password: await argon2.hash(password),
      name,
      role: userRole._id, // Set default role
    });

    // Save user
    const savedUser = await newUser.save();

    // Generate tokens
    const accessToken = generateToken(savedUser, permissions);
    const refreshToken = await generateRefreshToken(savedUser);

    // Return user data and tokens
    res.status(201).json({
      user: {
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        role: userRole.name,
        permissions: userRole.permissions.map((perm) => perm.name), // Use permissions (plural)
      },
      token: accessToken,
      refreshToken: refreshToken.token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update login to use argon2
// Fix the login function to include complete user data

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Find user first
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found in database");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    console.log("User found, checking password");

    // Verify password using argon2
    try {
      const isMatch = await argon2.verify(user.password, password);
      console.log("Password verification result:", isMatch);

      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
    } catch (argonError) {
      console.error("Argon2 verification error:", argonError);
      return res.status(500).json({ error: "Error verifying credentials" });
    }

    // After password verification
    console.log("User fetched:", user);
    console.log("User role ID:", user.role);

    // Ensure role exists
    if (!user.role) {
      console.error("User role not found");
      return res.status(500).json({ error: "User role not found" });
    }

    // Manually fetch the role with permissions since populate isn't working
    const roleWithPermissions = await Role.findById(user.role).populate(
      "permissions"
    );
    if (!roleWithPermissions) {
      console.error("Role not found in database");
      return res.status(500).json({ error: "Role not found" });
    }

    console.log("Role permissions fetched:", roleWithPermissions);

    // Extract permissions from the role, or use empty array if none found
    const permissions =
      roleWithPermissions.permissions &&
      roleWithPermissions.permissions.length > 0
        ? roleWithPermissions.permissions.map((perm) => perm.name)
        : [];

    console.log("Permissions extracted:", permissions);

    // Attach the populated role to the user object for token generation
    user.role = roleWithPermissions;

    // Generate tokens - pass permissions directly to ensure they're included
    const token = generateToken(user, permissions);
    const refreshTokenObj = await generateRefreshToken(user);

    // Save refresh token to database
    await refreshTokenObj.save();

    // Create an entry in Token model for the access token
    const tokenRecord = new Token({
      user: user._id,
      token: token,
      type: "access",
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry matching JWT
      userAgent: req.headers["user-agent"] || "unknown",
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
    });

    // Save the token record
    await tokenRecord.save();
    console.log("Access token saved to Token model");

    // Store in Redis for faster access
    await redisClient.set(user._id.toString(), refreshTokenObj.token, {
      EX: 7 * 24 * 60 * 60, // Set expiration to 7 days (in seconds)
    });

    // Return user data and tokens with COMPLETE user profile
    res.json({
      user: {
        id: user._id,
        _id: user._id, // Include both formats for compatibility
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        bio: user.bio || "", // Include bio
        role: roleWithPermissions.name,
        permissions, // Use permissions (plural) here
      },
      token,
      refreshToken: refreshTokenObj.token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    console.log("Logout request received:", req.body);

    // Get the refreshToken from body, if available
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      try {
        // Try to find and invalidate the token in database
        // First try the Token model
        const token = await Token.findOne({ token: refreshToken });
        if (token) {
          token.isRevoked = true;
          await token.save();
          console.log("Token marked as revoked in Token model");
        } else {
          // If not found in Token model, try RefreshToken model
          const refreshTokenDoc = await RefreshToken.findOne({
            token: refreshToken,
          });
          if (refreshTokenDoc) {
            refreshTokenDoc.isRevoked = true;
            await refreshTokenDoc.save();
            console.log("Token marked as revoked in RefreshToken model");
          } else {
            console.log("Token not found in any model");
          }
        }
      } catch (tokenError) {
        // Log error but continue with logout
        console.error("Error revoking token:", tokenError);
      }
    } else {
      console.log("No refresh token provided in logout request");
    }

    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    // Always return success
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still return 200 to ensure client-side logout works
    return res.status(200).json({ message: "Logged out successfully" });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken: tokenFromRequest } = req.body;

  // Check if token exists in request
  if (!tokenFromRequest) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    console.log("Attempting to verify token...");
    const decoded = jwt.verify(
      tokenFromRequest,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Token verified, user ID:", decoded.id);

    // Find the user from the database to get the full user object
    const user = await User.findById(decoded.id).populate({
      path: "role",
      populate: { path: "permissions" }, // Make sure to populate permissions
    });
    if (!user) {
      console.log(`User with ID ${decoded.id} not found`);
      return res.status(403).json({ error: "User not found" });
    }

    console.log("Checking database for token...");
    // Add debug to see all tokens for this user
    const allUserTokens = await RefreshToken.find({ user: decoded.id });
    console.log(`Found ${allUserTokens.length} tokens for user ${decoded.id}`);

    const storedRefreshToken = await RefreshToken.findOne({
      user: decoded.id,
      token: tokenFromRequest,
    });

    if (!storedRefreshToken) {
      console.log("Token not found in database");
      // Log all the tokens to debug
      allUserTokens.forEach((token, i) => {
        console.log(`Token ${i}: ${token.token.substring(0, 10)}...`);
      });
      return res
        .status(403)
        .json({ error: "Refresh token not found in database" });
    }

    // Check if token is expired
    if (storedRefreshToken.expiresAt < new Date()) {
      console.log("Token has expired");
      await RefreshToken.deleteOne({ _id: storedRefreshToken._id });
      return res.status(403).json({ error: "Refresh token has expired" });
    }

    console.log("Token found in database, checking Redis...");
    // Only check Redis if Redis client is connected
    let redisRefreshToken = null;
    try {
      redisRefreshToken = await redisClient.get(decoded.id);
    } catch (redisError) {
      console.warn("Redis error, skipping Redis check:", redisError.message);
      // We'll proceed without Redis if there's an error
    }

    if (redisRefreshToken && redisRefreshToken !== tokenFromRequest) {
      console.log("Token mismatch in Redis");
      return res.status(403).json({
        error: "Token mismatch in cache",
        details: "A different session might be active",
      });
    }

    console.log("Generating new tokens...");
    // When generating the new token, make sure to extract permissions:
    const rolePermissions = user.role?.permissions?.map((p) => p.name) || [];
    const newToken = generateToken(user, rolePermissions);
    const newRefreshTokenObj = await generateRefreshToken(user);

    // Save new refresh token to database
    await newRefreshTokenObj.save();
    console.log("New refresh token saved to database");

    // Remove old refresh token from database
    await RefreshToken.deleteOne({ _id: storedRefreshToken._id });
    console.log("Old refresh token removed from database");

    // Update token in Redis if Redis is available
    try {
      await redisClient.set(user._id.toString(), newRefreshTokenObj.token);
      console.log("Token updated in Redis");
    } catch (redisError) {
      console.warn(
        "Failed to update Redis, but proceeding:",
        redisError.message
      );
    }

    console.log("Token refresh successful");
    res.json({
      token: newToken,
      refreshToken: newRefreshTokenObj.token,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token format" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Refresh token has expired" });
    }

    res
      .status(403)
      .json({ error: "Invalid refresh token", details: error.message });
  }
};

// Refactored checkPermission controller
/**
 * Check if user has specified role or permission
 * @route GET /api/auth/check-permission
 */
const checkPermission = async (req, res) => {
  try {
    const { role, permission } = req.query;
    
    // Debug the request
    console.log("Permission check request:", { 
      userId: req.user._id,
      requestedRole: role,
      requestedPermission: permission,
      userRole: req.user.role,
      isAdmin: req.user.isAdmin 
    });
    
    // If user is admin, always grant access
    if (req.user.isAdmin === true) {
      return res.json({ hasAccess: true });
    }
    
    // Role-based check
    if (role) {
      const userRole = typeof req.user.role === 'object' 
        ? req.user.role.name 
        : req.user.role;
      
      if (userRole === role) {
        return res.json({ hasAccess: true });
      }
    }
    
    // Permission-based check
    if (permission) {
      // Implement permission check logic here if needed
      // This would require populating user.role.permissions
    }
    
    // If no access granted above, deny access
    return res.json({ hasAccess: false });
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ error: "Error checking permissions" });
  }
};

// Add this to authController.js first:
const getCurrentUser = async (req, res) => {
  try {
    // Populate the role to get permissions
    const user = await User.findById(req.user._id)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        id: user._id,
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        role: user.role,
        permissions: user.role?.permissions || [],
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ error: 'Failed to get user information' });
  }
};

// checkStatus
const checkStatus = async (req, res) => {
  try {
    // If the middleware passes, the user is authenticated
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        username: req.user.username || "",
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions || []
      }
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ error: 'Failed to check status' });
  }
};

// Add this function to your authController.js

/**
 * Consolidate token data between database and Redis
 * This helps verify token consistency across storage systems
 */
const consolidateToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    
    if (!tokenId) {
      return res.status(400).json({ error: "Token ID is required" });
    }
    
    console.log("Consolidating token:", tokenId);
    
    // Look for tokens in database
    let dbToken = null;
    try {
      // Find user's tokens in the Token model
      const userTokens = await Token.find({ user: tokenId })
        .sort({ createdAt: -1 })
        .limit(1);
        
      if (userTokens && userTokens.length > 0) {
        dbToken = {
          id: userTokens[0].user.toString(),
          token: userTokens[0].token,
          type: userTokens[0].type,
          createdAt: userTokens[0].createdAt,
          expiresAt: userTokens[0].expiresAt,
          source: "database"
        };
      }
    } catch (dbErr) {
      console.error("Database token lookup error:", dbErr);
    }
    
    // Look for tokens in Redis
    let redisToken = null;
    try {
      const redisResult = await redisClient.get(tokenId);
      if (redisResult) {
        redisToken = {
          id: tokenId,
          token: redisResult,
          source: "redis"
        };
      }
    } catch (redisErr) {
      console.error("Redis token lookup error:", redisErr);
    }
    
    // Determine match status
    const match = !!(dbToken && redisToken && 
                   dbToken.id === redisToken.id);
    
    // Return all token information
    return res.json({
      dbToken: dbToken || { source: "database" },
      redisToken: redisToken || { source: "redis" },
      match
    });
    
  } catch (error) {
    console.error("Token consolidation error:", error);
    return res.status(500).json({ 
      error: "Failed to consolidate token data",
      details: error.message
    });
  }
};

export { signUp, login, refreshToken, checkPermission, checkStatus, getCurrentUser, consolidateToken, hashToken };

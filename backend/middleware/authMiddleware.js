import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { isTokenBlacklisted } from "../config/tokens.js";
import dotenv from "dotenv";

dotenv.config();

// Add this to authMiddleware.js
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header("Authorization");
    console.log("Auth header:", authHeader ? "Present" : "Missing");

    // Check if Authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // IMPORTANT: Verify token using ACCESS_TOKEN_SECRET
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("Token verified successfully with ACCESS_TOKEN_SECRET");
    } catch (verifyError) {
      // If verification with ACCESS_TOKEN_SECRET fails, try JWT_SECRET
      if (process.env.JWT_SECRET && process.env.JWT_SECRET !== process.env.ACCESS_TOKEN_SECRET) {
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log("Token verified with JWT_SECRET instead of ACCESS_TOKEN_SECRET");
        } catch (fallbackError) {
          throw verifyError; // If both fail, throw the original error
        }
      } else {
        throw verifyError;
      }
    }

    // Make sure we have an ID in some format
    if (!decoded.id && !decoded._id) {
      console.error("Token doesn't contain a user ID:", decoded);
      return res.status(401).json({
        error: "Invalid token",
        details: "User ID missing in token",
      });
    }

    // Standardize the id field
    const userId = decoded.id || decoded._id;
    console.log("User ID from token:", userId);

    // Set user info on request
    req.user = {
      id: userId,
      _id: userId,
      role: decoded.role || "user",
      permissions: decoded.permissions || [],
      isAdmin: decoded.isAdmin || decoded.role === "admin"
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    
    res.status(500).json({ error: "Server error during authentication" });
  }
};

export default authMiddleware;

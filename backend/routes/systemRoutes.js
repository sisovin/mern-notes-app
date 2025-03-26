import express from "express";
import { getRedisStatus } from "../config/redisClient.js";
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkPermission } from "../middleware/checkPermissionMiddleware.js";

const router = express.Router();

// Basic health check - public
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// System status - admin only
router.get(
  "/status",
  authMiddleware,
  checkPermission("manage_system"),
  async (req, res) => {
    try {
      // Database status
      const dbStatus = {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || "unknown",
        name: mongoose.connection.name || "unknown",
        models: Object.keys(mongoose.models),
      };

      // Redis status
      const redisStatus = getRedisStatus();

      // Token counts
      let tokenStats = { total: 0, active: 0, errors: null };
      try {
        if (dbStatus.connected && mongoose.models.Token) {
          const Token = mongoose.models.Token;
          const total = await Token.countDocuments();
          const active = await Token.countDocuments({
            isRevoked: false,
            expiresAt: { $gt: new Date() },
          });
          tokenStats = { total, active };
        }
      } catch (dbError) {
        tokenStats.errors = dbError.message;
      }

      // Return complete status
      res.json({
        database: dbStatus,
        redis: redisStatus,
        tokens: tokenStats,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
        },
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

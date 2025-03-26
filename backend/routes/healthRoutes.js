import express from "express";
import mongoose from "mongoose";
import redisClient from "../config/redisClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1;

    // Check Redis connection
    let redisStatus = false;
    try {
      if (redisClient) {
        await redisClient.ping();
        redisStatus = true;
      }
    } catch (redisError) {
      console.error("Redis health check failed:", redisError);
    }

    const allServicesOk = dbStatus && redisStatus;

    res.json({
      status: allServicesOk ? "ok" : "degraded",
      timestamp: new Date(),
      services: {
        api: true, // API is responding, so it's up
        database: dbStatus,
        redis: redisStatus,
      },
      message: allServicesOk
        ? "All systems operational"
        : "Some services are experiencing issues",
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
    });
  }
});

export default router;

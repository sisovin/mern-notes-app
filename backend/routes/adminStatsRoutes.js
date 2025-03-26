import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminStatsController from "../controllers/adminStatsController.js";

const router = express.Router();

// Route to get admin statistics
router.get("/stats", authMiddleware, adminStatsController);

// Export the router
export default router;
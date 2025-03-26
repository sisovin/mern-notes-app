import express from 'express';
import {
  signUp,
  login,
  logout,
  refreshToken,
  checkPermission,
  checkStatus,
  getCurrentUser,
  consolidateToken,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// === Create Section === //
router.post('/signup', signUp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
// Add this route to your existing routes
router.post("/consolidate-token", consolidateToken);

// === Read Section === //
router.get('/check-permission', authMiddleware, checkPermission);

// Add this to your backend/routes/authRoutes.js
router.get("/check-status", authMiddleware, checkStatus);

// auth/me
router.get("/me", authMiddleware, getCurrentUser);


export default router;
import "./config/loadEnv.js";
import checkEnvironmentVariables from "./config/envCheck.js";
import { waitForConnection, checkDatabaseStatus } from "./config/checkDbStatus.js"; 
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import notesRoutes from "./routes/notesRoutes.js";
import noteDetailsRoutes from "./routes/noteDetailsRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import tagsRoutes from "./routes/tagsRoutes.js";
import adminRoutes from "./routes/adminStatsRoutes.js";
import permissionsRoutes from "./routes/permissionsRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// Check environment variables right away
const { hasErrors } = checkEnvironmentVariables();
if (hasErrors) {
  console.error("Environment variable check failed. Exiting...");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.50.131:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with database status
/* app.get("/api/health", (req, res) => {
  const dbStatus = checkDatabaseStatus();
  
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    database: dbStatus,
  });
}); */

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log("Connecting to MongoDB database...");
    global.dbConnection = await connectDB();
    console.log("Database connection established successfully");

    // Only register API routes after successful DB connection
    app.use("/api/auth", authRoutes);
    app.use("/api/notes", notesRoutes);
    app.use("/api/roles", roleRoutes);
    app.use("/api/users", usersRoutes);
    app.use("/api/system", systemRoutes);
    app.use("/api", noteDetailsRoutes);
    app.use("/api/tags", tagsRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/permissions", permissionsRoutes);
    app.use("/api/health", healthRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error("Express error handler:", err);
      res.status(500).json({
        error: "Server error",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
      });
    });

    // Handle 404 errors
    app.use((req, res) => {
      res.status(404).json({
        error: "Not Found",
        path: req.originalUrl,
      });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `API health check available at: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down gracefully.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully.");
  process.exit(0);
});

// Uncaught exception handler
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error("Reason:", reason);
  process.exit(1);
});

// Start the application
startServer();

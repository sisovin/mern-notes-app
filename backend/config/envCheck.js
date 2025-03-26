import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in parent directory
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Warning: .env file not found at ${envPath}`);
  dotenv.config(); // Try default .env loading
}

const checkEnvironmentVariables = () => {
  console.log("\n[Environment Variables Check]");

  // Required environment variables
  const requiredVars = [
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "MONGODB_URI",
  ];

  let hasErrors = false;

  // Check each required variable
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} is defined`);
    }
  });

  // Check for token secret consistency
  if (process.env.JWT_SECRET && process.env.ACCESS_TOKEN_SECRET) {
    if (process.env.JWT_SECRET !== process.env.ACCESS_TOKEN_SECRET) {
      console.warn(
        "⚠️ Warning: JWT_SECRET and ACCESS_TOKEN_SECRET have different values."
      );
      console.warn(
        "   This could cause authentication issues if both are used in different parts of the code."
      );
    } else {
      console.log("✅ JWT_SECRET and ACCESS_TOKEN_SECRET match");
    }
  }

  // Check MongoDB connection string format
  if (process.env.MONGODB_URI) {
    if (
      !process.env.MONGODB_URI.startsWith("mongodb://") &&
      !process.env.MONGODB_URI.startsWith("mongodb+srv://")
    ) {
      console.warn(
        "⚠️ Warning: MONGODB_URI does not appear to be a valid MongoDB connection string"
      );
      console.warn(`   Current value: ${process.env.MONGODB_URI}`);
      hasErrors = true;
    } else {
      // Quick test connection to MongoDB
      const testMongoConnection = async () => {
        const mongooseOptions = {
          serverSelectionTimeoutMS: 5000, // 5 seconds
          connectTimeoutMS: 5000, // 5 seconds
        };

        try {
          // Create a temporary connection without affecting the main app
          const tempConnection = mongoose.createConnection();
          await tempConnection.openUri(
            process.env.MONGODB_URI,
            mongooseOptions
          );
          console.log("✅ MongoDB connection test successful");
          await tempConnection.close();
        } catch (error) {
          console.error("❌ MongoDB connection test failed:", error.message);
          hasErrors = true;
        }
      };

      // Only run test in development to avoid slowing down startup in production
      if (process.env.NODE_ENV === "development") {
        testMongoConnection().catch(console.error);
      }
    }
  }

  if (hasErrors) {
    console.error(
      "\n❌ Environment variables check failed. Please fix the issues above before continuing."
    );

    // In production, exit the process
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting process due to missing environment variables.");
      process.exit(1);
    }
  } else {
    console.log("\n✅ All required environment variables are defined.");
  }

  console.log(); // Add a blank line for readability

  return { hasErrors };
};

export default checkEnvironmentVariables;

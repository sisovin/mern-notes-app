import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load environment variables from .env file
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Warning: .env file not found at ${envPath}`);
  dotenv.config(); // Try default .env loading
}

const connectDB = async () => {
  try {
    // Check if MongoDB URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables! " +
          "Please check your .env file."
      );
    }

    // Log connection attempt
    console.log(
      `Connecting to MongoDB at: ${process.env.MONGODB_URI.split(
        "@"
      )[0].replace(/:([^:@]+)@/, ":****@")}`
    );

    // Configure mongoose
    mongoose.set("strictQuery", false);

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (error.name === "MongoServerSelectionError") {
      console.error("Could not connect to MongoDB server. Please check:");
      console.error("1. Is MongoDB running?");
      console.error("2. Is the connection string correct?");
      console.error("3. Is there network access to the database?");
    }
    throw error; // Re-throw for handling by the caller
  }
};

export default connectDB;

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .env file (one level up from this file)
const envPath = path.resolve(__dirname, "..", ".env");

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error(`⚠️ .env file not found at: ${envPath}`);
  console.log("Creating a sample .env file...");

  const sampleEnv = `PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/notesdb
ACCESS_TOKEN_SECRET=2aaea20268652f58fd65d46c17b0aad41461a16bd2b40aafdc832ca854e4ddc00bf02212f58ee241dd57cb1a55eb72c7da898f9682097371502076e75b4a70bc
REFRESH_TOKEN_SECRET=ef9d463eadac569e1e49e981469c5ee9c8236a6e1210457e7c81cef567528acb2391be79385a909e10987334511474ba3b9e214fc9bf58d5011dd4e7d7fc87e0
JWT_SECRET=2aaea20268652f58fd65d46c17b0aad41461a16bd2b40aafdc832ca854e4ddc00bf02212f58ee241dd57cb1a55eb72c7da898f9682097371502076e75b4a70bc
NODE_ENV=development
`;

  try {
    fs.writeFileSync(envPath, sampleEnv);
    console.log(`✅ Sample .env file created at ${envPath}`);
    console.log(
      "⚠️ Please update the values in the .env file with your actual configuration"
    );
  } catch (err) {
    console.error(`❌ Failed to create sample .env file: ${err.message}`);
  }
}

// Load .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
} else {
  console.log(`✅ Environment variables loaded from: ${envPath}`);

  // Verify critical variables
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in the .env file");
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.error("❌ ACCESS_TOKEN_SECRET is not defined in the .env file");
  }
}

export default result;

import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

// Create Redis client
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client if not already connected
 * @returns {Promise<Object|null>} Redis client or null if not configured
 */
const initRedisClient = async () => {
  // If already initialized and connected, return existing client
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    if (process.env.UPSTASH_REDIS_URL) {
      console.log("Initializing Redis client...");

      // Create new client
      redisClient = redis.createClient({
        url: process.env.UPSTASH_REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            const delay = Math.min(retries * 50, 500);
            return delay;
          },
        },
      });

      // Set up event handlers for better error handling
      redisClient.on("error", (err) => {
        console.error("Redis client error:", err);
        isConnected = false;
      });

      redisClient.on("connect", () => {
        console.log("Redis client connected");
        isConnected = true;
      });

      redisClient.on("reconnecting", () => {
        console.log("Redis client reconnecting...");
      });

      redisClient.on("end", () => {
        console.log("Redis client connection closed");
        isConnected = false;
      });

      // Connect to Redis
      await redisClient.connect();
      console.log("Redis client initialized successfully");
      return redisClient;
    } else {
      console.log("UPSTASH_REDIS_URL not set, Redis features disabled");
      return null;
    }
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return null;
  }
};

// Initialize on module load but don't block
initRedisClient().catch(console.error);

/**
 * Get the current Redis client status
 * @returns {Object} Status information including connection state
 */
const getRedisStatus = () => {
  return {
    initialized: !!redisClient,
    connected: isConnected,
    url: process.env.UPSTASH_REDIS_URL
      ? process.env.UPSTASH_REDIS_URL.replace(/:([^:@]+)@/, ":****@")
      : null,
  };
};

export { redisClient, initRedisClient, getRedisStatus, isConnected };
export default redisClient;

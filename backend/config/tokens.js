import { redisClient, isConnected, initRedisClient } from "./redisClient.js";
import mongoose from "mongoose";

/**
 * Check if a token exists in both database and Redis
 * @param {string} tokenId - The token ID to validate
 * @returns {Promise<Object>} Results of token validation
 */
export const consolidateToken = async (tokenId) => {
  if (!tokenId) {
    console.error("No token ID provided for consolidation");
    return { dbToken: null, redisToken: null, match: null };
  }

  let dbToken = null;
  let redisToken = null;
  let match = null;

  try {
    // Ensure database is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn("Database not connected when checking token");
      return {
        dbToken: null,
        redisToken: null,
        match: null,
        status: "db_not_connected",
      };
    }

    // Check if Token model is available and get a reference to it
    const Token = mongoose.models.Token || mongoose.model("Token");
    if (!Token) {
      console.error("Token model not found or not registered");
      return {
        dbToken: null,
        redisToken: null,
        match: null,
        status: "model_not_found",
      };
    }

    // Try to get token from database with timeout protection
    try {
      const tokenFromDB = await Token.findById(tokenId).maxTimeMS(5000);

      if (tokenFromDB) {
        dbToken = {
          id: tokenFromDB._id.toString(),
          source: "database",
          type: tokenFromDB.type || "unknown",
          isRevoked: tokenFromDB.isRevoked || false,
          expiresAt: tokenFromDB.expiresAt || null,
        };

        console.log(`Token found in database. ID: ${tokenId}`);
      } else {
        console.log(`Token not found in database. ID: ${tokenId}`);
      }
    } catch (dbError) {
      console.error("Database error when finding token:", dbError);
      // Continue execution - we'll just use Redis if available
    }

    // Try to get token from Redis
    try {
      // Make sure Redis client is initialized
      const redisReady = await initRedisClient();

      if (redisReady && isConnected) {
        try {
          // Using Redis GET operation
          const tokenFromRedis = await redisClient.get(tokenId);

          if (tokenFromRedis) {
            redisToken = {
              id: tokenId,
              source: "redis",
              value: tokenFromRedis,
            };
            console.log(`Token found in Redis. ID: ${tokenId}`);
          } else {
            console.log(`Token not found in Redis. ID: ${tokenId}`);
          }
        } catch (redisError) {
          console.error("Redis error when finding token:", redisError);
        }
      } else {
        console.log("Redis client not available or not connected");
      }
    } catch (redisInitError) {
      console.error("Failed to initialize Redis client:", redisInitError);
    }

    // Compare tokens if both sources provided data
    match = dbToken && redisToken ? dbToken.id === redisToken.id : null;

    if (match === true) {
      console.log(`Token matching successful. ID: ${tokenId}`);
    } else if (match === false) {
      console.log(`Token mismatch between database and Redis. ID: ${tokenId}`);
    } else {
      console.log(`Token consolidation indeterminate. ID: ${tokenId}`);
    }

    return {
      dbToken,
      redisToken,
      match,
      status: "completed",
    };
  } catch (error) {
    console.error("Error in consolidateToken:", error);
    return {
      dbToken: null,
      redisToken: null,
      match: null,
      error,
      status: "error",
    };
  }
};

/**
 * Blacklist a token by adding it to Redis
 * @param {string} token - The token to blacklist
 * @param {number} expirationSeconds - How long to keep in blacklist (default: 24 hours)
 * @returns {Promise<boolean>} Success status
 */
export const blacklistToken = async (token, expirationSeconds = 86400) => {
  try {
    // Initialize Redis if needed
    const redisReady = await initRedisClient();

    if (!redisReady || !isConnected) {
      console.warn("Redis not available, token blacklisting skipped");
      return false;
    }

    // Add to blacklist with blacklist: prefix
    await redisClient.set(`blacklist:${token}`, "1", {
      EX: expirationSeconds,
    });

    console.log(
      `Token blacklisted successfully. Expires in ${expirationSeconds}s`
    );
    return true;
  } catch (error) {
    console.error("Failed to blacklist token:", error);
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - Token to check
 * @returns {Promise<boolean>} Whether token is blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  try {
    // Initialize Redis if needed
    const redisReady = await initRedisClient();

    if (!redisReady || !isConnected) {
      // Without Redis, we can't check blacklist, so assume it's not blacklisted
      console.warn("Redis not available, skipping blacklist check");
      return false;
    }

    const value = await redisClient.get(`blacklist:${token}`);
    return value !== null;
  } catch (error) {
    console.error("Error checking blacklisted token:", error);
    return false;
  }
};

export default {
  consolidateToken,
  blacklistToken,
  isTokenBlacklisted,
};

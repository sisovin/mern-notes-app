import mongoose from "mongoose";

/**
 * Check MongoDB connection status
 * @returns {Object} Connection status information
 */
export const checkDatabaseStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };

  const readyState = mongoose.connection.readyState;

  return {
    status: states[readyState] || "unknown",
    readyState,
    connected: readyState === 1,
    host: mongoose.connection.host || "none",
    name: mongoose.connection.name || "none",
  };
};

/**
 * Wait for database connection to be established
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if connected, false if timed out
 */
export const waitForConnection = async (timeoutMs = 10000) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  return new Promise((resolve) => {
    const checkInterval = 100;
    let elapsed = 0;

    const intervalId = setInterval(() => {
      elapsed += checkInterval;

      if (mongoose.connection.readyState === 1) {
        clearInterval(intervalId);
        resolve(true);
      } else if (elapsed >= timeoutMs) {
        clearInterval(intervalId);
        resolve(false);
      }
    }, checkInterval);
  });
};

export default {
  checkDatabaseStatus,
  waitForConnection,
};

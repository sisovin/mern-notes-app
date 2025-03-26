import mongoose from "mongoose";

/**
 * Middleware to validate that a route parameter is a valid MongoDB ObjectId
 * @param {string} paramName - The parameter name to validate (defaults to 'id')
 * @returns {Function} Express middleware
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      return res.status(400).json({
        error: "Missing parameter",
        details: `The ${paramName} parameter is required`,
      });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(paramValue)) {
      return res.status(400).json({
        error: "Invalid ID format",
        details: `The ${paramName} parameter must be a valid MongoDB ObjectId`,
      });
    }

    // If valid, continue
    next();
  };
};

export default validateObjectId;

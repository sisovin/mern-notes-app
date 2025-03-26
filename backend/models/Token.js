import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["access", "refresh"],
      default: "refresh",
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Remove the index: true to avoid duplicate
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster lookups
tokenSchema.index({ user: 1, type: 1 });
tokenSchema.index({ token: 1 });

// Auto remove expired tokens after 30 days
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Token = mongoose.model("Token", tokenSchema);

export default Token;

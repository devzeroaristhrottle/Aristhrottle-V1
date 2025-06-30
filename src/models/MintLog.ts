import mongoose from "mongoose";

const MintLogSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tokenAmount: {
      type: String, // Store the actual ethers.parseUnits value as string
      required: true,
    },
    transactionHash: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    reason: {
      type: String,
      enum: ["vote_reward", "upload_reward", "milestone_reward", "vote_received", "referral_reward", "other"],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.MintLog || mongoose.model("MintLog", MintLogSchema); 
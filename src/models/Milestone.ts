import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema(
  {
    milestone: Number,
    reward: Number,
    is_claimed: { type: Boolean, default: false },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    type: {
      type: String,
      enum: ["vote", "vote-total", "referral", "upload", "upload-total"],
    },
    transaction_hash: { type: String },
    claiming_in_progress: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.models.Milestone ||
  mongoose.model("Milestone", MilestoneSchema);

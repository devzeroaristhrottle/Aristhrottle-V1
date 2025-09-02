import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    meme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meme",
      required: true,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "inappropriate_content",
        "spam",
        "harassment",
        "copyright_violation",
        "violence",
        "hate_speech",
        "misinformation",
        "other"
      ],
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    admin_action: {
      type: String,
      enum: ["none", "meme_deleted", "warning_issued", "user_suspended"],
      default: "none",
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin_notes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    resolved_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ReportSchema.index({ meme: 1, reported_by: 1 }, { unique: true }); // Prevent duplicate reports from same user for same meme
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);

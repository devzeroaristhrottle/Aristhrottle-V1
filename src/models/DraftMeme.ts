import mongoose from "mongoose";

const DraftMemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    image_url: {
      type: String,
      trim: true,
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Tags",
      default: [],
    },
    raw_tags: {
      type: [String], // Store raw tag strings before they're converted to IDs
      default: [],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Additional draft-specific fields
    last_edited: {
      type: Date,
      default: Date.now,
    },
    is_published: {
      type: Boolean,
      default: false,
    },
    draft_data: {
      type: mongoose.Schema.Types.Mixed, // For any additional draft data
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DraftMeme || mongoose.model("DraftMeme", DraftMemeSchema); 
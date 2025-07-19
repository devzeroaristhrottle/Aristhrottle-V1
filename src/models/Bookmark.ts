import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meme",
      required: true,
    },
    bookmarkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure unique user-meme combinations
BookmarkSchema.index({ user: 1, meme: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema); 
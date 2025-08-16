import mongoose from "mongoose";

const VoteRatingSchema = new mongoose.Schema(
  {
    meme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meme",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only rate a meme once
VoteRatingSchema.index({ meme_id: 1, user_id: 1 }, { unique: true });

export default mongoose.models.VoteRating || mongoose.model("VoteRating", VoteRatingSchema); 
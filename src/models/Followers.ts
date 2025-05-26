import mongoose from "mongoose";

const FollowersSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can't follow another user more than once
FollowersSchema.index({ follower: 1, following: 1 }, { unique: true });

export default mongoose.models.Followers || mongoose.model("Followers", FollowersSchema); 
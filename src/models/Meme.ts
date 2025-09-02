import mongoose from "mongoose";

const MemeSchema = new mongoose.Schema(
  {
    vote_count: {
      type: Number,
      require: true,
    },
    name: {
      type: String,
      require: true,
      trim: true,
    },
    image_url: {
      type: String,
      require: true,
      trim: true,
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Tags",
      require: true,
    },
    categories: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Categories",
      require: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    winning_number: {
      type: Number,
    },
    all_time_winning_number: {
      type: Number,
    },
    in_percentile: {
      type: Number,
    },
    is_voting_close: {
      type: Boolean,
    },
    voting_days: {
      type: Number,
    },
    is_claimed: {
      type: Boolean,
    },
    is_onchain: {
      type: Boolean,
    },
    upvotes_count: {
      type: Number,
      default: 0,
    },
    downvotes_count: {
      type: Number,
      default: 0,
    },
    shares: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    bookmarks: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Meme || mongoose.model("Meme", MemeSchema);

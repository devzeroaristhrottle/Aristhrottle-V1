import mongoose from "mongoose";

const TagsSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      require: true,
    },
    vote_count: {
      type: Number,
      default: 0,
    },
    share_count: {
      type: Number,
      default: 0,
    },
    upload_count: {
      type: Number,
      default: 0,
    },
    search_count: {
      type: Number,
      default: 0,
    },
    bookmark_count: {
      type: Number,
      default: 0,
    },
    relevance: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      require: true,
      trim: true,
      unique: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate relevance score
TagsSchema.pre('save', function(next) {
  this.relevance = (2 * this.vote_count) + (3 * this.share_count) + (1 * this.upload_count) + (1 * this.search_count) + (3 * this.bookmark_count);
  next();
});

export default mongoose.models.Tags || mongoose.model("Tags", TagsSchema);

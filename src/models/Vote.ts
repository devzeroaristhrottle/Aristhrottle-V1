import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    vote_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    vote_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meme",
      require: true,
    },
    is_claimed: {
      type: Boolean,
    },
    is_onchain: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Vote || mongoose.model("Vote", VoteSchema);

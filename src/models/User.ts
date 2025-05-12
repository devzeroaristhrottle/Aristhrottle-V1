import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    user_wallet_address: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    refer_code: {
      type: String,
      index: { unique: true, sparse: true },
      trim: true,
    },
    referred_by: {
      type: String,
      trim: true,
    },
    profile_pic: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Tags",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

import mongoose from "mongoose";

const ReferralsSchema = new mongoose.Schema(
  {
    is_claimed: {
      type: Boolean,
      default: false,
    },
    refer_by: {
      type: String,
      required: true,
      trim: true,
    },
    refer_to: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Referrals ||
  mongoose.model("Referrals", ReferralsSchema);

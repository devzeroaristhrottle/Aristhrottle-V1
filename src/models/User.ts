import mongoose from "mongoose";

// Define a schema for a single interest category
const InterestCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      validate: [
        {
          validator: function(tags: string[]) {
            return tags.length <= 10;
          },
          message: "An interest category cannot have more than 10 tags"
        }
      ],
      default: []
    }
  },
  { _id: false } // Don't create _id for subdocuments
);

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
    interests: {
      type: [InterestCategorySchema],
      validate: [
        {
          validator: function(interests: any[]) {
            return interests.length <= 5;
          },
          message: "User cannot have more than 5 interest categories"
        }
      ],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

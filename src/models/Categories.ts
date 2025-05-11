import mongoose from "mongoose";

const CategoriesSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      require: true,
    },
    name: {
      type: String,
      require: true,
      trim: true,
      unique: true
    },
    type: {
      type: String,
      require: true,
      enum: ["Normal", "Seasonal", "Event"],
      default: "Normal",
      trim: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Categories || mongoose.model("Categories", CategoriesSchema);

import mongoose from "mongoose";

const tagCooccurrenceSchema = new mongoose.Schema(
  {
    tag1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tags",
      required: true,
    },
    tag2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tags",
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure uniqueness of tag pairs and optimize queries
tagCooccurrenceSchema.index({ tag1: 1, tag2: 1 }, { unique: true });

// Ensure tag1 is always lexicographically smaller than tag2 to avoid duplicate pairs
tagCooccurrenceSchema.pre("save", function (next) {
  if (this.tag1.toString() > this.tag2.toString()) {
    const temp = this.tag1;
    this.tag1 = this.tag2;
    this.tag2 = temp;
  }
  next();
});

const TagCooccurrence = mongoose.models.TagCooccurrence || mongoose.model("TagCooccurrence", tagCooccurrenceSchema);

export default TagCooccurrence; 
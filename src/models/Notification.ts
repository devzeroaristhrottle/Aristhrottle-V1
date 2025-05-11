import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    type: {
      type: String,
      enum: ["vote","rewards","upload"],
      default: "info",
    },
    isRead: { type: Boolean, default: false },
    notification_for: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

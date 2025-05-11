import mongoose from "mongoose";

const ApiLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Not required as some requests might be unauthenticated
    },
    user_wallet_address: {
      type: String,
      required: false,
    },
    ip_address: {
      type: String,
      required: true,
    },
    request_method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
    request_path: {
      type: String,
      required: true,
    },
    query_params: {
      type: String, // JSON stringified
      required: false,
    },
    body_data: {
      type: String, // JSON stringified
      required: false,
    },
    response_status: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    processing_time_ms: {
      type: Number,
      required: false,
    },
    user_agent: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

export default mongoose.models.ApiLog || mongoose.model("ApiLog", ApiLogSchema); 
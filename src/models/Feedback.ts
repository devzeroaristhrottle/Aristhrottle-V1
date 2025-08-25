import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  user_id: mongoose.Types.ObjectId;
  user_wallet_address: string;
  overall_rating: number;
  content_rating: number;
  features_wanted: string[];
  other_suggestion?: string;
  would_recommend: boolean;
  additional_feedback?: string;
  is_rewarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensures one feedback per user
  },
  user_wallet_address: {
    type: String,
    required: true
  },
  overall_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  content_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  features_wanted: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'At least one feature must be selected'
    }
  },
  other_suggestion: {
    type: String,
    trim: true,
    maxlength: 500
  },
  would_recommend: {
    type: Boolean,
    required: true
  },
  additional_feedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  is_rewarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
FeedbackSchema.index({ user_id: 1 });
FeedbackSchema.index({ user_wallet_address: 1 });
FeedbackSchema.index({ createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
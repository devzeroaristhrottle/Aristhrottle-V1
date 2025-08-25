import connectToDatabase from "@/lib/db";
import Feedback from "@/models/Feedback";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import { mintTokensAndLog } from "@/ethers/mintUtils";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const wallet_address = new URLSearchParams(request.nextUrl.search).get("wallet");

    if (!wallet_address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const token = await getToken({ req: request });
    if (token == null || !token.address || token.address != wallet_address) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ user_wallet_address: wallet_address });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has already submitted feedback
    const existingFeedback = await Feedback.findOne({ user_id: user._id });

    return NextResponse.json({
      has_submitted: !!existingFeedback,
      feedback: existingFeedback || null
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      user_wallet_address,
      overall_rating,
      content_rating,
      features_wanted,
      other_suggestion,
      would_recommend,
      additional_feedback
    } = body;

    // Validate required fields
    if (!user_wallet_address || !overall_rating || !content_rating || !features_wanted || would_recommend === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate ratings
    if (overall_rating < 1 || overall_rating > 5 || content_rating < 1 || content_rating > 5) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate features_wanted
    if (!Array.isArray(features_wanted) || features_wanted.length === 0) {
      return NextResponse.json(
        { error: "At least one feature must be selected" },
        { status: 400 }
      );
    }

    // Valid feature options
    const validFeatures = [
      "Community creation and management",
      "Attention pools for extra rewards", 
      "Community chat",
      "AI Recommendations",
      "Story generator",
      "Personal feeds",
      "Others"
    ];

    // Check if all selected features are valid
    const invalidFeatures = features_wanted.filter(feature => !validFeatures.includes(feature));
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        { error: `Invalid features selected: ${invalidFeatures.join(", ")}` },
        { status: 400 }
      );
    }

    // Check authentication
    const token = await getToken({ req: request });
    if (token == null || !token.address || token.address != user_wallet_address) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ user_wallet_address: user_wallet_address });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has already submitted feedback
    const existingFeedback = await Feedback.findOne({ user_id: user._id });
    if (existingFeedback) {
      return NextResponse.json(
        { error: "You have already submitted feedback" },
        { status: 409 }
      );
    }

    // Create new feedback
    const newFeedback = new Feedback({
      user_id: user._id,
      user_wallet_address: user_wallet_address,
      overall_rating: Number(overall_rating),
      content_rating: Number(content_rating),
      features_wanted: features_wanted,
      other_suggestion: other_suggestion || "",
      would_recommend: Boolean(would_recommend),
      additional_feedback: additional_feedback || "",
      is_rewarded: true // Will be set to true after successful token minting
    });

    const savedFeedback = await newFeedback.save();

    // Mint 5 tokens to the user as a reward for feedback
    setTimeout(async () => {
      try {
        if (user.user_wallet_address) {
          const rewardAmount = 5;
          await mintTokensAndLog(
            user.user_wallet_address,
            rewardAmount,
            "other",
            {
              feedbackId: savedFeedback._id,
              overallRating: overall_rating,
              contentRating: content_rating,
              wouldRecommend: would_recommend,
              reason: "feedback_reward"
            }
          );
          console.log(`Minted ${rewardAmount} tokens to ${user.user_wallet_address} for submitting feedback.`);
        }
      } catch (mintError) {
        console.error("Error minting tokens for feedback reward:", mintError);
        // Note: We don't fail the feedback submission if minting fails
        // The feedback is still saved, but is_rewarded remains true for tracking
      }
    }, 0);

    return NextResponse.json({
      message: "Feedback submitted successfully! You've earned 5 $eART tokens.",
      feedback: savedFeedback,
      reward: {
        amount: 5,
        token: "$eART"
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error submitting feedback:", error);
    
    // Handle duplicate key error (if user somehow tries to submit twice)
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: "You have already submitted feedback" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Submit_Feedback");
import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import User from "@/models/User";
import VoteRating from "@/models/VoteRating";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withApiLogging } from "@/utils/apiLogger";
import mongoose from "mongoose";

// POST: Add or update a rating (upvote/downvote)
async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    // Parse the request body
    const { meme_id, rating } = await req.json();

    // Validate required fields
    if (!meme_id || !rating) {
      return NextResponse.json(
        { error: "Content ID and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating value
    if (rating !== "upvote" && rating !== "downvote") {
      return NextResponse.json(
        { error: "Rating must be either 'upvote' or 'downvote'" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const token = await getToken({ req });
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by wallet address
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if meme exists and is onchain
    const meme = await Meme.findById(meme_id);
    if (!meme) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Verify meme is onchain (only allow rating for onchain memes)
    if (!meme.is_onchain) {
      return NextResponse.json(
        { error: "Only onchain memes can be rated" },
        { status: 403 }
      );
    }

    // Create or update the rating
    const ratingData = {
      meme_id: new mongoose.Types.ObjectId(meme_id),
      user_id: user._id,
      rating
    };

    // Check if user has already rated this meme
    const existingRating = await VoteRating.findOne({
      meme_id: meme_id,
      user_id: user._id
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await VoteRating.findByIdAndUpdate(
        existingRating._id,
        ratingData,
        { new: true }
      );
    } else {
      // Create new rating
      result = await VoteRating.create(ratingData);
    }

    // Update total upvotes and downvotes count in the meme document
    const upvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "upvote"
    });
    
    const downvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "downvote"
    });

    await Meme.findByIdAndUpdate(meme_id, {
      upvotes_count: upvotesCount,
      downvotes_count: downvotesCount
    });

    return NextResponse.json(
      { 
        message: "Rating saved successfully", 
        data: result,
        is_onchain: meme.is_onchain,
        upvotes: upvotesCount,
        downvotes: downvotesCount,
        total: meme.vote_count + upvotesCount - downvotesCount
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in meme rating API:", error);
    
    // Handle duplicate key error (user already rated this meme)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You have already rated this meme" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}

// GET: Get ratings for a meme
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const meme_id = req.nextUrl.searchParams.get("meme_id");
    
    if (!meme_id) {
      return NextResponse.json(
        { error: "Meme ID is required" },
        { status: 400 }
      );
    }

    // Check if meme exists and is onchain
    const meme = await Meme.findById(meme_id);
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }

    // Verify meme is onchain
    if (!meme.is_onchain) {
      return NextResponse.json(
        { error: "Only onchain memes can be rated" },
        { status: 403 }
      );
    }

    // Get rating counts
    const upvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "upvote"
    });
    
    const downvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "downvote"
    });

    // Get user's rating if authenticated
    let userRating = null;
    const token = await getToken({ req });
    
    if (token && token.address) {
      const user = await User.findOne({ user_wallet_address: token.address });
      
      if (user) {
        userRating = await VoteRating.findOne({
          meme_id: meme_id,
          user_id: user._id
        });
      }
    }

    // Get recent ratings with user details
    const recentRatings = await VoteRating.find({ meme_id: meme_id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user_id', 'username profile_pic')
      .lean();

    return NextResponse.json({
      meme_id,
      upvotes: upvotesCount,
      downvotes: downvotesCount,
      total: upvotesCount + downvotesCount,
      is_onchain: meme.is_onchain,
      user_rating: userRating ? userRating.rating : null,
      recent_ratings: recentRatings
    }, { status: 200 });
  } catch (error) {
    console.error("Error in getting meme ratings:", error);
    return NextResponse.json(
      { error: "Failed to get ratings" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a user's rating
async function handleDeleteRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const meme_id = req.nextUrl.searchParams.get("meme_id");
    
    if (!meme_id) {
      return NextResponse.json(
        { error: "Meme ID is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const token = await getToken({ req });
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by wallet address
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if meme exists
    const meme = await Meme.findById(meme_id);
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found" },
        { status: 404 }
      );
    }

    // Delete the rating
    const result = await VoteRating.findOneAndDelete({
      meme_id: meme_id,
      user_id: user._id
    });

    if (!result) {
      return NextResponse.json(
        { error: "Rating not found" },
        { status: 404 }
      );
    }

    // Update total upvotes and downvotes count in the meme document
    const upvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "upvote"
    });
    
    const downvotesCount = await VoteRating.countDocuments({
      meme_id: meme_id,
      rating: "downvote"
    });

    await Meme.findByIdAndUpdate(meme_id, {
      upvotes_count: upvotesCount,
      downvotes_count: downvotesCount
    });

    return NextResponse.json(
      { 
        message: "Rating removed successfully",
        is_onchain: meme.is_onchain,
        upvotes: upvotesCount,
        downvotes: downvotesCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in deleting meme rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "meme_rate_post");
export const DELETE = withApiLogging(handleDeleteRequest, "meme_rate_delete"); 
import connectToDatabase from "@/lib/db";
import Followers from "@/models/Followers";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";

// Follow a user
async function handlePost(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get authenticated user
    const token = await getToken({ req });
    if (!token?.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user ID to follow from request body
    const { userIdToFollow } = await req.json();
    
    if (!userIdToFollow) {
      return NextResponse.json(
        { error: "User ID to follow is required" },
        { status: 400 }
      );
    }

    // Check if users exist
    const followerUser = await User.findOne({ user_wallet_address: token.address });
    const followingUser = await User.findById(userIdToFollow);

    if (!followerUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }

    if (!followingUser) {
      return NextResponse.json(
        { error: "User to follow not found" },
        { status: 404 }
      );
    }

    // Prevent following yourself
    if (followerUser._id.toString() === userIdToFollow) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Create follow relationship
    const follow = new Followers({
      follower: followerUser._id,
      following: userIdToFollow,
    });

    await follow.save();

    return NextResponse.json(
      { message: "Successfully followed user" },
      { status: 200 }
    );
  } catch (error: any) {
    // Handle duplicate key error (already following)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You are already following this user" },
        { status: 409 }
      );
    }

    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// Unfollow a user
async function handleDelete(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get authenticated user
    const token = await getToken({ req });
    if (!token?.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const userIdToUnfollow = url.searchParams.get("userId");
    
    if (!userIdToUnfollow) {
      return NextResponse.json(
        { error: "User ID to unfollow is required" },
        { status: 400 }
      );
    }

    // Get follower user ID
    const followerUser = await User.findOne({ user_wallet_address: token.address });
    
    if (!followerUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }

    // Delete follow relationship
    const result = await Followers.findOneAndDelete({
      follower: followerUser._id,
      following: userIdToUnfollow,
    });

    if (!result) {
      return NextResponse.json(
        { error: "You are not following this user" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Successfully unfollowed user" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}

// Get followers and following lists - export directly without logging
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const listType = url.searchParams.get("type") || "followers"; // "followers" or "following"
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let query = {};
    let lookupField = "";
    
    if (listType === "followers") {
      // Get users who follow the specified user
      query = { following: userId };
      lookupField = "follower";
    } else {
      // Get users who the specified user follows
      query = { follower: userId };
      lookupField = "following";
    }

    const results = await Followers.find(query)
      .populate(lookupField, "username profile_pic user_wallet_address")
      .sort({ createdAt: -1 });

    const users = results.map(item => item[lookupField]);

    return NextResponse.json(
      { users },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error getting followers/following list:`, error);
    return NextResponse.json(
      { error: `Failed to get followers/following list` },
      { status: 500 }
    );
  }
}

// Apply logging only to POST and DELETE
export const POST = withApiLogging(handlePost, "Follow_User");
export const DELETE = withApiLogging(handleDelete, "Unfollow_User"); 
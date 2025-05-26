import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Meme from "@/models/Meme";
import Followers from "@/models/Followers";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // Extract userId from the URL
    const url = new URL(req.url);
    const paths = url.pathname.split("/");
    const userId = paths[paths.length - 1];

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get follower counts
    const followersCount = await Followers.countDocuments({ following: userId });
    const followingCount = await Followers.countDocuments({ follower: userId });

    // Get user stats
    const totalUploadsCount = await Meme.countDocuments({
      created_by: userId,
    });

    const totalVotesReceived = await Meme.aggregate([
      {
        $match: {
          created_by: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: "$vote_count" },
        },
      },
    ]);

    const majorityUploads = await Meme.countDocuments({
      created_by: userId,
      in_percentile: { $gte: 51 },
    });

    return NextResponse.json({
      user,
      followersCount,
      followingCount,
      totalUploadsCount,
      totalVotesReceived: totalVotesReceived[0]?.totalVotes || 0,
      majorityUploads,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 
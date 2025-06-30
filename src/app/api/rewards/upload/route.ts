import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import Meme from "@/models/Meme";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { POINTS_MULTIPLIERS, MAJORITY_PERCENTILE_THRESHOLD } from "@/config/rewardsConfig";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const query = new URLSearchParams(req.nextUrl.search);
    const userId = query.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User id required" },
        { status: 400 }
      );
    }

    try {
      await checkIsAuthenticated(userId, req);
    } catch (authError) {
      return NextResponse.json(
        { message: "Authentication failed", error: authError instanceof Error ? authError.message : String(authError) },
        { status: 401 }
      );
    }

    // Get total uploads count
    const totalUploadMemeCount = await Meme.find({
      created_by: userId,
    }).countDocuments();

    // Get milestone details
    const milestoneDetails = await Milestone.find({
      created_by: userId,
      $or: [{ type: "upload" }, { type: "upload-total" }],
    });

    // Get unclaimed uploads
    const unClaimedUploads = await Meme.find({
      is_onchain: true,
      created_by: userId,
      is_claimed: false,
    });

    // Calculate unclaimed reward
    let unClaimedReward = 0;
    unClaimedUploads.forEach(meme => {
      unClaimedReward += meme.vote_count * POINTS_MULTIPLIERS.UPLOAD;
    });

    // Get meme IDs for blockchain claim
    const memeIds = unClaimedUploads.map(meme => 
      ethers.encodeBytes32String(meme._id.toString())
    );

    // Get majority uploads count
    const majorityUploads = await Meme.find({
      is_onchain: true,
      created_by: userId,
      in_percentile: { $gte: MAJORITY_PERCENTILE_THRESHOLD },
    }).countDocuments();

    return NextResponse.json(
      {
        totalUploadMemeCount,
        milestoneDetails,
        unClaimedMemeIds: memeIds,
        unClaimedReward,
        majorityUploads,
        voteReceived: unClaimedUploads.reduce((acc, meme) => acc + meme.vote_count, 0)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in upload rewards endpoint:", error);
    return NextResponse.json(
      { message: "Failed to retrieve upload rewards", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

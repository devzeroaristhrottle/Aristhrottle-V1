import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import Vote from "@/models/Vote";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
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

    // Get total votes count
    const totalVotesCount = await Vote.find({
      vote_by: userId,
    }).countDocuments();

    // Get majority votes count
    const majorityVotesCount = await Vote.find({
      is_onchain: true,
      vote_by: userId,
    })
      .populate("vote_by")
      .populate({
        path: "vote_to",
        match: { is_onchain: true, in_percentile: { $gte: MAJORITY_PERCENTILE_THRESHOLD } },
      })
      .countDocuments();

    // Get milestone details
    const milestoneDetails = await Milestone.find({
      created_by: userId,
      $or: [{ type: "vote" }, { type: "vote-total" }],
    });

    // Calculate points from unclaimed votes
    const unclaimedVotes = await Vote.find({
      is_onchain: true,
      is_claimed: false,
      vote_by: userId,
    })
      .populate("vote_by")
      .populate({
        path: "vote_to",
        match: { is_onchain: true },
      })
      .exec();

    // Calculate points using the multiplier
    const points = unclaimedVotes.length * POINTS_MULTIPLIERS.VOTE;

    // Get unclaimed meme IDs for blockchain claim
    const memeIds = unclaimedVotes
      .filter(vote => vote.vote_to) // Filter out votes with null vote_to
      .map(vote => ethers.encodeBytes32String(vote.vote_to._id.toString()));

    return NextResponse.json(
      {
        totalVotesCount,
        majorityVotesCount,
        milestoneDetails,
        points,
        unClaimedMemeIds: memeIds,
        unClaimedReward: points,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in votes rewards endpoint:", error);
    return NextResponse.json(
      { message: "Failed to retrieve vote rewards", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

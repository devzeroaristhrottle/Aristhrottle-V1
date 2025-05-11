import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import Meme from "@/models/Meme";
import { checkIsAuthenticated } from "@/utils/authFunctions";

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const query = new URLSearchParams(req.nextUrl.search);
  const userId = query.get("userId");

  try {
    if (!userId) {
      throw Error("User id required");
    }

    await checkIsAuthenticated(userId, req);

    // await milestoneReward(userId);

    const totalUploadMemeCount = await Meme.find({
      created_by: userId,
    }).countDocuments();

    const milestoneDetails = await Milestone.find({
      created_by: userId,
      $or: [{ type: "upload" }, { type: "upload-total" }],
    });

    // let milestoneRewardCount = 0;

    // milestoneDetails.forEach((milestone) => {

    //   if (milestone.milestone == 1) {
    //     milestoneRewardCount += 5;
    //   }
    //   if (milestone.milestone == 20) {
    //     milestoneRewardCount += 250;
    //   }
    //   if (milestone.milestone == 50) {
    //     milestoneRewardCount += 500;
    //   }
    //   if (milestone.milestone == 100) {
    //     milestoneRewardCount += 1000;
    //   }
    // });

    const memeIds: string[] = [];
    let unClaimedReward = 0;

    const unClaimedUploads = await Meme.find({
      is_onchain: true,
      created_by: userId,
      is_claimed: false,
    });

    const majorityUploads = await Meme.find({
      is_onchain: true,
      created_by: userId,
      in_percentile: { $gte: 51 },
    }).countDocuments();

    unClaimedUploads.forEach(async (meme) => {
      unClaimedReward += meme.vote_count;
      memeIds.push(ethers.encodeBytes32String(meme._id.toString()));
    });

    const result = await Meme.aggregate([
      {
        $group: {
          _id: null, // Grouping all documents
          totalVotes: { $sum: "$vote_count" }, // Summing up vote_count
        },
      },
    ]);

    // let unClaimedUploadReward = 0;

    // unClaimedUploads.forEach(async (meme) => {
    //   if (meme.in_percentile >= 10 && meme.in_percentile < 25) {
    //     unClaimedUploadReward += 1;
    //   }
    //   if (meme.in_percentile >= 25 && meme.in_percentile < 50) {
    //     unClaimedUploadReward += 2;
    //   }
    //   if (meme.in_percentile >= 50 && meme.in_percentile < 75) {
    //     unClaimedUploadReward += 20;
    //   }
    //   if (meme.in_percentile >= 75 && meme.in_percentile <= 100) {
    //     unClaimedUploadReward += 50;
    //   }
    // });

    return NextResponse.json(
      {
        totalUploadMemeCount: totalUploadMemeCount,
        milestoneDetails: milestoneDetails,
        unClaimedMemeIds: memeIds,
        unClaimedReward: unClaimedReward,
        // milestoneRewardCount: milestoneRewardCount,
        voteReceived: result[0]?.totalVotes,
        majorityUploads,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

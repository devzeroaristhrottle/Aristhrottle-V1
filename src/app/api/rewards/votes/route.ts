import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import Vote from "@/models/Vote";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
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

    const totalVotesCount = await Vote.find({
      vote_by: userId,
    }).countDocuments();

    const majorityVotesCount = await Vote.find({
      is_onchain: true,
      vote_by: userId,
    })
      .populate("vote_by")
      .populate({
        path: "vote_to",
        match: { is_onchain: true, in_percentile: { $gte: 51 } },
      })
      .countDocuments();

    const milestoneDetails = await Milestone.find({
      created_by: userId,
      $or: [{ type: "vote" }, { type: "vote-total" }],
    });

    const points = await Vote.find({
      is_onchain: true,
      is_claimed: false,
      vote_by: userId,
    })
      .populate("vote_by")
      .populate({
        path: "vote_to",
        match: { is_onchain: true },
      })
      .countDocuments();

    const now = new Date();

    // Calculate the time range: 5 AM (previous day) to 4:59 AM (current day)
    const startTime = new Date(now);
    startTime.setUTCHours(5, 0, 0, 0); // 5 AM UTC of the previous day
    startTime.setUTCDate(startTime.getUTCDate() - 1);

    const endTime = new Date(now);
    endTime.setUTCHours(4, 59, 59, 999); // 4:59:59 AM UTC of the current day

    // let milestoneRewardCount = 0;

    // milestoneDetails.forEach((milestone) => {
    //   if (milestone.milestone == 1) {
    //     milestoneRewardCount += 5;
    //   }
    //   if (milestone.milestone == 20) {
    //     milestoneRewardCount += 100;
    //   }
    //   if (milestone.milestone == 50) {
    //     milestoneRewardCount += 250;
    //   }
    //   if (milestone.milestone == 100) {
    //     milestoneRewardCount += 500;
    //   }
    // });

    const unClaimedVote = await Vote.find({
      is_onchain: true,
      vote_by: userId,
      is_claimed: false,
    })
      .populate("vote_by")
      .populate({
        path: "vote_to",
        match: { is_onchain: true},
      });

    const memeIds: string[] = [];

    unClaimedVote.forEach(async (vote) => {
      if (vote.vote_to) {
        memeIds.push(ethers.encodeBytes32String(vote.vote_to._id.toString()));
      }
    });

    return NextResponse.json(
      {
        totalVotesCount: totalVotesCount,
        majorityVotesCount: majorityVotesCount,
        milestoneDetails: milestoneDetails,
        points: points * 0.1,
        unClaimedMemeIds: memeIds,
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

// async function milestoneReward(vote_by: string) {
//   const majorityVotesCount = await Vote.find({
//     is_onchain: true,
//     vote_by: vote_by,
//   })
//     .populate("vote_by")
//     .populate({
//       path: "vote_to",
//       match: { is_onchain: true, in_percentile: { $gte: 51 } },
//     })
//     .countDocuments();

//   if (
//     majorityVotesCount == 20 ||
//     majorityVotesCount == 50 ||
//     majorityVotesCount == 100
//   ) {
//     const found = await Milestone.findOne({
//       created_by: vote_by,
//       milestone: majorityVotesCount,
//     });
//     if (found == null) {
//       const milestone = new Milestone({
//         milestone: majorityVotesCount,
//         is_claimed: false,
//         created_by: vote_by,
//       });
//       await milestone.save();
//     }
//   }
// }

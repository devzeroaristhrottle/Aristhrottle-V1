import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import Milestone from "@/models/Milestone";
import Vote from "@/models/Vote";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import axiosInstance from "@/utils/axiosInstance";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import Tags from "@/models/Tags";
import { updateTagsRelevance } from "@/utils/tagUtils";
import { generateReferralCodeIfEligible } from "@/utils/referralUtils";

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse request body
    const { vote_to, vote_by } = await request.json();

    // Validate input
    if (!vote_to || !vote_by) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(vote_by, request);

    await isLimitReached(vote_by);

    // Fetch the meme to get the creator
    const meme = await Meme.findOne({ _id: vote_to }).populate("created_by");

    if (!meme) {
      return NextResponse.json({ message: "Meme not found" }, { status: 404 });
    }

    // Prevent user from voting on their own meme
    if (meme.created_by._id.toString() === vote_by) {
      console.log("You cannot vote on your own meme");
      return NextResponse.json(
        { message: "You cannot vote on your own meme" },
        { status: 403 }
      );
    }

    // Check if the user has already voted for the same meme
    const existingVote = await Vote.findOne({ vote_to, vote_by });
    if (existingVote) {
      return NextResponse.json(
        { message: "User has already voted for this meme" },
        { status: 400 }
      );
    }

    // Create a new vote
    const newVote = new Vote({
      vote_to,
      vote_by,
      is_claimed: false,
      is_onchain: false,
    });

    await Meme.updateOne({ _id: vote_to }, { $inc: { vote_count: 1 } });

    // Increment vote_count for all tags associated with this meme
    if (meme.tags && meme.tags.length > 0) {
      await Tags.updateMany(
        { _id: { $in: meme.tags } },
        { $inc: { vote_count: 1 } }
      );
      
      // Update the relevance scores for the tags
      await updateTagsRelevance(meme.tags);
    }

    const savedVote = await newVote.save();

    // Generate a referral code for the user if they don't have one yet
    await generateReferralCodeIfEligible(vote_by);

    await axiosInstance.post("/api/notification", {
      title: "🔥 Your Meme Got a Vote!",
      message: `${meme.name} just received a new vote! People are loving it! 🎉`,
      type: "vote",
      notification_for: meme.created_by._id.toString(),
    });

    await milestoneReward(vote_by);

    return NextResponse.json({ vote: savedVote }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}

const majorityRewards = {
  10: 25,
  50: 100,
  100: 250,
  250: 500,
};

const totalRewards = {
  50: 10,
  100: 25,
  250: 75,
  500: 100,
};

async function milestoneReward(vote_by: string) {
  const voteCount = await Vote.find({
    vote_by: vote_by,
  }).countDocuments();

  if (voteCount == 1) {
    const milestone = new Milestone({
      milestone: 1,
      reward: 5,
      is_claimed: false,
      created_by: vote_by,
      type: "vote-total",
    });
    await milestone.save();
  }

  const totalVotesCount = await Vote.find({
    vote_by: vote_by,
  }).countDocuments();

  if (
    totalVotesCount == 50 ||
    totalVotesCount == 100 ||
    totalVotesCount == 250 ||
    totalVotesCount == 500
  ) {
    const found = await Milestone.findOne({
      created_by: vote_by,
      milestone: totalVotesCount,
      type: "vote-total",
    });
    if (found == null) {
      const milestone = new Milestone({
        milestone: totalRewards,
        reward: totalRewards[totalVotesCount],
        is_claimed: false,
        created_by: vote_by,
        type: "vote-total",
      });
      await milestone.save();
    }
  }

  const majorityVotesCount = await Vote.find({
    is_onchain: true,
    vote_by: vote_by,
  })
    .populate("vote_by")
    .populate({
      path: "vote_to",
      match: { is_onchain: true, in_percentile: { $gte: 51 } },
    })
    .countDocuments();

  if (
    majorityVotesCount == 10 ||
    majorityVotesCount == 50 ||
    majorityVotesCount == 100 ||
    majorityVotesCount == 250
  ) {
    const found = await Milestone.findOne({
      created_by: vote_by,
      milestone: majorityVotesCount,
      type: "vote",
    });
    if (found == null) {
      const milestone = new Milestone({
        milestone: majorityRewards,
        reward: majorityRewards[majorityVotesCount],
        is_claimed: false,
        created_by: vote_by,
        type: "vote",
      });
      await milestone.save();
    }
  }
}

async function isLimitReached(vote_by: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0); // Set to the start of the day (UTC)

  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999); // Set to the end of the day (UTC)

  const votes = await Vote.find({
    vote_by: vote_by,
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  if (votes.length >= 20) {
    throw "Daily vote limit reached";
  }
}

export const POST = withApiLogging(handlePostRequest, "Vote_Meme");

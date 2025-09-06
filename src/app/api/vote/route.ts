import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import Vote from "@/models/Vote";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import axiosInstance from "@/utils/axiosInstance";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import Tags from "@/models/Tags";
import { updateTagsRelevance } from "@/utils/tagUtils";
import { generateReferralCodeIfEligible } from "@/utils/referralUtils";
import User from "@/models/User";
import { 
  MAJORITY_PERCENTILE_THRESHOLD,
  DAILY_LIMITS
} from "@/config/rewardsConfig";
import { processActivityMilestones } from "@/utils/milestoneUtils";
import { mintTokensAndLog } from "@/ethers/mintUtils";

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
      return NextResponse.json({ message: "Content not found" }, { status: 404 });
    }

    // Prevent user from voting on their own meme
    if (meme.created_by._id.toString() === vote_by) {
      console.log("You cannot vote on your own content");
      return NextResponse.json(
        { message: "You cannot vote on your own content" },
        { status: 403 }
      );
    }

    // Check if the user has already voted for the same meme
    const existingVote = await Vote.findOne({ vote_to, vote_by });
    if (existingVote) {
      return NextResponse.json(
        { message: "User has already voted for this content" },
        { status: 400 }
      );
    }

    // Create a new vote
    const newVote = new Vote({
      vote_to,
      vote_by,
      is_claimed: true,
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

    // Get voter and creator wallet addresses for token rewards
    const voter = await User.findById(vote_by);
    const creator = meme.created_by;

    // Process token rewards using our new utility function
    setTimeout(async () => {
      try {
        // Mint tokens to the meme creator
        if (creator && creator.user_wallet_address) {
          // Calculate time difference between meme creation and vote
          const memeCreationTime = new Date(meme.createdAt).getTime();
          const currentTime = new Date().getTime();
          const timeDifference = currentTime - memeCreationTime;
          const oneDayInMillis = 24 * 60 * 60 * 1000;
          
          // If vote is within 1 day of upload, give 1 token instead of 0.25
          // const creatorAmount = timeDifference < oneDayInMillis ? 1 : 0.25;
          const creatorAmount = 1;
          
          await mintTokensAndLog(
            creator.user_wallet_address,
            creatorAmount,
            "vote_received",
            {
              memeId: meme._id,
              memeName: meme.name,
              voterId: vote_by,
              isLiveVote: timeDifference < oneDayInMillis
            }
          );
        }
        
        // Mint tokens to the voter
        if (voter && voter.user_wallet_address) {
          const voterAmount = 0.1;
          await mintTokensAndLog(
            voter.user_wallet_address,
            voterAmount,
            "vote_reward",
            {
              memeId: meme._id,
              memeName: meme.name,
              creatorId: meme.created_by._id
            }
          );
        }
      } catch (mintError) {
        console.error("Error minting tokens for vote rewards:", mintError);
      }
    }, 0);

    await axiosInstance.post("/api/notification", {
      title: "🔥 Your Content Got a Vote!",
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

async function milestoneReward(vote_by: string) {
  await processActivityMilestones(
    vote_by,
    'vote',
    Vote,
    { vote_by }, // Total votes query
    { // Majority votes query 
      is_onchain: true,
      vote_by,
      "vote_to.is_onchain": true,
      "vote_to.in_percentile": { $gte: MAJORITY_PERCENTILE_THRESHOLD }
    }
  );
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

  if (votes.length >= DAILY_LIMITS.VOTES) {
    throw "Daily vote limit reached";
  }
}

export const POST = withApiLogging(handlePostRequest, "Vote_Meme");
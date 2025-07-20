import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import User from "@/models/User"; // Explicitly import User model
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectToDatabase();

    console.log('User model:', User);

    // Verify User model is registered
    if (!mongoose.models.User) {
      throw new Error("User model is not registered");
    }

    // Define 24-hour range (for cron job at 6 AM IST)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    // Fetch unprocessed memes within time range
    const memes = await Meme.find({
      is_onchain: false,
      createdAt: { $gte: startTime, $lte: endTime },
    }).populate("created_by");

    if (!memes.length) {
      return NextResponse.json(
        { message: "No new memes to process." },
        { status: 200 }
      );
    }

    let totalVotes = 0;
    const memeIds: string[] = [];
    const userAddresses: string[] = [];
    const voteCounts: number[] = [];

    for (const meme of memes) {
      const voteCount = meme.vote_count || 0;
      memeIds.push(ethers.encodeBytes32String(meme._id.toString()));
      userAddresses.push(meme.created_by.user_wallet_address);
      voteCounts.push(voteCount);
      totalVotes += voteCount;
    }

    // Calculate percentage and rank
    const memeData = memes.map((meme) => {
      const voteCount = meme.vote_count || 0;
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
      return { meme, voteCount, percentage };
    });

    // Sort and rank
    memeData.sort((a, b) => b.percentage - a.percentage);

    const rankMap = new Map<number, number>();
    let lastPercentage: number | null = null;
    let rank = 1;

    memeData.forEach(({ percentage }, i) => {
      if (lastPercentage != null && percentage === lastPercentage) {
        rankMap.set(percentage, rank);
      } else {
        rank = i + 1;
        rankMap.set(percentage, rank);
        lastPercentage = percentage;
      }
    });

    // Create bulk operations for database update
    const bulkOps = memeData.map(({ meme, percentage }) => ({
      updateOne: {
        filter: { _id: meme._id },
        update: {
          $set: {
            in_percentile: percentage,
            winning_number: rankMap.get(percentage),
            is_voting_close: true,
            is_onchain: true // Mark as on-chain even without blockchain interaction
          },
        },
      },
    }));

    // Execute bulk update
    await Meme.bulkWrite(bulkOps);
    console.log(`Processed ${memeIds.length} memes without blockchain interaction`);

    return NextResponse.json(
      {
        memeIds,
        userAddresses,
        totalMemesProcessed: memeIds.length
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ Uncaught error:", error);
    return NextResponse.json({ error: `Internal server error. ${error}`  }, { status: 500 });
  }
}

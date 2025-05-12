import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { contract } from "@/ethers/contractUtils";

export async function POST() {
  try {
    await connectToDatabase();

    const memeIds: string[] = [];
    const userAddresses: string[] = [];
    const voteCounts: number[] = [];
    const percentages: number[] = [];
    let totalVotes = 0;

    // Set end time to 5:00 AM UTC of today (e.g., May 2)
    const endTime = new Date();
    endTime.setUTCHours(11, 30, 0, 0); // Set to 5:00 AM UTC today

    // Set start time to 5:00 AM UTC of previous day (e.g., May 1)
    const startTime = new Date(endTime);
    startTime.setUTCDate(startTime.getUTCDate() - 1); // One day before

    // Find memes that are not on-chain and created in the correct time range
    const memes = await Meme.find({
      is_onchain: false,
      createdAt: { $gte: startTime, $lte: endTime },
    }).populate("created_by");

    for (const meme of memes) {
      memeIds.push(ethers.encodeBytes32String(meme._id.toString()));
      userAddresses.push(meme.created_by.user_wallet_address);
      const memeVoteCount = meme.vote_count || 0; // Handle undefined vote_count
      voteCounts.push(memeVoteCount);
      totalVotes += memeVoteCount;
    }

    // Store meme data with computed percentage
    const memeData = memes.map((meme) => {
      const memeVoteCount = meme.vote_count || 0;
      // Handle division by zero: set percentage to 0 if totalVotes is 0
      const memePercentage = totalVotes > 0 ? (memeVoteCount / totalVotes) * 100 : 0;

      return { meme, percentage: memePercentage };
    });

    // Sort memes by percentage in descending order
    memeData.sort((a, b) => b.percentage - a.percentage);

    let rank = 1;
    let lastPercentage = null;
    const rankMap = new Map(); // Map to store rankings for each unique percentage

    for (let i = 0; i < memeData.length; i++) {
      const { percentage } = memeData[i];
      percentages.push(percentage);

      // Assign the same rank if percentage is the same as previous
      if (lastPercentage !== null && percentage === lastPercentage) {
        rankMap.set(percentage, rank); // Use the same rank
      } else {
        rank = i + 1; // New rank for a different percentage
        rankMap.set(percentage, rank);
      }

      lastPercentage = percentage;
    }

    // Update memes in MongoDB
    for (const { meme, percentage } of memeData) {
      
      await Meme.findByIdAndUpdate(meme._id, {
        in_percentile: percentage, // Now guaranteed to be a number (not NaN)
        winning_number: rankMap.get(percentage), // Get rank from map
        is_voting_close: true,
      });
    }

    if (
      memeIds.length > 0 &&
      userAddresses.length > 0 &&
      voteCounts.length > 0 &&
      memeIds.length === userAddresses.length &&
      memeIds.length === voteCounts.length
    ) {
      const tx = await contract.addUploadMemeBulk(
        memeIds,
        userAddresses,
        voteCounts
      );
      await tx.wait();
    }

    if (memes.length > 0) {
      await Meme.updateMany({ is_onchain: false }, { is_onchain: true });
    }

    return NextResponse.json(
      {
        memeIds,
        userAddresses,
        voteCounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
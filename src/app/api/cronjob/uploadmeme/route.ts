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

    // Set time range for the last 24 hours from current time
    const endTime = new Date(); // Current time: 2025-05-16 10:35 PM IST (5:05 PM UTC)
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    console.log(startTime, endTime);

    // Find memes that are not on-chain and created in the correct time range
    const memes = await Meme.find({
      is_onchain: false,
      createdAt: { $gte: startTime, $lte: endTime },
    }).populate("created_by");


    // Store meme data with computed percentage
    const memeData = memes.map((meme) => {

      memeIds.push(ethers.encodeBytes32String(meme._id.toString()));
      userAddresses.push(meme.created_by.user_wallet_address);
      const memeVoteCount = meme.vote_count || 0; // Handle undefined vote_count
      voteCounts.push(memeVoteCount);
      totalVotes += memeVoteCount;

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

    // Bulk update memes
    const bulkOps = memeData.map(({ meme, percentage }) => ({
      updateOne: {
        filter: { _id: meme._id },
        update: {
          $set: {
            in_percentile: percentage,
            winning_number: rankMap.get(percentage),
            is_voting_close: true,
            is_onchain: true,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Meme.bulkWrite(bulkOps);
    }
    
    // Smart contract interaction
    let tx = null;
    if (
      memeIds.length > 0 &&
      userAddresses.length > 0 &&
      voteCounts.length > 0 &&
      memeIds.length === userAddresses.length &&
      memeIds.length === voteCounts.length
    ) {
      try {
        tx = await contract.addUploadMemeBulk(memeIds, userAddresses, voteCounts);
        await tx.wait();
      } catch (txError) {
        throw new Error(`Failed to upload memes to blockchain: ${txError}`);
      }
    }

    return NextResponse.json(
      {
        memeIds,
        userAddresses,
        voteCounts,
        totalMemesProcessed: memes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
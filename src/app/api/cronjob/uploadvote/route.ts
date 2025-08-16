import connectToDatabase from "@/lib/db";
import Vote from "@/models/Vote";
import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function POST() {
  try {
    await connectToDatabase();

    const memeIds: string[] = [];
    const userAddresses: string[] = [];

    const votes = await Vote.find({ is_onchain: false })
      .populate("vote_to")
      .populate("vote_by");

    for (let index = 0; index < votes.length; index++) {
      const vote = votes[index];
      memeIds.push(ethers.encodeBytes32String(vote.vote_to._id.toString()));
      userAddresses.push(vote.vote_by.user_wallet_address);
    }

    // Mark votes as processed even without blockchain interaction
    if (votes.length > 0) {
      await Vote.updateMany({ is_onchain: false }, { is_onchain: true });
      console.log(`Marked ${votes.length} votes as processed without blockchain interaction`);
    }

    return NextResponse.json({ 
      memeIds, 
      userAddresses,
      processedCount: votes.length 
    }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

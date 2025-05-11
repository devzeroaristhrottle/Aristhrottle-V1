import { contract } from "@/ethers/contractUtils";
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

    if (
      memeIds.length > 0 &&
      userAddresses.length > 0 &&
      memeIds.length === userAddresses.length
    ) {
      const tx = await contract.addMemeVotesBulk(memeIds, userAddresses);
      await tx.wait();
    }

    if (votes.length > 0) {
      await Vote.updateMany({ is_onchain: false }, { is_onchain: true });
    }

    return NextResponse.json({ memeIds, userAddresses }, { status: 200 });
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

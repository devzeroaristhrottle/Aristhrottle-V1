import { contract } from "@/ethers/contractUtils";
import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const { userId, type, milestone } = await req.json();

    if (!userId || !type || !milestone) {
      return NextResponse.json(
        { message: "All filed required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, req);

    const milestoneData = await Milestone.findOne({
      created_by: userId,
      type: type,
      milestone: milestone,
      is_claimed: false,
    }).populate("created_by");

    if (milestoneData) {
      if (
        milestoneData.created_by.user_wallet_address &&
        milestoneData.reward
      ) {
        const reward = ethers.parseUnits(milestoneData.reward.toString(), 18); 
        const tx = await contract.mintCoins(
          milestoneData.created_by.user_wallet_address,
          reward
        );
        await tx.wait();

        const update = await Milestone.findOneAndUpdate(
          {
            created_by: userId,
            type: type,
            milestone: milestone,
            is_claimed: false,
          },
          { is_claimed: true }
        );
        return NextResponse.json({ update }, { status: 200 });
      } else {
        throw "Milestone not found";
      }
    } else {
      throw "Milestone not found";
    }
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

export const POST = withApiLogging(handlePostRequest, "Claim_Reward");

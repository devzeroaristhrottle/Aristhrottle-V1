import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import { mintTokensAndLog } from "@/ethers/mintUtils";

async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const { userId, type, milestone } = await req.json();

    if (!userId || !type || !milestone) {
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 }
      );
    }

    const validTypes = ["vote", "vote-total", "referral", "upload", "upload-total"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: "Invalid milestone type" },
        { status: 400 }
      );
    }

    if (isNaN(Number(milestone))) {
      return NextResponse.json(
        { message: "Milestone must be a number" },
        { status: 400 }
      );
    }

    try {
      await checkIsAuthenticated(userId, req);
    } catch (authError) {
      return NextResponse.json(
        { message: "Authentication failed", error: authError },
        { status: 401 }
      );
    }

    const milestoneData = await Milestone.findOne({
      created_by: userId,
      type: type,
      milestone: milestone,
      is_claimed: false,
    }).populate("created_by");

    if (!milestoneData) {
      return NextResponse.json(
        { message: "Milestone not found or already claimed" },
        { status: 404 }
      );
    }

    if (!milestoneData.created_by.user_wallet_address) {
      return NextResponse.json(
        { message: "User wallet address not found" },
        { status: 400 }
      );
    }

    if (!milestoneData.reward) {
      return NextResponse.json(
        { message: "No reward associated with this milestone" },
        { status: 400 }
      );
    }

    try {
      const mintResult = await mintTokensAndLog(
        milestoneData.created_by.user_wallet_address,
        milestoneData.reward,
        "milestone_reward",
        {
          milestoneId: milestoneData._id,
          milestoneType: type,
          milestoneNumber: milestone,
          userId: userId
        }
      );
      
      if (!mintResult.success) {
        throw new Error(mintResult.error || "Transaction failed");
      }

      const update = await Milestone.findOneAndUpdate(
        {
          _id: milestoneData._id,
          is_claimed: false,
        },
        { is_claimed: true },
        { new: true }
      );
      
      if (!update) {
        return NextResponse.json(
          { message: "Failed to update milestone status" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        update,
        transactionHash: mintResult.transactionHash
      }, { status: 200 });
    } catch (txError) {
      console.error("Transaction error:", txError);
      return NextResponse.json(
        { message: "Failed to process reward transaction", error: txError instanceof Error ? txError.message : String(txError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Claim reward error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to process reward claim", error: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Claim_Reward");

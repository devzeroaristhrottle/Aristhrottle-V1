import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import { mintTokensAndLog } from "@/ethers/mintUtils";
import mongoose from "mongoose";

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

    // Use findOneAndUpdate with the original query to atomically find and mark as claimed
    // This prevents race conditions by ensuring only one process can claim the milestone
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // First attempt to mark the milestone as "claiming" to lock it
      const milestoneData = await Milestone.findOneAndUpdate(
        {
          created_by: userId,
          type: type,
          milestone: milestone,
          is_claimed: false,
        },
        { $set: { claiming_in_progress: true } },
        { new: true, session }
      ).populate("created_by");

      if (!milestoneData) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "Milestone not found or already being claimed" },
          { status: 404 }
        );
      }

      if (!milestoneData.created_by.user_wallet_address) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "User wallet address not found" },
          { status: 400 }
        );
      }

      if (!milestoneData.reward) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "No reward associated with this milestone" },
          { status: 400 }
        );
      }

      // Process the transaction
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
        // Release the lock if minting fails
        await Milestone.findByIdAndUpdate(
          milestoneData._id,
          { $unset: { claiming_in_progress: 1 } },
          { session }
        );
        await session.abortTransaction();
        session.endSession();
        throw new Error(mintResult.error || "Transaction failed");
      }

      // Mark as fully claimed only if the mint was successful
      const update = await Milestone.findOneAndUpdate(
        {
          _id: milestoneData._id,
          claiming_in_progress: true,
          is_claimed: false,
        },
        { 
          is_claimed: true,
          $unset: { claiming_in_progress: 1 },
          transaction_hash: mintResult.transactionHash
        },
        { new: true, session }
      );
      
      await session.commitTransaction();
      session.endSession();
      
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
      // Make sure to abort the transaction if there's an error
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      } finally {
        session.endSession();
      }
      
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

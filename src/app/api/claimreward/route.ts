import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import { mintTokensAndLog } from "@/ethers/mintUtils";
import mongoose from "mongoose";

async function handlePostRequest(req: NextRequest) {
  console.log("🔍 [ClaimReward] Starting reward claim process");
  try {
    console.log("🔍 [ClaimReward] Connecting to database");
    await connectToDatabase();

    const requestBody = await req.json();
    console.log("🔍 [ClaimReward] Request body:", JSON.stringify(requestBody));
    
    const { userId, type, milestone } = requestBody;

    if (!userId || !type || !milestone) {
      console.log("❌ [ClaimReward] Missing required fields:", { userId, type, milestone });
      return NextResponse.json(
        { message: "All fields required" },
        { status: 400 }
      );
    }

    const validTypes = ["vote", "vote-total", "referral", "upload", "upload-total"];
    if (!validTypes.includes(type)) {
      console.log("❌ [ClaimReward] Invalid milestone type:", type);
      return NextResponse.json(
        { message: "Invalid milestone type" },
        { status: 400 }
      );
    }

    if (isNaN(Number(milestone))) {
      console.log("❌ [ClaimReward] Invalid milestone number:", milestone);
      return NextResponse.json(
        { message: "Milestone must be a number" },
        { status: 400 }
      );
    }

    try {
      console.log("🔍 [ClaimReward] Authenticating user:", userId);
      await checkIsAuthenticated(userId, req);
    } catch (authError) {
      console.error("❌ [ClaimReward] Authentication failed:", authError);
      return NextResponse.json(
        { message: "Authentication failed", error: authError },
        { status: 401 }
      );
    }

    // Use findOneAndUpdate with the original query to atomically find and mark as claimed
    // This prevents race conditions by ensuring only one process can claim the milestone
    console.log("🔍 [ClaimReward] Starting MongoDB session");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`🔍 [ClaimReward] Looking for milestone: userId=${userId}, type=${type}, milestone=${milestone}`);
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
        console.log("❌ [ClaimReward] Milestone not found or already claimed");
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "Milestone not found or already being claimed" },
          { status: 404 }
        );
      }

      console.log("✅ [ClaimReward] Found milestone:", JSON.stringify({
        id: milestoneData._id,
        type: milestoneData.type,
        milestone: milestoneData.milestone,
        reward: milestoneData.reward
      }));

      if (!milestoneData.created_by.user_wallet_address) {
        console.error("❌ [ClaimReward] User wallet address not found for user:", userId);
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "User wallet address not found" },
          { status: 400 }
        );
      }

      console.log("✅ [ClaimReward] User wallet address:", milestoneData.created_by.user_wallet_address);

      if (!milestoneData.reward) {
        console.error("❌ [ClaimReward] No reward associated with this milestone");
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { message: "No reward associated with this milestone" },
          { status: 400 }
        );
      }

      console.log(`🔍 [ClaimReward] Attempting to mint ${milestoneData.reward} tokens to ${milestoneData.created_by.user_wallet_address}`);
      
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
      
      console.log("🔍 [ClaimReward] Mint result:", JSON.stringify(mintResult));
      
      if (!mintResult.success) {
        // Release the lock if minting fails
        console.error("❌ [ClaimReward] Minting failed:", mintResult.error);
        await Milestone.findByIdAndUpdate(
          milestoneData._id,
          { $unset: { claiming_in_progress: 1 } },
          { session }
        );
        await session.abortTransaction();
        session.endSession();
        throw new Error(mintResult.error || "Transaction failed");
      }

      console.log("✅ [ClaimReward] Minting successful, updating milestone status");
      console.log("🔍 [ClaimReward] Milestone ID:", milestoneData._id);
      
      try {
        // Mark as fully claimed only if the mint was successful
        const updateResult = await Milestone.findOneAndUpdate(
          {
            _id: milestoneData._id,
            claiming_in_progress: true,
            is_claimed: false,
          },
          { 
            $set: { 
              is_claimed: true,
              transaction_hash: mintResult.transactionHash
            },
            $unset: { claiming_in_progress: 1 }
          },
          { new: true, session }
        );
        
        console.log("🔍 [ClaimReward] Update result:", updateResult ? "Success" : "No document matched update criteria");
        
        let existingMilestone = null;
        
        if (!updateResult) {
          console.error("❌ [ClaimReward] Failed to update milestone - no matching document found");
          // Check if the milestone exists at all
          existingMilestone = await Milestone.findById(milestoneData._id).session(session);
          console.log("🔍 [ClaimReward] Existing milestone state:", JSON.stringify({
            id: existingMilestone?._id,
            is_claimed: existingMilestone?.is_claimed,
            claiming_in_progress: existingMilestone?.claiming_in_progress
          }));
          
          // Try a more direct update approach as fallback
          if (existingMilestone) {
            console.log("🔍 [ClaimReward] Attempting direct update as fallback");
            existingMilestone.is_claimed = true;
            existingMilestone.transaction_hash = mintResult.transactionHash;
            if (existingMilestone.claiming_in_progress) {
              delete existingMilestone.claiming_in_progress;
            }
            await existingMilestone.save({ session });
            console.log("✅ [ClaimReward] Fallback update successful");
          }
        }
        
        console.log("🔍 [ClaimReward] Committing transaction");
        await session.commitTransaction();
        session.endSession();
        
        console.log("✅ [ClaimReward] Reward claim successful");
        return NextResponse.json({ 
          update: updateResult || existingMilestone,
          transactionHash: mintResult.transactionHash
        }, { status: 200 });
      } catch (updateError) {
        console.error("❌ [ClaimReward] Error updating milestone:", updateError);
        throw updateError;
      }
    } catch (txError) {
      // Make sure to abort the transaction if there's an error
      console.error("❌ [ClaimReward] Transaction error:", txError);
      try {
        console.log("🔍 [ClaimReward] Aborting transaction");
        await session.abortTransaction();
      } catch (abortError) {
        console.error("❌ [ClaimReward] Error aborting transaction:", abortError);
      } finally {
        session.endSession();
      }
      
      console.error("❌ [ClaimReward] Transaction error details:", txError instanceof Error ? txError.stack : String(txError));
      return NextResponse.json(
        { message: "Failed to process reward transaction", error: txError instanceof Error ? txError.message : String(txError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ [ClaimReward] Unhandled error:", error);
    console.error("❌ [ClaimReward] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to process reward claim", error: errorMessage },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Claim_Reward");

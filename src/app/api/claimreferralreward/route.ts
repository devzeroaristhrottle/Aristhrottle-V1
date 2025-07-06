import connectToDatabase from '@/lib/db'
import Referrals from '@/models/Referrals'
import User from '@/models/User'
import { checkIsAuthenticated } from '@/utils/authFunctions'
import { withApiLogging } from '@/utils/apiLogger'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { mintTokensAndLog } from '@/ethers/mintUtils'

async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase()

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User id not given' },
        { status: 400 }
      )
    }

    await checkIsAuthenticated(userId, req)

    const user = await User.findById(userId)

    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get unclaimed referrals and mark them as processing in one atomic operation
      const referrals = await Referrals.find(
        { refer_by: user.refer_code, is_claimed: false },
        null,
        { session }
      );
      
      const points = referrals.length;
      let points_mint = 0;
      
      if (points > 0) {
        // Mark referrals as claimed first to prevent double-claiming
        await Referrals.updateMany(
          { refer_by: user.refer_code, is_claimed: false },
          { is_claimed: true },
          { session }
        );
        
        // Calculate reward
        points_mint = points * 5;
        
        // Process blockchain transaction using mintTokensAndLog
        const mintResult = await mintTokensAndLog(
          user.user_wallet_address,
          points_mint,
          "referral_reward",
          {
            referralCount: points,
            referralCode: user.refer_code,
            userId: userId
          }
        );
        
        // If minting failed, throw an error to trigger transaction rollback
        if (!mintResult.success) {
          throw new Error(mintResult.error || "Transaction failed")
        }
        
        // If everything went well, commit the transaction
        await session.commitTransaction();
        return NextResponse.json({ 
          points_mint, 
          transactionHash: mintResult.transactionHash 
        }, { status: 200 });
      } else {
        await session.abortTransaction();
        return NextResponse.json({ points_mint: 0 }, { status: 200 });
      }
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
    return NextResponse.json({ points_mint: 0 }, { status: 500 })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    )
  }
}

export const POST = withApiLogging(handlePostRequest, "Claim_ReferralReward");

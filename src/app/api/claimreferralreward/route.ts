import { getContractUtils } from '@/ethers/contractUtils'
import connectToDatabase from '@/lib/db'
import Referrals from '@/models/Referrals'
import User from '@/models/User'
import { checkIsAuthenticated } from '@/utils/authFunctions'
import { withApiLogging } from '@/utils/apiLogger'
import { ethers } from 'ethers'
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

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
        const {contract} = getContractUtils();
        const amount = ethers.parseUnits(points_mint.toString(), 18);
        
        // Process blockchain transaction
        const tx = await contract.mint(user.user_wallet_address, amount);
        await tx.wait();
        
        // If everything went well, commit the transaction
        await session.commitTransaction();
        return NextResponse.json({ points_mint }, { status: 200 });
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

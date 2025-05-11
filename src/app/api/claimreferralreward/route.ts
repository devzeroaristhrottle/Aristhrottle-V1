import { contract } from '@/ethers/contractUtils'
import connectToDatabase from '@/lib/db'
import Referrals from '@/models/Referrals'
import User from '@/models/User'
import { checkIsAuthenticated } from '@/utils/authFunctions'
import { withApiLogging } from '@/utils/apiLogger'
import { ethers } from 'ethers'
import { NextRequest, NextResponse } from 'next/server'

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

    const points = await Referrals.find({
      refer_by: user.refer_code,
      is_claimed: false,
    }).countDocuments()

    let points_mint

    if (points > 0) {
      points_mint = points * 5
      const amount = ethers.parseUnits(points_mint.toString(), 18)

      const tx = await contract.mintCoins(user.user_wallet_address, amount)
      await tx.wait()

      await Referrals.updateMany(
        { refer_by: user.refer_code, is_claimed: false },
        { is_claimed: true }
      )
      return NextResponse.json({ points_mint: points_mint }, { status: 200 })
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

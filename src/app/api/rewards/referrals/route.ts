import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { NextRequest, NextResponse } from "next/server";
import Referrals from "@/models/Referrals";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import User from "@/models/User";
import { POINTS_MULTIPLIERS } from "@/config/rewardsConfig";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const query = new URLSearchParams(req.nextUrl.search);
    const userId = query.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User id required" },
        { status: 400 }
      );
    }

    try {
      await checkIsAuthenticated(userId, req);
    } catch (authError) {
      return NextResponse.json(
        { message: "Authentication failed", error: authError instanceof Error ? authError.message : String(authError) },
        { status: 401 }
      );
    }

    // Find user to get referral code
    const user = await User.findById(userId);
    if (!user || !user.refer_code) {
      return NextResponse.json(
        { message: "User has no referral code" },
        { status: 404 }
      );
    }

    // Get total referral count
    const totalReferralCount = await Referrals.find({
      refer_by: user.refer_code,
    }).countDocuments();

    // Get milestone details
    const milestoneDetails = await Milestone.find({
      created_by: userId,
      type: "referral",
    });

    // Get unclaimed referrals count
    const unclaimedReferrals = await Referrals.find({
      refer_by: user.refer_code,
      is_claimed: false,
    }).countDocuments();

    // Calculate points using the multiplier
    const points = unclaimedReferrals * POINTS_MULTIPLIERS.REFERRAL;

    return NextResponse.json(
      {
        totalReferralCount,
        milestoneDetails,
        points,
        unclaimedReferrals
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in referrals rewards endpoint:", error);
    return NextResponse.json(
      { message: "Failed to retrieve referral rewards", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

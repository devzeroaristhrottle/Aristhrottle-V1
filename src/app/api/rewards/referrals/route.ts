import connectToDatabase from "@/lib/db";
import Milestone from "@/models/Milestone";
import { NextRequest, NextResponse } from "next/server";
import Referrals from "@/models/Referrals";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const query = new URLSearchParams(req.nextUrl.search);
  const userId = query.get("userId");

  try {
    if (!userId) {
      throw Error("User id required");
    }

    await checkIsAuthenticated(userId, req);

    const user = await User.findById(userId);

    const totalReferralCount = await Referrals.find({
      refer_by: user.refer_code,
    }).countDocuments();

    const milestoneDetails = await Milestone.find({
      created_by: userId,
      type: "referral",
    });

    const points = await Referrals.find({
      refer_by: user.refer_code,
      is_claimed: false,
    }).countDocuments();

    return NextResponse.json(
      {
        totalReferralCount: totalReferralCount,
        milestoneDetails: milestoneDetails,
        points: points * 5,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

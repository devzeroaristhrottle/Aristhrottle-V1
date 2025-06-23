import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import { NextRequest, NextResponse } from "next/server";
import Vote from "@/models/Vote";

async function handlePostRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "All filed required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, req);

    await Vote.findByIdAndUpdate(
      {
        is_onchain: true,
        is_claimed: false,
        vote_by: userId,
      },
      { is_claimed: true }
    );

    return NextResponse.json(
      { message: "Votes status updated" },
      {
        status: 200,
      }
    );
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

export const POST = withApiLogging(handlePostRequest, "Claim_Reward_Votes");

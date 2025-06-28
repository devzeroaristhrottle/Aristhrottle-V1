import connectToDatabase from "@/lib/db";
import Referrals from "@/models/Referrals";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { checkIsAuthenticated } from "@/utils/authFunctions";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
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
    
    // Update all unclaimed referrals for this user
    const updateResult = await Referrals.updateMany(
      {
        refer_by: user.refer_code,
        is_claimed: false
      },
      {
        is_claimed: true
      }
    );
    
    return NextResponse.json({
      message: "Successfully updated referral claims",
      updatedCount: updateResult.modifiedCount
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating referral claims:", error);
    return NextResponse.json(
      { message: "Failed to update referral claims", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
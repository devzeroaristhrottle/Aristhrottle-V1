import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import { hasDayPassed } from "@/utils/dateUtils";
import connectToDatabase from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    // Check authentication
    const token = await getToken({ req: request });
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if a day has passed since last reset
    let wasReset = false;
    if (user.lastGenerationReset && hasDayPassed(user.lastGenerationReset)) {
      // Reset generations counter
      user.generations = 0;
      user.lastGenerationReset = new Date();
      await user.save();
      wasReset = true;
    }

    return NextResponse.json({
      success: true,
      generations: user.generations,
      wasReset,
      lastReset: user.lastGenerationReset
    });
  } catch (error: any) {
    console.error("Error checking generations:", error);
    return NextResponse.json(
      { error: "Failed to check generations", details: error.message },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { getRemainingGenerations } from "@/utils/userUtils";

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
    
    // Get remaining generations
    const generationInfo = await getRemainingGenerations(user._id);
    
    return NextResponse.json(generationInfo, { status: 200 });
  } catch (error: any) {
    console.error("Error getting generation info:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to get generation info",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
} 
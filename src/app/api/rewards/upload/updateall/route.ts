import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
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
    
    // Update all unclaimed memes for this user
    const updateResult = await Meme.updateMany(
      {
        created_by: userId,
        is_claimed: false,
        is_onchain: true
      },
      {
        is_claimed: true
      }
    );
    
    return NextResponse.json({
      message: "Successfully updated upload claims",
      updatedCount: updateResult.modifiedCount
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating upload claims:", error);
    return NextResponse.json(
      { message: "Failed to update upload claims", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

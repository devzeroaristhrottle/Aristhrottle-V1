import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Vote from "@/models/Vote";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";

async function handleGetRequest(request: NextRequest) {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, request);

    // Get the last 15 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last15Days = [];
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last15Days.push(date.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    // Aggregate votes per day for the user
    const voteData = await Vote.aggregate([
      {
        $match: {
          vote_by: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(last15Days[0]) }, // Filter last 15 days
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by date
          },
          totalVotes: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 }, // Sort by date
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          totalVotes: 1,
        },
      },
    ]);

    // Convert aggregation result into a map
    const voteMap = new Map(
      voteData.map((item) => [item.date, item.totalVotes])
    );

    // Ensure all 15 days are included
    const finalData = last15Days.map((date) => ({
      date,
      totalVotes: voteMap.get(date) || 0, // If no votes, set to 0
    }));

    return NextResponse.json({ data: finalData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGetRequest, "Activity_VotesCasted");

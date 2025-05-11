import { NextRequest, NextResponse } from "next/server";
import Vote from "@/models/Vote";
import Meme from "@/models/Meme";
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

    // Get today's date (start of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date 14 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    // Generate last 15 days as YYYY-MM-DD
    const last15Days = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      last15Days.push(date.toISOString().split("T")[0]);
    }

    // Find memes uploaded by the user
    const userMemes = await Meme.find({ created_by: userId }).select("_id");
    const memeIds = userMemes.map((meme) => meme._id);

    if (memeIds.length === 0) {
      return NextResponse.json(
        { data: last15Days.map((date) => ({ date, totalVotes: 0 })) },
        { status: 200 }
      );
    }

    // Aggregate votes per day for the user's memes
    const voteData = await Vote.aggregate([
      {
        $match: {
          vote_to: { $in: memeIds },
          createdAt: { $gte: startDate, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalVotes: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
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
      totalVotes: voteMap.get(date) || 0,
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

export const GET = withApiLogging(handleGetRequest, "Activity_VotesReceived");

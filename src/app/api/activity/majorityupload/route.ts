import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Meme from "@/models/Meme";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";

export const dynamic = 'force-dynamic'; // Prevent static generation

async function handleGetRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    // Extract userId from query parameterseeee
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, request);

    // Get today's date (set to 23:59:59 for full-day inclusion)
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Get the date 14 days ago (start of the period)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);

    // Generate an array of the last 15 days (including today)
    const last15Days = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      last15Days.push(date.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    // Aggregate memes where in_percentile > 50
    const uploadData = await Meme.aggregate([
      {
        $match: {
          created_by: new mongoose.Types.ObjectId(userId), // Filter by user ID
          in_percentile: { $gt: 50 }, // Filter where in_percentile > 50
          createdAt: { $gte: startDate, $lte: today }, // Time range filter
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
          majorityUploads: { $sum: 1 }, // Count majority uploads
        },
      },
      {
        $sort: { "_id.date": 1 }, // Sort by date
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          majorityUploads: 1,
        },
      },
    ]);

    // Convert aggregation result into a map
    const uploadMap = new Map(
      uploadData.map((item) => [item.date, item.majorityUploads])
    );

    // Ensure all 15 days are included
    const finalData = last15Days.map((date) => ({
      date,
      majorityUploads: uploadMap.get(date) || 0, // If no uploads, set to 0
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

export const GET = withApiLogging(handleGetRequest, "Activity_MajorityUploads");

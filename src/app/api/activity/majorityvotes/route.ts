import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Vote from "@/models/Vote";
import Meme from "@/models/Meme";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";

async function handleGetRequest(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await checkIsAuthenticated(userId, request);

    // Get the last 15 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const last15Days = []
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      last15Days.push(date.toISOString().split('T')[0]) // Format as YYYY-MM-DD
    }

    // Step 1: Find votes cast by the user in the last 15 days
    const userVotes = await Vote.find({
      vote_by: userId,
      createdAt: { $gte: new Date(last15Days[0]) },
    }).select('vote_to createdAt')

    // Extract meme IDs from user votes
    const votedMemeIds = userVotes.map((vote) => vote.vote_to)

    // Step 2: Find memes where in_percentile > 50
    const qualifyingMemes = await Meme.find({
      _id: { $in: votedMemeIds },
      in_percentile: { $gt: 50 },
    }).select('_id')

    const qualifyingMemeIds = qualifyingMemes.map((meme) => meme._id)

    // Step 3: Aggregate votes per day for qualifying memes
    const voteData = await Vote.aggregate([
      {
        $match: {
          vote_by: new mongoose.Types.ObjectId(userId),
          vote_to: { $in: qualifyingMemeIds },
          createdAt: { $gte: new Date(last15Days[0]) },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          totalVotes: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          totalVotes: 1,
        },
      },
    ])

    // Convert aggregation result into a map
    const voteMap = new Map(
      voteData.map((item) => [item.date, item.totalVotes])
    )

    // Ensure all 15 days are included, even if no votes exist
    const finalData = last15Days.map((date) => ({
      date,
      majorityVotes: voteMap.get(date) || 0, // If no votes, set to 0
    }))

    return NextResponse.json({ data: finalData }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error },
      { status: 500 }
    )
  }
}

export const GET = withApiLogging(handleGetRequest, "Activity_MajorityVotes");

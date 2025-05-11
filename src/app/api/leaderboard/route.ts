import connectToDatabase from '@/lib/db'
import Meme from '@/models/Meme'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  await connectToDatabase()

  const query = new URLSearchParams(req.nextUrl.search)
  const off = query.get('offset')
  const daily = query.get('daily')
  const defaultOffset = 30
  const offset = off == null ? defaultOffset : parseInt(off.toString())
  const start = offset <= defaultOffset ? 0 : offset - defaultOffset

  try {
    if (daily == 'true') {
      // const startOfDay = new Date();
      // startOfDay.setUTCHours(0, 0, 0, 0); // Set to the start of the day (UTC)

      // const endOfDay = new Date();
      // endOfDay.setUTCHours(23, 59, 59, 999); // Set to the end of the day (UTC)

      const now = new Date()

      // Calculate the time range: 5 AM (previous day) to 4:59 AM (current day)
      const startOfDay = new Date(now)
      startOfDay.setUTCHours(5, 0, 0, 0) // 5 AM UTC of the previous day
      startOfDay.setUTCDate(startOfDay.getUTCDate() - 1)

      const endOfDay = new Date(now)
      endOfDay.setUTCHours(4, 59, 59, 999) // 4:59:59 AM UTC of the current day

      const memesCount = await Meme.find({
        is_voting_close: true,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).countDocuments()

      const memes = await Meme.find({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
        .skip(start)
        .limit(defaultOffset)
        .where({ is_voting_close: true })
        .populate('created_by')

      const totalVotes = await Meme.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lt: endOfDay }, // Filter by date range
          },
        },
        {
          $group: {
            _id: null, // Group all matching documents
            totalVotes: { $sum: '$vote_count' }, // Summing up vote_count
          },
        },
      ])

      return NextResponse.json(
        {
          memes: memes,
          memesCount: memesCount,
          totalVotes,
          totalUpload: memesCount,
        },
        { status: 200 }
      )
    } else {
      const memesCount = await Meme.find({
        is_voting_close: true,
      }).countDocuments()

      const totalVotes = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
          },
        },
        {
          $group: {
            _id: null, // Group all matching documents
            totalVotes: { $sum: '$vote_count' }, // Summing up vote_count
          },
        },
      ])

      // const memes = await Meme.find()
      //   .skip(start)
      //   .limit(defaultOffset)
      //   .where({ is_voting_close: true })
      //   .populate("created_by");

      const memes = await Meme.aggregate([
        {
          $match: { is_voting_close: true },
        },
        { $sort: { vote_count: -1 } }, // Sort by vote_count in descending order
        {
          $setWindowFields: {
            sortBy: { vote_count: -1 },
            output: {
              rank: { $rank: {} }, // Assigns rank starting from 1
            },
          },
        },
        {
          $lookup: {
            from: 'users', // Collection name in MongoDB
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by',
          },
        },
        {
          $unwind: '$created_by', // Convert array to object
        },
        {
          $project: {
            _id: 1,
            name: 1,
            vote_count: 1,
            image_url: 1,
            rank: 1,
            createdAt: 1,
            shares: 1,
            bookmarks: 1,
            in_percentile:1,
            'created_by._id': 1,
            'created_by.username': 1, // Adjust fields based on User schema
            'created_by.profile_image': 1, // Example field
          },
        },
        { $limit: defaultOffset }, // Limit results
      ])

      return NextResponse.json(
        {
          memes: memes,
          memesCount: memesCount,
          totalVotes,
          totalUpload: memesCount,
        },
        { status: 200 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    )
  }
}

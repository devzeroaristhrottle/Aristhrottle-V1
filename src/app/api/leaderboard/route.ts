import connectToDatabase from '@/lib/db';
import Meme from '@/models/Meme';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const query = new URLSearchParams(req.nextUrl.search);
  const off = query.get('offset');
  const daily = query.get('daily');
  const defaultOffset = 30;
  const offset = off == null ? defaultOffset : parseInt(off.toString());
  const start = offset <= defaultOffset ? 0 : offset - defaultOffset;

  try {
    if (daily === 'true') {
  
      // Dynamic time window: two days ago 11:30 PM IST to yesterday 11:30 PM IST
      const now = new Date();
      const utcYear = now.getUTCFullYear();
      const utcMonth = now.getUTCMonth();
      const utcDate = now.getUTCDate();

      // End time: Yesterday 11:30 PM IST = 6:00 PM UTC of yesterday
      const endOfDay = new Date(Date.UTC(utcYear, utcMonth, utcDate, 18, 0, 0, 0));
      // Start time: Two days ago 11:30 PM IST = 6:00 PM UTC of two days ago
      const startTime = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);

      // Count total memes
      const memesCount = await Meme.countDocuments({
        is_voting_close: true,
        createdAt: { $gte: startTime, $lt: endOfDay },
      });

      // Calculate max vote_count
      const maxVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            createdAt: { $gte: startTime, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            maxVotes: { $max: { $ifNull: ['$vote_count', 0] } },
          },
        },
      ]);
      const maxVotes = maxVotesResult[0]?.maxVotes || 0;

      // Calculate total votes for response
      const totalVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            createdAt: { $gte: startTime, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: { $ifNull: ['$vote_count', 0] } },
          },
        },
      ]);
      const totalVotes = totalVotesResult[0]?.totalVotes || 0;

      // Fetch memes with rank and in_percentile
      const memes = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            createdAt: { $gte: startTime, $lt: endOfDay },
          },
        },
        { $sort: { vote_count: -1, _id: 1 } }, // Ensure stable sort with _id
        {
          $setWindowFields: {
            sortBy: { vote_count: -1 },
            output: {
              rank: { $denseRank: {} }, // Use denseRank for consecutive ranks
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by',
          },
        },
        {
          $unwind: {
            path: '$created_by',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            vote_count: 1,
            image_url: 1,
            rank: 1,
            createdAt: 1,
            share_count: { $size: { $ifNull: ["$shares", []] } },
            bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } },
            in_percentile: {
              $cond: {
                if: { $gt: [maxVotes, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ["$vote_count", 0] },
                        maxVotes,
                      ],
                    },
                    100,
                  ],
                },
                else: 0,
              },
            },
            'created_by._id': 1,
            'created_by.username': 1,
            'created_by.profile_image': 1,
          },
        },
        { $skip: start },
        { $limit: defaultOffset },
      ]);


      return NextResponse.json(
        {
          memes,
          memesCount,
          totalVotes,
          totalUpload: memesCount,
        },
        { status: 200 }
      );
    } else {
      // Count total memes
      const memesCount = await Meme.countDocuments({
        is_voting_close: true,
      });

      // Calculate max vote_count
      const maxVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
          },
        },
        {
          $group: {
            _id: null,
            maxVotes: { $max: { $ifNull: ['$vote_count', 0] } },
          },
        },
      ]);
      const maxVotes = maxVotesResult[0]?.maxVotes || 0;

      // Calculate total votes for response
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

      // Fetch memes with rank and in_percentile
      const memes = await Meme.aggregate([
        {
          $match: { is_voting_close: true },
        },
        { $sort: { vote_count: -1, _id: 1 } }, // Ensure stable sort with _id
        {
          $setWindowFields: {
            sortBy: { vote_count: -1 },
            output: {
              rank: { $denseRank: {} }, // Use denseRank for consecutive ranks
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by',
          },
        },
        {
          $unwind: {
            path: '$created_by',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            vote_count: 1,
            image_url: 1,
            rank: 1,
            createdAt: 1,
            share_count: { $size: { $ifNull: ["$shares", []] } },
            bookmark_count: { $size: { $ifNull: ["$bookmarks", []] } },
            in_percentile: {
              $cond: {
                if: { $gt: [maxVotes, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ["$vote_count", 0] },
                        maxVotes,
                      ],
                    },
                    100,
                  ],
                },
                else: 0,
              },
            },
            'created_by._id': 1,
            'created_by.username': 1,
            'created_by.profile_image': 1,
          },
        },
        { $skip: start },
        { $limit: defaultOffset },
      ]);


      return NextResponse.json(
        {
          memes,
          memesCount,
          totalVotes,
          totalUpload: memesCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in GET /memes:', error);
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
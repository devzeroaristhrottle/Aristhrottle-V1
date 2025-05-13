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
      // Calculate the time range: 5 AM (previous day) to 4:59 AM (current day)
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(5, 0, 0, 0);
      startOfDay.setUTCDate(startOfDay.getUTCDate() - 1);

      const endOfDay = new Date(now);
      endOfDay.setUTCHours(4, 59, 59, 999);

      // Count total memes
      const memesCount = await Meme.countDocuments({
        is_voting_close: true,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      // Calculate max vote_count
      const maxVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            createdAt: { $gte: startOfDay, $lt: endOfDay },
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
            createdAt: { $gte: startOfDay, $lt: endOfDay },
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
            createdAt: { $gte: startOfDay, $lt: endOfDay },
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
            shares: 1,
            bookmarks: 1,
            in_percentile: {
              $cond: {
                if: { $gt: [maxVotes, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ['$vote_count', 0] },
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

      // Log for debugging
      console.log('Daily Memes:', memes.map(m => ({
        id: m._id,
        vote_count: m.vote_count,
        rank: m.rank,
        in_percentile: m.in_percentile,
      })));

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
      const totalVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
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
            shares: 1,
            bookmarks: 1,
            in_percentile: {
              $cond: {
                if: { $gt: [maxVotes, 0] },
                then: {
                  $multiply: [
                    {
                      $divide: [
                        { $ifNull: ['$vote_count', 0] },
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
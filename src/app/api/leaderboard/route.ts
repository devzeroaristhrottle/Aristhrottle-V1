import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const query = new URLSearchParams(req.nextUrl.search);
  const off = query.get("offset");
  const daily = query.get("daily");
  const defaultOffset = 30;
  const offset = off == null ? defaultOffset : parseInt(off.toString());
  const start = offset <= defaultOffset ? 0 : offset - defaultOffset;

  try {
    if (daily === 'true') {
      // Daily time window: Yesterday 6 AM IST to Today 6 AM IST
      const now = new Date();
      const today6amIST = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 30));
      const yesterday6amIST = new Date(today6amIST.getTime() - 24 * 60 * 60 * 1000);

      // Count total memes
      const memesCount = await Meme.countDocuments({
        is_voting_close: true,
        is_onchain: true,
        createdAt: { $gte: yesterday6amIST, $lt: today6amIST },
      });

      // Max vote count
      const maxVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            is_onchain: true,
            createdAt: { $gte: yesterday6amIST, $lt: today6amIST },
          },
        },
        {
          $group: {
            _id: null,
            maxVotes: { $max: { $ifNull: ["$vote_count", 0] } },
          },
        },
      ]);
      const maxVotes = maxVotesResult[0]?.maxVotes || 0;

      // Total vote count
      const totalVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            createdAt: { $gte: yesterday6amIST, $lt: today6amIST },
          },
        },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: { $ifNull: ["$vote_count", 0] } },
          },
        },
      ]);
      const totalVotes = totalVotesResult[0]?.totalVotes || 0;

      // Fetch memes with ranking and user info
      const memes = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
            is_onchain: true,
            createdAt: { $gte: yesterday6amIST, $lt: today6amIST },
          },
        },
        { $sort: { vote_count: -1, _id: 1 } },
        {
          $setWindowFields: {
            sortBy: { vote_count: -1 },
            output: {
              rank: { $denseRank: {} },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
          },
        },
        {
          $unwind: {
            path: "$created_by",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags',
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
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: "$$tag.name"
              }
            }
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
      // OLD non-daily logic unchanged
      const memesCount = await Meme.countDocuments({
        is_voting_close: true,
      });

      const maxVotesResult = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
          },
        },
        {
          $group: {
            _id: null,
            maxVotes: { $max: { $ifNull: ["$vote_count", 0] } },
          },
        },
      ]);
      const maxVotes = maxVotesResult[0]?.maxVotes || 0;

      const totalVotes = await Meme.aggregate([
        {
          $match: {
            is_voting_close: true,
          },
        },
        {
          $group: {
            _id: null,
            totalVotes: { $sum: '$vote_count' },
          },
        },
      ]);

      const memes = await Meme.aggregate([
        {
          $match: { is_voting_close: true },
        },
        { $sort: { vote_count: -1, _id: 1 } },
        {
          $setWindowFields: {
            sortBy: { vote_count: -1 },
            output: {
              rank: { $denseRank: {} },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "created_by",
            foreignField: "_id",
            as: "created_by",
          },
        },
        {
          $unwind: {
            path: "$created_by",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags',
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
                      $divide: [{ $ifNull: ["$vote_count", 0] }, maxVotes],
                    },
                    100,
                  ],
                },
                else: 0,
              },
            },
            "created_by._id": 1,
            "created_by.username": 1,
            "created_by.profile_image": 1,
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: "$$tag.name"
              }
            }
          },
        },
        { $skip: start },
        { $limit: defaultOffset },
      ]);

      return NextResponse.json(
        {
          memes,
          memesCount,
          totalVotes: totalVotes[0]?.totalVotes || 0,
          totalUpload: memesCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in GET /memes:", error);
    return NextResponse.json(
      { error: error || "Internal Server Error" },
      { status: 500 }
    );
  }
}

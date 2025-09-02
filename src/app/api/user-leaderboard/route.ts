import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";

async function handleGetRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = new URLSearchParams(request.nextUrl.search);
    const filter = searchParams.get("filter") || "tokens_minted";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate filter parameter
    const validFilters = ["tokens_minted", "votes_received", "votes_casted", "uploads", "username"];
    if (!validFilters.includes(filter)) {
      return NextResponse.json(
        { error: `Invalid filter. Must be one of: ${validFilters.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset must be non-negative" },
        { status: 400 }
      );
    }

    // Build aggregation pipeline for comprehensive user data
    const comprehensivePipeline: any[] = [
      {
        $lookup: {
          from: "memes",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$created_by", "$$userId"] },
                    { $ne: ["$is_deleted", true] }
                  ]
                }
              }
            }
          ],
          as: "user_memes"
        }
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "vote_by",
          as: "user_votes"
        }
      },
      {
        $addFields: {
          votes_received: {
            $sum: "$user_memes.vote_count"
          },
          votes_casted: { $size: "$user_votes" },
          uploads: { $size: "$user_memes" },
          tokens_minted: { $ifNull: ["$tokens_minted", 0] }
        }
      },
      {
        $project: {
          username: 1,
          user_wallet_address: 1,
          tokens_minted: 1,
          votes_received: 1,
          votes_casted: 1,
          uploads: 1
        }
      }
    ];

    // Add sorting based on filter
    const sortField = filter === "username" ? "username" : filter;
    const sortOrder = filter === "username" ? 1 : -1; // Ascending for username, descending for numbers

    comprehensivePipeline.push({
      $sort: { [sortField]: sortOrder, _id: 1 } // Add _id as secondary sort for consistency
    } as any);

    // Add pagination
    comprehensivePipeline.push({ $skip: offset } as any);
    comprehensivePipeline.push({ $limit: limit } as any);

    // Execute the aggregation
    const users = await User.aggregate(comprehensivePipeline);

    // Add rank to each user based on their position in the sorted list
    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      username: user.username || "Anonymous",
      user_wallet_address: user.user_wallet_address,
      votes_received: user.votes_received || 0,
      votes_casted: user.votes_casted || 0,
      uploads: user.uploads || 0,
      tokens_minted: user.tokens_minted || 0
    }));

    // Get total count for pagination info
    const totalCountPipeline: any[] = [
      {
        $lookup: {
          from: "memes",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$created_by", "$$userId"] },
                    { $ne: ["$is_deleted", true] }
                  ]
                }
              }
            }
          ],
          as: "user_memes"
        }
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "vote_by",
          as: "user_votes"
        }
      },
      {
        $addFields: {
          votes_received: {
            $sum: "$user_memes.vote_count"
          },
          votes_casted: { $size: "$user_votes" },
          uploads: { $size: "$user_memes" },
          tokens_minted: { $ifNull: ["$tokens_minted", 0] }
        }
      },
      {
        $count: "total"
      }
    ];

    const totalCountResult = await User.aggregate(totalCountPipeline);
    const totalUsers = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

    return NextResponse.json({
      leaderboard,
      pagination: {
        total: totalUsers,
        limit,
        offset,
        hasMore: offset + limit < totalUsers
      },
      filter: filter,
      sortOrder: sortOrder === 1 ? "ascending" : "descending"
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGetRequest, "Get_User_Leaderboard");

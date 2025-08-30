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
    const daily = searchParams.get("daily");

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

    // Calculate daily window if needed
    let dateFilter = {};
    if (daily === "true") {
      const now = new Date();
      const today6amIST = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 30
      ));
      const yesterday6amIST = new Date(today6amIST.getTime() - 24 * 60 * 60 * 1000);
      dateFilter = { $gte: yesterday6amIST, $lt: today6amIST };
    }

    // Build aggregation pipeline for comprehensive user data
    const comprehensivePipeline: any[] = [
      {
        $lookup: {
          from: "memes",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$created_by", "$$userId"] } } },
            ...(daily === "true" ? [{ $match: { createdAt: dateFilter } }] : [])
          ],
          as: "user_memes"
        }
      },
      {
        $lookup: {
          from: "votes",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$vote_by", "$$userId"] } } },
            ...(daily === "true" ? [{ $match: { createdAt: dateFilter } }] : [])
          ],
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
    });

    // Add pagination
    comprehensivePipeline.push({ $skip: offset });
    comprehensivePipeline.push({ $limit: limit });

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
      tokens_minted: user.tokens_minted || 0,
      profile_pic: user.profile_pic || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4_WP3VdprlZKs2I6Flr83IcWk5QeZhXGO-g&s"
    }));

    // Get total count for pagination info
    const totalCountPipeline = [
      {
        $lookup: {
          from: "memes",
          let: { userId: "_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$created_by", "$$userId"] } } },
            ...(daily === "true" ? [{ $match: { createdAt: dateFilter } }] : [])
          ],
          as: "user_memes"
        }
      },
      {
        $lookup: {
          from: "votes",
          let: { userId: "_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$vote_by", "$$userId"] } } },
            ...(daily === "true" ? [{ $match: { createdAt: dateFilter } }] : [])
          ],
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

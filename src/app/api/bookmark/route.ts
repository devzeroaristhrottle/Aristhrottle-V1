import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Meme from "@/models/Meme";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import Tags from "@/models/Tags";
import { updateTagsRelevance } from "@/utils/tagUtils";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const query = new URLSearchParams(req.nextUrl.search);
    const off = query.get('offset');
    const defaultOffset = 30;
    const offset = off == null ? defaultOffset : parseInt(off.toString());
    const start = offset <= defaultOffset ? 0 : offset - defaultOffset;

    // Get authenticated user from token
    const token = await getToken({ req });
    if (!token || !token.address) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user by wallet address
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const userId = user._id.toString();

    try {
      // Count total bookmarked memes for pagination
      const bookmarkedMemesCount = await Meme.countDocuments({
        bookmarks: userId
      });

      // Create aggregation pipeline to fetch bookmarked memes
      const pipeline: any[] = [
        {
          $match: {
            bookmarks: new mongoose.Types.ObjectId(userId)
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: start },
        { $limit: defaultOffset },
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'created_by',
          },
        },
        { $unwind: '$created_by' },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags',
          },
        }
      ];

      // Add user vote check
      pipeline.push(
        {
          $lookup: {
            from: 'votes',
            let: { memeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$vote_to', '$$memeId'] },
                      { $eq: ['$vote_by', new mongoose.Types.ObjectId(userId)] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'userVote',
          },
        },
        {
          $addFields: {
            has_user_voted: { $gt: [{ $size: '$userVote' }, 0] },
          },
        },
        {
          $project: {
            userVote: 0,
          },
        }
      );

      // Execute the aggregation
      const bookmarkedMemes = await Meme.aggregate(pipeline);

      return NextResponse.json(
        { 
          memes: bookmarkedMemes, 
          memesCount: bookmarkedMemesCount 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching bookmarked memes:", error);
      return NextResponse.json(
        { message: "Error fetching bookmarked memes", error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    // Parse request body
    const { memeId, userId } = await request.json();

    // Validate input
    if (!memeId || !userId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, request);

    // Check if meme exists
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return NextResponse.json({ message: "Meme not found" }, { status: 404 });
    }

    // Check if the user already bookmarked the meme
    const isBookmarked = meme.bookmarks.includes(userId);

    if (isBookmarked) {
      // Remove bookmark
      meme.bookmarks = meme.bookmarks.filter(
        (id: mongoose.Schema.Types.ObjectId) =>
          id.toString() !== userId.toString()
      );
      
      // Decrement bookmark_count for all tags associated with this meme
      if (meme.tags && meme.tags.length > 0) {
        await Tags.updateMany(
          { _id: { $in: meme.tags } },
          { $inc: { bookmark_count: -1 } }
        );
        
        // Update the relevance scores for the tags
        await updateTagsRelevance(meme.tags);
      }
    } else {
      // Add bookmark
      meme.bookmarks.push(userId);
      
      // Increment bookmark_count for all tags associated with this meme
      if (meme.tags && meme.tags.length > 0) {
        await Tags.updateMany(
          { _id: { $in: meme.tags } },
          { $inc: { bookmark_count: 1 } }
        );
        
        // Update the relevance scores for the tags
        await updateTagsRelevance(meme.tags);
      }
    }

    await meme.save();

    return NextResponse.json(
      {
        message: isBookmarked
          ? "Bookmark removed successfully"
          : "Bookmark added successfully",
        meme,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Toggle_Bookmark");

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Meme from "@/models/Meme";
import User from "@/models/User";
import Bookmark from "@/models/Bookmark";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import Tags from "@/models/Tags";
import { updateTagsRelevance } from "@/utils/tagUtils";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get authenticated user from token
    const token = await getToken({ req });
    if (!token || !token.address) {
      return NextResponse.json(
        { 
          memes: [], 
          memesCount: 0, 
          message: "Authentication required to view bookmarks" 
        },
        { status: 200 } // Return 200 but with empty results for better UX
      );
    }

    const query = new URLSearchParams(req.nextUrl.search);
    const off = query.get('offset');
    const defaultOffset = 30;
    const offset = off == null ? defaultOffset : parseInt(off.toString());
    const start = offset <= defaultOffset ? 0 : offset - defaultOffset;

    // Find user by wallet address
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json(
        { 
          memes: [], 
          memesCount: 0,
          message: "User not found" 
        },
        { status: 200 } // Return 200 but with empty results for better UX
      );
    }

    const userId = user._id.toString();

    try {
      // Count total bookmarked memes for pagination (excluding deleted memes)
      const bookmarkCountPipeline = [
        {
          $match: {
            is_deleted: { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            let: { memeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$meme', '$$memeId'] },
                      { $eq: ['$user', new mongoose.Types.ObjectId(userId)] }
                    ]
                  }
                }
              }
            ],
            as: 'userBookmark'
          }
        },
        {
          $match: {
            'userBookmark.0': { $exists: true }
          }
        },
        {
          $count: "total"
        }
      ];

      const bookmarkCountResult = await Meme.aggregate(bookmarkCountPipeline);
      const bookmarkedMemesCount = bookmarkCountResult.length > 0 ? bookmarkCountResult[0].total : 0;

      // Create aggregation pipeline to fetch bookmarked memes
      const pipeline: any[] = [
        // First filter out deleted memes
        {
          $match: {
            is_deleted: { $ne: true }
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            let: { memeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$meme', '$$memeId'] },
                      { $eq: ['$user', new mongoose.Types.ObjectId(userId)] }
                    ]
                  }
                }
              }
            ],
            as: 'userBookmark'
          }
        },
        {
          $match: {
            'userBookmark.0': { $exists: true }
          }
        },
        {
          $addFields: {
            userBookmarkTime: { $arrayElemAt: ['$userBookmark.bookmarkedAt', 0] }
          }
        },
        { $sort: { userBookmarkTime: -1 } },
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
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1
                }
              }
            ]
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
            userVote: { $ifNull: ['$userVote', []] },
            has_user_voted: { $gt: [{ $size: { $ifNull: ['$userVote', []] } }, 0] },
            bookmark_count: { $size: { $ifNull: ['$bookmarks', []] } }
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

      // Set vote_count to 0 for memes created today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      bookmarkedMemes.forEach(meme => {
        if (meme.createdAt) {
          const createdAt = new Date(meme.createdAt);
          if (createdAt >= today && createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
            meme.vote_count = 0;
          }
        }
      });

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
        { 
          memes: [], 
          memesCount: 0, 
          message: "Error fetching bookmarked memes", 
          error 
        },
        { status: 200 } // Return 200 but with empty results for better UX
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { 
        memes: [], 
        memesCount: 0, 
        error: "Internal Server Error", 
        details: error 
      },
      { status: 200 } // Return 200 but with empty results for better UX
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

    // Check if meme exists and is not deleted
    const meme = await Meme.findOne({ _id: memeId, is_deleted: false });
    if (!meme) {
      return NextResponse.json({ message: "Content not found or has been deleted" }, { status: 404 });
    }

    // Check if the user already bookmarked the meme
    const existingBookmark = await Bookmark.findOne({
      user: new mongoose.Types.ObjectId(userId),
      meme: new mongoose.Types.ObjectId(memeId)
    });

    const isBookmarked = !!existingBookmark;

    if (isBookmarked) {
      // Remove bookmark
      await Bookmark.deleteOne({
        user: new mongoose.Types.ObjectId(userId),
        meme: new mongoose.Types.ObjectId(memeId)
      });
      
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
      const newBookmark = new Bookmark({
        user: new mongoose.Types.ObjectId(userId),
        meme: new mongoose.Types.ObjectId(memeId),
        bookmarkedAt: new Date()
      });
      
      await newBookmark.save();
      
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

    return NextResponse.json(
      {
        message: isBookmarked
          ? "Bookmark removed successfully"
          : "Bookmark added successfully",
        meme,
        bookmarkInfo: isBookmarked ? null : {
          user: userId,
          meme: memeId,
          bookmarkedAt: new Date()
        }
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

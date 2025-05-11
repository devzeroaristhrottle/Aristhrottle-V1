import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Meme from "@/models/Meme";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
import Tags from "@/models/Tags";
import { updateTagsRelevance } from "@/utils/tagUtils";

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

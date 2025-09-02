import { NextRequest, NextResponse } from "next/server";
import Meme from "@/models/Meme";
import Tags from "@/models/Tags";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";
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

    // Check if meme exists and is not deleted
    const meme = await Meme.findOne({ _id: memeId, is_deleted: false });
    if (!meme) {
      return NextResponse.json({ message: "Content not found or has been deleted" }, { status: 404 });
    }

    // Prevent duplicate shares
    if (!meme.shares.includes(userId)) {
      meme.shares.push(userId);
      await meme.save();
      
      // Increment share_count for all tags associated with this meme
      if (meme.tags && meme.tags.length > 0) {
        await Tags.updateMany(
          { _id: { $in: meme.tags } },
          { $inc: { share_count: 1 } }
        );
        
        // Update the relevance scores for the tags
        await updateTagsRelevance(meme.tags);
      }
    }

    return NextResponse.json(
      { message: "Share added successfully", meme },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Share_Meme");

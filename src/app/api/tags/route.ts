import connectToDatabase from "@/lib/db";
import Tags from "@/models/Tags";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import { updateTagsRelevance } from "@/utils/tagUtils";

async function handleGetRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const name = new URLSearchParams(req.nextUrl.search).get("name");
    const sort = new URLSearchParams(req.nextUrl.search).get("sort") || "count";
    const limit = parseInt(new URLSearchParams(req.nextUrl.search).get("limit") || "10");
    const incrementSearch = new URLSearchParams(req.nextUrl.search).get("incrementSearch") !== "false"; // Default to true

    if (name) {
      // Find tags matching the name
      const tags = await Tags.find({ name: { $regex: name, $options: "i" } });
      
      // Increment search_count if requested (default behavior)
      if (incrementSearch && tags.length > 0) {
        const tagIds = tags.map(tag => tag._id);
        
        // Increment search_count for all matched tags
        await Tags.updateMany(
          { _id: { $in: tagIds } },
          { $inc: { search_count: 1 } }
        );
        
        // Update the relevance scores for the tags
        await updateTagsRelevance(tagIds);
      }

      return NextResponse.json({ tags: tags }, { status: 200 });
    }

    // Sort by the specified field
    const sortField = sort === "relevance" ? "relevance" : "count";
    const tags = await Tags.find().sort({ [sortField]: -1 }).limit(limit);

    return NextResponse.json({ tags: tags }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

async function handlePostRequest(req: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    const { tags } = await req.json();

    // Validate input
    if (!Array.isArray(tags) || tags.length === 0) {
      throw "Invalid tags data";
    }

    // Insert tags into the database
    const result = await Tags.insertMany(tags, { ordered: false }); // ordered: false allows partial insertions if some documents fail

    return NextResponse.json(
      {
        tags: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { errorResponse: { code: number } }).errorResponse!.code ===
        11000
    ) {
      return NextResponse.json(
        {
          error: "Some categories already exist",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = handleGetRequest;
export const POST = withApiLogging(handlePostRequest, "Create_Tags");

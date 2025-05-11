import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import TagCooccurrence from "@/models/TagCooccurrence";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = new URLSearchParams(req.nextUrl.search);
    const tagId = searchParams.get("tagId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!tagId) {
      return NextResponse.json(
        { message: "Tag ID is required" },
        { status: 400 }
      );
    }

    // Find co-occurrences where the given tag is either tag1 or tag2
    const cooccurrences = await TagCooccurrence.find({
      $or: [
        { tag1: new mongoose.Types.ObjectId(tagId) },
        { tag2: new mongoose.Types.ObjectId(tagId) }
      ]
    })
    .sort({ count: -1 })
    .limit(limit)
    .populate("tag1", "name")
    .populate("tag2", "name");

    // Transform the results to make them easier to use
    const results = cooccurrences.map(co => {
      const otherTag = co.tag1._id.toString() === tagId ? co.tag2 : co.tag1;
      return {
        tagId: otherTag._id,
        tagName: otherTag.name,
        cooccurrenceCount: co.count
      };
    });

    return NextResponse.json({ cooccurrences: results }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tag co-occurrences:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
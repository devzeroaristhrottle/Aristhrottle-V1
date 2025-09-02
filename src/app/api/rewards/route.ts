import connectToDatabase from "@/lib/db";
import Meme from "@/models/Meme";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const query = new URLSearchParams(req.nextUrl.search);
  const off = query.get("offset");
  const daily = query.get("daily");
  const defaultOffset = 6;
  const offset = off == null ? defaultOffset : parseInt(off.toString());
  const start = offset <= defaultOffset ? 0 : offset - defaultOffset;

  try {
    if (daily) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0); // Set to the start of the day (UTC)

      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999); // Set to the end of the day (UTC)

      const memesCount = await Meme.find({
        is_voting_close: true,
        is_deleted: false,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).countDocuments();

      const memes = await Meme.find({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        is_deleted: false,
      })
        .skip(start)
        .limit(defaultOffset)
        .where({ is_voting_close: true })
        .populate("created_by");

      return NextResponse.json(
        { memes: memes, memesCount: memesCount },
        { status: 200 }
      );
    } else {
      const memesCount = await Meme.find({
        is_voting_close: true,
        is_deleted: false,
      }).countDocuments();

      const memes = await await Meme.find()
        .skip(start)
        .limit(defaultOffset)
        .where({ is_voting_close: true, is_deleted: false })
        .populate("created_by");

      return NextResponse.json(
        { memes: memes, memesCount: memesCount },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error },
      {
        status: 500,
      }
    );
  }
}

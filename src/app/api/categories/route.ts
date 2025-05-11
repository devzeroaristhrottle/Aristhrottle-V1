import connectToDatabase from "@/lib/db";
import Categories from "@/models/Categories";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
 
async function handleGetRequest(req: NextRequest) {
  try {
    await connectToDatabase();

    const name = new URLSearchParams(req.nextUrl.search).get("name");

    if (name) {
      const categories = await Categories.find({
        name: { $regex: name, $options: "i" },
      });

      return NextResponse.json({ categories: categories }, { status: 200 });
    }

    const categories = await Categories.find().sort({count:-1}).limit(10);

    return NextResponse.json({ categories: categories }, { status: 200 });
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

    const { categories } = await req.json();

    // Validate input
    if (!Array.isArray(categories) || categories.length === 0) {
      throw "Invalid categories data";
    }

    // Insert categories into the database
    const result = await Categories.insertMany(categories, { ordered: false }); // ordered: false allows partial insertions if some documents fail

    return NextResponse.json(
      {
        categories: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as {errorResponse:{code:number}}).errorResponse!.code === 11000
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
        error: String(error), // Convert the error to string to handle unknown types safely
      },
      { status: 500 }
    );
  }
}

export const GET = handleGetRequest;
export const POST = withApiLogging(handlePostRequest, "Create_Categories");

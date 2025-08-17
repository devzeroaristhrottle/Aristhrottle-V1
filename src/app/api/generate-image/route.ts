import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import { hasDayPassed } from "@/utils/dateUtils";
import connectToDatabase from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Check authentication
    const token = await getToken({ req: request });
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the UTC day has changed since last reset
    let resetNeeded = false;
    if (user.lastGenerationReset && hasDayPassed(user.lastGenerationReset)) {
      // Reset generations counter
      user.generations = 0;
      // Set lastGenerationReset to current UTC date
      const now = new Date();
      user.lastGenerationReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      resetNeeded = true;
    }

    // Check if user has reached generation limit
    if (user.generations >= 5) {
      return NextResponse.json(
        { error: "Daily generation limit reached (5 per day). Resets at 00:00 UTC." },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { title, tags } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    console.log("Starting image generation for:", title, "with tags:", tags);

    // Forward the request to the image generation service
    const response = await axios.post(
      'http://localhost:8000/api/v1/images/generate',
      {
        title,
        tags,
        filename: 'image.png',
      },
      {
        responseType: 'arraybuffer', // Important for handling binary data
        timeout: 120000, // Increase timeout to 2 minutes
      }
    );

    console.log("Image generated successfully, size:", response.data.length);

    // Update user's generation count
    if (resetNeeded) {
      // If we already reset, just increment to 1
      user.generations = 1;
      await user.save();
    } else {
      // Otherwise increment the existing count
      await User.findByIdAndUpdate(user._id, {
        $inc: { generations: 1 }
      });
    }

    // Return the image data with appropriate headers
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="generated-image.png"',
      },
    });
  } catch (error: any) {
    console.error("Error generating image:", error);

    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: "Image generation timed out",
          details: "The request took too long to complete. Try a simpler prompt."
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }}
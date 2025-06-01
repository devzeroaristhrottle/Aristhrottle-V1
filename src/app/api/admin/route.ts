import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Meme from "@/models/Meme";
import Vote from "@/models/Vote";
import Tags from "@/models/Tags";
import Categories from "@/models/Categories";
import Followers from "@/models/Followers";
import Milestone from "@/models/Milestone";
import Notification from "@/models/Notification";
import Referrals from "@/models/Referrals";
import ApiLog from "@/models/ApiLog";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from request
    const token = await getToken({ req: request });
    
    // Check if user is authenticated
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Find the user by wallet address
    const user = await User.findOne({
      user_wallet_address: token.address,
    });

    // Check if user exists and has admin role
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Determine which model to return data from based on query parameter
    const modelParam = request.nextUrl.searchParams.get("model");
    
    let data;
    
    // If a specific model is requested, return data from that model
    if (modelParam) {
      switch(modelParam.toLowerCase()) {
        case "users":
          data = await User.find();
          break;
        case "memes":
          data = await Meme.find().populate("created_by").populate("tags").populate("categories");
          break;
        case "votes":
          data = await Vote.find().populate("vote_by").populate("vote_to");
          break;
        case "tags":
          data = await Tags.find();
          break;
        case "categories":
          data = await Categories.find();
          break;
        case "followers":
          data = await Followers.find().populate("follower").populate("following");
          break;
        case "milestones":
          data = await Milestone.find().populate("created_by");
          break;
        case "notifications":
          data = await Notification.find().populate("notification_for");
          break;
        case "referrals":
          data = await Referrals.find();
          break;
        case "apilogs":
          data = await ApiLog.find().populate("user_id");
          break;
        default:
          return NextResponse.json(
            { error: "Invalid model specified" },
            { status: 400 }
          );
      }
    } else {
      // If no specific model requested, return counts of all collections
      data = {
        users: await User.countDocuments(),
        memes: await Meme.countDocuments(),
        votes: await Vote.countDocuments(),
        tags: await Tags.countDocuments(),
        categories: await Categories.countDocuments(),
        followers: await Followers.countDocuments(),
        milestones: await Milestone.countDocuments(),
        notifications: await Notification.countDocuments(),
        referrals: await Referrals.countDocuments(),
        apiLogs: await ApiLog.countDocuments()
      };
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


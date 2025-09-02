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
import MintLog from "@/models/MintLog";
import Report from "@/models/Report";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SortOrder } from "mongoose";

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

    // Get query parameters
    const modelParam = request.nextUrl.searchParams.get("model");
    const sortKey = request.nextUrl.searchParams.get("sortKey");
    const sortDirection = request.nextUrl.searchParams.get("sortDirection");
    
    // Create sort object for MongoDB queries
    const sortObj: Record<string, SortOrder> = {};
    if (sortKey) {
      sortObj[sortKey] = sortDirection === "descending" ? -1 : 1;
    }
    
    let data;
    
    // If a specific model is requested, return data from that model
    if (modelParam) {
      switch(modelParam.toLowerCase()) {
        case "users":
          data = await User.find().sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "memes":
          data = await Meme.find()
            .populate("created_by")
            .populate("tags")
            .populate("categories")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "votes":
          data = await Vote.find()
            .populate("vote_by")
            .populate("vote_to")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "tags":
          data = await Tags.find().sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "categories":
          data = await Categories.find().sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "followers":
          data = await Followers.find()
            .populate("follower")
            .populate("following")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "milestones":
          data = await Milestone.find()
            .populate("created_by")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "notifications":
          data = await Notification.find()
            .populate("notification_for")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "referrals":
          data = await Referrals.find().sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "apilogs":
          data = await ApiLog.find()
            .populate("user_id")
            .sort(Object.keys(sortObj).length ? sortObj : undefined);
          break;
        case "mintlogs":
          // Default sort by createdAt if no sort specified
          const mintLogSort = Object.keys(sortObj).length ? sortObj : { createdAt: -1 as SortOrder };
          data = await MintLog.find()
            .sort(mintLogSort)
            .limit(100);
          break;
        case "reports":
          data = await Report.find()
            .populate({
              path: "meme",
              populate: [
                { path: "created_by", select: "username user_wallet_address" },
                { path: "tags", select: "name" }
              ]
            })
            .populate("reported_by", "username user_wallet_address")
            .populate("reviewed_by", "username user_wallet_address")
            .sort(Object.keys(sortObj).length ? sortObj : { createdAt: -1 as SortOrder });
          break;
        default:
          return NextResponse.json(
            { error: "Invalid model specified" },
            { status: 400 }
          );
      }
      
      // Handle special sorting cases for populated fields
      if (sortKey && sortKey.includes('.')) {
        const [parentField, childField] = sortKey.split('.');
        
        data.sort((a, b) => {
          let aValue = a[parentField] ? a[parentField][childField] : null;
          let bValue = b[parentField] ? b[parentField][childField] : null;
          
          // Handle string comparison
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'ascending' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          
          // Handle numeric comparison
          if (aValue === null) aValue = sortDirection === 'ascending' ? Infinity : -Infinity;
          if (bValue === null) bValue = sortDirection === 'ascending' ? Infinity : -Infinity;
          
          return sortDirection === 'ascending' ? aValue - bValue : bValue - aValue;
        });
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
        apiLogs: await ApiLog.countDocuments(),
        mintLogs: await MintLog.countDocuments(),
        reports: await Report.countDocuments()
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


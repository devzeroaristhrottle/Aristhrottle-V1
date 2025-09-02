import connectToDatabase from "@/lib/db";
import Report from "@/models/Report";
import Meme from "@/models/Meme";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import { getToken } from "next-auth/jwt";

async function handleGetRequest(request: NextRequest) {
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

    const query = new URLSearchParams(request.nextUrl.search);
    const status = query.get("status") || "pending";
    const limit = parseInt(query.get("limit") || "50");
    const offset = parseInt(query.get("offset") || "0");

    // Build filter
    const filter: any = {};
    if (status !== "all") {
      filter.status = status;
    }

    // Get reports with populated fields
    const reports = await Report.find(filter)
      .populate({
        path: "meme",
        populate: [
          { path: "created_by", select: "username user_wallet_address" },
          { path: "tags", select: "name" }
        ]
      })
      .populate("reported_by", "username user_wallet_address")
      .populate("reviewed_by", "username user_wallet_address")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Report.countDocuments(filter);

    return NextResponse.json({
      reports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const { memeId, reason, description } = await request.json();

    // Validate input
    if (!memeId || !reason) {
      return NextResponse.json(
        { error: "Meme ID and reason are required" },
        { status: 400 }
      );
    }

    // Get token from request
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if meme exists and is not deleted
    const meme = await Meme.findOne({ _id: memeId, is_deleted: false });
    if (!meme) {
      return NextResponse.json(
        { error: "Meme not found or has been deleted" },
        { status: 404 }
      );
    }

    // Prevent users from reporting their own memes
    if (meme.created_by.toString() === user._id.toString()) {
      return NextResponse.json(
        { error: "You cannot report your own meme" },
        { status: 400 }
      );
    }

    // Check if user has already reported this meme
    const existingReport = await Report.findOne({
      meme: memeId,
      reported_by: user._id
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this meme" },
        { status: 409 }
      );
    }

    // Create new report
    const newReport = new Report({
      meme: memeId,
      reported_by: user._id,
      reason,
      description: description || "",
      status: "pending"
    });

    const savedReport = await newReport.save();

    // Populate the saved report for response
    const populatedReport = await Report.findById(savedReport._id)
      .populate("meme", "name image_url")
      .populate("reported_by", "username");

    return NextResponse.json(
      { 
        message: "Report submitted successfully",
        report: populatedReport
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function handlePutRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const { reportId, status, admin_action, admin_notes } = await request.json();

    // Get token from request
    const token = await getToken({ req: request });
    
    if (!token || !token.address) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the user and check admin role
    const user = await User.findOne({ user_wallet_address: token.address });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Find the report
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Update report
    const updateData: any = {
      reviewed_by: user._id,
    };

    if (status) updateData.status = status;
    if (admin_action) updateData.admin_action = admin_action;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    
    if (status === "resolved" || status === "dismissed") {
      updateData.resolved_at = new Date();
    }

    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    ).populate([
      {
        path: "meme",
        populate: [
          { path: "created_by", select: "username user_wallet_address" },
          { path: "tags", select: "name" }
        ]
      },
      { path: "reported_by", select: "username user_wallet_address" },
      { path: "reviewed_by", select: "username user_wallet_address" }
    ]);

    return NextResponse.json(
      { 
        message: "Report updated successfully",
        report: updatedReport
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGetRequest, "Get_Reports");
export const POST = withApiLogging(handlePostRequest, "Create_Report");
export const PUT = withApiLogging(handlePutRequest, "Update_Report");

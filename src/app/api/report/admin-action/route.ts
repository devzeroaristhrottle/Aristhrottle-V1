import connectToDatabase from "@/lib/db";
import Report from "@/models/Report";
import Meme from "@/models/Meme";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import { getToken } from "next-auth/jwt";

async function handlePostRequest(request: NextRequest) {
  try {
    await connectToDatabase();

    const { reportId, action } = await request.json();

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
    const report = await Report.findById(reportId).populate("meme");
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      reviewed_by: user._id,
      status: "resolved",
      resolved_at: new Date()
    };

    if (action === "delete_meme") {
      // Soft delete the meme
      await Meme.findByIdAndUpdate(report.meme._id, { 
        is_deleted: true 
      });
      
      updateData.admin_action = "meme_deleted";
      updateData.admin_notes = "Meme deleted by admin due to report";

      // Update all other pending reports for this meme
      await Report.updateMany(
        { 
          meme: report.meme._id, 
          status: "pending" 
        },
        {
          status: "resolved",
          admin_action: "meme_deleted",
          reviewed_by: user._id,
          resolved_at: new Date(),
          admin_notes: "Meme deleted - auto-resolved related reports"
        }
      );

    } else if (action === "dismiss_report") {
      updateData.status = "dismissed";
      updateData.admin_action = "none";
      updateData.admin_notes = "Report dismissed - no violation found";
    }

    // Update the current report
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
        message: action === "delete_meme" ? "Meme deleted successfully" : "Report dismissed successfully",
        report: updatedReport
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error handling admin action:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePostRequest, "Admin_Report_Action");

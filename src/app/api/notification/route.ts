import Notification from "@/models/Notification";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { checkIsAuthenticated } from "@/utils/authFunctions";
import { withApiLogging } from "@/utils/apiLogger";

async function handleGetRequest(req: NextRequest) {
  await connectToDatabase();

  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(userId, req);

    const notifications = await Notification.find({ notification_for: userId })
      .sort({ createdAt: -1 })
      .populate("notification_for");
    return NextResponse.json({ message: notifications }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching notifications", error: error },
      { status: 500 }
    );
  }
}

async function handlePostRequest(req: NextRequest) {
  await connectToDatabase();

  // Create a new notification
  try {
    const { title, message, type, notification_for } = await req.json();
    if (!title || !message || !notification_for) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      notification_for,
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error saving notification", error: error },
      { status: 500 }
    );
  }
}

async function handlePatchRequest(req: NextRequest) {
  await connectToDatabase();

  try {
    const Id = req.nextUrl.searchParams.get("id");

    if (!Id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await checkIsAuthenticated(Id, req);

    //   let a = await Notification.findByIdAndUpdate(Id, { isRead: true });
    await Notification.findOneAndUpdate({ _id: Id }, { isRead: true });
    return NextResponse.json(
      { message: "Notification marked as read" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating notification", error: error },
      { status: 500 }
    );
  }
}

export const GET = handleGetRequest;
export const POST = withApiLogging(handlePostRequest, "Create_Notification");
export const PATCH = withApiLogging(handlePatchRequest, "Mark_Notification_Read");

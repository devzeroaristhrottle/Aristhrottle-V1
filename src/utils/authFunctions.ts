import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const checkIsAuthenticated = async (
  userId: string,
  request: NextRequest
) => {
  const user = await User.findById(userId);

  const token = await getToken({ req: request });

  if (
    !user ||
    token == null ||
    !token.address ||
    token.address != user.created_by
  ) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
};

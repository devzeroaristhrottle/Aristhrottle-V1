import { NextRequest, NextResponse } from "next/server";
import ApiLog from "@/models/ApiLog";
import connectToDatabase from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function logApiRequest(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  action: string,
) {
  // Start timing the request
  const startTime = Date.now();
  
  // Connect to the database
  await connectToDatabase();
  
  // Get token and user information if available
  const token = await getToken({ req: request });
  
  // Parse request information
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Get request body if applicable (with caution, as you can't read the body twice)
  const bodyData = null;
  
  try {
    // Process the request with the original handler
    const response = await handler(request);
    
    // Log the API request
    await ApiLog.create({
      user_wallet_address: token?.address || null,
      ip_address: ip,
      request_method: method,
      request_path: path,
      query_params: url.search ? url.search.substring(1) : null,
      body_data: bodyData,
      response_status: response.status,
      action: action,
      processing_time_ms: Date.now() - startTime,
      user_agent: userAgent,
    });
    
    return response;
  } catch (error) {
    // Log the error
    await ApiLog.create({
      user_wallet_address: token?.address || null,
      ip_address: ip,
      request_method: method,
      request_path: path,
      query_params: url.search ? url.search.substring(1) : null,
      body_data: bodyData,
      response_status: 500,
      action: action,
      processing_time_ms: Date.now() - startTime,
      user_agent: userAgent,
    });
    
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error },
      { status: 500 }
    );
  }
} 
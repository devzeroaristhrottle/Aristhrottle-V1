import { NextRequest, NextResponse } from "next/server";
import { logApiRequest } from "@/middleware/logApiRequest";

/**
 * Wraps an API handler function with logging middleware
 * 
 * @param handler The original API handler function
 * @param action A descriptive name for the API action being performed
 * @returns A new handler function with logging
 */
export function withApiLogging<T extends NextResponse>(
  handler: (request: NextRequest) => Promise<T>,
  action: string
) {
  return async (request: NextRequest) => {
    return logApiRequest(request, handler, action);
  };
}

/**
 * Example usage:
 * 
 * // In your route.ts file:
 * async function handleGetRequest(request: NextRequest) {
 *   // Your API logic here
 * }
 * 
 * export const GET = withApiLogging(handleGetRequest, "Get_ResourceName");
 */ 
import { NextResponse } from "next/server";
import { withApiLogging } from "@/utils/apiLogger";
import connectToDatabase from "@/lib/db";
import mongoose from "mongoose";

/**
 * Health check endpoint to verify system status
 * Checks database connectivity and returns overall health status
 */
async function handleHealthCheck() {
  type HealthStatus = {
    status: string;
    uptime: number;
    timestamp: string;
    database: {
      status: string;
      connectionState: string;
      error?: string;
    };
    environment: string;
  };

  const healthStatus: HealthStatus = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: "unknown",
      connectionState: "unknown"
    },
    environment: process.env.NODE_ENV || "development"
  };

  try {
    // Check database connection
    await connectToDatabase();
    
    // Get MongoDB connection state
    const connectionState = mongoose.connection.readyState;
    
    // Map connection state to string value
    let connectionStateString = "unknown";
    if (connectionState === 0) connectionStateString = "disconnected";
    else if (connectionState === 1) connectionStateString = "connected";
    else if (connectionState === 2) connectionStateString = "connecting";
    else if (connectionState === 3) connectionStateString = "disconnecting";
    
    healthStatus.database = {
      status: connectionState === 1 ? "ok" : "error",
      connectionState: connectionStateString
    };
    
    // If database is not connected, set overall status to error
    if (connectionState !== 1) {
      healthStatus.status = "error";
    }
  } catch (error) {
    healthStatus.status = "error";
    healthStatus.database = {
      status: "error",
      connectionState: "failed",
      error: error instanceof Error ? error.message : "Unknown database error"
    };
  }

  return NextResponse.json(healthStatus, {
    status: healthStatus.status === "ok" ? 200 : 503
  });
}

export const GET = withApiLogging(handleHealthCheck, "Health_Check"); 
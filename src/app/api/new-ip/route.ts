import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose, { Document, Model } from 'mongoose';

// Store for IPs in memory (will reset on server restart)
const visitedIPs = new Set<string>();

// Define interface for visitor document
interface IVisitorIP extends Document {
  ip: string;
  firstVisit: Date;
  userAgent?: string;
}

// Create a schema for visitor IPs
const VisitorIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  firstVisit: { type: Date, default: Date.now },
  userAgent: { type: String }
});

// Get or create the model
const getVisitorModel = (): Model<IVisitorIP> => {
  try {
    return mongoose.model<IVisitorIP>('VisitorIP');
  } catch {
    return mongoose.model<IVisitorIP>('VisitorIP', VisitorIPSchema);
  }
};

/**
 * Handles both GET and POST requests to check if an IP is new
 * Returns { message: true } for first-time visitors
 * Returns { message: false } for returning visitors
 */
async function handleRequest(request: NextRequest) {
  try {
    // Get the client's IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    // Connect to MongoDB using the existing connection function
    await connectToDatabase();
    const VisitorIP = getVisitorModel();
    
    // Check if IP exists in database
    const existingIP = await VisitorIP.findOne({ ip });
    
    // If IP is in memory or database, it's not new
    if (visitedIPs.has(ip) || existingIP) {
      return NextResponse.json({ message: false });
    }
    
    // This is a new IP - add to memory and database
    visitedIPs.add(ip);
    await new VisitorIP({ 
      ip, 
      firstVisit: new Date(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    }).save();
    
    return NextResponse.json({ message: true });
  } catch (error) {
    console.error('Error in new-ip endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

// Handle POST requests
export async function POST(request: NextRequest) {
  return handleRequest(request);
} 
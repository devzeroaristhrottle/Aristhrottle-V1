import User from "@/models/User";
import { getTimeUntilReset, hasDayPassed } from "./dateUtils";

/**
 * Gets the remaining generations for a user and updates the counter if needed
 * @param userId The user ID to check
 * @returns Object containing remaining generations and time until reset
 */
export async function getRemainingGenerations(userId: string): Promise<{
  remaining: number;
  total: number;
  timeUntilReset: string;
}> {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Check if the UTC day has changed since last reset
  if (user.lastGenerationReset && hasDayPassed(user.lastGenerationReset)) {
    // Reset generations counter
    user.generations = 0;
    // Set lastGenerationReset to current UTC date
    const now = new Date();
    user.lastGenerationReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    await user.save();
  }
  
  const MAX_GENERATIONS = 5;
  const remaining = Math.max(0, MAX_GENERATIONS - user.generations);
  
  return {
    remaining,
    total: MAX_GENERATIONS,
    timeUntilReset: getTimeUntilReset()
  };
} 
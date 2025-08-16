import Milestone from "@/models/Milestone";
import { MilestoneType, getMilestoneReward, getMilestoneThresholds } from "@/config/rewardsConfig";
import mongoose from "mongoose";

/**
 * Creates a milestone if it doesn't exist yet, using an atomic operation to prevent race conditions
 * 
 * @param userId The user ID to create the milestone for
 * @param milestoneNumber The milestone number (e.g., 1, 10, 50, etc.)
 * @param milestoneType The type of milestone (vote, vote-total, upload, etc.)
 * @returns The created or existing milestone
 */
export async function createMilestoneIfNotExists(
  userId: string,
  milestoneNumber: number,
  milestoneType: MilestoneType
): Promise<mongoose.Document | null> {
  try {
    // Get the reward amount for this milestone
    const reward = getMilestoneReward(milestoneType, milestoneNumber);
    
    if (reward === undefined) {
      console.error(`No reward defined for milestone ${milestoneNumber} of type ${milestoneType}`);
      return null;
    }
    
    // Use findOneAndUpdate with upsert to atomically create the milestone if it doesn't exist
    // This prevents race conditions when multiple requests try to create the same milestone
    const milestone = await Milestone.findOneAndUpdate(
      {
        created_by: userId,
        milestone: milestoneNumber,
        type: milestoneType
      },
      {
        $setOnInsert: {
          milestone: milestoneNumber,
          reward: reward,
          is_claimed: false,
          created_by: userId,
          type: milestoneType
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    return milestone;
  } catch (error) {
    console.error(`Error creating milestone (${milestoneType}, ${milestoneNumber}) for user ${userId}:`, error);
    return null;
  }
}

/**
 * Checks if a user has reached any milestones and creates them if needed
 * 
 * @param userId The user ID to check milestones for
 * @param count The current count value
 * @param milestoneType The type of milestone to check
 * @param thresholds Array of milestone thresholds to check against
 * @returns Array of created milestones
 */
export async function checkAndCreateMilestones(
  userId: string,
  count: number,
  milestoneType: MilestoneType,
  thresholds: number[]
): Promise<mongoose.Document[]> {
  const createdMilestones: mongoose.Document[] = [];
  
  // Check if the current count matches any milestone threshold
  if (thresholds.includes(count)) {
    const milestone = await createMilestoneIfNotExists(userId, count, milestoneType);
    if (milestone) {
      createdMilestones.push(milestone);
    }
  }
  
  return createdMilestones;
} 

/**
 * Centralized function to check for milestones across different types of user activity
 * Replaces the duplicated milestone checking logic in various route handlers
 * 
 * @param userId The user ID to check milestones for
 * @param activityType The type of user activity ('vote', 'upload', or 'referral')
 * @param totalCountsModel The mongoose model to query for total counts
 * @param totalCountQuery Query parameters for counting total activities
 * @param majorityCountQuery Query parameters for counting majority activities (if applicable)
 * @returns Array of created milestone documents
 */
export async function processActivityMilestones(
  userId: string,
  activityType: 'vote' | 'upload' | 'referral',
  totalCountsModel: mongoose.Model<any>,
  totalCountQuery: object,
  majorityCountQuery?: object
): Promise<mongoose.Document[]> {
  const createdMilestones: mongoose.Document[] = [];
  
  // Count total activities of this type
  const totalCount = await totalCountsModel.find(totalCountQuery).countDocuments();
  
  // Check first activity milestone (special case)
  if (totalCount === 1) {
    const milestone = await createMilestoneIfNotExists(
      userId, 
      1, 
      `${activityType === 'referral' ? activityType : `${activityType}-total`}` as MilestoneType
    );
    
    if (milestone) {
      createdMilestones.push(milestone);
    }
  }
  
  // Check total milestones (excluding first one which is handled specially)
  const totalThresholds = getMilestoneThresholds(
    `${activityType === 'referral' ? activityType : `${activityType}-total`}` as MilestoneType
  ).filter(t => t > 1);
  
  if (totalThresholds.includes(totalCount)) {
    const milestone = await createMilestoneIfNotExists(
      userId,
      totalCount,
      `${activityType === 'referral' ? activityType : `${activityType}-total`}` as MilestoneType
    );
    
    if (milestone) {
      createdMilestones.push(milestone);
    }
  }
  
  // For vote and upload, also check majority milestones (not applicable for referrals)
  if (activityType !== 'referral' && majorityCountQuery) {
    const majorityCount = await totalCountsModel.find(majorityCountQuery).countDocuments();
    
    const majorityThresholds = getMilestoneThresholds(activityType as MilestoneType);
    
    if (majorityThresholds.includes(majorityCount)) {
      const milestone = await createMilestoneIfNotExists(
        userId,
        majorityCount,
        activityType as MilestoneType
      );
      
      if (milestone) {
        createdMilestones.push(milestone);
      }
    }
  }
  
  return createdMilestones;
}
/**
 * Rewards Configuration
 * 
 * This file centralizes all reward-related configuration to make it easier to maintain
 * and update the rewards system across the application.
 */

// Define reward record types
export type RewardRecord = Record<number, number>;

// Milestone rewards for majority votes (votes on memes that reach majority)
export const MAJORITY_VOTES_REWARDS: RewardRecord = {
  10: 25,   // 10 majority votes = 25 tokens
  50: 100,  // 50 majority votes = 100 tokens
  100: 250, // 100 majority votes = 250 tokens
  250: 500, // 250 majority votes = 500 tokens
};

// Milestone rewards for total votes cast
export const TOTAL_VOTES_REWARDS: RewardRecord = {
  1: 5,     // First vote = 5 tokens
  50: 10,   // 50 total votes = 10 tokens
  100: 25,  // 100 total votes = 25 tokens
  250: 75,  // 250 total votes = 75 tokens
  500: 100, // 500 total votes = 100 tokens
};

// Milestone rewards for majority uploads (uploads that reach majority)
export const MAJORITY_UPLOAD_REWARDS: RewardRecord = {
  10: 50,    // 10 majority uploads = 50 tokens
  50: 250,   // 50 majority uploads = 250 tokens
  100: 650,  // 100 majority uploads = 650 tokens
  250: 1500, // 250 majority uploads = 1500 tokens
};

// Milestone rewards for total uploads
export const TOTAL_UPLOAD_REWARDS: RewardRecord = {
  1: 5,      // First upload = 5 tokens
  50: 50,    // 50 total uploads = 50 tokens
  100: 150,  // 100 total uploads = 150 tokens
  250: 500,  // 250 total uploads = 500 tokens
  500: 1000, // 500 total uploads = 1000 tokens
};

// Milestone rewards for referrals
export const REFERRAL_REWARDS: RewardRecord = {
  1: 5,      // First referral = 5 tokens
  10: 25,    // 10 referrals = 25 tokens
  25: 75,    // 25 referrals = 75 tokens
  50: 150,   // 50 referrals = 150 tokens
  100: 300,  // 100 referrals = 300 tokens
  250: 1000, // 250 referrals = 1000 tokens
  500: 2000, // 500 referrals = 2000 tokens
};

// Points multipliers for different actions
export const POINTS_MULTIPLIERS = {
  VOTE: 0.1,     // 0.1 tokens per vote
  UPLOAD: 1.0,    // 1.0 tokens per upload
  REFERRAL: 5.0,  // 5.0 tokens per referral
};

// Milestone types
export type MilestoneType = 'vote' | 'vote-total' | 'referral' | 'upload' | 'upload-total';

// Helper function to get milestone thresholds for a specific type
export function getMilestoneThresholds(type: MilestoneType): number[] {
  switch (type) {
    case 'vote':
      return Object.keys(MAJORITY_VOTES_REWARDS).map(Number);
    case 'vote-total':
      return Object.keys(TOTAL_VOTES_REWARDS).map(Number);
    case 'upload':
      return Object.keys(MAJORITY_UPLOAD_REWARDS).map(Number);
    case 'upload-total':
      return Object.keys(TOTAL_UPLOAD_REWARDS).map(Number);
    case 'referral':
      return Object.keys(REFERRAL_REWARDS).map(Number);
    default:
      return [];
  }
}

// Helper function to get reward for a specific milestone
export function getMilestoneReward(type: MilestoneType, milestone: number): number | undefined {
  switch (type) {
    case 'vote':
      return MAJORITY_VOTES_REWARDS[milestone];
    case 'vote-total':
      return TOTAL_VOTES_REWARDS[milestone];
    case 'upload':
      return MAJORITY_UPLOAD_REWARDS[milestone];
    case 'upload-total':
      return TOTAL_UPLOAD_REWARDS[milestone];
    case 'referral':
      return REFERRAL_REWARDS[milestone];
    default:
      return undefined;
  }
}

// Daily limits
export const DAILY_LIMITS = {
  VOTES: 20,
  UPLOADS: 20,
};

// Percentile threshold for majority
export const MAJORITY_PERCENTILE_THRESHOLD = 50; 
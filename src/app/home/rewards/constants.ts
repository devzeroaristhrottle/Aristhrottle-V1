import {
  MAJORITY_VOTES_REWARDS,
  TOTAL_VOTES_REWARDS,
  MAJORITY_UPLOAD_REWARDS,
  TOTAL_UPLOAD_REWARDS,
  REFERRAL_REWARDS,
  MilestoneType
} from '@/config/rewardsConfig';


export const TABLE_DATA = [
  { category: 'Daily', values: [2, 7, 10, 17, 5] },
  { category: 'All-Time', values: [30, 36, 47, 87, 27] },
]

export enum Section {
  Votes = 'votes',
  Rewards = 'rewards',
  Uploads = 'uploads',
}

// Re-export the MilestoneType from rewardsConfig.ts for consistency
export type { MilestoneType }

export type Milestone = {
  milestone: number
  reward: number
  is_claimed: boolean
  created_by: string
  type: MilestoneType
  _id: string
  createdAt: string
  __v: number
}

export type MilestoneTitles = {
  title: string | undefined
  number: number
  reward: number
  type: MilestoneType
  isClaimed: boolean
  canClaim: boolean
  _id: string | null
}

export const getMilestoneKeys = (rewards: Record<number, any>): number[] => {
  return Object.keys(rewards)
    .map(Number)
    .sort((a, b) => a - b)
}

// Use the imported constants instead of redefining them
export const majorityVotesRewards = MAJORITY_VOTES_REWARDS
export const totalVotesRewards = TOTAL_VOTES_REWARDS
export const majorityUploadRewards = MAJORITY_UPLOAD_REWARDS
export const totalUploadRewards = TOTAL_UPLOAD_REWARDS
export const referralRewards = REFERRAL_REWARDS

export const getMilestoneTitles = (
  milestoneDetails: Milestone[],
  groupType: 'votes' | 'uploads' | 'referrals'
) => {
  // Get all possible milestones for the requested group type
  const allMilestones = (() => {
    switch (groupType) {
      case 'votes':
        return [
          ...Object.entries(majorityVotesRewards).map(
            ([milestone, reward]) => ({
              milestone: Number(milestone),
              reward,
              type: 'vote' as const,
            })
          ),
          ...Object.entries(totalVotesRewards).map(([milestone, reward]) => ({
            milestone: Number(milestone),
            reward,
            type: 'vote-total' as const,
          })),
        ]
      case 'uploads':
        return [
          ...Object.entries(majorityUploadRewards).map(
            ([milestone, reward]) => ({
              milestone: Number(milestone),
              reward,
              type: 'upload' as const,
            })
          ),
          ...Object.entries(totalUploadRewards).map(([milestone, reward]) => ({
            milestone: Number(milestone),
            reward,
            type: 'upload-total' as const,
          })),
        ]
      case 'referrals':
        return Object.entries(referralRewards).map(([milestone, reward]) => ({
          milestone: Number(milestone),
          reward,
          type: 'referral' as const,
        }))
      default:
        const _exhaustiveCheck: never = groupType
        return _exhaustiveCheck
    }
  })()

  // Process each milestone
  return allMilestones
    .map(({ milestone, reward, type }) => {
      // Find matching user milestone (if completed)
      const userMilestone = milestoneDetails.find(
        (m) => m.milestone === milestone && m.type === type
      )

      // Generate human-readable title
      const title = (() => {
        switch (type) {
          case 'vote':
            return milestone === 10
              ? 'Reach 10 Majority Votes'
              : `Reach ${milestone} Majority Votes`
          case 'vote-total':
            return milestone === 1
              ? 'Cast First Vote'
              : `Cast ${milestone} Total Votes`
          case 'upload':
            return milestone === 10
              ? 'Reach 10 Majority Uploads'
              : `Reach ${milestone} Majority Uploads`
          case 'upload-total':
            return milestone === 1
              ? 'First Upload'
              : `${milestone} Total Uploads`
          case 'referral':
            return milestone === 1 ? 'Refer 1 User' : `Refer ${milestone} Users`
          default:
            const _exhaustiveCheck: never = type
            return _exhaustiveCheck
        }
      })()

      return {
        title,
        number: milestone,
        reward,
        type,
        isClaimed: userMilestone?.is_claimed || false,
        canClaim: !!userMilestone && !userMilestone.is_claimed,
        _id: userMilestone?._id || null,
      }
    })
    .sort((a, b) => a.number - b.number) // Sort by milestone number
}

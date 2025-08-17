export const rewardTasks = {
  votes: [
    { id: 1, title: 'Cast first vote', reward: 5, progress: 100 },
    // { id: 2, title: '20 Total Votes', reward: 100, progress: 22 },
    { id: 3, title: '50 Total Votes', reward: 250, progress: 59 },
    { id: 4, title: '100 Total Votes', reward: 500, progress: 82 },
  ],
  referrals: [
    { id: 1, title: 'Refer 1 user', reward: 50, progress: 19 },
    { id: 2, title: 'Refer 10 users', reward: 250, progress: 100 },
    { id: 3, title: 'Refer 15 users', reward: 500, progress: 0 },
    { id: 4, title: 'Refer 20 users', reward: 750, progress: 0 },
    { id: 5, title: 'Refer 25 users', reward: 950, progress: 0 },
    { id: 6, title: 'Refer 50 users', reward: 1250, progress: 0 },
    { id: 7, title: 'Refer 100 users', reward: 2250, progress: 0 },
  ],
  uploads: [
    { id: 1, title: 'Upload first artwork', reward: 20, progress: 49 },
    { id: 2, title: 'Upload 10 artworks', reward: 150, progress: 5 },
  ],
}

export type Tasks = {
  id: number
  title: string
  reward: number
  isClaimed: boolean
}

export const TABLE_DATA = [
  { category: 'Daily', values: [2, 7, 10, 17, 5] },
  { category: 'All-Time', values: [30, 36, 47, 87, 27] },
]

export enum Section {
  Votes = 'votes',
  Rewards = 'rewards',
  Uploads = 'uploads',
}

type MilestoneType = 'vote-total' | 'referral' | 'upload-total'

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

export const totalVotesRewards = {
  1: 5,
  50: 10,
  100: 25,
  250: 75,
  500: 100,
}

export const totalUploadRewards = {
  1: 5,
  50: 20,
  100: 150,
  250: 500,
  500: 1000,
}

export const referralRewards = {
  1: 5,
  10: 25,
  25: 75,
  50: 150,
  100: 300,
  250: 1000,
  500: 2000,
}

export const getMilestoneTitles = (
  milestoneDetails: Milestone[],
  groupType: 'votes' | 'uploads' | 'referrals'
) => {
  // Get all possible milestones for the requested group type
  const allMilestones = (() => {
    switch (groupType) {
      case 'votes':
        return Object.entries(totalVotesRewards).map(([milestone, reward]) => ({
          milestone: Number(milestone),
          reward,
          type: 'vote-total' as const,
        }))
      case 'uploads':
        return Object.entries(totalUploadRewards).map(([milestone, reward]) => ({
          milestone: Number(milestone),
          reward,
          type: 'upload-total' as const,
        }))
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
          case 'vote-total':
            return milestone === 1
              ? 'Cast First Vote'
              : `Cast ${milestone} Total Votes`
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
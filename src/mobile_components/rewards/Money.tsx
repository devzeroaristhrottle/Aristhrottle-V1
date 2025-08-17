import ProgressBar from './ProgressBar'
import { Milestones } from './Milestones'
import type { MilestoneTitles } from '@/app/home/rewards/constants'

// TODO: Replace with real user data from context or props
const userEart = 0
const userReferrals = 0

const moneyMilestones: MilestoneTitles[] = [
  {
    title: '250 $eART',
    number: 250,
    reward: 500,
    type: 'upload-total',
    isClaimed: false,
    canClaim: false,
    _id: null,
  },
  {
    title: '500 $eART',
    number: 500,
    reward: 1000,
    type: 'upload-total',
    isClaimed: false,
    canClaim: false,
    _id: null,
  },
  {
    title: '1,000 $eART',
    number: 1000,
    reward: 2000,
    type: 'upload-total',
    isClaimed: false,
    canClaim: false,
    _id: null,
  },
  {
    title: '100 Referrals',
    number: 100,
    reward: 10000,
    type: 'referral',
    isClaimed: false,
    canClaim: false,
    _id: null,
  },
]

const Money = () => {
  return (
        <div className="flex flex-col gap-4">
            {/* ProgressBar for eART milestones */}
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white mb-1">eART Progress</h3>
                <ProgressBar milestones={[250, 500, 1000]} currentValue={userEart} />
                <div className="text-xs text-white text-right pr-2">Current: {userEart} $eART</div>
            </div>
            {/* ProgressBar for referral milestone */}
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-white mb-1">Referral Progress</h3>
                <ProgressBar milestones={[100]} currentValue={userReferrals} />
                <div className="text-xs text-white text-right pr-2">Current: {userReferrals} Referrals</div>
            </div>
            {/* Milestones List */}
            <Milestones tasks={moneyMilestones} hasBorder={true} />
        </div>
    )
}

export default Money

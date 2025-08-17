import React, { useContext, useEffect, useState } from 'react'
import { Milestones } from './Milestones'
import {
	getMilestoneKeys,
	getMilestoneTitles,
	Milestone,
	MilestoneTitles,
	referralRewards,
} from '@/app/home/rewards/constants'
import { Context } from '@/context/contextProvider'
import { PiShare } from 'react-icons/pi'
import { toast } from 'react-toastify'
import axiosInstance from '@/utils/axiosInstance'
import ProgressBar from './ProgressBar'
// import { BiDownArrowAlt } from 'react-icons/bi'
import Loader from '@/components/Loader'
// import { useUser } from '@account-kit/react'

export type ReferralResponse = {
	totalReferralCount: number
	milestoneDetails: Milestone[]
	points: number
}

const Referrals = () => {
	const { userDetails, setUserDetails } = useContext(Context)
	const [referrals, setReferrals] = useState<ReferralResponse>()
	const [referralMilestones, setReferralMilestones] = useState<
		MilestoneTitles[]
	>(getMilestoneTitles([], 'referrals'))
	const [isLoading, setIsLoading] = useState(true)
	const [isClaimLoading, setIsClaimLoading] = useState(false)
	// const user = useUser()

	const userId = userDetails?._id

	const handleCopy = () => {
		if (userDetails?.refer_code) {
			navigator.clipboard.writeText(userDetails.refer_code)
			toast.success('Referral code copied to clipboard!')
		}
	}

	const handleReferralClaim = async () => {
		try {
			setIsClaimLoading(true)

			const response = await axiosInstance.post(`/api/claimreferralreward`, {
				userId,
			})
			if (response.status == 200) {
				toast.success('Reward claimed successfully!')
				if (userDetails && referrals)
					setUserDetails({
						...userDetails,
						mintedCoins:
							BigInt(userDetails?.mintedCoins) +
							BigInt(referrals.points * 1e18),
					})
			}
		} catch (error) {
			console.error('Error claiming the reward', error)
			toast.error('Error claiming the reward')
		} finally {
			setIsClaimLoading(false)
		}
	}

	useEffect(() => {
		const getReferralData = async () => {
			try {
				setIsLoading(true)
				const referralsResponse = await axiosInstance.get(
					`/api/rewards/referrals?userId=${userId}`
				)
				if (referralsResponse.data) {
					setReferrals(referralsResponse.data)
					const milestones = getMilestoneTitles(
						referralsResponse.data.milestoneDetails,
						'referrals'
					)
					setReferralMilestones(milestones)
				}
			} catch (error) {
				console.error('Error fetching referrals', error)
			} finally {
				setIsLoading(false)
			}
		}

		getReferralData()
	}, [userId, userDetails, isClaimLoading])

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full">
				<Loader />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Total Referrals */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-medium">Total Referrals</h2>
				<ProgressBar
					milestones={getMilestoneKeys(referralRewards)}
					currentValue={referrals?.totalReferralCount ?? 0}
				/>
			</div>

			{/* Referral Code */}
			{userDetails && userDetails?.refer_code && (
				<div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
					<h4 className="text-xl">Referral Code</h4>
					<div className="flex items-center gap-3">
						<span className="text-[#2FCAC7] text-2xl font-medium">
							{userDetails?.refer_code}
						</span>
						<button
							onClick={handleCopy}
							className="bg-black/10 rounded-full p-1.5 active:scale-95 transition-transform"
						>
							<PiShare className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}

			{/* Milestones */}
			<div className="flex flex-col gap-2 mt-2">
				<h2 className="text-xl font-medium">Milestones</h2>
				<Milestones hasBorder={false} tasks={referralMilestones} />
			</div>

			{/* Points section (only shown if points are available) */}
			{referrals?.points && referrals.points > 0 && (
				<div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
					<span className="text-xl">Points</span>
					<h2 className="text-[#2FCAC7] text-2xl">
						{referrals?.points === 0 ? 0 : referrals?.points.toFixed(1) ?? 0}{' '}
						$eART
					</h2>
					<button
						className="bg-black/10 border border-[#2FCAC7] rounded-lg text-lg px-6 py-1 active:scale-95 transition-transform"
						onClick={handleReferralClaim}
						disabled={isClaimLoading}
					>
						{isClaimLoading ? (
							<div className="h-4 w-4 py-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						) : (
							'Claim'
						)}
					</button>
				</div>
			)}

			{/* Rules */}
			{/* <div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
				<h4 className="text-xl">Rules</h4>
				<p className="text-lg">1 Referral</p>
				<BiDownArrowAlt className="w-6 h-6" />
				<span className="text-[#2FCAC7] text-xl">5 $eART</span>
				<p className="text-lg">to Both Users</p>
				<span className="text-[#2FCAC7] text-xs text-center">
					*$eART Points are rewarded only after both users have voted or
					uploaded at least once.
				</span>
			</div> */}

			{/* History */}
			{/* {user && user.address && (
				<div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
					<h4 className="text-xl">History</h4>
					<p className="text-[#2FCAC7] text-base text-center">
						View on blockchain explorer
					</p>
					<a
						href={`https://sepolia.arbiscan.io/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${user.address}`}
						target="_blank"
						rel="noopener noreferrer"
						className="bg-black/10 border border-[#2FCAC7] rounded-lg text-lg px-4 py-1 active:scale-95 transition-transform text-center"
					>
						View History
					</a>
				</div>
			)} */}
		</div>
	)
}

export default Referrals

import React, { useContext, useEffect, useState } from 'react'
import { Milestones } from './Milestones'
import {
	getMilestoneKeys,
	getMilestoneTitles,
	majorityVotesRewards,
	Milestone,
	MilestoneTitles,
	totalVotesRewards,
} from '@/app/home/rewards/constants'
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
import ProgressBar from './ProgressBar'
import Loader from '@/components/Loader'
// import {
// 	useSendUserOperation, 
// 	useSmartAccountClient,
// } from '@account-kit/react'
// import { encodeFunctionData } from 'viem'
// import { EArtTokenABI } from '@/ethers/contractAbi'
// import { toast } from 'react-toastify'

export type VotesResponse = {
	totalVotesCount: number
	majorityVotesCount: number
	milestoneDetails: Milestone[]
	points: number
	unClaimedMemeIds: string[]
	unClaimedReward: number
}

const Votes = () => {
	const { userDetails } = useContext(Context)
	const userId = userDetails?._id
	const [isLoading, setIsLoading] = useState(true)
	const [votesData, setVotesData] = useState<VotesResponse>()
	const [votesMilestones, setVotesMilestones] = useState<MilestoneTitles[]>(
		getMilestoneTitles([], 'votes')
	)
	// const { client } = useSmartAccountClient({})
	// const user = useUser()

	// const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
	// 	client,
	// 	// optional parameter that will wait for the transaction to be mined before returning
	// 	waitForTxn: true,
	// 	onSuccess: async () => {
	// 		await axiosInstance
	// 			.post('/api/rewards/votes/updateall', {
	// 				userId: userId,
	// 			})
	// 			.catch(() => {
	// 				toast.error('Failed to update vote status. Please try again.')
	// 			})
	// 		toast.success('Rewards claimed successfully!')
	// 		if (userDetails && votesData && votesData.unClaimedReward)
	// 			setUserDetails({
	// 				...userDetails,
	// 				mintedCoins:
	// 					BigInt(userDetails?.mintedCoins) +
	// 					BigInt(votesData.unClaimedReward * 1e18),
	// 			})
	// 	},
	// 	onError: () => {
	// 		toast.error('Failed to send user operation. Please try again.')
	// 	},
	// })

	useEffect(() => {
		const getUploadData = async () => {
			try {
				setIsLoading(true)
				const response = await axiosInstance.get(
					`/api/rewards/votes?userId=${userId}`
				)
				if (response.data) {
					setVotesData(response.data)
					const milestones = getMilestoneTitles(
						response.data.milestoneDetails,
						'votes'
					)
					setVotesMilestones(milestones)
				}
			} catch (error) {
				console.error('Error fetching Votes Data', error)
			} finally {
				setIsLoading(false)
			}
		}

		getUploadData()
	}, [userId, userDetails])

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full">
				<Loader />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Total Votes */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-medium">Total Votes</h2>
				<ProgressBar
					milestones={getMilestoneKeys(totalVotesRewards)}
					currentValue={votesData?.totalVotesCount ?? 0}
				/>
			</div>

			{/* Majority Votes */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-medium">Majority Votes</h2>
				<ProgressBar
					milestones={getMilestoneKeys(majorityVotesRewards)}
					currentValue={votesData?.majorityVotesCount ?? 0}
				/>
			</div>

			{/* Milestones */}
			<div className="flex flex-col gap-2 mt-2">
				<h2 className="text-xl font-medium">Milestones</h2>
				<Milestones hasBorder={false} tasks={votesMilestones} />
			</div>

			{/* Rules */}
			{/* <div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
				<h4 className="text-xl">Rules</h4>
				<p className="text-lg">1 Vote Cast</p>
				<BiDownArrowAlt className="w-6 h-6" />
				<span className="text-[#2FCAC7] text-xl">0.1 $eART</span>
				<p className="text-lg">to Voter</p>
				<span className="text-[#2FCAC7] text-xs text-center">
					*Majority Vote is counted when Voted Content has above average votes.
					(Total Votes on Platform / Number of Content) in 24 Hours
				</span>
			</div> */}

			{/* Points */}
			{/* {votesData?.unClaimedReward && votesData?.unClaimedReward > 0 && (
				<div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
					<span className="text-xl">Points</span>
					<p className="text-[#2FCAC7] text-2xl">
						{votesData?.points == 0 ? 0 : votesData?.points.toFixed(1) ?? 0}{' '}
						$eART
					</p>
					<button
						className="bg-black/10 border border-[#2FCAC7] rounded-lg text-lg px-6 py-1 active:scale-95 transition-transform"
						onClick={() => {
							try {
								const uoCallData = encodeFunctionData({
									abi: EArtTokenABI,
									functionName: 'claimAllMemeVoteRewards',
									args: [votesData?.unClaimedMemeIds],
								})

								if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
									sendUserOperation({
										uo: {
											target: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.slice(
												2,
												process.env.NEXT_PUBLIC_CONTRACT_ADDRESS.length
											)}`,
											data: uoCallData,
										},
									})
								}
							} catch (e) {
								console.error('Error claiming rewards', e)
								toast.error('Failed to claim rewards. Please try again.')
							}
						}}
						disabled={isSendingUserOperation}
					>
						{isSendingUserOperation ? 'Sending...' : 'Claim'}
					</button>
				</div>
			)} */}

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

export default Votes

import React, { useContext, useEffect, useState } from 'react'
import { Milestones } from './Milestones'
import {
	getMilestoneKeys,
	getMilestoneTitles,
	majorityVotesRewards,
	Milestone,
	MilestoneTitles,
	totalVotesRewards,
} from '../constants'
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
import ProgressBar from './ProgressBar'
import { BiDownArrowAlt } from 'react-icons/bi'
import Loader from '@/components/Loader'
import { useSendUserOperation, useSmartAccountClient, useUser } from '@account-kit/react'
import { encodeFunctionData } from 'viem'
import { EArtTokenABI } from '@/ethers/contractAbi'
import { toast } from 'react-toastify'

export type VotesResponse = {
	totalVotesCount: number
	majorityVotesCount: number
	milestoneDetails: Milestone[]
	points: number
	unClaimedMemeIds: string[]
	unClaimedReward: number
}

const Votes = () => {
	const { userDetails, setUserDetails } = useContext(Context)
	const userId = userDetails?._id
	const [isLoading, setIsLoading] = useState(true)
	const [votesData, setVotesData] = useState<VotesResponse>()
	const [votesMilestones, setVotesMilestones] = useState<MilestoneTitles[]>(
		getMilestoneTitles([], 'votes')
	)
	const { client } = useSmartAccountClient({})
	const user = useUser()

	const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
		client,
		// optional parameter that will wait for the transaction to be mined before returning
		waitForTxn: true,
		onSuccess: async () => {
			await axiosInstance
				.post('/api/rewards/votes/updateall', {
					userId: userId,
				})
				.catch(() => {
					toast.error('Failed to update vote status. Please try again.')
				})
			toast.success('Rewards claimed successfully!')
			if (userDetails && votesData && votesData.unClaimedReward)
				setUserDetails({
					...userDetails,
					mintedCoins: BigInt(userDetails?.mintedCoins) + BigInt(votesData.unClaimedReward * 1e18),
				})
		},
		onError: () => {
			toast.error('Failed to send user operation. Please try again.')
		},
	})

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
		<div className="grid h-full md:grid-cols-3 grid-cols-1 gap-y-6 md:gap-y-0 flex-col-reverse">
			<div className="total_majority_milestones_wrapper md:col-span-2 col-span-1 md:order-1 order-2">
				<div className="total_votes flex flex-col gap-4 md:p-5">
					<h2 className="text-2xl md:text-4xl">Total Votes</h2>
					<ProgressBar
						milestones={getMilestoneKeys(totalVotesRewards)}
						currentValue={votesData?.totalVotesCount ?? 0}
					/>
				</div>
				<div className="majority_votes mt-6 md:mt-0 flex flex-col gap-4 md:p-5">
					<h2 className="text-2xl md:text-4xl">Majority Votes</h2>
					<ProgressBar
						milestones={getMilestoneKeys(majorityVotesRewards)}
						currentValue={votesData?.majorityVotesCount ?? 0}
					/>
				</div>
				<div className="milestones mt-8 md:mt-6 md:pr-10 flex flex-col">
					<h2 className="text-2xl md:text-4xl md:pl-5">Milestones</h2>
					<Milestones hasBorder={false} tasks={votesMilestones} />
				</div>
			</div>
			<div className="points_rules_wrapper flex flex-col gap-y-8 md:gap-y-12 md:mt-8 md:order-2 order-1">
				<div className="points hidden flex-col gap-2 md:gap-5 items-center mx-20 md:mx-0 border-2 border-[#1783FB] rounded-lg p-2 md:p-5 mt-8 md:mt-10">
					<span className="text-2xl md:text-4xl">Points</span>
					<p className="text-[#29e0ca] text-3xl md:text-4xl">
						{votesData?.points == 0 ? 0 : votesData?.points.toFixed(1) ?? 0}{' '}
						$eART
					</p>
					{votesData?.points && (
						<button
							className="bg-[#040f2b] border-2 border-[#1783FB] rounded-lg text-xl md:text-3xl px-4 md:px-8 md:py-1 hover:bg-blue-500/20 bg-[linear-gradient(180deg,#050D28_0%,#0F345C_100%)]"
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
					)}
				</div>
				
				{/* Add History Box */}
				{user && user.address && (
					<div className="history flex flex-col gap-2 md:gap-5 items-center border-2 border-[#1783FB] rounded-lg p-2 md:p-5 mx-8 md:mx-0">
						<h4 className="text-2xl md:text-4xl">History</h4>
						<p className="text-[#1783FB] text-lg md:text-xl text-center">
							View on blockchain explorer
						</p>
						<a 
							href={`${process.env.NEXT_PUBLIC_RPC_URL}/token/${user.address}?a=${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
							target="_blank"
							rel="noopener noreferrer"
							className="bg-[#040f2b] border-2 border-[#1783FB] rounded-lg text-xl md:text-2xl px-4 md:px-8 py-1 md:py-2 hover:bg-blue-500/20 transition-all duration-200 text-center bg-[linear-gradient(180deg,#050D28_0%,#0F345C_100%)]"
						>
							View History
						</a>
					</div>
				)}
				
				<div className="rules flex flex-col md:gap-3 items-center justify-center border-2 border-[#1783FB] rounded-lg p-3 md:p-5 mx-8 md:mx-0">
					<h4 className="text-2xl md:text-4xl">Rules</h4>
					<p className="text-2xl md:text-3xl">1 Vote Cast</p>
					<BiDownArrowAlt className="w-8 h-8 md:w-12 md:h-12" />
					<span className="text-[#29e0ca] text-3xl md:text-4xl">0.1 $eART</span>
					<p className="text-xl md:text-3xl">to Voter</p>
					<span className="text-[#1783FB] text-lg md:text-2xl text-center leading-none md:leading-normal">
						*Majority Vote is counted when Voted Content has above average
						votes. (Total Votes on Platform / Number of Content) in 24 Hours
					</span>
					
					{/* Remove the button from Rules section since we now have a dedicated History box */}
				</div>
			</div>
		</div>
	)
}

export default Votes

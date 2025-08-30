import React, { useContext, useEffect, useState } from 'react'
import { Milestones } from './Milestones'
import {
	getMilestoneKeys,
	getMilestoneTitles,
	majorityUploadRewards,
	Milestone,
	MilestoneTitles,
	totalUploadRewards,
} from '@/app/home/rewards/constants'
import ProgressBar from './ProgressBar'
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
// import { BiDownArrowAlt } from 'react-icons/bi'
import Loader from '@/components/Loader'
import {
	useSendUserOperation,
	useSmartAccountClient,
} from '@account-kit/react'
import { toast } from 'react-toastify'
import { EArtTokenABI } from '@/ethers/contractAbi'
import { encodeFunctionData } from 'viem'

export type UploadResponse = {
	totalUploadMemeCount: number
	milestoneDetails: Milestone[]
	unClaimedMemeIds: string[]
	unClaimedReward: number
	milestoneRewardCount: number
	voteReceived: number
	majorityUploads: number
}

const Uploads = () => {
	const { userDetails, setUserDetails } = useContext(Context)
	const userId = userDetails?._id
	const [isLoading, setIsLoading] = useState(true)
	const [uploadData, setUploadData] = useState<UploadResponse>()
	const [uploadMilestones, setUploadMilestones] = useState<MilestoneTitles[]>(
		getMilestoneTitles([], 'uploads')
	)

	const { client } = useSmartAccountClient({})
	// const user = useUser()

	const { sendUserOperation, isSendingUserOperation } = useSendUserOperation({
		client,
		waitForTxn: true,
		onSuccess: async () => {
			await axiosInstance
				.post('/api/rewards/upload/updateall', {
					userId: userId,
				})
				.catch(() => {
					toast.error('Failed to update upload status. Please try again.')
				})
			toast.success('Rewards claimed successfully!')
			if (userDetails && uploadData && uploadData.unClaimedReward)
				setUserDetails({
					...userDetails,
					mintedCoins:
						BigInt(userDetails.mintedCoins) +
						BigInt(uploadData.unClaimedReward * 1e18),
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
					`/api/rewards/upload?userId=${userId}`
				)
				if (response.data) {
					setUploadData(response.data)
					const milestones = getMilestoneTitles(
						response.data.milestoneDetails,
						'uploads'
					)
					setUploadMilestones(milestones)
				}
			} catch (error) {
				console.error('Error fetching Upload Data', error)
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
			{/* Total Uploads */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-medium">Total Uploads</h2>
				<ProgressBar
					milestones={getMilestoneKeys(totalUploadRewards)}
					currentValue={uploadData?.totalUploadMemeCount ?? 0}
				/>
			</div>

			{/* Majority Uploads */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-medium">Majority Uploads</h2>
				<ProgressBar
					milestones={getMilestoneKeys(majorityUploadRewards)}
					currentValue={uploadData?.majorityUploads ?? 0}
				/>
			</div>

			{/* Milestones */}
			<div className="flex flex-col gap-2 mt-2">
				<h2 className="text-xl font-medium">Milestones</h2>
				<Milestones hasBorder={false} tasks={uploadMilestones} />
			</div>

			{/* Rules */}
			{/* <div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
				<h4 className="text-xl">Rules</h4>
				<p className="text-lg">1 Vote Cast</p>
				<BiDownArrowAlt className="w-6 h-6" />
				<span className="text-[#2FCAC7] text-xl">1 $eART</span>
				<p className="text-lg">to Creator</p>
				<span className="text-[#2FCAC7] text-xs text-center">
					*Majority Upload is counted when Total Votes received on the content
					is above average count (Total Votes on Platform/Number of Content) in
					24 Hours
				</span>
			</div> */}

			{/* Points */}
			{/* {uploadData?.unClaimedReward && uploadData?.unClaimedReward > 0 && (
				<div className="flex flex-col gap-2 items-center border border-[#2FCAC7] rounded-lg p-3 mt-2">
					<span className="text-xl">Points</span>
					<h2 className="text-[#2FCAC7] text-2xl">
						{uploadData?.unClaimedReward == 0
							? 0
							: uploadData?.unClaimedReward.toFixed(1) ?? 0}{' '}
						$eART
					</h2>
					<button
						className="bg-black/10 border border-[#2FCAC7] rounded-lg text-lg px-6 py-1 active:scale-95 transition-transform"
						onClick={async () => {
							try {
								const uoCallData = encodeFunctionData({
									abi: EArtTokenABI,
									functionName: 'claimAllMemeUploadRewards',
									args: [uploadData?.unClaimedMemeIds],
								})

								if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
									await sendUserOperation({
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

export default Uploads

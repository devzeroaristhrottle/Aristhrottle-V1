//import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'
import { useContext, useState } from 'react'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { toast } from 'react-toastify'
import { MilestoneTitles } from '@/app/home/rewards/constants'
import { GrCheckmark } from 'react-icons/gr'

export const Milestones = ({
	tasks: milestones,
	hasBorder = true,
}: {
	tasks: MilestoneTitles[]
	hasBorder?: boolean
}) => {
	const { userDetails, setUserDetails } = useContext(Context)
	const userId = userDetails?._id
	const [isClaimLoading, setIsClaimLoading] = useState(false)
	const [milestonesList, setMilestonesList] = useState(milestones)

	const handleClaim = async (
		type: string,
		milestone: MilestoneTitles,
		index: number
	) => {
		try {
			setIsClaimLoading(true)
			if (userDetails && !isClaimLoading)
				setUserDetails({
					...userDetails,
					mintedCoins:
						BigInt(userDetails.mintedCoins) + BigInt(milestone.reward * 1e18),
				})
			const response = await axiosInstance.post(
				`/api/claimreward`,
				{
					userId,
					type,
					milestone: milestone.number,
				},
				{
					timeout: 30000,
				}
			)
			if (response.status == 200) {
				const updatedMilestones = [...milestones]
				updatedMilestones[index] = {
					...updatedMilestones[index],
					canClaim: false,
					isClaimed: true,
				}
				setMilestonesList([...updatedMilestones])
				toast.success('Reward claimed successfully!')
			}
		} catch (error) {
			console.error('Error claiming the reward', error)
			toast.error('Error claiming the reward')
			if (userDetails && !isClaimLoading)
				setUserDetails({
					...userDetails,
					mintedCoins: BigInt(userDetails.mintedCoins),
				})
		} finally {
			setIsClaimLoading(false)
		}
	}

	return (
		<div
			className={`mt-2 rounded-xl p-3 space-y-3 ${
				hasBorder ? 'bg-black/10 border border-[#2FCAC7] w-full' : 'w-full'
			}`}
		>
			{milestonesList
				.sort((a, b) => a.reward - b.reward)
				.map((milestone, index) => (
					<div key={index} className="flex items-center gap-2 justify-between border border-[#2FCAC7] rounded-lg px-2 py-1 ">
						{/* Status Icon */}
						{/* <div className="flex items-center justify-center shrink-0">
							{milestone.isClaimed || milestone.canClaim ? (
								<FaCheckCircle className="text-[#2FCAC7]" size={18} />
							) : (
								<FaRegCircle className="text-[#2FCAC7]" size={18} />
							)}
						</div> */}

						{/* Title & Reward */}
						<div className="flex-1 flex items-center justify-between gap-x-2">
							<p className="text-sm leading-tight">{milestone.title}</p>
							<p className="text-sm whitespace-nowrap" hidden={milestone.isClaimed}>
								{milestone.reward} $eART
							</p>
						</div>

						{/* Claim Button or Placeholder */}
						<div className="flex items-center justify-center">
							{!milestone.isClaimed ? (
								<button
									className={`relative px-4 rounded-md text-sm text-black ${(isClaimLoading || !milestone.canClaim) ? 'bg-[#2FCAC7]/20' : 'bg-[#2FCAC7] hover:bg-[#20B2AF]'}`}
									onClick={() => {
										handleClaim(milestone.type, milestone, index)
									}}
									disabled={isClaimLoading || !milestone.canClaim}
								>
									{isClaimLoading ? (
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										</div>
									) : (
										'Claim'
									)}
								</button>) : (
                                    <div className='flex justify-between items-center'>
                                        <GrCheckmark className='text-[#2FCAC7]'/>
                                        <div className='text-[#2FCAC7] ml-2'>Claimed</div>
                                    </div>
                                )
							}
						</div>
					</div>
				))}
		</div>
	)
}

import { Meme } from '@/app/home/page'
import { useContext, useEffect, useState } from 'react'
import { Logo } from './Logo'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { FaRegBookmark } from 'react-icons/fa'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import Share from './Share'
import { Tooltip } from './ui/tooltip'
import { FaBookmark } from 'react-icons/fa'
import { useUser, useAuthModal } from '@account-kit/react'
import Image from 'next/image'
import { LazyImage } from './LazyImage'
import { useRouter } from 'next/navigation'
import { Context } from '@/context/contextProvider'

export interface MemeCardI {
	index: number
	meme: Meme
	onOpenMeme: () => void
	onVoteMeme: () => void
	bookmark: (id: string, name: string, image_url: string) => void
	activeTab?: 'all' | 'live'
	bmk?: boolean
}

export function MemeCard({
	index,
	meme,
	onOpenMeme,
	onVoteMeme,
	bookmark,
	activeTab = 'all',
	bmk = false, // Added default value
}: MemeCardI) {
	const [loading, setLoading] = useState(false)
	const { openAuthModal } = useAuthModal()
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isBookmarked, setIsBookmarked] = useState(bmk)
	const [bookmarkCount, setBookmarkCount] = useState(0)
	const [shareCount, setShareCount] = useState(0)
	const [voteCount, setVoteCount] = useState(0)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const [eyeOpen, setEyeOpen] = useState<boolean>(false) // Initialize as false first
	const user = useUser()
	const router = useRouter()
	const { userDetails, setUserDetails } = useContext(Context)
	const [isHidden, setIsHidden] = useState(false)

	// Initialize state values from meme prop
	useEffect(() => {
		if (meme) {
			setBookmarkCount(meme.bookmarks?.length || 0)
			setShareCount(meme.shares?.length || 0)
			setVoteCount(meme.vote_count || 0)
			setEyeOpen(Boolean(meme.has_user_voted))
			setIsBookmarked(bmk)
		}
	}, [meme, bmk])

	// Early return if no meme data
	if (!meme) {
		return null
	}

	// Early return if component should be hidden
	if (isHidden) {
		return null
	}

	const handleShareClose = () => {
		setIsShareOpen(false)
	}

	const onShare = () => {
		setShareCount(shareCount + 1)
	}

	const voteMeme = () => {
		try {
			setLoading(true)
			setVoteCount(voteCount + 1)
			setShowPointsAnimation(true)
			onVoteMeme()

			setTimeout(() => {
				setShowPointsAnimation(false)
			}, 2000)
			setEyeOpen(true)

			if (userDetails) {
				setUserDetails({
					...userDetails,
					mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
				})
			}
		} catch (error) {
			console.log(error)
			setVoteCount(voteCount - 1)
		} finally {
			setTimeout(() => {
				setLoading(false)
			}, 1000)
		}
	}

	const handleImageError = () => {
		console.log('Image failed to load for meme:', meme.name)
		setIsHidden(true)
	}

	const handleBookmarkClick = () => {
		try {
			const newIsBookmarked = !isBookmarked;
	
			// Perform the action (save or unsave)
			bookmark(meme._id, meme.name, meme.image_url);
	
			// Update bookmark count based on new state
			setBookmarkCount(prev => {
				if (newIsBookmarked) {
					return prev + 1;
				} else {
					return Math.max(0, prev - 1);
				}
			});
	
			// Update bookmark state
			setIsBookmarked(newIsBookmarked);
		} catch (error) {
			console.error('Bookmark error:', error);
		}
	};
	

	const canUserVote = user && user.address && meme.created_by._id !== userDetails?._id

	return (
		// Added margin classes for spacing between cards
		<div key={index} className="flex flex-col lg:mx-auto cursor-s mb-6 mx-3 md:mb-8 md:mx-4">
			<div
				className="flex items-center gap-x-1 md:gap-x-2 mb-1 md:mb-2 cursor-pointer"
				onClick={() => {
					if (meme.created_by?._id) {
						router.push(`/home/profiles/${meme.created_by._id}`)
					}
				}}
			>
				<img 
					src={meme.created_by?.profile_pic || '/default-avatar.png'} 
					className="w-8 h-8 rounded-full"
					onError={(e) => {
						e.currentTarget.src = '/default-avatar.png'
					}}
				/>
				<span className="text-[#29e0ca] text-base md:text-2xl">
					{meme.created_by?.username || 'Unknown User'}
				</span>
			</div>
			<div className="flex cursor-pointer ">
				<LazyImage
					onClick={() => {
						onOpenMeme()
					}}
					src={meme.image_url}
					alt={meme.name || 'Meme'}
					className="image_wrapper w-full h-full sm:w-[15rem] sm:h-[15rem] md:w-[15rem] md:h-[15rem] lg:w-[14rem] lg:h-[14rem] xl:w-[20rem] xl:h-[20rem] object-cover rounded-xl"
					onError={handleImageError}
				/>
				{/* For above mobile */}
				<div className="hidden md:block ml-1 place-content-end space-y-8">
					{loading ? (
						<AiOutlineLoading3Quarters className="animate-spin text-2xl" />
					) : (
						<div className="flex flex-col items-center font-bold text-xl space-y-1 relative">
							{eyeOpen ? (
								<>
									<Image
										src={'/assets/vote/icon1.png'}
										width={30}
										height={30}
										alt="voted"
										className="transition-all duration-300"
									/>
									{/* <span className="text-[#1783fb] text-sm">{voteCount}</span> */}
								</>
							) : (
								<>
									<Logo
										onClick={() => {
											if (canUserVote) {
												voteMeme()
											} else if (!user?.address && openAuthModal) {
												openAuthModal()
											}
										}}
										classNames={
											!canUserVote ? "!cursor-not-allowed opacity-50" : "!cursor-pointer hover:scale-110"
										}
									/>
									{!activeTab?.includes('live') && (
										<span className="text-[#1783fb] text-sm">{voteCount}</span>
									)}
								</>
							)}

							{/* +1 Points Animation */}
							{showPointsAnimation && (
								<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
									+0.1 $eART
								</div>
							)}
						</div>
					)}

					<Tooltip content="Share" positioning={{ placement: 'right-end' }}>
						<div className="text-center font-bold text-xl">
							<FaRegShareFromSquare
								className="text-2xl cursor-pointer hover:text-[#1783fb] transition-colors"
								onClick={() => {
									setIsShareOpen(true)
								}}
							/>
							{!activeTab?.includes('live') && (
								<p className="text-[#1783fb] text-sm">{shareCount}</p>
							)}
						</div>
					</Tooltip>

					<Tooltip
						content={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
						positioning={{ placement: 'right-end' }}
					>
						<div className="text-center font-bold text-xl">
							{isBookmarked ? (
								<FaBookmark
									className="text-2xl cursor-pointer text-[#1783fb] hover:text-white transition-colors"
									onClick={handleBookmarkClick}
								/>
							) : (
								<FaRegBookmark
									className="text-2xl cursor-pointer hover:text-[#1783fb] transition-colors"
									onClick={handleBookmarkClick}
								/>
							)}
							{!activeTab?.includes('live') && (
								<p className="text-[#1783fb] text-sm">{bookmarkCount}</p>
							)}
						</div>
					</Tooltip>
				</div>
			</div>
			<div className="flex justify-between mt-1 min-w-0">
				<p className="text-lg md:text-2xl truncate min-w-0 pr-2 md:max-w-72">
					{meme.name || 'Untitled'}
				</p>
				{/* For mobile */}
				<div className="md:hidden flex items-center gap-x-6 flex-shrink-0">
					{loading ? (
						<AiOutlineLoading3Quarters className="animate-spin text-2xl" />
					) : (
						<div className="flex flex-col items-center font-bold text-xl space-y-1 relative">
							{eyeOpen ? (
								<>
									<Image
										src={'/assets/vote/icon1.png'}
										width={24}
										height={24}
										alt="voted"
										className="transition-all duration-300"
									/>
									{/* {!activeTab?.includes('live') && (
										<span className="text-[#1783fb] text-xs">{voteCount}</span>
									)} */}
								</>
							) : (
								<>
									<Logo
										onClick={() => {
											if (canUserVote) {
												voteMeme()
											} else if (!user?.address && openAuthModal) {
												openAuthModal()
											}
										}}
										classNames={
											!canUserVote ? "!cursor-not-allowed opacity-50" : "!cursor-pointer"
										}
									/>
									{/* {!activeTab?.includes('live') && (
										<span className="text-[#1783fb] text-xs">{voteCount}</span>
									)} */}
								</>
							)}

							{/* +1 Points Animation */}
							{showPointsAnimation && (
								<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-sm opacity-0 animate-[flyUp_2s_ease-out_forwards]">
									+0.1 $eART
								</div>
							)}
						</div>
					)}

					<Tooltip content="Share" positioning={{ placement: 'right-end' }}>
						<div className="text-center font-bold">
							<FaRegShareFromSquare
								className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-[#1783fb] transition-colors"
								onClick={() => {
									setIsShareOpen(true)
								}}
							/>
							{!activeTab?.includes('live') && (
								<p className="text-xs text-[#1783fb]">
									{shareCount}
								</p>
							)}
						</div>
					</Tooltip>

					<Tooltip
						content={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
						positioning={{ placement: 'right-end' }}
					>
						<div className="text-center font-bold text-lg">
							{isBookmarked ? (
								<FaBookmark
									className="w-5 h-5 md:w-6 md:h-6 cursor-pointer text-[#1783fb] hover:text-white transition-colors"
									onClick={handleBookmarkClick}
								/>
							) : (
								<FaRegBookmark
									className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-[#1783fb] transition-colors"
									onClick={handleBookmarkClick}
								/>
							)}
							{!activeTab?.includes('live') && (
								<p className="text-xs text-[#1783fb]">
									{bookmarkCount}
								</p>
							)}
						</div>
					</Tooltip>
				</div>
			</div>
			{isShareOpen && (
				<Share
					onClose={handleShareClose}
					onShare={onShare}
					imageUrl={meme?.image_url}
					id={meme._id}
				/>
			)}
		</div>
	)
}
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
	bmk,
}: MemeCardI) {
	const [loading, setLoading] = useState(false)
	const { openAuthModal } = useAuthModal()
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isBookmarked, setIsBookmarked] = useState(bmk)
	const [bookmarkCount, setBookmarkCount] = useState(0)
	const [shareCount, setShareCount] = useState(0)
	const [voteCount, setVoteCount] = useState(0)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const [eyeOpen, setEyeOpen] = useState<boolean>(meme.has_user_voted)
	const user = useUser()
	const router = useRouter()
	const { userDetails, setUserDetails } = useContext(Context)
	const [isHidden, setIsHidden] = useState(false)

	useEffect(() => {
		setBookmarkCount(meme.bookmarks.length)
		setShareCount(meme.shares.length)
		setVoteCount(meme.vote_count)
	}, [])

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

	if (isHidden) {
		return null
	}

	return (
		// Added margin classes for spacing between cards
		<div key={index} className="flex flex-col lg:mx-auto cursor-s mb-6 mx-3 md:mb-8 md:mx-4">
			<div
				className="flex items-center gap-x-1 md:gap-x-2 mb-1 md:mb-2 cursor-pointer"
				onClick={() => router.push(`/home/profiles/${meme.created_by._id}`)}
			>
				<img src={meme.created_by.profile_pic} className="w-8 h-8 rounded-full" />
				<span className="text-[#29e0ca] text-base md:text-2xl">
					{meme.created_by?.username}
				</span>
			</div>
			<div className="flex cursor-pointer ">
				<LazyImage
					onClick={() => {
						onOpenMeme()
					}}
					src={meme.image_url}
					alt={meme.name}
					className="image_wrapper w-full h-full sm:w-[15rem] sm:h-[15rem] md:w-[15rem] md:h-[15rem] lg:w-[14rem] lg:h-[14rem] xl:w-[20rem] xl:h-[20rem] object-cover border-2 border-white"
					onError={() => setIsHidden(true)}
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
										alt="logo"
										className="transition-all duration-300  "
									/>
								</>
							) : (
								<Logo
									onClick={() => {
										if (user && user.address) {
											if(meme.created_by._id === userDetails?._id) return
											voteMeme()
										} else if (openAuthModal) {
											openAuthModal()
										}
									}}
									classNames={
										meme.created_by._id === userDetails?._id ? "!cursor-not-allowed" : "!cursor-pointer"
									}
								/>
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
								className="text-2xl"
								onClick={() => {
									setIsShareOpen(true)
								}}
							/>
							{meme.shares && !activeTab?.includes('live') && (
								<p className="text-[#1783fb]">{shareCount}</p>
							)}
						</div>
					</Tooltip>

					{isBookmarked ? (
						<Tooltip
							content="My Bookmark"
							positioning={{ placement: 'right-end' }}
						>
							<div className="text-center font-bold text-xl">
								<FaBookmark
									className="text-2xl cursor-pointer"
									onClick={() => {
										bookmark(meme._id, meme.name, meme.image_url)
										setBookmarkCount(bookmarkCount - 1)
										setIsBookmarked(!isBookmarked)
									}}
								/>
								{meme.bookmarks && !activeTab?.includes('live') && (
									<p className="text-[#1783fb]"></p>
								)}
							</div>
						</Tooltip>
					) : (
						<Tooltip
							content="My Bookmark"
							positioning={{ placement: 'right-end' }}
						>
							<div className="text-center font-bold text-xl">
								<FaRegBookmark
									className="text-2xl"
									onClick={() => {
										bookmark(meme._id, meme.name, meme.image_url)
										setBookmarkCount(bookmarkCount + 1)
										setIsBookmarked(!isBookmarked)
									}}
								/>
								{meme.bookmarks && !activeTab?.includes('live') && (
									<p className="text-[#1783fb]">{bookmarkCount}</p>
								)}
							</div>
						</Tooltip>
					)}
				</div>
			</div>
			<div className="flex justify-between mt-1 min-w-0">
				<p className="text-lg md:text-2xl truncate min-w-0 pr-2 md:max-w-72">{meme.name}</p>
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
										width={30}
										height={30}
										alt="logo"
										className="transition-all duration-300 "
									/>
								</>
							) : (
								<Logo
									onClick={() => {
										if (user && user.address) {
											if(meme.created_by._id === userDetails?._id) return
											voteMeme()
										} else if (openAuthModal) {
											openAuthModal()
										}
									}}
									classNames={
										meme.created_by._id === userDetails?._id ? "!cursor-not-allowed" : "!cursor-pointer"
									}
								/>
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
						<div className="text-center font-bold">
							<FaRegShareFromSquare
								className="w-5 h-5 md:w-6 md:h-6 cursor-pointer"
								onClick={() => {
									setIsShareOpen(true)
								}}
							/>
							{meme.shares && !activeTab?.includes('live') && (
								<p className="text-lg md:text-2xl text-[#1783fb]">
									{shareCount}
								</p>
							)}
						</div>
					</Tooltip>

					{isBookmarked ? (
						<Tooltip
							content="My Bookmark"
							positioning={{ placement: 'right-end' }}
						>
							<div className="text-center font-bold text-lg">
								<FaBookmark
									className="w-5 h-5 md:w-6 md:h-6 cursor-pointer"
									onClick={() => {
										bookmark(meme._id, meme.name, meme.image_url)
										setBookmarkCount(bookmarkCount - 1)
										setIsBookmarked(!isBookmarked)
									}}
								/>
								{meme.bookmarks && !activeTab?.includes('live') && (
									<p className="text-lg md:text-2xl text-[#1783fb]">
										{bookmarkCount}
									</p>
								)}
							</div>
						</Tooltip>
					) : (
						<Tooltip
							content="My Bookmark"
							positioning={{ placement: 'right-end' }}
						>
							<div className="text-center font-bold text-lg">
								<FaRegBookmark
									className="w-5 h-5 md:w-6 md:h-6"
									onClick={() => {
										bookmark(meme._id, meme.name, meme.image_url)
										setBookmarkCount(bookmarkCount + 1)
										setIsBookmarked(!isBookmarked)
									}}
								/>
								{meme.bookmarks && !activeTab?.includes('live') && (
									<p className="text-lg md:text-2xl text-[#1783fb]">
										{bookmarkCount}
									</p>
								)}
							</div>
						</Tooltip>
					)}
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
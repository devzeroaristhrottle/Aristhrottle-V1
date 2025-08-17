import { LeaderboardMeme } from './page'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { FaBookmark } from 'react-icons/fa'
import { useState, useContext, useEffect } from 'react'
import Share from '@/components/Share'
import { useMemeActions } from '../bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useAuthModal, useUser } from '@account-kit/react'
import { LazyImage } from '@/components/LazyImage'
import { useRouter } from 'next/navigation'
import { Context } from '@/context/contextProvider'
import { Logo } from '@/components/Logo'

// Block Cloudinary URLs for faster loading
const isCloudinaryUrl = (url: string): boolean => {
	return url.includes('res.cloudinary.com');
};

export const LeaderboardMemeCard: React.FC<{
	meme: LeaderboardMeme
	onOpenMeme: () => void
	voteMeme?: (memeId: string) => void
	activeTab?: string
	bmk?: boolean
	onImageError?: () => void
}> = ({ meme, onOpenMeme, voteMeme, bmk, onImageError }) => {
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isBookmarked, setIsBookmarked] = useState(bmk || false)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const { userDetails, setUserDetails } = useContext(Context)
	const [bmkCount, setBmkCount] = useState<number>(() => {
		let initialCount = meme.bookmarks?.length || meme.bookmark_count || 0
		// If the item is bookmarked but count is 0, ensure minimum count of 1
		if (bmk && initialCount === 0) {
			initialCount = 1
		}
		return initialCount
	})
	
	// UNIFIED VOTING STATE - Same initialization logic for both versions
	const [eyeOpen, setEyeOpen] = useState<boolean>(meme.has_user_voted);
	const [count, setCount] = useState<number>(meme.vote_count);
	const [imageError, setImageError] = useState(false)
	const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
	const [isHidden, setIsHidden] = useState(false)

	const { openAuthModal } = useAuthModal()
	const user = useUser()
	const router = useRouter()
	const { handleBookmark } = useMemeActions()

	// UNIFIED STATE INITIALIZATION - Same for both versions
	useEffect(() => {
		console.log('Initializing meme vote state:', {
			memeId: meme._id,
			memeName: meme.name,
			serverHasUserVoted: meme.has_user_voted,
			serverVoteCount: meme.vote_count,
			userId: userDetails?._id,
			creatorId: meme.created_by._id
		});

		// Set eyeOpen based on server data - true means user has voted (show open eye)
		setEyeOpen(meme.has_user_voted || false);
		setCount(meme.vote_count || 0);
	}, [meme._id, meme.has_user_voted, meme.vote_count, userDetails?._id]);

	// Block Cloudinary URLs immediately
	useEffect(() => {
		if (isCloudinaryUrl(meme.image_url)) {
			console.log(`Blocking Cloudinary URL for meme: ${meme.name} - ${meme.image_url}`);
			setImageError(true);
			setIsHidden(true);
			if (onImageError) {
				onImageError();
			}
		}
	}, [meme.image_url, meme.name, onImageError]);

	// Sync bookmark state when bmk prop changes
	useEffect(() => {
		setIsBookmarked(bmk || false)
	}, [bmk])

	// Sync bookmark count when meme data changes
	useEffect(() => {
		let initialCount = meme.bookmarks?.length || meme.bookmark_count || 0
		
		// If the item is bookmarked but count is 0, ensure minimum count of 1
		if (bmk && initialCount === 0) {
			initialCount = 1
		}
		
		setBmkCount(initialCount)
	}, [meme.bookmarks, meme.bookmark_count, bmk])

	const handleShareClose = () => {
		setIsShareOpen(false)
	}

	// UPDATED VOTING LOGIC - Now supports vote toggling
	const localVoteMeme = (memeid: string) => {
		try {
			if(!userDetails){
				if(openAuthModal) openAuthModal()
				return;
			}
			if (voteMeme) voteMeme(memeid)
			else return

			// Toggle the vote state
			const newVoteState = !eyeOpen;
			const newCount = newVoteState ? count + 1 : count - 1;

			if (newVoteState) {
				// User is voting (adding vote)
				setShowPointsAnimation(true)
				setTimeout(() => {
					setShowPointsAnimation(false)
				}, 2000)
				
				if (userDetails) {
					setUserDetails({
						...userDetails,
						mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
					})
				}
			} else {
				// User is unvoting (removing vote)
				if (userDetails) {
					setUserDetails({
						...userDetails,
						mintedCoins: BigInt(userDetails.mintedCoins) - BigInt(1e17),
					})
				}
			}

			setEyeOpen(newVoteState);
			setCount(newCount);

		} catch (err) {
			// Revert on error - don't change state
			console.log(err)
		}
	}

	const handleBookmarkClick = async (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		
		if (!user || !user.address || isBookmarkLoading) return
		
		setIsBookmarkLoading(true)
		
		try {
			// Call the bookmark API
			await handleBookmark(meme._id)
			
			// Update the bookmark state optimistically
			const newBookmarkState = !isBookmarked
			setIsBookmarked(newBookmarkState)
			
			// Update bookmark count based on the action
			setBmkCount(prevCount => newBookmarkState ? prevCount + 1 : Math.max(0, prevCount - 1))
			
		} catch (error) {
			console.error('Error toggling bookmark:', error)
			// Revert optimistic update on error
		} finally {
			setIsBookmarkLoading(false)
		}
	}

	const handleImageError = () => {
		console.log(`Image failed to load for meme: ${meme.name} - URL: ${meme.image_url}`);
		setIsHidden(true)
		onImageError?.()
	}

	// Don't render if image error or hidden
	if (isHidden || imageError) {
		return null
	}

	console.log('Render state:', {
		memeId: meme._id,
		eyeOpen,
		serverHasVoted: meme.has_user_voted,
		isOwnMeme: meme.created_by._id === userDetails?._id,
		hasUserDetails: !!userDetails,
		willShowOpenEye: eyeOpen,
		willShowLogo: !eyeOpen
	});

	return (
		<div className="p-3 md:p-4 w-full lg:mx-auto">
			<div className="flex flex-col md:flex-row gap-x-3">
				<div className="flex flex-col">
					{/* Mobile & Desktop: Avatar, Username and Rank */}
					<div className="flex justify-between items-start text-lg leading-tight max-w-full mb-2">
						<div
							className="flex items-center gap-x-1 cursor-pointer"
							onClick={() =>
								router.push(`/home/profiles/${meme.created_by._id}`)
							}
						>
							<img src={meme.created_by.profile_pic} className='h-8 w-8 rounded-full'/>
							<span className="text-[#29e0ca] text-base md:text-2xl md:pb-1">
								{meme.created_by.username}
							</span>
						</div>
						{meme.rank && <p className="text-[#29e0ca] text-base md:text-2xl font-medium">
							#{meme.rank}
						</p>}
					</div>

					<div className="image_wrapper w-full h-full sm:w-[15rem] sm:h-[15rem] md:w-[15rem] md:h-[15rem] lg:w-[14rem] lg:h-[14rem] xl:w-[20rem] xl:h-[20rem] object-cover ">
						<LazyImage
							onClick={() => {
								onOpenMeme()
							}}
							src={meme.image_url}
							alt={meme.name}
							className="w-full h-full cursor-pointer rounded-xl"
							onError={handleImageError}
						/>
					</div>
					
					{/* Mobile: Text and Icons on same line */}
					<div className="flex justify-between items-start md:hidden text-lg leading-tight max-w-full mt-2">
						<p className="flex-1">
							{meme.name.length > 30
								? meme.name.slice(0, 30) + '...'
								: meme.name}
						</p>
						<div className="flex flex-row items-start gap-x-3 ml-2">
							{/* Vote Section */}
							<div className="flex flex-col items-center justify-start relative">
								{eyeOpen ? (
									<img
										src={'/assets/vote/icon1.png'}
										alt="vote"
										className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform"
										onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
										title="Click to unvote"
									/>
								) : (
									<div
										title={
											!userDetails 
												? "Login to vote" 
												: meme.created_by._id === userDetails?._id 
												? "Cannot vote on your own meme" 
												: "Click to vote"
										}
									>
										<Logo
											classNames={
												'w-5 h-5 ' +
												(voteMeme && meme.created_by._id !== userDetails?._id && userDetails
													? '!cursor-pointer hover:scale-110 transition-transform'
													: '!cursor-not-allowed opacity-50')
											}
											onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
										/>
									</div>
								)}
								<span className="text-xs text-[#1783fb] mt-1">
									{count}
								</span>

								{/* +0.1 Points Animation */}
								{showPointsAnimation && (
									<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
										+0.1 $eART
									</div>
								)}
							</div>
							
							{/* Bookmark Section */}
							{user && user.address ? (
								<div className={`flex flex-col items-center ${isBookmarkLoading ? 'cursor-wait' : 'cursor-pointer'}`}
									onClick={handleBookmarkClick}
								>
									{isBookmarked ? (
										<FaBookmark className="w-5 h-5 text-[#1783fb]" />
									) : (
										<CiBookmark className="w-5 h-5" />
									)}
									<span className="text-xs text-[#1783fb] mt-1">{bmkCount}</span>
								</div>
							) : null}
							
							{/* Share Section */}
							<div className="flex flex-col items-center cursor-pointer"
								onClick={() => {
									setIsShareOpen(true)
								}}
							>
								<FaRegShareFromSquare className="w-5 h-5" />
								<span className="text-xs text-[#1783fb] mt-1 opacity-0">0</span>
							</div>
						</div>
					</div>
					{/* Desktop: Text separate from icons */}
					<div className="hidden md:block title_wrapper text-xl leading-tight max-w-full">
						<p>
							{meme.name.length > 30
								? meme.name.slice(0, 30) + '...'
								: meme.name}
						</p>
					</div>
				</div>

				{/* Desktop Icons */}
				<div className="hidden md:flex flex-col justify-between ml-0 pt-1 pb-4">
					<p className="text-[#1783fb] text-xl font-bold"></p>
					<div className="flex flex-col items-start gap-y-2">
						{/* Vote Section */}
						<div className="flex flex-col items-center justify-center relative">
							{eyeOpen ? (
								<img
									src={'/assets/vote/icon1.png'}
									alt="vote"
									className="w-5 h-5 lg:w-7 lg:h-7 cursor-pointer hover:scale-110 transition-transform"
									onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
									title="Click to unvote"
								/>
							) : (
								<div
									title={
										!userDetails 
											? "Login to vote" 
											: meme.created_by._id === userDetails?._id 
											? "Cannot vote on your own meme" 
											: "Click to vote"
									}
								>
									<Logo
										classNames={
											'w-6 h-6 lg:w-7 lg:h-7 ' +
											(voteMeme && meme.created_by._id !== userDetails?._id && userDetails
												? '!cursor-pointer hover:scale-110 transition-transform'
												: '!cursor-not-allowed opacity-50')
										}
										onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
									/>
								</div>
							)}
							<span className="text-2xl text-[#1783fb]">
								{count}
							</span>

							{/* +0.1 Points Animation */}
							{showPointsAnimation && (
								<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
									+0.1 $eART
								</div>
							)}
						</div>
						
						{/* Bookmark Section */}
						{user && user.address ? (
							<div className={`flex flex-col items-center ${isBookmarkLoading ? 'cursor-wait' : 'cursor-pointer'}`}
								onClick={handleBookmarkClick}
							>
								{isBookmarked ? (
									<FaBookmark className="w-7 h-7 lg:w-8 lg:h-8 text-[#1783fb]" />
								) : (
									<CiBookmark className="w-7 h-7 lg:w-8 lg:h-8" />
								)}
								<span className="text-2xl text-[#1783fb]">{bmkCount}</span>
							</div>
						) : null}
						
						{/* Share Section */}
						<div className="flex flex-col items-center cursor-pointer"
							onClick={() => {
								setIsShareOpen(true)
							}}
						>
							<FaRegShareFromSquare className="w-5 h-5 lg:w-7 lg:h-7" />
							<span className="text-2xl text-[#1783fb]"></span>
						</div>
					</div>
				</div>
			</div>
			{isShareOpen && (
				<Share
					onClose={handleShareClose}
					imageUrl={meme.image_url}
					id={meme._id}
				/>
			)}
		</div>
	)
}
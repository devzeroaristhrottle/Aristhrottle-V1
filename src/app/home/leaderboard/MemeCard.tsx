import { LeaderboardMeme } from './page'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { FaBookmark } from 'react-icons/fa'
import { useState, useContext } from 'react'
import Share from '@/components/Share'
import { useMemeActions } from '../bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useAuthModal, useUser } from '@account-kit/react'
import { LazyImage } from '@/components/LazyImage'
import { useRouter } from 'next/navigation'
import { Context } from '@/context/contextProvider'
import { Logo } from '@/components/Logo'

export const LeaderboardMemeCard: React.FC<{
	meme: LeaderboardMeme
	onOpenMeme: () => void
	voteMeme?: (memeId: string) => void
	activeTab?: string
	bmk?: boolean
	onImageError?: () => void // Add callback for image error
}> = ({ meme, onOpenMeme, voteMeme, bmk, onImageError }) => {
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isBookmarked, setIsBookmarked] = useState(bmk)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const { userDetails, setUserDetails } = useContext(Context)
	const [bmkCount, setBmkCount] = useState<number>(meme.bookmarks?.length | meme.bookmark_count | 0);
	const [eyeOpen, setEyeOpen] = useState<boolean>(meme.has_user_voted);
	const [count, setCount] = useState<number>(meme.vote_count);
	const [imageError, setImageError] = useState(false)

	const { openAuthModal } = useAuthModal()
	const user = useUser()
	const router = useRouter()
	const handleShareClose = () => {
		setIsShareOpen(false)
	}
	const { handleBookmark } = useMemeActions()

	const localVoteMeme = (memeid: string) => {
		try {
			if(!userDetails){
				if(openAuthModal) openAuthModal()
					return;
			}
			if (voteMeme) voteMeme(memeid)
			else return

			setShowPointsAnimation(true)
			setEyeOpen(true);
			setCount(count + 1);
			setTimeout(() => {
				setShowPointsAnimation(false)
			}, 2000)
			if (userDetails) {
				setUserDetails({
					...userDetails,
					mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
				})
			}
		} catch (err) {
			setEyeOpen(false);
			setCount(count);
			console.log(err)
		}
	}

	const handleImageError = () => {
		setImageError(true)
		if (onImageError) {
			onImageError() // Notify parent component
		}
	}

	// Don't render the component if image failed to load
	if (imageError) {
		return null
	}

	return (
		<div className="p-3 md:p-4 w-full lg:mx-auto">
			<div className="flex flex-col md:flex-row gap-x-3">
				<div className="flex flex-col">
					<div className="username_rank_wrapper flex justify-between items-center md:mb-1 md:mt-1">
						<div
							className="flex items-center gap-x-1 cursor-pointer"
							onClick={() =>
								router.push(`/home/profiles/${meme.created_by._id}`)
							}
						>
							<img src={meme.created_by.profile_pic} className='h-8 w-8 rounded-full'/>
							<span className="text-[#29e0ca] text-base md:text-2xl">
								{meme.created_by.username}
							</span>
						</div>
						{meme.rank && <p className="text-[#29e0ca] text-base md:text-2xl font-medium">
							#{meme.rank}
						</p>}
					</div>
					<div className="image_wrapper w-full h-full sm:w-[15rem] sm:h-[15rem] md:w-[15rem] md:h-[15rem] lg:w-[14rem] lg:h-[14rem] xl:w-[20rem] xl:h-[20rem] object-cover border-2 border-white">
						<LazyImage
							onClick={() => {
								onOpenMeme()
							}}
							src={meme.image_url}
							alt={meme.name}
							className="w-full h-full cursor-pointer"
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
										className="w-5 h-5"
									/>
								) : (
									<Logo
										classNames={
											'w-5 h-5 ' +
											(voteMeme
												? meme.created_by._id === userDetails?._id
													? '!cursor-not-allowed'
													: '!cursor-pointer'
												: '!cursor-not-allowed')
										}
										onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
									/>
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
								<div className="flex flex-col items-center cursor-pointer"
									onClick={() => {
										handleBookmark(meme._id)
										setIsBookmarked(!isBookmarked)
										setBmkCount(bmkCount + (isBookmarked ? -1 : 1));
									}}
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
									className="w-5 h-5 lg:w-7 lg:h-7"
								/>
							) : (
								<Logo
									classNames={
										'w-6 h-6 lg:w-7 lg:h-7 ' +
										(voteMeme
											? meme.created_by._id === userDetails?._id
												? '!cursor-not-allowed'
												: '!cursor-pointer'
											: '!cursor-not-allowed')
									}
									onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
								/>
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
							<div className="flex flex-col items-center cursor-pointer"
								onClick={() => {
									handleBookmark(meme._id)
									setIsBookmarked(!isBookmarked)
									setBmkCount(bmkCount + (isBookmarked ? -1 : 1));
								}}
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
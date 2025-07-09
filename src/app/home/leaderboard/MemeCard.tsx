import { LeaderboardMeme } from './page'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { FaBookmark } from 'react-icons/fa'
import { useState, useContext } from 'react'
import Share from '@/components/Share'
import { useMemeActions } from '../bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useUser } from '@account-kit/react'
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
}> = ({ meme, onOpenMeme, voteMeme, bmk }) => {
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [isBookmarked, setIsBookmarked] = useState(bmk)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const { userDetails, setUserDetails } = useContext(Context)
	const [bmkCount, setBmkCount] = useState<number>(meme.bookmarks?.length | 0);
	const [eyeOpen, setEyeOpen] = useState<boolean>(meme.has_user_voted);
	const [count, setCount] = useState<number>(meme.vote_count);

	const user = useUser()
	const router = useRouter()
	const handleShareClose = () => {
		setIsShareOpen(false)
	}
	const { handleBookmark } = useMemeActions()

	const localVoteMeme = (memeid: string) => {
		try {
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

	return (
		<div className="p-4 md:p-4 w-full lg:mx-auto">
			<div className="flex flex-col md:flex-row gap-x-1">
				<div className="flex flex-col">
					<div className="username_rank_wrapper flex justify-between items-center md:mb-1">
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
					<div className="image_wrapper w-full h-full sm:w-[16.875rem] sm:h-[16.875rem] md:w-[16rem] md:h-[16.875rem] lg:w-[15.625rem] lg:h-[15.625rem] xl:w-[23rem] xl:h-[23rem] object-cover border-2 border-white">
						<LazyImage
							onClick={() => {
								onOpenMeme()
							}}
							src={meme.image_url}
							alt={meme.name}
							className="w-full h-full cursor-pointer"
						/>
					</div>
					<div className="title_wrapper flex justify-between text-lg leading-tight md:text-xl max-w-full">
						<p>
							{meme.name.length > 30
								? meme.name.slice(0, 30) + '...'
								: meme.name}
						</p>
					</div>
				</div>
				<div className="flex flex-row md:flex-col justify-between ml-1 md:pt-8 md:pb-4">
					<p className="text-[#1783fb] text-lg md:text-xl font-bold"></p>
					<div className="flex flex-row justify-center md:justify-normal md:flex-col items-center md:items-start gap-y-0 md:gap-y-5 gap-x-4 md:gap-x-0">
						<div className="flex flex-row md:flex-col items-start gap-x-0.5 md:gap-y-0 lg:gap-y-2">
							{/* {activeTab === 'all' && (
								<div title="upvote" className="upvote-wrapper cursor-pointer">
									<BiUpArrow
										className="w-3 h-3 md:w-5 md:h-5 lg:w-7 lg:h-7"
										onClick={() => {
											if (onUpvoteDownvote) {
												onUpvoteDownvote(meme._id, 'upvote')
											}
										}}
									/>
								</div>
							)} */}

							<div className="flex flex-col items-center justify-center gap-x-2 relative">
								{eyeOpen ? (
									<img
										src={'/assets/vote/icon1.png'}
										alt="vote"
										className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 "
									/>
								) : (
									<Logo
										classNames={
											'w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 ' +
											(voteMeme
												? meme.created_by._id === userDetails?._id
													? '!cursor-not-allowed'
													: '!cursor-pointer'
												: '!cursor-not-allowed')
										}
										onClick={() => (meme.created_by._id != userDetails?._id) && localVoteMeme(meme._id)}
									/>
								)}
								<span className="text-base md:text-2xl text-[#1783fb]">
									{count}
								</span>

								{/* +0.1 Points Animation */}
								{showPointsAnimation && (
									<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
										+0.1 $eART
									</div>
								)}
							</div>

							{/* {activeTab === 'all' && (
								<div
									title="downvote"
									className="downvote-wrapper cursor-pointer"
								>
									<BiDownArrow
										className="w-3 h-3 md:w-5 md:h-5 lg:w-7 lg:h-7"
										onClick={() => {
											if (onUpvoteDownvote) {
												onUpvoteDownvote(meme._id, 'downvote')
											}
										}}
									/>
								</div>
							)} */}
						</div>
						
						{user && user.address ? (
							<div className="-ml-1">
								{isBookmarked ? (
									<div className="flex flex-col items-center cursor-pointer">
										<FaBookmark
											className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8"
											onClick={() => {
												handleBookmark(meme._id)
												setIsBookmarked(!isBookmarked)
												setBmkCount(bmkCount + (isBookmarked ? -1 : 1));
											}}
										/>
										<span className="text-lg md:text-2xl text-[#1783fb]">{bmkCount}</span>
									</div>
								) : (
									<div className="flex flex-col items-center cursor-pointer">
										<CiBookmark
											className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8"
											onClick={() => {
												handleBookmark(meme._id)
												setIsBookmarked(!isBookmarked)
												setBmkCount(bmkCount + (isBookmarked ? -1 : 1));
											}}
										/>
										<span className="text-lg md:text-2xl text-[#1783fb]">{bmkCount}</span>
									</div>
								)}
							</div>
						) : null}
						<div className="flex flex-col items-center">
							<FaRegShareFromSquare
								className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 cursor-pointer"
								onClick={() => {
									setIsShareOpen(true)
								}}
							/>
							<span className="text-lg md:text-2xl text-[#1783fb]"></span>
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

import React, { useState, useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { LazyImage } from '@/components/LazyImage'
import { MdDeleteOutline, MdOutlineReport } from "react-icons/md";
import { MemeCardProps } from './types'
import { CiUser } from "react-icons/ci";
import { useRouter } from 'next/navigation'

function Memecard({
	meme,
	pageType,
	onVote,
	onShare,
	onBookmark,
	isBookmarked = false,
	onImageClick,
	onReport,
	isGridView,
	isSelf = false,
	onDelete,
}: MemeCardProps) {
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const [localVoteCount, setLocalVoteCount] = useState(meme.vote_count)
	const [hasVoted, setHasVoted] = useState(meme.has_user_voted)
	const [isHidden, setIsHidden] = useState(false)
	const router = useRouter();

	// Sync with prop changes
	useEffect(() => {
		setLocalVoteCount(meme.vote_count)
		setHasVoted(meme.has_user_voted)
	}, [meme.vote_count, meme.has_user_voted])

	if (isHidden) {
		return null
	}

	return (
		<div className="w-full bg-black/5 rounded-lg overflow-hidden mb-4">
			{/* User info header */}
			<div className="p-3 flex items-center space-x-2" hidden={isGridView || false}>
				<div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-none" onClick={() => router.push(`/mobile/profile/${meme.created_by?._id}`)}>
					{meme.created_by?.profile_pic ? (
						<img
							src={meme.created_by.profile_pic}
							alt={meme.created_by.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-white text-sm">
							{meme.created_by?.username?.[0]?.toUpperCase() || '?'}
						</div>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-white text-sm font-medium truncate">
						{meme.name}
					</h3>
					<div className="flex items-center space-x-2">
						<span className="text-gray-400 text-xs truncate">
							{meme.created_by?.username || 'Anonymous'}
						</span>
						{pageType === 'all' && meme.rank && (
							<span className="text-gray-400 text-xs">#{meme.rank}</span>
						)}
					</div>
				</div>
			</div>

			{/* Meme image */}
			<div onClick={onImageClick} className="cursor-pointer">
				<LazyImage
					src={meme.image_url}
					alt={meme.name}
					className="w-full aspect-square object-cover"
					onError={() => setIsHidden(true)}
				/>
			</div>

			{/* Action buttons */}
			<div className="py-2 px-3 bg-black/5" hidden={isGridView || false}>
				<div className="flex justify-between items-center">
					<div className="w-16 flex flex-row justify-between" > 
						<div className='flex items-center flex-col justify-center' hidden>
							<CiUser className="w-6 h-6 text-white"/>
							<span className="text-xs text-white">{meme.views || 0}</span>
						</div>
						{
							!isSelf ? 
							(onReport && 
							(
								<div className="flex items-center flex-col justify-center">
									<MdOutlineReport 
									className="w-6 h-6 text-white cursor-pointer"
									onClick={() => onReport(meme._id)}/>
								</div>
							)) : ( onDelete && (
								<div className="flex items-center flex-col justify-center">
									<MdDeleteOutline 
									className="w-6 h-6 text-white cursor-pointer"
									onClick={() => onDelete(meme._id)}/>
								</div>
							))
						}
					</div>
					{/* Vote button and count in middle */}
					<div className="flex flex-row items-center gap-2 relative">
						{onVote && (
							<>
								{hasVoted ? (
									<img
										src="/assets/vote/icon1.png"
										alt="voted"
										className="w-6 h-6"
									/>
								) : (
									<Logo
										classNames="w-6 h-6 cursor-pointer"
										onClick={() => {
											// Optimistic updates
											setHasVoted(true)
											setLocalVoteCount(prev => prev + 1)
											setShowPointsAnimation(true)

											// Call the actual vote function
											onVote(meme._id)

											setTimeout(() => {
												setShowPointsAnimation(false)
											}, 2000)
										}}
									/>
								)}
								{pageType === 'all' && (
									<span className="text-base mt-1">{localVoteCount}</span>
								)}
								{/* Points Animation */}
								{showPointsAnimation && (
									<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
										+0.1 $eART
									</div>
								)}
							</>
						)}
					</div>
					{/* Share and bookmark on right */}
					<div className="flex items-center space-x-3 w-16 justify-end">
						{onShare && (
							<img
								src='/assets/bottom_nav/Share.png'
								className="w-6 h-6 text-white cursor-pointer"
								onClick={() => onShare(meme._id, meme.image_url)}
							/>
						)}
						{onBookmark &&
							(isBookmarked ? (
								<img
									src='/assets/bottom_nav/Bookmark_sel.png'
									className="w-6 h-6 text-white cursor-pointer"
									onClick={() =>
										onBookmark(meme._id, meme.name, meme.image_url)
									}
								/>
							) : (
								<img
									src='/assets/bottom_nav/Bookmark.png'
									className="w-6 h-6 text-white cursor-pointer"
									onClick={() =>
										onBookmark(meme._id, meme.name, meme.image_url)
									}
								/>
							))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Memecard

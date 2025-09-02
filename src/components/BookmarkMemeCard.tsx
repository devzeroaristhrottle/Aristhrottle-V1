'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaRegShareFromSquare, FaBookmark } from 'react-icons/fa6'
import { CiBookmark } from 'react-icons/ci'
import { LazyImage } from '@/components/LazyImage'
import { Logo } from '@/components/Logo'
import { Meme } from '@/app/home/page'
import axiosInstance from '@/utils/axiosInstance'
import { toast } from 'react-toastify'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'

interface BookmarkMemeCardProps {
	meme: Meme
	index: number
	userDetails: any
	savedMemes: Set<string>
	onMemeClick: (meme: Meme, index: number) => void
	onShare: (id: string, imageUrl: string) => void
	onSavedMemesUpdate: (memeId: string) => void
	onVoteUpdate: (memeId: string) => void
}

export default function BookmarkMemeCard({
	meme,
	index,
	userDetails,
	savedMemes,
	onMemeClick,
	onShare,
	onSavedMemesUpdate,
	onVoteUpdate
}: BookmarkMemeCardProps) {
	const router = useRouter()
	const { handleBookmark } = useMemeActions()
	const [isHidden, setIsHidden] = useState(false)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const [isVoting, setIsVoting] = useState(false)

	const handleVoteMeme = async (memeId: string) => {
		try {
			if (!userDetails) {
				toast.error("Please connect wallet to vote")
				return
			}

			// Prevent multiple rapid votes
			if (isVoting) return
			
			setIsVoting(true)
			
			// Show animation
			setShowPointsAnimation(true)
			
			onVoteUpdate(memeId)
			
			await axiosInstance.post('/api/vote', { 
				vote_to: memeId, 
				vote_by: userDetails._id 
			})

			// Hide animation after 2 seconds
			setTimeout(() => {
				setShowPointsAnimation(false)
			}, 2000)

		} catch (error) {
			console.error('Error voting for meme:', error)
			toast.error("Error voting meme")
		} finally {
			// Reset voting state after a short delay
			setTimeout(() => {
				setIsVoting(false)
			}, 1000)
		}
	}

	const handleSaveMeme = async (memeId: string) => {
		try {
			onSavedMemesUpdate(memeId)
			handleBookmark(memeId)
		} catch (error) {
			console.error('Error saving meme:', error)
			toast.error("Error saving meme")
		}
	}

	if (isHidden) {
		return null
	}

	return (
		<div className="p-3 md:p-4 w-full lg:mx-auto">
			<div className="flex flex-col md:flex-row gap-x-3">
				<div className="flex flex-col">
					{/* Mobile: Avatar and Username */}
					<div className="flex justify-between items-start md:hidden text-lg leading-tight max-w-full mb-2">
						<div
							className="flex items-center gap-x-1 cursor-pointer"
							onClick={() => router.push(`/home/profiles/${meme.created_by._id}`)}
						>
							<img src={meme.created_by.profile_pic} className='h-8 w-8 rounded-full'/>
							<span className="text-[#29e0ca] text-base md:text-2xl md:pb-1">
								{meme.created_by.username}
							</span>
						</div>
					</div>

					{/* Desktop: Avatar and Username */}
					<div className="hidden md:flex justify-between items-start text-lg leading-tight max-w-full mb-2">
						<div
							className="flex items-center gap-x-1 cursor-pointer"
							onClick={() => router.push(`/home/profiles/${meme.created_by._id}`)}
						>
							<img src={meme.created_by.profile_pic} className='h-8 w-8 rounded-full'/>
							<span className="text-[#29e0ca] text-base md:text-2xl md:pb-1">
								{meme.created_by.username}
							</span>
						</div>
					</div>

					<div className="image_wrapper w-full h-full sm:w-[15rem] sm:h-[15rem] md:w-[15rem] md:h-[15rem] lg:w-[14rem] lg:h-[14rem] xl:w-[20rem] xl:h-[20rem] object-cover ">
						<LazyImage
							onClick={() => onMemeClick(meme, index)}
							src={meme.image_url}
							alt={meme.name}
							className="w-full h-full cursor-pointer rounded-xl"
							onError={() => setIsHidden(true)}
						/>
					</div>
					
					{/* Mobile: Text and Icons on same line */}
					<div className="flex justify-between items-start md:hidden text-lg leading-tight max-w-full mt-2">
						<p className="flex-1">
							{meme.name.length > 30
								? meme.name.slice(0, 30) + '...'
								: meme.name}
						</p>
						<div className="flex flex-row items-start gap-x-4 ml-2">
							{/* Vote Section - No count displayed */}
							<div className="flex flex-col items-center justify-start relative">
								{meme.has_user_voted ? (
									<img
										src={'/assets/vote/icon1.png'}
										alt="vote"
										className="w-5 h-5"
									/>
								) : (
									<Logo
										classNames={
											'w-5 h-5 transition-transform ' +
											(!isVoting && meme.created_by._id !== userDetails?._id
												? '!cursor-pointer hover:scale-110'
												: '!cursor-not-allowed opacity-50')
										}
										onClick={() => (meme.created_by._id !== userDetails?._id) && !isVoting && handleVoteMeme(meme._id)}
									/>
								)}

								{/* +0.1 Points Animation */}
								{showPointsAnimation && (
									<div 
										className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg pointer-events-none"
										style={{
											animation: 'flyUp 2s ease-out forwards'
										}}
									>
										+0.1 $eART
									</div>
								)}
							</div>
							
							{/* Bookmark Section - Only blue icon, no count */}
							<div className="flex flex-col items-center transition-transform cursor-pointer hover:scale-110"
								onClick={() => handleSaveMeme(meme._id)}
							>
								<FaBookmark className="w-5 h-5 text-[#1783fb]" />
							</div>
							
							{/* Share Section - No count */}
							<div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
								onClick={() => onShare(meme._id, meme.image_url)}
							>
								<FaRegShareFromSquare className="w-5 h-5" />
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
					<div className="flex flex-col items-start gap-y-4">
						{/* Vote Section - No count displayed */}
						<div className="flex flex-col items-center justify-center relative">
							{meme.has_user_voted ? (
								<img
									src={'/assets/vote/icon1.png'}
									alt="vote"
									className="w-5 h-5 lg:w-7 lg:h-7"
								/>
							) : (
								<Logo
									classNames={
										'w-6 h-6 lg:w-7 lg:h-7 transition-transform ' +
										(!isVoting && meme.created_by._id !== userDetails?._id
											? '!cursor-pointer hover:scale-110'
											: '!cursor-not-allowed opacity-50')
									}
									onClick={() => (meme.created_by._id !== userDetails?._id) && !isVoting && handleVoteMeme(meme._id)}
								/>
							)}

							{/* +0.1 Points Animation */}
							{showPointsAnimation && (
								<div 
									className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg pointer-events-none"
									style={{
										animation: 'flyUp 2s ease-out forwards'
									}}
								>
									+0.1 $eART
								</div>
							)}
						</div>
						
						{/* Bookmark Section - Only blue icon, no count */}
						<div className="flex flex-col items-center transition-transform cursor-pointer hover:scale-110"
							onClick={() => handleSaveMeme(meme._id)}
						>
							<FaBookmark className="w-7 h-7 lg:w-8 lg:h-8 text-[#1783fb]" />
						</div>
						
						{/* Share Section - No count */}
						<div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
							onClick={() => onShare(meme._id, meme.image_url)}
						>
							<FaRegShareFromSquare className="w-5 h-5 lg:w-7 lg:h-7" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
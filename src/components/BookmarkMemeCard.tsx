'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CgProfile } from 'react-icons/cg'
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

	const handleVoteMeme = async (memeId: string) => {
		try {
			onVoteUpdate(memeId)
			
			if (!userDetails) {
				toast.error("Please connect wallet to vote")
				return
			}
			
			await axiosInstance.post('/api/vote', { 
				vote_to: memeId, 
				vote_by: userDetails._id 
			})
		} catch (error) {
			console.error('Error voting for meme:', error)
			toast.error("Error voting meme")
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

	return (
		<div className="flex justify-center">
			<div className="w-full max-w-sm rounded-lg overflow-hidden bg-gradient-to-r from-[#1783fb]/10 to-[#1783fb]/5 border border-[#1783fb]/20 p-3">
				<div 
					className="username_rank_wrapper flex items-center gap-x-2 mb-3 cursor-pointer"
					onClick={() => router.push(`/home/profiles/${meme.created_by._id}`)}
				>
					<CgProfile className="md:w-6 md:h-6" />
					<span className="text-[#29e0ca] text-base md:text-xl">
						{meme.created_by.username}
					</span>
				</div>
				
			{/* Image and Action Buttons Container */}
			<div className="flex gap-3">
				<div 
					className="image_wrapper flex-1 aspect-square border-2 border-white rounded-lg overflow-hidden cursor-pointer"
					onClick={() => onMemeClick(meme, index)}
				>
					<LazyImage
						src={meme.image_url}
						alt={meme.name}
						className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
					/>
				</div>
				
				{/* Action Buttons - Vertical Layout */}
				<div className="flex flex-col justify-end gap-2 w-4">
					{/* Vote Button */}
					<div className="flex flex-col items-center">
						{meme.has_user_voted ? (
							<img
								src={'/assets/vote/icon1.png'}
								alt="vote"
								className="!w-12 h-6"
							/>
						) : (
							<Logo
								classNames={
									'w-6 h-6 md:w-7 md:h-7 ' +
									(meme.created_by._id === userDetails?._id
										? '!cursor-not-allowed'
										: '!cursor-pointer')
								}
								onClick={() => (meme.created_by._id !== userDetails?._id) && handleVoteMeme(meme._id)}
							/>
						)}
						<span className="text-sm md:text-base text-[#1783fb] mt-1">
							{meme.vote_count}
						</span>
					</div>
					
					{/* Save/Bookmark Button */}
					<div className="flex flex-col items-center">
						{savedMemes.has(meme._id) ? (
							<FaBookmark
								className="w-4 h-6 cursor-pointer text-[#29e0ca] hover:text-[#1783fb] transition-colors duration-300"
								onClick={() => handleSaveMeme(meme._id)}
							/>
						) : (
							<CiBookmark
								className="w-4 h-6 cursor-pointer text-[#1783fb] hover:text-[#29e0ca] transition-colors duration-300"
								onClick={() => handleSaveMeme(meme._id)}
							/>
						)}
						<span className="text-sm md:text-base text-[#1783fb] mt-1">
							{meme.bookmarks.length}
						</span>
					</div>
					
					{/* Share Button */}
					<div className="flex flex-col items-center">
						<FaRegShareFromSquare
							className="w-4 h-6 cursor-pointer text-[#1783fb] hover:text-[#29e0ca] transition-colors duration-300"
							onClick={() => onShare(meme._id, meme.image_url)}
						/>
					</div>
				</div>
			</div>
			
			{/* Meme Title */}
			<div className="mt-3">
				<p className="font-medium text-lg md:text-xl text-white">
					{meme.name.length > 30 ? meme.name.slice(0, 30) + '...' : meme.name}
				</p>
			</div>
			</div>
		</div>
	)
} 
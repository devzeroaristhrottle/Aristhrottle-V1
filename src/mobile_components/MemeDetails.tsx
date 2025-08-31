'use client'

import React, { useContext, useEffect, useState } from 'react'
import { FaBookmark, FaRegShareFromSquare, FaSpinner } from 'react-icons/fa6'
import { CgCloseO } from 'react-icons/cg'
import { CiBookmark, CiUser } from 'react-icons/ci'
import { MdOutlineReport } from 'react-icons/md'
import { useAuthModal, useUser } from '@account-kit/react'
import { Context } from '@/context/contextProvider'
import { Logo } from '@/components/Logo'
import Carousel from './Carousel'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { Meme, MemeDetailProps } from '@/mobile_components/types'
import axiosInstance from '@/utils/axiosInstance'
import ShareModal from './ShareModal'



export default function MemeDetails({
	isOpen = true,
	onClose = () => {},
	meme,
	onVoteMeme,
	bmk,
	onMemeChange,
	handleReport,
	type = "all"
}: MemeDetailProps) {
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [showPointsAnimation, setShowPointsAnimation] = useState(false)
	const [relatedMemes, setRelatedMemes] = useState<Meme[]>([])
	const [isLoad, setIsLoad] = useState<boolean>(false)
	const user = useUser()
	const { handleBookmark } = useMemeActions()
	const [isBookmarked, setIsBookmarked] = useState(bmk)
	const { userDetails, setUserDetails } = useContext(Context)
	const [eyeOpen, setEyeOpen] = useState<boolean>(meme?.has_user_voted || false)

	const { openAuthModal } = useAuthModal()

	// Helper function to format date as "31st August 2025"
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString)
		const day = date.getDate()
		const month = date.toLocaleDateString('en-US', { month: 'long' })
		const year = date.getFullYear()
		
	
		
		return `${day} ${month}, ${year}`
	}

	const isMeme = (meme: Meme): meme is Meme =>
		'tags' in meme && Array.isArray(meme.tags)

	const getRelatedMemes = async () => {
		try {
			if (meme && isMeme(meme) && meme.tags && meme.tags.length > 0) {
				setIsLoad(true)
				const tags = meme.tags.map(t => (typeof t === 'string' ? t : t.name)).join(',')
				const response = await axiosInstance.get(`/api/meme?name=${tags}`)
				if (response.data.memes) {
					setRelatedMemes(response.data.memes)
				}
				setIsLoad(false)
			}
		} catch (error) {
			console.log(error)
			setIsLoad(false)
		}
	}

	const handleVote = (memeId: string) => {
		try {
			if (!userDetails) {
				openAuthModal()
				return
			}
			onVoteMeme(memeId)
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
			setEyeOpen(true)
		} catch (err) {
			console.log(err)
		}
	}

	const handleBookmarkClick = async (memeId: string) => {
		try {
			await handleBookmark(memeId)
			setIsBookmarked(!isBookmarked)
		} catch (err) {
			console.log(err)
		}
	}
	
	const handleRelatedMemeClick = (relatedMeme: Meme) => {
		// Update the current meme to the clicked related meme
		if (relatedMeme && relatedMeme._id !== meme?._id) {
			// Reset states for the new meme
			setEyeOpen(relatedMeme.has_user_voted || false)
			setIsBookmarked(bmk)
			
			// Scroll to top of modal
			const modalContent = document.querySelector('.fixed.inset-0.z-50.flex.flex-col > div')
			if (modalContent) {
				modalContent.scrollTop = 0
			}
			
			// Call the parent component's onMemeChange handler if provided
			if (onMemeChange) {
				onMemeChange(relatedMeme);
			}
		}
	}

	useEffect(() => {
		setEyeOpen(meme?.has_user_voted || false)
		getRelatedMemes()
	}, [meme])

	useEffect(() => {
		setIsBookmarked(bmk)
	}, [bmk])

	if (!meme) return null

	if (!isOpen) return null

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Main Container */}
			<div className="fixed inset-0 z-50 flex flex-col">
				<div className="relative w-full h-full bg-black/90 overflow-y-auto">
					{/* Header */}
					<div className="sticky top-0 z-10 bg-black/90 px-4 py-3 flex justify-end">
						<button
							onClick={onClose}
							className="p-2 bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm"
						>
							<CgCloseO className="text-white w-6 h-6" />
						</button>
					</div>

					{/* Content */}
					<div className="p-4 space-y-4">
						{/* User Info, Title, and Tags */}
						<div className="flex gap-4 items-center">
							{/* Profile Photo */}
							<div className="w-12 h-12 rounded-full overflow-hidden bg-[#29e0ca]/20 flex-none">
								{meme.created_by?.profile_pic ? (
									<img
										src={meme.created_by.profile_pic}
										alt={meme.created_by.username}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-white text-lg">
										{meme.created_by?.username?.[0]?.toUpperCase() || '?'}
									</div>
								)}
							</div>

							{/* Title, Author, and Tags */}
							<div className="flex-1 space-y-1">
								<h3 className="text-white font-extrabold text-sm">{meme.name}</h3>
								{/* Tags */}
								{meme.tags && meme.tags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{meme.tags.map((tag, index: number) => (
											<span
												key={index}
												className=" border-[#1783fb] rounded-lg px-1 text-sm font-medium bg-gray-600"
												style={{fontSize: '0.6rem'}}
											>
												{typeof tag === 'string' ? tag : tag.name}
											</span>
										))}
									</div>
								)}
								<span className="text-gray-400 block" style={{fontSize: "0.75rem"}}>
									{(meme.created_by?.username || 'Anonymous') + " • " + formatDate(meme.createdAt) + " • " + (new Date(meme.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
								</span>
							</div>
						</div>

						{/* Image */}
						<div className="relative aspect-square w-full">
							<img
								src={meme.image_url}
								alt={meme.name}
								className="w-full h-full object-contain"
							/>
						</div>

						{/* Action Buttons */}
						<div className="p-3 bg-black/5">
							<div className="flex justify-between items-center">
								{/* Views and Report buttons on left */}
								<div className="w-16 flex flex-row justify-between">
									<div className="flex items-center flex-col justify-center">
										<CiUser className="w-6 h-6 text-white" />
										<span className="text-xs text-white">{meme.views || 0}</span>
									</div>
									{handleReport && (
										<div className="flex items-center flex-col justify-center">
											<MdOutlineReport 
												className="w-6 h-6 text-white cursor-pointer"
												onClick={() => handleReport(meme._id)}
											/>
										</div>
									)}
								</div>
								
								{/* Vote button and count in middle */}
								<div className="flex flex-row items-center gap-2 relative">
									{eyeOpen ? (
										<img
											src="/assets/vote/icon1.png"
											alt="voted"
											className="w-8 h-8"
										/>
									) : (
										<Logo
											classNames="w-8 h-8 cursor-pointer"
											onClick={() =>
												meme.created_by?._id != userDetails?._id &&
												handleVote(meme._id)
											}
										/>
									)}
									{type == 'all' && <span className="text-base mt-1">{meme.vote_count}</span>}
									{showPointsAnimation && (
										<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
											+0.1 $eART
										</div>
									)}
								</div>
								
								{/* Share and bookmark on right */}
								<div className="flex items-center space-x-6 w-24 justify-end">
									{/* Share button with count */}
									<div className="flex flex-col items-center">
										<FaRegShareFromSquare
											className="w-5 h-5 text-white cursor-pointer"
											onClick={() => setIsShareOpen(true)}
										/>
										{meme.shares && meme.shares.length > 0 && (
											<p className="text-[#1783fb] text-sm mt-1">{meme.shares.length}</p>
										)}
									</div>
									
									{/* Bookmark button with count */}
									{user && user.address && (
										<div className="flex flex-col items-center">
											{isBookmarked ? (
												<FaBookmark
													className="w-5 h-5 text-white cursor-pointer"
													onClick={() => handleBookmarkClick(meme._id)}
												/>
											) : (
												<CiBookmark
													className="w-6 h-6 text-white cursor-pointer"
													onClick={() => handleBookmarkClick(meme._id)}
												/>
											)}
											{meme.bookmarks && meme.bookmarks.length > 0 && (
												<p className="text-[#1783fb] text-sm mt-1">{meme.bookmarks.length}</p>
											)}
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Related Memes */}
						{isMeme(meme) && relatedMemes.length > 0 && (
							<div className="mt-6 space-y-3">
								<label className="text-lg block">
									Related:
								</label>
								{!isLoad ? (
									<Carousel
										items={relatedMemes}
										onMemeClick={handleRelatedMemeClick}
									/>
								) : (
									<div className="flex justify-center items-center py-8">
										<FaSpinner className="animate-spin h-8 w-8 text-[#1783fb]" />
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Share Modal */}
			<ShareModal 
				isOpen={isShareOpen} 
				onClose={() => setIsShareOpen(false)} 
				contentTitle={meme.name} 
				contentUrl={`${window.location.origin}/home?id=${meme._id}`}
			/>
		</>
	)
}

'use client'

import { Context } from '@/context/contextProvider'
import { Button } from '@chakra-ui/react'
import axiosInstance from '@/utils/axiosInstance'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { CgProfile } from 'react-icons/cg'
import MemeDetail from '@/components/MemeDetail'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { FaRegShareFromSquare, FaRegBookmark } from 'react-icons/fa6'
import { Tooltip } from '@/components/ui/tooltip'
import Share from '@/components/Share'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { LeaderboardMeme } from '../leaderboard/page'
import { useRouter } from 'next/navigation'
import { LazyImage } from '@/components/LazyImage'

type Props = {}

type TabType = 'live' | 'all'

interface MyVotedMeme {
	id: string
	vote_by: {
		username: string
	}
	vote_to: {
		_id: string
		image_url: string
		name: string
		winning_number?: number
		in_percentile?: number
		createdAt: string
		vote_count: string
		tags: string[]
		created_by: {
			_id: string
			username: string
		}
		shares: string[]
		bookmarks: string[]
		has_user_voted: boolean
	}
}

export default function Page({}: Props) {
	const [loading, setLoading] = useState<boolean>(false)
	const [allMemes, setAllMemes] = useState<MyVotedMeme[]>([])
	const [activeTab, setActiveTab] = useState<TabType>('live')
	
	// Modal state
	const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
	const [selectedMeme, setSelectedMeme] = useState<LeaderboardMeme | null>(null)
	const [selectedMemeIndex, setSelectedMemeIndex] = useState(-1)

	// Share modal state
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{id: string, imageUrl: string} | null>(null)

	const { userDetails } = useContext(Context)
	const { handleBookmark } = useMemeActions()
	const router = useRouter();

	useEffect(() => {
		getMyMemes()
	}, [userDetails])

	const getMyMemes = async () => {
		try {
			if (!userDetails?._id) {
				throw new Error('User not found')
			}
			setLoading(true)
			// Fetch a larger number of memes to ensure we get all of them
			const largeOffset = 100 // Increased from default offset
			const response = await axiosInstance.get(
				`/api/meme?vote_by=${userDetails._id}&offset=${largeOffset}`
			)

			if (response.data.memes) {
				setAllMemes([...response.data.memes])
			}
		} catch (error) {
			console.log(error)
		} finally {
			setLoading(false)
		}
	}

	// Filter memes based on active tab
	const getFilteredMemes = () => {
		if (activeTab === 'live') {
			const now = new Date()
			now.setUTCHours(0, 0, 0, 0)
			const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			
			return allMemes.filter(meme => {
				const createdAt = new Date(meme.vote_to.createdAt)
				return createdAt >= twentyFourHoursAgo;
			})
		}
		return allMemes
	}

	// Sort memes by createdAt date (latest to oldest)
	const sortByDate = (memes: MyVotedMeme[]) => {
		return [...memes].sort((a, b) => {
			const dateA = new Date(a.vote_to.createdAt).getTime()
			const dateB = new Date(b.vote_to.createdAt).getTime()
			return dateB - dateA // Sort in descending order (newest first)
		})
	}

	const filteredMemes = sortByDate(getFilteredMemes())

	// Transform meme data for compatibility with MemeDetail
	const transformMeme = (votedMeme: MyVotedMeme): LeaderboardMeme => {
		console.log(votedMeme.vote_to.bookmarks)
		return {
			_id: votedMeme.vote_to._id,
			vote_count: parseInt(votedMeme.vote_to.vote_count),
			name: votedMeme.vote_to.name,
			image_url: votedMeme.vote_to.image_url,
			tags: votedMeme.vote_to.tags || [],
			created_by: votedMeme.vote_to.created_by,
			createdAt: votedMeme.vote_to.createdAt,
			shares: votedMeme.vote_to.shares || [],
			bookmarks: votedMeme.vote_to.bookmarks || [],
			has_user_voted: votedMeme.vote_to.has_user_voted,
			rank: votedMeme.vote_to.winning_number || 0,
			in_percentile: votedMeme.vote_to.in_percentile || 0,
			onVoteMeme: () => {}
		}
	}

	// Handle opening meme detail
	const handleOpenMeme = (meme: MyVotedMeme, index: number) => {
		const transformedMeme = transformMeme(meme)
		setSelectedMeme(transformedMeme)
		setSelectedMemeIndex(index)
		setIsMemeDetailOpen(true)
	}

	// Handle closing meme detail
	const handleCloseMeme = () => {
		setIsMemeDetailOpen(false)
		setSelectedMeme(null)
		setSelectedMemeIndex(-1)
	}

	// Handle voting (user already voted, so this shouldn't allow voting again)
	const handleVote = async (memeId: string) => {
		toast.info('You have already voted on this content!')
		console.log(memeId)
	}

	// Handle share
	const handleShare = (memeId: string, imageUrl: string) => {
		setShareData({ id: memeId, imageUrl })
		setIsShareOpen(true)
	}

	const handleShareClose = () => {
		setIsShareOpen(false)
		setShareData(null)
	}

	// Handle bookmark
	const handleBookmarkClick = async (memeId: string) => {
		try {
			await handleBookmark(memeId)
			toast.success('Content Saved!')
		} catch (error) {
			console.error(error)
			toast.error('Failed to update bookmark')
		}
	}

	// Navigation handlers
	const handleNext = () => {
		if (selectedMemeIndex < filteredMemes.length - 1) {
			const nextIndex = selectedMemeIndex + 1
			const nextMeme = transformMeme(filteredMemes[nextIndex])
			setSelectedMemeIndex(nextIndex)
			setSelectedMeme(nextMeme)
		}
	}

	const handlePrev = () => {
		if (selectedMemeIndex > 0) {
			const prevIndex = selectedMemeIndex - 1
			const prevMeme = transformMeme(filteredMemes[prevIndex])
			setSelectedMemeIndex(prevIndex)
			setSelectedMeme(prevMeme)
		}
	}

	// Prevent body scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = isMemeDetailOpen ? 'hidden' : 'auto'
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isMemeDetailOpen])

	return (
		<div className="flex flex-col max-w-7xl mx-auto px-8">
			<div className="space-x-5 col-start-2 flex justify-center mb-6">
				<Button
					size="sm"
					variant={activeTab === 'live' ? 'solid' : 'outline'}
					className={`border px-7 rounded-full hover:scale-105 ${
						activeTab === 'live'
							? 'border-black text-black bg-[#29e0ca]'
							: 'border-[#29e0ca] text-[#29e0ca]'
					}`}
					onClick={() => setActiveTab('live')}
				>
					Today{' '}
					<span className="relative flex h-3 w-3 items-center justify-center ml-1">
						<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
						<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
					</span>
				</Button>
				<Button
					size="sm"
					variant={activeTab === 'all' ? 'solid' : 'outline'}
					className={`border px-8 rounded-full hover:scale-105 ${
						activeTab === 'all'
							? 'border-black text-black bg-[#29e0ca]'
							: 'border-[#29e0ca] text-[#29e0ca]'
					}`}
					onClick={() => setActiveTab('all')}
				>
					All
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{filteredMemes.map((item, index) => (
					<div key={index} className="flex flex-col">
						{/* Header with username and rank */}
						<div className="flex justify-between items-center mb-2">
							<div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/home/profiles/${item.vote_to.created_by._id}`)}>
								<CgProfile size={28} />
								<span className="text-[#29e0ca] text-xl md:text-2xl">
									{item.vote_to.created_by.username}
								</span>
							</div>
							{item.vote_to.winning_number ? (
								<p className="text-[#29e0ca] font-medium text-lg md:text-xl">
									#{item.vote_to.winning_number}
								</p>
							) : null}
						</div>

						{/* Main content area */}
						<div className="flex">
							{/* Image */}
							<div className="relative flex-grow">
								<LazyImage 
									src={item.vote_to.image_url} 
									alt="Content" 
									className="w-full aspect-square object-cover border-2 border-white cursor-pointer hover:opacity-80 transition-opacity"
									onClick={() => handleOpenMeme(item, index)}
								/>
							</div>

							{/* Action buttons - Desktop */}
							<div className="hidden md:block ml-3 place-content-end space-y-6">
								{/* Vote button - Already voted state */}
								<div className="flex flex-col items-center space-y-1">
									<Image
										src={'/assets/vote/icon1.png'}
										width={30}
										height={30}
										alt="voted"
										className="transition-all duration-300"
									/>
									<p className="text-center text-[#1783fb] font-bold text-lg">
										{item.vote_to.vote_count}
									</p>
								</div>

								
								<Tooltip content="Bookmark" positioning={{ placement: 'right-end' }}>
									<div className="text-center font-bold">
										<FaRegBookmark
											className="text-2xl cursor-pointer hover:text-[#29e0ca] transition-colors"
											onClick={() => handleBookmarkClick(item.vote_to._id)}
										/>
										<p className="text-[#1783fb] text-sm mt-1">
											{item.vote_to.bookmarks?.length || 0}
										</p>
									</div>
								</Tooltip>

								{/* Share button */}
								<Tooltip content="Share" positioning={{ placement: 'right-end' }}>
									<div className="text-center font-bold">
										<FaRegShareFromSquare
											className="text-2xl cursor-pointer hover:text-[#29e0ca] transition-colors"
											onClick={() => handleShare(item.vote_to._id, item.vote_to.image_url)}
										/>
										{/* <p className="text-[#1783fb] text-sm mt-1">
											{item.vote_to.shares?.length || 0}
										</p> */}
									</div>
								</Tooltip>

								{/* Bookmark button */}
							</div>
						</div>

						{/* Title and mobile actions */}
						<div className="flex justify-between items-center mt-2">
							<p 
								className="text-lg md:text-xl cursor-pointer hover:text-[#29e0ca] transition-colors flex-1 pr-4"
								onClick={() => handleOpenMeme(item, index)}
							>
								{item.vote_to.name}
							</p>

							{/* Action buttons - Mobile */}
							<div className="md:hidden flex items-center gap-4">
								{/* Vote button - Already voted state */}
								<div className="flex flex-col items-center">
									<Image
										src={'/assets/vote/icon1.png'}
										width={20}
										height={20}
										alt="voted"
										className="transition-all duration-300"
									/>
									<p className="text-center text-[#1783fb] font-bold text-sm">
										{item.vote_to.vote_count}
									</p>
								</div>

								{/* Bookmark button */}
								<div className="flex flex-col items-center">
									<FaRegBookmark
										className="text-lg cursor-pointer hover:text-[#29e0ca] transition-colors"
										onClick={() => handleBookmarkClick(item.vote_to._id)}
									/>
									<p className="text-[#1783fb] text-xs">
										{item.vote_to.bookmarks?.length || 0}
									</p>
								</div>

								{/* Share button */}
								<div className="flex flex-col items-center">
									<FaRegShareFromSquare
										className="text-lg cursor-pointer hover:text-[#29e0ca] transition-colors"
										onClick={() => handleShare(item.vote_to._id, item.vote_to.image_url)}
									/>
									{/* <p className="text-[#1783fb] text-xs">
										{item.vote_to.shares?.length || 0}
									</p> */}
								</div>
							</div>
						</div>
					</div>
				))}
				
				{/* Loading and empty states */}
				<div className="col-span-full">
					{loading && (
						<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
					)}
					{!loading && filteredMemes.length === 0 && (
						<p className="text-center text-nowrap text-2xl mx-auto">
							{activeTab === 'live' 
								? 'No live content found' 
								: 'Content not found'
							}
						</p>
					)}
				</div>
			</div>

			{/* Meme Detail Modal */}
			{isMemeDetailOpen && selectedMeme && (
				<MemeDetail
					isOpen={isMemeDetailOpen}
					onClose={handleCloseMeme}
					onNext={selectedMemeIndex < filteredMemes.length - 1 ? handleNext : undefined}
					onPrev={selectedMemeIndex > 0 ? handlePrev : undefined}
					meme={{...selectedMeme, has_user_voted: true}}
					tab={activeTab}
					onVoteMeme={handleVote}
					bmk={false} // We could check if user bookmarked this later
					searchRelatedMemes={() => {}}
				/>
			)}

			{/* Share Modal */}
			{isShareOpen && shareData && (
				<Share
					id={shareData.id}
					imageUrl={shareData.imageUrl}
					onClose={handleShareClose}
				/>
			)}
		</div>
	)
}

'use client'

import { FaBookmark, FaRegShareFromSquare } from 'react-icons/fa6'
import {
	DialogContent,
	DialogBody,
	DialogBackdrop,
	DialogRoot,
} from '@chakra-ui/react'
import { CgCloseO, CgProfile } from 'react-icons/cg'
import Share from './Share'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Meme, TagI } from '@/app/home/page'
import { LeaderboardMeme } from '@/app/home/leaderboard/page'
import { MdOutlineExpandMore } from 'react-icons/md'
import axiosInstance from '@/utils/axiosInstance'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useUser } from '@account-kit/react'
import Image from 'next/image'

interface MemeDetailProps {
	isOpen?: boolean
	onClose?: () => void
	meme: Meme | LeaderboardMeme | undefined
	searchRelatedMemes?: Dispatch<SetStateAction<string>>
	tab: string
}

interface Category {
	name: string
}

export default function MemeDetail({
	isOpen = true,
	onClose = () => {},
	meme,
	searchRelatedMemes,
	tab,
}: MemeDetailProps) {
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [relatedMemes, setRelatedMemes] = useState<Meme[]>([])
	const user = useUser()
	const { handleBookmark } = useMemeActions()
	const [isBookmarked, setIsBookmarked] = useState(false)

	const handleShareClose = () => setIsShareOpen(false)

	const isMeme = (meme: Meme | LeaderboardMeme): meme is Meme =>
		'tags' in meme && Array.isArray(meme.tags)

	const getRelatedMemes = async () => {
		try {
			if (meme && isMeme(meme) && meme.tags.length > 0) {
				const tags = meme.tags.map(t => t.name).join(',')
				const response = await axiosInstance.get(`/api/meme?name=${tags}`)
				if (response.data.memes) {
					setRelatedMemes([...response.data.memes])
				}
			}
		} catch (error) {
			console.log(error)
		}
	}

	const getBookmarks = () => {
		const bookmarks = localStorage.getItem('bookmarks')
		if (bookmarks) {
			const bookmarksObj = JSON.parse(bookmarks)
			if (meme && bookmarksObj[meme._id]) {
				setIsBookmarked(true)
			} else {
				setIsBookmarked(false)
			}
		}
	}

	useEffect(() => {
		getRelatedMemes()
		getBookmarks()
	}, [meme])

	// Close dialog on Escape key press
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleKeyPress)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyPress)
		}
	}, [isOpen, onClose])

	if (!meme) return null

	return (
		<>
			<DialogRoot open={isOpen} motionPreset="slide-in-bottom">
				<DialogBackdrop className="backdrop-blur-md" />
				<div className="flex justify-center items-center h-screen">
					<DialogContent className="fixed inset-2 md:inset-4 bg-[#141e29] border border-white w-[90vw] md:w-[70vw] lg:w-[60vw] h-[85vh] md:h-[80vh] max-w-none p-0 rounded-lg">
						<DialogBody className="overflow-y-auto no-scrollbar mx-4 md:mx-8 my-4">
							{/* Close Button */}
							<button
								onClick={onClose}
								className="absolute top-3 right-3 z-50 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
							>
								<CgCloseO className="text-white w-5 h-5" />
							</button>

							{/* Header */}
							<div className="flex items-center gap-3 mb-4 sm:mb-6">
								<div className="p-2 rounded-full bg-[#29e0ca]/20">
									<CgProfile className="w-5 h-5 sm:w-6 sm:h-6 text-[#29e0ca]" />
								</div>
								<span className="text-[#29e0ca] text-lg sm:text-xl font-semibold">
									{meme.created_by.username}
								</span>
							</div>

							{/* Main Content */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
								{/* Left side - Image and Actions */}
								<div className="space-y-3">
									{/* Image Container */}
									<div className="relative group">
										<div className="aspect-square w-3/4 mx-auto bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white/20 rounded-lg transition-all duration-300 group-hover:border-white/40">
											<img
												src={meme.image_url}
												alt={meme.name}
												className="max-w-full max-h-full object-contain"
											/>
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
										{/* Vote Count */}
										<div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm">
											<Image
												src={'/assets/vote/icon1.png'}
												width={24}
												height={24}
												alt="vote"
												className="transition-all duration-300"
											/>
											<span className="text-[#1783fb] font-bold text-lg sm:text-xl">
												{meme.vote_count}
											</span>
										</div>

										{/* Share */}
										<button
											onClick={() => setIsShareOpen(true)}
											className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300"
										>
											<FaRegShareFromSquare className="text-white w-5 h-5" />
											<span className="text-[#1783fb] font-bold text-lg sm:text-xl">
												{tab === 'live' ? meme.shares.length : meme.shares}
											</span>
										</button>

										{/* Bookmark */}
										{user && user.address && (
											<button
												onClick={() => {
													handleBookmark(meme._id, meme.name, meme.image_url)
													getBookmarks()
												}}
												className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300"
											>
												{isBookmarked ? (
													<FaBookmark className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
												) : (
													<CiBookmark className="text-white w-4 h-4 sm:w-5 sm:h-5" />
												)}
												<span className="text-[#1783fb] font-bold text-lg sm:text-xl">
													{tab === 'live'
														? meme.bookmarks.length
														: meme.bookmarks}
												</span>
											</button>
										)}
									</div>
								</div>

								{/* Right side - Details */}
								<div className="space-y-3 sm:space-y-4">
									{/* Title */}
									<div className="space-y-2">
										<label className="text-[#1783fb] text-lg sm:text-xl font-semibold block">
											Title
										</label>
										<p className="text-white text-base sm:text-lg font-medium bg-white/5 rounded-lg p-2 border border-white/10">
											{meme.name}
										</p>
									</div>

									{/* Categories */}
									{'categories' in meme && meme.categories?.length > 0 && (
										<div className="space-y-3">
											<label className="text-[#1783fb] text-lg sm:text-xl font-semibold block">
												Categories
											</label>
											<div className="flex flex-wrap gap-2">
												{meme.categories.map(
													(category: Category, index: number) => (
														<span
															key={index}
															className="bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg px-3 py-1.5 text-sm sm:text-base text-white font-medium backdrop-blur-sm"
														>
															{category.name}
														</span>
													)
												)}
											</div>
										</div>
									)}

									{/* Tags */}
									{isMeme(meme) && meme.tags.length > 0 && (
										<div className="space-y-3">
											<label className="text-[#1783fb] text-lg sm:text-xl font-semibold block">
												Tags
											</label>
											<div className="flex flex-wrap gap-2">
												{meme.tags.map((tag: TagI, index: number) => (
													<span
														key={index}
														className="bg-gradient-to-r from-[#29e0ca]/20 to-[#29e0ca]/10 border border-[#29e0ca]/50 rounded-lg px-3 py-1.5 text-sm sm:text-base text-white font-medium backdrop-blur-sm"
													>
														{tab === 'live'
															? tag.name
															: JSON.parse(JSON.stringify(tag))}
													</span>
												))}
											</div>
										</div>
									)}

									{/* Vote Count Info */}
									{meme.vote_count && (
										<div className="space-y-2">
											<label className="text-[#1783fb] text-lg sm:text-xl font-semibold block">
												Vote Count
											</label>
											<div className="bg-white/5 rounded-lg p-2 border border-white/10">
												<span className="text-white text-base sm:text-lg font-medium">
													{meme.vote_count} votes
												</span>
											</div>
										</div>
									)}

									{/* Upload Date */}
									<div className="space-y-2">
										<label className="text-[#1783fb] text-lg sm:text-xl font-semibold block">
											Uploaded on
										</label>
										<div className="bg-white/5 rounded-lg p-3 border border-white/10">
											<span className="text-white text-sm sm:text-base font-medium">
												{new Date(meme.createdAt).toLocaleString('en-IN', {
													day: '2-digit',
													month: 'short',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
													hour12: false,
													timeZoneName: 'short',
												})}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Related Content */}
							{isMeme(meme) &&
								relatedMemes.length > 0 &&
								searchRelatedMemes && (
									<div className="mt-4 lg:mt-6 space-y-3">
										<h3 className="text-xl sm:text-2xl lg:text-3xl text-[#1783fb] font-bold">
											Related Contents
										</h3>

										<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
											{relatedMemes.map((item, index) => {
												if (index < 6 && meme.name !== item.name) {
													return (
														<div
															key={item._id}
															onClick={() => {
																if (item.categories.length > 0) {
																	searchRelatedMemes(item.categories[0].name)
																	onClose()
																}
															}}
															className="group relative aspect-square border-2 border-white/20 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/40 hover:scale-105"
														>
															<img
																src={item.image_url}
																alt={`Related meme ${index + 1}`}
																className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
															/>
															<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
														</div>
													)
												}
											})}
										</div>

										<div className="flex justify-center mt-6">
											<button className="flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/20 transition-all duration-300">
												<span className="text-white text-base sm:text-lg font-medium">
													More
												</span>
												<MdOutlineExpandMore className="text-white text-lg sm:text-xl" />
											</button>
										</div>
									</div>
								)}
						</DialogBody>
					</DialogContent>
				</div>
			</DialogRoot>

			{isShareOpen && (
				<Share
					onClose={handleShareClose}
					imageUrl={meme?.image_url}
					id={meme?._id}
				/>
			)}
		</>
	)
}

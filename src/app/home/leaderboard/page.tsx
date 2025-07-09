'use client'

import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useRef, useState } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useFilterAndSort } from '@/hooks/useFilterAndSort'
import { FilterPopover } from '@/components/FilterPopover'
import { SortPopover } from '@/components/SortPopover'
import { TabButton } from '@/components/TabButton'
import MemeDetail from '@/components/MemeDetail'
import { LeaderboardMemeCard } from './MemeCard'
import { toast } from 'react-toastify'
import { Meme } from '../page'
import { useAuthModal } from '@account-kit/react'

export type LeaderboardMeme = {
	_id: string
	vote_count: number
	name: string
	image_url: string
	created_by: {
		_id: string
		username: string
		profile_pic: string
	}
	shares: any[] // If you know the structure of shares, replace `any` with the appropriate type
	bookmarks: any[] // Same as above
	createdAt: string // ISO date string
	rank: number
	in_percentile: number
	onVoteMeme: () => void
	bookmark?: (id: string, name: string, image_url: string) => void
	activeTab?: 'all' | 'live'
	has_user_voted: boolean
	tags: (string | { name: string })[]
}

export interface TagI {
	_id: string
	count: number
	name: string
	type: 'Seasonal' | 'Event' // You can expand or modify this as needed
	startTime: string // ISO 8601 format date
	endTime: string // ISO 8601 format date
	created_by: string // User ID that created the tag
	__v: number
	createdAt: string // ISO 8601 format date
	updatedAt: string // ISO 8601 format date
}

export default function Page() {
	const router = useRouter()
	const { userDetails } = useContext(Context)
	const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'live'>('daily')
	const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
	const [selectedMeme, setSelectedMeme] = useState<
		LeaderboardMeme | undefined | Meme
	>()

	const [page, setPage] = useState(1)
	const [totalVoteCount, setTotalVoteCount] = useState<number>(0)
	const [totalUploadCount, setTotalUploadCount] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<LeaderboardMeme[]>([])
	const [filterOpen, setFilterOpen] = useState(false)
	const [sortOpen, setSortOpen] = useState(false)
	const [selectedMemeIndex, setSelectedMemeIndex] = useState<number>(0)
	const [finalFilterMeme, setFinalFilterMeme] = useState<LeaderboardMeme[]>([])
	const onClose = () => {
		setIsMemeDetailOpen(false)
		setSelectedMeme(undefined)
	}
	const memeContainerRef = useRef<HTMLDivElement>(null)
	const { openAuthModal } = useAuthModal()

	const {
		percentage,
		setPercentage,
		selectedTags,
		tagInput,
		dateRange,
		setDateRange,
		sortCriteria,
		filteredMemes,
		filteredTags,
		handleTagInputChange,
		handleTagClick,
		handleTagRemove,
		handleSort,
		handleResetSort,
		resetFilters,
	} = useFilterAndSort(memes, activeTab)

	const getMyMemes = async () => {
		try {
			setLoading(true)
			const offset = 30 * page
			const daily = activeTab === 'daily'
			const response = await axiosInstance.get(
				`/api/leaderboard?daily=${daily}&offset=${offset}`
			)

			if (response.data.memes) {
				setTotalVoteCount(response.data.totalVotes)
				setTotalUploadCount(response.data.totalUpload)
				setMemes(response.data.memes)
			}
		} catch (error) {
			console.log(error)
			setTotalVoteCount(0)
			setTotalUploadCount(0)
			setMemes([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		setTotalVoteCount(0)
		setTotalUploadCount(0)
		setMemes([])
		resetFilters() // Reset filters when page, tab, or user changes
		getMyMemes()
	}, [ page, activeTab])

	const applyFilters = () => {
		setPage(1)
		getMyMemes()
		setFilterOpen(false)
	}

	const handleTabChange = (tab: string) => {
		setMemes([])
		setActiveTab(tab.toLowerCase() as 'live' | 'all' | 'daily')
	}

	const handleNext = () => {
		const currentData = finalFilterMeme
		if (selectedMemeIndex < currentData.length - 1) {
			const nextIndex = selectedMemeIndex + 1
			setSelectedMemeIndex(nextIndex)
			console.log(currentData[nextIndex])
			setSelectedMeme(currentData[nextIndex])
		}
	}

	const handlePrev = () => {
		const currentData = finalFilterMeme
		if (selectedMemeIndex > 0) {
			const prevIndex = selectedMemeIndex - 1
			setSelectedMemeIndex(prevIndex)
			console.log(currentData[prevIndex])
			setSelectedMeme(currentData[prevIndex])
		}
	}

	useEffect(() => {
		setFinalFilterMeme(filteredMemes)
	}, [filteredMemes])

	const handleVote = async (meme_id: string) => {
		try {
			if (userDetails) {
				setFinalFilterMeme(prev =>
					prev.map(meme =>
						meme._id == meme_id
							? {
									...meme,
									vote_count: meme.vote_count + 1,
									has_user_voted: true,
							  }
							: meme
					)
				)
				const response = await axiosInstance.post('/api/vote', {
					vote_to: meme_id,
					vote_by: userDetails._id,
				})
				if (response.status == 201) {
					toast.success('Voted successfully!')
				}
			}else{
				if(openAuthModal) openAuthModal();
			}
		} catch (err) {
			console.log('error: ', err)
			toast.error('Error voting meme')
		}
	}

	useEffect(() => {
		if (memeContainerRef.current) {
			memeContainerRef.current.style.overflow = isMemeDetailOpen
				? 'hidden'
				: 'auto'
		}
		document.body.style.overflow = isMemeDetailOpen ? 'hidden' : 'auto'
	}, [isMemeDetailOpen])

	return (
		<div className="flex flex-col md:max-w-[56.25rem] lg:max-w-[87.5rem] px-3 md:mx-auto md:p-8">
			<div className="flex flex-wrap md:flex-nowrap items-center justify-between">
				<div className="flex gap-1 md:gap-3 items-center justify-center w-1/2 md:w-auto">
					<h4 className="text-lg md:text-4xl">Total Votes -</h4>
					<span className="text-xl md:text-4xl">{totalVoteCount}</span>
				</div>
				<div className="flex gap-1 md:gap-3 items-center justify-center w-1/2 md:w-auto">
					<h4 className="text-lg md:text-4xl">Total Uploads -</h4>
					<span className="text-xl md:text-4xl">{totalUploadCount}</span>
				</div>
				<div className="flex gap-1 md:gap-3 items-center justify-center w-full md:w-auto mt-2 md:mt-0">
					<h4 className="text-lg md:text-4xl">Average Votes -</h4>
					<span className="text-xl md:text-4xl">
						{totalVoteCount === 0 || totalUploadCount === 0
							? '0'
							: Math.round(totalVoteCount / totalUploadCount)}
					</span>
				</div>
			</div>

			<div className="flex justify-between items-center gap-x-2 my-3 md:my-4">
				<div className="flex space-x-1 md:space-x-8">
					<FilterPopover
						activeTab={activeTab}
						filterOpen={filterOpen}
						setFilterOpen={setFilterOpen}
						percentage={percentage}
						setPercentage={setPercentage}
						selectedTags={selectedTags}
						tagInput={tagInput}
						dateRange={dateRange}
						setDateRange={setDateRange}
						filteredTags={filteredTags}
						handleTagInputChange={handleTagInputChange}
						handleTagClick={handleTagClick}
						handleTagRemove={handleTagRemove}
						resetFilters={resetFilters}
						applyFilters={applyFilters}
					/>
					<SortPopover
						activeTab={activeTab}
						sortOpen={sortOpen}
						setSortOpen={setSortOpen}
						sortCriteria={sortCriteria}
						handleSort={handleSort}
						handleResetSort={handleResetSort}
					/>
				</div>
				<div className="flex space-x-1 md:space-x-4">
					<button
						onClick={() => router.push('/home/profile')}
						className="font-medium text-[#1783fb] text-base md:text-2xl text-nowrap border-2 border-[#1783fb] rounded-md px-1 md:px-5 md:py-1"
					>
						My Uploads
					</button>
					<button
						onClick={() => router.push('/home/myVotes')}
						className="font-medium text-[#1783fb] text-base md:text-2xl text-nowrap border-2 border-[#1783fb] rounded-md px-1 md:px-5 md:py-1"
					>
						My Votes
					</button>
				</div>
			</div>

			<div className="flex items-center text-center gap-x-10 border-2 border-white rounded-10px px-3 py-2 mt-5 md:mt-0 mb-8 w-fit text-nowrap mx-auto">
				<TabButton
					classname="!px-8 md:!px-14"
					isActive={activeTab === 'daily'}
					label="Daily"
					onClick={() => handleTabChange('Daily')}
				/>
				<TabButton
					classname="!px-4 md:!px-9"
					isActive={activeTab === 'all'}
					label="All-Time"
					onClick={() => handleTabChange('All')}
				/>
			</div>

			<div
				className="grid grid-cols-1 md:grid-cols-3 md:gap-8"
				ref={memeContainerRef}
			>
				{/* For mobile */}
				<div className="md:hidden w-full flex flex-col items-center justify-center">
					{finalFilterMeme.map((item, index) => (
						<div key={index} className="w-full max-w-sm">
							<LeaderboardMemeCard
								meme={item}
								onOpenMeme={() => {
									setSelectedMeme({
										...item,
										tags: item.tags.map((tag) => 
											typeof tag === 'string' ? { name: tag } : tag
										)
									})
									setIsMemeDetailOpen(true)
								}}
								activeTab={activeTab}
								voteMeme={meme_id => handleVote(meme_id)}
							/>
						</div>
					))}
				</div>

				{finalFilterMeme.map((item, index) => (
					<div key={index} className="hidden md:block">
						<LeaderboardMemeCard
							meme={item}
							onOpenMeme={() => {
								setSelectedMeme({
									...item,
									tags: item.tags.map((tag) => 
										typeof tag === 'string' ? { name: tag } : tag
									)
								})
								setIsMemeDetailOpen(true)
								setSelectedMemeIndex(index)
							}}
							voteMeme={meme_id => handleVote(meme_id)}
						/>
					</div>
				))}
				<div className="col-span-1 md:col-span-3">
					{loading && (
						<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
					)}
					{!loading && finalFilterMeme.length === 0 && (
						<p className="text-center text-nowrap text-2xl mx-auto">
							Content not found
						</p>
					)}
				</div>
			</div>
			{/* Meme Detail Modal */}
			{isMemeDetailOpen && selectedMeme && (
				<MemeDetail
					onClose={onClose}
					meme={selectedMeme}
					tab={activeTab}
					onNext={handleNext}
					onPrev={handlePrev}
					onVoteMeme={meme_id => handleVote(meme_id)}
					bmk={false}
					searchRelatedMemes={() => {}}
					onRelatedMemeClick={(meme) => setSelectedMeme(meme)}
				/>
			)}
		</div>
	)
}

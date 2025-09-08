'use client'

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MdEdit } from 'react-icons/md'
import { FilterPopover } from '@/components/FilterPopover'
import { SortPopover } from '@/components/SortPopover'
import EditProfile from '@/components/EditProfile'
import { Context } from '@/context/contextProvider'
import { useFilterAndSort } from '@/hooks/useFilterAndSort'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { TabButton } from '@/components/TabButton'
import { LeaderboardMeme } from '../leaderboard/page'
import { ethers } from 'ethers'
import { LeaderboardMemeCard } from '../leaderboard/MemeCard'
import MemeDetail from '@/components/MemeDetail'
import { toast } from 'react-toastify'
import { Meme } from '../page'
import {  useRouter } from 'next/navigation'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

interface Data {
	title: string
	tags: string[]
	file: File | null
	bio: string
	interests: { name: string; tags: string[] }[]
}

// Draft Meme interface based on the API documentation
interface DraftMeme {
	_id: string
	name: string
	image_url: string
	raw_tags: string[]
	created_by: {
		_id: string
		username: string
		profile_pic: string
	}
	is_published: boolean
	draft_data: any
	createdAt: string
	updatedAt: string
}

export default function Page() {
	const [isClicked, setIsClicked] = useState(false);
	const [editProfileOpen, setEditProfileOpen] = useState(false)
	const [formData, setFormData] = useState<Data>({
		title: '',
		tags: [],
		file: null,
		bio: '',
		interests: [],
	})
	const [page, setPage] = useState(1)
	// const [totalMemeCount, setTotalMemeCount] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<LeaderboardMeme[]>([])
	const [draftMemes, setDraftMemes] = useState<DraftMeme[]>([])
	const [activeTab, setActiveTab] = useState<'all' | 'generations'>('all')
	const [filterOpen, setFilterOpen] = useState(false)
	const [sortOpen, setSortOpen] = useState(false)
	const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
	const [selectedMeme, setSelectedMeme] = useState<
		LeaderboardMeme | undefined | Meme
	>()
	const [selectedMemeIndex, setSelectedMemeIndex] = useState<number>(0)
	const [userData, setUserData] = useState<any>()
	const scrollComp = useRef<HTMLDivElement>(null)
	const { userDetails } = useContext(Context)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Tab-based filtering (primary)
	const tabFilteredMemes = useMemo(() => {
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0) // Start of today in UTC
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000) // Start of yesterday
		yesterday.setUTCHours(0, 0, 0, 0)
		// else if (activeTab === "daily") {
		//   // Memes from yesterday (00:00 to 23:59 UTC)
		//   return memes.filter((meme) => {
		//     const createdAt = new Date(meme.createdAt);
		//     return (
		//       createdAt >= yesterday &&
		//       createdAt < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
		//     );
		//   });
		// }
		// All-time tab: no date filtering
		// Always sort by createdAt descending
		return [...memes].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	}, [memes, activeTab])

	// Convert DraftMeme to LeaderboardMeme format for compatibility with existing components
	const convertDraftToLeaderboard = (draft: DraftMeme): LeaderboardMeme => {
		return {
			_id: draft._id,
			vote_count: 0, // Drafts don't have votes
			name: draft.name || 'Untitled Draft',
			image_url: draft.image_url || '',
			created_by: draft.created_by,
			shares: [], // Drafts don't have shares
			bookmarks: [], // Drafts don't have bookmarks
			createdAt: draft.createdAt,
			rank: 0, // Drafts don't have ranks
			in_percentile: 0, // Drafts don't have percentiles
			onVoteMeme: () => {},
			has_user_voted: false, // Drafts can't be voted on
			tags: draft.raw_tags.map(tag => ({ name: tag })), // Convert raw_tags to tag objects
			bookmark_count: 0,
		}
	}

	// Get the appropriate data based on active tab
	const displayMemes = useMemo(() => {
		if (activeTab === 'generations') {
			// Sort drafts by createdAt descending
			return [...draftMemes]
				.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				.map(convertDraftToLeaderboard)
		}
		return tabFilteredMemes
	}, [activeTab, draftMemes, tabFilteredMemes])

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
	} = useFilterAndSort(displayMemes, activeTab as 'live' | 'all')

	const offset = 30

	const getMyMemes = async () => {
		try {
			if (!userDetails?._id) throw new Error('User not found')
			setLoading(true)
			const offsetI = offset * (page - 1) // Fixed offset calculation
			const response = await axiosInstance.get(
				`/api/meme?created_by=${userDetails._id}&offset=${offsetI}`
			)

			if (response.data.memes) {
				// setTotalMemeCount(response.data.memesCount)
				setMemes(response.data.memes)
			}
		} catch (error) {
			console.log(error)
			// setTotalMemeCount(0)
			setMemes([])
		} finally {
			setLoading(false)
		}
	}

	const getDraftMemes = async () => {
		try {
			setLoading(true)
			const offsetI = offset * (page - 1)
			const response = await axiosInstance.get(
				`/api/draft-meme?offset=${offsetI}`
			)

			if (response.data.drafts) {
				setDraftMemes(response.data.drafts)
			}
		} catch (error) {
			console.log('Error fetching draft content:', error)
			setDraftMemes([])
			toast.error('Failed to fetch draft contents')
		} finally {
			setLoading(false)
		}
	}

	const getUserProfile = async () => {
		try {
			const response = await axiosInstance.get(`/api/user/${userDetails?._id}`)

			if (response.data.user) {
				const userData = {
					...response.data.user,
					followersCount: response.data.followersCount,
					followingCount: response.data.followingCount,
					totalUploadsCount: response.data.totalUploadsCount,
					totalVotesReceived: response.data.totalVotesReceived,
					majorityUploads: response.data.majorityUploads,
				}

				setUserData(userData)
			}
		} catch (error: any) {
			console.log(error)
			if (error.response?.status === 404) {
				toast.error('User not found')
			} else {
				toast.error('Failed to load user profile')
			}
		}
	}

	useEffect(() => {
		// setTotalMemeCount(0)
		setMemes([])
		setDraftMemes([])
		resetFilters() // Reset filters on tab/page/user change

		if (activeTab === 'generations') {
			getDraftMemes()
		} else {
			getMyMemes()
		}
		getUserProfile()
	}, [userDetails, page])

	const onCancel = () => {
		setEditProfileOpen(false)
		setFormData({
			title: '',
			tags: [],
			file: null,
			bio: '',
			interests: [],
		})
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const applyFilters = () => {
		setPage(1)
		if (activeTab === 'generations') {
			getDraftMemes()
		} else {
			getMyMemes()
		}
		setFilterOpen(false)
	}

	const handleTabChange = (tab: string) => {
		setMemes([])
		setDraftMemes([])
		const newTab = tab.toLowerCase() as 'all' | 'generations'
		setActiveTab(newTab)
		if (newTab === 'generations') {
			getDraftMemes()
		} else {
			getMyMemes()
		}
	}

	const onClose = () => {
		setIsMemeDetailOpen(false)
		setSelectedMeme(undefined)
	}

	const handleVote = async (meme_id: string) => {
		try {
			if (userDetails) {
				setMemes(prev =>
					prev.map(meme =>
						meme._id === meme_id
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
				if (response.status === 201) {
					toast.success('Voted successfully!')
				}
			}
		} catch (err) {
			console.log('error: ', err)
			toast.error('Error voting meme')
		}
	}

	const handleNext = () => {
		const currentData = filteredMemes
		if (selectedMemeIndex < currentData.length - 1) {
			const nextIndex = selectedMemeIndex + 1
			setSelectedMemeIndex(nextIndex)
			setSelectedMeme(currentData[nextIndex])
		}
	}

	const handlePrev = () => {
		const currentData = filteredMemes
		if (selectedMemeIndex > 0) {
			const prevIndex = selectedMemeIndex - 1
			setSelectedMemeIndex(prevIndex)
			setSelectedMeme(currentData[prevIndex])
		}
	}

	// Handle draft-specific actions
	const handleDeleteDraft = async (draftId: string) => {
		try {
			await axiosInstance.delete(`/api/draft-meme?id=${draftId}`)
			setDraftMemes(prev => prev.filter(draft => draft._id !== draftId))
			toast.success('Draft deleted successfully!')
		} catch (error) {
			console.log('Error deleting draft:', error)
			toast.error('Failed to delete draft')
		}
	}

	const handlePublishDraft = async (draftId: string) => {
		try {
			const response = await axiosInstance.post('/api/draft-meme/publish', {
				id: draftId,
			})
			if (response.status === 200) {
				// Remove from drafts and refresh the memes list
				setDraftMemes(prev => prev.filter(draft => draft._id !== draftId))
				toast.success('Draft published successfully!')
				// Optionally switch to 'all' tab to show the published meme
				// setActiveTab('all')
			}
		} catch (error) {
			console.log('Error publishing draft:', error)
			toast.error('Failed to publish draft')
		}
	}

	useEffect(() => {
		document.body.style.overflow = isMemeDetailOpen ? 'hidden' : 'auto'
		if (scrollComp.current)
			scrollComp.current.style = isMemeDetailOpen ? 'hidden' : 'auto'
	}, [isMemeDetailOpen])

	const router: AppRouterInstance = useRouter()
	return (
		<div className="md:max-w-7xl md:mx-auto mx-4">
			{/* Top Section */}
			<div className="flex items-center justify-between pb-4 md:pb-6">
				<div className="flex items-center space-x-2 md:space-x-4 rounded-lg">
					<div className="h-20 w-20 md:h-44 md:w-44 bg-black rounded-full overflow-hidden flex items-center justify-center">
						<img
							src={
								userDetails?.profile_pic
									? userDetails?.profile_pic
									: '/assets/meme1.jpeg'
							}
							alt="Profile"
							className="w-full h-full object-cover"
						/>
					</div>
					<div>
						<p className="text-[#29e0ca] text-base  md:text-2xl hidden">
							Level Coming Soon
						</p>
						<p className="text-white text-lg md:text-4xl font-bold">Welcome</p>
						<h1 className="text-[#29e0ca] text-2xl md:text-6xl font-bold">
							{userDetails?.username}
						</h1>
						<div className="flex flex-row items-center justify-start gap-2 text-lg">
							<button className='flex justify-between items-center gap-2 px-1 md:px-3 md:py-1 border border-[#1783fb] rounded-lg hover:opacity-40'
							onClick={() => router.push(`/home/community`)}
							>
							<div>{userData?.followersCount || 0} followers</div>
							</button>
							<button className='flex justify-between items-center gap-2 px-1 md:px-3 md:py-1 border border-[#1783fb] rounded-lg hover:opacity-40'
							onClick={() => router.push(`/home/community`)}>
							<div>{userData?.followingCount || 0} following</div>
							</button>
						</div>
					</div>
				</div>
				<div className="flex flex-col items-end md:flex-row space-y-2 md:space-x-16">
					<button
						onClick={() => setEditProfileOpen(true)}
						className="flex justify-between items-center gap-2 px-1 md:px-3 md:py-1 border border-[#1783fb] rounded-lg hover:opacity-40"
					>
						<MdEdit className="w-4 h-4 md:w-9 md:h-9" fill="#1783fb" />
						<p className="text-[#1783fb] text-lg md:text-4xl text-nowrap font-bold">
							Edit Profile
						</p>
					</button>
				</div>
			</div>

			{/* Stats Section */}
			<div className="flex flex-col md:flex-row gap-10 mt-3">
				<div className="md:flex-1 py-3 border-[.1875rem] border-[#1783fb] rounded-xl">
					<p className="text-[28px] h-16 md:h-8 leading-none px-4">
						{userDetails?.bio}
					</p>
				</div>
				<div className="flex justify-between gap-x-6 md:gap-x-0 flex-row md:flex-col">
					<div className="votescast_majorityvotes_uploads_majorityuploads_mobile_wrapper flex-1 md:hidden space-y-2 md:space-y-0">
						<div className="flex justify-between items-center gap-x-2 ">
							<p className="text-lg text-[#1783FB]">Votes Cast</p>
							<p className="text-lg">{userDetails?.totalCastedVotesCount}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Majority Votes</p>
							<p className="text-lg">{userDetails?.majorityVotes}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Uploads</p>
							<p className="text-lg">{userDetails?.totalUploadsCount}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Majority Uploads</p>
							<p className="text-lg">{userDetails?.majorityUploads}</p>
						</div>
					</div>
					<div className="md:!w-[200px] flex flex-col md:justify-between gap-y-4">
						<div className="order-2 md:order-1 flex flex-col md:gap-2 md:px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl">
							<p className="text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center">
								eART Minted
							</p>
							<p className="text-2xl md:text-[30px] md:h-8 text-center">
								{userDetails?.mintedCoins
									? ethers.formatEther(userDetails.mintedCoins)
									: 0}
							</p>
						</div>
						<div className="order-1 md:order-2 flex flex-col md:gap-2 px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl">
							<p className="text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center">
								Votes Received
							</p>
							<p className="text-2xl md:text-[30px] md:h-8 text-center">
								{userDetails?.totalVotesReceived}
							</p>
						</div>
					</div>
				</div>
				<div className="w-[200px] px-2 py-4 border-[.1875rem] border-[#1783fb] rounded-xl hidden md:flex flex-col justify-between">
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Votes Cast
						</p>
						<p className="text-[30px] h-8 text-center">
							{userDetails?.totalCastedVotesCount}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Majority Votes
						</p>
						<p className="text-[30px] h-8 text-center">
							{userDetails?.majorityVotes}
						</p>
					</div>
				</div>
				<div className="w-[200px] px-2 py-4 border-[.1875rem] border-[#1783fb] rounded-xl hidden md:flex flex-col justify-between">
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Uploads
						</p>
						<p className="text-[30px] h-8 text-center">
							{userDetails?.totalUploadsCount}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Majority Uploads
						</p>
						<p className="text-[30px] h-8 text-center">
							{userDetails?.majorityUploads}
						</p>
					</div>
				</div>
			</div>

			{/* Gallery Section */}
			<div className="mt-16 md:mt-12">
				<div className="flex items-center justify-between">
					<div className="flex space-x-2.5 md:space-x-5">
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
					<div className="space-x-2.5 md:space-x-5 flex justify-center">
					<button 
 onClick={() => {
   setIsClicked(true);
   router.push('/home/bookmark');
 }}
 className={`
   ${isClicked ? 'bg-white text-black' : 'bg-[#0d3159] text-white'}
   text-base text-center md:text-xl font-medium md:py-1 rounded-[9px] w-14
   transition-all duration-300 flex items-center justify-center cursor-pointer
 `}
>
 Saved
</button>
			
						<TabButton
							classname="!text-base md:!text-xl !px-2 md:!px-5 !rounded-md md:!rounded-10px"
							isActive={activeTab === 'generations'}
							label="Drafts"
							onClick={() => handleTabChange('generations')}
						/>
						<TabButton
							classname="!text-base md:!text-xl !px-2 md:!px-5 !rounded-md md:!rounded-10px"
							isActive={activeTab === 'all'}
							label="All-Time"
							onClick={() => handleTabChange('all')}
						/>
					</div>
				</div>
				<div>
					<h2 className="text-[#29e0ca] text-xl md:text-4xl font-medium text-center mt-8 md:my-2">
						{activeTab === 'generations' ? 'Your Draft Memes' : 'Your Uploads'}
					</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-16 mt-3 md:mt-6">
					{/* For mobile */}
					<div
						className="md:hidden w-full flex flex-col items-center justify-center"
						ref={scrollComp}
					>
						{filteredMemes.map((item, index) => (
							<div key={index} className="w-full max-w-sm">
								{activeTab === 'generations' ? (
									<DraftMemeCard
										draft={draftMemes.find(d => d._id === item._id)}
										onDeleteDraft={handleDeleteDraft}
										onPublishDraft={handlePublishDraft}
										onOpenMeme={() => {
											setSelectedMeme(item)
											setIsMemeDetailOpen(true)
											setSelectedMemeIndex(index)
										}}
									/>
								) : (
									<LeaderboardMemeCard
										meme={item}
										onOpenMeme={() => {
											setSelectedMeme(item)
											setIsMemeDetailOpen(true)
											setSelectedMemeIndex(index)
										}}
										activeTab={activeTab}
										voteMeme={meme_id => handleVote(meme_id)}
									/>
								)}
							</div>
						))}
					</div>

					{/* For desktop */}
					{filteredMemes.map((item, index) => (
						<div key={index} className="hidden md:block">
							{activeTab === 'generations' ? (
								<DraftMemeCard
									draft={draftMemes.find(d => d._id === item._id)}
									onDeleteDraft={handleDeleteDraft}
									onPublishDraft={handlePublishDraft}
									onOpenMeme={() => {
										setSelectedMeme(item)
										setIsMemeDetailOpen(true)
										setSelectedMemeIndex(index)
									}}
								/>
							) : (
								<LeaderboardMemeCard
									meme={item}
									onOpenMeme={() => {
										setSelectedMeme(item)
										setIsMemeDetailOpen(true)
										setSelectedMemeIndex(index)
									}}
									voteMeme={meme_id => handleVote(meme_id)}
								/>
							)}
						</div>
					))}

					<div className="col-span-full">
						{loading && (
							<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
						)}
						{!loading && filteredMemes.length === 0 && (
							<p className="text-center text-nowrap text-lg md:text-2xl mx-auto">
								{activeTab === 'generations'
									? 'No draft Content found'
									: 'Contents not found'}
							</p>
						)}
					</div>
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
					onRelatedMemeClick={meme => setSelectedMeme(meme)}
					searchRelatedMemes={() => {}}
				/>
			)}

			{editProfileOpen && (
				<EditProfile
					onCancel={onCancel}
					formData={formData}
					setFormData={setFormData}
				/>
			)}
		</div>
	)
}

// Draft Meme Card Component
interface DraftMemeCardProps {
	draft: DraftMeme | undefined
	onDeleteDraft: (draftId: string) => void
	onPublishDraft: (draftId: string) => void
	onOpenMeme: () => void
}

const DraftMemeCard: React.FC<DraftMemeCardProps> = ({
	draft,
	onDeleteDraft,
	onPublishDraft,
	onOpenMeme,
}) => {
	const [showActions, setShowActions] = useState(false)

	// If draft is undefined, show a loading placeholder
	if (!draft) {
		return (
			<div className="p-4 md:p-4 w-full lg:mx-auto">
				<div className="flex flex-col md:flex-row gap-x-1">
					<div className="flex flex-col">
						<div className="image_wrapper w-full h-full sm:w-[16.875rem] sm:h-[16.875rem] md:w-[16rem] md:h-[16.875rem] lg:w-[15.625rem] lg:h-[15.625rem] xl:w-[23rem] xl:h-[23rem] object-cover border-2 border-white relative">
							<div className="w-full h-full bg-gray-800 flex items-center justify-center">
								<span className="text-gray-400 text-center">Loading...</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 md:p-4 w-full lg:mx-auto">
			<div className="flex flex-col md:flex-row gap-x-1">
				<div className="flex flex-col">
					<div className="username_rank_wrapper flex justify-between items-center md:mb-1">
						<div className="flex items-center gap-x-1">
							<span className="text-[#29e0ca] text-base md:text-2xl">
								Draft
							</span>
						</div>
						<div className="flex items-center gap-x-2"></div>
					</div>
					<div className="image_wrapper w-full h-full sm:w-[16.875rem] sm:h-[16.875rem] md:w-[16rem] md:h-[16.875rem] lg:w-[15.625rem] lg:h-[15.625rem] xl:w-[23rem] xl:h-[23rem] object-cover border-2 border-white relative">
						{draft.image_url ? (
							<img
								onClick={onOpenMeme}
								src={draft.image_url}
								alt={draft.name || 'Draft meme'}
								className="w-full h-full cursor-pointer object-cover"
							/>
						) : (
							<div
								onClick={onOpenMeme}
								className="w-full h-full cursor-pointer bg-gray-800 flex items-center justify-center"
							>
								<span className="text-gray-400 text-center">No Image</span>
							</div>
						)}
						{/* Draft overlay */}
						<div className="absolute top-2 right-2 bg-[#29e0ca] text-black px-2 py-1 rounded text-xs font-bold">
							DRAFT
						</div>
					</div>
					<div className="title_wrapper flex justify-between text-lg leading-tight md:text-xl max-w-full">
						<p>
							{(draft.name || 'Untitled Draft').length > 30
								? (draft.name || 'Untitled Draft').slice(0, 30) + '...'
								: draft.name || 'Untitled Draft'}
						</p>
					</div>

					{/* Draft Actions */}
					<div className="mt-2 flex flex-col gap-2">
						<button
							onClick={() => setShowActions(!showActions)}
							className="text-[#1783fb] text-sm underline"
						>
							{showActions ? 'Hide Actions' : 'Show Actions'}
						</button>

						{showActions && (
							<div className="flex gap-2">
								<button
									onClick={() => onPublishDraft(draft._id)}
									className="bg-[#29e0ca] text-black px-3 py-1 rounded text-sm font-bold hover:opacity-80"
								>
									Publish
								</button>
								<button
									onClick={() => onDeleteDraft(draft._id)}
									className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold hover:opacity-80"
								>
									Delete
								</button>
							</div>
						)}

						{/* Tags display */}
						{draft.raw_tags && draft.raw_tags.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-1">
								{draft.raw_tags.slice(0, 3).map((tag, index) => (
									<span
										key={index}
										className="bg-[#1783fb] text-white px-2 py-1 rounded text-xs"
									>
										{tag}
									</span>
								))}
								{draft.raw_tags.length > 3 && (
									<span className="text-[#666] text-xs">
										+{draft.raw_tags.length - 3} more
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

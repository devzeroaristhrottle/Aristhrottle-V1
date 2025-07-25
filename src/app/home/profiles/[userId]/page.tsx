'use client'

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FilterPopover } from '@/components/FilterPopover'
import { SortPopover } from '@/components/SortPopover'
import { Context } from '@/context/contextProvider'
import { useFilterAndSort } from '@/hooks/useFilterAndSort'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { TabButton } from '@/components/TabButton'
import { LeaderboardMeme } from '../../leaderboard/page'
import { ethers } from 'ethers'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { LeaderboardMemeCard } from '../../leaderboard/MemeCard'
import { useAuthModal, useUser } from '@account-kit/react'
import MemeDetail from '@/components/MemeDetail'
import Share from '@/components/Share'
import { BiPlus } from 'react-icons/bi'
import { Meme } from '../../page'

interface UserProfileData {
	_id: string
	username: string
	bio: string
	profile_pic?: string
	user_wallet_address: string
	totalCastedVotesCount?: number
	majorityVotes?: number
	totalUploadsCount?: number
	majorityUploads?: number
	totalVotesReceived?: number
	mintedCoins?: string
	followersCount?: number
	followingCount?: number
}

export default function UserProfilePage() {
	const params = useParams()
	const router = useRouter()
	const userId = params.userId as string
	
	const scrollComp = useRef<HTMLDivElement>(null);
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState<boolean>(false)
	const [profileLoading, setProfileLoading] = useState<boolean>(true)
	const [memes, setMemes] = useState<LeaderboardMeme[]>([])
	const [activeTab, setActiveTab] = useState<'live' | 'all'>('all')
	const [filterOpen, setFilterOpen] = useState(false)
	const [sortOpen, setSortOpen] = useState(false)
	const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
	const [isFollowing, setIsFollowing] = useState<boolean>(false)
	const [followLoading, setFollowLoading] = useState<boolean>(false)
	const [selectedMeme, setSelectedMeme] = useState<LeaderboardMeme | null | Meme>(null)
	const [selectedMemeIndex, setSelectedMemeIndex] = useState<number>(-1)
	const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{ id: string; imageUrl: string } | null>(null)

	const { userDetails, setUserDetails } = useContext(Context)
	const { openAuthModal } = useAuthModal()
	const user = useUser()
	// Tab-based filtering (primary)
	const tabFilteredMemes = useMemo(() => {
		const today = new Date()
		today.setUTCHours(0, 0, 0, 0) // Start of today in UTC

		if (activeTab === 'live') {
			// Memes from today (00:00 to 23:59 UTC)
			return memes.filter(meme => {
				const createdAt = new Date(meme.createdAt)
				return (
					createdAt >= today &&
					createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
				)
			})
		}
		// All-time tab: no date filtering
		return memes
	}, [memes, activeTab])

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
	} = useFilterAndSort(tabFilteredMemes, activeTab)

	const offset = 30

	const getUserProfile = async () => {
		try {
			setProfileLoading(true)
			const response = await axiosInstance.get(`/api/user/${userId}`)
			
			if (response.data.user) {
				const userData = {
					...response.data.user,
					followersCount: response.data.followersCount,
					followingCount: response.data.followingCount,
					totalUploadsCount: response.data.totalUploadsCount,
					totalVotesReceived: response.data.totalVotesReceived,
					majorityUploads: response.data.majorityUploads,
				}
				setUserProfile(userData)
			}
		} catch (error: any) {
			console.log(error)
			if (error.response?.status === 404) {
				toast.error('User not found')
				router.push('/landing')
			} else {
				toast.error('Failed to load user profile')
			}
		} finally {
			setProfileLoading(false)
		}
	}

	const getUserMemes = async () => {
		try {
			const response = await axiosInstance.get(
				`/api/meme?created_by=${userId}&offset=${offset}`
			)
			const now = new Date();
			now.setUTCHours(0, 0, 0);
			const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			if (response.data.memes) {
				const processMeme = response.data.memes.sort((a: LeaderboardMeme, b:LeaderboardMeme) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((a: LeaderboardMeme) => {
					const memeCreatedAt = new Date(a.createdAt);
					if(memeCreatedAt > twentyFourHoursAgo){
						return {...a, vote_count: null}
					}
					return a
				})

				setMemes(processMeme)
			}
		} catch (error) {
			console.log(error)
			setMemes([])
		} finally {
			setLoading(false)
		}
	}

	const checkFollowStatus = async () => {
		try {
			if (!userDetails?._id) return
			const response = await axiosInstance.get(
				`/api/user/follow?userId=${userDetails._id}&type=following`
			)
			
			if (response.data.users) {
				const followingIds = response.data.users.map((user: any) => user._id)
				setIsFollowing(followingIds.includes(userId))
			}
		} catch (error) {
			console.log('Error checking follow status:', error)
		}
	}

	const handleFollow = async () => {
		try {
			if (!userDetails?._id) {
				toast.error('Please login to follow users')
				return
			}

			setFollowLoading(true)
			
			if (isFollowing) {
				// Unfollow
				await axiosInstance.delete(`/api/user/follow?userId=${userId}`)
				setIsFollowing(false)
				toast.success('User unfollowed successfully')
				// Update follower count
				setUserProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) - 1 } : null)
			} else {
				// Follow
				await axiosInstance.post('/api/user/follow', { userIdToFollow: userId })
				setIsFollowing(true)
				toast.success('User followed successfully')
				// Update follower count
				setUserProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null)
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || 'An error occurred'
			toast.error(errorMessage)
		} finally {
			setFollowLoading(false)
		}
	}

	const handleCloseShare = () => {
		setIsShareOpen(false)
		setShareData(null)
	}

	const voteToMeme = async (vote_to: string) => {
		if (!userDetails && openAuthModal) openAuthModal()
		try {
			if (user && user.address) {
				if (userDetails) {
					setUserDetails({
						...userDetails,
						votes: userDetails.votes + 1,
					})
				}
				const response = await axiosInstance.post('/api/vote', {
					vote_to: vote_to,
					vote_by: userDetails?._id,
				})
				if (response.status === 201) {
					toast.success('Vote casted successfully!')
					getUserMemes()
				}
			}
		} catch (error: any) {
			if (userDetails) {
				setUserDetails({
					...userDetails,
					votes: userDetails.votes,
				})
			}
			if (error.response?.data?.message === "You cannot vote on your own content") {
				toast.error(error.response.data.message);
			} else {
				toast.error("Already voted to this content");
			}
		}
	}

	useEffect(() => {
		if (userId) {
			getUserProfile()
			setMemes([])
			resetFilters()
			getUserMemes()
			checkFollowStatus()
		}
	}, [userId])

	useEffect(() => {
		setMemes([])
		resetFilters()
		getUserMemes()
	}, [page, activeTab])

	
	useEffect(() => {
		document.body.style.overflow = isMemeDetailOpen ? "hidden" : "auto"
		if(scrollComp.current) scrollComp.current.style = isMemeDetailOpen ? "hidden" : "auto"
	}, [isMemeDetailOpen])

	const applyFilters = () => {
		setPage(1)
		getUserMemes()
		setFilterOpen(false)
	}

	const handleTabChange = (tab: string) => {
		setMemes([])
		setActiveTab(tab.toLowerCase() as 'live' | 'all')
	}

	if (profileLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#1783fb]" />
			</div>
		)
	}

	if (!userProfile) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<p className="text-center text-lg md:text-2xl text-gray-400">
					User not found
				</p>
			</div>
		)
	}

	const isOwnProfile = userDetails?._id === userId

	return (
		<div className="md:max-w-7xl md:mx-auto mx-4">
			{/* Top Section */}
			<div className="flex items-center justify-between pb-4 md:pb-6">
				<div className="flex items-center space-x-2 md:space-x-4 rounded-lg">
					<div className="h-20 w-20 md:h-44 md:w-44 bg-black rounded-full overflow-hidden flex items-center justify-center">
						<img
							src={
								userProfile?.profile_pic
									? userProfile?.profile_pic
									: '/assets/meme1.jpeg'
							}
							alt="Profile"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className='flex flex-col gap-2'>
						<p className="text-white text-lg md:text-4xl font-bold">
							{isOwnProfile ? 'Welcome' : 'Profile'}
						</p>
						<h1 className="text-[#29e0ca] text-2xl md:text-6xl font-bold">
							{userProfile?.username}
						</h1>
						<div className='flex flex-row items-center justify-start gap-2 text-lg'>
							{!isOwnProfile && userDetails && (
								<div>
									<button
										onClick={handleFollow}
										disabled={followLoading}
										className={`flex justify-between items-center gap-2 px-2 rounded-full font-medium transition-colors ${
											isFollowing
												? 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
												: 'border-2 border-[#1783fb] text-[#1783fb] hover:bg-[#1783fb] hover:text-white'
										} ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										{followLoading ? (
											<AiOutlineLoading3Quarters className="animate-spin" />
										) : isFollowing ? (
											'Unfollow'
										) : (
											<>
												<BiPlus />
												Follow
											</>
										)}
									</button>
								</div>
							)}
							<div>{userProfile.followersCount} Followers</div>
							<div>{userProfile.followingCount} Following</div>
						</div>
					</div>
					
				</div>
				
				<div className="flex flex-col items-end space-y-2">
					
					{isOwnProfile && (
						<button
							onClick={() => router.push('/home/profile')}
							className="flex justify-between items-center gap-2 px-2 md:px-4 py-1 md:py-2 border border-[#1783fb] rounded-lg hover:opacity-40"
						>
							<p className="text-[#1783fb] text-sm md:text-lg font-bold">
								Edit Profile
							</p>
						</button>
					)}
				</div>
			</div>

			{/* Stats Section */}
			<div className="flex flex-col md:flex-row gap-10 mt-3">
				<div className="md:flex-1 py-3 border-[.1875rem] border-[#1783fb] rounded-xl">
					<p className="text-[28px] h-fit leading-none px-4">
						{userProfile?.bio || 'No bio available'}
					</p>
				</div>
				<div className="flex justify-between gap-x-6 md:gap-x-0 flex-row md:flex-col">
					<div className="votescast_majorityvotes_uploads_majorityuploads_mobile_wrapper flex-1 md:hidden space-y-2 md:space-y-0">
						<div className="flex justify-between items-center gap-x-2 ">
							<p className="text-lg text-[#1783FB]">Votes Cast</p>
							<p className="text-lg">{userProfile?.totalCastedVotesCount || 0}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Majority Votes</p>
							<p className="text-lg">{userProfile?.majorityVotes || 0}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Uploads</p>
							<p className="text-lg">{userProfile?.totalUploadsCount || 0}</p>
						</div>
						<div className="flex justify-between items-center gap-x-2">
							<p className="text-lg text-[#1783FB]">Majority Uploads</p>
							<p className="text-lg">{userProfile?.majorityUploads || 0}</p>
						</div>
					</div>
					<div className="md:!w-[200px] flex flex-col md:justify-between gap-y-4">
						<div className="order-2 md:order-1 flex flex-col md:gap-2 md:px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl">
							<p className="text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center">
								eART Minted
							</p>
							<p className="text-2xl md:text-[30px] md:h-8 text-center">
								{userProfile?.mintedCoins
									? ethers.formatEther(userProfile.mintedCoins)
									: 0}
							</p>
						</div>
						<div className="order-1 md:order-2 flex flex-col md:gap-2 px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl">
							<p className="text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center">
								Votes Received
							</p>
							<p className="text-2xl md:text-[30px] md:h-8 text-center">
								{userProfile?.totalVotesReceived || 0}
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
							{userProfile?.totalCastedVotesCount || 0}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Majority Votes
						</p>
						<p className="text-[30px] h-8 text-center">
							{userProfile?.majorityVotes || 0}
						</p>
					</div>
				</div>
				<div className="w-[200px] px-2 py-4 border-[.1875rem] border-[#1783fb] rounded-xl hidden md:flex flex-col justify-between">
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Uploads
						</p>
						<p className="text-[30px] h-8 text-center">
							{userProfile?.totalUploadsCount || 0}
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<p className="text-[28px] h-8 text-[#1783FB] text-center">
							Majority Uploads
						</p>
						<p className="text-[30px] h-8 text-center">
							{userProfile?.majorityUploads || 0}
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
						<TabButton
							classname="!text-base md:!text-xl !px-2  md:!px-8 !rounded-md md:!rounded-10px hidden"
							isActive={activeTab === 'live'}
							label="Live"
							onClick={() => handleTabChange('live')}
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
						{isOwnProfile ? 'Your Uploads' : `${userProfile?.username}'s Uploads`}
					</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-16 mt-3 md:mt-6" ref={scrollComp}>
					{filteredMemes.map((item, index) => (
						<LeaderboardMemeCard 
							key={item._id}
							meme={item}
							onOpenMeme={() => {
								setSelectedMeme(item)
								setSelectedMemeIndex(index)
								setIsMemeDetailOpen(true)
							}}
							voteMeme={voteToMeme}
							activeTab={activeTab}
							bmk={false}
						/>
					))}

					<div className="col-span-full">
						{loading && (
							<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
						)}
						{!loading && filteredMemes.length === 0 && (
							<p className="text-center text-nowrap text-lg md:text-2xl mx-auto">
								{isOwnProfile ? 'You have no uploads yet' : `${userProfile?.username} has no uploads yet`}
							</p>
						)}
					</div>

				</div>
			</div>

			{isMemeDetailOpen && selectedMeme && (
				<MemeDetail
					onClose={() => {
						setIsMemeDetailOpen(false)
						setSelectedMeme(null)
						setSelectedMemeIndex(-1)
					}}
					onNext={() => {
						if (selectedMemeIndex < filteredMemes.length - 1) {
							const nextIndex = selectedMemeIndex + 1
							setSelectedMemeIndex(nextIndex)
							setSelectedMeme(filteredMemes[nextIndex])
						}
					}}
					onPrev={() => {
						if (selectedMemeIndex > 0) {
							const prevIndex = selectedMemeIndex - 1
							setSelectedMemeIndex(prevIndex)
							setSelectedMeme(filteredMemes[prevIndex])
						}
					}}
					meme={selectedMeme}
					tab={activeTab}
					onVoteMeme={voteToMeme}
					bmk={false}
					searchRelatedMemes={() => {}}
					onRelatedMemeClick={(meme) => setSelectedMeme(meme)}
				/>
			)}

			{isShareOpen && shareData && (
				<Share
					id={shareData.id}
					imageUrl={shareData.imageUrl}
					onClose={handleCloseShare}
				/>
			)}
		</div>
	)
} 
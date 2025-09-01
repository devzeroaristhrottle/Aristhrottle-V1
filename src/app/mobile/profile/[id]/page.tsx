'use client'

import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { Context } from '@/context/contextProvider'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { TabButton } from '@/components/TabButton'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAuthModal, useUser } from '@account-kit/react'
import { BiPlus } from 'react-icons/bi'
import { UserProfileData, Meme } from '@/mobile_components/types'
import MemesList from '@/mobile_components/MemesList'

export default function UserProfilePage() {
	const params = useParams()
	const router = useRouter()
	const userId = params.id as string
	
	const [profileLoading, setProfileLoading] = useState(true)
	const [memes, setMemes] = useState<Meme[]>([])
	const [activeTab, setActiveTab] = useState<'live' | 'all'>('all')
	const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
	const [isFollowing, setIsFollowing] = useState(false)
	const [followLoading, setFollowLoading] = useState(false)

	const { userDetails, setUserDetails } = useContext(Context)
	const { openAuthModal } = useAuthModal()
	const user = useUser()

	// Memoized profile data fetching
	const getUserProfile = useCallback(async () => {
		try {
			setProfileLoading(true)
			const response = await axiosInstance.get(`/api/user/${userId}`)
			
			if (response.data.user) {
				const userData: UserProfileData = {
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
	}, [userId, router])

	// Memoized memes fetching
	const getUserMemes = useCallback(async () => {
		try {
			const response = await axiosInstance.get(
				`/api/meme?created_by=${userId}&offset=30`
			)
			
			if (response.data.memes) {
				const processedMemes = response.data.memes
					.sort((a: Meme, b: Meme) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
				setMemes(processedMemes)
			}
		} catch (error) {
			console.log(error)
			setMemes([])
		}
	}, [userId])

	// Memoized follow status checking
	const checkFollowStatus = useCallback(async () => {
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
	}, [userDetails?._id, userId])

	// Memoized follow/unfollow handler
	const handleFollow = useCallback(async () => {
		try {
			if (!userDetails?._id) {
				toast.error('Please login to follow users')
				return
			}

			setFollowLoading(true)
			
			if (isFollowing) {
				await axiosInstance.delete(`/api/user/follow?userId=${userId}`)
				setIsFollowing(false)
				toast.success('User unfollowed successfully')
				setUserProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) - 1 } : null)
			} else {
				await axiosInstance.post('/api/user/follow', { userIdToFollow: userId })
				setIsFollowing(true)
				toast.success('User followed successfully')
				setUserProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount || 0) + 1 } : null)
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || 'An error occurred'
			toast.error(errorMessage)
		} finally {
			setFollowLoading(false)
		}
	}, [userDetails?._id, userId, isFollowing])

	// Memoized vote handler
	const voteToMeme = useCallback(async (vote_to: string) => {
		if (!userDetails && openAuthModal) {
			openAuthModal()
			return
		}
		
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
				toast.error(error.response.data.message)
			} else {
				toast.error("Already voted to this content")
			}
		}
	}, [userDetails, openAuthModal, user, getUserMemes])

	// Memoized tab change handler
	const handleTabChange = useCallback((tab: string) => {
		setMemes([])
		setActiveTab(tab.toLowerCase() as 'live' | 'all')
	}, [])

	// Effects
	useEffect(() => {
		if (userId) {
			getUserProfile()
			setMemes([])
			getUserMemes()
			checkFollowStatus()
		}
	}, [userId, getUserProfile, getUserMemes, checkFollowStatus])

	useEffect(() => {
		setMemes([])
		getUserMemes()
	}, [activeTab, getUserMemes])

	// Memoized computed values
	const isOwnProfile = useMemo(() => userDetails?._id === userId, [userDetails?._id, userId])

	// Loading states
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

	return (
		<div className="md:max-w-7xl md:mx-auto mx-4">
			{/* Top Section */}
			<div className="flex items-center justify-between pb-4 md:pb-6">
				<div className="flex items-center space-x-2 md:space-x-4 rounded-lg">
					<div className="h-20 w-20 md:h-44 md:w-44 bg-black rounded-full overflow-hidden flex items-center justify-center">
						<img
							src={userProfile?.profile_pic || '/assets/meme1.jpeg'}
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

			{/* Bio Section */}
			<div className="mt-3">
				<div className="py-3 border-[.1875rem] border-[#1783fb] rounded-xl">
					<p className="text-[28px] h-fit leading-none px-4">
						{userProfile?.bio || 'No bio available'}
					</p>
				</div>
			</div>

			{/* Gallery Section */}
			<div className="mt-16 md:mt-12">
				<div className="flex items-center justify-center">
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
				<MemesList
					memes={memes}
					pageType={activeTab}
					onVote={voteToMeme}
					bookmarkedMemes={new Set()}
					view="grid"
					isSelf={isOwnProfile}
				/>
			</div>
		</div>
	)
} 
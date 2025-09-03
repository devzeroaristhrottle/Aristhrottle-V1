'use client'

import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { Context } from '@/context/contextProvider'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAuthModal, useUser } from '@account-kit/react'
import { UserProfileData, Meme } from '@/mobile_components/types'
import MemesList from '@/mobile_components/MemesList'
import Sorter from '@/mobile_components/Sorter'

export default function UserProfilePage() {
	const params = useParams()
	const router = useRouter()
	const userId = params.id as string
	
	const [profileLoading, setProfileLoading] = useState(true)
	const [memes, setMemes] = useState<Meme[]>([])
	const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
	const [isFollowing, setIsFollowing] = useState(false)
	const [followLoading, setFollowLoading] = useState(false)
	const [view, setView] = useState<'grid' | 'list'>('list');

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
				router.push('/mobile')
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
	}, [getUserMemes])

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
		<div>
			{/* Top Section */}
			<div className="flex items-center justify-between">
				<div className="flex items-center rounded-lg gap-x-4 px-4">
					<div className="h-20 w-20 bg-black rounded-full overflow-hidden flex items-center justify-center">
						<img
							src={userProfile?.profile_pic || '/assets/meme1.jpeg'}
							alt="Profile"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className='flex flex-col'>
						<div className="text-base font-bold flex flex-row gap-x-4">
							{userProfile?.username}
							{!isOwnProfile && userDetails && (
								<div className='text-sm flex text-center text-black'>
									<button
										onClick={handleFollow}
										disabled={followLoading}
										className={`flex justify-between items-center gap-2 px-2 rounded-lg font-medium transition-colors ${
											isFollowing
												? 'bg-[#707070]'
												: 'bg-[#2FCAC7]'
										} ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										{followLoading ? (
											<AiOutlineLoading3Quarters className="animate-spin" />
										) : isFollowing ? (
											'Following'
										) : (
											'Follow'
										)}
									</button>
								</div>
							)}
						</div>
						<h1 className="text-sm py-1">
							{userProfile?.bio}
						</h1>
						<div className='flex flex-row items-center justify-start gap-2 text-sm'>
							<div>{userProfile.followersCount} Followers</div>
							<div>{userProfile.followingCount} Following</div>
						</div>
					</div>
				</div>
				
				<div className="flex flex-col items-end space-y-2">
					{isOwnProfile && (
						<button
							onClick={() => router.push('/home/profile')}
							className="flex justify-between items-center gap-2 border border-[#1783fb] rounded-lg hover:opacity-40"
						>
							<p className="text-[#1783fb] text-sm font-bold">
								Edit Profile
							</p>
						</button>
					)}
				</div>
			</div>
			
			<Sorter onViewChange={setView} view={view} gridEnable/>
			<MemesList
				memes={memes}
				pageType={'all'}
				onVote={voteToMeme}
				view={view}
				isSelf={isOwnProfile}
			/>
		</div>
	)
} 
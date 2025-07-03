'use client'

import React, { useContext, useEffect, useState } from 'react'
import { HStack } from '@chakra-ui/react'
import { useSearchParams } from 'next/navigation'
import { Context } from '@/context/contextProvider'
import {
	PaginationItems,
	PaginationNextTrigger,
	PaginationPrevTrigger,
	PaginationRoot,
} from '@/components/ui/pagination'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { TabButton } from '@/components/TabButton'
import { toast } from 'react-toastify'
import { Avatar } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface FollowUser {
	_id: string
	username: string
	profile_pic?: string
	user_wallet_address: string
}

export default function FollowersPage() {
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState<boolean>(false)
	const [users, setUsers] = useState<FollowUser[]>([])
	const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
		'followers'
	)
	const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
	const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())

	const { userDetails } = useContext(Context)
	const searchParams = useSearchParams()
	const router = useRouter()
	const viewingUserId = searchParams.get('user') // If viewing another user's followers

	const pageSize = 20
	const offset = (page - 1) * pageSize

	const getUsers = async () => {
		try {
			setLoading(true)
			let response

			if (viewingUserId) {
				// If viewing another user's followers by userId
				response = await axiosInstance.get(
					`/api/user/follow?userId=${viewingUserId}&type=${activeTab}`
				)
			} else if (userDetails?._id) {
				// If viewing own followers by user ID
				response = await axiosInstance.get(
					`/api/user/follow?userId=${userDetails._id}&type=${activeTab}`
				)
			} else {
				throw new Error('User not found')
			}

			if (response.data.users) {
				setUsers(response.data.users)
			}
		} catch (error) {
			console.log(error)
			setUsers([])
		} finally {
			setLoading(false)
		}
	}


	const checkFollowingStatus = async () => {
		try {
			if (!userDetails?._id) return
			const response = await axiosInstance.get(
				`/api/user/follow?userId=${userDetails._id}&type=following`
			)

			if (response.data.users) {
				const followingIds = new Set<string>(
					response.data.users.map((user: FollowUser) => user._id)
				)
				setFollowingUsers(followingIds)
			}
		} catch (error) {
			console.log('Error checking following status:', error)
		}
	}

	const handleFollow = async (userId: string) => {
		try {
			setActionLoading(prev => new Set([...prev, userId]))

			if (followingUsers.has(userId)) {
				// Unfollow
				await axiosInstance.delete(`/api/user/follow?userId=${userId}`)
				setFollowingUsers(prev => {
					const newSet = new Set(prev)
					newSet.delete(userId)
					return newSet
				})
				toast.success('User unfollowed successfully')
			} else {
				// Follow
				await axiosInstance.post('/api/user/follow', { userIdToFollow: userId })
				setFollowingUsers(prev => new Set([...prev, userId]))
				toast.success('User followed successfully')
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || 'An error occurred'
			toast.error(errorMessage)
		} finally {
			setActionLoading(prev => {
				const newSet = new Set(prev)
				newSet.delete(userId)
				return newSet
			})
		}
	}

	useEffect(() => {
		setUsers([])
		setPage(1)
		getUsers()
	}, [userDetails, activeTab, viewingUserId])

	useEffect(() => {
		checkFollowingStatus()
	}, [userDetails])

	const handleTabChange = (tab: string) => {
		setUsers([])
		setActiveTab(tab.toLowerCase() as 'followers' | 'following')
	}

	const paginatedUsers = users.slice(offset, offset + pageSize)

	return (
		<div className="md:max-w-7xl md:mx-auto mx-4">
			{/* Tab Section */}
			<div className="flex items-center justify-center mb-8">
				<div className="flex items-center text-center gap-x-10 border-2 border-white rounded-10px px-3 py-2 w-fit text-nowrap">
					<TabButton
						classname="!px-8 md:!px-14"
						isActive={activeTab === 'followers'}
						label="Followers"
						onClick={() => handleTabChange('followers')}
					/>
					<TabButton
						classname="!px-4 md:!px-9"
						isActive={activeTab === 'following'}
						label="Following"
						onClick={() => handleTabChange('following')}
					/>
				</div>
			</div>

			{/* Users List */}
			<div className="min-h-[400px]">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#1783fb]" />
					</div>
				) : paginatedUsers.length === 0 ? (
					<div className="flex justify-center items-center h-64">
						<p className="text-center text-lg md:text-2xl text-gray-400">
							{activeTab === 'followers'
								? 'No followers yet'
								: 'Not following anyone yet'}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
						{paginatedUsers.map(user => (
							<div
								key={user._id}
								className="border-2 border-[#1783fb] rounded-xl p-4 md:p-6 hover:bg-[#1783fb]/10 transition-colors cursor-pointer"
								onClick={() => router.push(`/home/profiles/${user._id}`)}
							>
								<div className="flex items-center space-x-4">
									<Avatar
										src={user.profile_pic || '/assets/meme1.jpeg'}
										name={user.username}
										size="lg"
										className="flex-shrink-0"
									/>
									<div className="flex-grow min-w-0">
										<h3 className="text-white text-lg md:text-xl font-semibold truncate">
											{user.username}
										</h3>
										<p className="text-gray-400 text-sm truncate">
											{user.user_wallet_address.slice(0, 8)}...
											{user.user_wallet_address.slice(-6)}
										</p>
									</div>
								</div>

								{/* Follow/Unfollow Button - Only show if not viewing own followers and not the current user */}
								{user._id !== userDetails?._id && (
									<div className="mt-4">
										<button
											onClick={e => {
												e.stopPropagation() // Prevent card click
												handleFollow(user._id)
											}}
											disabled={actionLoading.has(user._id)}
											className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
												followingUsers.has(user._id)
													? 'border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
													: 'border-2 border-[#1783fb] text-[#1783fb] hover:bg-[#1783fb] hover:text-white'
											} ${
												actionLoading.has(user._id)
													? 'opacity-50 cursor-not-allowed'
													: ''
											}`}
										>
											{actionLoading.has(user._id) ? (
												<AiOutlineLoading3Quarters className="animate-spin mx-auto" />
											) : followingUsers.has(user._id) ? (
												'Unfollow'
											) : (
												'Follow'
											)}
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Pagination */}
			{paginatedUsers.length > 0 && users.length > pageSize && (
				<div className="mt-8">
					<PaginationRoot
						count={Math.max(1, Math.ceil(users.length / pageSize))}
						pageSize={pageSize}
						defaultPage={1}
						variant="solid"
						className="mx-auto mb-10"
						page={page}
						onPageChange={e => {
							setPage(e.page)
						}}
					>
						<HStack className="justify-center mb-5">
							<PaginationPrevTrigger />
							<PaginationItems />
							<PaginationNextTrigger />
						</HStack>
					</PaginationRoot>
				</div>
			)}
		</div>
	)
}

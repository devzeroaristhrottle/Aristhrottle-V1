'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import { TabButton } from '@/mobile_components/TabButton'
import Sorter from '@/mobile_components/Sorter'
import UserList from '@/mobile_components/UserList'
import React, { useState, useEffect, useContext } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { useRouter } from 'next/navigation'
import MemesList from '@/mobile_components/MemesList'
import { Meme, UserLeaderboardItem } from '@/mobile_components/types'
import { useAuthModal, useUser } from '@account-kit/react'
import { toast } from 'react-toastify'
import { useMemeActions } from '../../home/bookmark/bookmarkHelper'
import { Context } from '@/context/contextProvider'

function Page() {
	const [active, setActive] = useState<'users' | 'content'>('users')
	const [period, setPeriod] = useState<'daily' | 'alltime'>('daily')
	const [loading, setLoading] = useState(false)
	const [users, setUsers] = useState<UserLeaderboardItem[]>([])
	const [memes, setMemes] = useState<Meme[]>([])
	const [bookMarks, setBookMarks] = useState<Meme[]>([])
	const router = useRouter()

	const user = useUser()
	const { openAuthModal } = useAuthModal()
	const { userDetails, setUserDetails } = useContext(Context)
	const { handleBookmark: bookmarkAction } = useMemeActions()

	const fetchUsers = async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get(
				`/api/user-leaderboard?daily=${
					period === 'daily'
				}&limit=50&offset=0&filter=tokens_minted`
			)
			if (response.data.leaderboard) {
				setUsers(response.data.leaderboard)
			}
		} catch (error) {
			console.error('Error fetching users:', error)
			setUsers([])
		} finally {
			setLoading(false)
		}
	}

	const fetchContent = async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get(
				`/api/leaderboard?daily=${period === 'daily'}&offset=0`
			)
			if (response.data.memes) {
				setMemes(response.data.memes)
			}
		} catch (error) {
			console.error('Error fetching content:', error)
			setMemes([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (active === 'users') {
			fetchUsers()
		} else {
			fetchContent()
		}
	}, [active, period])

	// Fetch bookmarks from server on mount
	const fetchBookmarks = async () => {
		try {
			const resp = await axiosInstance.get('/api/bookmark')
			if (resp.status === 200) {
				setBookMarks(resp.data.memes)
			}
		} catch (err) {
			console.error(err)
			toast.error('Error fetching bookmarks')
		}
	}

	useEffect(() => {
		fetchBookmarks()
	}, [])

	const handleVote = async (memeId: string) => {
		if (!userDetails && openAuthModal) {
			openAuthModal()
			return
		}

		try {
			if (user && user.address) {
				// Update userDetails optimistically
				if (userDetails) {
					setUserDetails({
						...userDetails,
						votes: userDetails.votes + 1,
					})
				}

				const response = await axiosInstance.post('/api/vote', {
					vote_to: memeId,
					vote_by: userDetails?._id,
				})

				if (response.status === 201) {
					toast.success('Vote casted successfully!')
					// Update the memes list to reflect the new vote
					setMemes(prev =>
						prev.map(meme =>
							meme._id === memeId
								? {
										...meme,
										vote_count: meme.vote_count + 1,
										has_user_voted: true,
								  }
								: meme
						)
					)
				}
			}
		} catch (error: any) {
			// Revert userDetails on error
			if (userDetails) {
				setUserDetails({
					...userDetails,
					votes: userDetails.votes,
				})
			}
			if (
				error.response?.data?.message === 'You cannot vote on your own content'
			) {
				toast.error(error.response.data.message)
			} else {
				toast.error('Already voted to this content')
			}
			// Revert the optimistic update
			setMemes(prev =>
				prev.map(meme =>
					meme._id === memeId
						? {
								...meme,
								vote_count: meme.vote_count,
								has_user_voted: false,
						  }
						: meme
				)
			)
		}
	}

	const handleShare = (memeId: string, imageUrl: string) => {
		// Handle share functionality
		console.log('Share meme:', memeId, imageUrl)
	}

	const handleBookmark = async (id: string, name: string, imageUrl: string) => {
		if (!user || !user.address) {
			openAuthModal?.()
			return
		}

		try {
			bookmarkAction(id)
			// Optimistically update the local state
			setBookMarks(prev => {
				const isCurrentlyBookmarked = prev.some(meme => meme._id === id)
				if (isCurrentlyBookmarked) {
					return prev.filter(meme => meme._id !== id)
				} else {
					return [...prev, { _id: id, name, image_url: imageUrl } as Meme]
				}
			})
			// Fetch the actual state from server
			await fetchBookmarks()
		} catch (error) {
			console.log(error)
			toast.error('Error updating bookmark')
			// Revert on error
			await fetchBookmarks()
		}
	}

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto">
				<div className="flex justify-center items-center mb-4">
					<label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={active === 'content'}
							onChange={() =>
								setActive(active === 'users' ? 'content' : 'users')
							}
							className="sr-only peer"
						/>
						<div className="w-32 h-6 bg-gray-300 rounded-full transition-colors duration-200 flex items-center justify-between px-1 relative">
							<span className="text-black z-10 w-16 text-center">Users</span>
							<span className="text-black z-10 w-16 text-center">Content</span>
							<div
								className={`absolute left-1 top-1 h-4 bg-[#29E0CA] rounded-full shadow-md transition-transform duration-200 ${
									active === 'content' ? 'translate-x-14 w-16' : 'w-14'
								}`}
							/>
						</div>
					</label>
				</div>

				<div className="flex items-center justify-between mb-4">
					<Sorter gridEnable={false} />

					<div className="flex items-center space-x-2">
						<TabButton
							isActive={period === 'daily'}
							label="Daily"
							onClick={() => setPeriod('daily')}
						/>
						<TabButton
							isActive={period === 'alltime'}
							label="All Time"
							onClick={() => setPeriod('alltime')}
						/>
					</div>

					<div className="w-[60px]"></div>
				</div>

				{/* Content based on active tab */}
				{active === 'users' && <UserList users={users} loading={loading} />}

				{active === 'content' && (
					<div>
						{loading ? (
							<div className="flex justify-center items-center py-8">
								<AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#29E0CA]" />
							</div>
						) : (
							<MemesList
								memes={memes}
								pageType={period === 'daily' ? 'live' : 'all'}
								onVote={handleVote}
								onShare={handleShare}
								onBookmark={handleBookmark}
								bookmarkedMemes={new Set(bookMarks.map(meme => meme._id))}
								view="list"
							/>
						)}
					</div>
				)}
			</div>
			<BottomNav />
		</div>
	)
}

export default Page

'use client'
import { TabButton } from '@/mobile_components/TabButton'
import Sorter from '@/mobile_components/Sorter'
import UserList from '@/mobile_components/UserList'
import React, { useState, useEffect, useContext } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import MemesList from '@/mobile_components/MemesList'
import { Meme, UserLeaderboardItem } from '@/mobile_components/types'
import { useAuthModal, useUser } from '@account-kit/react'
import { toast } from 'react-toastify'
import { Context } from '@/context/contextProvider'

function Page() {
	const [active, setActive] = useState<'users' | 'content'>('users')
	const [period, setPeriod] = useState<'daily' | 'alltime'>('alltime')
	const [loading, setLoading] = useState(false)
	const [users, setUsers] = useState<UserLeaderboardItem[]>([])
	const [memes, setMemes] = useState<Meme[]>([])

	const user = useUser()
	const { openAuthModal } = useAuthModal()
	const { userDetails, setUserDetails } = useContext(Context)

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

	return (
		<div className="overflow-y-auto">
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
						<div className="w-48 h-6 bg-gray-300 rounded-full transition-colors duration-200 flex items-center justify-between px-1 relative">
							<span className={`text-black z-10 w-24 text-center transition-all duration-200 ${active === 'users' ? 'font-bold' : 'font-normal'}`}>Users</span>
							<span className={`text-black z-10 w-24 text-center transition-all duration-200 ${active === 'content' ? 'font-bold' : 'font-normal'}`}>Content</span>
							<div
								className={`absolute top-1 h-4 bg-[#29E0CA] rounded-full shadow-md transition-all duration-200 ${
									active === 'content' ? 'left-[92px] w-24' : 'left-1 w-24'
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
								view="list"
							/>
						)}
					</div>
				)}
		</div>
	)
}

export default Page

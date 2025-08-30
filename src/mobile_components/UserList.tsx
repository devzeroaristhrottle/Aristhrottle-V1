'use client'
import React, { useEffect, useRef, useState, useContext } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import {UserLeaderboardItem, UserListProps} from '@/mobile_components/types'
import { useUser } from '@account-kit/react'
import { Context } from '@/context/contextProvider'


// Component for 1st Place User
const FirstPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="rounded-lg p-4 mb-4 bg-green-600 border-[#EAA408] border">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award1.png" 
					alt="1st Place"
					className="w-10 h-10"
				/>
			</div>
			<div className="text-white flex-1 text-center flex items-start justify-start space-x-2 rounded-full bg-gradient-to-r from-green-300 to-blue-400">
				<div className="w-8 h-8 rounded-full overflow-hidden">
					{user.profile_pic ? (
						<img 
							src={user.profile_pic} 
							alt={user.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-yellow-400 flex items-center justify-center">
							<span className="text-black text-sm font-bold">
								{user.username.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>
				<span className="text-lg">{user.username}</span>
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_received}
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_casted}
			</div>
			<div className=" text-lg w-12 text-center">
				{user.uploads}
			</div>
			<div className=" text-lg w-12 text-center">
				{Math.round(user.tokens_minted)}
			</div>
		</div>
	</div>
)

// Component for 2nd Place User
const SecondPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="bg-gradient-to-r from-gray-400/80 to-gray-600/80 bg-gray-500/30 border border-gray-400 rounded-lg p-4 mb-4">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award2.png" 
					alt="2nd Place"
					className="w-9 h-9"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-7 h-7 rounded-full overflow-hidden">
					{user.profile_pic ? (
						<img 
							src={user.profile_pic} 
							alt={user.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-gray-400 flex items-center justify-center">
							<span className="text-black text-sm font-bold">
								{user.username.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>
				<span className="text-base">{user.username}</span>
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_received}
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_casted}
			</div>
			<div className=" text-lg w-12 text-center">
				{user.uploads}
			</div>
			<div className=" text-lg w-12 text-center">
				{Math.round(user.tokens_minted)}
			</div>
		</div>
	</div>
)

// Component for 3rd Place User
const ThirdPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="bg-gradient-to-r from-orange-400/80 to-orange-600/80 bg-orange-500/30 border border-orange-400 rounded-lg p-4 mb-4">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award3.png" 
					alt="3rd Place"
					className="w-8 h-8"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-6 h-6 rounded-full overflow-hidden">
					{user.profile_pic ? (
						<img 
							src={user.profile_pic} 
							alt={user.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-orange-400 flex items-center justify-center">
							<span className="text-black text-xs font-bold">
								{user.username.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>
				<span className="text-base">{user.username}</span>
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_received}
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_casted}
			</div>
			<div className=" text-lg w-12 text-center">
				{user.uploads}
			</div>
			<div className=" text-lg w-12 text-center">
				{Math.round(user.tokens_minted)}
			</div>
		</div>
	</div>
)

// Regular User Row Component
const RegularUserRow: React.FC<{ user: UserLeaderboardItem; isCurrentUser?: boolean }> = ({ user, isCurrentUser = false }) => (
	<div
		className={`border border-[#29E0CA] rounded-lg p-4 mb-4 ${isCurrentUser ? 'bg-blue-500/20' : ''}`}
	>
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				{`#${user.rank}`}
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-6 h-6 rounded-full overflow-hidden">
					{user.profile_pic ? (
						<img 
							src={user.profile_pic} 
							alt={user.username}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-[#29E0CA] flex items-center justify-center">
							<span className="text-black text-xs font-bold">
								{user.username.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>
				<span>{user.username}</span>
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_received}
			</div>
			<div className=" text-lg w-14 text-center">
				{user.votes_casted}
			</div>
			<div className=" text-lg w-12 text-center">
				{user.uploads}
			</div>
			<div className=" text-lg w-12 text-center">
				{Math.round(user.tokens_minted)}
			</div>
		</div>
	</div>
)

const UserList: React.FC<UserListProps> = ({ users, loading }) => {
	const [currentUser, setCurrentUser] = useState<UserLeaderboardItem | null>(null)
	const [isCurrentUserVisible, setIsCurrentUserVisible] = useState(true)
	const currentUserRef = useRef<HTMLDivElement>(null)
	
	// Real authentication
	const user = useUser()
	const { userDetails } = useContext(Context)

	// Find current user in leaderboard based on wallet address
	useEffect(() => {
		if (user && user.address && users.length > 0) {
			const currentUserInLeaderboard = users.find(
				leaderboardUser => leaderboardUser.user_wallet_address.toLowerCase() === user.address.toLowerCase()
			)
			setCurrentUser(currentUserInLeaderboard || null)
			console.log('Current user found:', currentUserInLeaderboard)
		} else {
			setCurrentUser(null)
			console.log('No current user found')
		}
	}, [user, users])

	// Intersection Observer to detect if current user's row is visible
	useEffect(() => {
		if (!currentUserRef.current) {
			console.log('No current user ref found')
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				console.log('Intersection observer:', entry.isIntersecting)
				setIsCurrentUserVisible(entry.isIntersecting)
			},
			{
				root: null,
				rootMargin: '0px',
				threshold: 0.1
			}
		)

		observer.observe(currentUserRef.current)

		return () => {
			if (currentUserRef.current) {
				observer.unobserve(currentUserRef.current)
			}
		}
	}, [currentUser])

	if (loading) {
		return (
			<div className="flex justify-center items-center py-8">
				<AiOutlineLoading3Quarters className="animate-spin text-3xl " />
			</div>
		)
	}

	if (users.length === 0) {
		return (
			<div className="text-center text-gray-400 py-8">
				No users found
			</div>
		)
	}

	// Debug info
	console.log('UserList render:', {
		currentUser: currentUser?.username,
		isCurrentUserVisible,
		userAddress: user?.address,
		usersCount: users.length
	})

	return (
		<div className="px-2">
			{/* Table Header */}
			<div className="rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className=" text-sm w-12">
						Rank
					</div>
					<div className="text-white flex-1 text-left">
						Username
					</div>
					<div className=" text-sm w-14 text-center">
						Votes Received
					</div>
					<div className=" text-sm w-14 text-center">
						Votes Cast
					</div>
					<div className=" text-sm w-12 text-center">
						Posts
					</div>
					<div className=" text-sm w-12 text-center">
						Tokens
					</div>
				</div>
			</div>

			{/* Top 3 Users with Special Components */}
			{users.slice(0, 3).map((user, index) => {
				if (user.rank === 1) return <FirstPlaceUser key={user.user_wallet_address} user={user} />
				if (user.rank === 2) return <SecondPlaceUser key={user.user_wallet_address} user={user} />
				if (user.rank === 3) return <ThirdPlaceUser key={user.user_wallet_address} user={user} />
				return null
			})}

			{/* Regular Table Rows for Rank 4+ */}
			{users.slice(3).map((user) => {
				const isCurrentUserRow = currentUser && user.user_wallet_address === currentUser.user_wallet_address
				
				return (
					<div
						key={user.user_wallet_address}
						ref={isCurrentUserRow ? currentUserRef : null}
					>
						<RegularUserRow user={user} isCurrentUser={!!isCurrentUserRow} />
					</div>
				)
			})}

			{/* Pinned Current User Row (shown when their real row is not visible) */}
			{currentUser && !isCurrentUserVisible && (
				<div className="fixed bottom-4 left-2 right-2 z-50">
					<div className="bg-blue-500/90 backdrop-blur-sm border border-blue-400 rounded-lg p-4 shadow-lg">
						<div className="flex items-center justify-between">
							<div className=" text-lg w-12 flex items-center justify-center">
								{`#${currentUser.rank}`}
							</div>
							<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
								<div className="w-6 h-6 rounded-full overflow-hidden">
									{currentUser.profile_pic ? (
										<img 
											src={currentUser.profile_pic} 
											alt={currentUser.username}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-[#29E0CA] flex items-center justify-center">
											<span className="text-black text-xs font-bold">
												{currentUser.username.charAt(0).toUpperCase()}
											</span>
										</div>
									)}
								</div>
								<span>{currentUser.username} (You)</span>
							</div>
							<div className=" text-lg w-14 text-center">
								{currentUser.votes_received}
							</div>
							<div className=" text-lg w-14 text-center">
								{currentUser.votes_casted}
							</div>
							<div className=" text-lg w-12 text-center">
								{currentUser.uploads}
							</div>
							<div className=" text-lg w-12 text-center">
								{Math.round(currentUser.tokens_minted)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Debug info - remove this in production */}
			{currentUser && (
				<div className="mt-4 p-2 bg-gray-800 text-white text-xs">
					Debug: Current user {currentUser.username} (rank #{currentUser.rank}) - Visible: {isCurrentUserVisible ? 'Yes' : 'No'}
				</div>
			)}
		</div>
	)
}

export default UserList

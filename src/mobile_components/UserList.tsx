'use client'
import React, { useEffect, useRef, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import {UserLeaderboardItem, UserListProps} from '@/mobile_components/types'
import { useUser } from '@account-kit/react'

// UserStats Component for uniform styling across all locations
const UserStats: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<>
		<div className="text-sm w-12 text-center">
			{user.votes_received}
		</div>
		<div className="text-sm w-12 text-center">
			{user.votes_casted}
		</div>
		<div className="text-sm w-10 text-center">
			{user.uploads}
		</div>
		<div className="text-sm w-10 text-center">
			{Math.round(user.tokens_minted)}
		</div>
	</>
)

// Component for 1st Place User
const FirstPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="rounded-lg mb-4 border p-4 h-20 flex items-center"
        style={{backgroundImage: "linear-gradient(to left, rgba(211, 151, 54, 0.5), rgba(227, 112, 70, 0.5))"}}
    >
		<div className="flex items-center justify-between w-full">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award1.png" 
					alt="1st Place"
					className="w-8 h-8"
				/>
			</div>
			<div className="text-white flex-1 text-center flex items-center justify-start space-x-2 rounded-full border-[#EAA408] border" 
                style={{backgroundImage: "linear-gradient(to right, rgba(255, 251, 43, 0.7), rgba(254, 190, 41, 0.7))"}}
            >
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
				<span style={{fontSize: "0.65rem"}}>{user.username}</span>
			</div>
			<UserStats user={user} />
		</div>
	</div>
)

// Component for 2nd Place User
const SecondPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="rounded-lg mb-4 p-4 h-20 flex items-center border border-[#F1F1F1]"
        style={{backgroundImage: "linear-gradient(to right, rgba(192, 171, 168, 0.5), rgba(214, 110, 93, 0.5))"}}>
		<div className="flex items-center justify-between w-full">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award2.png" 
					alt="2nd Place"
					className="w-9 h-8"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-center justify-start space-x-2 rounded-full border border-[#DBDBDB]"
                style={{backgroundImage: "linear-gradient(to right, rgba(192, 171, 168, 0.5), rgba(214, 110, 93, 0.5))"}}
                >
				<div className="w-8 h-8 rounded-full overflow-hidden">
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
				<span style={{fontSize: "0.65rem"}}>{user.username}</span>
			</div>
			<UserStats user={user} />
		</div>
	</div>
)

// Component for 3rd Place User
const ThirdPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="p-4 mb-4 rounded-lg h-20 flex items-center border border-[#F48634]"
        style={{backgroundImage: "linear-gradient(to left, rgba(214, 112, 26, 0.5), rgba(255, 91, 43, 0.5))"}}
        >
		<div className="flex items-center justify-between w-full">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award3.png" 
					alt="3rd Place"
					className="w-8 h-6"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-center justify-start space-x-2 rounded-full border border-[#DBDBDB]"
                style={{backgroundImage: "linear-gradient(to left, rgba(214, 112, 26, 0.5), rgba(255, 91, 43, 0.5))"}}
            >
				<div className="w-8 h-8 rounded-full overflow-hidden">
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
				<span style={{fontSize: "0.65rem"}}>{user.username}</span>
			</div>
			<UserStats user={user} />
		</div>
	</div>
)

// Regular User Row Component
const RegularUserRow: React.FC<{ user: UserLeaderboardItem; isCurrentUser?: boolean }> = ({ user, isCurrentUser = false }) => (
	<div
		className={` rounded-lg p-4 mb-4 h-20 flex items-center border-[#2FCAC7] border`}
        style={isCurrentUser ? {backgroundImage: "linear-gradient(to right, rgba(41, 224, 202, 0.5), rgba(224, 33, 33, 0.5))"} : {}}
	>
		<div className="flex items-center justify-between w-full">
			<div className="w-10 flex items-center justify-center" style={{fontSize: '0.5rem'}}>
				{`#${user.rank}`}
			</div>
			<div className={`text-white flex-1 text-center flex items-center justify-start space-x-2 ${isCurrentUser && `rounded-full border border-[#2FCAC7]`}`}
                style={isCurrentUser ? {backgroundImage: "linear-gradient(to right, rgba(41, 224, 202, 0.5), rgba(224, 33, 33, 0.5))"} : {}}
            >
				<div className="w-8 h-8 rounded-full overflow-hidden">
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
				<span  style={{fontSize: "0.65rem"}}>{user.username}</span>
			</div>
			<UserStats user={user} />
		</div>
	</div>
)

const UserList: React.FC<UserListProps> = ({ users, loading }) => {
	const [currentUser, setCurrentUser] = useState<UserLeaderboardItem | null>(null)
	const [isCurrentUserVisible, setIsCurrentUserVisible] = useState(true)
	const [shouldPinAtTop, setShouldPinAtTop] = useState(false)
	const currentUserRef = useRef<HTMLDivElement>(null)
	
	// Real authentication
	const user = useUser()

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

	// Intersection Observer to detect if current user's row is visible and determine position
	useEffect(() => {
		if (!currentUserRef.current) {
			console.log('No current user ref found')
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				console.log('Intersection observer:', entry.isIntersecting)
				setIsCurrentUserVisible(entry.isIntersecting)
				
				// If not visible, determine if it's above or below viewport
				if (!entry.isIntersecting) {
					const rect = entry.boundingClientRect
					const isAboveViewport = rect.top < 0
					setShouldPinAtTop(isAboveViewport)
					console.log('User position:', isAboveViewport ? 'above viewport' : 'below viewport')
				}
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
		usersCount: users.length,
		shouldPinAtTop
	})

	return (
		<div className="px-2">
			{/* Table Header */}
			<div className="rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className=" w-10" style={{fontSize: '0.5rem'}}>
						Rank
					</div>
					<div className="text-white flex-1 text-left"  style={{fontSize: "0.65rem"}}>
						Username
					</div>
					<div className=" w-14 text-center" style={{fontSize: "0.65rem"}}>
						Votes Received
					</div>
					<div className="w-12 text-center"  style={{fontSize: "0.65rem"}}>
						Votes Cast
					</div>
					<div className="w-10 text-center"  style={{fontSize: "0.65rem"}}>
						Posts
					</div>
					<div className="w-10 text-center"  style={{fontSize: "0.6rem"}}>
						Tokens
					</div>
				</div>
			</div>

			{/* Top 3 Users with Special Components */}
			{users.slice(0, 3).map((user) => {
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

            <div className='w-full h-20'></div>
			{/* Pinned Current User Row at BOTTOM (when user row is below viewport) */}
			{currentUser && !isCurrentUserVisible && (
				<div className="fixed px-1" style={{position: "fixed", left: 2, right: 2, ...(shouldPinAtTop ? {top: 96} : {bottom: 64})} } >
					<div className="backdrop-blur-sm border border-[#2FCAC7] rounded-lg p-4 shadow-lg h-20 flex items-center" 
						style={{ backgroundImage: "linear-gradient(to right, rgba(41, 224, 202, 0.5), rgba(224, 33, 33, 0.5))"}}>
						<div className="flex items-center justify-between w-full">
							<div className=" text-lg w-12 flex items-center justify-center">
								{`#${currentUser.rank}`}
							</div>
							<div className="text-white  flex-1 text-center flex items-center justify-start space-x-2 rounded-full border-[#2FCAC7] border" 
								style={{backgroundImage: "linear-gradient(to right, rgba(41, 224, 202, 0.5), rgba(224, 33, 33, 0.5))"}}
							>
								<div className="w-8 h-8 rounded-full overflow-hidden">
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
							<UserStats user={currentUser} />
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default UserList

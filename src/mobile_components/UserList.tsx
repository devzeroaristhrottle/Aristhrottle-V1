'use client'
import React from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import {UserLeaderboardItem} from '@/mobile_components/types'


// Component for 1st Place User
const FirstPlaceUser: React.FC<{ user: UserLeaderboardItem }> = ({ user }) => (
	<div className="bg-gradient-to-r from-yellow-400/30 to-yellow-600/30 border border-yellow-400 rounded-lg p-4 mb-4">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award1.png" 
					alt="1st Place"
					className="w-10 h-10"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
					<span className="text-black text-sm ">
						{user.username.charAt(0).toUpperCase()}
					</span>
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
	<div className="bg-gradient-to-r from-gray-400/30 to-gray-600/30 border border-orange-50 rounded-lg p-4 mb-4">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award2.png" 
					alt="2nd Place"
					className="w-9 h-9"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center">
					<span className="text-black text-sm ">
						{user.username.charAt(0).toUpperCase()}
					</span>
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
	<div className="bg-gradient-to-r from-orange-400/30 to-orange-600/30 border border-[#F48634] rounded-lg p-4 mb-4">
		<div className="flex items-center justify-between">
			<div className=" text-lg w-12 flex items-center justify-center">
				<img 
					src="/assets/award3.png" 
					alt="3rd Place"
					className="w-8 h-8"
				/>
			</div>
			<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
				<div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
					<span className="text-black text-xs ">
						{user.username.charAt(0).toUpperCase()}
					</span>
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

const UserList: React.FC<UserListProps> = ({ users, loading }) => {
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

	return (
		<div className="space-y-3 px-2">
			{/* Table Header */}
			<div className="rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className=" text-sm w-12">
						Rank
					</div>
					<div className="text-white  flex-1 text-center">
						Username
					</div>
					<div className=" text-sm w-14 text-center">
						Votes R
					</div>
					<div className=" text-sm w-14 text-center">
						Votes C
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
			{users.slice(3).map((user) => (
				<div
					key={user.user_wallet_address}
					className="border border-[#29E0CA] rounded-lg p-4"
				>
					<div className="flex items-center justify-between">
						<div className=" text-lg w-12 flex items-center justify-center">
							{`#${user.rank}`}
						</div>
						<div className="text-white  flex-1 text-center flex items-start justify-start space-x-2">
							<div className="w-6 h-6 bg-[#29E0CA] rounded-full flex items-center justify-center">
								<span className="text-black text-xs ">
									{user.username.charAt(0).toUpperCase()}
								</span>
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
			))}
		</div>
	)
}

export default UserList

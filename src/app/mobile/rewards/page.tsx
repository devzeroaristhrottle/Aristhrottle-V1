'use client'

import React, { useState } from 'react'
import Votes from '@/mobile_components/rewards/Votes'
import Uploads from '@/mobile_components/rewards/Uploads'
import Referrals from '@/mobile_components/rewards/Referrals'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import { TabButton } from '@/mobile_components/TabButton'


export default function Page() {
	const [activeTab, setActiveTab] = useState('vote')

	const renderContent = () => {
		switch (activeTab) {
			case 'vote':
				return <Votes />
			case 'posts':
				return <Uploads />
			case 'referral':
				return <Referrals />
			default:
				return <Votes />
		}
	}

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto px-4 py-4">
				{/* Tabs */}
				<div className="flex justify-around rounded-lg mb-4 p-1">
					<TabButton
						label="Vote"
						isActive={activeTab === 'vote'}
						onClick={() => setActiveTab('vote')}
					/>
					<TabButton
						label="Post"
						isActive={activeTab === 'posts'}
						onClick={() => setActiveTab('posts')}
					/>
					<TabButton
						label="Referral"
						isActive={activeTab === 'referral'}
						onClick={() => setActiveTab('referral')}
					/>
				</div>

				{/* Tab Content */}
				<div className="pb-4">{renderContent()}</div>
			</div>
			<div className="flex-none">
				<BottomNav />
			</div>
		</div>
	)
}

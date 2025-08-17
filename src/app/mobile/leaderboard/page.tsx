'use client'
import { Button } from '@/components/ui/button'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import { TabButton } from '@/mobile_components/TabButton'
import React, { useState } from 'react'
import { LiaSortSolid } from 'react-icons/lia'

function Page() {
	const [active, setActive] = useState<'users' | 'content'>('users')
	const [period, setPeriod] = useState<'daily' | 'alltime'>('daily')
	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="flex flex-row justify-evenly items-center mb-4">
					<TabButton
						isActive={active == 'users'}
						label="Users"
						onClick={() => setActive('users')}
					/>
					<TabButton
						isActive={active == 'content'}
						label="Content"
						onClick={() => setActive('content')}
					/>
				</div>

				<div>
					<div
						id="sorting_selector"
						className="flex items-center justify-between"
					>
						<Button
							size={{ sm: 'xs', md: 'sm' }}
							variant="outline"
							className="border-2 px-1 rounded-lg gap-2"
						>
							<LiaSortSolid />
							Sort
						</Button>
						{/* Toggle switch for daily/alltime */}
						<div className="flex items-center ml-2">
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={period === 'alltime'}
									onChange={() =>
										setPeriod(period === 'daily' ? 'alltime' : 'daily')
									}
									className="sr-only peer"
								/>
								<div className="w-28 h-8 bg-gray-300 rounded-full transition-colors duration-200 flex items-center justify-center relative">
									<span className=" font-semibold text-black">
										{period === 'daily' ? 'Daily' : 'All Time'}
									</span>
									<div
										className={`absolute left-1 top-1 w-6 h-6 bg-[#29E0CA] rounded-full shadow-md transition-transform duration-200 ${
											period === 'alltime' ? 'translate-x-20' : ''
										}`}
									/>
								</div>
							</label>
						</div>
					</div>
				</div>
			</div>
			<BottomNav />
		</div>
	)
}

export default Page

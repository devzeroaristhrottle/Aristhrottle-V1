import { TabButton } from '@/components/TabButton'
import { Button } from '@/components/ui/button'
import { IoReloadOutline } from 'react-icons/io5'
import { LiaSortSolid } from 'react-icons/lia'
import { IoGridOutline, IoListOutline } from 'react-icons/io5'

import React from 'react'

function Selector({
	isNewAvail,
	handleTabChange,
	activeTab,
	handleViewNewContents,
	view = 'list',
	onViewChange,
}: {
	isNewAvail: boolean
	handleTabChange: (nos: 'all' | 'live') => void
	activeTab: 'all' | 'live'
	handleViewNewContents: () => void
	view?: 'grid' | 'list'
	onViewChange?: (view: 'grid' | 'list') => void
}) {
	return (
		<div className="flex flex-row justify-between p-3">
			<div id="sorting_selector">
				<Button
					size={{ sm: 'xs', md: 'sm' }}
					variant="outline"
					className="border-2 px-1 rounded-lg gap-2"
				>
					<LiaSortSolid />
					Sort
				</Button>
			</div>
			<div id="live_all_button">
				<div className="flex gap-x-2 md:gap-x-3 lg:flex-1 justify-center">
					<TabButton
						label="Live"
						classname="!px-2 md:!px-5 rounded-full"
						isActive={activeTab === 'live'}
						onClick={() => handleTabChange('live')}
					/>
					<TabButton
						label="All"
						classname="!px-2 md:!px-5 rounded-full"
						isActive={activeTab === 'all'}
						onClick={() => handleTabChange('all')}
					/>
				</div>
			</div>
			<div id="new_or_grid_buttons" className="flex flex-row gap-2 items-center">
				<button
					onClick={() => onViewChange?.(view === 'grid' ? 'list' : 'grid')}
					className="p-2 hover:text-blue-400 transition-colors"
				>
					{view === 'grid' ? (
						<IoListOutline className="w-5 h-5" />
					) : (
						<IoGridOutline className="w-5 h-5" />
					)}
				</button>
				{isNewAvail && activeTab === 'live' && (
					<Button
						size={{ sm: 'xs', md: 'sm' }}
						variant="outline"
						onClick={handleViewNewContents}
						className="border-2 px-1 rounded-lg transition-colors gap-2"
					>
						<IoReloadOutline />
						New
					</Button>
				)}
			</div>
		</div>
	)
}

export default Selector

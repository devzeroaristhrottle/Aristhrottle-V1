'use client'

import React, { useState, useCallback, useRef } from 'react'
import { TabButton } from '@/components/TabButton'
import ProblemComp from './ProblemComp'
import SolutionComp from './SolutionComp'

export default function DocsPage() {
	const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem')
	const containerRef = useRef<HTMLDivElement>(null)

	const scrollToTop = () => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		}
	}

	const handleTabChange = (tab: string) => {
		setActiveTab(tab.toLowerCase() as 'problem' | 'solution')
		if (tab.toLowerCase() === 'solution') {
			scrollToTop()
		}
	}

	// Callback to switch to solution tab
	const handleEndReached = useCallback(() => {
		setTimeout(() => {
			setActiveTab('solution')
			scrollToTop()
		}, 500)
	}, [])

	return (
		<div ref={containerRef} className="w-full max-w-7xl mx-auto px-4 md:px-8 overflow-x-hidden">
			{/* Tab Navigation */}
			<div className="flex justify-center mb-4 md:mb-8">
				<div className="flex space-x-2 md:space-x-4 border border-white p-1.5 md:p-2 rounded-md md:rounded-10px">
					<TabButton
						label="Problem"
						classname="!px-3 md:!px-8 !text-sm md:!text-base !rounded-md md:!rounded-10px w-32 md:w-64"
						isActive={activeTab === 'problem'}
						onClick={() => handleTabChange('problem')}
					/>
					<TabButton
						label="Solution"
						classname="!px-3 md:!px-8 !text-sm md:!text-base !rounded-md md:!rounded-10px w-32 md:w-64"
						isActive={activeTab === 'solution'}
						onClick={() => handleTabChange('solution')}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="min-h-[60vh] pb-8">
				{activeTab === 'problem' && <ProblemComp onEndReached={handleEndReached} />}
				{activeTab === 'solution' && <SolutionComp />}
			</div>
		</div>
	)
}

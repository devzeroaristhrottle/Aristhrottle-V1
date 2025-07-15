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
			window.scrollTo({ top: 0})
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
		<div ref={containerRef} className="md:max-w-7xl md:mx-auto mx-4">

			{/* Tab Navigation */}
			<div className="flex justify-center mb-8">
				<div className="flex space-x-4">
					<TabButton
						label="Problem"
						classname="!px-6 md:!px-8 !rounded-md md:!rounded-10px"
						isActive={activeTab === 'problem'}
						onClick={() => handleTabChange('problem')}
					/>
					<TabButton
						label="Solution"
						classname="!px-6 md:!px-8 !rounded-md md:!rounded-10px"
						isActive={activeTab === 'solution'}
						onClick={() => handleTabChange('solution')}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="min-h-[60vh]">
				{activeTab === 'problem' && <ProblemComp onEndReached={handleEndReached} />}
				{activeTab === 'solution' && <SolutionComp />}
			</div>
		</div>
	)
}

'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Carousel from '@/mobile_components/Carousel'
import Navbar from '@/mobile_components/Navbar'
import Selector from '@/mobile_components/Selector'
import React, { useState } from 'react'

function page() {
	const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
	const [isNewAvail, setIsNewAvail] = useState<boolean>(false)

	const handleViewNewContents = () => {
		console.log('New Contents avaible:')
		setIsNewAvail(!isNewAvail)
	}
	return (
		<>
			<Navbar />
			<Carousel />
			<Selector
				activeTab={activeTab}
				handleTabChange={setActiveTab}
				isNewAvail={isNewAvail}
				handleViewNewContents={handleViewNewContents}
			/>
            <BottomNav />
		</>
	)
}

export default page

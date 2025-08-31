'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import PopularView from '@/mobile_components/search/PopularView';
import SelfView from '@/mobile_components/search/SelfView';
import TrendingView from '@/mobile_components/search/TrendingView';
import SearchBar from '@/mobile_components/search/SearchBar';
import { TabButton } from '@/mobile_components/TabButton';
import React, { useState } from 'react'

function Page() {
    const [input, setInput] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'self' | 'trending' | 'popular'>('self');

    const renderContent = () => {
		switch (activeTab) {
			case 'self':
				return <SelfView />
			case 'trending':
				return <TrendingView />
			case 'popular':
				return <PopularView />
			default:
				return <SelfView />
		}
	}


    return (
        <div className='h-screen flex flex-col overflow-hidden'>
            <Navbar />
            <div className='flex-1 overflow-y-auto px-4 py-4' style={{fontSize: '0.5rem'}}>
                {/*Search Bar */}
                <div className="mb-4">
                    <SearchBar 
                        placeholder="Search by title, tags or username"
                        onSearch={(query) => setInput(query)}
                    />
                </div>

                <div className='w-full items-center justify-evenly flex mb-4 p-1'>
                    <TabButton isActive={activeTab === 'self'} label='For You' onClick={() => setActiveTab('self')}/>
                    <TabButton isActive={activeTab === 'trending'} label='Trending' onClick={() => setActiveTab('trending')}/>
                    <TabButton isActive={activeTab === 'popular'} label='Popular' onClick={() => setActiveTab('popular')}/>
                </div>

                {input && ("Searched: " + input)}
                {/*Rendered Contents */}
                <div className="pb-4">{renderContent()}</div>
            </div>
            <div className="flex-none">
				<BottomNav />
			</div>
        </div>
    )
}

export default Page
'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import PopularView from '@/mobile_components/search/PopularView';
import SelfView from '@/mobile_components/search/SelfView';
import TrendingView from '@/mobile_components/search/TrendingView';
import { TabButton } from '@/mobile_components/TabButton';
import React, { useState } from 'react'
import { IoSearchSharp } from 'react-icons/io5';

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
            <div className='flex-1 overflow-y-auto px-4 py-4'>
                {/*Search Bar */}
                <div className="relative mb-4">
                    <input 
                        placeholder='search by title, tags or username' 
                        className='bg-transparent w-full border border-white rounded-full pr-10 pl-3 py-1' 
                        onChange={(e) => setInput(e.target.value)} 
                    />
                    
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
                        <IoSearchSharp className="w-5 h-5" />
                    </span>
                </div>

                <div className='w-full items-center justify-evenly flex mb-4 p-1'>
                    <TabButton isActive={activeTab === 'self'} label='For You' onClick={() => setActiveTab('self')}/>
                    <TabButton isActive={activeTab === 'trending'} label='Trending' onClick={() => setActiveTab('trending')}/>
                    <TabButton isActive={activeTab === 'popular'} label='Popular' onClick={() => setActiveTab('popular')}/>
                </div>

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
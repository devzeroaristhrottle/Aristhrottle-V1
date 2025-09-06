'use client';

import PopularView from '@/mobile_components/search/PopularView';
import SelfView from '@/mobile_components/search/SelfView';
import TrendingView from '@/mobile_components/search/TrendingView';
import SearchBar from '@/mobile_components/search/SearchBar';
import { TabButton } from '@/mobile_components/TabButton';
import React, { useState } from 'react';

function Page() {
    const [input, setInput] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'self' | 'trending' | 'popular'>('self');

    const renderContent = () => {
        if (input.trim()) {
            return <SelfView searchQuery={input} />;
        }

        switch (activeTab) {
            case 'self':
                return <SelfView />;
            case 'trending':
                return <TrendingView />;
            case 'popular':
                return <PopularView />;
            default:
                return <SelfView />;
        }
    };

    return (
        <div className='px-4 py-4'>
            {/* Search Bar */}
            <div className="mb-4">
                <SearchBar 
                    placeholder="Search by title, tags or username"
                    onSearch={setInput}
                />
            </div>

            {/* Tabs - only show when not searching */}
            {!input.trim() && (
                <div className='w-full items-center justify-evenly flex mb-4 p-1'>
                    <TabButton isActive={activeTab === 'self'} label='For You' onClick={() => setActiveTab('self')}/>
                    <TabButton isActive={activeTab === 'trending'} label='Trending' onClick={() => setActiveTab('trending')}/>
                    <TabButton isActive={activeTab === 'popular'} label='Popular' onClick={() => setActiveTab('popular')}/>
                </div>
            )}

            {/* Content */}
            <div className="pb-4">{renderContent()}</div>
        </div>
    );
}

export default Page;
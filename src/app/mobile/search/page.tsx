'use client';

import PopularView from '@/mobile_components/search/PopularView';
import SelfView from '@/mobile_components/search/SelfView';
import TrendingView from '@/mobile_components/search/TrendingView';
import SearchBar from '@/mobile_components/search/SearchBar';
import { TabButton } from '@/mobile_components/TabButton';
import React, { useState, useEffect } from 'react';
import { Account, Meme } from '@/mobile_components/types';
import MemesList from '@/mobile_components/MemesList';
import Accounts from '@/mobile_components/search/SearchAccounts';
import Tags from '@/mobile_components/search/SearchTags';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface SearchResults {
    memes: Meme[];
    users: Account[];
    tags: { _id: string; count: number }[];
}

function Page() {
    const [input, setInput] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'self' | 'trending' | 'popular'>('self');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResults>({
        memes: [],
        users: [],
        tags: []
    });

    useEffect(() => {
        const performSearch = async () => {
            if (!input.trim()) return;

            setLoading(true);
            try {
                // Fetch all types of content in parallel
                const [memesRes, usersRes, tagsRes] = await Promise.all([
                    fetch(`/api/search?type=meme&query=${encodeURIComponent(input)}`),
                    fetch(`/api/search?type=user&query=${encodeURIComponent(input)}`),
                    fetch(`/api/search?type=tag&query=${encodeURIComponent(input)}`)
                ]);

                const [memesData, usersData, tagsData] = await Promise.all([
                    memesRes.json(),
                    usersRes.json(),
                    tagsRes.json()
                ]);

                setSearchResults({
                    memes: memesData.results || [],
                    users: usersData.results || [],
                    tags: tagsData.results || []
                });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [input]);

    const renderContent = () => {
        if (input.trim()) {
            if (loading) {
                return (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#29E0CA]" />
                    </div>
                );
            }

            return (
                <div className="space-y-8">
                    {searchResults.memes.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Memes</h2>
                            <MemesList memes={searchResults.memes} pageType="all" />
                        </div>
                    )}

                    {searchResults.users.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Users</h2>
                            <Accounts accounts={searchResults.users} />
                        </div>
                    )}

                    {searchResults.tags.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold mb-4">Tags</h2>
                            <Tags tags={searchResults.tags.map(t => t._id)} showRank={true} />
                        </div>
                    )}

                    {!searchResults.memes.length && !searchResults.users.length && !searchResults.tags.length && (
                        <div className="text-center text-gray-500">
                            No results found for &quot;{input}&quot;
                        </div>
                    )}
                </div>
            );
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
'use client';

import React, { useEffect, useState } from 'react'
import Accounts from './SearchAccounts'
import Tags from './SearchTags'
import { Account } from '../types'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

function TrendingView() {
    const [loading, setLoading] = useState(true);
    const [trendingTags, setTrendingTags] = useState<string[]>([]);
    const [trendingUsers, setTrendingUsers] = useState<Account[]>([]);

    useEffect(() => {
        const fetchTrending = async () => {
            setLoading(true);
            try {
                // Fetch trending tags
                const tagsResponse = await fetch('/api/trending?type=tags&limit=20');
                const tagsData = await tagsResponse.json();
                if (tagsData.results) {
                    setTrendingTags(tagsData.results);
                }

                // Fetch trending users
                const usersResponse = await fetch('/api/trending?type=users&limit=10');
                const usersData = await usersResponse.json();
                if (usersData.results) {
                    setTrendingUsers(usersData.results);
                }
            } catch (error) {
                console.error('Error fetching trending data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#29E0CA]" />
            </div>
        );
    }

    return (
        <div>
            <div className='flex flex-row justify-between font-bold text-base mb-4'>
                Trending Tags
            </div>
            <Tags showRank={true} tags={trendingTags} />

            <div className='h-5'></div>
            <div className='flex flex-row justify-between font-bold text-base mb-4'>
                Trending Creators
            </div>
            <Accounts accounts={trendingUsers} />
        </div>
    )
}

export default TrendingView
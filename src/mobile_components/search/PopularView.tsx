import React, { useEffect, useState } from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import RegionSelect from './RegionSelect'
import { Account } from '../types'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

function PopularView() {
    const [loading, setLoading] = useState(true);
    const [popularTags, setPopularTags] = useState<string[]>([]);
    const [popularUsers, setPopularUsers] = useState<Account[]>([]);

    useEffect(() => {
        const fetchPopularContent = async () => {
            try {
                // Fetch popular users
                const usersResponse = await fetch('/api/popular?type=users&limit=10');
                const usersData = await usersResponse.json();
                if (usersData.results) {
                    setPopularUsers(usersData.results);
                }

                // Fetch popular tags
                const tagsResponse = await fetch('/api/popular?type=tags&limit=20');
                const tagsData = await tagsResponse.json();
                if (tagsData.results) {
                    setPopularTags(tagsData.results);
                }
            } catch (error) {
                console.error('Error fetching popular content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularContent();
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
            <div className='h-5'></div>

            <div className='flex flex-row justify-between font-bold text-base'>
                Regional
                <RegionSelect />
            </div>
            <Tags tags={popularTags}/>

            <div className='h-5'></div>

            <div className='flex flex-row justify-between font-bold text-base'>
                People Trending Regionally
                <RegionSelect />
            </div>
            <Accounts accounts={popularUsers}/>
        </div>
    )
}

export default PopularView
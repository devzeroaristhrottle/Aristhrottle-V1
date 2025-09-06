import React, { useEffect, useState } from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import MemesList from '../MemesList'
import { Account, Meme } from '../types'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
function SelfView() {
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [users, setUser] = useState<Account[]>([]);
    const [memes, setMemes] = useState<Meme[]>([]);
    
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/recommendations?type=all');
                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }
                const data = await response.json();
                 setTags(data.tags || []);
                 setUser(data.users || []);
                 setMemes(data.memes || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong');
                console.error('Error fetching recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#29E0CA]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-4">
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className='font-bold text-base'>Tags</div>
            <Tags tags={tags} />

            <div className='h-5'></div>

            <div className='font-bold text-base'>Suggested Accounts</div>
            <Accounts accounts={users} />

            <div className='h-5'></div>

            <div className='font-bold text-base'>Content</div>
            <MemesList pageType='all' view='grid' memes={memes}/>
        </div>
    )
}

export default SelfView
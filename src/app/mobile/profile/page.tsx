'use client'

import React, { useContext, useEffect, useState } from 'react'
import { Context } from '@/context/contextProvider'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAuthModal, useUser } from '@account-kit/react'
import { Meme } from '@/mobile_components/types'
import MemesList from '@/mobile_components/MemesList'
import Sorter from '@/mobile_components/Sorter'
import { TabButton } from '@/mobile_components/TabButton'

type TabType = 'posts' | 'votecast' | 'drafts' | 'saved';

export default function ProfilePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('posts')
    const [loading, setLoading] = useState(false)
    const [memes, setMemes] = useState<Meme[]>([])
    const [view, setView] = useState<'grid' | 'list'>('list')

    const { userDetails } = useContext(Context)
    const { openAuthModal } = useAuthModal()
    const user = useUser()

    // Fetch user's posts
    const fetchUserPosts = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get(
                `/api/meme?created_by=${userDetails?._id}&offset=30`
            )
            if (response.data.memes) {
                const processedMemes = response.data.memes
                    .sort((a: Meme, b: Meme) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                setMemes(processedMemes)
            }
        } catch (error) {
            console.log(error)
            setMemes([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch user's voted memes
    const fetchVotedMemes = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/vote/user-votes')
            if (response.data.memes) {
                setMemes(response.data.memes)
            }
        } catch (error) {
            console.log(error)
            setMemes([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch user's draft memes
    const fetchDrafts = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/draft-meme')
            if (response.data.memes) {
                setMemes(response.data.memes)
            }
        } catch (error) {
            console.log(error)
            setMemes([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch user's saved/bookmarked memes
    const fetchSavedMemes = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get('/api/bookmark')
            if (response.data.memes) {
                setMemes(response.data.memes)
            }
        } catch (error) {
            console.log(error)
            setMemes([])
        } finally {
            setLoading(false)
        }
    }

    // Handle tab change
    const handleTabChange = async (tab: TabType) => {
        setActiveTab(tab)
        setMemes([]) // Clear current memes
        switch (tab) {
            case 'posts':
                await fetchUserPosts()
                break
            case 'votecast':
                await fetchVotedMemes()
                break
            case 'drafts':
                await fetchDrafts()
                break
            case 'saved':
                await fetchSavedMemes()
                break
        }
    }

    // Vote handler
    const handleVote = async (memeId: string) => {
        if (!userDetails && openAuthModal) {
            openAuthModal()
            return
        }
        
        try {
            if (user && user.address) {
                const response = await axiosInstance.post('/api/vote', {
                    vote_to: memeId,
                    vote_by: userDetails?._id,
                })
                if (response.status === 201) {
                    toast.success('Vote casted successfully!')
                    // Refresh the current tab's data
                    handleTabChange(activeTab)
                }
            }
        } catch (error: any) {
            if (error.response?.data?.message === "You cannot vote on your own content") {
                toast.error(error.response.data.message)
            } else {
                toast.error("Already voted to this content")
            }
        }
    }

    // Initial data load
    useEffect(() => {
        fetchUserPosts()
    }, [userDetails?._id])

    if (!userDetails) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#1783fb]" />
            </div>
        )
    }

    return (
        <div>
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center rounded-lg gap-x-4 px-4">
                    <div className="h-20 w-20 bg-black rounded-full overflow-hidden flex items-center justify-center">
                        <img
                            src={userDetails?.profile_pic || '/assets/meme1.jpeg'}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className='flex flex-col'>
                        <div className="text-base font-bold">
                            {userDetails?.username}
                        </div>
                        <h1 className="text-sm py-1">
                            {userDetails?.bio}
                        </h1>
                    </div>
                </div>
                
                <button
                    onClick={() => router.push('/home/profile')}
                    className="flex justify-between items-center gap-2 border border-[#1783fb] rounded-lg hover:opacity-40 mr-4"
                >
                    <p className="text-[#1783fb] text-sm font-bold px-2 py-1">
                        Edit Profile
                    </p>
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-4 py-4 w-full">
                <div className="flex space-x-2 w-full justify-evenly">
                    <TabButton
                        isActive={activeTab === 'posts'}
                        label="Posts"
                        onClick={() => handleTabChange('posts')}
                    />
                    <TabButton
                        isActive={activeTab === 'votecast'}
                        label="Votes"
                        onClick={() => handleTabChange('votecast')}
                    />
                    <TabButton
                        isActive={activeTab === 'drafts'}
                        label="Drafts"
                        onClick={() => handleTabChange('drafts')}
                    />
                    <TabButton
                        isActive={activeTab === 'saved'}
                        label="Saved"
                        onClick={() => handleTabChange('saved')}
                    />
                </div>
            </div>

                         {/* View Toggle */}
             <Sorter onViewChange={setView} view={view} gridEnable/>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <AiOutlineLoading3Quarters className="animate-spin text-3xl text-[#29E0CA]" />
                </div>
            ) : (
                <MemesList
                    memes={memes}
                    pageType={'all'}
                    onVote={handleVote}
                    view={view}
                    isSelf={activeTab === 'posts' || activeTab === 'drafts'}
                />
            )}
        </div>
    )
}

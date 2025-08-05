'use client'
import Share from '@/components/Share'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import Sorter from '@/mobile_components/Sorter'
import React, { useState, useContext, useEffect } from 'react'
import { useAuthModal, useUser } from '@account-kit/react'
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import MemesList from '@/mobile_components/MemesList'

import { Meme } from '@/mobile_components/types'

function Page() {
    const [loading, setLoading] = useState<boolean>(false)
    const [memes, setMemes] = useState<Meme[]>([])
    const [isShareOpen, setIsShareOpen] = useState(false)
    const [shareData, setShareData] = useState<{ id: string; imageUrl: string } | null>(null)
    const [savedMemes, setSavedMemes] = useState<Set<string>>(new Set())

    const user = useUser()
    const router = useRouter()
    const { openAuthModal } = useAuthModal()
    const { userDetails } = useContext(Context)
    useEffect(() => {
        if (user && user.address) {
            getMyMemes()
        }
    }, [user])

    const getMyMemes = async () => {
        try {
            setLoading(true)
            const resp = await axiosInstance.get('/api/bookmark')
            if (resp.status === 200) {
                setMemes(resp.data.memes)
                setSavedMemes(new Set(resp.data.memes.map((meme: Meme) => meme._id)))
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const handleShare = (memeId: string, imageUrl: string) => {
        setShareData({ id: memeId, imageUrl })
        setIsShareOpen(true)
    }

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
                    setMemes(prev =>
                        prev.map(meme =>
                            meme._id === memeId
                                ? {
                                    ...meme,
                                    vote_count: meme.vote_count + 1,
                                    has_user_voted: true,
                                }
                                : meme
                        )
                    )
                }
            }
        } catch (error: any) {
            if (error.response?.data?.message === 'You cannot vote on your own content') {
                toast.error(error.response.data.message)
            } else {
                toast.error('Already voted to this content')
            }
        }
    }

    const handleBookmark = async (id: string, name: string, imageUrl: string) => {
        if (!user || !user.address) {
            openAuthModal?.()
            return
        }

        try {
            const response = await axiosInstance.post('/api/bookmark', {
                meme: id,
                name,
                image_url: imageUrl,
            })

            if (response.status === 201 || response.status === 200) {
                // Remove the meme from the list since it's being unbookmarked
                setMemes(prev => prev.filter(meme => meme._id !== id))
                setSavedMemes(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(id)
                    return newSet
                })
                toast.success('Bookmark updated!')
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating bookmark')
        }
    }

    if (!user || !user.address) {
        return (
            <div className="h-screen flex items-center justify-center">
                <button
                    className="px-6 py-3 bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg text-xl text-white font-medium hover:bg-[#1783fb]/20 transition-all duration-300"
                    onClick={() => openAuthModal?.()}
                >
                    Connect Wallet to View Bookmarks
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Loading...
            </div>
        )
    }

    if (!loading && (!memes || memes.length === 0)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6">
                <p className="text-2xl text-white text-center">No bookmarks yet</p>
                <button
                    onClick={() => router.push('/mobile')}
                    className="px-6 py-3 bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg text-xl text-white font-medium hover:bg-[#1783fb]/20 transition-all duration-300"
                >
                    Browse Memes
                </button>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-none">
                <Sorter />
            </div>
            <div className="flex-1 overflow-hidden">
                <MemesList
                    memes={memes}
                    pageType="all"
                    onVote={handleVote}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                    bookmarkedMemes={savedMemes}
                />
            </div>
            <div className="flex-none">
                <BottomNav />
            </div>
            {isShareOpen && shareData && (
                <Share
                    onClose={() => setIsShareOpen(false)}
                    imageUrl={shareData.imageUrl}
                    id={shareData.id}
                />
            )}
        </div>
    )
}

export default Page
'use client'

import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Meme } from '../page'
import axiosInstance from '@/utils/axiosInstance'

import Share from '@/components/Share'
import { useRouter } from 'next/navigation'
import MemeDetail from '@/components/MemeDetail'
import { toast } from 'react-toastify'
import BookmarkMemeCard from '@/components/BookmarkMemeCard'

export default function Page() {
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<Meme[]>([])
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{ id: string; imageUrl: string } | null>(null)
	const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null)
	const [currentMemeIndex, setCurrentMemeIndex] = useState<number>(0)
	const [savedMemes, setSavedMemes] = useState<Set<string>>(new Set())
	
	const user = useUser()
	const router = useRouter()
	const { openAuthModal } = useAuthModal()
	const { userDetails } = useContext(Context)

	useEffect(() => {
		if (user && user.address) {
			getMyMemes()
		}
	}, [user, userDetails])

	const getMyMemes = async () => {
		try {
			setLoading(true)
			const resp = await axiosInstance.get('/api/bookmark')
			if (resp.status == 200) {
				const formattedMemes = resp.data.memes.map((meme: any) => ({
					_id: meme._id,
					vote_count: meme.vote_count || 0,
					name: meme.name,
					image_url: meme.image_url,
					tags: meme.tags || [],
					categories: meme.categories || [],
					created_by: {
						_id: meme.created_by._id,
						username: meme.created_by.username,
						user_wallet_address: meme.created_by.user_wallet_address || '',
						createdAt: meme.created_by.createdAt || '',
						updatedAt: meme.created_by.updatedAt || '',
						__v: meme.created_by.__v || 0,
						profile_pic: meme.created_by.profile_pic || '' // Ensure profile_pic is never undefined
					},
					createdAt: meme.createdAt,
					updatedAt: meme.updatedAt,
					shares: meme.shares || [],
					bookmarks: meme.bookmarks || [],
					is_onchain: meme.is_onchain || false,
					__v: meme.__v || 0,
					has_user_voted: meme.has_user_voted
				}))
				setMemes(formattedMemes)
				setSavedMemes(new Set(formattedMemes.map((meme: Meme) => meme._id)));

			}
		} catch (error) {
			console.log(error)
		} finally {
			setLoading(false)
		}
	}

	const handleShare = (id: string, imageUrl: string) => {
		setShareData({ id, imageUrl })
		setIsShareOpen(true)
	}

	const handleCloseShare = () => {
		setIsShareOpen(false)
		setShareData(null)
	}

	const handleMemeClick = (meme: Meme, index: number) => {
		setSelectedMeme(meme)
		setCurrentMemeIndex(index)
	}

	const handleCloseMemeDetail = () => {
		setSelectedMeme(null)
	}

	const handleNextMeme = () => {
		if (currentMemeIndex < memes.length - 1) {
			const nextIndex = currentMemeIndex + 1
			setSelectedMeme(memes[nextIndex])
			setCurrentMemeIndex(nextIndex)
		}
	}

	const handlePrevMeme = () => {
		if (currentMemeIndex > 0) {
			const prevIndex = currentMemeIndex - 1
			setSelectedMeme(memes[prevIndex])
			setCurrentMemeIndex(prevIndex)
		}
	}

	const handleVoteUpdate = (memeId: string) => {
		// Update the meme in the list
		setMemes(prevMemes => 
			prevMemes.map(meme => 
				meme._id === memeId 
					? { ...meme, vote_count: meme.vote_count + 1, has_user_voted: true }
					: meme
			)
		)
		
		// Update selected meme if it's the same one
		if (selectedMeme && selectedMeme._id === memeId) {
			setSelectedMeme(prev => prev ? { ...prev, vote_count: prev.vote_count + 1, has_user_voted: true } : null)
		}
	}

	const handleSavedMemesUpdate = (memeId: string) => {
		setSavedMemes(prev => {
			const newSet = new Set(prev)
			if (newSet.has(memeId)) {
				newSet.delete(memeId)
			} else {
				newSet.add(memeId)
			}
			return newSet
		})
	}

	// Transform Meme to UnifiedMeme type for MemeDetail component
	const transformMemeForDetail = (meme: Meme) => ({
		...meme,
		created_by: {
			...meme.created_by,
			profile_pic: meme.created_by.profile_pic || ''
		}
	})

	if (!user || !user.address) {
		return (
			<div className="flex items-center justify-center h-screen">
				<button
					className="px-6 py-3 bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg text-xl text-white font-medium hover:bg-[#1783fb]/20 transition-all duration-300"
					onClick={() => openAuthModal()}
				>
					Connect Wallet to View Bookmarks
				</button>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#1783fb]" />
			</div>
		)
	}

	if (!loading && (!memes || memes.length === 0)) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-6">
				<p className="text-2xl text-white text-center">No bookmarks yet</p>
				<button
					onClick={() => router.push('/home')}
					className="px-6 py-3 bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg text-xl text-white font-medium hover:bg-[#1783fb]/20 transition-all duration-300"
				>
					Browse Memes
				</button>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center mx-4 md:mx-0 md:ml-20 lg:ml-0">

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full md:max-w-7xl mb-4">
				{memes.map((item, index) => (
					<BookmarkMemeCard
						key={item._id}
						meme={item}
						index={index}
						userDetails={userDetails}
						savedMemes={savedMemes}
						onMemeClick={handleMemeClick}
						onShare={handleShare}
						onSavedMemesUpdate={handleSavedMemesUpdate}
						onVoteUpdate={handleVoteUpdate}
					/>
				))}
			</div>


			{isShareOpen && shareData && (
				<Share
					id={shareData.id}
					imageUrl={shareData.imageUrl}
					onClose={handleCloseShare}
				/>

			)}

			{/* MemeDetail Component */}
			{selectedMeme && (
				<MemeDetail
					isOpen={!!selectedMeme}
					onClose={handleCloseMemeDetail}
					onNext={currentMemeIndex < memes.length - 1 ? handleNextMeme : undefined}
					onPrev={currentMemeIndex > 0 ? handlePrevMeme : undefined}
					meme={transformMemeForDetail(selectedMeme)}
					tab="bookmark"
					onVoteMeme={(memeId) => {
						handleVoteUpdate(memeId)
						if (!userDetails) {
							openAuthModal()
						} else {
							axiosInstance.post('/api/vote', { vote_to: memeId, vote_by: userDetails._id })
								.catch(error => {
									console.error('Error voting for meme:', error)
									toast.error("Error voting meme")
								})
						}
					}}
					searchRelatedMemes={() => {}}
					bmk={true}
				/>
			)}
		</div>
	)
}
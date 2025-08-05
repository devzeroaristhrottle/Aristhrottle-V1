'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Carousel from '@/mobile_components/Carousel'
import Navbar from '@/mobile_components/Navbar'
import Selector from '@/mobile_components/Selector'
import React, { useState, useEffect, useCallback } from 'react'
import axiosInstance from '@/utils/axiosInstance'
import MemesList from '@/mobile_components/MemesList'
import { useAuthModal, useUser } from '@account-kit/react'
import { toast } from 'react-toastify'
import Share from '@/components/Share'

interface Meme {
	_id: string
	name: string
	image_url: string
	vote_count: number
	is_onchain: boolean
	has_user_voted?: boolean
	bookmarks?: string[]
	rank?: number
	created_by?: {
		username: string
		profile_pic?: string
	}
}

function Page() {
	const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
	const [isNewAvail, setIsNewAvail] = useState<boolean>(false)
	const [carouselMemes, setCarouselMemes] = useState<Meme[]>([])
	const [memes, setMemes] = useState<Meme[]>([])
	const [loading, setLoading] = useState(true)
	const [bookmarkedMemes, setBookmarkedMemes] = useState<Set<string>>(new Set())
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{ id: string; imageUrl: string } | null>(null)

	const user = useUser()
	const { openAuthModal } = useAuthModal()

	// Fetch bookmarks from localStorage on mount
	useEffect(() => {
		const bookmarks = localStorage.getItem('bookmarks')
		if (bookmarks) {
			const bookmarksObj = JSON.parse(bookmarks)
			setBookmarkedMemes(new Set(Object.keys(bookmarksObj)))
		}
	}, [])

	const fetchCarouselMemes = async () => {
		try {
			const response = await axiosInstance.get('/api/meme', {
				params: {
					type: 'carousel',
				},
			})
			if (response.data?.memes) {
				const sortedMemes = [...response.data.memes].sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				setCarouselMemes(sortedMemes)
			}
		} catch (error) {
			console.error('Error fetching carousel memes:', error)
		}
	}

	const fetchMemes = async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get('/api/meme', {
				params: {
					userId: user?.address,
					...(activeTab === 'live' ? {} : { type: 'all' })
				},
			})
			if (response.data?.memes) {
				const sortedMemes = [...response.data.memes].sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				setMemes(sortedMemes)
			}
		} catch (error) {
			console.error('Error fetching memes:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCarouselMemes()
		fetchMemes()
	}, [activeTab])

	const handleViewNewContents = async () => {
		await Promise.all([fetchCarouselMemes(), fetchMemes()])
		setIsNewAvail(false)
	}

	const handleVote = async (memeId: string) => {
		if (!user || !user.address) {
			openAuthModal?.()
			return
		}

		try {
			const response = await axiosInstance.post('/api/vote', {
				vote_to: memeId,
				vote_by: user.address,
			})
			if (response.status === 201) {
				toast.success('Vote casted successfully!')
				fetchMemes() // Refresh memes to update vote status
			}
		} catch (error: any) {
			if (error.response?.data?.message === 'You cannot vote on your own meme') {
				toast.error(error.response.data.message)
			} else {
				toast.error('Already voted to this meme')
			}
		}
	}

	const handleShare = (memeId: string, imageUrl: string) => {
		setShareData({ id: memeId, imageUrl })
		setIsShareOpen(true)
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

			const newBookmarks = new Set(bookmarkedMemes)
			if (response.status === 201) {
				newBookmarks.add(id)
				toast.success('Added to bookmarks!')
			} else if (response.status === 200) {
				newBookmarks.delete(id)
				toast.success('Removed from bookmarks!')
			}
			setBookmarkedMemes(newBookmarks)

			// Update localStorage
			const bookmarksStr = localStorage.getItem('bookmarks')
			const bookmarksObj = bookmarksStr ? JSON.parse(bookmarksStr) : {}
			if (response.status === 201) {
				bookmarksObj[id] = { id, name, image_url: imageUrl }
			} else {
				delete bookmarksObj[id]
			}
			localStorage.setItem('bookmarks', JSON.stringify(bookmarksObj))
		} catch (error) {
			toast.error('Error updating bookmark')
		}
	}

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				Loading...
			</div>
		)
	}

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			<Navbar />
			<div className="flex-none">
				<Carousel items={carouselMemes} />
				<Selector
					activeTab={activeTab}
					handleTabChange={setActiveTab}
					isNewAvail={isNewAvail}
					handleViewNewContents={handleViewNewContents}
				/>
			</div>
			<div className="flex-1 overflow-hidden">
				<MemesList
					memes={memes}
					pageType={activeTab}
					onVote={handleVote}
					onShare={handleShare}
					onBookmark={handleBookmark}
					bookmarkedMemes={bookmarkedMemes}
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

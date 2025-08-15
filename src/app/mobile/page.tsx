'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Carousel from '@/mobile_components/Carousel'
import Navbar from '@/mobile_components/Navbar'
import Selector from '@/mobile_components/Selector'
import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useContext,
} from 'react'
import axiosInstance from '@/utils/axiosInstance'
import MemesList from '@/mobile_components/MemesList'
import { useAuthModal, useUser } from '@account-kit/react'
import { toast } from 'react-toastify'
import Share from '@/components/Share'
import { useMemeActions } from '../home/bookmark/bookmarkHelper'
import { Context } from '@/context/contextProvider'

import { Meme } from '@/mobile_components/types'

function Page() {
	const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
	const [isNewAvail, setIsNewAvail] = useState<boolean>(false)
	const [carouselMemes, setCarouselMemes] = useState<Meme[]>([])
	const [allMemes, setAllMemes] = useState<Meme[]>([])
	const [allMemeDataFilter, setAllMemeDataFilter] = useState<Meme[]>([])
	const [loading, setLoading] = useState(true)
	const [initialLoad, setInitialLoad] = useState(true)
	const [bookMarks, setBookMarks] = useState<Meme[]>([])
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{
		id: string
		imageUrl: string
	} | null>(null)

	const user = useUser()
	const { openAuthModal } = useAuthModal()
	const { userDetails, setUserDetails } = useContext(Context)

	// Filter memes for live view (last 24 hours)
	const filterLiveMemes = useCallback((memes: Meme[]) => {
		const now = new Date()
		now.setUTCHours(0, 0, 0, 0)
		const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
		return memes
			.filter(meme => {
				const createdAt = new Date(meme.createdAt)
				return createdAt >= twentyFourHoursAgo
			})
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
	}, [])

	// Fetch memes for the "all" tab from leaderboard
	const getMyMemes = async () => {
		try {
			if (initialLoad) setLoading(true)
			const response = await axiosInstance.get(
				`/api/leaderboard?daily=false&offset=0`
			)

			if (response?.data?.memes) {
				setAllMemeDataFilter(
					[...response.data.memes].sort(
						(a, b) =>
							new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
				)
			}
		} catch (error) {
			console.log(error)
			setAllMemeDataFilter([])
		} finally {
			if (initialLoad) {
				setLoading(false)
				setInitialLoad(false)
			}
		}
	}

	// Filtered memes based on active tab
	const displayedMemes = useMemo(() => {
		if (activeTab === 'live') {
			return filterLiveMemes(allMemes)
		}
		return allMemeDataFilter
	}, [activeTab, allMemes, allMemeDataFilter, filterLiveMemes])

	const { handleBookmark: bookmarkAction } = useMemeActions()

	// Fetch bookmarks from server on mount
	const fetchBookmarks = async () => {
		try {
			const resp = await axiosInstance.get('/api/bookmark')
			if (resp.status === 200) {
				setBookMarks(resp.data.memes)
			}
		} catch (err) {
			console.error(err)
			toast.error('Error fetching bookmarks')
		}
	}

	useEffect(() => {
		fetchBookmarks()
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
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				setCarouselMemes(sortedMemes)
			}
		} catch (error) {
			console.error('Error fetching carousel memes:', error)
		}
	}

	const fetchMemes = async () => {
		try {
			const response = await axiosInstance.get('/api/meme', {
				params: {
					userId: userDetails?._id || '',
				},
			})
			if (response.data?.memes) {
				const sortedMemes = [...response.data.memes].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				setAllMemes(sortedMemes)
			} else {
				setAllMemes([])
			}
		} catch (error) {
			console.error('Error fetching memes:', error)
			setAllMemes([])
		}
	}

	// Handle tab change without showing loading state
	const [tabLoading, setTabLoading] = useState(false)

	const handleTabChange = async (newTab: 'live' | 'all') => {
		setActiveTab(newTab)
		if (newTab === 'all' && allMemeDataFilter.length === 0) {
			setTabLoading(true)
			try {
				await getMyMemes()
			} finally {
				setTabLoading(false)
			}
		}
	}

	useEffect(() => {
		const init = async () => {
			try {
				setLoading(true)
				await Promise.all([
					fetchCarouselMemes(),
					fetchMemes(),
					activeTab === 'all' ? getMyMemes() : Promise.resolve(),
				])
			} catch (error) {
				console.error('Error during initialization:', error)
			} finally {
				setLoading(false)
				setInitialLoad(false)
			}
		}
		init()
	}, [])

	const handleViewNewContents = async () => {
		await Promise.all([fetchCarouselMemes(), fetchMemes()])
		setIsNewAvail(false)
	}

	const handleVote = async (memeId: string) => {
		if (!userDetails && openAuthModal) {
			openAuthModal()
			return
		}

		try {
			if (user && user.address) {
				// Update userDetails optimistically
				if (userDetails) {
					setUserDetails({
						...userDetails,
						votes: userDetails.votes + 1,
					})
				}

				const response = await axiosInstance.post('/api/vote', {
					vote_to: memeId,
					vote_by: userDetails?._id,
				})

				if (response.status === 201) {
					toast.success('Vote casted successfully!')
					// Update the memes list to reflect the new vote
					setAllMemes(prev =>
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
			// Revert userDetails on error
			if (userDetails) {
				setUserDetails({
					...userDetails,
					votes: userDetails.votes,
				})
			}
			if (
				error.response?.data?.message === 'You cannot vote on your own content'
			) {
				toast.error(error.response.data.message)
			} else {
				toast.error('Already voted to this content')
			}
			// Revert the optimistic update
			setAllMemes(prev =>
				prev.map(meme =>
					meme._id === memeId
						? {
								...meme,
								vote_count: meme.vote_count,
								has_user_voted: false,
						  }
						: meme
				)
			)
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
			bookmarkAction(id)
			// Optimistically update the local state
			setBookMarks(prev => {
				const isCurrentlyBookmarked = prev.some(meme => meme._id === id)
				if (isCurrentlyBookmarked) {
					return prev.filter(meme => meme._id !== id)
				} else {
					return [...prev, { _id: id, name, image_url: imageUrl } as Meme]
				}
			})
			// Fetch the actual state from server
			await fetchBookmarks()
		} catch (error) {
			console.log(error)
			toast.error('Error updating bookmark')
			// Revert on error
			await fetchBookmarks()
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
			<div className="flex-1 overflow-y-auto">
				<div>
					<Carousel items={carouselMemes} />
					<Selector
						activeTab={activeTab}
						handleTabChange={handleTabChange}
						isNewAvail={isNewAvail}
						handleViewNewContents={handleViewNewContents}
					/>
				</div>
				<div>
					{tabLoading ? (
						<div className="flex items-center justify-center py-8">
							Loading...
						</div>
					) : (
						<MemesList
							memes={displayedMemes}
							pageType={activeTab}
							onVote={handleVote}
							onShare={handleShare}
							onBookmark={handleBookmark}
							bookmarkedMemes={new Set(bookMarks.map(meme => meme._id))}
						/>
					)}
				</div>
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

'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Carousel from '@/mobile_components/Carousel'
import Navbar from '@/mobile_components/Navbar'
import Selector from '@/mobile_components/Selector'
import React, { useState, useEffect } from 'react'
import axiosInstance from '@/utils/axiosInstance'

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
	const [memes, setMemes] = useState<Meme[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchMemes()
	}, [])

	const fetchMemes = async () => {
		try {
			setLoading(true)
			const response = await axiosInstance.get('/api/meme', {
				params: {
					type: 'carousel',
				},
			})
			if (response.data?.memes) {
				// Sort by creation date, newest first
				const sortedMemes = [...response.data.memes].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
				setMemes(sortedMemes)
			}
		} catch (error) {
			console.error('Error fetching memes:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleViewNewContents = async () => {
		await fetchMemes()
		setIsNewAvail(false)
	}

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				Loading...
			</div>
		)
	}

	return (
		<>
			<Navbar />
			<Carousel items={memes} />
			<Selector
				activeTab={activeTab}
				handleTabChange={setActiveTab}
				isNewAvail={isNewAvail}
				handleViewNewContents={handleViewNewContents}
			/>
			<BottomNav />
		</>
	)
}

export default Page

'use client'

import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Meme } from '../page'
import axiosInstance from '@/utils/axiosInstance'
import { LazyImage } from '@/components/LazyImage'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { CgProfile } from 'react-icons/cg'
import Share from '@/components/Share'
import MemeDetail from '@/components/MemeDetail'
import { useRouter } from 'next/navigation'

export default function Page() {
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<Meme[]>([])
	const [isShareOpen, setIsShareOpen] = useState(false)
	const [shareData, setShareData] = useState<{ id: string; imageUrl: string } | null>(null)
	
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
						__v: meme.created_by.__v || 0
					},
					createdAt: meme.createdAt,
					updatedAt: meme.updatedAt,
					shares: meme.shares || [],
					bookmarks: meme.bookmarks || [],
					is_onchain: meme.is_onchain || false,
					__v: meme.__v || 0,
					has_user_voted: false
				}))
				setMemes(formattedMemes)
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
			<h2 className="text-[#29e0ca] text-2xl md:text-4xl font-medium text-center mb-5 md:mb-10">
				My Bookmarks
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full md:max-w-7xl mb-4">
				{memes.map((item) => (
					<div key={item._id} className="flex justify-center">
						<div className="w-full max-w-sm rounded-lg overflow-hidden bg-gradient-to-r from-[#1783fb]/10 to-[#1783fb]/5 border border-[#1783fb]/20 p-4">
							<div 
								className="username_rank_wrapper flex items-center gap-x-2 mb-3 cursor-pointer"
								onClick={() => router.push(`/home/profiles/${item.created_by._id}`)}
							>
								<CgProfile className="md:w-6 md:h-6" />
								<span className="text-[#29e0ca] text-base md:text-xl">
									{item.created_by.username}
								</span>
							</div>
							
							<div className="image_wrapper w-full aspect-square border-2 border-white rounded-lg overflow-hidden">
								<LazyImage
									src={item.image_url}
									alt={item.name}
									className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
								/>
							</div>
							
							<div className="flex justify-between items-center mt-3">
								<p className="font-medium text-lg md:text-xl text-white">
									{item.name.length > 30 ? item.name.slice(0, 30) + '...' : item.name}
								</p>
								<FaRegShareFromSquare
									className="w-5 h-5 md:w-6 md:h-6 cursor-pointer text-[#1783fb] hover:text-[#29e0ca] transition-colors duration-300"
									onClick={() => handleShare(item._id, item.image_url)}
								/>
							</div>
						</div>
					</div>
				))}
			</div>


			{isShareOpen && shareData && (
				<Share
					id={shareData.id}
					imageUrl={shareData.imageUrl}
					onClose={handleCloseShare}
				/>
			)}
		</div>
	)
}

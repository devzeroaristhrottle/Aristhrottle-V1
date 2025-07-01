'use client'

import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { LeaderboardMeme } from '../leaderboard/page'
import axiosInstance from '@/utils/axiosInstance'

export default function Page() {
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<LeaderboardMeme[]>([])
	const user = useUser()
	const { openAuthModal } = useAuthModal()

	const { userDetails } = useContext(Context)

	useEffect(() => {
		if (user && user.address) {
			getMyMemes()
		}
	}, [user, userDetails])

	const getMyMemes = async () => {
		try {
			const resp = await axiosInstance.get('/api/bookmark')
			if (resp.status == 200) {
				setMemes(resp.data.memes)
			}
		} catch (error) {
			console.log(error)
		} finally {
			setLoading(false)
		}
	}

	if (!user || !user.address) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p
					className="text-white text-2xl underline cursor-pointer"
					onClick={() => openAuthModal()}
				>
					Please connect your wallet
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center mx-4 md:mx-0 md:ml-20 lg:ml-0">
			<h2 className="text-[#29e0ca] text-2xl md:text-4xl font-medium text-center mb-5 md:mb-10">
				My Bookmarks
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full md:max-w-4xl mb-4">
				{memes &&
					memes.map((item, index) => (
						<div key={index} className="flex justify-center">
							<div className="w-full max-w-sm rounded overflow-hidden shadow-md">
								<img
									src={item.image_url}
									alt="Content"
									className="w-full aspect-square object-cover border-2 border-white"
								/>
								<div className="flex justify-between">
									<p className="font-medium text-lg md:text-xl">{item.name}</p>
								</div>
							</div>
						</div>
					))}

				<div className="col-span-full">
					{loading && (
						<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto" />
					)}
					{!loading && !memes && (
						<p className="text-center text-white text-2xl mx-auto">
							Meme not found
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

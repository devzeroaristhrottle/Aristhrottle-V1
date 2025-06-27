'use client'

import { Context } from '@/context/contextProvider'
import { Button } from '@chakra-ui/react'
import axiosInstance from '@/utils/axiosInstance'
import React, { useContext, useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { CgProfile } from 'react-icons/cg'

type Props = {}

// interface TabButtonProps {
//   label: string;
//   isActive: boolean;
// }

interface MyVotedMeme {
	id: string
	vote_by: {
		username: string
	}
	vote_to: {
		image_url: string
		name: string
		winning_number?: number
		in_percentile?: number
		createdAt: string
	}
}

export default function Page({}: Props) {
	const [loading, setLoading] = useState<boolean>(false)
	const [memes, setMemes] = useState<MyVotedMeme[]>([])

	const { userDetails } = useContext(Context)

	const offset = 6

	useEffect(() => {
		getMyMemes()
	}, [userDetails])

	const getMyMemes = async () => {
		try {
			if (!userDetails?._id) {
				throw new Error('User not found')
			}
			setLoading(true)
			const offsetI = offset
			const response = await axiosInstance.get(
				`/api/meme?vote_by=${userDetails._id}&offset=${offsetI}`
			)

			if (response.data.memes) {
				setMemes([...response.data.memes])
			}
		} catch (error) {
			console.log(error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex flex-col max-w-7xl mx-auto px-8">
			<div className="space-x-5 col-start-2 flex justify-center mb-6">
				<Button
					size="sm"
					variant="solid"
					className="border border-black px-7 rounded-full text-black bg-[#29e0ca] hover:scale-105"
				>
					Live{' '}
					<span className="relative flex h-3 w-3 items-center justify-center ml-1">
						<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
						<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
					</span>
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="border border-[#29e0ca] px-8 rounded-full text-[#29e0ca]  hover:scale-105"
				>
					All
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-8">
				{memes.map((item, index) => (
					<div key={index} className="p-4">
						<div className="flex justify-between items-center mb-1 mr-12">
							<div className="flex items-center gap-2">
								<CgProfile size={28} />
								<span className="text-[#29e0ca] text-2xl">
									{item.vote_by.username}
								</span>
							</div>
							{item.vote_to.winning_number ? (
								<p className="text-[#29e0ca] font-medium">
									#{item.vote_to.winning_number}
								</p>
							) : null}
						</div>

						<div className="flex gap-4">
							<div className="relative flex-grow">
								<img
									src={item.vote_to.image_url}
									alt="Content"
									className="w-full aspect-square object-cover border-2 border-white"
								/>
								<div className="flex justify-between text-2xl">
									<p>{item.vote_to.name}</p>
								</div>
							</div>

							{/* <div className="flex flex-col justify-between mb-7">
                <div>
                  <p className="text-[#1783fb] text-lg font-bold">
                    {item.votes}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-center">
                    <FaRegEye className="rotate-90" size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.views}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FaRegShareFromSquare size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.shares}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FaRegBookmark size={22} />
                    <span className="text-base text-[#1783fb]">
                      {item.saves}
                    </span>
                  </div>
                </div>
              </div> */}
						</div>
					</div>
				))}
				<div className="col-span-3">
					{loading && (
						<AiOutlineLoading3Quarters className="animate-spin text-3xl mx-auto col-span-12" />
					)}
					{!loading && memes.length == 0 && (
						<p className="text-center text-nowrap text-2xl mx-auto col-span-12">
							Meme not found
						</p>
					)}
				</div>
			</div>
		</div>
	)
}

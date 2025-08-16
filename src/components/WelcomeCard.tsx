'use client'
import React from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'
import { FiShare2 } from 'react-icons/fi'
import { IoTrophyOutline } from 'react-icons/io5'
import Image from 'next/image'

function WelcomeCard({
	isOpen,
	onClose,
}: {
	isOpen: boolean
	onClose: () => void
}) {
	return (
		<div
			hidden={!isOpen}
			className="h-full w-full fixed inset-0 backdrop-blur-xl top-0 left-0 flex justify-center items-center z-[500]"
		>
			<div className="md:w-[775px] md:h-[700px] bg-gradient-to-b from-[#040D28] to-[#0F335B]  rounded-xl border-2 border-[#0d4287]">
				<div className="w-full h-full flex items-center justify-evenly flex-col gap-3">
					<div className="text-[#28e0ca] sm:text-[3rem] text-[2rem] text-center px-3">
						Welcome to Aristhrottle beta 🚀
					</div>
					<div className="flex flex-col items-center justify-center w-full sm:ml-[40%] gap-4 ml-[10%]">
						<div className="flex flex-row justify-start items-center sm:text-[2.5rem] text-[1.5rem] w-full gap-8">
							<HiSparkles
								size={32}
								className="hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
							/>
							<div className="flex flex-row gap-2">
								<div className="text-[#28e0ca]">Create</div>
								<div>with Aris Intelligence</div>
							</div>
						</div>
						<div className="flex flex-row justify-start items-center sm:text-[2.5rem] text-[1.5rem] w-full gap-8">
							<IoCloudUploadOutline
								size={32}
								className="hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
							/>
							<div className="flex flex-row gap-2">
								<div className="text-[#28e0ca]">Upload</div>{' '}
								<div>your own content</div>
							</div>
						</div>
						<div className="flex flex-row justify-start items-center sm:text-[2.5rem] text-[1.5rem] w-full gap-8">
							<Image
								alt=""
								height={32}
								width={32}
								src={'/assets/vote/icon2.png'}
								className="hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
							/>
							<div className="flex flex-row gap-2">
								<div className="text-[#28e0ca]">Vote</div>
								<div> on contents</div>
							</div>
						</div>
						<div className="flex flex-row justify-start items-center sm:text-[2.5rem] text-[1.5rem] w-full gap-8">
							<FiShare2
								size={32}
								className="hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
							/>
							<div className="flex flex-row gap-2">
								<div className="text-[#28e0ca]">Refer</div>
								<div>other users</div>
							</div>
						</div>
						<div className="flex flex-row justify-start items-center sm:text-[2.5rem] text-[1.5rem] w-full gap-8">
							<IoTrophyOutline
								size={32}
								className="hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 flex items-center justify-center"
							/>
							<div className="flex flex-row gap-2">
								<div className="text-[#28e0ca]">Collect</div>{' '}
								<div>$eART Points</div>
							</div>
						</div>
					</div>
					<div className="w-full flex justify-evenly items-center sm:text-[2.5rem] text-[1.5rem] sm:flex-row flex-col-reverse gap-2 py-4">
						<button
							className="text-black bg-[#28e0ca] rounded-xl px-5"
							onClick={onClose}
						>
							Ready to Launch
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default WelcomeCard

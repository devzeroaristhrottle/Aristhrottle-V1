import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { IoCloudUpload, IoCloudUploadOutline } from 'react-icons/io5'
import { IoPodium, IoPodiumOutline } from 'react-icons/io5'
import { LuTrophy } from 'react-icons/lu'

function BottomNav() {
	const pathname = usePathname()

	return (
		<div className="bottom-0 w-full bg-black/90 py-3 flex flex-row justify-evenly items-center">
			<Link href="/mobile/rewards">
				<LuTrophy className="h-6 w-6" />
			</Link>
			<Link href="/mobile/upload">
				{pathname === '/mobile/upload' ? (
					<IoCloudUpload className="h-6 w-6" />
				) : (
					<IoCloudUploadOutline className="h-6 w-6" />
				)}
			</Link>
			<Link href="/mobile">
				<div className={pathname === '/mobile' ? 'scale-110' : ''}>
					<Image
						alt="side-bar-logo"
						height={48}
						quality={100}
						src="/assets/aris-logo.svg"
						width={48}
					/>
				</div>
			</Link>
			<Link href="/mobile/leaderboard">
				{pathname === '/mobile/leaderboard' ? (
					<IoPodium className="h-6 w-6" />
				) : (
					<IoPodiumOutline className="h-6 w-6" />
				)}
			</Link>
			<Link href="/mobile/saved">
				{pathname === '/mobile/saved' ? (
					<FaBookmark className="h-6 w-6" />
				) : (
					<FaRegBookmark className="h-6 w-6" />
				)}
			</Link>
		</div>
	)
}

export default BottomNav

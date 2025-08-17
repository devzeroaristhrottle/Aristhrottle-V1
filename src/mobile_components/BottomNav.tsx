import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { IoCloudUpload, IoCloudUploadOutline } from 'react-icons/io5'
import { IoPodiumOutline } from 'react-icons/io5'
import { LuTrophy } from 'react-icons/lu'
import { IoSearchSharp } from "react-icons/io5";


function BottomNav() {
	const pathname = usePathname()

	return (
		<div className="bottom-0 w-full bg-black/90 py-2 flex flex-row justify-evenly items-center">
			<Link href="/mobile/rewards">
				<div className="flex items-center flex-col gap-0">
					<LuTrophy className="h-5 w-5" />
					{pathname === '/mobile/rewards' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Rewards</div>}
				</div>
			</Link>
			<Link href="/mobile/upload">
				<div className="flex items-center flex-col gap-0">
					{pathname === '/mobile/upload' ? (
						<IoCloudUpload className="h-5 w-5" />
					) : (
						<IoCloudUploadOutline className="h-5 w-5" />
					)}
					{pathname === '/mobile/upload' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Upload</div>}
				</div>
			</Link>
			<Link href="/mobile">
				<div className="flex items-center flex-col gap-0">
					<Image
						alt="side-bar-logo"
						height={40}
						quality={100}
						src="/assets/aris-logo.svg"
						width={40}
					/>
					{pathname === '/mobile' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Home</div>}
				</div>
			</Link>
			<Link href="/mobile/search">
				<div className="flex items-center flex-col gap-0">
					<IoSearchSharp className="h-5 w-5" />
					{pathname === '/mobile/search' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Search</div>}
				</div>
			</Link>
			<Link href="/mobile/leaderboard">
				<div className="flex items-center flex-col gap-0">
					<IoPodiumOutline className="h-6 w-6" />
					{pathname === '/mobile/leaderboard' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Leaderboard</div>}
				</div>
			</Link>
		</div>
	)
}

export default BottomNav

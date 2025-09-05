import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'


function BottomNav() {
	const pathname = usePathname()

	return (
		<div className="bottom-0 w-full bg-black/90 py-2 flex flex-row justify-evenly items-center">
			<Link href="/mobile/rewards">
				<div className="flex items-center flex-col gap-0">
					{pathname === '/mobile/rewards' ? (
						<img src ='/assets/bottom_nav/Trophy_sel.png' className="h-5 w-5" />
					) : (
						<img src ='/assets/bottom_nav/Trophy.png' className="h-5 w-5" />
					)}
					{pathname === '/mobile/rewards' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Rewards</div>}
				</div>
			</Link>
			<Link href="/mobile/upload">
				<div className="flex items-center flex-col gap-0">
					{pathname === '/mobile/upload' ? (
						<img src ='/assets/bottom_nav/Upload_sel.png' className="h-5 w-5" />
					) : (
						<img src ='/assets/bottom_nav/Upload.png' className="h-5 w-5" />
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
					{pathname === '/mobile/search' ? (
						<img src ='/assets/bottom_nav/Search_sel.png' className="h-5 w-5" />
					) : (
						<img src ='/assets/bottom_nav/Search.png' className="h-5 w-5" />
					)}
					{pathname === '/mobile/search' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Search</div>}
				</div>
			</Link>
			<Link href="/mobile/leaderboard">
				<div className="flex items-center flex-col gap-0">
					{pathname === '/mobile/leaderboard' ? (
						<img src ='/assets/bottom_nav/Leaderboard_sel.png' className="h-7 w-6" />
					) : (
						<img src ='/assets/bottom_nav/Leaderboard.png' className="h-7 w-6" />
					)}
					{pathname === '/mobile/leaderboard' && <div className="text-[10px] leading-tight" style={{fontSize: '10px'}}>Leaderboard</div>}
				</div>
			</Link>
		</div>
	)
}

export default BottomNav

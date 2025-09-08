'use client'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { FaRegBookmark, FaUsers } from 'react-icons/fa'
import { GrCloudUpload } from 'react-icons/gr'
import { IoPodiumOutline } from 'react-icons/io5'
import { LuTrophy } from 'react-icons/lu'
import { HiOutlineDocumentText } from 'react-icons/hi'

// Define sidebar items configuration
const sidebarItems = [
	{
		title: 'Rewards',
		icon: (isActive: boolean) => (
			<div className="relative inline-block">
				<LuTrophy
					className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
						isActive ? 'text-[#1783FB]' : 'text-slate-100'
					}`}
				/>
				<span className="absolute -top-1 right-1 flex h-3 w-3 items-center justify-center">
					<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
					<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
				</span>
			</div>
		),
		action: (route: AppRouterInstance) => route.push('/home/rewards'),
	},
	{
		title: 'Leaderboard',
		icon: (isActive: boolean) => (
			<div className="relative inline-block">
				<IoPodiumOutline
					className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
						isActive ? 'text-[#1783FB]' : 'text-slate-100'
					}`}
				/>
				<span className="absolute -top-1 right-2 flex h-3 w-3 items-center justify-center">
					<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
					<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
				</span>
			</div>
		),
		action: (route: AppRouterInstance) => route.push('/home/leaderboard'),
	},

	{
		title: 'Home',
		icon: (isActive: boolean) => (
			<Image
				alt="side-bar-logo"
				className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
					isActive ? 'brightness-0 saturate-100 hue-rotate-[210deg] contrast-[2]' : 'text-slate-100'
				}`}
				height={52}
				quality={100}
				src="/assets/aris-logo.svg"
				width={50}
				style={{
					filter: isActive ? 'brightness(0) saturate(100%) invert(27%) sepia(96%) saturate(3207%) hue-rotate(210deg) brightness(101%) contrast(101%)' : 'none'
				}}
			/>
		),
		action: (route: AppRouterInstance) => route.push('/landing'),
	},
	{
		title: 'Upload',
		icon: (isActive: boolean) => (
			<GrCloudUpload
				className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
					isActive ? 'text-[#1783FB]' : 'text-slate-100'
				}`}
			/>
		),
		action: (route: AppRouterInstance) => route.push('/upload'),
	},
	// {
	// 	title: 'Saved',
	// 	icon: (isActive: boolean) => (
	// 		<FaRegBookmark
	// 			className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
	// 				isActive ? 'text-[#1783FB]' : 'text-slate-100'
	// 			}`}
	// 		/>
	// 	),
	// 	action: (route: AppRouterInstance) => route.push('/home/bookmark'),
	// },
	// {
	// 	title: 'Community',
	// 	icon: (isActive: boolean) => (
	// 		<FaUsers
	// 			className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
	// 				isActive ? 'text-[#1783FB]' : 'text-slate-100'
	// 			}`}
	// 		/>
	// 	),
	// 	action: (route: AppRouterInstance) => route.push('/home/community'),
	// },
	{
		title: 'Docs',
		icon: (isActive: boolean) => (
			<HiOutlineDocumentText
				className={`cursor-pointer h-12 w-12 transition-transform duration-150 ${
					isActive ? 'text-[#1783FB]' : 'text-slate-100'
				}`}
			/>
		),
		action: (route: AppRouterInstance) => route.push('/docs'),
	},
]

const Sidebar = () => {
	const route = useRouter()
	const pathname = usePathname()
	const itemRef = useRef(null)
	const [isHovered, setIsHovered] = useState(false)
	const [hoveredItem, setHoveredItem] = useState<string | null>(null)

	const getActiveTab = () => {
		if (pathname?.includes('leaderboard')) return 'Leaderboard'
		if (pathname?.includes('rewards')) return 'Rewards'
		if (pathname?.includes('upload')) return 'Upload'
		if (pathname?.includes('bookmark')) return 'Saved'
		if (pathname?.includes('community')) return 'Community'
		if (pathname?.includes('profile')) return 'Profile'
		if (pathname?.includes('docs')) return 'Docs'
		return 'Home'
	}

	const activeTab = getActiveTab()

	return (
		<>
			<div
				ref={itemRef}
				className="hidden md:fixed left-0 top-1/2 -translate-y-1/2 h-50vh md:flex items-center z-[100]"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="hidden md:flex flex-col items-start gap-6 p-4 hover:bg-[#4F4F4F2B] rounded-r-lg hover:backdrop-blur-2xl">
					{sidebarItems.map(item => {
						const isActive = activeTab === item.title
						return (
							<div key={item.title} onClick={() => item.action(route)}>
								<div
									onMouseEnter={() => setHoveredItem(item.title)}
									onMouseLeave={() => setHoveredItem(null)}
									className="hidden md:group md:flex gap-6 items-center justify-center p-2 rounded-lg cursor-pointer"
								>
									<div
										className={`${
											hoveredItem === item.title && !isActive ? 'scale-110' : ''
										}`}
									>
										{item.icon(isActive)}
									</div>
									{isHovered && (
										<span
											className={`text-xl font-medium transition-all duration-150 ${
												isActive
													? 'text-[#1783FB]'
													: hoveredItem === item.title
													? 'hover:scale-105'
													: 'text-white'
											}`}
										>
											{item.title}
										</span>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* For mobile */}
			<div className="md:hidden fixed bottom-0 left-0 w-full z-50 backdrop-blur-md bg-black/20">
				<div className="flex justify-around items-center py-3">
					{sidebarItems.map(item => {
						const isActive = activeTab === item.title
						return (
							<div
								key={item.title}
								onClick={() => item.action(route)}
								className="flex flex-col items-center cursor-pointer"
							>
								<div
									className={`transition-transform duration-150 ${
										isActive ? 'scale-110 text-[#1783FB]' : 'scale-100'
									}`}
								>
									<div className="h-6 w-6 flex items-center justify-center">
										{item.title === 'Home' ? (
											<Image
												alt="side-bar-logo"
												height={24}
												quality={100}
												src="/assets/aris-logo.svg"
												width={24}
												style={{
													filter: isActive ? 'brightness(0) saturate(100%) invert(27%) sepia(96%) saturate(3207%) hue-rotate(210deg) brightness(101%) contrast(101%)' : 'none'
												}}
											/>
										) : item.title === 'Upload' ? (
											<GrCloudUpload className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										) : item.title === 'Leaderboard' ? (
											<IoPodiumOutline className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										) : item.title === 'Rewards' ? (
											<LuTrophy className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										) : item.title === 'Community' ? (
											<FaUsers className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										) : item.title === 'Docs' ? (
											<HiOutlineDocumentText className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										) : (
											<FaRegBookmark className={`h-6 w-6 ${isActive ? 'text-[#1783FB]' : 'text-white'}`} />
										)}
									</div>
								</div>
								{/* Show title below icon only when active on mobile */}
								{isActive && (
									<span className="text-xs mt-1 text-[#1783FB]">
										{item.title}
									</span>
								)}
							</div>
						)
					})}
				</div>
			</div>
		</>
	)
}

export default Sidebar
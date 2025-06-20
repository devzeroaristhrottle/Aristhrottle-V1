import useNotifications, { Notification } from '@/app/hooks/useNotifications'
import {
	Button,
	PopoverBody,
	PopoverContent,
	PopoverRoot,
	PopoverTrigger,
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { CgCloud } from 'react-icons/cg'
import {
	FaCaretDown,
	FaCaretUp,
	FaDollarSign,
	FaThumbsUp,
} from 'react-icons/fa'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { TbSortDescending } from 'react-icons/tb'

const groupNotificationsByDate = (notifications: Notification[]) => {
	const today = new Date()
	const yesterday = new Date()
	yesterday.setDate(today.getDate() - 1)

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		if (date.toDateString() === today.toDateString()) return 'Today'
		if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
		return 'Earlier'
	}

	return notifications.reduce(
		(acc: Record<string, Notification[]>, notification) => {
			const category = formatDate(notification.createdAt)
			if (!acc[category]) acc[category] = []
			acc[category].push(notification)
			return acc
		},
		{ Today: [], Yesterday: [], Earlier: [] }
	)
}

const getNotificationIcon = (type: Notification['type']) => {
	switch (type) {
		case 'info':
			return IoMdNotificationsOutline
		case 'success':
			return FaThumbsUp
		case 'error':
			return FaDollarSign
		case 'warning':
			return CgCloud
		default:
			return IoMdNotificationsOutline
	}
}

const Notifications = () => {
	const { notifications } = useNotifications()
	const groupedNotifications = groupNotificationsByDate(
		notifications?.message || []
	)

	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({
		Today: true,
		Yesterday: true,
		Earlier: true,
	})

	const toggleSection = (section: string) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section],
		}))
	}

	return (
		<PopoverRoot>
			<PopoverTrigger asChild>
				<div className="relative inline-block">
					<IoMdNotificationsOutline className="cursor-pointer" size={30} />
					<span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
						<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
						<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
					</span>
				</div>
			</PopoverTrigger>
			<PopoverContent className="bg-[#141e29] absolute right-2 md:right-6 top-10 md:top-16 mt-5 text-white py-3 md:py-6 px-4 md:px-8 z-index-10">
				<PopoverBody className="bg-[#141e29] p-0">
					<div className="flex justify-between mb-2 md:mb-6">
						<h1 className="text-[#29e0ca] text-3xl">Notifications</h1>
						<PopoverRoot>
							<PopoverTrigger asChild>
								<Button
									size="xs"
									variant="outline"
									className="border-2 border-[#1783fb] rounded-full text-[#1783fb] px-2"
								>
									<TbSortDescending size={12} />
									<span className="text-sm font-bold">Filter</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="bg-slate-700 top-9 right-16">
								<PopoverBody className="py-1 px-2">
									Filter options here
								</PopoverBody>
							</PopoverContent>
						</PopoverRoot>
					</div>

					{Object.entries(groupedNotifications).map(([date, items]) => (
						<div key={date} className="mb-4">
							{/* Section header with collapse/expand icon */}
							<div
								className="flex items-center justify-between mb-2 cursor-pointer"
								onClick={() => toggleSection(date)}
							>
								<div className="flex items-center gap-1">
									<span className="text-[#1783fb]">{date}</span>
									{expandedSections[date] ? (
										<FaCaretUp fill="#1783fb" size={16} />
									) : (
										<FaCaretDown fill="#1783fb" size={16} />
									)}
								</div>
							</div>

							{/* Render notifications if the section is expanded */}
							{expandedSections[date] && (
								<div>
									{items.length > 0 ? (
										items.map(notification => {
											const Icon = getNotificationIcon(notification.type)
											return (
												<div
													key={notification._id}
													className="flex items-start text-base"
												>
													<Icon className="mr-1 mt-0.5" size={18} />
													<span>{notification.message}</span>
												</div>
											)
										})
									) : (
										<p className="text-gray-600 text-sm">No notifications</p>
									)}
								</div>
							)}
						</div>
					))}
				</PopoverBody>
			</PopoverContent>
		</PopoverRoot>
	)
}

export default Notifications

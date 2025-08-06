'use client'

import React, { useState } from 'react'
import useNotifications, { Notification } from '@/app/hooks/useNotifications'
import { FaCaretDown, FaCaretUp, FaDollarSign, FaThumbsUp } from 'react-icons/fa'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { CgCloud } from 'react-icons/cg'
import Navbar from '@/mobile_components/Navbar'
import BottomNav from '@/mobile_components/BottomNav'

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

export default function NotificationsPage() {
	const { notifications } = useNotifications()
	const groupedNotifications = groupNotificationsByDate(
		notifications?.message || []
	)

	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
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
		<div className="min-h-screen bg-black text-white flex flex-col">
			{/* Top Navbar */}
			<Navbar />

			{/* Content */}
			<div className="flex-1 overflow-y-auto pb-20">{/* Add pb-20 to account for bottom nav */}

			{/* Notifications List */}
			<div className="p-4">
				{Object.entries(groupedNotifications).map(([date, items]) => (
					<div key={date} className="mb-6">
						{/* Section header with collapse/expand icon */}
						<div
							className="flex items-center justify-between mb-2 cursor-pointer"
							onClick={() => toggleSection(date)}
						>
							<div className="flex items-center gap-1">
								<span className="text-[#1783fb] font-medium">{date}</span>
								{expandedSections[date] ? (
									<FaCaretUp className="text-[#1783fb]" size={16} />
								) : (
									<FaCaretDown className="text-[#1783fb]" size={16} />
								)}
							</div>
						</div>

						{/* Notifications */}
						{expandedSections[date] && (
							<div className="space-y-4">
								{items.length > 0 ? (
									items.map(notification => {
										const Icon = getNotificationIcon(notification.type)
										return (
											<div
												key={notification._id}
												className="flex items-start gap-3 bg-white/5 p-3 rounded-lg"
											>
												<Icon className="mt-1 text-[#1783fb]" size={20} />
												<div className="flex-1">
													<p className="text-sm">{notification.message}</p>
													<span className="text-xs text-gray-400 mt-1 block">
														{new Date(notification.createdAt).toLocaleTimeString(
															'en-US',
															{
																hour: 'numeric',
																minute: 'numeric',
																hour12: true,
															}
														)}
													</span>
												</div>
											</div>
										)
									})
								) : (
									<p className="text-gray-400 text-sm text-center py-4">
										No notifications for {date.toLowerCase()}
									</p>
								)}
							</div>
						)}
					</div>
				))}

				{/* Empty State */}
				{(!notifications?.message || notifications.message.length === 0) && (
					<div className="flex flex-col items-center justify-center py-12">
						<IoMdNotificationsOutline
							className="text-gray-600 mb-4"
							size={48}
						/>
						<p className="text-gray-400 text-center">
							You don&apos;t have any notifications yet
						</p>
					</div>
				)}
			</div>
			</div>

			{/* Bottom Navigation */}
			<div className="fixed bottom-0 left-0 right-0">
				<BottomNav />
			</div>
		</div>
	)
}
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { CgCloseO } from 'react-icons/cg'
import {
	FaFacebookF,
	FaWhatsapp,
	FaTwitter,
	FaTelegramPlane,
} from 'react-icons/fa'

const socialPlatforms = [
	{ name: 'facebook', icon: <FaFacebookF />, label: 'Facebook' },
	{ name: 'whatsapp', icon: <FaWhatsapp />, label: 'WhatsApp' },
	{ name: 'twitter', icon: <FaTwitter />, label: 'Twitter' },
	{ name: 'telegram', icon: <FaTelegramPlane />, label: 'Telegram' },
]

interface ShareProps {
	isOpen?: boolean
	onClose?: () => void
	onShare?: () => void
	imageUrl?: string
	id?: string
}

const Share = ({
	isOpen = true,
	onClose = () => {},
	onShare = () => {},
	imageUrl,
	id,
}: ShareProps) => {
	const { userDetails } = useContext(Context)
	const [isSharing, setIsSharing] = useState(false)

	// Check Web Share API support
	const isWebShareSupported = () => {
		return 'share' in navigator && window.isSecureContext
	}

	// Check if files can be shared
	const canShareFiles = (files: File[]) => {
		return navigator.canShare && navigator.canShare({ files })
	}

	const addShare = async (memeId: string, userId: string) => {
		try {
			const response = await axiosInstance.post('/api/share', {
				memeId,
				userId,
			})
			return response.data
		} catch (error) {
			console.error('Failed to record share:', error)
			return null
		}
	}

	const shareMessage =
		'🎭 Check out this amazing content on Aristhorttle! Vote, engage, and earn exclusive rewards! 🏆✨ Join the community and discover incredible content while earning prizes! #Aristhorttle #VoteToEarn #Rewards'

	const shareUrl = `${process.env.NEXT_PUBLIC_API_URL}/home?id=${id}&ref=share`

	// Combined message with URL for better sharing
	const fullShareMessage = `${shareMessage}\n\n${shareUrl}`

	const handleNativeShare = async () => {
		setIsSharing(true)

		try {
			// Record the share first
			if (id && userDetails?._id) {
				await addShare(id, userDetails._id)
				onShare()
			}

			const shareData: ShareData = {
				title: 'Aristhorttle - Vote & Earn Rewards!',
				text: fullShareMessage,
				url: shareUrl,
			}

			// Try to share with image if available
			if (imageUrl) {
				try {
					const response = await fetch(imageUrl)
					if (response.ok) {
						const blob = await response.blob()
						const file = new File([blob], 'aristhorttle-content.jpg', {
							type: blob.type || 'image/jpeg',
						})

						// Check if files can be shared
						if (canShareFiles([file])) {
							shareData.files = [file]
						}
					}
				} catch (error) {
					console.warn('Failed to fetch image for sharing:', error)
					toast.info('Sharing without image - image could not be loaded')
				}
			}

			// Check if we can share the data
			if (navigator.canShare && !navigator.canShare(shareData)) {
				throw new Error('Cannot share this data')
			}

			await navigator.share(shareData)
			toast.success('Content shared successfully!')
		} catch (error: any) {
			console.error('Native sharing failed:', error)

			if (error.name === 'AbortError') {
				toast.info('Share canceled')
			} else if (error.name === 'NotAllowedError') {
				toast.error('Sharing not allowed. Please try again.')
			} else {
				toast.error('Failed to share. Trying alternative method...')
				// Fall back to URL sharing
				handleUrlShare('twitter') // Default fallback
			}
		} finally {
			setIsSharing(false)
		}
	}

	const handleUrlShare = async (platform: string) => {
		setIsSharing(true)

		try {
			// Record the share
			if (id && userDetails?._id) {
				await addShare(id, userDetails._id)
				onShare()
			}

			// For better platform-specific sharing, use the full message
			const platformMessage = fullShareMessage
			let shareLink = ''

			switch (platform) {
				case 'whatsapp':
					// WhatsApp handles text and URL together well
					shareLink = `https://wa.me/?text=${encodeURIComponent(
						platformMessage
					)}`
					break
				case 'telegram':
					// Telegram prefers separate text and URL
					shareLink = `https://t.me/share/url?url=${encodeURIComponent(
						shareUrl
					)}&text=${encodeURIComponent(shareMessage)}`
					break
				case 'twitter':
					// Twitter has character limits, so optimize the message
					const twitterMessage =
						shareMessage.length > 200
							? shareMessage.substring(0, 200) + '...'
							: shareMessage
					shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
						twitterMessage
					)}&url=${encodeURIComponent(shareUrl)}`
					break
				case 'facebook':
					// Facebook takes the message as quote parameter
					shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
						shareUrl
					)}&quote=${encodeURIComponent(shareMessage)}`
					break
				default:
					shareLink = shareUrl
			}

			// Open share link
			const shareWindow = window.open(
				shareLink,
				'_blank',
				'width=600,height=600,scrollbars=yes,resizable=yes'
			)

			if (shareWindow) {
				toast.success(`Opening ${platform} to share...`)

				// Check if window was closed (user completed sharing)
				const checkClosed = setInterval(() => {
					if (shareWindow.closed) {
						clearInterval(checkClosed)
						toast.info('Share window closed')
					}
				}, 1000)

				// Clean up interval after 30 seconds
				setTimeout(() => clearInterval(checkClosed), 30000)
			} else {
				toast.error('Pop-up blocked. Please allow pop-ups and try again.')
			}
		} catch (error) {
			console.error('URL sharing failed:', error)
			toast.error('Failed to open share link')
		} finally {
			setIsSharing(false)
		}
	}

	const handleCustomShare = async (platform: string) => {
		// Use native share for modern browsers, fall back to URL sharing
		if (isWebShareSupported() && platform === 'native') {
			await handleNativeShare()
		} else {
			await handleUrlShare(platform)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
			<div className="relative w-[90vw] max-w-xl bg-[#141e29] border-2 border-[#1783fb] rounded-xl p-6 max-h-[90vh] overflow-y-auto">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-white text-xl hover:text-red-400 transition-colors"
					disabled={isSharing}
				>
					<CgCloseO size={24} />
				</button>

				{imageUrl && (
					<div className="flex justify-center mb-6">
						<div className="h-96 w-96 border-2 border-white rounded">
							<img
								src={imageUrl}
								alt="Shared content"
								className="w-full h-full object-cover rounded"
								loading="lazy"
							/>
						</div>
					</div>
				)}

				<div className="text-center">
					<p className="font-medium text-xl md:text-2xl text-white mb-4">
						Share with your Friends
					</p>

					{/* Native Share Button (if supported) */}
					{isWebShareSupported() && (
						<div className="mb-4">
							<button
								onClick={() => handleCustomShare('native')}
								disabled={isSharing}
								className="bg-gradient-to-r from-[#1783fb] to-[#0f6fd1] hover:from-[#0f6fd1] hover:to-[#0d5bb8] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSharing ? (
									<>
										<div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Sharing...
									</>
								) : (
									'Share via System'
								)}
							</button>
							<p className="text-sm text-gray-400 mt-2">
								Use your device&apos;s native sharing options
							</p>
							<div className="border-t border-gray-600 my-4"></div>
						</div>
					)}

					{/* Social Platform Buttons */}
					<div className="flex justify-center">
						<div className="flex flex-wrap justify-center gap-4">
							{socialPlatforms.map(({ name, icon, label }) => (
								<button
									key={name}
									onClick={() => handleCustomShare(name)}
									disabled={isSharing}
									className="bg-[#1783fb] hover:bg-[#0f6fd1] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
									title={`Share on ${label}`}
								>
									{isSharing ? (
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									) : (
										icon
									)}
								</button>
							))}
						</div>
					</div>

					<p className="text-xs text-gray-400 mt-4 px-4">{shareMessage}</p>
					<p className="text-xs text-gray-500 mt-2">
						Choose a platform to share this content with the message above
					</p>
				</div>
			</div>
		</div>
	)
}

export default Share

'use client'

import axiosInstance from '@/utils/axiosInstance'
import { useUser } from '@account-kit/react'
import { useEffect, useRef, useState } from 'react'
import { CgCloseO, CgProfile } from 'react-icons/cg'
import { FaUserPlus } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Loader from '@/components/Loader'
import {EditProfileProps } from '@/mobile_components/types'

const PREDEFINED_PROFILE_PICS = [
	'/assets/profile_pics/coin.png',
	'/assets/profile_pics/grandpa1.png',
	'/assets/profile_pics/m_1.png',
	'/assets/profile_pics/w_1.png',
	'/assets/profile_pics/w_2.png',
	'/assets/profile_pics/w_3.png',
]

const CONTENT_PREFERENCES = [
	'Memes',
	'GIFs',
	'Videos',
	'Art',
	'Gaming',
	'Music',
	'Tech',
	'Sports',
	'Food',
	'Travel',
]

export default function MobileEditProfile({
	isOpen,
	onCancel,
	formData,
	setFormData,
	onProfileUpdate,
}: EditProfileProps) {
	const user = useUser()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Improved image handling
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null
		if (
			file &&
			file.size <= 10 * 1024 * 1024 &&
			['image/jpeg', 'image/png'].includes(file.type)
		) {
			setPreview(URL.createObjectURL(file))
			setFormData(prev => ({ ...prev, file }))
		} else {
			toast.error('Please select a JPG or PNG file under 10MB')
		}
	}

	const handleRemoveImage = () => {
		setPreview(null)
		setFormData(prev => ({ ...prev, file: null }))
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	const handlePredefinedImageSelect = (imagePath: string) => {
		setPreview(imagePath)
		// We'll handle the predefined image selection on the server side
		setFormData(prev => ({ ...prev, file: null }))
	}

	const handlePreferredContentToggle = (content: string) => {
		setFormData(prev => {
			const isSelected = prev.preferredContent.includes(content)
			if (isSelected) {
				return {
					...prev,
					preferredContent: prev.preferredContent.filter(
						item => item !== content
					),
				}
			} else if (prev.preferredContent.length < 5) {
				return {
					...prev,
					preferredContent: [...prev.preferredContent, content],
				}
			}
			return prev
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const submitData = new FormData()
		if (formData?.file) {
			submitData.append('file', formData.file)
		}
		if (preview && !formData.file) {
			submitData.append('predefined_profile_pic', preview)
		}
		if (formData?.bio) {
			submitData.append('bio', formData.bio)
		}
		if (formData?.title) {
			submitData.append('username', formData.title)
		}
		if (formData?.preferredContent) {
			submitData.append(
				'preferred_content',
				JSON.stringify(formData.preferredContent)
			)
		}
		submitData.append('user_wallet_address', user?.address || '')

		try {
			const response = await axiosInstance.put('/api/user', submitData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})
			if (response.status === 200) {
				toast.success('Profile updated successfully!')
				// Call the onProfileUpdate callback with the updated data
				if (onProfileUpdate) {
					onProfileUpdate({
						username: formData.title,
						bio: formData.bio,
						profile_pic: preview || undefined,
						preferred_content: formData.preferredContent
					})
				}
				onCancel()
			} else {
				toast.error('Failed to update profile. Please try again.')
			}
		} catch (error) {
			console.error('Error updating profile: ', error)
			toast.error('Failed to update profile. Please try again.')
		}
	}

	const getProfileData = async () => {
		try {
			setIsLoading(true)
			const response = await axiosInstance.get(
				`/api/user?wallet=${user?.address}`
			)
			const userData = response?.data?.user
			setFormData(prev => ({
				...prev,
				title: userData?.username || '',
				bio: userData?.bio || '',
				preferredContent: userData?.preferred_content || [],
			}))
			if (userData?.profile_pic) {
				setPreview(userData.profile_pic)
			}
		} catch (error) {
			console.error('Error loading profile data: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		getProfileData()
	}, [])

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
			{isLoading ? (
				<Loader />
			) : (
				<div className="relative w-full max-w-md mx-4 rounded-lg shadow-xl overflow-y-auto max-h-[90vh]" style={{backgroundColor: "#000"}}>
					<button
						onClick={onCancel}
						className="absolute right-4 top-4 text-gray-400 hover:text-white"
					>
						<CgCloseO className="w-6 h-6" />
					</button>

					<form onSubmit={handleSubmit} className="p-6 space-y-6">
						<div className="text-center">
							<h2 className="text-xl font-bold text-white mb-4">
								Edit Profile
							</h2>

							{/* Profile Picture Section */}
							<div className="relative mx-auto w-32 h-32 mb-4">
								{preview ? (
									<div className="relative">
										<img
											src={preview}
											alt="Profile preview"
											className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
										/>
										<button
											type="button"
											onClick={handleRemoveImage}
											className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
										>
											<CgCloseO className="w-4 h-4 text-white" />
										</button>
									</div>
								) : (
									<CgProfile className="w-24 h-24 text-gray-400" />
								)}
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2"
								>
									<FaUserPlus className="w-4 h-4 text-white" />
								</button>
								<input
									type="file"
									ref={fileInputRef}
									className="hidden"
									onChange={handleFileChange}
									accept="image/jpeg,image/png"
								/>
							</div>

							{/* Predefined Profile Pictures */}
							<div className="flex flex-row gap-3 mb-6">
								{PREDEFINED_PROFILE_PICS.map(pic => (
									<button
										key={pic}
										type="button"
										onClick={() => handlePredefinedImageSelect(pic)}
										className={`relative rounded-lg overflow-hidden aspect-square ${
											preview === pic ? 'ring-2 ring-blue-500' : ''
										}`}
									>
										<img
											src={pic}
											alt="Profile option"
											className="w-full h-full object-cover"
										/>
									</button>
								))}
							</div>

							{/* Username Input */}
							<input
								type="text"
								placeholder="Username"
								className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
								value={formData.title}
								onChange={e =>
									setFormData(prev => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>

						{/* Bio Input */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400">Bio</label>
							<textarea
								placeholder="Tell us about yourself..."
								className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
								rows={4}
								maxLength={200}
								value={formData.bio}
								onChange={e =>
									setFormData(prev => ({ ...prev, bio: e.target.value }))
								}
							/>
						</div>

						{/* Preferred Content */}
						<div className="space-y-2">
							<label className="text-sm text-gray-400">
								Preferred Content (Select up to 5)
							</label>
							<div className="flex flex-wrap gap-2">
								{CONTENT_PREFERENCES.map(content => (
									<button
										key={content}
										type="button"
										onClick={() => handlePreferredContentToggle(content)}
										className={`px-3 py-1 rounded-full text-sm ${
											formData.preferredContent.includes(content)
												? 'bg-blue-500 text-white'
												: 'bg-gray-800 text-gray-300 border border-gray-700'
										}`}
									>
										{content}
									</button>
								))}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<button
								type="button"
								onClick={onCancel}
								className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
							>
								Save Changes
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	)
}

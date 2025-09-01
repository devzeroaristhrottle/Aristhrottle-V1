'use client'
import React, { useState, useRef, useContext, useEffect } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline, IoSaveOutline } from 'react-icons/io5'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import { toast } from 'react-toastify'
import { getTimeUntilReset } from '@/utils/dateUtils'
import axios from 'axios'

interface Tags {
	name: string
	_id?: string
}

function Page() {
	const { setUserDetails, userDetails } = useContext(Context)
	const [title, setTitle] = useState('')
	const [selectedTags, setSelectedTags] = useState<Tags[]>([])
	const [filteredTags, setFilteredTags] = useState<Tags[]>([])
	const [newTagInput, setNewTagInput] = useState('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const { openAuthModal } = useAuthModal()
	const user = useUser()
	const titleRef = useRef<HTMLInputElement>(null)

	// Check for generation reset when component loads
	useEffect(() => {
		if (user && user.address && userDetails) {
			checkGenerationReset()
		}
	}, [user, userDetails])

	const checkGenerationReset = async () => {
		try {
			const response = await axiosInstance.get('/api/user/check-generations')
			if (response.data.wasReset && userDetails) {
				// Update local user state if generations were reset
				setUserDetails({
					...userDetails,
					generations: 0,
				})
				toast.info('Your daily generation limit has been reset!')
			}
		} catch (error) {
			console.error('Error checking generation reset:', error)
		}
	}

	useEffect(() => {
		const timer = setTimeout(() => {
			findTag()
		}, 400)
		return () => {
			clearTimeout(timer)
		}
	}, [newTagInput])

	const findTag = async () => {
		if (newTagInput.length > 0) {
			const response = await axiosInstance.get(`/api/tags?name=${newTagInput}`)

			if (response.data.tags) {
				setFilteredTags([...response.data.tags])
			}
		} else {
			setFilteredTags([])
		}
	}

	const handleTagSelect = (tag: string, isNew: boolean, id: string) => {
		if (selectedTags.length >= 5) return

		if (!selectedTags.some(t => t.name === tag)) {
			setSelectedTags(prev => [...prev, { name: tag, isNew: isNew, id: id }])
		}
	}

	const handleNewTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (
			(e.key === 'Enter' || e.key === 'Tab') &&
			newTagInput.trim() &&
			selectedTags.length < 5
		) {
			// Check if the exact tag already exists in selected tags
			if (!selectedTags.some(tag => tag.name === newTagInput.trim())) {
				// Check if the exact tag exists in filtered tags
				const existingTag = filteredTags.find(
					tag => tag.name === newTagInput.trim()
				)
				if (existingTag) {
					// If it exists in filtered tags, use that
					handleTagSelect(existingTag.name, false, existingTag._id || '')
				} else {
					// If it doesn't exist, create new tag
					setSelectedTags(prev => [
						...prev,
						{ name: newTagInput.trim(), isNew: true, _id: undefined },
					])
				}
				setNewTagInput('')
				setFilteredTags([])
			}
		}
	}

	const removeTag = (tagTitle: string) => {
		setSelectedTags(prev => prev.filter(tag => tag.name !== tagTitle))
	}

	const getImage = async () => {
		if (!user || !user.address) {
			if (openAuthModal) {
				openAuthModal()
			}
			return
		}
		if (!title || selectedTags.length < 1) {
			toast.error('Please add a title and at least a tag to continue')
			titleRef.current?.focus()
			return
		}
		try {
			setIsGenerating(true)
			if (userDetails) {
				if (userDetails.generations >= 5) {
					toast.error(
						'You have reached your daily generation limit of 5 images! Limit resets daily.'
					)
					setIsGenerating(false)
					return
				}
				setUserDetails({
					...userDetails,
					generations: userDetails.generations + 1,
				})
			}
			const tagNames = selectedTags.map(tag => tag.name)

			// Use our backend API as a proxy instead of directly calling the external service
			const response = await axiosInstance.post(
				'/api/generate-image',
				{
					title,
					tags: tagNames,
				},
				{
					responseType: 'blob', // Important for handling binary data
					timeout: 180000, // 3 minute timeout (longer than backend to account for network)
				}
			)

			// Create blob URL from the response
			const imageBlob = new Blob([response.data], { type: 'image/png' })
			const imageUrl = URL.createObjectURL(imageBlob)
			setGeneratedImage(imageUrl)
		} catch (error) {
			console.error('Error generating image:', error)
			if (userDetails) {
				// Revert the optimistic update
				setUserDetails({
					...userDetails,
					generations: Math.max(0, userDetails.generations),
				})
			}

			// Show appropriate error message
			const err = error as any // Type assertion to handle error properties
			if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
				toast.error(
					'The image generation timed out. Please try again with a simpler prompt.'
				)
			} else if (err.response?.status === 403) {
				toast.error('Daily generation limit reached.')
			} else {
				toast.error(
					'Error generating Content: Please change title and tags and try again!'
				)
			}
		} finally {
			setIsGenerating(false)
		}
	}

	const handleFileSelect = () => {
		if (!userDetails) {
			openAuthModal()
			return
		}
		fileInputRef.current?.click()
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
			const fileUrl = URL.createObjectURL(file)
			setGeneratedImage(fileUrl)
		}
	}

	const handleUpload = async () => {
		if (!user || !user.address) {
			if (openAuthModal) {
				openAuthModal()
			}
			return
		}

		if (generatedImage) {
			if (selectedTags.length < 1) {
				toast.error('Please enter at least one tag')
				return
			}

			try {
				setIsUploading(true)

				const response = await fetch(generatedImage)
				const blob = await response.blob()

				// Create FormData for meme upload
				const formData = new FormData()
				const reqTag = selectedTags.map(tag => tag.name)
				formData.append('name', title)
				formData.append('file', blob, 'image.png')
				formData.append('created_by', userDetails!._id)
				formData.append('tags', JSON.stringify(reqTag))

				const uploadResponse = await axiosInstance.post('/api/meme', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					timeout: 180000,
				})

				if (uploadResponse.status === 201) {
					console.log('Content uploaded successfully:', uploadResponse.data)

					// Reset form after successful upload
					setTitle('')
					setSelectedTags([])
					setGeneratedImage(null)

					toast.success('Content uploaded successfully!')
				} else {
					throw new Error('Upload failed')
				}
			} catch (error) {
				console.error('Error uploading meme:', error)

				// Provide more specific error messages based on error type
				if (axios.isAxiosError(error)) {
					if (error.code === 'ECONNABORTED') {
						toast.error(
							'Upload timed out. Please try with a smaller image or check your connection.'
						)
					} else if (error.response) {
						// Server responded with an error status
						const errorMessage =
							error.response.data?.message || 'Failed to upload Content'
						toast.error(`Upload failed: ${errorMessage}`)
					} else if (error.request) {
						// Request was made but no response received
						toast.error(
							'No response from server. Please check your connection and try again.'
						)
					} else {
						toast.error('Failed to upload Content. Please try again.')
					}
				} else {
					toast.error('Failed to upload Content. Please try again.')
				}
			} finally {
				setIsUploading(false)
			}
		}
	}

	const handleSaveToDrafts = async () => {
		if (!user || !user.address) {
			if (openAuthModal) {
				openAuthModal()
			}
			return
		}

		if (!generatedImage) {
			toast.error('No image to save')
			return
		}

		if (!title) {
			toast.error('Please add a title')
			titleRef.current?.focus()
			return
		}

		if (selectedTags.length < 1) {
			toast.error('Please enter at least one tag')
			return
		}

		try {
			setIsSavingDraft(true)

			const response = await fetch(generatedImage)
			const blob = await response.blob()

			// Create FormData for draft meme
			const formData = new FormData()
			const reqTag = selectedTags.map(tag => tag.name)
			formData.append('name', title)
			formData.append('file', blob, 'image.png')
			formData.append('tags', JSON.stringify(reqTag))

			const draftResponse = await axiosInstance.post(
				'/api/draft-meme',
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
					timeout: 180000,
				}
			)

			if (draftResponse.status === 201 || draftResponse.status === 200) {
				toast.success('Saved to drafts successfully!')
			} else {
				throw new Error('Failed to save draft')
			}
		} catch (error) {
			console.error('Error saving draft:', error)

			if (axios.isAxiosError(error)) {
				if (error.code === 'ECONNABORTED') {
					toast.error(
						'Save timed out. Please try with a smaller image or check your connection.'
					)
				} else if (error.response) {
					const errorMessage =
						error.response.data?.message || 'Failed to save draft'
					toast.error(`Save failed: ${errorMessage}`)
				} else if (error.request) {
					toast.error(
						'No response from server. Please check your connection and try again.'
					)
				} else {
					toast.error('Failed to save draft. Please try again.')
				}
			} else {
				toast.error('Failed to save draft. Please try again.')
			}
		} finally {
			setIsSavingDraft(false)
		}
	}

	return (
		<div className="px-4 py-6">
				{/* Image Upload Section */}
				<div className="w-full h-full pb-5">
					{isGenerating ? (
						<div className="flex flex-col justify-center items-center border border-[#2FCAC7] rounded-xl p-3 hover:shadow-lg hover:shadow-[#2FCAC7]/20 transition-all duration-300 cursor-pointer hover:border-[#2FCAC7] h-64">
							<div className="w-20 h-20 border-4 border-[#2FCAC7]/30 border-t-[#2FCAC7] rounded-full animate-spin"></div>
							<div className="mt-4 text-center">
								<p className="text-[#2FCAC7] font-medium">
									Generating your content...
								</p>
								<p className="text-gray-400 text-xs mt-1">
									Please don&apos;t refresh the page.
								</p>
							</div>
						</div>
					) : generatedImage ? (
						/* Image Display */
						<div
							className="w-full flex flex-col items-center"
							onClick={handleFileSelect}
							title="Click to select a different image"
						>
							<div className="w-full border border-[#2FCAC7] rounded-xl p-3 hover:shadow-lg hover:shadow-[#2FCAC7]/20 transition-all duration-300 cursor-pointer hover:border-[#2FCAC7] h-fit">
								<img
									src={generatedImage}
									alt="Generated content"
									className="w-full aspect-square object-contain rounded hover:opacity-90 transition-opacity duration-200"
								/>
							</div>

							<p className="text-sm text-gray-400 mt-2 text-center">
								Click to select a different image
							</p>
						</div>
					) : (
						/* Upload Instructions */
						<div className="border h-1/2 flex flex-col justify-between border-white rounded-xl p-4 text-gray-400 hover:border-[#2FCAC7] transition-all duration-300 hover:shadow-lg hover:shadow-[#2FCAC7]/20">
							{/* AI Instructions */}
							<div
								className="flex-1 flex justify-center items-center cursor-pointer"
								onClick={getImage}
							>
								<div className="flex flex-col items-center text-center">
									<HiSparkles
										size={32}
										className="text-[#2FCAC7] hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0 mb-2"
									/>
									<div className="text-[#2FCAC7] text-xl hover:text-white transition-colors duration-200 mb-1">
										Create with Aris Intelligence
									</div>
									<div className="text-xs">
										Enter title and tags (at least one)
									</div>
								</div>
							</div>

							{/* Divider */}
							<div className="flex items-center w-full gap-3 my-4">
								<div className="flex-1 border-t border-[#86878B] hover:border-[#2FCAC7] transition-colors duration-300"></div>
								<span className="px-2 text-xs font-medium hover:text-[#2FCAC7] transition-colors duration-200">
									or
								</span>
								<div className="flex-1 border-t border-[#86878B] hover:border-[#2FCAC7] transition-colors duration-300"></div>
							</div>

							{/* Manual Upload */}
							<div
								className="flex-1 flex justify-center items-center cursor-pointer"
								onClick={handleFileSelect}
							>
								<div className="flex flex-col items-center text-center">
									<IoCloudUploadOutline
										size={32}
										className="text-[#2FCAC7] hover:scale-110 transition-transform duration-200 mb-2"
									/>
									<div className="text-[#2FCAC7] text-2xl mb-1">Choose File</div>
									<div className="text-xs">JPG / PNG Max. 10 MB</div>
								</div>
							</div>
						</div>
					)}

					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg"
						onChange={handleFileChange}
						className="hidden"
					/>

					{/* Form Fields */}
					<div className="mt-6 space-y-4">
						{/* Title Input */}
						<div className="flex flex-col group">
							<label className="text-lg mb-1 group-hover:text-[#2FCAC7] transition-colors duration-200">
								Title
							</label>
							<div className="relative">
								<textarea
									placeholder="Enter title"
									value={title}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setTitle(e.target.value)
									}
									maxLength={100}
									rows={2}
									className="bg-transparent border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none border-[#2FCAC7] hover:border-[#2FCAC7] focus:border-[#2FCAC7] focus:shadow-lg focus:shadow-[#2FCAC7]/20 transition-all duration-200 w-full resize-none"
									ref={titleRef as any}
								/>
								<span
									className={`absolute bottom-2 right-3 text-xs ${
										title.length >= 100 ? 'text-red-400' : 'text-gray-400'
									}`}
								>
									{title.length}/100
								</span>
							</div>
						</div>

						{/* Tags Input */}
						<div className="flex flex-col group">
							<label className="text-lg mb-1 group-hover:text-[#2FCAC7] transition-colors duration-200">
								Tags
							</label>

							{/* Tags input */}
							<div className="relative w-full" ref={dropdownRef}>
								<div className="w-full rounded-lg px-3 pt-2 pb-8 text-sm text-white border border-[#2FCAC7] bg-transparent focus-within:outline-none hover:border-[#2FCAC7] focus-within:border-[#2FCAC7] focus-within:shadow-lg focus-within:shadow-[#2FCAC7]/20 transition-all duration-200 min-h-[40px] flex flex-wrap gap-2 items-center">
									<span
										className={`absolute bottom-2 right-3 text-xs ${
											selectedTags.length >= 5
												? 'text-red-400'
												: 'text-gray-400'
										}`}
									>
										{selectedTags.length}/5
									</span>
									{selectedTags.map((tag, index) => (
										<span
											key={index}
											className="bg-[#2FCAC7]/20 rounded-lg cursor-pointer text-balance px-2 py-1 flex items-center gap-1 text-sm"
											onClick={() => removeTag(tag.name)}
										>
											{tag.name}
											<span className="text-xs hover:bg-red-500 rounded-full w-3 h-3 flex items-center justify-center">
												x
											</span>
										</span>
									))}
									<input
										type="text"
										value={newTagInput}
										onChange={e => setNewTagInput(e.target.value)}
										onKeyDown={handleNewTag}
										placeholder={
											selectedTags.length === 0
												? 'Max 5 tags (Press enter to create new tag)'
												: ''
										}
										className="flex-1 bg-transparent focus:outline-none min-w-[100px]"
										disabled={selectedTags.length >= 5}
									/>
								</div>

								{filteredTags && newTagInput.length > 0 && (
									<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-[#2FCAC7] rounded-lg shadow-lg max-h-48 overflow-y-auto p-2">
										{filteredTags.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{filteredTags.map((tag, index) => (
													<div
														key={index}
														className="px-3 py-1 hover:bg-[#2FCAC7] cursor-pointer text-white text-sm transition-colors duration-200 rounded-md border border-[#2FCAC7]/30"
														onClick={() => {
															if (tag._id) {
																handleTagSelect(tag.name, false, tag._id)
																setNewTagInput('')
															}
														}}
													>
														{tag.name}
													</div>
												))}
											</div>
										) : (
											<div className="px-3 py-2 text-gray-400 text-sm">
												No suggestions found
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="mt-6 flex gap-3">
						<button
							onClick={handleUpload}
							disabled={isUploading || isSavingDraft || !generatedImage}
							className={`flex-1 rounded-lg bg-[#28e0ca] py-1 text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg`}
						>
							{isUploading ? 'Posting...' : 'Post'}
						</button>

						{/* Save to Drafts button - only visible when there's a generated image */}
						{generatedImage && (
							<button
								onClick={handleSaveToDrafts}
								disabled={isUploading || isSavingDraft}
								className="flex-1 rounded-lg border border-[#28e0ca] text-[#28e0ca] py-1 flex items-center justify-center gap-1 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed text-lg"
							>
								{isSavingDraft ? 'Saving...' : 'Save'}
								<IoSaveOutline className="group-hover:scale-110 transition-transform duration-200" />
							</button>
						)}

						<button
							onClick={getImage}
							disabled={isGenerating || isUploading || isSavingDraft}
							className="flex-1 rounded-lg border border-[#28e0ca] text-[#28e0ca] py-1 flex items-center justify-center gap-1 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed text-lg"
						>
							{isGenerating ? 'Creating...' : 'Create'}
						</button>
					</div>

					{/* Generation limit indicator */}
					{userDetails && (
						<div className="text-center text-sm text-gray-400 mt-4">
							<div className="flex items-center justify-center gap-1">
								{[...Array(5)].map((_, i) => (
									<div
										key={i}
										className={`w-2 h-2 rounded-full ${
											i < (userDetails.generations || 0)
												? 'bg-[#2FCAC7]'
												: 'bg-gray-600'
										}`}
									/>
								))}
							</div>
							<div className="mt-1">
								<span className="font-medium">
									{Math.max(0, 5 - (userDetails.generations || 0))} of 5
								</span>{' '}
								daily generations remaining
								{userDetails.generations >= 5 && (
									<span> • Resets in ~{getTimeUntilReset()}</span>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
	)
}

export default Page

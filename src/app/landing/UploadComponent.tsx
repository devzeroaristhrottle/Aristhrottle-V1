import React, { useState, useRef, useContext, useEffect } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline, IoSaveOutline } from 'react-icons/io5'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import { type Meme } from '../home/page'
import { toast } from 'react-toastify'
import { getTimeUntilReset } from '@/utils/dateUtils'
import axios from 'axios'

interface Tags {
	name: string
	_id?: string
}

interface UploadCompProps {
	onUpload(meme: Meme): void
	onRevert(meme: Meme): void
	setIsUploading: (isUploading: boolean) => void
}

const UploadComponent: React.FC<UploadCompProps> = ({ onUpload, onRevert, setIsUploading }) => {
	const { setUserDetails, userDetails } = useContext(Context)
	const [title, setTitle] = useState('')
	const [selectedTags, setSelectedTags] = useState<Tags[]>([])
	const [filteredTags, setFilteredTags] = useState<Tags[]>([])
	const [newTagInput, setNewTagInput] = useState('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isLocalUploading, setIsLocalUploading] = useState<boolean>(false)
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
				const existingTag = filteredTags.find(tag => tag.name === newTagInput.trim());
				if (existingTag) {
					// If it exists in filtered tags, use that
					handleTagSelect(existingTag.name, false, existingTag._id || '');
				} else {
					// If it doesn't exist, create new tag
					setSelectedTags(prev => [
						...prev,
						{ name: newTagInput.trim(), isNew: true, _id: undefined },
					]);
				}
				setNewTagInput('');
				setFilteredTags([]);
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
			toast.error('Please add a title and atleast a tag to continue')
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
					'Error generating meme: Please change title and tags and try again!'
				)
			}
		} finally {
			setIsGenerating(false)
		}
	}

	const handleFileSelect = () => {
		if(!userDetails){
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

	const handleUploadMeme = (generatedImage: string) => {
		const newMeme: Meme = {
			_id: `temp-${Date.now()}`,
			name: title,
			image_url: generatedImage,
			vote_count: 0,
			tags: selectedTags.map(tag => ({
				_id: '',
				name: tag.name,
				count: 0,
				type: 'Event' as const,
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
				created_by: '',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				__v: 0,
			})),
			categories: [],
			created_by: {
				...userDetails!,
				updatedAt: new Date().toISOString(),
				__v: 0,
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			shares: [],
			bookmarks: [],
			is_onchain: false,
			__v: 0,
			voted: false,
			has_user_voted: false,
		}

		onUpload(newMeme)
		return newMeme
	}

	const handleUpload = async () => {
		if (!user || !user.address) {
			if (openAuthModal) {
				openAuthModal()
			}
			return
		}
		console.log(selectedTags)
		if (generatedImage) {
			if(selectedTags.length < 1){
				toast.error("Please enter atleast one tag")
				return;
			}
			// Show meme immediately (optimistic update)
			const optimisticMeme = handleUploadMeme(generatedImage)

			try {
				setIsLocalUploading(true)
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
					timeout: 180000
				})

				if (uploadResponse.status === 201) {
					console.log('Meme uploaded successfully:', uploadResponse.data)

					// Reset form after successful upload
					setTitle('')
					setSelectedTags([])
					setGeneratedImage(null)

					toast.success('Meme uploaded successfully!')
				} else {
					throw new Error('Upload failed')
				}
			} catch (error) {
				console.error('Error uploading meme:', error)
				
				// Provide more specific error messages based on error type
				if (axios.isAxiosError(error)) {
					if (error.code === 'ECONNABORTED') {
						toast.error('Upload timed out. Please try with a smaller image or check your connection.')
					} else if (error.response) {
						// Server responded with an error status
						const errorMessage = error.response.data?.message || 'Failed to upload meme'
						toast.error(`Upload failed: ${errorMessage}`)
					} else if (error.request) {
						// Request was made but no response received
						toast.error('No response from server. Please check your connection and try again.')
					} else {
						toast.error('Failed to upload meme. Please try again.')
					}
				} else {
					toast.error('Failed to upload meme. Please try again.')
				}

				onRevert(optimisticMeme)
			} finally {
				setIsLocalUploading(false)
				setIsUploading(false)
			}
		}
	}

	// Add function to save to drafts
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

			const draftResponse = await axiosInstance.post('/api/draft-meme', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				timeout: 180000
			})

			if (draftResponse.status === 201 || draftResponse.status === 200) {
				toast.success('Saved to drafts successfully!')
				
				// Optional: Reset form after saving to drafts
				// setTitle('')
				// setSelectedTags([])
				// setGeneratedImage(null)
			} else {
				throw new Error('Failed to save draft')
			}
		} catch (error) {
			console.error('Error saving draft:', error)
			
			if (axios.isAxiosError(error)) {
				if (error.code === 'ECONNABORTED') {
					toast.error('Save timed out. Please try with a smaller image or check your connection.')
				} else if (error.response) {
					const errorMessage = error.response.data?.message || 'Failed to save draft'
					toast.error(`Save failed: ${errorMessage}`)
				} else if (error.request) {
					toast.error('No response from server. Please check your connection and try again.')
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
		<div className="flex justify-center items-start gap-4 lg:gap-8 w-full py-4 lg:py-8 flex-col lg:flex-row h-fit px-4 lg:px-0">
			{/* Left Section - Instructions or Image */}
			<div className="w-full max-w-md lg:w-[27rem] h-auto lg:h-96 lg:max-h-96 flex-shrink-0">
				{isGenerating ? (
					<div className="flex flex-col justify-center items-center border border-blue-400 rounded-xl p-3 lg:p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300 h-full">
						<div className="w-32 h-32 border-8 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
						<div className="mt-4 text-center">
							<p className="text-blue-400 font-medium">
								Generating your meme...
							</p>
							<p className="text-gray-400 text-xs mt-1">
								Please don&apos;t refresh the page.
							</p>
						</div>
					</div>
				) : generatedImage ? (
					/* Image Display */
					<div
						className="h-auto w-auto flex flex-col items-center "
						onClick={handleFileSelect}
						title="Click to select a different image"
					>
						<div className="w-full border border-blue-400 rounded-xl p-3 lg:p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300">
							<img
								src={generatedImage}
								alt="Generated content"
								className="w-full aspect-square object-contain rounded hover:opacity-90 transition-opacity duration-200 max-h-80"
							/>
						</div>

						<p className="text-sm text-gray-400 mt-2 text-center">
							Click to select a different image
						</p>
					</div>
				) : (
					/* Upload Instructions */
					<div className="border h-full flex flex-col justify-between border-white rounded-xl p-4 lg:p-5 text-gray-400 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20 cursor-pointer">
						<div
							id="top-sec"
							className="flex justify-center items-center"
							onClick={handleFileSelect}
						>
							<div className="flex gap-x-2 mb-3 lg:mb-4 flex-col w-full">
								<div className="flex justify-center items-center">
									<IoCloudUploadOutline
										size={40}
										className="lg:w-12 lg:h-12 text-blue-400 hover:scale-110 transition-transform duration-200"
									/>
								</div>
								<div className="flex flex-col items-center">
									<div className="text-blue-400 text-3xl">Choose File</div>
									<div className="text-xs lg:text-2xl">
										JPG / PNG Max. 10 MB
									</div>
								</div>
							</div>
						</div>

						{/* Divider */}
						<div className="flex items-center w-full gap-3 lg:gap-4 my-3 lg:my-4">
							<div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
							<span className="px-2 lg:px-4 text-xs lg:text-sm font-medium hover:text-blue-400 transition-colors duration-200">
								or
							</span>
							<div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
						</div>

						{/* AI Instructions */}
						<div
							id="top-sec"
							className="flex justify-center items-center"
							onClick={getImage}
						>
							<div className="flex flex-col gap-x-2 lg:gap-x-3 items-center mb-2 lg:mb-3">
								<HiSparkles
									size={32}
									className="lg:w-10 lg:h-10 text-blue-400 hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0"
								/>
								<div className="text-blue-400 text-lg lg:text-3xl hover:text-white transition-colors duration-200">
									Create with Aris-Intelligence
								</div>
								<div className="text-xs lg:text-2xl">
									Enter title and tags(atleast one)
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Right Section - Form */}
			<div className="flex flex-col justify-between w-full max-w-4xl lg:flex-1 lg:h-96 py-2 lg:py-4 h-fit gap-y-4 lg:gap-y-4">
				<div className="flex flex-col group">
					<label className="text-lg sm:text-xl lg:text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
						Title
					</label>
					<input
						type="text"
						placeholder="Max 250 Characters"
						value={title}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setTitle(e.target.value)
						}
						maxLength={250}
						className="bg-transparent border rounded-lg px-3 py-2 lg:py-3 text-sm sm:text-base lg:text-lg text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 transition-all duration-200 w-full"
						ref={titleRef}
					/>
				</div>

				<div className="flex flex-col group">
					<label className="text-lg sm:text-xl lg:text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
						Tags{' '}
						{selectedTags.length > 0 && (
							<span className="text-sm text-gray-400 group-hover:text-blue-300 transition-colors duration-200">
								({selectedTags.length}/5)
							</span>
						)}
					</label>

					{/* Tags input */}
					<div className="relative w-full" ref={dropdownRef}>
						<input
							type="text"
							value={newTagInput}
							onChange={e => setNewTagInput(e.target.value)}
							onKeyDown={handleNewTag}
							placeholder="Max 5 tags (Press enter to create new tag)"
							className="w-full rounded-md outline-none px-3 py-2 lg:py-3 text-white text-lg border-2 border-[#1583fb] bg-transparent"
							disabled={selectedTags.length >= 5}
						/>

						{filteredTags && newTagInput.length > 0 && (
							<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-blue-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
								{filteredTags.length > 0 ? (
									filteredTags.map((tag, index) => (
										<div
											key={index}
											className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-white text-sm transition-colors duration-200 border-b border-gray-700 last:border-b-0"
											onClick={() => {
												if (tag._id) {
													handleTagSelect(tag.name, false, tag._id)
													setNewTagInput('')
												}
											}}
										>
											{tag.name}
										</div>
									))
								) : (
									<div className="px-3 py-2 text-gray-400 text-sm">
										No suggestions found
									</div>
								)}
							</div>
						)}
					</div>

					{/* Selected Tags */}
					<div className="flex items-center flex-wrap gap-2 lg:gap-4 mt-2 max-h-14 lg:max-h-28 overflow-y-auto">
						{selectedTags.map((tag, index) => (
							<span
								key={index}
								className="bg-transparent rounded-lg cursor-pointer text-balance px-2 py-1 flex items-center gap-1 border-2 border-[#1783fb]"
								onClick={() => removeTag(tag.name)}
							>
								{tag.name}
								<span className="text-xs hover:bg-red-500 rounded-full w-3 h-3 flex items-center justify-center">
									×
								</span>
							</span>
						))}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row justify-center lg:justify-evenly gap-3 lg:gap-4 w-full text-[24px]">
					<button
						onClick={handleUpload}
						disabled={isLocalUploading || isSavingDraft}
						className={`rounded-full bg-[#28e0ca] px-4 py-1 w-full ${generatedImage ? 'sm:w-1/3' : 'sm:w-1/2'} lg:flex-1 lg:max-w-96 text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						{isLocalUploading ? 'Posting...' : 'Post'}
					</button>
					
					{/* Save to Drafts button - only visible when there's a generated image */}
					{generatedImage && (
						<button
							onClick={handleSaveToDrafts}
							disabled={isLocalUploading || isSavingDraft}
							className="rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-1 w-full sm:w-1/3 lg:flex-1 lg:max-w-96 flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSavingDraft ? 'Saving...' : 'Save Draft'}
							<IoSaveOutline className="group-hover:scale-110 transition-transform duration-200" />
						</button>
					)}
					
					<button
						onClick={getImage}
						disabled={isGenerating || isLocalUploading || isSavingDraft}
						className={`rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-1 w-full ${generatedImage ? 'sm:w-1/3' : 'sm:w-1/2'} lg:flex-1 lg:max-w-96 flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						{isGenerating ? 'Generating...' : 'Generate'}
						<HiSparkles className="group-hover:rotate-12 transition-transform duration-200" />
					</button>
				</div>

				{/* Generation limit indicator */}
				{userDetails && (
					<div className="text-center text-sm text-gray-400 mt-2">
						<div className="flex items-center justify-center gap-1">
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className={`w-2 h-2 rounded-full ${
										i < (userDetails.generations || 0)
											? 'bg-blue-500'
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

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/png,image/jpeg"
					onChange={handleFileChange}
					className="hidden"
				/>
			</div>
		</div>
	)
}

export default UploadComponent

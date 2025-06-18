import axios from 'axios'
import React, { useState, useRef, useContext, useEffect } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import { Meme } from './page'

interface TagResponse {
	name: string
	_id: string
}

interface UploadCompProps {
	onUpload(meme: Meme): void
	onRevert(meme: Meme): void
}

const UploadComponent: React.FC<UploadCompProps> = ({ onUpload, onRevert }) => {
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState<string>('')
	const [title, setTitle] = useState<string>('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const [recommendedTags, setRecommendedTags] = useState<TagResponse[]>([])
	const [showDropdown, setShowDropdown] = useState<boolean>(false)
	const [isLoadingTags, setIsLoadingTags] = useState<boolean>(false)
	const [exsistingTag, setExsistingTag] = useState<string[]>([])
	const [newTags, setNewTags] = useState<string[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const [isAI, setIsAI] = useState<boolean>(false)
	const { userDetails } = useContext(Context)
	const { openAuthModal } = useAuthModal()
	const user = useUser()

	// Fetch tag recommendations
	const fetchTagRecommendations = async (searchTerm: string) => {
		if (!searchTerm.trim() || searchTerm.length < 1) {
			setRecommendedTags([])
			setShowDropdown(false)
			return
		}

		try {
			setIsLoadingTags(true)
			const response = await axiosInstance.get(
				`/api/tags?name=${encodeURIComponent(searchTerm)}`
			)
			const filteredTags = response.data.tags.filter(
				(tag: TagResponse) => !tags.includes(tag.name.toLowerCase())
			)
			setRecommendedTags(filteredTags)
			setShowDropdown(filteredTags.length > 0)
		} catch (error) {
			console.error('Error fetching tag recommendations:', error)
			setRecommendedTags([])
			setShowDropdown(false)
		} finally {
			setIsLoadingTags(false)
		}
	}

	// Debounce tag search
	useEffect(() => {
		const debounceTimer = setTimeout(() => {
			fetchTagRecommendations(tagInput)
		}, 300)

		return () => clearTimeout(debounceTimer)
	}, [tagInput, tags])

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleTagInputKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>
	): void => {
		if (e.key === 'Enter') {
			e.preventDefault()
			const newTag = tagInput.trim().toLowerCase()

			if (newTag && !tags.includes(newTag) && tags.length < 5) {
				setTags([...tags, newTag])
				setNewTags([...newTags, newTag])
				setTagInput('')
				setShowDropdown(false)
			}
		} else if (e.key === 'Escape') {
			setShowDropdown(false)
		}
	}

	const selectRecommendedTag = (tagName: string, tagId: string) => {
		const normalizedTag = tagName.toLowerCase()
		if (!tags.includes(normalizedTag) && tags.length < 5) {
			setTags([...tags, normalizedTag])
			setTagInput('')
			setShowDropdown(false)
			setExsistingTag([...exsistingTag, tagId])
		}
	}

	const removeTag = (tagToRemove: string): void => {
		setTags(tags.filter(tag => tag !== tagToRemove))
	}

	const getImage = async () => {
		if (!user || !user.address) {
			if (openAuthModal) {
				openAuthModal()
			}
			return
		}
		try {
			setIsGenerating(true)
			const response = await axios.post(
				'https://gen-image-84192368251.europe-west1.run.app/api/v1/images/generate',
				{
					title,
					tags,
					filename: 'image.png',
				},
				{
					responseType: 'blob', // Important for handling binary data
				}
			)

			// Create blob URL from the response
			const imageBlob = new Blob([response.data], { type: 'image/png' })
			const imageUrl = URL.createObjectURL(imageBlob)
			setGeneratedImage(imageUrl)
		} catch (error) {
			console.error('Error generating image:', error)
		} finally {
			setIsGenerating(false)
			setIsAI(true)
		}
	}

	const handleFileSelect = () => {
		setIsAI(false)
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
			tags: tags.map(tag => ({
				_id: '',
				name: tag,
				count: 0,
				type: 'Event' as const,
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
				created_by: userDetails!._id,
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
		if (generatedImage) {
			// Show meme immediately (optimistic update)
			const optimisticMeme = handleUploadMeme(generatedImage)

			try {
				setIsUploading(true)

				const response = await fetch(generatedImage)
				const blob = await response.blob()

				// Create FormData for meme upload
				const formData = new FormData()
				formData.append('name', title)
				formData.append('file', blob, 'image.png')
				formData.append('created_by', userDetails!._id)
				formData.append('new_tags', JSON.stringify(newTags))
				formData.append('existing_tags', JSON.stringify(exsistingTag))
				const uploadResponse = await axiosInstance.post('/api/meme', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})

				if (uploadResponse.status === 201) {
					console.log('Meme uploaded successfully:', uploadResponse.data)

					// Reset form after successful upload
					setTitle('')
					setTags([])
					setGeneratedImage(null)

					alert('Meme uploaded successfully!')
				} else {
					throw new Error('Upload failed')
				}
			} catch (error) {
				console.error('Error uploading meme:', error, optimisticMeme?._id)
				alert('Failed to upload meme. Please try again.')

				onRevert(optimisticMeme)
			} finally {
				setIsUploading(false)
			}
		}
	}

	return (
		<div className="flex justify-center items-start gap-4 lg:gap-8 w-full py-4 lg:py-8 flex-col lg:flex-row h-fit px-4 lg:px-0">
			{/* Left Section - Instructions or Image */}
			<div className="w-full max-w-md lg:w-[27rem] h-auto lg:h-96 lg:max-h-96 flex-shrink-0">
				{isGenerating ? (
					<div className="flex flex-col justify-center items-center border border-blue-400 rounded-xl p-3 lg:p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300 h-full">
						<div className="w-32 h-32 border-8 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
					</div>
				) : generatedImage ? (
					/* Image Display */
					<div
						className="flex flex-col items-center border border-blue-400 rounded-xl p-3 lg:p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer hover:border-blue-300"
						onClick={handleFileSelect}
						title="Click to select a different image"
					>
						<h3 className="text-lg lg:text-xl mb-2 lg:mb-3 text-blue-400">
							{isAI ? 'Generated Image' : 'Uploaded Image'}
						</h3>
						<div className="w-full">
							<img
								src={generatedImage}
								alt="Generated content"
								className="w-full h-auto object-contain rounded hover:opacity-90 transition-opacity duration-200 max-h-80"
							/>
						</div>
						<p className="text-sm text-gray-400 mt-2 text-center">
							Click to select a different image
						</p>
					</div>
				) : (
					/* Upload Instructions */
					<div
						className="border border-white rounded-xl p-4 lg:p-5 text-gray-400 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20 cursor-pointer"
						onClick={handleFileSelect}
					>
						<div id="top-sec">
							<div className="flex gap-x-2 mb-3 lg:mb-4">
								<div className="flex justify-center items-center">
									<IoCloudUploadOutline
										size={40}
										className="lg:w-12 lg:h-12 text-blue-400 hover:scale-110 transition-transform duration-200"
									/>
								</div>
								<div className="flex flex-col">
									<div className="text-blue-400 text-xl">Choose File</div>
									<div className="text-xs lg:text-sm">JPG / PNG Max. 10 MB</div>
								</div>
							</div>
							<ul className="space-y-2 pb-3 lg:pb-4">
								{[
									'Click Here to Upload From device',
									'Enter Title and Tags',
									'Click on "Upload"',
								].map((text, index) => (
									<li
										key={index}
										className="flex items-start gap-2 lg:gap-3 group"
									>
										<div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gray-400 text-black border font-semibold text-xs lg:text-sm flex items-center justify-center group-hover:bg-blue-400 group-hover:scale-110 transition-all duration-200 flex-shrink-0">
											{index + 1}
										</div>
										<span className="text-sm lg:text-base break-words group-hover:text-white transition-colors duration-200">
											{text}
										</span>
									</li>
								))}
							</ul>
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
						<div id="top-sec">
							<div className="flex gap-x-2 lg:gap-x-3 items-center mb-2 lg:mb-3">
								<HiSparkles
									size={32}
									className="lg:w-10 lg:h-10 text-blue-400 hover:scale-110 hover:rotate-12 transition-all duration-300 flex-shrink-0"
								/>
								<div className="text-blue-400 text-lg lg:text-xl hover:text-white transition-colors duration-200">
									Create with Aris Intelligence
								</div>
							</div>
							<ul className="space-y-2">
								{[
									'Enter Title and Tags of Your Choice',
									'Click on "Generate"',
									'Click on "Upload" to Post',
								].map((text, index) => (
									<li
										key={index}
										className="flex items-start gap-2 lg:gap-3 group"
									>
										<div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gray-400 text-black border font-semibold text-xs lg:text-sm flex items-center justify-center group-hover:bg-blue-400 group-hover:scale-110 transition-all duration-200 flex-shrink-0">
											{index + 1}
										</div>
										<span className="text-sm lg:text-base break-words group-hover:text-white transition-colors duration-200">
											{text}
										</span>
									</li>
								))}
							</ul>
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
					/>
				</div>

				<div className="flex flex-col group">
					<label className="text-lg sm:text-xl lg:text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
						Tags{' '}
						{tags.length > 0 && (
							<span className="text-sm text-gray-400 group-hover:text-blue-300 transition-colors duration-200">
								({tags.length}/5)
							</span>
						)}
					</label>

					{/* Tags input box with tags inside */}
					<div className="relative w-full" ref={dropdownRef}>
						<div className="bg-transparent border rounded-lg px-3 py-2 lg:py-3 border-[#1583fb] hover:border-blue-300 focus-within:border-blue-300 focus-within:shadow-lg focus-within:shadow-blue-400/20 transition-all duration-200 min-h-[40px] sm:min-h-[44px] lg:min-h-[48px] w-full">
							<div className="flex flex-wrap gap-1 lg:gap-2 items-center">
								{/* Display existing tags inside the input */}
								{tags.map((tag, index) => (
									<span
										key={index}
										className="bg-[#1583fb] text-white px-2 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 hover:bg-blue-600 transition-all duration-200 cursor-default flex-shrink-0"
									>
										{tag}
										<button
											onClick={() => removeTag(tag)}
											className="hover:bg-red-500 rounded-full w-3 h-3 flex items-center justify-center text-xs hover:scale-125 transition-all duration-200"
										>
											×
										</button>
									</span>
								))}

								{/* Input field */}
								<input
									type="text"
									placeholder={
										tags.length === 0
											? 'Max 5, create your tag by pressing Enter'
											: tags.length >= 5
											? 'Maximum 5 tags reached'
											: 'Add tag...'
									}
									value={tagInput}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setTagInput(e.target.value)
									}
									onKeyPress={handleTagInputKeyPress}
									onFocus={() => {
										if (recommendedTags.length > 0) {
											setShowDropdown(true)
										}
									}}
									disabled={tags.length >= 5}
									className="bg-transparent outline-none text-sm sm:text-base lg:text-lg text-white placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
								/>
							</div>
						</div>

						{/* Dropdown for tag recommendations */}
						{showDropdown && (
							<div className="absolute z-10 w-full mt-1 bg-gray-800 border border-blue-400 rounded-lg shadow-lg max-h-48 overflow-y-auto">
								{isLoadingTags ? (
									<div className="px-3 py-2 text-gray-400 text-sm">
										Loading suggestions...
									</div>
								) : recommendedTags.length > 0 ? (
									recommendedTags.map((tag, index) => (
										<div
											key={index}
											className="px-3 py-2 hover:bg-blue-600 cursor-pointer text-white text-sm transition-colors duration-200 border-b border-gray-700 last:border-b-0"
											onClick={() => selectRecommendedTag(tag.name, tag._id)}
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
				</div>

				<div className="flex flex-col sm:flex-row justify-center lg:justify-evenly gap-3 lg:gap-4 w-full text-[24px]">
					<button
						onClick={handleUpload}
						disabled={isUploading}
						className="rounded-full bg-[#28e0ca] px-4 py-1 w-full sm:w-1/2 lg:flex-1 lg:max-w-96 text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploading ? 'Uploading...' : 'Upload'}
					</button>
					<button
						onClick={getImage}
						disabled={isGenerating}
						className="rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-1 w-full sm:w-1/2 lg:flex-1 lg:max-w-96 flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isGenerating ? 'Generating...' : 'Generate'}
						<HiSparkles className="group-hover:rotate-12 transition-transform duration-200" />
					</button>
				</div>

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

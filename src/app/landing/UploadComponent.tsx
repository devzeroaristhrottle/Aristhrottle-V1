import axios from 'axios'
import React, { useState, useRef, useContext, useEffect } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal, useUser } from '@account-kit/react'
import { Meme } from './page'
import { toast } from 'react-toastify'

interface Tags {
	name: string
	_id?: string
}

interface UploadCompProps {
	onUpload(meme: Meme): void
	onRevert(meme: Meme): void
}

const UploadComponent: React.FC<UploadCompProps> = ({ onUpload, onRevert }) => {
	const { setUserDetails, userDetails } = useContext(Context)
	const [title, setTitle] = useState('')
	const [selectedTags, setSelectedTags] = useState<Tags[]>([])
	const [filteredTags, setFilteredTags] = useState<Tags[]>([])
	const [newTagInput, setNewTagInput] = useState('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const [isAI, setIsAI] = useState<boolean>(false)
	const { openAuthModal } = useAuthModal()
	const user = useUser()
	const titleRef = useRef<HTMLInputElement>(null)

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
			selectedTags.length < 5 &&
			filteredTags.length == 0
		) {
			if (!selectedTags.some(tag => tag.name === newTagInput.trim())) {
				setSelectedTags(prev => [
					...prev,
					{ name: newTagInput.trim(), isNew: true, _id: undefined },
				])
				setNewTagInput('')
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
				if (userDetails.generations > 5) return
				setUserDetails({
					...userDetails,
					generations: userDetails.generations + 1,
				})
			}
			const tagNames = selectedTags.map(tag => tag.name)
			const response = await axios.post(
				'https://gen-image-84192368251.europe-west1.run.app/api/v1/images/generate',
				{
					title,
					tags: tagNames,
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
			if (userDetails) {
				setUserDetails({
					...userDetails,
					generations: userDetails.generations,
				})
			}
			toast.error(
				'Error generating meme: Please change title and tags and try again!'
			)
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
			// Show meme immediately (optimistic update)
			const optimisticMeme = handleUploadMeme(generatedImage)

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
				toast.error('Failed to upload meme. Please try again.')

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
									Create
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
							placeholder="Max 5 tags"
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
								className="bg-blue-500 rounded-lg cursor-pointer text-balance px-2 py-1 flex items-center gap-1"
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
						disabled={isUploading}
						className="rounded-full bg-[#28e0ca] px-4 py-1 w-full sm:w-1/2 lg:flex-1 lg:max-w-96 text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isUploading ? 'Posting...' : 'Post'}
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

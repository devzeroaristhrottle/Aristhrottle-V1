import axios from 'axios'
import React, { useState, useRef } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'

const UploadComponent: React.FC = () => {
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState<string>('')
	const [title, setTitle] = useState<string>('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleTagInputKeyPress = (
		e: React.KeyboardEvent<HTMLInputElement>
	): void => {
		if (e.key === 'Enter') {
			e.preventDefault()
			const newTag = tagInput.trim()

			if (newTag && !tags.includes(newTag) && tags.length < 5) {
				setTags([...tags, newTag])
				setTagInput('')
			}
		}
	}

	const removeTag = (tagToRemove: string): void => {
		setTags(tags.filter(tag => tag !== tagToRemove))
	}

	const getImage = async () => {
		try {
			setIsGenerating(true)
			const response = await axios.post('http://localhost:8000/api/v1/images/generate', {
				title,
				tags,
				filename: 'image.png',
			}, {
				responseType: 'blob', // Important for handling binary data
			})

			// Create blob URL from the response
			const imageBlob = new Blob([response.data], { type: 'image/png' })
			const imageUrl = URL.createObjectURL(imageBlob)
			setGeneratedImage(imageUrl)
		} catch (error) {
			console.error('Error generating image:', error)
		} finally {
			setIsGenerating(false)
		}
	}

	const handleFileSelect = () => {
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
		if (generatedImage) {
			try {
				setIsUploading(true)
				
				// Convert blob URL back to blob for upload
				const response = await fetch(generatedImage)
				const blob = await response.blob()
				
				// Create FormData for multipart upload
				const formData = new FormData()
				formData.append('image', blob, 'image.png')
				formData.append('title', title)
				formData.append('tags', JSON.stringify(tags))
				
				// Upload to your backend endpoint
				const uploadResponse = await axios.post('https://localhost:8000/upload', formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})
				
				console.log('Upload successful:', uploadResponse.data)
				
				// Reset form after successful upload
				setTitle('')
				setTags([])
				setGeneratedImage(null)
				
				// Optional: Show success message
				alert('Image uploaded successfully!')
				
			} catch (error) {
				console.error('Error uploading image:', error)
				alert('Failed to upload image. Please try again.')
			} finally {
				setIsUploading(false)
			}
		} else {
			// No generated image, open file selector
			handleFileSelect()
		}
	}

	return (
		<div className="flex justify-center items-start gap-8 w-full py-8 flex-col lg:flex-row h-fit">
			{/* Left Section - Instructions or Image */}
			<div className="w-full max-w-md h-96 max-h-96">
				{generatedImage ? (
					/* Image Display */
					<div className="flex flex-col items-center border border-blue-400 rounded-xl p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300">
						<h3 className="text-xl mb-3 text-blue-400">Generated Image</h3>
						<div className="w-full">
							<img 
								src={generatedImage} 
								alt="Generated content" 
								className="w-full h-auto max-h-96 object-contain rounded"
							/>
						</div>
					</div>
				) : (
					/* Upload Instructions */
					<div className="border border-white rounded-xl p-5 text-gray-400 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
						<div id="top-sec">
							<div className="flex gap-x-2 mb-4">
								<div className="flex justify-center items-center">
									<IoCloudUploadOutline
										size={50}
										className="text-blue-400 hover:scale-110 transition-transform duration-200"
									/>
								</div>
								<div className="flex flex-col">
									<div className="text-blue-400 text-2xl">Choose File</div>
									<div className="text-sm">JPG / PNG Max. 10 MB</div>
								</div>
							</div>
							<ul className="space-y-2 pb-4">
								{[
									'Click Here to Upload From device',
									'Enter Title and Tags',
									'Click on "Upload"',
								].map((text, index) => (
									<li key={index} className="flex items-start gap-3 group">
										<div className="w-6 h-6 rounded-full bg-gray-400 text-black border font-semibold text-sm flex items-center justify-center group-hover:bg-blue-400 group-hover:scale-110 transition-all duration-200">
											{index + 1}
										</div>
										<span className="pr-5 break-words group-hover:text-white transition-colors duration-200">
											{text}
										</span>
									</li>
								))}
							</ul>
						</div>

						{/* Divider */}
						<div className="flex items-center w-full gap-4 my-4">
							<div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
							<span className="px-4 text-sm font-medium hover:text-blue-400 transition-colors duration-200">
								or
							</span>
							<div className="flex-1 border-t border-[#86878B] hover:border-blue-400 transition-colors duration-300"></div>
						</div>

						{/* AI Instructions */}
						<div id="top-sec">
							<div className="flex gap-x-3 items-center mb-3">
								<HiSparkles
									size={40}
									className="text-blue-400 hover:scale-110 hover:rotate-12 transition-all duration-300"
								/>
								<div className="text-blue-400 text-xl hover:text-white transition-colors duration-200">
									Create with Aris Intelligence
								</div>
							</div>
							<ul className="space-y-2">
								{[
									'Enter Title and Tags of Your Choice',
									'Click on "Generate"',
									'Click on "Upload" to Post',
								].map((text, index) => (
									<li key={index} className="flex items-start gap-3 group">
										<div className="w-6 h-6 rounded-full bg-gray-400 text-black border font-semibold text-sm flex items-center justify-center group-hover:bg-blue-400 group-hover:scale-110 transition-all duration-200">
											{index + 1}
										</div>
										<span className="pr-5 break-words group-hover:text-white transition-colors duration-200">
											{text}
										</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</div>

			{/* Middle Section - Form */}
			<div className="flex flex-col justify-between text-lg w-full h-96 py-4 text-[32px]">
				<div className="flex flex-col group">
					<label className="text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
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
						className="bg-transparent border rounded-lg px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 transition-all duration-200"
					/>
				</div>

				<div className="flex flex-col group">
					<label className="text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
						Tags{' '}
						{tags.length > 0 && (
							<span className="text-sm text-gray-400 group-hover:text-blue-300 transition-colors duration-200">
								({tags.length}/5)
							</span>
						)}
					</label>

					{/* Display existing tags */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-2">
							{tags.map((tag, index) => (
								<span
									key={index}
									className="bg-[#1583fb] text-white px-3 py-1 rounded-full text-[16px] flex items-center gap-2 hover:bg-blue-600 hover:scale-105 transition-all duration-200 cursor-default"
								>
									{tag}
									<button
										onClick={() => removeTag(tag)}
										className="hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs hover:scale-125 transition-all duration-200"
									>
										×
									</button>
								</span>
							))}
						</div>
					)}

					<input
						type="text"
						placeholder={
							tags.length >= 5
								? 'Maximum 5 tags reached'
								: 'Max 5, create your tag by pressing Enter'
						}
						value={tagInput}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setTagInput(e.target.value)
						}
						onKeyPress={handleTagInputKeyPress}
						disabled={tags.length >= 5}
						className="bg-transparent border rounded-lg px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					/>
				</div>

				<div className="flex flex-row justify-evenly">
					<button 
						onClick={handleUpload}
						disabled={isUploading}
						className="rounded-full bg-[#28e0ca] px-4 py-2 w-96 text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
						{isUploading ? 'Uploading...' : 'Upload'}
					</button>
					<button 
						onClick={getImage}
						disabled={isGenerating}
						className="rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-2 w-96 flex items-center justify-center gap-2 font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed">
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

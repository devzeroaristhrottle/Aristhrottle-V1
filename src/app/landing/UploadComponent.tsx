import axios from 'axios'
import React, { useState, useRef, useContext } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal } from '@account-kit/react'


const UploadComponent: React.FC = () => {
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState<string>('')
	const [title, setTitle] = useState<string>('')
	const [generatedImage, setGeneratedImage] = useState<string | null>(null)
	const [isGenerating, setIsGenerating] = useState<boolean>(false)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isAI, setIsAI] = useState<boolean>(false);
	const { userDetails } = useContext(Context);
	const { openAuthModal } = useAuthModal();
	
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
		if(!userDetails || !userDetails._id){
			openAuthModal();
			return;
		}
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
			setIsAI(true);
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
		if(!userDetails || !userDetails._id){
			openAuthModal();
			return;
		}
		if (generatedImage) {
			try {
				setIsUploading(true)
				
				const response = await fetch(generatedImage)
				const blob = await response.blob()
				
				// Create FormData for meme upload
				const formData = new FormData()
				formData.append('name', title)
				formData.append('file', blob, 'image.png') 
				formData.append('created_by', userDetails!._id)
				formData.append('new_tags', JSON.stringify(tags))
				formData.append('existing_tags', JSON.stringify([])) 
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
				console.error('Error uploading meme:', error)
				alert('Failed to upload meme. Please try again.')
			} finally {
				setIsUploading(false)
			}
		} else {
			setIsAI(false);
			handleFileSelect()
		}
	}

	return (
		<div className="flex justify-center items-start gap-4 lg:gap-8 w-full py-4 lg:py-8 flex-col lg:flex-row h-fit px-4 lg:px-0">
			{/* Left Section - Instructions or Image */}
			<div className="w-full lg:max-w-md h-auto lg:h-96 lg:max-h-96">
				{generatedImage ? (
					/* Image Display */
					<div className="flex flex-col items-center border border-blue-400 rounded-xl p-3 lg:p-4 hover:shadow-lg hover:shadow-blue-400/20 transition-all duration-300">
						<h3 className="text-lg lg:text-xl mb-2 lg:mb-3 text-blue-400">{isAI ? "Generated Image" : "Uploaded Image"}</h3>
						<div className="w-full">
							<img 
								src={generatedImage} 
								alt="Generated content" 
								className="w-full h-auto max-h-64 lg:max-h-96 object-contain rounded"
							/>
						</div>
					</div>
				) : (
					/* Upload Instructions */
					<div className="border border-white rounded-xl p-4 lg:p-5 text-gray-400 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
						<div id="top-sec">
							<div className="flex gap-x-2 mb-3 lg:mb-4">
								<div className="flex justify-center items-center">
									<IoCloudUploadOutline
										size={40}
										className="lg:w-12 lg:h-12 text-blue-400 hover:scale-110 transition-transform duration-200"
									/>
								</div>
								<div className="flex flex-col">
									<div className="text-blue-400 text-xl lg:text-2xl">Choose File</div>
									<div className="text-xs lg:text-sm">JPG / PNG Max. 10 MB</div>
								</div>
							</div>
							<ul className="space-y-2 pb-3 lg:pb-4">
								{[
									'Click Here to Upload From device',
									'Enter Title and Tags',
									'Click on "Upload"',
								].map((text, index) => (
									<li key={index} className="flex items-start gap-2 lg:gap-3 group">
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
									<li key={index} className="flex items-start gap-2 lg:gap-3 group">
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
			<div className="flex flex-col justify-between w-full lg:h-96 py-2 lg:py-4 h-fit gap-y-4 lg:gap-y-4">
				<div className="flex flex-col group">
					<label className="text-xl lg:text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
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
						className="bg-transparent border rounded-lg px-3 py-2 lg:py-2 text-base lg:text-lg text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 transition-all duration-200"
					/>
				</div>

				<div className="flex flex-col group">
					<label className="text-xl lg:text-2xl mb-1 group-hover:text-blue-400 transition-colors duration-200">
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
									className="bg-[#1583fb] text-white px-2 lg:px-3 py-1 rounded-full text-sm lg:text-base flex items-center gap-2 hover:bg-blue-600 hover:scale-105 transition-all duration-200 cursor-default"
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
						className="bg-transparent border rounded-lg px-3 py-2 lg:py-2 text-base lg:text-lg text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] hover:border-blue-300 focus:border-blue-300 focus:shadow-lg focus:shadow-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					/>
				</div>

				<div className="flex flex-col lg:flex-row justify-evenly gap-3 lg:gap-4">
					<button 
						onClick={handleUpload}
						disabled={isUploading}
						className="rounded-full bg-[#28e0ca] px-4 py-2 lg:py-2 w-full lg:w-96 text-base lg:text-lg text-black font-semibold hover:bg-[#20c4aa] hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
						{isUploading ? 'Uploading...' : 'Upload'}
					</button>
					<button 
						onClick={getImage}
						disabled={isGenerating}
						className="rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-2 lg:py-2 w-full lg:w-96 flex items-center justify-center gap-2 text-base lg:text-lg font-semibold hover:bg-[#28e0ca] hover:text-black hover:scale-105 hover:shadow-lg hover:shadow-[#28e0ca]/30 transition-all duration-200 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed">
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
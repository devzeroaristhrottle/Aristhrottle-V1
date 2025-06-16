import React, { useState } from 'react'
import { HiSparkles } from 'react-icons/hi2'
import { IoCloudUploadOutline } from 'react-icons/io5'

const UploadComponent = () => {
	const [tags, setTags] = useState<string[]>([])
	const [tagInput, setTagInput] = useState('')
	const [title, setTitle] = useState('')

	const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			const newTag = tagInput.trim()

			if (newTag && !tags.includes(newTag) && tags.length < 5) {
				setTags([...tags, newTag])
				setTagInput('')
			}
		}
	}

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter(tag => tag !== tagToRemove))
	}

	return (
		<div className="flex justify-center items-center gap-8 w-full py-8 flex-col lg:flex-row ">
			{/* Left Section */}
			<div className="border border-white rounded-xl p-5 text-gray-400 w-full max-w-md h-fit">
				{/* Upload Instructions */}
				<div id="top-sec">
					<div className="flex gap-x-2 mb-4">
						<div className="flex justify-center items-center">
							<IoCloudUploadOutline size={50} className="text-blue-400" />
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
							<li key={index} className="flex items-start gap-3">
								<div className="w-6 h-6 rounded-full bg-gray-400 text-black border font-semibold text-sm flex items-center justify-center">
									{index + 1}
								</div>
								<span className="pr-5 break-words">{text}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Divider */}
				<div className="flex items-center w-full gap-4 my-4">
					<div className="flex-1 border-t border-[#86878B]"></div>
					<span className="px-4 text-sm font-medium">or</span>
					<div className="flex-1 border-t border-[#86878B]"></div>
				</div>

				{/* AI Instructions */}
				<div id="top-sec">
					<div className="flex gap-x-3 items-center mb-3">
						<HiSparkles size={40} className="text-blue-400" />
						<div className="text-blue-400 text-xl">
							Create with Aris Intelligence
						</div>
					</div>
					<ul className="space-y-2">
						{[
							'Enter Title and Tags of Your Choice',
							'Click on "Generate"',
							'Click on "Upload" to Post',
						].map((text, index) => (
							<li key={index} className="flex items-start gap-3">
								<div className="w-6 h-6 rounded-full bg-gray-400 text-black border font-semibold text-sm flex items-center justify-center">
									{index + 1}
								</div>
								<span className="pr-5 break-words">{text}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Right Section */}
			<div className="flex flex-col justify-evenly text-lg w-full max-w-4xl space-y-6 lg:h-96 text-[25px] h-fit">
				<div className="flex flex-col">
					<label className="text-2xl mb-1">Title</label>
					<input
						type="text"
						placeholder="Max 250 Characters"
						value={title}
						onChange={e => setTitle(e.target.value)}
						maxLength={250}
						className="bg-transparent border rounded-lg px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb]"
					/>
				</div>

				<div className="flex flex-col">
					<label className="text-2xl mb-1">
						Tags{' '}
						{tags.length > 0 && (
							<span className="text-sm text-gray-400">({tags.length}/5)</span>
						)}
					</label>

					{/* Display existing tags */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-2">
							{tags.map((tag, index) => (
								<span
									key={index}
									className="bg-[#1583fb] text-white px-3 py-1 rounded-full text-[16px] flex items-center gap-2"
								>
									{tag}
									<button
										onClick={() => removeTag(tag)}
										className="hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs"
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
						onChange={e => setTagInput(e.target.value)}
						onKeyPress={handleTagInputKeyPress}
						disabled={tags.length >= 5}
						className="bg-transparent border rounded-lg px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none border-[#1583fb] disabled:opacity-50 disabled:cursor-not-allowed"
					/>
				</div>

				<div className="flex flex-row justify-evenly gap-4">
					<button className="rounded-full bg-[#28e0ca] px-4 py-2 w-64 text-black font-semibold">
						Upload
					</button>
					<button className="rounded-full border border-[#28e0ca] text-[#28e0ca] px-4 py-2 w-64 flex items-center justify-center gap-2 font-semibold">
						Generate
						<HiSparkles />
					</button>
				</div>
			</div>
		</div>
	)
}

export default UploadComponent

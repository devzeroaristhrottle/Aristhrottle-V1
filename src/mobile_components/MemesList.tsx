import React, { useState } from 'react'
import Memecard from './Memecard'
import MemeDetails from './MemeDetails'
import { MemesListProps } from './types'

function MemesList({
	memes,
	pageType,
	onVote,
	onShare,
	onBookmark,
	bookmarkedMemes = new Set(),
}: MemesListProps) {
	const [selectedMeme, setSelectedMeme] = useState<
		(typeof memes)[0] | undefined
	>(undefined)
	const [isDetailsOpen, setIsDetailsOpen] = useState(false)

	if (!memes.length) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				No Contents available
			</div>
		)
	}

	const handleMemeClick = (meme: (typeof memes)[0]) => {
		setSelectedMeme(meme)
		setIsDetailsOpen(true)
	}

	const handleDetailsClose = () => {
		setIsDetailsOpen(false)
		setSelectedMeme(undefined)
	}

	return (
		<>
			<div className="h-full overflow-y-auto">
				<div className="grid grid-cols-1 gap-4 px-4 pb-4">
					{memes.map(meme => (
						<div key={meme._id} onClick={() => handleMemeClick(meme)}>
							<Memecard
								meme={meme}
								pageType={pageType}
								onVote={onVote}
								onShare={onShare}
								onBookmark={onBookmark}
								isBookmarked={bookmarkedMemes.has(meme._id)}
							/>
						</div>
					))}
				</div>
			</div>

			{selectedMeme && (
				<MemeDetails
					isOpen={isDetailsOpen}
					onClose={handleDetailsClose}
					meme={selectedMeme}
					tab={pageType}
					onVoteMeme={(memeId: string) => onVote?.(memeId)}
					bmk={bookmarkedMemes.has(selectedMeme._id)}
				/>
			)}
		</>
	)
}

export default MemesList

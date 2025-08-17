import React, { useState } from 'react'
import Memecard from './Memecard'
import MemeDetails from './MemeDetails'
import { MemesListProps } from './types'
import ReportModal from './ReportModal';

function MemesList({
	memes,
	pageType,
	onVote,
	onShare,
	onBookmark,
	bookmarkedMemes = new Set(),
	view = 'list'
}: MemesListProps) {
	const [selectedMeme, setSelectedMeme] = useState<
		(typeof memes)[0] | undefined
	>(undefined)
	const [isDetailsOpen, setIsDetailsOpen] = useState(false)
	const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportMemeId, setReportMemeId] = useState<string | null>(null);

    const handleOpenReport = (memeId: string) => {
        setReportMemeId(memeId);
        setReportModalOpen(true);
    };
    const handleCloseReport = () => {
        setReportModalOpen(false);
        setReportMemeId(null);
    };
    const handleSubmitReport = (memeId: string, reason: string) => {
        // TODO: Implement report submission logic (API call, toast, etc.)
        console.log('Report submitted for', memeId, 'Reason:', reason);
    };

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
			<div className={`grid ${view === 'grid' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 px-4 pb-4`}>
				{memes.map(meme => (
					<div key={meme._id} className={view === 'grid' ? 'aspect-square' : ''}>
						<Memecard
							meme={meme}
							pageType={pageType}
							onVote={onVote}
							onShare={onShare}
							onBookmark={onBookmark}
							isBookmarked={bookmarkedMemes.has(meme._id)}
							onImageClick={() => handleMemeClick(meme)}
							onReport={handleOpenReport}
							isGridView={view === 'grid'}
						/>
					</div>
				))}
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
			<ReportModal
                isOpen={reportModalOpen}
                onClose={handleCloseReport}
                memeId={reportMemeId}
                onSubmit={handleSubmitReport}
            />
		</>
	)
}

export default MemesList

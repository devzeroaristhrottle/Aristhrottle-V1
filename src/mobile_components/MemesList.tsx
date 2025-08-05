import React from 'react'
import Memecard from './Memecard'

import { MemesListProps } from './types'

function MemesList({
  memes,
  pageType,
  onVote,
  onShare,
  onBookmark,
  bookmarkedMemes = new Set()
}: MemesListProps) {
  if (!memes.length) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        No Contents available
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-4 px-4 pb-4">
        {memes.map((meme) => (
          <Memecard
            key={meme._id}
            meme={meme}
            pageType={pageType}
            onVote={onVote}
            onShare={onShare}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedMemes.has(meme._id)}
          />
        ))}
      </div>
    </div>
  )
}

export default MemesList
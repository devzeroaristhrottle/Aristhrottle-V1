import React from 'react'
import Memecard from './Memecard'

interface Meme {
  _id: string
  name: string
  image_url: string
  vote_count: number
  is_onchain: boolean
  has_user_voted?: boolean
  bookmarks?: string[]
  rank?: number
  created_by?: {
    username: string
    profile_pic?: string
  }
}

interface MemesListProps {
  memes: Meme[]
  pageType: 'live' | 'all'
  onVote?: (memeId: string) => void
  onShare?: (memeId: string, imageUrl: string) => void
  onBookmark?: (memeId: string, name: string, imageUrl: string) => void
  bookmarkedMemes?: Set<string>
}

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
        No memes available
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
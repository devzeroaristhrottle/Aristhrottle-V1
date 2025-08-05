import React from 'react'
import { Logo } from '@/components/Logo'
import { FaRegShareFromSquare } from 'react-icons/fa6'
import { CiBookmark } from 'react-icons/ci'
import { FaBookmark } from 'react-icons/fa'

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

interface MemeCardProps {
  meme: Meme
  pageType: 'live' | 'all'
  onVote?: (memeId: string) => void
  onShare?: (memeId: string, imageUrl: string) => void
  onBookmark?: (memeId: string, name: string, imageUrl: string) => void
  isBookmarked?: boolean
}

function Memecard({ 
  meme, 
  pageType,
  onVote,
  onShare,
  onBookmark,
  isBookmarked = false
}: MemeCardProps) {
  return (
    <div className="w-full bg-black/5 rounded-lg overflow-hidden mb-4">
      {/* User info header */}
      <div className="p-3 flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-none">
          {meme.created_by?.profile_pic ? (
            <img
              src={meme.created_by.profile_pic}
              alt={meme.created_by.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm">
              {meme.created_by?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-medium truncate">{meme.name}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-xs truncate">
              {meme.created_by?.username || 'Anonymous'}
            </span>
            {pageType === 'all' && meme.rank && (
              <span className="text-gray-400 text-xs">#{meme.rank}</span>
            )}
          </div>
        </div>
      </div>

      {/* Meme image */}
      <img
        src={meme.image_url}
        alt={meme.name}
        className="w-full aspect-square object-cover"
      />
      
      {/* Action buttons */}
      <div className="p-3 bg-black/5">
        <div className="flex justify-between items-center">
          {/* Empty div for spacing */}
          <div className="w-16" />
          
          {/* Vote button in middle */}
          <div className="flex justify-center">
            {!meme.is_onchain && onVote && (
              <Logo
                classNames="w-8 h-8 cursor-pointer"
                onClick={() => onVote(meme._id)}
              />
            )}
          </div>
          
          {/* Share and bookmark on right */}
          <div className="flex items-center space-x-3 w-16 justify-end">
            {onShare && (
              <FaRegShareFromSquare
                className="w-5 h-5 text-white cursor-pointer"
                onClick={() => onShare(meme._id, meme.image_url)}
              />
            )}
            {onBookmark && (
              isBookmarked ? (
                <FaBookmark
                  className="w-5 h-5 text-white cursor-pointer"
                  onClick={() => onBookmark(meme._id, meme.name, meme.image_url)}
                />
              ) : (
                <CiBookmark
                  className="w-6 h-6 text-white cursor-pointer"
                  onClick={() => onBookmark(meme._id, meme.name, meme.image_url)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Memecard
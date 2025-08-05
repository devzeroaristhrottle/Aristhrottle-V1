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
      <div className="relative">
        <img
          src={meme.image_url}
          alt={meme.name}
          className="w-full aspect-square object-cover"
        />
        
        {/* Overlay with actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h3 className="text-white text-sm truncate max-w-[150px]">{meme.name}</h3>
              {pageType === 'all' && meme.rank && (
                <span className="text-white text-xs">#{meme.rank}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {!meme.is_onchain && onVote && (
                <Logo
                  classNames="w-6 h-6 cursor-pointer"
                  onClick={() => onVote(meme._id)}
                />
              )}
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
    </div>
  )
}

export default Memecard
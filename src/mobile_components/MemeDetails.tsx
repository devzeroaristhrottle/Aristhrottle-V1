'use client'

import React, { useContext, useEffect, useState } from 'react'
import { FaBookmark, FaRegShareFromSquare, FaSpinner } from 'react-icons/fa6'
import { CgCloseO } from 'react-icons/cg'
import { CiBookmark } from 'react-icons/ci'
import Image from 'next/image'
import { useAuthModal, useUser } from '@account-kit/react'
import { Context } from '@/context/contextProvider'
import { Logo } from '@/components/Logo'
import Share from '@/components/Share'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { TagI } from '@/app/home/page'
import { Meme } from '@/mobile_components/types'
import axiosInstance from '@/utils/axiosInstance'

interface MemeDetailProps {
  isOpen?: boolean
  onClose?: () => void
  meme: Meme | undefined
  tab: string
  onVoteMeme: (memeId: string) => void
  bmk: boolean
}

export default function MemeDetails({
  isOpen = true,
  onClose = () => {},
  meme,
  tab,
  onVoteMeme,
  bmk,
}: MemeDetailProps) {
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)
  const [relatedMemes, setRelatedMemes] = useState<Meme[]>([])
  const [isLoad, setIsLoad] = useState<boolean>(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const user = useUser()
  const { handleBookmark } = useMemeActions()
  const [isBookmarked, setIsBookmarked] = useState(bmk)
  const { userDetails, setUserDetails } = useContext(Context)
  const [eyeOpen, setEyeOpen] = useState<boolean>(meme?.has_user_voted || false)

  const { openAuthModal } = useAuthModal()

  const handleShareClose = () => setIsShareOpen(false)

  const isMeme = (meme: Meme): meme is Meme =>
    'tags' in meme && Array.isArray(meme.tags)

  const getRelatedMemes = async () => {
    try {
      if (meme && isMeme(meme) && meme.tags && meme.tags.length > 0) {
        setIsLoad(true)
        const tags = meme.tags.map(t => t.name ? t.name : t).join(',')
        const response = await axiosInstance.get(`/api/meme?name=${tags}`)
        if (response.data.memes) {
          setRelatedMemes(response.data.memes)
        }
        setIsLoad(false)
      }
    } catch (error) {
      console.log(error)
      setIsLoad(false)
    }
  }

  const handleVote = (memeId: string) => {
    try {
      if (!userDetails) {
        openAuthModal()
        return
      }
      onVoteMeme(memeId)
      setShowPointsAnimation(true)
      setTimeout(() => {
        setShowPointsAnimation(false)
      }, 2000)
      if (userDetails) {
        setUserDetails({
          ...userDetails,
          mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
        })
      }
      setEyeOpen(true)
    } catch (err) {
      console.log(err)
    }
  }

  const handleBookmarkClick = async (memeId: string) => {
    try {
      await handleBookmark(memeId)
      setIsBookmarked(!isBookmarked)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    setEyeOpen(meme?.has_user_voted || false)
    getRelatedMemes()
  }, [meme])

  useEffect(() => {
    setIsBookmarked(bmk)
  }, [bmk])

  if (!meme) return null

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="relative w-full h-full bg-black/90 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/90 px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#29e0ca]/20">
                <img
                  src={meme.created_by?.profile_pic}
                  alt="Profile Pic"
                  className="h-8 w-8 rounded-full"
                />
              </div>
              <span className="text-[#29e0ca] text-lg font-semibold">
                {meme.created_by?.username}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm border border-white/20"
            >
              <CgCloseO className="text-white w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Image */}
            <div className="relative aspect-square w-full">
              <img
                src={meme.image_url}
                alt={meme.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Vote Count */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm">
                {eyeOpen ? (
                  <Image
                    src="/assets/vote/icon1.png"
                    width={20}
                    height={20}
                    alt="vote"
                    className="transition-all duration-300 cursor-not-allowed"
                  />
                ) : (
                  <Logo
                    classNames={
                      'w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 ' +
                      (meme.created_by?._id === userDetails?._id
                        ? '!cursor-not-allowed'
                        : '!cursor-pointer')
                    }
                    onClick={() =>
                      meme.created_by?._id != userDetails?._id &&
                      handleVote(meme._id)
                    }
                  />
                )}
                <span className="text-[#1783fb] font-bold text-lg">
                  {meme.vote_count}
                </span>
                {showPointsAnimation && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]">
                    +0.1 $eART
                  </div>
                )}
              </div>

              {/* Bookmark */}
              {user && user.address && (
                <button
                  onClick={() => handleBookmarkClick(meme._id)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300"
                >
                  {isBookmarked ? (
                    <FaBookmark className="text-white w-4 h-4" />
                  ) : (
                    <CiBookmark className="text-white w-4 h-4" />
                  )}
                  <span className="text-[#1783fb] font-bold text-lg">
                    {Array.isArray(meme.bookmarks)
                      ? meme.bookmarks.length
                      : meme.bookmarks}
                  </span>
                </button>
              )}

              {/* Share */}
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300"
              >
                <FaRegShareFromSquare className="text-white w-4 h-4" />
              </button>
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[#1783fb] text-lg font-semibold block">
                  Title
                </label>
                <p className="text-white text-base font-medium bg-white/10 rounded-lg p-3 border border-white/20">
                  {meme.name}
                </p>
              </div>

              {/* Tags */}
              {isMeme(meme) && meme.tags && meme.tags.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[#1783fb] text-lg font-semibold block">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {meme.tags.map((tag, index: number) => (
                      <span
                        key={index}
                        className="bg-transparent border-2 border-[#1783fb] rounded-lg px-3 py-1.5 text-sm text-white font-medium backdrop-blur-sm"
                      >
                        {tab === 'live'
                          ? tag.name
                          : typeof tag === 'string'
                          ? tag
                          : tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Memes */}
              {isMeme(meme) && relatedMemes.length > 0 && (
                <div className="mt-6 space-y-3">
                  <label className="text-[#1783fb] text-lg font-semibold block">
                    Related Memes
                  </label>
                  {!isLoad ? (
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        let displayedCount = 0;
                        return relatedMemes.map((item, index) => {
                          if (
                            displayedCount < 6 &&
                            !hidden.has(item._id) &&
                            meme.name !== item.name
                          ) {
                            displayedCount++;
                            return (
                              <div
                                key={index}
                                className={`group relative aspect-square border-2 border-white/20 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/40 ${
                                  hidden.has(item._id) ? "!hidden" : ""
                                }`}
                                hidden={hidden.has(item._id)}
                              >
                                <img
                                  src={item.image_url}
                                  alt={`Related meme ${displayedCount}`}
                                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                                    hidden.has(item._id) ? "!hidden" : ""
                                  }`}
                                  hidden={hidden.has(item._id)}
                                  onError={() =>
                                    setHidden((prev) => new Set([...prev, item._id]))
                                  }
                                />
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin h-8 w-8 text-[#1783fb]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <Share
          onClose={handleShareClose}
          imageUrl={meme?.image_url}
          id={meme?._id}
        />
      )}
    </>
  )
}
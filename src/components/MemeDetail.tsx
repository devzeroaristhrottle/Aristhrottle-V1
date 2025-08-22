'use client'

import { FaBookmark, FaRegShareFromSquare } from 'react-icons/fa6'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'

import { CgCloseO } from 'react-icons/cg'
import Share from './Share'
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Meme, TagI } from '@/app/home/page'
import { LeaderboardMeme } from '@/app/home/leaderboard/page'
import { MdOutlineExpandMore } from 'react-icons/md'
import axiosInstance from '@/utils/axiosInstance'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useAuthModal, useUser } from '@account-kit/react'
import Image from 'next/image'
import { Context } from '@/context/contextProvider'
import { Logo } from '@/components/Logo'
import { useRouter } from 'next/navigation'
import { FaSpinner } from 'react-icons/fa'
import { MemeData } from '@/app/landing/carousel'

interface MemeDetailProps {
  isOpen?: boolean
  onClose?: () => void
  onNext?: () => void
  onPrev?: () => void
  meme: LeaderboardMeme | Meme | undefined | MemeData
  searchRelatedMemes?: Dispatch<SetStateAction<string>>
  tab: string
  onVoteMeme: (memeId: string) => void
  bmk: boolean
  onRelatedMemeClick?: (meme: Meme) => void
}

interface Category {
  name: string
}

export default function MemeDetail({
  isOpen = true,
  onClose = () => {},
  onNext,
  onPrev,
  meme,
  searchRelatedMemes,
  tab,
  onVoteMeme,
  bmk,
  onRelatedMemeClick,
}: MemeDetailProps) {
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [relatedMemes, setRelatedMemes] = useState<Meme[]>([])
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)
  const user = useUser()
  const router = useRouter()
  const { handleBookmark } = useMemeActions()
  const [isBookmarked, setIsBookmarked] = useState(bmk)
  const { userDetails, setUserDetails } = useContext(Context)
  const [eyeOpen, setEyeOpen] = useState<boolean>(meme?.has_user_voted || false)
  const [isLoad, setIsLoad] = useState<boolean>(false)

  const { openAuthModal } = useAuthModal()
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  console.log(meme, meme && meme.tags, 'abc')

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const handleShareClose = () => setIsShareOpen(false)

  const isMeme = (meme: Meme | LeaderboardMeme | MemeData  ): meme is Meme =>
    'tags' in meme && Array.isArray(meme.tags)

  const getRelatedMemes = async () => {
    try {
      if (meme && isMeme(meme) && meme.tags.length > 0) {
        setIsLoad(true)
        const tags = meme.tags.map((t) => (t.name ? t.name : t)).join(',')
        const response = await axiosInstance.get(`/api/meme?name=${tags}`)
        if (response.data.memes) {
          setRelatedMemes([...response.data.memes])
        }
        setIsLoad(false)
      }
    } catch (error) {
      console.log(error)
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

  const handleMoreClick = () => {
    if (meme && isMeme(meme) && meme.tags.length > 0) {
      // Extract tag names and join them with commas
      const tagNames = meme.tags
        .map((tag) => (typeof tag === 'string' ? tag : tag.name))
        .join(',')

      // Store in localStorage
      localStorage.setItem('landingSearchTags', tagNames)
      localStorage.setItem('landingActiveTab', 'all')

      // Navigate to landing page
      router.push('/landing')
      onClose()
    }
  }

  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onNext) {
      onNext()
    }
    if (isRightSwipe && onPrev) {
      onPrev()
    }
  }

  useEffect(() => {
    setEyeOpen(meme?.has_user_voted || false)
    getRelatedMemes()
  }, [meme])

  // Sync bookmark state when bmk prop changes
  useEffect(() => {
    setIsBookmarked(bmk)
  }, [bmk])

  // Close dialog on Escape key press and handle arrow keys
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && onPrev) {
        onPrev()
      } else if (event.key === 'ArrowRight' && onNext) {
        onNext()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isOpen, onClose, onNext, onPrev])

  if (!meme) return null

  if (!isOpen) return null

  console.log(
    meme,
    meme.tags,
    isMeme(meme),
    tab === 'live',
    typeof meme.tags[0] === 'string',
    meme.tags[0],
    'abc'
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm '
        onClick={onClose}
      />

      {/* Main Container */}
      <div className='fixed inset-0 z-50 sm:pt-16 pt-0'>
        <div className='relative w-full h-full bg-transparent'>
          {/* Close Button */}

          {/* Navigation Arrows for Large Screens */}
          {onPrev && (
            <button
              onClick={onPrev}
              className='absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm border border-white/20 sm:flex items-center justify-center hidden'
            >
              <FaChevronLeft className='text-white w-6 h-6' />
            </button>
          )}

          {onNext && (
            <button
              onClick={onNext}
              className='absolute right-4 sm:right-80 lg:right-96 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm border border-white/20 sm:flex items-center justify-center hidden'
            >
              <FaChevronRight className='text-white w-6 h-6' />
            </button>
          )}

          {/* Fullscreen Meme Image with Touch Events */}
          <div
            className='absolute inset-0 sm:right-80 lg:right-96 items-center justify-center backdrop-blur-lg hidden sm:flex'
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={meme.image_url}
              alt={meme.name}
              className='max-w-full max-h-full object-contain hidden sm:block'
            />
          </div>

          {/* Right Side Details Overlay */}
          <div className='absolute top-0 right-0 w-full sm:w-80 lg:w-96 h-full bg-black/90 backdrop-blur-md overflow-y-auto scrollbar-hide p-4 sm:p-6'>
            <div className='pt-16 lg:pt-0' />
            {/* Header */}
            <div className='flex flex-row justify-between items-center mb-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-full bg-[#29e0ca]/20 mt-11'>
                  <img
                    src={meme.created_by.profile_pic}
                    alt='Profile Pic'
                    className='h-8 w-8 rounded-full'
                  />
                </div>
                <span className='text-[#29e0ca] text-xl font-semibold mt-11'>
                  {meme.created_by.username}
                </span>
              </div>

              <button
                onClick={onClose}
                className='z-50 p-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm '
              >
                <CgCloseO className='text-white w-6 h-6 mt-11' />
              </button>
            </div>

            {/* Mobile Image with Touch Events */}
            <div
              className='inset-0 sm:right-80 lg:right-96 flex sm:hidden items-center justify-center backdrop-blur-lg '
              style={{ height: 'calc(100vh - 350px)' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {onPrev && (
                <button
                  onClick={onPrev}
                  className='absolute left-1 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center sm:hidden'
                >
                  <FaChevronLeft className='text-white w-6 h-6' />
                </button>
              )}
              <img
                src={meme.image_url}
                alt={meme.name}
                className='max-w-full max-h-full object-contain block sm:hidden'
              />
              {onNext && (
                <button
                  onClick={onNext}
                  className='absolute right-1 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center sm:hidden'
                >
                  <FaChevronRight className='text-white w-6 h-6' />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-3 my-6'>
              {/* Vote Count */}
              <div className='flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm'>
                {eyeOpen ? (
                  <Image
                    src={'/assets/vote/icon1.png'}
                    width={20}
                    height={20}
                    alt='vote'
                    className='transition-all duration-300 cursor-not-allowed'
                  />
                ) : (
                  <Logo
                    classNames={
                      'w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 ' +
                      (meme.created_by._id === userDetails?._id
                        ? '!cursor-not-allowed'
                        : '!cursor-pointer')
                    }
                    onClick={() =>
                      meme.created_by._id != userDetails?._id &&
                      handleVote(meme._id)
                    }
                  />
                )}
                <span className='text-[#1783fb] font-bold text-lg'>
                  {meme.vote_count}
                </span>
                {/* +0.1 Points Animation */}
                {showPointsAnimation && (
                  <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 text-[#28e0ca] font-bold text-lg opacity-0 animate-[flyUp_2s_ease-out_forwards]'>
                    +0.1 $eART
                  </div>
                )}
              </div>

              {/* Share */}

              {/* Bookmark */}
              {user && user.address && (
                <button
                  onClick={() => {
                    handleBookmarkClick(meme._id)
                  }}
                  className='flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300'
                >
                  {isBookmarked ? (
                    <FaBookmark className='text-white w-4 h-4' />
                  ) : (
                    <CiBookmark className='text-white w-4 h-4' />
                  )}
                  <span className='text-[#1783fb] font-bold text-lg'>
                    {Array.isArray(meme.bookmarks)
                      ? meme.bookmarks.length
                      : meme.bookmarks}
                  </span>
                </button>
              )}

              <button
                onClick={() => setIsShareOpen(true)}
                className='flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl px-3 py-2 backdrop-blur-sm hover:bg-blue-500/30 transition-all duration-300'
              >
                <FaRegShareFromSquare className='text-white w-4 h-4' />
              </button>
            </div>

            {/* Details Section */}
            <div className='space-y-4'>
              {/* Title */}
              <div className='space-y-2'>
                <label className='text-[#1783fb] text-lg font-semibold block'>
                  Title
                </label>
                <p className='text-white text-base font-medium bg-white/10 rounded-lg p-3 border border-white/20'>
                  {meme.name}
                </p>
              </div>

              {/* Categories */}
              {'categories' in meme && meme.categories?.length > 0 && (
                <div className='space-y-3'>
                  <label className='text-[#1783fb] text-lg font-semibold block'>
                    Categories
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {meme.categories.map(
                      (category: Category, index: number) => (
                        <span
                          key={index}
                          className='bg-gradient-to-r from-[#1783fb]/20 to-[#1783fb]/10 border border-[#1783fb]/50 rounded-lg px-3 py-1.5 text-sm text-white font-medium backdrop-blur-sm'
                        >
                          {category.name}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {isMeme(meme) && meme.tags.length > 0 && (
                <div className='space-y-3'>
                  <label className='text-[#1783fb] text-lg font-semibold block'>
                    Tags
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {meme.tags.map((tag: TagI, index: number) => (
                      <span
                        key={index}
                        className='bg-transparent border-2 border-[#1783fb] rounded-lg px-3 py-1.5 text-sm text-white font-medium backdrop-blur-sm flex flex-row items-center justify-center gap-1'
                      >
                        {typeof tag === 'string' ? tag : tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isMeme(meme) &&
                relatedMemes.length > 0 &&
                searchRelatedMemes && (
                  <div className='mt-4 lg:mt-6 space-y-3'>
                    <h3 className='text-xl sm:text-2xl lg:text-3xl text-[#1783fb] font-bold'>
                      Related Contents
                    </h3>

                    {!isLoad ? (
                      <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                        {(() => {
                          let displayedCount = 0
                          return relatedMemes.map((item, index) => {
                            if (
                              displayedCount < 6 &&
                              !hidden.has(item._id) &&
                              meme.name !== item.name
                            ) {
                              displayedCount++
                              return (
                                <div
                                  key={index}
                                  onClick={() => {
                                    if (item.categories.length > 0) {
                                      searchRelatedMemes(
                                        item.categories[0].name
                                      )
                                      onClose()
                                    }
                                    if (onRelatedMemeClick)
                                      onRelatedMemeClick(item)
                                  }}
                                  className={`group relative aspect-square border-2 border-white/20 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/40 hover:scale-105 ${
                                    hidden.has(item._id) ? '!hidden' : ''
                                  }`}
                                  hidden={hidden.has(item._id)}
                                >
                                  <img
                                    src={item.image_url}
                                    alt={`Related meme ${displayedCount}`}
                                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                                      hidden.has(item._id) ? '!hidden' : ''
                                    }`}
                                    hidden={hidden.has(item._id)}
                                    onError={() =>
                                      setHidden(
                                        (prev) => new Set([...prev, item._id])
                                      )
                                    }
                                  />
                                </div>
                              )
                            }
                            return null
                          })
                        })()}
                      </div>
                    ) : (
                      <div className='flex justify-center items-center'>
                        <FaSpinner className='animate-spin h-10 w-10' />
                      </div>
                    )}

                    <div className='justify-center mt-6 hidden'>
                      <button
                        onClick={handleMoreClick}
                        className='flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/20 transition-all duration-300'
                      >
                        <span className='text-white text-base sm:text-lg font-medium'>
                          More
                        </span>
                        <MdOutlineExpandMore className='text-white text-lg sm:text-xl' />
                      </button>
                    </div>
                  </div>
                )}
              <div className='pb-7 lg:pb-0' />
            </div>
          </div>
        </div>
      </div>

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


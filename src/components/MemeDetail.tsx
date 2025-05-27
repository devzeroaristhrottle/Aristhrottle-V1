'use client'

import { FaBookmark, FaRegShareFromSquare } from 'react-icons/fa6'
import {
  DialogContent,
  DialogBody,
  DialogBackdrop,
  DialogRoot,
} from '@chakra-ui/react'
import { CgCloseO, CgProfile } from 'react-icons/cg'
import Share from './Share'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Meme, TagI } from '@/app/home/page'
import { LeaderboardMeme } from '@/app/home/leaderboard/page'
import { MdOutlineExpandMore } from 'react-icons/md'
import axiosInstance from '@/utils/axiosInstance'
import { useMemeActions } from '@/app/home/bookmark/bookmarkHelper'
import { CiBookmark } from 'react-icons/ci'
import { useUser } from '@account-kit/react'

interface MemeDetailProps {
  isOpen?: boolean
  onClose?: () => void
  meme: Meme | LeaderboardMeme | undefined
  searchRelatedMemes?: Dispatch<SetStateAction<string>>
}

interface Category {
  name: string
}

export default function MemeDetail({
  isOpen = true,
  onClose = () => {},
  meme,
  searchRelatedMemes,
}: MemeDetailProps) {
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [relatedMemes, setRelatedMemes] = useState<Meme[]>([])
  const user = useUser()
  const { handleBookmark } = useMemeActions()
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleShareClose = () => setIsShareOpen(false)

  const isMeme = (meme: Meme | LeaderboardMeme): meme is Meme =>
    'tags' in meme && Array.isArray(meme.tags)

  const getRelatedMemes = async () => {
    try {
      if (meme && isMeme(meme) && meme.tags.length > 0) {
        const tags = meme.tags.map((t) => t.name).join(',')
        const response = await axiosInstance.get(`/api/meme?name=${tags}`)
        if (response.data.memes) {
          setRelatedMemes([...response.data.memes])
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getBookmarks = () => {
    const bookmarks = localStorage.getItem('bookmarks')
    if (bookmarks) {
      const bookmarksObj = JSON.parse(bookmarks)
      if (meme && bookmarksObj[meme._id]) {
        setIsBookmarked(true)
      } else {
        setIsBookmarked(false)
      }
    }
  }

  useEffect(() => {
    getRelatedMemes()
  }, [meme])

  if (!meme) return null

  return (
    <>
      <DialogRoot open={isOpen} motionPreset='slide-in-bottom'>
        <DialogBackdrop className='backdrop-blur-md' />
        <div className='flex justify-center items-center h-screen'>
          <DialogContent className='fixed inset-1 md:inset-2 bg-[#141e29] border border-white w-[90vw] md:w-[60vw] h-[70vh] md:h-[80vh] max-w-none p-0'>
            <DialogBody className='overflow-y-auto no-scrollbar mx-4 md:mx-8 my-4'>
              <CgCloseO
                onClick={onClose}
                className='z-50 absolute -top-6 -right-4 text-white w-5 h-5 cursor-pointer'
              />
              <div className='flex items-center gap-x-2 mb-1'>
                <CgProfile className='w-5 h-5' />
                <span className='text-[#29e0ca] text-lg font-semibold'>
                  {meme.created_by.username}
                </span>
              </div>

              <div className='flex flex-col md:flex-row gap-x-8'>
                {/* Left side */}
                <div className='w-[250px] h-[250px] md:w-[330px] md:h-[330px] col-span-5'>
                  <img
                    src={meme.image_url}
                    alt={meme.name}
                    className='w-full cursor-pointer border-2 border-white'
                  />
                  <div className='flex justify-between items-center mt-2'>
                    <div className='flex items-center gap-4'>
                      <div onClick={() => setIsShareOpen(true)}>
                        <FaRegShareFromSquare className='text-xl cursor-pointer' />
                        <p className='text-[#1783fb] text-center'>
                          {meme.shares}
                        </p>
                      </div>
                      {user && user.address ? (
                        <div>
                          {isBookmarked ? (
                            <div className='flex flex-col items-center cursor-pointer'>
                              <FaBookmark
                                className='w-4 h-4 md:w-6 md:h-6'
                                onClick={() => {
                                  handleBookmark(
                                    meme._id,
                                    meme.name,
                                    meme.image_url
                                  )
                                  getBookmarks()
                                }}
                              />
                              <span className='text-xl md:text-2xl text-[#1783fb]'>
                                {meme.bookmarks}
                              </span>
                            </div>
                          ) : (
                            <div className='flex flex-col items-center cursor-pointer'>
                              <CiBookmark
                                className='w-4 h-4 md:w-6 md:h-6'
                                onClick={() => {
                                  handleBookmark(
                                    meme._id,
                                    meme.name,
                                    meme.image_url
                                  )
                                  getBookmarks()
                                }}
                              />
                              <span className='text-xl md:text-2xl text-[#1783fb]'>
                                {meme.bookmarks}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className='mt-4 space-y-2 md:space-y-6'>
                  <div className='flex items-center gap-4'>
                    <label className='text-[#1783fb] text-lg md:text-2xl'>
                      Title :
                    </label>
                    <p className='text-lg md:text-2xl font-semibold'>
                      {meme.name}
                    </p>
                  </div>

                  {'categories' in meme && meme.categories?.length > 0 && (
                    <div className='flex flex-col'>
                      <label className='text-[#1783fb] text-lg md:text-2xl'>
                        Categories :
                      </label>
                      <div className='flex flex-wrap gap-3 mt-2'>
                        {meme.categories.map(
                          (category: Category, index: number) => (
                            <button
                              key={index}
                              className='text-balance border-2 border-[#1783fb] rounded-lg px-3 py-1'
                            >
                              {category.name}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {isMeme(meme) && meme.tags.length > 0 && (
                    <div className='flex flex-col'>
                      <label className='text-[#1783fb] text-lg md:text-2xl'>
                        Tags :
                      </label>
                      <div className='flex flex-wrap gap-2 md:gap-3 md:mt-2'>
                        {meme.tags.map((tag: TagI, index: number) => (
                          <button
                            key={index}
                            className='text-balance border-2 border-[#1783fb] rounded-lg px-1 md:px-3 md:py-1'
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='flex items-center gap-4'>
                    <label className='text-nowrap text-[#1783fb] text-base md:text-2xl'>
                      Uploaded on:
                    </label>
                    <p className='text-nowrap text-base md:text-2xl font-semibold'>
                      {new Date(meme.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Related content */}
              {isMeme(meme) &&
                relatedMemes.length > 0 &&
                searchRelatedMemes && (
                  <div className='mt-6 md:mt-16'>
                    <p className='text-xl md:text-3xl text-[#1783fb] mb-1 md:mb-3'>
                      Related Contents :
                    </p>
                    <div className='flex flex-wrap items-center gap-3.5  md:gap-8'>
                      {relatedMemes.map((item, index) => {
                        if (index < 6 && meme.name !== item.name) {
                          return (
                            <div
                              key={item._id}
                              className='w-28 h-28 md:w-36 md:h-36 border-2 border-white cursor-pointer'
                              onClick={() => {
                                if (item.categories.length > 0) {
                                  searchRelatedMemes(item.categories[0].name)
                                  onClose()
                                }
                              }}
                            >
                              <img src={item.image_url} alt={`meme${index}`} />
                            </div>
                          )
                        }
                      })}
                    </div>
                    <div className='flex justify-between items-center text-center cursor-pointer border-2 border-white rounded-lg w-min mx-auto mt-6 px-2'>
                      <span className='text-base md:text-lg'>More</span>
                      <MdOutlineExpandMore className='text-lg md:text-2xl' />
                    </div>
                  </div>
                )}
            </DialogBody>
          </DialogContent>
        </div>
      </DialogRoot>

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

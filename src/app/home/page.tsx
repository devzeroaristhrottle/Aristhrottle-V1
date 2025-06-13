'use client'

import { useContext, useEffect, useState, useRef } from 'react'
import { LuSearch } from 'react-icons/lu'
import { IoCloudUploadOutline } from 'react-icons/io5'
import {
  LiaSortAmountUpAltSolid,
  LiaSortAmountDownSolid,
} from 'react-icons/lia'
import { MemeCard } from '@/components/MemeCard'
import { TabButton } from '@/components/TabButton'
import { Tag } from '@/components/ui/tag'
// import { Carousel } from "@/components/Carousel";
import MemeDetail from '@/components/MemeDetail'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input-group'
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover'
import { HStack, Input } from '@chakra-ui/react'
import axiosInstance from '@/utils/axiosInstance'
import { FaPlus, FaSort } from 'react-icons/fa'
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from '@/components/ui/pagination'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Context } from '@/context/contextProvider'
import { toast } from 'react-toastify'
import { useAuthModal, useUser } from '@account-kit/react'
import { useInView } from 'motion/react'
import { useMemeActions } from './bookmark/bookmarkHelper'
import { motion } from 'framer-motion'
import { LeaderboardMemeCard } from './leaderboard/MemeCard'
import { LeaderboardMeme } from './leaderboard/page'
import Share from '@/components/Share'
import Carousel1 from '@/components/Carousel1'

export interface Meme {
  _id: string
  vote_count: number
  name: string
  image_url: string
  tags: string[]
  categories: Category[]
  created_by: User
  createdAt: string
  updatedAt: string
  shares: string[]
  bookmarks: string[]
  is_onchain?: boolean
  __v: number
  voted?: boolean
}

interface Category {
  name: string
}

export interface TagI {
  _id: string
  count: number
  name: string
  type: 'Seasonal' | 'Event'
  startTime: string
  endTime: string
  created_by: string
  __v: number
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  username: string
  user_wallet_address: string
  createdAt: string // ISO 8601 format date
  updatedAt: string // ISO 8601 format date
  __v: number
}

export interface Bookmark {
  [key: string]: { id: string; name: string; image_url: string }
}

export default function Page() {
  const [query, setQuery] = useState('')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
  const [carouselMemes, setCarouselMemes] = useState<Meme[]>([])
  const [memes, setMemes] = useState<Meme[]>([])
  const [filterMemes, setFilterMemes] = useState<Meme[]>([])
  const [popularTags, setPopularTags] = useState<TagI[]>([])
  const [selectedMeme, setSelectedMeme] = useState<
    Meme | undefined | LeaderboardMeme
  >()
  const [totalMemeCount, setTotalMemeCount] = useState<number>(0)
  const [allMemeCount, setAllMemeCount] = useState<number>(0)
  const [allMemeData, setAllMemeData] = useState<LeaderboardMeme[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [filteredTags, setFilteredTags] = useState<TagI[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
  const [isHeaderFixed, setIsHeaderFixed] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareData, setShareData] = useState<{
    id: string
    imageUrl: string
  } | null>(null)

  const { userDetails, setIsUploadMemeOpen, isRefreshMeme } =
    useContext(Context)
  const { openAuthModal } = useAuthModal()

  const user = useUser()

  const offset = 30
  const pageSize = 30

  const tabsRef = useRef<HTMLDivElement>(null)
  const memeContainerRef = useRef<HTMLDivElement>(null)
  const { handleBookmark } = useMemeActions()

  const handleShare = (id: string, imageUrl: string) => {
    setShareData({ id, imageUrl })
    setIsShareOpen(true)
  }

  const handleCloseShare = () => {
    setIsShareOpen(false)
    setShareData(null)
  }

  // Sticky header logic
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && memeContainerRef.current) {
        const tabsBottom = tabsRef.current.getBoundingClientRect().bottom
        const viewportTop = 0
        const isPastTabs = tabsBottom <= viewportTop + 80 // Account for 80px navbar
        setIsHeaderFixed(isPastTabs)
      } else {
        console.log('Refs missing:', {
          tabsRef: tabsRef.current,
          memeContainerRef: memeContainerRef.current,
        })
      }
    }

    // Wait for refs to be assigned
    const setupScrollListener = () => {
      const container = memeContainerRef.current
      if (container) {
        console.log('Adding scroll listener to memeContainerRef')
        container.addEventListener('scroll', handleScroll)
        return () => {
          console.log('Removing scroll listener from memeContainerRef')
          container.removeEventListener('scroll', handleScroll)
        }
      } else {
        console.log('memeContainerRef not available yet')
      }
    }

    // Run immediately and set up cleanup
    const cleanup = setupScrollListener()

    return cleanup
  }, [])

  const findTag = async () => {
    if (query.length > 0) {
      try {
        const response = await axiosInstance.get(`/api/tags?name=${query}`)
        if (response.data.tags.length > 0) {
          setFilteredTags(response.data.tags)
        } else {
          setFilteredTags([])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    } else {
      setFilteredTags([])
    }
  }

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      findTag()
    }, 400)
    return () => clearTimeout(timeout)
  }, [query])

  const onClose = () => {
    setIsMemeDetailOpen(false)
    setSelectedMeme(undefined)
  }

  const getCarouselMemes = async () => {
    const response = await axiosInstance.get('/api/meme?type=carousel')
    if (response.data.memes) {
      setCarouselMemes([...response.data.memes])
    }
  }

  const getPopularTags = async () => {
    const response = await axiosInstance.get('/api/tags')
    if (response.data.tags) {
      setPopularTags([...response.data.tags])
    }
  }

  const voteToMeme = async (vote_to: string) => {
    try {
      if (user && user.address && activeTab === 'live') {
        const response = await axiosInstance.post('/api/vote', {
          vote_to: vote_to,
          vote_by: userDetails?._id,
        })
        if (response.status === 201) {
          toast.success('Vote casted successfully!')
          getMemes()
        }
      }
    } catch (error: any) {
      if (error.response.data.message === 'You cannot vote on your own meme') {
        toast.error(error.response.data.message)
      } else {
        toast.error('Already voted to this meme')
      }
    }
  }

  const getMemes = async () => {
    try {
      setLoading(true)
      const offsetI = offset * page
      const response = await axiosInstance.get(
        `/api/meme?offset=${offsetI}&userId=${userDetails?._id}`
      )
      if (response.data.memes) {
        setTotalMemeCount(response.data.memesCount)
        // setTotalMemeCountConst(response.data.memesCount);
        setMemes([...response.data.memes])
        setFilterMemes([...response.data.memes])
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const getMemesByName = async () => {
    try {
      setLoading(true)
      if (query.length > 0) {
        const q =
          query[query.length - 1] === ','
            ? query.slice(0, query.length - 2)
            : query

        const response = await axiosInstance.get(`/api/meme?name=${q}`)
        if (response.data.memes) {
          setFilterMemes([...response.data.memes])
        }
      }
      if (query.length === 0 && memes.length > 0) {
        setFilterMemes([...memes])
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const filterByTime = (mode: string) => {
    const filter = [...filterMemes]
    filter.sort((a, b) => {
      const dateA = Date.parse(a.createdAt)
      const dateB = Date.parse(b.createdAt)
      if (mode === 'ASC') {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    })
    setFilterMemes(filter)
  }

  const getMemeById = async () => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) {
      const response = await axiosInstance.get(`/api/meme?id=${id}`)
      if (response.data.meme) {
        setSelectedMeme(response.data.meme)
        setIsMemeDetailOpen(true)
      }
    }
  }

  useEffect(() => {
    getMemeById()
    getCarouselMemes()
    getPopularTags()
  }, [user, isRefreshMeme])

  useEffect(() => {
    getMemes()
    getMyMemes()
  }, [user, page, isRefreshMeme, userDetails])

  useEffect(() => {
    const time = setTimeout(() => {
      getMemesByName()
    }, 400)
    return () => clearTimeout(time)
  }, [query])

  // Tab-based filtering
  const getFilteredMemes = () => {
    let filtered = [...filterMemes]

    if (activeTab === 'live') {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      filtered = filtered.filter((meme) => {
        const createdAt = new Date(meme.createdAt)
        return (
          createdAt >= today &&
          createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        )
      })
    }
    // 'all' tab: no additional filtering

    return filtered
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab.toLowerCase() as 'live' | 'all')
    if (tab === 'live') {
      setTotalMemeCount(filterMemes.length)
    } else {
      setAllMemeCount(allMemeCount)
    }
    setPage(1)
  }

  const displayedMemes = getFilteredMemes()

  const isInView = useInView(memeContainerRef, {
    amount: 0.1, // Trigger when 10% visible
  })

  useEffect(() => {
    if (isInView && memeContainerRef.current) {
      setAnimateSearchBar(300)
      memeContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      setAnimateSearchBar(0)
    }
  }, [isInView, displayedMemes.length])

  const [animateSearchBar, setAnimateSearchBar] = useState(0)

  const getMyMemes = async () => {
    try {
      setLoading(true)
      const offset = 30 * page
      const response = await axiosInstance.get(
        `/api/leaderboard?daily=false&offset=${offset}`
      )

      if (response?.data?.memes) {
        setAllMemeData(response.data.memes)
        setAllMemeCount(response.data.memesCount)
      }
    } catch (error) {
      console.log(error)
      setAllMemeData([])
      setAllMemeCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleUpvoteDownvote = async (meme_id: string, rating: string) => {
    setAllMemeData((prev) =>
      prev
        .map((meme) =>
          meme._id === meme_id
            ? {
                ...meme,
                vote_count: meme.vote_count + (rating === 'upvote' ? 1 : -1),
              }
            : meme
        )
        .sort((a, b) => a.rank - b.rank)
    )
    try {
      if (user && user.address && activeTab === 'all') {
        const response = await axiosInstance.post('/api/meme/rate', {
          meme_id: meme_id,
          rating: rating,
        })
        if (response?.data?.message === 'Rating saved successfully') {
          if (rating === 'upvote') {
            toast.success('Upvoted successfully!')
          } else if (rating === 'downvote') {
            toast.success('Downvoted successfully!')
          }
          setAllMemeData((prev) =>
            prev
              .map((meme) =>
                meme._id === meme_id
                  ? { ...meme, vote_count: response.data.total }
                  : meme
              )
              .sort((a, b) => a.rank - b.rank)
          )
        }
      }
    } catch (error: any) {
      setAllMemeData((prev) =>
        prev
          .map((meme) =>
            meme._id === meme_id
              ? {
                  ...meme,
                  vote_count: meme.vote_count + (rating === 'upvote' ? -1 : 1),
                }
              : meme
          )
          .sort((a, b) => a.rank - b.rank)
      )
      console.error('Error in handleUpvoteDownvote:', error)
      toast.error(error.response.data.message)
    }
  }

  return (
    <div className='mx-8 md:ml-24 xl:mx-auto md:max-w-[56.25rem] lg:max-w-[87.5rem]'>
      {/* Upload Button */}
      <div className='flex justify-center gap-5'>
        <div
          className='text-center hover:scale-105 transition-all duration-300 cursor-pointer flex items-center justify-center flex-col pt-2'
          onClick={() => {
            if (user && user.address) {
              setIsUploadMemeOpen(true)
            } else {
              if (openAuthModal) {
                openAuthModal()
              }
            }
          }}
        >
          <div className='ring-2 ring-slate-200 w-16 h-14 rounded-md p-2'>
            <IoCloudUploadOutline className='text-slate-200 h-full w-full' />
          </div>
          <p className='text-blue-500 font-bold mt-1 text-3xl'>Upload</p>
        </div>
      </div>

      {/* Carousel */}
      <div>
        {/* <Carousel
          bookmark={handleBookmark}
          items={carouselMemes}
          setIsMemeDetailOpen={setIsMemeDetailOpen}
          active={0}
          setSelectedMeme={setSelectedMeme}
        /> */}
        {carouselMemes.length >= 5 && (
          <Carousel1
            items={carouselMemes}
            setIsMemeDetailOpen={setIsMemeDetailOpen}
            setSelectedMeme={setSelectedMeme}
            bookmark={handleBookmark}
            handleShare={handleShare}
          />
        )}
      </div>
      {/* Search Bar (Normal Layout) */}
      <div
        className={`relative mt-10 mb-8 md:mt-20 ${
          isHeaderFixed ? 'hidden' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: 1,
            y: animateSearchBar,
            transition: { duration: 0.5, ease: 'easeInOut' },
          }}
        >
          <div className='border-2 border-slate-500 rounded-2xl w-full md:w-1/2 md:py-1 mt-12 md:mx-auto bg-gray-600/15'>
            <InputGroup
              flex='2'
              className='w-full'
              startElement={
                query.length === 0 ? (
                  <LuSearch className='text-white text-lg md:text-2xl md:ml-2' />
                ) : undefined
              }
              endElement={
                query.length > 0 ? (
                  <LuSearch className='text-white text-lg md:text-2xl md:mr-2' />
                ) : undefined
              }
            >
              <Input
                placeholder='Separate by comma to search for multiple tags, titles and usernames'
                className={`text-xl md:text-2xl focus:outline-none w-full placeholder:text-sm placeholder:leading-none placeholder:md:text-lg  ${
                  query.length === 0
                    ? '!pl-10 md:!pl-14 pr-2 md:pr-4'
                    : 'pl-4 md:pl-6 pr-8 md:pr-12'
                }`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowRecommendations(true)}
                onBlur={() =>
                  setTimeout(() => setShowRecommendations(false), 200)
                }
              />
            </InputGroup>
          </div>
          {/* <p className="text-center my-1 text-sm leading-none md:text-lg">
            Separate by comma to search for multiple tags, titles and usernames
          </p> */}
          {showRecommendations && query.length > 0 && (
            <div className='border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto md:w-1/2 absolute translate-x-1/2 p-4 !bg-gradient-to-b from-[#050D28] to-[#0F345C]'>
              {filteredTags.length > 0 ? (
                <div className='flex flex-wrap items-center justify-start gap-4'>
                  {filteredTags.map((tag) => (
                    <Tag
                      key={tag._id}
                      className='px-4 py-2 cursor-pointer border rounded-xl border-[#1783fb] !bg-gradient-to-b from-[#050D28] to-[#0F345C] whitespace-nowrap'
                      onClick={() => {
                        setQuery(tag.name)
                        setShowRecommendations(false)
                      }}
                    >
                      <div className='flex gap-2 text-lg text-white items-center'>
                        {tag.name} <FaPlus size={14} className='stroke-[2px]' />
                      </div>
                    </Tag>
                  ))}
                </div>
              ) : (
                <div className='md:px-4 md:py-2 w-full text-gray-400'>
                  No recommendations found
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Popular Tags */}
      <div
        className={`mb-14 md:grid md:grid-cols-12 md:gap-x-12 md:mx-auto ${
          isHeaderFixed ? 'hidden' : ''
        }`}
      >
        <div className='md:col-span-12 md:mx-auto'>
          <p className='font-bold text-[#1783fb] text-base md:text-xl'>
            Popular Tags
          </p>
          <div className='my-4 flex flex-wrap gap-2 md:gap-4'>
            {popularTags.map((tag, index) => (
              <div
                onClick={() => {
                  setQuery((prevQuery) => {
                    // Split the query into an array of tags
                    const currentTags = prevQuery
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0)
                    // Only append if the tag isn't already in the query
                    if (!currentTags.includes(tag.name)) {
                      return prevQuery.length > 0
                        ? `${prevQuery}, ${tag.name}`
                        : tag.name
                    }
                    return prevQuery
                  })
                }}
                key={index}
                className='border-2 border-[#1783fb] px-1.5 md:px-3 rounded-lg cursor-pointer text-balance text-base md:text-xl py-0 md:py-1'
              >
                {tag.name}{' '}
                <span className='bg-[#1783fb] rounded-full px-1 text-xs md:text-sm md:px-2 font-bold'>
                  {tag.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs and Sort (Normal Layout) */}
      <div
        ref={tabsRef}
        className={`flex justify-between mt-36 ${
          isHeaderFixed ? 'hidden' : ''
        }`}
      >
        <div className='flex justify-between gap-x-2 md:gap-x-3 z-10'>
          <TabButton
            label='Live'
            classname='!px-2 md:!px-5'
            isActive={activeTab === 'live'}
            onClick={() => handleTabChange('live')}
          />
          <TabButton
            label={`All${activeTab.includes('all') ? ` ${allMemeCount}` : ''}`}
            classname='!px-2 md:!px-5'
            isActive={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
          />
        </div>
        <div className=''>
          <PopoverRoot>
            <PopoverTrigger asChild>
              <Button
                size={{ sm: 'xs', md: 'sm' }}
                variant='outline'
                className='border border-[#1783fb] px-3 rounded-full text-[#1783fb] text-lg hover:scale-105'
              >
                <FaSort />
                <span>sort</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              alignContent='end'
              className='bg-[#141e29] w-fit border-none shadow-xl z-50'
            >
              <PopoverBody className='bg-[#141e29] border-2 border-[#1783fb] rounded-md p-0'>
                <div className='flex gap-3 items-center hover:bg-[#224063] px-4 py-1'>
                  <p className='text-xl text-nowrap mr-2'>By Creation Time</p>
                  <div className='flex items-center gap-3'>
                    <LiaSortAmountUpAltSolid
                      onClick={() => filterByTime('ASC')}
                      className='cursor-pointer'
                      size={20}
                    />
                    <LiaSortAmountDownSolid
                      onClick={() => filterByTime('DESC')}
                      className='cursor-pointer'
                      size={20}
                    />
                  </div>
                </div>
              </PopoverBody>
            </PopoverContent>
          </PopoverRoot>
        </div>
      </div>

      {/* Fixed Header */}
      {isHeaderFixed && (
        <div className='fixed top-0 left-0 right-0 bg-[#141e29] z-50 shadow-md py-4 px-16'>
          <div className='flex items-center max-w-7xl mx-auto'>
            {/* Tabs (Left) */}
            <div className='flex space-x-5'>
              <TabButton
                label='Live'
                classname='!px-5'
                isActive={activeTab === 'live'}
                onClick={() => handleTabChange('live')}
              />
              <TabButton
                label={`All${
                  activeTab.includes('all') ? ` ${allMemeCount}` : ''
                }`}
                classname='!px-5'
                isActive={activeTab === 'all'}
                onClick={() => handleTabChange('all')}
              />
            </div>
            {/* Search Bar (Center) */}
            <div className='flex-1 max-w-[500px] mx-4'>
              <InputGroup
                flex='2'
                className='w-full'
                startElement={
                  query.length === 0 ? (
                    <LuSearch className='text-white text-2xl ml-2' />
                  ) : undefined
                }
                endElement={
                  query.length > 0 ? (
                    <LuSearch className='text-white text-2xl mr-2' />
                  ) : undefined
                }
              >
                <Input
                  placeholder='Search'
                  className={`text-2xl focus:outline-none w-full ${
                    query.length === 0 ? '!pl-12 pr-4' : 'pl-4 pr-12'
                  } bg-gray-600/15 border-2 border-slate-500 rounded-2xl`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowRecommendations(true)}
                  onBlur={() =>
                    setTimeout(() => setShowRecommendations(false), 200)
                  }
                />
              </InputGroup>
            </div>
            {/* Sort (Right) */}
            <div>
              <PopoverRoot>
                <PopoverTrigger asChild>
                  <Button
                    size='sm'
                    variant='outline'
                    className='border border-[#1783fb] px-3 rounded-full text-[#1783fb] text-lg hover:scale-105'
                  >
                    <FaSort />
                    <span>sort</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  alignContent='end'
                  className='bg-[#141e29] w-fit border-none shadow-xl z-50'
                >
                  <PopoverBody className='bg-[#141e29] border-2 border-[#1783fb] rounded-md p-0'>
                    <div className='flex gap-3 items-center hover:bg-[#224063] px-4 py-1'>
                      <p className='text-xl text-nowrap mr-2'>
                        By Creation Time
                      </p>
                      <div className='flex items-center gap-3'>
                        <LiaSortAmountUpAltSolid
                          onClick={() => filterByTime('ASC')}
                          className='cursor-pointer'
                          size={20}
                        />
                        <LiaSortAmountDownSolid
                          onClick={() => filterByTime('DESC')}
                          className='cursor-pointer'
                          size={20}
                        />
                      </div>
                    </div>
                  </PopoverBody>
                </PopoverContent>
              </PopoverRoot>
            </div>
          </div>
          {/* Recommendations Dropdown (Fixed Header) */}
          {showRecommendations && query.length > 0 && (
            <div className='border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto mt-10 w-1/3 min-w-[200px] absolute left-1/2 transform -translate-x-1/2 p-4 !bg-gradient-to-b from-[#050D28] to-[#0F345C] z-50'>
              {filteredTags.length > 0 ? (
                <div className='flex flex-wrap items-center justify-start gap-4'>
                  {filteredTags.map((tag) => (
                    <Tag
                      key={tag._id}
                      className='px-4 py-2 cursor-pointer border rounded-xl border-[#1783fb] !bg-gradient-to-b from-[#050D28] to-[#0F345C] whitespace-nowrap'
                      onClick={() => {
                        setQuery(tag.name)
                        setShowRecommendations(false)
                      }}
                    >
                      <div className='flex gap-2 text-lg text-white items-center'>
                        {tag.name} <FaPlus size={14} className='stroke-[2px]' />
                      </div>
                    </Tag>
                  ))}
                </div>
              ) : (
                <div className='px-4 py-2 text-gray-400'>
                  No recommendations found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Meme Container */}
      <div
        ref={memeContainerRef}
        className='grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 sm:gap-10 grid-cols-1 grid-flow-row mx-auto !min-h-[500px] max-h-[calc(100vh-300px)]  mt-10 mb-6 overflow-y-auto no-scrollbar'
      >
        {!loading &&
          activeTab === 'live' &&
          displayedMemes.length > 0 &&
          displayedMemes.map((meme, index) => (
            <MemeCard
              key={meme._id}
              bookmark={handleBookmark}
              index={index}
              meme={meme}
              activeTab={activeTab}
              onOpenMeme={() => {
                setSelectedMeme(meme)
                setIsMemeDetailOpen(true)
              }}
              onVoteMeme={() => voteToMeme(meme._id)}
            />
          ))}

        {!loading &&
          activeTab === 'all' &&
          allMemeData?.length > 0 &&
          allMemeData.map((item, index) => (
            <div key={index}>
              <LeaderboardMemeCard
                meme={item}
                onOpenMeme={() => {
                  setSelectedMeme(item)
                  setIsMemeDetailOpen(true)
                }}
                onUpvoteDownvote={(memeId, rating) =>
                  handleUpvoteDownvote(memeId, rating)
                }
                activeTab={activeTab}
              />
            </div>
          ))}

        {!loading &&
          displayedMemes?.length === 0 &&
          allMemeData?.length === 0 && (
            <p className='text-center text-nowrap text-2xl mx-auto md:col-span-12'>
              Meme not found
            </p>
          )}
        {loading && (
          <AiOutlineLoading3Quarters className='animate-spin text-3xl mx-auto md:col-span-12' />
        )}
      </div>

      {/* Pagination */}
      {/* {displayedMemes.length > 0 && ( */}
      <PaginationRoot
        count={activeTab === 'all' ? allMemeCount : totalMemeCount}
        pageSize={pageSize}
        defaultPage={1}
        variant='solid'
        className='mx-auto mb-16'
        page={page}
        onPageChange={(e) => setPage(e.page)}
      >
        <HStack className='justify-center'>
          <PaginationPrevTrigger />
          <PaginationItems />
          <PaginationNextTrigger />
        </HStack>
      </PaginationRoot>
      {/* )} */}
      {/* Meme Detail Modal */}
      {isMemeDetailOpen && selectedMeme && (
        <MemeDetail
          onClose={onClose}
          meme={selectedMeme}
          searchRelatedMemes={setQuery}
        />
      )}
      {isShareOpen && shareData && (
        <Share
          id={shareData.id}
          imageUrl={shareData.imageUrl}
          onClose={handleCloseShare}
        />
      )}
    </div>
  )
}

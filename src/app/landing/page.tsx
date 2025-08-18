'use client'

import {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from 'react'
import { LuSearch } from 'react-icons/lu'
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
import { Input } from '@chakra-ui/react'
import axiosInstance from '@/utils/axiosInstance'
import { FaPlus, FaSort } from 'react-icons/fa'
import { PaginationRoot } from '@/components/ui/pagination'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Context } from '@/context/contextProvider'
import { toast } from 'react-toastify'
import { useAuthModal, useUser } from '@account-kit/react'
import { useInView } from 'motion/react'
import { useMemeActions } from '../home/bookmark/bookmarkHelper'
import { LeaderboardMemeCard } from '../home/leaderboard/MemeCard'
import { LeaderboardMeme } from '../home/leaderboard/page'
import Share from '@/components/Share'
// import UploadComponent from './UploadComponent'
import WelcomeCard from '@/components/WelcomeCard'
import { type Meme } from '../home/page'
import MemeCarousel, { type MemeData } from './carousel'

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

export interface Bookmark {
  [key: string]: { id: string; name: string; image_url: string }
}

// Create a unified type for meme selection that handles all possible types
type UnifiedMeme = Meme | MemeData | LeaderboardMeme | undefined

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Memoized components to prevent unnecessary re-renders
const MemoizedLeaderboardMemeCard = memo(LeaderboardMemeCard)
const MemoizedMemeCard = memo(MemeCard)

export default function Page() {
  const [query, setQuery] = useState('')
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [isMemeDetailOpen, setIsMemeDetailOpen] = useState(false)
  const [memes, setMemes] = useState<Meme[]>([])
  const [filterMemes, setFilterMemes] = useState<Meme[]>([])
  const [popularTags, setPopularTags] = useState<TagI[]>([])
  
  // Fix: Use unified type for selected meme
  const [selectedMeme, setSelectedMeme] = useState<UnifiedMeme>()
  const [selectedMemeIndex, setSelectedMemeIndex] = useState<number>(-1)
  
  const [totalMemeCount, setTotalMemeCount] = useState<number>(0)
  const [allMemeCount, setAllMemeCount] = useState<number>(0)
  const [allMemeData, setAllMemeData] = useState<LeaderboardMeme[]>([])
  const [allMemeDataFilter, setAllMemeDataFilter] = useState<LeaderboardMeme[]>([])
  
  const { openAuthModal } = useAuthModal()
  const [isUploading, setIsUploading] = useState(false)
  const [hiddenMemes, setHiddenMemes] = useState<Set<string>>(new Set())
  const [bookMarks, setBookMarks] = useState<LeaderboardMeme[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [filteredTags, setFilteredTags] = useState<TagI[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
  const [displayedMemes, setDisplayedMeme] = useState<Meme[]>([])
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isNewAvail, setIsNewAvail] = useState<boolean>(false)
  const [shareData, setShareData] = useState<{
    id: string
    imageUrl: string
  } | null>(null)
  const [welcOpen, setWelcOpen] = useState<boolean>(false)
  const [shownCount, setShownCount] = useState<number>(0)
  const [showUninteractedOnly, setShowUninteractedOnly] = useState<boolean>(false)
  
  const { setUserDetails, userDetails, setIsUploadMemeOpen, isRefreshMeme } = useContext(Context)
  const user = useUser()

  const offset = 30
  const pageSize = 30

  const memeContainerRef = useRef<HTMLDivElement>(null)
  const { handleBookmark } = useMemeActions()

  const handleCloseShare = () => {
    setIsShareOpen(false)
    setShareData(null)
  }

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      findTag()
    }, 400)
    return () => clearTimeout(timeout)
  }, [query])

  const onClose = () => {
    setIsMemeDetailOpen(false)
    setSelectedMeme(undefined)
    setSelectedMemeIndex(-1)
  }

  const readSearch = () => {
    const storedTags = localStorage.getItem('landingSearchTags')
    const storedTab = localStorage.getItem('landingActiveTab')

    if (storedTags) {
      setQuery(storedTags)
      localStorage.removeItem('landingSearchTags')
    }

    if (storedTab === 'all') {
      setActiveTab('all')
      localStorage.removeItem('landingActiveTab')
    }
  }

  useEffect(() => {
    axiosInstance.get('/api/new-ip').then((response) => {
      if (response.data.message && !localStorage.getItem('isNew')) {
        setWelcOpen(true)
        localStorage.setItem('isNew', 'true')
      }
    })
    fetchLeaderBoard()

    setTimeout(() => readSearch(), 1000)
  }, [])

  const handleNext = () => {
    const currentData = activeTab === 'live' ? displayedMemes : allMemeDataFilter
    if (selectedMemeIndex < currentData.length - 1) {
      const nextIndex = selectedMemeIndex + 1
      setSelectedMemeIndex(nextIndex)
      setSelectedMeme(currentData[nextIndex])
    }
  }

  const handlePrev = () => {
    const currentData = activeTab === 'live' ? displayedMemes : allMemeDataFilter
    if (selectedMemeIndex > 0) {
      const prevIndex = selectedMemeIndex - 1
      setSelectedMemeIndex(prevIndex)
      setSelectedMeme(currentData[prevIndex])
    }
  }

  const getPopularTags = async () => {
    const response = await axiosInstance.get('/api/tags')
    if (response.data.tags) {
      setPopularTags([...response.data.tags])
    }
  }

  const voteToMeme = useCallback(
    async (vote_to: string) => {
      if (!userDetails && openAuthModal) {
        openAuthModal()
        return
      }

      try {
        if (user && user.address && activeTab === 'live') {
          const currentMeme = displayedMemes.find((meme) => meme._id === vote_to)

          if (
            currentMeme?.has_user_voted ||
            currentMeme?.created_by._id === userDetails?._id
          ) {
            return
          }

          setDisplayedMeme((prev) =>
            prev.map((meme) =>
              meme._id === vote_to
                ? {
                    ...meme,
                    vote_count: meme.vote_count + 1,
                    has_user_voted: true,
                  }
                : meme
            )
          )

          setFilterMemes((prev) =>
            prev.map((meme) =>
              meme._id === vote_to
                ? {
                    ...meme,
                    vote_count: meme.vote_count + 1,
                    has_user_voted: true,
                  }
                : meme
            )
          )

          if (userDetails) {
            setUserDetails({
              ...userDetails,
              votes: userDetails.votes + 1,
            })
          }

          const response = await axiosInstance.post('/api/vote', {
            vote_to: vote_to,
            vote_by: userDetails?._id,
          })

          if (response.status === 201) {
            toast.success('Vote casted successfully!')
            pollMemes()
          }
        }
      } catch (error: any) {
        setDisplayedMeme((prev) =>
          prev.map((meme) =>
            meme._id === vote_to
              ? {
                  ...meme,
                  vote_count: Math.max(0, meme.vote_count - 1),
                  has_user_voted: false,
                }
              : meme
          )
        )

        setFilterMemes((prev) =>
          prev.map((meme) =>
            meme._id === vote_to
              ? {
                  ...meme,
                  vote_count: Math.max(0, meme.vote_count - 1),
                  has_user_voted: false,
                }
              : meme
          )
        )

        if (userDetails) {
          setUserDetails({
            ...userDetails,
            votes: Math.max(0, userDetails.votes - 1),
          })
        }

        if (error.response?.data?.message === 'You cannot vote on your own content') {
          toast.error(error.response.data.message)
        } else {
          toast.error('Already voted to this content')
        }
      }
    },
    [userDetails, openAuthModal, user, activeTab, displayedMemes, setDisplayedMeme, setFilterMemes, setUserDetails]
  )

  const getMemes = async () => {
    try {
      if (totalMemeCount == 0) setLoading(true)
      const offsetI = offset * page
      const response = await axiosInstance.get(
        `/api/meme?offset=${offsetI}&userId=${userDetails?._id}`
      )
      if (response.data.memes) {
        setTotalMemeCount(response.data.memesCount)
        setMemes(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
        setFilterMemes(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const pollMemes = async () => {
    try {
      const offsetI = offset * page
      const response = await axiosInstance.get(
        `/api/meme?offset=${offsetI}&userId=${userDetails?._id}`
      )
      if (response.data.memes) {
        if (response.data.memesCount != totalMemeCount) setIsNewAvail(true)
        setTotalMemeCount(response.data.memesCount)
        setMemes(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
        setFilterMemes(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      }
    } catch (error) {
      console.log(error)
    }
  }

  const filterLiveMemes = (memes: any[]) => {
    const now = new Date()
    now.setUTCHours(0, 0, 0, 0)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return memes.filter((meme) => {
      const createdAt = new Date(meme.createdAt)
      return createdAt >= twentyFourHoursAgo
    })
  }

  const getMemesByName = async () => {
    try {
      setLoading(true)
      if (query.length > 0) {
        const q = query[query.length - 1] === ',' ? query.slice(0, query.length - 2) : query
        const response = await axiosInstance.get(`/api/meme?name=${q}`)
        setShownCount(response.data.memesCount)
        if (response.data.memes) {
          if (activeTab === 'live') {
            const filteredMemes = filterLiveMemes(response.data.memes)
            setFilterMemes(
              [...filteredMemes].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            )
          } else {
            setAllMemeData(
              [...response.data.memes].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            )
          }
        }
      } else {
        if (activeTab === 'live') {
          const filteredMemes = filterLiveMemes(memes)
          setFilterMemes(
            [...filteredMemes].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          )
        } else {
          setAllMemeData(
            [...allMemeData].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          )
        }
        setShownCount(allMemeCount)
      }
    } catch (error) {
      console.log(error)
      if (activeTab === 'live') {
        const filteredMemes = filterLiveMemes(memes)
        setFilterMemes(
          [...filteredMemes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      } else {
        setAllMemeData(
          [...allMemeData].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const filterByTime = (mode: string) => {
    if (activeTab == 'live') {
      const filter = [...filterMemes]
      filter.sort((a, b) => {
        const dateA = Date.parse(a.createdAt)
        const dateB = Date.parse(b.createdAt)
        if (mode === 'ASC') return dateA - dateB
        else return dateB - dateA
      })
      setFilterMemes(filter)
    } else {
      let amd = [...allMemeData]
      amd.sort((a: LeaderboardMeme, b: LeaderboardMeme) => {
        const dateA = Date.parse(a.createdAt)
        const dateB = Date.parse(b.createdAt)
        if (mode === 'ASC') return dateA - dateB
        else return dateB - dateA
      })

      if (showUninteractedOnly && userDetails) {
        amd = amd.filter((meme) => {
          if (meme.has_user_voted) return false
          if (meme.created_by._id === userDetails._id) return false
          if (bookMarks.some((bookmark) => bookmark._id === meme._id)) return false
          return true
        })
      }

      setAllMemeDataFilter([...amd])
    }
  }

  const filterByVotes = (mode: string) => {
    if (activeTab == 'live') {
      const filter = [...filterMemes]
      filter.sort((a, b) => {
        if (mode === 'ASC') return a.vote_count - b.vote_count
        else return b.vote_count - a.vote_count
      })
      setFilterMemes(filter)
    } else {
      let amd = [...allMemeData]
      amd.sort((a: LeaderboardMeme, b: LeaderboardMeme) => {
        if (mode === 'ASC') return a.vote_count - b.vote_count
        else return b.vote_count - a.vote_count
      })

      if (showUninteractedOnly && userDetails) {
        amd = amd.filter((meme) => {
          if (meme.has_user_voted) return false
          if (meme.created_by._id === userDetails._id) return false
          if (bookMarks.some((bookmark) => bookmark._id === meme._id)) return false
          return true
        })
      }

      setAllMemeDataFilter([...amd])
    }
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
    getPopularTags()
  }, [user, isRefreshMeme])

  useEffect(() => {
    getMemes()
    getMyMemes()
  }, [user, page, isRefreshMeme])

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if ((document.hidden || isUploading) && pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      } else if (!document.hidden && !isUploading && activeTab === 'live') {
        pollInterval = setInterval(() => {
          pollMemes()
        }, 30000)
      }
    }

    if (activeTab === 'live' && !isUploading) {
      pollInterval = setInterval(() => {
        pollMemes()
      }, 30000)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTab, page, userDetails?._id, isUploading])

  useEffect(() => {
    const time = setTimeout(() => {
      getMemesByName()
    }, 400)
    return () => clearTimeout(time)
  }, [query])

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

    if (showUninteractedOnly && userDetails) {
      filtered = filtered.filter((meme) => {
        if (meme.has_user_voted) return false
        if (meme.created_by._id === userDetails._id) return false
        if (bookMarks.some((bookmark) => bookmark._id === meme._id)) return false
        return true
      })
    }

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

  const applyUninteractedFilterToAll = () => {
    if (showUninteractedOnly && userDetails) {
      const filtered = allMemeData.filter((meme) => {
        if (meme.has_user_voted) return false
        if (meme.created_by._id === userDetails._id) return false
        if (bookMarks.some((bookmark) => bookmark._id === meme._id)) return false
        return true
      })
      setAllMemeDataFilter(
        [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      )
    } else {
      setAllMemeDataFilter(
        [...allMemeData].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      )
    }
  }

  useEffect(() => {
    const displayedMemes = getFilteredMemes()
    setDisplayedMeme(
      [...displayedMemes].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    )
  }, [filterMemes, showUninteractedOnly, bookMarks])

  useEffect(() => {
    if (activeTab === 'all') {
      applyUninteractedFilterToAll()
    }
  }, [showUninteractedOnly, allMemeData, bookMarks, userDetails])

  const isInView = useInView(memeContainerRef, {
    amount: 0.1,
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
        setAllMemeData(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
        setAllMemeDataFilter(
          [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
        setAllMemeCount(response.data.memesCount)
        setShownCount(response.data.memesCount)
      }
    } catch (error) {
      console.log(error)
      setAllMemeData([])
      setAllMemeDataFilter([])
      setAllMemeCount(0)
      setShownCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderBoard = async () => {
    try {
      const resp = await axiosInstance.get('/api/bookmark')
      if (resp.status == 200) {
        setBookMarks(resp.data.memes)
      }
    } catch (err) {
      toast.error('Error fetching bookmarks')
    }
  }

  const handleUpvoteDownvote = useCallback(
    async (meme_id: string) => {
      if (!userDetails && openAuthModal) {
        openAuthModal()
        return
      }

      try {
        if (user && user.address && activeTab === 'all') {
          const currentMeme = allMemeDataFilter.find((meme) => meme._id === meme_id)

          if (
            currentMeme?.has_user_voted ||
            currentMeme?.created_by._id === userDetails?._id
          ) {
            return
          }

          setAllMemeDataFilter((prev) => {
            const updated = prev.map((meme) =>
              meme._id === meme_id
                ? {
                    ...meme,
                    vote_count: meme.vote_count + 1,
                    has_user_voted: true,
                  }
                : meme
            )
            return [...updated]
          })

          const response = await axiosInstance.post('/api/vote', {
            vote_to: meme_id,
            vote_by: userDetails?._id,
          })

          if (response.status === 201) {
            toast.success('Voted successfully!')

            if (userDetails) {
              setUserDetails({
                ...userDetails,
                mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
              })
            }
          }
        }
      } catch (error: any) {
        setAllMemeDataFilter((prev) =>
          prev.map((meme) =>
            meme._id === meme_id
              ? {
                  ...meme,
                  vote_count: Math.max(0, meme.vote_count - 1),
                  has_user_voted: false,
                }
              : meme
          )
        )

        console.error('Error in handleUpvoteDownvote:', error)
        toast.error(error.response?.data?.message || 'Failed to vote')
      }
    },
    [userDetails, openAuthModal, user, activeTab, allMemeDataFilter, setAllMemeDataFilter, setUserDetails]
  )

  const addMeme = (meme: Meme) => {
    setDisplayedMeme((prevMemes) =>
      [...prevMemes, meme].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    )

    if (userDetails) {
      setUserDetails({
        ...userDetails,
        uploads: userDetails.uploads + 1,
      })
    }

    if (activeTab === 'live') {
      setFilterMemes((prevFilterMemes) => {
        return [meme, ...prevFilterMemes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    }
  }

  const revertMeme = (meme: Meme) => {
    setMemes(
      memes
        .filter((m) => m._id !== meme._id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    )
    if (userDetails) {
      setUserDetails({
        ...userDetails,
        uploads: userDetails.uploads,
      })
    }
    if (activeTab === 'live') {
      setFilterMemes(
        filterMemes
          .filter((m) => m._id !== meme._id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      )
    }
  }

  useEffect(() => {
    if (memeContainerRef.current) {
      memeContainerRef.current.style.overflow =
        isMemeDetailOpen || welcOpen ? 'hidden' : 'auto'
    }
    document.body.style.overflow =
      isMemeDetailOpen || welcOpen ? 'hidden' : 'auto'
  }, [isMemeDetailOpen, welcOpen])

  const handleViewNewContents = () => {
    setIsNewAvail(false)
    if (memeContainerRef.current) {
      memeContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  const debouncedSetAllMemeDataFilter = useCallback(
    debounce((newData: LeaderboardMeme[]) => {
      setAllMemeDataFilter(newData)
    }, 100),
    []
  )

  // Fix: Update the carousel click handler to use the unified type
  const handleMemeClickCarousel = useCallback((meme: MemeData, index: number) => {
    setIsMemeDetailOpen(true)
    setSelectedMeme(meme)
    setSelectedMemeIndex(index)
  }, [])

  return (
    <div
      className='mx-8 md:ml-24 xl:mx-auto md:max-w-[56.25rem] lg:max-w-[87.5rem]'
      style={{ height: '100vh' }}
    >
      <div className='w-full overflow-hidden' style={{ width: 'calc(80vw)' }}>
        <div className='animate-marquee whitespace-nowrap w-fit'>
          <span className='text-lg sm:text-xl md:text-2xl font-semibold text-white inline-flex gap-1 sm:gap-2'>
            <span>🚀 Welcome to </span>
            <span className='text-[#28e0ca]'>Aristhrottle!</span>
            <span>🚀 Mint $eART today for </span>
            <span className='text-[#28e0ca]'>$USD tomorrow.</span>
            <span>💸 Airdrops, Incentives and Other Rewards</span>
            <span className='text-[#28e0ca]'>Coming Soon!</span>
            <span>💰</span>
          </span>
        </div>
      </div>

      {/* Upload Component */}
      <MemeCarousel onMemeClick={handleMemeClickCarousel} />
      <WelcomeCard isOpen={welcOpen} onClose={() => setWelcOpen(false)} />
      <div className='h-8' />

      {/* Sort and Tabs Row */}
      <div className='flex items-center justify-between flex-wrap gap-y-4'>
        {/* Sort Button and Filter Checkbox */}
        <div className='lg:flex-1 flex items-center gap-4'>
          {/* New Content Available Button - Only show in live tab when new content is available */}
          {activeTab === 'live' && isNewAvail && (
            <div className='flex justify-center mb-4 mt-2'>
              <button
                onClick={handleViewNewContents}
                className='bg-gradient-to-r from-[#1783fb] to-[#28e0ca] hover:from-[#28e0ca] hover:to-[#1783fb] text-white font-medium px-1 py-1 sm:px-2 sm:py-2 text-xs rounded-full shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-1 animate-pulse mt-1'
              >
                <svg
                  className='w-3 h-3 sm:w-4 sm:h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 10l7-7m0 0l7 7m-7-7v18'
                  />
                </svg>
                <span className='text-xs sm:text-sm'>New Content</span>
                <div className='bg-white text-[#1783fb] text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full'>
                  NEW
                </div>
              </button>
            </div>
          )}
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
                <div className='flex items-center hover:bg-[#224063] px-4 py-1 justify-between'>
                  <p className='text-xl text-nowrap mr-2'>By Time</p>
                  <div className='flex items-end gap-3'>
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
                {activeTab != 'live' && (
                  <div className='flex items-center hover:bg-[#224063] px-4 py-1 justify-between'>
                    <p className='text-xl text-nowrap mr-2'>By Votes</p>
                    <div className='flex items-end gap-3'>
                      <LiaSortAmountUpAltSolid
                        onClick={() => filterByVotes('ASC')}
                        className='cursor-pointer'
                        size={20}
                      />
                      <LiaSortAmountDownSolid
                        onClick={() => filterByVotes('DESC')}
                        className='cursor-pointer'
                        size={20}
                      />
                    </div>
                  </div>
                )}
              </PopoverBody>
            </PopoverContent>
          </PopoverRoot>
        </div>

        {/* Tab Buttons */}
        <div className='flex gap-x-2 md:gap-x-3 lg:flex-1 justify-center'>
          <TabButton
            label='Live'
            classname='!px-2 md:!px-5 rounded-full'
            isActive={activeTab === 'live'}
            onClick={() => handleTabChange('live')}
          />
          <TabButton
            label={`All${activeTab.includes('all') ? ` ${shownCount}` : ''}`}
            classname='!px-2 md:!px-5 rounded-full'
            isActive={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
          />
        </div>

        {/* Search Bar Row */}
        <div className='flex items-center lg:flex-1 w-full justify-end'>
          <div className='relative w-full lg:w-64'>
            <div className='border-2 border-slate-500 rounded-2xl py-1 bg-gray-600/15 w-full'>
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
                  placeholder='Search'
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

            {/* Recommendations positioned absolutely below the search bar */}
            {showRecommendations && query.length > 0 && (
              <div className='absolute top-full left-0 right-0 border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto w-full mt-2 p-4 !bg-gradient-to-b from-[#050D28] to-[#0F345C] z-50'>
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
                          {tag.name}{' '}
                          <FaPlus size={14} className='stroke-[2px]' />
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
          </div>
        </div>
      </div>

      {/* Meme Container */}
      <div
        ref={memeContainerRef}
        className='grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 sm:gap-y-10 grid-cols-1 grid-flow-row !min-h-[47vh] mt-6 mb-4 no-scrollbar w-full'
        style={{ height: 'calc(100vh - 150px)', paddingBottom: '200px' }}
      >
        {!loading &&
          activeTab === 'live' &&
          displayedMemes.length > 0 &&
          displayedMemes.map((meme, index) => (
            <MemoizedMemeCard
              key={meme._id}
              bookmark={handleBookmark}
              index={index}
              meme={meme}
              activeTab={activeTab}
              onOpenMeme={() => {
                setSelectedMeme(meme)
                setSelectedMemeIndex(index)
                setIsMemeDetailOpen(true)
              }}
              bmk={bookMarks.some((get_meme) => get_meme._id == meme._id)}
              onVoteMeme={() => voteToMeme(meme._id)}
            />
          ))}

        {!loading &&
          activeTab === 'all' &&
          allMemeDataFilter?.length > 0 &&
          allMemeDataFilter.map((item, index) => (
            <div
              key={item._id}
              className={hiddenMemes.has(item._id) ? 'hidden' : ''}
            >
              <MemoizedLeaderboardMemeCard
                meme={item}
                onOpenMeme={() => {
                  setSelectedMeme(item)
                  setSelectedMemeIndex(index)
                  setIsMemeDetailOpen(true)
                }}
                voteMeme={(memeId) => handleUpvoteDownvote(memeId)}
                bmk={bookMarks.some((get_meme) => get_meme._id == item._id)}
                activeTab={activeTab}
                onImageError={() => {
                  setHiddenMemes((prev) => new Set([...prev, item._id]))
                }}
              />
            </div>
          ))}

        {!loading &&
          displayedMemes?.length === 0 &&
          allMemeData?.length === 0 && (
            <p className='text-center text-nowrap text-2xl mx-auto md:col-span-12'>
              <AiOutlineLoading3Quarters className='animate-spin text-3xl mx-auto md:col-span-12' />
            </p>
          )}
        {loading && (
          <AiOutlineLoading3Quarters className='animate-spin text-3xl mx-auto md:col-span-12' />
        )}
      </div>

      {/* Pagination */}
      <PaginationRoot
        count={activeTab === 'all' ? allMemeCount : totalMemeCount}
        pageSize={pageSize}
        defaultPage={1}
        variant='solid'
        className='mx-auto mb-16'
        page={page}
        onPageChange={(e) => setPage(e.page)}
      ></PaginationRoot>

      {/* Meme Detail Modal */}
      {isMemeDetailOpen && selectedMeme && (
        <MemeDetail
          tab={activeTab}
          onClose={onClose}
          meme={selectedMeme} 
          searchRelatedMemes={setQuery}
          onNext={handleNext}
          onPrev={handlePrev}
          onVoteMeme={activeTab === 'live' ? voteToMeme : handleUpvoteDownvote}
          bmk={bookMarks.some((get_meme) => get_meme._id == selectedMeme._id)}
          onRelatedMemeClick={(meme) => setSelectedMeme(meme)}
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
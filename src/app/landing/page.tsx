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
import WelcomeCard from '@/components/WelcomeCard'
import { type Meme } from '../home/page'
import MemeCarousel, { MemeData } from './carousel'

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
  const [selectedMeme, setSelectedMeme] = useState<
    Meme | MemeData | undefined | LeaderboardMeme
  >()
  const [selectedMemeIndex, setSelectedMemeIndex] = useState<number>(-1)
  const [totalMemeCount, setTotalMemeCount] = useState<number>(0)
  const [allMemeCount, setAllMemeCount] = useState<number>(0)
  const [allMemeData, setAllMemeData] = useState<LeaderboardMeme[]>([])
  const [allMemeDataFilter, setAllMemeDataFilter] = useState<LeaderboardMeme[]>([])
  
  // Add state to track carousel memes and whether we're viewing from carousel
  const [carouselMemes, setCarouselMemes] = useState<MemeData[]>([])
  const [isViewingFromCarousel, setIsViewingFromCarousel] = useState<boolean>(false)
  
  const { openAuthModal } = useAuthModal()
  const [isUploading, setIsUploading] = useState(false)
  const [hiddenMemes, setHiddenMemes] = useState<Set<string>>(new Set())
  const [bookMarks, setBookMarks] = useState<LeaderboardMeme[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [allMemesLoading, setAllMemesLoading] = useState<boolean>(false)
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
    setIsViewingFromCarousel(false)
    setCarouselMemes([])
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

  // Updated handleNext to work with carousel memes
  const handleNext = () => {
    if (isViewingFromCarousel && carouselMemes.length > 0) {
      // Navigate within carousel memes only
      if (selectedMemeIndex < carouselMemes.length - 1) {
        const nextIndex = selectedMemeIndex + 1
        setSelectedMemeIndex(nextIndex)
        setSelectedMeme(carouselMemes[nextIndex])
      }
    } else {
      // Original logic for page memes
      const currentData = activeTab === 'live' ? displayedMemes : allMemeDataFilter
      if (selectedMemeIndex < currentData.length - 1) {
        const nextIndex = selectedMemeIndex + 1
        setSelectedMemeIndex(nextIndex)
        setSelectedMeme(currentData[nextIndex])
      }
    }
  }

  // Updated handlePrev to work with carousel memes
  const handlePrev = () => {
    if (isViewingFromCarousel && carouselMemes.length > 0) {
      // Navigate within carousel memes only
      if (selectedMemeIndex > 0) {
        const prevIndex = selectedMemeIndex - 1
        setSelectedMemeIndex(prevIndex)
        setSelectedMeme(carouselMemes[prevIndex])
      }
    } else {
      // Original logic for page memes
      const currentData = activeTab === 'live' ? displayedMemes : allMemeDataFilter
      if (selectedMemeIndex > 0) {
        const prevIndex = selectedMemeIndex - 1
        setSelectedMemeIndex(prevIndex)
        setSelectedMeme(currentData[prevIndex])
      }
    }
  }

  const getPopularTags = async () => {
    try {
      const response = await axiosInstance.get('/api/tags')
      if (response.data.tags) {
        setPopularTags([...response.data.tags])
      }
    } catch (error) {
      console.error('Error fetching popular tags:', error)
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
        // Revert optimistic update
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

        const sortedMemes = [...response.data.memes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        setMemes(sortedMemes)
        setFilterMemes(sortedMemes)
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
        
        const sortedMemes = [...response.data.memes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        setMemes(sortedMemes)
        setFilterMemes(sortedMemes)
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

  // Load all memes data
  const getMyMemes = useCallback(async () => {
    try {
      setAllMemesLoading(true)
      const offset = 30 * page
      const response = await axiosInstance.get(
        `/api/leaderboard?daily=false&offset=${offset}&userId=${userDetails?._id}`,
        {
          timeout: 180000
        }
      )

      if (response?.data?.memes) {
        const sortedMemes = [...response.data.memes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setAllMemeData(sortedMemes)
        setAllMemeDataFilter(sortedMemes)
        setAllMemeCount(response.data.memesCount)
        setShownCount(response.data.memesCount)
      }
    } catch (error) {
      console.log('Error fetching all memes:', error)
      setAllMemeData([])
      setAllMemeDataFilter([])
      setAllMemeCount(0)
      setShownCount(0)
    } finally {
      setAllMemesLoading(false)
    }
  }, [page, userDetails?._id])

  const getMemesByName = async () => {
    try {
      setLoading(activeTab === 'live')
      setAllMemesLoading(activeTab === 'all')
      
      if (query.length > 0) {
        const q = query[query.length - 1] === ',' ? query.slice(0, query.length - 2) : query
        const response = await axiosInstance.get(`/api/meme?name=${q}`)
        setShownCount(response.data.memesCount)
        
        if (response.data.memes) {
          const sortedMemes = [...response.data.memes].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          
          if (activeTab === 'live') {
            const filteredMemes = filterLiveMemes(sortedMemes)
            setFilterMemes(filteredMemes)
          } else {
            setAllMemeData(sortedMemes)
            setAllMemeDataFilter(sortedMemes)
          }
        }
      } else {
        if (activeTab === 'live') {
          const filteredMemes = filterLiveMemes(memes)
          setFilterMemes(filteredMemes)
        } else {
          // Reload all memes if query is cleared
          await getMyMemes()
        }
        setShownCount(activeTab === 'live' ? filterMemes.length : allMemeCount)
      }
    } catch (error) {
      console.log(error)
      if (activeTab === 'live') {
        const filteredMemes = filterLiveMemes(memes)
        setFilterMemes(filteredMemes)
      }
    } finally {
      setLoading(false)
      setAllMemesLoading(false)
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
      try {
        const response = await axiosInstance.get(`/api/meme?id=${id}`)
        if (response.data.meme) {
          setSelectedMeme(response.data.meme)
          setIsMemeDetailOpen(true)
        }
      } catch (error) {
        console.error('Error fetching meme by ID:', error)
      }
    }
  }

  const fetchLeaderBoard = async () => {
    try {
      const resp = await axiosInstance.get('/api/bookmark')
      if (resp.status == 200) {
        setBookMarks(resp.data.memes)
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    getMemeById()
    getPopularTags()
    fetchLeaderBoard()
  }, [user, isRefreshMeme])

  // Load initial data based on active tab
  useEffect(() => {
    if (activeTab === 'live') {
      getMemes()
    } else {
      getMyMemes()
    }
  }, [user, page, isRefreshMeme, activeTab])

  // Polling effect for live memes
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

  // Search effect
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
    const newTab = tab.toLowerCase() as 'live' | 'all'
    setActiveTab(newTab)
    setPage(1)
    
    // Clear search when switching tabs
    if (query) {
      setQuery('')
    }
  }

  const applyUninteractedFilterToAll = () => {
    if (allMemeData.length === 0) {
      return
    }

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
    if (activeTab === 'all' && allMemeData.length > 0) {
      applyUninteractedFilterToAll()
    }
  }, [showUninteractedOnly, allMemeData, bookMarks, userDetails, activeTab])

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

  // Replace your existing handleUpvoteDownvote function with this simplified version:

const handleUpvoteDownvote = useCallback(
  async (meme_id: string) => {
    if (!userDetails && openAuthModal) {
      openAuthModal()
      return
    }

    if (!user || !user.address) return

    try {
      const currentMeme = allMemeDataFilter.find((meme) => meme._id === meme_id)
      
      // Don't allow voting on own content
      if (currentMeme?.created_by._id === userDetails?._id) {
        return
      }

      // Toggle vote state immediately for UI feedback
      const isCurrentlyVoted = currentMeme?.has_user_voted || false
      const newVotedState = !isCurrentlyVoted
      const voteCountChange = newVotedState ? 1 : -1

      // Update both state arrays immediately
      setAllMemeDataFilter((prev) =>
        prev.map((meme) =>
          meme._id === meme_id
            ? {
                ...meme,
                vote_count: Math.max(0, meme.vote_count + voteCountChange),
                has_user_voted: newVotedState,
              }
            : meme
        )
      )

      setAllMemeData((prev) =>
        prev.map((meme) =>
          meme._id === meme_id
            ? {
                ...meme,
                vote_count: Math.max(0, meme.vote_count + voteCountChange),
                has_user_voted: newVotedState,
              }
            : meme
        )
      )

      // Update user details
      if (userDetails) {
        if (newVotedState) {
          // User is voting
          setUserDetails({
            ...userDetails,
            votes: userDetails.votes + 1,
            mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(1e17),
          })
        } else {
          // User is unvoting
          setUserDetails({
            ...userDetails,
            votes: Math.max(0, userDetails.votes - 1),
            mintedCoins: BigInt(Math.max(0, Number(userDetails.mintedCoins) - 1e17)),
          })
        }
      }

      // Make API call
      const response = await axiosInstance.post('/api/vote', {
        vote_to: meme_id,
        vote_by: userDetails?._id,
      })

      if (response.status === 201 || response.status === 200) {
        toast.success(newVotedState ? 'Voted successfully!' : 'Vote removed!')
      }

    } catch (error: any) {
      console.error('Vote error:', error)
      
      const errorMessage = error.response?.data?.message || ''
      const isContentDeleted = errorMessage.toLowerCase().includes('content not found') || 
                               errorMessage.toLowerCase().includes('deleted') ||
                               errorMessage.toLowerCase().includes('not found')

      if (isContentDeleted) {
        // Remove the deleted meme from both arrays
        setAllMemeDataFilter((prev) => prev.filter((meme) => meme._id !== meme_id))
        setAllMemeData((prev) => prev.filter((meme) => meme._id !== meme_id))
        toast.error('This content has been removed')
      } else {
        // For other errors, revert the optimistic update
        const currentMeme = allMemeDataFilter.find((meme) => meme._id === meme_id)
        const revertVotedState = !(currentMeme?.has_user_voted || false)
        const revertCountChange = revertVotedState ? 1 : -1

        setAllMemeDataFilter((prev) =>
          prev.map((meme) =>
            meme._id === meme_id
              ? {
                  ...meme,
                  vote_count: Math.max(0, meme.vote_count + revertCountChange),
                  has_user_voted: revertVotedState,
                }
              : meme
          )
        )

        setAllMemeData((prev) =>
          prev.map((meme) =>
            meme._id === meme_id
              ? {
                  ...meme,
                  vote_count: Math.max(0, meme.vote_count + revertCountChange),
                  has_user_voted: revertVotedState,
                }
              : meme
          )
        )

        // Revert user details
        if (userDetails) {
          const revertVoteChange = revertVotedState ? -1 : 1
          const revertCoinChange = revertVotedState ? -1e17 : 1e17
          
          setUserDetails({
            ...userDetails,
            votes: Math.max(0, userDetails.votes + revertVoteChange),
            mintedCoins: BigInt(Math.max(0, Number(userDetails.mintedCoins) + revertCoinChange)),
          })
        }

        toast.error(errorMessage || 'Failed to vote')
      }
    }
  },
  [userDetails, openAuthModal, user, allMemeDataFilter, setAllMemeDataFilter, setAllMemeData, setUserDetails]
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

  // Updated handleMemeClickCarousel to store carousel data
  const handleMemeClickCarousel = useCallback((meme: MemeData, index: number, allData: MemeData[]) => {
    setIsMemeDetailOpen(true)
    setSelectedMeme(meme)
    setSelectedMemeIndex(index)
    setCarouselMemes(allData) // Store the carousel memes
    setIsViewingFromCarousel(true) // Flag that we're viewing from carousel
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

        {/* Tab Buttons - Removed count from All button */}
        <div className='flex gap-x-2 md:gap-x-3 lg:flex-1 justify-center'>
          <TabButton
            label='Live'
            classname='!px-2 md:!px-5 rounded-full'
            isActive={activeTab === 'live'}
            onClick={() => handleTabChange('live')}
          />
          <TabButton
            label='All'
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
        {/* Live Tab Content */}
        {activeTab === 'live' && (
          <>
            {!loading &&
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
                    setIsViewingFromCarousel(false) // Not from carousel
                  }}
                  bmk={bookMarks.some((get_meme) => get_meme._id == meme._id)}
                  onVoteMeme={() => voteToMeme(meme._id)}
                />
              ))}
            
            {loading && (
              <div className='col-span-full flex justify-center items-center py-20'>
                <AiOutlineLoading3Quarters className='animate-spin text-3xl' />
              </div>
            )}
            
            {!loading && displayedMemes.length === 0 && (
              <div className='col-span-full flex justify-center items-center py-20'>
                <p className='text-center text-2xl text-gray-400'>
                  No memes found
                </p>
              </div>
            )}
          </>
        )}

        {/* All Tab Content */}
        {activeTab === 'all' && (
          <>
            {!allMemesLoading &&
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
                      setIsViewingFromCarousel(false) // Not from carousel
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
            
            {allMemesLoading && (
              <div className='col-span-full flex justify-center items-center py-20'>
                <AiOutlineLoading3Quarters className='animate-spin text-3xl mt-2' />
              </div>
            )}
            
            {!allMemesLoading && allMemeDataFilter.length === 0 && (
              <div className='col-span-full flex justify-center items-center py-20'>
                <p className='text-center text-2xl text-gray-400'>
                  No memes found
                </p>
              </div>
            )}
          </>
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
      />

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


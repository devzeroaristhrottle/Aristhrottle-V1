'use client'

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { HStack } from '@chakra-ui/react'
import { MdEdit, MdHistoryEdu } from 'react-icons/md'
import { FilterPopover } from '@/components/FilterPopover'
import { SortPopover } from '@/components/SortPopover'
import EditProfile from '@/components/EditProfile'
import { Context } from '@/context/contextProvider'
import { useFilterAndSort } from '@/hooks/useFilterAndSort'
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from '@/components/ui/pagination'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import axiosInstance from '@/utils/axiosInstance'
import Link from 'next/link'
import { TabButton } from '@/components/TabButton'
import { LeaderboardMeme } from '../leaderboard/page'

interface Data {
  title: string
  tags: string[]
  file: File | null
  bio: string
}

export default function Page() {
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [formData, setFormData] = useState<Data>({
    title: '',
    tags: ['Jokes', 'Abstract', 'Meme'],
    file: null,
    bio: '',
  })
  const [page, setPage] = useState(1)
  // const [totalMemeCount, setTotalMemeCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [memes, setMemes] = useState<LeaderboardMeme[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'all'>('live')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const { userDetails } = useContext(Context)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tab-based filtering (primary)
  const tabFilteredMemes = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // Start of today in UTC
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000) // Start of yesterday
    yesterday.setUTCHours(0, 0, 0, 0)

    if (activeTab === 'live') {
      // Memes from today (00:00 to 23:59 UTC)
      return memes.filter((meme) => {
        const createdAt = new Date(meme.createdAt)
        return (
          createdAt >= today &&
          createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        )
      })
    }
    // else if (activeTab === "daily") {
    //   // Memes from yesterday (00:00 to 23:59 UTC)
    //   return memes.filter((meme) => {
    //     const createdAt = new Date(meme.createdAt);
    //     return (
    //       createdAt >= yesterday &&
    //       createdAt < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
    //     );
    //   });
    // }
    // All-time tab: no date filtering
    return memes
  }, [memes, activeTab])

  const {
    percentage,
    setPercentage,
    selectedTags,
    tagInput,
    dateRange,
    setDateRange,
    sortCriteria,
    filteredMemes,
    filteredTags,
    handleTagInputChange,
    handleTagClick,
    handleTagRemove,
    handleSort,
    handleResetSort,
    resetFilters,
  } = useFilterAndSort(tabFilteredMemes, activeTab)

  const offset = 30
  const pageSize = 30

  const getMyMemes = async () => {
    try {
      if (!userDetails?._id) throw new Error('User not found')
      setLoading(true)
      const offsetI = offset * (page - 1) // Fixed offset calculation
      const response = await axiosInstance.get(
        `/api/meme?created_by=${userDetails._id}&offset=${offsetI}`
      )

      if (response.data.memes) {
        // setTotalMemeCount(response.data.memesCount)
        setMemes(response.data.memes)
      }
    } catch (error) {
      console.log(error)
      // setTotalMemeCount(0)
      setMemes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // setTotalMemeCount(0)
    setMemes([])
    resetFilters() // Reset filters on tab/page/user change
    getMyMemes()
  }, [userDetails, page, activeTab])

  const onCancel = () => {
    setEditProfileOpen(false)
    setFormData({
      title: '',
      tags: [],
      file: null,
      bio: '',
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const applyFilters = () => {
    setPage(1)
    getMyMemes()
    setFilterOpen(false)
  }

  const handleTabChange = (tab: string) => {
    setMemes([])
    setActiveTab(tab.toLowerCase() as 'live' | 'all')
  }

  return (
    <div className='md:max-w-7xl md:mx-auto mx-4'>
      {/* Top Section */}
      <div className='flex items-center justify-between pb-4 md:pb-6'>
        <div className='flex items-center space-x-2 md:space-x-4 rounded-lg'>
          <div className='h-20 w-20 md:h-44 md:w-44 bg-black rounded-full overflow-hidden flex items-center justify-center'>
            <img
              src='/assets/meme1.jpeg'
              alt='Profile'
              className='w-full h-full object-cover'
            />
          </div>
          <div>
            <p className='text-[#29e0ca] text-base  md:text-2xl hidden'>
              Level Coming Soon
            </p>
            <p className='text-white text-lg md:text-4xl font-bold'>Welcome</p>
            <h1 className='text-[#29e0ca] text-2xl md:text-6xl font-bold'>
              {userDetails?.username}
            </h1>
          </div>
        </div>
        <div className='flex flex-col items-end md:flex-row space-y-2 md:space-x-16'>
          <Link
            className='flex justify-between items-center gap-2 px-1 md:px-3 md:py-1 border border-[#1783fb] rounded-lg hover:opacity-40'
            href=''
          >
            <MdHistoryEdu className='w-4 h-4 md:w-9 md:h-9' fill='#1783fb' />
            <p className='text-[#1783fb] text-lg md:text-4xl font-bold'>
              Activity
            </p>
          </Link>
          <button
            onClick={() => setEditProfileOpen(true)}
            className='flex justify-between items-center gap-2 px-1 md:px-3 md:py-1 border border-[#1783fb] rounded-lg hover:opacity-40'
          >
            <MdEdit className='w-4 h-4 md:w-9 md:h-9' fill='#1783fb' />
            <p className='text-[#1783fb] text-lg md:text-4xl text-nowrap font-bold'>
              Edit Profile
            </p>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className='flex flex-col md:flex-row gap-10 mt-3'>
        <div className='md:flex-1 py-3 border-[.1875rem] border-[#1783fb] rounded-xl'>
          <p className='text-[28px] h-16 md:h-8 leading-none px-4'>
            {userDetails?.bio}
          </p>
        </div>
        <div className='flex justify-between gap-x-6 md:gap-x-0 flex-row md:flex-col'>
          <div className='votescast_majorityvotes_uploads_majorityuploads_mobile_wrapper flex-1 md:hidden space-y-2 md:space-y-0'>
            <div className='flex justify-between items-center gap-x-2 '>
              <p className='text-lg text-[#1783FB]'>Votes Cast</p>
              <p className='text-lg'>{userDetails?.totalCastedVotesCount}</p>
            </div>
            <div className='flex justify-between items-center gap-x-2'>
              <p className='text-lg text-[#1783FB]'>Majority Votes</p>
              <p className='text-lg'>{userDetails?.majorityVotes}</p>
            </div>
            <div className='flex justify-between items-center gap-x-2'>
              <p className='text-lg text-[#1783FB]'>Uploads</p>
              <p className='text-lg'>{userDetails?.totalUploadsCount}</p>
            </div>
            <div className='flex justify-between items-center gap-x-2'>
              <p className='text-lg text-[#1783FB]'>Majority Uploads</p>
              <p className='text-lg'>{userDetails?.majorityUploads}</p>
            </div>
          </div>
          <div className='md:!w-[200px] flex flex-col md:justify-between gap-y-4'>
            <div className='order-2 md:order-1 flex flex-col md:gap-2 md:px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl'>
              <p className='text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center'>
                eART Minted
              </p>
              <p className='text-2xl md:text-[30px] md:h-8 text-center'>
                {userDetails?.mintedCoins ? userDetails.mintedCoins : 0}
              </p>
            </div>
            <div className='order-1 md:order-2 flex flex-col md:gap-2 px-2 md:py-4 border-[.1875rem] border-[#1783fb] rounded-xl'>
              <p className='text-lg md:text-[28px] h-5 md:h-8 text-[#1783FB] text-center'>
                Votes Received
              </p>
              <p className='text-2xl md:text-[30px] md:h-8 text-center'>
                {userDetails?.totalVotesReceived}
              </p>
            </div>
          </div>
        </div>
        <div className='w-[200px] px-2 py-4 border-[.1875rem] border-[#1783fb] rounded-xl hidden md:flex flex-col justify-between'>
          <div className='flex flex-col gap-2'>
            <p className='text-[28px] h-8 text-[#1783FB] text-center'>
              Votes Cast
            </p>
            <p className='text-[30px] h-8 text-center'>
              {userDetails?.totalCastedVotesCount}
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <p className='text-[28px] h-8 text-[#1783FB] text-center'>
              Majority Votes
            </p>
            <p className='text-[30px] h-8 text-center'>
              {userDetails?.majorityVotes}
            </p>
          </div>
        </div>
        <div className='w-[200px] px-2 py-4 border-[.1875rem] border-[#1783fb] rounded-xl hidden md:flex flex-col justify-between'>
          <div className='flex flex-col gap-2'>
            <p className='text-[28px] h-8 text-[#1783FB] text-center'>
              Uploads
            </p>
            <p className='text-[30px] h-8 text-center'>
              {userDetails?.totalUploadsCount}
            </p>
          </div>
          <div className='flex flex-col gap-2'>
            <p className='text-[28px] h-8 text-[#1783FB] text-center'>
              Majority Uploads
            </p>
            <p className='text-[30px] h-8 text-center'>
              {userDetails?.majorityUploads}
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className='mt-16 md:mt-12'>
        <div className='flex items-center justify-between'>
          <div className='flex space-x-2.5 md:space-x-5'>
            <FilterPopover
              activeTab={activeTab}
              filterOpen={filterOpen}
              setFilterOpen={setFilterOpen}
              percentage={percentage}
              setPercentage={setPercentage}
              selectedTags={selectedTags}
              tagInput={tagInput}
              dateRange={dateRange}
              setDateRange={setDateRange}
              filteredTags={filteredTags}
              handleTagInputChange={handleTagInputChange}
              handleTagClick={handleTagClick}
              handleTagRemove={handleTagRemove}
              resetFilters={resetFilters}
              applyFilters={applyFilters}
            />
            <SortPopover
              activeTab={activeTab}
              sortOpen={sortOpen}
              setSortOpen={setSortOpen}
              sortCriteria={sortCriteria}
              handleSort={handleSort}
              handleResetSort={handleResetSort}
            />
          </div>
          <div className='space-x-2.5 md:space-x-5 flex justify-center'>
            <TabButton
              classname='!text-base md:!text-xl !px-2  md:!px-8 !rounded-md md:!rounded-10px'
              isActive={activeTab === 'live'}
              label='Live'
              onClick={() => handleTabChange('live')}
            />
            {/* <TabButton
              classname='!px-8'
              isActive={activeTab === 'daily'}
              label='Daily'a
              onClick={() => handleTabChange('daily')}
            /> */}
            <TabButton
              classname='!text-base md:!text-xl !px-2 md:!px-5 !rounded-md md:!rounded-10px'
              isActive={activeTab === 'all'}
              label='All-Time'
              onClick={() => handleTabChange('all')}
            />
          </div>
        </div>
        <div>
          <h2 className='text-[#29e0ca] text-xl md:text-4xl font-medium text-center mt-8 md:my-2'>
            Your Uploads
          </h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-16 mt-3 md:mt-6'>
          {filteredMemes.map((item, index) => (
            <div key={index} className='px-2 md:px-3 lg:px-4'>
              <div className='flex justify-between items-center mb-1'>
                {item.winning_number && (
                  <p className='text-[#29e0ca] font-medium'>
                    #{item.winning_number}
                  </p>
                )}
              </div>
              <div className='flex gap-4'>
                <div className='relative flex-grow'>
                  <img
                    src={item.image_url}
                    alt='Content'
                    className='w-full aspect-square object-cover border-2 border-white'
                  />
                  <div className='flex justify-between text-base lg:text-2xl mt-1'>
                    <p>{item.name}</p>
                    <p>{item.createdAt.split('T')[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className='col-span-full'>
            {loading && (
              <AiOutlineLoading3Quarters className='animate-spin text-3xl mx-auto' />
            )}
            {!loading && filteredMemes.length === 0 && (
              <p className='text-center text-nowrap text-lg md:text-2xl mx-auto'>
                Meme not found
              </p>
            )}
          </div>

          {filteredMemes.length > 0 && (
            <div className='col-span-full'>
              <PaginationRoot
                count={Math.max(
                  1,
                  Math.ceil(tabFilteredMemes.length / pageSize)
                )}
                pageSize={pageSize}
                defaultPage={1}
                variant='solid'
                className='mx-auto'
                page={page}
                onPageChange={(e) => {
                  setMemes([])
                  setPage(e.page)
                }}
              >
                <HStack className='justify-center mb-5'>
                  <PaginationPrevTrigger />
                  <PaginationItems />
                  <PaginationNextTrigger />
                </HStack>
              </PaginationRoot>
            </div>
          )}
        </div>
      </div>

      {editProfileOpen && (
        <EditProfile
          onCancel={onCancel}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </div>
  )
}

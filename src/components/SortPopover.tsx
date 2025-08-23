import React from 'react'
import {
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { FaSort } from 'react-icons/fa'
import { MdRefresh } from 'react-icons/md'

interface SortPopoverProps {
  activeTab: string
  sortOpen: boolean
  setSortOpen: (open: boolean) => void
  sortCriteria: { field: 'time' | 'votes' | null; direction: 'asc' | 'desc' }
  handleSort: (field: 'time' | 'votes', direction: 'asc' | 'desc') => void
  handleResetSort: () => void
}

export const SortPopover: React.FC<SortPopoverProps> = ({
  activeTab,
  sortOpen,
  setSortOpen,
  sortCriteria,
  handleSort,
  handleResetSort,
}) => (
  <PopoverRoot open={sortOpen} onOpenChange={() => setSortOpen(!sortOpen)}>
    <PopoverTrigger asChild>
      <Button
        size={{ base: '2xs', md: 'sm' }}
        variant='outline'
        className='flex gap-x-1 md:gap-x-2 border border-[#F0F3F4] px-1.5 md:px-3 rounded-md text-[#F0F3F4] text-lg md:text-xl hover:scale-105'
      >
        <FaSort />
        <span>sort</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className='bg-[#707070] w-64 left-16 bottom-0'>
      <PopoverBody className='bg-[#707070] border-2 border-[#F0F3F4] rounded-md p-0'>
        <div className='flex justify-between items-center px-4 py-1'>
          <p className='text-xl'>By Time</p>
          <div className='flex items-center gap-3'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='sort-time'
                checked={
                  sortCriteria.field === 'time' &&
                  sortCriteria.direction === 'asc'
                }
                onChange={() => handleSort('time', 'asc')}
                className='mr-1 accent-[#29e0ca]'
              />
              <span className='text-md w-10'>Latest</span>
            </label>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='sort-time'
                checked={
                  sortCriteria.field === 'time' &&
                  sortCriteria.direction === 'desc'
                }
                onChange={() => handleSort('time', 'desc')}
                className='mr-1 accent-[#29e0ca]'
              />
              <span className='text-md w-10'>Oldest</span>
            </label>
          </div>
        </div>
        {activeTab !== 'live' && (
          <div className='flex items-center justify-between px-4 py-1'>
            <p className='text-xl'>By Votes</p>
            <div className='flex items-center justify-between gap-3'>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='sort-votes'
                  checked={
                    sortCriteria.field === 'votes' &&
                    sortCriteria.direction === 'asc'
                  }
                  onChange={() => handleSort('votes', 'asc')}
                  className='mr-1 accent-[#29e0ca]'
                />
                <span className='text-md w-10'>Most</span>
              </label>
              <label className='flex items-center cursor-pointer'>
                <input
                  type='radio'
                  name='sort-votes'
                  checked={
                    sortCriteria.field === 'votes' &&
                    sortCriteria.direction === 'desc'
                  }
                  onChange={() => handleSort('votes', 'desc')}
                  className='mr-1 accent-[#29e0ca]'
                />
                <span className='text-md w-10'>Least</span>
              </label>
            </div>
          </div>
        )}
        <div className='flex justify-between items-center px-4 py-1'>
          <p className='text-xl'>Reset Sort</p>
          <div className='flex items-center gap-3'>
            <MdRefresh
              className={`cursor-pointer ${
                sortCriteria.field === null ? 'text-[#29e0ca]' : ''
              }`}
              size={20}
              onClick={handleResetSort}
            />
            <div className='w-[20px]' />
          </div>
        </div>
      </PopoverBody>
    </PopoverContent>
  </PopoverRoot>
)

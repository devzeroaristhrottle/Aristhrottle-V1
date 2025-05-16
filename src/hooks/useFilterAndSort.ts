import { useState, useCallback, useEffect } from 'react'
import debounce from 'lodash/debounce'
import { sampleTags } from '@/data/constants'
import { Meme } from '@/app/home/leaderboard/page'

const filterMemes = (
  memesList: Meme[],
  activeTab: 'live' | 'daily' | 'all',
  selectedTags: string[],
  dateRange: { startDate: Date | null; endDate: Date | null },
  percentage: number
): Meme[] => {
  let filtered = [...memesList]

  // Tab-based filtering (primary)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0) // Start of today in UTC
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  yesterday.setUTCHours(0, 0, 0, 0) // Start of yesterday

  if (activeTab === 'live') {
    // Filter memes from today (00:00 to 23:59 UTC)
    filtered = filtered.filter((meme) => {
      const createdAt = new Date(meme.createdAt)
      return (
        createdAt >= today &&
        createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      )
    })
  } else if (activeTab === 'daily') {
    // Filter memes from yesterday (00:00 to 23:59 UTC)
    filtered = filtered.filter((meme) => {
      const createdAt = new Date(meme.createdAt)
      const now = new Date();
      const utcYear = now.getUTCFullYear();
      const utcMonth = now.getUTCMonth();
      const utcDate = now.getUTCDate();
      const endOfDay = new Date(Date.UTC(utcYear, utcMonth, utcDate, 18, 0, 0, 0));
      // Start time: Two days ago 11:30 PM IST = 6:00 PM UTC of two days ago
      const startTime = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);
      return (
        createdAt >= startTime &&
        createdAt < endOfDay
      )
    })
  }

  if (selectedTags.length > 0) {
    filtered = filtered.filter((meme) =>
      selectedTags.some((tag) =>
        meme.name.toLowerCase().includes(tag.toLowerCase())
      )
    )
  }

  if (dateRange.startDate || dateRange.endDate) {
    filtered = filtered.filter((meme) => {
      const memeDate = new Date(meme.createdAt)
      const startDate = dateRange.startDate
        ? new Date(dateRange.startDate)
        : null
      const endDate = dateRange.endDate
        ? new Date(dateRange.endDate.getTime() + 24 * 60 * 60 * 1000 - 1) // Include full end date
        : null

      if (startDate && endDate) {
        return memeDate >= startDate && memeDate <= endDate
      }
      if (startDate) {
        return memeDate >= startDate
      }
      if (endDate) {
        return memeDate <= endDate
      }
      return true
    })
  }

  if (percentage > 0) {
    filtered = filtered.filter((meme) => meme.in_percentile >= percentage)
  }

  return filtered
}

export const useFilterAndSort = (
  memes: Meme[],
  activeTab: 'live' | 'daily' | 'all'
) => {
  const [percentage, setPercentage] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState<string>('')
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null
    endDate: Date | null
  }>({ startDate: null, endDate: null })
  const [sortCriteria, setSortCriteria] = useState<{
    field: 'time' | 'votes' | null
    direction: 'asc' | 'desc'
  }>({ field: null, direction: 'asc' })
  const [filteredMemes, setFilteredMemes] = useState<Meme[]>([])

  const debouncedUpdateTags = useCallback(
    debounce((input: string) => {
      const tags = input
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      setSelectedTags(tags)
    }, 300),
    []
  )

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagInput(value)
    debouncedUpdateTags(value)
  }

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newInput = tagInput ? `${tagInput}, ${tag}` : tag
      setTagInput(newInput)
      const newTags = newInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
      setSelectedTags(newTags)
      debouncedUpdateTags.cancel()
    }
  }

  const handleTagRemove = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag)
    setSelectedTags(newTags)
    setTagInput(newTags.join(', '))
  }

  const handleSort = (field: 'time' | 'votes', direction: 'asc' | 'desc') => {
    setSortCriteria({ field, direction })
  }

  const handleResetSort = () => {
    setSortCriteria({ field: null, direction: 'asc' })
  }

  const resetFilters = () => {
    setPercentage(0)
    setSelectedTags([])
    setTagInput('')
    setDateRange({ startDate: null, endDate: null })
  }

  useEffect(() => {
    let newFilteredMemes = filterMemes(
      memes,
      activeTab,
      selectedTags,
      dateRange,
      percentage
    )

    if (sortCriteria.field) {
      newFilteredMemes = [...newFilteredMemes].sort((a, b) => {
        if (sortCriteria.field === 'time') {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return sortCriteria.direction === 'asc'
            ? dateA - dateB
            : dateB - dateA
        } else if (sortCriteria.field === 'votes') {
          return sortCriteria.direction === 'asc'
            ? a.vote_count - b.vote_count
            : b.vote_count - a.vote_count
        }
        return 0
      })
    }

    setFilteredMemes(newFilteredMemes)
  }, [memes, activeTab, selectedTags, dateRange, percentage, sortCriteria])

  return {
    percentage,
    setPercentage,
    selectedTags,
    tagInput,
    dateRange,
    setDateRange,
    sortCriteria,
    filteredMemes,
    filteredTags: sampleTags.filter((tag) =>
      tag
        .toLowerCase()
        .includes(tagInput.toLowerCase().split(',').pop()?.trim() || '')
    ),
    handleTagInputChange,
    handleTagClick,
    handleTagRemove,
    handleSort,
    handleResetSort,
    resetFilters,
  }
}

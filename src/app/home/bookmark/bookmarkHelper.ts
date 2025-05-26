// utils/memeHelpers.ts
import axiosInstance from '@/utils/axiosInstance'
import { Bookmark } from '../page' // Make sure to export this type from your page file
import { useContext } from 'react'
import { Context } from '@/context/contextProvider'

export const useMemeActions = () => {
  const { userDetails } = useContext(Context)

  const toggleBookmark = async (memeId: string, userId: string) => {
    try {
      const response = await axiosInstance.post('/api/bookmark', {
        memeId,
        userId,
      })
      return response.data
    } catch {
      return null
    }
  }

  const handleBookmark = (id: string, name: string, image_url: string) => {
    const bookmarks = localStorage.getItem('bookmarks')
    let bookmarksObj: Bookmark = {}

    if (bookmarks) {
      bookmarksObj = JSON.parse(bookmarks)
    }

    if (!bookmarksObj[id]) {
      // Add bookmark
      bookmarksObj[id] = {
        id,
        name,
        image_url,
      }
    } else {
      // Remove bookmark
      delete bookmarksObj[id]
    }

    localStorage.setItem('bookmarks', JSON.stringify(bookmarksObj))

    // Sync with server if user is logged in
    if (id && userDetails && userDetails._id) {
      toggleBookmark(id, userDetails._id)
    }
  }

  return {
    handleBookmark,
  }
}

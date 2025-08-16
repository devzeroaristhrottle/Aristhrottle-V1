// utils/memeHelpers.ts
import axiosInstance from '@/utils/axiosInstance'
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

	const handleBookmark = (id: string) => {
		// Sync with server if user is logged in
		if (id && userDetails && userDetails._id) {
			toggleBookmark(id, userDetails._id)
		}
	}

	return {
		handleBookmark,
	}
}

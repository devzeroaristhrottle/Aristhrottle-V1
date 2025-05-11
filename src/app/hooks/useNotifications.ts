import { useState, useEffect, useContext } from 'react'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'

export type Notification = {
  _id: string
  title: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  isRead: boolean
  notification_for: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type NotificationResponse = {
  message: Notification[]
}

const useNotifications = () => {
  const { userDetails } = useContext(Context)
  const userId = userDetails?._id
  const [notifications, setNotifications] =
    useState<NotificationResponse | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/notification?userId=${userId}`
        )
        if (response.data.message) {
          setNotifications(response.data)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
  }, [userId, userDetails])

  return { notifications }
}

export default useNotifications

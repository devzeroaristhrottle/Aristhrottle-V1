'use client'
import { Context } from '@/context/contextProvider'
import axiosInstance from '@/utils/axiosInstance'
import { useContext, useEffect, useState } from 'react'

export type TotalVotesResponse = {
  date: string
  totalVotes: any
}[]

export type MajorityVotesResponse = {
  date: string
  majorityVotes: any
}[]

export type MajorityUploadsResponse = {
  date: string
  majorityUploads: any
}[]

export type TotalUploadsResponse = {
  date: string
  totalUploads: any
}[]

const useActivity = () => {
  const { userDetails } = useContext(Context)
  const userId = userDetails?._id
  const [totalVotes, setTotalVotes] = useState<TotalVotesResponse | null>(null)
  const [majorityVotes, setMajorityVotes] =
    useState<MajorityVotesResponse | null>(null)
  const [majorityUploads, setMajorityUploads] =
    useState<MajorityUploadsResponse | null>(null)
  const [totalUploads, setTotalUploads] =
    useState<MajorityUploadsResponse | null>(null)
  const [totalVotesReceived, setTotalVotesReceived] =
    useState<TotalVotesResponse | null>(null)

  useEffect(() => {
    const fetchTotalVotes = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/activity/votecasted?userId=${userId}`
        )
        if (response.data) {
          setTotalVotes(response.data)
          console.log(response.data, 'total votes')
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    const fetchMajorityVotes = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/activity/majorityvotes?userId=${userId}`
        )
        if (response.data) {
          setMajorityVotes(response.data)
          console.log(response.data, 'majority votes')
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    const fetchMajorityUploads = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/activity/majorityupload?userId=${userId}`
        )
        if (response.data) {
          setMajorityUploads(response.data)
          console.log(response.data, 'majority uploads')
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    const fetchTotalUploads = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/activity/uploads?userId=${userId}`
        )
        if (response.data) {
          setTotalUploads(response.data)
          console.log(response.data, 'total uploads')
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    const fetchTotalVotesReceived = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/activity/votereceived?userId=${userId}`
        )
        if (response.data) {
          setTotalVotesReceived(response.data)
          console.log(response.data, 'total votes received')
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchTotalVotes()
    fetchTotalUploads()
    fetchMajorityVotes()
    fetchMajorityUploads()
    fetchTotalVotesReceived()
  }, [userId, userDetails])

  return {
    totalVotes,
    majorityVotes,
    totalUploads,
    majorityUploads,
    totalVotesReceived,
  }
}

export default useActivity

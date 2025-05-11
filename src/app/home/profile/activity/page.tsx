'use client'
import React from 'react'
import Chart from './components/Chart'
import { data } from './constants'
import useActivity from '@/app/hooks/useActivity'

const Activity = () => {
  const {
    totalVotes,
    majorityVotes,
    totalUploads,
    majorityUploads,
    totalVotesReceived,
  } = useActivity()

  console.log(
    totalVotes,
    majorityVotes,
    totalUploads,
    majorityUploads,
    totalVotesReceived,
    'abc'
  )
  return (
    <div className='max-w-7xl mx-auto px-16 mt-20 mb-12'>
      <h2 className='text-[#29e0ca] text-4xl font-medium text-center mb-2'>
        Activity
      </h2>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
      <div className='h-[240px] w-full mt-10'>
        <Chart data={data} />
      </div>
    </div>
  )
}

export default Activity

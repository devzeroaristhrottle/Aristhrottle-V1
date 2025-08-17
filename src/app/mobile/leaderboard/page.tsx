'use client'
import BottomNav from '@/mobile_components/BottomNav'
import Navbar from '@/mobile_components/Navbar'
import React from 'react'

function page() {
    return (
        <div className='h-screen flex flex-col overflow-hidden'>
            <Navbar />
            <div className='flex-1 overflow-y-auto px-4 py-4'>Leaderboard page</div>
            <BottomNav />
        </div>
    )
}

export default page
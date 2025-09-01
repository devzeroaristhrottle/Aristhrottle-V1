'use client'

import { Inter } from 'next/font/google'
import Navbar from '@/mobile_components/Navbar'
import BottomNav from '@/mobile_components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export default function MobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark'>
      <head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              font-family: 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New';
            }
            
            body {
              font-family: 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New';
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          `}
        </style>
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="h-screen flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <div className="flex-none">
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  )
}
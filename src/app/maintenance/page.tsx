'use client'

import React from 'react'
import Image from 'next/image'
import { FaTools, FaRocket, FaClock } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi2'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Image
              src="/assets/vote/icon2.png"
              width={80}
              height={80}
              alt="Aristhrottle Logo"
              className="animate-pulse"
            />
            <div className="absolute -top-2 -right-2">
              <HiSparkles className="text-[#28e0ca] text-2xl animate-spin" />
            </div>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          <span className="text-[#28e0ca]">Aristhrottle</span> is getting a tune-up!
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          We&rsquo;re making some improvements to bring you an even better experience. 
          We&rsquo;ll be back soon with exciting new features!
        </p>

        {/* Status card */}
        <div className="bg-gradient-to-b from-[#040f2b] to-[#0d3159] border-2 border-[#1783FB] rounded-xl p-8 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FaTools className="text-[#28e0ca] text-3xl" />
            <FaClock className="text-[#28e0ca] text-2xl" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Under Maintenance</h2>
          <p className="text-gray-300 text-sm">
            Estimated completion: Soon™
          </p>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#040f2b] border border-[#0d4387] rounded-lg p-6 hover:border-[#28e0ca] transition-colors duration-300">
            <div className="flex items-center justify-center mb-4">
              <FaRocket className="text-[#28e0ca] text-3xl" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Enhanced Performance</h3>
            <p className="text-gray-400 text-sm">
              Faster loading times and smoother interactions
            </p>
          </div>

          <div className="bg-[#040f2b] border border-[#0d4387] rounded-lg p-6 hover:border-[#28e0ca] transition-colors duration-300">
            <div className="flex items-center justify-center mb-4">
              <HiSparkles className="text-[#28e0ca] text-3xl" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">New Features</h3>
            <p className="text-gray-400 text-sm">
              Exciting updates and improved functionality
            </p>
          </div>

          <div className="bg-[#040f2b] border border-[#0d4387] rounded-lg p-6 hover:border-[#28e0ca] transition-colors duration-300">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/assets/vote/icon2.png"
                width={32}
                height={32}
                alt="Vote Icon"
                className="text-[#28e0ca]"
              />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Better Experience</h3>
            <p className="text-gray-400 text-sm">
              Improved user interface and interactions
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-r from-[#1783FB] to-[#28e0ca] rounded-xl p-1 max-w-sm mx-auto">
          <div className="bg-black rounded-lg p-4">
            <p className="text-white font-semibold">
              Follow us for updates!
            </p>
                         <div className="flex justify-center gap-4 mt-3">
               <a 
                 href="https://x.com/Aristhrottleorg" 
                 className="text-[#28e0ca] hover:text-white transition-colors duration-300"
                 aria-label="Twitter"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                 </svg>
               </a>
               <a 
                 href="https://discord.gg/UHAf8HSCRy" 
                 className="text-[#28e0ca] hover:text-white transition-colors duration-300"
                 aria-label="Discord"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                 </svg>
               </a>
               <a 
                 href="https://www.instagram.com/aristhrottle.art/" 
                 className="text-[#28e0ca] hover:text-white transition-colors duration-300"
                 aria-label="Instagram"
               >
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.875-.385-.875-.875s.385-.875.875-.875.875.385.875.875-.385.875-.875.875zm-7.83 12.447c-2.026 0-3.744-.875-4.948-2.448-.875-1.297-1.297-2.848-1.297-4.398s.422-3.101 1.297-4.398c1.204-1.573 2.922-2.448 4.948-2.448s3.744.875 4.948 2.448c.875 1.297 1.297 2.848 1.297 4.398s-.422 3.101-1.297 4.398c-1.204 1.573-2.922 2.448-4.948 2.448z"/>
                 </svg>
               </a>
             </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Thank you for your patience. We&rsquo;re working hard to bring you the best experience possible!</p>
        </div>
      </div>
    </div>
  )
}

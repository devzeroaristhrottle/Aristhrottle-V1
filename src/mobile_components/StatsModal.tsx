import React from 'react'
import { BiStats } from 'react-icons/bi'
import { FaCoins, FaUpload, FaEye } from 'react-icons/fa'
import { IoMdThumbsUp } from 'react-icons/io'
import { RiUserFollowLine } from 'react-icons/ri'
import { StatsModalProps} from '@/mobile_components/types'

const StatItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "#707070" }}>
        <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-300">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
)

function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
    if (!isOpen) return null

    // Format minted coins to show only 2 decimal places
    const formattedMintedCoins = typeof stats.mintedCoins === 'string' 
        ? parseFloat(stats.mintedCoins).toFixed(2)
        : (stats.mintedCoins || 0).toFixed(2)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-auto bg-black/90 rounded-xl p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BiStats className="w-6 h-6" />
                        Stats Overview
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-4">
                    <StatItem
                        icon={FaCoins}
                        label="$eART Minted"
                        value={formattedMintedCoins}
                        color="bg-yellow-500"
                    />
                    <StatItem
                        icon={FaUpload}
                        label="Total Uploads"
                        value={stats.uploads || 0}
                        color="bg-blue-500"
                    />
                    <StatItem
                        icon={IoMdThumbsUp}
                        label="Votes Received"
                        value={stats.votesReceived || 0}
                        color="bg-green-500"
                    />
                    <StatItem
                        icon={IoMdThumbsUp}
                        label="Votes Cast"
                        value={stats.votesCast || 0}
                        color="bg-purple-500"
                    />
                    <StatItem
                        icon={FaEye}
                        label="Total Views"
                        value={stats.views || 0}
                        color="bg-indigo-500"
                    />
                    <StatItem
                        icon={RiUserFollowLine}
                        label="Referrals"
                        value={stats.referrals || 0}
                        color="bg-pink-500"
                    />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default StatsModal

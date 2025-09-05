import React, { useState } from 'react'
import { AccountsProps } from '../types'
import { useRouter } from 'next/navigation'

function Accounts({ accounts }: AccountsProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const router = useRouter();
    
    if (!accounts || accounts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[200px] text-gray-400">
                No accounts found
            </div>
        )
    }

    const maxVisibleAccounts = 3
    const visibleAccounts = isExpanded ? accounts : accounts.slice(0, maxVisibleAccounts)
    const hasMoreAccounts = accounts.length > maxVisibleAccounts && !isExpanded

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="space-y-2 py-2">
            <div className="space-y-3">
                {visibleAccounts.map((account) => (
                    <div key={account._id} className="flex items-center gap-3 rounded-lg" onClick={() => router.push(`/mobile/profile/${account._id}`)}>
                        {/* Profile Picture */}
                        <div className="flex items-center justify-center">
                            <img
                                src={account.profile_pic}
                                alt={account.username}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        </div>
                        
                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                            {/* Username and Follow Button */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-extrabold text-sm truncate">
                                    {account.username}
                                </h3>
                                
                            </div>
                            
                            {/* Bio */}
                            <p className=" text-sm truncate" style={{fontSize: '0.5rem'}}>
                                {account.bio.length > 50 ? `${account.bio.substring(0, 50)}...` : account.bio}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-400" style={{fontSize: '0.5rem'}}>
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-white">{account.followers.toLocaleString()}</span>
                                    <span>followers</span>
                                </span>
                                <span className="flex items-center gap-1" style={{fontSize: '0.5rem'}}>
                                    <span className="font-medium text-white" >{account.following.toLocaleString()}</span>
                                    <span>following</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <button className="bg-[#2FCAC7] hover:bg-[#28b8b5] text-black p-1 rounded-full font-medium transition-colors" style={{fontSize: '0.6rem'}}>
                                Follow
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {hasMoreAccounts && (
                <button
                    onClick={toggleExpanded}
                    className="bg-[#2FCAC7] transition-colors rounded-md text-black px-2 mt-2 text-base"
                >
                    More
                </button>
            )}
            
            {isExpanded && accounts.length > maxVisibleAccounts && (
                <button
                    onClick={toggleExpanded}
                    className="bg-[#2FCAC7] transition-colors rounded-md text-black px-2 mt-2"
                >
                    Show less
                </button>
            )}
        </div>
    )
}

export default Accounts
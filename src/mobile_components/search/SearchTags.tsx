import React, { useState } from 'react'
import { TagsProps } from '../types'


function Tags({ showRank = false, tags, startRank = 1 }: TagsProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    
    const maxVisibleTags = 10
    const visibleTags = isExpanded ? tags : tags.slice(0, maxVisibleTags)
    const hasMoreTags = tags.length > maxVisibleTags && !isExpanded

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="space-y-2 py-2">
            <div className="flex flex-wrap gap-2 pb-2">
                {visibleTags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {showRank && (
                            <div className="flex items-center">
                                {index < 3 ? (
                                    <img 
                                        src={`/assets/award${index + 1}.png`} 
                                        alt={`Rank ${index + 1}`}
                                        className="w-6 h-6"
                                    />
                                ) : (
                                    <span className="text-md text-[#F0F3F4] min-w-[16px]">
                                        {startRank + index}
                                    </span>
                                )}
                            </div>
                        )}
                        <span className="border-[#1783fb] rounded-lg px-2 py-1 text-sm font-medium bg-gray-600 text-white whitespace-nowrap">
                            {tag}
                        </span>
                    </div>
                ))}
            </div>
            
            {hasMoreTags && (
                <button
                    onClick={toggleExpanded}
                    className="bg-[#2FCAC7] transition-colors rounded-md text-black px-2 mt-2"
                >
                    More
                </button>
            )}
            
            {isExpanded && tags.length > maxVisibleTags && (
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

export default Tags
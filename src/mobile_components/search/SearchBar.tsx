import React, { useState, useRef, useEffect } from 'react'
import { IoSearchSharp } from 'react-icons/io5'
import { IoTimeOutline } from 'react-icons/io5'

interface SearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
    className?: string
}

function SearchBar({ 
    placeholder = 'Search by title, tags or username', 
    onSearch,
    className = ''
}: SearchBarProps) {
    const [input, setInput] = useState<string>('')
    const [isFocused, setIsFocused] = useState(false)
    const [searchHistory, setSearchHistory] = useState<string[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    const suggestions = [
        'crypto memes',
        'NFT art',
        'DeFi yield farming',
        'blockchain technology',
        'smart contracts',
        'metaverse',
        'web3 development',
        'token trading',
        'DAO governance',
        'liquidity pools'
    ]

    // Load search history from localStorage on component mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory')
        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory)
                setSearchHistory(Array.isArray(parsedHistory) ? parsedHistory : [])
            } catch (error) {
                console.error('Error parsing search history:', error)
                setSearchHistory([])
            }
        }
    }, [])

    // Save search history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory))
    }, [searchHistory])

    const addToSearchHistory = (query: string) => {
        if (!query.trim()) return
        
        setSearchHistory(prevHistory => {
            // Remove the query if it already exists
            const filteredHistory = prevHistory.filter(item => item.toLowerCase() !== query.toLowerCase())
            // Add the new query to the beginning
            const newHistory = [query, ...filteredHistory]
            // Keep only the last 10 searches
            return newHistory.slice(0, 10)
        })
    }

    const clearSearchHistory = () => {
        setSearchHistory([])
        localStorage.removeItem('searchHistory')
    }

    const filteredSuggestions = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(input.toLowerCase())
    )

    const filteredHistory = searchHistory.filter(history =>
        history.toLowerCase().includes(input.toLowerCase())
    )

    

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInput(value)
        onSearch?.(value)
    }

    const handleInputFocus = () => {
        setIsFocused(true)
    }

    const handleInputBlur = () => {
        setIsFocused(false)
    }

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion)
        addToSearchHistory(suggestion)
        onSearch?.(suggestion)
    }

    const handleHistoryClick = (historyItem: string) => {
        setInput(historyItem)
        addToSearchHistory(historyItem)
        onSearch?.(historyItem)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim()) {
            addToSearchHistory(input.trim())
        }
        onSearch?.(input)
    }

    const shouldShowHistory = isFocused && input.length === 0 && searchHistory.length > 0
    const shouldShowSuggestions = isFocused && input.length > 0 && filteredSuggestions.length > 0

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text"
                    value={input}
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="bg-black/20 border border-gray-700/50 w-full rounded-full pr-12 pl-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#2FCAC7] focus:ring-1 focus:ring-[#2FCAC7] transition-all duration-200"
                />
                
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#2FCAC7] transition-colors duration-200"
                >
                    <IoSearchSharp className="w-5 h-5" />
                </button>
            </form>

            {/* Search History Dropdown */}
            {shouldShowHistory && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{backgroundColor: "#707070"}}>
                    <div className="px-4 py-2 border-b border-gray-600 flex justify-between items-center">
                        <span className="text-gray-300 text-sm font-medium">Recent Searches</span>
                        <button
                            onClick={clearSearchHistory}
                            className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    {filteredHistory.map((historyItem, index) => (
                        <button
                            key={index}
                            onClick={() => handleHistoryClick(historyItem)}
                            className="w-full text-left px-4 py-3 text-white hover:bg-gray-600 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <IoTimeOutline className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{historyItem}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Suggestions Dropdown */}
            {shouldShowSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" style={{backgroundColor: "#707070"}}>
                    <div className="px-4 py-2 border-b border-gray-600">
                        <span className="text-gray-300 text-sm font-medium">Suggestions</span>
                    </div>
                    {filteredSuggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-3 text-white hover:bg-gray-600 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <IoSearchSharp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{suggestion}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SearchBar

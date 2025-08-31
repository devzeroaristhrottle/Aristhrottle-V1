import React, { useState, useRef, useEffect } from 'react'

interface Region {
    code: string
    name: string
    flag: string
}

const regions: Region[] = [
    {
        code: 'GLB',
        name: 'Global',
        flag: ''
    },
    {
        code: 'USA',
        name: 'United States',
        flag: 'https://flagcdn.com/w160/us.png'
    },
    {
        code: 'GBR',
        name: 'United Kingdom',
        flag: 'https://flagcdn.com/w160/gb.png'
    },
    {
        code: 'CAN',
        name: 'Canada',
        flag: 'https://flagcdn.com/w160/ca.png'
    },
    {
        code: 'AUS',
        name: 'Australia',
        flag: 'https://flagcdn.com/w160/au.png'
    },
    {
        code: 'DEU',
        name: 'Germany',
        flag: 'https://flagcdn.com/w160/de.png'
    },
    {
        code: 'FRA',
        name: 'France',
        flag: 'https://flagcdn.com/w160/fr.png'
    },
    {
        code: 'JPN',
        name: 'Japan',
        flag: 'https://flagcdn.com/w160/jp.png'
    },
    {
        code: 'IND',
        name: 'India',
        flag: 'https://flagcdn.com/w160/in.png'
    }
]

interface RegionSelectProps {
    onRegionChange?: (region: Region) => void
    defaultRegion?: Region
}

function RegionSelect({ onRegionChange, defaultRegion = regions[0] }: RegionSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedRegion, setSelectedRegion] = useState<Region>(defaultRegion)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleRegionSelect = (region: Region) => {
        setSelectedRegion(region)
        setIsOpen(false)
        onRegionChange?.(region)
    }

    return (
        <div className="relative ml-auto" ref={dropdownRef}>
            {/* Selected Region Display */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 bg-black/20 border border-gray-700/50 rounded-lg text-white hover:bg-black/30 transition-colors px-2"
            >
                <img 
                    src={selectedRegion.flag} 
                    alt={selectedRegion.code}
                    className="w-4 h-4 object-cover rounded-sm py-1"
                />
                <svg
                    className={`w-3 h-3 text-gray-400 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 border border-gray-700/50 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-20" style={{backgroundColor: "#707070"}}>
                    {regions.map((region) => (
                        <button
                            key={region.code}
                            onClick={() => handleRegionSelect(region)}
                            className={`flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-800/50 transition-colors ${
                                selectedRegion.code === region.code ? 'bg-[#2FCAC7]/20 text-[#2FCAC7]' : 'text-white'
                            }`}
                        >
                            <img 
                                src={region.flag} 
                                alt={region.code}
                                className="w-4 h-2 object-cover rounded-sm"
                            />
                            <span className="font-medium text-sm">{region.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RegionSelect

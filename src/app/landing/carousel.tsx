import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance'; // Import your axios instance
import { AiOutlineLoading3Quarters } from 'react-icons/ai'; // Import loading spinner

// Define types for your meme data (matching the leaderboard structure)
interface MemeCreator {
  _id: string;
  username: string;
  profile_pic: string;
}

interface MemeData {
  _id: string;
  vote_count: number;
  name: string;
  image_url: string;
  created_by: MemeCreator;
  shares: any[];
  bookmarks: any[];
  createdAt: string;
  rank: number;
  in_percentile: number;
  has_user_voted: boolean;
  tags: (string | { name: string })[];
  bookmark_count: number;
}

interface MemeCarouselProps {
  memes?: MemeData[];
  onMemeClick?: (meme: MemeData) => void;
  className?: string;
  activeTab?: 'daily' | 'all'; // Add activeTab prop to control fetch type
}

const MemeCarousel: React.FC<MemeCarouselProps> = ({ 
  memes: propMemes,
  onMemeClick, 
  className = '',
  activeTab = 'daily' // Default to daily
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // State for fetched memes
  const [fetchedMemes, setFetchedMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // State for tracking failed image loads
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [validMemes, setValidMemes] = useState<MemeData[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Function to fetch both daily and all-time memes
  const fetchLeaderboardMemes = async () => {
    try {
      setLoading(true);
      setError('');
      setFailedImageIds(new Set()); // Reset failed images on new fetch
      
      // Fetch daily memes first
      const dailyResponse = await axiosInstance.get(
        `/api/leaderboard?daily=true&offset=0`
      );
      
      // Fetch all-time memes
      const allTimeResponse = await axiosInstance.get(
        `/api/leaderboard?daily=false&offset=0`
      );

      const dailyMemes = dailyResponse.data.memes || [];
      const allTimeMemes = allTimeResponse.data.memes || [];
      
      // Filter out duplicates (memes that appear in both daily and all-time)
      const allTimeFiltered = allTimeMemes.filter(
        (allTimeMeme: MemeData) => !dailyMemes.some((dailyMeme: MemeData) => dailyMeme._id === allTimeMeme._id)
      );
      
      // Combine: daily memes first, then unique all-time memes
      const combinedMemes = [...dailyMemes, ...allTimeFiltered];
      
      setFetchedMemes(combinedMemes);
    } catch (error) {
      console.error('Error fetching leaderboard memes:', error);
      setError('Failed to load memes');
      setFetchedMemes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch memes when component mounts or activeTab changes
  useEffect(() => {
    if (!propMemes) {
      fetchLeaderboardMemes();
    }
  }, [activeTab, propMemes]);

  // Use propMemes if provided, otherwise use fetched memes
  const memes = propMemes || fetchedMemes;

  // Filter out memes with failed images
  useEffect(() => {
    const filtered = memes.filter(meme => !failedImageIds.has(meme._id));
    setValidMemes(filtered);
    
    // Reset current index if it's beyond the valid range
    if (filtered.length > 0) {
      const slidesPerView = isMobile ? 1 : 3;
      const totalSlides = Math.ceil(filtered.length / slidesPerView);
      const maxIndex = totalSlides - 1;
      
      if (currentIndex > maxIndex) {
        setCurrentIndex(0);
      }
    }
  }, [memes, failedImageIds, isMobile]);

  // Handle image load error
  const handleImageError = (meme: MemeData) => {
    console.log(`Image failed to load for meme: ${meme.name} (${meme._id})`);
    setFailedImageIds(prev => new Set(prev).add(meme._id));
  };

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate slides per view and max index using valid memes
  const slidesPerView = isMobile ? 1 : 3;
  const totalSlides = Math.ceil(validMemes.length / slidesPerView);
  const maxIndex = Math.max(0, totalSlides - 1);

  // Auto-rotation logic
  useEffect(() => {
    if (!isPaused && !isHovered && totalSlides > 1 && !loading && validMemes.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex: number) => 
          prevIndex >= maxIndex ? 0 : prevIndex + 1
        );
      }, 4000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isHovered, totalSlides, maxIndex, loading, validMemes.length]);

  const goToPrevious = (): void => {
    setCurrentIndex(prev => prev === 0 ? maxIndex : prev - 1);
  };

  const goToNext = (): void => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  };

  const goToSlide = (index: number): void => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  const handleMemeClick = (meme: MemeData) => {
    console.log('Clicked meme:', meme.name);
    if (onMemeClick) {
      onMemeClick(meme);
    }
  };

  // Touch/Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!isDragging.current) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Get current visible memes using valid memes
  const getCurrentMemes = () => {
    const startIndex = currentIndex * slidesPerView;
    return validMemes.slice(startIndex, startIndex + slidesPerView);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={fetchLeaderboardMemes}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state - check both original memes and valid memes
  if (!memes || memes.length === 0) {
    return (
      <div className={`w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-400 text-lg">No memes available</p>
      </div>
    );
  }

  // All memes failed to load
  if (validMemes.length === 0 && memes.length > 0) {
    return (
      <div className={`w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-lg">Unable to load meme images</p>
          <button 
            onClick={() => {
              setFailedImageIds(new Set());
              if (!propMemes) {
                fetchLeaderboardMemes();
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry Loading Images
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="max-w-8xl mx-auto">
        
        <div 
          className={`relative w-full overflow-hidden rounded-xl shadow-2xl ${className}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main carousel container */}
          <div className={`relative ${isMobile ? 'aspect-square' : 'h-96 md:h-70 md:w-70 lg:h-96'} p-2`}>
            {/* Cards container */}
            <div className="flex justify-center items-center h-full">
              {isMobile ? (
                // Mobile: Single square card view with swipe
                <div 
                  className="w-full h-full max-w-sm aspect-square"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {getCurrentMemes().map((meme: MemeData, index: number) => (
                    <div
                      key={meme._id}
                      className="relative group cursor-pointer h-full w-full"
                      onClick={() => handleMemeClick(meme)}
                    >
                      <div className="relative h-full w-full rounded-xl overflow-hidden bg-gray-700 shadow-xl aspect-square">
                        <img
                          src={meme.image_url}
                          alt={meme.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(meme)}
                          draggable={false}
                        />
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                                             {/* Vote count overlay */}
<div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
  {meme.vote_count}
  <img
    src={'/assets/vote/icon1.png'}
    alt="vote"
    className="w-3 h-3 lg:w-4 lg:h-4"
  />
</div>

                        {/* Meme info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-semibold text-sm truncate">{meme.name}</h3>
                          <p className="text-gray-300 text-xs truncate">by @{meme.created_by.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop: Three cards view with equal heights
                <div className="flex gap-6 h-full w-full justify-center max-w-7xl">
                  {getCurrentMemes().map((meme: MemeData, index: number) => (
                    <div
                      key={meme._id}
                      className="flex-1 max-w-sm min-w-0 relative group cursor-pointer transition-transform duration-300 hover:scale-105 h-full"
                      onClick={() => handleMemeClick(meme)}
                    >
                      <div className="relative h-full w-full rounded-xl overflow-hidden bg-gray-700 shadow-xl">
                        <img
                          src={meme.image_url}
                          alt={meme.name}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(meme)}
                          draggable={false}
                        />
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                       {/* Vote count overlay */}
<div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
  {meme.vote_count}
  <img
    src={'/assets/vote/icon1.png'}
    alt="vote"
    className="w-3 h-3 lg:w-4 lg:h-4"
  />
</div>


                        {/* Meme info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-semibold text-sm truncate">{meme.name}</h3>
                          <p className="text-gray-300 text-xs truncate">by @{meme.created_by.username}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Fill empty slots if less than 3 cards in the last group */}
                  {!isMobile && getCurrentMemes().length < 3 && getCurrentMemes().length > 0 && 
                    Array.from({ length: 3 - getCurrentMemes().length }).map((_, emptyIndex) => (
                      <div key={`empty-${emptyIndex}`} className="flex-1 max-w-sm min-w-0 h-full opacity-30">
                        <div className="h-full w-full rounded-xl bg-gray-700/50 border-2 border-dashed border-gray-600 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No more memes</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-300 z-10 shadow-lg ${
                    isHovered || isMobile ? 'opacity-100 translate-x-0' : 'opacity-60 -translate-x-2'
                  }`}
                  aria-label="Previous slides"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-300 z-10 shadow-lg ${
                    isHovered || isMobile ? 'opacity-100 translate-x-0' : 'opacity-60 translate-x-2'
                  }`}
                  aria-label="Next slides"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Progress bar */}
          {totalSlides > 1 && !isPaused && !isHovered && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
              <div 
                className="h-full bg-blue-500 transition-all duration-200 ease-linear"
                style={{ 
                  width: `${((currentIndex + 1) / totalSlides) * 100}%`
                }}
              />
            </div>
          )}

          {/* Mobile swipe indicator */}
          {isMobile && totalSlides > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/70 text-xs flex items-center gap-1 z-10 bg-black/50 px-3 py-1 rounded-full">
              <span>←</span>
              <span>Swipe</span>
              <span>→</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeCarousel;
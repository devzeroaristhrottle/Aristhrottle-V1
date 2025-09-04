import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { LazyImage } from '@/components/LazyImage';

// Define and EXPORT types for your meme data
interface MemeCreator {
  _id: string;
  username: string;
  profile_pic: string;
}

// Export the MemeData interface so it can be imported elsewhere
export interface MemeData {
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
  onMemeClick?: (meme: MemeData, index: number, allData: MemeData[]) => void;
  className?: string;
  activeTab?: 'daily' | 'all';
}

const MemeCarousel: React.FC<MemeCarouselProps> = ({ 
  memes: propMemes,
  onMemeClick, 
  className = '',
  activeTab = 'daily'
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // State for fetched memes
  const [fetchedMemes, setFetchedMemes] = useState<MemeData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // State for tracking failed image loads
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const hasFetched = useRef<boolean>(false); // Prevent multiple API calls

  // Memoized function to fetch memes (called only once)
  const fetchLeaderboardMemes = useCallback(async () => {
    if (hasFetched.current) return; // Prevent duplicate calls
    
    try {
      setLoading(true);
      setError('');
      setFailedImageIds(new Set());
      hasFetched.current = true;
      
      // Use Promise.all for parallel requests (faster)
      const [dailyResponse, allTimeResponse] = await Promise.all([
        axiosInstance.get('/api/leaderboard?daily=true&offset=0'),
        axiosInstance.get('/api/leaderboard?daily=false&offset=0')
      ]);

      const dailyMemes = dailyResponse.data.memes || [];
      const allTimeMemes = allTimeResponse.data.memes || [];
      
      // Create a Set for faster lookup to avoid duplicates
      const dailyMemesIds = new Set(dailyMemes.map((meme: MemeData) => meme._id));
      const allTimeFiltered = allTimeMemes.filter(
        (allTimeMeme: MemeData) => !dailyMemesIds.has(allTimeMeme._id)
      );
      
      // Combine: First ALL daily memes, then ALL filtered all-time memes
      // No limits - fetch all available memes from both leaderboards
      const combinedMemes = [...dailyMemes, ...allTimeFiltered];
      
      setFetchedMemes(combinedMemes);
    } catch (error) {
      console.error('Error fetching leaderboard memes:', error);
      setError('Failed to load memes');
      setFetchedMemes([]);
      hasFetched.current = false; // Allow retry
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch memes once when component mounts (if no propMemes provided)
  useEffect(() => {
    if (!propMemes && !hasFetched.current) {
      fetchLeaderboardMemes();
    }
  }, [propMemes, fetchLeaderboardMemes]);

  // Memoize the memes array to prevent unnecessary re-renders
  const memes = useMemo(() => {
    return propMemes && propMemes.length > 0 ? propMemes : fetchedMemes;
  }, [propMemes, fetchedMemes]);

  // Memoize valid memes calculation
  const validMemes = useMemo(() => {
    return memes.filter(meme => !failedImageIds.has(meme._id));
  }, [memes, failedImageIds]);

  // Handle image load error with useCallback - matching LeaderboardMemeCard pattern
  const handleImageError = useCallback((meme: MemeData) => {
    console.log(`Image failed to load for meme: ${meme.name} - URL: ${meme.image_url}`);
    setFailedImageIds(prev => new Set(prev).add(meme._id));
  }, []);

  // Check if mobile on mount and resize (memoized)
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Memoize calculations
  const { slidesPerView, totalSlides, maxIndex } = useMemo(() => {
    const slidesPerView = isMobile ? 1 : 3;
    const totalSlides = Math.ceil(validMemes.length / slidesPerView);
    const maxIndex = Math.max(0, totalSlides - 1);
    return { slidesPerView, totalSlides, maxIndex };
  }, [isMobile, validMemes.length]);

  // Reset current index if needed
  useEffect(() => {
    if (validMemes.length > 0 && currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
  }, [validMemes.length, currentIndex, maxIndex]);

  // Auto-rotation logic (optimized)
  useEffect(() => {
    if (!isHovered && totalSlides > 1 && !loading && validMemes.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
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
      }
    };
  }, [isHovered, totalSlides, maxIndex, loading, validMemes.length]);

  // Carousel navigation functions
  const goToPrevious = useCallback((): void => {
    setCurrentIndex(prev => prev === 0 ? maxIndex : prev - 1);
  }, [maxIndex]);

  const goToNext = useCallback((): void => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  }, [maxIndex]);

  // Handle meme click - Updated to pass all three parameters including allData
  const handleMemeClick = useCallback((meme: MemeData, relativeIndex: number) => {
    console.log('Clicked meme:', meme.name);
    
    // Find the absolute index of the clicked meme in the validMemes array
    const absoluteIndex = validMemes.findIndex(m => m._id === meme._id);
    
    if (onMemeClick && absoluteIndex !== -1) {
      // Pass the meme, its absolute index, and the complete validMemes array as allData
      onMemeClick(meme, absoluteIndex, validMemes);
    }
  }, [onMemeClick, validMemes]);

  // Touch/Swipe handlers for mobile (memoized)
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent): void => {
    if (!isDragging.current) return;
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent): void => {
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
  }, [goToNext, goToPrevious]);

  // Get current visible memes (memoized)
  const getCurrentMemes = useCallback(() => {
    const startIndex = currentIndex * slidesPerView;
    return validMemes.slice(startIndex, startIndex + slidesPerView);
  }, [currentIndex, slidesPerView, validMemes]);

  // Memoize current memes to prevent unnecessary re-calculations
  const currentMemes = useMemo(() => getCurrentMemes(), [getCurrentMemes]);

  // Loading state
  if (loading) {
    return (
      <div className={`w-full h-96 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-blue-500" />
          {/* <p className="text-gray-400 text-lg">Loading top memes...</p> */}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full h-96 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button 
            onClick={() => {
              hasFetched.current = false;
              fetchLeaderboardMemes();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!memes || memes.length === 0) {
    return (
      <div className={`w-full h-96 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-lg">No memes available</p>
        </div>
      </div>
    );
  }

  // All memes failed to load
  if (validMemes.length === 0 && memes.length > 0) {
    return (
      <div className={`w-full h-96 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-lg">Unable to load meme images</p>
          <button 
            onClick={() => {
              setFailedImageIds(new Set());
              if (!propMemes) {
                hasFetched.current = false;
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
                  {currentMemes.map((meme: MemeData, index: number) => {
                    const relativeIndex = currentIndex * slidesPerView + index;
                    return (
                      <div
                        key={meme._id}
                        className="relative group cursor-pointer h-full w-full"
                        onClick={() => handleMemeClick(meme, relativeIndex)}
                      >
                        <div className="relative h-full w-full rounded-xl overflow-hidden bg-gray-700/50 shadow-xl aspect-square">
                          {/* Using LazyImage instead of regular img */}
                          <LazyImage
                            src={meme.image_url}
                            alt={meme.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={() => handleImageError(meme)}
                          />
                          
                          {/* Hover effect */}
                          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Vote count overlay */}
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                            {meme.vote_count}
                            <img
                              src="/assets/vote/icon1.png"
                              alt="vote"
                              className="w-3 h-3 lg:w-4 lg:h-4"
                              loading="lazy"
                            />
                          </div>

                          {/* Meme info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <h3 className="text-white font-semibold text-sm truncate">{meme.name}</h3>
                            <p className="text-gray-300 text-xs truncate">by @{meme.created_by.username}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Desktop: Three cards view with equal heights
                <div className="flex gap-4 h-full w-full justify-center max-w-7xl">
                  {currentMemes.map((meme: MemeData, index: number) => {
                    const relativeIndex = currentIndex * slidesPerView + index;
                    return (
                      <div
                        key={meme._id}
                        className="flex-1 max-w-sm min-w-0 relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02] h-full"
                        onClick={() => handleMemeClick(meme, relativeIndex)}
                      >
                        <div className="relative h-full w-full rounded-xl overflow-hidden bg-gray-700/50 shadow-xl">
                          {/* Using LazyImage instead of regular img */}
                          <LazyImage
                            src={meme.image_url}
                            alt={meme.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onError={() => handleImageError(meme)}
                          />
                          
                          {/* Hover effect */}
                          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Vote count overlay */}
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                            {meme.vote_count}
                            <img
                              src="/assets/vote/icon1.png"
                              alt="vote"
                              className="w-3 h-3 lg:w-4 lg:h-4"
                              loading="lazy"
                            />
                          </div>

                          {/* Meme info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <h3 className="text-white font-semibold text-sm truncate">{meme.name}</h3>
                            <p className="text-gray-300 text-xs truncate">by @{meme.created_by.username}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Fill empty slots if less than 3 cards in the last group */}
                  {!isMobile && currentMemes.length < 3 && currentMemes.length > 0 && 
                    Array.from({ length: 3 - currentMemes.length }).map((_, emptyIndex) => (
                      <div key={`empty-${emptyIndex}`} className="flex-1 max-w-sm min-w-0 h-full opacity-30">
                        <div className="h-full w-full rounded-xl bg-gray-700/30 border-2 border-dashed border-gray-600 flex items-center justify-center">
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
          {totalSlides > 1 && !isHovered && (
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
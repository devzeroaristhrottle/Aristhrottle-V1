import React, { useState, useRef } from 'react'
import { LazyImage } from '@/components/LazyImage'
import { Meme } from './types'

// Add CSS to hide scrollbar for WebKit browsers
const hideScrollbarCSS = `
.carousel-container::-webkit-scrollbar {
  display: none;
}
`;

interface CarouselProps {
	items?: Meme[]
	onMemeClick?: (meme: Meme) => void
}

function Carousel({ items = [], onMemeClick }: CarouselProps) {
	const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set())
	const [isDragging, setIsDragging] = useState(false)
	const [startX, setStartX] = useState(0)
	const [scrollLeft, setScrollLeft] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	// No auto-scrolling effect

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true)
		setStartX(e.touches[0].pageX - (containerRef.current?.offsetLeft || 0))
		setScrollLeft(containerRef.current?.scrollLeft || 0)
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging) return

		e.preventDefault()
		const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0)
		const walk = (x - startX) * 2
		if (containerRef.current) {
			containerRef.current.scrollLeft = scrollLeft - walk
		}
	}

	const handleTouchEnd = () => {
		setIsDragging(false)
	}

	if (!items.length) {
		return (
			<div className="h-32 flex items-center justify-center">Loading...</div>
		)
	}

	// Filter out hidden items and duplicate for seamless loop
	const visibleItems = items.filter(item => !hiddenItems.has(item._id))
	const duplicatedItems = [...visibleItems, ...visibleItems]

	if (!visibleItems.length) {
		return null // Hide carousel if no visible items
	}

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: hideScrollbarCSS }} />
			<div 
				className="w-full h-32 overflow-hidden"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div 
					ref={containerRef}
					className="flex overflow-x-auto carousel-container"
					style={{ 
						scrollBehavior: isDragging ? 'auto' : 'smooth',
						scrollbarWidth: 'none',  /* Firefox */
						msOverflowStyle: 'none',  /* IE and Edge */
					}}
				>
				{duplicatedItems.map((meme, index) => (
					<div
						key={`${meme._id}-${index}`}
						className="w-1/3 flex-shrink-0 px-2 rounded-sm"
						onClick={(e) => {
							if (!isDragging && onMemeClick) {
								e.stopPropagation();
								onMemeClick(meme);
							}
						}}
					>
						<div className="p-0.5 h-32">
							<LazyImage
								src={meme.image_url}
								alt={meme.name}
								className="w-full h-full object-cover rounded cursor-pointer"
								onError={() => {
									setHiddenItems(prev => new Set([...prev, meme._id]))
								}}
							/>
						</div>
					</div>
				))}
				</div>
			</div>
		</>
	)
}

export default Carousel

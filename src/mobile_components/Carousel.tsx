import React, { useState, useRef, useEffect } from 'react'
import { LazyImage } from '@/components/LazyImage'
import { Meme } from './types'

interface CarouselProps {
	items?: Meme[]
	onMemeClick?: (meme: Meme) => void
}

function Carousel({ items = [], onMemeClick }: CarouselProps) {
	const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set())
	const [isDragging, setIsDragging] = useState(false)
	const [startX, setStartX] = useState(0)
	const [scrollLeft, setScrollLeft] = useState(0)
	const [autoScroll, setAutoScroll] = useState(true)
	const containerRef = useRef<HTMLDivElement>(null)
	const animationRef = useRef<number>(0);
	const lastScrollLeft = useRef(0)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleAutoScroll = () => {
			if (!autoScroll || isDragging) return
			
			const maxScroll = container.scrollWidth / 2
			lastScrollLeft.current += 1
			
			if (lastScrollLeft.current >= maxScroll) {
				lastScrollLeft.current = 0
			}
			
			container.scrollLeft = lastScrollLeft.current
			animationRef.current = requestAnimationFrame(handleAutoScroll)
		}

		animationRef.current = requestAnimationFrame(handleAutoScroll)

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
			}
		}
	}, [autoScroll, isDragging])

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true)
		setAutoScroll(false)
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
			lastScrollLeft.current = containerRef.current.scrollLeft
		}
	}

	const handleTouchEnd = () => {
		setIsDragging(false)
		setTimeout(() => setAutoScroll(true), 1000) // Resume auto-scroll after 1 second
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
		<div 
			className="w-full h-32 overflow-hidden"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div 
				ref={containerRef}
				className={`flex overflow-x-hidden ${!isDragging && autoScroll ? 'transition-all duration-300' : ''}`}
				style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
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
	)
}

export default Carousel

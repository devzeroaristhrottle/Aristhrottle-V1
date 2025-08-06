import React, { useState } from 'react'
import { LazyImage } from '@/components/LazyImage'

interface Meme {
	_id: string
	name: string
	image_url: string
}

interface CarouselProps {
	items?: Meme[]
}

function Carousel({ items = [] }: CarouselProps) {
	const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set())

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
		<div className="w-full h-32 overflow-hidden">
			<div className="flex animate-scroll">
				{duplicatedItems.map((meme, index) => (
					<div
						key={`${meme._id}-${index}`}
						className="w-1/3 flex-shrink-0 px-2 rounded-sm"
					>
						<div className="p-0.5 h-32">
							<LazyImage
								src={meme.image_url}
								alt={meme.name}
								className="w-full h-full object-cover rounded"
								onError={() => {
									setHiddenItems(prev => new Set([...prev, meme._id]))
								}}
							/>
						</div>
					</div>
				))}
			</div>
			<style jsx>{`
				@keyframes scroll {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-50%);
					}
				}
				.animate-scroll {
					animation: scroll 20s linear infinite;
				}
			`}</style>
		</div>
	)
}

export default Carousel

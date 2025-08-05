import React from 'react'

interface Meme {
	_id: string
	name: string
	image_url: string
}

interface CarouselProps {
	items?: Meme[]
}

function Carousel({ items = [] }: CarouselProps) {
	if (!items.length) {
		return (
			<div className="h-32 flex items-center justify-center">Loading...</div>
		)
	}

	// Duplicate items to create seamless loop
	const duplicatedItems = [...items, ...items]

	return (
		<div className="w-full h-32 overflow-hidden my-4">
			<div className="flex animate-scroll">
				{duplicatedItems.map((meme, index) => (
					<div key={`${meme._id}-${index}`} className="w-1/3 flex-shrink-0 px-2 rounded-sm">
						<div className="p-0.5 h-32">
							<img
								src={meme.image_url}
								alt={meme.name}
								className="w-full h-full object-cover rounded"
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
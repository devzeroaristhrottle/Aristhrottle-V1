'use client'

import { useState, useRef, useEffect } from 'react'

interface LazyImageProps {
	src: string
	alt: string
	className?: string
	onClick?: () => void
	placeholder?: string
	onError?: () => void
}

export function LazyImage({
	src,
	alt,
	className = '',
	onClick,
	placeholder = '/assets/loading.gif', // Using existing loading gif as placeholder
	onError
}: LazyImageProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const [isInView, setIsInView] = useState(false)
	const [hasError, setHasError] = useState(false)
	const imgRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true)
					observer.unobserve(entry.target)
				}
			},
			{
				root: null,
				rootMargin: '50px', // Start loading 50px before the image comes into view
				threshold: 0.1,
			}
		)

		if (imgRef.current) {
			observer.observe(imgRef.current)
		}

		return () => {
			if (imgRef.current) {
				observer.unobserve(imgRef.current)
			}
		}
	}, [])

	const handleImageLoad = () => {
		setIsLoaded(true)
	}

	const handleImageError = () => {
		setHasError(true)
		setIsLoaded(true) // Stop showing loading state
		if (onError) {
			onError()
		}
	}

	if (hasError) {
		return null
	}

	return (
		<div ref={imgRef} className={`relative ${className}`} onClick={onClick}>
			{!isInView ? (
				// Placeholder while not in view
				<div className={`bg-gray-800 animate-pulse ${className} flex items-center justify-center`}>
					<div className="text-gray-500">Loading...</div>
				</div>
			) : !isLoaded ? (
				// Loading state
				<div className={`relative ${className}`}>
					<img
						src={placeholder}
						alt="Loading..."
						className={`${className} opacity-50`}
					/>
					<img
						src={src}
						alt={alt}
						className={`absolute inset-0 ${className} opacity-0`}
						onLoad={handleImageLoad}
						onError={handleImageError}
					/>
				</div>
			) : (
				// Loaded image
				<img
					src={src}
					alt={alt}
					className={className}
				/>
			)}
		</div>
	)
} 
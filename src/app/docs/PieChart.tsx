import React from 'react'

interface PieSegment {
	label: string
	value: number
	color: string
}

interface CartesianPoint {
	x: number
	y: number
}

export const PieChart: React.FC = () => {
	const data: PieSegment[] = [
		{ label: 'FY 2024 Total Paid Creators', value: 0.1, color: '#E02121' },
		{ label: 'FY 2024 Total Users', value: 99.9, color: '#1783FB' },
	]

	const size: number = 400
	const strokeWidth: number = 80
	const radius: number = (size - strokeWidth) / 2

	// Calculate stroke dash array for each segment
	const createPath = (
		startAngle: number,
		endAngle: number,
		radius: number,
		size: number
	): string => {
		const start = polarToCartesian(size / 2, size / 2, radius, endAngle)
		const end = polarToCartesian(size / 2, size / 2, radius, startAngle)
		const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

		return [
			'M',
			size / 2,
			size / 2,
			'L',
			start.x,
			start.y,
			'A',
			radius,
			radius,
			0,
			largeArcFlag,
			0,
			end.x,
			end.y,
			'Z',
		].join(' ')
	}

	const polarToCartesian = (
		centerX: number,
		centerY: number,
		radius: number,
		angleInDegrees: number
	): CartesianPoint => {
		const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
		return {
			x: centerX + radius * Math.cos(angleInRadians),
			y: centerY + radius * Math.sin(angleInRadians),
		}
	}

	let currentAngle: number = 0

	return (
		<div className="flex flex-col items-center p-8 ">
			<div className="rounded-lg shadow-lg p-6">
				<div className="flex items-center justify-center mb-6">
					<svg width={size} height={size} className="transform -rotate-90">
						{data.map((segment, index) => {
							const startAngle = currentAngle
							const endAngle = currentAngle + (segment.value / 100) * 360
							const path = createPath(startAngle, endAngle, radius, size)

							currentAngle = endAngle

							return (
								<path
									key={index}
									d={path}
									fill={segment.color}
									stroke="white"
									strokeWidth="2"
									className="transition-all duration-300 hover:opacity-80"
								/>
							)
						})}
					</svg>
				</div>

				{/* Legend */}
				<div className="flex justify-center space-x-6">
					{data.map((segment, index) => (
						<div key={index} className="flex items-center space-x-2">
							<div
								className="w-4 h-4 rounded-md"
								style={{ backgroundColor: segment.color }}
							></div>
							<span className="text-2xl font-medium text-white">
								{segment.label} ({segment.value}%)
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default PieChart

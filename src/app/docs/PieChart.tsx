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
		{ label: 'FY 2024 Total Paid Creators', value: 0.1, color: '#E02121' }, // red
		{ label: 'FY 2024 Total Users', value: 99.9, color: '#1783FB' }, // blue
	]

	const size: number = 400
	const strokeWidth: number = 80
	const radius: number = (size - strokeWidth) / 2

	const polarToCartesian = (
		centerX: number,
		centerY: number,
		radius: number,
		angleInDegrees: number
	): CartesianPoint => {
		const angleInRadians = ((angleInDegrees + 45) * Math.PI) / 180.0
		return {
			x: centerX + radius * Math.cos(angleInRadians),
			y: centerY + radius * Math.sin(angleInRadians),
		}
	}

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

	const redStart = 270
	const redEnd = redStart + (data[0].value / 100) * 360
	const redPath = createPath(redStart, redEnd, radius, size)

	const blueStart = redEnd
	const blueEnd = blueStart + (data[1].value / 100) * 360
	const bluePath = createPath(blueStart, blueEnd, radius, size)

	// Midpoint angle of red slice
	const redMidAngle = redStart + ((redEnd - redStart) / 2)
	const redEdge = polarToCartesian(size / 2, size / 2, radius, redMidAngle)
	const redOuter = polarToCartesian(size / 2, size / 2, radius + 30, redMidAngle)
	const textAnchor = redOuter.x < size / 2 ? 'end' : 'start'

	const blueLabelPos = polarToCartesian(size / 2, size / 2, radius - 40, 45) // a bit inward

	return (
		<div className="flex flex-col items-center p-8">
			<div className="rounded-lg shadow-lg p-6">
				<div className="relative">
					<svg width={size + 200} height={size} className="transform">
						{/* Red Slice */}
						<path
							d={redPath}
							fill={data[0].color}
							strokeWidth="2"
							className="transition-all duration-300 hover:opacity-80"
						/>
						{/* Blue Slice */}
						<path
							d={bluePath}
							fill={data[1].color}
							strokeWidth="2"
							className="transition-all duration-300 hover:opacity-80"
						/>

						{/* Annotation Line for red */}
						<line
							x1={redEdge.x}
							y1={redEdge.y}
							x2={redOuter.x}
							y2={redOuter.y}
							stroke="#E02121"
							strokeWidth="2"
						/>
						<line
							x1={redOuter.x}
							y1={redOuter.y}
							x2={redOuter.x + (textAnchor === 'start' ? 40 : -40)}
							y2={redOuter.y}
							stroke="#E02121"
							strokeWidth="2"
						/>
						<text
							x={redOuter.x + (textAnchor === 'start' ? 45 : -45)}
							y={redOuter.y + 5}
							textAnchor={textAnchor}
							fill="white"
							fontSize="18"
							fontWeight="bold"
						>
							Only 0.1% Paid Creators
						</text>

						{/* Label over blue section */}
						<text
							x={blueLabelPos.x}
							y={blueLabelPos.y}
							textAnchor="middle"
							fill="white"
							fontSize="50"
							fontWeight="bold"
						>
							<tspan x={blueLabelPos.x} dy="-0.5em">5.3 Billion</tspan>
							<tspan x={blueLabelPos.x} dy="1.2em">Total Users</tspan>
						</text>
					</svg>
				</div>

				{/* Legend */}
				<div className="flex justify-center space-x-6 mt-6">
					{data.reverse().map((segment, index) => (
						<div key={index} className="flex items-center space-x-2">
							<div
								className="w-4 h-4 rounded-md"
								style={{ backgroundColor: segment.color }}
							></div>
							<span className="text-2xl font-medium text-white">
								{segment.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default PieChart

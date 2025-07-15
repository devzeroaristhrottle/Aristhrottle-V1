import React from 'react'

export const PercentageColumns = () => {
	// Sample data - you can modify these values
	const columnData = [
		{
			percentage: 4.5,
			label: 'Meta',
			iconUrl: '/docs/meta.png',
			text: "164.5 Billion"
		},
		{
			percentage: 55,
			label: 'Youtube',
			iconUrl: '/docs/youtube.png',
			text: "31.7 Billion"
		},
		{
			percentage: 8,
			label: 'Tik Tok',
			iconUrl: '/docs/tik_tok.png',
			text: "24 Billion"
		},
		{
			percentage: 14,
			label: 'SnapChat',
			iconUrl: '/docs/snapchat.png',
			text: "5.36 Billion"
		},
	]

	const data = [
		{ label: 'FY 2024 Total Revenue', color: '#1783FB' },
		{ label: 'Payout % to Creators', color: '#E02121' },
	]

	return (
		<div className="flex flex-col items-center p-8">
			<div className="relative">
				<div className="flex items-end space-x-8">
					{columnData.map((column, index) => (
						<div key={index} className="flex flex-col items-center relative">
							{/* Percentage tag at top */}
							<div className="mb-2">
								<span className="bg-white px-3 py-1 rounded-full text-4xl font-bold text-gray-800 shadow-sm">
									{column.text}
								</span>
							</div>

							{/* Column */}
							<div className="relative">
								{/* Background column (blue) */}
								<div
									className="w-16 h-[20rem] rounded-t-full bg-gradient-to-t from-[#0E4E95] to-[#1783FB]"
								></div>

								{/* Red portion representing percentage */}
								<div
									className="absolute bottom-0 w-16 transition-all duration-700 ease-out bg-gradient-to-t from-[#7A1212] to-[#E02121]"
									style={{
										height: `${(column.percentage / 100) * 256}px`,
									}}
								></div>

								{/* Logo/Icon overlapping at base */}
								<div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md z-10">
									<img src={column.iconUrl} className='h-11 w-11'/>
								</div>
							</div>
						</div>
					))}
				</div>
				<div
					className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full shadow-sm"
					style={{ top: '366px' }}
				></div>

				<div className="flex justify-center pt-10 space-x-6">
					{data.map((segment, index) => (
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

export default PercentageColumns

import { motion } from 'framer-motion'
import Image from 'next/image'

const ProgressBar = ({
	current,
	max,
}: {
	current: number
	max: number
}) => {
	const progressPercentage = (current / max) * 100
	const clampedProgressPercentage = Math.min(
		Math.max(progressPercentage, 1),
		99
	)

	return (
		<div className="p-2 w-full mt-4">
			<div className="relative w-full h-3 bg-gray-400 rounded-full border border-white border-l-0 border-r-0">
				<motion.div
					className="absolute top-0 left-0 h-full bg-[#2FCAC7] rounded-full"
					initial={{ width: 0 }}
					animate={{ width: `${progressPercentage}%` }}
					transition={{ duration: 0.8 }}
				/>

				{/* Current Value Indicator */}
				<div
					className="absolute -translate-x-1/2 text-white text-base"
					style={{ left: `${clampedProgressPercentage}%` , top: '-40px'}}
				>
					<div className="flex flex-col items-center justify-center">
						{current}
						<Image
							alt="aris-logo"
							className="cursor-pointer rotate-180 w-4 h-4"
							height={16}
							src={'/assets/aris-logo.svg'}
							width={16}
						/>
					</div>
				</div>
			</div>

			{/* Min and Max Value Labels */}
			<div className="relative w-full mt-1 text-white text-xs flex justify-between">
				<span>0</span>
				<span>{max}</span>
			</div>
		</div>
	)
}

export default ProgressBar

interface TabButtonProps {
	label: string
	isActive: boolean
	classname?: string
}

export const TabButton: React.FC<TabButtonProps & { onClick: () => void }> = ({
	label,
	isActive,
	classname,
	onClick,
}) => {
	return (
		<button
			onClick={onClick}
			className={`text-xl text-center md:text-2xl font-medium md:py-1 rounded-10px transition-all duration-300 flex items-center justify-center cursor-pointer ${
				label.includes('Live') && isActive
					? 'bg-[#29e0ca] text-black'
					: isActive
					? 'bg-white text-black'
					: 'bg-[#0d3159] text-white'
			}
        ${classname}`}
		>
			{label}&nbsp;
			{label.includes('Live') ? (
				<span className="relative flex h-3 w-3 items-center justify-center ml-1">
					<span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
					<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
				</span>
			) : null}
		</button>
	)
}

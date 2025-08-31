interface TabButtonProps {
	label: string
	isActive: boolean
	onClick: () => void
}

export const TabButton = ({ label, isActive, onClick }: TabButtonProps) => (
    <button
        onClick={onClick}
        className={`text-sm px-2 rounded-full transition-all duration-300 border border-[#2FCAC7] ${
            isActive ? 'bg-[#2FCAC7] text-black font-medium' : 'bg-black/30 text-white'
        }`}
    >
        {label}
    </button>
)
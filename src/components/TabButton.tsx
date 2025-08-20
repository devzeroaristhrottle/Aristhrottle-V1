interface TabButtonProps {
  label: string
  isActive: boolean
  isProfileTabs?: boolean
  classname?: string
}

export const TabButton: React.FC<TabButtonProps & { onClick: () => void }> = ({
  label,
  isActive,
  isProfileTabs,
  classname,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`text-xl text-center md:text-2xl font-medium md:py-1 rounded-10px transition-all duration-300 flex items-center justify-center cursor-pointer w-fit px-4 ${
        isProfileTabs
          ? isActive
            ? 'bg-[#29e0ca] border-[#29e0ca] border-2 text-black !rounded-full'
            : 'border-[#29e0ca] border-2 text-[#29e0ca] !rounded-full'
          : label.includes('Live') && isActive
          ? 'bg-[#29e0ca] text-black'
          : isActive
          ? 'bg-white text-black'
          : 'bg-[#0d3159] text-white'
      }
        ${classname}`}
    >
      {label}
      {label.includes('Live') ? (
        <span className='relative flex h-3 w-3 items-center justify-center ml-1'>
          <span>&nbsp;</span>
          <span className='absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping'></span>
          <span className='relative inline-flex h-2 w-2 rounded-full bg-red-600'></span>
        </span>
      ) : null}
    </button>
  )
}

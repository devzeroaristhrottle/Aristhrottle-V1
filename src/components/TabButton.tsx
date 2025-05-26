interface TabButtonProps {
  label: string;
  isActive: boolean;
  classname?: string;
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
        label.includes("Live") && isActive
          ? "bg-[#29e0ca] text-black"
          : isActive
          ? "bg-white text-black"
          : "bg-[#0d3159] text-white"
      }
        ${classname}`}
    >
      {label}&nbsp;
      {label.includes("Live") ? (
        <span className="bg-red-500 h-2 w-2 rounded-full inline-block animate-pulse cursor-pointer"></span>
      ) : null}
    </button>
  );
};

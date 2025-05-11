import Image from "next/image";

const PercentageSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const getLogoPosition = (val: number) => {
    if (val <= 1) return "1%";
    if (val >= 99) return "100%";
    return `${val}%`;
  };

  const logoPosition = getLogoPosition(value);
  return (
    <div className="mb-6 relative">
      <label className="text-[#1783fb] text-lg md:text-2xl block mb-2">
        Vote Share: <span className="text-white">{value}%</span>
      </label>

      {/* Slider Container */}
      <div className="relative h-6 md:h-8 mt-4">
        {/* Background Track (blue) */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-[#1783fb] rounded-lg -translate-y-1/2"></div>

        {/* Filled Track (green) */}
        <div
          className="absolute top-1/2 left-0 h-2 bg-[#29e0ca] rounded-lg -translate-y-1/2"
          style={{ width: `${value}%` }}
        ></div>

        {/* Native Range Input (hidden but interactive) */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-1/2 left-0 right-0 w-full h-4 opacity-0 -translate-y-1/2 cursor-pointer z-10"
        />

        {/* ARIS Logo Marker - Perfectly aligned version */}
        <div className="absolute top-0 w-full -mt-4">
          <div
            className="absolute -translate-x-1/2"
            style={{
              left: logoPosition,
              width: "32px",
              height: "32px",
            }}
          >
            <Image
              src="/assets/aris-logo.svg"
              alt="Percentage indicator"
              width={32}
              height={32}
              className="rotate-180 !h-6 !w-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercentageSlider;

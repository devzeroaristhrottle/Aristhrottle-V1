import { motion } from "framer-motion";
import Image from "next/image";

const ProgressBar = ({
  milestones,
  currentValue,
}: {
  milestones: number[];
  currentValue: number;
}) => {
  const maxMilestone = Math.max(...milestones);
  const progressPercentage = (currentValue / maxMilestone) * 100;
  const clampedProgressPercentage = Math.min(
    Math.max(progressPercentage, 1),
    99
  );

  return (
    <div className="p-4 pl-1 md:pl-0 pr-5 md:pr-10 w-full mt-10">
      <div className="relative w-full h-3 md:h-4 bg-gray-400 rounded-full border border-white border-l-0 border-r-0">
        <motion.div
          className="absolute top-0 left-0 h-full bg-[#29e0ca] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8 }}
        />

        {/* Dots */}
        {milestones.map((milestone, index) => {
          // Calculate the position for each milestone
          let leftPosition = (milestone / maxMilestone) * 100;

          // Clamp the position of the last milestone to ensure it stays within the bar
          if (index === milestones.length - 1) {
            leftPosition = Math.min(leftPosition, 99); // Ensure it doesn't go beyond 99%
          }

          return (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2 bg-[#29e0ca] w-4 h-4 md:h-5 rounded-lg border border-[#20988A]"
              style={{
                left: `${leftPosition}%`,
              }}
            />
          );
        })}

        {/* Current Value Indicator */}
        <div
          className="absolute top-[-51px] md:top-[-60px] -translate-x-1/2 text-white text-lg md:text-2xl"
          style={{ left: `${clampedProgressPercentage}%` }}
        >
          <div className="flex flex-col items-center justify-center">
            {currentValue}
            <Image
              alt="aris-logo"
              className="cursor-pointer rotate-180 w-5 h-5 md:w-6 md:h-6"
              height={24}
              src={"/assets/aris-logo.svg"}
              width={24}
            />
          </div>
        </div>
      </div>

      {/* Milestone Labels */}
      <div className="relative w-full md:mt-2 text-white !ml-2">
        {milestones.map((milestone, index) => {
          // Calculate the position for each milestone label
          let leftPosition = (milestone / maxMilestone) * 100;

          // Clamp the position of the last milestone label to ensure it stays within the bar
          if (index === milestones.length - 1) {
            leftPosition = Math.min(leftPosition, 99); // Ensure it doesn't go beyond 99%
          }

          return (
            <span
              key={index}
              className="absolute -translate-x-1/2 text-lg md:text-2xl"
              style={{
                left: `${leftPosition}%`,
              }}
            >
              {milestone}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;

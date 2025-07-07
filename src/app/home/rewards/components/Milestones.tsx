import { FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { MilestoneTitles } from "../constants";
import { useContext, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Context } from "@/context/contextProvider";
import { toast } from "react-toastify";

export const Milestones = ({
  tasks: milestones,
  hasBorder = true,
}: {
  tasks: MilestoneTitles[];
  hasBorder?: boolean;
}) => {
  const { userDetails, setUserDetails } = useContext(Context);
  const userId = userDetails?._id;
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [milestonesList, setMilestonesList] = useState(milestones);

  const handleClaim = async (
    type: string,
    milestone: number,
    index: number
  ) => {
    try {
      setIsClaimLoading(true);

      const response = await axiosInstance.post(`/api/claimreward`, {
        userId,
        type,
        milestone,
      }, {
        timeout: 5000
      });
      if (response.status == 200) {
        const updatedMilestones = [...milestones];
        updatedMilestones[index] = {
          ...updatedMilestones[index],
          canClaim: false,
          isClaimed: true,
        };
        setMilestonesList([...updatedMilestones]);
        toast.success("Reward claimed successfully!");
      }
    } catch (error) {
      console.error("Error claiming the reward", error);
      toast.error("Error claiming the reward");
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <div
      className={`mt-3 rounded-xl md:p-4 space-y-4 ${
        hasBorder
          ? "bg-[#040f2b] border-2 border-[#1783FB] w-full md:w-2/3"
          : "w-full"
      }`}
    >
      {milestonesList.sort((a, b) => a.reward - b.reward).map((milestone, index) => (
        <div
          key={index}
          className="flex items-center gap-2 md:gap-3 justify-between"
        >
          {/* Status Icon */}
          <div className="flex items-center justify-start md:justify-center shrink-0">
            {milestone.isClaimed || milestone.canClaim ? (
              <FaCheckCircle className="text-[#1783FB]" size={24} />
            ) : (
              <FaRegCircle className="text-[#1783FB]" size={24} />
            )}
          </div>

          {/* Title & Reward */}
          <div className="flex-1 border-2 border-[#0d4387] rounded-lg px-2 md:px-3 py-1 md:py-2 flex items-center justify-between gap-x-3 md:gap-x-2">
            <p className="text-base md:text-2xl lg:text-3xl leading-none md:leading-normal">
              {milestone.title}
            </p>
            <p className="text-base md:text-2xl lg:text-3xl whitespace-nowrap">
              {milestone.reward} $eART
            </p>
          </div>

          {/* Claim Button or Placeholder */}
          <div className="flex items-center justify-center">
            {milestone.canClaim ? (
              <button
                className="relative px-3 md:px-4 md:py-1 bg-[#040f2b] border-2 border-[#0d4387] rounded-lg text-lg md:text-3xl bg-[linear-gradient(180deg,#050D28_0%,#0F345C_100%)]"
                onClick={() =>{
                  handleClaim(milestone.type, milestone.number, index)
                  if(userDetails && !isClaimLoading) setUserDetails({...userDetails, mintedCoins: BigInt(userDetails.mintedCoins) + BigInt(milestone.reward * 1e18) })
                }}
                disabled={isClaimLoading}
              >
                {isClaimLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  "Claim"
                )}
              </button>
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

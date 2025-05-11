import React, { useContext, useEffect, useState } from "react";
import { Milestones } from "./Milestones";
import {
  getMilestoneKeys,
  getMilestoneTitles,
  Milestone,
  MilestoneTitles,
  referralRewards,
} from "../constants";
import { Context } from "@/context/contextProvider";
import { PiShare } from "react-icons/pi";
import { toast } from "react-toastify";
import axiosInstance from "@/utils/axiosInstance";
import ProgressBar from "./ProgressBar";
import { BiDownArrowAlt } from "react-icons/bi";
import Loader from "@/components/Loader";

export type ReferralResponse = {
  totalReferralCount: number;
  milestoneDetails: Milestone[];
  points: number;
};

const Referrals = () => {
  const { userDetails } = useContext(Context);
  const [referrals, setReferrals] = useState<ReferralResponse>();
  const [referralMilestones, setReferralMilestones] = useState<
    MilestoneTitles[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  const userId = userDetails?._id;

  const handleCopy = () => {
    if (userDetails?.refer_code) {
      navigator.clipboard.writeText(userDetails.refer_code);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const handleReferralClaim = async () => {
    try {
      setIsClaimLoading(true);

      const response = await axiosInstance.post(`/api/claimreferralreward`, {
        userId,
      });
      if (response.status == 200) {
        toast.success("Reward claimed successfully!");
      }
    } catch (error) {
      console.error("Error claiming the reward", error);
      toast.error("Error claiming the reward");
    } finally {
      setIsClaimLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const getReferralData = async () => {
      try {
        setIsLoading(true);
        const referralsResponse = await axiosInstance.get(
          `/api/rewards/referrals?userId=${userId}`
        );
        if (referralsResponse.data) {
          setReferrals(referralsResponse.data);
          const milestones = getMilestoneTitles(
            referralsResponse.data.milestoneDetails,
            "referrals"
          );
          setReferralMilestones(milestones);
        }
      } catch (error) {
        console.error("Error fetching referrals", error);
      } finally {
        setIsLoading(false);
      }
    };

    getReferralData();
  }, [userId, userDetails, isClaimLoading]);

  if (!userDetails?._id) {
    return (
      <div className="flex text-2xl items-center justify-center">
        Please login
      </div>
    );
  } else if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="grid h-full md:grid-cols-3 grid-cols-1 gap-y-6 md:gap-y-0 flex-col-reverse">
      <div className="total_milestones_wrapper md:col-span-2 col-span-1 md:order-1 order-2">
        <div className="total_referral flex flex-col gap-4 md:p-5">
          <h2 className="text-2xl md:text-4xl">Total Referrals</h2>
          <ProgressBar
            milestones={getMilestoneKeys(referralRewards)}
            currentValue={referrals?.totalReferralCount ?? 0}
          />
        </div>
        <div className="milestones mt-8 md:mt-6 md:pr-10 flex flex-col">
          <h2 className="text-2xl md:text-4xl md:pl-5">Milestones</h2>
          <Milestones hasBorder={false} tasks={referralMilestones} />
        </div>
      </div>
      <div className="points_rules_wrapper flex flex-col gap-y-8 md:gap-y-6 md:mt-8 md:order-2 order-1">
        <div className="flex gap-x-4 justify-between md:block mt-8">
          <div className="points w-1/2 md:w-full flex flex-col gap-2 md:gap-5 items-center border-2 border-[#1783FB] rounded-lg p-2 md:p-5 md:mt-10">
            <span className="text-2xl md:text-4xl">Points</span>
            <h2 className="text-[#29e0ca] text-3xl md:text-4xl">
              {referrals?.points === 0 ? 0 : referrals?.points.toFixed(1) ?? 0}{" "}
              $eART
            </h2>

            {referrals?.points && referrals.points > 0 ? (
              <button
                className="bg-[#040f2b] border-2 border-[#1783FB] rounded-lg text-xl md:text-3xl px-4 md:px-8 md:py-1 hover:bg-blue-500/20 bg-[linear-gradient(180deg,#050D28_0%,#0F345C_100%)]"
                onClick={() => handleReferralClaim()}
                disabled={isClaimLoading}
              >
                {isClaimLoading ? (
                  <div className="h-5 w-5 py-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Claim"
                )}
              </button>
            ) : null}
          </div>

          {userDetails && userDetails?.refer_code && (
            <div className="referral_code w-1/2 md:w-full flex flex-col gap-2 md:gap-3 items-center justify-center border-2 border-[#1783FB] rounded-lg p-2 md:p-5 md:mt-6">
              <h4 className="text-2xl md:text-4xl">Referral Code</h4>
              <div className="flex flex-col gap-2 items-center">
                <span className="text-[#29e0ca] text-3xl md:text-4xl">
                  {userDetails?.refer_code}
                </span>
                <button onClick={() => handleCopy()}>
                  <PiShare className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="rules flex flex-col md:gap-3 items-center justify-center border-2 border-[#1783FB] rounded-lg p-3 md:p-5 mx-8 md:mx-0">
          <h4 className="text-2xl md:text-4xl">Rules</h4>
          <p className="text-2xl md:text-3xl">1 Referral</p>
          <BiDownArrowAlt className="w-8 h-8 md:w-12 md:h-12" />
          <span className="text-[#29e0ca] text-3xl md:text-4xl">5 $eART</span>
          <p className="text-xl md:text-3xl">to Both Users</p>
          <span className="text-[#1783FB] text-lg md:text-2xl text-center leading-none md:leading-normal">
            *$eART Points are rewarded only after both users have voted or
            uploaded at least once.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Referrals;

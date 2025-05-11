import Milestone from "@/models/Milestone";
import Referrals from "@/models/Referrals";

const referralRewards = {
    1: 5,
    10: 25,
    25: 75,
    50: 150,
    100: 300,
    250: 1000,
    500: 2000,
  };
  
  export async function milestoneReward(code: string, userId: string) {
    const totalReferralsCount = await Referrals.find({
      refer_by: code,
    }).countDocuments();
  
    if (
      totalReferralsCount == 1 ||
      totalReferralsCount == 10 ||
      totalReferralsCount == 25 ||
      totalReferralsCount == 50 ||
      totalReferralsCount == 100 ||
      totalReferralsCount == 250 ||
      totalReferralsCount == 500
    ) {
      const found = await Milestone.findOne({
        created_by: userId,
        milestone: totalReferralsCount,
        type: "referral",
      });
      if (found == null) {
        const milestone = new Milestone({
          milestone: totalReferralsCount,
          reward: referralRewards[totalReferralsCount],
          is_claimed: false,
          created_by: userId,
          type: "referral",
        });
        await milestone.save();
      }
    }
  }
import Referrals from "@/models/Referrals";
import { processActivityMilestones } from "@/utils/milestoneUtils";

export async function milestoneReward(code: string, userId: string) {
  await processActivityMilestones(
    userId,
    'referral',
    Referrals,
    { refer_by: code }
  );
}
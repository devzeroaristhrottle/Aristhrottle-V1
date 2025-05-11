import User from "@/models/User";
import Referrals from "@/models/Referrals";
import { milestoneReward } from "@/app/api/user/milestoneRewardUtils";

// Generate a random alphanumeric referral code (length: 6)
const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate a unique referral code
const generateUniqueReferralCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = generateReferralCode();
    const existingUser = await User.findOne({ refer_code: code });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return code;
};

/**
 * Checks if a user is eligible for a referral code (has voted or uploaded at least once)
 * and generates one if needed. Also processes any pending referrals.
 * 
 * @param userId The MongoDB ID of the user
 * @returns The user's referral code (new or existing)
 */
export const generateReferralCodeIfEligible = async (userId: string) => {
  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if user already has a referral code
  if (user.refer_code) {
    return user.refer_code;
  }

  // Generate a new referral code
  const referralCode = await generateUniqueReferralCode();
  
  // Update the user with the new referral code
  user.refer_code = referralCode;
  await user.save();

  // Check if this user was referred by someone else
  if (user.referred_by) {
    const referrerCode = user.referred_by;
    
    // Find the referrer
    const referrer = await User.findOne({ refer_code: referrerCode });
    
    if (referrer) {
      // Create the referral record
      const referral = new Referrals({
        is_claimed: false,
        refer_by: referrerCode,
        refer_to: referralCode,
      });
      
      await referral.save();
      
      // Update milestone for the referrer
      if (typeof milestoneReward === 'function') {
        await milestoneReward(referrerCode, referrer._id.toString());
      }
    }
  }

  return referralCode;
}; 
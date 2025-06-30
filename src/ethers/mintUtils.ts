import { getContractUtils } from "./contractUtils";
import { ethers } from "ethers";
import MintLog from "@/models/MintLog";
import connectToDatabase from "@/lib/db";

/**
 * Mints tokens to a recipient and logs the transaction
 * @param recipient Wallet address to receive tokens
 * @param amount Amount of tokens (in decimal form, e.g. 0.1, 5, etc.)
 * @param reason Reason for minting (vote_reward, upload_reward, etc.)
 * @param details Additional context about the transaction (optional)
 * @returns The transaction receipt and created log
 */
export async function mintTokensAndLog(
  recipient: string,
  amount: number,
  reason: "vote_reward" | "upload_reward" | "milestone_reward" | "vote_received" | "referral_reward" | "other",
  details: any = {}
): Promise<{ success: boolean; transactionHash?: string; log: any; error?: string }> {
  
  await connectToDatabase();
  const { contract } = getContractUtils();
  
  // Convert amount to token units
  const tokenAmount = ethers.parseUnits(amount.toString(), 18);
  
  // Create initial log entry
  const mintLog = new MintLog({
    recipient,
    amount,
    tokenAmount: tokenAmount.toString(),
    status: "pending",
    reason,
    details
  });
  
  // Save initial pending log
  await mintLog.save();
  
  try {
    // Execute the transaction
    const tx = await contract.mintCoins(recipient, tokenAmount);
    
    // Update log with transaction hash
    mintLog.transactionHash = tx.hash;
    await mintLog.save();
    
    // Wait for the transaction to complete
    await tx.wait();
    
    // Update log with success status
    mintLog.status = "success"; // hehe
    await mintLog.save();
    
    console.log(`Successfully minted ${amount} tokens to ${recipient} for ${reason}. TX: ${tx.hash}`);
    
    return { 
      success: true,
      transactionHash: tx.hash,
      log: mintLog
    };
  } catch (error) {
    console.error(`Error minting tokens to ${recipient}:`, error);
    
    // Update log with error information
    mintLog.status = "failed";
    mintLog.error = error instanceof Error ? error.message : String(error);
    await mintLog.save();
    
    return {
      success: false,
      log: mintLog,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 
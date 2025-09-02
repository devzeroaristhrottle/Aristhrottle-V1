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
  const { contract, wallet } = getContractUtils();
  
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
    // Get current gas price and increase it by 20% to avoid "replacement fee too low" errors
    let gasPrice;
    if (wallet.provider) {
      const feeData = await wallet.provider.getFeeData();
      if (feeData.gasPrice) {
        gasPrice = BigInt(Math.floor(Number(feeData.gasPrice) * 1.2));
      }
    }
    
    // Get current nonce for the wallet to avoid "nonce has already been used" errors
    const nonce = await wallet.getNonce();
    
    // Transaction options with gas settings
    const txOptions = {
      gasLimit: 300000, // Set appropriate gas limit
      gasPrice,
      nonce
    };
    
    // Execute the transaction with options
    const tx = await contract.mint(recipient, tokenAmount, txOptions);
    
    // Update log with transaction hash
    mintLog.transactionHash = tx.hash;
    await mintLog.save();
    
    // Wait for the transaction to complete with increased timeout
    await tx.wait(2); // Wait for 2 confirmations
    
    // Update log with success status
    mintLog.status = "success";
    await mintLog.save();
    
    console.log(`Successfully minted ${amount} tokens to ${recipient} for ${reason}. TX: ${tx.hash}`);
    
    return { 
      success: true,
      transactionHash: tx.hash,
      log: mintLog
    };
  } catch (error) {
    console.error(`Error minting tokens to ${recipient}:`, error);
    
    // Handle specific blockchain errors
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // Add retry logic for certain errors
    if (error instanceof Error && 
        (error.message.includes("replacement fee too low") || 
         error.message.includes("nonce has already been used") ||
         error.message.includes("already known"))) {
      
      try {
        console.log(`Retrying transaction to ${recipient} with higher gas...`);
        
        // Get fresh nonce and higher gas price for retry
        const newNonce = await wallet.getNonce();
        
        // Safely get gas price with null checks
        let gasPrice;
        if (wallet.provider) {
          const feeData = await wallet.provider.getFeeData();
          if (feeData.gasPrice) {
            gasPrice = BigInt(Math.floor(Number(feeData.gasPrice) * 1.5));
          }
        }
        
        // Retry with higher gas and fresh nonce
        const tx = await contract.mint(recipient, tokenAmount, {
          gasLimit: 350000,
          gasPrice,
          nonce: newNonce
        });
        
        // Update log with new transaction hash
        mintLog.transactionHash = tx.hash;
        await mintLog.save();
        
        // Wait for the transaction to complete
        await tx.wait(2);
        
        // Update log with success status
        mintLog.status = "success";
        await mintLog.save();
        
        console.log(`Successfully minted ${amount} tokens to ${recipient} for ${reason} after retry. TX: ${tx.hash}`);
        
        return { 
          success: true,
          transactionHash: tx.hash,
          log: mintLog
        };
      } catch (retryError) {
        errorMessage = `Initial error: ${errorMessage}. Retry failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
      }
    }
    
    // Update log with error information
    mintLog.status = "failed";
    mintLog.error = errorMessage;
    await mintLog.save();
    
    return {
      success: false,
      log: mintLog,
      error: errorMessage
    };
  }
} 
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import MintLog from "@/models/MintLog";
import { getContractUtils } from "@/ethers/contractUtils";

/**
 * Retries a failed mint transaction
 */
async function retryFailedMint(mintLog: any) {
  try {
    const { contract, wallet } = getContractUtils();
    const tokenAmount = mintLog.tokenAmount; // Already stored as string in the correct format
    
    // Get fresh nonce and higher gas price for retry
    const nonce = await wallet.getNonce();
    
    // Safely get gas price with null checks
    let gasPrice;
    if (wallet.provider) {
      const feeData = await wallet.provider.getFeeData();
      if (feeData.gasPrice) {
        // Just use the current network gas price without increase
        gasPrice = feeData.gasPrice;
      }
    }
    
    // Retry with higher gas and fresh nonce
    const tx = await contract.mint(mintLog.recipient, tokenAmount, {
      gasLimit: 300000,
      gasPrice,
      nonce
    });
    
    // Update log with new transaction hash
    mintLog.transactionHash = tx.hash;
    mintLog.status = "pending"; // Reset to pending
    mintLog.error = null; // Clear previous error
    await mintLog.save();
    
    // Wait for the transaction to complete
    const receipt = await tx.wait(2);
    
    // Update log with success status
    mintLog.status = "success";
    await mintLog.save();
    
    console.log(`Successfully retried mint ${mintLog.amount} tokens to ${mintLog.recipient}. TX: ${tx.hash}`);
    return { success: true, tx: receipt };
  } catch (error) {
    console.error(`Error retrying mint to ${mintLog.recipient}:`, error);
    
    // Update log with error information
    mintLog.error = error instanceof Error ? error.message : String(error);
    await mintLog.save();
    
    return { success: false, error };
  }
}

/**
 * Checks the status of a pending transaction on the blockchain
 */
async function checkPendingTransaction(mintLog: any) {
  try {
    const { wallet } = getContractUtils();
    
    if (!mintLog.transactionHash) {
      console.log(`No transaction hash found for pending mint ${mintLog._id}, marking as failed`);
      mintLog.status = "failed";
      mintLog.error = "No transaction hash found for pending mint";
      await mintLog.save();
      return { success: false, shouldRetry: true };
    }
    
    // Get transaction receipt from blockchain
    const receipt = await wallet.provider?.getTransactionReceipt(mintLog.transactionHash);
    
    if (!wallet.provider) {
      console.log(`No provider available to check transaction ${mintLog.transactionHash}`);
      mintLog.error = "No provider available to check transaction";
      await mintLog.save();
      return { success: false, shouldRetry: false };
    }
    
    // If no receipt found, transaction is still pending
    if (!receipt) {
      console.log(`Transaction ${mintLog.transactionHash} is still pending on the blockchain`);
      
      // Check how old the transaction is
      const now = new Date();
      const txTime = new Date(mintLog.updatedAt);
      const hoursSinceTx = (now.getTime() - txTime.getTime()) / (1000 * 60 * 60);
      
      // If more than 1 hour old, consider it stalled and retry
      if (hoursSinceTx > 1) {
        console.log(`Transaction ${mintLog.transactionHash} is stalled (${hoursSinceTx.toFixed(1)} hours old), marking for retry`);
        mintLog.status = "failed";
        mintLog.error = "Transaction stalled on the blockchain";
        await mintLog.save();
        return { success: false, shouldRetry: true };
      }
      
      return { success: true, status: "still-pending" };
    }
    
    // Transaction was found, update status based on receipt
    if (receipt.status === 1) {
      console.log(`Transaction ${mintLog.transactionHash} confirmed successfully`);
      mintLog.status = "success";
      await mintLog.save();
      return { success: true, status: "confirmed" };
    } else {
      console.log(`Transaction ${mintLog.transactionHash} failed on the blockchain`);
      mintLog.status = "failed";
      mintLog.error = "Transaction reverted on the blockchain";
      await mintLog.save();
      return { success: false, shouldRetry: true };
    }
  } catch (error) {
    console.error(`Error checking transaction ${mintLog.transactionHash}:`, error);
    return { success: false, error };
  }
}

/**
 * Processes minting operations asynchronously
 */
async function processMintingAsync() {
  try {
    await connectToDatabase();
    
    // Get all failed and pending transactions
    const failedLogs = await MintLog.find({ status: "failed" });
    const pendingLogs = await MintLog.find({ status: "pending" });
    
    console.log(`Found ${failedLogs.length} failed and ${pendingLogs.length} pending transactions to check`);
    
    const results = {
      failed: { total: failedLogs.length, retried: 0, success: 0 },
      pending: { total: pendingLogs.length, checked: 0, confirmed: 0, retriable: 0 }
    };
    
    // Process failed transactions
    for (const log of failedLogs) {
      results.failed.retried++;
      const result = await retryFailedMint(log);
      if (result.success) {
        results.failed.success++;
      }
    }
    
    // Process pending transactions
    for (const log of pendingLogs) {
      results.pending.checked++;
      const result = await checkPendingTransaction(log);
      
      // If transaction confirmed successfully
      if (result.success && result.status === "confirmed") {
        results.pending.confirmed++;
      }
      
      // If transaction needs retry (failed or stalled)
      if (result.success === false && result.shouldRetry) {
        results.pending.retriable++;
        const retryResult = await retryFailedMint(log);
        if (retryResult.success) {
          results.failed.success++;
        }
      }
    }
    
    console.log(`Mint processing completed:`, results);
  } catch (error) {
    console.error("Error in async mint processing:", error);
  }
}

export async function POST() {
  try {
    // Start the processing asynchronously without waiting
    processMintingAsync().catch(error => {
      console.error("Async minting process failed:", error);
    });
    
    // Return immediately with 200 OK
    return NextResponse.json({ 
      success: true,
      message: "Mint processing started in background"
    }, { status: 200 });
  } catch (error) {
    console.error("Error starting mint check cronjob:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
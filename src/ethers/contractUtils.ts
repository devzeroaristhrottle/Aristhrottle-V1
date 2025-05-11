import { ethers } from "ethers";
import { EArtTokenABI } from "./contractAbi";

// Get environment variables
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// Set up provider and signer
const provider = new ethers.JsonRpcProvider(rpcUrl);
export const wallet = new ethers.Wallet(privateKey!, provider);
export const contract = new ethers.Contract(contractAddress!, EArtTokenABI, wallet);

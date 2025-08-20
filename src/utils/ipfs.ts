// utils/ipfs.ts
import pinataSDK from "@pinata/sdk";
import { Readable } from "stream";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT! });

export async function uploadToIPFS(
  buffer: Buffer,
  filename: string
): Promise<{ cid: string; gatewayUrl: string; provider: "pinata" }> {
  const stream = Readable.from(buffer);

  const options = {
    pinataMetadata: { name: filename },
    pinataOptions: { cidVersion: 1 },
  } as const;

  const res = await pinata.pinFileToIPFS(stream, options)
  const cid = res.IpfsHash; // CIDv1 when cidVersion:1
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

  return { cid, gatewayUrl, provider: "pinata" };
}
